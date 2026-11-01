// Verifies authentication, ownership rules and credential handling across the API.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Post = require("../src/Database/Models/Post");
const User = require("../src/Database/Models/User");
const Quote = require("../src/Database/Models/Quote");
const Comment = require("../src/Database/Models/Comments");
const { signToken } = require("../src/Middlewares/auth");
const { startApp, stopApp, clearDb, get, send } = require("./helpers");

const PASSWORD = "Passw0rd!";
let hashedPassword;
let emailCounter = 0;

// Unique emails keep each test outside the per-account rate limit of the others
const createUser = async (username) => {
  emailCounter++;
  const email = `${username}${emailCounter}@test.io`;
  const user = await User.create({ username, email, name: username, hashedPassword });
  return { user, email, token: signToken(user._id) };
};

const createPost = (user) =>
  Post.create({ body: "hello", userId: user._id, user: user._id });

before(async () => {
  await startApp();
  hashedPassword = await bcrypt.hash(PASSWORD, 4);
});
after(stopApp);
beforeEach(clearDb);

// The password hash must stay on the server, so the frontend only sends credentials
test("login returns a token and never the hash", async () => {
  const { email } = await createUser("ana");
  const { status, body } = await send("POST", "/login", {
    data: { email, password: PASSWORD },
  });
  assert.equal(status, 200);
  assert.ok(body.token);
  assert.equal(body.user.email, email);
  assert.ok(!JSON.stringify(body).includes("$2b$"));
});

// Wrong passwords and unknown accounts must be indistinguishable
test("login rejects bad credentials with the same answer", async () => {
  const { email } = await createUser("ana");
  const wrong = await send("POST", "/login", {
    data: { email, password: "nope" },
  });
  const unknown = await send("POST", "/login", {
    data: { email: "ghost@test.io", password: "nope" },
  });
  assert.equal(wrong.status, 401);
  assert.deepEqual(wrong.body, unknown.body);
});

// Regression: a query operator as email would match any account
test("login rejects query operators instead of strings", async () => {
  await createUser("ana");
  const { status } = await send("POST", "/login", {
    data: { email: { $ne: null }, password: { $ne: null } },
  });
  assert.equal(status, 400);
});

// Brute force must be blocked per account, since login arrives from Vercel's servers
test("login is rate limited per account", async () => {
  const { email } = await createUser("ana");
  const attempt = () =>
    send("POST", "/login", { data: { email, password: "nope" } });
  for (let i = 0; i < 10; i++) await attempt();
  assert.equal((await attempt()).status, 429);
});

// Regression: these lookups exposed hashes and emails to anyone
test("removed lookups no longer exist", async () => {
  const { email } = await createUser("ana");
  assert.equal((await get(`/email/${email}`)).status, 404);
  assert.equal((await get("/username/ana")).status, 404);
  const { status } = await send("POST", "/registerTwitter", {
    data: { username: "x", name: "x" },
  });
  assert.equal(status, 404);
});

// Every write must require identity, or anyone could act as any user
test("all mutations reject anonymous requests", async () => {
  const routes = [
    ["POST", "/comments"],
    ["PATCH", "/edit"],
    ["POST", "/follow"],
    ["DELETE", "/follow"],
    ["POST", "/like"],
    ["DELETE", "/like"],
    ["POST", "/likeQuote"],
    ["DELETE", "/likeQuote"],
    ["POST", "/posts"],
    ["DELETE", "/delete/posts"],
    ["POST", "/retweets"],
    ["DELETE", "/retweets"],
    ["POST", "/retweetsQuotes"],
    ["DELETE", "/retweetsQuotes"],
    ["POST", "/quotes"],
    ["DELETE", "/quotes"],
    ["GET", "/notifications/64f000000000000000000000"],
    ["GET", "/me"],
  ];
  for (const [method, path] of routes) {
    const { status } = await send(method, path);
    assert.equal(status, 401, `${method} ${path}`);
  }
});

// Tokens signed with another key or without a signature must never authenticate
test("forged tokens are rejected", async () => {
  const { user } = await createUser("ana");
  const forged = jwt.sign({ sub: String(user._id) }, "other-secret");
  const unsigned = jwt.sign({ sub: String(user._id) }, "", { algorithm: "none" });
  for (const token of [forged, unsigned, "garbage"]) {
    assert.equal((await send("GET", "/me", { token })).status, 401);
  }
});

// The sidebar reads the session user here; it needs the account without the hash
test("/me returns the token owner without credentials", async () => {
  const { email, token } = await createUser("ana");
  const { body } = await send("GET", "/me", { token });
  assert.equal(body.email, email);
  assert.equal(body.hashedPassword, undefined);
});

// Regression: tweets were created for whichever email the request named
test("a tweet is authored by the token owner, not the request body", async () => {
  const { user, token } = await createUser("ana");
  const victim = await createUser("bob");
  const { body } = await send("POST", "/posts", {
    token,
    data: { body: "hi", email: victim.email },
  });
  assert.equal(body.userId, String(user._id));
});

// Regression: likes were recorded for whichever id the request named
test("a like is recorded for the token owner", async () => {
  const { user, token } = await createUser("ana");
  const victim = await createUser("bob");
  const post = await createPost(victim.user);
  const { body } = await send("POST", "/like", {
    token,
    data: { postId: post._id, currentUserId: victim.user._id },
  });
  assert.equal(body.likeIds[0].userId, String(user._id));
});

// Only authors may delete; anything else would let users erase each other's tweets
test("tweets can only be deleted by their author", async () => {
  const author = await createUser("ana");
  const other = await createUser("bob");
  const post = await createPost(author.user);
  const path = `/delete/posts?postId=${post._id}`;

  assert.equal((await send("DELETE", path, { token: other.token })).status, 403);
  assert.ok(await Post.findById(post._id));
  assert.equal((await send("DELETE", path, { token: author.token })).status, 200);
  assert.equal(await Post.findById(post._id), null);
});

// Same ownership rule for comments, deleted through the tweet route
test("comments can only be deleted by their author", async () => {
  const author = await createUser("ana");
  const other = await createUser("bob");
  const post = await createPost(author.user);
  const comment = await Comment.create({ postId: post._id, userId: author.user._id });
  await Post.updateOne({ _id: post._id }, { $push: { comments: comment._id } });
  const path = `/delete/posts?postId=${post._id}&commentId=${comment._id}`;

  assert.equal((await send("DELETE", path, { token: other.token })).status, 403);
  assert.equal((await send("DELETE", path, { token: author.token })).status, 200);
  assert.deepEqual((await Post.findById(post._id)).comments, []);
});

// Same ownership rule for quotes
test("quotes can only be deleted by their author", async () => {
  const author = await createUser("ana");
  const other = await createUser("bob");
  const post = await createPost(author.user);
  const quote = await Quote.create({ postId: post._id, userQuote: author.user._id });
  const path = `/quotes?quoteId=${quote._id}`;

  assert.equal((await send("DELETE", path, { token: other.token })).status, 403);
  assert.equal((await send("DELETE", path, { token: author.token })).status, 200);
});

// Notifications are private, and reading them also clears the unread flag
test("notifications are only readable by their owner", async () => {
  const owner = await createUser("ana");
  const other = await createUser("bob");
  const path = `/notifications/${owner.user._id}`;
  assert.equal((await send("GET", path, { token: other.token })).status, 403);
  assert.equal((await send("GET", path, { token: owner.token })).status, 200);
});

// Regression: /edit stored any field sent, including the password hash
test("edit only changes the owner's whitelisted fields", async () => {
  const { user, token } = await createUser("ana");
  const { status, body } = await send("PATCH", "/edit", {
    token,
    data: {
      name: "New",
      username: "ana",
      bio: "hi",
      hashedPassword: "hacked",
      followingIds: ["64f000000000000000000000"],
    },
  });
  const stored = await User.findById(user._id);

  assert.equal(status, 200);
  assert.equal(stored.name, "New");
  assert.equal(stored.bio, "hi");
  assert.equal(stored.hashedPassword, hashedPassword);
  assert.equal(stored.followingIds.length, 0);
  assert.equal(body.hashedPassword, undefined);
});

// Usernames identify people, so taking one that is in use must keep failing
test("edit rejects a username already taken", async () => {
  await createUser("bob");
  const { token } = await createUser("ana");
  const { status, body } = await send("PATCH", "/edit", {
    token,
    data: { name: "Ana", username: "bob" },
  });
  assert.equal(status, 400);
  assert.equal(body, "Username Already Exist");
});

// Regression: knowing an email was enough to take over any account
test("password change requires the current password", async () => {
  const { user, email } = await createUser("ana");
  const change = (data) => send("PUT", "/passwordChange", { data });

  const missing = await change({ email, password: "new-pass" });
  const wrong = await change({ email, currentPassword: "x", password: "new-pass" });

  assert.equal(missing.status, 400);
  assert.equal(wrong.status, 400);
  assert.equal((await User.findById(user._id)).hashedPassword, hashedPassword);
});

// The new password must take over from the old one, without echoing the hash
test("password change replaces the password", async () => {
  const { email } = await createUser("ana");
  const { status, body } = await send("PUT", "/passwordChange", {
    data: { email, currentPassword: PASSWORD, password: "new-pass" },
  });
  assert.equal(status, 200);
  assert.ok(!JSON.stringify(body).includes("$2b$"));

  const login = (password) => send("POST", "/login", { data: { email, password } });
  assert.equal((await login(PASSWORD)).status, 401);
  assert.equal((await login("new-pass")).status, 200);
});

// Regression: registering echoed the new user's password hash
test("register does not return the hash and hashes the password", async () => {
  const email = "new@test.io";
  const { status, body } = await send("POST", "/register", {
    data: { email, username: "new", name: "New", password: PASSWORD },
  });
  assert.equal(status, 200);
  assert.ok(!JSON.stringify(body).includes("$2b$"));
  const stored = await User.findOne({ email });
  assert.ok(await bcrypt.compare(PASSWORD, stored.hashedPassword));
});

// Regression: follow returned the followed user's full document
test("follow is idempotent and does not expose the hash", async () => {
  const { token } = await createUser("ana");
  const target = await createUser("bob");
  const data = { userId: target.user._id };
  await send("POST", "/follow", { token, data });
  const { body } = await send("POST", "/follow", { token, data });
  assert.equal(body.followingIds.length, 1);
  assert.equal(body.hashedPassword, undefined);
});

// Only the real frontend may read the API from a browser
test("CORS only allows the configured origins", async () => {
  const allowed = await send("GET", "/users", {
    headers: { origin: "http://localhost:3000" },
  });
  const blocked = await send("GET", "/users", {
    headers: { origin: "https://evil.example" },
  });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:3000");
  assert.equal(blocked.headers.get("access-control-allow-origin"), null);
});
