const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

  body: String,
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Middleware para poblado automático del usuario correspondiente
notificationSchema.pre("findOne", async function (next) {
  if (this.userId) {
    try {
      const user = await mongoose.model("User").findById(this.userId);
      this.user = user;
    } catch (error) {
      console.error(error);
    }
  }
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
