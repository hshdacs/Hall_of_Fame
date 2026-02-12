require("dotenv").config({ path: "./config/development.env" });

const WebSocket = require("ws");
const buildQueue = require("./buildQueue");
const Project = require("../db/model/projectSchema");
const { buildAndDeployProject } = require("../services/buildService");
const dbService = require("../db/dbconfig/db");

const wsPort = Number(process.env.WORKER_WS_PORT || 8031);
const wss = new WebSocket.Server({ port: wsPort });

function emitProjectEvent(projectId, payload) {
  const message = JSON.stringify({ projectId: String(projectId), ...payload });
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.projectId === String(projectId)
    ) {
      client.send(message);
    }
  });
}

wss.on("connection", (socket, req) => {
  const url = new URL(req.url || "/", "http://localhost");
  socket.projectId = url.searchParams.get("projectId") || "";
  socket.send(
    JSON.stringify({
      type: "connected",
      projectId: socket.projectId,
      message: "Live log channel connected",
    })
  );
});

async function startBuildWorker() {
  await dbService.connectMongoDB();

  buildQueue.process(5, async (job) => {
    const { projectId, sourceType, sourcePathOrUrl } = job.data;

    console.log(`Starting build for project: ${projectId}`);

    try {
      const result = await buildAndDeployProject(
        projectId,
        sourceType,
        sourcePathOrUrl,
        (entry) => emitProjectEvent(projectId, { type: "log", ...entry })
      );

      emitProjectEvent(projectId, {
        type: result.success ? "completed" : "failed",
        message: result.error || "Build completed successfully",
      });

      await Project.findByIdAndUpdate(projectId, {
        $push: {
          buildHistory: {
            timestamp: new Date(),
            status: result.success ? "success" : "failed",
            message: result.error || "Build completed successfully",
          },
        },
        status: result.success ? "ready" : "build_failed",
      });

      if (result.success) {
        return result;
      }

      throw new Error(result.error || "Build failed");
    } catch (err) {
      emitProjectEvent(projectId, {
        type: "failed",
        message: err.message,
      });

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
    emitProjectEvent(job.data.projectId, {
      type: "status",
      message: `Job active (attempt ${job.attemptsMade + 1})`,
      stream: "build",
    });
  });

  buildQueue.on("stalled", (job) => {
    console.log(`Build job ${job.id} stalled and will be retried`);
  });

  console.log("Build worker is running");
  console.log(`Live log websocket listening on ws://localhost:${wsPort}`);
}

startBuildWorker().catch((err) => {
  console.error("Failed to start build worker:", err.message);
  process.exit(1);
});
