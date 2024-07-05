const mongoose = require('mongoose');
require('dotenv').config();
        
const connectMongoDB = async () => {
    try {
        console.log("process.env---------------->",process.env.MONGODB_CLUSTER_URI)
        const uri = process.env.MONGODB_CLUSTER_URI;
        await mongoose.connect(uri, {
            dbName: process.env.MONGODB_DATABASE,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.log('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = { connectMongoDB };
