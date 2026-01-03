# [Component Name] - Interface Contract

> **Component ID**: COMP-XXX
> **Document Version**: 1.0
> **Last Updated**: YYYY-MM-DD
> **Status**: Draft | In Review | Approved
> **Owner**: [Name]
> **Related Documents**:
>
> - [Integration Overview](../overview.md)
> - [Component Requirements](../../requirements/[component].md)

---

## 1. Overview

### 1.1 Purpose

This document defines the interface contract for **[Component Name]**, specifying what operations it provides to other components and what operations it requires from other components.

### 1.2 Component Summary

| Attribute                    | Value                   |
| ---------------------------- | ----------------------- |
| **Component ID**             | COMP-XXX                |
| **Responsibility**           | [From Architecture doc] |
| **Provides Interfaces To**   | COMP-XXX, COMP-XXX      |
| **Requires Interfaces From** | COMP-XXX, COMP-XXX      |

### 1.3 Contract ID Convention

Operations follow the format: **[COMP]-OP-XXX**

Example: `OR-OP-001` for Orchestrator Operation 001

---

## 2. Provided Interfaces

<!--
PURPOSE: Define all interfaces this component EXPOSES to other components.
These are operations that other components can call.
-->

### 2.1 Interface: [Interface Name]

<!--
GROUP related operations under a named interface.
-->

**Purpose**: [What this interface is for]

**Consumers**: COMP-XXX, COMP-XXX

---

#### [COMP]-OP-001: [Operation Name]

| Attribute        | Value                      |
| ---------------- | -------------------------- |
| **Operation ID** | [COMP]-OP-001              |
| **Type**         | Synchronous / Asynchronous |
| **Implements**   | FR-XX-XXX                  |

**Purpose**: [What this operation does]

**Request Schema**:

| Field       | Type   | Required | Constraints      | Description   |
| ----------- | ------ | -------- | ---------------- | ------------- |
| `fieldName` | string | Yes      | 1-100 chars      | [Description] |
| `fieldName` | number | Yes      | > 0              | [Description] |
| `fieldName` | object | No       | See [SchemaName] | [Description] |

**Response Schema**:

| Field       | Type    | Description   |
| ----------- | ------- | ------------- |
| `fieldName` | string  | [Description] |
| `fieldName` | boolean | [Description] |

**Preconditions**:

<!--
What must be true BEFORE this operation is called.
If precondition is violated, the operation will fail with an error.
-->

- [Precondition 1 - e.g., "Caller must have active session"]
- [Precondition 2 - e.g., "Referenced resource must exist"]

**Postconditions**:

<!--
What is GUARANTEED after successful completion.
-->

- [Postcondition 1 - e.g., "Resource is created and persisted"]
- [Postcondition 2 - e.g., "Event [EventName] is published"]

**Error Conditions**:

| Error Code          | Condition          | Caller Action           |
| ------------------- | ------------------ | ----------------------- |
| `ERR_INVALID_INPUT` | [When this occurs] | [What caller should do] |
| `ERR_NOT_FOUND`     | [When this occurs] | [What caller should do] |
| `ERR_UNAUTHORIZED`  | [When this occurs] | [What caller should do] |

**Example**:

```json
// Request
{
  "fieldName": "example value",
  "fieldName": 42
}

// Response (Success)
{
  "fieldName": "result",
  "fieldName": true
}

// Response (Error)
{
  "error": {
    "code": "ERR_INVALID_INPUT",
    "message": "Field 'fieldName' is required"
  }
}
```

---

#### [COMP]-OP-002: [Operation Name]

| Attribute        | Value                      |
| ---------------- | -------------------------- |
| **Operation ID** | [COMP]-OP-002              |
| **Type**         | Synchronous / Asynchronous |
| **Implements**   | FR-XX-XXX                  |

**Purpose**: [What this operation does]

[Continue pattern for each operation...]

---

### 2.2 Interface: [Another Interface Name]

[Continue pattern for each interface group...]

---

## 3. Required Interfaces

<!--
PURPOSE: Define all interfaces this component REQUIRES from other components.
These are dependencies - operations this component calls on others.
-->

### 3.1 Dependencies on COMP-XXX ([Component Name])

| Operation     | Purpose                       | When Called         |
| ------------- | ----------------------------- | ------------------- |
| [COMP]-OP-XXX | [Why this component needs it] | [Trigger condition] |

**Assumptions**:

<!--
What this component assumes about the dependency.
-->

- [Assumption 1 - e.g., "Operation will respond within 500ms"]
- [Assumption 2 - e.g., "Returned data will be valid"]

**Failure Handling**:

<!--
What this component does if the dependency fails.
-->

- If timeout: [Action]
- If error response: [Action]
- If unavailable: [Action]

---

### 3.2 Dependencies on COMP-XXX ([Component Name])

[Continue pattern for each dependency...]

---

## 4. Events Published

<!--
PURPOSE: List all events this component publishes.
Details are in the Message Catalog; this is a summary.
-->

| Event       | When Published      | Subscribers        | Catalog Reference               |
| ----------- | ------------------- | ------------------ | ------------------------------- |
| [EventName] | [Trigger condition] | COMP-XXX, COMP-XXX | [messages/catalog.md#eventname] |

---

## 5. Events Subscribed

<!--
PURPOSE: List all events this component subscribes to.
-->

| Event       | Publisher | Handler Behavior                               |
| ----------- | --------- | ---------------------------------------------- |
| [EventName] | COMP-XXX  | [What this component does when event received] |

---

## 6. Invariants

<!--
PURPOSE: Rules that must ALWAYS hold true for this component.
These are enforced at all times, not just during specific operations.
-->

| Invariant        | Description                | Enforcement         |
| ---------------- | -------------------------- | ------------------- |
| [Invariant name] | [What must always be true] | [How it's enforced] |

**Example**:
| Invariant | Description | Enforcement |
|-----------|-------------|-------------|
| Single active workflow | At most one workflow can be active per task | Check before starting new workflow |
| Agent hierarchy | Every agent (except root) has exactly one parent | Validated on agent creation |

---

## 7. Performance Expectations

<!--
PURPOSE: Document performance expectations for this component's interfaces.
These become part of the contract.
-->

| Operation     | Expected Latency | Throughput  | Notes            |
| ------------- | ---------------- | ----------- | ---------------- |
| [COMP]-OP-001 | < [X]ms p95      | [Y] req/sec | [Any conditions] |
| [COMP]-OP-002 | < [X]ms p95      | [Y] req/sec | [Any conditions] |

---

## 8. Versioning and Compatibility

<!--
PURPOSE: Document how this interface evolves.
-->

### 8.1 Current Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Interface Version**          | 1.0   |
| **Backwards Compatible Since** | 1.0   |

### 8.2 Deprecation Policy

[How deprecated operations are handled, e.g., "Deprecated operations are marked and supported for 2 releases before removal"]

### 8.3 Breaking Changes

| Version                                                | Change | Migration Path |
| ------------------------------------------------------ | ------ | -------------- |
| [If any breaking changes have occurred, document them] |

---

## 9. Traceability

### 9.1 FR to Operation Mapping

| Functional Requirement | Operations                   |
| ---------------------- | ---------------------------- |
| FR-XX-001              | [COMP]-OP-001, [COMP]-OP-002 |
| FR-XX-002              | [COMP]-OP-003                |

### 9.2 Operation Index

| Operation ID  | Name   | Type  | Implements |
| ------------- | ------ | ----- | ---------- |
| [COMP]-OP-001 | [Name] | Sync  | FR-XX-001  |
| [COMP]-OP-002 | [Name] | Async | FR-XX-002  |

---

## Document History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | YYYY-MM-DD | [Name] | Initial version |
