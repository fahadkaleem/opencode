# [Standard Name] - Coding Standard

> **Standard ID**: STD-XXX
> **Document Version**: 1.0
> **Last Updated**: YYYY-MM-DD
> **Status**: Draft | In Review | Active
> **Scope**: [What this standard applies to]
> **Enforcement**: Automated + Manual Review
> **Related Documents**:
>
> - [Base Standard Template](./base-standard-template.md) - Common structure reference
> - [Validation Checklist](./validation-checklist.md) - Use before marking Active
> - [Process Guide](../00-process/process-guide.md) - Stage 3d: Coding Standards

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory [naming/style/workflow] rules for TypeScript/Node.js projects. These rules are designed to be unambiguous for both human developers and AI code generation.

### 1.2 Scope

**Applies to**:

- [Specific areas covered]

**Does NOT apply to**:

- [Exclusions]

### 1.3 Enforcement Level

| Level      | Meaning                            | Mechanism       |
| ---------- | ---------------------------------- | --------------- |
| **MUST**   | Mandatory; violations block merge  | ESLint, CI      |
| **SHOULD** | Recommended; exceptions documented | Code review     |
| **MAY**    | Optional                           | Team preference |

---

## 2. Guiding Principles

| Principle            | Description                            |
| -------------------- | -------------------------------------- |
| Clarity over brevity | [Names/rules] must convey full meaning |
| Consistency          | Same patterns across entire codebase   |
| No ambiguity         | Single interpretation in any context   |
| Enforceable          | Rules can be automated where possible  |

---

## 3. Rules

<!--
TEMPLATE NOTE: Rule-based standards organize content as discrete rules
with correct/incorrect examples. Each rule follows this structure.
-->

### 3.1 [Rule Category 1]

#### Rule 3.1.1: [Rule Title]

| Attribute       | Value                   |
| --------------- | ----------------------- |
| **Enforcement** | MUST / SHOULD / MAY     |
| **Automation**  | ESLint rule / Manual    |
| **Applies to**  | [What this rule covers] |

**Rule Statement**:
[Entity type] SHALL [use/follow/be] [specific pattern] so that [rationale].

**Correct Examples**:

```typescript
// CORRECT: [Explanation of why this is correct]
[code example]

// CORRECT: [Another valid variation]
[code example]
```

**Incorrect Examples**:

```typescript
// INCORRECT: [Explanation of the violation]
[code example]

// INCORRECT: [Another common mistake]
[code example]
```

**Rationale**:
[Why this rule exists and what problems it prevents]

---

#### Rule 3.1.2: [Rule Title]

| Attribute       | Value                   |
| --------------- | ----------------------- |
| **Enforcement** | MUST / SHOULD / MAY     |
| **Automation**  | ESLint rule / Manual    |
| **Applies to**  | [What this rule covers] |

**Rule Statement**:
[Entity type] SHALL [use/follow/be] [specific pattern] so that [rationale].

**Correct Examples**:

```typescript
// CORRECT: [Explanation]
[code example]
```

**Incorrect Examples**:

```typescript
// INCORRECT: [Explanation]
[code example]
```

**Rationale**:
[Why this rule exists]

---

### 3.2 [Rule Category 2]

#### Rule 3.2.1: [Rule Title]

[Continue pattern for additional rules...]

---

## 4. Lookup Tables

<!--
TEMPLATE NOTE: Rule-based standards benefit from summary tables
that can be quickly referenced during development.
-->

### 4.1 [Category] Reference

| Entity     | Convention | Example        |
| ---------- | ---------- | -------------- |
| [Entity 1] | [Pattern]  | `exampleName`  |
| [Entity 2] | [Pattern]  | `ExampleName`  |
| [Entity 3] | [Pattern]  | `EXAMPLE_NAME` |

### 4.2 [Category] Prefixes/Suffixes

| Prefix/Suffix | When to Use | Example           |
| ------------- | ----------- | ----------------- |
| `*Prefix`     | [Condition] | `isPrefixExample` |
| `*Suffix`     | [Condition] | `exampleSuffix`   |

### 4.3 Vocabulary Reference

| Verb/Term | Purpose       | Example Usage   |
| --------- | ------------- | --------------- |
| [Term 1]  | [When to use] | `termExample()` |
| [Term 2]  | [When to use] | `termExample()` |

---

## 5. Anti-Patterns

### 5.1 Forbidden Patterns

| Pattern       | Why Forbidden | Correct Alternative |
| ------------- | ------------- | ------------------- |
| [Bad pattern] | [Explanation] | [Good pattern]      |
| [Bad pattern] | [Explanation] | [Good pattern]      |
| [Bad pattern] | [Explanation] | [Good pattern]      |

### 5.2 Common Violations

```typescript
// VIOLATION: [Description of common mistake]
[incorrect code]

// FIX: [How to correct it]
[correct code]
```

---

## 6. Decision Flowcharts

<!--
TEMPLATE NOTE: For rules with conditional logic, provide
decision trees that eliminate ambiguity.
-->

### 6.1 [Decision Name]

```
When choosing [X]:
├─ If [condition A]:
│   └─ Use [pattern A]
├─ If [condition B]:
│   └─ Use [pattern B]
├─ If [condition C] AND [condition D]:
│   └─ Use [pattern C]
└─ Default:
    └─ Use [default pattern]
```

### 6.2 [Decision Name]

```
[Another decision tree...]
```

---

## 7. Enforcement

### 7.1 ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Rule 3.1.1: [Rule Title]
    '[eslint-rule-name]': [
      'error',
      {
        /* options */
      },
    ],

    // Rule 3.1.2: [Rule Title]
    '[eslint-rule-name]': 'error',
  },
};
```

### 7.2 TypeScript Configuration

```json
{
  "compilerOptions": {
    // Enforces [rule description]
    "[option]": true
  }
}
```

### 7.3 Pre-commit Hook

```bash
#!/bin/bash
# Validates [standard name] before commit
npm run lint -- --rule '[rule-name]: error'
```

### 7.4 Code Review Checklist

- [ ] All [entities] follow [convention] pattern
- [ ] No forbidden patterns present
- [ ] Exceptions are documented with justification
- [ ] New [entities] are consistent with existing codebase

---

## 8. Exceptions

### 8.1 Valid Exception Scenarios

| Scenario                      | Justification                          | Documentation Required       |
| ----------------------------- | -------------------------------------- | ---------------------------- |
| Third-party API compatibility | External API uses different convention | Comment with API reference   |
| Legacy code migration         | Gradual migration in progress          | Migration ticket reference   |
| Framework requirements        | Framework mandates specific pattern    | Framework documentation link |

### 8.2 Exception Documentation Format

```typescript
/**
 * NAMING EXCEPTION: STD-XXX Rule 3.1.1
 * Reason: Matches external API field name for compatibility.
 * Reference: https://api.example.com/docs#field-names
 */
export interface ExternalApiResponse {
  field_name: string; // Exception: external API uses snake_case
}
```

### 8.3 Exception Registry

| Exception ID | Rule  | Location           | Justification | Expiry    |
| ------------ | ----- | ------------------ | ------------- | --------- |
| EX-001       | 3.1.1 | `src/api/types.ts` | External API  | Permanent |

---

## 9. Quick Reference

### 9.1 Casing Summary

| Entity Type | Convention  | Example       |
| ----------- | ----------- | ------------- |
| [Type 1]    | camelCase   | `entityName`  |
| [Type 2]    | PascalCase  | `EntityName`  |
| [Type 3]    | UPPER_SNAKE | `ENTITY_NAME` |
| [Type 4]    | kebab-case  | `entity-name` |

### 9.2 Most Common Rules

1. **[Rule summary 1]**: [Quick description]
2. **[Rule summary 2]**: [Quick description]
3. **[Rule summary 3]**: [Quick description]

### 9.3 Cheat Sheet

```
[Entity A] → [Pattern]     Example: [example]
[Entity B] → [Pattern]     Example: [example]
[Entity C] → [Pattern]     Example: [example]
```

---

## 10. Traceability

### 10.1 Rules Index

| Rule ID | Title   | Enforcement | Automation |
| ------- | ------- | ----------- | ---------- |
| 3.1.1   | [Title] | MUST        | ESLint     |
| 3.1.2   | [Title] | SHOULD      | Manual     |
| 3.2.1   | [Title] | MUST        | TypeScript |

### 10.2 Related Standards

| Standard | Relationship        |
| -------- | ------------------- |
| STD-XXX  | Extends/Complements |
| STD-XXX  | References          |

---

## 11. Open Questions

| Question ID | Question              | Owner  | Status  |
| ----------- | --------------------- | ------ | ------- |
| SQ-001      | [Unresolved question] | [Name] | Pending |

---

## Document History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | YYYY-MM-DD | [Name] | Initial version |
