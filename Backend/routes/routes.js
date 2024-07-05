const express = require('express');

//const { logger } = require('../util/logging');
const { route } = require('../app');

const router = express.Router();

router.get('/', (req, res) => {
   console.log('Health check');
    res.send(`Server is up and running at ${new Date()}`);
});

router.use('api/project', require('./project.router'));

module.exports = router;
