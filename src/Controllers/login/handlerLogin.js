// Verifies credentials on the server and exchanges them for an API token.
const bcrypt = require("bcrypt");
const User = require("../../Database/Models/User");
const { signToken } = require("../../Middlewares/auth");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    const isValid =
      user?.hashedPassword &&
      (await bcrypt.compare(password, user.hashedPassword));

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { _id, name, username } = user;
    res.status(200).json({
      user: { _id, name, username, email: user.email },
      token: signToken(_id),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error logging in" });
  }
};

module.exports = login;
