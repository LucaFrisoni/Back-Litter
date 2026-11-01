const bcrypt = require("bcrypt");
const User = require("../../Database/Models/User");

const userRegister = async (req, res) => {
  try {
    const { email, username, name, password } = req.body;

    const isValidBody = [email, username, name, password].every(
      (field) => typeof field === "string" && field.length > 0
    );
    if (!isValidBody) {
      return res.status(400).json("All fields are required");
    }

    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)) {
      return res.status(400).json("Invalid email format");
    }
    const findEmail = await User.findOne({ email: email });
    if (findEmail) {
      return res.status(400).json("User Already Exist");
    }
    const findUsername = await User.findOne({ username: username });
    if (findUsername) {
      return res.status(400).json("Username Already Exist");
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      email,
      username,
      name,
      hashedPassword,
    });

    await newUser.save();

    res.status(200).json({ _id: newUser._id, name, username, email });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error creating user" });
  }
};
module.exports = { userRegister };
