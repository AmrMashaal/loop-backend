import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    postId: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user",required: true },
    edited: { type: Boolean, default: false },
    text: { type: String, default: "" },
    likesCount: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    picturePath: String,
  },
  { timestamps: true }
);

const Comment = mongoose.model("comment", commentSchema);

export default Comment;
