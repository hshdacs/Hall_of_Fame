const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const router = express.Router();

const Project = require("../db/model/projectSchema");
const ProjectRemark = require("../db/model/projectRemarkSchema");
const ProjectComment = require("../db/model/projectCommentSchema");
const User = require("../db/model/userSchema");
const buildQueue = require("../queue/buildQueue");
const { runProject } = require("../services/runProject");
const { stopProject } = require("../services/stopProject");
const { getProjectServices } = require("../services/projectStatus");
const { enforceUploadQuota, enforceRunQuota } = require("../services/quotaService");
const { gcsEnabled, uploadFileToGcs, materializeProjectMedia } = require("../services/gcsMediaService");

const { auth, checkRole } = require("../middleware/authMiddleware");
const upload = multer({ dest: "uploads/" });

const isValidGithubRepoUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(String(value).trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!["http:", "https:"].includes(parsed.protocol) || host !== "github.com") {
      return false;
    }
    if (parsed.search || parsed.hash) return false;

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length !== 2) return false;

    const [owner, rawRepo] = segments;
    const repo = rawRepo.endsWith(".git") ? rawRepo.slice(0, -4) : rawRepo;
    const partRegex = /^[A-Za-z0-9._-]+$/;
    return Boolean(owner && repo && partRegex.test(owner) && partRegex.test(repo));
  } catch (_err) {
    return false;
  }
};

const normalizeUpper = (value) => String(value || "").trim().toUpperCase();

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
  try {
    const query = { status: { $in: ["ready", "running", "stopped"] } };
    const pageRaw = Number.parseInt(req.query.page, 10);
    const limitRaw = Number.parseInt(req.query.limit, 10);
    const hasPagination = Number.isFinite(pageRaw) || Number.isFinite(limitRaw);

    if (!hasPagination) {
      const projects = await Project.find(query).sort({ createdDate: -1 });
      const withMediaUrls = await Promise.all(
        projects.map((project) => materializeProjectMedia(project))
      );
      return res.json(withMediaUrls);
    }

    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 50) : 12;
    const total = await Project.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const projects = await Project.find(query)
      .sort({ createdDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const items = await Promise.all(projects.map((project) => materializeProjectMedia(project)));
    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
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

/**
 * @swagger
 * /api/project/{id}/remarks:
 *   get:
 *     summary: List project remarks
 *     tags: [Projects]
 */
router.get(
  "/:id/remarks",
  auth,
  checkRole(["student", "faculty", "admin"]),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id).select("ownerUserId");
      if (!project) return res.status(404).json({ error: "Project not found" });

      const isOwner =
        project.ownerUserId &&
        String(project.ownerUserId) === String(req.user.id);
      const isTeacher = req.user.role === "faculty" || req.user.role === "admin";

      if (!isTeacher && !isOwner) {
        return res.status(403).json({ error: "Only project owner can view remarks" });
      }

      const query = { projectId: req.params.id };
      if (!isTeacher) query.isPublished = true;

      const remarks = await ProjectRemark.find(query).sort({ createdAt: -1 });
      res.json(remarks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/:id/remarks",
  auth,
  checkRole(["faculty", "admin"]),
  async (req, res) => {
    try {
      const { remark, isPublished } = req.body;
      if (!remark?.trim()) {
        return res.status(400).json({ error: "Remark is required" });
      }

      const project = await Project.findById(req.params.id).select("_id");
      if (!project) return res.status(404).json({ error: "Project not found" });

      const saved = await ProjectRemark.create({
        projectId: project._id,
        teacherUserId: req.user.id,
        teacherName: req.user.name || req.user.email || "Teacher",
        teacherRole: req.user.role,
        remark: remark.trim(),
        isPublished: Boolean(isPublished),
      });

      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.patch(
  "/remarks/:remarkId/publish",
  auth,
  checkRole(["faculty", "admin"]),
  async (req, res) => {
    try {
      const { isPublished } = req.body;
      const remark = await ProjectRemark.findById(req.params.remarkId);
      if (!remark) return res.status(404).json({ error: "Remark not found" });

      const isCreator = String(remark.teacherUserId) === String(req.user.id);
      if (req.user.role !== "admin" && !isCreator) {
        return res.status(403).json({ error: "Only remark creator/admin can publish" });
      }

      remark.isPublished = Boolean(isPublished);
      await remark.save();

      res.json(remark);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/:id/comments", async (req, res) => {
  try {
    const comments = await ProjectComment.find({ projectId: req.params.id }).sort({
      createdAt: -1,
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/:id/comments",
  auth,
  checkRole(["viewer", "student", "faculty", "admin"]),
  async (req, res) => {
    try {
      const { comment } = req.body;
      if (!comment?.trim()) {
        return res.status(400).json({ error: "Comment is required" });
      }

      const project = await Project.findById(req.params.id).select("_id");
      if (!project) return res.status(404).json({ error: "Project not found" });

      const saved = await ProjectComment.create({
        projectId: project._id,
        authorUserId: req.user.id,
        authorName: req.user.name || req.user.email || "User",
        authorRole: req.user.role,
        comment: comment.trim(),
      });

      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);


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
    { name: "resourceDocs", maxCount: 12 },
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
        documentation,
        resourceLinks,
        teamMembers,
        githubUrl,
        technologiesUsed
      } = req.body;

      const zipFile = req.files?.file?.[0];
      const imageFiles = req.files?.projectImages || [];
      const videoFile = req.files?.projectVideo?.[0];
      const resourceDocFiles = req.files?.resourceDocs || [];
      let sourceType, sourcePathOrUrl;
      const normalizedGithubUrl = githubUrl?.trim();

      if (normalizedGithubUrl && zipFile) {
        return res.status(400).json({
          message: "Provide either GitHub URL or ZIP file, not both",
        });
      }

      if (normalizedGithubUrl && !isValidGithubRepoUrl(normalizedGithubUrl)) {
        return res.status(400).json({
          message: "Invalid GitHub URL. Use format: https://github.com/owner/repo",
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

      const resourceFileUrls = [];
      for (const file of resourceDocFiles) {
        if (useGcs) {
          const objectName = `projects/${tokenProfile.course?.toLowerCase?.() || "general"}/${req.user.id}/resources/${Date.now()}-${file.originalname}`;
          const gcsUri = await uploadFileToGcs(file.path, objectName, file.mimetype);
          resourceFileUrls.push(gcsUri);
        } else {
          const normalized = file.path.replace(/\\/g, "/");
          const relativePath = normalized.startsWith("uploads/")
            ? normalized.slice("uploads/".length)
            : path.basename(normalized);
          resourceFileUrls.push(`${req.protocol}://${req.get("host")}/uploads/${relativePath}`);
        }
      }

      let parsedTeamMembers = [];
      if (teamMembers) {
        try {
          const parsed = JSON.parse(teamMembers);
          if (Array.isArray(parsed)) {
            parsedTeamMembers = parsed
              .filter((m) => m && (m.email || m.userId))
              .map((m) => ({
                userId: m.userId || undefined,
                name: m.name || "",
                email: m.email || "",
                regNumber: m.regNumber || "",
                batch: m.batch || "",
                course: m.course || "",
              }));
          }
        } catch (_err) {
          return res.status(400).json({ error: "Invalid teamMembers format" });
        }
      }

      const uploaderCourse = normalizeUpper(tokenProfile.course);
      const uploaderBatch = String(tokenProfile.batch || "").trim();
      const seenKeys = new Set();
      const lookupOr = [];
      parsedTeamMembers.forEach((member) => {
        const emailKey = String(member.email || "").trim().toLowerCase();
        const userIdKey = String(member.userId || "").trim();
        const key = emailKey || userIdKey;
        if (!key || seenKeys.has(key)) return;
        seenKeys.add(key);
        if (emailKey) lookupOr.push({ email: emailKey });
        if (userIdKey && mongoose.Types.ObjectId.isValid(userIdKey)) {
          lookupOr.push({ _id: userIdKey });
        }
      });

      let validatedTeamMembers = [];
      if (lookupOr.length > 0) {
        const studentUsers = await User.find({ role: "student", $or: lookupOr }).select(
          "_id name email regNumber batch course"
        );
        const byEmail = new Map(
          studentUsers.map((user) => [String(user.email || "").toLowerCase(), user])
        );
        const byId = new Map(studentUsers.map((user) => [String(user._id), user]));
        const teamErrors = [];

        for (const member of parsedTeamMembers) {
          const email = String(member.email || "").trim().toLowerCase();
          const userId = String(member.userId || "").trim();
          const matchedUser = (email && byEmail.get(email)) || (userId && byId.get(userId));

          if (!matchedUser) {
            teamErrors.push(`${member.email || member.name || "Unknown member"} is not a valid student user`);
            continue;
          }

          const memberCourse = normalizeUpper(matchedUser.course);
          const memberBatch = String(matchedUser.batch || "").trim();

          if (uploaderCourse && memberCourse !== uploaderCourse) {
            teamErrors.push(`${matchedUser.email} must be from course ${uploaderCourse}`);
            continue;
          }

          if (uploaderBatch && memberBatch !== uploaderBatch) {
            teamErrors.push(`${matchedUser.email} must be from batch ${uploaderBatch}`);
            continue;
          }

          const dedupeKey = String(matchedUser.email || "").toLowerCase();
          if (validatedTeamMembers.some((item) => String(item.email || "").toLowerCase() === dedupeKey)) {
            continue;
          }

          validatedTeamMembers.push({
            userId: matchedUser._id,
            name: matchedUser.name || "",
            email: matchedUser.email || "",
            regNumber: matchedUser.regNumber || "",
            batch: matchedUser.batch || "",
            course: matchedUser.course || "",
          });
        }

        if (teamErrors.length > 0) {
          return res.status(400).json({ error: "Invalid teammates", details: teamErrors });
        }
      }

      const parsedResourceLinks = (resourceLinks || "")
        .split(/\r?\n|,/)
        .map((link) => link.trim())
        .filter(Boolean);

      const ownerIncluded = validatedTeamMembers.some(
        (member) =>
          member.email &&
          String(member.email).toLowerCase() === String(req.user.email || "").toLowerCase()
      );
      if (!ownerIncluded) {
        validatedTeamMembers.unshift({
          userId: req.user.id,
          name: tokenProfile.studentName,
          email: req.user.email || "",
          regNumber: tokenProfile.regNumber || "",
          batch: tokenProfile.batch || "",
          course: tokenProfile.course || "",
        });
      }

      if (useGcs) {
        for (const mediaFile of [
          ...imageFiles,
          ...(videoFile ? [videoFile] : []),
          ...resourceDocFiles,
        ]) {
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
        documentation: documentation?.trim() || "",
        teamMembers: validatedTeamMembers,
        resourceLinks: parsedResourceLinks,
        resourceFiles: resourceFileUrls,
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
        ...(req.files?.resourceDocs || []),
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
