import os

# WebSocket URL to connect to LogManager
WS_SERVER_URL = os.getenv("WS_SERVER_URL", "ws://logmanager:8080/ws")  # Default to Docker network name

# Number of initial traffic generator threads
DEFAULT_NUM_THREADS = int(os.getenv("NUM_THREADS", 3))
DEFAULT_MAX_THREADS = int(os.getenv("MAX_THREADS",10))

# Gradual traffic increase/decrease settings
TRAFFIC_MIN_DELAY = float(os.getenv("TRAFFIC_MIN_DELAY", 1.0))  # Minimum delay (seconds)
TRAFFIC_MAX_DELAY = float(os.getenv("TRAFFIC_MAX_DELAY", 4.0))  # Maximum delay (seconds)

# Logging settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
