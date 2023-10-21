const User = require("../../Database/Models/User");

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: "desc" });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};
const getUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId).populate("posts");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const followersCount = await User.count({
      followingIds: userId,
    });

    res.status(200).json({ user, followersCount });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user" });
  }
};

const getUserEmail = async (req, res) => {
  const userEmail = req.params.userEmail;

  try {
    const user = await User.findOne({ email: userEmail }).populate("posts");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user" });
  }
};
const getUserUsername = async (req, res) => {
  const userUsername = req.params.Username;

  try {
    const user = await User.findOne({ username: userUsername }).populate(
      "posts"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user" });
  }
};

module.exports = {
  getUsers,
  getUserId,
  getUserEmail,
  getUserUsername,
};
