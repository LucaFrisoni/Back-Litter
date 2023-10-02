const express = require("express");
const router = express.Router();

const {
  getComment,
  makeComment,
} = require("../Controllers/comments/handlerComments");
const editUser = require("../Controllers/edit/handlerEdit");
const { follow, unfollow } = require("../Controllers/follow/handleFollow");
const { makeLike, deleteLike } = require("../Controllers/like/handlerLike");
const getNotifications = require("../Controllers/notifications/handlerNotifications");
const {
  tweetPost,
  getPostId,
  getPost,
  deletePost,
} = require("../Controllers/post/handlerPost");
const userRegister = require("../Controllers/register/handleRegister");
const {
  getUsers,
  getUserId,
  getUserEmail,
} = require("../Controllers/users/handlerUsers");
const handlerPasswordChange = require("../Controllers/password/handlerPasswordChange");
const { getCharts } = require("../Controllers/charts/handlerCharts");
const {
  retweetPost,
  deleteRetweet,
} = require("../Controllers/retweet/handler");
const { createQuote, deleteQuote } = require("../Controllers/quote/handler");

// Coments
router.post("/comments", makeComment);
router.get("/comments", getComment);
// Edit
router.patch("/edit", editUser);
// Follow
router.post("/follow", follow);
router.delete("/follow", unfollow);
// Like
router.post("/like", makeLike);
router.delete("/like", deleteLike);
// Notification
router.get("/notifications/:userId", getNotifications);
// Posts
router.post("/posts", tweetPost);
router.get("/posts", getPost);
router.delete("/delete/posts", deletePost);
router.get("/postss/:postId", getPostId);
// Retweets
router.post("/retweets", retweetPost);
router.delete("/retweets", deleteRetweet);
// Quotes
router.post("/quotes", createQuote);
router.delete("/quotes", deleteQuote);
// chart
router.get("/charts", getCharts);
// Register
router.post("/register", userRegister);
// PasswordChange
router.put("/passwordChange", handlerPasswordChange);
//Users
router.get("/users", getUsers);
router.get("/users/:userId", getUserId);
router.get("/email/:userEmail", getUserEmail);

module.exports = router;
