# [Standard Name] - Coding Standard

> **Standard ID**: STD-XXX
> **Document Version**: 1.0
> **Last Updated**: YYYY-MM-DD
> **Status**: Draft | In Review | Active
> **Scope**: [What this standard applies to]
> **Enforcement**: [Manual | Automated | Hybrid]
> **Related Documents**:
>
> - [Process Guide](../00-process/process-guide.md) - Stage 3d: Coding Standards
> - [Validation Checklist](./validation-checklist.md)
> - [Other relevant standards...]

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory standards for [area of concern] in TypeScript/Node.js projects. These standards ensure consistency, maintainability, and quality across AI-generated and human-written code.

### 1.2 Scope

**Applies to**:

- [What this standard covers]
- [Specific file types, components, or areas]

**Does NOT apply to**:

- [Explicit exclusions]
- [Edge cases that are handled elsewhere]

### 1.3 Enforcement Level

| Level      | Meaning                                                | Mechanism             |
| ---------- | ------------------------------------------------------ | --------------------- |
| **MUST**   | Mandatory; violations block code review                | ESLint rule, CI check |
| **SHOULD** | Strongly recommended; exceptions require justification | Code review           |
| **MAY**    | Optional; team preference                              | Documentation only    |

---

## 2. Guiding Principles

<!--
PURPOSE: 3-5 high-level principles that inform all rules in this standard.
These help readers understand the "why" behind specific rules.
-->

| Principle     | Description                             |
| ------------- | --------------------------------------- |
| [Principle 1] | [Brief description of why this matters] |
| [Principle 2] | [Brief description of why this matters] |
| [Principle 3] | [Brief description of why this matters] |

---

## 3. [Main Content Section]

<!--
PURPOSE: The core rules and patterns. Structure varies by standard type.
See specialized templates for detailed section guidance.
-->

[Content organized by logical groupings...]

---

## 4. Anti-Patterns

<!--
PURPOSE: Explicitly document what NOT to do.
Critical for AI code generation - models need clear "forbidden" patterns.
-->

### 4.1 Forbidden Patterns

| Pattern     | Why Forbidden | Detection       | Severity             |
| ----------- | ------------- | --------------- | -------------------- |
| [Pattern 1] | [Explanation] | [How to detect] | Critical/High/Medium |
| [Pattern 2] | [Explanation] | [How to detect] | Critical/High/Medium |

### 4.2 Common Mistakes

| Mistake        | Correct Approach     |
| -------------- | -------------------- |
| [Common error] | [How to do it right] |
| [Common error] | [How to do it right] |

---

## 5. Enforcement

### 5.1 Automated Checks

| Rule        | Tool       | Configuration          |
| ----------- | ---------- | ---------------------- |
| [Rule name] | ESLint     | `rule-name: "error"`   |
| [Rule name] | TypeScript | `compilerOption: true` |

### 5.2 Code Review Checklist

- [ ] [Verification item 1]
- [ ] [Verification item 2]
- [ ] [Verification item 3]

### 5.3 CI/CD Integration

```yaml
# Example CI configuration
steps:
  - name: Lint Check
    run: npm run lint
```

---

## 6. Exceptions

### 6.1 When Rules Can Be Broken

| Exception    | Justification Required    | Approval       |
| ------------ | ------------------------- | -------------- |
| [Scenario 1] | [What must be documented] | [Who approves] |
| [Scenario 2] | [What must be documented] | [Who approves] |

### 6.2 Documenting Exceptions

When an exception is necessary, document it with:

```typescript
/**
 * STANDARD EXCEPTION: STD-XXX Rule X.X
 * Reason: [Why this exception is necessary]
 * Approved: [Date, Approver]
 */
```

---

## 7. Quick Reference

<!--
PURPOSE: One-page cheat sheet of the most important rules.
Designed for quick lookup during development.
-->

### 7.1 Summary Table

| Category   | Rule           | Example         |
| ---------- | -------------- | --------------- |
| [Category] | [Rule summary] | [Quick example] |
| [Category] | [Rule summary] | [Quick example] |

### 7.2 Decision Tree

```
When deciding [X]:
├─ If [condition A]: Do [action A]
├─ If [condition B]: Do [action B]
└─ Otherwise: Do [default action]
```

---

## 8. Traceability

### 8.1 Related Standards

| Standard | Relationship      |
| -------- | ----------------- |
| STD-XXX  | [How they relate] |
| STD-XXX  | [How they relate] |

### 8.2 Requirement Coverage

| Requirement         | Rules       |
| ------------------- | ----------- |
| [HL-XXX or NFR-XXX] | Section X.X |

---

## 9. Open Questions

| Question ID | Question              | Owner  | Status  |
| ----------- | --------------------- | ------ | ------- |
| SQ-001      | [Unresolved question] | [Name] | Pending |

---

## Document History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | YYYY-MM-DD | [Name] | Initial version |
