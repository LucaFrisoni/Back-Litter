const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: String,
  username: { type: String, unique: true },
  bio: String,
  email: { type: String, unique: true },
  emailVerified: Date,
  image: String,
  coverImage: String,
  profileImage: String,
  hashedPassword: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  followingIds: [{ type: mongoose.Schema.Types.ObjectId }],
  hasNotification: Boolean,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  notifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
  ],
});


const User = mongoose.model("User", userSchema);




module.exports = User;



