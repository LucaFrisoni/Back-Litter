// Builds the timeline: a cursor-paginated merge of tweets, retweets, quotes and quote retweets.
const mongoose = require("mongoose");
const Post = require("../../Database/Models/Post");
const User = require("../../Database/Models/User");
const Retweet = require("../../Database/Models/Retweet");
const Quote = require("../../Database/Models/Quote");
const QuoteRetweet = require("../../Database/Models/QuoteRetweet");
const { PUBLIC_USER_FIELDS } = require("../../Database/publicFields");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const POST_FIELDS = "body user userId likeIds.userId comments retweets createdAt";
const QUOTE_FIELDS =
  "body postId postIdDelete userQuote likeIds.userId comments retweets createdAt";

const FEED_SOURCES = [
  { model: Post, owner: "userId", fields: POST_FIELDS },
  {
    model: Retweet,
    owner: "userRetweet",
    fields: "postId postIdDelete userRetweet createdAt",
  },
  { model: Quote, owner: "userQuote", fields: QUOTE_FIELDS },
  {
    model: QuoteRetweet,
    owner: "userQuoteRetweet",
    fields: "quoteId quoteIdDelete userQuoteRetweet createdAt",
  },
];

const USER_REFS = ["user", "userRetweet", "userQuote", "userQuoteRetweet"];

// Devuelve null si los parametros de paginacion son invalidos
const parseFeedOptions = ({ limit, before, beforeId, userId }) => {
  const parsedLimit = limit === undefined ? DEFAULT_LIMIT : Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) return null;
  if (userId !== undefined && !mongoose.isValidObjectId(userId)) return null;

  const options = { limit: Math.min(parsedLimit, MAX_LIMIT), userId };
  if (before === undefined && beforeId === undefined) return options;

  const date = new Date(before);
  if (isNaN(date) || !mongoose.isValidObjectId(beforeId)) return null;
  return { ...options, cursor: { date, id: beforeId } };
};

const buildFilter = (owner, { userId, cursor }) => {
  const filter = userId ? { [owner]: userId } : {};
  if (!cursor) return filter;
  // createdAt puede repetirse, por eso el _id desempata el cursor
  return {
    ...filter,
    createdAt: { $lte: cursor.date },
    $or: [{ createdAt: { $lt: cursor.date } }, { _id: { $lt: cursor.id } }],
  };
};

const newestFirst = (a, b) =>
  b.createdAt - a.createdAt || String(b._id).localeCompare(String(a._id));

// Cada coleccion aporta hasta "limit" items: la pagina final sale del merge
const fetchFeedPage = async (options) => {
  const lists = await Promise.all(
    FEED_SOURCES.map(({ model, owner, fields }) =>
      model
        .find(buildFilter(owner, options))
        .select(fields)
        .sort({ createdAt: -1, _id: -1 })
        .limit(options.limit)
        .lean()
    )
  );
  return lists.flat().sort(newestFirst).slice(0, options.limit);
};

const uniqueIds = (values) => [...new Set(values.filter(Boolean).map(String))];

const findByIds = async (model, ids, fields) => {
  if (ids.length === 0) return new Map();
  const docs = await model.find({ _id: { $in: ids } }).select(fields).lean();
  return new Map(docs.map((doc) => [String(doc._id), doc]));
};

const userRefsOf = (doc) => USER_REFS.map((ref) => doc[ref]);

const linkUsers = (doc, usersById) => {
  USER_REFS.filter((ref) => doc[ref]).forEach((ref) => {
    doc[ref] = usersById.get(String(doc[ref])) || null;
  });
};

const linkRef = (doc, ref, docsById) => {
  if (doc[ref]) doc[ref] = docsById.get(String(doc[ref])) || null;
};

// Resuelve todas las referencias de la pagina con una consulta $in por coleccion
const hydrateFeed = async (items) => {
  const quoteIds = uniqueIds(items.map((item) => item.quoteId));
  const quotesById = await findByIds(Quote, quoteIds, QUOTE_FIELDS);
  const quotes = [...quotesById.values()];

  const postIds = uniqueIds([...items, ...quotes].map((doc) => doc.postId));
  const postsById = await findByIds(Post, postIds, POST_FIELDS);
  const posts = [...postsById.values()];

  const docs = [...items, ...quotes, ...posts];
  const userIds = uniqueIds(docs.flatMap(userRefsOf));
  const usersById = await findByIds(User, userIds, PUBLIC_USER_FIELDS);

  docs.forEach((doc) => linkUsers(doc, usersById));
  [...items, ...quotes].forEach((doc) => linkRef(doc, "postId", postsById));
  items.forEach((item) => linkRef(item, "quoteId", quotesById));
  return items;
};

const getFeed = async (options) => hydrateFeed(await fetchFeedPage(options));

module.exports = { parseFeedOptions, getFeed };
