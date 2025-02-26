import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { getLastMessages, postLastMessage } from "../controllers/lastMessage.js";

const router = express.Router();

router.get("/", verifyToken, getLastMessages)

router.post("/", verifyToken, postLastMessage)

export default router;
