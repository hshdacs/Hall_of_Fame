// services/runProject.js

const Project = require("../db/model/projectSchema");
const { execSync } = require("child_process");
const getPort = require("get-port");

async function runProject(projectId) {
  const project = await Project.findById(projectId);

  if (!project) throw new Error("Project not found");
  if (project.status === "running") throw new Error("Project is already running");

  const hostPort = await getPort({
    port: getPort.makeRange(8000, 9999),
  });

  execSync(
    `docker run -d -p ${hostPort}:${project.internalPort} --name ${project.containerName} ${project.imageTag}`
  );

  project.hostPort = hostPort;
  project.url = `http://localhost:${hostPort}`;
  project.status = "running";

  await project.save();

  return project.url;
}

module.exports = { runProject };
