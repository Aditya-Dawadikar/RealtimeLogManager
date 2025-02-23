from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from confluent_kafka import Producer
import json
import os
import logging
from config import (KAFKA_BROKER,
                    KAFKA_TOPIC,
                    WS_HOST,
                    WS_PORT,
                    LOG_LEVEL)

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI()

producer = Producer({'bootstrap.servers':KAFKA_BROKER})

@app.websocket("/ws")
async def websocket_endpoint(websocket:WebSocket):
    await websocket.accept()
    print("CLient connected to Websocket")

    try:
        while True:
            message = await websocket.receive_text()
            print(f"received log: {message}")

            # send message to Kafka topic
            producer.produce(KAFKA_TOPIC, key="log", value=message)
            producer.flush()
            print(f"Pulished to Kafka: {message}")
    except WebSocketDisconnect:
        print(f"Client Disconnected. Ready to accept new connections")
    except Exception as e:
        print(f"Websocket error: {e}")
    finally:
        print("Client disconnected")

if __name__=="__main__":
    import uvicorn
    uvicorn.run(app, host=WS_HOST, port=WS_HOST)