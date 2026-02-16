const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  // 🧑‍🎓 Student Information
  studentName: { type: String, required: true },
  regNumber: { type: String, required: true },
  batch: { type: String },
  course: { type: String },

  // 🎓 SRH Metadata
  school: { type: String },
  studyProgramme: { type: String },
  yearOfBatch: { type: Number },
  faculty: { type: String },

  // 📁 Project Metadata
  projectTitle: { type: String, required: true },
  projectTag: { type: String },
  longDescription: { type: String },
  githubUrl: { type: String },
  sourceType: { type: String }, // github | zip
  sourcePathOrUrl: { type: String },
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

  // 🐳 Deployment & Build Info
  imageTag: { type: String },          // NEW
  containerName: { type: String },     // NEW
  hostPort: { type: Number },          // NEW
  internalPort: { type: Number },      // NEW (default 80)
  
  url: { type: String },

   // 🧩 docker-compose specific fields (MISSING EARLIER)
  frontendService: { type: String },   // NEW → required by runProject.js
  frontendPort: { type: Number },     // NEW → required by runProject.js

  status: {
    type: String,
    enum: [
      "queued",
      "building",
      "ready",
      "running",
      "stopped",
      "failed",
      "build_failed"
    ],
    default: "queued",
  },

  // 🧾 Logs
  logs: {
    build: { type: String, default: "" },
    deploy: { type: String, default: "" },
  },

  // 🕒 Audit
  createdDate: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // 🧠 Image carousel for frontend
  images: [{ type: String }],
  demoVideo: { type: String },
  technologiesUsed: [{ type: String }],

  // 🧩 Build History
  buildHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      status: { type: String },
      message: { type: String }
    },
  ],

  startHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      startedByRole: { type: String },
    },
  ],
});

module.exports = mongoose.model("Project", projectSchema);
