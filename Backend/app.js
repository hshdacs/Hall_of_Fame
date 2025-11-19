const express = require('express');
const cors = require('cors');
const routes = require('./routes/routes');
const projectRoutes = require('./routes/project.router');

// Bull Board imports
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');

// Import your queue instance
const { buildQueue } = require('./services/buildService'); // ✅ check correct path

const app = express();

app.use(cors());
app.use(express.json());

// Health route
app.get('/', (req, res) => res.send('API running successfully 🚀'));

// Mount routes
app.use('/', routes);
app.use('/api/project', projectRoutes);

// ✅ Proper Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues'); // this ensures assets load correctly

createBullBoard({
  queues: [new BullAdapter(buildQueue)],
  serverAdapter,
});

// ⚠️ This must come AFTER your other app.use() routes
app.use('/admin/queues', serverAdapter.getRouter());

// Error handling middleware (keep at bottom)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
