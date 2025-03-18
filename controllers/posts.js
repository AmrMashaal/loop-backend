import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Like from "../models/Like.js";
import Friend from "../models/Friend.js";
import Notification from "../models/notification.js";
import cloudinary from "../utils/cloudinary.js";
import Repost from "../models/Repost.js";

const compressImage = async (buffer) => {
  return await sharp(buffer)
    .resize({ width: 800 })
    .jpeg({ quality: 80 })
    .toBuffer();
};

export const createPost = async (req, res) => {
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
      res.status(500).json({ message: error.message });
    }
  }

  try {
    const { userId, description, textAddition, privacy } = req.body;

    if (userId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden!" });
    }
    
    const user = await User.findById(userId);

    const newPost = new Post({
      userId,
      description,
      picturePath,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      location: user.location,
      verified: user.verified,
      textAddition: textAddition,
      privacy,
      comments: [],
      likes: [],
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (err) {
    console.error("Image compression or post creation error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const getFeedPosts = async (req, res) => {
  const { page, limit = 5 } = req.query;
  const { id } = req.user;

  try {
    const friendsPromise = await Friend.find({
      $or: [
        { sender: id, status: "accepted" },
        { receiver: id, status: "accepted" },
      ],
    });

    const friendsIds = friendsPromise.map((fr) => {
      return fr.sender.toString() === id
        ? fr.receiver.toString()
        : fr.sender.toString();
    });

    let posts = await Post.find({
      $or: [
        { privacy: "friends", userId: { $in: friendsIds } },
        { privacy: "public" },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const postsWithIsLiked = await Promise.all(
      posts.map(async (post) => {
        const isLiked = await Like.findOne({
          userId: req.user.id,
          postId: post._id,
        });

        return { ...post._doc, isLiked: Boolean(isLiked) };
      })
    );

    let reposts = await Repost.find({
      $or: [
        { privacy: "friends", userId: { $in: friendsIds } },
        { privacy: "public" },
      ],
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * 4)
      .limit(4)
      .populate(
        "postId",
        "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
      )
      .populate("userId", "firstName lastName picturePath verified _id");

    const repostsWithIsLiked = await Promise.all(
      reposts.map(async (rep) => {
        const isLiked = await Like.findOne({
          userId: req.user.id,
          repostId: rep._id,
        });

        const postId =
          rep?.postId?.privacy === "friends" &&
          !friendsIds.includes(rep.postId.userId.toString()) &&
          rep.postId.userId.toString() !== req.user.id
            ? null
            : rep.postId;

        return { ...rep._doc, isLiked: Boolean(isLiked), postId };
      })
    );

    posts = [...postsWithIsLiked, ...repostsWithIsLiked].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  const { page, limit = 5 } = req.query;
  const { userId } = req.params;

  let userPosts;

  try {
    const userFriends = await Friend.find({
      $or: [
        { sender: req.user.id, status: "accepted" },
        { receiver: req.user.id, status: "accepted" },
      ],
    });

    const friendsIds = userFriends.map((fr) =>
      fr.sender.toString() === req.user.id
        ? fr.receiver.toString()
        : fr.sender.toString()
    );

    const isFriend = userFriends.some((friend) => {
      return (
        friend.sender.toString() === req.user.id ||
        friend.receiver.toString() === req.user.id
      );
    });

    if (userId === req.user.id) {
      userPosts = await Post.find({ userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ pinned: -1, createdAt: -1 });

      let reposts = await Repost.find({
        userId,
        $or: [
          { privacy: "public" },
          { privacy: "friends" },
          { privacy: "private" },
        ],
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * 4)
        .limit(4)
        .populate(
          "postId",
          "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
        )
        .populate("userId", "firstName lastName picturePath verified _id");

      userPosts = [...userPosts, ...reposts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        return b.createdAt - a.createdAt;
      });
    } else if (isFriend) {
      userPosts = await Post.find({
        userId,
        $or: [{ privacy: "public" }, { privacy: "friends" }],
      })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ pinned: -1, createdAt: -1 });

      let reposts = await Repost.find({
        userId,
        $or: [{ privacy: "public" }, { privacy: "friends" }],
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * 4)
        .limit(4)
        .populate(
          "postId",
          "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
        )
        .populate("userId", "firstName lastName picturePath verified _id");

      userPosts = [...userPosts, ...reposts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        return b.createdAt - a.createdAt;
      });
    } else if (!isFriend) {
      userPosts = await Post.find({ userId, privacy: "public" })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ pinned: -1, createdAt: -1 });

      let reposts = await Repost.find({
        userId,
        privacy: "public",
      })
        .sort({ createdAt: -1 })
        .skip((page - 1) * 4)
        .limit(4)
        .populate(
          "postId",
          "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
        )
        .populate("userId", "firstName lastName picturePath verified _id");

      userPosts = [...userPosts, ...reposts].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        return b.createdAt - a.createdAt;
      });
    }

    const postsWithIsLiked = await Promise.all(
      userPosts.map(async (post) => {
        const isLiked = await Like.findOne(
          typeof post.userId === "object"
            ? {
                userId: req.user.id,
                repostId: post._id,
              }
            : {
                userId: req.user.id,
                postId: post._id,
              }
        );

        const postId =
          post?.postId?.privacy === "friends" &&
          !friendsIds.includes(post.postId.userId.toString()) &&
          post.postId.userId.toString() !== req.user.id
            ? null
            : post.postId;

        return typeof post.userId === "object"
          ? { ...post._doc, isLiked: Boolean(isLiked), postId }
          : { ...post._doc, isLiked: Boolean(isLiked) };
      })
    );

    const postsCount = await Post.countDocuments({ userId });
    const repostsCount = await Repost.countDocuments({ userId });

    const count = postsCount + repostsCount;

    res.status(200).json({ posts: postsWithIsLiked, count });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getPost = async (req, res) => {
  const { postId } = req.params;

  let post;

  try {
    post = await Post.findById(postId);

    if (!post) {
      post = await Repost.findById(postId)
        .populate(
          "postId",
          "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
        )
        .populate("userId", "firstName lastName picturePath verified _id");
    }

    if (post.userId.toString() !== req.user.id && post.privacy === "private") {
      res.status(403).json({ message: "Forbidden!" });
    } else {
      if (!post) {
        return res.status(404).json({ message: "Post is not found" });
      }

      const isLiked = await Like.findOne(
        typeof post.userId !== "object"
          ? {
              userId: req.user.id,
              postId: post._id,
            }
          : {
              userId: req.user.id,
              repostId: post._id,
            }
      );

      const postWithIsLiked = {
        ...post._doc,
        isLiked: Boolean(isLiked),
        reposted: typeof post.userId === "object" ? true : false,
      };

      res.status(200).json(postWithIsLiked);
    }
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  let deletedPost;

  try {
    deletedPost = await Post.findById(id);

    if (deletedPost && deletedPost.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden!" });
    }

    if (deletedPost) {
      await Post.findByIdAndDelete(id);
      await Notification.deleteMany({ linkId: id });
      await Comment.deleteMany({ postId: id });
    } else {
      deletedPost = await Repost.findById(id).populate("postId", "_id");

      if (deletedPost && deletedPost.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden!" });
      }

      await Repost.findByIdAndDelete(id);
      await Post.findByIdAndUpdate(deletedPost.postId._id, {
        $inc: { shareCount: -1 },
      });
      await Notification.deleteMany({ linkId: id });
      await Comment.deleteMany({ repostId: id });
    }

    res.status(200).json(deletedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const editPost = async (req, res) => {
  const { postId } = req.params;

  let post;

  try {
    post = await Post.findById(postId);

    if (post && post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden!" });
    }

    if (post) {
      post.description = req.body.description;
      post.edited = true;

      const result = await post.save();

      const isLiked = await Like.findOne({
        userId: req.user.id,
        postId: post._id,
      });

      const postWithIsLiked = { ...result._doc, isLiked: Boolean(isLiked) };

      res.status(200).json(postWithIsLiked);
    } else {
      post = await Repost.findOne({ _id: postId });

      if (post && post.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden!" });
      }

      post.description = req.body.description;
      post.edited = true;

      const result = await post.save();

      const populatedResult = await Repost.findById(result._id)
        .populate(
          "postId",
          "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
        )
        .populate("userId", "firstName lastName picturePath verified _id");

      const isLiked = await Like.findOne({
        userId: req.user.id,
        repostId: post._id,
      });

      const postWithIsLiked = {
        ...populatedResult._doc,
        isLiked: Boolean(isLiked),
      };

      res.status(200).json(postWithIsLiked);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const pinPost = async (req, res) => {
  const { postId } = req.params;

  let post;
  try {
    post = await Post.findById(postId);

    if (post && post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden!" });
    }

    if (post) {
      post.pinned = !post.pinned;
      await post.save();

      const isLiked = await Like.findOne({
        userId: req.user.id,
        postId: post._id,
      });

      const postWithIsLiked = { ...post._doc, isLiked: Boolean(isLiked) };

      res.status(200).json(postWithIsLiked);
    } else {
      post = await Repost.findById(postId)
        .populate(
          "postId",
          "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
        )
        .populate("userId", "firstName lastName picturePath verified _id");

      if (post && post.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden!" });
      }

      post.pinned = !post.pinned;
      await post.save();

      const isLiked = await Like.findOne({
        userId: req.user.id,
        repostId: post._id,
      });

      const postWithIsLiked = { ...post._doc, isLiked: Boolean(isLiked) };

      res.status(200).json(postWithIsLiked);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPostClickInfo = async (req, res) => {
  const { postId } = req.params;
  let isLiked;

  try {
    const post = await Post.findById(postId).select(
      "likesCount commentCount userId"
    );

    const repost = await Repost.findById(postId);

    const checkLike = await Like.findOne({
      userId: req.user.id,
      postId: postId,
    });

    if (checkLike) {
      isLiked = true;
    } else {
      isLiked = false;
    }

    res.status(200).json({
      likesCount: post.likesCount,
      commentsCount: post.commentCount,
      isLiked,
      reposted: repost ? true : false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePrivacy = async (req, res) => {
  const { postId } = req.params;

  let post;

  try {
    post = await Post.findById(postId);

    if (post && post.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden!" });
    }

    if (post) {
      post.privacy = req.body.privacy;
      await post.save();

      const isLiked = await Like.findOne({
        userId: req.user.id,
        postId: post._id,
      });

      const postWithIsLiked = { ...post._doc, isLiked: Boolean(isLiked) };
      res.status(200).json(postWithIsLiked);
    } else {
      post = await Repost.findByIdAndUpdate(
        postId,
        {
          privacy: req.body.privacy,
        },
        { new: true }
      )
        .populate(
          "postId",
          "_id userId description picturePath firstName lastName userPicturePath location verified textAddition privacy createdAt"
        )
        .populate("userId", "firstName lastName picturePath verified _id");

      if (
        post &&
        (post.userId.toString() !== req.user.id ||
          post.userId._id !== req.user.id)
      ) {
        return res.status(403).json({ message: "Forbidden!" });
      }

      const isLiked = await Like.findOne({
        userId: req.user.id,
        repostId: post._id,
      });

      const postWithIsLiked = { ...post._doc, isLiked: Boolean(isLiked) };

      res.status(200).json(postWithIsLiked);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
