// queue/buildQueue.js

// ---------------------------------------------
// Prevent accidental multiple queue processors
// ---------------------------------------------
if (process.env.RUN_QUEUE !== "true") {
  console.log("⚠️ Queue worker disabled for this instance (RUN_QUEUE=false)");
  module.exports = {};
  return;
}

const Queue = require("bull");
const Project = require("../db/model/projectSchema");
const { buildAndDeployProject } = require("../services/buildService");

// Create Bull Queue
const buildQueue = new Queue("buildQueue", process.env.REDIS_URL);

// ---------------------------------------------
// Job Processor (max 10 concurrent builds)
// ---------------------------------------------
buildQueue.process(10, async (job) => {
  const { projectId, sourceType, sourcePathOrUrl } = job.data;
  console.log(`⚙️ [QUEUE] Starting build for project: ${projectId}`);

  try {
    const result = await buildAndDeployProject(projectId, sourceType, sourcePathOrUrl);

    // Log build result in DB
    await Project.findByIdAndUpdate(projectId, {
      $push: {
        buildHistory: {
          timestamp: new Date(),
          status: result.success ? "success" : "failed",
          message: result.error || "Build completed successfully",
        },
      },
      status: result.success ? "running" : "build_failed",
    });

    if (result.success) {
      console.log(`✅ [SUCCESS] Build completed for ${projectId}`);
    } else {
      console.log(`❌ [FAILED] Build failed for ${projectId}: ${result.error}`);
    }

    return result;
  } catch (err) {
    console.error(`🔥 [ERROR] Build crashed for ${projectId}:`, err);

    await Project.findByIdAndUpdate(projectId, {
      $push: {
        buildHistory: {
          timestamp: new Date(),
          status: "failed",
          message: err.message,
        },
      },
      status: "failed",
    });

    throw err;
  }
});

// ---------------------------------------------
// Job Options (applied automatically when adding)
// ---------------------------------------------
buildQueue.on("completed", (job) => {
  console.log(`🧹 [CLEANUP] Job ${job.id} completed & will be removed.`);
});

buildQueue.on("failed", (job, err) => {
  console.log(`❌ [FAILED] Job ${job.id} failed: ${err.message}`);
});

module.exports = buildQueue;
