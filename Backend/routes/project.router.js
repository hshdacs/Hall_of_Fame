const express = require('express');
const router = express.Router();
const Project = require('../db/model/schema');

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

module.exports = router;
