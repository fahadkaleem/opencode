# FloMaster - System Architecture

> **Document Version**: 1.2
> **Last Updated**: 2026-01-06
> **Status**: Active
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Product Overview](./01-product-overview.md)
> - [Requirements Overview](./02-requirements-overview.md)
> - [Architecture Overview (Deprecated)](./03-architecture-overview.md)
>
> **Note**: This document supersedes [03-architecture-overview.md](./03-architecture-overview.md). FloMaster is built as an extension to OpenCode, leveraging its production-ready infrastructure.
>
> **v1.1 Changes**: Added complete HLR coverage tables (all 54 HL requirements + 26 NFRs), validation requirements section, deferred requirements section, and requirements coverage summary.
>
> **v1.2 Changes**: Updated architecture to reflect FloMaster as a separate package (`packages/flomaster/`) rather than embedded in opencode. This enables clean upstream merges from OpenCode.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architectural Drivers](#2-architectural-drivers)
3. [System Context](#3-system-context)
4. [Solution Strategy](#4-solution-strategy)
5. [Component Architecture](#5-component-architecture)
6. [Component Interactions](#6-component-interactions)
7. [Cross-Cutting Concerns](#7-cross-cutting-concerns)
8. [Data Architecture](#8-data-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Architecture Decisions](#10-architecture-decisions)
11. [Open Questions & Risks](#11-open-questions--risks)
12. [Glossary](#12-glossary)

**Appendices**

- [Appendix A: Workflow JSON Format](#appendix-a-workflow-json-format)
- [Appendix B: Key File Reference](#appendix-b-key-file-reference)

---

## 1. Introduction

### 1.1 Purpose

This document describes the architecture of FloMaster, a workflow orchestration system built as an extension to OpenCode. It defines how FloMaster leverages OpenCode's infrastructure while adding workflow-specific capabilities.

### 1.2 Scope

This architecture document covers:

- How FloMaster extends OpenCode
- Package structure and code organization
- FloMaster-specific components and their responsibilities
- Integration patterns with OpenCode systems
- Cross-cutting concerns (logging, security, error handling)

### 1.3 Architecture Decision Records

Significant architectural decisions are documented in separate ADR files:

- [ADR-001: TBD](decisions/001-tbd.md)
- [ADR-002: TBD](decisions/002-tbd.md)
- [Add more as needed...]

### 1.4 Component Reading Order

Components are organized by **dependency order** (OpenCode foundations first, then FloMaster additions):

| Order | Layer         | Component    | Location                               | Purpose                      |
| ----- | ------------- | ------------ | -------------------------------------- | ---------------------------- |
| 1     | OpenCode      | Config       | `packages/opencode/src/config/`        | Configuration management     |
| 2     | OpenCode      | Storage      | `packages/opencode/src/storage/`       | File-based persistence       |
| 3     | OpenCode      | Bus          | `packages/opencode/src/bus/`           | Event pub-sub system         |
| 4     | OpenCode      | Provider     | `packages/opencode/src/provider/`      | Multi-LLM provider support   |
| 5     | OpenCode      | Permission   | `packages/opencode/src/permission/`    | Tool access control          |
| 6     | OpenCode      | Agent        | `packages/opencode/src/agent/`         | Agent definitions & registry |
| 7     | OpenCode      | Session      | `packages/opencode/src/session/`       | Conversation management      |
| 8     | OpenCode      | Tool         | `packages/opencode/src/tool/`          | Agent tool implementations   |
| 9     | **FloMaster** | StateManager | `packages/flomaster/src/state/`        | Workflow execution state     |
| 10    | **FloMaster** | Orchestrator | `packages/flomaster/src/orchestrator/` | DAG execution engine         |
| 11    | **FloMaster** | CLI          | `packages/flomaster/src/cli/`          | Workflow commands            |

---

## 2. Architectural Drivers

### 2.1 Key High-Level Requirements

Requirements are organized by which layer addresses them.

#### OpenCode Infrastructure (Pre-Built)

**Provider Management:**

| Requirement ID | Summary                       | OpenCode Component                    |
| -------------- | ----------------------------- | ------------------------------------- |
| HL-PM-001      | Multi-provider support        | `Provider` namespace (20+ providers)  |
| HL-PM-002      | Step-level provider selection | `Provider.parseModel()`               |
| HL-PM-003      | Provider fallback             | AI SDK (@ai-sdk/\*) retry logic       |
| HL-PM-004      | Provider readiness validation | SDK authentication checks             |
| HL-PM-005      | Provider capability discovery | `Provider.Model.capabilities`         |
| HL-PM-006      | Process lifecycle management  | OpenCode server + session lifecycle   |
| HL-AU-001      | Provider authentication       | `Provider.auth`, keychain integration |

**Configuration & Context:**

| Requirement ID | Summary                              | OpenCode Component         |
| -------------- | ------------------------------------ | -------------------------- |
| HL-CF-001      | Configuration defaults and overrides | `Config` namespace         |
| HL-CF-002      | Configuration validation             | Zod schemas in Config      |
| HL-CM-003      | Session management                   | `Session`, `SessionPrompt` |

**Event System:**

| Requirement ID | Summary                       | OpenCode Component                |
| -------------- | ----------------------------- | --------------------------------- |
| HL-EV-001      | Publish-subscribe events      | `Bus.publish`, `Bus.subscribe`    |
| HL-EV-002      | Real-time event streaming     | SSE via `/event` endpoint         |
| HL-EV-003      | Handler isolation/reliability | `Bus` error isolation per handler |
| HL-EV-004      | Two-phase stream processing   | `LLM.stream()` with parts         |

**Observability:**

| Requirement ID | Summary                    | OpenCode Component                       |
| -------------- | -------------------------- | ---------------------------------------- |
| HL-OB-003      | Structured logging         | `Log` utility                            |
| HL-OB-004      | Cost and token attribution | `MessageV2.tokens`, `MessageV2.cost`     |
| HL-OB-005      | Debug mode                 | `Log` verbosity levels                   |
| HL-OB-006      | Execution metrics          | Session timing, token counts per message |

**API Layer:**

| Requirement ID | Summary               | OpenCode Component           |
| -------------- | --------------------- | ---------------------------- |
| HL-API-001     | Unified API surface   | OpenCode's Hono HTTP server  |
| HL-API-002     | Request routing       | Server routes to components  |
| HL-API-003     | Event streaming to UI | SSE via `/event` endpoint    |
| HL-API-004     | Request validation    | Zod schemas in routes        |
| HL-API-005     | Stateless operation   | Server delegates to Session  |
| HL-API-006     | Transport abstraction | Same API for CLI/TUI/Desktop |

#### FloMaster Orchestration (New)

**Workflow Execution:**

| Requirement ID | Summary                          | FloMaster Component                  |
| -------------- | -------------------------------- | ------------------------------------ |
| HL-WF-001      | Autonomous multi-step execution  | `WorkflowEngine`                     |
| HL-WF-002      | Declarative workflow definitions | `parseWorkflow()`, JSON format       |
| HL-WF-003      | Dependency-based execution       | Topological sort, DAG scheduler      |
| HL-WF-004      | Step dependencies/context pass   | `SharedContext`, `{{interpolation}}` |
| HL-WF-005      | Conditional execution            | `ConditionalExecutor`                |
| HL-WF-006      | Iterative execution              | `LoopExecutor` with termination      |
| HL-WF-007      | Human approval gates             | `HumanInputExecutor` (planned)       |
| HL-WF-008      | Dynamic workflow adaptation      | Variable-length outputs, iteration   |
| HL-WF-009      | Loop execution over collections  | `LoopExecutor` item iteration        |

**Context Management:**

| Requirement ID | Summary                             | FloMaster Component                        |
| -------------- | ----------------------------------- | ------------------------------------------ |
| HL-CM-001      | Context building from multiple src  | `SharedContext` + step outputs aggregation |
| HL-CM-002      | Context persistence and loading     | `StateManager.getContext()` / `setContext` |
| HL-CM-004      | Optional and required context items | Step input validation (planned)            |

**State & Recovery:**

| Requirement ID | Summary                    | FloMaster Component           |
| -------------- | -------------------------- | ----------------------------- |
| HL-SR-001      | Workflow state persistence | `StateManager`                |
| HL-SR-002      | Crash recovery             | Checkpoint/resume system      |
| HL-SR-003      | Execution artifact storage | OpenCode `Session` + messages |

#### FloMaster Validation (Planned)

| Requirement ID | Summary                         | FloMaster Component                    |
| -------------- | ------------------------------- | -------------------------------------- |
| HL-VL-001      | Schema-based output validation  | Zod schemas in step config (planned)   |
| HL-VL-002      | Structured output for control   | Step outputs → SharedContext           |
| HL-VL-003      | Validation retry with feedback  | XState retry logic with error context  |
| HL-VL-004      | AI-powered output investigation | Expert validation agent (planned)      |
| HL-VL-005      | Deterministic validation checks | LSP integration, file checks (planned) |

#### Deferred Requirements (Future Phases)

| Requirement ID | Summary                           | Target Phase | Approach                           |
| -------------- | --------------------------------- | ------------ | ---------------------------------- |
| HL-TM-001      | Unified task management           | Phase 2      | MCP servers for Jira/Linear/GitHub |
| HL-UI-002      | Real-time workflow visualization  | Phase 2      | Desktop app with React Flow        |
| HL-UI-003      | Interactive chat interface        | Phase 2      | Desktop app chat panel             |
| HL-UI-004      | Dual-mode operation (UI/headless) | Phase 1      | CLI works now; Desktop planned     |
| HL-UI-005      | Workflow execution controls       | Phase 1      | CLI pause/resume (planned)         |
| HL-UI-006      | Visual workflow builder           | Phase 2      | React Flow editor in Desktop       |
| HL-OB-001      | Hierarchical execution tracing    | Phase 2      | Correlation IDs across steps       |
| HL-OB-002      | Multi-platform observability      | Phase 2      | Langfuse/OpenTelemetry adapters    |
| HL-OB-007      | Telemetry privacy controls        | Phase 2      | Sensitive data stripping           |

### 2.2 Key Quality Attributes

**Performance:**

| NFR ID       | Quality Attribute   | Target              | Architectural Impact                     |
| ------------ | ------------------- | ------------------- | ---------------------------------------- |
| NFR-PERF-001 | Event streaming     | < 100ms latency     | Direct Bus.publish, no HTTP for internal |
| NFR-PERF-002 | Parallel execution  | 10 concurrent steps | Parallel step execution in orchestrator  |
| NFR-PERF-004 | Parallel efficiency | < 10% overhead      | XState parallel states                   |
| NFR-PERF-005 | State persistence   | < 500ms per step    | Atomic file writes in StateManager       |
| NFR-PERF-006 | Context building    | < 2000ms typical    | SharedContext aggregation                |

**Reliability:**

| NFR ID      | Quality Attribute     | Target                  | Architectural Impact            |
| ----------- | --------------------- | ----------------------- | ------------------------------- |
| NFR-REL-001 | Workflow success rate | > 90% with one provider | Retry logic, validation         |
| NFR-REL-002 | State integrity       | 0 corrupted files       | Atomic writes (temp + rename)   |
| NFR-REL-003 | Crash recovery        | 100% resumable          | Checkpoint after each step      |
| NFR-REL-004 | Deterministic exec    | Identical transitions   | XState + DAG determinism        |
| NFR-REL-005 | State persistence     | 100% after each step    | StateManager.recordStepResult() |

**Security:**

| NFR ID      | Quality Attribute     | Target                  | Architectural Impact                |
| ----------- | --------------------- | ----------------------- | ----------------------------------- |
| NFR-SEC-001 | File operation safety | Approval required       | OpenCode permission system          |
| NFR-SEC-002 | Telemetry privacy     | Sensitive data stripped | Deferred (Phase 2)                  |
| NFR-SEC-003 | Expression sandboxing | No arbitrary code exec  | Safe expression evaluator (planned) |

**Maintainability:**

| NFR ID      | Quality Attribute    | Target                 | Architectural Impact                 |
| ----------- | -------------------- | ---------------------- | ------------------------------------ |
| NFR-MNT-001 | Provider abstraction | < 500 lines for new    | OpenCode handles all providers       |
| NFR-MNT-002 | Version control      | Text-based, meaningful | JSON workflows, human-readable state |
| NFR-MNT-003 | Validation errors    | File/line/column info  | Zod error formatting                 |
| NFR-MNT-004 | Hierarchical monitor | Complete hierarchy     | Parent-child sessions in TUI         |

**Usability:**

| NFR ID      | Quality Attribute   | Target                | Architectural Impact       |
| ----------- | ------------------- | --------------------- | -------------------------- |
| NFR-USE-001 | Inspectable state   | Standard Unix tools   | JSON files in .flomaster/  |
| NFR-USE-002 | Actionable errors   | 100% with guidance    | Error classes with context |
| NFR-USE-003 | CI/CD compatibility | 100% headless support | CLI-first design           |

**Portability:**

| NFR ID       | Quality Attribute     | Target                | Architectural Impact                |
| ------------ | --------------------- | --------------------- | ----------------------------------- |
| NFR-PORT-001 | Cross-platform        | macOS, Linux (Win P2) | Bun runtime, OpenCode compatibility |
| NFR-PORT-002 | Directory portability | Single directory      | .flomaster/ contains all state      |

### 2.3 Constraints

| Constraint                      | Source         | Architectural Impact                    |
| ------------------------------- | -------------- | --------------------------------------- |
| BC-002: No vendor lock-in       | Business       | OpenCode's multi-provider support       |
| BC-004: Zero runtime costs      | Business       | Local-first, no cloud infrastructure    |
| Self-contained FloMaster module | Technical      | Easy upstream OpenCode merges           |
| Node.js ecosystem               | Technical      | TypeScript, ES Modules, Bun runtime     |
| Single maintainer initially     | Organizational | Leverage OpenCode, minimize custom code |

### 2.4 Requirements Coverage Summary

This architecture document covers **54 High-Level Requirements** and **26 NFRs** from [02-requirements-overview.md](./02-requirements-overview.md).

| Category                    | Total  | Covered | OpenCode | FloMaster | Deferred |
| --------------------------- | ------ | ------- | -------- | --------- | -------- |
| Workflow Execution (HL-WF)  | 9      | 9       | 0        | 9         | 0        |
| Provider Management (HL-PM) | 6      | 6       | 6        | 0         | 0        |
| Context Management (HL-CM)  | 4      | 4       | 1        | 3         | 0        |
| Validation (HL-VL)          | 5      | 5       | 0        | 0         | 5        |
| State & Recovery (HL-SR)    | 3      | 3       | 1        | 2         | 0        |
| Event System (HL-EV)        | 4      | 4       | 4        | 0         | 0        |
| User Interface (HL-UI)      | 6      | 6       | 0        | 1         | 5        |
| Task Management (HL-TM)     | 1      | 1       | 0        | 0         | 1        |
| Authentication (HL-AU)      | 1      | 1       | 1        | 0         | 0        |
| Configuration (HL-CF)       | 2      | 2       | 2        | 0         | 0        |
| Observability (HL-OB)       | 7      | 7       | 4        | 0         | 3        |
| API Layer (HL-API)          | 6      | 6       | 6        | 0         | 0        |
| **Total HL**                | **54** | **54**  | **25**   | **15**    | **14**   |
| NFRs                        | 26     | 22      | 10       | 12        | 4        |
| **Grand Total**             | **80** | **76**  | **35**   | **27**    | **18**   |

**Legend:**

- **OpenCode**: Fully handled by OpenCode infrastructure (no FloMaster code needed)
- **FloMaster**: Requires new code in `src/flomaster/`
- **Deferred**: Planned for future phases (Phase 2+)

---

## 3. System Context

### 3.1 Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 ENVIRONMENT                                 │
│                                                                             │
│    ┌──────────┐          ┌─────────────────────────┐         ┌──────────┐   │
│    │Developer │─────────▶│       FLOMASTER         │◀────────│  Jira/   │   │
│    │  (CLI)   │          │    (OpenCode Fork)      │         │  Linear  │   │
│    └──────────┘          │                         │         └──────────┘   │
│    ┌──────────┐          │  Workflow orchestration │         ┌──────────┐   │
│    │Developer │─────────▶│  + AI development CLI   │◀───────▶│  Claude  │   │
│    │  (TUI)   │          │                         │         │  OpenAI  │   │
│    └──────────┘          └─────────────────────────┘         │  Google  │   │
│                                     │                        │  20+more │   │
│                                     │                        └──────────┘   │
│                                     ▼                                       │
│              ┌─────────────────────────────────────────┐                    │
│              │           Local File System             │                    │
│              │  ~/.opencode/     .flomaster/           │                    │
│              │  (sessions)       (executions)          │                    │
│              └─────────────────────────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 External Actors

| Actor             | Type   | Description                   | Interaction                               |
| ----------------- | ------ | ----------------------------- | ----------------------------------------- |
| Developer (CLI)   | User   | Primary user via command line | `flomaster workflow run`, `flomaster run` |
| Developer (TUI)   | User   | User via terminal UI          | Interactive session management            |
| LLM Providers     | System | Claude, OpenAI, Google, etc.  | Execute prompts, return responses         |
| Task Management   | System | Jira, Linear (via MCP)        | Fetch tasks, update status                |
| Local File System | System | State, sessions, artifacts    | Persistence layer                         |

---

## 4. Solution Strategy

### 4.1 Architectural Style

**Primary Pattern**: Extension of Modular Monolith (OpenCode)

**Rationale**:

- OpenCode is already a well-architected modular monolith
- FloMaster adds a self-contained orchestration module
- No need to build separate infrastructure - leverage what exists
- Single deployable unit aligns with local-first philosophy

### 4.2 Key Technology Decisions

| Decision Area        | Choice           | Rationale                                                                                                                                                         |
| -------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base Platform        | OpenCode Fork    | Production-ready session/agent/provider infrastructure                                                                                                            |
| Programming Language | TypeScript       | OpenCode's language, type safety                                                                                                                                  |
| State Machines       | XState v5        | Workflow state management with persistence support. **Note**: v5 has significant API differences from v4 (uses `setup().createMachine()`, inline actions/guards). |
| Validation           | Zod              | Already used throughout OpenCode                                                                                                                                  |
| Desktop UI           | Electron + React | Future - OpenCode's desktop patterns                                                                                                                              |
| CLI Framework        | Commander.js     | OpenCode's existing CLI structure                                                                                                                                 |

### 4.3 Architectural Principles

1. **Leverage OpenCode**: Use existing infrastructure (Session, Agent, Provider, Bus, Storage) rather than rebuilding. OpenCode provides production-ready implementations for sessions, agents, providers, permissions, tools, events, and storage.

2. **Separate Package**: FloMaster is a separate package (`packages/flomaster/`) that depends on `opencode` as a workspace dependency. This enables:
   - **Clean upstream merges**: When OpenCode releases updates, we can pull changes without any conflicts
   - **Clear boundaries**: FloMaster's orchestration logic is completely isolated from OpenCode's core
   - **Easy navigation**: Developers know exactly where FloMaster code lives
   - **Independent versioning**: FloMaster can be versioned separately from OpenCode

   **Rule**: FloMaster imports from `opencode` package (e.g., `import { Session } from "opencode/session/index"`) rather than relative paths.

3. **Parent-Child Sessions**: Each workflow step creates a child session linked to the workflow parent via `parentID`. This enables:
   - Visual grouping in OpenCode's TUI sidebar
   - Context isolation (each step has fresh context)
   - Audit trail (all step conversations preserved)
   - Future "chat with step" capability

4. **Fail-Safe State**: Checkpoint after each step completion for crash recovery. State is persisted to `.flomaster/executions/` before proceeding to the next step.

5. **Fresh Context Per Step**: Each step creates a new session, preventing context rot. Previous step outputs are passed via SharedContext interpolation (`{{stepId.output}}`), not accumulated conversation history.

---

## 5. Component Architecture

### 5.1 Monorepo Layout

```
flomaster-opencode/
├── packages/
│   ├── flomaster/                   # ★ FloMaster Package ★ (separate from OpenCode)
│   │   ├── bin/
│   │   │   └── flomaster            # CLI entry point
│   │   ├── src/
│   │   │   ├── cli/                 # Standalone workflow CLI
│   │   │   │   ├── index.ts         # CLI entry point
│   │   │   │   └── workflow.ts      # Workflow commands (run, list, inspect, resume)
│   │   │   ├── orchestrator/        # DAG execution engine
│   │   │   │   ├── engine/          # WorkflowEngine, factory
│   │   │   │   ├── machine/         # XState v5 state machine
│   │   │   │   ├── parser/          # Workflow JSON parser
│   │   │   │   ├── registry/        # Step executor registry
│   │   │   │   │   └── executors/   # agentExecutor, loopExecutor, etc.
│   │   │   │   └── workflows/       # Built-in workflows (test, research, sdlc)
│   │   │   ├── state/               # Workflow state persistence
│   │   │   │   └── stateManager.ts
│   │   │   └── index.ts             # Public exports
│   │   ├── package.json             # @opencode-ai/flomaster
│   │   └── tsconfig.json
│   │
│   ├── opencode/                    # Core CLI (upstream OpenCode)
│   │   ├── src/
│   │   │   ├── agent/               # Agent definitions (OpenCode)
│   │   │   ├── bus/                 # Event system (OpenCode)
│   │   │   ├── cli/cmd/             # CLI commands (OpenCode)
│   │   │   ├── config/              # Configuration (OpenCode)
│   │   │   ├── permission/          # Tool permissions (OpenCode)
│   │   │   ├── provider/            # LLM providers (OpenCode)
│   │   │   ├── session/             # Session management (OpenCode)
│   │   │   ├── storage/             # File persistence (OpenCode)
│   │   │   └── tool/                # Agent tools (OpenCode)
│   │   │
│   │   └── .opencode/agents/        # Custom workflow agents
│   │       ├── research-agent.md
│   │       ├── plan-agent.md
│   │       ├── implement-agent.md
│   │       └── review-agent.md
│   │
│   ├── sdk/                         # TypeScript SDK (OpenCode)
│   ├── plugin/                      # Plugin system (OpenCode)
│   └── desktop/                     # Tauri desktop app (OpenCode)
│
├── .flomaster/                      # Runtime state (project-level)
│   └── executions/
│       └── {execution-id}/
│           ├── state.json
│           ├── context.json
│           ├── mapping.json
│           └── checkpoint.json
│
└── .opencode/                       # OpenCode config (project-level)
    └── agents/                      # Custom agents
```

**Key Design**: FloMaster is a **workspace package** that depends on `opencode`:

- `packages/flomaster/package.json` declares `"opencode": "workspace:*"` as a dependency
- Imports use package paths: `import { Session } from "opencode/session/index"`
- This enables clean upstream merges - OpenCode changes don't conflict with FloMaster

### 5.2 Dependency Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACES                                │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   flomaster CLI     │  │    OpenCode TUI     │  │   Desktop (future)  │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLOMASTER LAYER (src/flomaster/)                    │
│  ┌───────────────────────┐  ┌────────────────────┐  ┌────────────────────┐  │
│  │   WorkflowEngine      │  │   StateManager     │  │  Step Executors    │  │
│  │   (XState v5)         │  │   (.flomaster/)    │  │  Agent|Loop|Cond   │  │
│  └───────────────────────┘  └────────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │ uses
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPENCODE LAYER (src/*)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Session  │ │  Agent   │ │ Provider │ │   Bus    │ │ Storage  │          │
│  │ Prompt   │ │  Perm    │ │  Models  │ │  Events  │ │   KV     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                    │
│  │  Tool    │ │  Config  │ │ Instance │                                    │
│  │ Registry │ │  State   │ │ Context  │                                    │
│  └──────────┘ └──────────┘ └──────────┘                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            LLM PROVIDERS                                    │
│     Anthropic │ OpenAI │ Google │ Bedrock │ Mistral │ Groq │ 15+ more      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Component Overview

FloMaster adds three core components on top of OpenCode's infrastructure:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FLOMASTER SYSTEM                               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    OPENCODE INFRASTRUCTURE                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │  │ Session  │ │  Agent   │ │ Provider │ │   Bus    │ │ Storage  │    │  │
│  │  │ Prompt   │ │  Perm    │ │  20+ LLMs│ │  Events  │ │   KV     │    │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                              │  │
│  │  │  Tool    │ │  Config  │ │ Instance │  (All ready-to-use)          │  │
│  │  │ Registry │ │  State   │ │ Context  │                              │  │
│  │  └──────────┘ └──────────┘ └──────────┘                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    │ extends                                │
│                                    ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    FLOMASTER ORCHESTRATION                            │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    orchestrator/                                │  │  │
│  │  │                    WorkflowEngine                               │  │  │
│  │  │   (DAG execution, step scheduling, context interpolation)       │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌───────────────────────┐  ┌───────────────────────────────────┐    │  │
│  │  │       state/          │  │      registry/executors/          │    │  │
│  │  │    StateManager       │  │   AgentExecutor, LoopExecutor,    │    │  │
│  │  │  (.flomaster/ files)  │  │   ConditionalExecutor, etc.       │    │  │
│  │  └───────────────────────┘  └───────────────────────────────────┘    │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 OpenCode Components (Leveraged)

FloMaster uses these OpenCode components directly via imports:

#### Session System (`src/session/`)

| API                    | Purpose                     | FloMaster Usage                       |
| ---------------------- | --------------------------- | ------------------------------------- |
| `Session.create()`     | Create conversation session | Workflow parent + step child sessions |
| `Session.get()`        | Retrieve session info       | StateManager session queries          |
| `Session.children()`   | Get child sessions          | List step sessions for workflow       |
| `SessionPrompt.prompt` | Execute prompt in session   | Step execution                        |
| `SessionPrompt.cancel` | Cancel running prompt       | Abort signal handling                 |

**MessageV2 Parts Structure**: Responses contain typed `parts` that FloMaster extracts:

| Part Type       | Purpose                       | Extraction in AgentExecutor           |
| --------------- | ----------------------------- | ------------------------------------- |
| `TextPart`      | AI-generated text response    | `extractTextFromParts()` → response   |
| `ToolPart`      | Tool call with state + result | `extractToolCallsFromParts()` → tools |
| `PatchPart`     | File modification diff        | Included in tool results              |
| `ReasoningPart` | Chain-of-thought (if enabled) | Not extracted, internal to LLM        |

#### Agent System (`src/agent/`)

| API            | Purpose                | FloMaster Usage                     |
| -------------- | ---------------------- | ----------------------------------- |
| `Agent.get()`  | Retrieve agent by name | Get step's agent (build, plan, etc) |
| `Agent.list()` | List all agents        | Validation, UI display              |
| `Agent.Info`   | Agent configuration    | Model, permissions, prompt          |

#### Provider System (`src/provider/`)

| API                       | Purpose                  | FloMaster Usage             |
| ------------------------- | ------------------------ | --------------------------- |
| `Provider.parseModel()`   | Parse "provider/model"   | Step model override         |
| `Provider.defaultModel()` | Get default model        | Fallback when not specified |
| `Provider.getModel()`     | Get model metadata       | Validation, cost tracking   |
| `Provider.list()`         | List available providers | UI display                  |

#### Bus System (`src/bus/`)

| API                 | Purpose            | FloMaster Usage           |
| ------------------- | ------------------ | ------------------------- |
| `Bus.publish()`     | Emit typed event   | Workflow progress events  |
| `Bus.subscribe()`   | Listen to events   | CLI progress display      |
| `BusEvent.define()` | Create typed event | FloMaster-specific events |

#### Permission System (`src/permission/`)

| API                         | Purpose               | FloMaster Usage                |
| --------------------------- | --------------------- | ------------------------------ |
| `PermissionNext.Ruleset`    | Permission rule array | Step session permissions       |
| `PermissionNext.fromConfig` | Convert config format | Agent permission loading       |
| `PermissionNext.merge()`    | Combine rulesets      | Merge agent + step permissions |

**Permission Rule Structure**:

```typescript
type Rule = {
  permission: string      // Tool name: "edit", "bash", "task", etc.
  pattern: string         // Glob pattern: "*.ts", "src/**", "*"
  action: "allow" | "deny" | "ask"
}
type Ruleset = Rule[]

// Example: deny task tool to prevent recursion
{ permission: "task", pattern: "*", action: "deny" }
```

Rules are evaluated in order—**last matching rule wins**. This enables overrides (e.g., deny all, then allow specific paths).

#### Storage System (`src/storage/`)

| API                | Purpose                  | FloMaster Usage                    |
| ------------------ | ------------------------ | ---------------------------------- |
| `Storage.read()`   | Read JSON from key path  | StateManager reads execution state |
| `Storage.write()`  | Write JSON to key path   | StateManager writes checkpoints    |
| `Storage.update()` | Atomic read-modify-write | Update step status                 |
| `Storage.list()`   | List keys under path     | List executions                    |

**Storage Key Structure**: Keys are arrays that form a path:

```typescript
// Session storage
;["session", projectId, sessionId][
  // Message storage
  ("message", sessionId, messageId)
][
  // Message parts (tool calls, patches, etc.)
  ("part", messageId, partId)
]
```

Storage location: `~/.local/share/opencode/storage/` (XDG-compliant).

**Note**: FloMaster's StateManager uses direct file I/O to `.flomaster/` rather than OpenCode's Storage namespace to keep workflow state separate from session storage.

#### Tool System (`src/tool/`)

OpenCode provides 20+ tools that agents can invoke. FloMaster doesn't interact with tools directly—they're invoked by the LLM via `SessionPrompt`.

**Core Tools Available to Agents**:

| Tool    | Purpose                    | Permission Key   |
| ------- | -------------------------- | ---------------- |
| `bash`  | Execute shell commands     | `bash`           |
| `read`  | Read file contents         | `read`           |
| `edit`  | Modify existing files      | `edit`           |
| `write` | Create new files           | `edit`           |
| `glob`  | Find files by pattern      | (always allowed) |
| `grep`  | Search file contents       | (always allowed) |
| `task`  | Spawn subagent (recursive) | `task`           |

**Important for FloMaster**: Step agents deny the `task` permission to prevent infinite recursion (workflow step spawning another workflow step via task tool).

#### Config System (`src/config/`)

| API                    | Purpose                  | FloMaster Usage                        |
| ---------------------- | ------------------------ | -------------------------------------- |
| `Config.get()`         | Get merged configuration | Load agent definitions, model defaults |
| `Config.state()`       | Access runtime config    | Check feature flags                    |
| `Config.directories()` | Get config paths         | Find custom agents in `.opencode/`     |

#### Server System (`src/server/`)

OpenCode includes a **Hono-based HTTP server** that exposes the same API used by CLI, TUI, and Desktop apps:

| API Endpoint              | Purpose                       | FloMaster Usage                  |
| ------------------------- | ----------------------------- | -------------------------------- |
| `POST /session`           | Create new session            | (Via Session namespace directly) |
| `POST /session/{id}/chat` | Send message to session       | (Via SessionPrompt directly)     |
| `GET /session/{id}/event` | SSE stream for session events | Future: Real-time UI updates     |
| `GET /global/event`       | Global event stream           | Future: Workflow progress in UI  |
| `GET /provider`           | List available providers      | Future: Provider selection UI    |

**Note**: FloMaster CLI uses direct imports (not HTTP calls) for performance. The server API becomes relevant for:

- Desktop app integration
- External tool integration
- Real-time UI updates via SSE

#### LLM System (`src/session/llm.ts`)

| API            | Purpose                         | FloMaster Usage                  |
| -------------- | ------------------------------- | -------------------------------- |
| `LLM.stream()` | Stream LLM responses with tools | Used internally by SessionPrompt |

**Note**: FloMaster doesn't call `LLM.stream()` directly—`SessionPrompt.prompt()` handles this internally. Listed for completeness.

### 5.5 How System Prompts Flow to LLM

Steps have **two sources** of system prompt that are additive:

1. **Agent's base prompt** - From `Agent.Info.prompt` (defined in `.opencode/agents/*.md` or built-in)
2. **Step's systemPrompt** - From workflow step config (augments, doesn't replace)

```
Final System Prompt =
  1. SystemPrompt.header()        ← Provider-specific header
  2. + agent.prompt               ← Agent's base prompt (from Agent.Info)
  3. + system[]                   ← Additional system prompts (step.systemPrompt)
  4. + user.system                ← User-level system prompt
  5. + environment context        ← CLAUDE.md, etc.
```

**Example**: A research step using `explore` agent with custom systemPrompt:

| Source              | Content                                                  |
| ------------------- | -------------------------------------------------------- |
| Agent's base prompt | "You are a codebase exploration expert. Use grep, glob…" |
| Step's systemPrompt | "Focus on authentication patterns. Look for login…"      |
| Environment         | CLAUDE.md project instructions                           |

The AI receives ALL of these combined—the agent defines general behavior, the step adds specific context.

### 5.6 Model Selection Priority

When determining which LLM model to use for a step:

| Priority | Source               | Description                                 |
| -------- | -------------------- | ------------------------------------------- |
| 1        | Step config model    | Explicit model in workflow step config      |
| 2        | Agent's model        | From `Agent.Info.model` in agent definition |
| 3        | Session's last model | Model used in previous message              |
| 4        | Provider default     | Provider's default model                    |

```typescript
// In agentExecutor.ts
const model = config.config.model
  ? Provider.parseModel(config.config.model) // Step config wins
  : agent.model // Agent default
```

### 5.7 Instance Context Pattern

All OpenCode operations must run within an `Instance.provide()` context:

```typescript
// In workflow.ts CLI command
await bootstrap(cwd, async () => {
  // Inside this callback:
  // - Instance.directory is available
  // - Instance.project is available
  // - Session operations work
  // - Storage operations work

  const engine = createWorkflowEngine({ directory: cwd })
  const result = await engine.executeWorkflow(workflowData, taskId)
})
```

**What is `bootstrap()`?**

`bootstrap()` is a utility function from OpenCode's CLI (`src/cli/lib/bootstrap.ts`) that:

1. Calls `Instance.provide({ directory, init, fn })` to establish async-local context
2. Initializes the global state (config, agents, etc.)
3. Runs the provided callback within that context
4. Handles cleanup on exit

**Why is it needed?**

OpenCode uses `AsyncLocalStorage` to provide per-directory context. Without `Instance.provide()`:

- `Instance.directory` is undefined
- `Instance.project` is undefined
- `Session.create()` fails (no project context)
- `Storage.read/write()` fails (no storage path)

The `bootstrap()` function (from OpenCode's CLI utilities) wraps `Instance.provide()` and ensures:

- Configuration is loaded
- Agents are discovered
- Storage paths are resolved
- Project context is established

**Important**: If you call session functions outside this context, you'll get errors about missing context.

**Instance.state() Pattern**: For per-directory singleton state with cleanup:

```typescript
// Create per-directory state (e.g., in Bus for subscriptions)
const state = Instance.state(
  // Initializer (called once per directory)
  () => ({
    subscriptions: new Map<string, Subscription[]>(),
    cache: new Map<string, unknown>(),
  }),
  // Cleanup (called on instance disposal)
  async (entry) => {
    entry.subscriptions.clear()
    entry.cache.clear()
  },
)

// Access is scoped to current Instance
state().subscriptions.get(eventName)
```

This pattern is used by Bus (event subscriptions), Provider (SDK instances), and other systems that need directory-scoped state.

### 5.8 FloMaster Components (New)

#### FM-001: Workflow Engine

| Attribute        | Value                                         |
| ---------------- | --------------------------------------------- |
| **Component ID** | FM-001                                        |
| **Directory**    | `packages/flomaster/src/orchestrator/engine/` |
| **Main Class**   | `WorkflowEngine`                              |
| **Type**         | Core Engine                                   |

**Responsibility**:

Manages execution of workflows using dependency-based scheduling:

- **Workflow Lifecycle**: Load, validate, execute, pause, resume, cancel
- **DAG Scheduling**: Topological sort, dependency tracking, parallel execution
- **Step Orchestration**: Spawn XState actors for step execution
- **Context Management**: Build and interpolate `{{stepId.output}}` references
- **Event Emission**: Publish workflow progress via OpenCode's Bus
- **State Coordination**: Trigger StateManager checkpoints after each step

**XState v5 Machine States** (defined in `workflowMachine.ts`):

```
        ┌──────────────────────────────────────────────┐
        │                                              │
        ▼                                              │
    ┌───────┐    START    ┌────────────────┐          │
    │ idle  │────────────▶│ execute_step   │          │
    └───────┘             └────────┬───────┘          │
                                   │                   │
                    ┌──────────────┼──────────────┐   │
                    ▼              ▼              ▼   │
              ┌──────────┐  ┌──────────┐  ┌──────────┐│
              │  success │  │  failure │  │  waiting ││
              └────┬─────┘  └────┬─────┘  └────┬─────┘│
                   │             │             │      │
                   │        ┌────┴────┐        │      │
                   │        ▼         ▼        │      │
                   │   ┌────────┐ ┌───────┐    │      │
                   │   │ retry  │ │ fail  │    │      │
                   │   └───┬────┘ └───────┘    │      │
                   │       │                   │      │
                   └───────┴───────────────────┘      │
                           │                          │
                   (more steps?) ──────────yes────────┘
                           │
                          no
                           │
                           ▼
                    ┌──────────┐
                    │ completed│
                    └──────────┘
```

**Key Guards**: `hasMoreSteps`, `canRetry`, `isHumanInput`

**NOT Responsible For**:

- LLM provider management (handled by OpenCode's Provider)
- Tool execution details (handled by OpenCode's Tool system)
- Session/message persistence (handled by OpenCode's Session + Storage)
- Agent permissions (handled by OpenCode's Permission system)

**Dependencies**:

| Depends On   | Purpose                                 |
| ------------ | --------------------------------------- |
| Session      | Create workflow and step sessions       |
| Agent        | Get agent definitions for steps         |
| StateManager | Persist execution state and checkpoints |
| Bus          | Publish workflow progress events        |

**Integration with OpenCode**:

```typescript
// Creates parent session for workflow
const workflowSession = await Session.create({
  title: `Workflow: ${taskId}`,
})

// Each step creates child session via agentExecutor
const stepSession = await Session.create({
  parentID: workflowSession.id,
  title: `Step: ${stepName} (@${agent.name})`,
})
```

**Implements Requirements**:

- HL-WF-001: Autonomous multi-step execution
- HL-WF-002: Declarative workflow definitions
- HL-WF-003: Dependency-based execution
- HL-WF-004: Step dependencies and context passing
- HL-WF-005: Conditional execution
- HL-WF-006: Iterative execution

**Interface Summary**:

```typescript
interface WorkflowEngine {
  executeWorkflow(workflow: WorkflowData, taskId: string, options?: ExecutionOptions): Promise<WorkflowResult>

  subscribe(callback: (event: WorkflowEvent) => void): () => void
}

type WorkflowResult = {
  workflowSessionID: string
  stepResults: StepResult[]
  outputs: Record<string, unknown>
}
```

---

#### FM-002: State Manager

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Component ID** | FM-002                          |
| **Directory**    | `packages/flomaster/src/state/` |
| **Main Class**   | `StateManager`                  |
| **Type**         | Support Service                 |

**Responsibility**:

Manages workflow-level execution state (separate from OpenCode's session storage):

- **Execution Tracking**: Status per workflow and step
- **Shared Context**: Step outputs for `{{interpolation}}`
- **Session Mapping**: Step ID → Session ID correlation
- **Checkpoints**: Full state snapshots for crash recovery
- **Session Queries**: Expose OpenCode session details via unified API

**NOT Responsible For**:

- Session message storage (handled by OpenCode's Session)
- Tool call history (handled by OpenCode's Session parts)
- Agent execution (handled by WorkflowEngine + Executors)
- Workflow scheduling (handled by WorkflowEngine)

**Dependencies**:

| Depends On  | Purpose                                |
| ----------- | -------------------------------------- |
| Session     | Query session details and messages     |
| File System | Persist `.flomaster/executions/` state |

**Storage Location**: `{project}/.flomaster/executions/{execution-id}/`

```
.flomaster/executions/{id}/
├── state.json       # Execution status, step statuses
├── context.json     # SharedContext (step outputs)
├── mapping.json     # Step → Session ID mapping
└── checkpoint.json  # Full checkpoint for recovery
```

**Integration with OpenCode**:

```typescript
// Query session details via OpenCode's Session API
async getSessionDetails(sessionId: string) {
  const session = await Session.get(sessionId)
  const messages = await Session.messages(sessionId)
  return { session, messages }
}
```

**Implements Requirements**:

- HL-SR-001: Workflow state persistence
- HL-SR-002: Crash recovery (checkpoints)
- HL-SR-003: Artifact storage (via session mapping)

**Interface Summary**:

```typescript
interface StateManager {
  // Execution lifecycle
  createExecution(executionId: string, workflowName: string): Promise<void>
  updateExecutionStatus(executionId: string, status: ExecutionStatus): Promise<void>

  // Step tracking
  updateStepStatus(executionId: string, stepId: string, status: StepStatus): Promise<void>
  recordStepResult(executionId: string, stepId: string, result: StepResult): Promise<void>

  // Context (for interpolation)
  mergeStepOutputs(executionId: string, stepId: string, outputs: Record<string, unknown>): Promise<void>
  getContext(executionId: string): Promise<SharedContext>

  // Session mapping
  mapStepToSession(executionId: string, stepId: string, sessionId: string): Promise<void>
  getSessionForStep(executionId: string, stepId: string): Promise<string | null>

  // Checkpoints
  saveCheckpoint(executionId: string): Promise<void>
  loadCheckpoint(executionId: string): Promise<ExecutionCheckpoint | null>
}
```

---

#### FM-003: Step Executor Registry

| Attribute        | Value                                           |
| ---------------- | ----------------------------------------------- |
| **Component ID** | FM-003                                          |
| **Directory**    | `packages/flomaster/src/orchestrator/registry/` |
| **Main Class**   | `StepExecutorRegistry`                          |
| **Type**         | Registry                                        |

**Responsibility**:

Provides pluggable step type implementations:

| Step Type           | Executor                 | Purpose                         |
| ------------------- | ------------------------ | ------------------------------- |
| `Agent`             | `agentExecutor.ts`       | AI agent execution via OpenCode |
| `ConditionalRouter` | `conditionalExecutor.ts` | Branch based on condition       |
| `Loop`              | `loopExecutor.ts`        | Iterate over collections        |
| `SubFlow`           | `subflowExecutor.ts`     | Execute nested workflow         |
| `Prompt`            | `promptExecutor.ts`      | Direct LLM call (no tools)      |
| `Input`/`Output`    | `genericExecutor.ts`     | Workflow I/O steps              |

**NOT Responsible For**:

- Workflow scheduling order (handled by WorkflowEngine)
- State persistence (handled by StateManager)
- Step dependencies (handled by WorkflowEngine DAG)

**Dependencies**:

| Depends On    | Purpose                               |
| ------------- | ------------------------------------- |
| Session       | Create step sessions (AgentExecutor)  |
| SessionPrompt | Execute prompts (AgentExecutor)       |
| Agent         | Get agent definitions (AgentExecutor) |
| Provider      | Parse model strings (AgentExecutor)   |

**Agent Executor Integration Pattern**:

```typescript
// In agentExecutor.ts - follows task.ts pattern exactly
async execute(step: ParsedStep, context: ExecutorContext, options?: ExecutorOptions) {
  // 1. Get agent from OpenCode
  const agent = await Agent.get(agentType)

  // 2. Create child session (parent = workflow session)
  const session = await Session.create({
    parentID: context.workflowSessionID,
    title: `${step.displayName} (@${agent.name})`,
    permission: [
      { permission: "task", pattern: "*", action: "deny" }  // Prevent recursion
    ]
  })

  // 3. Setup abort signal handling with defer pattern
  const d = defer()  // OpenCode's cleanup utility
  if (options?.signal) {
    options.signal.addEventListener("abort", () => {
      SessionPrompt.cancel(session.id)
      d.resolve()
    })
  }

  // 4. Generate unique message ID
  const messageID = Identifier.ascending("message")  // OpenCode's ID generator

  // 5. Execute via OpenCode's SessionPrompt
  const result = await SessionPrompt.prompt({
    messageID,
    sessionID: session.id,
    agent: agent.name,
    model: agent.model,
    parts: [{ type: "text", text: interpolatedPrompt }]
  })

  // 6. Return outputs + session ID
  return {
    stepId: step.id,
    sessionID: session.id,  // For state mapping
    outputs: extractOutputs(result.parts)
  }
}
```

**Key Utilities Used**:

- `Identifier.ascending()`: Generates sortable unique IDs (format: `msg_xxx`)
- `defer()`: Creates a promise that can be resolved externally (from `src/util/defer.js`)

---

#### FM-004: Context Interpolator

| Attribute        | Value                                                              |
| ---------------- | ------------------------------------------------------------------ |
| **Component ID** | FM-004                                                             |
| **File**         | `packages/flomaster/src/orchestrator/utils/contextInterpolator.ts` |
| **Type**         | Utility                                                            |

**Responsibility**:

Resolves `{{stepId.outputKey}}` syntax in step prompts before execution:

- Parses prompt strings for `{{...}}` patterns
- Looks up referenced values in SharedContext
- Replaces placeholders with actual values from previous step outputs
- Reports errors for missing references

**Syntax**:

| Pattern                | Example                | Resolution                                      |
| ---------------------- | ---------------------- | ----------------------------------------------- |
| `{{stepId.outputKey}}` | `{{research.summary}}` | Value of `outputs.summary` from step `research` |
| `{{stepId.response}}`  | `{{plan.response}}`    | Full text response from step `plan`             |

**Limitations**:

- Only one level of nesting: `{{step.output}}` works, `{{step.output.nested}}` does not
- Step must have completed successfully for outputs to be available
- Missing references cause step execution to fail (fail-fast)

**Integration**:

```typescript
// Called in agentExecutor.ts before execution
const interpolatedPrompt = contextInterpolator.interpolate(
  step.config.prompt,
  context.outputs, // SharedContext from previous steps
)
```

**NOT Responsible For**:

- Building the SharedContext (that's StateManager)
- Deciding step execution order (that's WorkflowEngine)

---

### 5.9 Pre-Built Workflow Agents

FloMaster includes pre-built agents for common workflow steps (in `.opencode/agents/`):

| Agent             | Mode     | Purpose                        | Key Permissions                       |
| ----------------- | -------- | ------------------------------ | ------------------------------------- |
| `research-agent`  | subagent | Read-only codebase exploration | read, grep, glob, list, webfetch      |
| `plan-agent`      | subagent | Implementation planning        | read + write to `.opencode/plan/`     |
| `implement-agent` | subagent | Code implementation            | full access (read, edit, write, bash) |
| `review-agent`    | subagent | Code review & analysis         | read + git diff/log/show commands     |

**Agent Mode**: All workflow step agents use `mode: subagent` (not `primary`). Primary agents are for direct user interaction; subagents are for programmatic invocation.

**Why Deny Task Permission**: Step agents deny the `task` permission to prevent infinite recursion:

```
Workflow → Step Agent → task tool → New Agent → task tool → ...
                        ↑___________________________|
                             INFINITE RECURSION
```

### 5.10 Component Quick Reference

| ID     | Component            | Location                                        | Type           |
| ------ | -------------------- | ----------------------------------------------- | -------------- |
| OC-001 | Session              | `packages/opencode/src/session/`                | OpenCode Core  |
| OC-002 | Agent                | `packages/opencode/src/agent/`                  | OpenCode Core  |
| OC-003 | Provider             | `packages/opencode/src/provider/`               | OpenCode Core  |
| OC-004 | Bus                  | `packages/opencode/src/bus/`                    | OpenCode Core  |
| OC-005 | Storage              | `packages/opencode/src/storage/`                | OpenCode Core  |
| OC-006 | Permission           | `packages/opencode/src/permission/`             | OpenCode Core  |
| OC-007 | Tool                 | `packages/opencode/src/tool/`                   | OpenCode Core  |
| OC-008 | Config               | `packages/opencode/src/config/`                 | OpenCode Core  |
| OC-009 | Server               | `packages/opencode/src/server/`                 | OpenCode Core  |
| OC-010 | Instance             | `packages/opencode/src/project/instance.ts`     | OpenCode Core  |
| FM-001 | WorkflowEngine       | `packages/flomaster/src/orchestrator/`          | FloMaster Core |
| FM-002 | StateManager         | `packages/flomaster/src/state/`                 | FloMaster Core |
| FM-003 | StepExecutorRegistry | `packages/flomaster/src/orchestrator/registry/` | FloMaster Core |

---

## 6. Component Interactions

### 6.1 Communication Patterns

| From           | To             | Pattern     | Purpose                   |
| -------------- | -------------- | ----------- | ------------------------- |
| CLI            | WorkflowEngine | Direct call | Start workflow execution  |
| WorkflowEngine | Session        | Direct call | Create parent session     |
| WorkflowEngine | StateManager   | Direct call | Persist state, checkpoint |
| AgentExecutor  | Agent          | Direct call | Get agent config          |
| AgentExecutor  | Session        | Direct call | Create child session      |
| AgentExecutor  | SessionPrompt  | Direct call | Execute prompt            |
| WorkflowEngine | Bus            | Events      | Publish progress events   |
| CLI            | Bus            | Events      | Subscribe to progress     |

### 6.2 Key Interaction Flows

#### Flow 1: Execute Workflow

```
User: flomaster workflow run "implement feature X"
         │
         ▼
    workflow.ts (CLI command)
         │
         ├── bootstrap(cwd, async () => {
         │       │
         │       ├── createWorkflowEngine({ directory })
         │       │
         │       ├── engine.subscribe(displayProgress)
         │       │
         │       └── engine.executeWorkflow(workflowData, taskId)
         │               │
         │               ├── Session.create() → workflowSessionID
         │               │
         │               ├── XState actor starts
         │               │
         │               └── For each step (topological order):
         │                       │
         │                       ├── stepActor spawned
         │                       ├── executor.execute(step, context)
         │                       │       │
         │                       │       ├── Session.create(parentID)
         │                       │       ├── SessionPrompt.prompt(agent)
         │                       │       └── Return { sessionID, outputs }
         │                       │
         │                       ├── StateManager.recordStepResult()
         │                       ├── StateManager.saveCheckpoint()
         │                       └── Bus.publish(STEP_COMPLETED)
         │
         └── Display WorkflowResult
```

#### Flow 2: Session Hierarchy

```
Workflow Execution
    │
    ├── Session: "Workflow: AUTH-123" (workflowSessionID)
    │       │
    │       ├── Child: "Step: Research (@research-agent)"
    │       │     └── Messages: [user prompt, assistant response, tool calls...]
    │       │
    │       ├── Child: "Step: Plan (@plan-agent)"
    │       │     └── Messages: [user prompt, assistant response...]
    │       │
    │       └── Child: "Step: Implement (@build)"
    │             └── Messages: [user prompt, assistant response, tool calls...]
    │
    └── StateManager tracks: step → sessionID mapping
```

#### Flow 3: Crash Recovery

```
1. Process crashes during step 3 execution

2. State on disk (.flomaster/executions/{id}/):
   - state.json: { step1: COMPLETED, step2: COMPLETED, step3: RUNNING }
   - context.json: { step1: {...}, step2: {...} }
   - checkpoint.json: Full state snapshot

3. User resumes: flomaster workflow resume <execution-id>

4. WorkflowEngine:
   - Loads checkpoint
   - Skips step1, step2 (already COMPLETED)
   - Re-runs step3 (was RUNNING, not COMPLETED)
   - Continues normal execution
```

#### Flow 4: Human Input Step (Planned)

```
WorkflowEngine reaches Human Input step
         │
         ▼
    Bus.publish(STEP_WAITING_INPUT, { stepId, prompt, options })
         │
         ▼
    Workflow pauses (status: PAUSED)
         │
         ▼
    UI displays prompt to user
         │
         ▼
    User provides input
         │
         ▼
    CLI/UI calls engine.submitInput(executionId, stepId, input)
         │
         ▼
    WorkflowEngine:
      ├── Stores input in SharedContext
      ├── Updates step status to COMPLETED
      └── Resumes execution
```

**Use Cases**:

| Use Case             | Example                              |
| -------------------- | ------------------------------------ |
| Safety confirmations | "Confirm before deleting 50 files?"  |
| Business decisions   | "What should this feature be named?" |
| Approval gates       | "Review and approve this plan?"      |

#### Flow 5: Provider Fallback (Handled by OpenCode)

```
AgentExecutor calls SessionPrompt.prompt()
         │
         ▼
    OpenCode's LLM.stream() sends to Provider
         │
         ▼
    Primary Provider (e.g., Anthropic)
         │
         ├── Success → Return response
         │
         └── Failure (rate limit, timeout, outage)
                  │
                  ▼
             OpenCode SDK retry logic
                  │
                  ├── Retryable (429, 5xx) → Exponential backoff
                  │
                  └── Non-retryable (401, 403) → Throw immediately
                           │
                           ▼
                      AgentExecutor catches
                           │
                           ▼
                      XState machine → handleError state
                           │
                           ├── canRetry? → RETRY event → try again
                           └── !canRetry → FAIL → workflow fails
```

**Key Point**: Provider-level retries are handled by OpenCode's SDK. FloMaster only handles workflow-level retry (re-running the step).

---

## 7. Cross-Cutting Concerns

### 7.1 Logging Strategy

**Approach**: Use OpenCode's `Log` utility

```typescript
import { Log } from "../util/log.js"

Log.info("workflow", "Step completed", { stepId, sessionId })
Log.error("workflow", "Step failed", { stepId, error })
```

| Layer         | Audience   | Output                       |
| ------------- | ---------- | ---------------------------- |
| Debug logs    | Developers | `~/.opencode/logs/`          |
| User feedback | End users  | CLI stdout with --print-logs |
| Telemetry     | Analytics  | Bus events (opt-in)          |

### 7.2 Error Handling Strategy

**Approach**: Executors throw, orchestrator handles

```typescript
// Executors throw on failure
throw new AgentExecutionError(`Step failed: ${reason}`, stepId)

// XState machine catches and routes to handleError state
// which checks canRetry guard and either retries or fails workflow
```

| Error Category | Recovery            | Example                         |
| -------------- | ------------------- | ------------------------------- |
| Transient      | Retry with backoff  | Rate limit, timeout             |
| Recoverable    | Provider fallback   | Provider failure                |
| Validation     | Retry with feedback | Schema validation failure       |
| Fatal          | Fail workflow       | Agent not found, invalid config |

### 7.3 Security Strategy

**Approach**: Leverage OpenCode's security infrastructure

| Concern        | Strategy                                    |
| -------------- | ------------------------------------------- |
| Credentials    | OpenCode keychain integration               |
| API Keys       | Never logged, loaded via Provider.auth      |
| File Access    | OpenCode permission system (ask/allow/deny) |
| Task Recursion | Deny `task` permission on step sessions     |

### 7.4 Configuration Management

**Approach**: OpenCode handles all configuration

| Level          | Location                  | Purpose                    |
| -------------- | ------------------------- | -------------------------- |
| Global         | `~/.opencode/config.json` | User preferences           |
| Project        | `.opencode/config.json`   | Project settings           |
| Agents         | `.opencode/agents/*.md`   | Custom agent definitions   |
| Workflow State | `.flomaster/executions/`  | Runtime state (not config) |

### 7.5 Monitoring & Observability

**Approach**: Layered observability using OpenCode's Bus system

| Layer   | What                                     | Transport                  |
| ------- | ---------------------------------------- | -------------------------- |
| Events  | Workflow lifecycle (start, step, done)   | Bus.publish() + SSE        |
| Metrics | Step duration, token usage, success rate | Aggregated in StateManager |
| Traces  | Execution trace (workflow → step)        | Execution ID correlation   |

**FloMaster Event Definitions** (using OpenCode's `BusEvent.define()`):

```typescript
// In src/flomaster/events/definitions.ts
export const FloMasterEvent = {
  ExecutionCreated: BusEvent.define(
    "flomaster.execution.created",
    z.object({
      executionId: z.string(),
      workflowName: z.string(),
      taskId: z.string().optional(),
    }),
  ),
  StepStarted: BusEvent.define(
    "flomaster.step.started",
    z.object({
      executionId: z.string(),
      stepId: z.string(),
      stepName: z.string(),
    }),
  ),
  StepCompleted: BusEvent.define(
    "flomaster.step.completed",
    z.object({
      executionId: z.string(),
      stepId: z.string(),
      sessionId: z.string(),
      status: z.enum(["COMPLETED", "FAILED", "SKIPPED"]),
    }),
  ),
  ExecutionCompleted: BusEvent.define(
    "flomaster.execution.completed",
    z.object({
      executionId: z.string(),
      status: z.enum(["COMPLETED", "FAILED", "CANCELLED"]),
    }),
  ),
}
```

**Principles**:

- Local-first (no cloud dependency)
- Opt-in external telemetry (Langfuse via MCP)
- Execution ID correlation across all events

---

## 8. Data Architecture

### 8.1 Data Storage Overview

| Data Store                     | Type       | Purpose                  | Owner            |
| ------------------------------ | ---------- | ------------------------ | ---------------- |
| `~/.opencode/storage/session/` | JSON files | Session data, messages   | OpenCode Storage |
| `~/.opencode/config.json`      | JSON       | User configuration       | OpenCode Config  |
| `.opencode/agents/*.md`        | Markdown   | Custom agent definitions | OpenCode Agent   |
| `.flomaster/executions/`       | JSON files | Workflow execution state | FloMaster State  |

### 8.2 Data Flow

```
User Input (prompt, workflow name)
         │
         ▼
    WorkflowEngine
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
    Session.create()                    StateManager.createExecution()
    (OpenCode Storage)                  (.flomaster/executions/)
         │                                      │
         ▼                                      │
    SessionPrompt.prompt()                      │
         │                                      │
         ▼                                      │
    LLM Provider                                │
         │                                      │
         ▼                                      │
    Response + Tool Calls                       │
         │                                      │
         ├──────────────────────────────────────┘
         ▼
    StateManager.recordStepResult()
    StateManager.saveCheckpoint()
```

### 8.3 Session Hierarchy Model

```
~/.opencode/storage/session/{projectId}/
├── {workflowSessionId}.json     # Parent workflow session
├── {step1SessionId}.json        # Child: research step
├── {step2SessionId}.json        # Child: plan step
└── {step3SessionId}.json        # Child: implement step

.flomaster/executions/{executionId}/
├── state.json                   # Which steps completed
├── context.json                 # Step outputs (for {{interpolation}})
├── mapping.json                 # stepId → sessionId
└── checkpoint.json              # Full state for crash recovery
```

### 8.4 Data Consistency Model

| Principle                     | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| **Files are source of truth** | All state can be reconstructed from files; caches are optional |
| **Write-through persistence** | State saved before proceeding to next step                     |
| **Atomic state transitions**  | Each step completes fully or not at all                        |
| **Session immutability**      | OpenCode sessions are append-only (messages never deleted)     |

**Consistency Guarantees**:

- StateManager writes checkpoint before marking step complete
- OpenCode's Storage uses file locking for concurrent access
- Crash recovery re-runs the last incomplete step (not skips it)

---

## 9. Deployment Architecture

### 9.1 Deployment Model

FloMaster is deployed as a **CLI tool** that extends OpenCode:

| Deployment Type | Description                               |
| --------------- | ----------------------------------------- |
| **CLI**         | `flomaster` command (renamed OpenCode)    |
| **TUI**         | OpenCode's terminal UI (sessions visible) |
| **Desktop**     | Future Electron app (planned)             |
| **Platforms**   | macOS, Linux (Windows future)             |

### 9.2 Environment Overview

| Environment | Purpose                      | Characteristics                    |
| ----------- | ---------------------------- | ---------------------------------- |
| Development | Individual development       | `bun dev` in packages/opencode     |
| Local       | User's machine (production)  | Standalone CLI, no server required |
| CI/CD       | Automated pipelines (future) | Headless mode, non-interactive     |

**Note**: FloMaster is local-first—there is no cloud/staging/production server. Each user runs FloMaster locally with their own API credentials.

### 9.3 Installation

```bash
# Development
cd packages/opencode
bun dev workflow run "prompt"

# Production (future)
npm install -g flomaster
flomaster workflow run "prompt"
```

### 9.4 Runtime Requirements

| Requirement          | Purpose                        |
| -------------------- | ------------------------------ |
| Bun / Node.js 18+    | Runtime environment            |
| Provider credentials | API access to LLM providers    |
| Network access       | Communication with providers   |
| Local file system    | State, sessions, configuration |

---

## 10. Architecture Decisions

### Key Decisions Made

| ADR     | Title                       | Status   | Summary                                                                          |
| ------- | --------------------------- | -------- | -------------------------------------------------------------------------------- |
| ADR-001 | Fork OpenCode vs SDK        | Accepted | Fork OpenCode for direct API access instead of using SDK with HTTP overhead      |
| ADR-002 | Self-Contained Module       | Accepted | All FloMaster code in `src/flomaster/` for clean upstream merges                 |
| ADR-003 | XState v5 for Orchestration | Accepted | XState v5 for workflow state management with persistence support                 |
| ADR-004 | Parent-Child Sessions       | Accepted | Each workflow step creates child session linked to workflow parent               |
| ADR-005 | Separate State Storage      | Accepted | FloMaster state in `.flomaster/` separate from OpenCode's `~/.opencode/storage/` |

### ADR-001: Fork OpenCode vs SDK

**Context**: FloMaster needs to execute AI agents. Two options:

1. Use OpenCode SDK (`@opencode-ai/sdk`) - makes HTTP calls to OpenCode server
2. Fork OpenCode and use direct imports

**Decision**: Fork OpenCode

**Rationale**:

- No HTTP overhead (SDK calls server via REST)
- Direct access to internal APIs (`Session`, `SessionPrompt`, `Agent`)
- Single process (not two separate processes)
- Shared infrastructure (one config, one TUI, one CLI)
- Access to Bus events, Storage, and other internals

**Consequences**:

- Must keep FloMaster self-contained for upstream merges
- Tied to OpenCode release cycle
- Can influence OpenCode development

### ADR-002: Self-Contained Module

**Context**: With forked OpenCode, FloMaster code could be spread throughout the codebase.

**Decision**: All FloMaster code lives in `src/flomaster/` with single integration point in `src/index.ts`.

**Rationale**:

- Clean upstream merges (OpenCode changes don't conflict)
- Clear boundaries (developers know where FloMaster code lives)
- Easy navigation (single directory)
- Could be extracted to separate package later

**Consequences**:

- Cannot modify OpenCode files directly
- Must work through OpenCode's public APIs
- Some duplication may occur

### ADR-003: XState v5 for Orchestration

**Context**: Workflow orchestration requires complex state management with persistence.

**Decision**: Use XState v5 for workflow state machine.

**Rationale**:

- Built-in persistence support
- Visual debugging tools
- Handles async actions well
- TypeScript-first design in v5

**Consequences**:

- v5 API differs significantly from v4 (uses `setup().createMachine()`)
- Learning curve for developers unfamiliar with XState
- Adds ~50KB to bundle

### ADR-004: Parent-Child Sessions

**Context**: Workflow steps need isolated context but should be visually grouped.

**Decision**: Workflow creates parent session; each step creates child session via `parentID`.

**Rationale**:

- Follows OpenCode's existing task.ts pattern
- Visual grouping in TUI sidebar
- Context isolation (each step has fresh context)
- Audit trail (all step conversations preserved)
- Future "chat with step" capability

**Consequences**:

- Sessions persist after workflow (by design)
- Storage grows with workflow history
- Parent-child queries needed for UI display

### ADR-005: Separate State Storage

**Context**: FloMaster needs to store workflow execution state.

**Decision**: Store in `.flomaster/executions/` at project root, separate from OpenCode's `~/.opencode/storage/`.

**Rationale**:

- Clear separation of concerns
- Workflow state is project-specific
- Easy to see/debug workflow state
- Can version control `.flomaster/` if desired

**Consequences**:

- Two storage locations to understand
- Must manage `.flomaster/` lifecycle separately
- gitignore considerations

**Note**: Detailed ADR documents may be created in `design/decisions/` for future significant decisions.

---

## 11. Open Questions & Risks

### 11.1 Open Questions

| Question ID | Question                                        | Owner | Target   |
| ----------- | ----------------------------------------------- | ----- | -------- |
| AQ-001      | How should workflow files be loaded/validated?  | TBD   | TASK-11  |
| AQ-002      | How to implement human approval gates?          | TBD   | TASK-12+ |
| AQ-003      | How to integrate task management (Jira/Linear)? | TBD   | TASK-13+ |

**Note on AQ-003**: Task management integration is planned via **MCP (Model Context Protocol) servers**. OpenCode supports MCP natively (`src/mcp/`), allowing external tools like Jira and Linear to be connected as MCP servers that agents can invoke. This approach avoids building custom integrations.

### 11.2 Technical Risks

| Risk ID | Risk                                   | Likelihood | Impact | Mitigation                             |
| ------- | -------------------------------------- | ---------- | ------ | -------------------------------------- |
| TR-001  | OpenCode upstream breaking changes     | Medium     | Medium | Self-contained module, careful merges  |
| TR-002  | Context size exceeds provider limits   | Medium     | High   | Truncation in context builder          |
| TR-003  | State corruption during crash          | Low        | High   | Atomic writes, checkpoint verification |
| TR-004  | Context accumulation in long workflows | Medium     | Medium | Fresh session per step (by design)     |
| TR-005  | Step recursion via task tool           | Low        | High   | Deny task permission on step sessions  |

### 11.3 Design Decisions (Resolved)

Key architectural decisions that have been resolved:

| Decision                                 | Resolution                                  |
| ---------------------------------------- | ------------------------------------------- |
| How to integrate with OpenCode sessions? | Parent-child model, follows task.ts pattern |
| Where to store workflow state?           | `.flomaster/executions/` at project root    |
| How to prevent task recursion?           | Deny `task` permission on step sessions     |
| How to handle provider selection?        | Use OpenCode's Provider.parseModel()        |

---

## 12. Glossary

| Term                   | Definition                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| **Workflow**           | Collection of steps linked by connections, executed based on dependencies                         |
| **Step**               | Atomic execution unit. Types: Agent, Conditional, Loop, SubFlow, Input, Output                    |
| **Connection**         | Link defining data flow and dependency between steps                                              |
| **Agent**              | OpenCode agent definition (prompt, permissions, model) used by Agent steps                        |
| **Session**            | OpenCode conversation container. Each step creates a child session                                |
| **Parent Session**     | Workflow-level session that groups all step sessions                                              |
| **Child Session**      | Step-level session linked to parent via `parentID`                                                |
| **SharedContext**      | Map of stepId → outputs for `{{interpolation}}`                                                   |
| **Checkpoint**         | Full execution state snapshot for crash recovery                                                  |
| **Context Rot**        | AI quality degradation from accumulated context; prevented by fresh sessions per step             |
| **Provider**           | LLM service (Anthropic, OpenAI, Google, etc.) managed by OpenCode                                 |
| **Executor**           | Pluggable step type implementation in the registry                                                |
| **XState**             | State machine library (v5) used for workflow orchestration. v5 API differs significantly from v4. |
| **Instance**           | OpenCode's per-directory application context (`Instance.provide()`)                               |
| **Bus**                | OpenCode's typed event pub-sub system (`Bus.publish()`, `Bus.subscribe()`)                        |
| **Permission Ruleset** | Array of allow/deny/ask rules controlling tool access                                             |
| **PermissionNext**     | Modern permission system in OpenCode with wildcard pattern matching                               |
| **Storage**            | OpenCode's key-value file storage system at `~/.opencode/storage/`                                |
| **SessionPrompt**      | OpenCode API for executing prompts in sessions with tool support                                  |
| **Identifier**         | OpenCode utility for generating unique sortable IDs (`Identifier.ascending()`)                    |
| **defer()**            | OpenCode utility creating a promise resolvable externally (for abort handling)                    |
| **MCP**                | Model Context Protocol - standard for connecting AI tools to external services                    |
| **AI SDK**             | Vercel's AI SDK (`@ai-sdk/*` packages) used by OpenCode for LLM provider integration              |
| **MessageV2**          | OpenCode's message format with parts (text, tool calls, patches, etc.)                            |
| **Part**               | Component of a message: TextPart, ToolPart, PatchPart, etc.                                       |
| **Server**             | OpenCode's Hono-based HTTP server (`src/server/`) exposing API for TUI/Desktop                    |
| **SSE**                | Server-Sent Events - real-time streaming protocol used by OpenCode's `/event` endpoints           |
| **Hono**               | Lightweight web framework used by OpenCode for HTTP server (similar to Express)                   |
| **LLM.stream()**       | Internal OpenCode function that streams LLM responses; used by SessionPrompt                      |

---

## Appendix A: Workflow JSON Format

Workflows use a React Flow-compatible JSON format:

```json
{
  "nodes": [
    {
      "id": "input-1",
      "type": "genericNode",
      "position": { "x": 0, "y": 0 },
      "data": {
        "id": "input-1",
        "node": {
          "displayName": "User Input",
          "baseClasses": ["Input"],
          "template": {
            "prompt": { "name": "prompt", "type": "str", "value": "" }
          },
          "outputs": [{ "name": "prompt", "types": ["string"] }]
        }
      }
    },
    {
      "id": "agent-1",
      "type": "genericNode",
      "position": { "x": 200, "y": 0 },
      "data": {
        "id": "agent-1",
        "node": {
          "displayName": "Research Step",
          "baseClasses": ["Agent"],
          "template": {
            "agentType": { "value": "research-agent" },
            "prompt": { "value": "{{input-1.prompt}}" }
          },
          "outputs": [{ "name": "response", "types": ["string"] }]
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "input-1",
      "target": "agent-1",
      "sourceHandle": "prompt",
      "targetHandle": "prompt"
    }
  ]
}
```

### A.1 Context Interpolation Syntax

The `{{stepId.outputKey}}` syntax references outputs from previous steps:

| Syntax                  | Resolves To                            |
| ----------------------- | -------------------------------------- |
| `{{input-1.prompt}}`    | Output "prompt" from step "input-1"    |
| `{{research.response}}` | Output "response" from step "research" |
| `{{plan.summary}}`      | Output "summary" from step "plan"      |

Interpolation happens at runtime in `contextInterpolator.ts` before each step executes.

**Limitation**: Only one level of nesting is supported:

- `{{step.output}}` → Works
- `{{step.output.nested}}` → Not supported

---

## Appendix B: Key File Reference

### FloMaster Core Files

| File                                                                      | Purpose                        |
| ------------------------------------------------------------------------- | ------------------------------ |
| `packages/flomaster/src/index.ts`                                         | Public exports                 |
| `packages/flomaster/src/cli/index.ts`                                     | CLI entry point                |
| `packages/flomaster/src/cli/workflow.ts`                                  | `flomaster workflow` command   |
| `packages/flomaster/src/orchestrator/engine/workflowEngine.ts`            | Main orchestration class       |
| `packages/flomaster/src/orchestrator/engine/factory.ts`                   | Engine + StateManager creation |
| `packages/flomaster/src/orchestrator/machine/workflowMachine.ts`          | XState v5 state machine        |
| `packages/flomaster/src/orchestrator/registry/executors/agentExecutor.ts` | Agent step execution           |
| `packages/flomaster/src/state/stateManager.ts`                            | Workflow state persistence     |
| `packages/flomaster/src/state/types.ts`                                   | State type definitions         |

### OpenCode Integration Points

FloMaster imports from the `opencode` package. These are the key integration points:

| File                                         | What FloMaster Uses                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `packages/opencode/src/session/index.ts`     | `Session.create()`, `Session.get()`, `Session.children()`                 |
| `packages/opencode/src/session/prompt.ts`    | `SessionPrompt.prompt()`, `SessionPrompt.cancel()`                        |
| `packages/opencode/src/session/llm.ts`       | `LLM.stream()` (used internally by SessionPrompt)                         |
| `packages/opencode/src/agent/agent.ts`       | `Agent.get()`, `Agent.list()`                                             |
| `packages/opencode/src/provider/provider.ts` | `Provider.parseModel()`, `Provider.getModel()`, `Provider.defaultModel()` |
| `packages/opencode/src/permission/next.ts`   | `PermissionNext.Ruleset`, `PermissionNext.merge()`                        |
| `packages/opencode/src/bus/index.ts`         | `Bus.publish()`, `Bus.subscribe()`                                        |
| `packages/opencode/src/bus/bus-event.ts`     | `BusEvent.define()` for typed events                                      |
| `packages/opencode/src/server/server.ts`     | SSE endpoints for real-time UI (future)                                   |
| `packages/opencode/src/util/defer.ts`        | `defer()` for abort handling cleanup                                      |
| `packages/opencode/src/id/id.ts`             | `Identifier.ascending()` for unique IDs                                   |
| `packages/opencode/src/config/config.ts`     | `Config.get()`, `Config.directories()`                                    |
| `src/project/instance.ts`                    | `Instance.provide()`, `Instance.state()`, `Instance.directory`            |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2026-01-05 | Architecture Team | Initial version |
