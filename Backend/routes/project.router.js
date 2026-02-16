const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const Project = require("../db/model/projectSchema");
const buildQueue = require("../queue/buildQueue");
const { runProject } = require("../services/runProject");
const { stopProject } = require("../services/stopProject");
const { getProjectServices } = require("../services/projectStatus");
const { enforceUploadQuota, enforceRunQuota } = require("../services/quotaService");
const { gcsEnabled, uploadFileToGcs, materializeProjectMedia } = require("../services/gcsMediaService");

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
  const withMediaUrls = await Promise.all(projects.map((project) => materializeProjectMedia(project)));
  res.json(withMediaUrls);
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
  const withMediaUrls = await materializeProjectMedia(project);
  res.json(withMediaUrls);
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
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "projectImages", maxCount: 12 },
    { name: "projectVideo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const tokenProfile = {
        studentName: req.user.name || "",
        regNumber: req.user.regNumber || "",
        batch: req.user.batch || "",
        course: req.user.course || "",
      };

      if (!tokenProfile.studentName || !tokenProfile.regNumber || !tokenProfile.course) {
        return res.status(400).json({
          error: "User profile missing name/regNumber/course. Update profile claims and re-login.",
        });
      }

      const {
        projectTag,
        projectTitle,
        description,
        githubUrl,
        technologiesUsed
      } = req.body;

      const zipFile = req.files?.file?.[0];
      const imageFiles = req.files?.projectImages || [];
      const videoFile = req.files?.projectVideo?.[0];
      let sourceType, sourcePathOrUrl;
      const normalizedGithubUrl = githubUrl?.trim();

      if (normalizedGithubUrl && zipFile) {
        return res.status(400).json({
          message: "Provide either GitHub URL or ZIP file, not both",
        });
      }

      if (normalizedGithubUrl) {
        sourceType = "github";
        sourcePathOrUrl = normalizedGithubUrl;
      } else if (zipFile) {
        sourceType = "zip";
        sourcePathOrUrl = zipFile.path;
      } else {
        return res.status(400).json({ message: "Upload ZIP or GitHub URL" });
      }

      await enforceUploadQuota({
        userId: req.user.id,
        role: req.user.role,
        sourceType,
        zipSizeBytes: zipFile?.size || 0,
      });

      const useGcs = gcsEnabled();
      const imageUrls = [];
      for (const file of imageFiles) {
        if (useGcs) {
          const objectName = `projects/${tokenProfile.course?.toLowerCase?.() || "general"}/${req.user.id}/${Date.now()}-${file.originalname}`;
          const gcsUri = await uploadFileToGcs(file.path, objectName, file.mimetype);
          imageUrls.push(gcsUri);
        } else {
          const normalized = file.path.replace(/\\/g, "/");
          const relativePath = normalized.startsWith("uploads/")
            ? normalized.slice("uploads/".length)
            : path.basename(normalized);
          imageUrls.push(`${req.protocol}://${req.get("host")}/uploads/${relativePath}`);
        }
      }

      let demoVideo = "";
      if (videoFile) {
        if (useGcs) {
          const objectName = `projects/${tokenProfile.course?.toLowerCase?.() || "general"}/${req.user.id}/${Date.now()}-${videoFile.originalname}`;
          demoVideo = await uploadFileToGcs(videoFile.path, objectName, videoFile.mimetype);
        } else {
          const normalized = videoFile.path.replace(/\\/g, "/");
          const relativePath = normalized.startsWith("uploads/")
            ? normalized.slice("uploads/".length)
            : path.basename(normalized);
          demoVideo = `${req.protocol}://${req.get("host")}/uploads/${relativePath}`;
        }
      }

      if (useGcs) {
        for (const mediaFile of [...imageFiles, ...(videoFile ? [videoFile] : [])]) {
          if (mediaFile.path && fs.existsSync(mediaFile.path)) {
            fs.unlinkSync(mediaFile.path);
          }
        }
      }

      const project = await Project.create({
        studentName: tokenProfile.studentName,
        regNumber: tokenProfile.regNumber,
        batch: tokenProfile.batch,
        course: tokenProfile.course?.toUpperCase?.() || tokenProfile.course,
        projectTag: projectTag?.trim() || "General",
        projectTitle,
        longDescription: description,
        technologiesUsed: technologiesUsed
          ? technologiesUsed.split(",").map((tech) => tech.trim()).filter(Boolean)
          : [],
        githubUrl: normalizedGithubUrl,
        ownerUserId: req.user.id,
        sourceType,
        sourcePathOrUrl,
        images: imageUrls,
        demoVideo,
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
      const allFiles = [
        ...(req.files?.file || []),
        ...(req.files?.projectImages || []),
        ...(req.files?.projectVideo || []),
      ];
      for (const file of allFiles) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
      console.error("Upload error:", err);
      res.status(err.statusCode || 500).json({ error: err.message });
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
  checkRole(["student", "faculty", "admin"]),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id).select("ownerUserId");
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const isOwner =
        project.ownerUserId &&
        String(project.ownerUserId) === String(req.user.id);
      const canManage = req.user.role === "admin" || req.user.role === "faculty" || isOwner;

      if (!canManage) {
        return res.status(403).json({ error: "You can only start your own project" });
      }

      await enforceRunQuota({
        projectId: req.params.id,
        role: req.user.role,
      });

      const url = await runProject(req.params.id, req.user.role);
      res.json({ message: "Project started", url });
    } catch (err) {
      res.status(err.statusCode || 500).json({ error: err.message });
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
  checkRole(["student", "faculty", "admin"]),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id).select("ownerUserId");
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const isOwner =
        project.ownerUserId &&
        String(project.ownerUserId) === String(req.user.id);
      const canManage = req.user.role === "admin" || req.user.role === "faculty" || isOwner;

      if (!canManage) {
        return res.status(403).json({ error: "You can only stop your own project" });
      }

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
