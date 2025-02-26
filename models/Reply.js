import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
    },
    likesCount: { type: Number, default: 0 },
    reply: String,
    picturePath: String,
    edited: Boolean,
  },
  { timestamps: true }
);

const Reply = mongoose.model("reply", replySchema);

export default Reply;
