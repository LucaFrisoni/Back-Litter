// Verifies the health check that decides whether a deploy counts as working.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { startApp, stopApp, get } = require("./helpers");

before(startApp);
after(stopApp);

// The pipeline waits for this exact commit, so it must be reported as deployed
test("health reports the running commit when the database is connected", async () => {
  process.env.RENDER_GIT_COMMIT = "abc123";
  const { status, body } = await get("/health");
  delete process.env.RENDER_GIT_COMMIT;

  assert.equal(status, 200);
  assert.deepEqual(body, { status: "ok", commit: "abc123" });
});

// Regression: the server starts even if MongoDB fails, which would pass as a good deploy
test("health fails while the database is disconnected", async () => {
  await mongoose.disconnect();
  const { status, body } = await get("/health");

  assert.equal(status, 503);
  assert.equal(body.status, "unavailable");
});
