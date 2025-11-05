const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const { exec } = require('child_process');
const Docker = require('dockerode');
const docker = new Docker();

const Project = require('../db/model/projectSchema.js');
const Configuration = require('../db/model/configSchema.js');
const { buildAndDeployProject } = require('../services/buildService'); // ✅ import new service

const router = express.Router();
const logger = console; // you can replace with winston later

// Multer setup
const upload = multer({ dest: 'uploads/' });

// Helper: async wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Helper: find project configuration
const getProjectConfig = async (projectId) => {
  const objectId = new mongoose.Types.ObjectId(projectId);
  const config = await Configuration.findOne({ projectId: objectId });

  if (!config) throw new Error('Configuration not found for project.');
  if (!config.serviceName || config.serviceName.length === 0)
    throw new Error('No services configured for this project.');

  return config.serviceName;
};

// ========================
// 🚀 NEW: Upload + Auto Build/Deploy
// ========================
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    try {
      const { githubUrl, projectTitle, description } = req.body;
      let sourceType, sourcePathOrUrl;

      if (req.file) {
        sourceType = 'zip';
        sourcePathOrUrl = req.file.path;
      } else if (githubUrl) {
        sourceType = 'github';
        sourcePathOrUrl = githubUrl;
      } else {
        return res
          .status(400)
          .json({ message: 'Please upload a ZIP file or provide a GitHub URL' });
      }

      // Save metadata first
      const project = await Project.create({
        projectTitle,
        longDescription: description,
        sourceType,
        sourcePathOrUrl,
        status: 'queued',
        createdDate: new Date(),
      });

      // Run build and deploy
      const result = await buildAndDeployProject(
        project._id,
        sourceType,
        sourcePathOrUrl
      );

      res.status(200).json({
        message: result.success
          ? '✅ Project built and deployed successfully!'
          : '❌ Build failed',
        projectId: project._id,
        url: result.url || null,
        error: result.error || null,
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
  })
);

// ========================
// 🧩 CRUD ROUTES
// ========================

// Get all projects
router.get(
  '/projects',
  asyncHandler(async (req, res) => {
    const { school, studyProgramme, yearOfBatch, faculty } = req.query;
    const filters = {};
    if (school) filters.school = school;
    if (studyProgramme) filters.studyProgramme = studyProgramme;
    if (yearOfBatch) filters.yearOfBatch = yearOfBatch;
    if (faculty) filters.faculty = faculty;

    const projects = await Project.find(filters);
    res.json(projects);
  })
);

// Get one project
router.get(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  })
);

// Create new project (manual entry)
router.post(
  '/projects',
  asyncHandler(async (req, res) => {
    const project = new Project(req.body);
    const newProject = await project.save();
    res.status(201).json(newProject);
  })
);

// Update project
router.patch(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    Object.assign(project, req.body);
    const updated = await project.save();
    res.json(updated);
  })
);

// Delete project
router.delete(
  '/projects/:id',
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await project.deleteOne();
    res.json({ message: 'Project deleted successfully' });
  })
);

// Filter options
router.get(
  '/filter-options',
  asyncHandler(async (req, res) => {
    const schools = await Project.distinct('school');
    const studyProgrammes = await Project.distinct('studyProgramme');
    const yearsOfBatch = await Project.distinct('yearOfBatch');
    const faculties = await Project.distinct('faculty');

    res.json({ schools, studyProgrammes, yearsOfBatch, faculties });
  })
);

// ========================
// ⚙️ DOCKER START / STOP
// ========================
const projectRoot = path.resolve(__dirname, '../../');

// Start project (manual trigger)
router.post(
  '/projects/:id/start',
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const services = await getProjectConfig(projectId);

    await Promise.all(
      services.map((service) => {
        const safeName = service.name.replace(/[^a-zA-Z0-9-_]/g, '');
        return new Promise((resolve, reject) => {
          exec(
            `docker-compose up -d ${safeName}`,
            { cwd: projectRoot },
            (error, stdout, stderr) => {
              if (error) {
                logger.error(`❌ Failed to start service ${safeName}: ${error.message}`);
                reject(error);
              } else {
                logger.info(`✅ Started service ${safeName}`);
                resolve();
              }
            }
          );
        });
      })
    );

    const frontend = services.find((s) => s.type === 'frontend');
    if (!frontend) return res.status(400).json({ error: 'No frontend service found.' });

    const url = `http://localhost:${frontend.port}`;
    res.status(200).json({
      message: 'Project started successfully.',
      projectUrl: url,
    });
  })
);

// Stop project
router.post(
  '/projects/:id/stop',
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const services = await getProjectConfig(projectId);

    await Promise.all(
      services.map((service) => {
        const safeName = service.name.replace(/[^a-zA-Z0-9-_]/g, '');
        return new Promise((resolve) => {
          exec(
            `docker-compose down ${safeName}`,
            { cwd: projectRoot },
            (error, stdout, stderr) => {
              if (error) {
                logger.error(`❌ Error stopping service ${safeName}: ${error.message}`);
              } else {
                logger.info(`🛑 Stopped service ${safeName}`);
              }
              resolve();
            }
          );
        });
      })
    );

    res.status(200).json({ message: 'Project stopped successfully.' });
  })
);

// ========================
// 🧩 SAVE CONFIGURATION
// ========================
router.post(
  '/config',
  asyncHandler(async (req, res) => {
    const { projects } = req.body;
    if (!projects || !Array.isArray(projects)) {
      return res.status(400).json({ error: 'Invalid configuration format.' });
    }

    const configurations = projects.map((project) => ({
      projectId: new mongoose.Types.ObjectId(project.projectId),
      serviceName: project.serviceName.map((service) => ({
        name: service.name,
        dockerFile: service.dockerFile,
        port: service.port,
        type: service.type,
      })),
      dockerFiles: project.dockerFiles.map((file) => ({
        fileName: file.fileName,
        content: file.content,
      })),
    }));

    await Configuration.insertMany(configurations);
    res.status(200).json({ message: 'Configurations stored successfully.' });
  })
);

// ========================
// 🚨 ERROR HANDLER
// ========================
router.use((err, req, res, next) => {
  logger.error(`❌ ${err.message}`);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router;
