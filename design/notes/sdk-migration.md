# LLM Manager: SDK Migration Design

> **Document Version**: 2.0
> **Date**: 2025-12-02
> **Status**: Approved - Ready for Implementation
> **Author**: Architecture Team
> **Decision**: Proceed with Vercel AI SDK + Two-Phase Execution Pattern

---

## 1. Problem Statement

### 1.1 Current Design: CLI Subprocess

The current FlowMaster architecture specifies that LLM Manager invokes AI providers via CLI subprocess:

```
Agent Manager → LLM Manager → spawn("claude", ["-p", prompt, "--output-format", "stream-json"])
                    ↓
              Parse JSONL stdout → Yield StreamEvents
```

### 1.2 Problems with CLI Subprocess

| Problem                            | Description                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| **No structured output guarantee** | CLI outputs free-form text. Cannot enforce JSON schema on response content.               |
| **Retry loses context**            | On failure, must re-run entire CLI subprocess. Loses conversation history, wastes tokens. |
| **Tool execution is opaque**       | CLI executes tools internally. FlowMaster can only observe, not intercept/approve/modify. |
| **Single provider per CLI**        | Each CLI (claude, codex, gemini) has different output formats. No unified abstraction.    |
| **Parsing is fragile**             | CLI output formats change between versions. No contract guarantees.                       |

### 1.3 Why Structured Output Matters

FlowMaster workflows require phases to produce structured outputs for:

- **Validation**: Orchestrator validates phase output matches expected schema
- **Context passing**: Phase outputs become inputs to subsequent phases
- **Type safety**: TypeScript should know the shape of phase outputs

**Example**: Planning phase must output `{ tasks: Task[], dependencies: Record<string, string[]> }` - not free-form markdown.

### 1.4 Why Tool Control Matters

For reliable orchestration, FlowMaster needs to:

- Intercept tool calls before execution
- Implement approval flows for dangerous operations
- Add logging/telemetry hooks
- Customize tool behavior per workflow

CLI subprocess makes this impossible - tools execute inside the CLI process.

---

## 2. Research: Open Source Implementations

### 2.1 Emdash (PTY Embedding)

**Location**: `examplecode/emdash`
**Approach**: Spawn CLI in pseudo-terminal (PTY), embed native TUI via xterm.js

**How it works**:

```
pty.spawn("claude") → Raw terminal bytes → xterm.js renders native UI
```

**Key findings**:

- Uses `node-pty` to spawn CLI processes
- Embeds full native terminal experience in Electron
- Activity detection via regex heuristics (busy/idle only)
- **No structured data extraction** - just terminal pass-through
- Injects prompts via stdin when agent is idle

**What Emdash knows about agent output**: Nothing structured. Only heuristics like "I see 'thinking...' so probably busy."

**Reference files**:

- `src/main/services/ptyManager.ts` - PTY spawning
- `src/renderer/terminal/TerminalSessionManager.ts` - xterm.js integration
- `src/main/services/activityClassifier.ts` - Regex-based activity detection

### 2.2 Cline (SDK + Own Tools)

**Location**: `examplecode/cline`
**Approach**: Direct SDK calls to providers, implements own tool system

**How it works**:

```
Provider SDK (Anthropic, OpenAI, etc.) → Streaming response → Parse tool calls → Execute own tools → Loop
```

**Key findings**:

- Uses official provider SDKs directly (`@anthropic-ai/sdk`, `openai`, `@google/genai`)
- Implements own tool handlers (read_file, write_file, execute_command, browser_action)
- Has provider-specific format converters for tool schemas
- Handles both native function calling AND XML-in-prompt fallback
- Full control over tool execution, approval flows, hooks

**Provider handlers** (`src/core/api/providers/`):

```
anthropic.ts, openai.ts, gemini.ts, bedrock.ts, vertex.ts,
azure.ts, groq.ts, openrouter.ts, ollama.ts, mistral.ts, deepseek.ts
```

**Tool handlers** (`src/core/task/tools/handlers/`):

```
ReadFileToolHandler.ts, WriteToFileToolHandler.ts,
ExecuteCommandToolHandler.ts, BrowserActionToolHandler.ts,
SearchFilesToolHandler.ts, ListDirectoryToolHandler.ts
```

**Stream normalization** (`src/core/api/transform/stream.ts`):

- Unified chunk types across providers
- `ApiStreamTextChunk`, `ApiStreamUsageChunk`, `ApiStreamToolCallsChunk`, `ApiStreamThinkingChunk`

**License**: Apache-2.0 (can use/modify freely)

### 2.3 Claude Code CLI

**Approach**: CLI with `--output-format stream-json` for structured JSONL events

**How it works**:

```bash
claude -p "prompt" --output-format stream-json
```

**Outputs JSONL events**:

```jsonl
{"type": "chunk", "content": "I'll implement..."}
{"type": "tool_use", "name": "Edit", "input": {...}}
{"type": "tool_result", "output": "..."}
{"type": "result", "cost": 0.05, "duration": 12.3, "is_error": false}
```

**Key findings**:

- Events are structured (JSONL)
- Response **content** is still free-form text (not schema-enforced)
- Tools execute inside CLI - cannot intercept
- Works with Claude Max subscription (no API key needed)
- Supports `--continue` and `--resume` for session management

**Limitation**: Cannot guarantee response content matches a schema. Only event structure is guaranteed.

---

## 3. Research: Vercel AI SDK

### 3.1 What is Vercel AI SDK?

Open-source TypeScript toolkit for building AI applications. Despite the name, **not tied to Vercel or Next.js**.

**Packages**:

- `ai` - Core SDK
- `@ai-sdk/anthropic` - Claude provider
- `@ai-sdk/openai` - OpenAI provider
- `@ai-sdk/google` - Gemini provider
- `@ai-sdk/groq`, `@ai-sdk/mistral`, `@ai-sdk/amazon-bedrock`, `@ai-sdk/azure`, etc.

**Runtime requirements**:

- Node.js 18+
- Works in Electron, Express, Fastify, standalone Node.js
- No Next.js or Vercel deployment required

### 3.2 Core Functions

| Function           | Description                                      |
| ------------------ | ------------------------------------------------ |
| `generateText()`   | Generate text (non-streaming)                    |
| `streamText()`     | Generate text with streaming                     |
| `generateObject()` | Generate structured JSON with schema enforcement |
| `streamObject()`   | Stream structured JSON                           |
| `tool()`           | Define a tool with Zod schema                    |

### 3.3 Structured Output (generateObject)

**Guarantees response matches Zod schema**:

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

// TypeScript knows exact shape - guaranteed valid
result.object.tasks.forEach((task) => console.log(task.name));
```

**How it works under the hood**:

- Anthropic: Constrained decoding / tool use
- OpenAI: `response_format: { type: 'json_schema' }`
- Google: Function calling with schema

Model is **constrained at token level** to only output valid JSON matching schema.

### 3.4 Tool System

**Define tools once, work with any provider**:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const readFile = tool({
  description: 'Read file contents',
  parameters: z.object({
    path: z.string(),
  }),
  execute: async ({ path }) => {
    return await fs.readFile(path, 'utf-8');
  },
});

// Same tool works with any provider
await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  tools: { readFile },
  prompt: '...',
});

await generateText({
  model: openai('gpt-4o'),
  tools: { readFile }, // Same tool definition
  prompt: '...',
});
```

**SDK handles**:

- Converting tool schema to provider-specific format
- Parsing tool calls from responses
- Passing tool results back to model
- Multi-step tool use loops

### 3.5 Streaming with Callbacks

```typescript
import { streamText } from 'ai';

const result = await streamText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  tools: { readFile, writeFile },
  maxSteps: 20,
  onStepFinish: async (step) => {
    // Called after each tool execution
    console.log('Step completed:', step);
  },
  prompt: '...',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### 3.6 Approval Gates (SDK 6 Beta)

```typescript
const writeFile = tool({
  description: 'Write to file',
  parameters: z.object({ path: z.string(), content: z.string() }),
  needsApproval: true, // Human-in-the-loop
  execute: async ({ path, content }) => {
    await fs.writeFile(path, content);
    return { success: true };
  },
});
```

### 3.7 Multi-Provider Support

First-party packages (30+):

| Provider    | Package                  |
| ----------- | ------------------------ |
| Anthropic   | `@ai-sdk/anthropic`      |
| OpenAI      | `@ai-sdk/openai`         |
| Google      | `@ai-sdk/google`         |
| Azure       | `@ai-sdk/azure`          |
| AWS Bedrock | `@ai-sdk/amazon-bedrock` |
| Groq        | `@ai-sdk/groq`           |
| Mistral     | `@ai-sdk/mistral`        |
| xAI         | `@ai-sdk/xai`            |
| DeepSeek    | `@ai-sdk/deepseek`       |

Community: Ollama, OpenRouter, LM Studio, Cloudflare, etc.

**Provider switching**:

```typescript
// Change one line to switch providers
const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'), // or openai('gpt-4o')
  prompt: '...',
});
```

### 3.8 What Vercel AI SDK Does NOT Provide

| Capability                             | Status           |
| -------------------------------------- | ---------------- |
| Tool implementations (read_file, etc.) | ❌ You implement |
| Session/conversation persistence       | ❌ You implement |
| Approval flow UI                       | ❌ You implement |
| Telemetry hooks                        | ❌ You implement |

**SDK provides the framework. You provide implementations.**

---

## 4. Research: Vercel AI SDK Session Management

### 4.1 Multi-Turn Conversations

SDK supports multi-turn via messages array:

```typescript
const messages: CoreMessage[] = [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi!' },
  { role: 'user', content: 'What did I say?' },
];

const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),
  messages,
});

// Append response
messages.push({ role: 'assistant', content: result.text });
```

### 4.2 What SDK Does NOT Handle

| Capability                   | Status                            |
| ---------------------------- | --------------------------------- |
| Session IDs                  | ❌ You generate                   |
| Persistence to disk/database | ❌ You implement                  |
| Session resumption           | ❌ You load messages              |
| Crash recovery               | ❌ You persist after each message |

**You manage the messages array. SDK just sends it to the model.**

### 4.3 Message Types (SDK 5+)

```typescript
// UIMessage - Full state for persistence
interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
  // metadata...
}

// ModelMessage - What gets sent to LLM
interface ModelMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | ContentPart[];
}
```

### 4.4 Open Source Examples

**vercel/ai-chatbot** (GitHub):

- Official Vercel template
- Uses Supabase PostgreSQL for persistence
- Next.js focused (web, not desktop)
- Shows session management patterns

**Key patterns from ai-chatbot**:

- Store UIMessages for persistence
- Derive ModelMessages for LLM calls
- Atomic message persistence after each response

---

## 5. Research: Tool Implementations (from Cline)

### 5.1 Available Tool Handlers

Cline's tool handlers (`src/core/task/tools/handlers/`):

| Handler                        | Lines | Description                        |
| ------------------------------ | ----- | ---------------------------------- |
| `ReadFileToolHandler.ts`       | ~200  | Read file with line ranges         |
| `WriteToFileToolHandler.ts`    | ~250  | Write/create files                 |
| `ExecuteCommandToolHandler.ts` | ~300  | Terminal command execution         |
| `BrowserActionToolHandler.ts`  | ~400  | Puppeteer-based browser automation |
| `SearchFilesToolHandler.ts`    | ~150  | Glob/grep file search              |
| `ListDirectoryToolHandler.ts`  | ~100  | Directory listing                  |

### 5.2 Cline's Tool Definition Pattern

```typescript
// From src/core/prompts/system-prompt/spec.ts
interface ClineToolSpec {
  id: string;
  name: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
}

// Provider-specific converters
toolSpecInputSchema(spec); // Anthropic format
toolSpecFunctionDefinition(spec); // OpenAI format
toolSpecFunctionDeclarations(spec); // Gemini format
```

### 5.3 Cline's Approval Flow

```typescript
// From tool handlers
if (requiresApproval) {
  const approved = await this.approvalHandler.request(toolCall);
  if (!approved) {
    return { error: 'User denied' };
  }
}
```

### 5.4 Adaptation Required for FlowMaster

Cline is a VS Code extension. To use in Node.js/Electron:

| VS Code Dependency    | Node.js Equivalent           |
| --------------------- | ---------------------------- |
| `vscode.workspace.fs` | `fs/promises`                |
| `vscode.window`       | Custom UI/events             |
| `vscode.Terminal`     | `child_process` / `node-pty` |

---

## 6. Comparison Summary

### 6.1 Approaches Compared

| Capability                  | Emdash (PTY) | Claude CLI  | Cline (SDK)           | Vercel AI SDK       |
| --------------------------- | ------------ | ----------- | --------------------- | ------------------- |
| Structured output guarantee | ❌           | ❌          | ❌ (but controllable) | ✅ `generateObject` |
| Multi-provider              | ❌           | ❌          | ✅ (manual)           | ✅ (unified)        |
| Tool control                | ❌           | ❌          | ✅                    | ✅                  |
| Tool implementations        | N/A          | CLI's       | ✅ Included           | ❌ You build        |
| Session management          | ✅ SQLite    | ✅ Built-in | ✅ VS Code            | ❌ You build        |
| Claude Max support          | ✅           | ✅          | ❌                    | ❌                  |
| Maintenance burden          | Low          | Low         | High (fork)           | Low (npm)           |

### 6.2 What Each Provides

**Emdash**: PTY embedding, native TUI, activity heuristics

**Claude CLI**: JSONL events, built-in session management, Claude Max support

**Cline**: Multi-provider SDKs, tool implementations, approval flows (VS Code specific)

**Vercel AI SDK**: Unified provider abstraction, guaranteed structured output, tool framework (no implementations)

---

## 7. Open Questions for Design (RESOLVED)

| Question                                | Resolution                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| How to get structured output guarantee? | Two-phase execution with `generateObject()`                                  |
| How to implement tools?                 | Build our own using Vercel AI SDK `tool()` helper, adapt patterns from Cline |
| How to manage sessions?                 | State Manager persists messages array, LLM Manager manages in-memory         |
| Which SDK/approach?                     | Vercel AI SDK - validated via prototype                                      |
| How to handle approvals?                | Tool Executor intercepts, routes to Agent Manager, waits for response        |
| How to support Claude Max users?        | Defer - API access is the primary path                                       |
| Tool Executor location?                 | New component (COMP-013) - separate from LLM Manager                         |

---

## 8. References

### Documentation

- Vercel AI SDK Docs: https://ai-sdk.dev/docs
- Vercel AI SDK GitHub: https://github.com/vercel/ai
- Claude Code CLI: https://docs.anthropic.com/claude-code

### Open Source Projects

- Cline: `examplecode/cline` (Apache-2.0)
- Emdash: `examplecode/emdash`
- Vercel AI Chatbot: https://github.com/vercel/ai-chatbot

### FlowMaster Architecture

- Architecture: `design/flowmaster/03-architecture/00-architecture.md`
- LLM Manager Requirements: `design/flowmaster/03-architecture/requirements/05-llm-manager.md`
- ADR-006 File-First Persistence: `design/flowmaster/03-architecture/decisions/006-file-first-persistence.md`

---

## Document History

| Version | Date       | Author            | Changes                                                            |
| ------- | ---------- | ----------------- | ------------------------------------------------------------------ |
| 1.0     | 2025-12-02 | Architecture Team | Initial research document                                          |
| 2.0     | 2025-12-02 | Architecture Team | Added prototype findings, two-phase pattern, implementation design |

---

# PART 2: IMPLEMENTATION DESIGN

Everything above this line was research. Everything below is the approved design based on prototype validation.

---

## 9. The Decision: Why SDK Over CLI

### 9.1 The Core Problem with CLI Subprocess

When FlowMaster uses CLI subprocess (spawning `claude`, `gemini`, etc.), we hit fundamental limitations:

**Problem 1: No Guaranteed Structured Output**

Workflows need phases to produce typed, validated outputs. For example, a "planning" phase must return:

```
{
  tasks: [{ name: string, priority: "high" | "medium" | "low" }],
  dependencies: { [taskId]: string[] }
}
```

CLI gives us free-form text. We can ask nicely in the prompt ("please output JSON"), but there's no guarantee. The model might:

- Output markdown instead
- Include extra commentary before/after JSON
- Miss required fields
- Use wrong types

This breaks the entire workflow because subsequent phases can't reliably consume the output.

**Problem 2: No Tool Control**

CLI tools (read, write, edit, bash) execute inside the CLI process. FlowMaster cannot:

- Intercept a tool call before it runs
- Ask user for approval on dangerous operations
- Add custom logging/telemetry
- Modify tool behavior per workflow

This means no approval flows, no audit trails, no customization.

**Problem 3: Retry Loses Everything**

If a CLI subprocess fails partway through, we must restart from scratch. The conversation history, tool results, reasoning - all lost. We waste tokens re-doing work and lose context that might have been valuable.

### 9.2 What SDK Gives Us

| Capability                  | CLI                           | SDK                               |
| --------------------------- | ----------------------------- | --------------------------------- |
| Structured output guarantee | ❌ Hope and pray              | ✅ Token-level schema enforcement |
| Tool interception           | ❌ Opaque                     | ✅ Full control                   |
| Approval flows              | ❌ Impossible                 | ✅ We decide when tools run       |
| Conversation persistence    | ❌ Lost on restart            | ✅ Messages array we own          |
| Multi-provider              | ❌ Different CLI per provider | ✅ Same code, swap provider       |
| Retry with context          | ❌ Start over                 | ✅ Resume from messages           |

### 9.3 The Trade-off

We lose:

- CLI's built-in tools (must implement our own)
- CLI's session management (must build our own)
- Claude Max support (requires API key)

We gain:

- Reliable workflows (structured output)
- Full control (tools, approvals, telemetry)
- Clean architecture (no hacky parsing)
- Better UX (real-time progress, approval flows)

**Verdict: The gains far outweigh the losses.**

---

## 10. Two-Phase Execution Pattern

### 10.1 The Challenge

Vercel AI SDK has two key functions:

- `generateText()` - Supports tools, but output is free-form text
- `generateObject()` - Guarantees schema, but doesn't support tools

We need BOTH: tools for exploration/work AND structured output for reliable workflows.

### 10.2 The Solution: Two Phases

Split agent execution into two phases:

**Phase 1: Agentic Work**

- Use `generateText()` with tools enabled
- Agent explores, reads files, runs commands, reasons
- Captures full conversation history (messages array)
- Output: Free-form text + conversation history

**Phase 2: Structured Extraction**

- Take conversation history from Phase 1
- Reduce it (remove large file contents, keep reasoning)
- Use `generateObject()` with required schema
- Output: Guaranteed structured object matching schema

### 10.3 Why This Works

Phase 1 lets the agent do real work with tools. The conversation history captures everything the agent learned and decided.

Phase 2 takes that knowledge and extracts it into a clean, typed structure. The model isn't doing new work - it's summarizing what it already figured out.

Because `generateObject()` uses constrained decoding (tokens are literally restricted to valid JSON), the output ALWAYS matches the schema. Not "usually" - always.

### 10.4 The Flow

```
Workflow says: "Run 'analyze' command, output must match AnalysisResult schema"
                                    ↓
                          Agent Manager spawns agent
                                    ↓
                    Context Manager builds prompt + context
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ LLM MANAGER: PHASE 1                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ generateText({                                                          │
│   model: provider,                                                      │
│   tools: { readFile, writeFile, runCommand, ... },                      │
│   maxSteps: 50,  // Allow multiple tool calls                           │
│   prompt: context                                                       │
│ })                                                                      │
│                                                                         │
│ Agent thinks: "I need to read the config file"                          │
│ Agent calls: readFile({ path: "config.ts" })                            │
│ Tool returns: "export const config = { ... }"                           │
│ Agent thinks: "Now I understand the structure, let me check routes"     │
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
│ LLM MANAGER: PHASE 2                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│ generateObject({                                                        │
│   model: provider,                                                      │
│   schema: AnalysisResult,  // Zod schema from workflow definition       │
│   messages: [                                                           │
│     ...reducedConversation,                                             │
│     { role: 'user', content: 'Provide your analysis as structured output' }
│   ]                                                                     │
│ })                                                                      │
│                                                                         │
│ Model extracts structured data from its reasoning                       │
│                                                                         │
│ Output: { summary: "...", findings: [...], recommendations: [...] }     │
│         ↑ GUARANTEED to match AnalysisResult schema                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                          Return typed result to Agent Manager
                                    ↓
                    Orchestrator receives validated phase output
                                    ↓
                          Next phase gets typed input
```

### 10.5 Conversation Reduction

Phase 1 can produce large conversation histories. If the agent read 10 files, each with hundreds of lines, the messages array might be huge.

Phase 2 doesn't need the raw file contents - it needs the agent's understanding of those files. The agent's reasoning (assistant messages) captures that understanding.

**Reduction strategy:**

- Keep: User messages, assistant reasoning
- Summarize: Tool calls (keep name + args, not full results)
- Remove: Large tool results (file contents, command output)

Example:

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

The model still understands what it analyzed - we just removed the bulk data it already processed.

### 10.6 Prototype Validation

We built a prototype to validate this pattern. Results:

| Test   | Tool Calls | Messages | Reduction | Schema Match |
| ------ | ---------- | -------- | --------- | ------------ |
| Test 1 | 1          | 3        | 9%        | ✅ Perfect   |
| Test 2 | 2          | 3        | 7%        | ✅ Perfect   |

Key findings:

- `generateObject()` accepts messages array - critical for this pattern
- Structured output is genuinely guaranteed, not "usually works"
- Token overhead is acceptable (~3,000 tokens for simple tasks)
- Reduction scales with file size (7-9% for small files, 60-80% expected for real codebases)

**The pattern works. It's not hacky. It's clean.**

---

## 11. Tool Implementation

### 11.1 What Tools We Need

FlowMaster agents need to interact with the environment:

| Tool            | Purpose                                           |
| --------------- | ------------------------------------------------- |
| `readFile`      | Read file contents                                |
| `writeFile`     | Write/create files                                |
| `editFile`      | Make targeted edits to existing files             |
| `listDirectory` | List files in a directory                         |
| `searchFiles`   | Glob/grep for files                               |
| `runCommand`    | Execute shell commands                            |
| `askUser`       | Request clarification from user (or parent agent) |

### 11.2 Tool Definition with Vercel AI SDK

Each tool is defined with:

- Description (for the model to understand when to use it)
- Parameters (Zod schema for validation)
- Execute function (what actually runs)

The SDK handles:

- Converting schemas to provider-specific format
- Parsing tool calls from model responses
- Passing results back to the model
- Looping until model is done

### 11.3 Why a Separate Tool Executor Component

We're adding COMP-013 Tool Executor as a new component rather than putting tools in LLM Manager. Why?

**Separation of concerns:**

- LLM Manager = "talk to AI models" (provider abstraction)
- Tool Executor = "execute tools safely" (tool management)

**Tool Executor responsibilities:**

- Register and manage tool definitions
- Execute tools when called
- Handle approval flows (route to Agent Manager)
- Add telemetry/logging
- Enforce sandboxing rules
- Manage tool timeouts

**LLM Manager responsibilities:**

- Provider abstraction (Anthropic, OpenAI, etc.)
- Two-phase execution orchestration
- Model selection and fallback
- Streaming responses

They change for different reasons. Tool definitions change when we add capabilities. Provider handling changes when SDKs update.

### 11.4 Approval Flow

Some tools are dangerous (writing files, running commands). We need user approval.

Flow:

```
Agent calls: writeFile({ path: "config.ts", content: "..." })
                                    ↓
                          Tool Executor receives call
                                    ↓
                    Tool Executor checks: "Does this tool need approval?"
                                    ↓
                          Yes → Route to Agent Manager
                                    ↓
                    Agent Manager routes up hierarchy
                    (Can parent agent approve? If not, ask user)
                                    ↓
                          User sees: "Agent wants to write config.ts"
                                    ↓
                          User approves/denies
                                    ↓
                          Response flows back to Tool Executor
                                    ↓
                    If approved → Execute tool, return result
                    If denied → Return error to model
```

This is why we needed the SDK approach - CLI subprocess can't do this.

### 11.5 Tool Configuration

Configuration Manager holds tool settings:

- Which tools are enabled per workflow
- Which tools require approval
- Sandboxing rules (which directories can be accessed)
- Timeout settings

LLM Manager passes these to Tool Executor when setting up agent execution.

---

## 12. Session Management

### 12.1 What is a Session?

A session is a conversation between an agent and the model. It includes:

- All messages (user, assistant, tool calls, tool results)
- Tool call history
- Token usage
- Start/end times

Sessions enable:

- Retry without losing context (just replay messages)
- Crash recovery (persist messages, resume)
- Multi-turn interactions (continue previous conversation)
- Debugging (inspect what happened)

### 12.2 Where Sessions Live

**In-memory (LLM Manager):**

- Active session during execution
- Messages array being built
- Not persisted yet

**On-disk (State Manager):**

- Completed sessions
- Sessions at checkpoints
- Available for resume/replay

### 12.3 Session Lifecycle

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
Phase 1 complete → Messages array captured
    ↓
Checkpoint? → State Manager persists messages
    ↓
Phase 2 begins
    ↓
Reduced messages + extraction prompt
    ↓
Model responds with structured output
    ↓
Session complete → Full session persisted
```

### 12.4 Crash Recovery

If FlowMaster crashes mid-execution:

1. State Manager has persisted messages up to last checkpoint
2. On restart, load messages from disk
3. Resume from where we left off
4. No need to redo completed work

This is only possible because we OWN the messages array. CLI subprocess gives us nothing to persist.

### 12.5 Session Data Structure

What we persist for each session:

```
Session {
  id: unique identifier
  agentId: which agent this belongs to
  phaseId: which workflow phase
  status: in_progress | completed | failed
  messages: [
    { role, content, timestamp, ... }
  ]
  toolCalls: [
    { toolName, args, result, duration, ... }
  ]
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  structuredOutput?: the Phase 2 result if applicable
  startedAt: timestamp
  completedAt?: timestamp
  error?: if failed
}
```

---

## 13. UI Experience Improvements

### 13.1 Why SDK Enables Better UX

With CLI subprocess, UI can only show:

- "Agent is running..." (no details)
- Final output (after everything completes)

With SDK, UI can show:

- Real-time streaming of agent reasoning
- Each tool call as it happens
- Approval prompts when needed
- Progress through multi-step operations
- Structured results with proper formatting

### 13.2 Real-Time Updates

SDK provides callbacks:

- `onStepFinish` - Called after each tool execution
- `onChunk` - Called for each text chunk (streaming)

We can wire these to Message Manager to emit events:

```
AGENT_THINKING → "Reading config file..."
TOOL_CALL → { tool: "readFile", args: { path: "config.ts" } }
TOOL_RESULT → { success: true, size: 1234 }
AGENT_THINKING → "Found JWT auth setup..."
```

UI subscribes to these events and renders in real-time.

### 13.3 Approval Prompts

When a tool needs approval:

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

This is a fundamental UX improvement that CLI subprocess cannot provide.

### 13.4 Structured Output Display

Phase outputs are typed. UI can render them intelligently:

Instead of showing raw JSON, UI can show:

- Task lists with checkboxes
- Dependency graphs
- Priority badges
- Progress indicators

Because we KNOW the shape, we can build specialized renderers.

---

## 14. Architecture Changes Required

### 14.1 New Component: Tool Executor (COMP-013)

**Responsibilities:**

- Tool registry (register, lookup, list)
- Tool execution with timeout
- Approval flow routing
- Telemetry hooks
- Sandboxing enforcement

**Interfaces:**

- Receives tool calls from LLM Manager
- Routes approvals through Agent Manager
- Emits events through Message Manager
- Reads config from Configuration Manager

### 14.2 LLM Manager Changes

Current design assumed CLI subprocess. New design:

- Use Vercel AI SDK providers
- Implement two-phase execution
- Manage in-memory sessions
- Stream events to Message Manager
- Integrate with Tool Executor for tool calls

Key new responsibilities:

- Provider initialization and management
- Two-phase orchestration
- Conversation reduction
- Model selection and fallback

### 14.3 Configuration Manager Additions

New configuration needed:

- Output schemas (Zod schemas for workflow phases)
- Tool configurations (which tools, approval rules, sandboxing)
- Provider settings (API keys, model preferences)

### 14.4 State Manager Additions

New data to persist:

- Session messages arrays
- Tool call history
- Structured outputs

### 14.5 Integration Points

```
Orchestrator
    ↓ "Execute phase with output schema X"
Agent Manager
    ↓ "Spawn agent for this phase"
    ↓ Requests context from Context Manager
    ↓ Calls LLM Manager with context + schema
LLM Manager
    ↓ Phase 1: generateText with tools
    ↓ Tool calls route to Tool Executor
Tool Executor
    ↓ Executes tool or requests approval
    ↓ Approval routes to Agent Manager → User
    ↓ Returns result to LLM Manager
LLM Manager
    ↓ Continues until Phase 1 complete
    ↓ Reduces conversation
    ↓ Phase 2: generateObject with schema
    ↓ Returns structured result
Agent Manager
    ↓ Receives typed result
    ↓ Persists session via State Manager
Orchestrator
    ↓ Receives validated phase output
    ↓ Passes to next phase
```

---

## 15. What You Need to Figure Out

This section is for the implementer. These are the open design questions that need solutions.

### 15.1 Tool Executor Design

Questions to answer:

- How does Tool Executor register tools? Static list? Dynamic discovery?
- How does tool timeout work? Cancel the model call or just the tool?
- How do we handle tools that need user input (not just approval)?
- Should tools have categories (read-only, write, dangerous)?
- How does sandboxing work for file operations? Allowlist of paths?

### 15.2 Conversation Reduction Strategy

Questions to answer:

- What's the best reduction algorithm? Keep assistant messages, summarize tools?
- Should reduction be configurable per workflow?
- What if reduced conversation is still too large? Token budget?
- Should we use a smaller/faster model for Phase 2 extraction?
- How do we handle media (images, binary data) in tool results?

### 15.3 Session Persistence

Questions to answer:

- When do we checkpoint sessions? After each tool call? Each step?
- How do we handle large sessions? Compression? Pagination?
- Session expiry? When can we clean up old sessions?
- How does resume work? Full replay or smart resume?

### 15.4 Provider Fallback

Questions to answer:

- If Anthropic fails, do we retry with OpenAI?
- Do we re-run Phase 1 with new provider or just Phase 2?
- How do we handle provider-specific tool format differences?
- Rate limiting - how do we detect and handle it?

### 15.5 Error Handling

Questions to answer:

- What if Phase 1 completes but Phase 2 fails schema validation?
- What if a tool fails? Retry? Skip? Fail the whole phase?
- How do we surface errors to the user meaningfully?
- How do we handle model refusals (safety filters)?

### 15.6 Testing Strategy

Questions to answer:

- How do we test without making real API calls?
- Mock providers? Recorded responses?
- How do we test tool interactions?
- How do we test the two-phase pattern end-to-end?

---

## 16. Implementation Priority

Suggested order for implementation:

**Phase 1: Core SDK Integration**

1. Set up Vercel AI SDK with one provider (Anthropic)
2. Implement basic `generateText()` call without tools
3. Implement `generateObject()` for structured output
4. Prove two-phase pattern works in isolation

**Phase 2: Tool System**

1. Create Tool Executor component skeleton
2. Implement basic tools (readFile, listDirectory)
3. Wire tools to LLM Manager
4. Test multi-step tool execution

**Phase 3: Session Management**

1. Define session data structure
2. Implement in-memory session tracking
3. Add State Manager persistence
4. Test crash recovery

**Phase 4: Approval Flows**

1. Add approval requirement to tools
2. Implement Agent Manager routing
3. Wire to UI for user prompts
4. Test approval/deny flows

**Phase 5: Production Hardening**

1. Add provider fallback
2. Implement conversation reduction optimization
3. Add telemetry throughout
4. Error handling and edge cases

---

## 17. Success Criteria

How do we know the implementation is complete?

| Criterion               | How to Verify                                        |
| ----------------------- | ---------------------------------------------------- |
| Structured output works | Phase produces typed object matching workflow schema |
| Tools execute correctly | Agent can read/write files, run commands             |
| Approval flow works     | Dangerous operations prompt user, respect decision   |
| Sessions persist        | Crash and resume without losing progress             |
| Multi-provider works    | Switch from Anthropic to OpenAI, same behavior       |
| UI shows progress       | Real-time updates during agent execution             |
| Retry preserves context | Retry doesn't re-do completed tool calls             |

---

## 18. Reference Implementation

A working prototype exists at: `prototypes/sdk-two-phase/`

This prototype demonstrates:

- Two-phase execution pattern
- Tool definition and execution
- Conversation reduction
- Structured output extraction

Use it as reference when implementing the full solution.

Prototype findings documented at: `prototypes/sdk-two-phase/FINDINGS.md`
