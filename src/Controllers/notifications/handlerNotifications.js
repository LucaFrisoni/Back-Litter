const User = require("../../Database/Models/User");
const Notification = require("../../Database/Models/Notifications")
 const getNotifications = async (req, res) => {
  const userId = req.params.userId;

  try {
    if (userId !== req.userId) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const notifications = await Notification.find({ userId }).sort({
      createdAt: "desc",
    });

    await User.findByIdAndUpdate(userId, { hasNotification: false });

    res.status(200).json(notifications);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
};
module.exports =  getNotifications ;