const User = require("../../Database/Models/User");
const { cloudinary } = require("../../cloudinary");

const uploadImage = async (image) => {
  const { secure_url } = await cloudinary.uploader.upload(image, {
    transformation: {
      crop: "thumb",
      gravity: "auto",
      fetch_format: "auto",
      quality: "auto",
    },
    folder: "TwitterClone",
  });
  return secure_url;
};

// Solo se suben imagenes nuevas: el front reenvia la URL actual si no cambio
const resolveImage = (image, currentImage) => {
  if (typeof image === "string" && image.startsWith("data:")) {
    return uploadImage(image);
  }
  return currentImage;
};

const areValidTexts = (...texts) =>
  texts.every((text) => text === undefined || typeof text === "string");

const editUser = async (req, res) => {
  const { name, username, bio, profileImage, coverImage } = req.body;

  try {
    if (!areValidTexts(name, username, bio)) {
      return res.status(400).json("Invalid profile data");
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const owner = await User.findOne({ username, _id: { $ne: user._id } });
    if (username && owner) {
      return res.status(400).json("Username Already Exist");
    }

    user.set({ name, username, bio });
    user.profileImage = await resolveImage(profileImage, user.profileImage);
    user.coverImage = await resolveImage(coverImage, user.coverImage);
    await user.save();

    const { hashedPassword, ...publicUser } = user.toObject();
    return res.status(200).json(publicUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating user" });
  }
};

module.exports = editUser;
