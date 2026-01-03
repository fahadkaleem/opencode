# Pipeline Elimination Migration Guide

> **Document Version**: 1.0
> **Date**: 2025-11-30
> **Status**: Ready for Execution
> **Purpose**: Ultra-detailed guide for AI agent to execute 4-tier to 3-tier hierarchy migration
> **Estimated Changes**: ~193 across ~20 files

---

## Executive Summary

### What We're Doing

Eliminating the 4-tier hierarchy (Pipeline → Workflow → Phase → Command) in favor of a 3-tier model (Workflow → Phase → Command).

### Key Principles

1. **"Pipeline" is no longer a tier** - It's just a workflow that composes other workflows via `uses:`
2. **Workflow is now the top-level container**
3. **Agent hierarchy is by depth**, not tier name
4. **`uses:` enables recursive composition** (like GitHub Actions)

### Terminology Changes

| Old Term                              | New Term                            |
| ------------------------------------- | ----------------------------------- |
| Pipeline                              | (removed as tier)                   |
| Pipeline Agent                        | Top-level Workflow Agent            |
| Pipeline → Workflow → Phase → Command | Workflow → Phase → Command          |
| `pipelineId`                          | `workflowId`                        |
| `startPipeline`                       | (removed - use `startWorkflow`)     |
| Escalate to Pipeline                  | Escalate to Parent Workflow or User |

---

## File-by-File Migration Instructions

Each file section contains:

- **File path**
- **Priority** (Critical/High/Medium/Low)
- **Total changes expected**
- **Detailed change instructions** with line numbers, current text, and replacement text
- **Verification steps**

---

## FILE 1: High-Level Requirements

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/02-high-level-requirements/02-requirements.md`

**Priority**: CRITICAL

**Total Changes**: 18

### Change 1.1: REMOVE HL-WF-008

**Location**: Lines 284-305 (approximate)

**Action**: DELETE entire requirement block

**Current Text**:

```markdown
#### HL-WF-008: Pipeline-Based Workflow Coordination

| Attribute     | Value                 |
| ------------- | --------------------- |
| **Priority**  | High                  |
| **Traces to** | BG-001, BG-002        |
| **Personas**  | Engineering Team Lead |

**Requirement**:
The system SHALL support pipelines that coordinate multiple workflows with dependency specifications and execution conditions so that complex multi-workflow automation can be composed from simpler workflows.

**Rationale**:
Complex development scenarios require orchestrating multiple workflows (e.g., planning workflow → development workflow → deployment workflow). Pipelines enable this composition while keeping individual workflows simple and reusable.

**Success Criteria**:

- Pipelines can specify multiple workflows to execute
- Workflows within pipelines can declare dependencies on other workflows
- Pipelines can specify execution conditions for workflows
- Workflow outputs are available to dependent workflows within the pipeline

**Derived from**: FR-207, FR-208, FR-213, FR-214
```

**Replacement**: DELETE ENTIRELY

**Rationale**: Pipeline tier eliminated. Workflow composition via `uses:` replaces this.

---

### Change 1.2: UPDATE HL-WF-009

**Location**: Lines 308-331 (approximate)

**Action**: UPDATE requirement text

**Find**:

```
The system SHALL support hierarchical agent communication where agents executing commands can request clarification from workflow agents, and workflow agents can escalate questions to pipeline agents so that agents can make informed decisions during execution without requiring human intervention for routine clarifications.
```

**Replace With**:

```
The system SHALL support hierarchical agent communication where agents executing commands can request clarification from phase agents, and phase agents can escalate to workflow agents, so that agents can make informed decisions during execution without requiring human intervention for routine clarifications. Workflow agents that cannot answer escalate directly to the user.
```

**Find** (in Rationale):

```
Workflow agents maintain context across all phases; pipeline agents maintain project-wide context.
```

**Replace With**:

```
Workflow agents maintain context across all phases and can answer questions requiring project-level context.
```

**Find** (in Success Criteria):

```
- Workflow agents can escalate questions requiring project-level decisions to pipeline agents
```

**Replace With**:

```
- Workflow agents can escalate questions they cannot answer directly to the user
```

---

### Change 1.3: UPDATE HL-WF-010

**Location**: Lines 333-358 (approximate)

**Action**: UPDATE requirement text

**Find**:

```
The system SHALL support dynamic expansion at runtime where pipelines, workflows, and phases can spawn additional units based on output arrays
```

**Replace With**:

```
The system SHALL support dynamic expansion at runtime where workflows and phases can spawn additional units based on output arrays
```

**Find** (in Success Criteria):

```
- Pipelines can expand into multiple workflows based on output arrays (e.g., discover 3 workstreams → spawn 3 workflows)
```

**Replace With**: DELETE this bullet entirely

---

### Change 1.4: REMOVE HL-WF-011

**Location**: Lines 360-382 (approximate)

**Action**: DELETE entire requirement block

**Current Text**:

```markdown
#### HL-WF-011: Pipeline-Based Multi-Level Orchestration

| Attribute     | Value                  |
| ------------- | ---------------------- |
| **Priority**  | High                   |
| **Traces to** | BG-001, BG-002, BG-004 |
| **Personas**  | Engineering Team Lead  |

**Requirement**:
The system SHALL support a three-tier orchestration hierarchy (Pipeline → Workflow → Phase) with cross-level context passing and conditional branching so that complex multi-workflow automation can be organized hierarchically.

**Rationale**:
Large development initiatives require orchestrating multiple workflows with dependencies and conditional execution. A pipeline layer enables coordinating entire workflows as units, with outputs from one workflow flowing to dependent workflows.

**Success Criteria**:

- Pipelines can contain multiple workflows with dependencies
- Pipelines support conditional branching based on workflow results
- Context passes between workflows within a pipeline
- Pipelines, workflows, and phases can be executed via unified command interface
- Hierarchical execution is tracked for monitoring and debugging
```

**Replacement**: DELETE ENTIRELY

**Rationale**: Redundant with 3-tier model. Workflow composition via `uses:` provides this capability.

---

### Change 1.5: UPDATE HL-OB-001

**Location**: Lines 1194-1216 (approximate)

**Action**: UPDATE hierarchy reference

**Find**:

```
(Pipeline → Workflow → Phase → Command)
```

**Replace With**:

```
(Workflow → Phase → Command)
```

---

### Change 1.6: UPDATE HL-OB-004

**Location**: Lines 1269-1290 (approximate)

**Action**: UPDATE hierarchy references

**Find**:

```
per command, phase, workflow, and pipeline
```

**Replace With**:

```
per command, phase, and workflow
```

**Find**:

```
(command → phase → workflow → pipeline)
```

**Replace With**:

```
(command → phase → workflow)
```

---

### Change 1.7: UPDATE NFR-MNT-004

**Location**: Lines 2010-2028 (approximate)

**Action**: UPDATE hierarchy reference

**Find**:

```
pipeline → workflow → phase hierarchy
```

**Replace With**:

```
workflow → phase → command hierarchy
```

---

### Change 1.8: UPDATE Business Goal Coverage Table

**Location**: Lines 2062-2066 (approximate)

**Action**: REMOVE references to deleted requirements

**Find**: All occurrences of `HL-WF-008` and `HL-WF-011` in the table

**Replace With**: DELETE these requirement IDs from each row they appear in

---

### Change 1.9: UPDATE Requirements Summary Table

**Location**: Lines 2080-2096 (approximate)

**Action**: UPDATE count

**Find**:

```
| Workflow Execution (HL-WF) | 11 | 4 | 7 | 0 | 0 |
```

**Replace With**:

```
| Workflow Execution (HL-WF) | 9 | 4 | 5 | 0 | 0 |
```

---

### Change 1.10: REMOVE Glossary Entry - Pipeline

**Location**: Lines 2113-2114 (approximate)

**Action**: DELETE row

**Find**:

```
| **Pipeline** | Top-level container that holds and coordinates multiple workflows with dependencies and conditional branching. Pipelines orchestrate workflows. |
```

**Replace With**: DELETE ENTIRELY

---

### Change 1.11: REMOVE Glossary Entry - Pipeline Agent

**Location**: Lines 2132-2133 (approximate)

**Action**: DELETE row

**Find**:

```
| **Pipeline Agent** | Long-running AI agent session that coordinates multiple workflows, maintains project-wide context, and answers workflow-level escalations |
```

**Replace With**: DELETE ENTIRELY

---

### Change 1.12: UPDATE Glossary Entry - Escalation

**Location**: Lines 2135 (approximate)

**Action**: UPDATE definition

**Find**:

```
| **Escalation** | Process where workflow agents forward questions they cannot answer to pipeline agents with broader context |
```

**Replace With**:

```
| **Escalation** | Process where command agents forward questions they cannot answer to phase agents, phase agents to workflow agents, and workflow agents to the user |
```

---

### Change 1.13: UPDATE Execution Hierarchy Diagram

**Location**: Lines 2317-2322 (approximate)

**Action**: UPDATE diagram

**Find**:

```
**Execution Hierarchy** (containers):
```

Pipeline (orchestrates workflows)
└── Workflow (orchestrates phases)
└── Phase (orchestrates commands)
└── Command (atomic, executed by Agent)

```

```

**Replace With**:

```
**Execution Hierarchy** (containers):
```

Workflow (orchestrates phases, can reference other workflows via uses:)
└── Phase (orchestrates commands)
└── Command (atomic, executed by Agent)

```

```

---

### Change 1.14: UPDATE Correct Usage Examples

**Location**: Lines 2329-2331 (approximate)

**Action**: UPDATE examples

**Find**:

```
**Correct Usage**:
- "A pipeline orchestrates workflows" ✓
- "The workflow orchestration layer" ✓
- "An orchestration contains workflows" ✗ (use "pipeline")
```

**Replace With**:

```
**Correct Usage**:
- "A workflow orchestrates phases" ✓
- "A workflow can reference other workflows via uses:" ✓
- "The workflow orchestration layer" ✓
```

---

### Change 1.15: UPDATE Common Pitfalls

**Location**: Lines 2333-2336 (approximate)

**Action**: UPDATE guidance

**Find**:

```
- "Orchestration" as a noun for container - use "Pipeline" instead
```

**Replace With**:

```
- "Orchestration" as a noun for container - use "Workflow" instead
```

---

### Change 1.16: REMOVE Requirements Index Entry - HL-WF-008

**Location**: Line 2158 (approximate)

**Action**: DELETE row

**Find**:

```
| HL-WF-008 | Pipeline-Based Workflow Coordination | High | BG-001, BG-002 |
```

**Replace With**: DELETE ENTIRELY

---

### Change 1.17: REMOVE Requirements Index Entry - HL-WF-011

**Location**: Line 2161 (approximate)

**Action**: DELETE row

**Find**:

```
| HL-WF-011 | Pipeline-Based Multi-Level Orchestration | High | BG-001, BG-002, BG-004 |
```

**Replace With**: DELETE ENTIRELY

---

### Change 1.18: UPDATE HL-WF-003 Success Criteria

**Location**: Lines 176-181 (approximate)

**Action**: UPDATE bullet

**Find**:

```
- Workflows within an orchestration can execute sequentially or in parallel
```

**Replace With**:

```
- Workflows can reference other workflows via uses: to compose complex orchestrations
```

---

### Verification for File 1

- [ ] HL-WF-008 completely removed
- [ ] HL-WF-011 completely removed
- [ ] HL-WF-009 updated (no pipeline references)
- [ ] HL-WF-010 updated (no pipeline expansion)
- [ ] HL-OB-001 updated (3-tier hierarchy)
- [ ] HL-OB-004 updated (3-tier hierarchy)
- [ ] NFR-MNT-004 updated
- [ ] Business Goal Coverage table updated
- [ ] Requirements Summary count updated (11 → 9)
- [ ] Glossary: Pipeline entry removed
- [ ] Glossary: Pipeline Agent entry removed
- [ ] Glossary: Escalation entry updated
- [ ] Execution Hierarchy diagram updated
- [ ] Correct Usage examples updated
- [ ] Common Pitfalls updated
- [ ] Requirements Index: HL-WF-008 removed
- [ ] Requirements Index: HL-WF-011 removed
- [ ] HL-WF-003 updated
- [ ] No remaining occurrences of "pipeline" as a tier (grep check)

---

## FILE 2: Architecture Document

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/00-architecture.md`

**Priority**: CRITICAL

**Total Changes**: 17

### Change 2.1: UPDATE Architectural Drivers Table

**Location**: Line 140 (approximate)

**Find**:

```
| HL-WF-001 | Pipeline orchestration | Requires top-level orchestration component |
```

**Replace With**:

```
| HL-WF-001 | Workflow orchestration | Requires top-level orchestration component |
```

---

### Change 2.2: UPDATE Architectural Principles

**Location**: Line 245 (approximate)

**Find**:

```
3. **Hierarchical Agents**: Each execution level (Pipeline, Workflow, Phase, Command) has its own agent with isolated context, preventing context rot.
```

**Replace With**:

```
3. **Hierarchical Agents**: Each execution level (Workflow, Phase, Command) has its own agent with isolated context, preventing context rot. Workflows can compose other workflows via `uses:`, with agents spawned by depth in the call tree.
```

---

### Change 2.3: UPDATE Telemetry Responsibility

**Location**: Line 468 (approximate)

**Find**:

```
- Collects traces across execution (pipeline, workflow, phase, command)
```

**Replace With**:

```
- Collects traces across execution (workflow, phase, command)
```

---

### Change 2.4: UPDATE Context Manager Responsibility

**Location**: Line 567 (approximate)

**Find**:

```
- Builds context for agents at any level (pipeline, workflow, phase, command)
```

**Replace With**:

```
- Builds context for agents at any level (workflow, phase, command)
```

---

### Change 2.5: UPDATE Agent Manager Responsibility

**Location**: Line 699 (approximate)

**Find**:

```
- Spawns agents at each level (pipeline, workflow, phase, command)
```

**Replace With**:

```
- Spawns agents at each level (workflow, phase, command)
```

---

### Change 2.6: UPDATE Agent Manager Requirements Reference

**Location**: Line 716 (approximate)

**Find**:

```
- HL-WF-009: Agent hierarchy (pipeline -> workflow -> phase -> command)
```

**Replace With**:

```
- HL-WF-009: Agent hierarchy (workflow -> phase -> command, with nested depth for composed workflows)
```

---

### Change 2.7: UPDATE Orchestrator Responsibility

**Location**: Line 745 (approximate)

**Find**:

```
- Manages execution flow for pipelines, workflows, and phases
```

**Replace With**:

```
- Manages execution flow for workflows, phases, and commands
```

---

### Change 2.8: UPDATE Orchestrator Requirements Reference

**Location**: Line 760 (approximate)

**Find**:

```
- HL-WF-001: Pipeline orchestration
```

**Replace With**:

```
- HL-WF-001: Workflow orchestration
```

---

### Change 2.9: UPDATE Interaction Flow Title

**Location**: Line 929 (approximate)

**Find**:

```
#### Flow 1: Execute Pipeline/Workflow/Command
```

**Replace With**:

```
#### Flow 1: Execute Workflow/Phase/Command
```

---

### Change 2.10: UPDATE Interaction Flow Trigger

**Location**: Line 931 (approximate)

**Find**:

```
**Trigger**: User starts execution at any level (pipeline, workflow, or command)
```

**Replace With**:

```
**Trigger**: User starts execution at any level (workflow, phase, or command)
```

---

### Change 2.11: UPDATE Provider Override Hierarchy

**Location**: Lines 1255-1260 (approximate)

**Find**:

```
System/Project/User Default Provider
    └─ Pipeline can override
        └─ Workflow can override
            └─ Phase can override
                └─ Command can override
```

**Replace With**:

```
System/Project/User Default Provider
    └─ Workflow can override
        └─ Phase can override
            └─ Command can override
```

---

### Change 2.12: UPDATE Provider Override Example

**Location**: Line 1265 (approximate)

**Find**:

```
- Mixing providers within the same pipeline (e.g., fast model for planning, powerful model for implementation)
```

**Replace With**:

```
- Mixing providers within the same workflow (e.g., fast model for planning, powerful model for implementation)
```

---

### Change 2.13: UPDATE Observability Traces Description

**Location**: Line 1282 (approximate)

**Find**:

```
| Traces | Hierarchical execution traces (Pipeline → Command) | Local files, optional external |
```

**Replace With**:

```
| Traces | Hierarchical execution traces (Workflow → Command) | Local files, optional external |
```

---

### Change 2.14: UPDATE or REMOVE Glossary - Pipeline

**Location**: Line 1423 (approximate)

**Find**:

```
| Pipeline | Top-level container coordinating multiple workflows |
```

**Replace With**: DELETE ENTIRELY

---

### Change 2.15: UPDATE Glossary - Workflow

**Location**: Line 1424 (approximate)

**Find**:

```
| Workflow | Container coordinating multiple phases, defined in YAML |
```

**Replace With**:

```
| Workflow | Top-level execution unit coordinating phases, defined in YAML. Can compose other workflows via `uses:` |
```

---

### Change 2.16: ADD Workflow Composition Note

**Location**: After Line 245 (after Architectural Principles #3)

**Action**: ADD new content

**Add**:

```markdown
> **Note on Workflow Composition**: Workflows can reference other workflows using `uses:` (similar to GitHub Actions). When a workflow references another, the referenced workflow executes as a nested unit. Agent hierarchy is determined by call depth, not tier name.
```

---

### Change 2.17: UPDATE any remaining "4-tier" references

**Action**: Search and replace

**Find**: `4-tier` or `four-tier` or `four tier`

**Replace With**: `3-tier` or `three-tier` as appropriate

---

### Verification for File 2

- [ ] Architectural Drivers table updated
- [ ] Architectural Principles updated (no Pipeline tier)
- [ ] Telemetry responsibility updated
- [ ] Context Manager responsibility updated
- [ ] Agent Manager responsibility updated
- [ ] Agent Manager requirements reference updated
- [ ] Orchestrator responsibility updated
- [ ] Orchestrator requirements reference updated
- [ ] Interaction Flow title updated
- [ ] Interaction Flow trigger updated
- [ ] Provider Override hierarchy updated
- [ ] Provider Override example updated
- [ ] Observability traces description updated
- [ ] Glossary: Pipeline entry removed
- [ ] Glossary: Workflow entry updated
- [ ] Workflow Composition note added
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 3: Orchestrator Requirements

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/requirements/10-orchestrator.md`

**Priority**: CRITICAL

**Total Changes**: 12 major changes

### Change 3.1: UPDATE Section Header

**Location**: Lines 413-415 (approximate)

**Find**:

```
### 2.2 Pipeline Hierarchy

This section defines the multi-level pipeline structure that enables organizing complex automation from high-level objectives down to individual agent executions.
```

**Replace With**:

```
### 2.2 Workflow Hierarchy

This section defines the multi-level workflow structure that enables organizing complex automation from high-level objectives down to individual agent executions.
```

---

### Change 3.2: UPDATE FR-OR-009

**Location**: Lines 419-459 (approximate)

**Find** (Title):

```
#### FR-OR-009: Four-Tier Pipeline Hierarchy
```

**Replace With**:

```
#### FR-OR-009: Three-Tier Workflow Hierarchy
```

**Find** (Requirement statement):

```
The system SHALL use a four-tier hierarchy for workflow orchestration: Pipeline (top-level), Workflow (mid-level), Phase (execution block), and Command (execution unit).
```

**Replace With**:

```
The system SHALL use a three-tier hierarchy for workflow orchestration: Workflow (top-level), Phase (execution block), and Command (execution unit). Workflows can reference other workflows using `uses:` for composition.
```

**Find** (Scenario - DELETE):

```
Scenario: Pipeline contains workflows
  Given a pipeline definition
  When the pipeline definition contains three workflows
  Then all three workflows should be recognized
  And each workflow should have phases
```

**Replace With**: DELETE this scenario entirely

**Find** (Scenario):

```
Then I should see the current pipeline, workflow, phase, and command
```

**Replace With**:

```
Then I should see the current workflow, phase, and command
```

**Find** (Rationale):

```
Clear hierarchy enables organizing complex multi-step automation from high-level objectives down to individual AI executions.
```

**Replace With**:

```
Clear hierarchy enables organizing complex multi-step automation from workflow objectives down to individual AI executions. Workflow composition via `uses:` enables building complex workflows from reusable workflow units.
```

---

### Change 3.3: REMOVE or REPURPOSE FR-OR-010

**Location**: Lines 462-501 (approximate)

**Option A - REMOVE entirely**:

DELETE the entire FR-OR-010 block:

```
#### FR-OR-010: Pipeline Coordination
...entire block...
```

**Option B - REPURPOSE for workflow composition**:

**Find** (Title):

```
#### FR-OR-010: Pipeline Coordination
```

**Replace With**:

```
#### FR-OR-010: Workflow Composition Coordination
```

**Find** (Requirement):

```
Pipelines SHALL coordinate multiple workflows with dependency specifications and execution conditions.
```

**Replace With**:

```
Workflows using `uses:` SHALL coordinate referenced workflows with dependency specifications and execution conditions.
```

**Update all scenarios**: Replace "pipeline" with "parent workflow" and update examples accordingly.

**RECOMMENDED**: Option A (REMOVE) - Simplifies the model. Workflow composition is implicit via `uses:`.

---

### Change 3.4: UPDATE Section 2.7 Header

**Location**: Lines 1274-1277 (approximate)

**Find**:

```
### 2.7 Intelligent Pipeline

This section covers advanced pipeline capabilities including intelligent coordination agents and clarification routing.
```

**Replace With**:

```
### 2.7 Intelligent Workflow

This section covers advanced workflow capabilities including intelligent coordination agents and clarification routing.
```

---

### Change 3.5: UPDATE FR-OR-028

**Location**: Lines 1280-1314 (approximate)

**Find** (Title):

```
#### FR-OR-028: Intelligent Pipeline Agent
```

**Replace With**:

```
#### FR-OR-028: Intelligent Workflow Agent
```

**Find** (Requirement):

```
The system SHALL support intelligent pipeline agents that provide project-wide context and coordinate workflow execution.
```

**Replace With**:

```
The system SHALL support intelligent workflow agents that provide project-wide context and coordinate phase execution.
```

**Find** (in all scenarios):

- `pipeline agent` → `workflow agent`
- `pipeline with "intelligent: true"` → `workflow with "intelligent: true"`
- `spawned for the pipeline` → `spawned for the workflow`
- `pipeline agent is consulted` → `workflow agent is consulted`

**Find** (Rationale):

```
Intelligent pipelines enable dynamic workflow adaptation based on project context and execution results.
```

**Replace With**:

```
Intelligent workflows enable dynamic phase adaptation based on project context and execution results.
```

---

### Change 3.6: UPDATE FR-OR-029

**Location**: Lines 1320-1357 (approximate)

**Find** (Requirement):

```
The system SHALL support agent-to-workflow-agent communication for clarifications that can escalate to pipeline level.
```

**Replace With**:

```
The system SHALL support agent-to-workflow-agent communication for clarifications that can escalate to parent workflow level or to the user.
```

**Find** (Scenario title):

```
Scenario: Workflow agent escalates to pipeline
```

**Replace With**:

```
Scenario: Workflow agent escalates to user
```

**Find** (Scenario content):

```
When it escalates to the pipeline agent
Then the pipeline agent should receive the question
```

**Replace With**:

```
When it cannot answer the question
Then the question should be escalated to the user
```

**Find**:

```
Given a pipeline agent answers a question
```

**Replace With**:

```
Given a parent workflow agent or user answers a question
```

---

### Change 3.7: UPDATE FR-OR-032

**Location**: Lines 1474-1516 (approximate)

**Find** (Requirement):

```
The system SHALL provide execution operations (via Gateway) for pipelines, workflows, and individual commands so that clients can invoke execution at all hierarchy levels.
```

**Replace With**:

```
The system SHALL provide execution operations (via Gateway) for workflows and individual commands so that clients can invoke execution at all hierarchy levels.
```

**Find** (Scenario - DELETE):

```
Scenario: Execute pipeline by name
  Given a pipeline "release-pipeline" exists
  When I call startPipeline("release-pipeline", taskId)
  Then the pipeline should begin execution
  And all workflows should be queued
```

**Replace With**: DELETE this scenario entirely

---

### Change 3.8: UPDATE FR-OR-033

**Location**: Lines 1520-1571 (approximate)

**Find** (Requirement):

```
The system SHALL provide a unified execution interface that can execute commands, workflows, or pipelines with explicit type selection for deterministic behavior.
```

**Replace With**:

```
The system SHALL provide a unified execution interface that can execute commands or workflows with explicit type selection for deterministic behavior.
```

**Find** (Scenario - DELETE):

```
Scenario: Execute with explicit pipeline type
  Given I call execute("release", type: "pipeline", taskId)
  Then it should execute as a pipeline
  And all workflows in the pipeline should run
```

**Replace With**: DELETE this scenario entirely

---

### Change 3.9: UPDATE FR-OR-034

**Location**: Lines 1576-1615 (approximate)

**Find**:

```
Then it should specify: commands first, then workflows, then pipelines
```

**Replace With**:

```
Then it should specify: commands first, then workflows
```

---

### Change 3.10: UPDATE Traceability Section

**Location**: Lines 1945-1956 (approximate)

**Find**: References to HL-WF-008 and HL-WF-011

**Action**:

- Remove HL-WF-008 from any mappings (requirement deleted)
- Remove HL-WF-011 from any mappings (requirement deleted)
- Keep HL-WF-001, HL-WF-009, HL-WF-010 (updated requirements)

---

### Change 3.11: UPDATE Requirements Summary

**Location**: Lines 1963-1964 (approximate)

**Find**:

```
| Pipeline Hierarchy | 3 | 2 | 1 | 0 | 0 |
```

**Replace With**:

```
| Workflow Hierarchy | 2 | 1 | 1 | 0 | 0 |
```

(Count reduced by 1 if FR-OR-010 removed)

---

### Change 3.12: UPDATE Requirements Index

**Location**: Lines 1999-2000 (approximate)

**Find**:

```
| FR-OR-009 | Four-Tier Pipeline Hierarchy | Critical | HL-WF-001, HL-WF-008, HL-WF-011 | Draft |
```

**Replace With**:

```
| FR-OR-009 | Three-Tier Workflow Hierarchy | Critical | HL-WF-001 | Draft |
```

**Find**:

```
| FR-OR-010 | Pipeline Coordination | High | HL-WF-008, HL-WF-011 | Draft |
```

**Replace With**: DELETE this row (if FR-OR-010 removed)

**Find**:

```
| FR-OR-028 | Intelligent Pipeline Agent | Medium | HL-WF-009 | Draft |
```

**Replace With**:

```
| FR-OR-028 | Intelligent Workflow Agent | Medium | HL-WF-009 | Draft |
```

---

### Verification for File 3

- [ ] Section 2.2 renamed to "Workflow Hierarchy"
- [ ] FR-OR-009 renamed to "Three-Tier Workflow Hierarchy"
- [ ] FR-OR-009 requirement text updated
- [ ] FR-OR-009 scenarios updated (pipeline scenario removed)
- [ ] FR-OR-010 removed or repurposed
- [ ] Section 2.7 renamed to "Intelligent Workflow"
- [ ] FR-OR-028 renamed and updated
- [ ] FR-OR-029 updated (escalation to user, not pipeline)
- [ ] FR-OR-032 updated (no pipeline operations)
- [ ] FR-OR-033 updated (no pipeline type)
- [ ] FR-OR-034 updated (no pipeline in resolution)
- [ ] Traceability section updated
- [ ] Requirements Summary counts updated
- [ ] Requirements Index updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 4: Agent Manager Requirements

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/requirements/09-agent-manager.md`

**Priority**: HIGH

**Total Changes**: 8

### Change 4.1: UPDATE Component Responsibility

**Location**: Line 25 (approximate)

**Find**:

```
spawns agents at each level (pipeline, workflow, phase, command)
```

**Replace With**:

```
spawns agents at each level (workflow, phase, command)
```

---

### Change 4.2: UPDATE FR-AM-001 or similar

**Location**: Line 88 (approximate)

**Find**:

```
(pipeline, workflow, phase, command)
```

**Replace With**:

```
(workflow, phase, command)
```

---

### Change 4.3: UPDATE/REMOVE Pipeline Agent Creation Scenarios

**Location**: Lines 93-105 (approximate)

**Find**: Any scenario about "Create a pipeline agent"

**Replace With**: DELETE these scenarios or convert to "Create a top-level workflow agent"

---

### Change 4.4: UPDATE Hierarchical Spawning

**Location**: Line 230 (approximate)

**Find**:

```
pipeline agents spawn workflow agents
```

**Replace With**:

```
top-level workflow agents may spawn phase agents or child workflow agents (via uses:)
```

---

### Change 4.5: UPDATE FR-AM-012

**Location**: Line 373 (approximate)

**Find**:

```
#### FR-AM-012: Long-Running Pipeline Agent Sessions
```

**Replace With**:

```
#### FR-AM-012: Long-Running Workflow Agent Sessions
```

Update all references to "pipeline agent" → "workflow agent" in this requirement.

---

### Change 4.6: UPDATE FR-AM-009

**Location**: Line 730 (approximate)

**Find**:

```
#### FR-AM-009: Clarification Escalation to Pipeline
```

**Replace With**:

```
#### FR-AM-009: Clarification Escalation to User
```

**Find** (Requirement):

```
escalate to pipeline agents
```

**Replace With**:

```
escalate to the user when no parent agent can answer
```

---

### Change 4.7: UPDATE Escalation Scenarios

**Location**: Lines 779-782 (approximate)

**Find**:

```
Pipeline escalates to user
```

**Replace With**:

```
Workflow escalates to user
```

(Workflow is now the top level, so it escalates directly to user)

---

### Change 4.8: UPDATE Requirements Index

**Location**: Lines 1080-1083 (approximate)

Update index entries:

- `FR-AM-009: Clarification Escalation to Pipeline` → `FR-AM-009: Clarification Escalation to User`
- `FR-AM-012: Long-Running Pipeline Agent Sessions` → `FR-AM-012: Long-Running Workflow Agent Sessions`

---

### Verification for File 4

- [ ] Component responsibility updated
- [ ] All (pipeline, workflow, phase, command) → (workflow, phase, command)
- [ ] Pipeline agent creation scenarios removed/updated
- [ ] Hierarchical spawning updated
- [ ] FR-AM-012 renamed and updated
- [ ] FR-AM-009 renamed and updated
- [ ] Escalation scenarios updated
- [ ] Requirements Index updated
- [ ] No remaining "pipeline agent" references (grep check)

---

## FILE 5: Context Manager Requirements

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/requirements/06-context-manager.md`

**Priority**: HIGH

**Total Changes**: 3

### Change 5.1: UPDATE Context Scope Reference

**Location**: Line 1296 (approximate)

**Find**:

```
between workflows within a pipeline
```

**Replace With**:

```
between workflows via uses: references
```

---

### Change 5.2: UPDATE Pipeline Context Scenarios

**Location**: Lines 1303-1332 (approximate)

**Find**: All references to "pipeline context"

**Replace With**: "parent workflow context" or "composition context"

---

### Change 5.3: UPDATE Any Hierarchy References

Search for `(pipeline, workflow, phase, command)` and replace with `(workflow, phase, command)`

---

### Verification for File 5

- [ ] Context scope references updated
- [ ] Pipeline context → parent workflow context
- [ ] Hierarchy references updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 6: Telemetry Requirements

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/requirements/04-telemetry.md`

**Priority**: HIGH

**Total Changes**: 5

### Change 6.1: UPDATE Hierarchy Description

**Location**: Line 313 (approximate)

**Find**:

```
(pipeline -> workflow -> phase -> command)
```

**Replace With**:

```
(workflow -> phase -> command)
```

---

### Change 6.2: REMOVE/UPDATE Pipeline Trace Scenarios

**Location**: Lines 324-389 (approximate)

**Find**: Scenarios about "Generate trace ID for pipeline"

**Replace With**: DELETE or repurpose for "top-level workflow"

**Find**:

```
within a pipeline
```

**Replace With**:

```
within a workflow
```

**Find**:

```
parent pipeline trace ID
```

**Replace With**:

```
parent workflow trace ID
```

---

### Change 6.3: UPDATE Trace Examples

**Location**: Lines 368-389 (approximate)

**Find**: `pipeline-123` in examples

**Replace With**: `workflow-123` or similar

---

### Verification for File 6

- [ ] Hierarchy description updated
- [ ] Pipeline trace scenarios removed/updated
- [ ] Trace examples updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 7: User Interface Requirements

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/requirements/11-user-interface.md`

**Priority**: HIGH

**Total Changes**: 2

### Change 7.1: UPDATE Execution Description

**Location**: Line 515 (approximate)

**Find**:

```
executing pipelines, workflows, and individual commands
```

**Replace With**:

```
executing workflows and individual commands
```

---

### Change 7.2: REMOVE Pipeline Scenario

**Location**: Lines 520-523 (approximate)

**Find**:

```
Scenario: Execute pipeline
  Given I run "flowmaster pipeline run release"
  ...
```

**Replace With**: DELETE this scenario entirely

---

### Verification for File 7

- [ ] Execution description updated
- [ ] Pipeline execution scenario removed
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 8: Gateway Contract

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/integration/contracts/12-gateway.md`

**Priority**: HIGH

**Total Changes**: 5

### Change 8.1: UPDATE Section Description

**Location**: Line 56 (approximate)

**Find**:

```
Operations for workflow and pipeline execution control
```

**Replace With**:

```
Operations for workflow execution control
```

---

### Change 8.2: REMOVE GW-OP-002 startPipeline

**Location**: Lines 116-142 (approximate)

**Action**: DELETE entire operation block

**Find**:

```
#### GW-OP-002: startPipeline

| Attribute | Value |
...
(entire operation definition)
```

**Replace With**: DELETE ENTIRELY

**Note**: Renumber subsequent operations if needed, OR leave gap for backwards compatibility notes.

---

### Change 8.3: UPDATE Summary Table

**Location**: Line 793 (approximate)

**Find**:

```
| startOrchestration | Start pipeline execution | GW-OP-002 |
```

**Replace With**: DELETE this row

---

### Change 8.4: UPDATE Operation Index

**Location**: Line 964 (approximate)

**Find**:

```
| GW-OP-002 | startPipeline | Async | Orchestrator |
```

**Replace With**: DELETE this row

---

### Change 8.5: UPDATE Any Remaining References

Search for `pipelineName`, `pipelineId`, `pipeline` in context of tier

**Replace With**: DELETE or convert to workflow equivalent

---

### Verification for File 8

- [ ] Section description updated
- [ ] GW-OP-002 startPipeline removed
- [ ] Summary table updated
- [ ] Operation Index updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 9: User Interface Contract

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/integration/contracts/11-user-interface.md`

**Priority**: HIGH

**Total Changes**: 4

### Change 9.1: REMOVE PipelineCommands Interface

**Location**: Lines 284-286 (approximate)

**Find**:

```
### 2.3 Interface: PipelineCommands

Commands for pipeline operations.
```

**Replace With**: DELETE entire section (through all pipeline commands)

---

### Change 9.2: REMOVE UI-CMD-008

**Location**: Lines 290-300 (approximate)

**Find**:

```
#### UI-CMD-008: pipeline run

**Pattern**: `flowmaster pipeline run <name> --task <taskId> [options]`

**Purpose**: Execute a pipeline (collection of workflows)
...
```

**Replace With**: DELETE ENTIRELY

---

### Change 9.3: REMOVE UI-CMD-009

**Location**: Lines 302-310 (approximate)

**Find**:

```
#### UI-CMD-009: pipeline list
...
```

**Replace With**: DELETE ENTIRELY

---

### Change 9.4: UPDATE Command Index

Remove entries for UI-CMD-008 and UI-CMD-009 from any index tables.

---

### Verification for File 9

- [ ] PipelineCommands interface section removed
- [ ] UI-CMD-008 (pipeline run) removed
- [ ] UI-CMD-009 (pipeline list) removed
- [ ] Command Index updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 10: Agent Manager Contract

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/integration/contracts/09-agent-manager.md`

**Priority**: HIGH

**Total Changes**: 4

### Change 10.1: UPDATE AgentLevel Type

**Location**: Line 342 (approximate) or Section 5.1

**Find**:

```
type AgentLevel = 'pipeline' | 'workflow' | 'phase' | 'command';
```

**Replace With**:

```
type AgentLevel = 'workflow' | 'phase' | 'command';
```

---

### Change 10.2: UPDATE parentId Description

**Location**: Line 344 (approximate)

**Find**:

```
Parent agent ID (null for pipeline agents)
```

**Replace With**:

```
Parent agent ID (null for top-level workflow agents)
```

---

### Change 10.3: UPDATE spawnAgent Description

**Location**: AM-OP-001

**Find**: References to spawning pipeline agents

**Replace With**: Update to only mention workflow, phase, command levels

---

### Change 10.4: UPDATE Clarification Routing

Update any clarification routing that mentions pipeline level to indicate workflow agents escalate to user.

---

### Verification for File 10

- [ ] AgentLevel type updated (removed 'pipeline')
- [ ] parentId description updated
- [ ] spawnAgent description updated
- [ ] Clarification routing updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 11: Message Catalog

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/integration/messages/catalog.md`

**Priority**: HIGH

**Total Changes**: 6

### Change 11.1: UPDATE OrchestrationEvent Description

**Location**: Line 113 (approximate)

**Find**:

```
| OrchestrationEvent | Pipeline orchestration |
```

**Replace With**:

```
| OrchestrationEvent | Workflow orchestration |
```

---

### Change 11.2: UPDATE AgentLevel Enum

**Location**: Line 342 (approximate)

**Find**:

```
'pipeline' | 'workflow' | 'phase' | 'command'
```

**Replace With**:

```
'workflow' | 'phase' | 'command'
```

---

### Change 11.3: UPDATE parentId Description

**Location**: Line 344 (approximate)

**Find**:

```
Parent agent ID (null for pipeline agents)
```

**Replace With**:

```
Parent agent ID (null for top-level workflow agents)
```

---

### Change 11.4: REMOVE MSG-OR-015

**Location**: Lines 1700-1720 (approximate)

**Find**:

```
#### MSG-OR-015: orchestration-started

**Description**: Pipeline orchestration started
**When Published**: When pipeline with multiple workflows begins
...
```

**Replace With**: DELETE ENTIRELY or repurpose for workflow composition

---

### Change 11.5: REMOVE MSG-OR-016

**Location**: Lines 1735-1755 (approximate)

**Find**:

```
#### MSG-OR-016: orchestration-completed

**Description**: Pipeline orchestration completed
**When Published**: After all workflows in pipeline complete
...
```

**Replace With**: DELETE ENTIRELY or repurpose

---

### Change 11.6: UPDATE MSG-OR-017

**Location**: Line 1772 (approximate)

**Find**:

```
When a workflow in a pipeline begins
```

**Replace With**:

```
When a referenced workflow begins (via uses:)
```

---

### Verification for File 11

- [ ] OrchestrationEvent description updated
- [ ] AgentLevel enum updated
- [ ] parentId description updated
- [ ] MSG-OR-015 removed/repurposed
- [ ] MSG-OR-016 removed/repurposed
- [ ] MSG-OR-017 updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 12: Telemetry Contract

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/integration/contracts/04-telemetry.md`

**Priority**: MEDIUM

**Total Changes**: 1

### Change 12.1: UPDATE TraceLevel

**Location**: TraceLevel enum definition

**Find**:

```
TraceLevel includes 'pipeline'
```

**Replace With**: Remove 'pipeline' from TraceLevel enum

---

### Verification for File 12

- [ ] TraceLevel updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 13: Product Overview

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/01-overview/01-product-overview.md`

**Priority**: MEDIUM

**Total Changes**: 6

### Change 13.1: UPDATE Core Concept

**Location**: Line 85 (approximate)

**Find**:

```
Pipeline -> coordinates Workflows
```

**Replace With**:

```
Workflow -> coordinates Phases (Workflows can reference other workflows via uses:)
```

---

### Change 13.2: UPDATE Hierarchy Feature

**Location**: Line 108 (approximate)

**Find**:

```
four-level hierarchy (Pipeline -> Workflow -> Phase -> Command)
```

**Replace With**:

```
three-level hierarchy (Workflow -> Phase -> Command)
```

---

### Change 13.3: UPDATE Pipeline Orchestration Feature

**Location**: Line 156 (approximate)

**Find**:

```
Pipeline orchestration for coordinating multiple workflows
```

**Replace With**:

```
Workflow composition for coordinating multiple workflows (via uses:)
```

---

### Change 13.4: UPDATE Agent Levels

**Location**: Line 165 (approximate)

**Find**:

```
(Pipeline, Workflow, Phase, Command)
```

**Replace With**:

```
(Workflow, Phase, Command)
```

---

### Change 13.5: UPDATE Clarification Chain

**Location**: Line 168 (approximate)

**Find**:

```
(Command -> Phase -> Workflow -> Pipeline -> User)
```

**Replace With**:

```
(Command -> Phase -> Workflow -> User)
```

---

### Change 13.6: UPDATE Use Case Title (Optional)

**Location**: Line 388 (approximate)

**Find**:

```
Spec-to-Production Pipeline
```

**Replace With**: Keep as-is (generic term) OR change to "Spec-to-Production Workflow"

---

### Verification for File 13

- [ ] Core concept updated
- [ ] Hierarchy feature updated
- [ ] Pipeline orchestration feature updated
- [ ] Agent levels updated
- [ ] Clarification chain updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 14: Handoff Context

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/00-notes/handoff-context.md`

**Priority**: MEDIUM

**Total Changes**: 3

### Change 14.1: UPDATE Terminology Section

**Find**: Any terminology defining Pipeline as a tier

**Replace With**: Remove or update to indicate 3-tier model

---

### Change 14.2: UPDATE Clarification Routing Pattern

**Find**: References to pipeline in clarification routing

**Replace With**: Update to show workflow -> user escalation

---

### Change 14.3: UPDATE Agent Hierarchy

**Find**: 4-tier agent hierarchy

**Replace With**: 3-tier agent hierarchy

---

### Verification for File 14

- [ ] Terminology updated
- [ ] Clarification routing updated
- [ ] Agent hierarchy updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 15: CLAUDE.md

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/CLAUDE.md`

**Priority**: MEDIUM

**Total Changes**: 3

### Change 15.1: UPDATE Hierarchy Diagram

**Location**: Lines 16-19 (approximate)

**Find**:

```
Pipeline Agent
  └─ Workflow Agent(s)
       └─ Phase Agent(s)
            └─ Command Agent(s)
```

**Replace With**:

```
Workflow Agent
  └─ Phase Agent(s)
       └─ Command Agent(s)
```

---

### Change 15.2: UPDATE Terminology Table

**Location**: Line 152 (approximate)

**Find**:

```
| **Pipeline** | Top-level execution unit containing workflows |
```

**Replace With**: DELETE this row

---

### Change 15.3: UPDATE Any Remaining References

Search for `pipeline` in context of tier and update.

---

### Verification for File 15

- [ ] Hierarchy diagram updated
- [ ] Terminology table updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 16: ADR 004 - Intelligent Orchestration

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/decisions/004-intelligent-orchestration.md`

**Priority**: MEDIUM

**Total Changes**: Multiple throughout

### Change 16.1: UPDATE Context

**Find**: `Pipeline -> Workflow -> Phase -> Command`

**Replace With**: `Workflow -> Phase -> Command`

---

### Change 16.2: REMOVE Pipeline Level Description

**Find**: `Pipeline: Executes an entire specification`

**Replace With**: DELETE or merge into Workflow description

---

### Change 16.3: UPDATE Agent Hierarchy

**Find**: All "Pipeline Agent" references

**Replace With**: "Top-level Workflow Agent" or remove tier

---

### Change 16.4: UPDATE Role Mapping

**Find**: `Architect - Pipeline Agent`

**Replace With**: `Architect - Top-level Workflow Agent`

---

### Verification for File 16

- [ ] Context updated
- [ ] Pipeline level description removed
- [ ] Agent hierarchy updated
- [ ] Role mapping updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 17: ADR 002 - State Machine Orchestration

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/decisions/002-state-machine-orchestration.md`

**Priority**: MEDIUM

**Total Changes**: 3

### Change 17.1: UPDATE Context

**Find**: `Pipeline -> Workflow -> Phase -> Command`

**Replace With**: `Workflow -> Phase -> Command`

---

### Change 17.2: UPDATE Requirements Reference

**Find**: `HL-WF-001: Pipeline orchestration`

**Replace With**: `HL-WF-001: Workflow orchestration`

---

### Change 17.3: UPDATE Hierarchy Reference

**Find**: `pipeline -> workflow -> phase -> command`

**Replace With**: `workflow -> phase -> command`

---

### Verification for File 17

- [ ] Context updated
- [ ] Requirements reference updated
- [ ] Hierarchy reference updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 18: ADR 006 - File-First Persistence

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/decisions/006-file-first-persistence.md`

**Priority**: LOW

**Total Changes**: 2

### Change 18.1: UPDATE Description

**Find**: `Pipeline and workflow structure`

**Replace With**: `Workflow structure`

---

### Change 18.2: UPDATE Directory Structure

**Find**: `pipeline-name.yaml`

**Replace With**: Remove or clarify this is a workflow file

---

### Verification for File 18

- [ ] Description updated
- [ ] Directory structure updated
- [ ] No remaining "pipeline" tier references (grep check)

---

## FILE 19: Workflow Definition Schema

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/03-architecture/integration/schemas/07-workflow-definition.md`

**Priority**: HIGH

**Total Changes**: COMPLETE REWRITE

### Action

This file should be completely rewritten based on the schema defined in `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/00-notes/schema-architecture-decisions.md`.

Key elements to include:

- 3-tier hierarchy: Workflow → Phase → Command
- `uses:` for workflow composition
- Unified features at all levels (conditionals, loops, validation, parallel, error handling)
- Expression syntax with `{{ }}`
- Complete schema definition

**Reference**: See Section "Issue 3: Workflow Schema Structure (MAJOR CHANGE)" in schema-architecture-decisions.md for the complete schema.

---

### Verification for File 19

- [ ] Schema reflects 3-tier model
- [ ] `uses:` composition documented
- [ ] No "Pipeline" tier in schema
- [ ] All features (conditionals, loops, etc.) documented
- [ ] Expression syntax documented
- [ ] Examples updated

---

## FILE 20: UI Prototype Notes

**Path**: `/Users/fahadkaleem/Documents/Workspace/alfred-cli/design/flowmaster/00-notes/ui-prototype-requirements.md`

**Priority**: LOW

**Total Changes**: 4

### Change 20.1: UPDATE Hierarchy

**Find**: `Pipeline (top-level)`

**Replace With**: Remove Pipeline tier

---

### Change 20.2: UPDATE Clarification Flow

**Find**: `Pipeline Agent (can answer?)`

**Replace With**: Remove from flow; workflow escalates to user

---

### Change 20.3: REMOVE Pipeline CLI Commands

**Find**: `flowmaster pipeline run` and `pipeline list`

**Replace With**: DELETE these commands

---

### Change 20.4: REMOVE Gateway Operation

**Find**: `startPipeline`

**Replace With**: DELETE this operation

---

### Verification for File 20

- [ ] Hierarchy updated
- [ ] Clarification flow updated
- [ ] Pipeline CLI commands removed
- [ ] Gateway operation removed
- [ ] No remaining "pipeline" tier references (grep check)

---

## FINAL VALIDATION CHECKLIST

After all changes are complete, perform these global validations:

### Grep Checks

Run the following grep commands to verify no pipeline tier references remain:

```bash
# Check for "pipeline" as a tier (case insensitive)
grep -ri "pipeline" design/flowmaster/ --include="*.md" | grep -v "_archive" | grep -v "CI/CD pipeline" | grep -v "validation pipeline" | grep -v "parsing pipeline" | grep -v "Build pipeline"

# Check for specific patterns that should not exist
grep -ri "pipeline agent" design/flowmaster/ --include="*.md" | grep -v "_archive"
grep -ri "pipeline → workflow" design/flowmaster/ --include="*.md" | grep -v "_archive"
grep -ri "pipelineId" design/flowmaster/ --include="*.md" | grep -v "_archive"
grep -ri "startPipeline" design/flowmaster/ --include="*.md" | grep -v "_archive"
grep -ri "four-tier" design/flowmaster/ --include="*.md" | grep -v "_archive"
grep -ri "4-tier" design/flowmaster/ --include="*.md" | grep -v "_archive"
```

### Allowed "Pipeline" References

The following uses of "pipeline" are acceptable and should NOT be changed:

- "CI/CD pipeline" (generic DevOps term)
- "validation pipeline" (architecture pattern)
- "parsing pipeline" (processing pattern)
- "Build pipeline integration" (CI/CD context)
- Shell "pipelines" (Unix piping)

### Document Consistency Checks

- [ ] All HL requirements trace correctly (no references to deleted HL-WF-008, HL-WF-011)
- [ ] All FR requirements trace to existing HL requirements
- [ ] Component requirements counts are accurate
- [ ] Requirement indices match actual requirements
- [ ] Glossary has no orphaned terms
- [ ] Diagrams show 3-tier hierarchy
- [ ] API operations are consistent (no startPipeline)
- [ ] CLI commands are consistent (no pipeline commands)
- [ ] Message catalog has no orphaned messages
- [ ] Schema definitions are complete

### Cross-Reference Validation

- [ ] Architecture doc references match requirements doc
- [ ] Integration overview matches component contracts
- [ ] Contracts match requirements
- [ ] Message catalog matches contracts
- [ ] CLAUDE.md matches architecture

---

## SUMMARY STATISTICS

| Metric                         | Count                    |
| ------------------------------ | ------------------------ |
| **Files to modify**            | 20                       |
| **Total changes**              | ~193                     |
| **Requirements to REMOVE**     | 2 (HL-WF-008, HL-WF-011) |
| **Requirements to UPDATE**     | 8+                       |
| **FRs to REMOVE**              | 1 (FR-OR-010)            |
| **FRs to UPDATE**              | 10+                      |
| **Glossary entries to REMOVE** | 2                        |
| **API operations to REMOVE**   | 1 (GW-OP-002)            |
| **CLI commands to REMOVE**     | 2                        |
| **Messages to REMOVE**         | 2-3                      |
| **Schemas to REWRITE**         | 1                        |

---

## EXECUTION ORDER

For dependency reasons, execute changes in this order:

1. **High-Level Requirements** (02-requirements.md) - Foundation for everything
2. **Architecture Document** (00-architecture.md) - Component definitions
3. **Orchestrator Requirements** (10-orchestrator.md) - Core orchestration FRs
4. **Other Component Requirements** - Agent Mgr, Context Mgr, Telemetry, UI
5. **Integration Contracts** - Gateway, UI, Agent Mgr, Message Catalog
6. **Workflow Definition Schema** - Complete rewrite
7. **Supporting Documents** - CLAUDE.md, handoff, product overview
8. **ADRs** - Update decisions
9. **Notes** - UI prototype, etc.

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-30 | Architecture Team | Initial version |
