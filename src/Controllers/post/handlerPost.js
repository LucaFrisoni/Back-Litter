const Post = require("../../Database/Models/Post");
const User = require("../../Database/Models/User");
const Retweet = require("../../Database/Models/Retweet");

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
    const userId = req.query.userId;

    if (userId) {
      const user = await User.findById(userId);

      if (user) {
        const posts = await Post.find({ userId: userId })
          .sort({
            createdAt: "desc",
          })
          .populate("user")
          .populate({ path: "comments", options: { sort: { createdAt: -1 } } });
        if (posts.length === 0) {
          res.status(200).json("They are not post available");
        }

        res.status(200).json(posts);
      }
    } else {
      const posts = await Post.find()
        .sort({ createdAt: "desc" })
        .populate("user")
        .populate({ path: "comments", options: { sort: { createdAt: -1 } } });

      const retweets = await Retweet.find()
        .sort({ createdAt: "desc" })
        .populate({
          path: "postId",
          populate: { path: "user" }, // Popula el campo 'user' dentro del objeto 'postId'
        });

      // Combina los arrays de posts y retweets en uno solo
      const combinedPostsAndRetweets = [...posts, ...retweets];

      // Ordena el array combinado en función del campo createdAt en orden descendente
      combinedPostsAndRetweets.sort((a, b) => b.createdAt - a.createdAt);

      if (combinedPostsAndRetweets.length === 0) {
        res.status(200).json("No Posts available");
      } else {
        res.status(200).json(combinedPostsAndRetweets);
      }
    }
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

    const post = await Post.findById(postId)
      .populate("user")
      .populate({ path: "comments", options: { sort: { createdAt: -1 } } });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching post" });
  }
};
const deletePost = async (req, res) => {
  const { postId } = req.query;
  try {
    if (!postId) {
      throw new Error("Invalid ID");
    }

    // Elimina todos los retweets que hacen referencia al post específico
    await Retweet.deleteMany({ postIdDelete: postId });

    // Elimina el post
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
