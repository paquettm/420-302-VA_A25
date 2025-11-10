# Lab 10: Access Control for Python Flask IoT Dashboard

## Introduction

In this lab, you’ll learn to **secure your Flask web application** so that only authorized users can access the MQTT visualization dashboard and IoT controller configuration. You’ll implement a **user login system** using Flask extensions, and you'll learn the best practice of password hashing (storing encrypted versions of passwords instead of plain text).

By the end of this lab, your website will:
- Require users to log in before they can see or modify sensitive pages.
- Prevent unauthorized access to your data and IoT settings.
- Safely check passwords using cryptographic hashes.

***

## Why Access Control?

- **Security:** Prevent random people (or attackers) from viewing or controlling your IoT systems.
- **Accountability:** You know *who* changed a setting.
- **Best Practice:** Every professional web app protects sensitive data and functionality.

***

## Dependencies

You'll need to install two Python libraries:
```bash
pip install flask-login werkzeug
```
- `flask-login` provides all logic for login sessions.
- `werkzeug` gives you easy and secure password hashing.

***

## Step 1: Add User Authentication to Flask

First, update your main app (let’s call it `app.py`) to support authentication.

### Flask Setup and Imports

Add or update these imports at the top of your Python file:

```python
from flask import Flask, render_template, request, redirect, url_for, flash
import sqlite3
import plotly.graph_objs as go
import plotly.offline as pyo
from datetime import datetime
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
```

#### Explanation:

- **`flask_login` functions** help manage user sessions.  
- **`UserMixin`** is a helper class to store user info.
- **`werkzeug.security`** provides password hashing (`generate_password_hash`) and verification (`check_password_hash`).

***

### Users Dictionary - Now with Protected Passwords

Replace your old in-memory user dict with hashed passwords.

```python
# Generate a hashed password ONCE in your shell like this:
# >>> from werkzeug.security import generate_password_hash
# >>> generate_password_hash('YourPassword')
# Copy-paste the resulting hash here for your user

users = {
    "admin": generate_password_hash("12345")
}
```

**Never store plain passwords!**  
If you want to add more users, add more keys with their hashes.

***

### Setup the Flask Application and Secret Key

Add this to the top-level area of your code:

```python
app = Flask(__name__)
app.secret_key = "change_this_to_a_random_secret"  # Required for session security
```

***

### Configure Flask-Login

Add this right after you create your Flask app:

```python
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
```

#### Explanation:
- **`LoginManager`** keeps track of login state.
- **`login_view = "login"`** sets the name of the login route (used to redirect users).

***

### Python User Model

Add:

```python
class User(UserMixin):
    def __init__(self, username):
        self.id = username
```

#### Explanation:
- Gets used by Flask-Login to keep things simple—all it needs is a unique `.id`.

***

### Flask User Loader

Add:

```python
@login_manager.user_loader
def load_user(username):
    if username in users:
        return User(username)
    return None
```

#### Explanation:
- When Flask-Login needs to know who the current user is (from the session cookie), it calls this function.

***

## Step 2: Add Login and Logout Routes

### Login Route

```python
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':  # Form submission
        username = request.form.get('username')
        password = request.form.get('password')
        if username in users and check_password_hash(users[username], password):
            user = User(username)
            login_user(user)
            flash("Logged in successfully.", "success")
            next_page = request.args.get('next')
            return redirect(next_page or url_for('plot_data'))
        else:
            flash("Invalid username or password.", "danger")
    return render_template('login.html')
```

#### Explanation:
- **If the method is `POST`** (the user submitted the form), fetch the username and password.
- **Password is checked using `check_password_hash`**. This prevents attackers from knowing the actual password if the database is stolen.
- If successful, `login_user(user)` logs in that user.
- After logging in, the user is **redirected to their intended page**(otherwise, the main dashboard).
- **Flashing messages:** show brief feedback after logging in or on error.
- If the form is not submitted, the login page is shown.

***

### Logout Route

```python
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))
```

#### Explanation:
- `@login_required` ensures only logged-in users can log out (makes sense!).
- `logout_user()` removes them from the session, and they're redirected to the login page.

***

## Step 3: Protect Your Application Routes

Find your dashboard and configuration routes. Add the `@login_required` decorator to **any page you want to protect**:

```python
@app.route('/')
@login_required
def plot_data():
    # ... existing dashboard code ...
```

**Do this for any route with sensitive data or configuration, e.g.:**

```python
@app.route('/rules')
@login_required
def list_rules():
    # ... show rules ...

@app.route('/rules/new', methods=['GET', 'POST'])
@login_required
def create_rule():
    # ... add new rule ...
```

**Unprotected routes:**  
- The `/login` route (of course—you want to let anyone reach it).

***

## Step 4: Create a Login Form Template

Create `templates/login.html` if it does not exist already:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Login</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='styles.css') }}">
</head>
<body>
    <div class="container">
        <h1>Login</h1>
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ category }}">{{ message }}</div>
                {% endfor %}
            {% endif %}
        {% endwith %}
        <form method="POST">
            <label>Username:<input type="text" name="username" required /></label><br />
            <label>Password:<input type="password" name="password" required /></label><br />
            <input type="submit" value="Login" />
        </form>
    </div>
</body>
</html>
```

### Explanation:
- Loads the external stylesheet.
- Displays any flash messages.
- Presents a simple login form.
- The form automatically posts (submits) to the same URL.

***

## Step 5: Add "Logout" to Your UI

In your `base.html` or navigation area (visible on each page), make it easy to log out:

```html
<nav>
    <ul>
        <li><a href="{{ url_for('plot_data') }}">Dashboard</a></li>
        <li><a href="{{ url_for('list_rules') }}">Manage Rules</a></li>
        {% if current_user.is_authenticated %}
            <li><a href="{{ url_for('logout') }}">Logout</a></li>
        {% endif %}
    </ul>
</nav>
```

### Explanation:
- **`current_user.is_authenticated`** is a Flask-Login attribute.
- Ensures the "Logout" link only shows for logged-in users.

***

## Step 6: Test Your Application

1. **Log out:** Try to visit your dashboard or `/rules` while logged out—you should be redirected to `/login`.
2. **Log in:** The dashboard and rule pages are now accessible.
3. **Password security:** Open your code and look at the `users` dictionary. Notice that the password is hashed (looks like gibberish, not a plain word).
4. **Try a wrong password:** You should get an "Invalid username or password" warning.
5. **Log out via the menu:** You’re sent to the login page.

***

## Additional Notes on Password Hashing

**Hashing** is a one-way function: it’s easy to check if a password matches, but impossible to get the original password from the hash.  
By using `generate_password_hash(password)`, you store only the hash.  
During login, `check_password_hash(hashed_value, password_attempt)` tells you if the password is correct, without revealing what the original password is.

**Never store raw passwords** in files or databases!

***

## Security Summary

By following this lab, you have:
- Ensured that **only authorized users** have access to data and controls.
- **Protected passwords** by not storing them directly.
- Used an industry standard extension (`flask-login`).
- Supported an expandable user system (for future improvement).
- Met a fundamental professional practice in web development.

***

## Future implementation

- Store users and password hashes in a database instead of in code.
- Allow new user registration.
- Require strong passwords.
- Allow password change and recovery.
- Track failed login attempts to block attackers.
