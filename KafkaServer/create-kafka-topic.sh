#!/bin/bash

# Define Kafka broker and topic
KAFKA_BROKER="kafka:9092"
TOPIC_NAME="video-stream-logs"

echo "Waiting for Kafka to be ready..."
while ! kafka-topics --list --bootstrap-server $KAFKA_BROKER &>/dev/null; do
  sleep 2
done

echo "Kafka is up! Checking if topic '$TOPIC_NAME' exists..."

# Check if topic exists
if kafka-topics --list --bootstrap-server $KAFKA_BROKER | grep -q "^$TOPIC_NAME$"; then
  echo "Topic '$TOPIC_NAME' already exists."
else
  echo "Creating topic: $TOPIC_NAME"
  kafka-topics --create --topic $TOPIC_NAME --bootstrap-server $KAFKA_BROKER --partitions 3 --replication-factor 1
  echo "Topic '$TOPIC_NAME' created."
fi
