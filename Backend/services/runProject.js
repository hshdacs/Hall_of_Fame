// // services/runProject.js

// const Project = require("../db/model/projectSchema");
// const { execSync } = require("child_process");
// const getPort = require("get-port");

// async function runProject(projectId) {
//   const project = await Project.findById(projectId);

//   if (!project) throw new Error("Project not found");
//   if (project.status === "running") throw new Error("Project is already running");

//   const hostPort = await getPort({
//     port: getPort.makeRange(8000, 9999),
//   });

//   execSync(
//     `docker run -d -p ${hostPort}:${project.internalPort} --name ${project.containerName} ${project.imageTag}`
//   );

//   project.hostPort = hostPort;
//   project.url = `http://localhost:${hostPort}`;
//   project.status = "running";

//   await project.save();

//   return project.url;
// }

// module.exports = { runProject };

// services/runProject.js

const Project = require("../db/model/projectSchema");
const { execSync } = require("child_process");
const getPort = require("get-port");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

async function runProject(projectId) {
  const project = await Project.findById(projectId);

  if (!project) throw new Error("Project not found");

  const projectDir = path.join(process.cwd(), "uploads", String(projectId));
  const composeFile = path.join(projectDir, "docker-compose.yml");

  // -----------------------------------------------------------
  // CASE 1: docker-compose project (microservices)
  // -----------------------------------------------------------
  // if (fs.existsSync(composeFile)) {
  //   try {
  //     // Stop existing services (ignore errors)
  //     try { execSync(`docker compose -f "${composeFile}" down`, { stdio: "ignore" }); } catch {}

  //     // Start clean
  //     execSync(`docker compose -f "${composeFile}" up -d`);

  //     project.status = "running";
  //     project.url = "docker-compose"; // TODO: Extract frontend port later
  //     await project.save();

  //     return project.url;

  //   } catch (err) {
  //     throw new Error("Failed to start docker-compose project: " + err.message);
  //   }
  // }



// -----------------------------------------------------------
// CASE 1: docker-compose project (microservices)
// -----------------------------------------------------------
if (fs.existsSync(composeFile)) {
  try {
    // Stop old containers
    try { execSync(`docker compose -f "${composeFile}" down`, { stdio: "ignore" }); } catch {}

    // Start services
    execSync(`docker compose -f "${composeFile}" up -d`);

    // -----------------------------------------------------------
    // Detect frontend service & port
    // -----------------------------------------------------------
    const composeContent = fs.readFileSync(composeFile, "utf8");
    const composeConfig = yaml.load(composeContent);

    let frontendUrl = null;

    for (const [serviceName, serviceDef] of Object.entries(composeConfig.services)) {
      if (!serviceDef.ports) continue;

      for (const port of serviceDef.ports) {
        // Accept formats like:
        // "3000:3000"
        //  - "5173:80"
        const [host, container] = port.toString().split(":");

        // Heuristic: frontend is usually port 80 / 3000 / 5173 / 8080
        const possibleFrontendPorts = ["80", "3000", "5173", "8080"];

        if (possibleFrontendPorts.includes(container)) {
          frontendUrl = `http://localhost:${host}`;
          project.frontendService = serviceName;
          project.frontendPort = host;
          break;
        }
      }

      if (frontendUrl) break;
    }

    // Fallback (no port detected)
    if (!frontendUrl) {
      frontendUrl = "docker-compose";
    }

    project.url = frontendUrl;
    project.status = "running";
    await project.save();

    return project.url;

  } catch (err) {
    throw new Error("Failed to start docker-compose project: " + err.message);
  }
}

  // -----------------------------------------------------------
  // CASE 2: Dockerfile project (single container)
  // -----------------------------------------------------------
  try {
    const hostPort = await getPort({ port: getPort.makeRange(8000, 9999) });

    // Remove old container (ignore errors)
    try { execSync(`docker rm -f ${project.containerName}`, { stdio: "ignore" }); } catch {}

    // Run new container
    execSync(
      `docker run -d -p ${hostPort}:${project.internalPort} --name ${project.containerName} ${project.imageTag}`
    );

    project.hostPort = hostPort;
    project.url = `http://localhost:${hostPort}`;
    project.status = "running";
    await project.save();

    return project.url;

  } catch (err) {
    throw new Error("Failed to start project: " + err.message);
  }
}

module.exports = { runProject };
