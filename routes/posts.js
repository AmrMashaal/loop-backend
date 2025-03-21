import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getFeedPosts,
  getUserPosts,
  deletePost,
  editPost,
  getPost,
  pinPost,
  createPost,
  getPostClickInfo,
  changePrivacy,
} from "../controllers/post.js";
import { upload } from "../config/multer.js";
import { postLimiter } from "../middleware/limiter.js";

const router = express.Router();

router.get("/feed", verifyToken, getFeedPosts);
router.get("/:userId/posts", verifyToken, getUserPosts);
router.get("/:postId", verifyToken, getPost);
router.get("/:postId/clickInfo", verifyToken, getPostClickInfo);

router.patch("/:postId/edit", verifyToken, editPost);
router.patch("/:postId/pin", verifyToken, pinPost);
router.patch("/:postId/changePrivacy", verifyToken, changePrivacy);

router.post(
  "/",
  verifyToken,
  upload.single("picture"),
  postLimiter,
  createPost
);
router.post("/:id/delete", verifyToken, deletePost);

export default router;
