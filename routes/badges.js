import express from "express";
import {verifyToken} from "../middleware/auth.js";
import {getBadges} from "../controllers/badge.js";

const router = express.Router();

router.get("/:userId", verifyToken, getBadges);

export default router;
