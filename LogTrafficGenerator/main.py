import threading
import time
import random
import websocket
from fastapi import FastAPI,Query
import pandas as pd
import json
import signal
import sys
import logging
from config import (WS_SERVER_URL,
                    DEFAULT_NUM_THREADS,
                    TRAFFIC_MAX_DELAY,
                    TRAFFIC_MIN_DELAY,
                    LOG_LEVEL)

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI()

# Control variable for traffic generation
traffic_running = False
traffic_threads = []
num_threads = DEFAULT_NUM_THREADS  # Initial traffic generator threads

def load_movies():
    try:
        df = pd.read_csv("./dataset/netflix_dataset.csv")

        # Keep only necessary columns & drop rows with missing values
        df = df[["id","title", "runtime", "imdb_score"]].dropna()

        # Convert runtime to seconds
        df["runtime"] = df["runtime"] * 60

        # Normalize IMDb ratings for weighted selection
        df["weight"] = df["imdb_score"] / df["imdb_score"].max()  # Normalize between 0-1

        return df

    except Exception as e:
        print(f"Error loading movie dataset: {e}")
        return pd.DataFrame(columns=["id","title", "runtime", "imdb_score", "weight"])

# Load movies globally
movies_df = load_movies()

# Function to get a random movie with weighted probability
def get_random_movie():
    if movies_df.empty:
        return ("Unknown Movie", 300)  # Default fallback

    movie = movies_df.sample(weights=movies_df["weight"]).iloc[0]  # Weighted random selection
    return movie["id"], movie["title"], int(movie["runtime"])

def send_traffic(thread_id):
    global traffic_running
    print(f"Thread-{thread_id} started.")

    ws = None

    try:
        while traffic_running:
            try:
                if ws is None or not ws.connected:
                    print(f"Thread-{thread_id} reconnecting WebSocket...")
                    ws = websocket.create_connection(WS_SERVER_URL)
                
                # Get a movie based on rating weight
                video_id, video_title, video_duration = get_random_movie()
                watched_time = 0
                
                print(f"Thread-{thread_id} watching {video_id} {video_title} ({video_duration}s)")

                while traffic_running and watched_time < video_duration:
                    event_type = random.choices(
                        ["play", "pause", "seek", "buffering", "stop"],
                        weights=[50, 10, 20, 10, 10],  # Higher weight for "play"
                        k=1
                    )[0]

                    if event_type == "seek":
                        seek_time = random.randint(-300, 300)  # Seek ±5 minutes
                        watched_time = max(0, min(video_duration, watched_time + seek_time))

                    if ws is None or not ws.connected:
                        print(f"Thread-{thread_id} Websocket disconnected, retrying...")
                        ws = websocket.create_connection(WS_SERVER_URL)

                    # log_msg = f"User-{thread_id} | Video: {video_title} | Event: {event_type} | Time: {watched_time}s"
                    log_msg = json.dumps({
                        "user_id": f"User-{thread_id}",
                        "video_id": video_id,
                        "video_title": video_title,
                        "event": event_type,
                        "time_seconds": watched_time
                    })
                    ws.send(log_msg)
                    print(f"Thread-{thread_id} Sent:", log_msg)

                    # Random delay for realistic behavior
                    time.sleep(random.uniform(TRAFFIC_MIN_DELAY, TRAFFIC_MAX_DELAY))

                    if event_type == "stop":
                        break

                    watched_time += random.randint(10, 60)  # Simulate watching progress

            except websocket.WebSocketConnectionClosedException:
                print(f"Thread-{thread_id} WebSocket disconnected, retrying...")
                ws = None
                time.sleep(2)  # Retry delay

            except Exception as e:
                print(f"WebSocket error in Thread-{thread_id}: {e}")
                time.sleep(2)

    finally:
        if ws:
            ws.close()
        print(f"Thread-{thread_id} WebSocket connection closed.")

# Start Traffic Generation
@app.get("/start")
def start_traffic():
    global traffic_running, traffic_threads

    if traffic_running:
        return {"message": "Traffic generation already running."}

    traffic_running = True
    traffic_threads = []

    for i in range(random.randint(3, 6)):  # Start between 3-6 threads
        t = threading.Thread(target=send_traffic, args=(i,))
        t.start()
        traffic_threads.append(t)
        time.sleep(random.uniform(1, 2))  # Gradual thread start

    return {"message": f"Traffic generation started with {len(traffic_threads)} threads."}

# Stop Traffic Generation
@app.get("/stop")
def stop_traffic():
    global traffic_running, traffic_threads

    if not traffic_running:
        return {"message": "No active traffic generation."}

    traffic_running = False

    # Gradually stop threads
    for i, t in enumerate(traffic_threads):
        time.sleep(random.uniform(1, 2))  # Gradual stopping delay
        print(f"Stopping Thread-{i}")
        t.join()

    traffic_threads = []
    return {"message": "Traffic generation stopped."}

# Increase Traffic by n Times
@app.get("/increase")
def increase_traffic(n: int = Query(2, description="Multiply traffic by n times")):
    global num_threads

    num_threads *= n  # Increase traffic
    return start_traffic()

# Decrease Traffic by n Times
@app.get("/decrease")
def decrease_traffic(n: int = Query(2, description="Divide traffic by n times")):
    global num_threads

    num_threads = max(1, num_threads // n)  # Decrease but ensure at least 1 user remains
    return start_traffic()

def stop_all_threads():
    global traffic_running, traffic_threads

    if not traffic_running:
        return
    
    print("Stopping all traffic generator threads")
    traffic_running = False

    for i,t in enumerate(traffic_threads):
        print(f"Stopping thread - {i}")
        t.join()
    
    traffic_threads = []
    print("All threads stopped successfully")

def signal_handler(sig, frame):
    print("Detected keyboard interrupt")
    stop_all_threads()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)