const User = require("../../Database/Models/User");
const { cloudinary } = require("../../cloudinary");

const editUser = async (req, res) => {
  const { email, username, ...updateFields } = req.body;

  try {
    // Verificar si el usuario ya existe por username y email
    const lookSamePerson = await User.findOne({ username, email });

    if (lookSamePerson) {
      // Comprueba si se proporcionó una nueva imagen de perfil y cárgala en Cloudinary
      if (updateFields.profileImage) {
        const profileCloudinary = await cloudinary.uploader.upload(
          updateFields.profileImage,
          {
            transformation: {
              crop: "thumb",
              gravity: "auto",
              fetch_format: "auto",
              quality: "auto",
            },
            folder: "TwitterClone",
          }
        );
        console.log("Cloudy =>", profileCloudinary.secure_url);
        console.log("Actual user =>", lookSamePerson.profileImage);
        if (profileCloudinary.secure_url != lookSamePerson.profileImage) {
          updateFields.profileImage = profileCloudinary.secure_url;
        } else {
          const deleteCloudRepeat1 = await cloudinary.uploader.destroy(
            profileCloudinary.public_id,
            { invalidate: true }
          );
        }
        // Actualiza el campo de imagen de perfil con el enlace de Cloudinary
      }

      // Comprueba si se proporcionó una nueva imagen de portada y cárgala en Cloudinary
      if (updateFields.coverImage) {
        const coverCloudinary = await cloudinary.uploader.upload(
          updateFields.coverImage,
          {
            transformation: {
              crop: "thumb",
              gravity: "auto",
              fetch_format: "auto",
              quality: "auto",
            },
            folder: "TwitterClone",
          }
        );
        if (coverCloudinary.secure_url != lookSamePerson.coverImage) {
          updateFields.coverImage = coverCloudinary.secure_url;
        } else {
          const deleteCloudRepeat2 = await cloudinary.uploader.destroy(
            coverCloudinary.public_id,
            { invalidate: true }
          );
        }
        // Actualiza el campo de imagen de portada con el enlace de Cloudinary
      }

      // Actualiza el usuario con los campos actualizados, incluyendo las imágenes
      const updatedUser = await User.findOneAndUpdate({ email }, updateFields, {
        new: true,
      });

      return res.status(200).json(updatedUser);
    } else {
      // El usuario no existe, verifica si el nombre de usuario ya está en uso
      const lookUniqueUserName = await User.findOne({ username });

      if (lookUniqueUserName) {
        return res.status(400).json("Username Already Exist");
      }

      // Comprueba si se proporcionó una nueva imagen de perfil y cárgala en Cloudinary
      if (updateFields.profileImage) {
        const profileCloudinary = await cloudinary.uploader.upload(
          updateFields.profileImage,
          {
            transformation: {
              crop: "thumb",
              gravity: "auto",
              fetch_format: "auto",
              quality: "auto",
            },
            folder: "TwitterClone",
          }
        );
        
        if (profileCloudinary.secure_url != lookSamePerson.profileImage) {
          updateFields.profileImage = profileCloudinary.secure_url;
        } else {
          const deleteCloudRepeat3 = await cloudinary.uploader.destroy(
            profileCloudinary.public_id,
            { invalidate: true }
          );
        }
        // Actualiza el campo de imagen de perfil con el enlace de Cloudinary
      }

      // Comprueba si se proporcionó una nueva imagen de portada y cárgala en Cloudinary
      if (updateFields.coverImage) {
        const coverCloudinary = await cloudinary.uploader.upload(
          updateFields.coverImage,
          {
            transformation: {
              crop: "thumb",
              gravity: "auto",
              fetch_format: "auto",
              quality: "auto",
            },
            folder: "TwitterClone",
          }
        );

        // Actualiza el campo de imagen de portada con el enlace de Cloudinary
        if (coverCloudinary.secure_url != lookSamePerson.coverImage) {
          updateFields.coverImage = coverCloudinary.secure_url;
        } else {
          const deleteCloudRepeat2 = await cloudinary.uploader.destroy(
            coverCloudinary.public_id,
            { invalidate: true }
          );
        }
      }

      // Crea un nuevo usuario con los campos proporcionados y las imágenes
      const updatedUser = await User.findOneAndUpdate({ email }, updateFields, {
        new: true,
      });

      return res.status(200).json(updatedUser);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error updating user" });
  }
};

module.exports = editUser;
