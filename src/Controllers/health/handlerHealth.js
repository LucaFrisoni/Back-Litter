// Tells Render and the deploy pipeline which commit is running and if it can reach the database.
const mongoose = require("mongoose");

const CONNECTED = 1;

const getHealth = (req, res) => {
  const isHealthy = mongoose.connection.readyState === CONNECTED;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "unavailable",
    commit: process.env.RENDER_GIT_COMMIT || null,
  });
};

module.exports = getHealth;
