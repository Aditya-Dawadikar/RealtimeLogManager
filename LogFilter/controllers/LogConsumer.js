const { Kafka } = require("kafkajs");
const { Client } = require("@elastic/elasticsearch");
const config = require("../config");

// **Kafka Configuration**
const kafka = new Kafka({
    clientId: config.CLIENT_ID,
    brokers: [config.KAFKA_BROKER],
    retry: { retries: 5 },
});

// **Kafka Consumer**
const consumer = kafka.consumer({ groupId: config.CONSUMER_GROUP });

// **Elasticsearch Client**
const esClient = new Client({ node: config.ELASTICSEARCH_HOST });


let logBatch = []
const BATCH_SIZE = 10

const connectConsumer = async () => {
    try {
        await consumer.connect();
        console.log("Connected to Kafka!");

        await consumer.subscribe({ topic: config.KAFKA_TOPIC, fromBeginning: true });

        console.log("Listening for logs...");

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const logMessage = message.value.toString();
                console.log(`Received Log (Partition: ${partition}):`, logMessage);

                const processedLog = processLog(logMessage);
                if (processedLog) {
                    logBatch.push({ index: { _index: "logs" } },
                        processedLog);
                }

                if (logBatch.length >= BATCH_SIZE) {
                    await indexLogsBulk(esClient);
                }
            },
        });

    } catch (error) {
        console.error("Kafka Consumer Connection Error:", error.message);
        console.log("Retrying in 5s...");
        setTimeout(connectConsumer, 5000);
    }
};

// **Process Log Message**
const processLog = (log) => {
    try {
        const parsedLog = JSON.parse(log);
        parsedLog.processed_at = Date.now();
        console.log("Processed Log:", parsedLog);
        return parsedLog;
    } catch (error) {
        console.error("Error processing log:", error);
        return null;
    }
};

// **Bulk Index Logs to Elasticsearch**
const indexLogsBulk = async (esClient) => {
    try {
        await esClient.bulk({ refresh: true, body: logBatch });
        console.log(`Indexed ${logBatch.length / 2} logs to Elasticsearch`);
        logBatch = []; // Clear batch after indexing
    } catch (error) {
        console.error("Bulk Indexing Error:", error.message);
    }
};

module.exports = {
    connectConsumer
}
