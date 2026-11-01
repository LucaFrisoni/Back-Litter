const mongoose = require("mongoose");

const quoteretweetSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  quoteIdDelete: String,
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
  userQuoteRetweet: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Sostienen el merge paginado del feed: general y por perfil
quoteretweetSchema.index({ createdAt: -1, _id: -1 });
quoteretweetSchema.index({ userQuoteRetweet: 1, createdAt: -1, _id: -1 });

const QuoteRetweet = mongoose.model("QuoteRetweet", quoteretweetSchema);

module.exports = QuoteRetweet;
