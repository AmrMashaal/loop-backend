import express from "express";
import { login, register } from "../controllers/auth.js";
import { upload } from "../config/multer.js";
import { authLimiter } from "../middleware/limiter.js";

const router = express.Router();

router.post("/register", authLimiter, upload.single("picture"), register);
router.post("/login", authLimiter, login);

export default router;
