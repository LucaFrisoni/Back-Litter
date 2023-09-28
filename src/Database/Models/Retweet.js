const mongoose = require("mongoose");

const retweetSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  postIdDelete: String,
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  //   Para el quote
  likeIds: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  userRetweet: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  //   Para el quote
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
});

const Retweet = mongoose.model("Retweet", retweetSchema);

module.exports = Retweet;
