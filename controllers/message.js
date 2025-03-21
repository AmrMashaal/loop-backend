import sharp from "sharp";
import Message from "../models/Message.js";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../utils/cloudinary.js";

export const getMessages = async (req, res) => {
  const { page, limit = 15 } = req.query;
  const { senderId, receiverId } = req.params;

  if (req.user.id !== senderId && req.user.id !== receiverId) {
    return res.status(403).json({ message: "Forbidden!" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("senderId receiverId", "picturePath _id");

    if (!messages) {
      return res.status(404).json({ message: "There is no message" });
    }

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const compressImage = async (buffer) => {
  return await sharp(buffer)
    .rotate()
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .withMetadata()
    .toBuffer();
};

export const sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const { receiverId } = req.params;

  let picturePath = null;

  if (!senderId) {
    return res.status(401).json({ message: "Unauthorized!" });
  }

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
    const message = new Message({
      receiverId: receiverId,
      senderId: senderId,
      text: req.body.text,
      picturePath,
    });

    const data = await message.save();

    await data.populate("senderId receiverId", "picturePath _id");

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
