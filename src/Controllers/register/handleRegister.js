const bcrypt = require("bcrypt")
const User = require("../../Database/Models/User");

 const userRegister = async (req,res) =>{
    try {
      const { email, username, name, password } = req.body;

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        email,
        username,
        name,
        hashedPassword,
      });

      await newUser.save();

      res.status(200).json(newUser);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error creating user" });
    }
}
module.exports = userRegister
