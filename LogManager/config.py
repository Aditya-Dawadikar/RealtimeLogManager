import os

# Kafka configuration
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "kafka:9092")  # Defaults to "kafka" for Docker network
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "video-stream-logs")

# FastAPI WebSocket settings
WS_HOST = os.getenv("WS_HOST", "0.0.0.0")  # Allows external connections inside Docker
WS_PORT = int(os.getenv("WS_PORT", 8080))

# Logging settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
