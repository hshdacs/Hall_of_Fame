// Backend/services/buildService.js
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const { exec } = require('child_process');
const simpleGit = require('simple-git');
const Project = require('../db/model/projectSchema');

const workspaceRoot = path.resolve(__dirname, '../../workspace');
if (!fs.existsSync(workspaceRoot)) fs.mkdirSync(workspaceRoot);

async function buildAndDeployProject(projectId, sourceType, sourcePathOrUrl) {
  try {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');

    const projectDir = path.join(workspaceRoot, projectId.toString());
    if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir);

    // === STEP 1: Fetch code ===
    if (sourceType === 'zip') {
      await fs.createReadStream(sourcePathOrUrl)
        .pipe(unzipper.Extract({ path: projectDir }))
        .promise();
    } else if (sourceType === 'github') {
      const git = simpleGit();
      await git.clone(sourcePathOrUrl, projectDir);
    } else {
      throw new Error('Invalid source type');
    }

    // === STEP 2: Check for Dockerfile ===
    const dockerfilePath = path.join(projectDir, 'Dockerfile');
    if (!fs.existsSync(dockerfilePath)) {
      project.status = 'build_failed';
      project.logs = { build: 'No Dockerfile found in project root.' };
      await project.save();
      throw new Error('No Dockerfile found in uploaded project');
    }

    // === STEP 3: Build image ===
    const imageTag = `srh/${projectId}:1.0`;
    project.status = 'building';
    project.logs = { build: 'Starting Docker build...\n' };
    await project.save();

    await runCommand(`docker build -t ${imageTag} .`, projectDir, project, 'build');

    // === STEP 4: Run container ===
    const port = 8000 + Math.floor(Math.random() * 1000);
    project.logs.deploy = 'Starting Docker container...\n';
    project.status = 'deploying';
    await project.save();

    await runCommand(
      `docker run -d -p ${port}:80 --name p_${projectId} ${imageTag}`,
      projectDir,
      project,
      'deploy'
    );

    // === STEP 5: Update status ===
    project.status = 'running';
    project.url = `http://localhost:${port}`;
    await project.save();

    console.log(`✅ Project ${project.projectTitle} is live at ${project.url}`);
    return { success: true, url: project.url };
  } catch (err) {
    console.error('❌ Build/Deploy failed:', err);
    const project = await Project.findById(projectId);
    if (project) {
      project.status = 'failed';
      project.logs.build += `\nERROR: ${err.message}`;
      await project.save();
    }
    return { success: false, error: err.message };
  }
}

function runCommand(cmd, cwd, project, logType) {
  return new Promise((resolve, reject) => {
    const process = exec(cmd, { cwd });
    process.stdout.on('data', async (data) => {
      project.logs[logType] += data;
      await project.save();
    });
    process.stderr.on('data', async (data) => {
      project.logs[logType] += data;
      await project.save();
    });
    process.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} failed with exit code ${code}`));
    });
  });
}

module.exports = { buildAndDeployProject };
