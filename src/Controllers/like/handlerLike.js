const Post = require("../../Database/Models/Post");
const User = require("../../Database/Models/User");
const Notification = require("../../Database/Models/Notifications");
const Quote = require("../../Database/Models/Quote");

const makeLike = async (req, res) => {
  try {
    const { postId, currentUserId } = req.body;

    const postLiked = await Post.findById(postId);

    if (!postLiked) {
      throw new Error("Invalid ID");
    }

    await Notification.create({
      body: "Someone liked your post!",
      userId: postLiked.userId,
    });

    if (postLiked.userId) {
      await User.findByIdAndUpdate(postLiked.userId, { hasNotification: true });
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $push: { likeIds: { userId: currentUserId } } },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error liking post" });
  }
};

const deleteLike = async (req, res) => {
  try {
    const postId = req.query.postId;
    const currentUserId = req.query.currentUserId;

    if (!postId || !currentUserId) {
      return res.status(400).json({ error: "Missing postId or currentUserId" });
    }

    const postLiked = await Post.findById(postId);

    if (!postLiked) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updatedLikeIds = postLiked.likeIds.filter(
      (like) => like.userId.toString() !== currentUserId
    );

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { likeIds: updatedLikeIds },
      { new: true }
    );

    // Remove notification logic goes here if needed

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const makeLikeQuote = async (req, res) => {
  try {
    const { postId, currentUserId } = req.body;

    const quoteLiked = await Quote.findById(postId);

    if (!quoteLiked) {
      throw new Error("Invalid ID");
    }

    const updatedQuote = await Quote.findByIdAndUpdate(
      postId,
      { $push: { likeIds: { userId: currentUserId } } },
      { new: true }
    );

    res.status(200).json(updatedQuote);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error liking post" });
  }
};

const deleteLikeQuote = async (req, res) => {
  try {
    const postId = req.query.postId;
    const currentUserId = req.query.currentUserId;

    if (!postId || !currentUserId) {
      return res.status(400).json({ error: "Missing postId or currentUserId" });
    }

    const quoteLiked = await Quote.findById(postId);

    if (!quoteLiked) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updatedLikeIds = quoteLiked.likeIds.filter(
      (like) => like.userId.toString() !== currentUserId
    );

    const updatedQuote = await Quote.findByIdAndUpdate(
      postId,
      { likeIds: updatedLikeIds },
      { new: true }
    );

    // Remove notification logic goes here if needed

    res.status(200).json(updatedQuote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { deleteLike, makeLike, makeLikeQuote, deleteLikeQuote };
