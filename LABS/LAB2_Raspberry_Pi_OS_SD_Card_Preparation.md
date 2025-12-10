---
title: 'Lab 2: Raspberry Pi OS SD Card Preparation'
description: 'Lab 2: Raspberry Pi OS SD Card Preparation'
sidebar:
  label: 'Lab 2: Raspberry Pi OS SD Card Preparation'
  order: 2
---

# Lab 2: Raspberry Pi OS SD Card Preparation

To be able to boot up your Raspberry Pi (RPi), you must have a properly-configured Operating System on its boot medium.

By default, RPi devices will boot from the medium inserted in its micro SD card port, on the bottom side of the Single-Board Computer (SBC).
Some models can also be made to boot up from USB, which can be more practical.

---

## Requirements

You will need to have the following hardware

- A micro SD card reader integrated to your computer or a USB SD card adapter.
- A micro SD card with at least 8GB of capacity. It is best to purchase a good-quality, fast SD card. Refer to [this article](https://www.engadget.com/computing/accessories/best-microsd-card-130038282.html) to learn about SD card quality.

Computers in lab D-221 do not have micro-SD card adapters built-in, so you will need the USB-to-micro-SD adapter.

---

## Imaging Software

To write an image onto an SD card, your host computer needs software with disk imaging capabilities.
For operating systems specific to RPi devices, the most practical software of this kind is **Raspberry Pi Imager**.

If this software is already installed on your workstation, and the apropriate permissions are set for it or for your user account, then you can proceed.
Otherwise, you will need to install the software, which will require appropriate software installation permissions on your user account.

---

### Installing under Windows

Under Windows, open a Web browser (such as Chrome) and navigate to [https://www.raspberrypi.com/software/](https://www.raspberrypi.com/software/).
Click on the link matching your operating system to start the download.
Navigate in your operating system to the location of this download and execute the installer file.
Follow the steps on-screen to complete installation.

---

### Installing under Ubuntu Linux

Under Ubuntu, there is a lot of standard software that is registered in official repositories.
This software can be installed, in the latest versions directly at the command line.

**Raspberry Pi Imager** is part of this repository Ubuntu standard software.
We will install it with two command line instructions.

---

#### Update the Listings

We first update the `aptitude` package manager software listings from the official Ubuntu repository.
This allows the OS to fetch the correct files for software installation.

To update the listings, open a terminal window by pressing the `CTRL+ALT+T` keys on the keyboard.
Once at the command prompt, enter the following command and press enter:
```
sudo apt update
```

If you get errors, [set the computer time](https://github.com/paquettm/raspberry-pi-OS-setup/tree/main/clock) and then repeat the `sudo apt update` instruction.

---

#### The Install

With up-to-date software listings, we are ready to proceed with the install.
We will run the `aptitude` package manager to install the entire **Raspberry Pi Imager** software package with the following command:
```
sudo apt install rpi-imager
```
You should be asked to confirm whether or not you wish to proceed with the new installation; answer "Y" and press enter or just press enter.

---

## Creating the New SD Card

We now have the software to write to our SD Card storage medium.

### Start the Raspberry Pi Imager software.
If you are running this from Windows, you may search for the software at the bottom left of the screen.
If you are running this from Ubuntu Linux, you may type `rpi-imager` at the terminal window command prompt or click on the **Activities** button and search for the imager software.

---

### Choose Device
Raspberry Pi 4 or Raspberry Pi 5 depending on what you have.

### OS Choice
Click on **CHOOSE OS**.
Select **Rasperry Pi OS (64-bit)** as it is recommended.

### Choose storage
Click Choose Storage, enter you USB SD card writer in the USB port.
Select this new device from the list.
Click Next.

---

### Use OS Customisation
Click *Edit Settings*
**continue here**
### Hostname
Check the **Set hostname:** box and write a unique name for that hostname: **your last name followed by "-pi"**, e.g., I would call mine **paquette-pi**.
This is important to ease the network connection process, since conflicting names will cause issues down the line.

---

### SSH

SSH is a way to securly connect to devices over networks.

Check the **Enable SSH** box and ensure that the **Use password authentication** radio button is selected.

### Username and Password

Ensure that the **Set username and password** box is checked and enter your first name as the username and a password which you will not forget.

---

### Configure Wireless LAN

We will set up a temporary network to connect to the RPi devices.

Check the **Configure wireless LAN** box and write the SSID and password information provided for this network.
Note that Enterprise Wireless LANs are harder to join and the option to do so is not included in the Raspberry Pi Imager as far as this author knows.

---

### Locale Settings

Check the **Set locale settings** box to inform the RPi of the timezone and keyboard settings.
These settings should be **America/Toronto** and **us**, respectively.
Click **Save**.

---

### Storage

Connect your SD card to the host computer.
You may need a USB interface for this or your computer may have a dedicated SD card connector that may or may not require a size adapter.
Click **CHOOSE STORAGE**.
In the list, select the SD card that you connected to the host computer.
Do not select another disk because the next operation will be fatal to any data stored on the disk that will be imaged.

One way to ensure that you have selected the correct drive is to open the selection menu without th SD card connected to the system and then connect the SD card to the system, seleting this new device.

---

### Writing the Image

Click on **WRITE**.
Heed the warnings.
Proceed at your own risk.

---

## Validating the Configuration

Once your SD card has been written and verified by Raspberry Pi Imager, you may eject it from the PC and insert it into the unpowered RPi device.

---

### First Boot

**Note: When you boot up the RPi for the first time, the operating system goes through a setup phase and a reboot. Therefore, the initial boot time is significantly longer than the subsequent bootups will be.**

Connect the RPi to a compatible power supply and allow a few minutes (maybe 5) for it to boot up.

---

### Network Connection

If the RPi and the wireless network have been configured correctly, then it should be possible to find the device on the local network, by adding `.local` to the end of the hostname.

**Note: If the procedure has been followed and the hostname.local address does not find as indicated below, the router multicast DNS (mDNS) option (sometimes grouped under some other "multicast" title) may be disabled and it may be possible to correct this situation by turning on this type of feature.**

To find a device on a network, we use a computer that is connected to this network to **PING** the device.

---

### Pinging the RPi

Frist try pinging the RPi, using its hostname, for example:

```
ping hostname.local
```

If the device is found, try connecting to it using `ssh` with your user name and hostname as follows:

```
ssh user@hostname.local
```

If the device is found, accept the key and enter the password.

---

### Gadget Mode Connection

If network connections fail or a local WiFi network is unavailable, you may use gadget mode.

Follow the set up procedure outlined at [https://github.com/paquettm/raspberry-pi-OS-setup/blob/main/gadget_mode/README.md](https://github.com/paquettm/raspberry-pi-OS-setup/blob/main/gadget_mode/README.md)

To use gadget mode, you must connect the RPi to the computer as a device using a USB cable (data and power leads need to be functional) connected to the RPi power port.
Allow a few minutes for it to boot up.

If the connection via gadget mode is successful, then the above checks will provide positive results.

---

### VNC

If the Network Connection or the Gadget Mode Connection with the RPi has been successful, and you have connected to it via SSH, then you have access to the RPi command prompt.
We can do better and gain access to the RPi desktop.

VNC is an acronym for Virtual Network Computing. It is a screen-sharing system that enables users to remotely control another computer's desktop, including its keyboard and mouse input, using a network connection.

---

#### VNC Setup

1. To set up VNC on the RPi, open a terminal (CTRL-ALT-T) and run
```
sudo raspi-config
```

2. Enter your user account password if required.

3. Navigate to **Interface Options** and then **VNC** and select **Yes**.

4. Exit the raspi-config program.

5. In the unlikely case you must reboot, run `sudo reboot`.

---

### VNC Connection

To complete a VNC connection, you need to have a VNC client installed on your computer or a portable VNC client application.
You may download a portable VNC client from [https://www.realvnc.com/en/connect/download/viewer/](https://www.realvnc.com/en/connect/download/viewer/).

With the RPi connected as previously functional, connect your VNC client to `hostname.local`, accept any fingerprint or key and then enter your account information.

You should now have access to the graphical desktop.

Note: This graphical connection is very nice to have but by no means necessary to perform operations on the RPi.
In most cases, when coding or running Python, configuring Linux/Raspberry Pi Desktop, etc. you will be working from the command prompt, a.k.a. the terminal.
For this reason, the real requirement for accessing your RPi is the ability to SSH into your account.

---

## Explore

Explore the Raspberry Pi Desktop OS and compare it to the Ubuntu OS.

List 10 similarities between Raspberry Pi Desktop and Ubuntu.

List 10 differences between Raspberry Pi Desktop and Ubuntu.

Why do you think there are so many similarities?

---

## Break and the Python

Time to take a break.
Let the teacher know you are done.
We will discover Python after the break.

---