const User = require("../../Database/Models/User");
const Notification = require("../../Database/Models/Notifications");

const follow = async (req, res) => {
  try {
    const { userId, currentUserId } = req.body;

    const userFollow = await User.findById(userId);

    if (!userFollow) {
      throw new Error("Invalid ID");
    }

    await Notification.create({
      body: "Someone followed you!",
      userId: userId,
    });

    if (userId) {
      await User.findByIdAndUpdate(userId, { hasNotification: true });
    }

    let updatedFollowingIDS = [...(userFollow?.followingIds || [])];

    updatedFollowingIDS.push(currentUserId);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { followingIds: updatedFollowingIDS },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error following user" });
  }
};

const unfollow = async (req, res) => {
  try {
    const userId = req.query.userId;
    const currentUserId = req.query.currentUserId;

    if (userId) {
      const userFollow = await User.findById(userId);

      if (!userFollow) {
        throw new Error("Invalid ID");
      }

      const notificationToDelete = await Notification.findOne({
        userId: userId,
        body: "Someone followed you!",
      });
    
      if (notificationToDelete) {
        await Notification.deleteOne({
          _id: notificationToDelete._id,
        });
      }

      let updatedFollowingIDS = [...(userFollow?.followingIds || [])];

      updatedFollowingIDS = updatedFollowingIDS.filter(
        (i) => i != currentUserId
      );
      console.log("updatedFollowingIDS=>", updatedFollowingIDS);
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { followingIds: updatedFollowingIDS },
        { new: true }
      );

      res.status(200).json(updatedUser);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};
module.exports = { follow, unfollow };
