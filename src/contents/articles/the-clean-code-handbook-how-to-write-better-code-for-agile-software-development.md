---
title: "The Clean Code Handbook: How to Write Better Code for Agile Software Development"
description: "In Agile, where change is the only constant, clean code is your armor. It makes you adaptable, swift, and, most importantly, in control."
publishedDate: February 9, 2025
category: Career
poster: https://images.unsplash.com/photo-1617042375876-a13e36732a04?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb
---
## **The Clean Code Handbook: How to Write Better Code for Agile Software Development**

[Read the full article here](https://www.freecodecamp.org/news/the-clean-code-handbook/?ref=dailydev#heading-clean-coder-vs-messy-coder)

In this article, I will explain the concept of clean code and share my preferred patterns for writing modern Agile applications.

I will avoid complex jargon and instead present straightforward JavaScript examples that highlight the core principles. Let's get straight to the point.

In the Agile environment, where change is constant, clean code serves as your protective gear. It enhances your adaptability, speed, and, most importantly, your control over the development process.

The reality is that writing clean code is essential for thriving in the software development industry. Fortunately, with dedication and practice, anyone can master the art of clean coding.

### **The Cost of Bad Code**

![Cost of Bad Code](https://prod-files-secure.s3.us-west-2.amazonaws.com/effcaeb0-736a-4d67-81a8-ab23b54a0483/56fdf938-989e-4e32-bdd4-262b4290857a/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667TBT4LTT%2F20260517%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260517T151024Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIAiiW7fmNrwAHAkjFYd6PgYJaE0Ccz23ZTBEgQ8iP2g0AiEAozGOakLMDsvK%2FopJg9d%2FMHEgUhbEhHSR8jsDeSxO%2BQ4qiAQIpv%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDOQZefBcyvz2mtuQXSrcA2QfveGln2mRKWKTpaV6IDM9gvYrS2D1g4XmD6YCV0bqD%2B0bCjuCdtsrG4CB3%2FHGjRcig4PrNsZ8Dwm5TYJrXJwbSJZbQ9Y79C4OMZtUbYI2cfSbdI2gHHn5zvzZdNWMvTpbMsWguLSVnIJL8LO%2FbSS29Ne5iiy0eQLw2W8jySgw811urhoNOA8LvXXrabG6uyD%2BL29fBVjPVVH211Jv4Qqk0mkVIzdcsFu6KtIyOC2PbvvTV9A7c0BziGiOW9gNbVyUzt57KSq0TopVrcMGCAFZCPkWFGtHNWD0%2Bhpwzr6D7ZMl8JB00OblMVQMp%2F5f31Xf32ToVwIb9JZxqfJpRUusIKbrBEca4f%2FqLPYpL0s9klpwIbIgzz%2BFjtqsZxV7dnxnEiIhMt932gzC%2F6Y2wo1QKVkH5i6wVO1hBDr2OvwuUgkJps2HzjnQR022q5rGqoZADfNhhaztgyfZK6TWay3Gb4Ghk30YL74met6gTe67CtoCV5eYzWiV6vBQ3QVNiYkTgxwFETCRrg9cJBdi%2FhGKtPNqyXv%2BzONtDtvxVVdHx8OCwBsyGFzRv0pXj64MDSOb6HgVajZ0UJNd69LMOoI3O8bzIBXiKv0STlRKxg4C5aqg9n6Oba588i9WMO%2F8ptAGOqUBO%2FOvf07hTrO0CvQPuy70hPXeVZTWATBmvNLhpOFIrRXcCVwz0PDIaTPYypk25FnHCVbWa6jIRs%2BlEtTrFQH0g%2Fgb4UZQ1BrBFylEBodmM%2FB7BAWl5uioK5bhPD3AJcpv6yWYEUG8qjLRzjItnJ9osz2moMPkthTVOuhwGIiaLbfKWbcr1up8toXsnusX8EjlBvUXrCJFf2%2B1xReeBwlgjY8%2FpMHC&X-Amz-Signature=d1337c15f49da83c4f7ab329467005052231247c150b35a0cee8ddd45cd77c02&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

This stacked bar graph illustrates the cost implications of bad code. During the initial development phase, bad code is only **slightly** more expensive to change than clean code. However, as we transition into maintenance and refactoring phases, the cost disparity becomes pronounced, with bad code costing nearly twice as much as clean code.

By the legacy phase, the cost of bad code skyrockets to 100%, making updates prohibitively expensive, while clean code remains manageable at 45%.

According to the 2022 report by the Consortium for Information and Software Quality ([cisq.org](http://cisq.org/)), poor software quality cost the U.S. economy at least $2.41 trillion in 2022, with technical debt accounting for approximately $1.52 trillion of this figure.

You can [read more about that here](https://www.it-cisq.org/the-cost-of-poor-quality-software-in-the-us-a-2022-report/).

Recent discussions emphasize the significant impact of technical debt on software quality and business performance. For instance, a 2024 survey indicated that for over 50% of companies, technical debt constitutes more than a quarter of their total IT budget, which can severely hinder innovation if left unaddressed.

Clearly, bad code is a costly issue in software development.

### **Clean Coder vs. Messy Coder**

Here’s a graph illustrating the journey of **two types** of coders:

![Clean Coder vs. Messy Coder](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/c6ubf77uwipf4gtucw8q.png)

- **⚠️ The Messy Coder (Red line):** Begins quickly but encounters significant setbacks. As they write more lines of code, they create more complications.
- **⚡ The Clean Coder (Blue line):** Starts slowly but maintains consistent growth. Their progress accelerates over time.

🫵 Now, it's your choice which path you want to follow.

### **AI Can’t Save You If Your Code is a Mess 🗑️**

When you find yourself stuck while coding, you might consider turning to AI for assistance. However, it's crucial to understand that AI cannot rescue you if your code is disorganized.

Imagine constructing a house on unstable ground. It may stand for a while, but a strong gust of wind or a significant wave will bring it crashing down.

Remember, AI is merely a tool. If you lack the ability to write clean, scalable applications, you're setting yourself up for failure.

If you cannot maintain the code you write, you are in a precarious situation.

I have witnessed this repeatedly: developers proficient in multiple programming languages who can build applications, websites, and software, and who understand algorithms and data structures intimately. Yet, when faced with a large project or someone else's chaotic code, they falter.

They resemble an aerospace engineer who designs and constructs their own planes but lacks the skills to fly them. They crash into their own code.

I was once in that position. I would write thousands of lines of code, only to find that I couldn't even comprehend what I had written the previous week. It was utter chaos.

Then it dawned on me — every developer faces this challenge. It wasn't about how much I knew; it was about how I organized and structured that knowledge. In essence, it was about mastering the art of programming itself.

I resolved to escape this trap. After five months of dedicated effort — four to five hours a day spent writing, designing, and researching — I created something I wish I had when I first started programming: a comprehensive beginner's guide titled **Clean Code Zero to One**.

![Clean Code Zero to One](https://cdn.hashnode.com/res/hashnode/image/upload/v1737731329839/c4c862d9-7fdc-460a-ae2e-18b19468b6ec.png)

If you're interested in learning more about the book, I will provide all the details at the end of this tutorial. So, keep reading to discover more about writing clean code.

### **13 Clean Code Design Patterns for Building Agile Applications ⚖️**

If your code does not adhere to these modern clean code design patterns, you may be creating a ticking time bomb. These patterns are essential tools. Master them, and you will enjoy the success of your projects. Let me introduce them one by one.

<details>
<summary>**🌿 Use Names That Mean Something**</summary>

Naming variables or functions as 'b' or 'x' is unhelpful. Instead, use descriptive names that clearly convey their purpose. Here’s an example of both a poor and a strong variable name:

```javascript
// Weak and vague
let b = 5;

// Strong and clear
let numberOfUsers = 5;
```

Writers of unclear names often avoid taking responsibility for their mistakes. Don't be that person.

![Meaningful Names](https://prod-files-secure.s3.us-west-2.amazonaws.com/effcaeb0-736a-4d67-81a8-ab23b54a0483/92110b04-7aa5-4385-8097-8a948fe95950/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4662ZWPYUI5%2F20260517%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260517T151026Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEN7%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJIMEYCIQCVmmmQrHyIYgrhhVgI%2FTwi0XmpJCX90i7V4Np6WVhnPAIhALGGdstkvKFw%2B%2BhNokc6ubRDJ5jQljqnLaMMrV4z87qQKogECKf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQABoMNjM3NDIzMTgzODA1IgywqQUAigvnG173JZYq3AMFS%2FCftbaGnx3oImY0kgMje%2FGx6x0WNoOh7iAEqBr2Pwj36wP7GWmInXg9N0F8ISLXy%2Fpjjicpt7vJgrc9tw3fzaFWu1%2F9V%2FVfmoqzl%2FyMDQPh4xpG3Jqm9SzGh8o4oY064CZn3nyAIDngLBz1M4%2BMb2JbI77nrE9qTWE5xN3PF%2BJdXzIrQ1s6H75BAMW3k6VfQwmR1gX2d7vIdJa0EVbaEYpdKI03MPG3EkJYmemwRNHcGJRCy8YMEAs8e4IJ9Flzj9W24fXdP8NoYcHkDkgAHLsZwYD12Cqz2K4qAwmJ9X%2BDM3G7OGcMwLdNSZsltk%2Be85iWi14PPRgplixr60F4Bb1bEL6GfSYClT4ZAXeA358naKVd3Vo03X7g6Eb1Muwa0CADWO0SjZ%2B5Y%2F3FIs0fxKe1axtN5nBItpGnteGW9sw9lE1dU738tuo3w%2BrdmypgvRzj7TMoJzBXOj2h0%2F2hZVEK0Ioe%2BnSPGSqoQ%2BvcgK1P9p%2BPpzhhLoCbD4IYl%2Fad%2FNH6AIIjn3M9EGSatyrZguxBBp1vReUoNXqX0LnyxfakKXjz0UDLl9aWt73FyKVeSlsi0nkAgYMvUNmcZH9nP%2FJi%2FYPmoGt52TH4e7SKAJ5SVDUxPaf6so%2BwPzDbg6fQBjqkASWvCtFYO8VpLvaAA0lo1ArVF7hLakNGP%2BYHuuJMTrSfUTWREawfAjtzNVug%2ByivC%2B6w3yp%2FwGxd8MIFiXlzeU6ee4WNKFtNP1emKAXBXGZela8CvF330AyhBlq3cxIO2wXENQYnoEakCGaRjIh1AfPHGIl0QKM4PfqBYasSIT%2FKrVsydFg4ELnB8xwZ5a25qiewFKekg1a8CaMfPQJnHjFQDxhl&X-Amz-Signature=92699a22f4182fa0e52a38295833062d14013f449feafc885acd60ac480433d8&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

</details>

<details>
<summary>**🔨 Keep Functions Laser-Focused (SRP)**</summary>

A function should perform **one task**—and do it exceptionally well. This principle is known as the Single Responsibility Principle (**SRP**).

Good code is like a hammer: it drives one nail, not ten. For instance, hiring someone to handle all tasks in your company—finance, sales, marketing, janitorial work, etc.—is likely to lead to failure due to the inability to concentrate on a single task. The same principle applies to your code.

🚧 When a class or function attempts to accomplish multiple tasks, it becomes a convoluted mess. Debugging it feels like piecing together a puzzle upside down. If your class manages both user input and database operations, for example, it’s not multitasking—it’s chaos. Separate the responsibilities. One method, one job.

**🔥 My Rule:** Your code should work for you. Keep it sharp, focused, and manageable, or it will end up controlling you. Here’s how to achieve that:

```javascript
// Clean: One job, one focus
function calculateTotal(a, b) {
    return a + b;
}

function logTotal(user, total) {
    console.log(`User: ${user}, Total: ${total}`);
}

// Messy: Trying to do EVERYTHING
function calculateAndLogTotal(a, b, user) {
    let total = a + b;
    console.log(`User: ${user}, Total: ${total}`);
}
```

🪧 Mixing tasks leads to confusion. It's as simple as that.

</details>

<details>
<summary>**🚪 Use Comments Thoughtfully**</summary>

A well-known saying among professional developers is:

> “Code speaks for itself.”

You wouldn’t explain what a door does every time someone enters a room, would you? Your code should function similarly.

While comments are not inherently bad, if your code cannot stand alone, you may have a problem.

🪧 A good comment should clarify the “why” rather than the “how” or “what.” If a developer struggles to understand “how” something works, they will likely also struggle to grasp “why” it exists.

Here are examples of good versus bad comments, along with a real-world project illustrating clean commenting practices.

<details>
<summary>**Example 1:**</summary>

**Bad Comment 👎**

```javascript
// Multiply the price by the quantity to calculate the total
const total = price * quantity;
```

This is a **bad comment** because it merely reiterates what the code already conveys. The expression `price * quantity` is self-explanatory, rendering the comment unnecessary.

**Good Comment: 👍**

If the code is clear and straightforward, **you don’t need a comment.**

```javascript
const total = price * quantity;
```

![Good Commenting](https://cdn.hashnode.com/res/hashnode/image/upload/v1736165891398/6a942ad7-5b09-4990-9c7f-95358dafcbf3.png)

</details>

<details>
<summary>**Example 2:**</summary>

**Bad Comment 👎**

```javascript
// Check if the user logged in
function isUserLoggedIn(session) {
    return !!session.user;
}
```

This comment is ineffective because it fails to explain why the `isUserLoggedIn()` function exists. It merely describes what happens, which is already known since this is an authentication function. The comment is redundant.

**Good Example 👍**

```javascript
// The user is authenticated before accessing protected resources
function isUserLoggedIn(session) {
    return !!session.user;
}
```

This is a **good comment** because it explains **why** the code exists. It clarifies that the function checks whether the user is authenticated before granting access to sensitive areas of the application, focusing on the broader context.

![Good Comment Example](https://cdn.hashnode.com/res/hashnode/image/upload/v1736166143011/b3ddae3d-41cf-4534-8f1a-af710579922c.png)

</details>

</details>

<details>
<summary>**⚡ Best Practices for Writing Good Comments**</summary>
1. **Explain the “Why,” not the “What”:** Focus comments on the purpose or context of the code, rather than what the code is doing.
2. **Avoid obvious comments:** Refrain from commenting on aspects of the code that are already clear.
3. **Keep them short and precise:** Write concise comments that are easy to read and directly convey their purpose.
4. **Update comments regularly:** Outdated comments can mislead developers; always refresh them when the code changes.

<details>
<summary>**Real-World Example (with Good Comments) 🛒**</summary>

Let’s apply these practices in a real-world scenario: a large e-commerce application. Below is a function that calculates shipping costs based on order details. I will explain each comment below:

```javascript
// Shipping rules:
// - Free shipping for orders over $100
// - Standard shipping ($10) for orders below $100
// - Additional $5 for international orders

function calculateShipping(order) {
    let shippingCost = 0;

    // Check if the order qualifies for free shipping
    if (order.total >= 100) {
        shippingCost = 0; // Free shipping
    } else {
        shippingCost = 10; // Standard shipping cost
    }

    // Add additional cost for international orders
    if (order.isInternational) {
        shippingCost += 5;
    }

    return shippingCost;
}

// Example usage
const order1 = { total: 120, isInternational: false };
const order2 = { total: 80, isInternational: true };

console.log(calculateShipping(order1)); // Output: 0
console.log(calculateShipping(order2)); // Output: 15
```

At the start of the function, we include a comment explaining the rules for shipping costs. This provides the reader with an overview of the logic without needing to read the entire code.

```javascript
// Shipping rules:
// - Free shipping for orders over $100
// - Standard shipping ($10) for orders below $100
// - Additional $5 for international orders
```

The first condition checks if the order total is greater than or equal to $100. A comment here clarifies **why** free shipping is applied.

```javascript
// Check if the order qualifies for free shipping
if (order.total >= 100) {
    shippingCost = 0; // Free shipping
}
```

The second condition adds a charge for international shipping. The comment explains **why** the extra cost is incurred.

```javascript
// Add additional cost for international orders
if (order.isInternational) {
    shippingCost += 5;
}
```

**Why are these comments effective?**

Imagine a team of 20 developers working together. If someone revisits the `calculateShipping` function six months later, they could waste time guessing why international orders incur an extra fee. Good comments clarify the reasoning and save hours of frustration.

</details>

</details>

<details>
<summary>**🧩 Make Your Code Readable**</summary>

If someone reading your code feels like they’re solving a riddle, you’ve already created a problem. Here’s proof:

```javascript
// Clean: Reads like a story
if (isLoggedIn) {
    console.log("Welcome!");
} else {
    console.log("Please log in.");
}

// Messy: Feels like chaos
if(isLoggedIn){console.log("Welcome!");}else{console.log("Please log in.");}
```

Messy and hard-to-read code will confuse others—and even yourself later! Imagine returning to your own code after six months and feeling like you’re deciphering a foreign language. Readable code saves time, reduces bugs, and makes everyone's life easier.

<details>
<summary>**🍵 Why is Readability Important?**</summary>
1. **For yourself:** When you revisit your code after weeks or months, clean code helps you resume work without wasting time figuring out what you did.
2. **For your team:** If someone else reads your code, they shouldn’t have to solve a puzzle. Clean code facilitates smoother teamwork and prevents miscommunication.
3. **Fewer bugs:** Clear code is easier to debug because mistakes can be quickly identified.

</details>

<details>
<summary>**🧙‍♂️ How to Write Readable Code**</summary>

Let’s create a simple program to manage books in a library. We’ll ensure it is clean and readable, and I will break down the code below:

```javascript
// A class to represent a book
class Book {
    constructor(title, author, isAvailable) {
        this.title = title;
        this.author = author;
        this.isAvailable = isAvailable;
    }

    borrow() {
        if (this.isAvailable) {
            this.isAvailable = false;
            console.log(`You borrowed "${this.title}".`);
        } else {
            console.log(`Sorry, "${this.title}" is not available.`);
        }
    }

    returnBook() {
        this.isAvailable = true;
        console.log(`You returned "${this.title}".`);
    }
}

// A function to display available books
function displayAvailableBooks(books) {
    console.log("Available books:");
    books.forEach((book) => {
        if (book.isAvailable) {
            console.log(`- ${book.title} by ${book.author}`);
        }
    });
}

// Example usage
const book1 = new Book("The Clean Coder", "Robert Martin", true);
const book2 = new Book("You Don’t Know JS", "Kyle Simpson", false);
const book3 = new Book("Eloquent JavaScript", "Marijn Haverbeke", true);

const library = [book1, book2, book3];

displayAvailableBooks(library); // Show available books
book1.borrow(); // Borrow a book
displayAvailableBooks(library); // Show available books again
book1.returnBook(); // Return the book
displayAvailableBooks(library); // Final list
```

We created a `Book` class to represent each book, with properties like `title`, `author`, and `isAvailable` to track its status.

- The `borrow` method checks if the book is available. If so, it marks it as unavailable and prints a message.
- The `returnBook` method makes the book available again.
- The `displayAvailableBooks` function loops through the library and prints only the available books.
- We create three books (`book1`, `book2`, `book3`) and store them in a `library` array.
- We borrow and return books, demonstrating how the list of available books changes.

As you can see, readable code is not merely a stylistic choice. It saves time, prevents bugs, and keeps your code useful for years to come.

</details>

</details>

<details>
<summary>**🏌️ Test Everything You Write**</summary>

If you don’t invest time in writing tests, you shouldn’t be surprised if your code breaks. If you do want to write tests, follow this unit testing strategy to catch issues early.

<details>
<summary>**What Is Unit Testing?**</summary>

Unit testing involves checking individual parts of your code (such as functions or classes) to ensure they work correctly. It's akin to inspecting each brick of your house for soundness before constructing the walls.

Let me illustrate how unit testing works:

```javascript
class Calculator {
    add(a, b) { return a + b; }
    subtract(a, b) { return a - b; }
}

// Test it (Unit Test)
const calculator = new Calculator();
console.assert(calculator.add(2, 3) === 5, "Addition failed");
console.assert(calculator.subtract(5, 3) === 2, "Subtraction failed");
```

Here’s what’s happening in this code:

First, we create the `Calculator` class:

```javascript
class Calculator {
    add(a, b) { return a + b; }
    subtract(a, b) { return a - b; }
}
```

The `Calculator` class has two methods: `add` and `subtract`.

- `add(a, b)` takes two numbers and returns their sum.
- `subtract(a, b)` takes two numbers and returns their difference.

Next, we set up the tests:

```javascript
const calculator = new Calculator();
```

Here, we create an instance of the `Calculator` class to test its methods.

Then we write test cases:

```javascript
console.assert(calculator.add(2, 3) === 5, "Addition failed");
console.assert(calculator.subtract(5, 3) === 2, "Subtraction failed");
```

`console.assert(condition, message)` checks if the condition is `true`. If it’s `false`, the message ("Addition failed" or "Subtraction failed") is displayed in the console.

- **First test**: `calculator.add(2, 3) === 5`
- Calls the `add` method with `2` and `3`.
- Checks if the result is `5`.
- **Second test**: `calculator.subtract(5, 3) === 2`
- Calls the `subtract` method with `5` and `3`.
- Checks if the result is `2`.

What happens if something breaks? It’s straightforward to resolve any issues that arise. For example:

```javascript
console.assert(calculator.add(2, 3) === 6, "Addition failed");
```

- The condition `calculator.add(2, 3) === 6` is `false`.
- The console will display: `"Addition failed"`.

</details>

<details>
<summary>**Real-World Example: Testing a Login System 👥**</summary>

Let’s test a simple login system to see how unit testing operates in a real-world context.

```javascript
class Auth {
    login(username, password) {
        return username === "admin" && password === "1234";
    }
}

// Test the Auth class
const auth = new Auth();
console.assert(auth.login("admin", "et5t45#@") === true, "Login failed for valid credentials");
console.assert(auth.login("user", "wrongpassword") === false, "Login succeeded for invalid credentials");
```

First, we create the `Auth` class:

```javascript
class Auth {
    login(username, password) {
        return username === "admin" && password === "1234";
    }
}
```

The `login` method checks if the username is `"admin"` and the password is `"1234"`. If both match, it returns `true`; otherwise, it returns `false`.

Next, we set up the tests:

```javascript
const auth = new Auth();
```

We create an instance of the `Auth` class. Then we write the test cases:

```javascript
console.assert(auth.login("admin", "1234") === true, "Login failed for valid credentials");
console.assert(auth.login("user", "wrongpassword") === false, "Login succeeded for invalid credentials");
```

- **First test**: Checks if valid credentials (`"admin"`, `"1234"`) succeed. If not, `"Login failed for valid credentials"` is displayed.
- **Second test**: Checks if invalid credentials (`"user"`, `"wrongpassword"`) fail. If not, `"Login succeeded for invalid credentials"` is displayed.

</details>

<details>
<summary>**🌱 Why testing results in clean code:**</summary>
1. You naturally write smaller, more focused functions to make your code testable.
2. Tests verify that your code behaves as expected under different conditions.
3. With tests in place, you can confidently update your code, knowing the tests will catch any mistakes.

</details>

</details>

<details>
<summary>**💉 Use Dependency Injection**</summary>

Hardcoding dependencies is akin to tattooing someone's name on your forehead—it's permanent, potentially abrasive, and restricts your flexibility.

So, what does Dependency Injection do? It allows you to manage your code's dependencies by passing them as arguments. This approach is flexible, adaptable, and maintainable.

To illustrate how it works, consider the Nodemailer dependency for sending emails to users:

```javascript
// Dependency: Sending emails with Nodemailer
const nodemailer = require('nodemailer');
function sendEmail(to, subject, message) {
    const transporter = nodemailer.createTransport({ /* config */ });
    return transporter.sendMail({ from: "programmingwithshahan@gmail.com", to, subject, text: message });
}
```

⚠️ To mitigate risks, avoid **hardcoding** dependencies. Use abstraction or configuration files for secure maintenance.

This is just one example. As a developer, you may utilize hundreds of libraries or dependencies.

I'm not suggesting you should avoid dependencies entirely, as they are often unavoidable in modern development. However, you should exercise caution when incorporating them into your projects.

Always assess the security, performance, quality, or functionality of external libraries. Some may introduce risks that could jeopardize your entire project.

🚧 Always maintain control over your tools; don’t let them control you.

</details>

<details>
<summary>**📂 Clean Project Structures**</summary>

A well-organized project can mean the difference between a **messy heap** and a high-end **boutique**.

Here’s how each folder should be structured:

![Project Structure](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/9xwyg9iqqcybz21lsgxz.png)

If your codebase resembles a junk drawer, you’ve already created challenges for your future self.

Let’s analyze the clean project structure depicted above:

**1.** `myProject/src`

This is the main container for your entire application. Everything your app requires is stored within this folder, which contains subfolders to keep things organized.

**2.** `components`

This folder houses all the reusable elements of your app. You can utilize these components in multiple locations without needing to recreate them.

**3.** `services`

This is the "brain" of your app. It manages all the behind-the-scenes operations for both the frontend and backend. Example files in the `services` folder include `emailService.js`, `userService.js`, and `productService.js`.

**4.** `utils`

This folder contains all the small, handy tools necessary for your application to run smoothly. Common utility files might include `formatDate.js`, `validateEmail.js`, and `generateId.js`.

### **5.** **`tests`**

Conventionally, test files are typically located **outside** the `src` folder, at the project root level. This separation keeps your production code (`src`) distinct from your test code (`tests`), making it cleaner and easier to manage. Here’s a visual representation:

```bash
myProject/
├── src/              # Production code
│   ├── components/
│   ├── services/
│   └── utils/
├── tests/            # Test files
│   ├── components/
│   ├── services/
│   └── utils/
├── package.json      # Project configuration
└── README.md         # Documentation
```

Some developers may prefer creating a single testing file within the `tests` folder to test everything in one place. While this may seem clean initially, as your project grows, locating specific code blocks can become cumbersome. This approach can lead to unexpected testing results. Therefore, it is highly recommended to break them into multiple testing files within the `tests` folder.

<details>
<summary>**Real-world example 📧**</summary>

Let’s create a clean, durable project structure that you can apply to any future projects. A clean project structure is the foundation for building a maintainable application.

For our previous email-sending application example, here’s how the project structure should look:

![Email App Structure](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/6v6rlc5qiplgxz1h4dps.png)

As you can see, I organized every subfolder and file within the `src` folder, which serves as the main container for our application. Inside the `src` folder, we created `components`, `services`, and `utils`. Finally, we have a manageable `tests` folder outside the `src` folder to independently test each component. This test folder is separate from our production code located within the `src` folder.

</details>

</details>

<details>
<summary>**🤹‍♂️ Be Consistent with Formatting**</summary>

Avoid writing code as if you’re ten different people. Consistency in formatting is crucial.

Utilize tools like [Prettier](https://prettier.io/) or [ESLint](https://eslint.org/) to enforce a uniform style. If every file appears different, you’re creating chaos that no one wants to resolve.

I would argue that consistency in formatting is one of the most vital aspects of writing clean code.

Consider the following example:

```javascript
// Always use 2 spaces for indentation
function calculateArea(width, height) {
  if (width <= 0 || height <= 0) {
    throw new Error("Dimensions must be positive numbers.");
  }
  return width * height;
}

// Add meaningful whitespace for readability
const rectangle = {
  width: 10,
  height: 20,
};

// Clear separation of logic
try {
  const area = calculateArea(rectangle.width, rectangle.height);
  console.log(`Area: ${area}`);
} catch (error) {
  console.error(error.message);
}
```

Let’s examine some aspects of this code that contribute to its cleanliness:

### **1️⃣ Consistent Indentation**

Why use 2 or 4 spaces? It’s clean, minimal, and widely accepted in many JavaScript style guides. It doesn’t overwhelm the reader's eyes, and the code structure becomes clear. Mixing inconsistent indentation (2 spaces here, 4 spaces there) creates confusion—and confusion leads to mistakes.

### **2️⃣ Meaningful Whitespace: Giving Code Room to Breathe**

The extra line break between the rectangle definition and the `try` block acts like a pause in a sentence, allowing the reader to process the information.

### **3️⃣ Clear Separation of Logic: Modular Thinking**

```javascript
try {
  const area = calculateArea(rectangle.width, rectangle.height);
  console.log(`Area: ${area}`);
} catch (error) {
  console.error(error.message);
}
```

Observe how the logic is divided into clear sections:

- First, the calculation (`calculateArea` function).
- Then, the output (`console.log`).
- Finally, error handling (`catch` block).

Each task has its own space and purpose.

### **4️⃣ Readable Error Handling**

When you throw errors or log messages, format them clearly. Avoid vague or cryptic messages. A developer encountering this code will immediately understand the problem.

```javascript
throw new Error("Dimensions must be positive numbers.");
```

**🐦‍⬛ General tips for consistent formatting:**

- Use 2 or 4 spaces for indentation consistently throughout your codebase. Avoid tabs to maintain uniformity across different editors.
- Keep lines to a maximum of 100-120 characters to prevent horizontal scrolling and enhance readability.
- Group related logic together and separate blocks of code with blank lines to highlight their purpose.
- Finally, avoid over-aligning code. Instead, let indentation naturally guide the flow of logic.

</details>

<details>
<summary>**✋ Stop Hardcoding Values**</summary>

Hardcoding values is a lazy coding practice. Here’s the evidence:

```javascript
// Bad: Hardcoded and rigid
function createUser() {
    const maxUsers = 100;
    if (currentUsers >= maxUsers) throw "Too many users!";
}

// Clean: Dynamic and flexible
const MAX_USERS = 100;
function createUser() {
    if (currentUsers >= MAX_USERS) throw "Too many users!";
}
```

By storing fixed values in a global configuration (config) file, you ensure that changing this variable won’t catch you off guard in the future. You will know precisely where to find it to modify uncertain values.

Avoid hardcoding values at all costs. It’s a shortcut that may frustrate your future self (or others).

</details>

<details>
<summary>**🤏 Keep Functions Short**</summary>

If your function exceeds 20 lines, it’s likely attempting to accomplish too much.

Short functions are effective functions. They consistently hit their target.

Long, bloated functions are messy and difficult to read, while short functions are clear and focused. Here’s how to break down larger functions:

```javascript
function updateCart(cart, item) {
    addItemToCart(cart, item);
    let total = calculateTotal(cart);
    logTransaction(item, total);
    return total;
}

function addItemToCart(cart, item) {
    cart.items.push(item);
}
```

Let me clarify why breaking down large functions is a winning strategy:

1. **The Main Function:** `updateCart()` calls smaller helper functions to handle specific tasks such as:
   - Adding the item to the cart.
   - Calculating the total price.
   - Logging the transaction details.
   - Finally, returning the total price.

Instead of a lengthy block of code attempting to do everything, it delegates tasks to helper functions.

2. **Helper Function:** `addItemToCart()` solely manages the addition of the item to the cart. If you need to change how items are added (for instance, checking for duplicates), you can simply edit this small function instead of sifting through a massive block of code in `updateCart`. This is how you write clean, maintainable functions.

<details>
<summary>**What Happens If Functions Are Too Long? 💤**</summary>

Let’s consider a scenario where the `updateCart` function remains unbroken. Here’s how it might appear:

```javascript
function updateCart(cart, item) {
    cart.items.push(item);
    let total = 0;
    for (let i = 0; i < cart.items.length; i++) {
        total += cart.items[i].price;
    }
    console.log(`Added ${item.name}. Total is now $${total}.`);
    return total;
}
```

What are the issues here?

- It attempts to do everything.
- It’s difficult to read, especially as it grows larger.
- If something malfunctions, you’ll waste time determining which part is the issue.

Now the choice is yours: adhere to the messy all-in-one approach or adopt the clean one-function-one-job mindset.

</details>

</details>

<details>
<summary>**⛺ Follow the Boy Scout Rule**</summary>
> Always leave your campsite cleaner than you found it.

Let me clarify. You don’t just use something and leave it in worse condition. That’s inconsiderate. True professionals leave things better than they found them.

In coding terms, every time you interact with the codebase, **make it better.** Clean it up, refactor messy sections, and enhance readability. If you neglect this, you’re simply piling on garbage that will eventually overwhelm you.

Here’s an example. Instead of improving the code, we’re merely adding more layers of complexity:

```javascript
// Original code: Hard to read, poorly named variables
function calc(a, b) {
  let x = a + b;
  let y = x * 0.2;
  return y;
}

// We're adding to it but not cleaning it up
function calcDiscount(a, b, discountRate) {
  let total = calc(a, b);
  let final = total - discountRate;
  return final;
}
```

After improvement, the code becomes clearer. Here’s how a disciplined coder operates—they enhance the code as they go:

```javascript
// Improved code: Clear names, refactored for clarity
function calculateSubtotal(price, quantity) {
  return price * quantity;
}

function calculateDiscountedTotal(price, quantity, discountRate) {
  const subtotal = calculateSubtotal(price, quantity);
  const discount = subtotal * discountRate;
  return subtotal - discount;
}
```

Now, anyone can quickly grasp what’s happening. We’ve broken down the code into smaller, more focused functions. Thus, adding new features won’t compromise existing functionality. 🏕️

</details>

<details>
<summary>**🏟️ Follow the Open/Closed Principle**</summary>

This design principle suggests that your code should be structured to allow extensions without altering the existing foundation.

You want to add features—without dismantling everything every time you upgrade. Modifying old code to accommodate new requirements is akin to attempting to rebuild your house every time you purchase new furniture. It’s not sustainable.

Let’s explore how to create smarter, scalable code that enables feature additions without disrupting everything else.

<details>
<summary>**Before: Violating the principle**</summary>

Consider a class designed to handle payments—simple enough. Initially, it only processes credit card payments.

However, your boss requests, _“Hey, now we need PayPal support.”_

If you haven’t learned clean coding practices, your code may resemble a tangled mess reminiscent of a legacy enterprise system from 1995. Here’s the convoluted masterpiece you’ve crafted:

```javascript
class PaymentProcessor {
  processPayment(paymentType, amount) {
    if (paymentType === "creditCard") {
      console.log(`Processing credit card payment of $${amount}`);
    } else if (paymentType === "paypal") {
      console.log(`Processing PayPal payment of $${amount}`);
    } else {
      throw new Error("Unsupported payment type");
    }
  }
}

const paymentProcessor = new PaymentProcessor();
paymentProcessor.processPayment("creditCard", 100);
paymentProcessor.processPayment("paypal", 200);
```

Alas! Each new payment type (like Apple Pay, Google Pay, etc.) necessitates modifying the `processPayment` method. Consequently, you risk breaking existing functionality while adding new features. Had you learned this principle, you might have avoided this predicament.

</details>

<details>
<summary>**Don’t worry: I’ll help you to fix this**</summary>

First, we need to refactor the code. Instead of modifying the existing class, we’ll extend its functionality using [polymorphism](https://stackify.com/oop-concept-polymorphism/):

```javascript
// Base class
class PaymentProcessor {
  processPayment(amount) {
    throw new Error("processPayment() must be implemented");
  }
}

// Credit card payment
class CreditCardPayment extends PaymentProcessor {
  processPayment(amount) {
    console.log(`Processing credit card payment of $${amount}`);
  }
}

// PayPal payment
class PayPalPayment extends PaymentProcessor {
  processPayment(amount) {
    console.log(`Processing PayPal payment of $${amount}`);
  }
}

// Adding a new payment type? Just extend the class!
class ApplePayPayment extends PaymentProcessor {
  processPayment(amount) {
    console.log(`Processing Apple Pay payment of $${amount}`);
  }
}

// Usage
const payments = [
  new CreditCardPayment(),
  new PayPalPayment(),
  new ApplePayPayment(),
];

payments.forEach((payment) => payment.processPayment(100));
```

Now, adding new payment methods does not require altering the existing `PaymentProcessor` class. You simply create a new subclass. This means the original code remains untouched, eliminating the risk of breaking existing features.

Each payment type has its own class, and adding PayPal payment support, for instance, won’t disrupt the code. You can confidently respond to your boss: _“Of course, I can add this feature in five minutes.”_ Your promotion is within reach.

</details>

</details>

### **Modern Best Practices to Help You Write Clean Code: A Summary 🥷**

Now, let me summarize the best practices and outline our 12 Clean Code design principles to assist you in writing clean code for Agile application development.

<details>
<summary>**🔎 Common Code Smells and How to Fix Them**</summary>
- 💊 Duplication: If you're copying code, you’re creating more work for yourself. Extract it into a function and do it right.
- 🛤️ Long methods: If your method requires a scroll bar, it's doing too much. Break it down and keep it focused.
- 👑 King objects: No class should handle everything. Simplify responsibilities, or your codebase will become chaotic.

</details>

<details>
<summary>**💬 Effective Commenting Practices**</summary>
- 💭 When to comment: Only comment if the code isn't clear. If it is, comments are just clutter.
- 🫗 Clarity: Comments should explain why, not what. If your code requires explanation, it might be too complex.
- 🌴 Avoid redundancy: Don't comment on what's obvious. If your function is called `addNumbers`, don't state that it does so.

</details>

<details>
<summary>**🧼 Refactoring Techniques for Clean Code**</summary>
- 🏭 Extract methods: Big methods? Break them down. It's not just about cleanliness—it's about control.
- 🫕 Rename variables: If your variable names don’t clearly convey their purpose, change and improve them. Precision in naming reflects precision in thought.
- 🍃 Simplify conditionals: If your conditionals resemble algebra, simplify them. Instead of writing `if (a == true)`, simply write `if (a)`.

</details>

<details>
<summary>**🧪 Testing and Clean Code**</summary>
- 🧙 Unit tests: Test every piece of code as if you're interrogating a suspect. Leave no stone unturned.
- 🏇 TDD (Test Driven Development): Write tests first. It's not just about catching bugs; it's about knowing exactly what your code should do before you write it.
- 🧽 Clean tests: Your tests should be as clean as your code. If they're messy, they won’t be helpful.

</details>

<details>
<summary>**🐛 Error Handling and Clean Code**</summary>
- ⁉️ Exceptions: Use them. They're not just for errors; they're also for keeping your code free from error clutter.
- 🖍️ Fail fast: If something's wrong, stop right there. Don’t allow errors to accumulate. Address them immediately.
- 🚨 Logging: Log as if you're documenting a crime scene. Be clear, precise, and include only what's necessary.

</details>

<details>
<summary>**🌱 Code Reviews and Clean Code**</summary>
- 🚢 Process: Establish a system. No cowboy coding. Review, critique, and improve.
- 🔪 Tools: Utilize tools that simplify reviews. They not only catch mistakes but also promote discipline.
- 🧦 Culture: Foster a culture where feedback is valued. Help your team learn how to give and receive critiques.

</details>

### **Automated Tools for Maintaining Clean Code ⚓**

Utilizing tools and automation techniques can significantly aid in writing clean code. If you’re not leveraging the right tools and automating processes to save time, you’re missing out.

Do you think you can "eyeball" your way through code quality? Think again. Without automation, you risk:

1. 👎 Missing obvious mistakes because you're "too busy."
2. 🤕 Having inconsistent code styles across files, making collaboration a nightmare.
3. 🪦 Breaking deployments due to overlooked critical tests.

Successful developers employ the right tools to automate code quality and streamline their workflows. Here are four strategies for maintaining clean code using modern tools.

<details>
<summary>**1️⃣ Static Analysis**</summary>

Static analysis serves as a code inspector that reviews your code and identifies potential issues early on. The best part? It operates **before** runtime, catching errors that could lead to crashes, downtime, or embarrassing bugs.

<details>
<summary>**How does it work?**</summary>
1. **Syntax checking**: It scans your code to ensure everything is written in correct syntax. If you misspell a variable or forget a closing bracket, it will alert you immediately.
2. **Code quality rules**: Tools like ESLint enforce rules regarding consistent indentation, avoiding unused variables, and adhering to best practices.
3. **Error prevention**: It identifies logical errors, such as using undefined variables or making nonsensical comparisons.

</details>

<details>
<summary>**🚨 Before static analysis:**</summary>

```javascript
let sum = (a, b) => { return a + b; }
console.log(sume(2, 3)); // Typo, unnoticed until runtime
```

- **Problem**: The typo in `sume` will only trigger an error when the code runs, potentially leading to frustrating debugging sessions or worse—breaking the app in production.

</details>

<details>
<summary>**🚑 After static analysis (using ESLint):**</summary>

```javascript
codeError: 'sume' is not defined.
```

- **Solution**: [ESLint](https://eslint.org/) immediately flags the typo before you even run the code, catching the error early and saving you time and headaches.

</details>

</details>

<details>
<summary>**2️⃣ Automated Code Formatting**</summary>
<details>
<summary>**Before Formatting:**</summary>

```javascript
function calculate ( x , y ){ return x+ y;}
console.log( calculate (2,3 ) )
```

- **Problem**: Inconsistent spacing and formatting make the code harder to read.

</details>

<details>
<summary>**After using Prettier:**</summary>

```javascript
function calculate(x, y) {
  return x + y;
}
console.log(calculate(2, 3));
```

- **Solution**: Clean, consistent, and professional formatting is applied automatically. No more nitpicking over spaces or alignment.

This is basic knowledge, but I included it for those who might be coding in environments without an IDE (for example, during job interviews).

</details>

</details>

<details>
<summary>**3️⃣ Continuous Integration (CI) Testing**</summary>

CI testing ensures that every new change to your code is verified automatically. It acts as a safety net that catches bugs introduced during development. CI tools run your tests every time you push code, preventing issues after deployment.

**How Does CI Testing Work?**

1. **Triggers on change**: Each time code is committed, the CI tool (like [GitHub Actions](https://github.com/features/actions), [Jenkins](https://www.jenkins.io/)) runs automated tests.
2. **Feedback**: It provides instant feedback if something fails.
3. **Prevents broken code**: Only clean, functional code is merged into the main branch.

</details>

<details>
<summary>**4️⃣ CI/CD pipelines**</summary>

CI/CD pipelines represent a continuous process that includes code building, testing, and deployment, while CI testing is a part of that process focused on automating the testing of code changes.

**Difference between CI/CD pipelines and CI testing:**

- **CI/CD pipelines:** A CI/CD pipeline integrates code building, testing, and deployment into a single process. This ensures that all changes to the main branch code are ready for production. CI/CD pipelines can reduce deployment time, lower costs, and enhance team collaboration.
- **CI testing:** CI testing is the automated testing of code changes integrated into a central repository. It focuses on ensuring the codebase is stable and resolving integration issues. CI testing helps developers build stable, bug-free software that meets functional requirements.

🚧 This is the essence of CI testing and CI/CD pipelines. It’s not as complex as it seems. Let me elaborate further on CI testing with GitHub Actions, as we typically run tests through automated tools today.

</details>

<details>
<summary>**⚡ Continuous Integration (CI) Testing with GitHub Actions**</summary>

As previously mentioned, CI tools run automated tests every time you push code or open a pull request. This guarantees that only working, bug-free code gets merged into the main branch.

<details>
<summary>**How to Set Up CI Testing with GitHub Actions**</summary>
<details>
<summary>**Step 1: Create Your Repository**</summary>

Set up a GitHub repository for your project, then push your code to GitHub using the following commands:

```bash
git init
git add .
git commit -m "Initial commit for CI Testing"
git branch -M main
git remote add origin https://github.com/codewithshahan/codewithshahan.git
git push -u origin main
```

Alternatively, you can create a new repository from your GitHub account without using the command line. Simply log in to your GitHub account and navigate to the dashboard, where you will find a “New” button to create a new repository:

![Create New Repository](https://cdn.hashnode.com/res/hashnode/image/upload/v1737618697327/dcef8be8-0d08-45d7-8000-34c4c65df425.png)

</details>

<details>
<summary>**Step 2: Add a GitHub Actions Workflow**</summary>

Navigate to your repository’s **Actions** tab. To do this, first visit your repository on GitHub (you will find the link after creating your repository). In this case, I created a new repository called “codewithshahan.” Look for the **Actions** tab on the right side of the navigation bar.

![Actions Tab](https://cdn.hashnode.com/res/hashnode/image/upload/v1737618879398/7c5aa37a-72be-4701-a8f8-9ea9e05c0d5d.png)

After navigating to the Actions tab, scroll down slightly to find the **continuous integration** section:

![Continuous Integration Section](https://cdn.hashnode.com/res/hashnode/image/upload/v1737619002674/60003e57-f2b2-48f1-bef8-9bde39149faf.png)

Select a setup workflow for yourself. For this project, I will use Node.js.

After clicking the configure button, a `node.js.yml` file will be created automatically. You can adjust the code based on your project goals.

![Node.js Workflow](https://cdn.hashnode.com/res/hashnode/image/upload/v1737619475568/74da6d46-c105-42c8-8662-fc72e9410bda.png)

I won’t delve into details about how to modify your `.yml` file, as it depends on your project goals and personal preferences. Additionally, this is a broader topic that I will cover in a future article. For now, focus on this foundational knowledge.

</details>

This CI Testing workflow is optimal for modern application development. Your app remains stable while incorporating key features, including testing (e.g., Dark Mode), building, and deploying applications directly within your GitHub repository. This way, you can push your code confidently, knowing it is always clean and ready for production.

</details>

</details>

### **The Role of Documentation in Agile Software Development 🚣**

To ensure your code is top-notch, you need to understand how to write effective documentation. If you think documentation is merely about jotting down how the code works, you’re mistaken. It's about explaining **why** it works, not just how it works. That’s where many people falter.

<details>
<summary>**1. 🚡 Create Useful Docs (Explain Why, Not Just How)**</summary>

When writing documentation, you're not just providing instructions on how to use the code. You're explaining to the next person (or yourself in the future) why this piece of code exists in the first place. That’s the distinction between good and bad documentation.

Poor documentation leaves people confused. It’s often too vague or simplistic, failing to address critical questions. If your documentation is unclear, it likely reflects unclear thinking. You’re essentially saying, _"I don’t care if you understand this; it works, just use it."_ That’s not helpful.

Great documentation answers the tough questions:

- ✅ Why did you choose this approach over another?
- ✅ Why does this function exist? What problem does it solve?
- ✅ Why did you write this code the way you did?

If your documentation merely reiterates how to use the code, you’re not being as helpful as you could be. Start thinking more deeply and explain the reasoning behind everything.

</details>

<details>
<summary>**2. ⏳ Keep the Docs Updated (Outdated Docs Are Worse Than No Docs)**</summary>

Outdated documentation is detrimental. In fact, it can be worse than having no documentation at all. Leaving documentation that is out of sync with the code is a disservice to your future self—or anyone else who has to deal with it next.

Every time your code changes, your documentation must change as well. It should reflect the current state of affairs. Don’t mislead future developers (or yourself) by leaving outdated information that will confuse them and waste their time. If something is no longer relevant, delete it. Outdated documentation is akin to a cluttered mind—it hinders progress.

Make it a habit to regularly check and update your documentation. The moment a line of code changes, so should your documentation. Period.

</details>

<details>
<summary>**3. 🚆 Integrate Comments (Good Comments in Code Are Part of Documentation)**</summary>

Here’s the deal: comments in your code should **integrate** with your documentation. Good comments aren’t just a crutch for developers who can’t explain their code elsewhere; they should enhance your documentation, not replace it.

Comments are supplements to your documentation. Write clean, understandable code that requires minimal explanation, but when something isn’t crystal clear, include a comment. Remember the rule for comments in your code: explain the **why**, not the **how**. This principle applies here as well. Avoid redundancy. Let your code communicate effectively. Comments should complement the broader context of your documentation, not serve as a band-aid for sloppy code.

🪧 Great code should be self-explanatory. Fix the code, and then add comments for clarification if necessary. Keep comments clean, concise, and to the point.

If you want to write clean, efficient, and maintainable code, documentation is key. Stop viewing documentation as an afterthought or something to fill space. It’s an extension of your code—your means of communicating clearly and effectively. It serves as your roadmap for future developers and reflects your thought process.

</details>

### **Conclusion 🏁**

Clean code isn't merely a luxury—it's a necessity for those who aspire to excel. It embodies control, efficiency, and continuous improvement over time. Ultimately, it will help you succeed in the realm of Agile software development.

🪧 If you aim to master your craft, commit to writing clean code and let your efficiency speak for itself.

### **Frequently Asked Questions About Clean Code 🧯**

1. **What is clean code?** It’s code that doesn’t make you want to throw your laptop out the window.
2. **Why is clean code important in Agile?** Because Agile is about speed and change, and you can't be quick with a mess.
3. **What are code smells?** Indicators that you’re on the verge of losing control of your codebase.
4. **How can I improve commenting?** Only comment on what's necessary, ensuring each comment adds value, not noise.