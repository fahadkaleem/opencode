# [Standard Name] - Coding Standard

> **Standard ID**: STD-XXX
> **Document Version**: 1.0
> **Last Updated**: YYYY-MM-DD
> **Status**: Draft | In Review | Active
> **Scope**: [What this standard applies to]
> **Enforcement**: Manual Review + Structural Checks
> **Related Documents**:
>
> - [Base Standard Template](./base-standard-template.md) - Common structure reference
> - [Validation Checklist](./validation-checklist.md) - Use before marking Active
> - [Process Guide](../00-process/process-guide.md) - Stage 3d: Coding Standards

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory [architecture/design] patterns for TypeScript/Node.js projects. These patterns provide structural guidance for organizing code, handling cross-cutting concerns, and maintaining consistency across the codebase.

### 1.2 Scope

**Applies to**:

- [Specific areas covered]

**Does NOT apply to**:

- [Exclusions]

### 1.3 Enforcement Level

| Level      | Meaning             | Mechanism                               |
| ---------- | ------------------- | --------------------------------------- |
| **MUST**   | Mandatory pattern   | Architecture review, structural linting |
| **SHOULD** | Recommended pattern | Code review                             |
| **MAY**    | Optional pattern    | Team discretion                         |

---

## 2. Guiding Principles

| Principle              | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| Separation of Concerns | Each component has single, well-defined responsibility      |
| Dependency Direction   | Dependencies flow inward; core has no external dependencies |
| Explicit over Implicit | Patterns are documented and visible in code structure       |
| Testability            | Patterns enable isolated unit testing                       |

---

## 3. Architectural Overview

<!--
TEMPLATE NOTE: Pattern-based standards benefit from visual diagrams
showing how patterns relate to each other.
-->

### 3.1 Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      [Layer Name 1]                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Component A │  │ Component B │  │ Component C │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ [Allowed dependency direction]
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      [Layer Name 2]                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Component D │  │ Component E │  │ Component F │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      [Layer Name 3]                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Layer Responsibilities

| Layer     | Responsibility | Contains          | Depends On             |
| --------- | -------------- | ----------------- | ---------------------- |
| [Layer 1] | [Purpose]      | [Component types] | [Allowed dependencies] |
| [Layer 2] | [Purpose]      | [Component types] | [Allowed dependencies] |
| [Layer 3] | [Purpose]      | [Component types] | None                   |

### 3.3 Dependency Rules

| From Layer | To Layer  | Allowed | Rationale       |
| ---------- | --------- | ------- | --------------- |
| [Layer 1]  | [Layer 2] | Yes     | [Why allowed]   |
| [Layer 1]  | [Layer 3] | No      | [Why forbidden] |
| [Layer 2]  | [Layer 1] | No      | [Why forbidden] |

---

## 4. Patterns

<!--
TEMPLATE NOTE: Each pattern includes when to use, structure,
implementation template, and complete example.
-->

### 4.1 [Pattern Name]

#### 4.1.1 When to Use

Use this pattern when:

- [Condition 1]
- [Condition 2]

Do NOT use this pattern when:

- [Anti-condition 1]
- [Anti-condition 2]

#### 4.1.2 Structure

```
[PatternName]/
├── [file1].ts      # [Purpose]
├── [file2].ts      # [Purpose]
└── index.ts        # [Purpose]
```

#### 4.1.3 Implementation Template

```typescript
/**
 * [Pattern Name] implementation for [domain].
 *
 * Responsibility:
 * - [Primary responsibility]
 * - [Secondary responsibility]
 *
 * Dependencies:
 * - [Required dependency 1]
 * - [Required dependency 2]
 */
export class [PatternName][Role] {
  constructor(
    private readonly [dependency1]: [Type1],
    private readonly [dependency2]: [Type2],
  ) {}

  /**
   * [Method description]
   * @param [param] - [Parameter description]
   * @returns [Return description]
   * @throws [ErrorType] - [When thrown]
   */
  async [methodName]([param]: [Type]): Promise<[ReturnType]> {
    // [Implementation notes]
  }
}
```

#### 4.1.4 Complete Example

```typescript
// File: src/services/userService.ts

import { UserRepository } from '../repositories/userRepository.js';
import { NotFoundError, ValidationError } from '../errors/index.js';
import type { User, CreateUserInput } from '../types/user.js';

/**
 * UserService handles user-related business logic.
 *
 * Responsibility:
 * - User creation with validation
 * - User retrieval with error handling
 *
 * Dependencies:
 * - UserRepository for data access
 */
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Creates a new user with validation.
   * @param input - User creation data
   * @returns Created user
   * @throws ValidationError - If input is invalid
   */
  async createUser(input: CreateUserInput): Promise<User> {
    this.validateInput(input);
    return this.userRepository.create(input);
  }

  /**
   * Retrieves user by ID.
   * @param userId - User identifier
   * @returns User if found
   * @throws NotFoundError - If user does not exist
   */
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(`User not found: ${userId}`);
    }
    return user;
  }

  private validateInput(input: CreateUserInput): void {
    if (!input.email?.includes('@')) {
      throw new ValidationError('Invalid email format');
    }
  }
}
```

---

### 4.2 [Pattern Name]

#### 4.2.1 When to Use

[Continue pattern for additional patterns...]

---

## 5. Role Definitions

<!--
TEMPLATE NOTE: Pattern-based standards must clearly define
the responsibility of each role/suffix.
-->

### 5.1 Component Roles

| Role Suffix   | Responsibility                | State          | Dependencies                 |
| ------------- | ----------------------------- | -------------- | ---------------------------- |
| `*Service`    | Stateless business logic      | None           | Repositories, other Services |
| `*Manager`    | Lifecycle/resource management | May have state | Services, external resources |
| `*Repository` | Data access abstraction       | None           | Database/storage             |
| `*Handler`    | Event/request processing      | None           | Services                     |
| `*Factory`    | Object creation               | None           | Varies                       |
| `*Validator`  | Input/data validation         | None           | Schemas                      |

### 5.2 Role Selection Flowchart

```
What does this component do?
├─ Encapsulates business logic → Service
├─ Manages resources/lifecycle → Manager
├─ Abstracts data storage → Repository
├─ Processes events/requests → Handler
├─ Creates complex objects → Factory
├─ Validates data → Validator
└─ None of the above → Reconsider design
```

### 5.3 Role Examples

| Scenario     | Correct Role | Incorrect Role | Why           |
| ------------ | ------------ | -------------- | ------------- |
| [Scenario 1] | [Correct]    | [Incorrect]    | [Explanation] |
| [Scenario 2] | [Correct]    | [Incorrect]    | [Explanation] |

---

## 6. Interaction Patterns

### 6.1 [Interaction Name]

**Flow Diagram**:

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Caller  │     │ Layer 1 │     │ Layer 2 │     │ Layer 3 │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  1. Request   │               │               │
     │──────────────▶│               │               │
     │               │  2. Delegate  │               │
     │               │──────────────▶│               │
     │               │               │  3. Execute   │
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │  4. Result    │
     │               │               │◀──────────────│
     │               │  5. Transform │               │
     │               │◀──────────────│               │
     │  6. Response  │               │               │
     │◀──────────────│               │               │
```

**Steps**:

1. [Description of step 1]
2. [Description of step 2]
3. [Description of step 3]
4. [Description of step 4]
5. [Description of step 5]
6. [Description of step 6]

---

## 7. Anti-Patterns

### 7.1 Forbidden Patterns

| Anti-Pattern     | Problem           | Correct Pattern    |
| ---------------- | ----------------- | ------------------ |
| [Anti-pattern 1] | [What goes wrong] | [Correct approach] |
| [Anti-pattern 2] | [What goes wrong] | [Correct approach] |

### 7.2 Forbidden Dependencies

| From             | To               | Why Forbidden |
| ---------------- | ---------------- | ------------- |
| [Component type] | [Component type] | [Explanation] |

### 7.3 Code Smell Examples

```typescript
// ANTI-PATTERN: [Name]
// Problem: [What's wrong with this]
[incorrect code]

// CORRECT PATTERN: [Name]
// Solution: [How this fixes the problem]
[correct code]
```

---

## 8. Decision Trees

### 8.1 [Decision Name]

```
When implementing [X]:
│
├─ Is it stateless business logic?
│   ├─ Yes → Create a Service
│   └─ No ─┐
│          │
├─ Does it manage resources?
│   ├─ Yes → Create a Manager
│   └─ No ─┐
│          │
├─ Does it abstract storage?
│   ├─ Yes → Create a Repository
│   └─ No ─┐
│          │
└─ Reconsider the design
```

### 8.2 [Decision Name]

```
[Another decision tree...]
```

---

## 9. Enforcement

### 9.1 Structural Validation

| Check                | Tool   | Configuration |
| -------------------- | ------ | ------------- |
| Dependency direction | [Tool] | [Config]      |
| Layer boundaries     | [Tool] | [Config]      |
| Pattern compliance   | [Tool] | [Config]      |

### 9.2 Architecture Review Checklist

- [ ] Components follow single responsibility principle
- [ ] Dependencies flow in correct direction
- [ ] No forbidden cross-layer dependencies
- [ ] Correct role suffix used for each component
- [ ] Patterns applied consistently

### 9.3 Directory Structure Validation

```
Expected structure:
src/
├── commands/       # [What belongs here]
├── services/       # [What belongs here]
├── repositories/   # [What belongs here]
├── types/          # [What belongs here]
└── utils/          # [What belongs here]
```

---

## 10. Exceptions

### 10.1 Valid Exception Scenarios

| Scenario     | Justification    | Documentation Required |
| ------------ | ---------------- | ---------------------- |
| [Scenario 1] | [Why acceptable] | [What to document]     |

### 10.2 Exception Documentation

```typescript
/**
 * ARCHITECTURE EXCEPTION: STD-XXX Section 4.1
 * Reason: [Why this exception is necessary]
 * Trade-off: [What we're giving up]
 * Approved: [Date]
 */
```

---

## 11. Quick Reference

### 11.1 Pattern Selection Matrix

| Need     | Pattern   | Example         |
| -------- | --------- | --------------- |
| [Need 1] | [Pattern] | [Example class] |
| [Need 2] | [Pattern] | [Example class] |

### 11.2 Layer Quick Reference

| Layer   | Purpose   | Example Components |
| ------- | --------- | ------------------ |
| [Layer] | [Purpose] | [Examples]         |

### 11.3 Dependency Direction Summary

```
[Layer 1] → [Layer 2] → [Layer 3]
    │           │           │
    └───────────┴───────────┘
    Dependencies flow downward only
```

---

## 12. Traceability

### 12.1 Pattern Index

| Pattern ID | Name   | Section | When to Use         |
| ---------- | ------ | ------- | ------------------- |
| PAT-001    | [Name] | 4.1     | [Brief description] |
| PAT-002    | [Name] | 4.2     | [Brief description] |

### 12.2 Related Standards

| Standard | Relationship      |
| -------- | ----------------- |
| STD-XXX  | [How they relate] |

---

## 13. Open Questions

| Question ID | Question              | Owner  | Status  |
| ----------- | --------------------- | ------ | ------- |
| SQ-001      | [Unresolved question] | [Name] | Pending |

---

## Document History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | YYYY-MM-DD | [Name] | Initial version |
