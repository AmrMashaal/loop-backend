import mongoose from "mongoose";

const lastMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    message: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const LastMessage = mongoose.model("lastMessage", lastMessageSchema);

export default LastMessage;
