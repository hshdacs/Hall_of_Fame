const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    projectTitle: {
        type: String,
        required: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    longDescription: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        required: true
    },
    technologiesUsed: {
        type: [String],
        required: true
    },
    githubUrl: String,
    dockerImageUrl: String,
    school: String,
    studyProgramme: String,
    yearOfBatch: Number,
    faculty: String
});

module.exports = mongoose.model('Project', projectSchema);
