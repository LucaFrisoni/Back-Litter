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
  rt: {
    active: { type: Boolean, default: false },
    userRetweet: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
