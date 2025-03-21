import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../config/multer.js";
import {
  getReplies,
  postReply,
  deleteReply,
  editReply,
} from "../controllers/reply.js";
import { replyLimiter } from "../middleware/limiter.js";

const router = express.Router();

router.get("/:commentId", verifyToken, getReplies);

router.post(
  "/:commentId",
  verifyToken,
  replyLimiter,
  upload.single("picture"),
  postReply
);

router.patch("/:replyId/edit", verifyToken, editReply);

router.delete("/:replyId", verifyToken, deleteReply);

export default router;
