// Backend/services/buildService.js
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const unzipper = require('unzipper');              // kept for future ZIP support
const { execSync } = require('child_process');     // ✅ import this
const getPort = require('get-port');

const Project = require('../db/model/projectSchema');

async function buildAndDeployProject(projectId, sourceType, sourcePathOrUrl) {
  const git = simpleGit();
  const projectDir = path.join(process.cwd(), 'uploads', String(projectId));

  // ensure workspace
  fs.mkdirSync(projectDir, { recursive: true });

  // --- 1) Fetch source (github|zip) ---
  if (sourceType === 'github') {
    await git.clone(sourcePathOrUrl, projectDir);
  } else if (sourceType === 'zip') {
    await fs.createReadStream(sourcePathOrUrl)
      .pipe(unzipper.Extract({ path: projectDir }))
      .promise();
  } else {
    throw new Error('Invalid source type');
  }

  // --- 2) Detect build strategy ---
  const dockerfilePath = path.join(projectDir, 'Dockerfile');
  const composePath    = path.join(projectDir, 'docker-compose.yml');

  // load project doc (for logs/status updates)
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found');
  project.logs = project.logs || {};
  project.logs.build = project.logs.build || '';
  project.logs.deploy = project.logs.deploy || '';

  try {
    // --- Dockerfile path (single service) ---
    if (fs.existsSync(dockerfilePath)) {
      project.logs.build += 'Detected Dockerfile. Building image...\n';
      await project.save();

      const imageTag = `srh/${projectId}:1.0`;
      const buildOut = execSync(`docker build -t ${imageTag} .`, { cwd: projectDir });
      project.logs.build += buildOut.toString();

      // choose a host port and run
      const hostPort = await getPort({ port: getPort.makeRange(8000, 9999) });
      const internalPort = 80; // adjust if your Dockerfile exposes another port
      const runOut = execSync(
        `docker run -d -p ${hostPort}:${internalPort} --name p_${projectId} ${imageTag}`,
        { cwd: projectDir }
      );
      project.logs.deploy += runOut.toString();
      project.status = 'running';
      project.url = `http://localhost:${hostPort}`;
      await project.save();

      return { success: true, url: project.url, error: null };
    }

    // --- docker-compose path (multi service) ---
    if (fs.existsSync(composePath)) {
      project.logs.build += 'Detected docker-compose.yml. Running docker compose up -d ...\n';
      await project.save();

      // Use Compose V2 syntax: "docker compose"
      const upOut = execSync(`docker compose up -d`, { cwd: projectDir });
      project.logs.deploy += upOut.toString();
      project.status = 'running';

      // We don’t know the public port reliably without parsing YAML;
      // you can add YAML parsing later to set a precise URL.
      project.url = null;
      await project.save();

      return { success: true, url: null, error: null };
    }

    // none found
    throw new Error('No Dockerfile or docker-compose.yml found in uploaded project');
  } catch (err) {
    // capture logs and bubble up
    project.status = 'build_failed';
    project.logs.build += `\nERROR: ${err.message}\n`;
    await project.save();
    return { success: false, url: null, error: err.message };
  }
}

module.exports = { buildAndDeployProject };
