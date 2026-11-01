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

// Sostienen el merge paginado del feed: general y por perfil
quoteSchema.index({ createdAt: -1, _id: -1 });
quoteSchema.index({ userQuote: 1, createdAt: -1, _id: -1 });

const Quote = mongoose.model("Quote", quoteSchema);

module.exports = Quote;
