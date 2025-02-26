import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { searchInfo } from "../controllers/search.js";

const router = express.Router();

router.get("/:type/:info", verifyToken, searchInfo);

export default router;
