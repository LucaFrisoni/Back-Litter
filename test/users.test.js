// Verifies the user and tweet-detail endpoints keep their contract without leaking credentials.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const Post = require("../src/Database/Models/Post");
const User = require("../src/Database/Models/User");
const Comment = require("../src/Database/Models/Comments");
const { startApp, stopApp, clearDb, get } = require("./helpers");

const seedUserWithPost = async () => {
  const user = await User.create({
    username: "ana",
    name: "Ana",
    email: "ana@test.io",
    hashedPassword: "secret-hash",
  });
  const post = await Post.create({
    body: "hello",
    userId: user._id,
    user: user._id,
    likeIds: [{ userId: user._id }],
  });
  user.posts.push(post._id);
  await user.save();
  return { user, post };
};

before(startApp);
after(stopApp);
beforeEach(clearDb);

// Regression: "Who to follow" downloaded every user's password hash
test("GET /users returns only public fields", async () => {
  await seedUserWithPost();
  const [user] = (await get("/users")).body;
  assert.deepEqual(Object.keys(user).sort(), ["_id", "name", "username"]);
});

// UserBio sums likes from posts and matches the email to show the Edit button
test("GET /users/:id keeps what the profile needs, without the hash", async () => {
  const { user } = await seedUserWithPost();
  await User.create({ username: "bob", email: "b@t.io", followingIds: [user._id] });
  const { body } = await get(`/users/${user._id}`);
  assert.equal(body.followersCount, 1);
  assert.equal(body.user.email, "ana@test.io");
  assert.equal(body.user.posts[0].likeIds.length, 1);
  assert.equal(body.user.hashedPassword, undefined);
});

// The feed no longer returns emails, but the login flow depends on this lookup
test("GET /email/:email still provides what NextAuth verifies at login", async () => {
  await seedUserWithPost();
  const { body } = await get("/email/ana@test.io");
  assert.equal(body.hashedPassword, "secret-hash");
  assert.equal(body.email, "ana@test.io");
});

// Both lookups back the profile page and login error handling
test("unknown users get a 404", async () => {
  assert.equal((await get("/users/64f000000000000000000000")).status, 404);
  assert.equal((await get("/email/nobody@test.io")).status, 404);
});

// The tweet page renders comment authors, which used to embed the whole user
test("tweet detail shows comment authors without credentials", async () => {
  const { user, post } = await seedUserWithPost();
  const comment = await Comment.create({
    body: "hi",
    postId: post._id,
    userId: user._id,
  });
  await Post.updateOne({ _id: post._id }, { $push: { comments: comment._id } });

  const { body } = await get(`/postss/${post._id}`);
  assert.equal(body.user.username, "ana");
  assert.equal(body.comments[0].userId.username, "ana");
  assert.ok(!JSON.stringify(body).includes("secret-hash"));
});

// Parallelising the post/quote lookups must not change the not-found outcome
test("tweet detail returns 404 for a missing id", async () => {
  assert.equal((await get("/postss/64f000000000000000000000")).status, 404);
});
