import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    firstName: { type: String, required: true },
    verified: { type: Boolean, default: false },
    edited: { type: Boolean, default: false },
    pinned: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    description: { type: String, maxlength: 2000 },
    lastName: String,
    location: String,
    userPicturePath: String,
    picturePath: String,
    textAddition: Object,
  },
  { timestamps: true }
);

const Post = mongoose.model("post", postSchema);

export default Post;
