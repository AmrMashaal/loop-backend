import Like from "../models/Like.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Reply from "../models/Reply.js";

export const likePost = async (req, res) => {
  const { id, userId } = req.params;

  let newPost;

  try {
    const like = await Like.findOne({ userId, postId: id });

    if (like) {
      await Like.deleteOne({ userId, postId: id });

      const post = await Post.findByIdAndUpdate(
        id,
        { $inc: { likesCount: -1 } },
        { new: true }
      );

      newPost = { ...post._doc, isLiked: false };
    } else {
      await new Like({ userId, postId: id }).save();

      const post = await Post.findByIdAndUpdate(
        id,
        { $inc: { likesCount: 1 } },
        { new: true }
      );

      newPost = { ...post._doc, isLiked: true };
    }

    res.status(200).json({ post: newPost, isLiked: !like });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------
export const likeComment = async (req, res) => {
  const { id, userId } = req.params;

  let newComment;

  try {
    const like = await Like.findOne({ userId, commentId: id });

    if (like) {
      await Like.deleteOne({ userId, commentId: id });

      const comment = await Comment.findByIdAndUpdate(
        id,
        { $inc: { likesCount: -1 } },
        { new: true }
      );

      newComment = { ...comment._doc, isLiked: false };
    } else {
      await new Like({ userId, commentId: id }).save();

      const comment = await Comment.findByIdAndUpdate(
        id,
        { $inc: { likesCount: 1 } },
        { new: true }
      );

      newComment = { ...comment._doc, isLiked: true };
    }

    res.status(200).json({ comment: newComment, isLiked: !like });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------
export const likeReply = async (req, res) => {
  const { id, userId } = req.params;

  let newReply;

  try {
    const like = await Like.findOne({ userId, replyId: id });

    if (like) {
      await Like.deleteOne({ userId, replyId: id });

      const reply = await Reply.findByIdAndUpdate(
        id,
        { $inc: { likesCount: -1 } },
        { new: true }
      );

      newReply = { ...reply._doc, isLiked: false };
    } else {
      await new Like({ userId, replyId: id }).save();

      const reply = await Reply.findByIdAndUpdate(
        id,
        { $inc: { likesCount: 1 } },
        { new: true }
      );

      newReply = { ...reply._doc, isLiked: true };
    }

    res.status(200).json({ reply: newReply, isLiked: !like });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ---------------------------------------------------------
export const whoLikedPost = async (req, res) => {
  const { page } = req.query;
  const { postId } = req.params;

  try {
    const likes = await Like.find({ postId })
      .limit(10)
      .skip((page - 1) * 10)
      .populate("userId", "firstName lastName picturePath verified _id");

    const count = await Like.countDocuments({ postId });

    res.status(200).json({ likes, count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ---------------------------------------------------------
export const whoLikedComment = async (req, res) => {
  const { page } = req.query;
  const { commentId } = req.params;

  try {
    const likes = await Like.find({ commentId })
      .populate("userId", "firstName lastName picturePath verified")
      .limit(10)
      .skip((page - 1) * 10)
      .select("userId");

    const count = await Like.countDocuments({ commentId });

    res.status(200).json({ likes, count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ---------------------------------------------------------
export const whoLikedReply = async (req, res) => {
  try {
    const { page } = req.query;
    const { replyId } = req.params;

    const likes = await Like.find({ replyId })
      .populate("userId", "firstName lastName picturePath verified")
      .limit(10)
      .skip((page - 1) * 10)
      .select("userId");

    const count = await Like.countDocuments({ replyId });

    res.status(200).json({ likes, count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
