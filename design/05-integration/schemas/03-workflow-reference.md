# Workflow Reference - Shared Schema Definition

> **Schema ID**: SCH-003
> **Document Version**: 1.0
> **Last Updated**: 2025-12-04
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Integration Overview](../overview.md)
> - [Configuration Manager Contract](../contracts/02-configuration-manager.md)
> - [Context Manager Contract](../contracts/05-context-manager.md)
> - [Orchestrator Contract](../contracts/08-orchestrator.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the **Workflow Reference** schema, a shared data structure enabling workflow composition. It allows parent workflows to delegate to child workflows using a `uses:` syntax similar to GitHub Actions.

### 1.2 Schema Summary

| Attribute                   | Value                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| **Schema ID**               | SCH-003                                                                        |
| **Schema Name**             | WorkflowReference                                                              |
| **Owner (Source of Truth)** | COMP-002 (Configuration Manager)                                               |
| **Consumers**               | COMP-002 (Config Manager), COMP-005 (Context Manager), COMP-008 (Orchestrator) |

### 1.3 Why This Is Shared

The Workflow Reference schema represents how workflows compose other workflows. It is shared because:

1. **Configuration Manager** parses `uses:` from YAML workflow definitions
2. **Context Manager** uses `InputMapping`/`ExportMapping` to transform context between parent and child
3. **Orchestrator** executes sub-workflows via `invokeSubWorkflow()` (OR-OP-050)
4. **Inconsistent definitions** would break workflow composition and context passing

---

## 2. Schema Definition

### 2.1 WorkflowReference

| Field              | Type                   | Required | Constraints                      | Description                                    |
| ------------------ | ---------------------- | -------- | -------------------------------- | ---------------------------------------------- |
| `workflow`         | string                 | Yes      | Valid workflow name, 1-100 chars | ID/name of child workflow to execute           |
| `name`             | string                 | No       | 1-100 chars                      | Display name override for this invocation      |
| `version`          | string                 | No       | Valid semver constraint          | Version constraint (e.g., "^1.0.0", ">=2.0.0") |
| `inputs`           | Record<string, string> | No       | Valid expressions                | Maps parent context to child workflow inputs   |
| `exports`          | string[]               | No       | Valid variable names             | Output variable names to capture from child    |
| `needs`            | string[]               | No       | Valid phase/workflow names       | Dependencies that must complete first          |
| `condition`        | string                 | No       | Valid expression                 | Conditional execution expression               |
| `onFailure`        | FailureStrategy        | No       | See 2.2                          | Failure handling strategy                      |
| `fallbackWorkflow` | string                 | No       | Valid workflow name              | Fallback workflow if onFailure='fallback'      |
| `timeout`          | number                 | No       | > 0                              | Timeout override in milliseconds               |
| `maxRetries`       | number                 | No       | >= 0                             | Max retries override                           |

### 2.2 FailureStrategy Enum

| Value      | Description                                    | Requires                 |
| ---------- | ---------------------------------------------- | ------------------------ |
| `fail`     | Parent workflow fails if child fails (default) | -                        |
| `continue` | Parent continues even if child fails           | -                        |
| `fallback` | Execute fallback workflow on failure           | `fallbackWorkflow` field |

### 2.3 InputMapping

Used by Context Manager to transform parent context to child inputs.

| Field          | Type    | Required | Constraints           | Description                             |
| -------------- | ------- | -------- | --------------------- | --------------------------------------- |
| `from`         | string  | Yes      | Valid path expression | Key/path in parent context              |
| `to`           | string  | Yes      | Valid identifier      | Key name in child workflow input        |
| `isLiteral`    | boolean | No       | -                     | If true, `from` is a literal value      |
| `literalValue` | any     | No       | -                     | The literal value (when isLiteral=true) |

### 2.4 ExportMapping

Used by Context Manager to merge child outputs back to parent context.

| Field  | Type   | Required | Constraints      | Description                             |
| ------ | ------ | -------- | ---------------- | --------------------------------------- |
| `from` | string | Yes      | Valid identifier | Key name in child workflow output       |
| `to`   | string | Yes      | Valid path       | Key/path in parent context (namespaced) |

### 2.5 SubWorkflowResult

Returned by Orchestrator after sub-workflow execution.

| Field            | Type                    | Required | Description                      |
| ---------------- | ----------------------- | -------- | -------------------------------- |
| `outputs`        | Record<string, unknown> | Yes      | All outputs from child workflow  |
| `status`         | SubWorkflowStatus       | Yes      | Final execution status           |
| `executionId`    | string                  | Yes      | Child workflow's execution ID    |
| `workflowName`   | string                  | Yes      | Name of executed workflow        |
| `duration`       | number                  | Yes      | Duration in milliseconds         |
| `phasesExecuted` | number                  | Yes      | Phases executed in child         |
| `totalPhases`    | number                  | Yes      | Total phases in child definition |
| `error`          | SubWorkflowError        | No       | Error details if failed          |

### 2.6 SubWorkflowStatus Enum

| Value       | Description                      |
| ----------- | -------------------------------- |
| `completed` | Successfully finished all phases |
| `failed`    | One or more phases failed        |
| `cancelled` | Execution was cancelled          |
| `skipped`   | Skipped due to condition         |

---

## 3. Validation Rules

### 3.1 Field-Level Validation

| Field       | Rule                                        | Error Code              |
| ----------- | ------------------------------------------- | ----------------------- |
| `workflow`  | Must be non-empty string, max 100 chars     | `INVALID_WORKFLOW_NAME` |
| `workflow`  | Must reference existing workflow            | `WORKFLOW_NOT_FOUND`    |
| `version`   | Must be valid semver constraint if provided | `INVALID_VERSION`       |
| `inputs.*`  | Expression must be parseable                | `INVALID_EXPRESSION`    |
| `condition` | Expression must be parseable                | `INVALID_CONDITION`     |
| `timeout`   | Must be > 0 if provided                     | `INVALID_TIMEOUT`       |

### 3.2 Cross-Field Validation

| Rule                       | Fields Involved                 | Error Code                  |
| -------------------------- | ------------------------------- | --------------------------- |
| Fallback requires strategy | `onFailure`, `fallbackWorkflow` | `FALLBACK_WITHOUT_STRATEGY` |
| Fallback must exist        | `fallbackWorkflow`              | `FALLBACK_NOT_FOUND`        |
| No self-reference          | `workflow`                      | `SELF_REFERENCE`            |

### 3.3 Business Rules

| Rule                   | Description                                             | Error Code           |
| ---------------------- | ------------------------------------------------------- | -------------------- |
| No circular references | Workflow cannot reference itself directly or indirectly | `CIRCULAR_REFERENCE` |
| Depth limit            | Nesting depth cannot exceed maxDepth (default: 5)       | `MAX_DEPTH_EXCEEDED` |
| Version compatibility  | If version specified, must match available version      | `VERSION_MISMATCH`   |

---

## 4. Format Specifications

### 4.1 Expression Syntax

| Pattern           | Description               | Example                      |
| ----------------- | ------------------------- | ---------------------------- |
| `${variable}`     | Direct variable reference | `${taskId}`                  |
| `${phase.output}` | Reference phase output    | `${planning.plan}`           |
| `${env.VAR}`      | Environment variable      | `${env.DEBUG}`               |
| `"literal"`       | Literal string value      | `"true"`                     |
| `${a.b.c}`        | Nested path access        | `${config.settings.timeout}` |

### 4.2 Data Formats

| Data Type          | Format                | Example                    |
| ------------------ | --------------------- | -------------------------- |
| workflow name      | kebab-case identifier | `feature-planning`         |
| version constraint | semver range          | `^1.0.0`, `>=2.0.0 <3.0.0` |
| timeout            | milliseconds (number) | `300000`                   |

---

## 5. Usage by Components

### 5.1 Component Usage Matrix

| Component                        | Creates | Reads | Updates | Deletes |
| -------------------------------- | ------- | ----- | ------- | ------- |
| COMP-002 (Configuration Manager) | Yes     | Yes   |         |         |
| COMP-005 (Context Manager)       |         | Yes   |         |         |
| COMP-008 (Orchestrator)          |         | Yes   |         |         |

### 5.2 Per-Component Usage Details

#### COMP-002 (Configuration Manager)

**Role**: Owner (Source of Truth)

**Operations**:

- Parses `WorkflowReference` from YAML workflow definitions
- Validates workflow name exists
- Validates version constraints
- Resolves `uses:` shorthand (string → full WorkflowReference)

**Fields Used**: All fields

---

#### COMP-005 (Context Manager)

**Role**: Consumer

**Operations**:

- `createWorkflowInputContext()` (CM-OP-021): Converts `inputs` to `InputMapping[]`, builds child input context
- `mergeWorkflowOutputContext()` (CM-OP-022): Converts `exports` to `ExportMapping[]`, merges child outputs to parent

**Fields Used**: `inputs`, `exports`, `workflow` (for namespacing)

---

#### COMP-008 (Orchestrator)

**Role**: Consumer

**Operations**:

- `invokeSubWorkflow()` (OR-OP-050): Executes referenced workflow
- Validates nesting depth
- Handles failure strategy
- Propagates abort signals to child

**Fields Used**: All fields

---

## 6. Lifecycle

### 6.1 State Diagram

```
                   ┌────────────────────────────────────┐
                   │     Sub-Workflow Execution         │
                   └────────────────────────────────────┘

    ┌─────────────────┐
    │ Parent reaches  │
    │ phase with uses:│
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐     condition=false    ┌─────────┐
    │ Evaluate        ├───────────────────────►│ SKIPPED │
    │ condition       │                        └─────────┘
    └────────┬────────┘
             │ condition=true
             ▼
    ┌─────────────────┐
    │ Build child     │
    │ input context   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Execute child   │
    │ workflow        │
    └────────┬────────┘
             │
        ┌────┴────┐
        │         │
        ▼         ▼
   ┌────────┐  ┌────────┐     onFailure=fallback    ┌──────────┐
   │SUCCESS │  │ FAILED ├─────────────────────────►│ FALLBACK │
   └───┬────┘  └───┬────┘                          └────┬─────┘
       │           │                                    │
       │           │ onFailure=continue                 │
       │           ▼                                    │
       │      ┌─────────┐                               │
       │      │CONTINUE │                               │
       │      └────┬────┘                               │
       │           │                                    │
       └───────────┴────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │ Merge outputs   │
         │ to parent       │
         └─────────────────┘
```

### 6.2 Lifecycle Events

| Transition            | Trigger                   | Side Effects                                             |
| --------------------- | ------------------------- | -------------------------------------------------------- |
| Start → Executing     | Parent phase starts       | `SUB_WORKFLOW_STARTED` event                             |
| Executing → Completed | All child phases succeed  | Outputs merged to parent, `SUB_WORKFLOW_COMPLETED` event |
| Executing → Failed    | Child phase fails         | Based on `onFailure`: fail parent, continue, or fallback |
| Failed → Fallback     | `onFailure='fallback'`    | Fallback workflow started                                |
| \* → Skipped          | Condition evaluates false | `SUB_WORKFLOW_SKIPPED` event                             |

---

## 7. Versioning

### 7.1 Schema Version

| Attribute                      | Value |
| ------------------------------ | ----- |
| **Current Version**            | 1.0   |
| **Backwards Compatible Since** | 1.0   |

### 7.2 Evolution Rules

**Allowed Changes (Non-Breaking)**:

- Adding optional fields to WorkflowReference
- Adding new FailureStrategy values (if consumers handle unknown values)
- Adding new SubWorkflowStatus values

**Breaking Changes (Require Version Bump)**:

- Removing fields
- Changing expression syntax
- Changing required/optional status of fields

### 7.3 Change History

| Version | Date       | Changes         | Migration |
| ------- | ---------- | --------------- | --------- |
| 1.0     | 2025-12-04 | Initial version | N/A       |

---

## 8. Examples

### 8.1 Minimal Valid Instance (String Shorthand)

In YAML workflow definitions, a simple string is equivalent to `{ workflow: "name" }`:

```yaml
phases:
  - name: planning
    uses: detailed-planning # Shorthand
```

Equivalent to:

```json
{
  "workflow": "detailed-planning"
}
```

### 8.2 Complete Instance (All Fields)

```yaml
phases:
  - name: implementation
    uses:
      workflow: code-generation
      name: 'Code Generation Phase'
      version: '^2.0.0'
      inputs:
        plan: '${planning.plan}'
        requirements: '${task.requirements}'
        debug: 'false'
      exports:
        - code
        - tests
        - documentation
      needs:
        - planning
        - design
      condition: '${planning.success && !env.SKIP_CODEGEN}'
      onFailure: fallback
      fallbackWorkflow: manual-implementation
      timeout: 600000
      maxRetries: 2
```

JSON representation:

```json
{
  "workflow": "code-generation",
  "name": "Code Generation Phase",
  "version": "^2.0.0",
  "inputs": {
    "plan": "${planning.plan}",
    "requirements": "${task.requirements}",
    "debug": "false"
  },
  "exports": ["code", "tests", "documentation"],
  "needs": ["planning", "design"],
  "condition": "${planning.success && !env.SKIP_CODEGEN}",
  "onFailure": "fallback",
  "fallbackWorkflow": "manual-implementation",
  "timeout": 600000,
  "maxRetries": 2
}
```

### 8.3 InputMapping Transformation

From `inputs` field to `InputMapping[]`:

```
Input:  { "plan": "${planning.plan}", "debug": "true" }

Output: [
  { "from": "planning.plan", "to": "plan", "isLiteral": false },
  { "from": "true", "to": "debug", "isLiteral": true, "literalValue": "true" }
]
```

### 8.4 ExportMapping Transformation

From `exports` field to `ExportMapping[]` (for workflow named "codegen"):

```
Input:  ["code", "tests"]

Output: [
  { "from": "code", "to": "codegen.code" },
  { "from": "tests", "to": "codegen.tests" }
]
```

### 8.5 Edge Cases

| Case          | Example                     | Notes                            |
| ------------- | --------------------------- | -------------------------------- |
| No inputs     | `{ workflow: "simple" }`    | Child uses its own defaults      |
| Empty exports | `exports: []`               | No outputs captured to parent    |
| Literal input | `inputs: { debug: "true" }` | Not an expression, literal value |
| Version any   | No `version` field          | Uses latest available            |

---

## 9. Related Schemas

| Related Schema           | Relationship | Description                                               |
| ------------------------ | ------------ | --------------------------------------------------------- |
| AgentHierarchy (SCH-002) | Creates      | Child workflows create child workflow agents in hierarchy |
| WorkflowDefinition       | Contains     | Workflow definitions contain WorkflowReference in phases  |
| PhaseDefinition          | Uses         | Phase `uses` field holds string or WorkflowReference      |

---

## 10. Traceability

### 10.1 Requirement Coverage

| Requirement | How This Schema Supports                                     |
| ----------- | ------------------------------------------------------------ |
| FR-CF-004   | Workflow definition parsing includes `uses:` syntax          |
| FR-CM-021   | Context Manager creates input context from `inputs` mappings |
| FR-CM-022   | Context Manager merges outputs from `exports` mappings       |
| FR-OR-017   | Orchestrator invokes sub-workflows via WorkflowReference     |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-12-04 | Architecture Team | Initial version |
