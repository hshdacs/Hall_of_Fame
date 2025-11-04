const express = require('express');
const cors = require('cors');
const routes = require('./routes/routes');
const projectRoutes = require('./routes/project.router');

const app = express();

app.use(cors());
app.use(express.json());

// Health route
app.get('/', (req, res) => res.send('API running successfully 🚀'));

// Mount routes
app.use('/', routes);
app.use('/api/project', projectRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
