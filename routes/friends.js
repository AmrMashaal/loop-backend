import express from "express";
import {
  getFriends,
  addFriend,
  acceptFriend,
  getSpecificFriend,
  deleteFriend,
  getFriendRequest
} from "../controllers/friend.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:userId/friends", verifyToken, getFriends);
router.get("/:friendId", verifyToken, getSpecificFriend);
router.get("/friendRequest/:userId", verifyToken, getFriendRequest);

router.post("/:receiverId/add", verifyToken, addFriend);

router.patch("/:receiverId/accept", verifyToken, acceptFriend);

router.delete("/:receiverId", verifyToken, deleteFriend);

export default router;
