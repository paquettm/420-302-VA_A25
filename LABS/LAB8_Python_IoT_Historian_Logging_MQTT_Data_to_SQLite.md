# Lab 8: Python IoT Historian: Logging MQTT Data to SQLite

## Introduction

In this lab, we’ll develop a **Python3 MQTT data historian** — a program that connects to an MQTT broker, listens to all messages, and logs them to an **SQLite database** for permanent storage and later analysis.  

By the end, you’ll further understand how to:
- Write Python code using functions and callbacks  
- Use **Paho MQTT Client** to communicate with a broker  
- Store data persistently using **SQLite**  
- Use **timestamps** to record when data arrived  

***

## 1. What This Program Does

The application acts as a **data historian**, a bookkeeper that:
1. Connects to an MQTT broker such as **Mosquitto**
2. Subscribes to **all topics** (`"#"`)
3. Every time a message is received:
   - Extracts the **timestamp**, **topic**, and **message payload**
   - Stores them into an **SQLite database (`historian_data.db`)**

This is a real-world pattern used in industrial IoT, smart grids, and research labs for storing time-series data from sensors.

***

## 2. Required Tools

**Install Dependencies:**
```bash
pip install paho-mqtt
```

**Install SQLite CLI (for testing):**
- Linux: `sudo apt install sqlite3`
- macOS: `brew install sqlite`
- Windows: included with Python

**Run MQTT Broker:**
```bash
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

***

## 3. Fundamentals You Need to Know

### MQTT (Message Queuing Telemetry Transport)
An IoT communication protocol that uses the **publish–subscribe model**:

| Component | Description |
|------------|-------------|
| **Broker** | Coordinates message delivery (e.g., Mosquitto) |
| **Publisher** | Sends messages (e.g., a sensor node) |
| **Subscriber** | Receives messages (our Python script) |
| **Topic** | Message channel (e.g., `factory/motor/temp`) |

***

### SQLite

**SQLite** is a simple file-based database.  
In our specific example, data is stored locally in `historian_data.db` and can be queried later using SQL commands.

A typical table structure:

| Column | Type | Meaning |
|---------|------|----------|
| `topic` | TEXT | MQTT topic name |
| `message` | TEXT | Actual data received |
| `timestamp` | TEXT | Time message was logged |

***

## 4. Full Python Code Walkthrough

Let’s analyze the application step-by-step.

```python
import paho.mqtt.client as mqtt
import sqlite3
from datetime import datetime
```

- `paho.mqtt.client`: Library for MQTT communication.
- `sqlite3`: Python’s built-in database library.
- `datetime`: To get and format current time.

***

### Step 1: Broker Configuration

```python
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "#"
MQTT_CLIENT_ID = "historian-client"
DB_FILE = "historian_data.db"
```

Defines connection details:
- Broker runs locally (`localhost`)
- Port `1883` is the default for non-encrypted MQTT
- Subscribing to `"#"` means **all topics**
- The database file `historian_data.db` will be created automatically

***

### Step 2: Connect Callback

```python
def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT")
    client.subscribe(MQTT_TOPIC)
```

When the client first connects:
- Prints confirmation
- Subscribes to **all topics** via `client.subscribe(MQTT_TOPIC)` and since `MQTT_TOPIC == "#"`


***

### Step 3: Message Callback

```python
def on_message(client, userdata, msg):
    print("Got a message")
    payload = msg.payload.decode()  # Convert bytes to string
    topic = msg.topic
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    save_to_database(topic, payload, timestamp)
```

When any message arrives:
1. Extracts **payload** and **topic**
2. Calculates the **timestamp**
3. Sends them to be saved using `save_to_database()`

***

### Step 4: Save Data to Database

```python
def save_to_database(topic, payload, timestamp):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    SQL = "CREATE TABLE IF NOT EXISTS historian_data (topic TEXT, message TEXT, timestamp TEXT);"
    cursor.execute(SQL)

    SQL = "INSERT INTO historian_data (topic, message, timestamp) VALUES (?,?,?);"
    cursor.execute(SQL, (topic, payload, timestamp))

    conn.commit()  # Commit ensures data is saved
    conn.close()
```

Detailed explanation:
1. **Connects to database:** If file doesn’t exist, SQLite will create it.
2. **Creates a cursor:** The cursor is the tool we can use to read and modify the database.
3. **Ensures table exists:** `CREATE TABLE IF NOT EXISTS` creates the structure if missing.
4. **Inserts a record:** The `(?,?,?)` placeholders are safely replaced by Python variables.
5. **Commits changes:** So far the changes are only temporary, but once committed, they become permanent...  bit like git.
6. **Closes connection:** Always cleanly release resources.

***

### Step 5: Main Client Setup

```python
client = mqtt.Client(client_id=MQTT_CLIENT_ID)
client.on_connect = on_connect
client.on_message = on_message
client.connect(MQTT_BROKER, MQTT_PORT, 60)
client.loop_start()
```

Here:
- A **Client object** is created and configured.
- Assigns callback functions, `on_connect` and `on_message`, for connection and message handling.
- Connects to the broker.
- Starts a background **network loop** (`loop_start`) so callbacks are processed asynchronously.

***

### Step 6: Keep Running

```python
try:
    while True:
        pass
except KeyboardInterrupt:
    client.disconnect()
```

This **infinite loop** keeps the program running until you press **Ctrl+C**.  
Then the client disconnects gracefully.

This is a bit different from what we did when we usef the `client.loop_forever()` method.

***

## 5. Testing the Application

### 1. Run the Historian
```bash
python3 historian.py
```

Output:
```
Connected to MQTT
Got a message
```

***

### 2. Simulate MQTT Messages

Use terminal to publish test data:
```bash
mosquitto_pub -h localhost -t "lab/temperature" -m "25.6"
mosquitto_pub -h localhost -t "lab/humidity" -m "55.2"
```

***

### 3. View Logged Data

Check the database:
```bash
sqlite3 historian_data.db
```

Inside SQLite shell:
```sql
SELECT * FROM historian_data;
```

You should see something like:
```
lab/temperature | 25.6 | 2025-10-26 14:27:53
lab/humidity    | 55.2 | 2025-10-26 14:27:55
```

***

## 6. Important Python Concepts

### Callbacks
Functions that run **when events happen** (e.g., data received).
These make the program reactive instead of procedural.

### Database Transactions
Each INSERT is wrapped in a **commit** operation to make sure the data is actually saved.

### Datetime Formatting
`strftime('%Y-%m-%d %H:%M:%S')`  
Creates a readable timestamp like `2025-10-26 14:27:00`.

***

## 7. Common Mistakes and Fixes

| Error | Cause | Fix |
|-------|--------|------|
| `ValueError: cannot decode payload` | Non-text data received | Use `msg.payload` carefully; handle binary data separately |
| `sqlite3.OperationalError: database is locked` | Too many open connections | Always call `conn.close()` |
| No data inserted | Forgot `conn.commit()` | Add `commit()` before `close()` |
| Connection refused | Broker not running | Start Mosquitto service |

***

## 8. Suggested Enhancements

You can extend this base version in many useful ways:
- **Use environment variables** for configuration (`python-dotenv`)
- **Store numeric fields correctly** for analysis
- **Add error logging** via Python’s `logging` module
- **Visualize stored data** with `matplotlib`

Example enhancement for logging numeric conversions:
```python
try:
    payload = float(msg.payload.decode())
except ValueError:
    pass
```

***

## 9. SQLite Query Tips

Use the SQLite shell to summarize data:
```sql
-- Count how many messages received
SELECT COUNT(*) FROM historian_data;

-- Check latest 5 entries
SELECT * FROM historian_data ORDER BY timestamp DESC LIMIT 5;

-- Filter by topic
SELECT * FROM historian_data WHERE topic LIKE 'lab/%';
```

***

## 10. Summary

You’ve built a fully functional MQTT **data historian**.  

It demonstrates practical skills:
- Connecting a Python client to MQTT broker  
- Handling inbound messages with callbacks  
- Using SQLite to store timestamped sensor data  
- Integrating IoT communications with persistent storage  

This simple blueprint is powerful — it’s the foundation for **smart laboratory systems, industrial monitoring**, and **energy data logging**.  