# FloMaster - High-Level Requirements

> **Document Version**: 1.0
> **Last Updated**: 2025-12-25
> **Status**: Draft
> **Owner**: Product Team
>
> **Related**: [Product Overview](./01-product-overview.md) · [Architecture Overview](./03-architecture-overview.md)

---

## 1. Introduction

### 1.1 Purpose

This document defines the high-level requirements for FloMaster. These requirements describe WHAT capabilities the system needs at a strategic level, without prescribing HOW the system will be structured (that comes in the Architecture document).

### 1.2 Scope

This document covers:

- High-level functional capabilities (HL-xxx)
- Non-functional requirements / quality attributes (NFR-xxx)
- User personas and their goals

### 1.3 Requirement ID Conventions

| Type                       | Format        | Example      | Purpose              |
| -------------------------- | ------------- | ------------ | -------------------- |
| High-Level Requirement     | HL-[AREA]-XXX | HL-WF-001    | Strategic capability |
| Non-Functional Requirement | NFR-[CAT]-XXX | NFR-PERF-001 | Quality attribute    |

### 1.4 Requirement Areas

| Area Code | Area Name           | Description                                            |
| --------- | ------------------- | ------------------------------------------------------ |
| WF        | Workflow Execution  | Core workflow orchestration and execution capabilities |
| PM        | Provider Management | AI provider handling, selection, and coordination      |
| CM        | Context Management  | Context building, passing, and persistence             |
| VL        | Validation          | Output validation and schema enforcement               |
| SR        | State & Recovery    | Persistence, crash recovery, and resumption            |
| EV        | Event System        | Event-driven architecture and streaming                |
| UI        | User Interface      | CLI, Web UI, and Desktop UI capabilities               |
| TM        | Task Management     | Task lifecycle management (local and external sources) |
| AU        | Authentication      | Provider authentication management                     |
| CF        | Configuration       | Workflow and system configuration                      |
| OB        | Observability       | Logging, debugging, tracing, metrics, and telemetry    |
| API       | API Layer           | Unified API for UI clients, transport abstraction      |

### 1.5 Priority Levels

| Priority     | Meaning                                                 |
| ------------ | ------------------------------------------------------- |
| **Critical** | System cannot function without this. Must be in MVP.    |
| **High**     | Important for core value proposition. Should be in MVP. |
| **Medium**   | Valuable but not essential for launch.                  |
| **Low**      | Nice to have. Future consideration.                     |

---

## 2. User Personas

### 2.1 Primary Personas

#### Persona: Individual Developer

| Attribute           | Description                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Role**            | Software developer working on complex features                                            |
| **Goals**           | Execute complete features without manual orchestration; reduce context-switching overhead |
| **Pain Points**     | Manual task breakdown; context loss between AI sessions; repetitive orchestration work    |
| **Technical Skill** | Expert                                                                                    |
| **Usage Frequency** | Daily                                                                                     |

**Typical Scenario**:

> Alex needs to implement a user authentication feature. Instead of manually breaking the spec into tasks, orchestrating multiple AI sessions, and managing context handoffs, Alex writes a single workflow definition and executes `flomaster workflow sdlc --task AUTH-123`. FloMaster handles planning, implementation, testing, and review phases automatically.

---

#### Persona: Engineering Team Lead

| Attribute           | Description                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Role**            | Technical lead responsible for team workflow standardization                                |
| **Goals**           | Ensure consistent quality across team output; standardize AI-assisted development workflows |
| **Pain Points**     | Inconsistent code quality; onboarding new team members; lack of workflow visibility         |
| **Technical Skill** | Expert                                                                                      |
| **Usage Frequency** | Weekly                                                                                      |

**Typical Scenario**:

> Sarah creates standardized workflow definitions for her team's development process. New team members clone the repository and immediately have access to the same workflows, ensuring consistent quality and reducing onboarding time.

---

#### Persona: DevOps Engineer

| Attribute           | Description                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Role**            | Engineer responsible for CI/CD pipeline integration                                        |
| **Goals**           | Integrate FloMaster into automated pipelines; ensure reliable execution in CI environments |
| **Pain Points**     | Tools that don't work in headless environments; lack of machine-parseable output           |
| **Technical Skill** | Expert                                                                                     |
| **Usage Frequency** | Weekly                                                                                     |

**Typical Scenario**:

> Jordan integrates FloMaster into the CI/CD pipeline. When a spec issue is created, the pipeline automatically triggers a FloMaster workflow that generates the implementation, runs tests, and creates a PR for review.

---

## 3. High-Level Requirements

### 3.1 Workflow Execution (HL-WF-xxx)

#### HL-WF-001: Autonomous Multi-Step Execution

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | Critical                                    |
| **Traces to** | BG-001, BG-002                              |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL execute multi-step workflows autonomously without human intervention between steps so that developers can focus on other tasks while workflows complete.

**Rationale**:
Manual orchestration of AI steps is time-consuming and error-prone. Autonomous execution is the core value proposition that enables 70%+ reduction in orchestration time.

**Success Criteria**:

- Workflows execute from start to finish without manual intervention (unless configured otherwise)
- System handles step transitions automatically based on dependencies
- System reports progress and completion status
- Developers can optionally configure approval gates at critical points

---

#### HL-WF-002: Declarative Workflow Definitions

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | Critical                                    |
| **Traces to** | BG-004                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL support declarative workflow definitions in a version-controllable format so that workflows can be shared, reviewed, and maintained like code.

**Rationale**:
Declarative definitions enable version control, code review, reproducibility, and team collaboration—essential for standardizing development workflows across teams.

**Success Criteria**:

- Workflows defined in human-readable format (JSON)
- Workflow files can be committed to version control
- Workflows are validated before execution
- Visual editor is the primary authoring interface

---

#### HL-WF-003: Dependency-Based Execution

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | Critical             |
| **Traces to** | BG-001, BG-002       |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL execute steps based on their dependencies, running independent steps in parallel automatically, so that workflows complete as fast as possible while respecting data dependencies.

**Rationale**:
Different steps have different dependency requirements. Sequential execution ensures proper ordering where needed; parallel execution enables independent steps to run concurrently for faster completion.

**Success Criteria**:

- Steps execute when all their dependencies are satisfied
- Independent steps (no dependencies on each other) execute in parallel automatically
- Dependent steps wait for their upstream steps to complete
- Dependencies are defined by connections between steps

---

#### HL-WF-004: Step Dependencies and Context Passing

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | Critical             |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL support explicit dependencies between steps with automatic context passing so that downstream steps can build on the outputs of upstream steps.

**Rationale**:
Complex workflows require data flow between steps. A planning step's output must be available to implementation steps; test results must be available to review steps.

**Success Criteria**:

- Steps declare dependencies via connections to upstream steps
- Outputs from upstream steps are automatically available to downstream steps
- System validates dependency references at workflow load time
- Missing or circular dependencies cause clear, actionable errors

---

#### HL-WF-005: Conditional Execution

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-002                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL support conditional execution where branches can be activated or deactivated based on runtime conditions so that workflows can adapt to actual results.

**Rationale**:
Not all workflow paths apply in every situation. Conditional execution enables adaptive workflows that respond to actual results rather than blindly executing all steps.

**Success Criteria**:

- Conditions can evaluate based on upstream step outputs
- Inactive branches are skipped entirely
- Skipped steps are logged with skip reason
- Conditional logic supports comparison and boolean operators

---

#### HL-WF-006: Iterative Execution

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-002               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL support iterative execution over collections with configurable termination conditions so that workflows can process lists and repeat until objectives are achieved.

**Rationale**:
Many development tasks require iteration—process each subtask in a list, implement until tests pass, refine until validation succeeds. Iteration support enables autonomous completion of inherently iterative work.

**Success Criteria**:

- Workflows can iterate over collections produced by upstream steps
- System supports maximum iteration limits for safety
- Iteration progress is tracked in workflow state
- Iteration can resume from checkpoints after interruption

---

#### HL-WF-007: Human Approval Gates

| Attribute     | Value                 |
| ------------- | --------------------- |
| **Priority**  | High                  |
| **Traces to** | BG-002                |
| **Personas**  | Engineering Team Lead |

**Requirement**:
The system SHALL support human approval gates so that critical decisions can require explicit human confirmation before proceeding.

**Rationale**:
While automation is valuable, certain decisions (production deployments, major changes) require human oversight. Approval gates balance automation speed with appropriate human control.

**Success Criteria**:

- Workflows can pause and wait for human input
- Approval gates display relevant artifacts for review
- Users can approve, reject, or request refinement
- Approval decisions are logged in workflow state

---

#### HL-WF-008: Dynamic Workflow Adaptation

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-002                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL support dynamic adaptation at runtime where workflows can process variable-length outputs so that workflows can adapt to discovered work without requiring predefined static structure.

**Rationale**:
Complex workflows often discover additional work during execution (e.g., analyzing an issue reveals multiple subtasks to implement). Rather than knowing upfront how many iterations are needed, the system should dynamically iterate based on what is discovered.

**Success Criteria**:

- Steps can produce variable-length collections as outputs
- Downstream steps can iterate over these collections
- Iteration count adapts to actual data discovered at runtime
- Iteration progress is tracked with metadata

---

#### HL-WF-009: Loop Execution

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-002               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL support loop steps that iterate over collections produced by upstream steps, executing downstream steps for each item, so that workflows can process variable-length lists without predefined iteration counts.

**Rationale**:
Many development tasks involve processing collections (e.g., implementing each subtask, reviewing each file, testing each component). Loop steps enable declarative iteration without imperative control flow.

**Success Criteria**:

- Loop steps iterate over collections from upstream step outputs
- Each iteration makes the current item available to downstream steps
- Loop progress is tracked (current index, total count)
- Loop can be configured for sequential or parallel iteration
- Loop state is checkpointed for crash recovery

---

### 3.2 Provider Management (HL-PM-xxx)

#### HL-PM-001: Multi-Provider Support

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | Critical                                    |
| **Traces to** | BG-003                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL support multiple AI execution providers so that users can leverage different AI tools for different steps based on cost, capability, and availability.

**Rationale**:
Different AI providers have different strengths, pricing models, and capabilities. Supporting multiple providers enables optimization and avoids vendor lock-in.

**Success Criteria**:

- System can register and use multiple execution providers
- Each provider is isolated and self-contained
- System supports at least two different provider implementations
- Adding new providers requires no changes to workflow orchestration

---

#### HL-PM-002: Step-Level Provider Selection

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-003                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL allow provider and model selection at the step level so that different steps can use optimal providers based on step requirements.

**Rationale**:
Complex workflows may benefit from different providers at different steps—using faster/cheaper models for simple steps and more capable models for complex reasoning.

**Success Criteria**:

- Workflow definitions can specify provider and model per step
- System validates provider/model availability before execution
- Step-level selections override workflow defaults
- System reports which provider/model executed each step

---

#### HL-PM-003: Provider Fallback and Reliability

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | High                                  |
| **Traces to** | BG-001, BG-003                        |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL support automatic fallback to alternative providers when the requested provider is unavailable so that workflows continue executing when possible.

**Rationale**:
Provider availability may vary due to rate limits, outages, or authentication issues. Automatic fallback increases workflow reliability.

**Success Criteria**:

- System attempts requested provider first
- System tries default provider if requested provider unavailable
- System logs when fallback occurs
- System reports which provider was ultimately used

---

#### HL-PM-004: Provider Readiness Validation

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL validate provider readiness before workflow execution so that workflows fail fast with clear error messages when providers are unavailable.

**Rationale**:
Checking provider readiness upfront prevents workflows from failing mid-execution due to missing authentication or unavailable CLIs.

**Success Criteria**:

- System checks CLI installation, authentication, and platform compatibility
- System returns detailed status including reason for unavailability
- Readiness check occurs before workflow starts
- Error messages include actionable installation/authentication instructions

---

#### HL-PM-005: Provider Capability Discovery

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | Medium                                      |
| **Traces to** | BG-003                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL discover and report provider capabilities so that users and workflows can make informed provider selections.

**Rationale**:
Different providers support different features (streaming, multi-turn, specific tools). Exposing capability information enables intelligent provider selection.

**Success Criteria**:

- Each provider reports supported features (streaming, multi-turn, tools)
- Each provider reports supported models
- Capability information is accessible via CLI commands
- System validates capability requirements against provider capabilities

---

#### HL-PM-006: Process Lifecycle Management

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL manage provider process lifecycles including spawning, tracking, timeout handling, and cleanup so that system resources are properly managed and no orphaned processes remain.

**Rationale**:
Provider execution involves spawning child processes that must be properly managed. Incomplete cleanup leads to resource leaks; lack of timeout handling causes hung workflows.

**Success Criteria**:

- Child processes are spawned with proper configuration
- Active processes are tracked for cleanup
- Process groups are used for complete termination including child processes
- Timeout configuration controls maximum execution time
- All processes are terminated on workflow abort or completion
- Zero orphaned processes after shutdown

---

### 3.3 Context Management (HL-CM-xxx)

#### HL-CM-001: Context Building from Multiple Sources

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | Critical             |
| **Traces to** | BG-001, BG-002       |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL build execution context from multiple sources including previous step outputs, project files, and glob patterns so that steps receive all necessary information for execution.

**Rationale**:
AI commands need comprehensive context to make intelligent decisions. Context from multiple sources enables informed execution within multi-step workflows.

**Success Criteria**:

- Context supports step output references
- Context supports individual file references
- Context supports glob patterns for multiple files
- Context supports external data (issue information)
- Context is appended to command prompts with clear structure

---

#### HL-CM-002: Context Persistence and Loading

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL persist and load context between workflow phases so that execution context is available for debugging and dependent phases.

**Rationale**:
Persisted context enables workflow resumption, debugging, and data flow between phases without re-execution.

**Success Criteria**:

- Context is saved after each command execution
- Context files are organized by issue and step
- Downstream steps can load context from upstream steps
- Context persists across workflow execution

---

#### HL-CM-003: Session Management for Multi-Turn Conversations

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL manage AI sessions to support multi-turn conversations and session isolation so that context is maintained within steps while preventing cross-step context rot.

**Rationale**:
Multi-turn conversations enable iterative refinement within a step. Session isolation between steps prevents context rot—the core problem FloMaster solves.

**Success Criteria**:

- Session IDs are captured and stored
- Sessions can be resumed for multi-turn interactions
- Each step gets its own isolated session
- Session information persists across workflow execution

---

#### HL-CM-004: Optional and Required Context Items

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL support both optional and required context items so that workflows can gracefully handle missing optional data while failing fast on missing required data.

**Rationale**:
Not all context is essential for every execution. Optional items enable flexible workflows; required items ensure critical data is present.

**Success Criteria**:

- Workflows can mark context items as optional
- Missing optional items are skipped silently
- Missing required items cause immediate workflow failure
- Error messages for missing required items are actionable

---

### 3.4 Output Validation (HL-VL-xxx)

#### HL-VL-001: Schema-Based Output Validation

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-002                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL validate command outputs against declared schemas so that only valid, well-structured outputs are accepted for downstream consumption.

**Rationale**:
Schema validation ensures commands return expected data structures, enabling reliable conditional execution and data passing between phases.

**Success Criteria**:

- Workflows can define output schemas for phases
- System validates output structure, types, and required fields
- Validation failures trigger retry with error feedback
- Schema is injected into command prompts to guide output

---

#### HL-VL-002: Structured Output for Workflow Control

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-002               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL support structured outputs that enable workflow branching and field-level access so that workflows can make decisions based on command results.

**Rationale**:
Structured outputs enable dynamic workflow behavior—different paths based on analysis results, severity levels, or success indicators.

**Success Criteria**:

- Workflows can reference specific fields from previous outputs
- Field access uses dot notation syntax
- Validated outputs are available to conditional expressions
- System validates field references at workflow load time

---

#### HL-VL-003: Validation Retry with Error Feedback

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL retry command execution with specific error feedback when output validation fails so that commands can correct their output structure.

**Rationale**:
AI commands may produce invalid outputs on first attempt. Retry with field-level error feedback significantly improves success rate.

**Success Criteria**:

- System retries when validation fails
- Retry prompt includes specific validation errors
- System limits retry attempts to prevent infinite loops
- Validation errors identify specific failing fields

---

#### HL-VL-004: AI-Powered Output Investigation

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-001, BG-002                              |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL provide AI-powered validation agents that can investigate step outputs using read-only tools so that incomplete or incorrect work is detected even when AI steps claim success.

**Rationale**:
AI agents may "shortcut" by claiming step completion without actually doing the work. Layered validation with deterministic checks (file existence, command success) and AI investigation catches these shortcuts and ensures quality.

**Success Criteria**:

- Validation runs after step execution with deterministic checks first
- AI validation agent can read files and run commands to investigate
- Validation agent returns structured decision (continue, retry, or fail)
- Retry includes specific feedback about what was wrong
- Validation model selection is configurable for cost optimization

---

#### HL-VL-005: Deterministic Validation Checks

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL support deterministic validation checks including file existence and command success so that step outputs can be verified with zero-cost programmatic checks before invoking AI validation.

**Rationale**:
Many validation scenarios can be verified deterministically (did the file get created? did tests pass?). Deterministic checks are faster and cheaper than AI validation, and should run first.

**Success Criteria**:

- Phases can declare required files that must exist after execution
- Phases can declare commands that must succeed (exit code 0)
- Multiple files and commands can be validated
- File paths support template variable substitution
- Deterministic checks can skip AI validation when sufficient

---

### 3.5 State & Recovery (HL-SR-xxx)

#### HL-SR-001: Persistent Workflow Execution State

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL persist workflow execution state to human-readable files with atomic write operations so that execution history is visible, debuggable, recoverable, and never corrupted.

**Rationale**:
Workflows may be interrupted by crashes or user cancellation. Persistent state enables recovery without losing completed work. Atomic writes ensure state integrity even during unexpected termination.

**Success Criteria**:

- Workflow state includes execution status, step completion, outputs, and error history
- State is persisted after each step execution
- State files are human-readable (JSON)
- State can be inspected with standard Unix tools
- State writes use atomic operations (temp file + rename pattern)
- Partial writes do not corrupt state files
- System recovers from mid-write crashes
- Concurrent writes are handled safely
  **Related NFRs**: NFR-REL-002 (State Integrity)

---

#### HL-SR-002: Crash Recovery and Workflow Resumption

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL support workflow resumption after crashes or interruptions from the last successful checkpoint so that no work is lost due to process termination.

**Rationale**:
Long-running workflows must be resumable to avoid losing progress. This is essential for reliability and user confidence.

**Success Criteria**:

- System detects incomplete workflows on startup
- System can restore workflow state from snapshots
- Workflows resume from last completed step
- Previously completed steps are not re-executed
  **Related NFRs**: NFR-REL-003 (Crash Recovery Success Rate)

---

#### HL-SR-003: Execution Artifact Storage

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-001, BG-004                              |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL store execution artifacts including prompts, outputs, and message histories so that executions can be reviewed, debugged, and audited.

**Rationale**:
Execution artifacts enable post-execution review, debugging, compliance auditing, and quality improvement.

**Success Criteria**:

- Artifacts include prompts sent to providers
- Artifacts include complete command outputs
- Artifacts include message history for conversational commands
- Artifacts are organized by issue and step
- Artifacts are in human-readable formats

---

### 3.6 Event System (HL-EV-xxx)

#### HL-EV-001: Publish-Subscribe Event Architecture

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL emit events during workflow execution using a publish-subscribe pattern so that multiple consumers (UI, logs, telemetry) can receive events independently.

**Rationale**:
Decoupling execution from presentation via events enables driving CLI output, UI updates, log files, and telemetry from the same event stream without tight coupling.

**Success Criteria**:

- Multiple consumers can subscribe to events independently
- Event emission doesn't require knowledge of consumers
- Adding new consumers requires no changes to execution code
- Events include workflow, step, tool, and message information

---

#### HL-EV-002: Real-Time Event Streaming

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL stream events to UI clients in real-time so that users see execution progress as it happens.

**Rationale**:
Real-time streaming provides immediate feedback during long-running workflows, maintaining user engagement and enabling live monitoring.

**Success Criteria**:

- Events are delivered to UI clients with sub-second latency
- WebSocket communication supports bidirectional streaming
- Multiple UI clients can receive the same event stream
- Streaming works during long-running executions

---

#### HL-EV-003: Handler Isolation and Reliability

| Attribute     | Value           |
| ------------- | --------------- |
| **Priority**  | Critical        |
| **Traces to** | BG-001          |
| **Personas**  | DevOps Engineer |

**Requirement**:
The system SHALL isolate event handler failures so that one handler's failure doesn't affect others and the event system remains operational.

**Rationale**:
One consumer's failure (e.g., file system full) shouldn't break other consumers (e.g., WebSocket streaming). Handler isolation ensures system reliability.

**Success Criteria**:

- Handler exceptions are caught and logged
- Other handlers continue executing after one fails
- Handler failures don't stop event emission
- Event system remains operational after handler failure

---

#### HL-EV-004: Two-Phase Stream Processing

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL process provider output streams using a two-phase approach (transient events during execution, final persisted events after completion) so that users see real-time progress while maintaining accurate final records.

**Rationale**:
Real-time feedback requires immediate event emission, but final records need complete, validated data. Two-phase processing provides both immediate feedback and accurate persistence.

**Success Criteria**:

- Transient events are emitted in real-time during execution
- Tool metadata (action type, file paths, line numbers) is extracted from streams
- Final events are emitted after execution completes with complete data
- Text output is normalized across providers for consistent display
- Stream processing has minimal latency (<100ms from provider to UI)

---

### 3.7 User Interfaces (HL-UI-xxx)

> **Note**: FloMaster follows a desktop-first development approach. The Electron desktop application is the primary interface, with CLI support added in a later phase for CI/CD automation.

#### HL-UI-001: CLI Interface for Automation

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Medium                                |
| **Traces to** | BG-001, BG-004                        |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL provide a command-line interface for workflow execution, task management, and system configuration so that workflows can be executed from terminals and CI/CD pipelines.

**Rationale**:
CLI enables automation, scripting, and CI/CD integration. It will be added after the desktop application to support headless execution scenarios.

**Success Criteria**:

- CLI supports workflow execution with task identifier
- CLI supports workflow listing, validation, and inspection
- CLI supports individual command execution
- CLI works in both interactive and non-interactive environments
- CLI provides human-readable and machine-parseable output modes

---

#### HL-UI-002: Real-Time Workflow Visualization

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-001                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL provide real-time graphical visualization of workflow execution showing phases, status, and progress so that users can understand workflow structure and monitor execution visually.

**Rationale**:
Visual representation enables rapid comprehension of complex workflows, identification of bottlenecks, and understanding of execution state at a glance.

**Success Criteria**:

- Workflow graph displays all step types (AI, conditional, loop, etc.)
- Workflow updates in real-time during execution
- Visual indicators distinguish step states (pending, running, completed, failed)
- Users can interact with steps for additional details

---

#### HL-UI-003: Interactive Chat Interface

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL provide an interactive chat interface displaying AI agent activity, tool usage, and execution progress so that users can monitor detailed execution behavior.

**Rationale**:
Chat interface provides detailed view of AI agent execution, complementing high-level workflow visualization with execution-level details.

**Success Criteria**:

- Chat displays step start/complete messages
- Tool usage shown with parameters and results
- Assistant messages and thinking blocks displayed
- Messages appear in chronological order with auto-scroll

---

#### HL-UI-004: Dual-Mode Operation (UI and Headless)

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL support dual-mode operation for both interactive UI and headless CI/CD execution so that workflows work in development and automation contexts.

**Rationale**:
Workflows need to work interactively with UI for development and non-interactively in CI/CD pipelines without modification.

**Success Criteria**:

- System detects UI vs headless mode automatically
- UI mode streams events via WebSocket
- Headless mode writes to stdout/stderr and log files
- Both modes write events to log files
- Mode switching requires no code changes

---

#### HL-UI-005: Workflow Execution Controls

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL provide execution controls for pausing, resuming, and canceling workflows so that users can manage long-running workflows without losing progress.

**Rationale**:
Long-running workflows may need to be paused for resource management, canceled due to changing requirements, or resumed after review. Execution controls provide necessary workflow management capabilities.

**Success Criteria**:

- Users can pause executing workflows
- Paused workflows can be resumed from their current state
- Users can cancel workflows with proper cleanup
- Canceled workflows terminate all child processes
- Workflow state is preserved for paused workflows

---

#### HL-UI-006: Visual Workflow Builder

| Attribute     | Value                 |
| ------------- | --------------------- |
| **Priority**  | Medium                |
| **Traces to** | BG-004                |
| **Personas**  | Engineering Team Lead |

**Requirement**:
The system SHALL provide a visual interface for building and editing workflows so that users can create workflows without directly editing JSON files.

**Rationale**:
Visual workflow building lowers the barrier to workflow creation and enables rapid prototyping without memorizing JSON syntax. The visual editor is the primary authoring interface.

**Success Criteria**:

- Users can drag and drop steps to create workflows
- Visual editor generates valid JSON workflow definitions
- Users can configure step properties visually
- Visual representation matches execution behavior

---

### 3.8 Task Management (HL-TM-xxx)

#### HL-TM-001: Unified Task Management

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-002                                      |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL provide unified task management supporting both local tasks and external task systems (Jira, Linear, GitHub Issues) so that workflows have consistent access to task context regardless of source.

**Rationale**:
Workflows need task context to execute. A unified interface abstracts whether tasks are local-only or synced from external systems, enabling consistent workflow behavior.

**Success Criteria**:

- System provides unified task interface (create, fetch, update, complete)
- System supports local-only tasks without external dependencies
- System can sync with external task systems (Jira, Linear, GitHub Issues)
- Task data is cached locally for offline execution
- System can search and filter tasks regardless of source

---

### 3.9 Authentication (HL-AU-xxx)

#### HL-AU-001: Provider Authentication Management

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | Critical             |
| **Traces to** | BG-001, BG-003       |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL manage authentication independently for each execution provider so that each provider's credentials are properly isolated and handled.

**Rationale**:
Different providers use different authentication mechanisms. Independent management ensures each provider's authentication is properly handled without interference.

**Success Criteria**:

- Each provider has its own authentication management
- Authentication for one provider doesn't affect others
- System supports multiple authentication methods (API keys, OAuth, CLI login)
- Authentication status is cached to reduce overhead

---

### 3.10 Configuration (HL-CF-xxx)

#### HL-CF-001: Global and Per-Step Configuration

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-003, BG-004                              |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL support global workflow defaults with per-step overrides so that common settings can be defined once while allowing step-specific customization.

**Rationale**:
Global defaults reduce workflow verbosity and ensure consistent behavior; per-step overrides enable optimization for specific step requirements.

**Success Criteria**:

- Workflows can define global defaults for provider, model, and retry settings
- Steps can override any global default
- Step-level overrides take precedence
- Missing settings fall back to system defaults

---

#### HL-CF-002: Command Template System

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | Critical                                    |
| **Traces to** | BG-002, BG-004                              |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL support command templates with metadata, variable substitution, and schema definitions so that commands are reusable, configurable, and self-documenting.

**Rationale**:
Command templates enable reuse, sharing, and standardization. Metadata enables intelligent command selection; schemas enable validation.

**Success Criteria**:

- Commands defined as JSON files with structured metadata
- Commands support variable substitution with Handlebars syntax
- Commands can declare required and optional context
- Commands can specify output schemas for validation

---

### 3.11 Observability (HL-OB-xxx)

#### HL-OB-001: Hierarchical Execution Tracing

| Attribute     | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| **Priority**  | Critical                                                     |
| **Traces to** | BG-001                                                       |
| **Personas**  | Individual Developer, Engineering Team Lead, DevOps Engineer |

**Requirement**:
The system SHALL trace execution across the workflow graph with correlation IDs so that developers can debug and understand execution flow at any granularity.

**Rationale**:
Complex multi-level executions require end-to-end visibility. Correlation IDs enable tracing a single execution through all layers, essential for debugging failures and understanding performance bottlenecks.

**Success Criteria**:

- Each execution level generates a unique trace ID
- Child executions inherit and reference parent trace IDs
- Trace IDs are included in all logs, events, and telemetry
- Traces can be queried by any level's ID to see full hierarchy
- Trace data includes timing, status, and context at each level

**Related NFRs**: NFR-MNT-004 (Hierarchical Execution Monitoring)

---

#### HL-OB-002: Multi-Platform Observability Export

| Attribute     | Value                                  |
| ------------- | -------------------------------------- |
| **Priority**  | High                                   |
| **Traces to** | BG-001                                 |
| **Personas**  | Engineering Team Lead, DevOps Engineer |

**Requirement**:
The system SHALL export telemetry to external observability platforms via pluggable adapters so that teams can use their preferred monitoring tools.

**Rationale**:
Different teams use different observability stacks. Pluggable adapters (OpenTelemetry, Langfuse, etc.) enable integration without vendor lock-in.

**Success Criteria**:

- System supports adapter-based telemetry export
- At minimum supports OpenTelemetry and Langfuse
- Adapters can be enabled/disabled via configuration
- Adding new adapters requires no changes to core execution code
- Export failures do not block workflow execution

---

#### HL-OB-003: Structured Logging

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL emit structured logs at all execution levels with consistent format, severity levels, and execution context so that logs can be queried, filtered, and analyzed programmatically.

**Rationale**:
Structured logs enable automated analysis, alerting, and integration with log aggregation systems. Consistent format across all levels simplifies debugging.

**Success Criteria**:

- Logs are emitted in JSON format with consistent schema
- Each log entry includes: timestamp, level, trace ID, execution level, message, context
- Log levels: DEBUG, INFO, WARN, ERROR, FATAL
- Logs are emitted to stdout/stderr and optionally to files
- Log verbosity is configurable per execution level

**Related NFRs**: NFR-USE-001 (Inspectable State)

---

#### HL-OB-004: Cost and Token Attribution

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | High                                        |
| **Traces to** | BG-001, BG-003                              |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL track and attribute token usage and costs per step and workflow so that users can understand and optimize AI spending.

**Rationale**:
AI execution costs can be significant. Attribution at each level enables identification of expensive operations, comparison of providers/models, and budget management.

**Success Criteria**:

- Token counts (input/output) tracked per command execution
- Costs calculated based on provider/model pricing
- Costs aggregated up the hierarchy (step → workflow)
- Cost data included in execution artifacts and telemetry
- Historical cost data queryable per user

---

#### HL-OB-005: Debug Mode

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL support a debug mode that captures verbose execution details including full prompts, responses, and intermediate state so that developers can troubleshoot failures.

**Rationale**:
When executions fail or produce unexpected results, developers need detailed visibility into what happened. Debug mode provides comprehensive capture without impacting normal operation performance.

**Success Criteria**:

- Debug mode enabled via CLI flag or environment variable
- Captures full prompts sent to providers
- Captures complete provider responses
- Captures intermediate context and state
- Debug artifacts stored alongside execution artifacts
- Debug mode clearly indicated in logs and UI

---

#### HL-OB-006: Execution Metrics

| Attribute     | Value                                  |
| ------------- | -------------------------------------- |
| **Priority**  | High                                   |
| **Traces to** | BG-001                                 |
| **Personas**  | Engineering Team Lead, DevOps Engineer |

**Requirement**:
The system SHALL collect execution metrics including timing, success rates, retry counts, and provider latency at all levels so that performance can be monitored and optimized.

**Rationale**:
Metrics enable performance monitoring, SLA tracking, bottleneck identification, and provider comparison. Essential for operating FloMaster at scale.

**Success Criteria**:

- Execution duration tracked at each level
- Success/failure rates tracked per step and workflow
- Retry attempts and outcomes tracked
- Provider response latency tracked per request
- Metrics exportable to observability platforms
- Metrics support both real-time streaming and historical query

---

#### HL-OB-007: Telemetry Privacy Controls

| Attribute     | Value                                       |
| ------------- | ------------------------------------------- |
| **Priority**  | Critical                                    |
| **Traces to** | BG-001, BG-004                              |
| **Personas**  | Individual Developer, Engineering Team Lead |

**Requirement**:
The system SHALL provide privacy controls for telemetry including sensitive data stripping, opt-out capability, and per-user data isolation so that user privacy is protected.

**Rationale**:
Telemetry may contain sensitive information (code, credentials, business logic). Users must have control over what data is exported and the ability to opt out entirely.

**Success Criteria**:

- Sensitive fields (file contents, outputs, credentials) stripped from external telemetry
- Complete telemetry opt-out via environment variable or configuration
- Per-user isolation of telemetry data
- Clear documentation of what data is collected and exported
- Local-only mode that stores all telemetry locally without external export

**Related NFRs**: NFR-SEC-002 (Telemetry Privacy)

---

### 3.12 API Layer (HL-API-xxx)

> **Note**: The API layer provides a unified interface for UI clients (Desktop, CLI), abstracting the transport mechanism and routing requests to appropriate components.

#### HL-API-001: Unified API Surface

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL provide a unified API surface for all UI operations so that UI clients have a single, consistent interface regardless of transport mechanism.

**Rationale**:
A unified API simplifies UI development, enables consistent behavior across Desktop and CLI interfaces, and provides a single point for cross-cutting concerns like validation and logging.

**Success Criteria**:

- All UI operations go through the API layer
- API methods are consistent regardless of calling context (Electron IPC, direct call)
- API provides typed interfaces for all operations
- Adding new UI operations requires changes only to the API layer

---

#### HL-API-002: Request Routing

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL route API requests to appropriate internal components so that the UI layer is decoupled from component topology.

**Rationale**:
Request routing enables the UI to remain stable even as internal component structure evolves. The API layer abstracts which components handle which operations.

**Success Criteria**:

- UI does not directly reference internal components
- Routing changes require no UI modifications
- Each API method delegates to the appropriate component
- Component topology changes don't break UI

---

#### HL-API-003: Event Streaming to UI

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001                                |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL stream execution events from internal components to UI clients so that users see real-time progress during workflow execution.

**Rationale**:
Real-time event streaming enables live monitoring of workflow progress, immediate feedback on step execution, and responsive UI updates.

**Success Criteria**:

- WorkflowEngine events are forwarded to UI clients
- Events include workflow progress, step status, and execution details
- Event streaming works for both Desktop (IPC) and CLI (direct) interfaces
- UI receives events with sub-second latency

**Related NFRs**: NFR-PERF-001 (Event Streaming Latency)

---

#### HL-API-004: Request Validation

| Attribute     | Value                |
| ------------- | -------------------- |
| **Priority**  | High                 |
| **Traces to** | BG-001               |
| **Personas**  | Individual Developer |

**Requirement**:
The system SHALL validate API requests before routing so that invalid requests are rejected early with clear error messages.

**Rationale**:
Early validation prevents invalid data from reaching internal components, provides better error messages, and simplifies component implementations.

**Success Criteria**:

- All API requests are validated against schemas
- Invalid requests return specific validation errors
- Validation errors include field-level details
- Validation uses the same schema definitions as internal components

---

#### HL-API-005: Stateless Operation

| Attribute     | Value           |
| ------------- | --------------- |
| **Priority**  | High            |
| **Traces to** | BG-001          |
| **Personas**  | DevOps Engineer |

**Requirement**:
The API layer SHALL be stateless, delegating all state management to internal components so that the API can be easily tested and scaled.

**Rationale**:
Stateless API design simplifies testing, enables multiple UI clients, and ensures consistent behavior regardless of request order.

**Success Criteria**:

- API layer maintains no execution state
- All state is managed by StateManager and other components
- Multiple UI clients can connect simultaneously without conflict
- API methods are idempotent where appropriate

---

#### HL-API-006: Transport Abstraction

| Attribute     | Value                                 |
| ------------- | ------------------------------------- |
| **Priority**  | Critical                              |
| **Traces to** | BG-001, BG-004                        |
| **Personas**  | Individual Developer, DevOps Engineer |

**Requirement**:
The system SHALL abstract transport mechanisms so that the same API works via IPC (Desktop) and direct calls (CLI) without code changes.

**Rationale**:
Transport abstraction enables code reuse between Desktop and CLI interfaces, simplifies testing, and allows future transport mechanisms (HTTP, WebSocket) without API changes.

**Success Criteria**:

- Same API interface works for Electron IPC and direct function calls
- Transport selection is configuration-based, not code-based
- Adding new transports requires no changes to API method implementations
- Tests can use direct calls regardless of production transport

---

---

## 4. Non-Functional Requirements

### 4.1 Performance (NFR-PERF-xxx)

#### NFR-PERF-001: Event Streaming Latency

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
Event streaming to UI clients SHALL have sub-100ms latency from emission to client receipt.

| Metric                  | Target  | Condition       |
| ----------------------- | ------- | --------------- |
| Event-to-render latency | < 100ms | 95th percentile |

**Measurement Method**:
Timestamp comparison between event emission and client receipt via WebSocket.

---

#### NFR-PERF-002: UI Initial Load Time

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
The UI SHALL load and become interactive within 2 seconds on standard broadband connection.

| Metric                    | Target   | Condition          |
| ------------------------- | -------- | ------------------ |
| Time to Interactive (TTI) | < 2000ms | 10 Mbps connection |

**Measurement Method**:
Lighthouse performance audit with synthetic monitoring.

---

#### NFR-PERF-003: Desktop Application Startup

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
The desktop application SHALL start and become interactive within 3 seconds.

| Metric                   | Target   | Condition  |
| ------------------------ | -------- | ---------- |
| Application startup time | < 3000ms | Cold start |

**Measurement Method**:
Automated startup time measurement across supported platforms.

---

### 4.2 Reliability & Availability (NFR-REL-xxx)

#### NFR-REL-001: Workflow Success Rate

| Attribute     | Value          |
| ------------- | -------------- |
| **Priority**  | Critical       |
| **Traces to** | BG-001, SM-003 |

**Requirement**:
Workflows SHALL achieve >90% success rate when at least one provider is available.

| Metric                | Target                                  |
| --------------------- | --------------------------------------- |
| Workflow success rate | > 90%                                   |
| Success with fallback | 99% (when alternate provider available) |

---

#### NFR-REL-002: State Integrity

| Attribute     | Value    |
| ------------- | -------- |
| **Priority**  | Critical |
| **Traces to** | BG-001   |

**Requirement**:
State files SHALL never be corrupted by crashes or concurrent access.

| Metric                              | Target |
| ----------------------------------- | ------ |
| Corrupted state files               | 0      |
| Lost entries from concurrent writes | 0      |

**Measurement Method**:
Crash testing during state writes; concurrent write testing.

**Related HL**: HL-SR-001 (Persistent Task Execution State)

---

#### NFR-REL-003: Crash Recovery Success Rate

| Attribute     | Value    |
| ------------- | -------- |
| **Priority**  | Critical |
| **Traces to** | BG-001   |

**Requirement**:
100% of interrupted workflows SHALL be detectable and resumable from the last completed step.

| Metric                         | Target                      |
| ------------------------------ | --------------------------- |
| Interrupted workflow detection | 100%                        |
| Successful resumption          | 100% (from last checkpoint) |

**Measurement Method**:
Test crash scenarios at each execution point; verify detection and resumption.

**Related HL**: HL-SR-002 (Crash Recovery and Workflow Resumption)

---

### 4.3 Security (NFR-SEC-xxx)

#### NFR-SEC-001: File Operation Approval

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
The system SHALL prompt for user approval before file write and delete operations so that unintended modifications are prevented.

**Standards/Compliance**:

- 100% of file write/delete operations require approval (unless cached)
- Path traversal attacks prevented via input validation
- Only absolute paths accepted

---

#### NFR-SEC-002: Telemetry Privacy

| Attribute     | Value    |
| ------------- | -------- |
| **Priority**  | Critical |
| **Traces to** | BG-004   |

**Requirement**:
Telemetry SHALL strip sensitive data before external transmission, and users SHALL be able to opt out entirely.

**Standards/Compliance**:

- Sensitive fields (file contents, outputs) removed from telemetry
- Opt-out via environment variable (FloMaster_TELEMETRY=false)

---

### 4.4 Usability (NFR-USE-xxx)

#### NFR-USE-001: Inspectable State

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-004 |

**Requirement**:
All state files SHALL be readable with standard Unix command-line tools (cat, grep, jq, tail, ls).

| Metric                             | Target                  |
| ---------------------------------- | ----------------------- |
| Files readable with standard tools | 100%                    |
| File formats                       | JSON, JSONL, plain text |

---

#### NFR-USE-002: Actionable Error Messages

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
All error messages SHALL include specific action items and troubleshooting guidance.

| Metric                               | Target |
| ------------------------------------ | ------ |
| Errors with actionable guidance      | 100%   |
| Context errors with expected path    | 100%   |
| Validation errors with field details | 100%   |

---

#### NFR-USE-003: CI/CD Compatibility

| Attribute     | Value          |
| ------------- | -------------- |
| **Priority**  | Critical       |
| **Traces to** | BG-001, SM-002 |

**Requirement**:
All commands SHALL function correctly in non-TTY environments with graceful output degradation.

| Metric                            | Target |
| --------------------------------- | ------ |
| Commands working in CI/CD         | 100%   |
| Automatic headless mode detection | 100%   |
| Machine-parseable log output      | 100%   |

---

### 4.5 Maintainability (NFR-MNT-xxx)

#### NFR-MNT-001: Provider Abstraction

| Attribute     | Value    |
| ------------- | -------- |
| **Priority**  | Critical |
| **Traces to** | BG-003   |

**Requirement**:
Adding a new provider SHALL require <500 lines of code with no changes to workflow orchestration.

| Metric                | Target      |
| --------------------- | ----------- |
| New provider code     | < 500 lines |
| Orchestration changes | 0           |

---

#### NFR-MNT-002: Version Control Friendly

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-004 |

**Requirement**:
All workflow and configuration files SHALL be text-based and produce meaningful diffs in version control.

| Metric                    | Target |
| ------------------------- | ------ |
| Text-based workflow files | 100%   |
| Meaningful git diffs      | Yes    |

---

### 4.6 Portability (NFR-PORT-xxx)

#### NFR-PORT-001: Cross-Platform Support

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
The system SHALL work on macOS and Linux, with platform-specific process management.

| Metric          | Target   |
| --------------- | -------- |
| macOS support   | Full     |
| Linux support   | Full     |
| Windows support | Phase 2+ |

---

#### NFR-PORT-002: Directory Portability

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-004 |

**Requirement**:
All state SHALL be contained within a single directory that can be copied between systems.

| Metric                      | Target |
| --------------------------- | ------ |
| State directory portability | 100%   |
| Functionality after copy    | Full   |

---

### 4.7 Additional Performance Requirements (NFR-PERF-xxx)

#### NFR-PERF-004: Parallel Execution Efficiency

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
Parallel steps SHALL complete in time equal to the longest step, not the sum of all steps, with less than 10% overhead.

| Metric                      | Target | Condition               |
| --------------------------- | ------ | ----------------------- |
| Parallel execution overhead | < 10%  | vs. longest single step |

**Measurement Method**:
Measure parallel step execution times and compare to sum of sequential times.

---

#### NFR-PERF-005: State Persistence Performance

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
State persistence SHALL complete within 500ms and not block step execution.

| Metric                    | Target       | Condition        |
| ------------------------- | ------------ | ---------------- |
| State persistence latency | < 500ms      | Per step         |
| Blocking behavior         | Non-blocking | During execution |

**Measurement Method**:
Measure state persistence latency and verify non-blocking behavior.

---

#### NFR-PERF-006: Context Building Performance

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
Context building SHALL complete within 2 seconds for typical workflows.

| Metric             | Target   | Condition         |
| ------------------ | -------- | ----------------- |
| Context build time | < 2000ms | Typical workflows |

**Measurement Method**:
Measure context building time across variety of workflows.

---

#### NFR-PERF-007: Retry Delay Cap

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
Retry delays SHALL be capped at 30 seconds maximum.

| Metric              | Target     | Condition           |
| ------------------- | ---------- | ------------------- |
| Maximum retry delay | 30 seconds | All retry scenarios |

**Measurement Method**:
Verify retry delays never exceed 30 seconds.

---

### 4.8 Additional Reliability Requirements (NFR-REL-xxx)

#### NFR-REL-004: Deterministic Workflow Execution

| Attribute     | Value    |
| ------------- | -------- |
| **Priority**  | Critical |
| **Traces to** | BG-002   |

**Requirement**:
Workflows SHALL produce identical state transitions for identical inputs.

| Metric                    | Target |
| ------------------------- | ------ |
| Deterministic transitions | 100%   |

**Measurement Method**:
Run same workflow multiple times with identical inputs and verify identical results.

---

#### NFR-REL-005: State Persistence After Step

| Attribute     | Value    |
| ------------- | -------- |
| **Priority**  | Critical |
| **Traces to** | BG-001   |

**Requirement**:
Workflow state SHALL be persisted within 1 second of each step completion with 100% success rate.

| Metric              | Target     |
| ------------------- | ---------- |
| Persistence latency | < 1 second |
| Success rate        | 100%       |

**Measurement Method**:
Monitor state persistence success rate and latency.

---

### 4.9 Additional Usability Requirements (NFR-USE-xxx)

#### NFR-USE-004: Declarative Workflow Syntax

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-004 |

**Requirement**:
Workflow definitions SHALL be 100% declarative with no imperative control flow code.

| Metric                      | Target |
| --------------------------- | ------ |
| Declarative syntax          | 100%   |
| Complex templating required | None   |

**Measurement Method**:
Audit workflow definitions for imperative patterns.

---

#### NFR-USE-005: Clear Ambiguity Error Messages

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-004 |

**Requirement**:
When names are ambiguous (matching multiple commands/workflows), error messages SHALL list all matching options and suggest resolution.

| Metric                           | Target           |
| -------------------------------- | ---------------- |
| Ambiguous name resolution errors | List all matches |
| Resolution guidance              | Included         |

**Measurement Method**:
Test with ambiguous names and verify error message quality.

---

### 4.10 Additional Maintainability Requirements (NFR-MNT-xxx)

#### NFR-MNT-003: Workflow Definition Validation Quality

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-004 |

**Requirement**:
All workflow validation errors SHALL include file, line, and column information with actionable error messages.

| Metric                    | Target |
| ------------------------- | ------ |
| Errors with location info | 100%   |
| Actionable guidance       | 100%   |

**Measurement Method**:
Test with invalid workflows and verify error message quality.

---

#### NFR-MNT-004: Hierarchical Execution Monitoring

| Attribute     | Value  |
| ------------- | ------ |
| **Priority**  | High   |
| **Traces to** | BG-001 |

**Requirement**:
Monitoring APIs SHALL provide complete workflow and step hierarchy for all executions.

| Metric                            | Target |
| --------------------------------- | ------ |
| Hierarchy completeness            | 100%   |
| All state transitions emit events | Yes    |

**Measurement Method**:
Query monitoring API and verify hierarchical structure is complete.

---

### 4.11 Security Requirements (NFR-SEC-xxx)

#### NFR-SEC-003: Expression Evaluation Sandboxing

| Attribute     | Value    |
| ------------- | -------- |
| **Priority**  | Critical |
| **Traces to** | BG-001   |

**Requirement**:
Condition expression evaluation SHALL be sandboxed preventing arbitrary code execution, file system access, and network access.

**Standards/Compliance**:

- No eval() or Function() constructor usage
- File system access blocked
- Network access blocked
- Read-only evaluation only
- Timeout protection for long expressions

---

---

## 5. Requirements Traceability

### 5.1 Business Goal Coverage

| Business Goal                             | High-Level Requirements                                                                                                                                                                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BG-001 (Eliminate orchestration overhead) | HL-WF-001, HL-WF-003, HL-WF-004, HL-WF-008, HL-PM-003, HL-PM-006, HL-CM-001, HL-SR-001, HL-SR-002, HL-EV-001, HL-EV-004, HL-UI-001, HL-UI-005, HL-AU-001, HL-VL-004, HL-VL-005, HL-OB-001, HL-OB-002, HL-OB-003, HL-OB-005, HL-OB-006, HL-OB-007, HL-API-001, HL-API-002, HL-API-003, HL-API-004, HL-API-005 |
| BG-002 (Enable complex task automation)   | HL-WF-001, HL-WF-005, HL-WF-006, HL-WF-007, HL-WF-008, HL-WF-009, HL-VL-001, HL-VL-002, HL-VL-004, HL-TM-001, HL-CF-002                                                                                                                                                                                      |
| BG-003 (Multi-provider optimization)      | HL-PM-001, HL-PM-002, HL-PM-003, HL-PM-005, HL-AU-001, HL-CF-001, HL-OB-004                                                                                                                                                                                                                                  |
| BG-004 (Standardize team workflows)       | HL-WF-002, HL-SR-003, HL-UI-001, HL-UI-006, HL-CF-001, HL-CF-002, HL-OB-007, HL-API-006                                                                                                                                                                                                                      |

### 5.2 Success Metric Coverage

| Success Metric                             | Requirements           |
| ------------------------------------------ | ---------------------- |
| SM-001 (Active users)                      | NFR-USE-003            |
| SM-002 (Workflow success rate)             | NFR-REL-001            |
| SM-003 (Orchestration time reduction)      | HL-WF-001, HL-WF-008   |
| SM-004 (Cost savings via provider routing) | HL-PM-002, NFR-MNT-001 |

### 5.3 Requirements Summary

| Area                        | Count | Critical | High | Medium | Low |
| --------------------------- | ----- | -------- | ---- | ------ | --- |
| Workflow Execution (HL-WF)  | 9     | 4        | 5    | 0      | 0   |
| Provider Management (HL-PM) | 6     | 2        | 3    | 1      | 0   |
| Context Management (HL-CM)  | 4     | 1        | 3    | 0      | 0   |
| Validation (HL-VL)          | 5     | 0        | 5    | 0      | 0   |
| State & Recovery (HL-SR)    | 3     | 2        | 1    | 0      | 0   |
| Event System (HL-EV)        | 4     | 2        | 2    | 0      | 0   |
| User Interface (HL-UI)      | 6     | 1        | 3    | 2      | 0   |
| Task Management (HL-TM)     | 1     | 0        | 1    | 0      | 0   |
| Authentication (HL-AU)      | 1     | 1        | 0    | 0      | 0   |
| Configuration (HL-CF)       | 2     | 1        | 1    | 0      | 0   |
| Observability (HL-OB)       | 7     | 3        | 4    | 0      | 0   |
| API Layer (HL-API)          | 6     | 3        | 3    | 0      | 0   |
| Total HL                    | 54    | 20       | 31   | 3      | 0   |
| NFRs                        | 26    | 8        | 18   | 0      | 0   |
| Grand Total                 | 80    | 28       | 49   | 3      | 0   |

---

## 6. Glossary

| Term                         | Definition                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **API Layer**                | Unified interface (FloAPI) for UI clients that abstracts transport mechanisms and routes requests to internal components.                                       |
| **Workflow**                 | A collection of steps linked by connections, defining an execution flow. Defined in JSON (visual editor output).                                                |
| **Step**                     | Atomic unit of execution within a workflow. Steps execute when all their upstream dependencies are satisfied. Types include AI steps, conditionals, loops, etc. |
| **Connection**               | Link from one step's output to another step's input, defining both dependency and data flow.                                                                    |
| **Agent**                    | AI provider instance (e.g., Claude, Gemini) that executes AI steps with context and tool access                                                                 |
| **Provider**                 | AI service that powers agents (e.g., Claude, Gemini)                                                                                                            |
| **Context**                  | Data available to a step (upstream outputs, shared context, issue details)                                                                                      |
| **Shared Context**           | Key-value store accessible by all steps for data passing beyond direct connections                                                                              |
| **Artifact**                 | Output file from step execution                                                                                                                                 |
| **Session**                  | Multi-turn conversation with an AI provider                                                                                                                     |
| **Schema**                   | Definition of expected output structure for validation                                                                                                          |
| **Context rot**              | Degradation of AI output quality as session context accumulates                                                                                                 |
| **Approval gate**            | Human checkpoint requiring explicit approval before proceeding                                                                                                  |
| **Checkpoint**               | Serializable state for resuming interrupted workflows                                                                                                           |
| **Process group**            | Collection of processes managed as a unit for cleanup and termination                                                                                           |
| **Two-phase streaming**      | Pattern of emitting transient events during execution followed by final persisted events                                                                        |
| **MCP**                      | Model Context Protocol; standardized integration protocol                                                                                                       |
| **Refinement Loop**          | Human-in-loop pattern where humans provide feedback on AI-generated work, triggering step retry with feedback context                                           |
| **Validation Agent**         | AI agent with read-only tools that investigates whether steps completed their work correctly                                                                    |
| **Deterministic Validation** | Programmatic validation checks (file existence, command success) that provide zero-cost verification                                                            |
| **Expression Evaluator**     | Sandboxed environment for evaluating condition expressions with access to step outputs and context                                                              |
| **Conditional Step**         | Step that evaluates a condition and activates one of its output branches while deactivating others                                                              |
| **Loop Step**                | Step that iterates over a collection, outputting one item at a time and re-enabling downstream steps for each iteration                                         |

---

## 7. Requirements Index

| ID           | Title                                           | Priority | Traces To      |
| ------------ | ----------------------------------------------- | -------- | -------------- |
| HL-WF-001    | Autonomous Multi-Step Execution                 | Critical | BG-001, BG-002 |
| HL-WF-002    | Declarative Workflow Definitions                | Critical | BG-004         |
| HL-WF-003    | Dependency-Based Execution                      | Critical | BG-001, BG-002 |
| HL-WF-004    | Step Dependencies and Context Passing           | Critical | BG-001         |
| HL-WF-005    | Conditional Execution                           | High     | BG-002         |
| HL-WF-006    | Iterative Execution                             | High     | BG-002         |
| HL-WF-007    | Human Approval Gates                            | High     | BG-002         |
| HL-WF-008    | Dynamic Workflow Adaptation                     | High     | BG-002         |
| HL-WF-009    | Loop Execution                                  | High     | BG-002         |
| HL-PM-001    | Multi-Provider Support                          | Critical | BG-003         |
| HL-PM-002    | Step-Level Provider Selection                   | High     | BG-003         |
| HL-PM-003    | Provider Fallback and Reliability               | High     | BG-001, BG-003 |
| HL-PM-004    | Provider Readiness Validation                   | High     | BG-001         |
| HL-PM-005    | Provider Capability Discovery                   | Medium   | BG-003         |
| HL-PM-006    | Process Lifecycle Management                    | Critical | BG-001         |
| HL-CM-001    | Context Building from Multiple Sources          | Critical | BG-001, BG-002 |
| HL-CM-002    | Context Persistence and Loading                 | High     | BG-001         |
| HL-CM-003    | Session Management for Multi-Turn Conversations | High     | BG-001         |
| HL-CM-004    | Optional and Required Context Items             | High     | BG-001         |
| HL-VL-001    | Schema-Based Output Validation                  | High     | BG-002         |
| HL-VL-002    | Structured Output for Workflow Control          | High     | BG-002         |
| HL-VL-003    | Validation Retry with Error Feedback            | High     | BG-001         |
| HL-VL-004    | AI-Powered Output Investigation                 | High     | BG-001, BG-002 |
| HL-VL-005    | Deterministic Validation Checks                 | High     | BG-001         |
| HL-SR-001    | Persistent Workflow Execution State             | Critical | BG-001         |
| HL-SR-002    | Crash Recovery and Workflow Resumption          | Critical | BG-001         |
| HL-SR-003    | Execution Artifact Storage                      | High     | BG-001, BG-004 |
| HL-EV-001    | Publish-Subscribe Event Architecture            | Critical | BG-001         |
| HL-EV-002    | Real-Time Event Streaming                       | High     | BG-001         |
| HL-EV-003    | Handler Isolation and Reliability               | Critical | BG-001         |
| HL-EV-004    | Two-Phase Stream Processing                     | High     | BG-001         |
| HL-UI-001    | CLI Interface for Automation                    | Medium   | BG-001, BG-004 |
| HL-UI-002    | Real-Time Workflow Visualization                | High     | BG-001         |
| HL-UI-003    | Interactive Chat Interface                      | High     | BG-001         |
| HL-UI-004    | Dual-Mode Operation (UI and Headless)           | Critical | BG-001         |
| HL-UI-005    | Workflow Execution Controls                     | High     | BG-001         |
| HL-UI-006    | Visual Workflow Builder                         | Medium   | BG-004         |
| HL-TM-001    | Unified Task Management                         | High     | BG-002         |
| HL-AU-001    | Provider Authentication Management              | Critical | BG-001, BG-003 |
| HL-CF-001    | Global and Per-Step Configuration               | High     | BG-003, BG-004 |
| HL-CF-002    | Command Template System                         | Critical | BG-002, BG-004 |
| HL-OB-001    | Hierarchical Execution Tracing                  | Critical | BG-001         |
| HL-OB-002    | Multi-Platform Observability Export             | High     | BG-001         |
| HL-OB-003    | Structured Logging                              | Critical | BG-001         |
| HL-OB-004    | Cost and Token Attribution                      | High     | BG-001, BG-003 |
| HL-OB-005    | Debug Mode                                      | High     | BG-001         |
| HL-OB-006    | Execution Metrics                               | High     | BG-001         |
| HL-OB-007    | Telemetry Privacy Controls                      | Critical | BG-001, BG-004 |
| HL-API-001   | Unified API Surface                             | Critical | BG-001         |
| HL-API-002   | Request Routing                                 | High     | BG-001         |
| HL-API-003   | Event Streaming to UI                           | Critical | BG-001         |
| HL-API-004   | Request Validation                              | High     | BG-001         |
| HL-API-005   | Stateless Operation                             | High     | BG-001         |
| HL-API-006   | Transport Abstraction                           | Critical | BG-001, BG-004 |
| NFR-PERF-001 | Event Streaming Latency                         | High     | BG-001         |
| NFR-PERF-002 | UI Initial Load Time                            | High     | BG-001         |
| NFR-PERF-003 | Desktop Application Startup                     | High     | BG-001         |
| NFR-REL-001  | Workflow Success Rate                           | Critical | BG-001         |
| NFR-REL-002  | State Integrity                                 | Critical | BG-001         |
| NFR-REL-003  | Crash Recovery Success Rate                     | Critical | BG-001         |
| NFR-SEC-001  | File Operation Approval                         | High     | BG-001         |
| NFR-SEC-002  | Telemetry Privacy                               | Critical | BG-004         |
| NFR-USE-001  | Inspectable State                               | High     | BG-004         |
| NFR-USE-002  | Actionable Error Messages                       | High     | BG-001         |
| NFR-USE-003  | CI/CD Compatibility                             | Critical | BG-001         |
| NFR-MNT-001  | Provider Abstraction                            | Critical | BG-003         |
| NFR-MNT-002  | Version Control Friendly                        | High     | BG-004         |
| NFR-MNT-003  | Workflow Definition Validation Quality          | High     | BG-004         |
| NFR-MNT-004  | Hierarchical Execution Monitoring               | High     | BG-001         |
| NFR-PORT-001 | Cross-Platform Support                          | High     | BG-001         |
| NFR-PORT-002 | Directory Portability                           | High     | BG-004         |
| NFR-PERF-004 | Parallel Execution Efficiency                   | High     | BG-001         |
| NFR-PERF-005 | State Persistence Performance                   | High     | BG-001         |
| NFR-PERF-006 | Context Building Performance                    | High     | BG-001         |
| NFR-PERF-007 | Retry Delay Cap                                 | High     | BG-001         |
| NFR-REL-004  | Deterministic Workflow Execution                | Critical | BG-002         |
| NFR-REL-005  | State Persistence After Step                    | Critical | BG-001         |
| NFR-USE-004  | Declarative Workflow Syntax                     | High     | BG-004         |
| NFR-USE-005  | Clear Ambiguity Error Messages                  | High     | BG-004         |
| NFR-SEC-003  | Expression Evaluation Sandboxing                | Critical | BG-001         |
