const express = require("express");
const router = express.Router();

const {
  getComment,
  makeComment,
} = require("../Controllers/comments/handlerComments");
const editUser = require("../Controllers/edit/handlerEdit");
const { follow, unfollow } = require("../Controllers/follow/handleFollow");
const {
  makeLike,
  deleteLike,
  makeLikeQuote,
  deleteLikeQuote,
} = require("../Controllers/like/handlerLike");
const getNotifications = require("../Controllers/notifications/handlerNotifications");
const {
  tweetPost,
  getPostId,
  getPost,
  deletePost,
} = require("../Controllers/post/handlerPost");
const { userRegister } = require("../Controllers/register/handleRegister");
const login = require("../Controllers/login/handlerLogin");
const {
  getUsers,
  getUserId,
  getCurrentUser,
} = require("../Controllers/users/handlerUsers");
const handlerPasswordChange = require("../Controllers/password/handlerPasswordChange");
const getHealth = require("../Controllers/health/handlerHealth");
const { getCharts ,totalLikes,totalLikesToday} = require("../Controllers/charts/handlerCharts");
const {
  retweetPost,
  deleteRetweet,
  retweetQuote,
  deleteRetweetQuote,
} = require("../Controllers/retweet/handler");
const { createQuote, deleteQuote } = require("../Controllers/quote/handler");
const { requireAuth } = require("../Middlewares/auth");
const { credentialsLimiter } = require("../Middlewares/rateLimit");

// Health
router.get("/health", getHealth);
// Coments
router.post("/comments", requireAuth, makeComment);
router.get("/comments", getComment);
// Edit
router.patch("/edit", requireAuth, editUser);
// Follow
router.post("/follow", requireAuth, follow);
router.delete("/follow", requireAuth, unfollow);
// Like
router.post("/like", requireAuth, makeLike);
router.delete("/like", requireAuth, deleteLike);
router.post("/likeQuote", requireAuth, makeLikeQuote);
router.delete("/likeQuote", requireAuth, deleteLikeQuote);
// Notification
router.get("/notifications/:userId", requireAuth, getNotifications);
// Posts
router.post("/posts", requireAuth, tweetPost);
router.get("/posts", getPost);
router.delete("/delete/posts", requireAuth, deletePost);
router.get("/postss/:postId", getPostId);
// Retweets
router.post("/retweets", requireAuth, retweetPost);
router.delete("/retweets", requireAuth, deleteRetweet);
router.post("/retweetsQuotes", requireAuth, retweetQuote);
router.delete("/retweetsQuotes", requireAuth, deleteRetweetQuote);
// Quotes
router.post("/quotes", requireAuth, createQuote);
router.delete("/quotes", requireAuth, deleteQuote);
// chart
router.get("/charts", getCharts);
router.get("/chartsTL", totalLikes);

// Register
router.post("/register", credentialsLimiter, userRegister);
// Login
router.post("/login", credentialsLimiter, login);
// PasswordChange
router.put("/passwordChange", credentialsLimiter, handlerPasswordChange);
//Users
router.get("/users", getUsers);
router.get("/users/:userId", getUserId);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
