import express from "express";
import { login, register } from "../controllers/auth.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.post("/register", upload.single("picture"), register);
router.post("/login", login);

export default router;
