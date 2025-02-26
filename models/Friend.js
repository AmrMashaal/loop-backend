import mongoose from "mongoose";

const { Schema } = mongoose;

const friendSchema = new mongoose.Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "user", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "user", required: true },
    status: { type: String, enum: ["pending", "accepted"], required: true },
  },
  { timestamps: true }
);

const Friend = mongoose.model("Friend", friendSchema);

export default Friend;
