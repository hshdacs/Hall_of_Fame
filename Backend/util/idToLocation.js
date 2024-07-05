const dbService = require('../db/dbconfig/db');

const idToLocation = async (servicePointId) => {
    const session = await dbService.connectNeo4j();
    try {
        const query = `MATCH (s:ServiceStations {serviceStationId: "${servicePointId}"})
                       MATCH (s)-[:LOCATED_IN]->(c:City)
                       RETURN c.latitude as lat, c.longitude as lon`;
        const result = await session.run(query);
        // result.records.forEach((record) => {
        //     console.log(record.get('lat'), record.get('lon'));
        // });
        await session.close();
        
        if (result.records.length === 0) {
            throw new Error('No location found for the given service point ID');
        }

        const lat = result.records[0].get('lat');
        const lon = result.records[0].get('lon');
        return `${lat},${lon}`;
    } catch (error) {
        console.error(`Error occurred while fetching location for service point id ${servicePointId}: `, error);
        throw error;
    } finally {
        await session.close();
    }
};

module.exports = { idToLocation };