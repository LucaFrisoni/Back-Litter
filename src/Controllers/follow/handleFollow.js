const User = require("../../Database/Models/User");
const Notification = require("../../Database/Models/Notifications");
const { ACCOUNT_FIELDS } = require("../../Database/publicFields");

const follow = async (req, res) => {
  try {
    const { userId } = req.body;

    const userFollow = await User.findById(userId);

    if (!userFollow) {
      throw new Error("Invalid ID");
    }

    await Notification.create({
      body: "Someone followed you!",
      userId: userId,
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { hasNotification: true, $addToSet: { followingIds: req.userId } },
      { new: true }
    ).select(ACCOUNT_FIELDS);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error following user" });
  }
};

const unfollow = async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const userFollow = await User.findById(userId);

    if (!userFollow) {
      throw new Error("Invalid ID");
    }

    await Notification.deleteOne({
      userId: userId,
      body: "Someone followed you!",
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { followingIds: req.userId } },
      { new: true }
    ).select(ACCOUNT_FIELDS);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error unfollowing user" });
  }
};
module.exports = { follow, unfollow };
