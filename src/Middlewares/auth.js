// Issues API tokens and protects the routes that act on behalf of a user.
const jwt = require("jsonwebtoken");

const TOKEN_LIFETIME = "30d";
const ALGORITHM = "HS256";

const signToken = (userId) =>
  jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: TOKEN_LIFETIME,
  });

const requireAuth = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: [ALGORITHM],
    });
    req.userId = payload.sub;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { signToken, requireAuth };
