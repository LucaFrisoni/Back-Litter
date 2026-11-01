const User = require("../../Database/Models/User");
const { PUBLIC_USER_FIELDS } = require("../../Database/publicFields");

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
        .select("-hashedPassword")
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

const getUserEmail = async (req, res) => {
  const userEmail = req.params.userEmail;

  try {
    // El login de NextAuth compara la contrasena contra este hashedPassword
    const user = await User.findOne({ email: userEmail }).lean();
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
    const user = await User.findOne({ username: userUsername })
      .select("-hashedPassword")
      .populate("posts")
      .lean();
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
