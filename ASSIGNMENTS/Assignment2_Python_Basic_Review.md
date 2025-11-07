# Python Basic Review Coding Assignment

This assignment is designed according to the structure, topics, and skills introduced in the W3Schools Python tutorial (https://www.w3schools.com/python/). For each question, you must complete a small but important part of the code, focusing on the correct use of structures such as sequence, branching, and repetition. 

Each question states the input, the desired output, and the correct output for self-verification.

Each question is worth 1 of 10 marks.
- Complete 10 questions among the 13 first questions perfectly for full marks.
- Complete more than 10 questions among the 13 first questions perfectly for full marks + 1 bonus mark per extra question.
- Complete the 13 first question and add bonus marks from Question 14 and 15.

Provide your answers to all questions, in the correct order and properly identified with comments, in a single Python file committed and pushed to a github repository where I am invited as collaborator, no later than the last day of classes, December 11 2025, at 11:55PM.

## Question 1: String Manipulation — Make It Exciting!

**Instructions:**  
Complete the function so that it adds three exclamation marks (`"!!!"`) to the end of any input string.

Use concatenation and return the result of this operation.

```python
def hype_it_up(word):
    # Complete this line:
    return 

# Test case
print(hype_it_up("Python"))
```

**Expected Output:**  
```
Python!!!
```

***

## Question 2: List Processing — Reverse and Celebrate

**Instructions:**  
Complete the function to return a string of words from a list, reversed in order, and separated by a dash, ending with "🎉".


```python
def reverse_and_celebrate(words):
    # Complete these lines:

# Test case
print(reverse_and_celebrate(["Python", "is", "fun"]))
```

**Expected Output:**  
```
fun-is-Python🎉
```

**Hint: This is a tougher one and can be solved with looping and a conditional statement in
 the loop.**

***

## Question 3: Dictionary Lookup — Emoji Translator

**Instructions:**  
Given a dictionary mapping animal names to emojis, complete the function to return the correct emoji for a given animal name. If the animal is not found, return "🐾".

You can accomplish this with the dictionary get function and with a try..except structure. Do it both ways.

```python
animal_emojis = {
    "cat": "🐱",
    "dog": "🐶",
    "lion": "🦁",
    "cow": "🐮"
}

def animal_to_emoji(animal):
    # Complete this line:
    

# Test case
print(animal_to_emoji("dog"))
print(animal_to_emoji("duck"))
```

**Expected Output:**  
```
🐶
🐾
```

***

## Question 4: Function Arguments and Arithmetic — The Magic Number

**Instructions:**  
Complete the function so that it adds three input numbers, multiplies by 2, and returns the value as a string with the word " is magical!" at the end.

```python
def magic_number(a, b, c):
    # Complete this line:
    

# Test case
print(magic_number(2, 4, 7))
```

**Expected Output:**  
```
26 is magical!
```

**Hint: Don't forget to convert the number obtained from the arithmetic operation into a string.**

***

## Question 5: Conditional Logic — Weather Forecaster

**Instructions:**  
Finish this function so it takes an integer `temp` and returns `"Sun's out! 😎"` if the temperature is 20 or more, otherwise returns `"Brrr... bundle up! 🧥"`.

```python
def weather_message(temp):
    # Complete these lines:
    

# Test cases
print(weather_message(25))
print(weather_message(10))
```

**Expected Output:**  
```
Sun's out! 😎
Brrr... bundle up! 🧥
```

***

## Question 6: Loops — Countdown Blastoff!

**Instructions:**  
Complete the function to create a countdown string from a given number down to 1, with each number on a new line, ending with "🚀 BLASTOFF!"

```python
def countdown_blastoff(n):
    result = ""
    # Complete these lines:
    
    
    return result

# Test case
print(countdown_blastoff(3))
```

**Expected Output:**  
```
3
2
1
🚀 BLASTOFF!
```

***

## Question 7: String Formatting — Name Badge Generator

**Instructions:**  
Complete the function to create a formatted name badge with stars on either side. Use string multiplication to generate the border based on name length.

```python
def name_badge(name):
    # Complete these lines:
    
    
    return badge

# Test case
print(name_badge("Alice"))
print(name_badge("Bob"))
```

**Expected Output:**  
```
***********
*  Alice  *
***********

*********
*  Bob  *
*********

```

**Hint: The `new line` "\n" control sequence inside a string causes the output to move to the next line, just like pressing the `enter` key.**

***

## Question 8: List Comprehension — Emoji Repeater

**Introduction: a List Comprehension**
A list comprehension is a way of writing how a new list should be output from an existing list. For example, if we want a new list `B` from an existing list `A`, keeping only the even numbers and converting them to a string, we could write
```
B = [str(x) for x in A if x % 2 == 0]
```
In the instruction above, we have
- the output process `str(x)` converting to a string before the keyword `for`
- the element definition `x in A` between keywords `for` and `if`... this is all elements of A and we name them x here to allow us to refer to them.
- the condition for including them in the output set after the keyword `if`, an even number has no remainder when divided by 2.

If we wanted to multiply all numbers of a list by 2 without condition, it could look like this:
```
A = [1,2,3,4,5]
B = [x*2 for x in A]
```
Notice we just removed the `if` part.

And now for the actual question...

**Instructions:**  
Complete the function using a list comprehension to repeat each emoji in the input list a given number of times, then join them into a single string.

```python
def emoji_repeater(emojis, times):
    # Complete this line:
    
    return "".join(repeated_emojis)

# Test case
print(emoji_repeater(["😀", "🎉", "⭐"], 2))
```

**Expected Output:**  
```
😀😀🎉🎉⭐⭐
```

**Hint: The string join method concatenates all elements of a list, placing the string defined left of the "." between the string elements.**

***

## Question 9: Dictionary Iteration — Score Board

**Instructions:**  
Complete the function to iterate through a dictionary of player names and scores, formatting them as a leaderboard with each name and score on a new line, ranked from highest to lowest score.

```python
def scoreboard(scores):
    result = ""
    # Complete these lines:
    
    
    return result

# Test case
print(scoreboard({"Alice": 95, "Bob": 87, "Charlie": 92, "Dave": 63}))
```

**Expected Output:**  
```
🥇 Alice: 95
🥈 Charlie: 92
🥉 Bob: 87
Dave: 63
```

**Hint 1: To sort a dictionary `A` by value, in descending order, use the following command:**
```python
    A_sorted = dict(sorted(A.items(), key=lambda item: item[1], reverse=True))
```
To break it down in basic operations
```python
    A_KV_LIST = A.items() # converts to a list of key-value pairs
    A_KV_LIST_SORTED = sorted(A_KV_LIST, key=lambda item: item[1], reverse=True)
    A_sorted = dict(A_KV_LIST_SORTED)
```

**Hint 2: To go through all items of a dictionary `A`, and print their keys and values, use the following for loop:**
```python
    for k,v in A.items():
        #use variables k and v to access the key and value data
```

***

## Question 10: Functions as Parameters — Custom Processor

**Instructions:**  
Complete the function to apply a given function to each element in a list and return the transformed list as a comma-separated string.

**Hint: Recall list comprehensions.**

```python
def apply_function(func, items):
    # Complete this line:
    
    return ", ".join(result)

# Test case
print(apply_function(str.upper, ["hello", "world", "python"]))
```

**Expected Output:**  
```
HELLO, WORLD, PYTHON
```

***

## Question 11: Exception Handling — Safe Calculator

**Instructions:**  
Complete the function to divide two numbers safely. If division by zero occurs, return "⚠️ Cannot divide by zero!", otherwise return the result formatted as a string with the division symbol.

```python
def safe_divide(a, b):
    # Complete these lines:
    
    
    

# Test cases
print(safe_divide(10, 2))
print(safe_divide(5, 0))
```

**Expected Output:**  
```
10 ÷ 2 = 5.0
⚠️ Cannot divide by zero!
```

***

## Question 12: Set Operations — Duplicate Remover and Sorter

**Instructions:**  
Complete the function to remove duplicate items from a list, convert to a sorted list, and return as a hyphen-separated string.

```python
def remove_duplicates(items):
    # Complete these lines:
    
    
    return "-".join(sorted_unique)

# Test case
print(remove_duplicates([3, 1, 4, 1, 5, 9, 2, 6, 5]))
```

**Expected Output:**  
```
1-2-3-4-5-6-9
```

**Hint: The join command only works with strings.**

***

## Question 13: Dictionary and List Combination — Event Schedule

**Instructions:**  
Complete the function to iterate through a list of event dictionaries and create a formatted schedule. Each event has "time" and "name" keys. Format as "⏰ [time]: [name]" on each line.

```python
def event_schedule(events):
    result = ""
    # Complete these lines:
    
    
    return result

# Test case
schedule = [
    {"time": "09:00", "name": "Standup"},
    {"time": "10:30", "name": "Design Review"},
    {"time": "14:00", "name": "Project Planning"}
]
print(event_schedule(schedule))
```

**Expected Output:**  
```
⏰ 09:00: Standup
⏰ 10:30: Design Review
⏰ 14:00: Project Planning
```

***

## (2 BONUS marks) Question 14: Dictionary, List, and JSON — Event Schedule

**Instructions:**
Write the same schedule in a JSON file, load it, and display it the same way as in Question 13.

***

## (5 BONUS marks) Question 15: Event Schedule Editor

**Instructions:**
Extend the program from Question 14 to include an interface the user can use to Add, Delete, and Edit items from their schedule and write all changes to the JSON data file.