# Installing Thonny on the Raspberry Pi

Thonny is a great little editor for Python that supports Python, MicroPython, as well as virtual environments.
Thonny has its own package manager that can `pip install` packages in your environment(s).

However if you previously installed Thonny with the aptitude package manager in the Raspberry Pi OS, you may have gotten a slightly older version with some bugs in the package manager.

So, the following steps can be followed to replace this with the newest bug-free version (as of October 15, 2025)

If you had previously installed Thonny, you may uninstall it via
```bash
sudo apt remove thonny
```
or
```bash
pip remove thonny
```

To install the latest version, do not use apt or pip. Instead, get the installer from the source as follows, at the bash terminal:
```bash
bash <(wget -O - https://thonny.org/installer-for-linux)
```

Thonny should be installed and accessible from the GUI.
To make it runnable from the command prompt, you may also add it to the path as follows:
```bash
echo 'export PATH="$PATH:$HOME/apps/thonny/bin"' >> ~/.bashrc
source ~/.bashrc
```

Confirm the functionality by running thonny from the command line as follows:
```bash
thonny
```
