// // services/buildService.js

// const fs = require("fs");
// const path = require("path");
// const simpleGit = require("simple-git");
// const unzipper = require("unzipper");
// const { execSync } = require("child_process");
// const getPort = require("get-port");

// const Project = require("../db/model/projectSchema");

// async function buildAndDeployProject(projectId, sourceType, sourcePathOrUrl) {
//   const git = simpleGit();
//   const projectDir = path.join(process.cwd(), "uploads", String(projectId));

//   fs.mkdirSync(projectDir, { recursive: true });

//   // ----------------------------------------------------
//   // 1️⃣ FETCH PROJECT SOURCE
//   // ----------------------------------------------------
//   if (sourceType === "github") {
//     await git.clone(sourcePathOrUrl, projectDir);
//   } else if (sourceType === "zip") {
//     await fs
//       .createReadStream(sourcePathOrUrl)
//       .pipe(unzipper.Extract({ path: projectDir }))
//       .promise();
//   }

//   const project = await Project.findById(projectId);
//   if (!project) throw new Error("Project not found");

//   project.status = "building";
//   project.logs.build = "";
//   project.logs.deploy = "";
//   await project.save();

//   // ----------------------------------------------------
//   // 2️⃣ DETECT DEPLOYMENT TYPE
//   // ----------------------------------------------------
//   const dockerfilePath = path.join(projectDir, "Dockerfile");
//   const composePath = path.join(projectDir, "docker-compose.yml");

//   const hasDockerfile = fs.existsSync(dockerfilePath);
//   const hasCompose = fs.existsSync(composePath);

//   if (!hasDockerfile && !hasCompose) {
//     project.status = "build_failed";
//     project.logs.build = "❌ No Dockerfile or docker-compose.yml found.";
//     await project.save();
//     return { success: false, error: "No Dockerfile or docker-compose.yml found" };
//   }

//   try {
//     // ----------------------------------------------------
//     // 3️⃣ HANDLE DOCKER-COMPOSE
//     // ----------------------------------------------------
//     if (hasCompose) {
//       project.logs.build += "📦 docker-compose.yml detected — building multi-service app...\n";

//       // build all services
//       const buildOut = execSync(`docker compose -f docker-compose.yml build`, {
//         cwd: projectDir,
//       });
//       project.logs.build += buildOut.toString();

//       // start all services
//       const upOut = execSync(`docker compose -f docker-compose.yml up -d`, {
//         cwd: projectDir,
//       });
//       project.logs.deploy += upOut.toString();

//       project.status = "running";
//       project.url = "docker-compose"; // optional placeholder
//       await project.save();

//       return { success: true, url: "docker-compose" };
//     }

//     // ----------------------------------------------------
//     // 4️⃣ HANDLE SIMPLE DOCKERFILE PROJECTS
//     // ----------------------------------------------------
//     if (hasDockerfile) {
//       project.logs.build += "🐳 Dockerfile found — building image...\n";

//       const imageTag = `project_${projectId}`;
//       const containerName = `container_${projectId}`;

//       const buildOut = execSync(`docker build -t ${imageTag} .`, {
//         cwd: projectDir,
//       });
//       project.logs.build += buildOut.toString();

//       const internalPort = 80;
//       const hostPort = await getPort({
//         port: getPort.makeRange(8000, 9999),
//       });

//       const runOut = execSync(
//         `docker run -d -p ${hostPort}:${internalPort} --name ${containerName} ${imageTag}`,
//         { cwd: projectDir }
//       );

//       project.logs.deploy += runOut.toString();

//       project.imageTag = imageTag;
//       project.containerName = containerName;
//       project.internalPort = internalPort;
//       project.hostPort = hostPort;
//       project.url = `http://localhost:${hostPort}`;
//       project.status = "running";
//       await project.save();

//       return { success: true, url: project.url };
//     }

//   } catch (err) {
//     project.status = "build_failed";
//     project.logs.build += `❌ ERROR: ${err.message}\n`;
//     await project.save();

//     return { success: false, error: err.message };
//   }
// }

// module.exports = { buildAndDeployProject };
// services/buildService.js

const fs = require("fs");
const path = require("path");
const simpleGit = require("simple-git");
const unzipper = require("unzipper");
const { spawn } = require("child_process");
const getPortPkg = require("get-port");

const Project = require("../db/model/projectSchema");
const { resolveProjectRoot } = require("./projectSourceResolver");

const getPort = getPortPkg.default || getPortPkg;
const portNumbers =
  getPortPkg.portNumbers ||
  ((from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i));

function runCommandStream(command, { cwd, onOutput }) {
  return new Promise((resolve, reject) => {
    let combined = "";
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env,
    });

    const handleChunk = (chunk) => {
      const text = chunk.toString();
      combined += text;
      if (onOutput) onOutput(text);
    };

    child.stdout.on("data", handleChunk);
    child.stderr.on("data", handleChunk);

    child.on("error", (err) => {
      reject(new Error(`${err.message}\n${combined}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(combined);
      } else {
        reject(new Error(combined || `Command failed with exit code ${code}`));
      }
    });
  });
}

async function buildAndDeployProject(
  projectId,
  sourceType,
  sourcePathOrUrl,
  onLog = () => {}
) {
  const git = simpleGit();
  const uploadRoot = path.join(process.cwd(), "uploads", String(projectId));

  // 🧹 ALWAYS remove previous folder before cloning/unzipping
  if (fs.existsSync(uploadRoot)) {
    fs.rmSync(uploadRoot, { recursive: true, force: true });
  }
  fs.mkdirSync(uploadRoot, { recursive: true });

  console.log(`🚀 Preparing build directory: ${uploadRoot}`);

  // 1️⃣ FETCH PROJECT SOURCE (GitHub or ZIP)
  try {
    if (sourceType === "github") {
      await git.clone(sourcePathOrUrl, uploadRoot);
    } else if (sourceType === "zip") {
      await fs
        .createReadStream(sourcePathOrUrl)
        .pipe(unzipper.Extract({ path: uploadRoot }))
        .promise();
    } else {
      throw new Error("Invalid source type");
    }
  } catch (err) {
    return { success: false, error: "Source fetch failed: " + err.message };
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return { success: false, error: "Project not found" };
  }

  project.status = "building";
  project.logs.build = "";
  project.logs.deploy = "";
  await project.save();

  // 2️⃣ Detect deployment root and files (supports nested zip folder)
  const { projectRoot, dockerfilePath, composePath } = resolveProjectRoot(uploadRoot);
  const hasDockerfile = Boolean(dockerfilePath);
  const hasCompose = Boolean(composePath);

  if (!hasDockerfile && !hasCompose) {
    project.status = "build_failed";
    project.logs.build = "❌ No Dockerfile or docker-compose.yml found";
    await project.save();
    return { success: false, error: "No Dockerfile or docker-compose.yml found" };
  }

  // 3️⃣ Execute Build Logic
  try {
    // --- MULTI-SERVICE MODE ---
    if (hasCompose) {
      project.logs.build += `📦 Compose file detected at ${composePath} — building services...\n`;
      onLog({ stream: "build", message: project.logs.build });
      await project.save();

      const buildOut = await runCommandStream(`docker compose -f "${composePath}" build`, {
        cwd: projectRoot,
        onOutput: (message) => onLog({ stream: "build", message }),
      });
      project.logs.build += buildOut || "";
      await project.save();

      project.logs.deploy += "✅ Build complete. Project is ready to start.\n";
      onLog({ stream: "deploy", message: "✅ Build complete. Project is ready to start.\n" });
      project.status = "ready";
      project.url = null;
      await project.save();

      return { success: true, url: null };
    }

    // --- SINGLE-DOCKERFILE MODE ---
    if (hasDockerfile) {
      project.logs.build += `🐳 Dockerfile found at ${dockerfilePath} — building image...\n`;
      onLog({ stream: "build", message: project.logs.build });
      await project.save();

      const imageTag = `project_${projectId}`;
      const containerName = `container_${projectId}`;

      const buildOut = await runCommandStream(
        `docker build -f "${dockerfilePath}" -t ${imageTag} "${projectRoot}"`,
        {
          cwd: projectRoot,
          onOutput: (message) => onLog({ stream: "build", message }),
        }
      );
      project.logs.build += buildOut || "";
      await project.save();

      const internalPort = 80;
      const hostPort = await getPort({
        port: portNumbers(8000, 9999),
      });

      project.logs.deploy += "✅ Image build complete. Project is ready to start.\n";
      onLog({
        stream: "deploy",
        message: "✅ Image build complete. Project is ready to start.\n",
      });
      await project.save();

      project.imageTag = imageTag;
      project.containerName = containerName;
      project.internalPort = internalPort;
      project.hostPort = hostPort; // reserved port hint; runtime may choose new free port
      project.url = null;
      project.status = "ready";
      await project.save();

      return { success: true, url: null };
    }
  } catch (err) {
    project.status = "build_failed";
    project.logs.build += `❌ ERROR: ${err.message}\n`;
    onLog({ stream: "build", message: `\n❌ ERROR: ${err.message}\n` });
    await project.save();
    return { success: false, error: err.message };
  }
}

module.exports = { buildAndDeployProject };
