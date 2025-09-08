# Assignment 1: Working with GitHub

## Learning objectives

By the end of this assignment, you will be able to:

- Create a GitHub account and set up your profile
- Create a new repository on GitHub and add some files
- Clone the repository to your local machine using Git
- Modify the code on your local machine and commit the changes
- Push the changes back to GitHub and view them online

---

## Instructions

### Step 1: Create a GitHub account and set up your profile

If you have not created a personal GitHub account yet, follow the instructions below.
Otherwise, log into your existing account and move on to **Step 2**.

- Go to https://github.com/ and click on **Sign up**.
- Enter your email address, create your password, enter your username, answer their questions, and click on **Create account**.
- Verify your email address by entering the code sent to you by email.
- Answer more questions about your use of GitHub and click **Continue for Free**.
- Go to https://github.com/your-username (replace your-username with your actual username) and click **Edit profile** to enter your profile information, such as your name, bio, location, etc. You can also upload a profile picture if you want.

---

### Step 2: Create a new repository on GitHub

- Go to https://github.com/your-username (replace your-username with your actual username) and click the **Repositories** tab at the top. Click **New** at the right.

It is now time to enter the repository details: 
- Enter a name for your repository, such as "IoT_Assignment_1". Add a description of your repository, such as "420-302-VA IoT Assignment 1".
- Choose whether you want your repository to be public or private. Public repositories are visible to anyone on the internet, while private repositories are only accessible by you and people you invite as collaborators. Your assignments should be private to prevent plagiarism, but projects of which you are proud should be public. For this assignment, make your repository **private**.
- Check the box next to **Add a README file**. This will create a file named `README.md` in your repository, which you can use to describe your project and its features.
- Under the **Add .gitignore** heading, click the dropdown menu and select the template for **Python**. This will create a file named `.gitignore` in your repository, which you can use to specify which files should not be copied from your computer to your online GitHub repository. These files and any changes will effectively be ignored by the `Git` utility.
- Under the **Choose a license** heading, click the dropdown menu and select **GNU General Public License v3.0**. This will create a `LICENSE` file containing the text to your project's usage and distribution terms. The **GNU GPLv3** license lets people do almost anything they want with your project, except distributing closed source versions. You will want to select different licenses for different project purposes. This will be important for any PUBLIC repository.
- Click on **Create repository**.

You have now created your IoT Assignment 1 repository on GitHub. You can view it online by going to https://github.com/your-username/your-repository-name (replace your-username and your-repository-name with your actual values).

---

### Step 3: Adding Files from the Web Interface

To add more files to your repository, you can use the web interface or the command line interface. In this step, we will use the web interface.

Still on your Github Repository page, click on the **Add file** (or **+**) button and select **Create new file**.

The window will refresh with a thin section below the ribbon and a large editor input box.
The thin section will allow you to enter the new file name, next to the repository name (and any folder).
Enter a name for your file, such as "hello.py".

In the editor, write some Python code for a simple program, such as:
```python
print("Hello, world!")
```

- Scroll down to the bottom of the page and enter a message describing your changes, such as "Create hello.py".
- Click on **Commit new file**.

You have now added a new file to your repository! You can view it online by going to https://github.com/your-username/your-repository-name/blob/main/hello.py (replace your-username and your-repository-name with your actual values).

You can repeat this process to add more files to your repository.

---

### Step 4: Cloning the Repository to your Local Computer

To work on your code locally, you must copy the repository to your computer.
When we copy a repository, we say we **clone** the repository.
This is done from GitHub or any other source by using the Git utility.
Git is a version control system that lets you track changes to your files and collaborate with others.

**To clone the repository using Git, you must:**
- Have Git installed on your computer. If not, install Git on your machine. You can download it from [https://git-scm.com/downloads](https://git-scm.com/downloads) and follow the instructions for your operating system. For Raspberry Pi OS, follow the instructions from [https://github.com/paquettm/raspberry-pi-OS-setup/blob/main/github/README.md](https://github.com/paquettm/raspberry-pi-OS-setup/blob/main/github/README.md).
- Open a terminal such as Command Prompt on Windows. (Click Start, type "cmd", click on "Command Prompt") and navigate to the folder where you want to store your local copy of the repository with OS instructions. For example, in Windows, type the following commands at the command prompt to go to your user profile home folder:
```bash
c:
cd %USERPROFILE%
```
This should bring you to the home folder for the user who is logged in.
Now you may move to the Documents folder to work from there:
```bash
cd Documents
```

Now, find the address for your GitHub repository by navigating to your GitHub profile, clicking **Repositories** and then clicking the correct repository.
Click the green **Code** button and copy the URL with the format `https://github.com/your-username/your-repository-name.git`.

Back in the command line, type
```bash
git clone https://github.com/your-username/your-repository-name.git
```
(Use the actual repository URL that you copied. Often, pasting id done with CTRL-SHIFT-V or by selecting **Paste** from the **Edit** menu of the command line window.)

This will create a folder named after your repository name in the current folder, and download all the files from GitHub into it.
Navigate to this folder with the cd command
```
cd your-repository-name
```
where `your-repository-name` is the correct folder name.
To figure out the correct folder name, you may use `dir` in Windows and `ls` in Linux/Ubuntu/Raspberry Pi OS.

---

### Step 5: Modify Code and Commit Changes

**In this step, we must work with files that already exist in the repository folder.**

We will use an editor such as 
- nano on Ubuntu or on Raspberry Pi OS
- Notepad on Windows
to modify our code.

To make things much more exciting, use Thonny to open and modify your file.
Refer to the [Extra Fun](#extra-fun) section for installation instructions.

Modify the file hello.py by adding a comment line such as
```
#hello world program for Python3
```
You have now modified the code.

You are ready to commit and push your changes to GitHub.

To commit the changes to Git, go back to your terminal window and make sure that you are in the folder where you cloned the repository.

If you closed the terminal window, follow the instructions as above to reopen it and navigate back to it using only the cd commands.
For example, in Windows:

```bash
cd C:\Users\your-name\Documents\your-repository-name
```
(replace your-name and your-repository-name with your actual values)

For example, in Ubuntu:
```bash
cd your-repository-name
```

In any environment, to change to the parent folder, type
```bash
cd ..
```

Now that you are in your repository folder, type the following command:
```bash
git status
```

This will show you which files have been modified, added or deleted.

To stage all the changes for commit, type
```bash
git add .
```

Alternatively, you can specify an individual file to stage, as follows:
```bash
git add hello.py
```

To commit the changes with a message describing them, type 
```bash
git commit -m "Your message"
```
For example, 
```bash
git commit -m "Modify hello.py"
```

You have now committed the changes to your **LOCAL** Git repository. You can view them by typing:
```bash
git log
```

This will show you a history of all the commits made to the repository.
**But your commited changes have not yet been published to your online GitHub repository...**

---

### Step 6: Push Changes to the Remote Repository (GitHub)

To push the changes back to GitHub, type
```bash
git push origin main
```
or simply
```bash
git push
```

This will push the changes from your local branch (main) to your remote branch (origin) on GitHub.

You have now pushed the changes back to GitHub! You can view them online by going to https://github.com/your-username/your-repository-name (replace your-username and your-repository-name with your actual values).

---

### Step 7: Reflection log

The goal of reflection logging is for you to gain perspective on your learning process through your experiences, so you can see what you must do to improve youself.

For this assignment, write your reflection log files directly from the Web document editor in your GitHub account.

Think about this assignment as well as labs 1 and 2.
Specifically, think about the experience and, in separate files for each of the 3 activities above, write a few short sentences stating
- what you have learned,
- what you found difficult to understand,
- what you found easy to understand and what you think may have made this easy for you,
- what you believe you need to improve,
- what the teacher could have said or done to make learning easier,
- what you could have done to make the learning easier, and
- other reflections that you find relevant to your personal development.

For each activity, list the specific Linux/Git/Python commands learned and write what you think they accomplish.

Now that you are done writing these files in the Web interface, go back to the command line interface, in the local repository folder and run
```
git pull
```

What happened?

Update the Assignment 1 reflection log to explain your understanding and push the changes.

---

## Submitting the Assignment

For this private repository to be visible to anyone, you must invite them as a collaborator. To accomplish this for your teacher, whose username is **paquettm**, in your GitHub repository, at https://github.com/your-username/your-repository-name/blob/main/hello.py (replace your-username and your-repository-name with your actual values),  
- Click **Settings**
- Click **Collaborators**
- Click **Add people**
- In the text input, enter **paquettm**
- Click on that user in the listing
- Click **Add paquettm to this repository**

The submission deadline is Friday, September 12, before midnight (end of day).

---

## Extra fun

You will want to be able to work from home and therefore should install Python and an appropriate Python Integrated Development Environment (IDE) on your homework laptop/PC.

---

### Installing Python

#### Downloading the Installer

Open your favorite browser and go to `https://www.python.org/downloads/`.

Assuming you are working with Windows as your OS, you will see a title **Download the latest version for Windows** and a button below "Download Python 3.13.7" (or possibly a greater version number).
Click this button to download the installer program.

---

#### Running the Installer

Find the downloaded file, probably in your **Downloads** folder and execute it (double-click it).

Click on the large clickable label containing the text "Install Now". Waite a few moments for the software to install.

If the label appears with "Disable path length limit", click it. Accept the changes by clicking Yes.

Python is installed. Close the dialog.

---

#### Completing the Setup for CLI

We tell the command line environment to look for the executable files located in the Python installation folders my modifying the path environment variable as follows:

- Search for "environment" and click on "Edit the system environment variables".
- Click "Environment variables..." at the bottom of the dialog you just opened.
- Select the variable named "Path" and click "Edit..."
- Click "New" and enter `%USERPROFILE%\AppData\Local\Programs\Python\Python313`. Press Enter.
- Select your new entry and click "Move up" until it is the first entry.
- Click "New" and enter "%USERPROFILE%\AppData\Local\Programs\Python\Python313\Scripts". Press Enter
- Select your new entry and click "Move up" until it is the first entry.

---

### Install the Thonny IDE

Let's use `pip` the Python pachage manager to install Thonny, a popular Python IDE.
First, open the Windows CLI by searching for "cmd" and clicking "Command Prompt".
Then enter the following command, followed by pressing the ENTER key:
```
pip install thonny
```

To run Thonny, run the following command in the same command line interface:
```
thonny
```

Click "Let's go!"

