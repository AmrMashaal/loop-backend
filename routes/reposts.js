import express from "express";
import { createRepost, getRepostClickInfo } from "../controllers/repost.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:repostId/clickInfo", verifyToken, getRepostClickInfo);

router.post("/", verifyToken, createRepost);

export default router;
