import { v4 as uuidv4 } from "uuid";
import Comment from "../models/Comment.js";
import Notification from "../models/notification.js";
import Like from "../models/Like.js";
import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import Reply from "../models/Reply.js";

export const getComments = async (req, res) => {
  const { postId, commentId } = req.params;
  const { limit = 5, page } = req.query;

  let data;

  try {
    const comments = await Comment.find({ postId: postId })
      .sort({
        pinned: -1,
        createdAt: -1,
      })
      .populate("user", "_id verified firstName lastName picturePath")
      .limit(limit)
      .skip((page - 1) * limit);

    if (!comments) {
      return res.status(404).json({ message: "comments is not found" });
    }

    const commentsWithIsLiked = await Promise.all(
      comments.map(async (com) => {
        const replyCount = await Reply.countDocuments({ comment: com._id });

        const isLiked = await Like.findOne({
          userId: req.user.id,
          commentId: com._id,
        });

        return {
          ...com._doc,
          isLiked: Boolean(isLiked),
          replyCount,
        };
      })
    );

    const isValidObjectId = mongoose.Types.ObjectId.isValid(commentId);

    const specificCom =
      commentId && isValidObjectId
        ? await Comment.findById(commentId).populate(
            "user",
            "_id verified firstName lastName picturePath"
          )
        : null;

    if (commentId && isValidObjectId && page === "1" && specificCom) {
      const specificComWithIsLiked = await Like.find({
        userId: req.user.id,
        commentId: specificCom._id,
      });

      const replyCount = await Reply.countDocuments({
        comment: specificCom._id,
      });

      data = [
        {
          ...specificCom._doc,
          isLiked: specificComWithIsLiked.length > 0,
          highlight: true,
          replyCount,
        },
        ...commentsWithIsLiked.filter(
          (com) => com._id.toString() !== commentId
        ),
      ];
    } else {
      data = commentsWithIsLiked;
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

const compressImage = async (buffer) => {
  return await sharp(buffer)
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .toBuffer();
};

export const postCommentOriginal = async (req, res) => {
  const { postId } = req.params;

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
    const comment = new Comment({
      user: req.user.id,
      postId: postId,
      picturePath,
      text: req.body.text,
    });

    await Post.findByIdAndUpdate(postId, {
      $inc: {
        commentCount: 1,
      },
    });

    await comment.save();

    await comment.populate(
      "user",
      "_id verified firstName lastName picturePath"
    );

    res.status(200).json(comment);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comments = await Comment.findByIdAndDelete(commentId);

    if (!comments) {
      return res.status(404).json({ message: "comments is not found" });
    }

    const replyCount = await Reply.countDocuments({ comment: commentId });

    await Post.findByIdAndUpdate(comments.postId, {
      $inc: {
        commentCount: -(replyCount + 1),
      },
    });

    await Notification.deleteOne({ commentId: commentId });

    await Reply.deleteMany({ comment: commentId });

    res.status(200).json(comments);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const editComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);

    if (req.user.id === comment.user.toString()) {
      if (!comment) {
        return res.status(404).json({ message: "comment is not found" });
      }

      comment.text = req.body.text;
      comment.edited = true;

      await comment.save();

      await comment.populate(
        "user",
        "_id verified firstName lastName picturePath"
      );

      res.status(200).json(comment);
    } else {
      res.status(403).json({ message: "Forbidden!" });
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const pinComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);

    const postOfComment = await Post.findById(comment.postId);

    if (req.user.id === postOfComment.userId.toString()) {
      if (!comment) {
        return res.status(404).json({ message: "comment is not found" });
      }

      comment.pinned = !comment.pinned;

      await comment.save();

      await comment.populate(
        "user",
        "_id verified firstName lastName picturePath"
      );

      res.status(200).json(comment);
    } else {
      res.status(403).json({ message: "Forbidden!" });
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};
