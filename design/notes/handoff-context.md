# FlowMaster - Agent Handoff Context

> **Purpose**: This document provides context for a new Claude Code instance to continue work on FlowMaster documentation. Read this fully before starting any work.
> **Last Updated**: 2025-12-03
> **Current Stage**: Architecture Redesign (Gemini-Based)
> **Immediate Task**: Update Stage 3c Integration documents

---

## 1. What is FlowMaster?

FlowMaster is an **AI-powered developer workflow orchestration system** being designed as part of the Alfred CLI project. It orchestrates multi-step development tasks through a three-level hierarchy: workflows, phases, and commands, with agents at each level.

**Key Characteristics**:

- Workflows contain phases, phases contain commands
- Workflows can compose other workflows via `uses:` references (like GitHub Actions)
- Each level (workflow, phase, command) has an agent associated with it
- Agents can ask questions that route up the hierarchy before reaching the user
- Multiple LLM providers supported (Claude, Gemini, OpenAI) via Vercel AI SDK
- Local-first, file-based state persistence
- Two-phase execution pattern for guaranteed structured output

**Core Insight**:

```
FlowMaster = Gemini CLI Core
           + Orchestration (workflows, phases, state machines)
           + Agent Hierarchy (clarification routing)
           + State Persistence (crash recovery)
           + Structured Output (two-phase with Vercel AI SDK)
           + Multi-Provider (not just Gemini)
           + Web UI
```

---

## 2. CRITICAL: Recent Architecture Redesign

### 2.1 What Changed (2025-12-03)

We made a **major architectural pivot** to model FlowMaster after **Gemini CLI's architecture**. This was driven by:

1. **SDK Migration Decision**: Moving from CLI subprocess to Vercel AI SDK
2. **Gemini CLI Study**: Deep analysis revealed their patterns are battle-tested and applicable
3. **Component Consolidation**: Simplified from 12 to 10 components

### 2.2 The SDK Migration

**Problem with CLI Subprocess (Old Approach)**:

- No structured output guarantee - CLI outputs free-form text
- No tool control - tools execute inside CLI, can't intercept/approve
- Retry loses context - must restart from scratch

**Solution: Vercel AI SDK + Two-Phase Execution**:

```typescript
// Phase 1: Agentic work with tools
const result = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  tools: { readFile, writeFile, shell, ... },
  maxSteps: 50,
  prompt: context,
});

// Phase 2: Guaranteed structured output
const structured = await generateObject({
  model: anthropic('claude-sonnet-4-20250514'),
  schema: outputSchema,  // Zod schema
  messages: reduceConversation(result.messages),
});
```

### 2.3 Component Consolidation (12 → 10)

| Old Component                 | New Status                                             |
| ----------------------------- | ------------------------------------------------------ |
| LLM Manager (COMP-005)        | **MERGED** into Agent Manager → AgentExecutor          |
| Validation Manager (COMP-008) | **ELIMINATED** → distributed to Orchestrator utilities |
| All others                    | **RENAMED** to directory/class naming convention       |

### 2.4 New Component Structure

```
packages/
├── core/src/
│   ├── message-bus/      → Message Manager (MessageBus)
│   ├── config/           → Configuration Manager (Config)
│   ├── state/            → State Manager (StateStore)
│   ├── telemetry/        → Telemetry (Telemetry)
│   ├── context/          → Context Manager (ContextBuilder)
│   ├── tasks/            → Task Manager (TaskClient)
│   ├── agents/           → Agent Manager (AgentExecutor) ← UNIFIED
│   ├── tools/            → Agent Manager (part of AgentExecutor)
│   └── orchestrator/     → Orchestrator (WorkflowEngine)
├── cli/                  → User Interface
└── web/
    ├── ui/               → User Interface
    └── src/gateway/      → Gateway
```

---

## 3. Current Status

### 3.1 Documentation Stage Summary

| Stage                      | Question                   | Status              | Notes                            |
| -------------------------- | -------------------------- | ------------------- | -------------------------------- |
| 1. Overview                | WHY build this?            | ✅ Complete         | `design/flowmaster/01-overview/` |
| 2. High-Level Requirements | WHAT capabilities?         | ✅ Complete         | 50+ HL requirements, 26 NFRs     |
| 3. Architecture            | WHAT components?           | ✅ **UPDATED**      | Rewritten for 10 components      |
| 3b. Component Requirements | WHAT must each do?         | ✅ **UPDATED**      | Restructured 12 → 10 files       |
| 3c. Integration            | HOW do components connect? | 🔴 **NEEDS UPDATE** | Contracts/schemas need update    |
| 4. Detailed Design         | HOW internally?            | ⏸️ On Hold          | Waiting for 3c completion        |

### 3.2 What's Been Done

1. ✅ **Gemini Architecture Study** - `00-notes/gemini-architecture-reference.md`
2. ✅ **SDK Migration Decision** - `00-notes/sdk-migration.md`
3. ✅ **Architecture Document Rewrite** - `03-architecture/00-architecture.md` (v4.0)
4. ✅ **Stage 3b Requirements Restructure** - 10 files in `03-architecture/requirements/`

### 3.3 What Needs to Be Done

**Immediate (Stage 3c Updates)**:

1. 🔴 Update `integration/overview.md` - Dependency matrix (12×12 → 10×10)
2. 🔴 Update `integration/contracts/` - 12 files → 10 files
3. 🔴 Update `integration/schemas/` - Check for stale references
4. 🔴 Update `integration/messages/catalog.md` - Update publisher/subscriber names

**Then (Stage 4)**:

- Continue detailed design with new component structure
- Some existing Stage 4 docs may need revision

---

## 4. The 10 Components

### Component Catalog

| Directory            | Class          | Responsibility                                                           |
| -------------------- | -------------- | ------------------------------------------------------------------------ |
| `message-bus/`       | MessageBus     | Pub-sub events, request-response with correlation IDs                    |
| `config/`            | Config         | Workflow definitions, defaults, templates                                |
| `state/`             | StateStore     | Persistence, crash recovery, artifacts                                   |
| `telemetry/`         | Telemetry      | Tracing, logging, metrics (direct calls)                                 |
| `context/`           | ContextBuilder | Build and provide context to agents                                      |
| `tasks/`             | TaskClient     | External task systems (Jira, Linear)                                     |
| `agents/` + `tools/` | AgentExecutor  | **Unified**: Agent lifecycle, LLM calls, tools, hierarchy, clarification |
| `orchestrator/`      | WorkflowEngine | Flow control, state machines, validation utilities                       |
| `cli/` + `web/ui/`   | (components)   | CLI and Web user interfaces                                              |
| `web/src/gateway/`   | Gateway        | BFF pattern, unified API surface for UI                                  |

### Layer Organization

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ User         │  │ Gateway      │                            │
│  │ Interface    │──│ (BFF)        │                            │
│  └──────────────┘  └──────────────┘                            │
├─────────────────────────────────────────────────────────────────┤
│                     ORCHESTRATION LAYER                         │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Orchestrator                            │ │
│  │  (WorkflowEngine + validation utilities)                   │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                   Agent Manager                            │ │
│  │  (AgentExecutor: agents + LLM + tools + hierarchy)        │ │
│  └───────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                       SUPPORT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Context      │  │ State        │  │ Task Manager         │ │
│  │ Manager      │  │ Manager      │  │ (TaskClient)         │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐                                              │
│  │ Telemetry    │                                              │
│  └──────────────┘                                              │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                         │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐│
│  │ Message      │  │ Configuration Manager                    ││
│  │ Manager      │  │ (Config)                                 ││
│  └──────────────┘  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Key Patterns Adopted from Gemini CLI

### 5.1 Unified AgentExecutor Pattern

**This is the most important pattern.** Agent Manager owns everything about agent execution:

```typescript
class AgentExecutor<TOutput> {
  // OWNS EVERYTHING
  private toolRegistry: ToolRegistry; // Tools are internal
  private llmClient: LLMClient; // LLM client is internal (Vercel AI SDK)

  // Lifecycle
  static async create(definition, config): Promise<AgentExecutor>;
  async run(inputs, signal): Promise<OutputObject>;
}
```

**Key Responsibilities**:

1. Tool isolation - Each agent gets isolated ToolRegistry copy
2. LLM calls - Uses Vercel AI SDK (generateText, generateObject)
3. Two-phase execution - Agentic work → structured extraction
4. Hierarchy management - Parent-child agent relationships
5. Clarification routing - Route questions up before asking user

### 5.2 DeclarativeTool Pattern

Tools use **validation/execution separation**:

```typescript
interface ToolBuilder<TParams, TResult> {
  name: string;
  schema: FunctionDeclaration; // For LLM
  build(params: TParams): ToolInvocation<TParams, TResult>;
}

interface ToolInvocation<TParams, TResult> {
  params: TParams; // Validated parameters
  shouldConfirmExecute(): Promise<boolean>; // Approval check
  execute(signal): Promise<TResult>; // Actual execution
}
```

### 5.3 MessageBus Pattern

Pub-sub + request-response with correlation IDs:

```typescript
class MessageBus {
  // Pub-sub
  publish(message: Message): void;
  subscribe(type, listener): SubscriptionId;

  // Request-response
  async request<TReq, TRes>(request, responseType, timeout): Promise<TRes>;
}
```

### 5.4 Direct Telemetry Calls

**NOT event-driven** - telemetry uses direct function calls:

```typescript
telemetry.logApiRequest(provider, model, tokens);
telemetry.logToolCall(toolName, params, result);
telemetry.logAgentComplete(agentId, duration, success);
```

---

## 6. Key Architectural Decisions

### Recent Decisions (2025-12-03)

| Decision            | Choice                    | Rationale                                        |
| ------------------- | ------------------------- | ------------------------------------------------ |
| LLM Integration     | Vercel AI SDK             | Multi-provider, streaming, tool support built-in |
| Agent + LLM + Tools | Unified in AgentExecutor  | Following Gemini pattern, simpler architecture   |
| Validation          | Utilities in Orchestrator | Not complex enough for separate component        |
| Structured Output   | Two-phase execution       | generateText → generateObject guarantees schema  |
| Tool Execution      | Inside AgentExecutor      | Tightly coupled with LLM calls                   |

### Preserved Decisions (from earlier sessions)

| Decision              | Choice                                                    | Rationale                           |
| --------------------- | --------------------------------------------------------- | ----------------------------------- |
| Configuration Access  | Dependency Injection                                      | Testability, no hidden dependencies |
| Telemetry             | Direct function calls                                     | Explicit tracking, type-safe        |
| UI Requests           | All through Gateway                                       | BFF pattern, unified API surface    |
| Clarification Routing | Hierarchical (child → parent → user)                      | Reduce user interruption            |
| State Persistence     | After each command                                        | Granular recovery                   |
| Error Handling        | Code errors (throw) vs Agent failures (structured result) | Different handling needs            |
| No Event Backlog      | State Manager hydration                                   | Simpler design                      |
| Context Format        | XML tags                                                  | Clear boundaries for AI             |

---

## 7. Reference Documents

### Critical Reference Documents

| Document                                    | Purpose                                      | Read When                            |
| ------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| `00-notes/gemini-architecture-reference.md` | Gemini CLI patterns we're adopting           | Understanding architecture decisions |
| `00-notes/sdk-migration.md`                 | SDK migration decision and two-phase pattern | Understanding execution model        |
| `03-architecture/00-architecture.md`        | Current 10-component architecture            | Need component details               |
| `03-architecture/requirements/*.md`         | Functional requirements per component        | Working on specific component        |

### Document Structure

```
design/flowmaster/
├── 00-notes/
│   ├── handoff-context.md                 # THIS FILE
│   ├── gemini-architecture-reference.md   # Gemini patterns reference
│   └── sdk-migration.md                   # SDK migration decision
├── 01-overview/                           # Stage 1 (complete)
├── 02-high-level-requirements/            # Stage 2 (complete)
├── 03-architecture/
│   ├── 00-architecture.md                 # Stage 3 (v4.0 - updated)
│   ├── decisions/                         # ADRs
│   ├── requirements/                      # Stage 3b (10 files - updated)
│   │   ├── 01-message-bus.md
│   │   ├── 02-config.md
│   │   ├── 03-state.md
│   │   ├── 04-telemetry.md
│   │   ├── 05-context.md
│   │   ├── 06-tasks.md
│   │   ├── 07-agents.md                   # UNIFIED (agents + LLM + tools)
│   │   ├── 08-orchestrator.md
│   │   ├── 09-user-interface.md
│   │   └── 10-gateway.md
│   └── integration/                       # Stage 3c (NEEDS UPDATE)
│       ├── overview.md
│       ├── contracts/
│       ├── schemas/
│       └── messages/
├── 04-detailed-design/                    # Stage 4 (on hold)
└── 99-standards/                          # Coding standards
```

---

## 8. How to Continue Work

### If Continuing Stage 3c (Integration Updates)

1. **Update `integration/overview.md`**:
   - Change dependency matrix from 12×12 to 10×10
   - Update communication patterns
   - Update data flow diagrams
   - Remove LLM Manager and Validation Manager references

2. **Update contracts (12 → 10 files)**:
   - DELETE: `llm-manager.md` (merged into agents)
   - DELETE: `validation-manager.md` (eliminated)
   - EXPAND: `agent-manager.md` → `agents.md` (cover unified AgentExecutor)
   - RENAME: All others to match new naming convention

3. **Update schemas**:
   - Check for references to deleted components
   - Update component names

4. **Update message catalog**:
   - Update publisher/subscriber columns
   - Remove references to deleted components

### If Continuing Stage 4 (Detailed Design)

**Wait until Stage 3c is complete**, then:

1. Follow build order (infrastructure → support → orchestration → presentation)
2. Use `04-detailed-design/01-message-manager.md` as reference
3. Reference Gemini patterns from `00-notes/gemini-architecture-reference.md`

---

## 9. Open Questions

| ID     | Question                                                      | Status |
| ------ | ------------------------------------------------------------- | ------ |
| IQ-001 | Exact protocol for clarification request-response messages    | Open   |
| IQ-003 | Gateway authentication for web UI mode                        | Open   |
| IQ-004 | How does child agent signal it has a question (tool vs JSON)? | Open   |

---

## 10. Terminology

| Term                | Meaning                                                  |
| ------------------- | -------------------------------------------------------- |
| Workflow            | Top-level execution unit containing phases               |
| Phase               | A step in a workflow (sequential or parallel block)      |
| Command             | A single unit of work executed by an agent               |
| Agent               | Running instance executing a task via LLM                |
| AgentExecutor       | Unified component managing agent lifecycle, LLM, tools   |
| Two-Phase Execution | generateText (work) → generateObject (structured output) |
| HL Requirement      | High-level capability (HL-xxx format)                    |
| FR                  | Functional Requirement (FR-xxx format)                   |

---

## 11. What NOT to Do

1. **Don't use old component names** - Use new directory/class naming
2. **Don't reference LLM Manager or Validation Manager** - They no longer exist
3. **Don't skip Stage 3c** - Integration docs must be updated before Stage 4
4. **Don't read all documents upfront** - Only read what's needed
5. **Don't make decisions unilaterally** - Propose options, let user decide

---

## Document History

| Date       | Author        | Changes                                                                                                                                       |
| ---------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-11-27 | Claude + User | Initial handoff document                                                                                                                      |
| 2025-11-29 | Claude + User | Stage 3c complete                                                                                                                             |
| 2025-12-01 | Claude + User | Stage 4 started, Message Manager complete                                                                                                     |
| 2025-12-03 | Claude + User | **MAJOR REWRITE**: Gemini-based architecture redesign, SDK migration decision, 12→10 components, Stage 3b restructured, Stage 3c needs update |
