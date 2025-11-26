# HOW-TO: MQTT to SMS Relay Service

This supplemental activity teaches students how to build a standalone program that listens to MQTT messages and relays them as SMS notifications via email-to-SMS gateways.

***

## Learning Objectives

By completing this activity, students will understand:
- MQTT publish/subscribe pattern for event-driven systems
- Email-to-SMS gateway integration
- String parsing and topic extraction
- Real-time event notification
- Error handling in production services

***

## Part 1: Complete Program

### Create `mqtt_sms_relay.py`

```python
#!/usr/bin/env python3
"""
MQTT to SMS Relay Service

Listens for messages on MQTT topic "SMS/+" and relays them as SMS notifications.
Topic format: SMS/<subject>
Payload: SMS message body

Example:
  Topic: SMS/Temperature Alert
  Payload: Temperature exceeded 35°C in greenhouse
  
  Result: SMS sent with subject "Temperature Alert" and message body
"""

import smtplib
import paho.mqtt.client as mqtt
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ============================================
# CONFIGURATION - EDIT THESE VALUES
# ============================================

# Email Account (Gmail recommended)
SENDER_EMAIL = "your.email@gmail.com"          # Gmail address
SENDER_PASSWORD = "xxxx xxxx xxxx xxxx"        # Gmail App Password (NOT regular password)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

# SMS Configuration
ALERT_NUMBER = "5145557777"                     # Phone number to receive SMS
ALERT_GATEWAY = "txt.bell.ca"                   # Carrier SMS gateway

# MQTT Configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "SMS/+"                            # Subscribe to SMS/* topics

# ============================================
# SMS SENDING FUNCTION
# ============================================

def send_sms(message, subject=None):
    """
    Send SMS via email-to-SMS gateway
    
    Args:
        message (str): SMS message body
        subject (str): SMS subject (optional)
    
    Returns:
        tuple: (success, response_message)
    """
    
    # Construct SMS gateway email address
    sms_email = f"{ALERT_NUMBER}@{ALERT_GATEWAY}"
    
    try:
        # Create MIME message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = sms_email
        msg['Subject'] = subject or "SMS Notification"
        
        # Attach message body (SMS gateways usually ignore subject, use body)
        msg.attach(MIMEText(message, 'plain'))
        
        # Connect to SMTP server and send
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Encrypt connection
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        return True, f"SMS sent to {sms_email}"
        
    except smtplib.SMTPAuthenticationError:
        return False, "Gmail login failed - check SENDER_EMAIL and SENDER_PASSWORD"
    except smtplib.SMTPException as e:
        return False, f"SMTP error: {e}"
    except Exception as e:
        return False, f"Error: {e}"

# ============================================
# MQTT CALLBACKS
# ============================================

def on_connect(client, userdata, flags, rc):
    """Called when MQTT client connects to broker"""
    if rc == 0:
        print(f"✓ Connected to MQTT broker")
        print(f"Subscribing to topic: {MQTT_TOPIC}")
        client.subscribe(MQTT_TOPIC)
    else:
        print(f"✗ Connection failed with code {rc}")
        sys.exit(1)

def on_message(client, userdata, msg):
    """Called when message received on subscribed topic"""
    
    # Extract SMS subject from topic
    # Topic format: SMS/<subject>
    # msg.topic example: "SMS/Temperature Alert"
    
    # Split topic by "/" to extract subject
    topic_parts = msg.topic.split("/")
    
    if len(topic_parts) >= 2:
        # Everything after "SMS/" is the subject
        subject = "/".join(topic_parts[1:])
    else:
        subject = "IoT Alert"
    
    # Get message payload
    try:
        message = msg.payload.decode("utf-8")
    except UnicodeDecodeError:
        message = str(msg.payload)
    
    # Log received message
    print(f"\n=== SMS Relay Triggered ===")
    print(f"Topic:   {msg.topic}")
    print(f"Subject: {subject}")
    print(f"Message: {message}")
    
    # Send SMS
    print(f"Sending SMS...")
    success, response = send_sms(message, subject)
    
    if success:
        print(f"✓ {response}\n")
    else:
        print(f"✗ {response}\n")

def on_disconnect(client, userdata, rc):
    """Called when MQTT client disconnects"""
    if rc != 0:
        print(f"✗ Unexpected MQTT disconnection")
    else:
        print(f"Disconnected from MQTT broker")

# ============================================
# MAIN PROGRAM
# ============================================

def main():
    """Main relay service"""
    
    print(f"\n{'='*50}")
    print(f"MQTT to SMS Relay Service")
    print(f"{'='*50}\n")
    
    # Verify configuration
    print(f"Configuration:")
    print(f"  MQTT Broker:    {MQTT_BROKER}:{MQTT_PORT}")
    print(f"  Topic Filter:   {MQTT_TOPIC}")
    print(f"  Alert Number:   {ALERT_NUMBER}")
    print(f"  SMS Gateway:    {ALERT_GATEWAY}")
    print(f"  Sender Email:   {SENDER_EMAIL}\n")
    
    # Create MQTT client
    client = mqtt.Client(client_id="mqtt-sms-relay")
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    
    # Connect to broker
    try:
        print(f"Connecting to MQTT broker...")
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
    except Exception as e:
        print(f"✗ Failed to connect to MQTT broker: {e}")
        print(f"Check that Mosquitto is running: sudo systemctl status mosquitto")
        sys.exit(1)
    
    # Start listening
    print(f"✓ Ready to relay SMS messages")
    print(f"Waiting for messages...")
    print(f"(Press Ctrl+C to stop)\n")
    
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print(f"\nShutting down...")
        client.disconnect()
        sys.exit(0)

if __name__ == "__main__":
    main()
```

#### Detailed Explanation:

**Topic Parsing:**
```python
topic_parts = msg.topic.split("/")
subject = "/".join(topic_parts[1:])
```
- **Split topic by "/"**: `"SMS/Temperature Alert"` → `["SMS", "Temperature Alert"]`
- **Extract subject**: Everything after "SMS/" becomes SMS subject
- **`"/".join()`** re-joins if subject contains slashes: `SMS/House/Temp` → `House/Temp`

**MQTT Callbacks:**
- **`on_connect()`**: Runs when connected, subscribes to topic filter
- **`on_message()`**: Runs when message arrives, triggers SMS send
- **`on_disconnect()`**: Runs when disconnected

**Payload Decoding:**
```python
message = msg.payload.decode("utf-8")
```
- MQTT payload arrives as bytes
- Decode to string for SMS message

**Error Handling:**
- Catches SMTP authentication errors (wrong password)
- Catches connection errors (MQTT broker offline)
- Provides helpful error messages

***

## Part 2: Setup Instructions

### Step 1: Configure Email Credentials

Edit `mqtt_sms_relay.py` and update:

```python
SENDER_EMAIL = "your.email@gmail.com"
SENDER_PASSWORD = "xxxx xxxx xxxx xxxx"  # Gmail App Password
ALERT_NUMBER = "5145557777"
ALERT_GATEWAY = "txt.bell.ca"            # Your carrier's gateway
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com
2. Click "Security" (left menu)
3. Enable 2-Factor Authentication if not done
4. Go to https://myaccount.google.com/apppasswords
5. Select "Mail" and "Linux/Windows/Mac"
6. Google generates 16-character password
7. Copy it (includes spaces: `xxxx xxxx xxxx xxxx`)

**Carrier gateways:** See https://www.textmagic.com/blog/email-to-text-service/

### Step 2: Start the Relay

```bash
python3 mqtt_sms_relay.py
```

**Expected output:**
```
==================================================
MQTT to SMS Relay Service
==================================================

Configuration:
  MQTT Broker:    localhost:1883
  Topic Filter:   SMS/+
  Alert Number:   5145557777
  SMS Gateway:    txt.bell.ca
  Sender Email:   your.email@gmail.com

Connecting to MQTT broker...
✓ Connected to MQTT broker
✓ Subscribing to topic: SMS/+
✓ Ready to relay SMS messages
Waiting for messages...
(Press Ctrl+C to stop)
```

***

## Part 3: Testing

### Test 1: Manual MQTT Publish

**From another terminal:**

```bash
# Publish a test SMS
mosquitto_pub -t "SMS/Test Alert" -m "This is a test SMS message"
```

**Relay service output:**
```
=== SMS Relay Triggered ===
Topic:   SMS/Test Alert
Subject: Test Alert
Message: This is a test SMS message
Sending SMS...
✓ SMS sent to 5145557777@txt.bell.ca
```

### Test 2: Multiple Subjects

```bash
mosquitto_pub -t "SMS/High Temperature" -m "Greenhouse temp is 45°C!"
mosquitto_pub -t "SMS/Low Humidity" -m "Humidity dropped to 20%"
mosquitto_pub -t "SMS/Motion Alert" -m "Motion detected in lab"
```

Each triggers a separate SMS.

### Test 3: Nested Topics

```bash
# Topic with multiple levels
mosquitto_pub -t "SMS/House/Temperature/Alert" -m "Temp too high"

# Subject becomes: "House/Temperature/Alert"
```

### Test 4: From IoT Controller

**Modify your `iot_controller.py` to publish SMS alerts:**

```python
# When a rule triggers
if conditions_met:
    action = rule.get("action")
    
    # Publish to MQTT normally
    client.publish(action["topic"], action["value"])
    
    # ALSO publish SMS alert
    sms_subject = f"Alert: {action['message']}"
    sms_topic = f"SMS/{sms_subject}"
    client.publish(sms_topic, action['message'])
```

***

## Part 4: Integration with IoT System

### Add to `iot_controller.py`

When a rule triggers:

```python
@staticmethod
def on_message(client, userdata, message):
    """Handle incoming MQTT messages and evaluate rules"""
    
    # ... existing rule evaluation code ...
    
    if conditions_met:
        action = rule.get("action")
        
        # Original action (publish to MQTT)
        client.publish(action["topic"], action["value"])
        print(f"ACTION: {action['message']}")
        
        # NEW: Send SMS alert via relay service
        sms_subject = action['message']  # Use action message as SMS subject
        sms_topic = f"SMS/{sms_subject}"
        
        # Publish to SMS relay (will be picked up and sent as SMS)
        client.publish(sms_topic, f"Alert triggered: {action['message']}")
        print(f"SMS Alert sent to relay")
```

***

## Part 5: Real-World Example Workflow

### Scenario: Temperature Alert System

**1. Publish sensor data:**
```bash
mosquitto_pub -t "house/greenhouse/temperature" -m "38"
```

**2. IoT Controller evaluates rules:**
- Rule: IF house/greenhouse/temperature > 35 THEN trigger alert

**3. Controller publishes action:**
```python
# Original action
client.publish("house/ac/command", "on")

# SMS notification
client.publish("SMS/Greenhouse Temperature High", "Temperature 38°C, AC turned on")
```

**4. MQTT SMS Relay receives SMS topic:**
- Extracts subject: "Greenhouse Temperature High"
- Gets message: "Temperature 38°C, AC turned on"
- Sends SMS to alert number

**5. Admin receives SMS:**
```
Subject: Greenhouse Temperature High
Message: Temperature 38°C, AC turned on
```

***

## Part 6: Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         IoT Sensor/Controller               │
│  (Publishes to MQTT when rule triggers)     │
└────────────────┬────────────────────────────┘
                 │
                 │ Publishes to:
                 │ SMS/Subject/Name
                 │
                 ▼
    ┌──────────────────────────┐
    │  MQTT Broker             │
    │  (Mosquitto)             │
    └────────┬─────────────────┘
             │
             │ Subscribes to SMS/+
             │
             ▼
    ┌──────────────────────────┐
    │  MQTT SMS Relay Service  │  <-- This program
    │  (mqtt_sms_relay.py)     │
    │  - Receives message      │
    │  - Extracts subject      │
    │  - Sends via SMTP        │
    └────────┬─────────────────┘
             │
             │ Sends email to:
             │ 5145557777@txt.bell.ca
             │
             ▼
    ┌──────────────────────────┐
    │  Gmail SMTP Server       │
    │  (smtp.gmail.com:587)    │
    └────────┬─────────────────┘
             │
             │ Forwards to:
             │ Carrier SMS Gateway
             │
             ▼
    ┌──────────────────────────┐
    │  Bell SMS Gateway        │
    │  (txt.bell.ca)           │
    └────────┬─────────────────┘
             │
             │ Converts to SMS
             │
             ▼
    ┌──────────────────────────┐
    │  Mobile Phone            │
    │  "Greenhouse Temp High"  │
    │  "Temperature 38°C, ..." │
    └──────────────────────────┘
```

***

## Part 7: Error Handling

### Common Issues and Solutions

**Issue: "Gmail login failed"**
```
Error: Gmail login failed - check SENDER_EMAIL and SENDER_PASSWORD
```
**Solutions:**
- Verify Gmail address is correct
- Generate new App Password from myaccount.google.com/apppasswords
- Ensure 2-Factor Authentication is enabled
- Copy full 16-character password (including spaces)

**Issue: "Failed to connect to MQTT broker"**
```
Error: Failed to connect to MQTT broker
Check that Mosquitto is running: sudo systemctl status mosquitto
```
**Solution:**
```bash
sudo systemctl start mosquitto
```

**Issue: No SMS received**
```
✓ SMS sent to 5145557777@txt.bell.ca (but no SMS arrives)
```
**Solutions:**
- Verify carrier SMS gateway is correct
- Phone number format must be 10 digits (no formatting)
- Check email account has SMTP access enabled
- Try a different carrier gateway from the reference list

***

## Summary

You've built a **production-ready MQTT to SMS relay** that:

- **Listens to MQTT topics** with wildcard subscription  
- **Extracts subjects** from topic path  
- **Sends SMS notifications** via email-to-SMS gateways  
- **Integrates with IoT Controller** for automated alerting  
- **Error handling** for network and authentication issues  
- **Colored output** for easy monitoring  
- **Completely free** - uses Gmail and carrier gateways  

**Real-world applications:**
- Alert system operators to equipment failures
- Send notifications when thresholds exceeded
- Emergency alerts to on-call staff
- IoT system status updates