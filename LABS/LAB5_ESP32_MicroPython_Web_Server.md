# Lab 5: ESP32 MicroPython Web Server

This tutorial guides students through three main phases:
- Connecting an ESP32 to an Ubuntu computer and flashing the correct MicroPython firmware.
- Writing a MicroPython program to handle WiFi connectivity and LED status indicators.
- Running a simple web server on the ESP32 to confirm successful WiFi connection.

This tutorial uses Thonny on your development computer.
If you have not done so already, install Thonny by running:
```bash
sudo apt install thonny
```

Once you will have new firmware flashed to your ESP32 development board, this process should not need be followed again.
Firmware is stored in persistent memory - memory that stays the same - such that it never needs to be updated unless it becomes damaged or out-of-date.

## Part 1: Setup and Flashing MicroPython to ESP32

The `esptool` package contains an ESP chip flash utility which we use to change the firmware of our ESP32.
Think of firmware as an operating system.

To install the new firmware needed to use MicroPython, we must install esptool on our development computer and this is done with the following command:
```
pip install esptool
```

In the following steps, we will use `esptool` to **install the MicroPython interpreter firmware directly onto our ESP32 development boards**.

1. **Connecting ESP32 to Ubuntu**
   - Plug the ESP32 development board into a USB port on the Ubuntu computer using a suitable USB cable.
   - Confirm the device appears with:
     ```bash
     dmesg | grep tty
     ```
     or
     ```bash
     ls /dev/tty*
     ```
     You’ll typically see something like `/dev/ttyUSB0` or `/dev/ttyACM0` if the board is recognized.

2. **Locating MicroPython Firmware**
   - Go to the official MicroPython downloads page for ESP32 boards:
   - Select the build that matches the ESP32 development board’s chipset (e.g., generic, WROVER, S2, S3).
   - Download the latest stable `.bin` firmware file to the Ubuntu computer.

3. **Flashing MicroPython Firmware**

### Method 1 Flashing MicroPython Firmware with esptool at the command line

We first find and download the correct firmware image for our development board, as follows:

- Navigate to `MicroPython.org`.
- Click Download.
- Find your development board by clicking on the appropriate ESP32 version in the **MCU** section.
- Find your development board in the listed images.
- Download the latest compatible firmware from the versions listed.

Follow the instructions provided on the installation page.

### Method 2 Flashing MicroPython Firmware Using Thonny
- Open Thonny, connect the ESP32 board via USB, and navigate to “Tools > Options > Interpreter”.
- Select “MicroPython (ESP32)” and set the serial port according to what you found earlier.
- Click on the `install or update MicroPython (esptool)` link in the same dialog.
- Use the Firmware flashing wizard with appropriate selections

***

## Part 2: ESP32 MicroPython Application with WiFi and LEDs

Write and deploy this application using Thonny:

1. **Hardware Setup**
   - Connect two LEDs to GPIO pins (e.g., GPIO2 and GPIO15) on the ESP32 with appropriate resistors (220Ω recommended), and ground the other ends.
   - LED1: Shows power-on (stays ON).
   - LED2: Blinks while connecting to WiFi; stays ON once connected.

TIP: Check the pinout to your ESP32 device to make sure your connections are on the correct pins.

2. **MicroPython Code Sample**

   ```python
   import network
   import time
   import machine

   LED_POWER = machine.Pin(2, machine.Pin.OUT)
   LED_WIFI = machine.Pin(15, machine.Pin.OUT)

   # Change these values according to your network name (SSID) and password
   SSID = "your_wifi_ssid"
   PASSWORD = "your_wifi_password"

   LED_POWER.value(1)  # Board is powered on

   wlan = network.WLAN(network.STA_IF)
   wlan.active(True)

   # Blinking while connecting
   blink = True
   while not wlan.isconnected():
       LED_WIFI.value(blink)
       blink = not blink
       time.sleep(0.5)
       wlan.connect(SSID, PASSWORD)

   # Connected, turn WiFi LED ON
   LED_WIFI.value(1)
   print("Connected to WiFi:", wlan.ifconfig())
   ```

   - Save and run this program from Thonny with the ESP32 board selected as the MicroPython device, at the bottom right corner of the Thonny window.

What do you notice?
Which instructions do you believe are responsible for making the leds light up and blink?
Which instructions do you believe are setting up and executing the WiFi connection?

Since we are connected to WiFi, I wonder if we could make the ESP32 into a tiny web server.

## Part 3: ESP32 MicroPython Web Server

1. **Simple Web Server Code**

   Add to the code (end of previous file):

```python
#a tiny web server
addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
s = socket.socket()
s.bind(addr)
s.listen(1)
print('Listening on', addr)

#define the response to all requests
html_response = b"""\
HTTP/1.0 200 OK\r\nContent-Type: text/html\r\n\r\n
<html>
  <body>
    <h2>Hello from ESP32!</h2>
  </body>
</html>
"""

#always wait fo requests and respond with the above response
while True:
    #accept the incoming connection
    cl, addr = s.accept()
    print('Client connected from', addr)
    # Read, display, and discard all headers (We must completely receive the request to ensure consistent behaviour)
    cl_file = cl.makefile('rwb', 0)
    while True:
        line = cl_file.readline()
        print(line)
        if not line or line == b"\r\n":
            break
    #now send the response to the client
    cl.send(html_response)
    #close the connection
    cl.close()
    print('Response sent to client at', addr)
   ```

If you implemented the entire program as instructed, you should be getting output similar to the following when running it:

```
WiFi connection failed... retrying...
Connected to WiFi: ('192.168.2.107', '255.255.255.0', '192.168.2.1', '192.168.2.1')
Listening on ('0.0.0.0', 80)
```

Your IPv4 addresses (###.###.###.###) probably will differ from this example.
Make a note of the first such address from your output, positioned like the address `192.168.2.107` from the above.

Open a browser Visit `http://192.168.2.107` where you place the address that you obtained in your output as above.

## Conclusion

In this tutorial, you were introduced to core embedded programming, Linux hardware interfacing, and simple IoT networking principles.