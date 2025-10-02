# LAB6: Telemetry with ESP32, MQTT, and Raspberry Pi

In this lab, we will create our first multiple-device IoT application.

You will need
- Raspberry Pi running Raspberry Pi desktop or a compatible linux-based OS
- ESP32 development board flashed with the MicroPython firmware

**System summary:**

![ESP32-MQTT-RPi_1](../public/images/ESP32-MQTT-RPi.png)

![ESP32-MQTT-RPi_1](../public/images/ESP32-MQTT-RPi_2.png)

Raspberry Pis are complete single-board computers with sufficient resources to run complex programs and services.
We will use a RPi to host a Mosquitto MQTT message broker service.
This message broker service will have the responsibility of receiving telemetry data from our ESP32 and forwarding this data to our Raspberry Pi Python applications, and more devices and programs in the future.

Our ESP32 development board will be set up as a temperature (and humidity?) telemetry device, sampling data from an I2C temperature (and humidity?) sensor and relaying this data over to our Mosquitto message broker.

Our Raspberry Pi will run a small Python program that will subscribe to the temperature (and humidity?) data, read it, process it, and respond with control messages over MQTT. 

## About Mosquitto

Mosquitto is a lightweight, open-source MQTT server (also called a "broker") that acts as the central messaging hub in an MQTT-based system. Mosquitto enables efficient communication between electronic devices—like sensors, microcontrollers, and computers—in Internet of Things (IoT) applications, industrial automation, and smart systems.

### MQTT Protocol Basics
Mosquitto implements the MQTT (Message Queuing Telemetry Transport) protocol, which uses a publish/subscribe model. Devices (known as "clients") can publish messages to named "topics," and other devices can subscribe to those topics to receive the messages. This approach allows for flexible, scalable data exchange without requiring devices to poll for updates, i.e., instead of having to constantly ask for updates, any new message is sent to the subscribers by the MQTT broker, who initiates the messaging. Messages are only sent when there is something to communicate, avoiding a message flooding from information requests.

### Why Mosquitto Is Useful
- **Lightweight**: Suitable for low-power embedded devices, such as microcontrollers, or full servers.
- **Real-Time Data**: Delivers sensor measurements or control commands instantly across a network.
- **Platform Support**: Runs on Linux, Windows, macOS, Raspberry Pi, and supports Docker deployment.
- **Offline Messaging**: Stores messages temporarily if the recipient is offline, then delivers them once reconnected—reducing data loss in unreliable networks.

### Electrical Engineering Applications
- Wireless sensor networks for environmental monitoring, industrial controls, or building automation, where hundreds of sensors need rapid, reliable communication.
- Connecting microcontrollers like ESP32, Arduino, or Raspberry Pi as MQTT clients to send data (e.g., temperature or voltage) to a central server for analysis.
- Enabling remote control and monitoring of systems, such as turning equipment on/off or reporting faults.

## Lab setup

**To ensure that communications will function as intended, it is important to connect all devices to the same WiFi network.**

This is because if all devices are connected to the same WiFi network, they then belong to the same broadcast domain and thus be able to message one-another.

**You must connect the Raspberry Pi to the class wireless network.**

## Part 1: Installing and configuring Mosquitto

### Step 1 : Install Mosquitto

On your Raspberry Pi, install Mosquitto and Mosquitto client tools as follows:

```bash
sudo apt update 
sudo apt install mosquitto mosquitto-clients
```

We verify that Mosquitto is running as a service by running a service status check as follows:
```bash
systemctl status mosquitto.service
```

The output should look something like this
```bash
● mosquitto.service - Mosquitto MQTT Broker
     Loaded: loaded (/usr/lib/systemd/system/mosquitto.service; enabled; preset: enabled)
     Active: active (running) since Thu 2025-10-02 04:37:44 EDT; 4h 25min ago
       Docs: man:mosquitto.conf(5)
             man:mosquitto(8)
   Main PID: 2184 (mosquitto)
      Tasks: 1 (limit: 28051)
     Memory: 1.8M (peak: 2.5M)
        CPU: 1.263s
     CGroup: /system.slice/mosquitto.service
             └─2184 /usr/sbin/mosquitto -c /etc/mosquitto/mosquitto.conf

Oct 02 04:37:44 ubuntu systemd[1]: Starting mosquitto.service - Mosquitto MQTT Broker...
Oct 02 04:37:44 ubuntu mosquitto[2184]: 1759394264: Loading config file /etc/mosquitto/conf.d/accept_external.co>
Oct 02 04:37:44 ubuntu systemd[1]: Started mosquitto.service - Mosquitto MQTT Broker.
```

Press `:` and then `q` to exit this view if you were not returned to the command prompt.

What you are looking for in this output are the words `active (running)` in green.

To test the functionality of the server, we also use the two client programs to publish messsages and to subscriibe to messages,

For this process, we need 2 terminal windows: one for the subscriber program and another for the publisher program.
So, in the first window, run the subscriber program, so that it can subscribe to the `room/temperature` topic and wait for published messages:
```bash
mosquitto_sub -t "room/temperature"
```

Then, open another terminal (CTRL+ALT+T) to enter the following publishing command:
```bash
mosquitto_pub -t "room/humidity" -m "33"
```

This should publish the message "33" under the `room/humidity` topic on the local MQTT server, our new Mosquitto service.
So you should see the mesage "33" aooear in the window with the subscriber application.


### Step 2: Configure Mosquitto to Accept External Connections

By default, mosquitto does not accept connection requests from external devices.
This is to allow you to install and test it without creating security breaches right away.

To enable communications between different devices, we must set up our Mosquitto server such that it can accept external connection requests.

To let mosquitto accept external connection requests, we add a configuration file in its configurations folder, as follows:

- Create and edit `accept_external.conf` in the configurations directory for mosquitto:

```bash
sudo nano /etc/mosquitto/conf.d/accept_external.conf
```
and add the following text

```conf
listener 1883 0.0.0.0
allow_anonymous true
```
... and finally press `CTRL+O` to output (save) the changes and `CTRL+X` to eXit.

To make these changes take effect we could reboot the system or just restart mosquitto.
To restart the mosquitto service, enter the following command in the terminal interface to the command prompt:
```bash
sudo systemctl restart mosquitto.service
```

Again, we verify that this all worked by running a status check as follows:
```bash
systemctl status mosquitto.service
```

The output should look something like this
```bash
● mosquitto.service - Mosquitto MQTT Broker
     Loaded: loaded (/usr/lib/systemd/system/mosquitto.service; enabled; preset: enabled)
     Active: active (running) since Thu 2025-10-02 09:33:44 EDT; 1min ago
       Docs: man:mosquitto.conf(5)
             man:mosquitto(8)
   Main PID: 2196 (mosquitto)
      Tasks: 1 (limit: 28051)
     Memory: 1.8M (peak: 2.5M)
        CPU: 1.263s
     CGroup: /system.slice/mosquitto.service
             └─2184 /usr/sbin/mosquitto -c /etc/mosquitto/mosquitto.conf

Oct 02 09:33:44 ubuntu systemd[1]: Starting mosquitto.service - Mosquitto MQTT Broker...
Oct 02 09:33:44 ubuntu mosquitto[2184]: 1759394264: Loading config file /etc/mosquitto/conf.d/accept_external.co>
Oct 02 09:33:44 ubuntu systemd[1]: Started mosquitto.service - Mosquitto MQTT Broker.
```

Press `:` and then `q` to exit this view if you were not returned to the command prompt.

What you are looking for in this output are the words `active (running)` in green.

We will be able to verify that communications between devices are functional by using 2 Raspberry Pi devices.

- In one RPi, run the `hostname` command to obtain the name of the host. For this example, let's imagine the hostname is `waldo`.
- In the other RPi, open a terminal and run `mosquitto_sub -h "waldo.local" -t "room/temperature"`
- In that same RPi, open a second terminal and run `mosquitto_pub -h "waldo.local" -t "room/temperature" -m "23"`
- You should see the new message appear in the first terminal window.

## Part 2: Programming an ESP32 to communicate MQTT messages

We will read sample data from an I2C sensor connected to one of our ESP32 dev board's I2C interfaces.
We will then convert this data to the correct units before publishing it, periodically, on the MQTT topic `room/temperature`.


Open Thonny

In the ESP32 Code

```python
# main.py — ESP32 MicroPython: publish temperature via MQTT
# Topics: room/temperature

import time
import network
from machine import Pin, I2C
from umqtt.simple import MQTTClient  # use umqtt.robust if desired

WIFI_SSID = "SSID"
WIFI_PASS = "password!"

MQTT_BROKER = "local name of your computer"
MQTT_PORT = 1883
MQTT_CLIENT_ID = "esp32-room-sensor"
MQTT_KEEPALIVE = 60  # seconds

TOPIC_TEMP = b"room/temperature"
TOPIC_HUM = b"room/humidity"

# I2C config — adjust pins as wired
I2C_SCL = 22
I2C_SDA = 21
I2C_FREQ = 100000

# SHT31 constants
SHT31_ADDR = 0x44  # 0x45 if ADR pin tied high
SHT31_MEAS_HIGHREP = b"\x24\x00"  # single shot, high repeatability
# Datasheet: T = -45 + 175 * (rawT/65535), RH = 100 * (rawRH/65535)
sta = 0
#probablement que l<objet meurt et que ca deconnecte... faudrait le passer?
def wifi_connect():
    sta = network.WLAN(network.STA_IF)
    sta.active(True)
    sta.connect(WIFI_SSID, WIFI_PASS)
    while not sta.isconnected():
        print("connecting...")
        time.sleep(0.2)
    print(f"WiFi connected {sta.ifconfig()}")
    return sta.isconnected()

def read_sht31(i2c):
    # trigger single-shot conversion
    i2c.writeto(SHT31_ADDR, SHT31_MEAS_HIGHREP)
    time.sleep_ms(20)  # wait conversion (~15ms typical)
    data = i2c.readfrom(SHT31_ADDR, 6)
    t_raw = (data[0] << 8) | data[1]
    rh_raw = (data[3] << 8) | data[4]
    # ignore CRC bytes (data[2], data[5]) for brevity
    temperature = -45.0 + 175.0 * (t_raw / 65535.0)
    humidity = 100.0 * (rh_raw / 65535.0)
    return temperature, humidity

def main():
    # Wi-Fi
    assert wifi_connect(), "Wi-Fi connection failed"

    # MQTT
    mqtt = MQTTClient(MQTT_CLIENT_ID, MQTT_BROKER, MQTT_PORT, keepalive=MQTT_KEEPALIVE)
    try:
        mqtt.connect()
    except Exception as e:
        print("MQTTClient connection failed");
        print(e)

    # I2C
    i2c = I2C(0, scl=Pin(I2C_SCL), sda=Pin(I2C_SDA), freq=I2C_FREQ)

    try:
        while True:
            try:
                #t, h = read_sht31(i2c)
                t,h = 20,33
                
                print(f"Publishing {('%.2f' % t).encode()} to {TOPIC_TEMP}")
                mqtt.publish(TOPIC_TEMP, ("%.2f" % t).encode())
                print(f"Publishing {('%.2f' % h).encode()} to {TOPIC_HUM}")
                mqtt.publish(TOPIC_HUM, ("%.2f" % h).encode())
            except Exception as e:
                # optional: try reconnect on publish/read error
                try:
                    mqtt.connect()
                except:
                    pass
            time.sleep(5)  # publish interval seconds
    finally:
        try:
            mqtt.disconnect()
        except:
            pass

main()

```

Get data from sensors now