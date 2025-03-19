require('dotenv').config(); // Load environment variables from .env file

module.exports = {
  KAFKA_BROKER: process.env.KAFKA_BROKER || "kafka:9092",  // Kafka container name inside Docker network
  KAFKA_TOPIC: process.env.KAFKA_TOPIC || "video-stream-logs",
  CONSUMER_GROUP: process.env.CONSUMER_GROUP || "log-filter-group",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  CLIENT_ID: process.env.CLIENT_ID || "log-filter-instance-1",
  ELASTICSEARCH_HOST: process.env.ELASTICSEARCH_HOST || 'http://elasticsearch:9200'
};
