// services/stopProject.js

const Project = require("../db/model/projectSchema");
const { execSync } = require("child_process");

async function stopProject(projectId) {
  const project = await Project.findById(projectId);

  if (!project) throw new Error("Project not found");
  if (project.status !== "running") throw new Error("Project is not running");

  try {
    execSync(`docker stop ${project.containerName}`);
    execSync(`docker rm ${project.containerName}`);
  } catch (err) {
    console.log("Container may already be stopped or missing.", err.message);
  }

  project.status = "stopped";
  await project.save();
}

module.exports = { stopProject };
