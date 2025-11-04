const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const { exec } = require('child_process');
const Docker = require('dockerode');
const docker = new Docker();

const Project = require('../db/model/projectSchema.js');
const Configuration = require('../db/model/configSchema.js');
const logger = console; // replace with winston logger later

// Helper: handle async routes safely
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

// === CRUD ROUTES ===

// Get all projects (with filters)
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

// Create new project
router.post(
  '/projects',
  asyncHandler(async (req, res) => {
    const project = new Project({
      projectTitle: req.body.projectTitle,
      createdDate: req.body.createdDate,
      longDescription: req.body.longDescription,
      images: req.body.images,
      technologiesUsed: req.body.technologiesUsed,
      githubUrl: req.body.githubUrl,
      dockerImageUrl: req.body.dockerImageUrl,
      school: req.body.school,
      studyProgramme: req.body.studyProgramme,
      yearOfBatch: req.body.yearOfBatch,
      faculty: req.body.faculty,
    });

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

// === FILTER OPTIONS ===
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

// === DOCKER START / STOP ===
const projectRoot = path.resolve(__dirname, '../../');

// Start project
router.post(
  '/projects/:id/start',
  asyncHandler(async (req, res) => {
    const projectId = req.params.id;
    const services = await getProjectConfig(projectId);

    // Run docker-compose up for all services concurrently
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

    // Find frontend port
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

// === SAVE CONFIGURATION ===
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

// === ERROR HANDLING MIDDLEWARE ===
router.use((err, req, res, next) => {
  logger.error(`❌ ${err.message}`);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = router;
