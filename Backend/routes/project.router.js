const express = require("express");
const multer = require("multer");
const router = express.Router();

const Project = require("../db/model/projectSchema");
const buildQueue = require("../queue/buildQueue");
const { runProject } = require("../services/runProject");
const { stopProject } = require("../services/stopProject");
const { getProjectServices } = require("../services/projectStatus");

const { auth, checkRole } = require("../middleware/authMiddleware");
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management and deployment
 */

 
/* =====================================================
   1️⃣ PUBLIC ROUTES
===================================================== */

/**
 * @swagger
 * /api/project/all:
 *   get:
 *     summary: Get all projects (public)
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: List of all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Project"
 */
router.get("/all", async (req, res) => {
  const projects = await Project.find().sort({ createdDate: -1 });
  res.json(projects);
});


/**
 * @swagger
 * /api/project/details/{id}:
 *   get:
 *     summary: Get single project details
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Project ID (MongoDB ObjectId)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Project"
 *       404:
 *         description: Project not found
 */
router.get("/details/:id", async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  res.json(project);
});


/**
 * @swagger
 * /api/project/status/{id}:
 *   get:
 *     summary: Get running container/services of a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Running Docker services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projectId:
 *                   type: string
 *                 count:
 *                   type: number
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ContainerService"
 */
router.get("/status/:id", async (req, res) => {
  try {
    const services = getProjectServices(req.params.id);
    res.json({ projectId: req.params.id, services, count: services.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   2️⃣ STUDENT + FACULTY + ADMIN
===================================================== */

/**
 * @swagger
 * /api/project/upload:
 *   post:
 *     summary: Upload a project (ZIP or GitHub URL)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Students, faculty, and admin can upload source code for automated build.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: "#/components/schemas/ProjectUploadRequest"
 *           encoding:
 *             file:
 *               contentType: application/zip
 *     responses:
 *       200:
 *         description: Build queued successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Build queued successfully
 *               projectId: "67a3ff21abcd00122321abcd"
 *       400:
 *         description: Missing ZIP or GitHub URL
 *       500:
 *         description: Internal server error
 */
router.post(
  "/upload",
  auth,
  checkRole(["student", "faculty", "admin"]),
  upload.single("file"),
  async (req, res) => {
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
        { attempts: 3, backoff: 5000, removeOnComplete: true, removeOnFail: false }
      );

      res.status(200).json({
        message: "Build queued successfully",
        projectId: project._id
      });

    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);


/* =====================================================
   3️⃣ FACULTY + ADMIN
===================================================== */

/**
 * @swagger
 * /api/project/run/{id}:
 *   post:
 *     summary: Start project container (faculty/admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project started
 *         content:
 *           application/json:
 *             example:
 *               message: Project started
 *               url: "http://localhost:8083"
 *       403:
 *         description: Forbidden — role not allowed
 *       500:
 *         description: Start failed
 */
router.post(
  "/run/:id",
  auth,
  checkRole(["faculty", "admin"]),
  async (req, res) => {
    try {
      const url = await runProject(req.params.id);
      res.json({ message: "Project started", url });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


/**
 * @swagger
 * /api/project/stop/{id}:
 *   post:
 *     summary: Stop running project container (faculty/admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project stopped
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Stop failed
 */
router.post(
  "/stop/:id",
  auth,
  checkRole(["faculty", "admin"]),
  async (req, res) => {
    try {
      await stopProject(req.params.id);
      res.json({ message: "Project stopped" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


/* =====================================================
   4️⃣ ADMIN ONLY
===================================================== */

/**
 * @swagger
 * /api/project/delete/{id}:
 *   delete:
 *     summary: Delete a project (admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       404:
 *         description: Project not found
 *       403:
 *         description: Forbidden
 */
router.delete(
  "/delete/:id",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  }
);


module.exports = router;
