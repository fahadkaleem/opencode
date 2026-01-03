# Integration Architecture - Session Notes

> **Session Date**: 2025-11-27
> **Purpose**: Document all discussions, decisions, Q&A, and reasoning for Stage 3c Integration Architecture

---

## 1. Session Overview

This session covered Stage 3c: Integration Architecture. We:

1. Discussed how to derive component interactions from Stage 3b requirements
2. Researched Gemini CLI and Codemachine architectures for patterns
3. Made design decisions through Q&A
4. Created the Integration Overview document
5. Added Gateway component (COMP-012) to the architecture

---

## 2. Research: Gemini CLI Architecture

### 2.1 Overall Architecture

Gemini uses a two-package structure:

- `packages/cli` - UI layer (React/Ink components, hooks, contexts)
- `packages/core` - Business logic (GeminiClient, tools, services)

**Key Insight**: CLI depends on Core, but Core has no dependency on CLI. This enables reusability.

### 2.2 Configuration Access Pattern

**Finding**: Gemini uses **Dependency Injection**, NOT global singletons.

- Single Config instance created at startup
- Passed through constructors to all components
- Components call getter methods: `this.config.getModel()`, `this.config.getExcludeTools()`
- No `Config.getInstance()` static method

**Decision for FlowMaster**: Follow the same DI pattern for Configuration Manager.

### 2.3 Component Communication

Gemini uses multiple patterns:

| Pattern              | Purpose                               | Implementation                     |
| -------------------- | ------------------------------------- | ---------------------------------- |
| **MessageBus**       | Request-response with correlation IDs | Tool confirmations, hook execution |
| **CoreEventEmitter** | One-way broadcasts                    | UI updates, status changes         |
| **Direct calls**     | Synchronous operations                | Config access, service calls       |

**Key Features**:

- Correlation IDs for matching requests to responses
- Event backlog pattern - buffers events if no subscribers, drains when UI ready
- Type-safe message types with discriminated unions

**Decision for FlowMaster**: Message Manager should support both pub-sub AND request-response with correlation IDs.

### 2.4 Telemetry Pattern

**Finding**: Gemini uses **direct function calls** for telemetry, NOT events.

```typescript
// Components call directly:
logApiRequest(config, event);
logToolCall(config, event);
logPhaseComplete(config, event);
```

**Reasoning**: Explicit about what's tracked, no risk of lost events, type-safe.

**Decision for FlowMaster**: Telemetry via direct calls, not event subscription.

### 2.5 UI Layer Patterns

- React Context API for state management (NOT Redux)
- Event-driven updates from CoreEventEmitter
- Message batching with 16ms timeout via `useTransition()`
- Multiple contexts: UIState, Settings, Session, Keypress, VimMode, etc.

### 2.6 Tool Execution

- ToolRegistry for central tool management
- Validation-separated pattern: `build()` validates, `execute()` runs
- CoreToolScheduler state machine: validating → scheduled → executing → success/error
- Tools can be wrapped as subagents (SubagentToolWrapper)

### 2.7 State Management

- Distributed state (hooks + services), NOT centralized
- JSON files per session in `~/.gemini/tmp/<project_hash>/chats/`
- Continuous persistence after every message
- Session resumption via explicit `--resume` flag

---

## 3. Research: Codemachine Architecture

### 3.1 Agent Communication Pattern

**Finding**: Codemachine uses **output-based communication**, NOT direct inter-agent queries.

- Parent-child tracking via environment variable: `CODEMACHINE_PARENT_AGENT_ID`
- Agents communicate through file artifacts
- No real-time two-way agent communication

### 3.2 Clarification Handling

**Finding**: Codemachine uses **non-interactive checkpoints**, NOT tool-based questions.

- Agent produces a "Review Document" with ambiguities
- User reads review, updates original spec file
- Workflow restarts after clarification

**Comparison**:
| Approach | Codemachine | Tool-based |
|----------|-------------|------------|
| User experience | Batch - read doc, update, restart | Real-time - answer in UI |
| Complexity | Simpler - just file I/O | More complex - tool injection |
| Seamlessness | Manual restart needed | Automatic resume |

### 3.3 Coordinator Pattern

- Coordinator service manages parent context detection
- Coordination parser for DSL: `&&` (sequential), `&` (parallel)
- Tail-limited output for status summaries: `agent[tail:3]`

---

## 4. Q&A: Design Decisions

### 4.1 Workflow Execution Flow

**Q: When a user types a command to run a workflow, what should happen FIRST?**
**A**: Validate workflow exists (if CLI), then load the YAML/config that defines steps.

**Mapping**: User Interface validates → Configuration Manager loads workflow.

---

**Q: Once the workflow is loaded, what needs to happen before the first step can run?**
**A**: All of the above - check if task cached locally, fetch from Jira/Linear if needed, build initial context.

**Mapping**: Task Manager → State Manager → Context Manager

---

**Q: When it's time to run a phase, WHO decides to start it and WHO actually does the work?**
**A**: Orchestrator decides (orchestrates), Agent Manager executes.

**Reasoning**: Orchestrator = conductor (decides WHAT/WHEN), Agent Manager = stage manager (handles HOW), LLM Manager = performer (does the work).

---

**Q: WHO asks Context Manager to build the context - Orchestrator or Agent Manager?**
**A**: Agent Manager asks Context Manager.

**Reasoning**: Orchestrator stays simple (what phase is next?), Agent Manager handles everything needed to run agents.

---

### 4.2 Validation

**Q: When the LLM finishes and returns output, should it be validated before the phase is marked complete?**
**A**: Validation is configurable in workflow YAML. By default each phase is validated. Users can configure:

- Which phases to validate
- How to validate each phase
- Retry behavior if validation fails
- Severity levels (major failure = retry phase, minor = small fix)

---

**Q: WHO invokes the Validation Manager - Orchestrator or Agent Manager?**
**A**: Orchestrator invokes.

**Reasoning**: Validation is a flow decision, Orchestrator controls flow.

---

### 4.3 Events and Communication

**Q: When components emit events to Message Manager, is it fire-and-forget or do they wait for acknowledgment?**
**A**: Fire-and-forget for events. Direct calls for critical operations (like Telemetry, State Manager).

---

### 4.4 UI Interaction

**Q: Does User Interface ever call components directly, or only through Orchestrator?**
**A**: Initially said "Only through Orchestrator", but reconsidered for settings, task details, workflow editing.

**Final Decision**: Add a Gateway component that routes all UI requests.

---

**Q: Which approach for UI routing?**
**A**: Add Gateway component - the right pattern for clean architecture.

**Reasoning**: BFF (Backend for Frontend) pattern provides:

- Unified API surface
- Consistent cross-cutting concerns
- Simplified frontend logic
- Clear ownership boundaries

---

### 4.5 State Management

**Q: When should state be saved (for crash recovery)?**
**A**: Each command level. Phases are groups of commands. Each command has state stored with session ID.

**Reasoning**: Session ID allows resuming mid-command. Granular tracking means all phases and workflows are recorded.

---

**Q: WHO tells State Manager to save - Orchestrator or Agent Manager?**
**A**: Agent Manager knows when command finishes, so Agent Manager should save.

**Pattern**: Agent Manager does BOTH:

1. Calls State Manager directly (critical path)
2. Emits event (for UI, Telemetry)

---

**Q: If the entire FlowMaster process crashes, how does the user resume?**
**A**: User runs explicit resume command.

---

### 4.6 Error Handling

**Q: When an error happens deep in the stack, how does it propagate?**
**A**: Two types of failures:

- **Code errors** (exceptions): Traditional throw/catch
- **Agent failures** (structured result): Agent returns `{success: false, reason: ...}`

**Key Insight**: An agent completing without doing the task isn't an "exception" - it's a result that needs interpretation.

---

**Q: Who decides if an agent's output means 'success' or 'failure'?**
**A**: Agent Manager interprets the output.

---

### 4.7 Telemetry

**Q: How does Telemetry get the data it needs?**
**A**: Direct calls like Gemini. Components call `telemetry.log*()` functions directly.

---

### 4.8 Configuration

**Q: Does Configuration Manager load config once at startup, or can it reload during execution?**
**A**: Load once at startup. Changes require restart.

---

**Q: Who manages LLM session IDs?**
**A**: LLM Manager encapsulates session management, returns session ID with response.

---

**Q: When LLM Manager needs tool restrictions, where does it get them from?**
**A**: Configuration Manager owns tool configuration. Settings flow through: Orchestrator → Agent Manager → LLM Manager.

**Refined**: Config passed via DI, components access directly on received Config instance.

---

### 4.9 Parallel Execution

**Q: When a phase has parallel commands, who manages the parallelism?**
**A**: Orchestrator spawns multiple agents via Agent Manager, waits for all to complete.

---

**Q: If one parallel command fails but others succeed, what should happen?**
**A**: Configurable per-workflow. Parent agent can see what failed and take steps needed.

---

### 4.10 Provider Fallback

**Q: When an LLM provider fails, who handles the fallback?**
**A**: LLM Manager handles automatically. Transparent to Agent Manager.

---

### 4.11 Clarification Flow

**Q: When a command-level agent has a question, what should happen FIRST?**
**A**: Ask parent agent (phase level). Route up hierarchy, only reach user if no parent can answer.

---

**Q: If the parent agent doesn't know, what happens next?**
**A**: Keep going up: Command → Phase → Workflow → User. Workflow agents can choose to ask user directly OR escalate to parent workflow (via `uses:` composition).

---

**Q: When an agent is waiting for clarification, what state is it in?**
**A**: Agent doesn't poll. It stops execution and waits. Agent Manager owns lifecycle and handles pause/resume.

---

**Q: How does the child agent signal it has a question?**
**A**: Open question - need to explore more. Options:

- Tool call (agent calls `ask_parent()` tool)
- JSON output with type
- Keyword in output

**Tool approach seems cleaner**: From agent's view, it's just a function call that returns. No parsing, no resume logic needed.

**Status**: OPEN - deferred for later exploration.

---

## 5. Key Integration Patterns Established

### 5.1 Dependency Injection for Configuration

```
Config instance created at startup
        ↓
Passed through constructors to components
        ↓
Components call getter methods on received Config
        ↓
No global/static access
```

### 5.2 Event Backlog for Startup Race Conditions

```
1. Component emits event during startup
2. Message Manager checks if subscribers exist
3. If no subscribers: buffer in backlog
4. When UI subscribes: drain backlog
```

### 5.3 Validation Before Agent Spawn

```
1. Orchestrator requests agent spawn
2. Agent Manager validates (command exists, context available, parent valid)
3. If valid: create agent
4. If invalid: return error immediately
```

### 5.4 Structured Results for Agent Failures

| Type           | Example         | Handling                        |
| -------------- | --------------- | ------------------------------- |
| Code errors    | Network timeout | throw/catch                     |
| Agent failures | Incomplete task | `{success: false, reason: ...}` |

### 5.5 Communication Patterns

| Pattern          | Use Case              | Example                 |
| ---------------- | --------------------- | ----------------------- |
| Direct call      | Synchronous, critical | State save, LLM execute |
| Pub-sub          | Fire-and-forget       | UI updates              |
| Request-response | Needs answer          | Clarification           |

---

## 6. New Component: Gateway (COMP-012)

### 6.1 Definition

| Attribute | Value              |
| --------- | ------------------ |
| **ID**    | COMP-012           |
| **Name**  | Gateway            |
| **Type**  | Presentation       |
| **Layer** | Presentation Layer |

### 6.2 Responsibility

- Routes all UI requests to appropriate components
- Provides unified API surface for User Interface
- Handles request validation before routing
- Abstracts component topology from UI layer
- Enables consistent cross-cutting concerns (logging, auth)

### 6.3 Dependencies

| Depends On                     | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| COMP-010 Orchestrator          | Execution operations (start, pause, cancel) |
| COMP-007 Task Manager          | Task operations (get, search, update)       |
| COMP-002 Configuration Manager | Settings operations                         |

### 6.4 Rationale

BFF (Backend for Frontend) pattern:

- Simplified frontend logic
- Consistent cross-cutting concerns
- Clear ownership boundaries
- Testable and maintainable

---

## 7. Final Component List (12 Components)

| ID       | Component             | Type                 | Layer          |
| -------- | --------------------- | -------------------- | -------------- |
| COMP-001 | Message Manager       | Infrastructure       | Infrastructure |
| COMP-002 | Configuration Manager | Infrastructure       | Infrastructure |
| COMP-003 | State Manager         | Support Service      | Support        |
| COMP-004 | Telemetry             | Cross-Cutting        | Support        |
| COMP-005 | LLM Manager           | Provider Abstraction | Support        |
| COMP-006 | Context Manager       | Support Service      | Support        |
| COMP-007 | Task Manager          | Core Service         | Orchestration  |
| COMP-008 | Validation Manager    | Support Service      | Support        |
| COMP-009 | Agent Manager         | Core Engine          | Orchestration  |
| COMP-010 | Orchestrator          | Core Engine          | Orchestration  |
| COMP-011 | User Interface        | Presentation         | Presentation   |
| COMP-012 | Gateway               | Presentation         | Presentation   |

---

## 8. Key Interaction Flows

### 8.1 Execute Workflow

```
User → UI → Gateway → Orchestrator
                         ↓
              Config Manager (load workflow)
                         ↓
              Task Manager (get task)
                         ↓
              For each phase:
                Agent Manager (spawn agent)
                    ↓
                Context Manager (build context)
                    ↓
                LLM Manager (execute prompt)
                    ↓
                Agent Manager (return result)
                    ↓
                Validation Manager (validate)
                    ↓
                State Manager (persist)
```

### 8.2 Clarification (Hierarchical)

```
Command Agent → Agent Manager → Phase Agent
                                   ↓
                            (if knows) → Answer → Command resumes
                                   ↓
                            (if not) → Workflow Agent
                                          ↓
                                    (if knows) → Answer → Command resumes
                                          ↓
                                    (if not) → User → Answer → Command resumes
```

### 8.3 Provider Fallback

```
Agent Manager → LLM Manager → Primary Provider
                                  ↓ (failure)
                              LLM Manager (check config)
                                  ↓
                              Backup Provider
                                  ↓ (success)
                              Agent Manager
```

---

## 9. Open Questions

| ID     | Question                                                                 | Status |
| ------ | ------------------------------------------------------------------------ | ------ |
| IQ-001 | Exact protocol for clarification request-response messages               | Open   |
| IQ-002 | Event backlog size limit and overflow handling                           | Open   |
| IQ-003 | Gateway authentication for web UI mode                                   | Open   |
| IQ-004 | How does child agent signal it has a question (tool vs JSON vs keyword)? | Open   |

---

## 10. Documents Created/Updated

### 10.1 Created

- `design/flowmaster/03-architecture/integration/overview.md` - Integration Architecture Overview

### 10.2 Updated

- `design/flowmaster/03-architecture/00-architecture.md`:
  - Added COMP-012 Gateway component
  - Updated component reading order
  - Updated component diagram
  - Updated communication patterns table
  - Updated all flow diagrams to route through Gateway
  - Updated Appendix A
  - Added version 3.1 to document history

---

## 11. Next Steps (Stage 3c Completion)

| Artifact                             | Status  |
| ------------------------------------ | ------- |
| Integration Overview                 | ✅ Done |
| Interface Contracts (per component)  | Pending |
| Shared Schemas                       | Pending |
| Message Catalog                      | Pending |
| Gateway Requirements (12-gateway.md) | Pending |

---

## 12. Key Learnings Summary

1. **DI over Singletons**: Pass config through constructors, not global access
2. **Event Backlog**: Buffer events until subscribers ready
3. **Dual Communication**: Pub-sub for broadcasts, request-response for questions
4. **Direct Telemetry**: Call log functions directly, don't rely on events
5. **Validation Separation**: Validate before expensive operations
6. **Structured Failures**: Distinguish code errors from agent failures
7. **Gateway Pattern**: Single entry point for UI requests
8. **Hierarchical Clarification**: Route questions up agent tree before reaching user
