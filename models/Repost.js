import mongoose from "mongoose";

const RepostSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    likesCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    privacy: { type: String, default: "public" },
    pinned: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const Repost = mongoose.model("repost", RepostSchema);

export default Repost;
