const User = require("../../Database/Models/User");

 const editUser = async (req, res) => {
  const { email, username, ...updateFields } = req.body;

  try {
    if (username) {
      const lookSamePerson = await User.findOne({ username, email });

      if (lookSamePerson) {
        const updatedUser = await User.findOneAndUpdate(
          { email }, // Buscar por el email proporcionado
          { ...updateFields }, // Actualizar los campos proporcionados
          { new: true }
        );

        res.status(200).json(updatedUser);
      } else {
        const lookUniqueUserName = await User.findOne({ username });

        if (lookUniqueUserName) {
          res.status(400).json("Username Already Exist");
        }

        const updatedUser = await User.findOneAndUpdate(
          { email }, // Buscar por el email proporcionado
          { username, ...updateFields }, // Actualizar los campos proporcionados
          { new: true }
        );

        res.status(200).json(updatedUser);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating user" });
  }
};
module.exports = editUser