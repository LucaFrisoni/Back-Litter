
const Post = require("../../Database/Models/Post");
const Comment = require("../../Database/Models/Comments");
const Quote = require("../../Database/Models/Quote");

const makeComment = async (req, res) => {
  try {
    const { currentUserId, body, postId } = req.body;

    const newComment = new Comment({
      body,
      postId,
      userId: currentUserId,
    });
    let quoteCommented = null;
    const postCommented = await Post.findById(postId);
    if (!postCommented) {
      quoteCommented = await Quote.findById(postId);
    }
    //  if (postCommented) {
    //    await Notification.create({
    //      body: "Someone commented on your post!",
    //      userId: postCommented.userId,
    //    });

    //    if (postCommented.userId) {
    //      await User.findByIdAndUpdate(postCommented.userId, {
    //        hasNotification: true,
    //      });
    //    }
    //  }

    await newComment.save();

    // Agregar el _id del comentario al array de comentarios del post
    if (postCommented) {
      postCommented.comments.push(newComment._id);
      await postCommented.save();
    }
    if (quoteCommented) {
      quoteCommented.comments.push(newComment._id);
      await quoteCommented.save();
    }

    res.status(200).json(newComment);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating comment" });
  }
};

const getComment = async (req, res) => {
  const { postId } = req.query;
  try {
    const commentFind = await Comment.find({ postId });
    res.status(200).json(commentFind);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error Getting comment" });
  }
};

module.exports = { makeComment, getComment };
