// queue/buildQueue.js
const Queue = require("bull");
const Project = require("../db/model/projectSchema");
const { buildAndDeployProject } = require("../services/buildService");

const buildQueue = new Queue("buildQueue", process.env.REDIS_URL);

// Process each job in the queue
buildQueue.process(async (job) => {
  const { projectId, sourceType, sourcePathOrUrl } = job.data;
  console.log(`⚙️ Processing build for project: ${projectId}`);

  try {
    const result = await buildAndDeployProject(projectId, sourceType, sourcePathOrUrl);

    await Project.findByIdAndUpdate(projectId, {
      $push: {
        buildHistory: {
          timestamp: new Date(),
          status: result.success ? "success" : "failed",
          message: result.error || "Build completed",
        },
      },
      status: result.success ? "running" : "build_failed",
    });

    console.log(`✅ Build finished for ${projectId}`);
    return result;
  } catch (err) {
    console.error(`❌ Build failed for ${projectId}:`, err);
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
  }
});

module.exports = buildQueue;
