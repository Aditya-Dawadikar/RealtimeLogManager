const { Kafka } = require("kafkajs");
const WebSocket = require("ws");
const config = require("./config");

// Kafka Configuration
const kafka = new Kafka({
  clientId: config.CLIENT_ID,
  brokers: [config.KAFKA_BROKER], // Change this if your Kafka runs on a different host
});

const consumer = kafka.consumer({ groupId: config.CONSUMER_GROUP });

const wss = new WebSocket.Server({port: 9000})

wss.on("connection", (ws)=>{
  console.log("Websocket client connected!")

  ws.send(JSON.stringify({message:"connected to LogCOnsumer WebSocket!"}))
})

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: config.KAFKA_TOPIC, fromBeginning: true });

  console.log("Connected to Kafka. Listening for logs...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const logMessage = message.value.toString()

      console.log(`Received Log: ${logMessage} (Partition: ${partition})`);

      wss.clients.forEach((client)=>{
        if(client.readyState === WebSocket.OPEN){
          client.send(JSON.stringify({
            log: logMessage,
            partition: partition
          }))
        }
      })
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
