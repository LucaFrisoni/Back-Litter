const Post = require("../../Database/Models/Post");
const User = require("../../Database/Models/User");
const Retweet = require("../../Database/Models/Retweet");
const Quote = require("../../Database/Models/Quote");
const Comment = require("../../Database/Models/Comments");
const { PUBLIC_USER_FIELDS } = require("../../Database/publicFields");
const { parseFeedOptions, getFeed } = require("./feedService");

const tweetPost = async (req, res) => {
  try {
    const { body } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const post = new Post({
      body,
      userId: user._id,
      user: user._id, // Ajusta cómo se almacena el ID del usuario en tu modelo
    });

    await post.save();

    user.posts.push(post._id); // Asegúrate de que 'user.posts' sea un array
    await user.save();

    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating post" });
  }
};

const getPost = async (req, res) => {
  try {
    const options = parseFeedOptions(req.query);
    if (!options) {
      return res.status(400).json({ error: "Invalid pagination params" });
    }

    const feed = await getFeed(options);

    if (feed.length === 0 && !options.cursor) {
      return res.status(200).json("No Posts available");
    }
    res.status(200).json(feed);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error getting posts" });
  }
};

const getPostId = async (req, res) => {
  const postId = req.params.postId;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const [post, quote] = await Promise.all([
      Post.findById(postId)
        .populate("user", PUBLIC_USER_FIELDS)
        .populate({ path: "comments" })
        .lean(),
      Quote.findById(postId)
        .populate({
          path: "postId",
          populate: { path: "user", select: PUBLIC_USER_FIELDS },
        })
        .populate("userQuote", PUBLIC_USER_FIELDS)
        .populate("comments")
        .lean(),
    ]);

    if (!post && !quote) {
      return res.status(404).json({ error: "Post and Quote not found" });
    }
    const result = post ? post : quote;
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching post" });
  }
};

const deleteComment = async (req, res, postId, commentId) => {
  const comment = await Comment.findById(commentId).lean();
  if (!comment) {
    return res.status(404).json({ error: "Comment not found" });
  }
  if (String(comment.userId._id) !== req.userId) {
    return res.status(403).json({ error: "Not allowed" });
  }

  // Elimina el comentario del array de comentarios del post o de la cita
  const update = { $pull: { comments: commentId } };
  await Promise.all([
    Post.updateOne({ _id: postId }, update),
    Quote.updateOne({ _id: postId }, update),
  ]);
  await Comment.deleteOne({ _id: commentId });

  res.status(200).json({ message: "Comment Deleted" });
};

const deleteTweet = async (req, res, postId) => {
  const post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Tweet not found" });
  }
  if (String(post.userId) !== req.userId) {
    return res.status(403).json({ error: "Not allowed" });
  }

  // Elimina todos los retweets que hacen referencia al post específico
  await Retweet.deleteMany({ postIdDelete: postId });
  await User.updateOne({ _id: post.userId }, { $pull: { posts: post._id } });
  await Post.deleteOne({ _id: postId });

  res.status(200).json({ message: "Tweet and its retweets deleted" });
};

const deletePost = async (req, res) => {
  const { postId, commentId } = req.query;
  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    if (commentId) {
      return await deleteComment(req, res, postId, commentId);
    }
    await deleteTweet(req, res, postId);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

module.exports = { getPostId, tweetPost, getPost, deletePost };
