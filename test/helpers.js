// Shared test setup: runs the real Express app against an in-memory MongoDB.
process.env.JWT_SECRET = "test-secret";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server-core");
const app = require("../src/app");

let mongo;
let server;
let baseUrl;

const startApp = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).init()));
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
};

const stopApp = async () => {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
};

const clearDb = () =>
  Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).deleteMany()));

const get = async (path) => {
  const response = await fetch(baseUrl + path);
  return { status: response.status, body: await response.json().catch(() => null) };
};

const send = async (method, path, { token, data, headers = {} } = {}) => {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token && { authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: data && JSON.stringify(data),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body, headers: response.headers };
};

// Counts the MongoDB operations a request triggers
const countQueries = async (run) => {
  let queries = 0;
  mongoose.set("debug", () => queries++);
  await run();
  mongoose.set("debug", false);
  return queries;
};

module.exports = { startApp, stopApp, clearDb, get, send, countQueries };
