import express from "express";
import {
  likePost,
  likeComment,
  whoLikedPost,
  whoLikedComment,
  likeReply,
  whoLikedReply,
  likeRepost,
  whoLikedRepost,
} from "../controllers/likes.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:postId/post", verifyToken, whoLikedPost);
router.get("/:commentId/comment", verifyToken, whoLikedComment);
router.get("/:replyId/reply", verifyToken, whoLikedReply);
router.get("/:repostId/repost", verifyToken, whoLikedRepost);

router.patch("/:id/:userId/like", verifyToken, likePost);
router.patch("/:id/:userId/likeComment", verifyToken, likeComment);
router.patch("/:id/:userId/likeReply", verifyToken, likeReply);
router.patch("/:id/:userId/likeRepost", verifyToken, likeRepost);

export default router;
