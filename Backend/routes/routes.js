const express = require('express');
const router = express.Router();

// example small routes here if needed:
router.get('/health', (req, res) => {
  res.send('API OK');
});

module.exports = router;
