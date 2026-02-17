const mongoose = require("mongoose");

const projectCommentSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    authorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: { type: String, required: true },
    authorRole: {
      type: String,
      enum: ["viewer", "student", "faculty", "admin"],
      required: true,
    },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectComment", projectCommentSchema);

