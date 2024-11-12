const express = require('express');
const router = express.Router();
const Project = require('../db/model/projectSchema.js');
const Configuration = require('../db/model/configSchema.js');
const Docker = require('dockerode');
const docker = new Docker();
const mongoose = require('mongoose');
const path = require('path');
const exec = require('child_process').exec;

// Get all projects with optional filters
router.get('/projects', async (req, res) => {
    try {
        const { school, studyProgramme, yearOfBatch, faculty } = req.query;
        const filters = {};
        if (school) filters.school = school;
        if (studyProgramme) filters.studyProgramme = studyProgramme;
        if (yearOfBatch) filters.yearOfBatch = yearOfBatch;
        if (faculty) filters.faculty = faculty;

        const projects = await Project.find(filters);
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get one project
router.get('/projects/:id', getProject, (req, res) => {
    res.json(res.project);
});

// Create a project
router.post('/projects', async (req, res) => {
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
        faculty: req.body.faculty
    });
    try {
        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a project
router.patch('/projects/:id', getProject, async (req, res) => {
    if (req.body.projectTitle != null) {
        res.project.projectTitle = req.body.projectTitle;
    }
    if (req.body.createdDate != null) {
        res.project.createdDate = req.body.createdDate;
    }
    if (req.body.longDescription != null) {
        res.project.longDescription = req.body.longDescription;
    }
    if (req.body.images != null) {
        res.project.images = req.body.images;
    }
    if (req.body.technologiesUsed != null) {
        res.project.technologiesUsed = req.body.technologiesUsed;
    }
    if (req.body.githubUrl != null) {
        res.project.githubUrl = req.body.githubUrl;
    }
    if (req.body.dockerImageUrl != null) {
        res.project.dockerImageUrl = req.body.dockerImageUrl;
    }
    if (req.body.school != null) {
        res.project.school = req.body.school;
    }
    if (req.body.studyProgramme != null) {
        res.project.studyProgramme = req.body.studyProgramme;
    }
    if (req.body.yearOfBatch != null) {
        res.project.yearOfBatch = req.body.yearOfBatch;
    }
    if (req.body.faculty != null) {
        res.project.faculty = req.body.faculty;
    }
    try {
        const updatedProject = await res.project.save();
        res.json(updatedProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a project
router.delete('/projects/:id', getProject, async (req, res) => {
    try {
        await res.project.remove();
        res.json({ message: 'Deleted Project' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function getProject(req, res, next) {
    let project;
    try {
        project = await Project.findById(req.params.id);
        if (project == null) {
            return res.status(404).json({ message: 'Cannot find project' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
    res.project = project;
    next();
}

router.get('/filter-options', async (req, res) => {
    try {
        const schools = await Project.distinct('school');
        const studyProgrammes = await Project.distinct('studyProgramme');
        const yearsOfBatch = await Project.distinct('yearOfBatch');
        const faculties = await Project.distinct('faculty');

        res.json({
            schools,
            studyProgrammes,
            yearsOfBatch,
            faculties
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const projectRoot = path.resolve(__dirname, '../../');

router.post('/projects/:id/start', async (req, res) => {
    const projectId = req.params.id;

    try {
        const objectId = new mongoose.Types.ObjectId(projectId);
        
        // Find configuration for the project ID
        const configuration = await Configuration.findOne({ projectId: objectId });
        
        if (!configuration) {
            return res.status(400).json({ error: 'Invalid project ID or configuration not found.' });
        }

        // Access the serviceName array
        const services = configuration.serviceName;

        if (!services || services.length === 0) {
            return res.status(400).json({ error: 'No services configured for this project.' });
        }

        // Run Docker Compose command for each service
        for (const service of services) {
            exec(`docker-compose up -d ${service.name}`, { cwd: projectRoot }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return res.status(500).json({ error: `Failed to start service ${service.name}` });
                }
            });
        }

        // Find the port of the front-end service dynamically
        const frontendService = services.find(service => service.type === 'frontend');
        if (!frontendService) {
            return res.status(400).json({ error: 'No front-end service configured for this project.' });
        }

        const { port } = frontendService;

        // Open the browser with the front-end port
        const { default: open } = await import('open');
        const url = `http://localhost:${port}`;
        //await open(url);

        res.status(200).json({ message: 'Project started successfully and browser opened.' , projectUrl: url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/projects/:id/stop', async (req, res) => {
    const projectId = req.params.id;

    try {
        const objectId = new mongoose.Types.ObjectId(projectId);
        
        // Find configuration for the project ID
        const configuration = await Configuration.findOne({ projectId: objectId });
        
        if (!configuration) {
            return res.status(400).json({ error: 'Invalid project ID or configuration not found.' });
        }

        // Access the serviceName array
        const services = configuration.serviceName;

        if (!services || services.length === 0) {
            return res.status(400).json({ error: 'No services configured for this project.' });
        }

        // Run Docker Compose command to stop each service
        for (const service of services) {
            exec(`docker-compose down ${service.name}`, { cwd: projectRoot }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error while stopping service ${service.name}: ${error}`);
                } else {
                    console.log(`Service ${service.name} stopped successfully.`);
                }
            });
        }

        res.status(200).json({ message: 'Project stopped successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;

router.post('/config', async (req, res) => {
    try {
        // Assuming the project details and services come from the request body
        const { projects } = req.body; // Expecting an array of projects
        console.log("req.body----------->", req.body);
        const configurations = projects.map(project => ({
            projectId: new mongoose.Types.ObjectId(project.projectId), // Convert projectId to ObjectId
        
            serviceName: project.serviceName.map(service => ({
                name: service.name,
                dockerFile: service.dockerFile,
                port: service.port,
                type: service.type
            })),
            dockerFiles: project.dockerFiles.map(file => ({
                fileName: file.fileName,
                content: file.content
            }))
        }));

        console.log("configurations------------->", configurations);
        // Insert configurations into the Configuration collection
        await Configuration.save(configurations);

        res.status(200).json({ message: 'Configurations stored successfully.' });
    } catch (err) {
        console.error('Error storing configurations:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


module.exports = router;
