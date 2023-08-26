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
} = require("../Controllers/post/handlerPost");
const userRegister = require("../Controllers/register/handleRegister");
const {
  getUsers,
  getUserId,
  getUserEmail,
} = require("../Controllers/users/handlerUsers");

router.post("/comments", makeComment);
router.get("/comments", getComment);

router.patch("/edit", editUser);

router.post("/follow", follow);
router.delete("/follow", unfollow);

router.post("/like", makeLike);
router.delete("/like", deleteLike);

router.get("/notifications/:userId", getNotifications);

router.post("/posts", tweetPost);
router.get("/posts", getPost);
router.get("/postss/:postId", getPostId);

router.post("/register", userRegister);

router.get("/users", getUsers);
router.get("/users/:userId", getUserId);
router.get("/email/:userEmail", getUserEmail);

module.exports = router;
