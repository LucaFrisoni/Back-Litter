const User = require("../../Database/Models/User");
const bcrypt = require("bcrypt");
const handlerPasswordChange = async (req, res) => {
  const { email, password} = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const updatedUser = await User.findOneAndUpdate(
      { email }, // Buscar por el email proporcionado
      { password: hashedPassword }, // Actualizar los campos proporcionados
      { new: true }
    );
    if (!updatedUser) {
      res.status(400).json("User does not exist");
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error changing password" });
  }
};
module.exports = handlerPasswordChange;
