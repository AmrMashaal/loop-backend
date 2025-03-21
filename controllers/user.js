import User from "../models/User.js";
import Post from "../models/Post.js";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import Friend from "../models/Friend.js";
import cloudinary from "../utils/cloudinary.js";

// ---------------------------------------------------------------

export const getUser = async (req, res) => {
  const id = req.params.id;

  try {
    let user = await User.findOne({ _id: id });

    const { password, ...dataWithoutPassword } = user.toObject();

    res.status(200).json(dataWithoutPassword);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
};

// ---------------------------------------------------------------

const compressImage = async (buffer) => {
  return await sharp(buffer)
    .rotate()
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .withMetadata()
    .toBuffer();
};

export const editUser = async (req, res) => {
  let picturePath = null;
  let background = null;
  const { id, usernameParam } = req.params;

  if (req.user.id !== id.toString()) {
    return res.status(403).json({ message: "Forbidden!" });
  }

  if (req.file) {
    if (req.body.picturePath && !req.body.background) {
      try {
        const uniqueImageName = `${uuidv4()}-${req.file.originalname}`;

        const compressedBuffer = await compressImage(req.file.buffer);

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              public_id: uniqueImageName,
              folder: "posts",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(compressedBuffer);
        });

        picturePath = result.secure_url;
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    } else if (req.body.background && !req.body.picturePath) {
      try {
        const uniqueImageName = `${uuidv4()}-${req.file.originalname}`;

        const compressedBuffer = await compressImage(req.file.buffer);

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              public_id: uniqueImageName,
              folder: "posts",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(compressedBuffer);
        });

        background = result.secure_url;
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
  }

  try {
    const {
      firstName,
      lastName,
      username,
      birthdate,
      gender,
      bio,
      location,
      occupation,
      facebook,
      instagram,
      linkedin,
      x,
      youtube,
    } = req.body;

    const user = await User.findById(id);
    const isUserName = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (isUserName && isUserName._id.toString() !== id) {
      return res.status(404).json({ message: "Username exists" });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.birthdate = birthdate;
    user.gender = gender;
    user.bio = bio;
    user.location = location;
    user.occupation = occupation;
    user.links.facebook = facebook;
    user.links.instagram = instagram;
    user.links.linkedin = linkedin;
    user.links.x = x;
    user.links.youtube = youtube;
    if (usernameParam !== username) {
      user.username = username;
    } else if (background) {
      user.background = background;
    } else if (picturePath) {
      user.picturePath = picturePath;
    }

    if (picturePath) {
      await Post.updateMany(
        {
          userId: id,
        },
        {
          $set: {
            userPicturePath: picturePath,
          },
        }
      );
    }

    await Post.updateMany(
      {
        userId: id,
      },
      {
        $set: {
          firstName: firstName,
          lastName: lastName,
        },
      }
    );

    const updatedUser = await user.save();

    const { password, ...UserData } = updateduser.toObject();

    res.status(200).json(UserData);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// ---------------------------------------------------------------

export const changePassword = async (req, res) => {
  const { id } = req.params;

  if (req.user.id !== id.toString()) {
    return res.status(403).json({ message: "Forbidden!" });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const isCorrect = await bcrypt.compare(req.body.oldPassword, user.password);

    if (!isCorrect) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();

    await user.save();

    res
      .status(200)
      .json({ message: "The password has been changed successfully" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// ---------------------------------------------------------------

export const checkCorrectPassword = async (req, res) => {
  const { id } = req.params;

  if (req.user.id !== id.toString()) {
    return res.status(403).json({ message: "Forbidden!" });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.passwordChangedAt !== req.body.passwordChangedAt) {
      return res.status(404).json({ message: "Password is not correct" });
    }

    res.status(200).json({ message: "Correct password" });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// ---------------------------------------------------------------

export const getOnlineFriends = async (req, res) => {
  const { id } = req.params;

  if (req.user.id !== id.toString()) {
    return res.status(403).json({ message: "Forbidden!" });
  }

  try {
    const friends = await Friend.find({
      $or: [{ sender: id }, { receiver: id }],
      status: "accepted",
    }).populate(
      "sender receiver",
      "_id firstName lastName picturePath online occupation"
    );

    if (!friends) {
      return res.status(404).json({ message: "User not found" });
    }

    const onlineFriends = friends.filter(
      (friend) =>
        (friend.sender._id.toString() === id && friend.receiver.online) ||
        (friend.receiver._id.toString() === id && friend.sender.online)
    );

    res.status(200).json(onlineFriends);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------

export const changeOnlineStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.makeOnline) {
      user.online = true;
    } else {
      user.online = false;
    }

    await user.save();

    res
      .status(200)
      .json({ message: `User is ${user.online ? "online" : "offline"}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
