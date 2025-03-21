import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    criteria: { type: String, required: true },
    level: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "post",
        "comment",
        "like",
        "friend",
        "reply",
        "share",
        "firstUsers",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

const Badge = mongoose.model("badge", badgeSchema);

export default Badge;
