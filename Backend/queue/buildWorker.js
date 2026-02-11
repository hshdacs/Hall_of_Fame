require("dotenv").config({ path: "./config/development.env" });

const buildQueue = require("./buildQueue");
const Project = require("../db/model/projectSchema");
const { buildAndDeployProject } = require("../services/buildService");
const dbService = require("../db/dbconfig/db");

async function startBuildWorker() {
  await dbService.connectMongoDB();

  buildQueue.process(5, async (job) => {
    const { projectId, sourceType, sourcePathOrUrl } = job.data;

    console.log(`Starting build for project: ${projectId}`);

    try {
      const result = await buildAndDeployProject(
        projectId,
        sourceType,
        sourcePathOrUrl
      );

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
        return result;
      }

      throw new Error(result.error || "Build failed");
    } catch (err) {
      await Project.findByIdAndUpdate(projectId, {
        $push: {
          buildHistory: {
            timestamp: new Date(),
            status: "failed",
            message: err.message,
          },
        },
        status: "build_failed",
      });

      throw err;
    }
  });

  buildQueue.on("completed", (job) => {
    console.log(`Build job ${job.id} completed`);
  });

  buildQueue.on("failed", (job, err) => {
    console.log(`Build job ${job.id} failed: ${err.message}`);
  });

  buildQueue.on("active", (job) => {
    console.log(
      `Build job ${job.id} active (attempt ${job.attemptsMade + 1}) for project ${job.data.projectId}`
    );
  });

  buildQueue.on("stalled", (job) => {
    console.log(`Build job ${job.id} stalled and will be retried`);
  });

  console.log("Build worker is running");
}

startBuildWorker().catch((err) => {
  console.error("Failed to start build worker:", err.message);
  process.exit(1);
});
