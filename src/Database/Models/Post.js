const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  body: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  likeIds: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Retweet" }],
});

// Sostienen el merge paginado del feed: general y por perfil
postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ userId: 1, createdAt: -1, _id: -1 });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
