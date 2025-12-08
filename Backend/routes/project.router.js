const express = require("express");
const multer = require("multer");
const router = express.Router();

const Project = require("../db/model/projectSchema");
const buildQueue = require("../queue/buildQueue");

const { runProject } = require("../services/runProject");
const { stopProject } = require("../services/stopProject");

const upload = multer({ dest: "uploads/" });


// =====================================================
// 1️⃣ UPLOAD PROJECT
// =====================================================
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const {
      studentName,
      regNumber,
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
      return res.status(400).json({ message: "Upload ZIP or GitHub URL" });
    }

    const project = await Project.create({
      studentName,
      regNumber,
      projectTitle,
      longDescription: description,
      technologiesUsed: technologiesUsed?.split(",") ?? [],
      sourceType,
      sourcePathOrUrl,
      status: "queued",
      createdDate: new Date()
    });

    await buildQueue.add(
      { projectId: project._id, sourceType, sourcePathOrUrl },
      {
        attempts: 3,
        backoff: 5000,
        removeOnComplete: true,
        removeOnFail: false
      }
    );


    res.status(200).json({
      message: "Build queued successfully",
      projectId: project._id
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});



// =====================================================
// 2️⃣ GET ALL PROJECTS  (IMPORTANT: COMES BEFORE /:id)
// =====================================================
router.get("/all", async (req, res) => {
  const projects = await Project.find().sort({ createdDate: -1 });
  res.json(projects);
});



// =====================================================
// 3️⃣ GET PROJECT BY ID
// =====================================================
router.get("/details/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  res.json(project);
});

// =====================================================
// 3️⃣b GET RUNNING SERVICES / CONTAINERS (NEW)
// =====================================================
const { getProjectServices } = require("../services/projectStatus");

router.get("/status/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    const services = getProjectServices(projectId);

    res.json({
      projectId,
      services,
      count: services.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================================================
// 4️⃣ RUN PROJECT
// =====================================================
router.post("/run/:id", async (req, res) => {
  try {
    const url = await runProject(req.params.id);
    res.json({ message: "Project started", url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================================================
// 5️⃣ STOP PROJECT
// =====================================================
router.post("/stop/:id", async (req, res) => {
  try {
    await stopProject(req.params.id);
    res.json({ message: "Project stopped" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================================================
// 6️⃣ DELETE PROJECT
// =====================================================
router.delete("/delete/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  await project.deleteOne();
  res.json({ message: "Project deleted successfully" });
});


module.exports = router;
