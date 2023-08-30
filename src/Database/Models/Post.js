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
});

// Siempre antes del model
postSchema.pre("find", function () {
  this.populate("user");
  this.populate("comments");
});
postSchema.pre("findById", function () {
  this.populate("user");
  this.populate("comments");
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
