const { Kafka } = require("kafkajs");
const { Client } = require("@elastic/elasticsearch");
const config = require("./config");

// **Kafka Configuration**
const kafka = new Kafka({
    clientId: config.CLIENT_ID,
    brokers: [config.KAFKA_BROKER],
    retry: { retries: 5 },
});

const consumer = kafka.consumer({ groupId: config.CONSUMER_GROUP });

// **Elasticsearch Client**
const esClient = new Client({ node: config.ELASTICSEARCH_HOST});

const connectConsumer = async () => {
    try {
        console.log("🟡 Connecting to Kafka...");
        await consumer.connect();
        console.log("✅ Connected to Kafka!");

        console.log(`🟡 Subscribing to topic: ${config.KAFKA_TOPIC}`);
        await consumer.subscribe({ topic: config.KAFKA_TOPIC, fromBeginning: true });

        console.log("✅ Listening for logs...");

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const logMessage = message.value.toString();
                console.log(`📩 Received Log (Partition: ${partition}):`, logMessage);

                const processedLog = processLog(logMessage);
                if (processedLog) {
                    await indexLog(processedLog);
                }
            },
        });

    } catch (error) {
        console.error("❌ Kafka Consumer Connection Error:", error.message);
        console.log("🔄 Retrying in 5s...");
        setTimeout(connectConsumer, 5000);
    }
};

// **Process Log Message**
const processLog = (log) => {
    try {
        const parsedLog = JSON.parse(log);
        parsedLog.processed_at = Date.now();
        console.log("📝 Processed Log:", parsedLog);
        return parsedLog;
    } catch (error) {
        console.error("❌ Error processing log:", error);
        return null;
    }
};

// **Index Log in Elasticsearch**
const indexLog = async (log) => {
    try {
        const response = await esClient.index({
            index: "logs",
            body: log,
        });
        if (response && response._id) {
            console.log(`✅ Indexed log with ID: ${response._id}`);
        } else {
            console.warn("⚠️ Log indexed, but no _id returned:", response);
        }
    } catch (error) {
        console.error("❌ Elasticsearch Indexing Error:", error.message);
    }
};

// **Graceful Shutdown**
process.on("SIGTERM", async () => {
    console.log("🛑 Shutting down LogFilter...");
    await consumer.disconnect();
    process.exit(0);
});

// **Start Consumer**
connectConsumer().catch(console.error);
