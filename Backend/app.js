const express = require('express');
const cors = require('cors');

const routes = require('./routes/routes');
const projectRoutes = require('./routes/project.router');

// Bull Board imports
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');

// Queue
const buildQueue = require('./queue/buildQueue');

const app = express();

app.use(cors());
app.use(express.json());

// Health
app.get('/', (req, res) => res.send('API running successfully 🚀'));

// API ROUTES
app.use('/', routes);
app.use('/api/project', projectRoutes);

// ===============================
// 🚀 BULL BOARD SETUP
// ===============================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter(buildQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// =====================================================
// 🛑 SPA FALLBACK: Only match NON-API paths
// =====================================================
app.get(/^\/(?!api).*/, (req, res) => {
  res.status(200).send("Frontend route handled by React dev server");
});

// =====================================================
// ERROR HANDLER (must be last)
// =====================================================
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
