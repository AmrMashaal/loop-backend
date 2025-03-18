import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "../routes/auth.js";
import userRoutes from "../routes/users.js";
import postRoutes from "../routes/posts.js";
import messageRoutes from "../routes/messages.js";
import commentRoutes from "../routes/comments.js";
import searchRoutes from "../routes/search.js";
import notificationRoutes from "../routes/notifications.js";
import likeRoutes from "../routes/likes.js";
import friendRoutes from "../routes/friends.js";
import replyRoutes from "../routes/reply.js";
import lastMessageRoutes from "../routes/lastMessage.js";
import repostRoutes from "../routes/reposts.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/assets", express.static(path.join(__dirname, "../public/assets")));
app.use(
  cors({
    origin: process.env.FRONTEND_LINK,
    methods: ["POST", "GET", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/search", searchRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/messages", messageRoutes);
app.use("/comments", commentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/likes", likeRoutes);
app.use("/friends", friendRoutes);
app.use("/replies", replyRoutes);
app.use("/lastMessages", lastMessageRoutes);
app.use("/reposts", repostRoutes);

export default app;
