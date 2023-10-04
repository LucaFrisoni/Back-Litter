const mongoose = require("mongoose");

const quoteretweetSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
  userQuoteRetweet: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const QuoteRetweet = mongoose.model("QuoteRetweet", quoteretweetSchema);

module.exports = QuoteRetweet;
