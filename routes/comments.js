import express from "express";
import {
  getComments,
  deleteComment,
  editComment,
  pinComment,
  postCommentOriginal,
  repostComment,
  getRepostComments,
} from "../controllers/comment.js";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import { commentLimiter } from "../middleware/limiter.js";

const router = express.Router();

router.get("/:postId/:commentId", verifyToken, getComments);
router.get(
  "/:repostId/:commentId/getRepostComments",
  verifyToken,
  getRepostComments
);

router.post(
  "/postComment/:postId",
  commentLimiter,
  verifyToken,
  upload.single("picture"),
  postCommentOriginal
);

router.post(
  "/repostComment/:repostId",
  commentLimiter,
  verifyToken,
  upload.single("picture"),
  repostComment
);

router.patch("/:commentId/edit", verifyToken, editComment);
router.patch("/:commentId/pin", verifyToken, pinComment);

router.delete("/:commentId", verifyToken, deleteComment);

export default router;
