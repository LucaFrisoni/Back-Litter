const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  postIdDelete: String,
  body: String,
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  likeIds: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  userQuote: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Retweet" }],
});

const Quote = mongoose.model("Quote", quoteSchema);

module.exports = Quote;
