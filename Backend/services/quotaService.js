const Project = require("../db/model/projectSchema");
const User = require("../db/model/userSchema");

class QuotaError extends Error {
  constructor(message) {
    super(message);
    this.name = "QuotaError";
    this.statusCode = 429;
  }
}

function readInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function getRoleLimits(role) {
  if (role === "admin") {
    return {
      uploadsPerDay: Number.MAX_SAFE_INTEGER,
      queuedBuilds: Number.MAX_SAFE_INTEGER,
      runningProjects: Number.MAX_SAFE_INTEGER,
      zipMaxBytes: Number.MAX_SAFE_INTEGER,
      projectStartsPerHour: Number.MAX_SAFE_INTEGER,
    };
  }

  if (role === "faculty") {
    return {
      uploadsPerDay: readInt("QUOTA_FACULTY_UPLOADS_PER_DAY", 30),
      queuedBuilds: readInt("QUOTA_FACULTY_QUEUED_BUILDS", 10),
      runningProjects: readInt("QUOTA_FACULTY_RUNNING_PROJECTS", 10),
      zipMaxBytes: readInt("QUOTA_FACULTY_ZIP_MAX_BYTES", 500 * 1024 * 1024),
      projectStartsPerHour: readInt("QUOTA_FACULTY_PROJECT_STARTS_PER_HOUR", 20),
    };
  }

  return {
    uploadsPerDay: readInt("QUOTA_STUDENT_UPLOADS_PER_DAY", 10),
    queuedBuilds: readInt("QUOTA_STUDENT_QUEUED_BUILDS", 3),
    runningProjects: readInt("QUOTA_STUDENT_RUNNING_PROJECTS", 2),
    zipMaxBytes: readInt("QUOTA_STUDENT_ZIP_MAX_BYTES", 200 * 1024 * 1024),
    projectStartsPerHour: readInt("QUOTA_STUDENT_PROJECT_STARTS_PER_HOUR", 6),
  };
}

async function enforceUploadQuota({ userId, role, sourceType, zipSizeBytes = 0 }) {
  if (!userId) return;

  const limits = getRoleLimits(role);

  if (sourceType === "zip" && zipSizeBytes > limits.zipMaxBytes) {
    throw new QuotaError("ZIP file is too large for your quota");
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [uploadsPerDay, queuedBuilds] = await Promise.all([
    Project.countDocuments({
      ownerUserId: userId,
      createdDate: { $gte: dayAgo },
    }),
    Project.countDocuments({
      ownerUserId: userId,
      status: { $in: ["queued", "building"] },
    }),
  ]);

  if (uploadsPerDay >= limits.uploadsPerDay) {
    throw new QuotaError("Daily upload quota exceeded");
  }

  if (queuedBuilds >= limits.queuedBuilds) {
    throw new QuotaError("Too many builds already queued/running for your account");
  }
}

async function enforceRunQuota({ projectId, role }) {
  const limits = getRoleLimits(role);
  const project = await Project.findById(projectId).select(
    "ownerUserId startHistory status"
  );

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.ownerUserId) {
    const runningCount = await Project.countDocuments({
      ownerUserId: project.ownerUserId,
      status: "running",
    });

    if (runningCount >= limits.runningProjects) {
      throw new QuotaError("Running project quota exceeded for this user");
    }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const startsLastHour = (project.startHistory || []).filter(
    (entry) => new Date(entry.timestamp) >= oneHourAgo
  ).length;

  if (startsLastHour >= limits.projectStartsPerHour) {
    throw new QuotaError("Project start quota exceeded for this hour");
  }

  return project;
}

function safeLimitValue(value) {
  if (!Number.isFinite(value) || value >= Number.MAX_SAFE_INTEGER / 10) {
    return null;
  }
  return value;
}

function getRoleLimitsForApi(role) {
  const limits = getRoleLimits(role);
  return {
    uploadsPerDay: safeLimitValue(limits.uploadsPerDay),
    queuedBuilds: safeLimitValue(limits.queuedBuilds),
    runningProjects: safeLimitValue(limits.runningProjects),
    zipMaxBytes: safeLimitValue(limits.zipMaxBytes),
    projectStartsPerHour: safeLimitValue(limits.projectStartsPerHour),
  };
}

async function getUserQuotaUsage(userId) {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [uploadsLast24h, queuedBuilds, buildingBuilds, runningProjects] =
    await Promise.all([
      Project.countDocuments({
        ownerUserId: userId,
        createdDate: { $gte: dayAgo },
      }),
      Project.countDocuments({
        ownerUserId: userId,
        status: "queued",
      }),
      Project.countDocuments({
        ownerUserId: userId,
        status: "building",
      }),
      Project.countDocuments({
        ownerUserId: userId,
        status: "running",
      }),
    ]);

  const projects = await Project.find({ ownerUserId: userId }).select(
    "_id projectTitle status startHistory createdDate course"
  );

  const perProjectStartsLastHour = projects.map((project) => ({
    projectId: String(project._id),
    projectTitle: project.projectTitle,
    startsLastHour: (project.startHistory || []).filter(
      (entry) => new Date(entry.timestamp) >= hourAgo
    ).length,
    status: project.status,
    course: project.course || null,
    createdDate: project.createdDate,
  }));

  const startsLastHourTotal = perProjectStartsLastHour.reduce(
    (sum, project) => sum + project.startsLastHour,
    0
  );

  return {
    uploadsLast24h,
    queuedBuilds,
    buildingBuilds,
    queuedOrBuilding: queuedBuilds + buildingBuilds,
    runningProjects,
    startsLastHourTotal,
    perProjectStartsLastHour,
  };
}

function getRemaining(limit, usage) {
  if (limit === null) return null;
  return Math.max(limit - usage, 0);
}

async function getUserQuotaSummary(userId) {
  const user = await User.findById(userId).select("name email role");
  if (!user) {
    throw new Error("User not found");
  }

  const limits = getRoleLimitsForApi(user.role);
  const usage = await getUserQuotaUsage(userId);

  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    limits,
    usage,
    remaining: {
      uploadsPerDay: getRemaining(limits.uploadsPerDay, usage.uploadsLast24h),
      queuedBuilds: getRemaining(limits.queuedBuilds, usage.queuedOrBuilding),
      runningProjects: getRemaining(limits.runningProjects, usage.runningProjects),
      projectStartsPerHour: getRemaining(
        limits.projectStartsPerHour,
        usage.startsLastHourTotal
      ),
    },
  };
}

async function getProjectQuotaUsage(projectId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const project = await Project.findById(projectId).select(
    "_id ownerUserId projectTitle status startHistory createdDate course sourceType"
  );

  if (!project) {
    throw new Error("Project not found");
  }

  return {
    projectId: String(project._id),
    ownerUserId: project.ownerUserId ? String(project.ownerUserId) : null,
    projectTitle: project.projectTitle,
    status: project.status,
    startsLastHour: (project.startHistory || []).filter(
      (entry) => new Date(entry.timestamp) >= oneHourAgo
    ).length,
    startsTotal: (project.startHistory || []).length,
    createdDate: project.createdDate,
    course: project.course || null,
    sourceType: project.sourceType || null,
  };
}

async function getQuotaOverview(courses = ["ACS", "ADS"]) {
  const normalizedCourses = courses.map((course) => course.toUpperCase());
  const allUsers = await User.find({ role: { $in: ["student", "faculty"] } })
    .select("_id name email role")
    .lean();

  const userSummaries = [];
  for (const user of allUsers) {
    const summary = await getUserQuotaSummary(user._id);
    userSummaries.push(summary);
  }

  const allProjects = await Project.find({})
    .select("course ownerUserId status")
    .lean();

  const courseStats = normalizedCourses.map((course) => {
    const projectsForCourse = allProjects.filter(
      (project) => (project.course || "").toUpperCase() === course
    );

    const running = projectsForCourse.filter(
      (project) => project.status === "running"
    ).length;
    const queued = projectsForCourse.filter(
      (project) => project.status === "queued" || project.status === "building"
    ).length;

    return {
      course,
      totalProjects: projectsForCourse.length,
      runningProjects: running,
      queuedOrBuildingProjects: queued,
    };
  });

  return {
    generatedAt: new Date(),
    courses: courseStats,
    users: userSummaries,
  };
}

module.exports = {
  QuotaError,
  enforceUploadQuota,
  enforceRunQuota,
  getRoleLimits,
  getRoleLimitsForApi,
  getUserQuotaUsage,
  getUserQuotaSummary,
  getProjectQuotaUsage,
  getQuotaOverview,
};
