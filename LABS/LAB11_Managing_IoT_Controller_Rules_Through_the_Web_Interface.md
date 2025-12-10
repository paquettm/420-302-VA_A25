---
title: 'Lab 11: Managing IoT Controller Rules Through the Web Interface'
description: 'Lab 11: Managing IoT Controller Rules Through the Web Interface'
sidebar:
  label: 'Lab 11: Managing IoT Controller Rules Through the Web Interface'
  order: 11
---

# Lab 11: Managing IoT Controller Rules Through the Web Interface

## Introduction

In this lab, we extend our secure Flask application by adding a **rules management system**.
This will allow authorized users, through a web interface, to **create, view, edit (update), and delete** automation rules used by the IoT Controller, without manually editing the `rules.json` file.

You will implement functions, routes, and templates allowing users to:
- View all existing automation rules in a user-friendly format
- Create new rules with multiple conditions (AND logic)
- Edit (update) existing rules
- Delete rules that are no longer needed

Hopefully, you will understand how the above works as well as understand how web forms can interact with JSON files.

***

## What You'll Build

Your application will have these new pages:

1. **Rules Dashboard** (`/rules`) - View all automation rules
2. **Add New Rule** (`/rules/new`) - Create a new rule
3. **Edit Rule** (`/rules/edit/<id>`) - Modify an existing rule
4. **Delete Rule** (`/rules/delete/<id>`) - Remove a rule with confirmation

***

## Step 1: Helper Functions

Programs are best written with tasks written in functions.
For example, when if you made a peanut butter and jelly sandwich, in Python, you may proceed as follows:
```python
slice1 = Bread.getSlice()
slice2 = Bread.getSlice()
slice1.spread(["peanut butter"])
slice2.spread(["jelly"])
sandwich = slice1.assembleWith(slice2) 
```
Also, you may make a turkey-veggie sandwich as follows:
```python
slice1 = Bread.getSlice()
slice2 = Bread.getSlice()
slice1.spread(["mayonnaise","turkey"])
slice2.spread(["mayonnaise","tomato","lettuce"])
sandwich = slice1.assembleWith(slice2) 
```

But you could define a function to make a sandwich as follows:
```python
def makeSandwich(spread1,spread2):
    slice1 = Bread.getSlice()
    slice2 = Bread.getSlice()
    slice1.spread(spread1)
    slice2.spread(spread2)
    sandwich = slice1.assembleWith(slice2)
    return sandwich
```

Then, making your sandwiches would be simpler, as follows:
```python
PBJ = makeSandwich(["peanut butter"],["jelly"])
Turkey_Veggie = makeSandwich(["mayonnaise","turkey"],["mayonnaise","tomato","lettuce"])
```

This is the process of abstraction, where you effectively code functions to **teach your program new tricks**.

Helper functions are functions that get used to complete certain tasks needed in your programs.
We will add a few helper functions that will get called by others to help complete bigger tasks.

### Add Helper Functions for Rules Management

Add these functions to your `app.py` file, **before your routes**:

```python
RULES_FILE = 'rules.json'

def load_rules():
    """Load rules from the JSON file"""
    if not os.path.exists(RULES_FILE):
        return []
    try:
        with open(RULES_FILE, 'r') as file:
            return json.load(file)
    except json.JSONDecodeError:
        return []
    except Exception as e:
        print(f"Error loading rules: {e}")
        return []
```

#### Explanation:
- **`os.path.exists(RULES_FILE)`** checks if the file exists before trying to open it.
- **`json.load(file)`** reads the JSON file and converts it to a Python list.
- **`json.JSONDecodeError`** catches errors if the JSON file is corrupted.
- **Returns an empty list `[]`** if there's any problem, so the app doesn't crash.

#### Question:
If all goes well, what should this function return?

***

```python
def save_rules(rules):
    """Save rules to the JSON file"""
    try:
        with open(RULES_FILE, 'w') as file:
            json.dump(rules, file, indent=2)
        return True
    except Exception as e:
        print(f"Error saving rules: {e}")
        return False
```

#### Explanation:
- **`json.dump(rules, file, indent=2)`** writes the Python list back to the file as formatted JSON.
- **`indent=2`** makes the JSON file human-readable (adds spacing and newlines).
- Returns `True` if successful, `False` if there's an error.

#### Questions:
- What exactly gets written back to the RULES_FILE?
- Why does it make sense to use the `json` module to do this?

***

```python
def convert_value(value_string):
    """Convert a string to a number if possible, otherwise keep as string"""
    try:
        # Try to convert to float first
        value = float(value_string)
        # If it's a whole number, convert to int
        if value.is_integer():
            return int(value)
        return value
    except ValueError:
        # It's not a number, return as string
        return value_string
```

#### Explanation:
- This function handles the fact that IoT sensors send both **numbers** (temperature: 25.5) and **text** (status: "on").
- **Tries to convert to `float`** first.
- **If it's a whole number** (like 30.0), converts to `int` (30).
- **If conversion fails**, keeps it as a string.
- This ensures `rules.json` stores values in the correct format.

This helper function may have code that looks familiar, from the `IoT_Controller` program.
You may be interested in making a similar helper function for that other program and then substitute the code in the function using it with a call to the helper function.

***

In the steps that follow, we will implement rule management mechanisms by adding routes, aassociated functions, and templates.

## Step 2: View All Rules

Here is how the process of viewing all rules will go:
```
Flask loads all rules from rules.json → 
Passes to template → Template will display all rules
```

Add this route to display all rules:

```python
@app.route('/rules')
@login_required
def list_rules():
    """Display all automation rules"""
    rules = load_rules()
    return render_template('rules_list.html', rules=rules)
```

### Explanation:
- **`@login_required`** ensures only logged-in users can see rules.
- **`load_rules()`** gets the current rules from `rules.json`.
- **`render_template()`** passes the rules to the HTML template for display.

### Create the Rules List Template

Templates handle the presentation side of the Human-Computer Interface, i.e., they define how the controls and data look.
Sometimes, this means that they will have more complex presentation logic to handle more complex data.

In our system, the `rules.json` file contains a list of rules that each contain a list of conditions as well as one action.
So we should expect to need 2 levels of `for` loops in such a template, with one `for` loop inside the other.

Create `templates/rules_list.html`:

```html
{% extends "base.html" %}

{% block title %}Manage Rules{% endblock %}

{% block content %}
    <h1>IoT Controller Rules</h1>
    
    <p>These rules run automatically when the conditions are met. The IoT Controller checks them continuously.</p>
    
    <div class="text-center mb-20">
        <a href="{{ url_for('create_rule') }}" class="btn btn-success">+ Create New Rule</a>
    </div>
    
    {% if rules %}
        {% for rule in rules %}
        <div class="rule-card">
            <h2>Rule #{{ loop.index }}</h2>
            
            <div class="rule-logic">
                <div class="logic-label">IF all of these conditions are true:</div>
                
                {% for condition in rule.conditions %}
                <div class="condition">
                    <span class="condition-topic">{{ condition.topic }}</span>
                    <span class="operator">{{ condition.comparison }}</span>
                    <span class="condition-value">{{ condition.value }}</span>
                    {% if not loop.last %}
                        <strong class="and-label">AND</strong>
                    {% endif %}
                </div>
                {% endfor %}
                
                <div class="action">
                    <div class="logic-label">THEN Execute Action:</div>
                    <div><strong>Message:</strong> {{ rule.action.message }}</div>
                    <div><strong>Publish to:</strong> <code>{{ rule.action.topic }}</code> with value <code>{{ rule.action.value }}</code></div>
                </div>
            </div>
            
            <div class="action-buttons">
                <a href="{{ url_for('edit_rule', rule_id=loop.index0) }}" class="btn btn-primary">Edit</a>
                <a href="{{ url_for('delete_rule', rule_id=loop.index0) }}" class="btn btn-danger">Delete</a>
            </div>
        </div>
        {% endfor %}
    {% else %}
        <div class="empty-state">
            <p>No rules configured yet.</p>
            <p>Create your first rule to start automating your IoT system.</p>
            <a href="{{ url_for('create_rule') }}" class="btn btn-success">Create First Rule</a>
        </div>
    {% endif %}
{% endblock %}
```

#### Questions:

- Which function calls this template? Hint: It calls it in its `render_template` function.
- What type of data does get sent to this template? This will help you understand the explanations that follow.
- Knowing the type of data passed into the template

#### Explanation:

**Jinja2 Template Features:**

1. **`{% extends "base.html" %}`** - Uses the base template (navigation, CSS, etc.)

2. **`{% block content %}`** - Fills in the content area defined in base.html

3. **`{% for rule in rules %}`** - Loops through each rule in the list

4. **`loop.index`** - Jinja2 automatic variable (starts at 1)
   - `loop.index0` starts at 0 (used for array indices)

5. **`{% if not loop.last %}`** - Only shows "AND" between conditions, not after the last one

6. **`{% else %}`** - Shows "No rules" message if the list is empty

7. **`{{ url_for('edit_rule', rule_id=loop.index0) }}`** - Generates URLs dynamically
   - Creates `/rules/edit/0`, `/rules/edit/1`, etc.

**HTML Structure:**
- Each rule is in a `.rule-card` div for styling
- Conditions are displayed in `.condition` divs
- Action is in a separate `.action` div
- Edit and Delete buttons at the bottom

***

## Step 3: Create New Rule

Here is how the process of creating a rule will go:
```
User fills form → Browser POSTs data → Flask receives arrays → 
Python builds rule dictionary from reading rules.json → Adds to rules list → Saves back to rules.json → Redirects to rules list
```

```python
@app.route('/rules/new', methods=['GET', 'POST'])
@login_required
def create_rule():
    """Create a new automation rule"""
    if request.method == 'POST':
        # Get condition data from form arrays
        topics = request.form.getlist('condition_topic[]')
        comparisons = request.form.getlist('condition_comparison[]')
        values = request.form.getlist('condition_value[]')
        
        # Build conditions list
        conditions = []
        for topic, comparison, value in zip(topics, comparisons, values):
            conditions.append({
                'topic': topic.strip(),
                'comparison': comparison,
                'value': convert_value(value.strip())
            })
        
        # Get action data
        action = {
            'message': request.form['action_message'].strip(),
            'topic': request.form['action_topic'].strip(),
            'value': request.form['action_value'].strip()
        }
        
        # Create the new rule
        new_rule = {
            'conditions': conditions,
            'action': action
        }
        
        # Add to rules and save
        rules = load_rules()
        rules.append(new_rule)
        
        if save_rules(rules):
            flash('Rule created successfully!', 'success')
        else:
            flash('Error saving rule.', 'danger')
        
        return redirect(url_for('list_rules'))
    
    # GET request - show the form
    return render_template('rule_form.html', edit_mode=False, rule=None)
```

### Explanation:

**When the user submits the form (POST):**

1. **`request.form.getlist('condition_topic[]')`** gets ALL values with that name (because we can have multiple conditions).
   - Returns a list like: `['house/temp', 'house/humidity']`
   - In HTML Web forms, we can give multiple items of the same category the same name and get all their data sent back to the application as a list.

2. **`zip(topics, comparisons, values)`** combines three lists element-by-element:
   ```python
   topics = ['house/temp', 'house/humidity']
   comparisons = ['>', '>']
   values = ['30', '70']
   # zip creates: [('house/temp', '>', '30'), ('house/humidity', '>', '70')]
   ```

3. **`.strip()`** removes extra spaces from user input. This is important in the context of Web input prone to human error.

4. **`convert_value()`** ensures numeric values are stored as numbers... this is a call to a previously-defined helper function.

5. **`rules.append(new_rule)`** adds the new rule to the end of the list.

6. **`flash()`** shows a success or error message to the user.

**When the user first visits the page (GET):**
- Shows an empty form by passing `rule=None`.

***

### Create the Rule Form Template

The rule form will be used **in the context of creating new rules and in the context of editing existing rules**.
In the former situation, no rule will be passed to the template and in the latter, the rule to edit will be passed to the template, allowing the user to see what they are editing. 

Create `templates/rule_form.html`:

```html
{% extends "base.html" %}

{% block title %}{{ 'Edit' if edit_mode else 'Create' }} Rule{% endblock %}

{% block content %}
    <h1>{{ 'Edit' if edit_mode else 'Create New' }} Automation Rule</h1>
    
    <form method="POST" id="ruleForm">
        <h2>Conditions (ALL must be true)</h2>
        <p class="help-text">
            The action will only execute when <strong>ALL</strong> conditions below are satisfied at the same time.
        </p>
        
        <div id="conditions-container">
            {% if rule and rule.conditions %}
                {% for condition in rule.conditions %}
                <div class="condition-group">
                    <div class="condition-header">Condition {{ loop.index }}</div>
                    
                    <div class="form-group">
                        <label>MQTT Topic:</label>
                        <input type="text" name="condition_topic[]" value="{{ condition.topic }}" 
                               placeholder="e.g., house/temperature" required>
                        <small>The topic to monitor (e.g., house/temperature)</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Comparison Operator:</label>
                        <select name="condition_comparison[]" required>
                            <option value=">" {% if condition.comparison == '>' %}selected{% endif %}>&gt; (greater than)</option>
                            <option value=">=" {% if condition.comparison == '>=' %}selected{% endif %}>&gt;= (greater or equal)</option>
                            <option value="<" {% if condition.comparison == '<' %}selected{% endif %}>&lt; (less than)</option>
                            <option value="<=" {% if condition.comparison == '<=' %}selected{% endif %}>&lt;= (less or equal)</option>
                            <option value="==" {% if condition.comparison == '==' %}selected{% endif %}== (equal to)</option>
                            <option value="!=" {% if condition.comparison == '!=' %}selected{% endif %}!= (not equal to)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Value:</label>
                        <input type="text" name="condition_value[]" value="{{ condition.value }}" 
                               placeholder="e.g., 30" required>
                        <small>The value to compare against (number or text)</small>
                    </div>
                    
                    {% if loop.index > 1 %}
                    <button type="button" class="btn btn-danger btn-sm remove-btn" 
                            onclick="removeCondition(this)">Remove Condition</button>
                    {% endif %}
                </div>
                {% endfor %}
            {% else %}
                <!-- Default first condition for new rules -->
                <div class="condition-group">
                    <div class="condition-header">Condition 1</div>
                    
                    <div class="form-group">
                        <label>MQTT Topic:</label>
                        <input type="text" name="condition_topic[]" placeholder="e.g., house/temperature" required>
                        <small>The topic to monitor</small>
                    </div>
                    
                    <div class="form-group">
                        <label>Comparison Operator:</label>
                        <select name="condition_comparison[]" required>
                            <option value=">">&gt; (greater than)</option>
                            <option value=">=">&gt;= (greater or equal)</option>
                            <option value="<">&lt; (less than)</option>
                            <option value="<=">&lt;= (less or equal)</option>
                            <option value="==" selected>== (equal to)</option>
                            <option value="!=">!= (not equal to)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Value:</label>
                        <input type="text" name="condition_value[]" placeholder="e.g., 30" required>
                        <small>The value to compare against</small>
                    </div>
                </div>
            {% endif %}
        </div>
        
        <button type="button" class="btn btn-secondary mb-20" onclick="addCondition()">
            + Add Another Condition (AND)
        </button>
        
        <h2>Action (What to do when conditions are met)</h2>
        
        <div class="form-group">
            <label>Action Message:</label>
            <input type="text" name="action_message" 
                   value="{{ rule.action.message if rule else '' }}"
                   placeholder="e.g., Temperature too high, turn on AC" required>
            <small>Human-readable description of what this rule does</small>
        </div>
        
        <div class="form-group">
            <label>Publish to Topic:</label>
            <input type="text" name="action_topic" 
                   value="{{ rule.action.topic if rule else '' }}"
                   placeholder="e.g., room/AC" required>
            <small>MQTT topic where the command will be published</small>
        </div>
        
        <div class="form-group">
            <label>Publish Value:</label>
            <input type="text" name="action_value" 
                   value="{{ rule.action.value if rule else '' }}"
                   placeholder="e.g., on" required>
            <small>The value to publish (e.g., "on", "off", or a number)</small>
        </div>
        
        <div class="action-buttons">
            <button type="submit" class="btn btn-success">
                {{ 'Update Rule' if edit_mode else 'Create Rule' }}
            </button>
            <a href="{{ url_for('list_rules') }}" class="btn btn-secondary">Cancel</a>
        </div>
    </form>
    
    <script>
        function addCondition() {
            const container = document.getElementById('conditions-container');
            const count = container.children.length + 1;
            
            const conditionDiv = document.createElement('div');
            conditionDiv.className = 'condition-group';
            conditionDiv.innerHTML = `
                <div class="condition-header">Condition ${count}</div>
                
                <div class="form-group">
                    <label>MQTT Topic:</label>
                    <input type="text" name="condition_topic[]" placeholder="e.g., house/temperature" required>
                    <small>The topic to monitor</small>
                </div>
                
                <div class="form-group">
                    <label>Comparison Operator:</label>
                    <select name="condition_comparison[]" required>
                        <option value=">">&gt; (greater than)</option>
                        <option value=">=">&gt;= (greater or equal)</option>
                        <option value="<">&lt; (less than)</option>
                        <option value="<=">&gt;= (less or equal)</option>
                        <option value="==" selected>== (equal to)</option>
                        <option value="!=">!= (not equal to)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Value:</label>
                    <input type="text" name="condition_value[]" placeholder="e.g., 30" required>
                    <small>The value to compare against</small>
                </div>
                
                <button type="button" class="btn btn-danger btn-sm remove-btn" 
                        onclick="removeCondition(this)">Remove Condition</button>
            `;
            
            container.appendChild(conditionDiv);
        }
        
        function removeCondition(button) {
            button.parentElement.remove();
            updateConditionNumbers();
        }
        
        function updateConditionNumbers() {
            const conditions = document.querySelectorAll('.condition-group');
            conditions.forEach((condition, index) => {
                condition.querySelector('.condition-header').textContent = `Condition ${index + 1}`;
            });
        }
    </script>
{% endblock %}
```

#### Explanation:

**Jinja2 Template Logic:**

1. **`{{ 'Edit' if edit_mode else 'Create' }}`** - Conditional text
   - If `edit_mode` is True, shows "Edit"
   - Otherwise shows "Create"

2. **`{% if rule and rule.conditions %}`** - Checks if editing an existing rule
   - If yes, pre-fills form with existing data
   - If no, shows empty form

3. **`value="{{ condition.topic }}"`** - Pre-fills input with existing value when editing

4. **`{% if condition.comparison == '>' %}selected{% endif %}`** - Marks the correct dropdown option as selected

5. **Array inputs:** `name="condition_topic[]"` 
   - The `[]` tells the server there can be multiple values
   - Python receives them as a list

**JavaScript Functions:**

1. **`addCondition()`**:
   ```javascript
   const container = document.getElementById('conditions-container');
   const conditionDiv = document.createElement('div');
   conditionDiv.innerHTML = `...`;
   container.appendChild(conditionDiv);
   ```
   - **`getElementById()`** finds the container div
   - **`createElement()`** creates a new div element
   - **`innerHTML`** sets the HTML content (a complete condition form group)
   - **`appendChild()`** adds it to the page

2. **`removeCondition(button)`**:
   ```javascript
   button.parentElement.remove();
   updateConditionNumbers();
   ```
   - **`parentElement`** gets the parent div (the whole condition group)
   - **`.remove()`** deletes it from the page
   - Updates numbering so they stay sequential

3. **`updateConditionNumbers()`**:
   - Uses **`querySelectorAll()`** to find all condition groups
   - **`forEach()`** loops through them
   - Updates the "Condition 1", "Condition 2", etc. headers

***

## Step 4: Edit Existing Rule

Here is how the process of editing a rule will go:
```
User clicks Edit → Flask loads rule from rules.json → 
Passes to template → Template pre-fills form → 
User modifies and submits → Flask replaces old rule → 
Saves to rules.json
```

```python
@app.route('/rules/edit/<int:rule_id>', methods=['GET', 'POST'])
@login_required
def edit_rule(rule_id):
    """Edit an existing rule"""
    rules = load_rules()
    
    # Check if rule_id is valid
    if rule_id < 0 or rule_id >= len(rules):
        flash('Rule not found!', 'danger')
        return redirect(url_for('list_rules'))
    
    if request.method == 'POST':
        # Get form data (same as create)
        topics = request.form.getlist('condition_topic[]')
        comparisons = request.form.getlist('condition_comparison[]')
        values = request.form.getlist('condition_value[]')
        
        conditions = []
        for topic, comparison, value in zip(topics, comparisons, values):
            conditions.append({
                'topic': topic.strip(),
                'comparison': comparison,
                'value': convert_value(value.strip())
            })
        
        action = {
            'message': request.form['action_message'].strip(),
            'topic': request.form['action_topic'].strip(),
            'value': request.form['action_value'].strip()
        }
        
        # Update the specific rule
        rules[rule_id] = {
            'conditions': conditions,
            'action': action
        }
        
        if save_rules(rules):
            flash('Rule updated successfully!', 'success')
        else:
            flash('Error updating rule.', 'danger')
        
        return redirect(url_for('list_rules'))
    
    # GET request - show form pre-filled with existing rule
    return render_template('rule_form.html', edit_mode=True, rule=rules[rule_id], rule_id=rule_id)
```

### Explanation:

**Key differences from create:**

1. **`<int:rule_id>`** in the route captures the rule number from the URL.
   - `/rules/edit/0` → `rule_id = 0` (first rule)
   - `/rules/edit/2` → `rule_id = 2` (third rule)

2. **Validates the ID** to prevent errors if someone types an invalid number.

3. **On POST:** Replaces the existing rule with `rules[rule_id] = ...`

4. **On GET:** Passes the existing rule to the template so the form is pre-filled with current values.

5. **`edit_mode=True`** tells the template to change button text from "Create" to "Update".

### Questions:
- When you compare the code in `create_rule` and `edit_rule` functions, do you see an opportunity to simplify each of these with a new helper function? 
- Why did we not create a separate template for editing?
- How are the above 2 questions related?

***

## Step 5: Delete Rule with Confirmation

Here is how the process of deleting a rule will go:
```
User clicks Delete → Flask loads rule from rules.json → 
Passes to template → Template shows rule information → 
User cancels or accepts rule deletion → If canceled redirected to the list, if accepted new submission to same location

If submitted through POST → Flask loads rule from rules.json → Flask removes that rule from the dictionary → 
Saves to rules.json
```

```python
@app.route('/rules/delete/<int:rule_id>', methods=['GET', 'POST'])
@login_required
def delete_rule(rule_id):
    """Delete a rule after confirmation"""
    rules = load_rules()
    
    # Check if rule_id is valid
    if rule_id < 0 or rule_id >= len(rules):
        flash('Rule not found!', 'danger')
        return redirect(url_for('list_rules'))
    
    if request.method == 'POST':
        # User confirmed deletion
        deleted_rule = rules.pop(rule_id)
        
        if save_rules(rules):
            flash(f'Rule deleted: {deleted_rule["action"]["message"]}', 'success')
        else:
            flash('Error deleting rule.', 'danger')
        
        return redirect(url_for('list_rules'))
    
    # GET request - show confirmation page
    return render_template('rule_delete.html', rule=rules[rule_id], rule_id=rule_id)
```

### Explanation:

1. **GET request:** Shows the rule and asks "Are you sure?"

2. **POST request:** Actually deletes the rule.

3. **`rules.pop(rule_id)`** removes the item at that index and returns it.
   - We save the deleted rule to show its message in the flash notification.

4. **Two-step process prevents accidental deletion** (user must click "Delete" then "Confirm").

***

### Create the Delete Confirmation Template

Deleting an item in a program can be dangerous for system operations.
Indeed, a user may delete something that enables the system running well... and we don't want this to be a consequence of our cat stepping on our keyboards, a misclick, or lack of reflection.
So, we would normally pause the process by requesting a conformation form the user when deletion is about to occur.

Create `templates/rule_delete.html`:

```html
{% extends "base.html" %}

{% block title %}Delete Rule{% endblock %}

{% block content %}
    <h1>Confirm Rule Deletion</h1>
    
    <div class="alert alert-warning">
        <strong>Warning:</strong> You are about to delete this rule. This action cannot be undone.
    </div>
    
    <div class="rule-card">
        <h2>Rule to be Deleted</h2>
        
        <div class="rule-logic">
            <div class="logic-label">IF all of these conditions are true:</div>
            
            {% for condition in rule.conditions %}
            <div class="condition">
                <span class="condition-topic">{{ condition.topic }}</span>
                <span class="operator">{{ condition.comparison }}</span>
                <span class="condition-value">{{ condition.value }}</span>
                {% if not loop.last %}
                    <strong class="and-label">AND</strong>
                {% endif %}
            </div>
            {% endfor %}
            
            <div class="action">
                <div class="logic-label">THEN Execute Action:</div>
                <div><strong>Message:</strong> {{ rule.action.message }}</div>
                <div><strong>Publish to:</strong> <code>{{ rule.action.topic }}</code> = <code>{{ rule.action.value }}</code></div>
            </div>
        </div>
    </div>
    
    <form method="POST" class="text-center mt-20">
        <button type="submit" class="btn btn-danger">Yes, Delete This Rule</button>
        <a href="{{ url_for('list_rules') }}" class="btn btn-secondary">Cancel</a>
    </form>
{% endblock %}
```

#### Explanation:

- Shows the complete rule so the user knows exactly what they're deleting
- **GET request** displays this page
- **POST request** (clicking "Yes, Delete") actually deletes the rule
- Cancel button just redirects back to the rules list (no deletion)

---

## Step 6: Update Navigation in base.html

`templates/base.html` should look something like this:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}IoT Dashboard{% endblock %}</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='styles.css') }}">
</head>
<body>
    <nav>
        <ul>
            <li><a href="{{ url_for('plot_data') }}">Dashboard</a></li>
            <li><a href="{{ url_for('list_rules') }}">Manage Rules</a></li>
            {% if current_user.is_authenticated %}
                <li style="margin-left: auto;"><a href="{{ url_for('logout') }}">Logout ({{ current_user.id }})</a></li>
            {% endif %}
        </ul>
    </nav>
    
    <div class="container">
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ category }}">{{ message }}</div>
                {% endfor %}
            {% endif %}
        {% endwith %}
        
        {% block content %}{% endblock %}
    </div>
</body>
</html>
```

#### Explanation:
- Adds a "Manage Rules" link accessible from any page.
- Shows the logged-in username next to the logout link.

***

## Step 7: Update Your CSS File

CSS is a language used to define how an HTML template will look.
We use CSS to define font colors, sized, styles, etc.

It would usually be the role of a graphic designer to set all the parameters in a CSS file.
The programmer will want to have the tools to apply the styles correctly in their application.
For this reason, we will use the classes, defined below with selectors starting with `.`.
In what follows, we have `.rules-card` which is the selector and the style definitions will go between the accolades `{` and `}` which follow:  
```css
.rule-card {
    //style definitions will go here
}
```

Add these styles to `static/styles.css`:

```css
/* Rules Management Styles */

.rule-card {
    border: 1px solid #ddd;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.rule-logic {
    background-color: white;
    padding: 15px;
    border-left: 4px solid #3498db;
    margin: 15px 0;
}

.logic-label {
    font-weight: bold;
    color: #2c3e50;
    margin-bottom: 10px;
}

.condition {
    background-color: #e8f4f8;
    padding: 10px;
    margin: 8px 0;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.condition-topic {
    font-weight: bold;
    color: #2c3e50;
    font-family: monospace;
}

.operator {
    background-color: #3498db;
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: bold;
}

.condition-value {
    font-family: monospace;
    background-color: white;
    padding: 4px 8px;
    border-radius: 4px;
}

.and-label {
    color: #e74c3c;
    font-size: 14px;
    margin-left: 10px;
}

.action {
    background-color: #d5f4e6;
    padding: 15px;
    margin-top: 15px;
    border-left: 4px solid #27ae60;
    border-radius: 4px;
}

/* Form Styles */

.condition-group {
    border: 1px solid #ddd;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 4px;
    background-color: #f9f9f9;
    position: relative;
}

.condition-header {
    font-weight: bold;
    color: #3498db;
    margin-bottom: 15px;
    font-size: 16px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    font-weight: bold;
    margin-bottom: 5px;
    color: #2c3e50;
}

.form-group small {
    display: block;
    color: #7f8c8d;
    font-size: 12px;
    margin-top: 3px;
}

.form-group input[type="text"],
.form-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    box-sizing: border-box;
}

.remove-btn {
    position: absolute;
    top: 10px;
    right: 10px;
}

.help-text {
    color: #7f8c8d;
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f0f0f0;
    border-radius: 4px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #7f8c8d;
}

code {
    background-color: #f4f4f4;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    color: #e74c3c;
}
```

### Explanation:

**CSS Classes:**

- **`.rule-card`** - Container for each rule display
- **`.rule-logic`** - White box with blue left border for the IF-THEN logic
- **`.condition`** - Light blue background for each condition
- **`.operator`** - Blue pill-shaped button for comparison operators
- **`.action`** - Green background for the action (THEN part)
- **`.condition-group`** - Form section for each condition being created/edited
- **`.help-text`** - Gray informational text to guide users
- **`.empty-state`** - Centered message when no rules exist
- **`code`** - Monospace styling for MQTT topics and values

---

## Step 8: Testing Your Application

### Test 1: View Rules

1. Start your application: `python3 app.py`
2. Log in
3. Navigate to "Manage Rules"
4. You should see either your existing rules or "No rules configured yet"

### Test 2: Create a Simple Rule

Click "Create New Rule" and fill in:

**Condition 1:**
- Topic: `house/temperature`
- Operator: `>`
- Value: `30`

**Action:**
- Message: `Temperature too high, turn on AC`
- Topic: `room/AC`
- Value: `on`

Click "Create Rule"

**Expected result:** Redirected to rules list, see your new rule, flash message "Rule created successfully!"

### Test 3: Create a Compound Rule (Multiple Conditions)

Create another rule:

**Condition 1:**
- Topic: `house/temperature`
- Operator: `>`
- Value: `25`

Click "+ Add Another Condition"

**Condition 2:**
- Topic: `house/humidity`
- Operator: `>`
- Value: `70`

**Action:**
- Message: `Hot and humid, activate dehumidifier`
- Topic: `room/dehumidifier`
- Value: `on`

**Expected result:** Rule created with both conditions shown with "AND" between them

### Test 4: Edit a Rule

1. Click "Edit" on any rule
2. Change a value (e.g., temperature from 30 to 28)
3. Click "Update Rule"

**Expected result:** Rule is updated, flash message "Rule updated successfully!"

### Test 5: Delete a Rule

1. Click "Delete" on a rule
2. Review the confirmation page
3. Click "Yes, Delete This Rule"

**Expected result:** Rule is removed, flash message shows which rule was deleted

### Test 6: Verify rules.json

Open `rules.json` in a text editor. You should see your rules formatted like:

```json
[
  {
    "conditions": [
      {
        "topic": "house/temperature",
        "comparison": ">",
        "value": 30
      }
    ],
    "action": {
      "message": "Temperature too high, turn on AC",
      "topic": "room/AC",
      "value": "on"
    }
  }
]
```

***

## The IoT Controller Uses These Rules:

Your IoT Controller application (from earlier labs) reads `rules.json` and automatically applies these rules. When you modify rules through the web interface, the controller will use the new rules the next time it loads.

**To apply changes immediately**, you'd need to restart the IoT Controller service or add a feature to reload the configuration file.

***

## Common Issues and Solutions

### Issue 1: Rules Not Saving

**Symptom:** Create rule succeeds but rules.json doesn't update

**Solution:** Check file permissions:
```bash
ls -la rules.json
chmod 644 rules.json
```

### Issue 2: Form Doesn't Submit

**Symptom:** Click "Create Rule" but nothing happens

**Solution:** 
- Open browser console (F12)
- Check for JavaScript errors
- Ensure all required fields are filled

### Issue 3: Edit Shows Wrong Rule

**Symptom:** Click "Edit" on Rule #3 but see Rule #1's data

**Solution:** Rule IDs in URLs must match list indices. Check that you're using `loop.index0` (starts at 0) not `loop.index` (starts at 1).

### Issue 4: "AND" Shows After Last Condition

**Symptom:** Display shows "Condition 1 AND Condition 2 AND"

**Solution:** Check your template uses `{% if not loop.last %}` around the AND label.

***

## Security Note

Currently, `rules.json` is editable by any logged-in user. For production systems, consider:

1. **Role-based access:** Some users can only view, others can edit
2. **Audit logging:** Track who changed what and when
3. **Validation:** Ensure topics and values follow your system's rules
4. **Backup before changes:** Save a copy of rules.json before modifications

***

## Summary

You've built a **complete rule management system** that:

- **Displays rules** in a clear, visual IF-THEN format  
- **Creates new rules** with single or multiple conditions  
- **Edits existing rules** with pre-filled forms  
- **Deletes rules** with confirmation to prevent accidents  
- **Saves to JSON** in a format compatible with your IoT Controller  
- **Protects access** with login requirements  
- **Provides user feedback** with flash messages  

Your web application now provides a **user-friendly interface** for configuring IoT automation without manually editing JSON files. This is a professional approach used in real-world IoT platforms and home automation systems.

The patterns you've learned—form handling, JSON manipulation, dynamic JavaScript, and CRUD operations—are fundamental to web application development and apply to many other types of applications beyond IoT.

***

## Extension Ideas

Our system needs more work to be a professional-grade system.
Here are a few ideas for extension:

### 1. Add Rule Validation

```python
def validate_rule(rule):
    """Check if a rule is valid before saving"""
    if not rule.get('conditions'):
        return False, "At least one condition is required"
    
    for condition in rule['conditions']:
        if not condition.get('topic'):
            return False, "Condition topic cannot be empty"
    
    if not rule.get('action', {}).get('topic'):
        return False, "Action topic is required"
    
    return True, "Valid"
```

Use it before saving:
```python
is_valid, message = validate_rule(new_rule)
if not is_valid:
    flash(message, 'danger')
    return redirect(url_for('create_rule'))
```

### 2. Add Rule Enable/Disable Toggle

Add an `"enabled": true` field to each rule, then add a toggle button without deleting the rule.

### 3. Export/Import Rules

Allow users to download rules as a backup file or import rules from another system.

### 4. Test Rule Before Saving

Query the current sensor values and show whether the rule would trigger right now.

### 5. Rule Change Application Trigger

**To apply changes immediately**, you'd need to restart the IoT Controller service or add a feature to reload the configuration file.

We will see how to implement this feature in Lab 12.
