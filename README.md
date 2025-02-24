# 📝 Real-Time Log Streaming System (Simulated)

## **🚀 Project Overview**
This project simulates a **real-time log streaming system** using **Kafka, FastAPI, and WebSockets**.  
It consists of multiple components to generate, process, and consume logs.  

In a **real-world scenario**, this system can be extended to handle logs from **real client applications**  
and integrate with a **real-time log tracking and analytics system**.

---

## **📌 Architecture**
### **🔹 Current Setup**
The system consists of the following services:

1. **🔵 LogTrafficGenerator (Simulated Log Producer)**
   - Generates synthetic log events (play, pause, seek, buffering, stop).
   - Uses **WebSocket** to send logs to LogManager.
   - Simulates user interactions with **real movie dataset**.

2. **🟠 LogManager (Log Receiver & Kafka Producer)**
   - WebSocket server that receives logs from LogTrafficGenerator.
   - Forwards logs to **Kafka** for real-time processing.
   - Simulates log ingestion from distributed client applications.

3. **⚫ Kafka (Message Broker)**
   - Stores logs and enables real-time log streaming.
   - Ensures reliable and scalable log delivery.

4. **🟢 LogConsumer (Temporary Consumer)**
   - Consumes logs from Kafka for debugging.
   - **⚠️ This will be replaced with a real-time log tracking system soon.**

![Highlevel Architecture](https://github.com/Aditya-Dawadikar/RealtimeLogManager/blob/master/views/architecture/highlevel-architecture.png)

---
## **📌 Application Views**

![Application Dashboard](https://github.com/Aditya-Dawadikar/RealtimeLogManager/blob/master/views/app/dashboard.png)

---


## **📌 Steps to Run the Project**

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/Aditya-Dawadikar/RealtimeLogManager
cd RealtimeLogManager
```

### **2️⃣ Ensure Docker & Docker Compose are Installed**
If not installed, install **Docker** and **Docker Compose** first:  
- **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)

Verify installation:
```sh
docker --version
docker-compose --version
```

### **3️⃣ Build and Start All Services**
Run the following command to **build and start** all services:
```sh
docker-compose up -d --build
```
✅ This will start:
- **Kafka & Zookeeper**
- **LogManager**
- **LogTrafficGenerator**
- **LogConsumer**

### **4️⃣ Verify Running Containers**
Check that all services are running:
```sh
docker ps
```
You should see `logmanager`, `logtrafficgenerator`, `logconsumer`, `kafka`, and `zookeeper` running.

### **5️⃣ Start Log Traffic**
Trigger log generation using:
```sh
curl http://localhost:8000/start
```
✅ This will start generating simulated log events.

### **6️⃣ Stop Log Traffic**
```sh
curl http://localhost:8000/stop
```

### **7️⃣ View Logs in LogConsumer**
Check received logs from Kafka:
```sh
docker logs logconsumer -f
```

---

## **📌 Configuration**
All configuration is **environment-based**.  
Modify the `.env` file or pass environment variables in `docker-compose.yml`.

### **🔹 LogTrafficGenerator (`config.py`)**
```python
WS_SERVER_URL = os.getenv("WS_SERVER_URL", "ws://logmanager:8080/ws")
NUM_THREADS = int(os.getenv("NUM_THREADS", 3))
TRAFFIC_MIN_DELAY = float(os.getenv("TRAFFIC_MIN_DELAY", 1.0))
TRAFFIC_MAX_DELAY = float(os.getenv("TRAFFIC_MAX_DELAY", 4.0))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
```

### **🔹 LogManager (`config.py`)**
```python
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "video-stream-logs")
WS_HOST = os.getenv("WS_HOST", "0.0.0.0")
WS_PORT = int(os.getenv("WS_PORT", 8080))
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
```

### **🔹 LogConsumer (`config.js`)**
```javascript
module.exports = {
  KAFKA_BROKER: process.env.KAFKA_BROKER || "kafka:9092",
  KAFKA_TOPIC: process.env.KAFKA_TOPIC || "video-stream-logs",
  CONSUMER_GROUP: process.env.CONSUMER_GROUP || "log-consumer-group",
  CLIENT_ID: process.env.CLIENT_ID || "log-consumer-client",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
```

---

## **📌 Stopping & Cleaning Up**
### **1️⃣ Stop All Services**
```sh
docker-compose down
```
### **2️⃣ Remove All Containers & Volumes**
```sh
docker-compose down -v
```
✅ This will remove all services **and persistent Kafka logs**.

---

## **📌 Future Enhancements**
- **Replace LogConsumer.js** with a **real-time log tracking & analytics system**.
- **Integrate visualization** (e.g., Grafana) to monitor logs in real-time.
- **Add authentication & security** for WebSocket connections.
- **Optimize Kafka performance for large-scale log streaming.**

---

## **📌 Troubleshooting**
### **1️⃣ If Kafka Fails to Start**
```sh
docker-compose logs kafka
```
Check if `kafka:9092` is reachable.

### **2️⃣ If LogManager Fails to Connect to Kafka**
```sh
docker logs logmanager
```
Make sure `KAFKA_BROKER` is correctly set.

### **3️⃣ If LogTrafficGenerator Fails to Send Logs**
Check WebSocket connection:
```sh
curl http://localhost:8080/ws
```
Ensure LogManager is **running** and WebSocket is **accessible**.

---

## **📌 Contributing**
Feel free to open issues and submit pull requests to improve the system!

---

## **📌 License**
This project is licensed under the **MIT License**.

🚀 **Happy Logging!**

