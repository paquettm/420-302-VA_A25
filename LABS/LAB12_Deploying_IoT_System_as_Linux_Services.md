# Lab 12: Production Deployment - Running IoT Services as Linux System Services

## Introduction

In this lab, you'll deploy your complete IoT system as **Linux system services** on your Raspberry Pi running Desktop OS. You'll transform your applications from manually-started programs into **production-ready services** that:

- **Start automatically** when the Raspberry Pi boots
- **Run in the background** without requiring terminal windows
- **Restart automatically** if they crash
- **Communicate with each other** to detect problems and coordinate operations
- **Run securely** under a dedicated system user account

**By the end of this lab, you'll understand:**
- Linux systemd service management
- Virtual environment deployment for Python services
- Inter-process communication using HTTP and signals
- Service health monitoring and error reporting
- Production deployment best practices for Linux systems

***

## Prerequisites

- Completed Labs 7, 8, 9, 10, and 11
- Raspberry Pi with Desktop OS
- Terminal access
- All three applications working in your project directory:
  - `historian.py` (from Lab 8)
  - `iot_controller.py` (from Lab 7)
  - `app.py` (from Labs 9, 10, 11)
- Virtual environment with all dependencies installed

***

## Part 1: Understanding Linux Services

### What is a Service?

A **service** (also called a **daemon**) is a program that runs in the background without user interaction. Services you may already use:

- **Mosquitto MQTT broker** - Handles MQTT messages
- **Desktop environment** - Provides your graphical interface

A **SSH server** is a service that allows **Secure SHell** connections to allows remote login through the command-line environment. It is a special **terminal** allowing secure connections to the configured **shell**.

#### Terminal vs. Shell in Linux

**Terminal**: A **program that displays text and accepts keyboard input**. It's the graphical window or text interface you see on screen. Think of it as the physical "device" — like a telephone handset. Examples: GNOME Terminal, xterm, Konsole.

**Shell**: A **command interpreter program that runs inside the terminal**. It reads commands you type, executes them, and displays results. Think of it as the "brain" that understands your commands. Examples: bash, zsh, sh.

**Key Difference**: The **terminal displays**, the **shell processes**. When you type a command in the terminal window, the shell inside interprets it and tells the operating system what to do.

### systemd: The Service Manager

Modern Linux systems use **systemd** to manage services. systemd:
- Starts services in the correct order at boot time
- Monitors services and restarts them if they crash
- Manages logging through the journal
- Controls permissions and security

### Key Service Concepts

**Service States:**
- **Active (running)** - Currently executing
- **Inactive (dead)** - Not running
- **Failed** - Crashed or exited with error
- **Enabled** - Will start automatically at boot
- **Disabled** - Won't start automatically

**Service Files:** Configuration files (`.service`) that tell systemd:
- What command to run
- Which user should run it
- When to start it
- What to do if it crashes
- Security restrictions

***

## Part 2: Preparing Applications for Production

### Step 1: Enhance Applications with Monitoring Features

Before deploying as services, we need to add inter-process communication and health monitoring to your applications.

#### Enhanced historian.py

**Add these imports at the top:**

```python
import os
import signal
import sys
import time
```

**Add configuration constants after imports:**

```python
# PID and heartbeat files for monitoring
PID_FILE = "/tmp/historian.pid"
HEARTBEAT_FILE = "/tmp/historian.heartbeat"
```

#### Explanation:
- **PID_FILE**: Stores the process ID so other programs can find this service
- **HEARTBEAT_FILE**: Updated regularly to prove the service is alive
- **/tmp/**: Standard Linux location for temporary runtime files

**Add helper functions before your callback functions:**

```python
def save_pid():
    """Save process ID to file for monitoring"""
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    print(f"Historian PID {os.getpid()} saved to {PID_FILE}")

def update_heartbeat():
    """Update heartbeat file with current timestamp"""
    with open(HEARTBEAT_FILE, 'w') as f:
        f.write(datetime.now().isoformat())

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    print(f"\nReceived signal {signum}, shutting down historian...")
    # Clean up heartbeat file
    if os.path.exists(HEARTBEAT_FILE):
        os.remove(HEARTBEAT_FILE)
    sys.exit(0)
```

#### Explanation:

**`save_pid()` function:**
- **`os.getpid()`** returns the current process's ID number
- Writes this number to a file so other services can send signals to this process
- Process IDs (PIDs) are unique identifiers Linux assigns to every running program

**`update_heartbeat()` function:**
- Writes current time to a file
- Other services can check if this file is recent to know historian is alive
- **`datetime.now().isoformat()`** formats time as "2025-11-19T14:30:15"

**`signal_handler()` function:**
- Called when the service receives a shutdown signal
- **Signals** are how Linux processes communicate (like sending messages)
- **SIGTERM** = "please shut down gracefully"
- **SIGINT** = Ctrl+C keyboard interrupt
- Cleans up the heartbeat file before exiting

**Update your main execution block at the bottom:**

```python
if __name__ == "__main__":
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # Save PID for monitoring
    save_pid()
    
    # Create MQTT client
    client = mqtt.Client(client_id=MQTT_CLIENT_ID)
    client.on_connect = on_connect
    client.on_message = on_message
    
    # Connect and start
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        print(f"Historian connected to {MQTT_BROKER}:{MQTT_PORT}")
        client.loop_start()  # Start in background thread
        
        # Main loop - update heartbeat every 5 seconds
        while True:
            update_heartbeat()
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.loop_stop()
        client.disconnect()
        if os.path.exists(HEARTBEAT_FILE):
            os.remove(HEARTBEAT_FILE)
        print("Historian shut down cleanly.")
```

#### Explanation:

**Signal registration:**
```python
signal.signal(signal.SIGTERM, signal_handler)
```
- **`signal.signal(SIGNAL_TYPE, function)`** tells Python: "when you receive this signal, call this function"
- Allows graceful shutdown instead of abrupt termination

**Main loop structure:**
- **`client.loop_start()`** runs MQTT in a background thread
- Main thread stays in `while True` loop updating heartbeat
- **`time.sleep(5)`** waits 5 seconds between heartbeat updates
- Heartbeat proves the service is alive and not frozen

**Exception handling:**
- **`try/except/finally`** ensures cleanup happens even if errors occur
- `finally` block runs no matter how the program exits

***

#### Enhanced iot_controller.py

We start by making adjustments to `class IoT_Controller`.

In the changes we are implementing in this lab, the controller program will no longer load the rules only at the configuration phase.
Rules will be reloaded when changes are made by the user over the Web interface.
So the rule loading instructions will have to be used on several occasions.

One of the principles of good programming is **DRY**, which stands for **Don't Repeat Yourself**.
So instead of repeating the loading code, we will make a function dedicated to loading rules.

Just below the initial 4 property declarations, add the following method to load the rules:

```python
def load_rules():
    try:
        with open(RULES_FILE, 'r') as file:
            IoT_Controller.rules = json.load(file)
        return None
    except Exception as e:
        return e
```
This function loads the rules if all goes well and returns the exception if something goes wrong.

We will use the `load_rules` method in a modified `IoT_Controller` `configure` method as follows:

```python
def configure():
    e = IoT_Controller.load_rules()
    if e == None:
        print(f"✓ Rules loaded successfully ({len(IoT_Controller.rules)} rules)")
    else:
        print(f"✗ Error reloading rules: {e}")
        print(f"Make sure {os.getcwd()}/{RULES_FILE} is present and proper JSON")

    IoT_Controller.client = mqtt.Client()
    IoT_Controller.client.on_message = IoT_Controller.on_message
    IoT_Controller.client.connect(MQTT_BROKER,MQTT_PORT)
    IoT_Controller.client.subscribe("#")
```
Notice that we are now replacing hardcoded `"localhost"` and `1883` by variables which we will initialise in the top sections of our code.

Go back to the top sections of your `iot_controller.py` file

**Add these imports:**

```python
import os
import signal
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from datetime import datetime
```

#### Explanation:
- **`http.server`**: Built-in Python web server for reload endpoint
- **`threading`**: Allows running HTTP server and MQTT client simultaneously

**Add configuration constants:**

```python
# Configuration
RULES_FILE = "rules.json"
MQTT_BROKER = "localhost"
MQTT_PORT = 1883

# Monitoring files
PID_FILE = "/tmp/iot_controller.pid"
HEARTBEAT_FILE = "/tmp/iot_controller.heartbeat"
HISTORIAN_HEARTBEAT = "/tmp/historian.heartbeat"
```

We are adding a few file paths for the files we will create to monitor the system health:
- **`PID_FILE`** will be written with the process ID of the Python instance running `iot_controller.py`
- **`HEARTBEAT_FILE`** will be written periodically with a timestamp so other processes can monitor if the controller still works
- **`HISTORIAN_HEARTBEAT`** will be read to monitor the historian program process

**Add helper functions:**

```python
def save_pid():
    """Save process ID"""
    with open(PID_FILE, 'w') as f:
        f.write(str(os.getpid()))
    print(f"Controller PID {os.getpid()} saved to {PID_FILE}")

def update_heartbeat():
    """Update heartbeat timestamp"""
    with open(HEARTBEAT_FILE, 'w') as f:
        f.write(datetime.now().isoformat())

def check_historian_health():
    """Check if historian is running by reading its heartbeat"""
    try:
        with open(HISTORIAN_HEARTBEAT, 'r') as f:
            last_beat = f.read().strip()
            # Parse timestamp
            last_time = datetime.fromisoformat(last_beat)
            age_seconds = (datetime.now() - last_time).seconds
            
            if age_seconds < 15:
                print(f"✓ Historian is healthy (heartbeat {age_seconds}s ago)")
                return True
            else:
                print(f"⚠ WARNING: Historian heartbeat is {age_seconds}s old - may be dead!")
                return False
    except FileNotFoundError:
        print("✗ ERROR: Historian heartbeat file not found - Historian may not be running!")
        return False
    except Exception as e:
        print(f"✗ ERROR checking historian: {e}")
        return False
```

#### Explanation:

**`check_historian_health()` function:**
- Reads historian's heartbeat file
- **`datetime.fromisoformat()`** converts string back to datetime object
- **`(datetime.now() - last_time).seconds`** calculates age in seconds
- If heartbeat is recent (<15 seconds), historian is healthy
- If heartbeat is old or missing, historian is probably dead
- Returns True/False so other code can react

**Add HTTP reload handler:**

As previously stated, the rules have to be reloaded at some point wen they change so that the iot_controller can continue functioning with its internal memory and change its operations with new user configurations.

`class ReloadHandler` will handle reload requests coming from the Web:

```python
class ReloadHandler(BaseHTTPRequestHandler):
    """HTTP endpoint for reloading rules.json"""
    
    def do_POST(self):
        """Handle POST requests to /reload"""
        if self.path == '/reload':
            print("Reload request received via HTTP")
            
            # Reload the rules
            e = IoT_Controller.load_rules()
            if e == None:
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {'status': 'success', 'message': f'Loaded {len(IoT_Controller.rules)} rules'}
                self.wfile.write(json.dumps(response).encode())
                
                print(f"✓ Rules reloaded successfully ({len(IoT_Controller.rules)} rules)")
            else:
                # Send error response
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {'status': 'error', 'message': str(e)}
                self.wfile.write(json.dumps(response).encode())
                
                print(f"✗ Error reloading rules: {e}")
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        """Suppress default HTTP logging"""
        pass

def run_http_server():
    """Run HTTP server in background thread"""
    server = HTTPServer(('localhost', 5001), ReloadHandler)
    print("HTTP reload endpoint: http://localhost:5001/reload")
    server.serve_forever()
```

#### Explanation:

Class `ReloadHandler` inherits the characteristics of another class, `BaseHTTPRequestHandler` through the Object-Oriented Programming mechanism of inheritance: properties and methods are passed down through this inheritance.
This class defines what to do when receiving HTTP requests on a very basic server implemented to reload the IoT Controller rules.

**HTTP Server for Reload:**
- **`HTTPServer`** creates a simple web server on port 5001
- **`do_POST()`** method handles POST requests
- When `/reload` is requested, reloads `rules.json`
- Returns JSON response: `{'status': 'success', 'message': '...'}`
- Web app will call this endpoint to trigger reloads

**Why HTTP instead of just watching the file?**
- User controls exactly when reload happens (after multiple edits)
- Provides feedback (success/error message)
- Works across network if needed later

**`run_http_server()` function:**
- **`server.serve_forever()`** runs indefinitely
- Will be called in a background thread so MQTT still works

**Add signal handler:**

Add the signal handler after the `run_http_server` function definition.
This will handle rule reload requests coming from the operating system as well as program shutdown requests from the user (`CTRL-C`) and from the OS.

```python
def signal_handler(signum, frame):
    """Handle shutdown and reload signals"""
    if signum == signal.SIGHUP:
        # SIGHUP = reload configuration
        print("\nReceived SIGHUP signal, reloading rules...")
        e = IoT_Controller.load_rules()
        if e == None:
            print(f"✓ Rules reloaded ({len(IoT_Controller.rules)} rules)")
        except Exception as e:
            print(f"✗ Error reloading rules: {e}")
            
    elif signum == signal.SIGTERM or signum == signal.SIGINT:
        # SIGTERM/SIGINT = shutdown
        print(f"\nReceived signal {signum}, shutting down controller...")
        if os.path.exists(HEARTBEAT_FILE):
            os.remove(HEARTBEAT_FILE)
        sys.exit(0)
```

#### Explanation:

**Two types of signals:**
- **SIGHUP** (Hangup): Traditional Unix signal meaning "reload configuration"
- **SIGTERM** (Terminate): Graceful shutdown request
- **SIGINT** (Interrupt): Ctrl+C pressed

**Why both HTTP and signals for reload?**
- **HTTP**: Primary method, called by web app, provides feedback
- **SIGHUP**: Backup method, can be triggered manually or by system tools
- Redundancy ensures reload always works

**Update main execution block:**

In what follows we will 

```python
if __name__ == "__main__":
    # Register signal handlers
    signal.signal(signal.SIGHUP, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    # Save PID
    save_pid()
    
    # Check if historian is running
    check_historian_health()
    
    # Configure and start controller
    IoT_Controller.configure()
    IoT_Controller.run()  # Starts MQTT in background
    
    # Start HTTP reload server in background thread
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()
    
    print("IoT Controller started successfully")
    print(f"  - MQTT: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"  - HTTP reload: http://localhost:5001/reload")
    print(f"  - Manual reload: kill -HUP {os.getpid()}")
    
    # Main loop with heartbeat
    try:
        while True:
            update_heartbeat()
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received")
    finally:
        if os.path.exists(HEARTBEAT_FILE):
            os.remove(HEARTBEAT_FILE)
        print("IoT Controller shut down cleanly")
```

#### Explanation:

**Threading:**
```python
http_thread = threading.Thread(target=run_http_server, daemon=True)
http_thread.start()
```
- **`threading.Thread()`** creates a new thread of execution
- **`target=run_http_server`** says what function to run in that thread
- **`daemon=True`** means thread will exit when main program exits
- **`.start()`** begins running the thread

**Result:** Both MQTT client and HTTP server run simultaneously


#### Finale

I like to leave a little detail to the very end to see who is paying attention and who is not.
This program did not previously have a running loop but instead relied on the `IoT_Controller.run()` method's call of `IoT_Controller.client.loop_forever()` to remain running.
This function in effect ran a loop internally and never exited.

But since we now want code to update a heartbeat to run after this call, we must change it to a call to `IoT_Controller.client.loop_start()` which is a function that creates a working thread and then exits, only terminating when the main program thread terminates.

So the `run` method should look like this.
```python
def run():
    IoT_Controller.client.loop_start()
```

***

#### Enhanced app.py (Web Application)

**Add to imports:**

```python
import requests
import signal
```

**Add after your existing helper functions and before routes:**

```python
# Monitoring files
CONTROLLER_PID = "/tmp/iot_controller.pid"
CONTROLLER_HEARTBEAT = "/tmp/iot_controller.heartbeat"
HISTORIAN_HEARTBEAT = "/tmp/historian.heartbeat"

def check_service_health(service_name, heartbeat_file):
    """Check if a service is healthy by reading heartbeat"""
    try:
        with open(heartbeat_file, 'r') as f:
            last_beat = f.read().strip()
            last_time = datetime.fromisoformat(last_beat)
            age = (datetime.now() - last_time).seconds
            
            if age < 10:
                return {'status': 'healthy', 'age': age}
            elif age < 30:
                return {'status': 'warning', 'age': age}
            else:
                return {'status': 'dead', 'age': age}
    except FileNotFoundError:
        return {'status': 'missing', 'age': None}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}

def get_system_status():
    """Get health status of all services"""
    return {
        'historian': check_service_health('historian', HISTORIAN_HEARTBEAT),
        'controller': check_service_health('controller', CONTROLLER_HEARTBEAT)
    }
```

#### Explanation:

**`check_service_health()` function:**
- Reads another service's heartbeat file
- Calculates how old the heartbeat is
- Returns status dictionary with health information:
  - **healthy**: heartbeat < 10 seconds old
  - **warning**: heartbeat 10-30 seconds old
  - **dead**: heartbeat > 30 seconds old
  - **missing**: heartbeat file doesn't exist

**Add new routes:**

```python
@app.route('/system/status')
@login_required
def system_status():
    """Display system health dashboard"""
    status = get_system_status()
    return render_template('system_status.html', status=status)

@app.route('/rules/reload', methods=['POST'])
@login_required
def reload_controller():
    """Send reload signal to IoT Controller"""
    # Try HTTP method first (preferred)
    try:
        response = requests.post('http://localhost:5001/reload', timeout=5)
        if response.status_code == 200:
            flash('IoT Controller rules reloaded successfully!', 'success')
            return redirect(url_for('list_rules'))
    except requests.exceptions.ConnectionError:
        pass  # Fall through to signal method
    except requests.exceptions.Timeout:
        pass  # Fall through to signal method
    
    # Fallback to Unix signal method
    try:
        with open(CONTROLLER_PID, 'r') as f:
            pid = int(f.read().strip())
        os.kill(pid, signal.SIGHUP)
        flash('Reload signal sent to IoT Controller!', 'success')
    except FileNotFoundError:
        flash('Error: IoT Controller PID file not found. Is controller running?', 'danger')
    except Exception as e:
        flash(f'Error sending reload signal: {e}', 'danger')
    
    return redirect(url_for('list_rules'))
```

#### Explanation:

**`reload_controller()` route:**
1. **First tries HTTP POST** to `http://localhost:5001/reload`
   - **`timeout=5`** means give up after 5 seconds
   - If successful, shows success message
2. **Falls back to Unix signal** if HTTP fails
   - Reads controller's PID from file
   - **`os.kill(pid, signal.SIGHUP)`** sends SIGHUP signal
   - Despite name, doesn't kill - just sends signal
3. **Handles errors gracefully** with user-friendly messages

**Two-tier approach ensures reload always works**

**Create system status template:**

Create `templates/system_status.html`:

```html
{% extends "base.html" %}

{% block title %}System Status{% endblock %}

{% block content %}
    <h1>System Health Dashboard</h1>
    
    <div class="status-grid">
        <div class="status-card {% if status.historian.status == 'healthy' %}status-healthy{% elif status.historian.status == 'warning' %}status-warning{% else %}status-error{% endif %}">
            <h3>📊 Historian Service</h3>
            {% if status.historian.status == 'healthy' %}
                <p class="status-text">✓ Running (heartbeat {{ status.historian.age }}s ago)</p>
            {% elif status.historian.status == 'warning' %}
                <p class="status-text">⚠ Slow (heartbeat {{ status.historian.age }}s ago)</p>
            {% elif status.historian.status == 'missing' %}
                <p class="status-text">✗ Not Running (no heartbeat file)</p>
            {% else %}
                <p class="status-text">✗ Dead (heartbeat {{ status.historian.age }}s ago)</p>
            {% endif %}
        </div>
        
        <div class="status-card {% if status.controller.status == 'healthy' %}status-healthy{% elif status.controller.status == 'warning' %}status-warning{% else %}status-error{% endif %}">
            <h3>🤖 Controller Service</h3>
            {% if status.controller.status == 'healthy' %}
                <p class="status-text">✓ Running (heartbeat {{ status.controller.age }}s ago)</p>
            {% elif status.controller.status == 'warning' %}
                <p class="status-text">⚠ Slow (heartbeat {{ status.controller.age }}s ago)</p>
            {% elif status.controller.status == 'missing' %}
                <p class="status-text">✗ Not Running (no heartbeat file)</p>
            {% else %}
                <p class="status-text">✗ Dead (heartbeat {{ status.controller.age }}s ago)</p>
            {% endif %}
        </div>
    </div>
    
    <div class="text-center mt-20">
        <button onclick="location.reload()" class="btn btn-primary">↻ Refresh Status</button>
        <a href="{{ url_for('plot_data') }}" class="btn btn-secondary">Back to Dashboard</a>
    </div>
{% endblock %}
```

**Add CSS to `static/styles.css`:**

```css
/* System Status Styles */
.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.status-card {
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    border: 3px solid;
}

.status-healthy {
    background-color: #d4edda;
    border-color: #28a745;
}

.status-warning {
    background-color: #fff3cd;
    border-color: #ffc107;
}

.status-error {
    background-color: #f8d7da;
    border-color: #dc3545;
}

.status-text {
    font-size: 18px;
    font-weight: bold;
    margin: 15px 0;
}
```

**Update the navigation section in `templates/base.html`:**

```html
<nav>
    <ul>
        <li><a href="{{ url_for('plot_data') }}">Dashboard</a></li>
        <li><a href="{{ url_for('list_rules') }}">Manage Rules</a></li>
        <li><a href="{{ url_for('system_status') }}">System Status</a></li>
        {% if current_user.is_authenticated %}
            <li style="margin-left: auto;"><a href="{{ url_for('logout') }}">Logout ({{ current_user.id }})</a></li>
        {% endif %}
    </ul>
</nav>
```

**Add reload button to `templates/rules_list.html`:**

Find the line with "Create New Rule" button and update to:

```html
<div class="text-center mb-20">
    <a href="{{ url_for('create_rule') }}" class="btn btn-success">+ Create New Rule</a>
    <form method="POST" action="{{ url_for('reload_controller') }}" style="display: inline; margin-left: 10px;">
        <button type="submit" class="btn btn-primary">↻ Reload IoT Controller</button>
    </form>
</div>
```

#### Explanation:
- **Inline form** so button appears next to "Create New Rule"
- POST method triggers the reload route
- User can reload configuration after making changes

***

### Step 2: Test Enhanced Applications

**Before deploying as services, test the enhancements:**

```bash
# Terminal 1: Start historian
cd ~/IoT_Controller
source venv/bin/activate
python3 historian.py
```

**Check heartbeat is being created:**
```bash
# Terminal 2
cat /tmp/historian.heartbeat
# Should show recent timestamp
```

**Start controller:**
```bash
# Terminal 3
cd ~/IoT_Controller
source venv/bin/activate
python3 iot_controller.py
# Should print "✓ Historian is healthy"
```

**Start web app:**
```bash
# Terminal 4
cd ~/IoT_Controller
source venv/bin/activate
python3 app.py
```

You probably have to install **requests** to the virtual environment... How do you do this?


**Visit in browser:**
- `http://localhost:5000/system/status`
- Both services should show green (healthy)

**Test reload:**
- Edit a rule through web interface
- Click "Reload IoT Controller" button
- Check controller terminal - should show "✓ Rules reloaded"

**If everything works, proceed to deployment!**

***

## Part 3: Create Production Directory and Service User

### Step 1: Create Dedicated System User

```bash
sudo useradd -r -s /bin/false -m -d /opt/iot_system iotuser
```

#### Detailed Explanation:

**`sudo`**: Run command as administrator (root)

**`useradd`**: Create new user account

**`-r`**: Create **system user** (for services, not humans)
- System users get UID (User ID) below 1000
- Separated from regular user accounts (which start at 1000)
- Won't appear in login screens
- Intended for running background services

**`-s /bin/false`**: Set login shell to `/bin/false`
- `/bin/false` is a program that immediately exits with failure
- **Prevents interactive login** - even if someone has the password, they can't log in
- Security measure: service accounts shouldn't allow shell access
- If compromised, attacker can't use this account to run commands

**`-m -d /opt/iot_system`**: Create home directory
- **`-m`**: Make home directory
- **`-d /opt/iot_system`**: Specify directory location
- `/opt/` is standard Linux location for optional/add-on software
- Creates `/opt/iot_system` as home for this user
- Our applications will live here

**Why a dedicated user?**
1. **Security isolation**: If service is compromised, damage is limited
2. **Permission control**: Service only accesses files it owns
3. **Audit trail**: Can see what this user does in logs
4. **Professional practice**: Production servers always use dedicated service users

### Step 2: Create Directory Structure

```bash
sudo mkdir -p /opt/iot_system/logs
sudo mkdir -p /var/lib/iot_system
```

#### Explanation:

**`mkdir -p`**: Make directory and any missing parent directories

**`/opt/iot_system/`**: Application home
- Will contain Python scripts, virtual environment, rules.json

**`/opt/iot_system/logs/`**: Log file storage
- Services will write detailed logs here
- Separate from main directory for organization

**`/var/lib/iot_system/`**: Runtime data
- **`/var/lib/`** is Linux standard for application state data
- Will contain:
  - PID files (process IDs)
  - Heartbeat files
  - historian_data.db (SQLite database)
- Separate from `/opt/` because data changes frequently

### Step 3: Copy and Setup Virtual Environment

```bash
# Copy your project files
sudo cp -r ~/IoT_Controller/* /opt/iot_system/

# Create virtual environment in production location
cd /opt/iot_system
sudo python3 -m venv venv

# Activate it and install dependencies
sudo venv/bin/pip install paho-mqtt flask plotly flask-login werkzeug requests
```

#### Explanation:

**Why copy instead of move?**
- Keeps your development version safe
- Can continue developing without affecting production

**Why create new venv instead of copying?**
- Virtual environments contain absolute paths
- Copying venv from ~/IoT_Controller would have wrong paths
- Creating fresh venv in /opt/iot_system ensures correct paths

**`sudo venv/bin/pip install...`**:
- Installs packages directly into production virtual environment
- Uses `sudo` because `/opt/` requires admin privileges
- Installs all dependencies your applications need

### Step 4: Update File Paths in Applications

**Edit `/opt/iot_system/historian.py`:**

```python
# Update these lines:
DB_FILE = "/var/lib/iot_system/historian_data.db"
PID_FILE = "/var/lib/iot_system/historian.pid"
HEARTBEAT_FILE = "/var/lib/iot_system/historian.heartbeat"
```

**Edit `/opt/iot_system/iot_controller.py`:**

```python
# Update these lines:
RULES_FILE = "/opt/iot_system/rules.json"
PID_FILE = "/var/lib/iot_system/controller.pid"
HEARTBEAT_FILE = "/var/lib/iot_system/controller.heartbeat"
HISTORIAN_HEARTBEAT = "/var/lib/iot_system/historian.heartbeat"
```

**Edit `/opt/iot_system/app.py`:**

```python
# Update these lines near the top:
DB_FILE = '/var/lib/iot_system/historian_data.db'
RULES_FILE = '/opt/iot_system/rules.json'

# Update monitoring file paths:
CONTROLLER_PID = "/var/lib/iot_system/controller.pid"
CONTROLLER_HEARTBEAT = "/var/lib/iot_system/controller.heartbeat"
HISTORIAN_HEARTBEAT = "/var/lib/iot_system/historian.heartbeat"
```

#### Explanation:

**Why absolute paths?**
- Services don't have a "current directory" like terminal sessions
- Relative paths like `"historian_data.db"` won't work
- Absolute paths like `"/var/lib/iot_system/historian_data.db"` work from anywhere

**Path conventions:**
- **Configuration files** (`rules.json`): `/opt/iot_system/`
- **Application code** (`.py` files): `/opt/iot_system/`
- **Runtime data** (`.db`, `.pid`, heartbeat): `/var/lib/iot_system/`
- **Logs**: `/opt/iot_system/logs/`

### Step 5: Set Permissions

```bash
# Give iotuser ownership of application directory
sudo chown -R iotuser:iotuser /opt/iot_system

# Give iotuser ownership of data directory
sudo chown -R iotuser:iotuser /var/lib/iot_system

# Set directory permissions
sudo chmod 755 /opt/iot_system
sudo chmod 755 /var/lib/iot_system

# Make Python scripts executable
sudo chmod +x /opt/iot_system/historian.py
sudo chmod +x /opt/iot_system/iot_controller.py
sudo chmod +x /opt/iot_system/app.py
```

#### Explanation:

**`chown -R iotuser:iotuser`**: Change ownership recursively
- **First `iotuser`**: Owner (user who owns the file)
- **Second `iotuser`**: Group (group that owns the file)
- **`-R`**: Recursive (applies to all files in directory)

**`chmod 755`**: Set permissions
- **7** (owner): read(4) + write(2) + execute(1) = full control
- **5** (group): read(4) + execute(1) = can read and enter directory
- **5** (others): read(4) + execute(1) = can read and enter directory

**`chmod +x`**: Make executable
- Tells Linux these files are programs that can be run

**Why these permissions?**
- `iotuser` needs to read/write its own files
- Other users can read but not modify (safer)
- Execute permission needed to run scripts and enter directories

---

## Part 4: Create systemd Service Files

### Service 1: Historian

**Create `/etc/systemd/system/iot-historian.service`:**

```bash
sudo nano /etc/systemd/system/iot-historian.service
```

**Contents:**

```ini
[Unit]
Description=IoT MQTT Historian Service
Documentation=https://github.com/yourproject/iot-system
After=network.target mosquitto.service
Requires=mosquitto.service

[Service]
Type=simple
User=iotuser
Group=iotuser
WorkingDirectory=/opt/iot_system
Environment="PYTHONUNBUFFERED=1"
ExecStart=/opt/iot_system/venv/bin/python3 /opt/iot_system/historian.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

#### Detailed Explanation:

**`[Unit]` Section - Service Metadata:**

- **`Description`**: Human-readable name shown in `systemctl status`

- **`After=network.target mosquitto.service`**: Start order
  - Wait for network to be up
  - Wait for Mosquitto MQTT broker to start
  - Ensures dependencies are ready before this service starts

- **`Requires=mosquitto.service`**: Hard dependency
  - If Mosquitto fails to start, this service won't start
  - If Mosquitto stops, this service stops too

**`[Service]` Section - How to Run:**

- **`Type=simple`**: Service type
  - Program runs in foreground (doesn't fork/daemonize itself)
  - systemd considers it started as soon as the process begins

- **`User=iotuser`** and **`Group=iotuser`**: Run as dedicated user
  - **NOT root** - much safer!
  - Can only access files `iotuser` owns

- **`WorkingDirectory=/opt/iot_system`**: Starting directory
  - Like doing `cd /opt/iot_system` before running
  - Relative paths in code will be relative to this

- **`Environment="PYTHONUNBUFFERED=1"`**: Python configuration
  - Makes Python output appear immediately in logs
  - Without this, output is buffered and appears delayed

- **`ExecStart`**: The actual command to run
  - **`/opt/iot_system/venv/bin/python3`**: Python from virtual environment
  - **Full path required** - no relying on PATH environment variable
  - Runs `historian.py` with that Python interpreter

- **`Restart=always`**: Auto-restart policy
  - If service crashes, automatically restart it
  - Ensures service stays running even after failures

- **`RestartSec=10`**: Wait 10 seconds before restarting
  - Prevents rapid restart loops if service keeps crashing
  - Gives time for problems to resolve (network, etc.)

- **`StandardOutput=journal`** and **`StandardError=journal`**: Logging
  - Send all `print()` output to systemd journal
  - View with `journalctl -u iot-historian.service`

**Security Settings:**

- **`NoNewPrivileges=true`**: Security restriction
  - Process can't gain more privileges than it starts with
  - Prevents privilege escalation attacks

- **`PrivateTmp=true`**: Isolation
  - Service gets its own `/tmp` directory
  - Can't see or interfere with other services' temp files

**`[Install]` Section - Boot Behavior:**

- **`WantedBy=multi-user.target`**: When to auto-start
  - **multi-user.target** = normal system boot (command line or GUI)
  - Like "run level 3" or "run level 5" in older Linux systems
  - Service will start automatically at boot if enabled

***

### Service 2: IoT Controller

**Create `/etc/systemd/system/iot-controller.service`:**

```bash
sudo nano /etc/systemd/system/iot-controller.service
```

**Contents:**

```ini
[Unit]
Description=IoT Controller Rules Engine
Documentation=https://github.com/yourproject/iot-system
After=network.target mosquitto.service iot-historian.service
Requires=mosquitto.service
Wants=iot-historian.service

[Service]
Type=simple
User=iotuser
Group=iotuser
WorkingDirectory=/opt/iot_system
Environment="PYTHONUNBUFFERED=1"
ExecStart=/opt/iot_system/venv/bin/python3 /opt/iot_system/iot_controller.py
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

#### New/Different Elements:

**`After=... iot-historian.service`**: Also wait for historian
- Starts after historian is running
- Not required (see below), but preferred

**`Wants=iot-historian.service`**: Soft dependency
- **Different from `Requires`**:
  - `Requires`: If dependency fails, this service fails
  - `Wants`: Prefer dependency running, but can run without it
- Controller can run even if historian isn't running
- Will still warn user if historian is missing (via health check)

**`ExecReload=/bin/kill -HUP $MAINPID`**: Reload command
- Defines what happens when you run `sudo systemctl reload iot-controller`
- **`-HUP`**: Sends SIGHUP signal
- **`$MAINPID`**: Automatic variable - systemd substitutes the service's PID
- Allows reloading rules without restarting the service

---

### Service 3: Web Application

**Create `/etc/systemd/system/iot-webapp.service`:**

```bash
sudo nano /etc/systemd/system/iot-webapp.service
```

**Contents:**

```ini
[Unit]
Description=IoT Web Interface
Documentation=https://github.com/yourproject/iot-system
After=network.target iot-historian.service iot-controller.service
Wants=iot-historian.service iot-controller.service

[Service]
Type=simple
User=iotuser
Group=iotuser
WorkingDirectory=/opt/iot_system
Environment="PYTHONUNBUFFERED=1"
Environment="FLASK_APP=app.py"
ExecStart=/opt/iot_system/venv/bin/python3 /opt/iot_system/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Security settings
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

#### Explanation:

**`Environment="FLASK_APP=app.py"`**: Flask configuration
- Sets environment variable Flask uses
- Not strictly necessary here (we run app.py directly)
- Good practice for Flask applications

**`Wants=` both services**: Web app wants both running
- Can function without them (login page, status page)
- But needs them for full functionality

---

## Part 5: Enable and Start Services

### Step 1: Reload systemd

```bash
sudo systemctl daemon-reload
```

#### Explanation:
- Tells systemd to re-read all service files
- **Always run after creating or editing `.service` files**
- Otherwise systemd won't see your changes

### Step 2: Enable Services (Auto-start at Boot)

```bash
sudo systemctl enable iot-historian.service
sudo systemctl enable iot-controller.service
sudo systemctl enable iot-webapp.service
```

#### Explanation:

**`enable`**: Configure auto-start
- Creates symbolic links in system directories
- Services will start automatically when Pi boots
- Doesn't start them now - just configures for future boots

**Verify enabled status:**
```bash
systemctl is-enabled iot-historian.service
# Should output: enabled
```

### Step 3: Start Services

```bash
sudo systemctl start iot-historian.service
sudo systemctl start iot-controller.service
sudo systemctl start iot-webapp.service
```

#### Explanation:

**`start`**: Start service now
- Runs the `ExecStart` command
- Service begins running in background

**Start order matters here:**
1. Historian first (controller checks for it)
2. Controller second
3. Web app last (checks both)

### Step 4: Check Service Status

```bash
sudo systemctl status iot-historian.service
```

**Expected output:**
```
● iot-historian.service - IoT MQTT Historian Service
     Loaded: loaded (/etc/systemd/system/iot-historian.service; enabled; vendor preset: enabled)
     Active: active (running) since Wed 2025-11-19 14:30:00 EST; 10s ago
   Main PID: 12345 (python3)
      Tasks: 3 (limit: 4915)
     Memory: 25.2M
        CPU: 234ms
     CGroup: /system.slice/iot-historian.service
             └─12345 /opt/iot_system/venv/bin/python3 /opt/iot_system/historian.py

Nov 19 14:30:00 raspberrypi systemd[1]: Started IoT MQTT Historian Service.
Nov 19 14:30:00 raspberrypi python3[12345]: Historian PID 12345 saved to /var/lib/iot_system/historian.pid
Nov 19 14:30:00 raspberrypi python3[12345]: Historian connected to localhost:1883
```

#### Status Indicators:

- **Loaded**: Service file found and parsed correctly
- **Active: active (running)**: Service is currently running
- **enabled**: Will start at boot
- **Main PID**: Process ID of running service
- **Tasks**: Number of threads
- **Memory/CPU**: Resource usage
- **Recent log lines**: Last few messages from service

**If status shows errors, check:**
```bash
journalctl -u iot-historian.service -n 50
# Shows last 50 log lines
```

***

## Part 6: Test the Deployed System

### Test 1: Verify Services Running

```bash
sudo systemctl status iot-historian.service
sudo systemctl status iot-controller.service
sudo systemctl status iot-webapp.service
```

All three should show `Active: active (running)`.

### Test 2: Check Health Monitoring

```bash
# Check heartbeat files exist and are recent
ls -lh /var/lib/iot_system/*.heartbeat
cat /var/lib/iot_system/historian.heartbeat
# Should show very recent timestamp
```

**Or use the web interface:**
- Open browser: `http://localhost:5000`
- Log in
- Navigate to "System Status"
- Both services should show green (healthy)

### Test 3: Test MQTT Data Flow

```bash
# Publish test message
mosquitto_pub -t "test/temperature" -m "25.5"

# Check historian logs
sudo journalctl -u iot-historian.service -n 10

# Check database
sqlite3 /var/lib/iot_system/historian_data.db "SELECT * FROM historian_data ORDER BY timestamp DESC LIMIT 5;"
```

### Test 4: Test Rules Reload

1. Log into web interface: `http://localhost:5000`
2. Navigate to "Manage Rules"
3. Create or edit a rule
4. Click "Reload IoT Controller" button
5. Check controller logs:
   ```bash
   sudo journalctl -u iot-controller.service -n 20
   ```
   Should show "✓ Rules reloaded"

### Test 5: Test Auto-Restart

```bash
# Kill the historian process
sudo systemctl kill -s KILL iot-historian.service

# Wait 10 seconds
sleep 10

# Check status
sudo systemctl status iot-historian.service
```

Service should show `Active: active (running)` - it auto-restarted!

### Test 6: Test Boot Persistence

```bash
# Reboot the Pi
sudo reboot

# After reboot, check services
sudo systemctl status iot-historian.service
sudo systemctl status iot-controller.service
sudo systemctl status iot-webapp.service
```

All should start automatically and show `Active: active (running)`.

***

## Part 7: Managing Your Services

### Common Service Commands

```bash
# Start a service
sudo systemctl start iot-historian.service

# Stop a service
sudo systemctl stop iot-historian.service

# Restart a service (stop then start)
sudo systemctl restart iot-historian.service

# Reload configuration (sends SIGHUP to controller only)
sudo systemctl reload iot-controller.service

# Check service status
sudo systemctl status iot-historian.service

# View service logs (follow mode)
sudo journalctl -u iot-historian.service -f

# View last 50 log lines
sudo journalctl -u iot-historian.service -n 50

# View all logs since last boot
sudo journalctl -u iot-historian.service -b

# View logs from all IoT services together
sudo journalctl -u iot-historian.service -u iot-controller.service -u iot-webapp.service -f
```

### Useful Log Filters

```bash
# Only errors and warnings
sudo journalctl -u iot-controller.service -p warning

# Logs from specific time range
sudo journalctl -u iot-historian.service --since "10 minutes ago"
sudo journalctl -u iot-historian.service --since "2025-11-19 14:00:00"

# Export logs to file
sudo journalctl -u iot-controller.service > controller_logs.txt
```

***

## Part 8: Troubleshooting Guide

### Issue 1: Service Won't Start

**Symptom:** `sudo systemctl start iot-historian.service` fails

**Debug:**
```bash
# Check detailed status
sudo systemctl status iot-historian.service

# View full error log
sudo journalctl -u iot-historian.service -xe

# Check if Python path is correct
ls -lh /opt/iot_system/venv/bin/python3

# Check if script exists
ls -lh /opt/iot_system/historian.py

# Check permissions
ls -lh /opt/iot_system/
ls -lh /var/lib/iot_system/
```

**Common fixes:**
- Wrong Python path in ExecStart
- Missing virtual environment
- Permission problems
- Missing dependencies in venv

### Issue 2: Permission Denied Errors

**Symptom:** Logs show "Permission denied" when accessing files

**Fix:**
```bash
# Fix directory ownership
sudo chown -R iotuser:iotuser /opt/iot_system
sudo chown -R iotuser:iotuser /var/lib/iot_system

# Fix specific file
sudo chown iotuser:iotuser /opt/iot_system/rules.json
sudo chmod 664 /opt/iot_system/rules.json
```

### Issue 3: Service Keeps Restarting

**Symptom:** `systemctl status` shows "activating (auto-restart)"

**Debug:**
```bash
# View recent crash logs
sudo journalctl -u iot-historian.service -n 100

# Look for Python errors
sudo journalctl -u iot-historian.service | grep -i error
sudo journalctl -u iot-historian.service | grep -i traceback
```

**Common causes:**
- Missing Python packages in venv
- MQTT broker not running
- Database file permission issues
- Wrong file paths in code

### Issue 4: Rules Not Reloading

**Symptom:** Edit rules but controller doesn't reload

**Debug:**
```bash
# Test HTTP endpoint
curl -X POST http://localhost:5001/reload

# Check if controller is listening
sudo netstat -tlnp | grep 5001

# Check controller logs
sudo journalctl -u iot-controller.service -f
```

**Try manual reload:**
```bash
sudo systemctl reload iot-controller.service
```

### Issue 5: Web App Can't Access Database

**Symptom:** Dashboard shows "No data available"

**Debug:**
```bash
# Check database exists
ls -lh /var/lib/iot_system/historian_data.db

# Check permissions
sudo chmod 664 /var/lib/iot_system/historian_data.db
sudo chown iotuser:iotuser /var/lib/iot_system/historian_data.db

# Verify data
sqlite3 /var/lib/iot_system/historian_data.db "SELECT COUNT(*) FROM historian_data;"
```

***

## Part 9: Understanding What You Built

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Raspberry Pi                         │
│                                                         │
│  ┌──────────────┐      ┌──────────────┐               │
│  │   Mosquitto  │◄────►│  Historian   │               │
│  │  MQTT Broker │      │   Service    │               │
│  └──────────────┘      └──────┬───────┘               │
│         ▲                     │                        │
│         │                     ▼                        │
│         │              ┌──────────────┐               │
│         │              │  SQLite DB   │               │
│         │              └──────────────┘               │
│         │                                              │
│         │              ┌──────────────┐               │
│         └─────────────►│ IoT Controller│              │
│                        │   Service     │               │
│                        └──────┬────────┘               │
│                              │                         │
│                        HTTP  │  Heartbeat              │
│                        5001  │  Files                  │
│                              │                         │
│                        ┌─────▼─────────┐              │
│                        │   Web App     │              │
│                        │   Service     │              │
│                        └───────────────┘               │
│                             │ :5000                     │
└─────────────────────────────┼───────────────────────────┘
                              │
                         ┌────▼────┐
                         │ Browser │
                         └─────────┘
```

**Data Flow:**
1. MQTT messages arrive at Mosquitto broker
2. Historian subscribes to all topics, saves to SQLite
3. Controller subscribes to all topics, evaluates rules, publishes actions
4. Web app reads from SQLite database for visualization
5. Web app reads heartbeat files to check health
6. Web app sends HTTP POST to controller to reload rules

**Communication Methods:**
- **MQTT**: Historian and Controller both subscribe to Mosquitto
- **SQLite**: Historian writes, Web app reads
- **HTTP**: Web app sends reload requests to Controller (port 5001)
- **File-based**: Heartbeat files for health monitoring
- **Signals**: Manual reload via `systemctl reload` or `kill -HUP`

### What Services Do

**Historian Service:**
- Logs all MQTT messages to database
- Updates heartbeat every 5 seconds
- Automatically restarts if crashed
- Runs 24/7 in background

**Controller Service:**
- Evaluates rules continuously
- Publishes actions when conditions met
- Listens for HTTP reload requests
- Responds to SIGHUP for reload
- Checks if historian is healthy
- Updates heartbeat every 5 seconds

**Web App Service:**
- Provides user interface
- Requires login for access
- Shows live data from database
- Allows managing rules
- Shows health status of other services
- Sends reload commands to controller

### Security Layers

1. **Dedicated User**: Services run as `iotuser`, not root
2. **No Login Shell**: `iotuser` can't be used to log in
3. **Limited Permissions**: Services only access their own files
4. **Password Hashing**: Web login uses bcrypt hashes
5. **Login Required**: Web interface protected
6. **Process Isolation**: `PrivateTmp`, `NoNewPrivileges`

***

## Summary

You've successfully deployed a **production-grade IoT system** with:

✅ **Three cooperating services** running as background daemons  
✅ **Automatic startup** on boot  
✅ **Auto-restart** on crashes  
✅ **Health monitoring** via heartbeat files  
✅ **User-triggered reload** via HTTP endpoint  
✅ **Inter-service communication** via HTTP and health checks  
✅ **Centralized logging** with systemd journal  
✅ **Security hardening** with dedicated non-login user  
✅ **Virtual environment deployment** for Python dependencies  
✅ **Professional deployment practices** following Linux standards  

**Skills learned:**
- systemd service creation and management
- Python virtual environment deployment
- Inter-process communication (HTTP, signals, files)
- File-based health monitoring
- Linux security practices
- Production deployment workflows
- Service debugging with journalctl

This is how real industrial IoT systems, web services, and enterprise applications are deployed in production Linux environments. You now have experience with professional deployment practices used in industry.
