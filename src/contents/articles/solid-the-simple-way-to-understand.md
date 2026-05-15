---
title: "SOLID - The Simple Way To Understand"
description: "A lot of people, when I ask about SOLID, propably always remember of the first principle (Single Responsability Principle). But when I ask about another, some people don't remember or feel difficult to explain. AND I UNDERSTAND."
publishedDate: February 27, 2025
category: Backend
poster: https://prod-files-secure.s3.us-west-2.amazonaws.com/effcaeb0-736a-4d67-81a8-ab23b54a0483/185f305e-e9c1-4cfc-ac60-032aa285b1db/solid-principle.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466Q57TF5AS%2F20260515%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260515T002713Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEJ%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQDvllwdl63SReSYgXeobBZq%2FKLl1VPhMZXK1y%2Bs6er0hgIgE0Gr3Gv%2FsUnzDUpyPHV5PSudZW3NDshIjwwhW2Z5ytMq%2FwMIaBAAGgw2Mzc0MjMxODM4MDUiDJhPVISWajEBxit29yrcAwVZrYzOf8M0I%2FmEl331CQm6NjKUp5DOvtR743sw%2BPJVqzWnyqJq%2FXw8yX1QQL%2FuwdnOglOCgXymkHDzz5rqJFBnqgh%2BXo8OQGT6zA%2B9rJCLQ2DXxVV8K%2BaQhCqcbLKnK0vrsliNBUsWlr3dp1nx08i0RguSrZ0dbDLztmz9TLeDDl01Z%2BEGwlpKseGMUzOQUnEBe3APS2YDeEY2cBLSYWkJDtml6jah74ZMp9%2Bkfr4dfO%2BBMEyXKWqf8enYat5EIaPm4kxIU5j0Uw7PE7%2BvLp5sPCWy7OLDiZbcvlzdZpAneaOUJ%2BMg7O9VgeaROvw4LY%2FEV4K%2FE2gFE4cQNO9rxOzUnvfhS2BE0%2FgB4qcWD%2B752zqEIg0LPzFk3xTbEH%2FsF2TZJhtTJ6v%2Fl%2F2ckbLN6isBZd7kdCq0KSt0LKsCw3Mmfywq8npZa9fDelcJsHd%2FghjHEGakB9NveQ3TWTBnS%2BjC%2B6tdkQwYNnpm2Ye3%2FmhcqjUFHLvO1w3NQRLctTRmhBZpBgJHA4iD82jfkW7rYoC6nzdvSi8wCthkYJHXx17w9SLoFfp6S04Iw5oaWqo8tmros4mmTnQUQdxS1Nm%2BCwQXbauiGre8Zcm2AWnyqT4zqZqdrqLIyQcPxRVoMNulmdAGOqUBoxLXZuswCowNpeFfSGQVe8FGNNzess6S9yaqc%2F6IeWj%2BQpvCpzscBXin2ogjLdl06bLMyesCW2wlxXGXbOL8QEgQvJwvaQrRpZZKwozBOGm8a8TAmnfOkFT8lZ2TKiOCKtHv2m%2FLPtY09VIAXbyAPbOfGMCFmOD9slEnpM2E0D37Dw2GbBTFeyeSBa8QUIq3akyoV9QFxcR3Lj7WgKEbP3Gaq5NR&X-Amz-Signature=a496a1bd3b14834b2ece761219af2bee2e589f2b4be96017bd5f455e7f54cd6f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject
---
## **SOLID - A Clear Understanding**

Hello! I hope this message finds you well.

Today, I want to delve into a topic that is frequently discussed in the software development community: SOLID principles. While many people can recall the first principle, the Single Responsibility Principle, they often struggle to articulate the others. I completely understand this challenge.

Explaining these principles can be daunting without coding examples or definitions. In this article, I aim to present each principle in a straightforward manner, using TypeScript for illustration.

Let’s get started!

### **Single Responsibility Principle - SRP**

This principle is the most straightforward to grasp and remember.

While coding, it’s often easy to spot when we overlook this principle.

Consider the following `TaskManager` class:

```typescript
class TaskManager {
  constructor() {}
  connectAPI(): void {}
  createTask(): void {
    console.log("Create Task");
  }
  updateTask(): void {
    console.log("Update Task");
  }
  removeTask(): void {
    console.log("Remove Task");
  }
  sendNotification(): void {
    console.log("Send Notification");
  }
  sendReport(): void {
    console.log("Send Report");
  }
}
```

Have you noticed the problem here?

The `TaskManager` class is burdened with multiple responsibilities that do not belong to it, such as the `sendNotification` and `sendReport` methods.

Let’s refactor this to adhere to the Single Responsibility Principle:

```typescript
class APIConnector {
  constructor() {}
  connectAPI(): void {}
}

class Report {
  constructor() {}
  sendReport(): void {
    console.log("Send Report");
  }
}

class Notificator {
  constructor() {}
  sendNotification(): void {
    console.log("Send Notification");
  }
}

class TaskManager {
  constructor() {}
  createTask(): void {
    console.log("Create Task");
  }
  updateTask(): void {
    console.log("Update Task");
  }
  removeTask(): void {
    console.log("Remove Task");
  }
}
```

Simple, right? We have separated the notification and report functionalities into their respective classes, thereby respecting the Single Responsibility Principle.

**Definition:** `Each class must have one, and only one, reason to change.`

### **Open Closed Principle - OCP**

The second principle is also relatively easy to comprehend. A useful tip: if you find yourself writing numerous conditions within a method, you might be violating the OCP.

Let’s look at an example involving an `Exam` class:

```typescript
type ExamType = {
  type: "BLOOD" | "XRay";
};

class ExamApprove {
  constructor() {}
  approveRequestExam(exam: ExamType): void {
    if (exam.type === "BLOOD") {
      if (this.verifyConditionsBlood(exam)) {
        console.log("Blood Exam Approved");
      }
    } else if (exam.type === "XRay") {
      if (this.verifyConditionsXRay(exam)) {
        console.log("XRay Exam Approved!");
      }
    }
  }

  verifyConditionsBlood(exam: ExamType): boolean {
    return true;
  }
  verifyConditionsXRay(exam: ExamType): boolean {
    return false;
  }
}
```

You may have encountered similar code before. Here, we are not only violating the first principle (SRP) but also cluttering our code with multiple conditions.

Now, imagine if a new examination type, such as ultrasound, is introduced. We would need to add another method and condition to handle it.

Let’s refactor this code:

```typescript
type ExamType = {
  type: "BLOOD" | "XRay";
};

interface ExamApprove {
  approveRequestExam(exam: NewExamType): void;
  verifyConditionExam(exam: NewExamType): boolean;
}

class BloodExamApprove implements ExamApprove {
  approveRequestExam(exam: ExamApprove): void {
    if (this.verifyConditionExam(exam)) {
      console.log("Blood Exam Approved");
    }
  }
  verifyConditionExam(exam: ExamApprove): boolean {
    return true;
  }
}

class RayXExamApprove implements ExamApprove {
  approveRequestExam(exam: ExamApprove): void {
    if (this.verifyConditionExam(exam)) {
      console.log("RayX Exam Approved");
    }
  }
  verifyConditionExam(exam: NewExamType): boolean {
    return true;
  }
}
```

Much better! Now, if a new examination type is introduced, we simply implement the `ExamApprove` interface. Any new verification methods can also be added without modifying existing code.

**Definition:** `Software entities (such as classes and methods) must be open for extension but closed for modification.`

### **Liskov Substitution Principle - LSP**

This principle can be one of the more challenging concepts to grasp. However, I will simplify it for you.

Imagine you have a university with two types of students: regular students and postgraduate students.

```typescript
class Student {
  constructor(public name: string) {}

  study(): void {
    console.log(`${this.name} is studying`);
  }

  deliverTCC() {
    /** Problem: Postgraduate students don't deliver TCC */
  }
}

class PostgraduateStudent extends Student {
  study(): void {
    console.log(`${this.name} is studying and researching`);
  }
}
```

Here, we have a problem: while `PostgraduateStudent` extends `Student`, it does not need to deliver a TCC.

To resolve this, we can separate the responsibilities of graduation and postgraduate students:

```typescript
class Student {
  constructor(public name: string) {}

  study(): void {
    console.log(`${this.name} is studying`);
  }
}

class StudentGraduation extends Student {
  study(): void {
    console.log(`${this.name} is studying`);
  }

  deliverTCC() {}
}

class StudentPostGraduation extends Student {
  study(): void {
    console.log(`${this.name} is studying and researching`);
  }
}
```

Now we have a clearer separation of responsibilities. While the name of this principle may seem intimidating, its essence is straightforward.

**Definition:** `Derived classes (or child classes) must be able to replace their base classes (or parent classes).`

### **Interface Segregation Principle - ISP**

To grasp this principle, remember that a class should not be compelled to implement methods it does not use.

Consider a scenario involving a Seller and a Receptionist in a shop. Both have salaries, but only the Seller earns a commission.

Let’s examine the issue:

```typescript
interface Employee {
  salary(): number;
  generateCommission(): void;
}

class Seller implements Employee {
  salary(): number {
    return 1000;
  }
  generateCommission(): void {
    console.log("Generating Commission");
  }
}

class Receptionist implements Employee {
  salary(): number {
    return 1000;
  }
  generateCommission(): void {
    /** Problem: Receptionist doesn't have a commission */
  }
}
```

Both classes implement the `Employee` interface, but the Receptionist is forced to implement a method that is irrelevant to its role.

Here’s the solution:

```typescript
interface Employee {
  salary(): number;
}

interface Commissionable {
  generateCommission(): void;
}

class Seller implements Employee, Commissionable {
  salary(): number {
    return 1000;
  }

  generateCommission(): void {
    console.log("Generating Commission");
  }
}

class Receptionist implements Employee {
  salary(): number {
    return 1000;
  }
}
```

Now, we have two distinct interfaces: one for employees and another for commissionable roles. The Seller implements both interfaces, while the Receptionist only implements the Employee interface, thus avoiding unnecessary method implementations.

**Definition:** `A class should not be forced to implement interfaces and methods that will not be used.`

### **Dependency Inversion Principle - DIP**

Finally, we arrive at the last principle. While its name may sound complex, you likely encounter this principle frequently.

Consider a `Service` class that interacts with a `Repository` class, which in turn communicates with a database, such as PostgreSQL. If the repository changes to use MongoDB, for instance, we face a problem.

Let’s look at the example:

```typescript
interface Order {
  id: number;
  name: string;
}

class OrderRepository {
  constructor() {}
  saveOrder(order: Order) {}
}

class OrderService {
  private orderRepository: OrderRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
  }

  processOrder(order: Order) {
    this.orderRepository.saveOrder(order);
  }
}
```

Here, the `OrderService` class is tightly coupled with the concrete implementation of the `OrderRepository` class.

Let’s refactor this example:

```typescript
interface Order {
  id: number;
  name: string;
}

class OrderRepository {
  constructor() {}
  saveOrder(order: Order) {}
}

class OrderService {
  private orderRepository: OrderRepository;

  constructor(repository: OrderRepository) {
    this.orderRepository = repository;
  }

  processOrder(order: Order) {
    this.orderRepository.saveOrder(order);
  }
}
```

Much better! Now, the repository is passed as a parameter to the constructor, allowing us to depend on abstractions rather than concrete implementations.

**Definition:** `Depend on abstractions rather than concrete implementations.`