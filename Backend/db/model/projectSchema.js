const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  // 🧑‍🎓 Student Information
  studentName: { type: String, required: true },
  regNumber: { type: String, required: true, unique: false },
  batch: { type: String },
  course: { type: String },

  // 🎓 University Metadata (SRH fields)
  school: { type: String },
  studyProgramme: { type: String },
  yearOfBatch: { type: Number },
  faculty: { type: String },

  // 📁 Project Metadata
  projectTitle: { type: String, required: true },
  longDescription: { type: String },
  githubUrl: { type: String },
  sourceType: { type: String },
  sourcePathOrUrl: { type: String },

  // 🐳 Deployment & Build Info
  imageName: { type: String },
  containerId: { type: String },
  port: { type: Number },
  url: { type: String },
  status: {
    type: String,
    enum: ["queued", "running", "failed", "stopped", "build_failed"],
    default: "queued",
  },

  // 🧾 Build Logs
  logs: {
    build: { type: String, default: "" },
    deploy: { type: String, default: "" },
  },

  // 🕒 Audit Fields
  createdDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // 🧠 Optional: frontend-related fields
  images: [{ type: String }],
  technologiesUsed: [{ type: String }],

  // 🧩 Future: Track rebuild history
  buildHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      status: { type: String },
      message: { type: String },
    },
  ],
});

module.exports = mongoose.model("Project", projectSchema);
