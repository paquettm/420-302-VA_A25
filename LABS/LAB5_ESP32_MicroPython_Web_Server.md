# Lab 5: ESP32 MicroPython Web Server

This tutorial is inspired by a blog post on [Hosting a WebSite on a Disposable Vape
](http://ewaste.fka.wtf/)

This tutorial guides students through three main phases:
- Connecting an ESP32 to an Ubuntu computer and flashing the correct MicroPython firmware.
- Writing a MicroPython program to handle WiFi connectivity and LED status indicators.
- Running a simple web server on the ESP32 to confirm successful WiFi connection.

## Thonny Thonny Thonny

This tutorial uses Thonny on your development computer.

If you have not installed Thonny through the Ubuntu App Center, you may be having issues with saving files.
In this case, uninstall Thonny with the following command (in a bash terminal window):
```bash
sudo apt remove thonny
```
and answer yes when requested.
Then go to the Ubuntu App Center in the left navigation bar or activities menu.
Search for Thonny and install it.

## Part 1: Setup and Flashing MicroPython to ESP32

The `esptool` package contains an ESP chip flash utility which we use to change the firmware of our ESP32.
Think of firmware as an operating system.

To install the new firmware needed to use MicroPython, we must install esptool on our development computer and this is done with the following command:
```bash
pip install esptool
```
And if that failed, create a folder, a virtual environment, enter it, and run 
```bash
pip install esptool
```
again.

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

TIP: It may be difficult to find the correct firmware for your board. In this situation, you may want to use esptool to identify your chip.
From the virtual envronment where esptool is installed, and with the ESP32 connected to the computer through USB, run
```bash
esptool chip-id
```

3. **Flashing MicroPython Firmware**

We first find and download the correct firmware image for our development board, as follows:

- Navigate to `MicroPython.org`.
- Click Download.
- Find your development board by clicking on the appropriate ESP32 version in the **MCU** section.
- Find your development board in the listed images.
- Download the latest compatible firmware from the versions listed.

Follow the instructions provided on the installation page.

For example:
Enter "that virtual environment" if you ever left it.

**Erasing**
If you are putting MicroPython on your board for the first time then you should first erase the entire flash using:

Run, from that virtual environment
```bash
esptool erase_flash
```
esptool.py will try to detect the serial port with the ESP32 automatically, but if this fails or there might be more than one Espressif-based device attached to your computer then pass the --port option with the name of the target serial port. For example:

```bash
esptool --port PORTNAME erase_flash
```

On Linux, the port name is usually similar to `/dev/ttyUSB0`.

**Flashing**
Then deploy the firmware to the board, starting at address 0x1000:

```bash
esptool --baud 460800 write_flash 0x1000 ESP32_BOARD_NAME-DATE-VERSION.bin
```
Replace ESP32_BOARD_NAME-DATE-VERSION.bin with the .bin file downloaded from this page.

As above, if esptool.py can't automatically detect the serial port then you can pass it explicitly on the command line instead. For example:

```bash
esptool --port PORTNAME --baud 460800 write_flash 0x1000 ESP32_BOARD_NAME-DATE-VERSION.bin
```

If you see no error messages on your terminal window, all should be well!

Once you will have new firmware flashed to your ESP32 development board, this process should not need be followed again.
Firmware is stored in persistent memory - memory that stays the same - such that it never needs to be updated unless it becomes damaged or out-of-date.

### Alternative method: The Thonny wizard

- Click `Tools` at the top menu and `Options...`.
- Select the `Interpreter` tab.
- Click the `Install or update MicroPython (esptool)` hyperlink.
- Select `CP2102 USB to UART Bridge Controller @ /dev/ttyUSB0` or the similar choice in the `Target port` dropdown menu.
- Select `ESP32` in the `MicroPython family` dropdown menu. If you have a different ESP32 as per the `esptool chip-id` output, find the matching one.
- Select `Espressif - ESP32 / WROOM` in the `variant` dropdown menu, or another variant matching your exact model.
- Select the latest version from the `version` dropdown menu.
- Click `Install`.

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
SSID = "your_network_name"
PASSWORD = "your_network_password"

LED_POWER.value(1)  # Board is powered on

wlan = network.WLAN(network.STA_IF)
wlan.active(True)

# Blinking while connecting
blink = True
while not wlan.isconnected():
    try:
        LED_WIFI.value(blink)
        blink = not blink
        wlan.connect(SSID, PASSWORD)
    except:
        print("WiFi connection failed... retrying.")
    time.sleep(0.5)

# Connected, turn WiFi LED ON
LED_WIFI.value(1)
print("Connected to WiFi:", wlan.ifconfig())
```

To run this program on your ESP32, do as follows:

- Connect the ESP32 to the computer throught USB.
- Select `MicroPython (ESP32) - CP2102 USB to UART Bridge Controller @ /dev/ttyUSB0` or a similar entry, at the complete bottom-right corner of the Thonny window.
- Click the save icon or press the `CTRL+S` key combination on the keyboard. Select `MicroPython device` and name it `main.py`.
- It should run directly when the device is reset, but if not, just press the Start icon (the arrow in a green circle) or press `F5`.

Note: Saving the micropython program as `main.py` should make the ESP32 board run this program automatically on power-up.
If not, you can run the `import main` command at the REPL (the micropython debug window when the ESP32 device is connected and selected at the bottom-right).
The `CTRL+C` key combination can stop a program from running.
The `CTRL+D` key combination can start the main program up again.

**Troubleshooting**
If you can't make the selection at the bottom-right of Thonny, then make sure the ESP32 is indeed connected to the computer with a proper USB wire that includes data communication wires, not just the power wires.

If this is already the case:
- Click `Tools` at the top menu and `Options...`.
- Select `Micropython (ESP32)` in the `Which kind of interpreter should Thonny use to run your code?` dropdown menu.
- Select `CP2102 USB to UART Bridge Controller @ /dev/ttyUSB0` or the similar choice in the `Port or WebREPL` dropdown menu.
- Close this window by clicking `OK`

**Reflection:**

- What do you notice?
- Which instructions do you believe are responsible for making the leds light up and blink?
- Which instructions do you believe are setting up and executing the WiFi connection?

Since we are connected to WiFi, I wonder if we could make the ESP32 into a tiny web server.

## Part 3: ESP32 MicroPython Web Server

   Add to the code (end of previous file):

```python
import socket
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

**Reflection:**

- What do you notice?
- Which instructions do you believe are responsible for making the server receive the requests?
- Which instructions do you believe are sending the HTTP response?

## Conclusion

In this tutorial, you were introduced to core embedded programming, Linux hardware interfacing, and simple IoT networking principles.

## Challenge

- If you understood the exercise fully, then you should be able to modify the code to handle different Webpages from different addresses in the requests.
- Otherwise, pair up and discuss the code, what each part does and how you could modify it to accomplish this challenge.
- Invite the teacher and explain what each part of the code does and how you would make the modifications to get the requested result.

**Update your reflection logs**
