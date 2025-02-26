import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../utils/cloudinary.js";

const compressImage = async (buffer) => {
  return await sharp(buffer)
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .toBuffer();
};

export const register = async (req, res) => {
  let picturePath = null;

  if (req.file) {
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
    } catch (error) {
      res.status(500).json({ message: error });
    }
  }

  try {
    const {
      firstName,
      lastName,
      username,
      password,
      friends,
      occupation,
      location,
      birthdate,
      gender,
    } = req.body;

    const isUsernameExisted = await User.findOne({ username });

    if (isUsernameExisted) {
      return res
        .status(400)
        .json({ message: "This Username Is Already Existed" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      firstName,
      lastName,
      username,
      password: passwordHash,
      picturePath,
      friends,
      occupation,
      location,
      birthdate,
      gender,
    });

    const savedUser = await user.save();

    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    const realPassword = await bcrypt.compare(password, user.password);

    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }

    if (!realPassword && user) {
      return res.status(400).json({ message: "Wrong password." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    delete user.password;

    return res.status(200).json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
