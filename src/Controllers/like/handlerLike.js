const Post = require("../../Database/Models/Post");
const User = require("../../Database/Models/User");
const Notification = require("../../Database/Models/Notifications");

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
      { $push: { likeIds: currentUserId } },
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

    if (postId) {
      const postLiked = await Post.findById(postId);

      if (!postLiked) {
        throw new Error("Invalid ID");
      }

      const notificationToDelete = await Notification.findOne({
        userId: postLiked.userId,
        body: "Someone liked your tweet!",
      });

      if (notificationToDelete) {
        await notificationToDelete.remove();
      }

      let updatedLikeIDS = [...(postLiked?.likeIds || [])];

      updatedLikeIDS = updatedLikeIDS.filter((i) => i != currentUserId);

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { likeIds: updatedLikeIDS },
        { new: true }
      );

      res.status(200).json(updatedPost);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};

module.exports = { deleteLike, makeLike };
