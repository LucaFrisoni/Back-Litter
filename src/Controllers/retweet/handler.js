const Post = require("../../Database/Models/Post");
const Retweet = require("../../Database/Models/Retweet");

const retweetPost = async (req, res) => {
  const { postId, userRetweet } = req.body;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json("Post doesnot exist");
    }
    const retweet = new Retweet({
      postId,
      userRetweet,
    });

    await retweet.save();

    post.retweets.push(retweet._id);

    res.status(200).json(retweet);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};
const deleteRetweet = async (req, res) => {
  const { postId, userRetweet } = req.query;

  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const postRetweet = await Post.findById(postId);
    if (!postRetweet) {
      return res.status(404).json({ error: "Post not found" });
    }

    const updatedRetweetIds = postRetweet.retweets.filter(
      (retweet) => retweet.toString() !== userRetweet
    );

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { retweets: updatedRetweetIds },
      { new: true }
    );

    // Remove notification logic goes here if needed

    if (!updatedPost) {
      res.status(400).json("Error updating post");
    }
    const deleteRetweet = await Retweet.findByIdAndDelete({
      postId,
      userRetweet,
    });

    if (deleteRetweet.deletedCount === 1) {
      // El documento se eliminó exitosamente
      res.status(200).json({ message: "Tweet Deleted" });
    } else {
      // No se encontró el documento con el ID proporcionado
      res.status(404).json({ message: "Tweet not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

module.exports = { retweetPost, deleteRetweet };
