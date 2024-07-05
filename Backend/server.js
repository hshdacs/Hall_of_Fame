const app = require('./app');
const dbService = require('./db/dbconfig/db');

app.listen(process.env.PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
});



dbService.connectMongoDB();
