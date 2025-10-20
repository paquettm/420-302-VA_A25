# Lab 7: Python IoT Controller: MQTT-Based Home Automation System

## Introduction

This tutorial will teach you how to build an **IoT (Internet of Things) Controller** using Python that monitors sensor data via MQTT (Message Queuing Telemetry Transport) and automatically triggers actions based on configurable rules. This is a practical example of event-driven programming and IoT automation.

## What You'll Learn

- Object-oriented programming with Python classes
- MQTT protocol for IoT communication
- JSON file handling for configuration
- Exception handling and error management
- Dictionary and list manipulation
- Callback functions and event-driven programming
- Time-based data filtering

## Prerequisites

This project can run on any operating system, but we will use our Raspberry Pi single-board computers in this lab.

So connect your RPi to a screen, keyboard, and mouse before powering it up.

Once the Raspberry Pi is booted up, open the command-line terminal (CTRL-ALT-T) and then create a project folder and enter it as follows:

```bash
mkdir IoT_Controller
cd IoT_Controller
```

To know the complete path to your current project directory (folder), still in your RPi's command-line environment enter the following command:
```bash
pwd
```
It should output something like
```bash
/home/username/IoT_Controller
```
Pay attention to this path and try to remember it for later.

Create a virtual environment and then activate it
```bash
python -m venv venv
source venv/bin/activate
```

Then install the required library within the virtual environment:

```bash
pip install paho-mqtt
```

You'll also need an MQTT broker running locally, myou should already have installed Mosquitto and configured it to accept remote connections. If not, go back to [Lab 6: Telemetry with ESP32, MQTT, and Raspberry Pi](LAB6_Telemetry_with_ESP32_MQTT_and_Raspberry_Pi.md)

## Understanding the Architecture

### MQTT Basics

**MQTT** is a lightweight messaging protocol perfect for IoT devices. It uses a publish/subscribe model:

- **Broker**: Central server that routes messages (running on localhost:1883 of your RPi)
- **Publisher**: Sends messages to topics (e.g., temperature sensors)
- **Subscriber**: Receives messages from topics (our controller)
- **Topic**: Channel name (e.g., "house/temp", "room/AC")

### System Components

Our program will have the following components:
1. **IoT_Controller Class**: Main application logic which receives messages and uses rules to output other messages (responses)
2. **Rules File** (rules.json): Configuration for automated responses
3. **MQTT Client**: Handles message communication
4. **Message Log**: Prevents infinite feedback loops

## Step-by-Step Code Breakdown

To start coding, you probably want to start Thonny and load up our new virtual environment.

If you want to use the package manager feature in Thonny, you may have to upgrade to the latest version.
For more information and instructions, see [Installing Thonny on Raspberry Pi](Installing_Thonny_on_RPi.md).

### Setup: Starting Thonny and Activating the Virtual Environment

Regardless if you use the package manager in Thonny or not, you must activate the virtual environment that stores the packages you wish to use in your program.

To recall the complete path to your current project directory (folder), still in your RPi's command-line environment enter the following command:
```bash
pwd
```
It should output something like
```bash
/home/username/IoT_Controller
```
If this is not the case, try to recall the path from earlier and move to it using the cd command at the command line.

To start Thonny, either enter the `thonny` command at the command line or click on the Raspberry start menu at the top left of your screen, and find `Thonny` under the `Programming` category.

Once Thonny has started, we will activate the virtal environment, in Thonny:
- If you don't see the `File`, `Edit`, `View`, `Run`, `Tools`, and `Help` top menus, your Thonny interface is in simple mode. To switch to regular mode, click on the link at Thonny's top right corner that says `Switch to regular mode`, then click `OK`, close Thonny and start Thonny again. You should now see the menu options. 
- Click `View` and make sure that `Files` is ckecked. You should see a `Files` pane with a file system navigator window on the left side of Thonny.
- Use the file system navigator to change paths in the file system to your project base path, e.g., `/home/username/IoT_Controller/`
- You should now see a folder name with your virtual environment name, e.g., `venv`. Right click on this name and you should see a context menu appear with the option to `Activate virtual environment`... click this.

The virtual environment should now be activated and you could confirm this by seeing that, at the bottom right corner of your Thonny window, you can read **Local Python 3 &middot /home/username/IoT_Controller/venv/bin/python3**
  
### Step 1: Import Required Libraries

```python
import paho.mqtt.client as mqtt
import json
import time
```

- **paho.mqtt.client**: MQTT communication library
- **json**: Parse configuration files
- **time**: Track message timestamps

### Step 2: Define the IoT_Controller Class

```python
class IoT_Controller:
    client = None
    rules = []
    mqtt_data = {}
    message_log = []
```

**Class Variables** (shared across all instances):
- `client`: MQTT client connection object
- `rules`: List of automation rules loaded from JSON
- `mqtt_data`: Dictionary storing latest sensor values by topic
- `message_log`: Records recently sent messages to prevent loops

### Step 3: Configuration Method

```python
def configure():
    filename = "rules.json"
    with open(filename,'r') as file:
        IoT_Controller.rules = json.load(file)

    IoT_Controller.client = mqtt.Client()
    IoT_Controller.client.on_message = IoT_Controller.on_message
    IoT_Controller.client.connect("localhost",1883)
    IoT_Controller.client.subscribe("#")
```

**What's happening:**

1. **Load Rules**: Opens `rules.json` and loads automation rules into memory
2. **Create MQTT Client**: Initializes connection object
3. **Register Callback**: `on_message` function will be called when messages arrive
4. **Connect to Broker**: Establishes connection to local MQTT broker on port 1883
5. **Subscribe to Topics**: The `#` wildcard subscribes to ALL topics

**MQTT Wildcards:**
- `+`: Single-level wildcard (e.g., `house/+` matches `house/temp` but not `house/temp/room`)
- `#`: Multi-level wildcard (e.g., `#` matches everything)

### Step 4: Message Handler (The Core Logic)

```python
def on_message(client, userdata, message):
```

This **callback function** executes automatically when a message arrives.

#### Part A: Parse Incoming Message

```python
try:
    value = float(message.payload.decode("utf-8"))
except ValueError:
    print("String")
    value = message.payload.decode("utf-8")
topic = message.topic
```

- **Try to convert to float**: Sensor data is usually numeric (temperature, humidity)
- **Exception handling**: If conversion fails, treat as string (e.g., "on"/"off")
- **Extract topic**: Get the message channel name

#### Part B: Prevent Feedback Loops

```python
for entry in IoT_Controller.message_log:
    if entry["time"] < time.time() - 5:
        IoT_Controller.message_log.remove(entry)
    elif entry["topic"] == topic and entry["value"] == value:
        return
```

**Why this matters:** If the controller publishes "AC = on", it also receives that message. Without filtering, it would process its own messages infinitely.

- **Clean old entries**: Remove messages older than 5 seconds
- **Detect own messages**: If this message matches one we sent, ignore it (return early)

#### Part C: Store Data

```python
IoT_Controller.mqtt_data[topic] = value
print(topic, value)
```

Update the dictionary with the latest value for this topic. This creates a "current state" snapshot of all sensors.

#### Part D: Evaluate Rules

```python
for rule in IoT_Controller.rules:
    conditions = rule["conditions"]
    conditions_met = True
    
    for condition in conditions:
        topic = condition["topic"]
        try:
            value = IoT_Controller.mqtt_data[topic]
            condition_met = IoT_Controller.condition_met(
                value,
                condition["comparison"],
                condition["value"]
            )
        except KeyError:
            value = None
            condition_met = False
        
        conditions_met = conditions_met and condition_met
```

**Logic flow:**

1. Loop through each rule from `rules.json`
2. Assume all conditions are met initially
3. For each condition in the rule:
   - Get the required topic's current value from `mqtt_data`
   - Check if the condition is satisfied using `condition_met()`
   - Use **AND logic**: ALL conditions must be true
4. **KeyError handling**: If a required topic hasn't received data yet, condition fails

#### Part E: Trigger Actions

```python
if conditions_met:
    action = rule["action"]
    print(action["message"])
    IoT_Controller.client.publish(action["topic"], action["value"])
    
    entry = {
        "time": time.time(),
        "topic": action["topic"],
        "value": action["value"]
    }
    IoT_Controller.message_log.append(entry)
```

When all conditions are satisfied:

1. Print the action message
2. **Publish MQTT message**: Send command to IoT device
3. **Log the message**: Record it to prevent processing our own message

### Step 5: Condition Evaluation

```python
def condition_met(value, comp_operator, comp_value):
    if comp_operator == ">":
        return value > comp_value
    if comp_operator == ">=":
        return value >= comp_value
    if comp_operator == "<":
        return value < comp_value
    if comp_operator == "<=":
        return value <= comp_value
    if comp_operator == "==":
        return value == comp_value
```

This helper function evaluates comparison operators. It implements a simple **rules engine** supporting:
- Greater than: `>`
- Greater than or equal: `>=`
- Less than: `<`
- Less than or equal: `<=`
- Equal to: `==`

### Step 6: Run Method

```python
def run():
    IoT_Controller.client.loop_forever()
```

**`loop_forever()`**: Starts an infinite loop that:
- Maintains connection to the broker
- Listens for incoming messages
- Calls `on_message()` when messages arrive

This is a **blocking call** (program waits here indefinitely).

### Step 7: Main Entry Point

```python
def main():
    IoT_Controller.configure()
    IoT_Controller.run()

if __name__ == "__main__":
    main()
```

**Standard Python pattern:**
- `main()`: Initialize and start the controller
- `if __name__ == "__main__"`: Only runs when script is executed directly (not imported)

## Creating the Rules Configuration File

Create a file named `rules.json` in the same directory:

```json
[
  {
    "conditions": [
      {
        "topic": "house/temp",
        "comparison": ">",
        "value": 30
      }
    ],
    "action": {
      "message": "It's too hot, turn on the AC",
      "topic": "room/AC",
      "value": "on"
    }
  },
  {
    "conditions": [
      {
        "topic": "house/temp",
        "comparison": "<",
        "value": 18
      }
    ],
    "action": {
      "message": "It's too cold, turn on the heater",
      "topic": "room/heater",
      "value": "on"
    }
  },
  {
    "conditions": [
      {
        "topic": "house/humidity",
        "comparison": ">",
        "value": 70
      },
      {
        "topic": "house/temp",
        "comparison": ">",
        "value": 25
      }
    ],
    "action": {
      "message": "High humidity and temperature detected, activate dehumidifier",
      "topic": "room/dehumidifier",
      "value": "on"
    }
  }
]
```

**Rule Structure:**

- **conditions**: Array of conditions (all must be true)
  - `topic`: MQTT topic to monitor
  - `comparison`: Operator (`>`, `<`, `>=`, `<=`, `==`)
  - `value`: Threshold value
- **action**: What to do when conditions are met
  - `message`: Human-readable description
  - `topic`: MQTT topic to publish to
  - `value`: Value to send

## Testing the Application

### Terminal 1: Start the Controller

```bash
python3 iot_controller.py
```

### Terminal 2: Simulate Temperature Sensor

```bash
mosquitto_pub -h localhost -t "house/temp" -m "32"
```

**Expected output in Terminal 1:**
```
house/temp 32.0
It's too hot, turn on the AC
room/AC on
```

### Terminal 3: Monitor All Messages

```bash
mosquitto_sub -h localhost -t "#" -v
```

This shows all MQTT traffic including controller actions.

### Test Multiple Conditions

```bash
# Set high temperature
mosquitto_pub -h localhost -t "house/temp" -m "26"

# Set high humidity (both conditions now met)
mosquitto_pub -h localhost -t "house/humidity" -m "75"
```

**Output:**
```
house/temp 26.0
house/humidity 75.0
High humidity and temperature detected, activate dehumidifier
room/dehumidifier on
```

## Key Python Concepts Demonstrated

### 1. **Class Variables vs Instance Variables**

All variables in this class are **class variables** (shared across all instances):

```python
class IoT_Controller:
    client = None  # Class variable
```

This works because we only need one controller instance.

### 2. **Exception Handling**

```python
try:
    value = float(message.payload.decode("utf-8"))
except ValueError:
    value = message.payload.decode("utf-8")
```

Gracefully handles both numeric and string data.

### 3. **Dictionary Operations**

```python
IoT_Controller.mqtt_data[topic] = value  # Store
value = IoT_Controller.mqtt_data[topic]  # Retrieve
```

Uses topics as keys to maintain current state.

### 4. **List Comprehension and Filtering**

```python
for entry in IoT_Controller.message_log:
    if entry["time"] < time.time() - 5:
        IoT_Controller.message_log.remove(entry)
```

Automatically cleans old entries.

### 5. **Callback Functions**

```python
IoT_Controller.client.on_message = IoT_Controller.on_message
```

Registers a function to be called asynchronously when events occur.

### 6. **JSON Parsing**

```python
with open(filename, 'r') as file:
    IoT_Controller.rules = json.load(file)
```

Loads complex nested data structures from files.

## Common Issues and Solutions

### Issue 1: Connection Refused

**Error:** `ConnectionRefusedError: [Errno 111] Connection refused`

**Solution:** Ensure Mosquitto is running:
```bash
sudo systemctl start mosquitto  # Linux
brew services start mosquitto   # macOS
```

### Issue 2: Module Not Found

**Error:** `ModuleNotFoundError: No module named 'paho'`

**Solution:** Install the library:
```bash
pip3 install paho-mqtt
```

### Issue 3: Rules File Not Found

**Error:** `FileNotFoundError: [Errno 2] No such file or directory: 'rules.json'`

**Solution:** Create `rules.json` in the same directory as your Python script.

### Issue 4: Infinite Loop of Messages

If your controller keeps triggering itself, the message log filtering isn't working. Check that:
- Time comparison is correct
- Topic and value matching is exact

## Extensions and Improvements


### 1. Add Logging to File

```python
import logging

logging.basicConfig(
    filename='iot_controller.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

# In on_message:
logging.info(f"Received: {topic} = {value}")
```

### 2. Support NOT Equal Operator

```python
def condition_met(value, comp_operator, comp_value):
    # ... existing code ...
    if comp_operator == "!=":
        return value != comp_value
```

### 3. Add OR Logic Between Conditions

Modify the rules structure to support different logical operators.

Otherwise, you may simply add new conditions in your rules.json file that lead to the same response.

```json
[
  {
    "conditions": [
      {"topic": "house/temp","comparison": ">","value": 30}
    ],
    "action": {
      "message": "It's too hot, turn on the ventilation",
      "topic": "room/vent",
      "value": "on"
    }
  },
  {
    "conditions": [
      {"topic": "house/humidity","comparison": ">","value": 50}
      {"topic": "outside/temp","comparison": ">","value": 0}
    ],
    "action": {
      "message": "It's too damp, turn on the ventilation",
      "topic": "room/vent",
      "value": "on"
    }
  },
  {
    "conditions": [
      {"topic": "house/humidity","comparison": ">","value": 70}
      {"topic": "outside/temp","comparison": ">","value": -10}
    ],
    "action": {
      "message": "It's too damp, turn on the ventilation",
      "topic": "room/vent",
      "value": "on"
    }
  }
]
```

### 4. Remote Broker Support

```python
# In configure():
broker_host = "mqtt.example.com"
broker_port = 8883  # Secure MQTT
IoT_Controller.client.connect(broker_host, broker_port)
```

### 5. Add Authentication

```python
IoT_Controller.client.username_pw_set("username", "password")
```

### 6. External Setup

Consider using the `dotenv` module to load private configurations form a `.env` configuration file.


## Real-World Applications

This pattern is used in:

- **Smart home automation** (lights, thermostats, security)
- **Industrial monitoring** (temperature, pressure, vibration sensors)
- **Agriculture** (soil moisture, greenhouse climate control)
- **Energy management** (solar panels, battery monitoring)
- **Healthcare** (patient monitoring, alert systems)

## Summary

You've learned how to build a complete IoT automation system that:

* Connects to MQTT brokers and subscribes to topics  
* Processes incoming sensor data with error handling  
* Evaluates complex multi-condition rules  
* Triggers automated actions based on configurable logic  
* Prevents feedback loops using time-based filtering  
* Uses JSON for flexible configuration
