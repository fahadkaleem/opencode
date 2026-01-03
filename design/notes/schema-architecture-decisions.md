# FlowMaster Schema & Architecture Decisions

> **Document Version**: 2.0
> **Date**: 2025-11-30
> **Status**: Approved
> **Authors**: Architecture Team
> **Purpose**: Document architectural decisions and catch the team up on schema changes

---

## Executive Summary

During Stage 3c (Integration Architecture) review, we identified **6 inconsistencies and gaps** in the documentation that would cause friction during implementation. After extensive analysis including external research and comparison with industry tools (Gemini CLI, CodeMachine, GitHub Actions, Argo Workflows, Temporal), we made the following decisions:

| #   | Issue                                   | Decision                                                            |
| --- | --------------------------------------- | ------------------------------------------------------------------- |
| 1   | Task Cache Format                       | Use JSON (not Markdown)                                             |
| 2   | Context Building Responsibility         | No change needed (already correct)                                  |
| 3   | Workflow Schema Structure               | **Adopt 3-tier GitHub-inspired model (Workflow → Phase → Command)** |
| 4   | Artifact Serving to Web UI              | Add Gateway endpoint for artifacts                                  |
| 5   | Event Buffering for Late UI Connections | No buffering - show current state on connect                        |
| 6   | ID vs Name Ambiguity                    | Use `workflowId` for lookups, `workflowName` for display            |

## The Big Change: Goodbye Pipeline, Hello Simplicity

**We are eliminating the 4-tier hierarchy (Pipeline → Workflow → Phase → Command) in favor of a 3-tier model inspired by GitHub Actions.**

### What Changed

| Before (4-tier)                         | After (3-tier)                                                |
| --------------------------------------- | ------------------------------------------------------------- |
| Pipeline → Workflow → Phase → Command   | Workflow → Phase → Command                                    |
| 4 schema types with duplicated features | 3 concepts, unified capabilities                              |
| "Pipeline" as explicit tier             | "Pipeline" is just a workflow that references other workflows |
| Fixed rigid depth                       | Recursive composition via `uses:`                             |

### Why This Matters

1. **Simpler mental model**: 3 concepts instead of 4
2. **No logic duplication**: Phases and Workflows share identical features
3. **Composable**: Workflows can reference other workflows (like GitHub Actions)
4. **Industry-aligned**: Matches GitHub Actions, GitLab CI, Argo Workflows

---

## Issue 1: Task Cache Format

### Problem Statement

Direct conflict between requirements and contracts:

- **FR-TM-016** states: "cache external task data locally as **markdown files** with YAML frontmatter... for human readability"
- **TM-OP-001** states: "Task is cached locally at `.flowmaster/tasks/{id}/task.json`"

Implementation team would not know whether to parse Markdown or JSON.

### Decision

**Use JSON format for task cache.**

### Rationale

1. **Primary use case**: FlowMaster reads task cache programmatically, not humans
2. **Human readability need is served elsewhere**: Users access tasks via Jira/Linear directly
3. **Implementation simplicity**: JSON parsing is native and performant; Markdown with YAML frontmatter requires additional parsing logic
4. **Consistency**: All other state files (`.flowmaster/tasks/{id}/state.json`, artifacts) use JSON
5. **Type safety**: JSON maps directly to TypeScript interfaces

### Impact

- Update FR-TM-016 to specify JSON format
- No contract changes needed (already specifies JSON)

---

## Issue 2: Context Building Responsibility

### Problem Statement

Potential conflict between architecture flow and contract signature:

- Architecture shows: `Orchestrator → Agent Manager → Context Manager`
- Contract AM-OP-001 shows: `context: AgentContext` as a parameter

This could imply the caller (Orchestrator) must build context.

### Decision

**No change needed.** The current design is correct.

### Rationale

Upon review:

- The `context` parameter in AM-OP-001 is marked as **optional** (`Required: No`)
- Section 3.2 of Agent Manager contract shows it requires Context Manager and calls `buildContext(params)` internally
- Agent Manager builds context internally when not provided

The architecture flow is accurate: Agent Manager calls Context Manager.

### Impact

None.

---

## Issue 3: Workflow Schema Structure (MAJOR CHANGE)

### Problem Statement

The original design specified a **4-tier fixed hierarchy**:

```
Pipeline → Workflow → Phase → Command
```

Each tier had identical capabilities (conditionals, loops, validation, parallel execution) but required separate schema definitions. This created:

1. **Schema duplication**: Same features defined 4 times
2. **Implementation complexity**: 4 types to handle in orchestration code
3. **Mental overhead**: Users must understand 4 distinct concepts
4. **Rigid structure**: Cannot add/remove tiers without schema changes
5. **Missing schema**: No `08-pipeline-definition.md` existed

### Research Conducted

#### Industry Analysis

| Tool               | Structure                    | Key Insight                           |
| ------------------ | ---------------------------- | ------------------------------------- |
| **GitHub Actions** | Workflow → Jobs → Steps      | 3 tiers with `uses:` for composition  |
| **GitLab CI**      | Pipeline → Jobs → Scripts    | 3 tiers, jobs can reference templates |
| **Argo Workflows** | Workflow → Templates → Steps | Recursive DAGs                        |
| **Temporal**       | Workflow → Activities        | 2 tiers, workflows can call workflows |

**Key insight**: GitHub Actions is the most widely adopted and uses **3 tiers** with **`uses:`** for recursive composition.

#### Codebase Analysis

**Gemini CLI**: Flat model, LLM-driven control flow - no declarative orchestration
**CodeMachine**: 3-tier with unified step type, agent-driven control via `behavior.json`

#### AI-Assisted Analysis (Perplexity)

Perplexity's Sonar Reasoning Pro validated recursive composition:

> "The workflow pattern literature clearly establishes that separating orchestration logic from business logic through a dedicated orchestration layer is the scalable approach. Three different orchestration paradigms (GitHub Actions, Argo Workflows, Temporal) independently converged on recursive composition patterns."

---

### Decision: 3-Tier GitHub-Inspired Model

**Adopt: Workflow → Phase → Command** with `uses:` for recursive composition.

```
Workflow
    └─ Phases
        └─ Commands
```

| Tier         | Contains   | Equivalent In            |
| ------------ | ---------- | ------------------------ |
| **Workflow** | Phases     | GitHub Actions: Workflow |
| **Phase**    | Commands   | GitHub Actions: Job      |
| **Command**  | (executes) | GitHub Actions: Step     |

**Recursion**: A Workflow can reference other Workflows using `uses:` (like GitHub Actions).

---

### The 3 Tiers Explained

#### Tier 1: Workflow

The top-level container. A workflow file defines a complete orchestration unit.

```yaml
# workflows/feature-dev.yaml
id: feature-dev
name: Feature Development
description: Complete feature from ticket to deployment

phases:
  - id: planning
    # ... phase definition

  - id: development
    needs: planning
    # ... phase definition
```

#### Tier 2: Phase

A logical grouping of commands that execute together. Phases can:

- Run sequentially or in parallel
- Have dependencies on other phases (`needs:`)
- Have conditions, loops, validation

```yaml
phases:
  - id: testing
    name: Test Phase
    needs: build
    parallel: true # Run commands in parallel
    commands:
      - id: unit-tests
        command: run-unit-tests
      - id: integration-tests
        command: run-integration-tests
```

#### Tier 3: Command

The atomic execution unit. Commands invoke Claude Code (or other providers) to do actual work.

```yaml
commands:
  - id: implement
    command: implement # References .claude/commands/implement.md
    args:
      taskId: '{{ context.taskId }}'
    when: '{{ outputs.design.approved }}'
```

---

### Recursive Composition with `uses:`

Like GitHub Actions, workflows can reference other workflows using `uses:`.

#### Why `uses:` (Not `ref:`)?

- Familiar to developers from GitHub Actions
- Clear intent: "this phase uses another workflow"
- Industry standard terminology

#### Example: Composing Workflows

```yaml
# workflows/ci-cd.yaml (top-level "pipeline")
id: ci-cd
name: CI/CD Pipeline

phases:
  - uses: planning # References workflows/planning.yaml

  - uses: development
    needs: planning
    loop:
      until: '{{ outputs.development.validation.passed }}'
      maxIterations: 3

  - uses: deployment
    needs: development
    when: "{{ context.branch == 'main' }}"
```

```yaml
# workflows/planning.yaml (referenced workflow)
id: planning
name: Planning Workflow

phases:
  - id: research
    commands:
      - id: gather-requirements
        command: gather-requirements
      - id: analyze-codebase
        command: analyze-codebase

  - id: design
    needs: research
    commands:
      - id: create-design
        command: create-design
```

When `uses: planning` is executed, the `planning` workflow's phases run as a unit.

---

### What Happened to "Pipeline"?

**Pipeline is not a separate tier.** It's just a workflow that composes other workflows.

| Old Concept | New Concept                                         |
| ----------- | --------------------------------------------------- |
| Pipeline    | A workflow with `uses:` referencing other workflows |
| Workflow    | A workflow with phases containing commands          |
| Phase       | A phase within a workflow                           |
| Command     | A command within a phase                            |

**The schema is identical.** A "pipeline" is just a workflow at the top level.

---

### Unified Features Across All Tiers

All features work at **both Workflow and Phase levels**:

| Feature            | At Workflow Level                        | At Phase Level                             |
| ------------------ | ---------------------------------------- | ------------------------------------------ |
| **Conditionals**   | `when:` on `uses:` reference             | `when:` on phase                           |
| **Loops**          | `loop:` on `uses:` reference             | `loop:` on phase                           |
| **Parallel**       | `parallel: true` runs phases in parallel | `parallel: true` runs commands in parallel |
| **Validation**     | `validate:` on workflow                  | `validate:` on phase                       |
| **Error Handling** | `onError:` on workflow                   | `onError:` on phase                        |
| **Dependencies**   | `needs:` between `uses:`                 | `needs:` between phases                    |

**No duplication** - the same schema fields work at every level.

---

### Complete Schema Definition

```yaml
# ============================================
# WORKFLOW - Top level or referenced via uses:
# ============================================
workflow:
  id: string # Lookup key (kebab-case)
  name: string # Display name
  description: string # Optional description

  phases: Phase[] # The phases in this workflow

# ============================================
# PHASE - Contains commands OR references workflow
# ============================================
phase:
  # --- Identity (for inline phase) ---
  id: string # Phase identifier
  name: string # Display name

  # --- OR Reference (for composition) ---
  uses: string # Workflow ID to reference
  args: Record<string, any> # Arguments to pass

  # --- Children (for inline phase) ---
  commands: Command[] # Commands in this phase

  # --- Execution Control ---
  needs: string | string[] # Dependencies (phase IDs)
  parallel: boolean # Run commands in parallel (default: false)

  # --- Control Flow (works on both inline and uses:) ---
  when: Expression # Conditional execution
  loop: # Iteration
    while: Expression # Continue while true
    until: Expression # Continue until true
    forEach: Expression # Iterate over array
    as: string # Loop variable name
    maxIterations: number # Safety limit (default: 10)

  switch: # Branching
    on: Expression
    cases:
      - match: value
        commands: Command[] # Or: uses: workflow-id
    default: Command[]

  # --- Validation ---
  validate:
    before: Validation[] # Pre-execution checks
    after: Validation[] # Post-execution checks

  # --- Error Handling ---
  onError:
    retry:
      attempts: number
      delay: number
      backoff: linear | exponential
    fallback: Phase # Fallback phase to run
    action: fail | skip | continue

# ============================================
# COMMAND - Atomic execution unit
# ============================================
command:
  id: string # Command identifier
  command: string # Template ID (e.g., "implement")
  args: Record<string, any> # Arguments to pass

  when: Expression # Conditional execution

  provider: string # Override default provider
  model: string # Override default model

  onError:
    retry:
      attempts: number
      delay: number
    action: fail | skip | continue

# ============================================
# VALIDATION
# ============================================
validation:
  type: schema | deterministic | ai | script

  # For type: schema
  schema: string # Schema ID to validate against

  # For type: deterministic
  check: Expression # Boolean expression

  # For type: ai
  prompt: string # Prompt for AI validation
  provider: string # Override provider

  # For type: script
  run: string # Script path to execute

  onFail: fail | retry | skip # What to do on failure


# ============================================
# EXPRESSION SYNTAX
# ============================================
# Expressions use {{ }} syntax:
#   {{ context.taskId }}                    - Context variable
#   {{ outputs.phase-id.field }}            - Phase output
#   {{ outputs.phase-id.command-id.field }} - Command output
#   {{ steps.phase-id.status }}             - Phase status
#   {{ loop.index }}                        - Current loop iteration
#   {{ loop.item }}                         - Current forEach item
#   {{ isEmpty(value) }}                    - Built-in function
#   {{ contains(array, item) }}             - Built-in function
```

---

### File Organization

Recommended structure (convention, not enforced):

```
.flowmaster/
├── workflows/
│   ├── pipelines/              # Top-level compositions
│   │   └── ci-cd.yaml
│   │
│   ├── planning.yaml           # Referenced workflows
│   ├── development.yaml
│   ├── deployment.yaml
│   │
│   └── simple-task.yaml        # Self-contained workflow
│
└── commands/                   # Command templates
    ├── gather-requirements.md
    ├── implement.md
    └── run-tests.md
```

---

### Single File vs Multi-File

#### Single File (Self-Contained)

```yaml
id: simple-ci
name: Simple CI

phases:
  - id: build
    commands:
      - id: install
        command: npm-install
      - id: compile
        command: npm-build

  - id: test
    needs: build
    parallel: true
    commands:
      - id: unit-tests
        command: run-unit-tests
      - id: integration-tests
        command: run-integration-tests

  - id: deploy
    needs: test
    when: "{{ context.branch == 'main' }}"
    commands:
      - id: deploy-staging
        command: deploy
        args:
          target: staging
```

#### Multi-File (Composition)

```yaml
# workflows/pipelines/release.yaml
id: release
name: Release Pipeline

phases:
  - uses: ci # workflows/ci.yaml

  - uses: security-scan # workflows/security-scan.yaml
    needs: ci

  - uses: deploy-production # workflows/deploy-production.yaml
    needs: security-scan
    when: '{{ context.approved }}'
```

#### Mixed (Reference + Inline)

```yaml
id: feature-dev
name: Feature Development

phases:
  - uses: planning

  - uses: development
    needs: planning

  - id: custom-notification # Inline one-off phase
    needs: development
    commands:
      - id: notify
        command: send-notification
        args:
          channel: '#releases'
```

---

### Agent Hierarchy

Agents are spawned by **depth**, not by tier name:

| Depth | Agent Role                              | Context Scope        |
| ----- | --------------------------------------- | -------------------- |
| 0     | Top-level Workflow Agent                | Project-wide context |
| 1     | Referenced Workflow Agent / Phase Agent | Workflow context     |
| 2+    | Phase Agent                             | Phase context        |
| Leaf  | Command Agent                           | Command context      |

**Clarification routing**: Questions flow up by parent relationship, not by tier name.

```
Command Agent (has question)
    → Phase Agent (can answer? if not...)
        → Workflow Agent (can answer? if not...)
            → User
```

---

### Rationale

1. **3 tiers is the sweet spot**: GitHub Actions, GitLab CI use 3 tiers - proven at scale
2. **`uses:` is familiar**: Developers know this from GitHub Actions
3. **Pipeline is just composition**: No special schema needed for "pipeline"
4. **Unified features**: Conditionals, loops, validation work everywhere
5. **Single implementation**: One schema, one parser, one executor
6. **Flexible organization**: Users structure files as they prefer

---

### Potential Pitfalls & Mitigations

| Pitfall                     | Mitigation                                            |
| --------------------------- | ----------------------------------------------------- |
| **Deep nesting**            | Configurable depth limits; comprehensive logging      |
| **Reference cycles**        | Cycle detection at load time (DFS traversal)          |
| **State scoping confusion** | Clear rules: children access parent outputs only      |
| **Organizational chaos**    | Linting rules; recommended conventions                |
| **Performance at scale**    | Compile to flattened graph; cache resolved references |

---

### Impact on Documents

| Document                                                        | Change                                      |
| --------------------------------------------------------------- | ------------------------------------------- |
| `02-high-level-requirements/02-requirements.md`                 | Remove Pipeline references; update glossary |
| `03-architecture/00-architecture.md`                            | Update to 3-tier model; update diagrams     |
| `03-architecture/integration/overview.md`                       | Update hierarchy flows                      |
| `03-architecture/integration/schemas/07-workflow-definition.md` | Complete rewrite                            |
| `03-architecture/integration/contracts/*.md`                    | Remove `pipelineId`; use `workflowId`       |
| `03-architecture/requirements/10-orchestrator.md`               | Update FR references                        |

**No new components required.** Orchestrator, Agent Manager, Configuration Manager responsibilities unchanged.

---

## Issue 4: Artifact Serving to Web UI

### Problem Statement

- FR-UI-057 requires: "Display artifacts for review"
- Artifacts are stored at `.flowmaster/tasks/{id}/artifacts/` on local disk
- Web UI runs in browser environment
- Browsers cannot read arbitrary local files
- Gateway has no interface to serve static files/artifacts

The Web UI cannot display artifacts it is supposed to show for approval gates.

### Decision

**Add artifact serving endpoint to Gateway.**

### Proposed Contract Addition

```yaml
GW-OP-XXX: getArtifact

Purpose: Serve artifact files to Web UI

Request:
  taskId: string # Task identifier
  artifactPath: string # Relative path within artifacts folder

Response:
  content: Buffer # File content
  mimeType: string # Content type
  filename: string # Original filename

Security:
  - Path traversal prevention (no ../ allowed)
  - Sandboxed to .flowmaster/tasks/{taskId}/artifacts/
```

### Rationale

1. **Required for FR-UI-057**: Cannot display artifacts without serving them
2. **Security**: Gateway provides single point for access control
3. **Abstraction**: UI doesn't need to know file system structure

### Impact

- Add GW-OP-XXX to Gateway contract
- Add FR-GW-XXX to Gateway requirements

---

## Issue 5: Event Buffering for Late UI Connections

### Problem Statement

- FR-MM-001 states: "If no subscribers: event buffered... drain when UI connects"
- FR-GW-006 states: Gateway "subscribes to events on startup"
- **The flaw**: When backend starts, Gateway immediately subscribes. Message Manager sees a subscriber and stops buffering. But Web UI client might not have connected to Gateway yet.

Events occurring between "Backend Start" and "Browser Open" are delivered to Gateway, then dropped (no WebSocket connected), and lost forever.

### Decision

**No buffering. Show current state when UI connects.**

### Rationale

1. **Workflow execution is stateful**: If phases completed while disconnected, their completion is recorded in State Manager
2. **State is source of truth**: When UI connects, query current state - completed phases show as complete
3. **Simpler implementation**: No circular buffer management in Gateway
4. **Correct mental model**: UI shows "live view" of current state, not replay of history
5. **User expectation**: Users expect to see "where we are now", not "what happened while you were away"

### Behavior

1. User starts workflow via CLI (no Web UI open)
2. Phases 1, 2, 3 complete
3. User opens Web UI
4. Web UI queries current state: "Phases 1, 2, 3 complete. Phase 4 running."
5. UI subscribes to events for ongoing progress
6. No replay of phase 1, 2, 3 completion events - just current state

### Impact

- Clarify FR-MM-001 scope: buffering is for startup race conditions within same process, not cross-session replay
- Add clarification to Gateway requirements: "UI shows current state on connect, not historical replay"

---

## Issue 6: ID vs Name Ambiguity

### Problem Statement

Pervasive ambiguity between "ID" and "Name" in contracts:

- Schemas define: `id` (slug/kebab-case) vs `name` (human readable)
- Contracts use: `getWorkflow(name: string)`, `startWorkflow(workflowName: string)`

It's unclear if APIs expect "Deploy to Prod" (name) or "deploy-prod" (id).

### Decision

**Use `workflowId` for lookups, `workflowName` for display.**

### Naming Convention

| Field Name     | Purpose                    | Example                 |
| -------------- | -------------------------- | ----------------------- |
| `workflowId`   | Lookup key, file reference | `"plan-implement"`      |
| `workflowName` | Human-readable display     | `"Plan and Implement"`  |
| `commandId`    | Command lookup key         | `"gather-requirements"` |
| `commandName`  | Command display name       | `"Gather Requirements"` |
| `taskId`       | Task lookup key            | `"PROJ-123"`            |

### Rationale

1. **Clarity**: Developers know immediately whether they're passing a key or display value
2. **Type safety**: Can enforce ID format (kebab-case) vs name format (any string)
3. **Consistency**: Aligns with schema definitions
4. **Bug prevention**: Common source of bugs is using display name where ID expected

### Impact

- Update all contract method signatures to use `*Id` for lookup parameters
- Update contract documentation to clarify naming convention
- No schema changes (schemas already use correct naming)

---

## Summary of All Decisions

| #   | Issue             | Decision                               | Impact               |
| --- | ----------------- | -------------------------------------- | -------------------- |
| 1   | Task Cache Format | **JSON**                               | Update FR-TM-016     |
| 2   | Context Building  | No change needed                       | None                 |
| 3   | Workflow Schema   | **3-tier: Workflow → Phase → Command** | Major schema rewrite |
| 4   | Artifact Serving  | Add Gateway endpoint                   | Add GW-OP-XXX        |
| 5   | Event Buffering   | No buffering, show current state       | Clarify requirements |
| 6   | ID vs Name        | Use `*Id` for lookups                  | Update all contracts |

---

## Documents to Update

| Document                                                        | Changes                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------- |
| `02-high-level-requirements/02-requirements.md`                 | Remove "Pipeline" tier; update glossary                       |
| `03-architecture/00-architecture.md`                            | Update to 3-tier model; update diagrams                       |
| `03-architecture/integration/overview.md`                       | Update hierarchy flows                                        |
| `03-architecture/integration/schemas/07-workflow-definition.md` | **Complete rewrite** to new schema                            |
| `03-architecture/integration/contracts/*.md`                    | Remove `pipelineId`; use `workflowId`; rename `*Name` → `*Id` |
| `03-architecture/integration/contracts/12-gateway.md`           | Add artifact serving operation                                |
| `03-architecture/requirements/07-task-manager.md`               | Update FR-TM-016 to JSON                                      |
| `03-architecture/requirements/12-gateway.md`                    | Add artifact FR; clarify no historical replay                 |
| `03-architecture/requirements/10-orchestrator.md`               | Update FR references for 3-tier                               |

---

## Quick Reference: Before vs After

### Hierarchy

```
BEFORE (4-tier):                    AFTER (3-tier):
Pipeline                            Workflow
  └─ Workflow                         └─ Phase (or uses: another-workflow)
       └─ Phase                            └─ Command
            └─ Command
```

### Schema

```yaml
# BEFORE: 4 separate schema types
pipeline: { workflows: [...] }
workflow: { phases: [...] }
phase: { commands: [...] }
command: { ... }

# AFTER: 2 schema types (Workflow + Command), unified Phase
workflow:
  phases:
    - id: inline-phase
      commands: [...]
    - uses: another-workflow    # Composition!
```

### Terminology

| Old Term                    | New Term                             |
| --------------------------- | ------------------------------------ |
| Pipeline                    | Workflow (that uses other workflows) |
| `pipelineId`                | `workflowId`                         |
| `ref: workflow`             | `uses: workflow`                     |
| `workflowName` (for lookup) | `workflowId`                         |

---

## Appendix A: Research Summary

### Industry Tools Comparison

| Tool               | Tiers                            | Composition Method             |
| ------------------ | -------------------------------- | ------------------------------ |
| **GitHub Actions** | 3 (Workflow → Job → Step)        | `uses:` for reusable workflows |
| **GitLab CI**      | 3 (Pipeline → Job → Script)      | `include:` for templates       |
| **Argo Workflows** | 2-3 (Workflow → Template → Step) | Templates are reusable         |
| **Temporal**       | 2 (Workflow → Activity)          | Child workflows                |

**FlowMaster aligns with GitHub Actions** - the most widely adopted model.

### Perplexity Analysis Key Points

> "The workflow pattern literature clearly establishes that separating orchestration logic from business logic through a dedicated orchestration layer is the scalable approach."

> "Three different orchestration paradigms (GitHub Actions, Argo Workflows, Temporal) independently converged on recursive composition patterns."

### Codebase Analysis

**Gemini CLI**: Flat, LLM-driven - no declarative orchestration
**CodeMachine**: 3-tier with agent-driven control via `behavior.json`

FlowMaster chooses **declarative orchestration** for predictability - the orchestrator controls flow, not agents.

---

## Appendix B: Full YAML Examples

### Example 1: Simple Self-Contained Workflow

```yaml
id: quick-fix
name: Quick Bug Fix

phases:
  - id: analyze
    commands:
      - id: read-issue
        command: analyze-issue
      - id: find-code
        command: locate-relevant-code

  - id: fix
    needs: analyze
    commands:
      - id: implement-fix
        command: implement
      - id: write-tests
        command: write-tests

  - id: verify
    needs: fix
    commands:
      - id: run-tests
        command: run-tests
    validate:
      after:
        - type: deterministic
          check: '{{ outputs.run-tests.allPassed }}'
```

### Example 2: Composed "Pipeline" Using `uses:`

```yaml
# workflows/full-feature.yaml
id: full-feature
name: Full Feature Development

phases:
  - uses: planning

  - uses: development
    needs: planning
    loop:
      until: '{{ outputs.development.validation.passed }}'
      maxIterations: 3

  - uses: testing
    needs: development

  - uses: deployment
    needs: testing
    when: "{{ context.branch == 'main' }}"
```

```yaml
# workflows/planning.yaml
id: planning
name: Planning

phases:
  - id: research
    commands:
      - id: gather-requirements
        command: gather-requirements

  - id: design
    needs: research
    commands:
      - id: create-design
        command: design
    validate:
      after:
        - type: ai
          prompt: 'Is the design complete and implementable?'
```

### Example 3: Conditional Branching

```yaml
id: deploy-workflow
name: Environment-Aware Deployment

phases:
  - id: deploy
    switch:
      on: '{{ context.environment }}'
      cases:
        - match: 'staging'
          commands:
            - id: deploy-staging
              command: deploy
              args:
                target: staging

        - match: 'production'
          commands:
            - id: deploy-canary
              command: deploy
              args:
                target: canary
                percentage: 10
            - id: verify-canary
              command: monitor-health
            - id: deploy-full
              command: deploy
              args:
                target: production
              when: '{{ outputs.verify-canary.healthy }}'

      default:
        - id: deploy-dev
          command: deploy
          args:
            target: development
```

---

## Document History

| Version | Date       | Author            | Changes                                                                    |
| ------- | ---------- | ----------------- | -------------------------------------------------------------------------- |
| 1.0     | 2025-11-30 | Architecture Team | Initial version for team review                                            |
| 2.0     | 2025-11-30 | Architecture Team | Updated to 3-tier model; changed `ref:` to `uses:`; comprehensive examples |
