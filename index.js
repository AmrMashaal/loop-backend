import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import app from "./api/index.js";
import { initSocket } from "./utils/socket.js";

const server = http.createServer(app);

const PORT = process.env.PORT || 6001;

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_LINK,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

initSocket(io);

const serverConnection = async () => {
  try {
    mongoose.connect(process.env.MONGODB_KEY);

    server.listen(PORT, () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`Server listening on port ${PORT}...`);
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.log(err.message);
    }
  }
};

serverConnection();
