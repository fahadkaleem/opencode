# FlowMaster: Product Overview & Architecture

> **Document Type**: Stage 1 (Overview) + Stage 2 (High-Level Requirements) + Stage 3 Preview (Component Architecture)
>
> **Purpose**: Define what FlowMaster is, why it exists, and how it's structured. Component-specific requirements will be documented separately.

---

## 1. Executive Summary

**FlowMaster** is an AI-powered workflow orchestration platform that automates multi-step development tasks. It eliminates the manual overhead developers experience when coordinating AI coding assistants across complex workflows.

**Core Problem**: AI coding tools (Claude Code, Cursor, Codex) excel at single tasks but require developers to manually:

- Break tasks into subtasks
- Manage context across sessions
- Validate outputs
- Merge results

**Solution**: FlowMaster automates this orchestration through declarative workflow definitions, multi-provider AI routing, and intelligent execution management.

**Value Proposition**:

- 70%+ reduction in developer orchestration time
- 3x faster complex feature completion
- 90%+ workflow success rate
- 50%+ cost savings through optimal provider routing
- Zero cloud infrastructure (runs locally)
- No vendor lock-in (multi-provider support)

---

## 2. Business Constraints

| ID     | Constraint                | Impact                                            |
| ------ | ------------------------- | ------------------------------------------------- |
| BC-001 | Open Source (MIT License) | Public codebase, community-driven                 |
| BC-002 | No Vendor Lock-in         | Must support Claude, GPT/Codex, Gemini minimum    |
| BC-003 | Zero Cloud Infrastructure | All execution local, no hosted services           |
| BC-004 | Direct Provider Payment   | Users provide own API keys                        |
| BC-005 | Local-First Execution     | Works offline except AI provider calls            |
| BC-006 | Platform Support          | macOS, Linux required; Windows via Electron later |
| BC-007 | Node.js >= 18             | ES Modules only                                   |
| BC-008 | Privacy-First             | No data collection, telemetry opt-in only         |

---

## 3. Success Metrics

| Metric                   | Target    | Rationale                                  |
| ------------------------ | --------- | ------------------------------------------ |
| Workflow Success Rate    | ≥ 90%     | System must be reliable for production use |
| Crash Rate               | < 5%      | FlowMaster bugs vs AI errors               |
| Orchestration Overhead   | < 1 min   | Minimal overhead vs direct AI usage        |
| Feature Completion Speed | 3x faster | vs manual orchestration                    |
| Cost Savings             | ≥ 50%     | Through optimal provider routing           |

---

## 4. System Architecture

FlowMaster is composed of **5 major components**, each with single responsibility:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERFACE LAYER                              │
│                    (CLI + Web UI + Desktop UI)                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          ORCHESTRATOR                               │
│         (Workflow Engine, Iteration, Validation, Agents)            │
└─────────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│      EXECUTION ENGINE         │   │        INTEGRATIONS             │
│  (Providers, Context, Stream) │   │    (Jira, Linear, GitHub)       │
└───────────────────────────────┘   └─────────────────────────────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  ▼
                    ┌─────────────────────────────┐
                    │     PERSISTENCE LAYER       │
                    │  (State, Events, Snapshots) │
                    └─────────────────────────────┘
```

---

## 5. Component Overview

### 5.1 Persistence Layer

**Responsibility**: State management, crash recovery, and event distribution.

**Contains**:

- State Manager - Task state, workflow snapshots, atomic writes
- Event Bus - Pub-sub event system, multiple handlers (console, file, WebSocket, telemetry)

**Key Capabilities**:

- Atomic file-based persistence (no database required)
- Crash recovery via snapshots after each phase
- Real-time event streaming to UI clients
- Human-readable state files (JSON, YAML)

**Dependencies**: None (foundational layer)

---

### 5.2 Execution Engine

**Responsibility**: Execute AI commands and process their output.

**Contains**:

- Provider Abstraction - Multi-provider support, authentication, fallback
- Stream Processor - Real-time output parsing, tool metadata extraction
- Context Builder - Phase outputs, file loading, glob patterns, context injection

**Key Capabilities**:

- Support multiple AI providers (Claude, GPT/Codex, Gemini)
- Provider fallback when primary unavailable
- Real-time streaming output with tool use tracking
- Isolated context per command (prevents context degradation)
- Session resumption for multi-turn conversations

**Dependencies**: Persistence Layer (for artifacts, session state)

---

### 5.3 Orchestrator

**Responsibility**: Control workflow execution flow and make decisions.

**Contains**:

- Workflow Engine - Definition loading, validation, sequential/parallel execution
- Iteration Engine - Loops, until conditions, checkpoint resumption
- Validation Engine - Schema validation, deterministic checks, AI validation agent
- Human-in-the-Loop - Approval gates, refinement loops, timeouts
- Intelligent Agents - Workflow/pipeline agents, clarification escalation

**Key Capabilities**:

- Declarative workflow definitions (YAML)
- Sequential and parallel phase execution
- Conditional execution (if/elseIf/else)
- Dependency management between phases
- Automatic retry with exponential backoff
- Iteration until exit condition met
- Human approval gates at critical points
- AI validation to catch incomplete work

**Dependencies**: Execution Engine (to run commands), Persistence Layer (for state)

---

### 5.4 Integrations

**Responsibility**: Connect to external task management systems.

**Contains**:

- Jira Adapter
- Linear Adapter
- GitHub Issues Adapter

**Key Capabilities**:

- Fetch task details for workflow context
- Update task status as workflows progress
- Create tasks and subtasks
- Add comments and transitions
- Local caching for offline execution

**Dependencies**: Persistence Layer (for caching)

---

### 5.5 Interface Layer

**Responsibility**: User interaction through multiple interfaces.

**Contains**:

- CLI - Terminal commands, headless mode for CI/CD
- Web UI - Real-time visualization, workflow graphs
- Desktop UI - Electron app, drag-and-drop workflow builder

**Key Capabilities**:

- Interactive mode with real-time progress
- Headless mode with stdout logging for CI/CD
- Workflow graph visualization
- Phase status indicators
- Tool usage display
- Permission dialogs for file/command operations

**Dependencies**: Persistence Layer (events), Orchestrator (workflow control)

---

## 6. High-Level Requirements

These requirements define system-wide behavior. Component-specific requirements will be documented in separate files.

### 6.1 Workflow Execution (HL-WF-xxx)

| ID        | Requirement                                                                                      | Priority |
| --------- | ------------------------------------------------------------------------------------------------ | -------- |
| HL-WF-001 | System SHALL execute multi-step workflows autonomously without human intervention between phases | Critical |
| HL-WF-002 | System SHALL support declarative workflow definitions in version-controllable format             | Critical |
| HL-WF-003 | System SHALL support sequential and parallel phase execution                                     | Critical |
| HL-WF-004 | System SHALL support dependencies between workflow phases                                        | Critical |
| HL-WF-005 | System SHALL support conditional execution based on phase outputs                                | High     |
| HL-WF-006 | System SHALL support iteration until exit condition is met                                       | High     |
| HL-WF-007 | System SHALL support human approval gates at designated checkpoints                              | High     |

### 6.2 Provider Management (HL-PM-xxx)

| ID        | Requirement                                                             | Priority |
| --------- | ----------------------------------------------------------------------- | -------- |
| HL-PM-001 | System SHALL support multiple AI execution providers                    | Critical |
| HL-PM-002 | System SHALL allow provider selection per workflow phase                | High     |
| HL-PM-003 | System SHALL fallback to alternative providers when primary unavailable | High     |
| HL-PM-004 | System SHALL check provider readiness before execution                  | High     |

### 6.3 Context Management (HL-CM-xxx)

| ID        | Requirement                                                          | Priority |
| --------- | -------------------------------------------------------------------- | -------- |
| HL-CM-001 | System SHALL execute each command in isolated context                | Critical |
| HL-CM-002 | System SHALL pass outputs from dependency phases to dependent phases | Critical |
| HL-CM-003 | System SHALL support loading project files as context                | High     |
| HL-CM-004 | System SHALL support glob patterns for multiple file context         | High     |

### 6.4 State & Recovery (HL-SR-xxx)

| ID        | Requirement                                                     | Priority |
| --------- | --------------------------------------------------------------- | -------- |
| HL-SR-001 | System SHALL persist workflow state after each phase completion | Critical |
| HL-SR-002 | System SHALL recover and resume workflows after crashes         | Critical |
| HL-SR-003 | System SHALL use atomic writes to prevent state corruption      | Critical |
| HL-SR-004 | System SHALL emit events for all workflow state changes         | High     |

### 6.5 Validation (HL-VL-xxx)

| ID        | Requirement                                                                          | Priority |
| --------- | ------------------------------------------------------------------------------------ | -------- |
| HL-VL-001 | System SHALL validate workflow definitions before execution                          | Critical |
| HL-VL-002 | System SHALL validate command outputs against schemas when defined                   | High     |
| HL-VL-003 | System SHALL retry commands when validation fails with feedback                      | High     |
| HL-VL-004 | System SHALL support deterministic validation checks (file exists, command succeeds) | High     |

### 6.6 Execution Modes (HL-EM-xxx)

| ID        | Requirement                                                   | Priority |
| --------- | ------------------------------------------------------------- | -------- |
| HL-EM-001 | System SHALL support interactive mode with real-time progress | Critical |
| HL-EM-002 | System SHALL support headless mode for CI/CD integration      | High     |
| HL-EM-003 | System SHALL auto-detect execution mode from environment      | High     |

### 6.7 Integrations (HL-IN-xxx)

| ID        | Requirement                                          | Priority |
| --------- | ---------------------------------------------------- | -------- |
| HL-IN-001 | System SHALL integrate with Jira for task management | High     |
| HL-IN-002 | System SHALL cache external task data locally        | High     |
| HL-IN-003 | System SHALL update task status in external systems  | Medium   |

---

## 7. Component Requirements Documents

Each component will have its own detailed requirements document:

| Component         | Document                  | Status  |
| ----------------- | ------------------------- | ------- |
| Persistence Layer | `01-persistence-layer.md` | Pending |
| Execution Engine  | `02-execution-engine.md`  | Pending |
| Orchestrator      | `03-orchestrator.md`      | Pending |
| Integrations      | `04-integrations.md`      | Pending |
| Interface Layer   | `05-interface-layer.md`   | Pending |

These documents will contain:

- Detailed functional requirements (FR-xxx)
- Non-functional requirements (NFR-xxx)
- API contracts between components
- Data models
- Error handling specifications

---

## 8. Glossary

| Term                    | Definition                                               |
| ----------------------- | -------------------------------------------------------- |
| **Workflow**            | Multi-step automation sequence defined declaratively     |
| **Phase**               | Single step in a workflow executing one or more commands |
| **Command**             | Individual AI execution unit with prompt and context     |
| **Provider**            | AI service provider (Claude, GPT/Codex, Gemini)          |
| **Context Degradation** | Quality decline as AI session context accumulates        |
| **Isolated Context**    | Fresh execution environment per command                  |
| **Checkpoint**          | Named resumption point in iteration blocks               |
| **Approval Gate**       | Human review point before workflow continues             |
| **Validation Agent**    | AI with read-only tools that verifies work completion    |

---

## Document History

| Version | Date       | Author   | Changes                                   |
| ------- | ---------- | -------- | ----------------------------------------- |
| 0.1.0   | 2024-11-24 | AI Agent | Initial draft consolidating existing PRDs |
