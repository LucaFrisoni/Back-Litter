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

// Sostienen el merge paginado del feed: general y por perfil
retweetSchema.index({ createdAt: -1, _id: -1 });
retweetSchema.index({ userRetweet: 1, createdAt: -1, _id: -1 });

const Retweet = mongoose.model("Retweet", retweetSchema);

module.exports = Retweet;
