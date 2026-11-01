// Limits password guessing on the endpoints that receive credentials.
const { rateLimit } = require("express-rate-limit");

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

// El login llega desde los servidores de Vercel, por eso se limita por cuenta y no por IP
const attemptKey = (req) => {
  const { email } = req.body || {};
  if (typeof email === "string") return email.toLowerCase();
  return req.headers["cf-connecting-ip"] || req.ip;
};

const credentialsLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_ATTEMPTS,
  keyGenerator: attemptKey,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: "Too many attempts, try again later" },
});

module.exports = { credentialsLimiter };
