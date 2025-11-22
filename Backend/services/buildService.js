// services/buildService.js

const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");
const unzipper = require("unzipper");
const { execSync } = require("child_process");
const getPort = require("get-port");

const Project = require("../db/model/projectSchema");

async function buildAndDeployProject(projectId, sourceType, sourcePathOrUrl) {
  const git = simpleGit();
  const projectDir = path.join(process.cwd(), "uploads", String(projectId));

  // ensure workspace directory
  fs.mkdirSync(projectDir, { recursive: true });

  // ----------------------------------------------------
  // 1️⃣ FETCH PROJECT SOURCE (GitHub or ZIP)
  // ----------------------------------------------------
  if (sourceType === "github") {
    await git.clone(sourcePathOrUrl, projectDir);
  } else if (sourceType === "zip") {
    await fs
      .createReadStream(sourcePathOrUrl)
      .pipe(unzipper.Extract({ path: projectDir }))
      .promise();
  } else {
    throw new Error("Invalid source type");
  }

  // load project
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  project.status = "building";
  project.logs.build = "";
  project.logs.deploy = "";
  await project.save();

  // paths
  const dockerfilePath = path.join(projectDir, "Dockerfile");

  try {
    // ----------------------------------------------------
    // 2️⃣ BUILD DOCKER IMAGE
    // ----------------------------------------------------
    if (!fs.existsSync(dockerfilePath)) {
      project.status = "build_failed";
      project.logs.build = "No Dockerfile found in project.";
      await project.save();
      return { success: false, error: "No Dockerfile found" };
    }

    project.logs.build += "Dockerfile found. Building image...\n";

    const imageTag = `project_${projectId}`;
    const containerName = `container_${projectId}`;

    const buildOut = execSync(`docker build -t ${imageTag} .`, {
      cwd: projectDir,
    });

    project.logs.build += buildOut.toString();

    // ----------------------------------------------------
    // 3️⃣ START CONTAINER AUTOMATICALLY ON FIRST BUILD
    // ----------------------------------------------------
    if (project.status !== "running") {
      const internalPort = 80; // default — can be improved later
      const hostPort = await getPort({
        port: getPort.makeRange(8000, 9999),
      });

      const runOut = execSync(
        `docker run -d -p ${hostPort}:${internalPort} --name ${containerName} ${imageTag}`,
        { cwd: projectDir }
      );

      project.logs.deploy += runOut.toString();

      // save metadata
      project.imageTag = imageTag;
      project.containerName = containerName;
      project.internalPort = internalPort;
      project.hostPort = hostPort;
      project.url = `http://localhost:${hostPort}`;
      project.status = "running";
    }

    await project.save();

    return { success: true, url: project.url, error: null };
  } catch (err) {
    project.status = "build_failed";
    project.logs.build += `\nERROR: ${err.message}\n`;
    await project.save();

    return { success: false, error: err.message };
  }
}

module.exports = { buildAndDeployProject };
