# Orchestrator - Functional Requirements

> **Component ID**: COMP-008
> **Document Version**: 4.0
> **Last Updated**: 2025-12-25
> **Status**: Draft
> **Owner**: FlowMaster Team
> **Related Documents**:
>
> - [Architecture Document](../00-architecture.md)
> - [High-Level Requirements](../../02-high-level-requirements/02-requirements.md)

## Execution Model

FlowMaster uses a **flat DAG (Directed Acyclic Graph) execution model**. This replaces the previous three-tier hierarchy (Workflow → Phase → Command).

**Key principles:**

- **Nodes** are atomic execution units (not grouped into phases or workflows)
- **Edges** define data flow and dependencies between nodes
- **Execution** is node-by-node based on dependency resolution
- **Parallelism** is automatic—nodes with satisfied dependencies run concurrently
- **Node Types** are extensible via registry (AI, Conditional, Loop, Human Input, SubFlow, etc.)

---

## 1. Overview

### 1.1 Purpose

This document defines the detailed functional requirements for the **Orchestrator** component. These requirements decompose the high-level requirements assigned to this component into specific, testable specifications.

> **Note**: FlowMaster follows a desktop-first development approach. Test scenarios in this document may reference CLI commands (e.g., `flowmaster workflow run`) as examples. These represent functionality that will be available through both the Desktop UI (primary) and CLI (future, for automation). The Desktop UI will provide equivalent operations through its interface.

### 1.2 Component Summary

| Attribute                      | Value                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Component ID**               | COMP-008                                                                                          |
| **Responsibility**             | Flow control, state machines, transition decisions                                                |
| **Implements HL Requirements** | HL-WF-001, HL-WF-002, HL-WF-003, HL-WF-004, HL-WF-005, HL-WF-006, HL-WF-007, HL-WF-008, HL-WF-009 |

### 1.3 Requirement ID Convention

All requirements in this document follow the format: **FR-OR-XXX**

| Component    | Prefix | Example   |
| ------------ | ------ | --------- |
| Orchestrator | FR-OR  | FR-OR-001 |

### 1.4 Priority Levels

| Priority     | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Component cannot function without this. Must be in MVP.          |
| **High**     | Important for component's core responsibility. Should be in MVP. |
| **Medium**   | Valuable but not essential for initial release.                  |
| **Low**      | Nice to have. Future consideration.                              |

---

## 2. Functional Requirements

### 2.1 Core Lifecycle

This section covers foundational requirements that must exist for the Orchestrator to function. These are the building blocks upon which all other capabilities depend.

---

#### FR-OR-001: Workflow Definition Persistence

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL persist workflow definitions in version-controllable format so that workflows can be versioned, shared, and collaboratively developed.

**Acceptance Criteria**:

```gherkin
Scenario: Load workflow from JSON file
  Given a workflow definition exists at ".flowmaster/workflows/dev-cycle.json"
  When the orchestrator loads the workflow
  Then the workflow should be parsed successfully
  And all nodes should be accessible

Scenario: Workflow supports version control
  Given a workflow definition in JSON format
  When the file is committed to git
  Then the file should be diffable and mergeable

Scenario: List available workflows
  Given multiple workflow definitions exist in the workflows directory
  When I request a list of workflows
  Then all workflow names and descriptions should be returned

```

**Rationale**:
JSON workflow definitions enable version control, collaboration, code review, and CI/CD integration. The visual editor outputs JSON natively, ensuring consistent format between visual and programmatic workflows (see ADR-009).

---

#### FR-OR-002: Workflow Validation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-OR-001 |

**Requirement**:
The system SHALL validate workflow definitions when loaded so that errors are caught before execution.

**Acceptance Criteria**:

```gherkin
Scenario: Valid workflow passes validation
  Given a workflow definition with correct syntax
  And all referenced commands exist
  And all dependencies are valid
  When the workflow is validated
  Then validation should pass
  And no errors should be reported

Scenario: Invalid JSON syntax detected
  Given a workflow definition with malformed JSON
  When the workflow is validated
  Then validation should fail
  And the error should indicate the syntax issue with location

Scenario: Missing command reference detected
  Given a workflow definition referencing command "plan"
  And the command file does not exist
  When the workflow is validated
  Then validation should fail
  And the error should identify the missing command

Scenario: Circular dependency detected
  Given a workflow where node A depends on node B
  And node B depends on node A
  When the workflow is validated
  Then validation should fail
  And the error should identify the circular dependency
```

**Rationale**:
Early validation prevents wasted time and confusing runtime errors. Users should know immediately if their workflow has issues.

---

#### FR-OR-003: Backward Compatible Workflows

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-OR-001 |

**Requirement**:
The system SHALL maintain backward compatibility so that existing workflows without new configuration features continue working unchanged.

**Acceptance Criteria**:

```gherkin
Scenario: Simple workflow without new features
  Given a workflow definition without defaults section
  And without iteration or condition configuration
  When the workflow is executed
  Then execution should complete successfully
  And no deprecation errors should occur

Scenario: Gradual feature adoption
  Given an existing workflow without path placeholders
  When I add path placeholders to one node
  Then the workflow should execute successfully
  And nodes without placeholders should work unchanged

Scenario: New features are optional
  Given a minimal workflow with only name and nodes
  When the workflow is loaded
  Then default values should be applied for optional fields
  And the workflow should be executable
```

**Rationale**:
Backward compatibility ensures users can adopt new features gradually without breaking existing workflows.

---

#### FR-OR-004: Workflow State Machine Coordination

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-001 |

**Requirement**:
The system SHALL coordinate agent execution with workflow state machines so that execution is properly integrated with workflow orchestration.

**Acceptance Criteria**:

```gherkin
Scenario: State machine invokes agent execution
  Given a workflow state machine in "executing_node" state
  When the state machine service invokes agent execution
  Then the agent should receive the correct context
  And execution should be tracked by the state machine

Scenario: Agent results trigger state transitions
  Given an agent execution completes successfully
  When the result is reported to the state machine
  Then the state machine should transition to "node_completed"
  And the context should be updated with agent output

Scenario: Agent errors trigger error transitions
  Given an agent execution fails
  When the error is reported to the state machine
  Then the state machine should transition to "node_failed"
  And the error should be recorded in context

Scenario: Workflow state reflects execution status
  Given an agent is currently executing
  When I query workflow state
  Then the state should show "executing"
  And the current agent should be identified
```

**Rationale**:
State machine integration ensures proper orchestration, error handling, and state management during execution.

---

#### FR-OR-005: Workflow Execution Command

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Critical             |
| **Implements**   | HL-WF-001            |
| **Dependencies** | FR-OR-001, FR-OR-004 |

**Requirement**:
The system SHALL execute multi-step workflows by name with task identifier when requested.

**Acceptance Criteria**:

```gherkin
Scenario: Execute workflow by name
  Given a workflow "dev-cycle" exists
  And a task identifier "TASK-123"
  When I execute "flowmaster workflow run dev-cycle --task TASK-123"
  Then the workflow should start execution
  And all nodes should execute based on dependencies

Scenario: Task identifier is required
  Given a workflow "dev-cycle" exists
  When I execute "flowmaster workflow run dev-cycle" without task ID
  Then the command should fail
  And an error should indicate task ID is required

Scenario: Progress reporting during execution
  Given a workflow with 5 nodes is executing
  When each node completes
  Then progress should be reported (e.g., "Node 2/5 complete")
  And current node name should be displayed

Scenario: Final execution report
  Given a workflow execution completes
  When all nodes have finished
  Then a summary should show success/failure status
  And duration and node outcomes should be reported
```

**Rationale**:
Workflow execution is the primary use case for the system. Clear invocation with task context is essential.

---

#### FR-OR-006: Workflow Lifecycle Events

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-004 |

**Requirement**:
The system SHALL emit workflow lifecycle events including start, complete, and error so that workflow execution can be monitored.

**Acceptance Criteria**:

```gherkin
Scenario: Workflow start event
  Given a workflow begins execution
  When execution starts
  Then a workflow:start event should be emitted
  And the event should include task ID and workflow name

Scenario: Workflow complete event
  Given a workflow finishes successfully
  When the last node completes
  Then a workflow:complete event should be emitted
  And the event should include duration and node count

Scenario: Workflow error event
  Given a workflow fails
  When a node fails without recovery
  Then a workflow:error event should be emitted
  And the event should include error details and failed node

Scenario: Event metadata
  Given any workflow lifecycle event
  When the event is emitted
  Then it should include timestamp and execution ID
```

**Rationale**:
Workflow lifecycle events enable monitoring overall workflow progress and status at the highest level.

---

#### FR-OR-007: Node Lifecycle Events

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-006 |

**Requirement**:
The system SHALL emit node lifecycle events including start, complete, and error so that individual node execution can be tracked.

**Acceptance Criteria**:

```gherkin
Scenario: Node start event
  Given a node begins execution
  When the node starts
  Then a node:start event should be emitted
  And the event should include node ID and type

Scenario: Node complete event
  Given a node finishes successfully
  When execution completes
  Then a node:complete event should be emitted
  And the event should include duration and output summary

Scenario: Node error event
  Given a node fails
  When an error occurs
  Then a node:error event should be emitted
  And the event should include error details

Scenario: Parallel node events
  Given nodes A, B, C all depend on node X
  When node X completes
  Then node:start events should be emitted for A, B, C
  And they should execute in parallel
```

**Rationale**:
Node-level events enable detailed monitoring of graph execution progress and identification of slow or failing nodes.

---

#### FR-OR-008: Execution Result Reporting

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-004 |

**Requirement**:
The system SHALL report execution results including success status, output, and telemetry so that workflows have complete information about each execution.

**Acceptance Criteria**:

```gherkin
Scenario: Execution result includes success status
  Given an agent execution completes
  When the result is reported
  Then it should include success or failure status
  And the status should be unambiguous

Scenario: Execution result includes complete output
  Given an agent produces output during execution
  When the result is reported
  Then the complete output should be included
  And no truncation should occur for normal-sized outputs

Scenario: Execution result includes session ID
  Given an agent execution completes
  When the result is reported
  Then a session ID should be included
  And the session ID can be used for resumption

Scenario: Execution result includes telemetry data
  Given an agent execution completes
  When the result is reported
  Then telemetry should include duration
  And telemetry should include token usage if available
  And telemetry should include cost estimate if available

Scenario: Execution result includes error information
  Given an agent execution fails
  When the result is reported
  Then exit code should be included
  And error message should be included
  And error type should be categorized
```

**Rationale**:
Comprehensive result reporting enables workflows to make decisions based on execution outcomes and enables proper telemetry tracking and debugging.

---

### 2.2 Graph Structure and Node Types

This section defines the DAG-based execution model where nodes execute based on dependencies, not hierarchical tiers.

---

#### FR-OR-009: Flat DAG Execution Model

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-001 |

**Requirement**:
The system SHALL use a flat DAG (Directed Acyclic Graph) model for workflow orchestration: Graphs contain Nodes connected by Edges. Nodes execute when all their dependencies (incoming edges) are satisfied.

**Acceptance Criteria**:

```gherkin
Scenario: Graph contains nodes and edges
  Given a graph definition with nodes and edges
  When the graph is loaded
  Then all nodes should be accessible
  And edges should define dependencies between nodes

Scenario: Node executes when dependencies satisfied
  Given node B depends on node A (edge from A to B)
  When node A completes
  Then node B should become runnable
  And node B should execute automatically

Scenario: Parallel execution is automatic
  Given nodes B and C both depend only on node A
  When node A completes
  Then nodes B and C should execute in parallel
  And no explicit parallel configuration is needed

Scenario: Node output captured in shared context
  Given a node completes with output
  When the output is stored
  Then downstream nodes can access it via shared context
  And the output is keyed by node ID

Scenario: Execution state shows current nodes
  Given a running graph
  When I query the execution state
  Then I should see completed, running, and pending nodes
```

**Rationale**:
Flat DAG execution is simpler than hierarchical models, enables automatic parallelism, and aligns with proven patterns from Prefect and Dask. Nodes execute based on data dependencies, not artificial groupings.

---

#### FR-OR-010: Node Type Registry

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-003 |
| **Dependencies** | FR-OR-009 |

**Requirement**:
The system SHALL support extensible node types via a registry pattern. Each node type defines its own execution logic, input/output schema, and validation.

**Acceptance Criteria**:

```gherkin
Scenario: Register custom node type
  Given a new node type "CustomProcessor"
  When I register it with the node type registry
  Then the type should be available for use in graphs
  And graphs can include nodes of this type

Scenario: Node type defines execution
  Given a node type with execute() method
  When a node of this type runs
  Then the execute() method should be called
  And inputs should be passed from shared context

Scenario: Built-in node types available
  Given the orchestrator initializes
  Then these node types should be registered:
    | Type         | Purpose                              |
    | AI           | Execute an agent with prompt + tools |
    | Conditional  | Branch based on condition            |
    | Loop         | Iterate over a collection            |
    | HumanInput   | Pause and wait for user input        |
    | SubFlow      | Execute another graph                |

Scenario: Unknown node type fails validation
  Given a graph with node type "NonExistent"
  When the graph is validated
  Then validation should fail
  And error should identify the unknown type
```

**Rationale**:
Extensible node types enable adding new capabilities without modifying the core orchestrator. The registry pattern keeps the orchestrator simple while allowing rich functionality.

---

### 2.3 Node Dependencies and Shared Context

This section covers how nodes depend on each other and how data flows between nodes via shared context. These capabilities build on the DAG execution model.

---

#### FR-OR-011: Context Loading from Dependencies

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-010 |

**Requirement**:
The system SHALL load context from predecessor nodes so that dependent nodes have access to upstream outputs via shared context.

**Acceptance Criteria**:

```gherkin
Scenario: Load output from dependency
  Given node "implement" depends on node "plan" (edge from plan to implement)
  And node "plan" completed with output containing implementation steps
  When node "implement" executes
  Then the implement node should receive plan output in shared context

Scenario: Multiple dependencies
  Given node "review" depends on nodes "implement" and "test"
  And both nodes completed with outputs
  When node "review" executes
  Then the review node should have access to both outputs in shared context

Scenario: Missing dependency context
  Given node "implement" depends on node "plan"
  And node "plan" has no stored output
  When node "implement" attempts to execute
  Then a clear error should indicate missing dependency output

Scenario: Dependency context formatting
  Given node "plan" output is structured JSON
  When node "implement" accesses the context
  Then the output should be accessible by node ID
  And field access should be available (e.g., context.plan.steps[0])
```

**Rationale**:
Nodes often depend on outputs from upstream nodes. Shared context enables this data flow through the graph.

---

#### FR-OR-012: Node Context Source Specification

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-011 |

**Requirement**:
The system SHALL allow nodes to specify context sources so that they receive relevant data from upstream nodes, shared context, and project files.

**Acceptance Criteria**:

```gherkin
Scenario: Context from upstream node output
  Given a node with context source "node:plan.output"
  When the node prepares execution context
  Then the plan node output should be included

Scenario: Context from project file
  Given a node with context source "file:README.md"
  When the node prepares execution context
  Then the README.md content should be included

Scenario: Context from glob pattern
  Given a node with context source "files:src/**/*.ts"
  When the node prepares execution context
  Then all matching TypeScript files should be included

Scenario: Validate context sources at load time
  Given a graph with context source "node:nonexistent"
  When the graph is validated
  Then validation should fail
  And the error should identify the invalid reference
```

**Rationale**:
Nodes need context from upstream outputs and project files to make informed decisions and maintain execution continuity.

---

#### FR-OR-013: Node Output Reference Resolution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-011 |

**Requirement**:
The system SHALL resolve node output references to stored outputs in shared context so that nodes can access upstream results.

**Acceptance Criteria**:

```gherkin
Scenario: Resolve node ID to output
  Given node "plan" completed with output stored in shared context
  When I reference "{{plan}}" in a downstream node
  Then the reference should resolve to plan's output content

Scenario: Resolve field within output
  Given node "plan" output contains JSON with "steps" array
  When I reference "{{plan.steps}}" in a downstream node
  Then the reference should resolve to the steps array

Scenario: Handle missing node output
  Given node "plan" has no stored output
  When I reference "{{plan}}" in a downstream node
  Then a clear error should indicate the missing output

Scenario: Output resolution for parallel nodes
  Given nodes "test" and "lint" completed in parallel
  When I reference "{{test}}" and "{{lint}}" in a downstream node
  Then both references should resolve correctly
```

**Rationale**:
Nodes often depend on outputs from upstream nodes. Automatic resolution enables seamless data flow through the graph.

---

#### FR-OR-014: Node Output Management

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-004 |

**Requirement**:
The system SHALL capture and store outputs from completed nodes in shared context for use by downstream nodes so that data flows through the graph.

**Acceptance Criteria**:

```gherkin
Scenario: Capture node output
  Given a node completes with output
  When the node is marked complete
  Then the output should be stored in shared context
  And the output should be accessible by node ID

Scenario: Named outputs within node
  Given a node produces multiple named outputs
  When the node completes
  Then each named output should be stored separately
  And each should be accessible by name

Scenario: Output persistence across execution
  Given a graph execution is paused
  When the execution resumes
  Then all previous node outputs should be available in shared context

Scenario: Output accessible by downstream nodes
  Given node "plan" output is stored
  When node "implement" has an edge from "plan"
  Then implement should receive plan's output automatically

Scenario: Validated outputs stored in shared context
  Given a node with output schema validation
  When the node completes with valid output
  Then the validated output should be stored in shared context
  And should be accessible by node ID

Scenario: Validated outputs persist across execution
  Given execution is paused after node "plan" completes
  And plan produced validated structured output
  When the execution resumes
  Then the validated output should still be available
  And downstream nodes should receive it in context

Scenario: Validated outputs included in downstream context
  Given node "analyze" produced validated output {"risk_level": "high"}
  When node "review" executes with edge from "analyze"
  Then the validated fields should be directly accessible
  And context should include analyze.risk_level
```

**Rationale**:
Nodes often need data from upstream nodes. Shared context provides structured data flow mechanism. Validated outputs ensure downstream nodes receive well-structured, type-checked data.

---

#### FR-OR-015: Automatic Context Tag Generation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-011 |

**Requirement**:
The system SHALL generate context tags automatically based on source type so that context items are identifiable in prompts.

**Acceptance Criteria**:

```gherkin
Scenario: Node outputs use node name as tag
  Given a node named "plan" produces output
  When the output is included in subsequent context
  Then the context tag should be "plan"

Scenario: Single files use basename as tag
  Given a context source specifies file "src/config.ts"
  When the file is loaded into context
  Then the context tag should be "config"

Scenario: Multiple files use directory name as tag
  Given a context source specifies multiple files from "src/utils/"
  When the files are loaded into context
  Then the context tag should be "utils"

Scenario: Glob patterns use parent directory as tag
  Given a context source specifies "src/components/*.tsx"
  When the files are loaded into context
  Then the context tag should be "components"

Scenario: Tag names are valid identifiers
  Given a file named "my-special_file.2.ts"
  When the context tag is generated
  Then the tag should be alphanumeric
  And special characters should be normalized
```

**Rationale**:
Automatic tag generation creates consistent, predictable context organization without requiring manual tag specification. Tags help agents understand context structure.

---

#### FR-OR-016: Optional Context Item Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-012 |

**Requirement**:
The system SHALL support optional context items that don't fail workflows if missing so that workflows can gracefully handle missing optional data.

**Acceptance Criteria**:

```gherkin
Scenario: Optional item marked in workflow
  Given a workflow with context source marked "optional: true"
  When the workflow is parsed
  Then the context item should be flagged as optional

Scenario: Missing optional items skipped silently
  Given a context source "file:CHANGELOG.md" marked optional
  And the file does not exist
  When context is built
  Then the build should succeed
  And the item should be skipped

Scenario: Missing optional items not in context
  Given an optional context item that doesn't exist
  When context is delivered to the agent
  Then the missing item should not appear in context blocks

Scenario: System logs skipped optional items
  Given an optional context item is skipped
  When the workflow executes
  Then a debug log should indicate the item was skipped
  And the log should include the item path

Scenario: Required items still fail if missing
  Given a context source without "optional: true"
  And the file does not exist
  When context is built
  Then the build should fail
  And a clear error should identify the missing required item
```

**Rationale**:
Not all context is essential for every execution. Optional items enable flexible workflows that adapt to available data without failing on non-critical missing files.

---

#### FR-OR-017: Multiple File Concatenation with Headers

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-012 |

**Requirement**:
The system SHALL separate multiple files with headers when concatenating so that agents can distinguish between different source files.

**Acceptance Criteria**:

```gherkin
Scenario: Each file preceded by header
  Given context includes multiple files
  When files are concatenated
  Then each file should be preceded by a header comment
  And the header should identify the file path

Scenario: Files separated by visual markers
  Given context includes multiple files
  When files are concatenated
  Then files should be separated by horizontal rules or whitespace
  And boundaries should be clear

Scenario: Headers identify original path
  Given a file from "src/components/Button.tsx"
  When the file is included in context
  Then the header should show the relative path
  And the path should be unambiguous

Scenario: Concatenation preserves file order
  Given context specifies files in order [a.ts, b.ts, c.ts]
  When files are concatenated
  Then they should appear in the same order

Scenario: Headers don't interfere with content
  Given files containing code
  When headers are added
  Then headers should use comment syntax appropriate to content type
  And headers should not break syntax highlighting
```

**Rationale**:
When loading multiple files, headers help agents understand which content came from which file, enabling more accurate analysis and reducing confusion.

---

### 2.4 Conditional Execution

This section covers conditional execution via Conditional node types that evaluate conditions and activate/deactivate branches based on context and previous node outputs.

---

#### FR-OR-018: Schema-Based Conditional Execution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-005 |
| **Dependencies** | FR-OR-013 |

**Requirement**:
The system SHALL support conditional execution based on structured output fields so that workflows can branch based on agent results.

**Acceptance Criteria**:

```gherkin
Scenario: Condition evaluates to true
  Given node "analyze" output contains {"needs_refactor": true}
  And conditional node has condition "analyze.needs_refactor == true"
  When the orchestrator evaluates the condition
  Then the true branch should be activated

Scenario: Condition evaluates to false
  Given node "analyze" output contains {"needs_refactor": false}
  And conditional node has condition "analyze.needs_refactor == true"
  When the orchestrator evaluates the condition
  Then the false branch should be activated
  And the decision should be logged

Scenario: Boolean operators in conditions
  Given conditions using AND, OR, and NOT operators
  When the orchestrator evaluates the condition
  Then the boolean logic should be applied correctly

Scenario: Comparison operators
  Given node output contains {"error_count": 5}
  And condition "analyze.error_count > 0"
  When the orchestrator evaluates the condition
  Then the comparison should evaluate to true
```

**Rationale**:
Different workflow paths may be appropriate based on agent results. Conditionals enable adaptive workflows.

---

#### FR-OR-019: Conditional Node Execution with skipIf

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-005 |
| **Dependencies** | FR-OR-018 |

**Requirement**:
The system SHALL support conditional node execution based on context expressions using `skipIf` configuration.

**Acceptance Criteria**:

```gherkin
Scenario: Skip node when condition is true
  Given a node with "skipIf: tests_passing == true"
  And shared context contains {"tests_passing": true}
  When the orchestrator evaluates the node
  Then the node should be skipped
  And "Skipped: tests_passing == true" should be logged

Scenario: Execute node when condition is false
  Given a node with "skipIf: tests_passing == true"
  And shared context contains {"tests_passing": false}
  When the orchestrator evaluates the node
  Then the node should execute normally

Scenario: Reference context values in skipIf
  Given a node with "skipIf: previous_node.status == 'success'"
  When the orchestrator evaluates the node
  Then the context reference should be resolved
  And the condition should be evaluated correctly
```

**Rationale**:
Conditional execution enables dynamic graphs that adapt based on previous node outputs or context values.

---

### 2.5 Iterative Execution

This section covers iteration via Loop node types that iterate over collections, re-enabling downstream nodes for each iteration. Loop nodes track their own state (index, aggregated results) in shared context.

---

#### FR-OR-020: Loop Node Configuration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-006 |
| **Dependencies** | FR-OR-004 |

**Requirement**:
The system SHALL support Loop node types with configurable termination conditions, checkpoint resumption, and safety limits.

**Acceptance Criteria**:

```gherkin
Scenario: Loop until condition met
  Given a Loop node with "until: tests_pass == true"
  And "maxIterations: 5"
  When the loop executes and tests pass on iteration 3
  Then the loop should complete after 3 iterations
  And iteration count should be recorded

Scenario: Stop at max iterations
  Given a Loop node with "maxIterations: 3"
  And the until condition never becomes true
  When the loop executes
  Then the loop should stop after 3 iterations
  And a warning should indicate max iterations reached

Scenario: Delay between iterations
  Given a Loop node with "delay: 5000"
  When the loop iterates
  Then there should be a 5 second delay between iterations

Scenario: Checkpoint for resumption
  Given a Loop node with "checkpoint: after_each"
  When iteration 2 completes and execution is interrupted
  Then resuming should continue from iteration 3
```

**Rationale**:
Loop nodes enable workflows that repeat until objectives are achieved, essential for autonomous development cycles.

---

#### FR-OR-021: Exponential Backoff for Iterations

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-006 |
| **Dependencies** | FR-OR-020 |

**Requirement**:
The system SHALL support exponential backoff delays between iteration attempts with configurable factor and maximum delay.

**Acceptance Criteria**:

```gherkin
Scenario: Exponential backoff applied
  Given iteration config with "backoff.factor: 2" and "backoff.initial: 1000"
  When the Loop node iterates
  Then delay should be 1000ms, 2000ms, 4000ms for iterations 1, 2, 3

Scenario: Maximum delay ceiling
  Given backoff config with "backoff.maxDelay: 30000"
  When calculated delay exceeds 30000ms
  Then actual delay should be capped at 30000ms

Scenario: Backoff resets on success
  Given a Loop node that succeeded after 3 iterations
  When the graph runs again
  Then backoff should start fresh from initial delay
```

**Rationale**:
Exponential backoff prevents rapid retry loops and reduces resource consumption during error recovery.

---

#### FR-OR-022: Nested Loop Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-006 |
| **Dependencies** | FR-OR-020 |

**Requirement**:
The system SHALL support nested Loop nodes for multi-level iterative workflows.

**Acceptance Criteria**:

```gherkin
Scenario: Nested loops execute correctly
  Given an outer Loop node with 3 max iterations
  And an inner Loop node with 2 max iterations per outer
  When the nested structure executes
  Then inner loop should complete for each outer iteration
  And maximum total iterations should be 6

Scenario: Independent iteration counters
  Given nested Loop nodes
  When inner loop completes
  Then inner counter resets for next outer iteration
  And outer counter remains unchanged

Scenario: State tracks all loop levels
  Given nested loops at depth 2
  When I query execution state
  Then both loop levels and their counts should be visible
```

**Rationale**:
Complex development workflows may require nested loops, such as iterating tasks with each task iterating until tests pass.

---

#### FR-OR-023: Loop Nodes with Checkpoints

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-006 |
| **Dependencies** | FR-OR-020 |

**Requirement**:
Loop nodes SHALL support named checkpoints for resumption when iteration is interrupted.

**Acceptance Criteria**:

```gherkin
Scenario: Named checkpoint saved
  Given a Loop node with "checkpoint: implementation_complete"
  When the iteration reaches that point
  Then the checkpoint should be saved to state
  And the checkpoint name should be recorded

Scenario: Resume from checkpoint
  Given execution was interrupted after checkpoint "implementation_complete"
  When graph resumes
  Then execution should continue from that checkpoint
  And previously completed work should not repeat

Scenario: Checkpoint progress tracked
  Given a Loop node with multiple checkpoints
  When I query execution state
  Then all reached checkpoints should be listed
  And current position should be clear
```

**Rationale**:
Named checkpoints enable resuming iterative workflows from specific points, avoiding re-execution of completed steps.

---

### 2.6 Control Operations

This section covers operations that control running graphs including Human Input nodes, abort handling, and cleanup.

---

#### FR-OR-024: Human Input Nodes

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-007 |
| **Dependencies** | FR-OR-004 |

**Requirement**:
The system SHALL support Human Input node types that pause execution and wait for user input before downstream nodes can proceed.

**Acceptance Criteria**:

```gherkin
Scenario: Human Input node pauses execution
  Given a Human Input node in the graph
  When execution reaches the node
  Then execution should pause
  And user should be prompted for input

Scenario: Approve and continue
  Given execution is paused at a Human Input node
  When user approves
  Then downstream nodes should become runnable
  And approval should be logged with timestamp

Scenario: Reject and halt
  Given execution is paused at a Human Input node
  When user rejects
  Then graph should transition to failed state
  And rejection reason should be recorded

Scenario: Request refinement
  Given execution is paused at a Human Input node
  When user requests refinement
  Then specified upstream nodes should re-execute
  And refinement request should be included in context

Scenario: Display artifacts for review
  Given a Human Input node with artifacts configured
  When execution pauses for input
  Then specified artifacts should be displayed to user
```

**Rationale**:
Critical workflow points may require human review before proceeding, especially for production deployments or important decisions. Human Input is a node type, not a special execution mode.

---

#### FR-OR-025: Abort Signal Handling

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-004 |

**Requirement**:
The system SHALL handle abort signals to terminate running workflows so that workflows can be cancelled cleanly.

**Acceptance Criteria**:

```gherkin
Scenario: Abort signal terminates execution
  Given a workflow is currently executing
  When an abort signal is received
  Then current agent execution should be terminated
  And workflow should transition to cancelled state

Scenario: Clean resource cleanup on abort
  Given a workflow with running agents
  When abort signal is received
  Then all child processes should be terminated
  And temporary resources should be cleaned up

Scenario: Abort is immediate
  Given a long-running agent execution
  When abort signal is received
  Then termination should not wait for natural completion
  And should complete within 5 seconds

Scenario: Abort result recorded
  Given a workflow is aborted
  When I check execution history
  Then the abort should be recorded with timestamp
  And partial results should be available
```

**Rationale**:
Users need ability to cancel long-running workflows. Abort signal handling enables clean cancellation.

---

#### FR-OR-026: Process Group Cleanup

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-025 |

**Requirement**:
The system SHALL kill process groups on Unix systems for proper cleanup so that child processes spawned by providers are also terminated.

**Acceptance Criteria**:

```gherkin
Scenario: Process group termination on Unix
  Given a workflow running on a Unix system
  And an agent spawned child processes
  When the workflow is terminated
  Then the entire process group should be killed
  And no orphaned processes should remain

Scenario: Graceful then forceful termination
  Given a running process group
  When termination is initiated
  Then SIGTERM should be sent first
  And SIGKILL should follow if process doesn't terminate

Scenario: Platform-specific behavior
  Given a workflow running on Windows
  When termination is initiated
  Then Windows-appropriate termination should be used
```

**Rationale**:
Agents may spawn their own child processes. Process group termination ensures complete cleanup on Unix systems.

---

### 2.7 AI-Assisted Clarification

This section covers how nodes can get clarification during execution via the Coordinator tool pattern (replacing the previous hierarchical agent model).

---

#### FR-OR-027: Coordinator Tool

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-OR-009 |

**Requirement**:
The system SHALL provide a Coordinator tool that AI nodes can call for clarification. The Coordinator has access to the original spec and shared context, enabling it to answer questions without user intervention when possible.

**Acceptance Criteria**:

```gherkin
Scenario: Node calls Coordinator for clarification
  Given an AI node needs clarification during execution
  When the node calls the Coordinator tool with a question
  Then the Coordinator should receive the question
  And the Coordinator should have access to spec and shared context

Scenario: Coordinator answers from context
  Given a question about project requirements
  And the answer is available in the spec
  When the Coordinator processes the question
  Then it should provide an answer
  And the node should continue execution with the answer

Scenario: Coordinator escalates to user
  Given a question the Coordinator cannot answer
  When the Coordinator determines escalation is needed
  Then the question should be presented to the user
  And the user's response should flow back to the node

Scenario: Coordinator is optional
  Given a graph without Coordinator configuration
  When nodes execute
  Then they should function without Coordinator
  And clarification requests should go directly to user
```

**Rationale**:
The Coordinator tool provides AI-assisted clarification without hierarchical agent complexity. It's a simple tool call pattern that nodes can use when needed.

---

#### FR-OR-028: Clarification Logging

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-OR-027 |

**Requirement**:
The system SHALL log all clarification requests and responses for debugging and audit purposes.

**Acceptance Criteria**:

```gherkin
Scenario: Clarification request logged
  Given a node calls the Coordinator tool
  When the request is made
  Then the question should be logged with timestamp
  And the requesting node ID should be recorded

Scenario: Clarification response logged
  Given a Coordinator or user provides an answer
  When the response is delivered
  Then the answer should be logged
  And response source (Coordinator vs user) should be recorded

Scenario: Clarification chain visible
  Given multiple clarifications during execution
  When I review execution logs
  Then all Q&A pairs should be visible
  And chronological order should be clear

Scenario: Escalation path logged
  Given a question escalated from Coordinator to user
  When the escalation occurs
  Then the escalation should be logged
  And the reason for escalation should be recorded
```

**Rationale**:
Logging clarifications enables debugging, auditing, and improving the Coordinator's knowledge over time.

---

### 2.8 Graph Composition

This section covers advanced capabilities for composing complex graphs from reusable graph units via SubFlow nodes.

---

#### FR-OR-029: SubFlow Node Invocation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-009 |

**Requirement**:
The system SHALL support SubFlow node types that invoke other graphs, enabling complex workflows to be composed from reusable graph units.

**Acceptance Criteria**:

```gherkin
Scenario: SubFlow node invokes another graph
  Given a graph with a SubFlow node referencing graph "deploy"
  When the SubFlow node executes
  Then the "deploy" graph should be loaded
  And all nodes of the sub-graph should execute
  And control should return to the parent graph upon completion

Scenario: SubFlow node receives parent context
  Given a parent graph with shared context
  When a SubFlow node executes
  Then the sub-graph should have access to parent context
  And parent outputs should be available to sub-graph nodes

Scenario: SubFlow outputs available to parent
  Given a SubFlow node completes
  When control returns to the parent graph
  Then sub-graph outputs should be available in shared context
  And outputs should be accessible via the SubFlow node ID

Scenario: SubFlow failure propagates to parent
  Given a sub-graph node fails
  When the failure is not recovered
  Then the failure should propagate to the parent graph
  And the parent should handle it according to its retry/failure policy

Scenario: Nested SubFlow depth limit
  Given SubFlow nodes can invoke graphs with other SubFlow nodes
  When nesting exceeds the configured maximum depth
  Then an error should be raised
  And the error should indicate the depth limit was exceeded
```

**Rationale**:
SubFlow nodes enable building complex workflows from smaller, reusable, and testable graph units, improving maintainability and reducing duplication.

---

#### FR-OR-030: Dynamic Graph Triggering

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-029 |

**Requirement**:
The system SHALL support dynamic graph triggering based on node outputs so that execution can adapt based on runtime results.

**Acceptance Criteria**:

```gherkin
Scenario: Trigger graph based on output condition
  Given a node with trigger configuration "when: {{needsRefactoring}}"
  And trigger target "graph: refactor"
  When the node output sets needsRefactoring to true
  Then the "refactor" graph should be triggered
  And it should execute before proceeding to downstream nodes

Scenario: Conditional trigger not activated
  Given a node with trigger configuration "when: {{needsRefactoring}}"
  When the node output sets needsRefactoring to false
  Then no additional graph should be triggered
  And execution should proceed to downstream nodes normally

Scenario: Multiple conditional triggers
  Given a node with multiple trigger conditions
  When node output matches multiple conditions
  Then all matching graphs should be triggered
  And execution order should follow trigger priority

Scenario: Triggered graph failure handling
  Given a dynamically triggered graph
  When the triggered graph fails
  Then failure should be handled according to trigger configuration
  And options should include: fail parent, continue, or fallback graph

Scenario: Trigger context passing
  Given a dynamic graph trigger
  When the triggered graph starts
  Then it should receive the triggering node's output as context
  And the trigger reason should be logged
```

**Rationale**:
Dynamic graph triggering enables adaptive execution where the system can invoke additional graphs based on runtime conditions, supporting self-healing and responsive automation.

---

### 2.9 Execution Operations Interface

This section covers execution operations that Orchestrator exposes via Gateway. UI operations that invoke these are defined in User Interface requirements.

---

#### FR-OR-031: Graph and Node Execution Operations

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-009 |

**Requirement**:
The system SHALL provide execution operations (via Gateway) for graphs and individual nodes so that clients can invoke execution at graph or node level.

**Acceptance Criteria**:

```gherkin
Scenario: Execute graph by name
  Given a graph "dev-cycle" exists
  When Gateway requests graph execution with name "dev-cycle" and taskId "TASK-123"
  Then the graph should start execution
  And nodes should execute based on dependencies

Scenario: Execute individual node by ID
  Given a graph is loaded
  When Gateway requests execution of a specific node
  Then the node should execute directly (with mocked dependencies if needed)
  And the result should be returned

Scenario: All execution operations require task ID
  Given any execution request
  When taskId is provided
  Then execution should be associated with that task
  And state should be persisted under that task
```

**Rationale**:
Clients need execution access for testing, debugging, and execution flexibility. Direct node execution enables rapid iteration during development.

> **Note**: UI operations that invoke these are defined in FR-UI-013, FR-UI-014.

---

#### FR-OR-032: Unified Execution Interface with Type Selection

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-031 |

**Requirement**:
The system SHALL provide a unified execution interface that can execute commands or workflows with explicit type selection for deterministic behavior.

**Acceptance Criteria**:

```gherkin
Scenario: Execute with explicit command type
  Given a command "implement" exists
  When Gateway requests execution with name "implement", type "command", and taskId "TASK-123"
  Then the command should execute directly

Scenario: Execute with explicit workflow type
  Given a workflow "implement" exists
  When Gateway requests execution with name "implement", type "workflow", and taskId "TASK-123"
  Then the workflow should execute

Scenario: Type parameter is mutually exclusive
  Given both command and workflow "test" exist
  When Gateway requests execution with multiple types specified
  Then the request should fail validation
  And error should indicate only one type can be specified

Scenario: Without type auto-detects
  Given only a workflow named "deploy" exists
  When Gateway requests execution with name "deploy" and taskId "TASK-123" without type
  Then the system should auto-detect it as a workflow
  And execute accordingly

Scenario: Ambiguous names produce clear error
  Given both command and workflow named "test" exist
  When Gateway requests execution with name "test" without type
  Then the request should fail
  And error should list all matches with their types
```

**Rationale**:
A unified interface simplifies client implementation while explicit type selection enables deterministic behavior in automation where ambiguity is unacceptable.

> **Note**: UI controls that map to this type parameter are defined in UI requirements.

---

#### FR-OR-033: Automatic Execution Type Resolution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-032 |

**Requirement**:
The system SHALL provide automatic type resolution that detects whether a name refers to a command or workflow when type is not explicitly specified.

**Acceptance Criteria**:

```gherkin
Scenario: Resolution searches in priority order
  Given a command "plan" exists
  And no workflow named "plan" exists
  When Gateway requests execution with name "plan" and taskId "TASK-123" without type
  Then the system should find and execute the command

Scenario: Resolution order is documented
  Given the resolution algorithm
  When I check documentation
  Then it should specify: commands first, then workflows

Scenario: Ambiguous names list all matches
  Given command "test" and workflow "test" both exist
  When Gateway requests execution with name "test" without type
  Then error should list both matches
  And suggest specifying explicit type

Scenario: Explicit type overrides resolution
  Given command "test" and workflow "test" both exist
  When Gateway requests execution with name "test", type "workflow", and taskId "TASK-123"
  Then the workflow should execute
  And the command should not be considered
```

**Rationale**:
Automatic resolution simplifies client implementation by detecting what to execute when names are unambiguous, while explicit type selection remains available for disambiguation.

---

#### FR-OR-034: Terminology Migration Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-OR-001 |

**Requirement**:
The system SHALL maintain backward compatibility with deprecated terminology during migration to new terminology so that existing workflows continue working.

**Acceptance Criteria**:

```gherkin
Scenario: Old keywords accepted with warnings
  Given a workflow using deprecated keyword "command"
  When the workflow is loaded
  Then it should be accepted
  And a deprecation warning should be logged
  And the warning should suggest the new keyword "agent"

Scenario: Old keywords normalized internally
  Given a workflow using deprecated keyword "phase"
  When the workflow is parsed
  Then it should be internally normalized to "phase"
  And execution should proceed normally

Scenario: Migration tool updates workflow files
  Given workflow files using old terminology
  When I run "flowmaster migrate --dry-run"
  Then the tool should show what would be changed
  When I run "flowmaster migrate"
  Then files should be updated to new terminology

Scenario: Deprecation period allows gradual transition
  Given deprecated keywords are in use
  When executing over the deprecation period
  Then warnings should become more prominent over time
  And eventual removal date should be communicated
```

**Rationale**:
Terminology migration should not break existing workflows. Backward compatibility with warnings enables gradual adoption without disrupting users.

---

### 2.10 Performance Optimization

This section covers performance optimizations for handling large workflows and reducing execution overhead.

---

#### FR-OR-035: Lazy Workflow Definition Loading

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-OR-001 |

**Requirement**:
The system SHALL load workflow definitions lazily to minimize startup time so that large workflow libraries don't slow down system initialization.

**Acceptance Criteria**:

```gherkin
Scenario: Startup without loading all workflows
  Given 100 workflow definitions exist
  When the system starts
  Then workflows should not be parsed at startup
  And startup time should be under 500ms

Scenario: Workflow loaded on demand
  Given a workflow "deploy" exists but not loaded
  When I execute "flowmaster workflow run deploy --task TASK-123"
  Then the workflow should be loaded at that point
  And execution should proceed normally

Scenario: Workflow list uses metadata only
  Given multiple workflows exist
  When I run "flowmaster workflow --list"
  Then only workflow metadata should be loaded
  And full parsing should be deferred

Scenario: Loaded workflows are cached
  Given a workflow was executed once
  When the same workflow is executed again
  Then the cached definition should be used
  And re-parsing should not occur
```

**Rationale**:
Large workflow libraries should not slow down system startup. Lazy loading ensures fast startup regardless of workflow count.

---

#### FR-OR-036: Context Interpolation Caching

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-004 |
| **Dependencies** | FR-OR-013 |

**Requirement**:
The system SHALL cache context interpolation results to improve execution speed so that repeated variable access doesn't require recomputation.

**Acceptance Criteria**:

```gherkin
Scenario: Repeated variable access uses cache
  Given a context variable "{{plan.output}}" is accessed
  When the same variable is accessed again in the same node
  Then the cached value should be returned
  And no re-computation should occur

Scenario: Cache invalidation on context change
  Given cached interpolation results exist
  When the underlying context changes
  Then the cache should be invalidated
  And next access should recompute

Scenario: Cache has minimal overhead
  Given repeated variable access patterns
  When measuring interpolation performance
  Then repeated access should have less than 1ms overhead

Scenario: Cache is node-scoped
  Given interpolation cache from node A
  When node B starts
  Then node A's cache should be cleared
  And node B should start with fresh cache
```

**Rationale**:
Context interpolation may occur frequently during workflow execution. Caching prevents repeated computation and improves overall execution speed.

---

#### FR-OR-037: Node Queue Management Efficiency

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-006 |
| **Dependencies** | FR-OR-020 |

**Requirement**:
The system SHALL manage node queues efficiently for large dynamic expansions so that workflows with many nodes don't cause memory or performance issues.

**Acceptance Criteria**:

```gherkin
Scenario: Handle large node count
  Given a workflow that dynamically expands to 1000+ nodes
  When the workflow executes
  Then the system should handle all nodes
  And no memory issues should occur

Scenario: Efficient queue operations
  Given a large node queue
  When nodes are enqueued and dequeued
  Then operations should complete in constant time
  And queue size should not affect operation speed

Scenario: Memory usage is bounded
  Given nodes are being processed
  When completed nodes exist
  Then completed node details can be swapped to disk
  And only active nodes need to remain in memory

Scenario: Progress tracking scales
  Given 1000+ nodes in queue
  When progress is reported
  Then progress calculation should be efficient
  And UI should remain responsive
```

**Rationale**:
Dynamic node expansion could create very large node queues. Efficient queue management prevents memory issues and maintains performance at scale.

---

### 2.11 Execution Artifacts

This section covers persistence of execution artifacts for debugging and auditing.

---

#### FR-OR-038: Execution Artifact Persistence

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-001 |
| **Dependencies** | FR-OR-004 |

**Requirement**:
The system SHALL save execution artifacts including prompts, outputs, and message history so that executions can be reviewed and debugged.

**Acceptance Criteria**:

```gherkin
Scenario: Save prompt sent to agent
  Given an agent execution completes
  When artifacts are persisted
  Then the prompt sent to the agent should be saved
  And the prompt file should be human-readable

Scenario: Save complete output from agent
  Given an agent produces output during execution
  When artifacts are persisted
  Then the complete output should be saved
  And no truncation should occur for normal-sized outputs

Scenario: Save message history for conversations
  Given an agent has a multi-turn conversation
  When artifacts are persisted
  Then the complete message history should be saved
  And the conversation flow should be reconstructable

Scenario: Save execution metadata
  Given an agent execution completes
  When artifacts are persisted
  Then timestamps should be recorded
  And model information should be included
  And token usage should be captured if available

Scenario: Artifacts organized by task and node
  Given multiple nodes execute for a task
  When artifacts are persisted
  Then artifacts should be organized in task directory
  And each node should have its own artifact subdirectory

Scenario: Artifacts in human-readable format
  Given artifacts are persisted
  When a user opens an artifact file
  Then the content should be readable without special tools
  And JSON files should be formatted with indentation
```

**Rationale**:
Execution artifacts enable post-execution review, debugging, compliance auditing, and quality improvement. Artifacts provide evidence of what actually happened during execution.

---

### 2.12 Validation Utilities

This section covers validation utilities for verifying node outputs, including retry logic, deterministic checks, and AI validation orchestration.

---

#### FR-OR-039: Validation Retry with Error Feedback

| Attribute         | Value                                |
| ----------------- | ------------------------------------ |
| **ID**            | FR-OR-039                            |
| **Title**         | Validation Retry with Error Feedback |
| **Priority**      | High                                 |
| **Implements**    | HL-VL-003                            |
| **Migrated From** | FR-VL-006 (Validation Manager)       |

**Requirement**:
The system SHALL retry agent execution with error feedback when validation fails so that agents can correct output structure.

**Acceptance Criteria**:

```gherkin
Scenario: Retry on validation failure
  Given agent output fails schema validation
  When retry is triggered
  Then the agent should be re-executed
  And validation errors should be included in the retry prompt

Scenario: Error feedback is specific
  Given validation failed for field "count" (expected integer, got string)
  When retry prompt is prepared
  Then it should specify the field name
  And show expected vs actual type

Scenario: Correction guidance included
  Given a validation failure
  When retry prompt is prepared
  Then guidance on how to correct the output should be included

Scenario: Retry limit enforced
  Given validation fails repeatedly
  When max retries is reached
  Then the node should fail
  And all retry attempts should be logged
```

**Rationale**:
Agents may produce invalid outputs on first attempt. Retry with specific error feedback enables agents to correct issues.

---

#### FR-OR-040: Validation Error Messaging

| Attribute         | Value                          |
| ----------------- | ------------------------------ |
| **ID**            | FR-OR-040                      |
| **Title**         | Validation Error Messaging     |
| **Priority**      | High                           |
| **Implements**    | HL-VL-003                      |
| **Migrated From** | FR-VL-007 (Validation Manager) |

**Requirement**:
The system SHALL provide detailed validation error messages with field-level feedback so that users can understand and fix validation failures.

**Acceptance Criteria**:

```gherkin
Scenario: Field-level error identification
  Given output with multiple validation errors
  When validation fails
  Then each failing field should be identified
  And its specific error should be described

Scenario: Expected vs actual comparison
  Given a type mismatch error
  When the error message is generated
  Then expected type should be shown
  And actual type should be shown

Scenario: Correction guidance
  Given a validation error
  When the error message is displayed
  Then it should suggest how to fix the issue
```

**Rationale**:
Validation failures can be difficult to diagnose. Field-level error messages enable rapid identification and correction of issues.

---

#### FR-OR-041: Maximum Retry Enforcement

| Attribute         | Value                          |
| ----------------- | ------------------------------ |
| **ID**            | FR-OR-041                      |
| **Title**         | Maximum Retry Enforcement      |
| **Priority**      | Critical                       |
| **Implements**    | HL-VL-003                      |
| **Dependencies**  | FR-OR-039                      |
| **Migrated From** | FR-VL-008 (Validation Manager) |

**Requirement**:
The system SHALL enforce maximum retry limits for validation failures so that workflows don't retry indefinitely.

**Acceptance Criteria**:

```gherkin
Scenario: Retry limit stops execution
  Given max retries configured as 3
  And validation fails on all attempts
  When the 4th attempt would occur
  Then the node should fail instead
  And "Max retries exceeded" should be indicated

Scenario: Configurable retry limit
  Given a workflow with "validation.maxRetries: 5"
  When validation fails
  Then up to 5 retry attempts should be allowed

Scenario: Global default applies
  Given a workflow without retry configuration
  When validation fails
  Then the global default retry limit should apply

Scenario: Retry attempts logged
  Given validation retries occur
  When execution completes or fails
  Then all retry attempts should be visible in logs
```

**Rationale**:
Some agents may be unable to produce valid outputs. Retry limits prevent infinite loops and provide clear failure conditions.

---

#### FR-OR-042: File Existence Validation Check

| Attribute         | Value                           |
| ----------------- | ------------------------------- |
| **ID**            | FR-OR-042                       |
| **Title**         | File Existence Validation Check |
| **Priority**      | High                            |
| **Implements**    | HL-VL-005                       |
| **Migrated From** | FR-VL-009 (Validation Manager)  |

**Requirement**:
The system SHALL validate that required files exist after node execution so that file creation tasks can be verified with zero-cost deterministic checks.

**Acceptance Criteria**:

```gherkin
Scenario: Single file existence check
  Given a node with validation.file_exists: "src/component.ts"
  When the node completes
  Then the system should check if src/component.ts exists
  And validation should pass if file exists

Scenario: Multiple file existence checks
  Given a node with validation.file_exists: ["src/component.ts", "src/component.test.ts"]
  When the node completes
  Then the system should check all files exist
  And validation should fail if any file is missing

Scenario: Missing file triggers failure
  Given a node with validation.file_exists: "src/missing.ts"
  And the file does not exist
  When validation runs
  Then validation should fail
  And error should identify the missing file

Scenario: File paths support path variables
  Given a node with validation.file_exists: "src/{{component_name}}.ts"
  And context contains component_name: "Button"
  When validation runs
  Then the system should check for src/Button.ts
```

**Rationale**:
Many nodes claim to create files but don't. File existence validation catches this failure mode with zero-cost deterministic check.

---

#### FR-OR-043: Command Success Validation Check

| Attribute         | Value                            |
| ----------------- | -------------------------------- |
| **ID**            | FR-OR-043                        |
| **Title**         | Command Success Validation Check |
| **Priority**      | High                             |
| **Implements**    | HL-VL-005                        |
| **Migrated From** | FR-VL-010 (Validation Manager)   |

**Requirement**:
The system SHALL validate that specified commands succeed (exit code 0) after node execution so that external validation tools can verify node outputs.

**Acceptance Criteria**:

```gherkin
Scenario: Single command validation
  Given a node with validation.command_succeeds: "npm test"
  When the node completes
  Then the system should execute npm test
  And validation should pass if exit code is 0

Scenario: Multiple command validation
  Given a node with validation.command_succeeds: ["npm test", "npm run lint"]
  When the node completes
  Then the system should execute both commands
  And validation should pass only if all exit codes are 0

Scenario: Command failure triggers validation failure
  Given a node with validation.command_succeeds: "npm test"
  And the test command returns exit code 1
  When validation runs
  Then validation should fail
  And command output should be captured for debugging

Scenario: Commands execute sequentially
  Given multiple validation commands
  When validation runs
  Then commands should execute in order
  And first failure should stop the chain
```

**Rationale**:
External validation tools (test runners, linters, type checkers) provide deterministic validation. Command success checks leverage these tools.

---

#### FR-OR-044: Multiple Validation File Checks

| Attribute         | Value                           |
| ----------------- | ------------------------------- |
| **ID**            | FR-OR-044                       |
| **Title**         | Multiple Validation File Checks |
| **Priority**      | High                            |
| **Implements**    | HL-VL-005                       |
| **Dependencies**  | FR-OR-042                       |
| **Migrated From** | FR-VL-011 (Validation Manager)  |

**Requirement**:
The system SHALL support validating existence of multiple files so that nodes creating multiple artifacts can be fully verified.

**Acceptance Criteria**:

```gherkin
Scenario: Validate all expected artifacts
  Given a node that should create component, test, and story files
  And validation.file_exists: ["src/Button.tsx", "src/Button.test.tsx", "src/Button.stories.tsx"]
  When validation runs
  Then all three files should be checked
  And validation should pass only if all exist

Scenario: Partial creation detected
  Given validation expects three files
  And only two files were created
  When validation runs
  Then validation should fail
  And error should list the missing file(s)
```

**Rationale**:
Nodes often create multiple artifacts (source file, test file, documentation). Validation should check all expected files exist.

---

#### FR-OR-045: Validation Path Variable Resolution

| Attribute         | Value                               |
| ----------------- | ----------------------------------- |
| **ID**            | FR-OR-045                           |
| **Title**         | Validation Path Variable Resolution |
| **Priority**      | High                                |
| **Implements**    | HL-VL-005                           |
| **Dependencies**  | FR-OR-042                           |
| **Migrated From** | FR-VL-012 (Validation Manager)      |

**Requirement**:
The system SHALL resolve path variables in validation file paths so that dynamic paths can be validated.

**Acceptance Criteria**:

```gherkin
Scenario: Task ID substitution
  Given validation.file_exists: ".flowmaster/tasks/{{taskId}}/output.json"
  And current taskId is "TASK-123"
  When validation runs
  Then it should check for .flowmaster/tasks/TASK-123/output.json

Scenario: Context variable resolution
  Given validation.file_exists: "src/{{module}}/{{component}}.ts"
  And context contains module: "ui", component: "Button"
  When validation runs
  Then it should check for src/ui/Button.ts

Scenario: Unresolved variable error
  Given validation.file_exists: "src/{{undefined_var}}.ts"
  And undefined_var is not in context
  When validation runs
  Then an error should indicate unresolved variable
```

**Rationale**:
Validation file paths depend on runtime values like taskId. Path variable resolution enables dynamic path construction.

---

#### FR-OR-046: Glob Pattern Validation Support

| Attribute         | Value                           |
| ----------------- | ------------------------------- |
| **ID**            | FR-OR-046                       |
| **Title**         | Glob Pattern Validation Support |
| **Priority**      | High                            |
| **Implements**    | HL-VL-005                       |
| **Dependencies**  | FR-OR-042                       |
| **Migrated From** | FR-VL-014 (Validation Manager)  |

**Requirement**:
The system SHALL support glob patterns in file existence validation so that multiple expected files can be validated with a single pattern.

**Acceptance Criteria**:

```gherkin
Scenario: Glob pattern matches multiple files
  Given validation.file_exists: "src/components/*.tsx"
  And files Button.tsx, Card.tsx, Modal.tsx exist in src/components/
  When validation runs
  Then validation should pass
  And all matching files should be verified

Scenario: Glob pattern with no matches fails
  Given validation.file_exists: "src/components/*.test.tsx"
  And no test files exist
  When validation runs
  Then validation should fail
  And error should indicate no files matched the pattern

Scenario: Recursive glob patterns supported
  Given validation.file_exists: "src/**/*.test.ts"
  When validation runs
  Then files in nested directories should be checked

Scenario: Multiple glob patterns
  Given validation.file_exists: ["src/*.ts", "test/*.test.ts"]
  When validation runs
  Then both patterns should be evaluated
  And all patterns must have matches to pass

Scenario: Glob expansion logged
  Given a glob pattern validation
  When validation runs
  Then the matched files should be logged
  And the count of matches should be reported
```

**Rationale**:
Glob patterns enable validating multiple related files with a single specification, reducing workflow verbosity and ensuring complete artifact verification.

---

#### FR-OR-047: Layered Validation System

| Attribute         | Value                          |
| ----------------- | ------------------------------ |
| **ID**            | FR-OR-047                      |
| **Title**         | Layered Validation System      |
| **Priority**      | High                           |
| **Implements**    | HL-VL-004                      |
| **Migrated From** | FR-VL-015 (Validation Manager) |

**Requirement**:
The system SHALL provide layered validation with deterministic checks first and AI validation agent fallback so that agent shortcuts and incomplete work are caught efficiently.

**Acceptance Criteria**:

```gherkin
Scenario: Deterministic checks run first
  Given a node with both file_exists and ai_validation configured
  When validation executes
  Then file existence checks should run first
  And AI validation should only run if deterministic checks pass

Scenario: AI validation as fallback
  Given a node where deterministic checks pass
  But work quality needs verification
  When AI validation runs
  Then it should investigate the actual output
  And return a structured decision

Scenario: Skip AI when deterministic sufficient
  Given a node with skip_ai_validation: true
  And all deterministic checks pass
  When validation completes
  Then AI validation should not be invoked
  And the node should proceed

Scenario: Combined validation layers
  Given a node with file checks, command checks, and AI validation
  When validation executes
  Then all layers should run in order
  And any failure should stop the chain
```

**Rationale**:
AI agents can "shortcut" by claiming task completion without actually doing work. Layered validation catches these shortcuts through deterministic checks (file existence, command success) and AI investigation when needed.

---

#### FR-OR-048: Validation Agent Decision Handling

| Attribute         | Value                              |
| ----------------- | ---------------------------------- |
| **ID**            | FR-OR-048                          |
| **Title**         | Validation Agent Decision Handling |
| **Priority**      | High                               |
| **Implements**    | HL-VL-004                          |
| **Migrated From** | FR-VL-017 (Validation Manager)     |

**Requirement**:
The system SHALL process validation agent decisions to continue, retry, or fail the workflow so that validation outcomes control workflow flow.

**Acceptance Criteria**:

```gherkin
Scenario: Continue decision advances workflow
  Given a validation agent returns decision "continue"
  When the orchestrator processes the decision
  Then the workflow should advance to the next node
  And the decision reasoning should be logged

Scenario: Retry decision re-executes node
  Given a validation agent returns decision "retry"
  With feedback "missing unit tests for new function"
  When the orchestrator processes the decision
  Then the current node should re-execute
  And the feedback should be included in the retry prompt

Scenario: Fail decision stops workflow
  Given a validation agent returns decision "fail"
  With reason "fundamentally wrong approach"
  When the orchestrator processes the decision
  Then the workflow should transition to failed state
  And the reason should be recorded

Scenario: Decision includes confidence
  Given a validation agent makes a decision
  When the decision is returned
  Then it should include a confidence level
  And the confidence should inform retry behavior
```

**Rationale**:
Validation agent investigates completion and returns structured decision: continue if work verifiably complete, retry if incomplete/missing, fail if fundamentally wrong.

---

## 3. Error Handling Requirements

### 3.1 Error Scenarios

| Error Scenario                 | Expected Behavior                      | Error Code |
| ------------------------------ | -------------------------------------- | ---------- |
| Graph definition not found     | Return clear error with searched paths | ERR_OR_001 |
| Invalid graph JSON syntax      | Return error with location             | ERR_OR_002 |
| Circular dependency detected   | Return error identifying the cycle     | ERR_OR_003 |
| Node type not found            | Return error with node type name       | ERR_OR_004 |
| Node output missing            | Return error with node ID              | ERR_OR_005 |
| Validation schema invalid      | Return error with schema details       | ERR_OR_006 |
| Output validation failed       | Retry or fail with field details       | ERR_OR_007 |
| Max retries exceeded           | Fail node with retry history           | ERR_OR_008 |
| Abort signal received          | Clean termination                      | ERR_OR_009 |
| State machine transition error | Log and attempt recovery               | ERR_OR_010 |

### 3.2 Retry Behavior

| Condition              | Retry? | Max Attempts | Backoff Strategy |
| ---------------------- | ------ | ------------ | ---------------- |
| Node execution timeout | Yes    | 3            | Exponential      |
| Validation failure     | Yes    | 3            | None             |
| Network error          | Yes    | 5            | Exponential      |
| Node returns error     | Yes    | 3            | Linear           |
| Schema parse error     | No     | -            | -                |
| Graph definition error | No     | -            | -                |
| Circular dependency    | No     | -            | -                |

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface         | Provider Component             | Purpose                                        |
| ----------------- | ------------------------------ | ---------------------------------------------- |
| Node Execution    | COMP-007 Agent Executor        | Execute nodes (dispatch to node type handlers) |
| Execution Status  | COMP-007 Agent Executor        | Receive node completion/failure                |
| Task State        | COMP-003 State Manager         | Query and update execution state               |
| Workflow Events   | COMP-001 Message Bus           | Emit lifecycle events                          |
| Graph Definitions | COMP-002 Configuration Manager | Load graph JSON files                          |

### 4.2 Provided Interfaces (Dependents)

| Interface         | Consumer Component(s)   | Purpose                             |
| ----------------- | ----------------------- | ----------------------------------- |
| Execution Control | COMP-009 User Interface | Start, pause, resume, cancel graphs |
| Execution Status  | COMP-009 User Interface | Current graph/node state            |
| Progress Updates  | COMP-004 Telemetry      | Execution progress for tracing      |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity             | Description                                | Persistence                   |
| ------------------ | ------------------------------------------ | ----------------------------- |
| Graph Definition   | Parsed graph JSON structure (nodes, edges) | In-memory (loaded from file)  |
| Execution Context  | Current state machine context              | In-memory + Persisted         |
| Shared Context     | Outputs from completed nodes               | Persisted                     |
| Node Outputs       | Individual node execution results          | Persisted (in shared context) |
| Iteration State    | Current loop counters and checkpoints      | Persisted                     |
| Validation Results | Schema validation outcomes                 | In-memory                     |

### 5.2 Data Constraints

| Constraint               | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| Unique node IDs          | Node IDs must be unique within a graph                   |
| Valid edges              | Edges must reference existing nodes                      |
| No circular dependencies | Dependency graph must be acyclic (except for Loop nodes) |
| Schema compatibility     | Output schemas must be valid JSON Schema                 |

---

## 6. Traceability

### 6.1 HL Requirement Decomposition

| HL Requirement | Functional Requirements                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HL-WF-001      | FR-OR-004, FR-OR-005, FR-OR-006, FR-OR-007, FR-OR-008, FR-OR-009, FR-OR-025, FR-OR-026, FR-OR-029, FR-OR-030, FR-OR-031, FR-OR-032, FR-OR-033, FR-OR-038 |
| HL-WF-002      | FR-OR-001, FR-OR-002, FR-OR-003, FR-OR-034, FR-OR-035                                                                                                    |
| HL-WF-003      | FR-OR-010                                                                                                                                                |
| HL-WF-004      | FR-OR-011, FR-OR-012, FR-OR-013, FR-OR-014, FR-OR-015, FR-OR-016, FR-OR-017, FR-OR-036                                                                   |
| HL-WF-005      | FR-OR-018, FR-OR-019                                                                                                                                     |
| HL-WF-006      | FR-OR-020, FR-OR-021, FR-OR-022, FR-OR-023, FR-OR-037                                                                                                    |
| HL-WF-007      | FR-OR-024                                                                                                                                                |
| HL-WF-008      | FR-OR-027, FR-OR-028                                                                                                                                     |
| HL-WF-009      | FR-OR-009                                                                                                                                                |
| HL-VL-003      | FR-OR-039, FR-OR-040, FR-OR-041                                                                                                                          |
| HL-VL-004      | FR-OR-047, FR-OR-048                                                                                                                                     |
| HL-VL-005      | FR-OR-042, FR-OR-043, FR-OR-044, FR-OR-045, FR-OR-046                                                                                                    |

### 6.2 Requirements Summary

| Category                       | Count | Critical | High | Medium | Low |
| ------------------------------ | ----- | -------- | ---- | ------ | --- |
| Core Lifecycle                 | 8     | 6        | 2    | 0      | 0   |
| Graph Structure & Node Types   | 2     | 2        | 0    | 0      | 0   |
| Node Dependencies & Context    | 7     | 4        | 1    | 2      | 0   |
| Conditional Execution          | 2     | 0        | 1    | 1      | 0   |
| Iterative Execution            | 4     | 0        | 2    | 2      | 0   |
| Control Operations             | 3     | 0        | 3    | 0      | 0   |
| AI-Assisted Clarification      | 2     | 0        | 1    | 1      | 0   |
| Graph Composition              | 2     | 0        | 2    | 0      | 0   |
| Execution Operations Interface | 4     | 1        | 2    | 1      | 0   |
| Performance Optimization       | 3     | 0        | 0    | 3      | 0   |
| Execution Artifacts            | 1     | 0        | 1    | 0      | 0   |
| Validation Utilities           | 10    | 1        | 9    | 0      | 0   |
| **Total**                      | 48    | 14       | 24   | 10     | 0   |

---

## 7. Open Questions

| Question ID | Question                                                                   | Owner | Target Date | Resolution |
| ----------- | -------------------------------------------------------------------------- | ----- | ----------- | ---------- |
| Q-OR-001    | Should validation retries use the same agent session or fresh session?     | TBD   | TBD         | Pending    |
| Q-OR-002    | How should parallel node failures be aggregated for reporting?             | TBD   | TBD         | Pending    |
| Q-OR-003    | What is the maximum supported workflow depth (nested workflows via uses:)? | TBD   | TBD         | Pending    |

---

## 8. Requirements Index

| ID        | Title                                           | Priority | Implements | Status |
| --------- | ----------------------------------------------- | -------- | ---------- | ------ |
| FR-OR-001 | Workflow Definition Persistence                 | Critical | HL-WF-002  | Draft  |
| FR-OR-002 | Workflow Validation                             | High     | HL-WF-002  | Draft  |
| FR-OR-003 | Backward Compatible Workflows                   | Critical | HL-WF-002  | Draft  |
| FR-OR-004 | Workflow State Machine Coordination             | Critical | HL-WF-001  | Draft  |
| FR-OR-005 | Workflow Execution Command                      | Critical | HL-WF-001  | Draft  |
| FR-OR-006 | Workflow Lifecycle Events                       | Critical | HL-WF-001  | Draft  |
| FR-OR-007 | Node Lifecycle Events                           | Critical | HL-WF-001  | Draft  |
| FR-OR-008 | Execution Result Reporting                      | Critical | HL-WF-001  | Draft  |
| FR-OR-009 | Flat DAG Execution Model                        | Critical | HL-WF-001  | Draft  |
| FR-OR-010 | Node Type Registry                              | Critical | HL-WF-003  | Draft  |
| FR-OR-011 | Context Loading from Dependencies               | Critical | HL-WF-004  | Draft  |
| FR-OR-012 | Node Context Source Specification               | Critical | HL-WF-004  | Draft  |
| FR-OR-013 | Node Output Reference Resolution                | Critical | HL-WF-004  | Draft  |
| FR-OR-014 | Node Output Management                          | Critical | HL-WF-004  | Draft  |
| FR-OR-015 | Automatic Context Tag Generation                | Medium   | HL-WF-004  | Draft  |
| FR-OR-016 | Optional Context Item Support                   | High     | HL-WF-004  | Draft  |
| FR-OR-017 | Multiple File Concatenation with Headers        | Medium   | HL-WF-004  | Draft  |
| FR-OR-018 | Schema-Based Conditional Execution              | High     | HL-WF-005  | Draft  |
| FR-OR-019 | Conditional Node Execution with skipIf          | Medium   | HL-WF-005  | Draft  |
| FR-OR-020 | Loop Node Configuration                         | High     | HL-WF-006  | Draft  |
| FR-OR-021 | Exponential Backoff for Iterations              | Medium   | HL-WF-006  | Draft  |
| FR-OR-022 | Nested Iteration Support                        | Medium   | HL-WF-006  | Draft  |
| FR-OR-023 | Iterative Execution with Checkpoints            | High     | HL-WF-006  | Draft  |
| FR-OR-024 | Human Input Nodes                               | High     | HL-WF-007  | Draft  |
| FR-OR-025 | Abort Signal Handling                           | High     | HL-WF-001  | Draft  |
| FR-OR-026 | Process Group Cleanup                           | High     | HL-WF-001  | Draft  |
| FR-OR-027 | Coordinator Tool                                | High     | HL-WF-008  | Draft  |
| FR-OR-028 | Clarification Logging                           | Medium   | HL-WF-008  | Draft  |
| FR-OR-029 | SubFlow Node Invocation                         | High     | HL-WF-001  | Draft  |
| FR-OR-030 | Dynamic Workflow Triggering                     | High     | HL-WF-001  | Draft  |
| FR-OR-031 | Graph and Node Execution Operations             | Critical | HL-WF-001  | Draft  |
| FR-OR-032 | Unified Execution Interface with Type Selection | High     | HL-WF-001  | Draft  |
| FR-OR-033 | Automatic Execution Type Resolution             | Medium   | HL-WF-001  | Draft  |
| FR-OR-034 | Terminology Migration Support                   | High     | HL-WF-002  | Draft  |
| FR-OR-035 | Lazy Graph Definition Loading                   | Medium   | HL-WF-002  | Draft  |
| FR-OR-036 | Context Interpolation Caching                   | Medium   | HL-WF-004  | Draft  |
| FR-OR-037 | Node Queue Management Efficiency                | Medium   | HL-WF-006  | Draft  |
| FR-OR-038 | Execution Artifact Persistence                  | High     | HL-WF-001  | Draft  |
| FR-OR-039 | Validation Retry with Error Feedback            | High     | HL-VL-003  | Draft  |
| FR-OR-040 | Validation Error Messaging                      | High     | HL-VL-003  | Draft  |
| FR-OR-041 | Maximum Retry Enforcement                       | Critical | HL-VL-003  | Draft  |
| FR-OR-042 | File Existence Validation Check                 | High     | HL-VL-005  | Draft  |
| FR-OR-043 | Command Success Validation Check                | High     | HL-VL-005  | Draft  |
| FR-OR-044 | Multiple Validation File Checks                 | High     | HL-VL-005  | Draft  |
| FR-OR-045 | Validation Path Variable Resolution             | High     | HL-VL-005  | Draft  |
| FR-OR-046 | Glob Pattern Validation Support                 | High     | HL-VL-005  | Draft  |
| FR-OR-047 | Layered Validation System                       | High     | HL-VL-004  | Draft  |
| FR-OR-048 | Validation Agent Decision Handling              | High     | HL-VL-004  | Draft  |

---

## Document History

| Version | Date       | Author          | Changes                                                                                                                                                                                                                                                                                                              |
| ------- | ---------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-01-25 | FlowMaster Team | Initial version                                                                                                                                                                                                                                                                                                      |
| 1.1     | 2025-11-26 | Claude          | Added execution artifacts, context formatting, CLI, backward compatibility, validation extensions, performance optimization                                                                                                                                                                                          |
| 1.2     | 2025-11-26 | Claude          | Added sub-workflow invocation, dynamic workflow triggering                                                                                                                                                                                                                                                           |
| 2.0     | 2025-11-26 | Claude          | Reorganized for progressive disclosure: renumbered sections and FRs, grouped related requirements, updated component ID to COMP-007                                                                                                                                                                                  |
| 2.1     | 2025-11-27 | Claude          | Extracted validation to COMP-008 Validation Manager; updated component ID to COMP-008; renumbered sections 2.6-2.11 and FRs 025-039; added Validation interface dependency                                                                                                                                           |
| 3.0     | 2025-12-03 | Claude          | Added Section 2.12 Validation Utilities; migrated FR-VL-006, FR-VL-007, FR-VL-008, FR-VL-009, FR-VL-010, FR-VL-011, FR-VL-012, FR-VL-014, FR-VL-015, FR-VL-017 from Validation Manager as FR-OR-039 through FR-OR-048                                                                                                |
| 3.1     | 2025-12-15 | Claude          | Updated CLI-specific references to generic UI references for desktop-first approach                                                                                                                                                                                                                                  |
| 4.0     | 2025-12-25 | Claude          | **Major revision**: Replaced three-tier hierarchy (Workflow → Phase → Command) with flat DAG execution model. Updated all terminology: "phase" → "node", "command" → "node". Rewrote FR-OR-009 (Flat DAG), FR-OR-010 (Node Type Registry), FR-OR-027/028 (Coordinator Tool). Added execution model overview section. |
