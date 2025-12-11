---
title: 'HOW-TO: Raspberry Pi SSH and VNC Setup and Use'
description: 'HOW-TO: Raspberry Pi SSH and VNC Setup and Use'
sidebar:
  label: 'HOW-TO: Raspberry Pi SSH and VNC Setup and Use'
  order: 4
---

# HOW-TO: Raspberry Pi SSH and VNC Setup and Use

SSH, or Secure SHell, is a connection method allowing registered users to gain access to command line interfaces to their computers.
VNC, or Virtual Network Computing, is a connection method allowing registered users to gain access to their computer's graphical environment, seeing what displays on the screen, and using their computer's keyboard and mouse to control another computer.

This guide covers activating and using SSH and VNC on Raspberry Pi Desktop OS through two distinct approaches: with attached peripherals and through SD card manipulation from Windows or macOS. Both methods achieve the same result but cater to different hardware availability scenarios.

## Method 1: Setup With Keyboard, Mouse, and Monitor Attached

This method is ideal when you have direct access to your Raspberry Pi and peripheral devices.

### Step 1: Initial System Preparation

Boot your Raspberry Pi into the Desktop environment and complete the initial setup wizard if prompted. Ensure your Pi is connected to your network via Ethernet or Wi-Fi before proceeding.

### Step 2: Enable SSH and/or VNC Servers

**Option A: Graphical Interface**
Click the Raspberry Pi icon in the top-left corner, navigate to **Preferences** > **Raspberry Pi Configuration**. Select the **Interfaces** tab, locate **SSH** and/or **VNC** in the list, and change their setting from "Disabled" to "Enabled" as required. Click **OK** to save changes.

**Option B: Command Line**
Open a terminal and execute:
```bash
sudo raspi-config
```
If you want to activate **SSH**, then navigate to **Interface Options** > **SSH** > **Yes** > **OK**.

If you wish to activate **VNC**, the select **Interface Options** > **VNC** > **Yes** > **OK**

Click **Finish** to exit the `raspi-config` application. The selected servers will activate and launch automatically on subsequent boots.
To force a reboot right away, at the terminal execute:
```bash
sudo reboot
```

### Step 3: Verify Network Connectivity

Determine your Raspberry Pi's IP address by running:
```bash
hostname -I
```
or
```bash
ip a
```
Note the IP address (typically formatted as 192.168.x.x or 10.x.x.x) for client connections.

If you want to connect via the host name, note first that this technique does not always work, for example, if there are name conflicts on the broadcast domain. To get the host name run:
```bash
hostname
```
Note the host name.

Get your username by running:
```bash
whoami
```
Take a note of this hostname and remember your account password.

### Step 4: Connect from Client Computer

Go download PuTTY from the page linked by `putty.org`.

**SSH Connection:**
From Windows, use PuTTY with the noted hostname onto which you can add `.local` or **the IP address noted**. 
For example:
```
raspberrypi.local
```
if `hostname` returned `raspberrypi` or
```
bob-pi.local
```
if `hostname` returned `bob-pi` or
```
192.168.0.103
```
if `hostname -I` returned `192.168.0.103`.

From macOS or Linux, add the username in front of the address when calling the `ssh` command.
For the 3 scenarios from above, we would run
```bash
ssh herbert@raspberrypi.local
ssh herbert@bob-pi.local
ssh herbert@192.168.0.103
```
depending on the situation as above if `whoami` returned the account name `herbert`.

Enter your password when prompted.

**VNC Connection:**
Download and install VNC Viewer from RealVNC.
Launch the application, in the address bar, for each of the scenarios provided above, we would enter the address as follows
```bash
raspberrypi.local:0
bob-pi.local:0
192.168.0.103:0
```
and then authenticate with your Pi credentials (username from `whoami` and corresponding password).

## Method 2: Headless Setup via SD Card Files

This method configures SSH and VNC before first boot, eliminating the need for peripherals entirely.

If you have previously flashed your SD card, skip directly to Method 3.

### Step 1: Prepare the SD Card with Raspberry Pi Imager

**Download and Install:**
Obtain Raspberry Pi Imager from the official website. Insert your microSD card into your Windows or macOS computer using a card reader.

**Flash the OS:**
1. Open Raspberry Pi Imager
2. Click **CHOOSE OS** and select **Raspberry Pi OS (64-bit)** or your preferred variant
3. Click **CHOOSE SD CARD** and select your microSD card
4. Click the gear icon (⚙️) or press `Ctrl+Shift+X` to access advanced options

### Step 2: Configure Advanced Settings

**Enable SSH:**
Check **Enable SSH** and select **Use password authentication**. For educational environments where security is paramount, this is preferable to key-based authentication for initial setup.

**Set Credentials:**
Configure a **username** and **password** (avoid the default `pi`/`raspberry` combination for security). This prevents the first-boot wizard from requiring user interaction.

**Configure Wi-Fi (if needed):**
Enter your Wi-Fi SSID and password. Set the correct **Wi-Fi country** code (CA for Canada).

**Set Hostname:**
Optionally customize the hostname (e.g., `iot-lab-01`) to easily identify multiple Pi devices on your network.

**Enable VNC:**
Check **Enable VNC** to activate the VNC server automatically.

**Locale Settings:**
Configure timezone to America/Montreal and keyboard layout to match your preference.

Click **Save** and then **YES** to apply settings before writing the OS image.

## Method 3: Manual SD Card Configuration (Alternative Method)

Connect the SD card to your Windows, Mac, or Linux computer.
Enter the boot partition that appears on your computer.
Manually create configuration files:

**For Windows Users:**
1. Find the boot partition and take note of the drive letter (e.g., E:)

2. Open Command Prompt and navigate to the drive:
```cmd
E:
type nul > ssh
```
This will create an empty file called ssh to trigger the activation of the ssh server.

3. If you have not previously connected to the WiFi network in the location where you are working, create a `wpa_supplicant.conf` file in the boot partition root containing the following:
```bash
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=CA

network={
    ssid="YourNetworkSSID"
    psk="YourNetworkPassword"
    scan_ssid=1
}
```
You may create this file and save it with an editor like Notepad.
When you do, change `YourNetworkSSID` and `YourNetworkPassword` to your WiFi network name and password.

4. Create a `userconf.txt` file containing your encrypted password:
```bash
echo 'username:encrypted-password' > userconf.txt
```
Generate the encrypted password using OpenSSL.
If you already installed Git on your Windows computer, you can find the OpenSSL program executable at the following path:
```
C:\Program Files\Git\usr\bin\openssl.exe
```
If you have not installed Git on your computer yet, then install it and then use the OpenSSL executable mentioned above.
Run the following command:
```bash
openssl passwd -6
```
Then the program will ask for your password and a confirmation of the password.
Type the same password twice!

**For macOS Users:**
1. The boot partition mounts automatically (usually at `/Volumes/boot`)
2. Open Terminal and create the SSH enable file:
```bash
cd /Volumes/boot
touch ssh
```
3. Create the `wpa_supplicant.conf` file using nano:
```bash
nano wpa_supplicant.conf
```
Paste the same configuration content as above.

4. Create `userconf.txt` with encrypted credentials.
macOS ships with OpenSSL or LibreSSL preinstalled.
Run the following command:
```bash
openssl passwd -6
```

### Step 4: First Boot and Connection

**Eject Safely:**
Use the "Eject" function in Windows or macOS before removing the SD card to prevent corruption.

**Insert and Power On:**
Place the SD card in your Raspberry Pi and connect power. Wait 60-90 seconds and up to 5 minutes for the initial boot sequence to complete and network connection to establish.

**Discover the IP Address:**
From your computer, check connected devices of course, change `raspberrypi` to match your selected hostname:
```bash
# macOS/Linux
ping raspberrypi.local

# Windows (with Bonjour installed)
ping raspberrypi.local

# Alternative: Check your router's DHCP client list
```
**Connect via SSH:**
Use the configured credentials to establish SSH access:
```bash
ssh your-username@raspberrypi.local
```

**Enable VNC if Not Pre-configured:**
If you didn't enable VNC through Imager, SSH in and run:
```bash
sudo raspi-config
```
Navigate to **Interface Options** > **VNC** > **Yes**.

### Step 5: VNC Client Setup

**Install VNC Viewer:**
Download RealVNC Viewer for your operating system. For Raspberry Pi OS Bookworm (latest version), TigerVNC is recommended as an alternative to RealVNC Viewer.

**Establish Connection:**
1. Launch VNC Viewer
2. Enter `raspberrypi.local:0` or `<ip-address>:0`
3. Authenticate with your configured username and password
4. The Raspberry Pi desktop will appear in a resizable window

## Post-Setup Configuration and Best Practices

### Persistent VNC Configuration

**Automatic VNC Startup:**
If VNC doesn't start automatically, enable the service:
```bash
sudo systemctl enable vncserver-x11-serviced.service
sudo systemctl start vncserver-x11-serviced.service
```
**Manual VNC Server Start:**
For specific display configurations, use:
```bash
vncserver :1 -geometry 1920x1080 -depth 24
```
This creates a virtual display accessible at `<ip-address>:1`.

### Network Accessibility

**Hostname Resolution Issues:**
If `raspberrypi.local` doesn't resolve, ensure Bonjour service is installed on Windows or use the IP address directly. For macOS and Linux, mDNS should work automatically.

**Static IP Configuration:**
For consistent access in lab environments, configure a static IP via your router's DHCP reservation or by editing `/etc/dhcpcd.conf` on the Pi.

## Troubleshooting Common Issues

**SSH Connection Refused:**
- Verify the `ssh` file exists in the boot partition (headless setup)
- Check that SSH is enabled in `raspi-config`
- Confirm both devices are on the same network
- Ensure the Pi has completed booting (wait 90 seconds)

**VNC Black Screen:**
- The VNC server requires a desktop environment. For headless setups, ensure `raspi-config` is set to boot to desktop
- Try restarting the VNC service: `sudo systemctl restart vncserver-x11-serviced.service`
- Check display configuration: `vncserver -list`

**Authentication Failures:**
- Verify username and password are correctly set in the Imager tool or `userconf.txt`
- Check for correct keyboard layout during password entry
- Ensure no trailing spaces in configuration files

**Wi-Fi Connection Issues:**
- Confirm `wpa_supplicant.conf` is in the boot partition root (not in a subfolder)
- Verify country code matches your location (CA for Canada)
- Check SSID and password for special characters that may need escaping
