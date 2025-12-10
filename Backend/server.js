// const app = require('./app');
// const dbService = require('./db/dbconfig/db');

// app.listen(process.env.PORT, () => {
//     console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
// });



// dbService.connectMongoDB();

// ✅ 1. Load environment variables first
require('dotenv').config({ path: './config/development.env' });
const { PORT, NODE_ENV } = require('./config/config');
const app = require('./app');
const dbService = require('./db/dbconfig/db');

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
});

dbService.connectMongoDB();
