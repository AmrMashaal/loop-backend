import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getMessages, sendMessage } from "../controllers/message.js";
import { upload } from "../config/multer.js";
import { messageLimiter } from "../middleware/limiter.js";

const router = express.Router();

router.get("/:senderId/:receiverId", verifyToken, getMessages);

router.post(
  "/:senderId/:receiverId",
  messageLimiter,
  verifyToken,
  upload.single("picture"),
  sendMessage
);

export default router;
