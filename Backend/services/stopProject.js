// // services/stopProject.js

// const Project = require("../db/model/projectSchema");
// const { execSync } = require("child_process");

// async function stopProject(projectId) {
//   const project = await Project.findById(projectId);

//   if (!project) throw new Error("Project not found");
//   if (project.status !== "running") throw new Error("Project is not running");

//   try {
//     execSync(`docker stop ${project.containerName}`);
//     execSync(`docker rm ${project.containerName}`);
//   } catch (err) {
//     console.log("Container may already be stopped or missing.", err.message);
//   }

//   project.status = "stopped";
//   await project.save();
// }

// module.exports = { stopProject };

// services/stopProject.js

const fs = require("fs");
const path = require("path");
const Project = require("../db/model/projectSchema");
const { execSync } = require("child_process");
const { resolveProjectRoot } = require("./projectSourceResolver");

async function stopProject(projectId) {
  const project = await Project.findById(projectId);

  if (!project) throw new Error("Project not found");
  if (project.status !== "running") throw new Error("Project is not running");

  const uploadRoot = path.join(process.cwd(), "uploads", String(projectId));
  const { composePath } = resolveProjectRoot(uploadRoot);

  try {
    // --------------------------------------------------
    // 1️⃣ If docker-compose exists → bring down ALL services
    // --------------------------------------------------
    if (composePath && fs.existsSync(composePath)) {
      console.log("🛑 Stopping docker-compose project...");
      execSync(`docker compose -f "${composePath}" down`, { stdio: "inherit" });

      project.status = "stopped";
      await project.save();
      return;
    }

    // --------------------------------------------------
    // 2️⃣ Otherwise stop single-container Docker project
    // --------------------------------------------------
    if (project.containerName) {
      console.log(`🛑 Stopping container: ${project.containerName}`);

      try {
        execSync(`docker stop ${project.containerName}`);
        execSync(`docker rm ${project.containerName}`);
      } catch (err) {
        console.log("Container may already be stopped or missing:", err.message);
      }
    }

    project.status = "stopped";
    await project.save();
  } catch (err) {
    console.error("Error stopping project:", err);
    throw err;
  }
}

module.exports = { stopProject };
