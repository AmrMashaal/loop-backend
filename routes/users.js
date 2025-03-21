import express from "express";
import {
  getUser,
  changePassword,
  checkCorrectPassword,
  getOnlineFriends,
  changeOnlineStatus,
  editUser,
} from "../controllers/user.js";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../config/multer.js";

const router = express.Router();

router.get("/:id", verifyToken, getUser);
router.get("/:id/onlineFriends", verifyToken, getOnlineFriends);

router.patch(
  "/:id/:usernameParam/edit",
  verifyToken,
  upload.single("picture"),
  editUser
);

router.post("/:id/password", verifyToken, changePassword);
router.post("/:id/checkCorrectPassword", verifyToken, checkCorrectPassword);
router.post("/:id/onlineState", changeOnlineStatus);

export default router;
