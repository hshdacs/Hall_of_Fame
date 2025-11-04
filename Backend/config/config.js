require('dotenv').config({ path: './config/development.env' });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 8020,
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  LOG_MAX_DAYS: process.env.LOG_MAX_DAYS || 60,
  MONGODB_URI: process.env.MONGODB_CLUSTER_URI,
  MONGODB_DATABASE: process.env.MONGODB_DATABASE,
};
