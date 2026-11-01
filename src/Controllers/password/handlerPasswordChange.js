const User = require("../../Database/Models/User");
const bcrypt = require("bcrypt");

const handlerPasswordChange = async (req, res) => {
  const { email, currentPassword, password } = req.body;

  try {
    const isValidBody = [email, currentPassword, password].every(
      (field) => typeof field === "string" && field.length > 0
    );
    if (!isValidBody) {
      return res.status(400).json("All fields are required");
    }

    const user = await User.findOne({ email });
    const isValid =
      user?.hashedPassword &&
      (await bcrypt.compare(currentPassword, user.hashedPassword));

    if (!isValid) {
      return res.status(400).json("Invalid email or current password");
    }

    user.hashedPassword = await bcrypt.hash(password, 12);
    await user.save();

    res.status(200).json({ message: "Password changed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error changing password" });
  }
};
module.exports = handlerPasswordChange;
