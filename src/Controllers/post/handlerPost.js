const Post = require("../../Database/Models/Post");
const User = require("../../Database/Models/User");
const Retweet = require("../../Database/Models/Retweet");
const Quote = require("../../Database/Models/Quote");
const Comment = require("../../Database/Models/Comments");
const { PUBLIC_USER_FIELDS } = require("../../Database/publicFields");
const { parseFeedOptions, getFeed } = require("./feedService");

const tweetPost = async (req, res) => {
  try {
    const { email, body } = req.body;

    const user = await User.findOne({ email }); // Encuentra al usuario por su email
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

const deletePost = async (req, res) => {
  const { postId, commentId } = req.query;
  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    const postUser = await Post.findById(postId).populate("user");
    const quoteUser = await Quote.findById(postId);

    if (commentId) {
      // Elimina el comentario del array de comentarios del post

      if (quoteUser) {
        await Quote.findByIdAndUpdate(postId, {
          $pull: { comments: commentId }, // Elimina el comentario del array de comentarios
        });

        // Elimina el comentario
        await Comment.deleteOne({ _id: commentId });

        return res.status(200).json({ message: "Comment Deleted" });
      }

      await Post.findByIdAndUpdate(postId, {
        $pull: { comments: commentId }, // Elimina el comentario del array de comentarios
      });

      // Elimina el comentario
      await Comment.deleteOne({ _id: commentId });

      return res.status(200).json({ message: "Comment Deleted" });
    }

    // Elimina todos los retweets que hacen referencia al post específico
    await Retweet.deleteMany({ postIdDelete: postId });

    // Elimina el post

    const updatedUserPostIds = postUser.user.posts.filter(
      (post) => post.toString() !== postId.toString()
    );

    const updatedUser = await User.findByIdAndUpdate(
      { _id: postUser.user._id },
      { posts: updatedUserPostIds },
      { new: true }
    );

    const result = await Post.deleteOne({ _id: postId });

    if (result.deletedCount === 1) {
      // El documento se eliminó exitosamente
      res.status(200).json({ message: "Tweet and its retweets deleted" });
    } else {
      // No se encontró el documento con el ID proporcionado
      res.status(404).json({ message: "Tweet not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deleting post" });
  }
};

module.exports = { getPostId, tweetPost, getPost, deletePost };
