import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "post" },
  repostId: { type: mongoose.Schema.Types.ObjectId, ref: "repost" },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: "comment" },
  replyId: { type: mongoose.Schema.Types.ObjectId, ref: "reply" },
});

const Like = mongoose.model("like", likeSchema);

export default Like;
