const express = require("express");
const router = express.Router();

const { auth, checkRole } = require("../middleware/authMiddleware");
const {
  getRoleLimitsForApi,
  getUserQuotaUsage,
  getUserQuotaSummary,
  getProjectQuotaUsage,
  getQuotaOverview,
} = require("../services/quotaService");

router.use(auth, checkRole(["admin"]));

router.get("/quotas/limits", async (_req, res) => {
  try {
    res.json({
      student: getRoleLimitsForApi("student"),
      faculty: getRoleLimitsForApi("faculty"),
      admin: getRoleLimitsForApi("admin"),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/quotas/users/:userId/usage", async (req, res) => {
  try {
    const usage = await getUserQuotaUsage(req.params.userId);
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/quotas/users/:userId/summary", async (req, res) => {
  try {
    const summary = await getUserQuotaSummary(req.params.userId);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/quotas/projects/:projectId/usage", async (req, res) => {
  try {
    const usage = await getProjectQuotaUsage(req.params.projectId);
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/quotas/overview", async (req, res) => {
  try {
    const coursesParam = req.query.courses;
    const courses = Array.isArray(coursesParam)
      ? coursesParam
      : typeof coursesParam === "string"
        ? coursesParam.split(",").map((item) => item.trim()).filter(Boolean)
        : ["ACS", "ADS"];

    const overview = await getQuotaOverview(courses);
    res.json(overview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
