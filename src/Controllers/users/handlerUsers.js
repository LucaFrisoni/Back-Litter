const User = require("../../Database/Models/User");
const {
  PUBLIC_USER_FIELDS,
  PROFILE_FIELDS,
  ACCOUNT_FIELDS,
} = require("../../Database/publicFields");

const MAX_USERS = 50;
const POST_LIKES = { path: "posts", select: "likeIds.userId" };

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(PUBLIC_USER_FIELDS)
      .sort({ createdAt: "desc" })
      .limit(MAX_USERS)
      .lean();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};
const getUserId = async (req, res) => {
  const userId = req.params.userId;
  try {
    const [user, followersCount] = await Promise.all([
      User.findById(userId)
        .select(PROFILE_FIELDS)
        .populate(POST_LIKES)
        .lean(),
      User.count({ followingIds: userId }),
    ]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user, followersCount });
  } catch (error) {
    res.status(500).json({ error: "Error fetching user" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(ACCOUNT_FIELDS).lean();
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
  getCurrentUser,
};
