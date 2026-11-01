// Verifies the paginated timeline: ordering, cursors, hydration, privacy and query cost.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const Post = require("../src/Database/Models/Post");
const User = require("../src/Database/Models/User");
const Retweet = require("../src/Database/Models/Retweet");
const Quote = require("../src/Database/Models/Quote");
const QuoteRetweet = require("../src/Database/Models/QuoteRetweet");
const { startApp, stopApp, clearDb, get, countQueries } = require("./helpers");

const at = (minute) => new Date(Date.UTC(2023, 0, 1, 0, minute));

const createUser = (username) =>
  User.create({
    username,
    name: username,
    email: `${username}@test.io`,
    hashedPassword: "secret-hash",
    profileImage: "https://res.cloudinary.com/x/a.png",
  });

const createPost = (user, minute, body = `post ${minute}`) =>
  Post.create({
    body,
    userId: user._id,
    user: user._id,
    createdAt: at(minute),
  });

const pageUrl = (limit, last) =>
  `/posts?limit=${limit}&before=${last.createdAt}&beforeId=${last._id}`;

// Walks every page through the cursor, as the frontend's infinite scroll does
const readAllPages = async (limit) => {
  let page = (await get(`/posts?limit=${limit}`)).body;
  const items = [...page];
  while (page.length === limit) {
    page = (await get(pageUrl(limit, page[page.length - 1]))).body;
    items.push(...page);
  }
  return items;
};

// Seeds one item of each feed type: post(1), retweet(2), quote(3), quote retweet(4)
const seedAllTypes = async () => {
  const author = await createUser("author");
  const fan = await createUser("fan");
  const post = await createPost(author, 1);
  await Retweet.create({
    postId: post._id,
    userRetweet: fan._id,
    createdAt: at(2),
  });
  const quote = await Quote.create({
    postId: post._id,
    userQuote: fan._id,
    body: "quoted",
    createdAt: at(3),
  });
  await QuoteRetweet.create({
    quoteId: quote._id,
    quoteIdDelete: String(quote._id),
    userQuoteRetweet: author._id,
    createdAt: at(4),
  });
  return { author, fan, post, quote };
};

before(startApp);
after(stopApp);
beforeEach(clearDb);

// The feed must mix all four collections by date, or tweets appear out of order
test("feed merges all item types newest first", async () => {
  await seedAllTypes();
  const { body } = await get("/posts");
  const dates = body.map((item) => item.createdAt);
  const expected = [at(4), at(3), at(2), at(1)].map((d) => d.toISOString());
  assert.deepEqual(dates, expected);
});

// Components read nested authors directly, so a missing level crashes rendering
test("feed hydrates the nested authors each item type renders", async () => {
  const { author, fan } = await seedAllTypes();
  const [quoteRetweet, quote, retweet, post] = (await get("/posts")).body;

  assert.equal(post.user.username, author.username);
  assert.equal(retweet.userRetweet.username, fan.username);
  assert.equal(retweet.postId.user.username, author.username);
  assert.equal(quote.userQuote.username, fan.username);
  assert.equal(quote.postId.user.username, author.username);
  assert.equal(quoteRetweet.userQuoteRetweet.username, author.username);
  assert.equal(quoteRetweet.quoteId.userQuote.username, fan.username);
  assert.equal(quoteRetweet.quoteId.postId.user.username, author.username);
});

// Regression: the public feed used to ship every author's password hash and email
test("feed never exposes credentials or emails", async () => {
  await seedAllTypes();
  const json = JSON.stringify((await get("/posts")).body);
  assert.ok(!json.includes("hashedPassword"));
  assert.ok(!json.includes("secret-hash"));
  assert.ok(!json.includes("@test.io"));
});

// Likes and counters drive isLiked and the numbers shown under each tweet
test("feed keeps like, comment and retweet data the UI counts", async () => {
  const user = await createUser("author");
  await Post.create({
    userId: user._id,
    user: user._id,
    likeIds: [{ userId: user._id }],
    retweets: [user._id],
  });
  const [post] = (await get("/posts")).body;
  assert.equal(post.likeIds[0].userId, String(user._id));
  assert.deepEqual(post.retweets, [String(user._id)]);
  assert.deepEqual(post.comments, []);
});

// Without a limit the feed grows with the whole database
test("feed defaults to 20 items and caps oversized limits at 100", async () => {
  const user = await createUser("author");
  await Promise.all(Array.from({ length: 105 }, (_, i) => createPost(user, i)));
  assert.equal((await get("/posts")).body.length, 20);
  assert.equal((await get("/posts?limit=1000")).body.length, 100);
});

// A timestamp-only cursor would skip or repeat tweets sharing a createdAt
test("pagination has no gaps or repeats when dates tie across collections", async () => {
  const user = await createUser("author");
  const posts = await Promise.all(
    Array.from({ length: 7 }, (_, i) => createPost(user, 5, `tie ${i}`))
  );
  const postId = posts[0]._id;
  await Retweet.create({ postId, userRetweet: user._id, createdAt: at(5) });
  await Quote.create({ postId, userQuote: user._id, createdAt: at(5) });

  const ids = (await readAllPages(3)).map((item) => item._id);
  assert.equal(ids.length, 9);
  assert.equal(new Set(ids).size, 9);
});

// New tweets arriving mid-scroll must not shift or duplicate older pages
test("a tweet created between pages does not alter the next page", async () => {
  const user = await createUser("author");
  for (const minute of [1, 2, 3, 4]) await createPost(user, minute);

  const first = (await get("/posts?limit=2")).body;
  await createPost(user, 10);
  const second = (await get(pageUrl(2, first[1]))).body;

  assert.deepEqual(
    second.map((post) => post.body),
    ["post 2", "post 1"]
  );
});

// Profiles must only list activity from that user, in any of the four types
test("userId filter returns only that user's items", async () => {
  const { author, fan } = await seedAllTypes();
  const own = (await get(`/posts?userId=${fan._id}`)).body;
  assert.equal(own.length, 2);
  assert.ok(own.every((item) => item.userRetweet || item.userQuote));

  const authored = (await get(`/posts?userId=${author._id}`)).body;
  assert.equal(authored.length, 2);
});

// PostFeed renders the "no tweets" message from this literal response
test("empty first page keeps the 'No Posts available' contract", async () => {
  assert.equal((await get("/posts")).body, "No Posts available");
});

// Regression: an unknown userId left the request hanging with no response
test("unknown user gets the empty response instead of hanging", async () => {
  const { body, status } = await get("/posts?userId=64f000000000000000000000");
  assert.equal(status, 200);
  assert.equal(body, "No Posts available");
});

// The end of the feed must be an empty list, not the first-page message
test("a page past the end is an empty array", async () => {
  const user = await createUser("author");
  const post = await createPost(user, 1);
  const last = { createdAt: at(1).toISOString(), _id: post._id };
  assert.deepEqual((await get(pageUrl(5, last))).body, []);
});

// Bad cursors must fail clearly rather than silently restart the feed
test("invalid pagination params are rejected", async () => {
  const queries = ["limit=0", "limit=abc", "before=x&beforeId=y", "before=2023"];
  for (const query of queries) {
    assert.equal((await get(`/posts?${query}`)).status, 400, query);
  }
});

// A quote can outlive its post; the item must survive with a null reference
test("items whose original post was deleted resolve to null", async () => {
  const { post } = await seedAllTypes();
  await Post.deleteOne({ _id: post._id });
  const quote = (await get("/posts")).body.find((item) => item.userQuote);
  assert.equal(quote.postId, null);
});

// Regression: the old flow ran 18 sequential queries for any feed
test("feed cost stays bounded as the page grows", async () => {
  const { author } = await seedAllTypes();
  await Promise.all(
    Array.from({ length: 30 }, (_, i) => createPost(author, 10 + i))
  );
  const queries = await countQueries(() => get("/posts?limit=33"));
  assert.ok(queries <= 7, `expected at most 7 queries, got ${queries}`);
});

// Without the compound index every page re-sorts the whole collection in memory
test("feed queries use an index instead of a blocking sort", async () => {
  const user = await createUser("author");
  await createPost(user, 1);
  const sort = { createdAt: -1, _id: -1 };
  const queries = [
    Post.find().sort(sort).limit(20),
    Post.find({ userId: user._id }).sort(sort).limit(20),
  ];
  for (const query of queries) {
    const plan = await query.explain("queryPlanner");
    const stages = JSON.stringify(plan.queryPlanner.winningPlan);
    assert.ok(stages.includes("IXSCAN"), stages);
    assert.ok(!stages.includes('"SORT"'), stages);
  }
});
