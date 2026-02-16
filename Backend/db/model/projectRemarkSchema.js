const mongoose = require("mongoose");

const projectRemarkSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    teacherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherName: { type: String, required: true },
    teacherRole: { type: String, enum: ["faculty", "admin"], required: true },
    remark: { type: String, required: true, trim: true },
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProjectRemark", projectRemarkSchema);

