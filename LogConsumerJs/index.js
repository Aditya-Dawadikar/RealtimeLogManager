const { Kafka } = require("kafkajs");
const config = require("./config");

// Kafka Configuration
const kafka = new Kafka({
  clientId: config.CLIENT_ID,
  brokers: [config.KAFKA_BROKER], // Change this if your Kafka runs on a different host
});

const consumer = kafka.consumer({ groupId: config.CONSUMER_GROUP });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: config.KAFKA_TOPIC, fromBeginning: true });

  console.log("Connected to Kafka. Listening for logs...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received Log: ${message.value.toString()} (Partition: ${partition})`);
    },
  });
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down LogConsumer...");
  await consumer.disconnect();
  process.exit(0);
});

run().catch(console.error);
