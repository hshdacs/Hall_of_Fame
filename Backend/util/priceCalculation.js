const { logger } = require('./logging');
const axios = require('axios');

const calculatePrice = async (redisClient, carIds, fromLocation, startDate, endDate) => {
    const cacheKey = `price:${JSON.stringify(carIds)}:${fromLocation}:${startDate}:${endDate}`;
    try {
        // Check Redis cache first
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            logger.info('Fetching data from Redis cache');
            return JSON.parse(cachedData);
        }

        const durationday = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
        //console.log(durationday);

        // Calculate price from TomTom API
        const calculatePriceFromTomTom = async (fromLocation) => {
            
            const tomTomApiKey = process.env.TOMTOM_API_KEY;
            const trafficUrl = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${fromLocation}&unit=KMPH&openLr=false&key=${tomTomApiKey}`;
            
            const response = await axios.get(trafficUrl);
            const trafficData = response.data.flowSegmentData;
            //console.log(trafficData.currentSpeed);

            return {
                currentSpeed: trafficData.currentSpeed,
                trafficDensity: trafficData.confidence
            };
        };

        const trafficData = await calculatePriceFromTomTom(fromLocation);
        const demandLevel = 'normal'; // Placeholder for demand level logic
        const season = 'peak'; // Placeholder for season logic
        const duration = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

        const calculateDynamicPrice = (basePrice, trafficSpeed, demandLevel, season, duration) => {
            // Traffic Factor
            let TF;
            if (trafficSpeed > 60) {
                TF = 1.0;
            } else if (30 <= trafficSpeed && trafficSpeed <= 60) {
                TF = 1.2;
            } else {
                TF = 1.5;
            }

            // Demand Factor
            let DF;
            if (demandLevel === 'low') {
                DF = 0.9;
            } else if (demandLevel === 'normal') {
                DF = 1.0;
            } else {
                DF = 1.3;
            }

            // Seasonal Factor
            let SF;
            if (season === 'off') {
                SF = 0.8;
            } else {
                SF = 1.4;
            }

            // Duration Factor
            let DDF;
            if (duration < 3) {
                DDF = 1.1;
            } else if (duration > 7) {
                DDF = 0.9;
            } else {
                DDF = 1.0;
            }

            // Calculate final price
            // console.log(basePrice, TF, DF, SF, DDF);
            return basePrice * TF * DF * SF * DDF;
        };

        const prices = carIds.map(car => {
            const price = calculateDynamicPrice(car.basePrice, trafficData.currentSpeed, demandLevel, season, duration);
            return {
                ...car,
                price
            };
        });

        // Store in Redis cache
        await redisClient.set(cacheKey, JSON.stringify(prices), {
            EX: 3600,
        });
        logger.info('Storing data in Redis cache');

        return prices;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

module.exports = calculatePrice;
