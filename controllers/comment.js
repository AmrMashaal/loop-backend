import { v4 as uuidv4 } from "uuid";
import Comment from "../models/Comment.js";
import Notification from "../models/notification.js";
import Like from "../models/Like.js";
import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import Reply from "../models/Reply.js";
import Repost from "../models/Repost.js";
import Badge from "../models/Badge.js";

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
    .rotate()
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .withMetadata()
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

    const commentCount = await Comment.countDocuments({ user: req.user.id });

    const isBadge = await Badge.findOne({
      userId: req.user.id,
      type: "comment",
    });

    if (!isBadge || commentCount === 5) {
      const badge = new Badge({
        userId: req.user.id,
        type: "comment",
        level: "bronze",
        name: "First Words",
        description: "User has shared 5 comments",
        icon: "🍼",
        criteria: "User must share 5 comments",
      });

      await badge.save();

      const notification = new Notification({
        receiverId: req.user.id,
        type: "badge",
        linkId: `/profile/${userId}/badges`,
        description: "You have earned a new badge - First Words",
      });

      await notification.save();
    } else if (commentCount === 10) {
      await Badge.findOneAndUpdate(
        { userId: req.user.id, type: "comment" },
        {
          level: "silver",
          name: "Echo Starter",
          description: "User has shared 10 comments",
          icon: "🎤",
          criteria: "User must share 10 comments",
        },
        { upsert: true }
      );

      const notification = new Notification({
        receiverId: req.user.id,
        type: "badge",
        linkId: `/profile/${userId}/badges`,
        description: "You have earned a new badge - Echo Starter",
      });

      await notification.save();
    } else if (commentCount === 25) {
      await Badge.findOneAndUpdate(
        { userId: req.user.id, type: "comment" },
        {
          level: "gold",
          name: "Comment Raptor",
          description: "User has shared 25 comments",
          icon: "🦖",
          criteria: "User must share 25 comments",
        },
        { upsert: true }
      );

      const notification = new Notification({
        receiverId: req.user.id,
        type: "badge",
        linkId: `/profile/${userId}/badges`,
        description: "You have earned a new badge - Comment Raptor",
      });

      await notification.save();
    } else if (commentCount === 50) {
      await Badge.findOneAndUpdate(
        { userId: req.user.id, type: "comment" },
        {
          level: "diamond",
          name: "Debate Champion",
          description: "User has shared 50 comments",
          icon: "⚖️",
          criteria: "User must share 50 comments",
        },
        { upsert: true }
      );

      const notification = new Notification({
        receiverId: req.user.id,
        type: "badge",
        linkId: `/profile/${userId}/badges`,
        description: "You have earned a new badge - Debate Champion",
      });

      await notification.save();
    } else if (commentCount === 250) {
      await Badge.findOneAndUpdate(
        { userId: req.user.id, type: "comment" },
        {
          level: "platinum",
          name: "Master of Comments",
          description: "User has shared 250 comments",
          icon: "👑",
          criteria: "User must share 250 comments",
        },
        { upsert: true }
      );

      const notification = new Notification({
        receiverId: req.user.id,
        type: "badge",
        linkId: `/profile/${userId}/badges`,
        description: "You have earned a new badge - Master of Comments",
      });

      await notification.save();
    }

    res.status(200).json(comment);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comments = await Comment.findById(commentId);

    if (!comments) {
      return res.status(404).json({ message: "comments is not found" });
    }

    if (req.user.id !== comments.user.toString()) {
      return res.status(403).json({ message: "Forbidden!" });
    }

    await Comment.findByIdAndDelete(commentId);

    const replyCount = await Reply.countDocuments({ comment: commentId });

    const post = await Post.findById(comments.postId);

    if (post) {
      await Post.findByIdAndUpdate(comments.postId, {
        $inc: {
          commentCount: -(replyCount + 1),
        },
      });
    } else {
      await Repost.findByIdAndUpdate(comments.repostId, {
        $inc: {
          commentCount: -(replyCount + 1),
        },
      });
    }

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

    if (req.user.id !== comment.user.toString()) {
      return res.status(403).json({ message: "Forbidden!" });
    }

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
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const pinComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);

    if (req.user.id !== comment.user.toString()) {
      return res.status(403).json({ message: "Forbidden!" });
    }

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
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const repostComment = async (req, res) => {
  const { repostId } = req.params;

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
      repostId: repostId,
      picturePath,
      text: req.body.text,
      repost: true,
    });

    await Repost.findByIdAndUpdate(repostId, {
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

export const getRepostComments = async (req, res) => {
  const { repostId, commentId } = req.params;
  const { limit = 5, page } = req.query;

  let data;

  try {
    const comments = await Comment.find({ repostId: repostId })
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
