# Shared Schemas - Index

> **Document Version**: 1.0
> **Last Updated**: 2025-12-04
> **Status**: Draft
> **Related Documents**:
>
> - [Integration Overview](../overview.md)
> - [Shared Schema Template](../../../../templates/03-architecture/integration/shared-schema-template.md)

---

## 1. Overview

This directory contains shared type definitions used by multiple FlowMaster components. These schemas ensure type consistency across component boundaries and prevent integration failures due to mismatched data structures.

### 1.1 Purpose

Shared schemas are created when:

- A data structure is used by 2+ components
- Type consistency is critical for integration
- One component owns/creates the data, others consume it

### 1.2 Schema ID Convention

Schemas follow the format: **SCH-XXX**

---

## 2. Schema Catalog

| Schema ID | Name               | Owner                     | Consumers                                           | Document                                               |
| --------- | ------------------ | ------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| SCH-002   | Agent Hierarchy    | COMP-007 (Agent Manager)  | COMP-008 (Orchestrator)                             | [02-agent-hierarchy.md](./02-agent-hierarchy.md)       |
| SCH-003   | Workflow Reference | COMP-002 (Config Manager) | COMP-005 (Context Manager), COMP-008 (Orchestrator) | [03-workflow-reference.md](./03-workflow-reference.md) |

---

## 3. Schema Summaries

### 3.1 SCH-002: Agent Hierarchy

**Purpose**: Represents parent-child relationships between agents at runtime for clarification routing.

**Key Types**:

- `AgentHierarchy` - Full hierarchy with parent chain
- `AgentNode` - Single agent in hierarchy
- `AgentLevel` - Enum: workflow, phase, command
- `AgentState` - Enum: created, running, paused, completed, failed, terminated
- `AgentContextScope` - What context an agent can access

**Primary Use Cases**:

- Clarification routing (OR-OP-061)
- Agent spawning (AM-OP-001)
- Parent-child tracking (FR-AM-005)

---

### 3.2 SCH-003: Workflow Reference

**Purpose**: Enables workflow composition via `uses:` syntax, similar to GitHub Actions.

**Key Types**:

- `WorkflowReference` - Reference to child workflow
- `InputMapping` - Parent context → child input mapping
- `ExportMapping` - Child output → parent context mapping
- `SubWorkflowResult` - Result of sub-workflow execution
- `FailureStrategy` - Enum: fail, continue, fallback

**Primary Use Cases**:

- Workflow composition (OR-OP-050)
- Context transformation (CM-OP-021, CM-OP-022)
- YAML parsing (CF-OP-005)

---

## 4. Planned Schemas

The following schemas are identified but not yet extracted:

| Schema ID | Name             | Description                           | Source                                  |
| --------- | ---------------- | ------------------------------------- | --------------------------------------- |
| SCH-001   | Error Types      | Unified error codes across components | 01-message-bus.md, multiple             |
| SCH-004   | Message Types    | MessageBus message type definitions   | 01-message-bus.md                       |
| SCH-005   | Task State       | Task and phase state structures       | 03-state-manager.md                     |
| SCH-006   | Execution Result | Command and phase execution results   | 07-agent-manager.md, 08-orchestrator.md |

---

## 5. Usage Pattern

### 5.1 Referencing Schemas in Contracts

Contracts reference shared schemas in their "Imported Types" section (Section 5.0):

```markdown
### 5.0 Imported Types

| Type                | Source                                                           | Description                      |
| ------------------- | ---------------------------------------------------------------- | -------------------------------- |
| `AgentHierarchy`    | [Agent Hierarchy Schema](../schemas/02-agent-hierarchy.md)       | Parent-child agent relationships |
| `WorkflowReference` | [Workflow Reference Schema](../schemas/03-workflow-reference.md) | Child workflow reference         |
```

### 5.2 Schema Ownership

- **Owner**: Component that creates/defines the canonical instance
- **Consumers**: Components that read/use the schema
- Only the owner can make breaking changes to the schema

---

## 6. Schema Numbering Convention

| Range | Category                                             |
| ----- | ---------------------------------------------------- |
| 00    | Index and meta-documents                             |
| 01-09 | Infrastructure types (errors, identifiers, messages) |
| 10-19 | State and persistence types                          |
| 20-29 | Execution and workflow types                         |
| 30-39 | Agent and tool types                                 |
| 40-49 | UI and Gateway types                                 |

---

## Document History

| Version | Date       | Author            | Changes                             |
| ------- | ---------- | ----------------- | ----------------------------------- |
| 1.0     | 2025-12-04 | Architecture Team | Initial index with SCH-002, SCH-003 |
