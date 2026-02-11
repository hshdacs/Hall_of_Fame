const express = require('express');
const cors = require('cors');
const path = require('path');

const routes = require('./routes/routes');
const projectRoutes = require('./routes/project.router');
const authRoutes = require('./routes/auth.routes');
const adminQuotaRoutes = require('./routes/admin.quota.router');

// Bull Board imports
const { ExpressAdapter } = require('@bull-board/express');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');

// Queue
const buildQueue = require('./queue/buildQueue');

// Swagger imports
const { swaggerUi, swaggerSpec } = require("./config/swagger.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ===============================
// Swagger Documentation
// ===============================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===============================
// Health Check
// ===============================
app.get('/', (req, res) => res.send('API running successfully 🚀'));

// ===============================
// API ROUTES
// ===============================
app.use('/api/auth', authRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/admin', adminQuotaRoutes);
app.use('/', routes);

// ===============================
// Bull Board (Queue Monitoring)
// ===============================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullAdapter(buildQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// ===============================
// SPA Fallback (React dev server)
// ===============================
app.get(/^\/(?!api)(?!admin\/queues).*/, (req, res) => {
  res.status(200).send("Frontend route handled by React dev server");
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;
