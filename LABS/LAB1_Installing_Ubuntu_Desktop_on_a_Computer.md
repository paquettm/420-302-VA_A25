# Lab 1 :  Installing Ubuntu Desktop on a Computer

**All material provided by your teacher for this lab must be returned at the end of the class period.**

## Introduction

A computer operating system (OS) is a fundamental software component that manages a computer's hardware and software resources, acting as an intermediary between users, applications, and the computer hardware.

Computer hardware does not always come with a pre-installed OS, and when it does, this is probably some version of Windows.
To install a new Operating System (OS) on a computer, installation media is always required.

In the past we would purchase our copy of Windows at some store and unpack the diskette/CD/DVD installation media at home before booting directly from it and following the user guide and installation steps.

With the advent of **The Web**, physical copies of software have slowly disappeared.
However, installation medium is still required in the process of installing a computer OS.
So we create bootable OS installation medium by downloading and writing **images** onto USB flash drives.
(Sadly we can't just direct our blank computer to the URL of of a cool new OS to get it installed. But that would be nice...)

The process of writing large images onto USB flash drives is time consuming and requires a functional computer (with an operational OS).
Therefore, the bootable USB flash drives will have been created ahead of time as a starting point for this laboratory.

## Laboratory description

Today, our task is to install the Ubuntu distribution of Linux on computers that have no operating system.

We will be following the [Ubuntu Desktop installation tutorial](https://ubuntu.com/tutorials/install-ubuntu-desktop) from the official Ubuntu Website.
It is summarized below with some additional instructions.

### What you'll learn

In this tutorial, we will guide you through the steps required to install Ubuntu Desktop on your laptop or PC.
By the end of the tutorial you will have installed a popular Operating System on an external/removable SSD. 

### What you'll need

- A laptop or PC with at least 25GB of storage space would normally be required for the steps involved in creating the installation medium.
- A target computer for the new OS: You are provided with a D-221 computer with no hard drive as well as an external SSD and adapter to connect the SSD to the computer.
- A flash drive, 12GB or above recommended: You are provided with a 64GB flash drive, preloaded with the Ubuntu OS image.

If you are installing Ubuntu on a PC or laptop you have used previously, it is always recommended to back up your data prior to installation.

### Step 1: Download Ubuntu (Completed, but read this)

First, you would need to download Ubuntu on a functional computer. You can download Ubuntu Desktop from the [official Ubuntu website](https://ubuntu.com/download/desktop).

### Step 2: Create a bootable USB stick (Completed, but read this)

To install Ubuntu, you would need to create a bootable USB stick. There are different tools available for this depending on your current operating system:

- For Windows: Use [Rufus](https://rufus.ie/en/)
- For Ubuntu: Use the Startup Disk Creator
- For macOS and any other Linux distribution: Use [Balena Etcher](https://etcher.balena.io/)

### Step 3: Computer connection setup

First, ensure that your SSD is connected to its adapter and that both the eSata and USB ports are connected to the computer ports.
Also, check that the power cable, mouse, keyboard, and monitor are all connected to the computer.
Insert the USB flash drive into your computer and power it up (or restart it).

### Step 4: Boot from USB flash drive

**Don't press the power button just yet!**

Computers could automatically boot from the USB drive, but chances are yours won't.
To boot from USB, you must press a key during startup to access the boot menu and select the correct boot device in your computer's BIOS settings.
For my computer, I press the "DEL" or "delete" key during bootup; for Dell computers, the key is usually *F2* or *F12*.
You may determine the correct key for your computerusing [this resource](https://www.tomshardware.com/reviews/bios-keys-to-access-your-firmware,5732.html).

So, power up the machine and keep pressing that button until you see the boot menu.
Select the Verbatim USB flash drive and select the action to start boot.

### Step 5: Boot options

If your computer boots from the USB drive, you should see a welcome menu with a few options.
Select **Try or Install Ubuntu** with the up and down arrows and then press the *Enter* key.
The computer will boot up using the USB drive to a live version of the Ubuntu OS.
This will take a while... please be patient.

### Step 6: Try or Install Ubuntu

Once the computer boots up, the Ubuntu installer will start right away.
You will be met with the *Welcome to Ubuntu* dialog window allowing you to select your language.
This tutorial uses English, so may as well pick *English* and click *Next*.

Customize any accessibility features you need and click *Next*.

Select the *English (US)* keyboard for this lab, and click *Next*.

In the *Connect to the internet* screen, the *Use wired connection* should be selected if your computer is connected to an ethernet cable.
In our lab, the ethernet cable should connect the computer ethernet port to the nearest port labeled *210A*.
Click *Next*.

If the *An update is available for the installer* screen shows you will have the option to upgrade the installer before proceeding to the installation.
Otherwise, or if you decide to skip an update, you will be presented with the options to *Install Ubuntu* or *Try Ubuntu*.

At this point, you may decide to try Ubuntu before installing it.

For the purposes of this tutorial, if presented with the update screen, we will click *Update now* and then click *Close Installer* then double-click the icon similar to *Install Ubuntu 24.04 LTS* on the screen and start again from the beginning of *Step 5: Installing Ubuntu*.

### Step 7: Installing Ubuntu

You will be presented with the *Type of installation* dialog.
Select *Interactive installation* option and click *Next*.

In the *Applications* dialog, you get to choose which software to install.
Choose *Default selection* and click *Next*.

In the *Optimise your computer* dialog, do not select any checkbox and click *Next*.

In the *Disk setup* dialog, make sure that the *Erase disk and install Ubuntu* option is selected and click *Next*.
If the *Erase disk...* option is absent, check your SSD eSata and USB connections, shut down and start over.

### Step 8: Create a user account

**IMPORTANT: Replace # by the number on your SSD in the instructions below**

For example, if you have the SSD labeled **42**, then
- Your name: *student42*
- Your computer's name: *computer42*
- Username: *student42*
- Password: *password42*

Read the above instructions again and make sure that you understand it.

At this step, you would normally to enter your name, your computer's name, pick a username, and choose a strong password.
However, because we need these computers and OSs to be usable by any student, you will use the following information:
- Your name: *student#*
- Your computer's name: *computer#*
- Username: *student#*
- Password: *password#*

**IMPORTANT: Replace # by the number on your SSD in the instructions below**

You will see the warning that this is a weak password; don't mind it.

**Remove** the *Require my password to log in* option selected and click *Next*.

### Step 9: Select your time zone

By default, the *America/Toronto* timezone should be selected is you are in Canada and in the same timezone.
This is good enough, click *Next*.

### Step 10: Ready to install

You will be presented with the *Ready to install* dialog presenting a recap of your choices.
Verify that your installation disk brand matches the brand and model of your SSD before clicking *Install*.

The installation process will begin and will possibly take a long time.

This should be enough time to talk to your classmates and form a 2-person team to complete most of your assignments and your upcoming term project.

### Step 11: Restart your computer

Once the installation is complete, you'll be prompted by the *Installation complete* dialog to restart your computer.
Click *Restart now*.

The screen will turn dark and go to the Ubuntu logoff screen, eventually asking you to remove the installation medium.
Remove the USB flash drive from the USB port and press Enter.

### Step 12: Ubuntu started

Upon bootup, you should see the computer has restarted and that you are automatically logged into your computer.
You will see the *Welcome to Ubuntu 24.04 LTS!* screen.
Click *Next*.
...Just click *Next* at all following dialogs to preserve all defaults.

## Conclusion

To make sure that you set everything up correctly, ask the teacher to check your installation. 

The teacher will open a terminal and type in the following command:

```
sudo hostname
```

In response, the system will require the password for *student42* if your disk number is 42.
This password should be *password42* and then the output of the function `hostname` should be *computer42*, the name of your computer.

If these items are incorrect, you will be able to fix them as follows:

- The `passwd` command allows you to change the password of the current account.
- The `sudo hostnamectl set-hostname computer#` command (change # to your drive number) allows you to change the computer name.
- The account username can be changed by starting over and not getting it wrong. It could also be changed through a very complicated process that requires more time and effort at this point.

This was fun.
Now, we have workstations ready to allow us to [set up our Raspberry Pi SBCs](LAB2_Raspberry_Pi_OS_SD_Card_Preparation.md).

Sources:
[1] https://ubuntu.com/tutorials/install-ubuntu-desktop
