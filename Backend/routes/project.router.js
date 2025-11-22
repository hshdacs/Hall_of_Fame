const express = require("express");
const multer = require("multer");
const router = express.Router();

const Project = require("../db/model/projectSchema");
const buildQueue = require("../queue/buildQueue");

const { runProject } = require("../services/runProject");
const { stopProject } = require("../services/stopProject");

const upload = multer({ dest: "uploads/" });

// =====================================================
// 1️⃣ STUDENT PROJECT UPLOAD  (AUTO-BUILD + AUTO-RUN FIRST TIME)
// =====================================================
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const {
      studentName,
      regNumber,
      batch,
      course,
      school,
      studyProgramme,
      yearOfBatch,
      faculty,
      projectTitle,
      description,
      githubUrl,
      technologiesUsed
    } = req.body;

    let sourceType, sourcePathOrUrl;

    if (githubUrl) {
      sourceType = "github";
      sourcePathOrUrl = githubUrl;
    } else if (req.file) {
      sourceType = "zip";
      sourcePathOrUrl = req.file.path;
    } else {
      return res
        .status(400)
        .json({ message: "Upload ZIP or provide GitHub URL" });
    }

    // Create project entry
    const project = await Project.create({
      studentName,
      regNumber,
      batch,
      course,
      school,
      studyProgramme,
      yearOfBatch,
      faculty,
      projectTitle,
      longDescription: description,
      technologiesUsed: technologiesUsed?.split(",") ?? [],
      sourceType,
      sourcePathOrUrl,
      status: "queued",
      createdDate: new Date()
    });

    // Queue build job
    await buildQueue.add({
      projectId: project._id,
      sourceType,
      sourcePathOrUrl
    });

    res.status(200).json({
      message: "Build & deploy queued successfully",
      projectId: project._id
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// 2️⃣ GET ALL PROJECTS (Professor Dashboard)
// =====================================================
router.get("/", async (req, res) => {
  const projects = await Project.find().sort({ createdDate: -1 });
  res.json(projects);
});

// =====================================================
// 3️⃣ GET PROJECT BY ID (Project Detail Page)
// =====================================================
router.get("/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  res.json(project);
});

// =====================================================
// 4️⃣ PROFESSOR: RUN PROJECT (Only if stopped)
// =====================================================
router.post("/:id/run", async (req, res) => {
  try {
    const url = await runProject(req.params.id);
    res.json({ message: "Project started", url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// 5️⃣ PROFESSOR: STOP PROJECT (Only if running)
// =====================================================
router.post("/:id/stop", async (req, res) => {
  try {
    await stopProject(req.params.id);
    res.json({ message: "Project stopped" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================================================
// 6️⃣ DELETE PROJECT (Optional)
// =====================================================
router.delete("/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  await project.deleteOne();
  res.json({ message: "Project deleted successfully" });
});

module.exports = router;
