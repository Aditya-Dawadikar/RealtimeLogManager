const { Kafka } = require("kafkajs");
const WebSocket = require("ws");
const config = require("./config");

// Kafka Configuration
const kafka = new Kafka({
  clientId: config.CLIENT_ID,
  brokers: [config.KAFKA_BROKER], // Change this if your Kafka runs on a different host
  retry: {retries:5}
});

const consumer = kafka.consumer({ groupId: config.CONSUMER_GROUP });

const wss = new WebSocket.Server({host:"0.0.0.0",port: 9000})

wss.on("connection", (ws)=>{
  console.log("Websocket client connected!")

  ws.send(JSON.stringify({message:"connected to LogCOnsumer WebSocket!"}))

  ws.on("upgrade", (req, socket, head) => {
    socket.write("HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
                 "Connection: Upgrade\r\n" +
                 "Upgrade: websocket\r\n" +
                 "Access-Control-Allow-Origin: *\r\n" +
                 "\r\n");
    socket.pipe(socket);
  });
})

// **Retry Consumer Connection on Failure**
const connectConsumer = async () => {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: config.KAFKA_TOPIC, fromBeginning: true });
    console.log("Connected to Kafka. Listening for logs...");

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received Log:", message.value.toString());
      },
    });

  } catch (error) {
    console.error("Kafka Consumer Error:", error.message);
    console.log("Retrying connection in 5s...");
    setTimeout(connectConsumer, 5000);
  }
};

connectConsumer()

// Sliding Window Buffer (30 Seconds)
let logWindow = [];
const WINDOW_DURATION = 30*1000

const processLog = (log) =>{
  try{
    const parsedLog = JSON.parse(log);
    parsedLog.processed_at = Date.now()
    return parsedLog
  }catch (error){
    console.log("Error processing log:", error);
    return null;
  }
}

const computeAggregates = () =>{
  if (logWindow.length === 0) return;

  const eventCounts = {}
  const videoCounts = {}
  const uniqueUsers = new Set();

  logWindow.forEach((log)=>{
    eventCounts[log.event] = (eventCounts[log.event] || 0)+1;
    videoCounts[log.video_title] = (videoCounts[log.video_title] || 0) + 1;
    uniqueUsers.add(log.user_id)
  })

  const aggregateData = {
    timestamp: new Date().toISOString(),
    eventCounts,
    videoCounts,
    unique_users: uniqueUsers.size,
    total_logs: logWindow.length
  }

  console.log("Aggregate data:", aggregateData)

  wss.clients.forEach((client)=>{
    if(client.readyState === WebSocket.OPEN){
      client.send(JSON.stringify({type: "aggregate_data", data: aggregateData}))
    }
  })
}


const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: config.KAFKA_TOPIC, fromBeginning: true });

  console.log("Connected to Kafka. Listening for logs...");

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log(`Received Log (Partition: ${partition}): ${message.value.toString()}`);
      } catch (error) {
        console.error("Kafka Consumer Error:", error.message);
      }

      const logMessage = message.value.toString()
      const processedLog = processLog(logMessage)

      if (processedLog){
        logWindow.push(processedLog)

        const now = Date.now()
        logWindow = logWindow.filter(log=>now - log.processed_at <= WINDOW_DURATION)

        wss.clients.forEach((client)=>{
          if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({
              type: "raw_log",
              data: processedLog
            }))
          }
        })
      }

    },
  });
};

setInterval(computeAggregates, 10000);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down LogConsumer...");
  await consumer.disconnect();
  process.exit(0);
});

run().catch(console.error);
