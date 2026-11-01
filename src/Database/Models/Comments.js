const mongoose = require("mongoose");
const { PUBLIC_USER_FIELDS } = require("../publicFields");

const commentSchema = new mongoose.Schema({
  body: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Middleware para poblado automático del usuario y el post correspondientes en Comments
// 
commentSchema.pre("find", function () {
  // this.populate("postId");
  this.populate("userId", PUBLIC_USER_FIELDS);
});
const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
