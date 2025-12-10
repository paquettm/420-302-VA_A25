---
title: 'Lab 9: Python Flask Interactive Web MQTT Data Visualization Dashboard'
description: 'Lab 9: Python Flask Interactive Web MQTT Data Visualization Dashboard'
sidebar:
  label: 'Lab 9: Python Flask Interactive Web MQTT Data Visualization Dashboard'
  order: 9
---

# Lab 9: Python Flask Interactive Web MQTT Data Visualization Dashboard

## Introduction

In this lab, we'll build a **web-based data visualization dashboard** that displays historical MQTT sensor data stored in SQLite using Python Flask and Plotly. This builds upon the previous MQTT historian application by adding a **web interface** with **interactive graphs** for viewing the stored data.

The application demonstrates the following important concepts:
- **Web framework fundamentals** with Flask
- **Database queries** and data processing
- **Interactive data visualization** with Plotly
- **Dynamic chart generation** for web display
- **HTML templating** with Jinja2

***

## What This Application Does

The Flask web app:
1. **Connects to the SQLite database** created by the MQTT historian
2. **Queries all unique topics** from stored messages
3. **Retrieves time-series data** for each topic
4. **Generates an interactive plot** using Plotly
5. **Embeds the chart directly in HTML** for display
6. **Provides interactive features** like zoom, pan, and hover tooltips

***

## Required Dependencies

Enter the directory you have previously created for your IoT Controller system and activate the already-existing virtual environment that you had created for this controller.

Install the necessary Python packages:

```bash
pip install flask plotly
```

**Note:** SQLite support is built into Python, so no additional database drivers are needed.

***

## Core Concepts Explained

### Flask Web Framework

Some of this is repetition, but it is always worth telling in a potentially different way...

**Flask** is a "micro-framework" for web development in Python. It handles:
- **HTTP requests** (GET, POST) from web browsers
- **URL routing** (mapping URLs to Python functions)
- **HTML template rendering** with dynamic data
- **Response generation** (HTML pages, JSON, files)

Think of Flask as the bridge between your Python code and the web browser.

### Plotly Visualization Library

**Plotly** creates interactive, JavaScript-based charts that work directly in web browsers. Unlike static images, Plotly graphs allow users to:
- **Zoom** into specific time ranges
- **Pan** across the data
- **Hover** to see exact values
- **Toggle** data series on/off
- **Download** charts as images

Plotly generates HTML/JavaScript code that you embed directly into your web page—no image files or encoding required.

### How Data Flows

```
SQLite Database → Python Flask → Plotly Chart → HTML Template → Web Browser
```

1. Flask receives a request from the browser
2. Python queries the SQLite database
3. Plotly converts data into an interactive chart
4. The chart is embedded into HTML
5. The browser displays the interactive page

***

## Complete Code Walkthrough

### Step 1: Import Required Libraries

```python
from flask import Flask, render_template
import sqlite3
import plotly.graph_objs as go
import plotly.offline as pyo
from datetime import datetime
```

**Library purposes:**
- **`flask`**: Web framework for handling HTTP requests and rendering templates
- **`sqlite3`**: Database connectivity (built into Python)
- **`plotly.graph_objs`**: Creates chart objects (lines, bars, scatter plots)
- **`plotly.offline`**: Generates HTML/JavaScript without requiring Plotly's web service
- **`datetime`**: Parsing and handling timestamp data

### Step 2: Flask Application Setup

```python
app = Flask(__name__)
```

Creates the Flask application instance. The `__name__` argument tells Flask where to find templates and static files relative to this script.

### Step 3: Database Query Functions

#### Get All Topics

```python
def get_topics():
    conn = sqlite3.connect('historian_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT topic FROM historian_data")
    topics = [row[0] for row in cursor.fetchall()]
    conn.close()
    return topics
```

**What this does:**
- **Connects** to the historian database
- **Executes SQL query** to get unique topic names
- **Extracts** the topic strings from result rows using list comprehension
- **Closes** the database connection to free resources
- **Returns** a list like `['lab/temperature', 'lab/humidity', 'room/status']`

**Key SQL concept:**
- **`DISTINCT`**: Returns only unique values, removing duplicates

**Python concept:**
- **List comprehension**: `[row[0] for row in cursor.fetchall()]` efficiently creates a list by extracting the first item from each database row

#### Get Data for Specific Topic

```python
def get_data_for_topic(topic):
    conn = sqlite3.connect('historian_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, message FROM historian_data WHERE topic = ? ORDER BY timestamp", (topic,))
    data = cursor.fetchall()
    conn.close()
    
    timestamps = []
    values = []
    
    for timestamp, message in data:
        timestamps.append(datetime.fromisoformat(timestamp))
        try:
            values.append(float(message))
        except ValueError:
            values.append(None)
    
    return timestamps, values
```

**Detailed explanation:**

1. **Parameterized query**: The `?` placeholder prevents SQL injection attacks
   - `(topic,)` is a tuple with one element—the comma makes it a tuple, not just parentheses
   - SQLite safely substitutes the topic value into the query

2. **`ORDER BY timestamp`**: Ensures data is chronologically sorted (essential for time-series plots)

3. **`datetime.fromisoformat()`**: Converts string timestamps like `'2025-11-02 22:00:00'` into Python datetime objects that Plotly can plot

4. **Type conversion with exception handling**:
   ```python
   try:
       values.append(float(message))  # Try to convert to number
   except ValueError:
       values.append(None)  # If it's text, use None (Plotly will skip it)
   ```
   This handles mixed data types gracefully—numeric sensor readings become plot points, text messages are ignored

5. **Returns two parallel lists**:
   - `timestamps`: `[datetime(2025,11,2,22,0,0), datetime(2025,11,2,22,1,0), ...]`
   - `values`: `[23.5, 24.1, 23.8, None, 24.2, ...]`

### Step 4: Main Route and Plotting Function

```python
@app.route('/')
def plot_data():
    topics = get_topics()
    traces = []
    
    for topic in topics:
        timestamps, values = get_data_for_topic(topic)
        if timestamps:
            trace = go.Scatter(
                x=timestamps,
                y=values,
                mode='lines+markers',
                name=topic
            )
            traces.append(trace)
```

**Route decorator**: `@app.route('/')` tells Flask that this function handles requests to the root URL (`http://localhost:5000/`)

**Building the chart data**:

1. **Get all topics** from the database
2. **Initialize empty list** to hold chart traces (each topic becomes one line on the graph)
3. **Loop through each topic**:
   - Retrieve timestamps and values
   - Create a **Scatter trace** (Plotly's object for line/scatter plots)
   - Add it to the traces list

**Plotly Scatter object parameters**:
- **`x=timestamps`**: Horizontal axis data (time)
- **`y=values`**: Vertical axis data (sensor readings)
- **`mode='lines+markers'`**: Draw both connecting lines and point markers
- **`name=topic`**: Label for the legend (e.g., "lab/temperature")

Each trace represents one complete data series that will appear as a colored line on the chart.

### Step 5: Configure Chart Layout

```python
    layout = go.Layout(
        title='MQTT Historian Data',
        xaxis=dict(title='Timestamp'),
        yaxis=dict(title='Value'),
        hovermode='closest'
    )
```

**Layout object** controls the overall chart appearance:
- **`title`**: Main chart heading
- **`xaxis`**: Dictionary configuring the horizontal axis
- **`yaxis`**: Dictionary configuring the vertical axis
- **`hovermode='closest'`**: When you hover, shows data for the nearest point

This is much simpler than manually formatting axes—Plotly handles date formatting, grid lines, and responsive sizing automatically.

### Step 6: Generate Chart HTML

```python
    fig = go.Figure(data=traces, layout=layout)
    graph_html = pyo.plot(fig, output_type='div', include_plotlyjs='cdn')
    
    return render_template('plot.html', graph=graph_html)
```

**Creating the final chart**:

1. **`go.Figure()`**: Combines data traces and layout into a complete figure
2. **`pyo.plot()`**: Generates HTML/JavaScript code
   - **`output_type='div'`**: Returns just the chart div (not a full HTML page)
   - **`include_plotlyjs='cdn'`**: Loads Plotly JavaScript library from a Content Delivery Network (internet)
3. **`render_template()`**: Inserts the chart HTML into your template and returns it to the browser

**Important**: The `graph_html` variable contains a string of HTML like:
```html
<div id="plot-div">
    <script type="text/javascript">
        // Plotly JavaScript code to render the chart
    </script>
</div>
```

This gets embedded directly into your web page.

### Step 7: Application Entry Point

```python
if __name__ == '__main__':
    app.run(debug=True)
```

**What this means**:
- **`if __name__ == '__main__'`**: Only runs when you execute this script directly (not when imported as a module)
- **`app.run()`**: Starts the web server
- **`debug=True`**: Enables development features:
  - **Auto-reload**: Server restarts when you save code changes
  - **Error details**: Shows detailed error messages in the browser
  - **⚠️ Never use in production**: Debug mode is a security risk

Production refers to the real, live environment where actual users access your application.
It's the opposite of your personal computer where you're developing and testing.
In production environments we avoid security risks at all costs to avoid bad actors entering our mission-critical systems.

***

## HTML Template Creation

Create a folder named `templates` in the same directory as your Python script, then create `plot.html` inside it:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MQTT Historian</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 20px;
        }
        .plot-container {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>MQTT Historian Data Visualization</h1>
        <div class="plot-container">
            {% if graph %}
                {{ graph|safe }}
            {% else %}
                <p>No data available to display.</p>
            {% endif %}
        </div>
    </div>
</body>
</html>
```

**Template features explained**:

### Jinja2 Template Syntax

Flask uses **Jinja2** templating engine with special syntax:

**Variables**: `{{ variable_name }}`
- Inserts the value of a Python variable into HTML
- Example: `{{ graph }}` inserts the Plotly chart HTML

**Filters**: `{{ variable|filter }}`
- **`|safe`**: Tells Jinja2 that the HTML is trusted and should not be escaped
- Without `|safe`, special characters like `<` and `>` would be converted to `&lt;` and `&gt;`

**Conditionals**: `{% if condition %} ... {% else %} ... {% endif %}`
- Renders different HTML based on conditions
- Here, shows the graph if data exists, otherwise shows a "No data" message

### CSS Styling

- **`.container`**: Centers content and adds professional card styling
- **`max-width: 1200px`**: Prevents chart from becoming too wide on large screens
- **`box-shadow`**: Adds subtle 3D effect
- **`border-radius`**: Rounds corners for modern appearance

***

## Project Directory Structure

```
mqtt_visualizer/
├── app.py                 # Main Flask application (your Python code)
├── historian_data.db      # SQLite database (created by historian)
└── templates/
    └── plot.html          # HTML template
```

**Important**: Flask requires templates to be in a folder named `templates` (lowercase, plural).

***

## Running the Application

### Step 1: Ensure Data Exists

First, run the MQTT historian from the previous lab to collect some data:

```bash
python3 historian.py
```

In another terminal, publish test data:

```bash
# Numeric sensor data
mosquitto_pub -h localhost -t "lab/temperature" -m "23.5"
mosquitto_pub -h localhost -t "lab/temperature" -m "24.1"
mosquitto_pub -h localhost -t "lab/humidity" -m "65.0"
mosquitto_pub -h localhost -t "lab/humidity" -m "67.2"

# Text status messages
mosquitto_pub -h localhost -t "lab/status" -m "online"
```

### Step 2: Start the Flask Application

```bash
python3 app.py
```

**Expected output:**
```
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

### Step 3: View in Browser

Open your web browser and navigate to:
```
http://localhost:5000
```

or

```
http://127.0.0.1:5000
```

You should see an interactive graph displaying your MQTT data with:
- **Multiple colored lines** (one per topic)
- **Time on the horizontal axis**
- **Sensor values on the vertical axis**
- **Legend** on the right showing topic names
- **Interactive controls** in the top-right corner

### Step 4: Interact with the Chart

Try these features:

| Action | How to Do It | Result |
|--------|-------------|--------|
| **Zoom in** | Click and drag across an area | Magnifies that time range |
| **Pan** | Shift + drag | Moves view left/right |
| **Reset view** | Double-click chart | Returns to original zoom |
| **View exact value** | Hover over a point | Shows timestamp and value |
| **Hide/show line** | Click legend item | Toggles that topic's visibility |
| **Download chart** | Click camera icon | Saves as PNG image |

***

## Understanding the Data Flow

Let's trace what happens when you visit `http://localhost:5000`:

1. **Browser sends HTTP GET request** to Flask server
2. **Flask routes request** to `plot_data()` function
3. **`get_topics()`** queries database for unique topics
   - Returns: `['lab/temperature', 'lab/humidity']`
4. **For each topic**, `get_data_for_topic()` retrieves time-series data
   - Returns parallel arrays of timestamps and values
5. **Plotly creates Scatter traces** for each topic
6. **Layout configuration** sets titles and labels
7. **`go.Figure()`** combines traces and layout
8. **`pyo.plot()`** generates HTML/JavaScript string
9. **`render_template()`** inserts chart into `plot.html`
10. **Flask sends HTML** back to browser
11. **Browser renders HTML** and executes Plotly JavaScript
12. **Interactive chart appears** on screen

---

## Common Issues and Solutions

### Issue 1: Empty or Missing Chart

**Symptom:** Page loads but no graph appears

**Possible causes and solutions:**

1. **No data in database**
   ```bash
   sqlite3 historian_data.db "SELECT COUNT(*) FROM historian_data;"
   ```
   If count is 0, run the historian and publish test messages

2. **All values are text (not numeric)**
   - The code skips non-numeric values
   - Ensure you're publishing numbers: `mosquitto_pub -t "test/temp" -m "25.5"`

3. **JavaScript blocked**
   - Check browser console (F12) for errors
   - Ensure you have internet access (Plotly CDN requires it)

### Issue 2: Module Not Found

**Symptom:** `ModuleNotFoundError: No module named 'plotly'`

**Solution:** Install dependencies:
```bash
pip install plotly flask
```

Verify installation:
```bash
pip list | grep plotly
pip list | grep Flask
```

### Issue 3: Template Not Found

**Symptom:** `jinja2.exceptions.TemplateNotFound: plot.html`

**Solution:** Check directory structure:
```bash
ls -la templates/
```

Ensure:
- Folder is named `templates` (lowercase, plural)
- File is named `plot.html` (not `Plot.html` or `plot.HTML`)
- Folder is in the same directory as `app.py`

### Issue 4: Chart Shows But No Data Lines

**Symptom:** Empty chart with axes but no plotted data

**Possible causes:**

1. **All values converted to `None`**
   - Check that messages are numeric
   - Add debug print: `print(f"Topic: {topic}, Values: {values}")`

2. **Timestamp format mismatch**
   - Verify timestamp format in database matches ISO format
   - Test: `datetime.fromisoformat('2025-11-02 22:00:00')`

### Issue 5: Port Already in Use

**Symptom:** `OSError: [Errno 48] Address already in use`

**Solution:** Kill the process using port 5000:
```bash
# Find the process
lsof -i :5000

# Kill it (replace PID with actual process ID)
kill -9 PID
```

Or use a different port:
```python
app.run(debug=True, port=5001)
```

### Issue 6: Chart Not Updating with New Data

**Symptom:** Published new MQTT messages but chart doesn't change

**Solution:** The chart generates when the page loads—you must **refresh the browser** to see new data.

For automatic updates, add this to your HTML template:
```html
<script>
    setTimeout(function() {
        location.reload();
    }, 30000);  // Refresh every 30 seconds
</script>
```

***

## Key Python Concepts Demonstrated

### 1. **List Comprehensions**

```python
topics = [row[0] for row in cursor.fetchall()]
```

**Traditional approach:**
```python
topics = []
for row in cursor.fetchall():
    topics.append(row[0])
```

List comprehensions are more concise and Pythonic.

### 2. **Exception Handling for Type Conversion**

```python
try:
    values.append(float(message))
except ValueError:
    values.append(None)
```

Handles mixed data types gracefully without crashing. Essential for real-world IoT data where sensors might send error messages or status strings.

### 3. **Multiple Return Values**

```python
def get_data_for_topic(topic):
    # ... processing ...
    return timestamps, values  # Returns tuple
```

Python functions can return multiple values as a tuple:
```python
timestamps, values = get_data_for_topic("lab/temp")
```

### 4. **Dictionary Unpacking in Function Calls**

```python
layout = go.Layout(
    title='MQTT Historian Data',
    xaxis=dict(title='Timestamp'),
    yaxis=dict(title='Value')
)
```

`dict()` creates a dictionary. This is cleaner than:
```python
xaxis={'title': 'Timestamp'}
```

### 5. **Conditional Route Logic**

```python
if timestamps:  # Checks if list is not empty
    trace = go.Scatter(...)
```

Empty lists evaluate to `False` in Python, so this is shorthand for:
```python
if len(timestamps) > 0:
```

***

## Extensions and Improvements

### 1. **Add Date Range Filtering**

Allow users to view specific time periods:

```python
@app.route('/')
@app.route('/plot/<start_date>/<end_date>')
def plot_data(start_date=None, end_date=None):
    # Add WHERE clause to SQL query
    if start_date and end_date:
        SQL = """SELECT timestamp, message FROM historian_data 
                 WHERE topic = ? AND timestamp BETWEEN ? AND ? 
                 ORDER BY timestamp"""
        cursor.execute(SQL, (topic, start_date, end_date))
```

### 2. **Individual Topic Pages**

Create separate pages for each topic:

```python
@app.route('/topic/<topic_name>')
def plot_single_topic(topic_name):
    timestamps, values = get_data_for_topic(topic_name)
    trace = go.Scatter(x=timestamps, y=values, mode='lines+markers')
    layout = go.Layout(title=f'Data for {topic_name}')
    fig = go.Figure(data=[trace], layout=layout)
    graph_html = pyo.plot(fig, output_type='div', include_plotlyjs='cdn')
    return render_template('plot.html', graph=graph_html)
```

### 3. **Add Statistics Panel**

Show summary statistics below the chart:

```python
def get_statistics(topic):
    conn = sqlite3.connect('historian_data.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT AVG(CAST(message AS REAL)), 
               MIN(CAST(message AS REAL)), 
               MAX(CAST(message AS REAL))
        FROM historian_data 
        WHERE topic = ?
    """, (topic,))
    avg, min_val, max_val = cursor.fetchone()
    conn.close()
    return {'average': avg, 'minimum': min_val, 'maximum': max_val}
```

### 4. **Export Data as CSV**

Add a download button:

```python
from flask import send_file
import csv
import io

@app.route('/export/<topic>')
def export_csv(topic):
    timestamps, values = get_data_for_topic(topic)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Timestamp', 'Value'])
    
    for ts, val in zip(timestamps, values):
        writer.writerow([ts, val])
    
    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'{topic.replace("/", "_")}.csv'
    )
```

### 5. **Multiple Chart Types**

Add dropdown to select chart type:

```python
# In your route
chart_type = request.args.get('type', 'line')

if chart_type == 'bar':
    trace = go.Bar(x=timestamps, y=values, name=topic)
elif chart_type == 'scatter':
    trace = go.Scatter(x=timestamps, y=values, mode='markers', name=topic)
else:
    trace = go.Scatter(x=timestamps, y=values, mode='lines+markers', name=topic)
```

***

## Production Considerations

### 1. **Environment Variables for Configuration**

Don't hardcode database paths:

```python
import os

DB_FILE = os.getenv('DATABASE_PATH', 'historian_data.db')
FLASK_PORT = int(os.getenv('FLASK_PORT', '5000'))

if __name__ == '__main__':
    app.run(debug=False, port=FLASK_PORT)
```

### 2. **Connection Pooling**

For high-traffic applications, reuse database connections:

```python
from contextlib import contextmanager

@contextmanager
def get_db_connection():
    conn = sqlite3.connect('historian_data.db')
    try:
        yield conn
    finally:
        conn.close()

# Usage
with get_db_connection() as conn:
    cursor = conn.cursor()
    # ... queries ...
```

### 3. **Error Handling**

Add error pages for better user experience:

```python
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(e):
    return render_template('500.html'), 500
```

### 4. **Caching**

Cache database queries to improve performance:

```bash
pip install flask-caching
```

```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@cache.cached(timeout=60)  # Cache for 60 seconds
def get_topics():
    # ... database query ...
```

### 5. **Use Production Server**

Never use the built-in Flask server in production. Use Gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

***

## Testing Your Application

### Basic Functionality Test

```bash
# 1. Verify database has data
sqlite3 historian_data.db "SELECT COUNT(*) FROM historian_data;"

# 2. Check topics exist
sqlite3 historian_data.db "SELECT DISTINCT topic FROM historian_data;"

# 3. View sample data
sqlite3 historian_data.db "SELECT * FROM historian_data LIMIT 5;"
```

### Simulating Realistic Data

Create a test script to generate time-series data:

```python
# test_data_generator.py
import paho.mqtt.client as mqtt
import time
import random

client = mqtt.Client()
client.connect("localhost", 1883)

topics = {
    'lab/temperature': (20, 30),  # Min, Max range
    'lab/humidity': (40, 80),
    'room/pressure': (1000, 1020)
}

for _ in range(50):  # Generate 50 readings
    for topic, (min_val, max_val) in topics.items():
        value = random.uniform(min_val, max_val)
        client.publish(topic, f"{value:.2f}")
    time.sleep(2)  # Wait 2 seconds between readings

client.disconnect()
```

Run it:
```bash
python3 test_data_generator.py
```

Then refresh your dashboard to see the new data visualized.

***

## Summary

We created an **interactive web-based data visualization dashboard** that:

- **Connects Flask to SQLite** for data retrieval  
- **Generates interactive plots** with Plotly  
- **Handles mixed data types** (numeric and text)  
- **Embeds charts directly in HTML** without image encoding  
- **Provides professional web interface** with minimal code  
- **Supports user interaction** (zoom, pan, hover)  
