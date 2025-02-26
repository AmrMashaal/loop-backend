import express from "express";
import {
  getComments,
  deleteComment,
  editComment,
  pinComment,
  postCommentOriginal,
} from "../controllers/comment.js";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get("/:postId/:commentId", verifyToken, getComments);

router.post(
  "/postComment/:postId",
  verifyToken,
  upload.single("picture"),
  postCommentOriginal
);

router.patch("/:commentId/edit", verifyToken, editComment);
router.patch("/:commentId/pin", verifyToken, pinComment);

router.delete("/:commentId", verifyToken, deleteComment);

export default router;
