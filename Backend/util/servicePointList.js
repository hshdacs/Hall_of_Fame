const mongoose = require('mongoose');
const dbService = require('../db/dbconfig/db');
const { logger } = require('../util/logging');

const servicePointList = async () => {
    const redisClient = await dbService.connectRedis();
    const cacheKey = 'servicePointsList';

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.info('Fetching service points from Redis cache');
            await redisClient.disconnect();
            logger.info('Closing Redis connection');
            return JSON.parse(cachedData);
        }

        const db = mongoose.connection;
        const servicePoints = await db
            .collection('servicePoints')
            .find({}, { projection: { _id: 1, name: 1, image: 1 } })
            .toArray();
        logger.info('Fetching service points from MongoDB');

        try {
            logger.info('Fetching location data from Neo4j');
            const session = await dbService.connectNeo4j();
        
            for (let i = 0; i < servicePoints.length; i++) {
                const query = `MATCH (s:ServiceStations {serviceStationId: "${servicePoints[i]._id}"})
                               MATCH (s)-[:LOCATED_IN]->(c:City)
                               RETURN c.latitude as lat, c.longitude as lon`;
                const result = await session.run(query);
        
                if (result.records.length === 0) {
                    throw new Error('No location found for the given service point ID');
                }
        
                const lat = result.records[0].get('lat');
                const lon = result.records[0].get('lon');
                servicePoints[i].coordinates = `${lat},${lon}`;
        
                const servicePoint = await db
                    .collection('servicePoints')
                    .findOne({ _id: servicePoints[i]._id });
                const carsCount = servicePoint.cars.length;
                servicePoints[i].totalCars = carsCount;
            }
        
            await session.close();
            logger.info('closing Neo4j session');

            await redisClient.set(cacheKey, JSON.stringify(servicePoints), {
                EX: 3600,
            });
            logger.info('Storing service points data in Redis cache');
        
            await redisClient.disconnect();
            logger.info('Closing Redis connection');
        
            return servicePoints;
        } catch (error) {
            logger.error('Error fetching service points:', error);
            throw error;
        }
    }
    catch (error) {
        logger.error('Error fetching service points:', error);
        throw error;
    }
}   
module.exports = { servicePointList };
