# FlowMaster SDK-Based Agent Architecture Redesign

> **Document Version**: 2.0
> **Date**: 2025-12-02
> **Status**: Approved - Ready for Implementation
> **Author**: Architecture Team
> **Purpose**: Comprehensive redesign plan to align FlowMaster with Gemini CLI architecture patterns while using Vercel AI SDK

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Decision Timeline: How We Got Here](#2-decision-timeline-how-we-got-here)
3. [The Problem: Why CLI Subprocess Doesn't Work](#3-the-problem-why-cli-subprocess-doesnt-work)
4. [Research: What We Learned](#4-research-what-we-learned)
5. [The Solution: Vercel AI SDK + Two-Phase Execution](#5-the-solution-vercel-ai-sdk--two-phase-execution)
6. [The Insight: FlowMaster = Gemini + Orchestration](#6-the-insight-flowmaster--gemini--orchestration)
7. [Gemini Architecture Deep Study](#7-gemini-architecture-deep-study)
8. [New Component Architecture](#8-new-component-architecture)
9. [FR Remapping Strategy](#9-fr-remapping-strategy)
10. [Tool Implementation](#10-tool-implementation)
11. [Session Management](#11-session-management)
12. [UI Experience Improvements](#12-ui-experience-improvements)
13. [What Changes from Original Design](#13-what-changes-from-original-design)
14. [Redesign Phases](#14-redesign-phases)
15. [Implementation Details](#15-implementation-details)
16. [Open Questions](#16-open-questions)
17. [Success Criteria](#17-success-criteria)
18. [Next Steps](#18-next-steps)

---

## 1. Executive Summary

### 1.1 The Decision

We are fundamentally redesigning FlowMaster's architecture based on two key decisions:

1. **Use Vercel AI SDK instead of CLI subprocess** - Enables structured output, tool control, and multi-provider support
2. **Model architecture after Gemini CLI** - Proven patterns, unified agent/LLM/tools component

### 1.2 Why This Change

| Problem                                            | Solution                                                        |
| -------------------------------------------------- | --------------------------------------------------------------- |
| CLI subprocess can't guarantee structured output   | Vercel AI SDK's `generateObject()` guarantees schema compliance |
| CLI tools are opaque (can't intercept)             | SDK tools give us full control                                  |
| Original design had 12 components, over-engineered | Gemini-inspired design has 10 components                        |
| Agent/LLM/Tools artificially separated             | Unified "Agent Runtime" like Gemini's AgentExecutor             |

### 1.3 High-Level Impact

| Aspect               | Before                      | After                        |
| -------------------- | --------------------------- | ---------------------------- |
| Components           | 12                          | 10                           |
| Agent/LLM/Tools      | 3 separate components       | 1 unified "Agent Runtime"    |
| Validation           | Separate component (18 FRs) | Utilities + validation agent |
| LLM Integration      | CLI subprocess              | Vercel AI SDK                |
| Architecture pattern | Original design             | Gemini-inspired              |
| Structured output    | Hope and pray               | Guaranteed via schema        |

### 1.4 The Core Insight

```
FlowMaster = Gemini CLI
           + Orchestration (workflows, phases, state machines)
           + Agent Hierarchy (clarification routing)
           + State Persistence (crash recovery)
           + Structured Output (two-phase pattern)
           + Multi-Provider (Vercel AI SDK)
           + Web UI
```

We're not reinventing the wheel. We're extending a proven pattern.

---

## 2. Decision Timeline: How We Got Here

This section captures the complete thought process and discussions that led to this architecture redesign. This is important context for team members who weren't part of the original discussions.

### 2.1 Starting Point: Stage 3 Architecture Design

**Date**: 2025-12-02
**Context**: We had completed Stage 1 (Overview) and Stage 2 (High-Level Requirements) with 50 HL requirements. We were beginning Stage 3 (Architecture) to define components.

**Initial Approach**: We started by grouping HL requirements into logical components based on responsibilities. Initial proposal had 11 components:

- Orchestration Engine
- Agent Runtime
- Provider Abstraction
- Context Manager
- Validation Engine
- State & Recovery
- Event Bus
- Config
- Telemetry
- Interface
- Integrations

### 2.2 The Gemini Inspiration

**Discussion**: User suggested looking at Gemini CLI's architecture for naming and grouping patterns, since Gemini is a production-proven AI CLI with similar goals.

**Action**: We explored Gemini CLI's codebase using subagents to understand:

- Package structure (`packages/core`, `packages/cli`)
- Major modules (`/agents`, `/tools`, `/core`, `/config`, `/telemetry`)
- Key patterns (AgentExecutor, DeclarativeTool, ToolRegistry, MessageBus)

**Key Finding**: Gemini uses a **two-layer separation**:

- `@google/gemini-cli-core` - Business logic, agents, tools, LLM
- `@google/gemini-cli` - CLI interface, commands, UI

### 2.3 Refining Component Names

**Discussion**: We refined our component names to be more consistent:

| Original Name        | Refined Name          |
| -------------------- | --------------------- |
| Orchestration Engine | Orchestrator          |
| Agent Runtime        | Agent Manager         |
| Provider Abstraction | LLM Manager           |
| Event Bus            | Message Manager       |
| Config               | Configuration Manager |
| State & Recovery     | State Manager         |

**Pattern**: "X Manager" for components that manage resources; standalone names for coordinators and cross-cutting concerns.

### 2.4 The Agent/LLM/Tools Question

**Discussion**: User asked about the relationship between Provider (LLM) and Agent. Key insight from user:

> "Provider is the intelligence (Claude Code, Gemini CLI) - the thing that runs prompts. Agent is a running instance of a provider executing a specific task."

This clarified:

- **Provider** = the engine (Claude, Gemini)
- **Agent** = an instance of that engine running with specific prompt/context

### 2.5 The Clarification Routing Design

**Discussion**: We designed hierarchical clarification routing:

```
Command Agent has question
    → Ask Phase Agent (parent)
        → Phase Agent knows? → Answer
        → Doesn't know? → Ask Workflow Agent
            → Workflow Agent knows? → Answer
            → Doesn't know? → Ask User
```

This requires Agent Manager to handle:

- Parent-child relationships
- Routing questions up hierarchy
- Pausing agents while waiting for answers

### 2.6 The SDK Migration Decision

**Context**: We had a separate `sdk-migration.md` document that explored why CLI subprocess doesn't work and why we should use Vercel AI SDK.

**Key Problems with CLI Subprocess**:

1. No structured output guarantee
2. Can't intercept tool calls
3. Retry loses all context
4. Different CLI per provider

**Solution**: Vercel AI SDK with two-phase execution:

- Phase 1: `generateText()` with tools for agentic work
- Phase 2: `generateObject()` with schema for structured extraction

### 2.7 The Unification Question

**Discussion**: User asked about the delineation between Agent Manager, LLM Manager, and Tool Executor (proposed). Should they be separate or merged?

**Analysis of Current Requirements**:

- LLM Manager: 40 FRs (but ~6 eliminated by SDK removing subprocess concerns)
- Agent Manager: 22 FRs
- Tool Executor: New (proposed as COMP-013)

**Key Question from User**:

> "Maybe since there are no 'providers' nonsense these can be merged?"

### 2.8 Deep Dive into Gemini's Approach

**Action**: We explored Gemini's architecture more deeply to understand how they handle agent/LLM/tools.

**Key Discovery**: Gemini uses a **unified architecture**:

```typescript
// Gemini's AgentExecutor owns EVERYTHING
class AgentExecutor<TOutput> {
  private toolRegistry: ToolRegistry; // Tools are internal
  private chat: GeminiChat; // LLM is internal

  async run(): Promise<TOutput> {
    // Agentic loop: chat → tools → repeat
  }
}
```

They do NOT have separate "Agent Manager" and "LLM Manager" components. It's all unified in AgentExecutor.

### 2.9 The Validation Question

**Discussion**: User asked if Validation Manager needs to be separate:

> "Isn't AI validation just an agent with tools with a prompt? And deterministic validations are just utility functions?"

**Answer**: Yes. Validation Manager (18 FRs) was over-engineered:

- Schema validation = `zod.parse()` - one line
- File existence = `fs.existsSync()` - one line
- AI validation = spawn validation agent - that's Agent Runtime's job

**Decision**: Eliminate Validation Manager. Distribute FRs to Orchestrator (utilities) and Agent Runtime (AI validation).

### 2.10 The "Aha" Moment

**User's Realization**:

> "So essentially what this looks like is we are building Gemini itself with orchestration in theory, because Gemini too has an agent with tools, it has configuration manager, it has telemetry, it has user interface Ink based... Wow lol."

**The Insight**: FlowMaster = Gemini + Orchestration + Hierarchy + State + Structured Output + Web UI

We're not building something new. We're extending a proven pattern.

### 2.11 The Final Decision

**User's Question**:

> "Should we then model and use the architecture of Gemini? Because they already have fire architecture."

**Decision**: YES. Deeply model after Gemini's architecture:

- Same package structure (`packages/core`, `packages/cli`)
- Same internal organization (`/agents`, `/tools`, `/config`)
- Same patterns (unified AgentExecutor, DeclarativeTool, MessageBus)
- Add our unique needs (Orchestrator, State Manager, Gateway, agent hierarchy)

### 2.12 Timeline Summary

| Step | What Happened                            | Outcome                             |
| ---- | ---------------------------------------- | ----------------------------------- |
| 1    | Started Stage 3 architecture             | Initial 11 components               |
| 2    | Looked at Gemini for patterns            | Refined names, found patterns       |
| 3    | Defined Agent/LLM/Provider relationships | Clarified semantics                 |
| 4    | Designed clarification routing           | Agent hierarchy concept             |
| 5    | Reviewed SDK migration decision          | Confirmed Vercel AI SDK             |
| 6    | Asked about component separation         | Questioned artificial boundaries    |
| 7    | Deep dive into Gemini                    | Found unified AgentExecutor pattern |
| 8    | Questioned Validation Manager            | Eliminated as separate component    |
| 9    | "Aha" moment                             | FlowMaster = Gemini + Orchestration |
| 10   | Final decision                           | Model architecture after Gemini     |

---

## 3. The Problem: Why CLI Subprocess Doesn't Work

### 3.1 Current Design: CLI Subprocess

The original FlowMaster architecture specified that LLM Manager invokes AI providers via CLI subprocess:

```
Agent Manager → LLM Manager → spawn("claude", ["-p", prompt, "--output-format", "stream-json"])
                    ↓
              Parse JSONL stdout → Yield StreamEvents
```

### 3.2 Problems with CLI Subprocess

| Problem                            | Description                                                                               | Impact                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **No structured output guarantee** | CLI outputs free-form text. Cannot enforce JSON schema on response content.               | Workflows fail when phases produce unexpected output shapes |
| **Retry loses context**            | On failure, must re-run entire CLI subprocess. Loses conversation history, wastes tokens. | Expensive retries, lost reasoning                           |
| **Tool execution is opaque**       | CLI executes tools internally. FlowMaster can only observe, not intercept/approve/modify. | No approval flows, no audit trails                          |
| **Single provider per CLI**        | Each CLI (claude, codex, gemini) has different output formats. No unified abstraction.    | Complex parsing, brittle integration                        |
| **Parsing is fragile**             | CLI output formats change between versions. No contract guarantees.                       | Breaks on CLI updates                                       |

### 3.3 Why Structured Output Matters

FlowMaster workflows require phases to produce structured outputs for:

- **Validation**: Orchestrator validates phase output matches expected schema
- **Context passing**: Phase outputs become inputs to subsequent phases
- **Type safety**: TypeScript should know the shape of phase outputs

**Example**: Planning phase must output:

```typescript
{
  tasks: Task[],
  dependencies: Record<string, string[]>
}
```

Not free-form markdown. Not "mostly JSON with some commentary". Exactly that shape, guaranteed.

### 3.4 Why Tool Control Matters

For reliable orchestration, FlowMaster needs to:

- Intercept tool calls before execution
- Implement approval flows for dangerous operations
- Add logging/telemetry hooks
- Customize tool behavior per workflow

CLI subprocess makes this impossible - tools execute inside the CLI process.

### 3.5 The Fundamental Problem

CLI subprocess treats AI as a black box:

```
Input (prompt) → [BLACK BOX] → Output (text)
```

We need:

```
Input (prompt) → [We control execution] → Output (structured, validated)
                      ↑
               Tools we execute
               Approvals we gate
               Context we persist
```

---

## 4. Research: What We Learned

### 4.1 Emdash (PTY Embedding)

**Location**: `examplecode/emdash`
**Approach**: Spawn CLI in pseudo-terminal (PTY), embed native TUI via xterm.js

**How it works**:

```
pty.spawn("claude") → Raw terminal bytes → xterm.js renders native UI
```

**What we learned**:

- Uses `node-pty` to spawn CLI processes
- Embeds full native terminal experience in Electron
- Activity detection via regex heuristics (busy/idle only)
- **No structured data extraction** - just terminal pass-through

**Verdict**: Doesn't solve our problems. Still a black box.

### 4.2 Cline (SDK + Own Tools)

**Location**: `examplecode/cline`
**Approach**: Direct SDK calls to providers, implements own tool system

**How it works**:

```
Provider SDK → Streaming response → Parse tool calls → Execute own tools → Loop
```

**What we learned**:

- Uses official provider SDKs (`@anthropic-ai/sdk`, `openai`, `@google/genai`)
- Implements own tool handlers (read_file, write_file, execute_command)
- Full control over tool execution, approval flows
- Has provider-specific format converters

**Verdict**: Right approach, but VS Code specific. We can learn from patterns.

### 4.3 Claude Code CLI

**Approach**: CLI with `--output-format stream-json` for structured JSONL events

**Outputs JSONL events**:

```jsonl
{"type": "chunk", "content": "I'll implement..."}
{"type": "tool_use", "name": "Edit", "input": {...}}
{"type": "tool_result", "output": "..."}
{"type": "result", "cost": 0.05, "duration": 12.3}
```

**What we learned**:

- Events are structured (JSONL)
- Response **content** is still free-form (not schema-enforced)
- Tools execute inside CLI - cannot intercept

**Verdict**: Better than raw CLI, but still can't guarantee structured content.

### 4.4 Gemini CLI

**Location**: `examplecode/gemini`
**Approach**: Unified AgentExecutor with tools, streaming, policy engine

**What we learned**:

- Unified architecture (no separate Agent/LLM/Tool components)
- DeclarativeTool pattern for tool definitions
- ToolRegistry for tool management
- MessageBus for confirmations
- CoreToolScheduler for tool execution state machine

**Verdict**: Excellent architecture. We should model after this.

### 4.5 Vercel AI SDK

**Approach**: Unified SDK for multiple providers with structured output support

**Key capabilities**:

- `generateText()` - Text generation with tools
- `generateObject()` - **Guaranteed** structured output via schema
- `tool()` - Tool definition with Zod schemas
- Multi-provider support (Anthropic, OpenAI, Google, 30+ providers)

**What we learned**:

- `generateObject()` uses constrained decoding - output **always** matches schema
- Tool definitions work across all providers
- SDK handles tool call → result → continue loop
- We provide implementations, SDK provides framework

**Verdict**: This is our foundation for LLM integration.

---

## 5. The Solution: Vercel AI SDK + Two-Phase Execution

### 5.1 What Vercel AI SDK Provides

| Function           | Description                                      |
| ------------------ | ------------------------------------------------ |
| `generateText()`   | Generate text (supports tools, streaming)        |
| `streamText()`     | Generate text with streaming                     |
| `generateObject()` | Generate structured JSON with schema enforcement |
| `streamObject()`   | Stream structured JSON                           |
| `tool()`           | Define a tool with Zod schema                    |

### 5.2 The Key Insight: generateObject() Guarantees Structure

```typescript
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

const result = await generateObject({
  model: anthropic('claude-sonnet-4-5-20250514'),
  schema: z.object({
    tasks: z.array(
      z.object({
        name: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
      })
    ),
    estimatedHours: z.number(),
  }),
  prompt: 'Create a plan for...',
});

// TypeScript knows exact shape - GUARANTEED valid
result.object.tasks.forEach((task) => console.log(task.name));
```

**How it works under the hood**:

- Model is **constrained at token level** to only output valid JSON matching schema
- Not "usually works" - ALWAYS works

### 5.3 The Challenge: Tools vs Structure

| Function           | Tools Support | Structured Output  |
| ------------------ | ------------- | ------------------ |
| `generateText()`   | ✅ Yes        | ❌ Free-form text  |
| `generateObject()` | ❌ No         | ✅ Schema enforced |

We need BOTH: tools for exploration AND structured output for workflows.

### 5.4 The Solution: Two-Phase Execution

Split agent execution into two phases:

**Phase 1: Agentic Work**

```typescript
const result = await generateText({
  model: provider,
  tools: { readFile, writeFile, runCommand },
  maxSteps: 50,
  prompt: context,
});
// Output: Free-form text + conversation history (messages array)
```

**Phase 2: Structured Extraction**

```typescript
const reduced = reduceConversation(result.messages);
const structured = await generateObject({
  model: provider,
  schema: outputSchema,
  messages: [...reduced, { role: 'user', content: 'Provide structured output' }],
});
// Output: Guaranteed structured object matching schema
```

### 5.5 The Complete Flow

```
Workflow: "Run 'analyze' command, output must match AnalysisResult schema"
                                    ↓
                          Agent Runtime spawns agent
                                    ↓
                    Context Manager builds prompt + context
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: AGENTIC WORK                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ generateText({                                                          │
│   model: provider,                                                      │
│   tools: { readFile, writeFile, runCommand, ... },                      │
│   maxSteps: 50,                                                         │
│   prompt: context                                                       │
│ })                                                                      │
│                                                                         │
│ Agent thinks: "I need to read the config file"                          │
│ Agent calls: readFile({ path: "config.ts" })                            │
│ Tool returns: "export const config = { ... }"                           │
│ Agent thinks: "Now I understand, let me check routes"                   │
│ Agent calls: readFile({ path: "routes.ts" })                            │
│ Tool returns: "import { Router } from 'express' ..."                    │
│ Agent thinks: "I have enough information now"                           │
│                                                                         │
│ Output: response.messages (full conversation history)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                    Conversation Reduction (remove file contents)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: STRUCTURED EXTRACTION                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ generateObject({                                                        │
│   model: provider,                                                      │
│   schema: AnalysisResult,                                               │
│   messages: [                                                           │
│     ...reducedConversation,                                             │
│     { role: 'user', content: 'Provide analysis as structured output' } │
│   ]                                                                     │
│ })                                                                      │
│                                                                         │
│ Model extracts structured data from its reasoning                       │
│                                                                         │
│ Output: { summary: "...", findings: [...], recommendations: [...] }     │
│         ↑ GUARANTEED to match AnalysisResult schema                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                          Return typed result
                                    ↓
                    Orchestrator receives validated phase output
```

### 5.6 Conversation Reduction

Phase 1 can produce large conversation histories (agent reads many files). Phase 2 doesn't need raw contents - it needs the agent's understanding.

**Reduction strategy**:

- Keep: User messages, assistant reasoning
- Summarize: Tool calls (keep name + args)
- Remove: Large tool results (file contents)

**Example**:

```
Before reduction:
  - User: "Analyze the auth system"
  - Assistant: "I'll read the auth files"
  - Tool call: readFile({ path: "auth.ts" })
  - Tool result: [500 lines of code]
  - Assistant: "I see JWT-based auth with refresh tokens"

After reduction:
  - User: "Analyze the auth system"
  - Assistant: "I'll read the auth files"
  - Assistant: "[Read auth.ts - 500 lines]"
  - Assistant: "I see JWT-based auth with refresh tokens"
```

### 5.7 Prototype Validation

We built a prototype to validate this pattern:

| Test   | Tool Calls | Messages | Reduction | Schema Match |
| ------ | ---------- | -------- | --------- | ------------ |
| Test 1 | 1          | 3        | 9%        | ✅ Perfect   |
| Test 2 | 2          | 3        | 7%        | ✅ Perfect   |

**Key findings**:

- `generateObject()` accepts messages array - critical for this pattern
- Structured output is genuinely guaranteed
- Token overhead acceptable (~3,000 tokens for simple tasks)
- Reduction scales with file size (60-80% expected for real codebases)

**The pattern works. It's clean, not hacky.**

---

## 6. The Insight: FlowMaster = Gemini + Orchestration

### 6.1 The Realization

After studying Gemini CLI's architecture, we realized:

```
FlowMaster = Gemini CLI
           + Orchestration (workflows, phases, state machines)
           + Agent Hierarchy (clarification routing)
           + State Persistence (crash recovery)
           + Structured Output (two-phase pattern)
           + Multi-Provider (Vercel AI SDK)
           + Web UI
```

### 6.2 Component Mapping

| Gemini CLI                         | FlowMaster                | Notes               |
| ---------------------------------- | ------------------------- | ------------------- |
| AgentExecutor + GeminiChat + Tools | **Agent Runtime**         | Unified component   |
| Config                             | **Configuration Manager** | Same concept        |
| MessageBus (confirmation-bus)      | **Message Manager**       | Same concept        |
| Telemetry                          | **Telemetry**             | Same concept        |
| CLI (Ink-based)                    | **User Interface**        | We add Web UI       |
| MCP (external integrations)        | **Task Manager**          | Different approach  |
| —                                  | **Orchestrator**          | FlowMaster addition |
| —                                  | **State Manager**         | FlowMaster addition |
| —                                  | **Context Manager**       | FlowMaster addition |
| —                                  | **Gateway**               | FlowMaster addition |

### 6.3 What Gemini Doesn't Have (That We Need)

| Capability                  | Why FlowMaster Needs It                   |
| --------------------------- | ----------------------------------------- |
| Workflow orchestration      | Multi-phase execution with state machines |
| Agent hierarchy             | Workflow → Phase → Command agents         |
| Clarification routing       | Child asks parent before asking user      |
| State persistence           | Crash recovery, resume from checkpoint    |
| Structured output guarantee | Two-phase execution pattern               |
| Multi-provider              | Claude, Gemini, OpenAI via single SDK     |
| Web UI                      | Browser-based interface for teams         |

---

## 7. Gemini Architecture Deep Study

### 7.1 Gemini Package Structure

```
packages/
├── core/                      # Business logic
│   └── src/
│       ├── agents/            # AgentExecutor, registry, types
│       ├── tools/             # Tool definitions, registry, scheduler
│       ├── core/              # LLM client, streaming, turn management
│       ├── config/            # Configuration management
│       ├── confirmation-bus/  # MessageBus for confirmations
│       ├── services/          # Business services
│       ├── hooks/             # Lifecycle hooks
│       ├── telemetry/         # Observability
│       ├── policy/            # Tool execution policies
│       ├── safety/            # Safety checks
│       ├── routing/           # Model routing
│       ├── fallback/          # Fallback handling
│       ├── mcp/               # MCP protocol
│       ├── prompts/           # Prompt templates
│       └── utils/             # Utilities
├── cli/                       # CLI interface
├── test-utils/                # Testing utilities
├── a2a-server/                # Agent-to-agent (skip)
└── vscode-ide-companion/      # VS Code extension (skip)
```

### 7.2 Key Pattern: Unified AgentExecutor

**This is the most important pattern we're adopting.**

Gemini does NOT have separate "Agent Manager" and "LLM Manager" components. Everything is unified:

```typescript
// Gemini's AgentExecutor owns EVERYTHING
class AgentExecutor<TOutput> {
  private toolRegistry: ToolRegistry; // Tools are internal
  private chat: GeminiChat; // LLM client is internal

  async run(): Promise<TOutput> {
    // Agentic loop: chat → tool calls → tool responses → repeat
    while (!complete) {
      const response = await this.chat.sendMessage(message);
      const toolCalls = extractToolCalls(response);
      const toolResults = await this.executeTools(toolCalls);
      // Continue until complete_task called
    }
  }
}
```

**Why this matters**: Separating Agent/LLM/Tools creates artificial boundaries. In reality, they're tightly coupled - an agent IS a running LLM with tools.

### 7.3 Key Pattern: DeclarativeTool

```typescript
// Gemini's tool definition pattern
abstract class DeclarativeTool<TParams, TResult> {
  abstract schema: FunctionDeclaration;

  build(params: TParams): ToolInvocation<TParams, TResult> {
    // Validate params, return ready-to-execute invocation
  }
}

class ToolInvocation<TParams, TResult> {
  async execute(signal: AbortSignal): Promise<ToolResult> {
    // Actually run the tool
  }
}
```

**Separation**: Validation (`build()`) is separate from execution (`execute()`). This enables preview before running.

### 7.4 Key Pattern: ToolRegistry

```typescript
class ToolRegistry {
  private tools: Map<string, DeclarativeTool>;

  registerTool(tool: DeclarativeTool): void;
  getTool(name: string): DeclarativeTool;
  getActiveTools(): DeclarativeTool[];
  getFunctionDeclarations(): FunctionDeclaration[]; // For LLM API
}
```

**Key insight**: Agents create **isolated** tool registries. Each agent has its own copy.

### 7.5 Key Pattern: CoreToolScheduler

```typescript
enum ToolCallState {
  Validating,
  Scheduled,
  AwaitingApproval,
  Executing,
  Success,
  Error,
  Cancelled,
}

class CoreToolScheduler {
  async schedule(toolCalls: ToolCallRequest[]): Promise<ToolResult[]> {
    // State machine: Validate → Approve (if needed) → Execute → Return
  }
}
```

### 7.6 Key Pattern: MessageBus

```typescript
class MessageBus extends EventEmitter {
  async publish(message: Message): Promise<void>;
  subscribe(type: string, listener: Function): void;
  async request<TReq, TRes>(request: TReq, responseType: string): Promise<TRes>;
}
```

Supports both:

- **Pub-sub** for broadcasts (events)
- **Request-response** with correlation IDs (confirmations)

### 7.7 Gemini Data Flow

```
User prompt
    ↓
AgentExecutor.run()
    ↓
GeminiChat.sendMessageStream()
    ↓
Gemini API (streaming chunks)
    ↓
Parse response → Extract tool calls
    ↓
CoreToolScheduler.schedule(toolCalls)
    ↓
Tool validation → Approval (if needed) → Execution
    ↓
Tool results back to chat
    ↓
Continue until complete_task
    ↓
Return structured output
```

### 7.8 What We Adopt vs Skip

| Module              | Adopt?     | FlowMaster Equivalent          |
| ------------------- | ---------- | ------------------------------ |
| `/agents`           | ✅ Pattern | Agent Runtime                  |
| `/tools`            | ✅ Pattern | Agent Runtime (internal)       |
| `/core`             | ✅ Adapt   | Agent Runtime (use Vercel SDK) |
| `/config`           | ✅ Pattern | Configuration Manager          |
| `/confirmation-bus` | ✅ Pattern | Message Manager                |
| `/telemetry`        | ✅ Pattern | Telemetry                      |
| `/services`         | ✅ Adapt   | Various                        |
| `/hooks`            | ✅ Pattern | Message Manager                |
| `/policy`           | ✅ Pattern | Configuration Manager          |
| `/mcp`              | ❌ Skip    | Future consideration           |
| `/ide`              | ❌ Skip    | Not needed                     |

---

## 8. New Component Architecture

### 8.1 New Component List (10 Components)

| ID       | Component             | Gemini Equivalent              | Responsibility                  |
| -------- | --------------------- | ------------------------------ | ------------------------------- |
| COMP-001 | Message Manager       | `/confirmation-bus`            | Pub-sub, request-response       |
| COMP-002 | Configuration Manager | `/config` + `/policy`          | Config, schemas, policies       |
| COMP-003 | State Manager         | (none)                         | Persistence, crash recovery     |
| COMP-004 | Telemetry             | `/telemetry`                   | Tracing, logging, metrics       |
| COMP-005 | Context Manager       | `/prompts`                     | Build context for agents        |
| COMP-006 | Task Manager          | `/mcp`                         | External systems (Jira, Linear) |
| COMP-007 | **Agent Runtime**     | `/agents` + `/tools` + `/core` | **Unified agent/LLM/tools**     |
| COMP-008 | Orchestrator          | (none)                         | Workflow state machines         |
| COMP-009 | User Interface        | CLI                            | CLI + Web UI                    |
| COMP-010 | Gateway               | (none)                         | BFF for Web UI                  |

### 8.2 Component Changes Summary

| Change         | Details                                                    |
| -------------- | ---------------------------------------------------------- |
| **Merged**     | Agent Manager + LLM Manager → **Agent Runtime**            |
| **Eliminated** | Validation Manager → utilities + validation agent          |
| **Added**      | (nothing new, but Agent Runtime is significantly expanded) |

### 8.3 Agent Runtime: The Unified Component

**Replaces**: Agent Manager (COMP-009) + LLM Manager (COMP-005) + Tool Executor (proposed)

**Responsibilities**:

- Agent lifecycle (create, run, pause, resume, complete, terminate)
- Agent hierarchy (workflow → phase → command agents)
- Clarification routing (child → parent → user)
- LLM calls via Vercel AI SDK
- Two-phase execution (generateText → generateObject)
- Tool registry and execution (internal)
- Tool approval flows
- Provider selection and fallback
- Streaming and result handling

**Internal Structure** (mirrors Gemini):

```
agent-runtime/
├── executor/           # AgentExecutor equivalent
│   ├── agent-executor.ts
│   ├── agent-registry.ts
│   └── types.ts
├── tools/              # Tool system
│   ├── tool-registry.ts
│   ├── tool-scheduler.ts
│   ├── base-tool.ts
│   └── builtin/
│       ├── read-file.ts
│       ├── write-file.ts
│       ├── edit-file.ts
│       ├── glob.ts
│       ├── grep.ts
│       ├── shell.ts
│       └── ask-user.ts
├── llm/                # LLM abstraction (Vercel SDK)
│   ├── provider.ts
│   ├── streaming.ts
│   └── two-phase.ts
├── hierarchy/          # Agent hierarchy (FlowMaster addition)
│   ├── parent-child.ts
│   └── clarification-router.ts
└── session/            # Session management
    ├── session.ts
    └── conversation.ts
```

### 8.4 Validation: No Longer a Component

| Validation Type   | New Home      | Implementation                              |
| ----------------- | ------------- | ------------------------------------------- |
| Schema validation | Orchestrator  | `validateSchema(output, schema)` utility    |
| File existence    | Orchestrator  | `fs.existsSync(path)` utility               |
| Command success   | Orchestrator  | `checkExitCode(result)` utility             |
| AI validation     | Agent Runtime | Spawn validation agent with read-only tools |

### 8.5 New Package Structure

```
packages/
├── core/                          # Business logic
│   └── src/
│       ├── agent-runtime/         # COMP-007 (unified)
│       │   ├── executor/
│       │   ├── tools/
│       │   ├── llm/
│       │   ├── hierarchy/
│       │   └── session/
│       ├── orchestrator/          # COMP-008
│       │   ├── workflow-machine.ts
│       │   ├── phase-machine.ts
│       │   └── validation-utils.ts
│       ├── config/                # COMP-002
│       ├── state/                 # COMP-003
│       ├── context/               # COMP-005
│       ├── task/                  # COMP-006
│       ├── message-bus/           # COMP-001
│       ├── telemetry/             # COMP-004
│       └── utils/
├── cli/                           # COMP-009 (CLI)
│   └── src/
│       ├── commands/
│       ├── ui/                    # Ink components
│       └── services/
├── web/                           # COMP-009 (Web) + COMP-010
│   └── src/
│       ├── gateway/
│       └── ui/
└── test-utils/
```

### 8.6 Dependency Graph

```
                    ┌─────────────────┐
                    │  User Interface │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Gateway     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Orchestrator  │ │  Task Manager   │ │  Configuration  │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Agent Runtime  │◄──── Unified: Agents + LLM + Tools
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌─────────────────┐
│Context│ │  State Manager  │
│Manager│ └─────────────────┘
└───────┘

┌─────────────────┐     ┌─────────────────┐
│ Message Manager │     │    Telemetry    │
└─────────────────┘     └─────────────────┘
    (foundational)          (cross-cutting)
```

---

## 9. FR Remapping Strategy

### 9.1 Current State

We have ~296 FRs across 12 components:

| Component             | FRs |
| --------------------- | --- |
| Message Manager       | 15  |
| Configuration Manager | 31  |
| State Manager         | 24  |
| Telemetry             | 25  |
| LLM Manager           | 40  |
| Context Manager       | 18  |
| Task Manager          | 19  |
| Validation Manager    | 18  |
| Agent Manager         | 22  |
| Orchestrator          | 39  |
| User Interface        | 27  |
| Gateway               | 18  |

### 9.2 Remapping Summary

| Component              | FRs | Disposition                  |
| ---------------------- | --- | ---------------------------- |
| Message Manager        | 15  | Keep as-is                   |
| Configuration Manager  | 31  | Keep + add 3 from Validation |
| State Manager          | 24  | Keep as-is                   |
| Telemetry              | 25  | Keep + add 1 from Validation |
| **LLM Manager**        | 40  | → **Agent Runtime** (merge)  |
| Context Manager        | 18  | Keep as-is                   |
| Task Manager           | 19  | Keep as-is                   |
| **Validation Manager** | 18  | → **Distribute** (eliminate) |
| **Agent Manager**      | 22  | → **Agent Runtime** (merge)  |
| Orchestrator           | 39  | Keep + add 9 from Validation |
| User Interface         | 27  | Keep as-is                   |
| Gateway                | 18  | Keep as-is                   |

### 9.3 LLM Manager FRs → Agent Runtime

| FR                          | Title                   | Action        | Notes                     |
| --------------------------- | ----------------------- | ------------- | ------------------------- |
| FR-LM-001                   | Child Process Spawning  | **ELIMINATE** | SDK eliminates subprocess |
| FR-LM-002                   | Active Process Tracking | **ELIMINATE** | SDK eliminates subprocess |
| FR-LM-003                   | Process Group Cleanup   | **ELIMINATE** | SDK eliminates subprocess |
| FR-LM-004                   | Abort Signal Handling   | Keep          | Still need cancellation   |
| FR-LM-005                   | Timeout Configuration   | Keep          | Still needed              |
| FR-LM-006                   | Stdin Prompt Piping     | **ELIMINATE** | SDK eliminates subprocess |
| FR-LM-007 through FR-LM-040 | Various                 | Keep/Adapt    | Move to Agent Runtime     |

**Summary**: 40 FRs → ~34 FRs (6 eliminated)

### 9.4 Agent Manager FRs → Agent Runtime

All 22 FRs (FR-AM-001 through FR-AM-022) move to Agent Runtime as-is.

### 9.5 Validation Manager FRs → Distribute

| FR            | Title                         | New Location                        |
| ------------- | ----------------------------- | ----------------------------------- |
| FR-VM-001     | Schema Definition Loading     | Configuration Manager               |
| FR-VM-002     | Schema Validation Execution   | Orchestrator (utility)              |
| FR-VM-003-005 | Deterministic Checks          | Orchestrator (utilities)            |
| FR-VM-006     | Validation Rule Configuration | Configuration Manager               |
| FR-VM-007-009 | AI Validation                 | Agent Runtime                       |
| FR-VM-010-015 | Result Handling               | Orchestrator                        |
| FR-VM-016     | Validation Metrics            | Telemetry                           |
| FR-VM-017-018 | Custom Validators, Skip       | Configuration Manager, Orchestrator |

### 9.6 New FR Counts

| Component              | Old  | New     | Change     |
| ---------------------- | ---- | ------- | ---------- |
| Message Manager        | 15   | 15      | —          |
| Configuration Manager  | 31   | 34      | +3         |
| State Manager          | 24   | 24      | —          |
| Telemetry              | 25   | 26      | +1         |
| Context Manager        | 18   | 18      | —          |
| Task Manager           | 19   | 19      | —          |
| **Agent Runtime**      | —    | **~60** | New        |
| Orchestrator           | 39   | ~48     | +9         |
| User Interface         | 27   | 27      | —          |
| Gateway                | 18   | 18      | —          |
| ~~LLM Manager~~        | 40   | —       | Merged     |
| ~~Validation Manager~~ | 18   | —       | Eliminated |
| ~~Agent Manager~~      | 22   | —       | Merged     |
| **Total**              | ~296 | ~289    | -7         |

### 9.7 New FRs Needed

| Area                    | New FRs                            |
| ----------------------- | ---------------------------------- |
| Two-Phase Execution     | generateText → generateObject flow |
| Tool Definition         | DeclarativeTool pattern            |
| Tool Registry           | Registration and discovery         |
| Tool Scheduler          | Execution state machine            |
| Conversation Management | Message array management           |
| Conversation Reduction  | Reduce for Phase 2                 |
| Structured Output       | Schema-enforced output             |

---

## 10. Tool Implementation

### 10.1 What Tools We Need

| Tool            | Purpose                 |
| --------------- | ----------------------- |
| `readFile`      | Read file contents      |
| `writeFile`     | Write/create files      |
| `editFile`      | Make targeted edits     |
| `listDirectory` | List files in directory |
| `searchFiles`   | Glob/grep for files     |
| `runCommand`    | Execute shell commands  |
| `askUser`       | Request clarification   |

### 10.2 Tool Definition with Vercel AI SDK

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const readFile = tool({
  description: 'Read file contents',
  parameters: z.object({
    path: z.string().describe('Path to the file'),
  }),
  execute: async ({ path }) => {
    return await fs.readFile(path, 'utf-8');
  },
});
```

### 10.3 Tool Registration (Internal to Agent Runtime)

```typescript
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(name: string, tool: Tool): void {
    this.tools.set(name, tool);
  }

  getTools(): Record<string, Tool> {
    return Object.fromEntries(this.tools);
  }
}
```

### 10.4 Approval Flow

Some tools are dangerous. We need user approval:

```
Agent calls: writeFile({ path: "config.ts", content: "..." })
                    ↓
          Agent Runtime receives call
                    ↓
          Check: "Does this tool need approval?"
                    ↓
          Yes → Route to clarification handler
                    ↓
          Route up hierarchy (can parent approve?)
                    ↓
          Eventually reaches user
                    ↓
          User approves/denies
                    ↓
          Response flows back
                    ↓
          If approved → Execute tool
          If denied → Return error to model
```

### 10.5 Tool Configuration

Configuration Manager holds:

- Which tools are enabled per workflow
- Which tools require approval
- Sandboxing rules (allowed directories)
- Timeout settings

---

## 11. Session Management

### 11.1 What is a Session?

A session is a conversation between an agent and the model:

- All messages (user, assistant, tool calls, tool results)
- Tool call history
- Token usage
- Start/end times

### 11.2 Session Lifecycle

```
Agent starts
    ↓
Session created (empty messages array)
    ↓
Phase 1 begins
    ↓
User message added
    ↓
Model responds → Assistant message added
    ↓
Tool call → Tool call message added
    ↓
Tool result → Tool result message added
    ↓
... (loop until done)
    ↓
Phase 1 complete → Messages captured
    ↓
Checkpoint? → State Manager persists
    ↓
Phase 2 begins
    ↓
Reduced messages + extraction prompt
    ↓
Model responds with structured output
    ↓
Session complete → Full session persisted
```

### 11.3 Crash Recovery

If FlowMaster crashes:

1. State Manager has persisted messages up to last checkpoint
2. On restart, load messages from disk
3. Resume from where we left off
4. No need to redo completed work

### 11.4 Session Data Structure

```typescript
interface Session {
  id: string;
  agentId: string;
  phaseId: string;
  status: 'in_progress' | 'completed' | 'failed';
  messages: Message[];
  toolCalls: ToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  structuredOutput?: unknown;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}
```

---

## 12. UI Experience Improvements

### 12.1 What SDK Enables

| With CLI              | With SDK                               |
| --------------------- | -------------------------------------- |
| "Agent is running..." | Real-time streaming of reasoning       |
| Final output only     | Each tool call as it happens           |
| No approval flows     | Approval prompts when needed           |
| No progress           | Progress through multi-step operations |
| Raw text              | Structured results with formatting     |

### 12.2 Real-Time Updates

SDK provides callbacks:

```typescript
const result = await generateText({
  model: provider,
  tools: { readFile, writeFile },
  onStepFinish: (step) => {
    emit('TOOL_COMPLETE', step);
  },
});

for await (const chunk of result.textStream) {
  emit('AGENT_THINKING', chunk);
}
```

### 12.3 Approval Prompts

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Agent wants to write a file                                             │
├─────────────────────────────────────────────────────────────────────────┤
│ Path: /project/src/config.ts                                            │
│ Content preview:                                                        │
│   export const config = {                                               │
│     apiUrl: "https://api.example.com",                                  │
│     ...                                                                 │
│   }                                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│ [Approve]  [Deny]  [Approve All]                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 13. What Changes from Original Design

### 13.1 Component Changes

| Original                      | Change            | New               |
| ----------------------------- | ----------------- | ----------------- |
| Agent Manager (COMP-009)      | Merged + Expanded | Agent Runtime     |
| LLM Manager (COMP-005)        | Merged            | → Agent Runtime   |
| Tool Executor (proposed)      | Never created     | → Agent Runtime   |
| Validation Manager (COMP-008) | Eliminated        | Utilities + Agent |

### 13.2 Documents to Update

| Document                   | Change                        |
| -------------------------- | ----------------------------- |
| `00-architecture.md`       | Rewrite for 10 components     |
| `05-llm-manager.md`        | Merge into `agent-runtime.md` |
| `08-validation-manager.md` | Delete                        |
| `09-agent-manager.md`      | Merge into `agent-runtime.md` |
| `10-orchestrator.md`       | Add validation FRs            |
| Integration contracts      | Update for Agent Runtime      |

---

## 14. Redesign Phases

### Overview

The redesign follows a systematic 6-phase approach. Each phase builds on the previous one.

```
Phase 1: Gemini Deep Study (Research)
    ↓
Phase 2: FR Remapping
    ↓
Phase 3: Architecture Rewrite (Stage 3 Redo)
    ↓
Phase 4: Integration Rewrite (Stage 3c Redo)
    ↓
Phase 5: Detailed Design (Stage 4)
    ↓ (can run in parallel)
Phase 6: Prototype Validation
```

---

### Phase 1: Gemini Deep Study (Research)

**Goal**: Fully understand Gemini's architecture to use as reference

**Tasks**:
| # | Task | Output |
|---|------|--------|
| 1.1 | Document Gemini's module structure | Module map with purposes |
| 1.2 | Document key patterns (AgentExecutor, DeclarativeTool, etc.) | Pattern catalog with code examples |
| 1.3 | Document data flows (how a prompt flows through the system) | Flow diagrams |
| 1.4 | Document their tool system in detail | Tool architecture doc |
| 1.5 | Document their config/DI pattern | Config pattern doc |
| 1.6 | Create reference diagrams | Visual architecture |

**Output**: `design/flowmaster/00-notes/gemini-architecture-reference.md`

**Notes**: This phase can run in parallel with Phase 2. It's primarily research.

---

### Phase 2: FR Remapping

**Goal**: Remap all existing FRs to new component structure

**Tasks**:
| # | Task | Output |
|---|------|--------|
| 2.1 | Create FR migration spreadsheet | Excel/CSV tracking all 296 FRs |
| 2.2 | Mark FRs: keep, eliminate, adapt, move | Disposition for each FR |
| 2.3 | Identify gaps (new FRs needed) | List of new FRs to write |
| 2.4 | Write new FRs for two-phase execution | FR-AR-xxx for Agent Runtime |
| 2.5 | Write new FRs for tool patterns | FR-AR-xxx for tools |
| 2.6 | Renumber FRs for new components | Consistent numbering |
| 2.7 | Create new Agent Runtime requirements doc | `agent-runtime.md` |
| 2.8 | Update Orchestrator requirements | Add validation FRs |
| 2.9 | Delete obsolete requirement docs | Remove LLM Manager, Validation Manager, Agent Manager |

**Output**:

- `design/flowmaster/03-architecture/requirements/07-agent-runtime.md` (new)
- Updated `10-orchestrator.md`
- Deleted: `05-llm-manager.md`, `08-validation-manager.md`, `09-agent-manager.md`

**FR Migration Table**:
| From | To | Action |
|------|----|--------|
| LLM Manager (40 FRs) | Agent Runtime | Merge, eliminate 6 subprocess FRs |
| Agent Manager (22 FRs) | Agent Runtime | Merge as-is |
| Validation Manager (18 FRs) | Distribute | Config (3), Orchestrator (9), Agent Runtime (3), Telemetry (1), Delete (2) |

---

### Phase 3: Architecture Rewrite (Stage 3 Redo)

**Goal**: Rewrite architecture document with new 10-component structure

**Tasks**:
| # | Task | Output |
|---|------|--------|
| 3.1 | Update component catalog (10 components) | New component list |
| 3.2 | Rewrite Agent Runtime component definition | Unified responsibilities |
| 3.3 | Update component diagram | New visual |
| 3.4 | Update interaction flows | New sequence diagrams |
| 3.5 | Update dependency graph | New dependencies |
| 3.6 | Add ADR for Gemini-based architecture | ADR-008 (or next number) |
| 3.7 | Update cross-cutting concerns | Reflect new structure |
| 3.8 | Update data architecture | Session persistence |
| 3.9 | Validate against checklist | Ensure completeness |

**Output**: Updated `design/flowmaster/03-architecture/00-architecture.md`

**Key Changes to Document**:

- Remove: LLM Manager, Validation Manager, Agent Manager
- Add: Agent Runtime (unified)
- Update: All interaction flows involving agents/LLM/tools
- Add: Two-phase execution flow
- Add: Tool approval flow

---

### Phase 4: Integration Rewrite (Stage 3c Redo)

**Goal**: Update integration contracts for new structure

**Tasks**:
| # | Task | Output |
|---|------|--------|
| 4.1 | Create Agent Runtime interface contract | `contracts/agent-runtime.md` |
| 4.2 | Delete LLM Manager contract | Remove file |
| 4.3 | Delete Validation Manager contract | Remove file |
| 4.4 | Delete Agent Manager contract | Remove file |
| 4.5 | Update Orchestrator contract | Add validation operations |
| 4.6 | Update shared schemas | New session schema, tool schemas |
| 4.7 | Update message catalog | New Agent Runtime messages |
| 4.8 | Update integration overview | New dependency matrix |

**Output**:

- New: `integration/contracts/agent-runtime.md`
- Deleted: `llm-manager.md`, `validation-manager.md`, `agent-manager.md`
- Updated: `orchestrator.md`, schemas, message catalog

**New Schemas Needed**:

- `Session` - Agent session with messages
- `ToolCall` - Tool invocation record
- `ToolResult` - Tool execution result
- `StructuredOutput` - Phase output with schema

**New Messages Needed**:

- `AGENT_STARTED`, `AGENT_COMPLETED`, `AGENT_FAILED`
- `TOOL_CALL_REQUESTED`, `TOOL_CALL_APPROVED`, `TOOL_CALL_DENIED`
- `PHASE_OUTPUT_READY`

---

### Phase 5: Detailed Design (Stage 4)

**Goal**: Write implementation-ready specs for new components

**Tasks**:
| # | Task | Priority | Output |
|---|------|----------|--------|
| 5.1 | Agent Runtime detailed design | HIGH | `04-detailed-design/agent-runtime.md` |
| 5.2 | Update Orchestrator detailed design | MEDIUM | Add validation section |
| 5.3 | Update other components as needed | LOW | Minor updates |

**Agent Runtime Detailed Design Sections**:

1. API Specification
   - `createAgent(config)` - Create new agent
   - `executeAgent(agentId, context)` - Run agent with two-phase
   - `pauseAgent(agentId)` - Pause for clarification
   - `resumeAgent(agentId, response)` - Resume with answer
   - `terminateAgent(agentId)` - Cancel execution

2. Data Model
   - Agent entity
   - Session entity
   - ToolCall entity
   - Message types

3. Internal Logic
   - Two-phase execution algorithm (pseudocode)
   - Conversation reduction algorithm
   - Clarification routing algorithm
   - Tool execution state machine

4. Error Handling
   - Provider errors
   - Tool errors
   - Schema validation errors
   - Timeout handling

5. Test Specification
   - Unit tests for each function
   - Integration tests for flows
   - E2E tests for workflows

**Output**: `design/flowmaster/04-detailed-design/agent-runtime.md`

---

### Phase 6: Prototype Validation

**Goal**: Validate key patterns with working code before full implementation

**Tasks**:
| # | Task | Output |
|---|------|--------|
| 6.1 | Prototype Agent Runtime core | Working executor |
| 6.2 | Prototype two-phase execution | generateText → generateObject |
| 6.3 | Prototype tool definitions | Basic tools (readFile, etc.) |
| 6.4 | Prototype tool execution | Tool scheduler |
| 6.5 | Prototype session management | Message persistence |
| 6.6 | Prototype agent hierarchy | Parent-child relationships |
| 6.7 | Document findings | FINDINGS.md |

**Output**: `prototypes/agent-runtime/`

**Prototype Structure**:

```
prototypes/agent-runtime/
├── src/
│   ├── executor.ts        # AgentExecutor
│   ├── two-phase.ts       # Two-phase execution
│   ├── tools/
│   │   ├── registry.ts
│   │   ├── read-file.ts
│   │   └── write-file.ts
│   ├── session.ts         # Session management
│   └── hierarchy.ts       # Parent-child
├── tests/
│   ├── two-phase.test.ts
│   ├── tools.test.ts
│   └── hierarchy.test.ts
├── FINDINGS.md            # What we learned
└── package.json
```

**Validation Criteria**:
| Pattern | How to Validate |
|---------|-----------------|
| Two-phase execution | Phase 1 does tools, Phase 2 produces schema-valid output |
| Tool execution | Tools run, results return to model |
| Session persistence | Save messages, reload, continue |
| Agent hierarchy | Child asks parent, parent answers or escalates |

---

### Phase Dependencies

```
Phase 1 ─────────────────────────────────────┐
(Gemini Study)                               │
                                             ├── Can run in parallel
Phase 2 ─────────────────────────────────────┤
(FR Remapping)                               │
         │                                   │
         ▼                                   │
Phase 3 ─────────────────────────────────────┘
(Architecture Rewrite)
         │
         ▼
Phase 4
(Integration Rewrite)
         │
         ▼
Phase 5 ◄─────────────────── Phase 6
(Detailed Design)            (Prototype)
                             Can start early
                             to validate patterns
```

---

### Estimated Effort

| Phase   | Effort   | Notes                               |
| ------- | -------- | ----------------------------------- |
| Phase 1 | Research | Can be done in parallel             |
| Phase 2 | Medium   | ~296 FRs to review and remap        |
| Phase 3 | Medium   | Major document rewrite              |
| Phase 4 | Medium   | Update contracts, schemas, messages |
| Phase 5 | High     | Detailed Agent Runtime design       |
| Phase 6 | Medium   | Prototype to validate patterns      |

---

## 15. Implementation Details

### 15.1 Implementation Priority

**Phase 1: Core SDK Integration**

1. Set up Vercel AI SDK with Anthropic
2. Implement basic `generateText()` without tools
3. Implement `generateObject()` for structured output
4. Prove two-phase pattern works

**Phase 2: Tool System**

1. Create tool registry
2. Implement basic tools (readFile, listDirectory)
3. Wire tools to generateText
4. Test multi-step tool execution

**Phase 3: Session Management**

1. Define session data structure
2. Implement in-memory tracking
3. Add State Manager persistence
4. Test crash recovery

**Phase 4: Approval Flows**

1. Add approval requirement to tools
2. Implement routing through hierarchy
3. Wire to UI
4. Test approval/deny flows

**Phase 5: Production Hardening**

1. Provider fallback
2. Conversation reduction optimization
3. Telemetry throughout
4. Error handling

### 15.2 Open Implementation Questions

| Question                          | Options                                   |
| --------------------------------- | ----------------------------------------- |
| How does timeout work?            | Cancel model call or just tool?           |
| Conversation reduction algorithm? | Keep assistant messages, summarize tools? |
| When to checkpoint?               | After each tool? Each step?               |
| Provider fallback strategy?       | Re-run Phase 1 or just Phase 2?           |
| Schema validation failure?        | Retry Phase 2 or fail?                    |

---

## 16. Open Questions

### 16.1 Architecture Questions

| ID     | Question                           | Recommendation                    |
| ------ | ---------------------------------- | --------------------------------- |
| OQ-001 | Use Gemini's exact class names?    | No - use our names, same patterns |
| OQ-002 | How closely mirror file structure? | Inspired but adapted              |
| OQ-003 | Tools internal or exposed?         | Internal initially                |

### 16.2 Implementation Questions

| ID     | Question                         | Recommendation             |
| ------ | -------------------------------- | -------------------------- |
| OQ-004 | When to start implementation?    | After architecture rewrite |
| OQ-005 | Prototype first or design first? | Prototype validates design |

### 16.3 Scope Questions

| ID     | Question             | Recommendation            |
| ------ | -------------------- | ------------------------- |
| OQ-006 | Include MCP support? | No - future consideration |
| OQ-007 | Web UI in MVP?       | Depends on priorities     |

---

## 17. Success Criteria

| Criterion               | Verification                                |
| ----------------------- | ------------------------------------------- |
| Structured output works | Phase produces typed object matching schema |
| Tools execute correctly | Agent can read/write files, run commands    |
| Approval flow works     | Dangerous operations prompt user            |
| Sessions persist        | Crash and resume without losing progress    |
| Multi-provider works    | Switch providers, same behavior             |
| UI shows progress       | Real-time updates during execution          |
| Retry preserves context | Retry doesn't redo completed work           |

---

## 18. Next Steps

### Immediate Actions

1. **Review this document** - Team alignment
2. **Decide open questions** - OQ-001 through OQ-007
3. **Prioritize phases** - Which to start first

### Suggested Order

```
1. Phase 1 (Gemini Deep Study)
   ↓
2. Phase 2 (FR Remapping)
   ↓
3. Phase 3 (Architecture Rewrite)
   ↓
4. Phase 4 (Integration Rewrite)
   ↓
5. Phase 5 (Detailed Design)
   ↓ (parallel)
6. Phase 6 (Prototype)
```

### Decision Needed

**Team: Do you approve this redesign approach?**

If yes, proceed with:

1. Gemini deep study
2. FR remapping
3. Architecture rewrite

---

## Document History

| Version | Date       | Author            | Changes                                      |
| ------- | ---------- | ----------------- | -------------------------------------------- |
| 1.0     | 2025-12-02 | Architecture Team | Initial brainstorm                           |
| 2.0     | 2025-12-02 | Architecture Team | Merged SDK migration details, added timeline |

---

## References

### Internal Documents

- `design/flowmaster/03-architecture/00-architecture.md` - Current architecture
- `design/flowmaster/03-architecture/requirements/` - Component requirements
- `design/flowmaster/00-notes/handoff-context.md` - Current project state

### External

- Gemini CLI: `examplecode/gemini`
- Cline: `examplecode/cline`
- Vercel AI SDK: https://ai-sdk.dev/docs
- Vercel AI SDK GitHub: https://github.com/vercel/ai
