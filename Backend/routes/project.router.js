// routes/project.router.js
const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const { exec } = require("child_process");
const Docker = require("dockerode");
const docker = new Docker();

const Project = require("../db/model/projectSchema.js");
const Configuration = require("../db/model/configSchema.js");
const { buildAndDeployProject } = require("../services/buildService"); // ✅ import build service

const router = express.Router();
const logger = console; // Replace with winston later if needed

// ==============================
// 📦 Multer File Upload Setup
// ==============================
const upload = multer({ dest: "uploads/" });

// ==============================
// ⚙️ Helper Functions
// ==============================
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const getProjectConfig = async (projectId) => {
  const objectId = new mongoose.Types.ObjectId(projectId);
  const config = await Configuration.findOne({ projectId: objectId });

  if (!config) throw new Error("Configuration not found for project.");
  if (!config.serviceName || config.serviceName.length === 0)
    throw new Error("No services configured for this project.");

  return config.serviceName;
};

// ==============================
// 🚀 Upload + Auto Build/Deploy
// ==============================
const buildQueue = require("../queue/buildQueue"); // ✅ Import queue at top

router.post(
  "/upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    try {
      const {
        githubUrl,
        projectTitle,
        description,
        studentName,
        regNumber,
        batch,
        course,
      } = req.body;

      let sourceType, sourcePathOrUrl;

      if (req.file) {
        sourceType = "zip";
        sourcePathOrUrl = req.file.path;
      } else if (githubUrl) {
        sourceType = "github";
        sourcePathOrUrl = githubUrl;
      } else {
        return res
          .status(400)
          .json({ message: "Please upload a ZIP file or provide a GitHub URL" });
      }

      // 🧩 Check for existing project
      let project = await Project.findOne({ regNumber });

      if (project) {
        project.projectTitle = projectTitle;
        project.longDescription = description;
        project.sourceType = sourceType;
        project.sourcePathOrUrl = sourcePathOrUrl;
        project.status = "queued";
        project.createdDate = new Date();
        await project.save();
      } else {
        project = await Project.create({
          studentName,
          regNumber,
          batch,
          course,
          projectTitle,
          longDescription: description,
          sourceType,
          sourcePathOrUrl,
          status: "queued",
          createdDate: new Date(),
        });
      }

      // 🕒 Instead of running directly, queue the build in Redis
      await buildQueue.add({
        projectId: project._id,
        sourceType,
        sourcePathOrUrl,
      });

      res.status(202).json({
        message: "🕒 Build job queued successfully.",
        projectId: project._id,
      });
    } catch (err) {
      logger.error("❌ Upload error:", err);
      res
        .status(500)
        .json({ message: "Internal Server Error", error: err.message });
    }
  })
);


// ==============================
// 🧩 CRUD ROUTES
// ==============================

// Get all projects (with optional filters)
router.get(
  "/projects",
  asyncHandler(async (req, res) => {
    const filters = {};
    const { school, studyProgramme, yearOfBatch, faculty } = req.query;
    if (school) filters.school = school;
    if (studyProgramme) filters.studyProgramme = studyProgramme;
    if (yearOfBatch) filters.yearOfBatch = yearOfBatch;
    if (faculty) filters.faculty = faculty;

    const projects = await Project.find(filters);
    res.json(projects);
  })
);

// Get one project by ID
router.get(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ message: "Project not found" });
    res.json(project);
  })
);

// Create project manually
router.post(
  "/projects",
  asyncHandler(async (req, res) => {
    const project = new Project(req.body);
    const saved = await project.save();
    res.status(201).json(saved);
  })
);

// Update project
router.patch(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ message: "Project not found" });

    Object.assign(project, req.body);
    const updated = await project.save();
    res.json(updated);
  })
);

// Delete project
router.delete(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res.status(404).json({ message: "Project not found" });

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  })
);

// ==============================
// 🎯 Filter Dropdown Data
// ==============================
router.get(
  "/filter-options",
  asyncHandler(async (req, res) => {
    const schools = await Project.distinct("school");
    const studyProgrammes = await Project.distinct("studyProgramme");
    const yearsOfBatch = await Project.distinct("yearOfBatch");
    const faculties = await Project.distinct("faculty");

    res.json({ schools, studyProgrammes, yearsOfBatch, faculties });
  })
);

// ==============================
// 🐳 DOCKER START / STOP ROUTES
// ==============================
const projectRoot = path.resolve(__dirname, "../../");

// Start Docker container(s)
router.post(
  "/projects/:id/start",
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const services = await getProjectConfig(projectId);

    await Promise.all(
      services.map((service) => {
        const safeName = service.name.replace(/[^a-zA-Z0-9-_]/g, "");
        return new Promise((resolve, reject) => {
          exec(
            `docker-compose up -d ${safeName}`,
            { cwd: projectRoot },
            (error) => {
              if (error) {
                logger.error(
                  `❌ Failed to start service ${safeName}: ${error.message}`
                );
                reject(error);
              } else {
                logger.info(`✅ Started service ${safeName}`);
                resolve();
              }
            }
          );
        });
      })
    );

    const frontend = services.find((s) => s.type === "frontend");
    if (!frontend)
      return res.status(400).json({ error: "No frontend service found." });

    const url = `http://localhost:${frontend.port}`;
    res.status(200).json({
      message: "Project started successfully.",
      projectUrl: url,
    });
  })
);

// Stop Docker container(s)
router.post(
  "/projects/:id/stop",
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const services = await getProjectConfig(projectId);

    await Promise.all(
      services.map((service) => {
        const safeName = service.name.replace(/[^a-zA-Z0-9-_]/g, "");
        return new Promise((resolve) => {
          exec(
            `docker-compose down ${safeName}`,
            { cwd: projectRoot },
            (error) => {
              if (error) {
                logger.error(
                  `❌ Error stopping service ${safeName}: ${error.message}`
                );
              } else {
                logger.info(`🛑 Stopped service ${safeName}`);
              }
              resolve();
            }
          );
        });
      })
    );

    res.status(200).json({ message: "Project stopped successfully." });
  })
);

// ==============================
// 🧾 Save Configuration (Optional)
// ==============================
router.post(
  "/config",
  asyncHandler(async (req, res) => {
    const { projects } = req.body;
    if (!projects || !Array.isArray(projects)) {
      return res.status(400).json({ error: "Invalid configuration format." });
    }

    const configurations = projects.map((project) => ({
      projectId: new mongoose.Types.ObjectId(project.projectId),
      serviceName: project.serviceName.map((service) => ({
        name: service.name,
        dockerFile: service.dockerFile,
        port: service.port,
        type: service.type,
      })),
      dockerFiles: project.dockerFiles.map((file) => ({
        fileName: file.fileName,
        content: file.content,
      })),
    }));

    await Configuration.insertMany(configurations);
    res.status(200).json({ message: "Configurations stored successfully." });
  })
);

// ==============================
// 🚨 Global Error Handler
// ==============================
router.use((err, req, res, next) => {
  logger.error(`❌ ${err.message}`);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

module.exports = router;
