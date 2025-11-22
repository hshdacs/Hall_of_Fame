const express = require('express');
const cors = require('cors');

const routes = require('./routes/routes');
const projectRoutes = require('./routes/project.router');

// Bull Board imports
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');

// ✅ Correct queue import
const buildQueue = require('./queue/buildQueue');

const app = express();

app.use(cors());
app.use(express.json());

// Health route
app.get('/', (req, res) => res.send('API running successfully 🚀'));

// Mount routes
app.use('/', routes);
app.use('/api/project', projectRoutes);

// ===============================
// 🚀 BULL BOARD SETUP (fixed)
// ===============================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(buildQueue),  // ✔ real Bull Queue instance
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
