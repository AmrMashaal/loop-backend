import Repost from "../models/Repost.js";
import Like from "../models/Like.js";
import Post from "../models/Post.js";

export const createRepost = async (req, res) => {
  const { postId, privacy, description } = req.body;

  try {
    const repost = new Repost({
      userId: req.user.id,
      postId,
      privacy,
      description,
    });

    await repost.save();

    await Post.findByIdAndUpdate(
      postId,
      { $inc: { shareCount: 1 } },
      { upsert: true, new: true }
    );

    const populatedRepost = await Repost.findById(repost._id)
      .populate(
        "postId",
        "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
      )
      .populate("userId", "firstName lastName picturePath verified _id");

    res.status(201).json(populatedRepost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRepostClickInfo = async (req, res) => {
  const { repostId } = req.params;
  let isLiked;

  try {
    const { likesCount, commentCount } = await Repost.findById(repostId).select(
      "likesCount commentCount"
    );

    const checkLike = await Like.findOne({
      userId: req.user.id,
      repostId: repostId,
    });

    if (checkLike) {
      isLiked = true;
    } else {
      isLiked = false;
    }

    res.status(200).json({ likesCount, commentsCount: commentCount, isLiked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
