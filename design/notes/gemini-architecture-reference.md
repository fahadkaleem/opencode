# Gemini CLI Architecture Reference

> **Document Version**: 1.0
> **Date**: 2025-12-02
> **Status**: Phase 1 Complete
> **Purpose**: Reference guide for modeling FlowMaster after Gemini CLI patterns

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Package Structure](#2-package-structure)
3. [Agent System](#3-agent-system)
4. [Tool System](#4-tool-system)
5. [Core/LLM System](#5-corellm-system)
6. [Configuration Management](#6-configuration-management)
7. [Message Bus & Policy Engine](#7-message-bus--policy-engine)
8. [Telemetry](#8-telemetry)
9. [Services](#9-services)
10. [Hooks System](#10-hooks-system)
11. [Key Architectural Patterns](#11-key-architectural-patterns)
12. [FlowMaster Component Mapping](#12-flowmaster-component-mapping)
13. [What FlowMaster Adopts vs Skips](#13-what-flowmaster-adopts-vs-skips)
14. [FlowMaster's Unique Additions](#14-flowmasters-unique-additions)

---

## 1. Executive Summary

### 1.1 What is Gemini CLI?

Gemini CLI is Google's production AI coding assistant with:

- ~131,000 lines of TypeScript across ~403 files in core
- ~634 files in the CLI package
- Battle-tested architecture for agent-based AI tool execution

### 1.2 Key Architectural Insights

| Pattern         | Gemini Approach                                  | FlowMaster Adoption       |
| --------------- | ------------------------------------------------ | ------------------------- |
| Agent/LLM/Tools | **Unified** in AgentExecutor                     | ✅ Adopt as Agent Runtime |
| Tool Definition | Declarative with validation/execution separation | ✅ Adopt                  |
| Configuration   | God object with DI + lazy init                   | ⚠️ Adapt (use proper DI)  |
| Message Bus     | Pub-sub + request-response with policy           | ✅ Adopt                  |
| Telemetry       | Direct function calls, OpenTelemetry             | ✅ Adopt                  |
| Streaming       | Multi-level async generators                     | ✅ Adopt                  |

### 1.3 Core Insight

```
Gemini CLI = AgentExecutor + Tools + LLM + Config + MessageBus + Telemetry + UI

FlowMaster = Gemini Core
           + Orchestration (workflows, phases, state machines)
           + Agent Hierarchy (clarification routing)
           + State Persistence (crash recovery)
           + Structured Output (two-phase with Vercel AI SDK)
           + Multi-Provider (not just Gemini)
           + Web UI
```

---

## 2. Package Structure

### 2.1 Monorepo Layout

```
packages/
├── core/                      # Business logic (~131K LOC)
│   └── src/
│       ├── agents/            # Agent execution (executor, registry)
│       ├── tools/             # Tool definitions (49 files)
│       ├── core/              # LLM client, streaming, turns
│       ├── config/            # Configuration management
│       ├── confirmation-bus/  # MessageBus for pub-sub
│       ├── telemetry/         # Observability (42 files)
│       ├── services/          # Reusable services
│       ├── hooks/             # Lifecycle hooks
│       ├── policy/            # Policy engine
│       ├── safety/            # Safety checks
│       ├── routing/           # Model routing
│       ├── mcp/               # MCP protocol
│       ├── ide/               # IDE integration
│       └── utils/             # Utilities (106+ files)
├── cli/                       # CLI interface (React + Ink)
│   └── src/
│       ├── commands/          # CLI commands
│       ├── ui/                # React components (120+)
│       ├── hooks/             # React hooks (102+)
│       ├── contexts/          # React contexts (20+)
│       └── services/          # CLI-specific services
└── test-utils/                # Shared testing utilities
```

### 2.2 Key Design Decision: Two-Layer Separation

| Layer            | Package                   | Contains                           |
| ---------------- | ------------------------- | ---------------------------------- |
| **Core**         | `@google/gemini-cli-core` | Business logic, agents, tools, LLM |
| **Presentation** | `@google/gemini-cli`      | CLI interface, React/Ink UI        |

**FlowMaster Adoption**: Same pattern with `packages/core` and `packages/cli` + `packages/web`

---

## 3. Agent System

### 3.1 File Structure

```
agents/
├── types.ts                 # Core interfaces (AgentDefinition, OutputConfig, etc.)
├── executor.ts              # AgentExecutor - main orchestration loop
├── registry.ts              # AgentRegistry - agent discovery/registration
├── invocation.ts            # SubagentInvocation - wraps agent as tool result
├── subagent-tool-wrapper.ts # Exposes agents as DeclarativeTool
├── schema-utils.ts          # InputConfig → JSON Schema conversion
├── utils.ts                 # Template string utilities
└── codebase-investigator.ts # Example: built-in agent
```

### 3.2 AgentExecutor Pattern (CRITICAL)

**This is the most important pattern to adopt.**

```typescript
class AgentExecutor<TOutput> {
  // OWNS EVERYTHING
  private toolRegistry: ToolRegistry; // Tools are internal
  private chat: GeminiChat; // LLM client is internal
  private compressionService: ChatCompressionService;

  // Lifecycle
  static async create(definition, config, onActivity): Promise<AgentExecutor>;
  async run(inputs, signal): Promise<OutputObject>;
}
```

**Key Responsibilities**:

1. **Tool isolation** - Each agent gets isolated ToolRegistry copy
2. **History management** - Manages GeminiChat, compresses when needed
3. **Timeout handling** - Dual signals (external cancel + internal timeout)
4. **Graceful degradation** - 1-minute grace period on timeout
5. **Completion protocol** - Mandatory `complete_task` tool with Zod validation
6. **Activity streaming** - Emits events to callbacks

### 3.3 Agent Definition (Declarative)

Agents are **pure configuration**, not classes:

```typescript
interface AgentDefinition<TOutput extends z.ZodTypeAny> {
  name: string;
  description: string;

  promptConfig: {
    systemPrompt?: string; // Supports ${variable} templating
    initialMessages?: Content[]; // Few-shot examples
    query?: string; // Task description
  };

  modelConfig: {
    model: string;
    temp: number;
    top_p: number;
    thinkingBudget?: number;
  };

  runConfig: {
    max_time_minutes: number;
    max_turns?: number;
  };

  toolConfig?: {
    tools: Array<string | FunctionDeclaration | AnyDeclarativeTool>;
  };

  inputConfig: {
    inputs: Record<
      string,
      {
        description: string;
        type: 'string' | 'number' | 'boolean' | 'string[]';
        required: boolean;
      }
    >;
  };

  outputConfig?: {
    outputName: string;
    description: string;
    schema: TOutput; // Zod schema for validation
  };
}
```

### 3.4 Agent Execution Flow

```
AgentExecutor.create(definition, config, onActivity)
    ↓
1. Validate tools exist in registry
2. Create isolated ToolRegistry copy
3. Create GeminiChat with system prompt
    ↓
AgentExecutor.run(inputs, signal)
    ↓
4. Template inputs into prompts
5. For each turn:
   ├─ Compress history if needed
   ├─ Call LLM via GeminiChat.sendMessageStream()
   ├─ Extract tool calls from response
   ├─ For each tool call:
   │  ├─ If 'complete_task': validate output with Zod → done
   │  └─ Else: execute tool → add result to history
   └─ Check termination (timeout, max_turns)
6. On timeout: attempt graceful recovery (1 min grace)
7. Return OutputObject { result, terminate_reason }
```

### 3.5 Termination Modes

```typescript
enum AgentTerminateMode {
  GOAL = 'GOAL', // Success via complete_task
  TIMEOUT = 'TIMEOUT', // Time limit reached
  MAX_TURNS = 'MAX_TURNS', // Turn limit reached
  ABORTED = 'ABORTED', // External cancellation
  ERROR = 'ERROR', // Execution error
  ERROR_NO_COMPLETE_TASK_CALL = 'ERROR_NO_COMPLETE_TASK_CALL', // No completion
}
```

### 3.6 Agent Nesting (Subagents)

Agents can call other agents via `SubagentToolWrapper`:

```typescript
// Wraps an agent as a DeclarativeTool
class SubagentToolWrapper extends BaseDeclarativeTool {
  build(params): ToolInvocation {
    return new SubagentInvocation(this.agentDefinition, params, ...);
  }
}

// Result: Agents can be nested arbitrarily deep
Parent Agent → calls → Child Agent (as tool) → calls → Grandchild Agent
```

---

## 4. Tool System

### 4.1 File Structure

```
tools/
├── tools.ts                 # Base classes (DeclarativeTool, ToolInvocation)
├── tool-registry.ts         # Registration and discovery
├── tool-error.ts            # Error types
├── tool-names.ts            # Centralized name constants
│
├── read-file.ts             # File reading
├── write-file.ts            # File writing
├── edit.ts                  # Text replacement
├── smart-edit.ts            # Smart editing
├── glob.ts                  # File pattern matching
├── grep.ts / ripGrep.ts     # Content search
├── ls.ts                    # Directory listing
├── shell.ts                 # Command execution
├── web-fetch.ts             # Web fetching
├── web-search.ts            # Web search
├── memoryTool.ts            # State persistence
├── write-todos.ts           # Todo management
│
├── mcp-tool.ts              # MCP tool wrapper
├── mcp-client.ts            # MCP client
└── modifiable-tool.ts       # Inline modification support
```

### 4.2 DeclarativeTool Pattern (CRITICAL)

**Separation of validation from execution:**

```typescript
// Base interface
interface ToolBuilder<TParams, TResult> {
  name: string;
  displayName: string;
  description: string;
  kind: Kind; // Read, Edit, Execute, Search, Fetch, Think
  schema: FunctionDeclaration; // For LLM

  build(params: TParams): ToolInvocation<TParams, TResult>;
}

// Abstract base class
abstract class DeclarativeTool<TParams, TResult> implements ToolBuilder {
  // Schema generation
  get schema(): FunctionDeclaration {
    return {
      name: this.name,
      description: this.description,
      parametersJsonSchema: this.parameterSchema,
    };
  }

  // Two-phase: validate then create invocation
  abstract build(params: TParams): ToolInvocation<TParams, TResult>;

  // Convenience: build + execute in one call
  async buildAndExecute(params, signal, updateOutput?): Promise<TResult> {
    const invocation = this.build(params);
    return invocation.execute(signal, updateOutput);
  }
}
```

### 4.3 ToolInvocation Pattern

```typescript
interface ToolInvocation<TParams, TResult> {
  params: TParams; // Validated parameters

  getDescription(): string; // Human-readable summary
  toolLocations(): ToolLocation[]; // Files affected

  // Pre-execution approval check
  shouldConfirmExecute(signal): Promise<ToolCallConfirmationDetails | false>;

  // Actual execution
  execute(signal, updateOutput?, config?): Promise<TResult>;
}
```

### 4.4 Tool Execution States

```
PENDING → VALIDATING → CONFIRMATION_REQUESTED → EXECUTING → COMPLETED
              ↓                    ↓                 ↓
           FAILED              CANCELLED          FAILED
```

### 4.5 ToolRegistry

```typescript
class ToolRegistry {
  private allKnownTools: Map<string, AnyDeclarativeTool>;

  // Registration
  registerTool(tool: AnyDeclarativeTool): void;

  // Discovery
  async discoverAllTools(): Promise<void>; // From MCP servers, etc.

  // Retrieval
  getTool(name: string): AnyDeclarativeTool | undefined;
  getAllTools(): AnyDeclarativeTool[];
  getFunctionDeclarations(): FunctionDeclaration[]; // For LLM

  // Filtering
  private isActiveTool(tool, excludeTools): boolean;
}
```

### 4.6 Tool Result Structure

```typescript
interface ToolResult {
  llmContent: string; // Content for LLM context
  returnDisplay: string; // Human-readable output
  error?: {
    message: string;
    type: ToolErrorType;
  };
}

enum ToolErrorType {
  INVALID_TOOL_PARAMS = 'invalid_tool_params',
  FILE_NOT_FOUND = 'file_not_found',
  PERMISSION_DENIED = 'permission_denied',
  PATH_NOT_IN_WORKSPACE = 'path_not_in_workspace',
  EXECUTION_FAILED = 'execution_failed',
  NO_SPACE_LEFT = 'no_space_left', // Fatal
}
```

### 4.7 Built-in Tool Categories

| Category       | Tools                        | Kind    |
| -------------- | ---------------------------- | ------- |
| **File Read**  | read-file, read-many-files   | Read    |
| **File Write** | write-file, edit, smart-edit | Edit    |
| **Search**     | glob, grep, ripgrep, ls      | Search  |
| **Execution**  | shell                        | Execute |
| **Web**        | web-fetch, web-search        | Fetch   |
| **Utility**    | memory, write-todos          | Think   |

---

## 5. Core/LLM System

### 5.1 File Structure

```
core/
├── client.ts                # High-level GeminiClient
├── geminiChat.ts            # Chat session management
├── contentGenerator.ts      # LLM API abstraction
├── loggingContentGenerator.ts  # Telemetry decorator
├── turn.ts                  # Single conversation turn
├── coreToolScheduler.ts     # Tool execution scheduling
├── prompts.ts               # System prompt templates
├── logger.ts                # Session logging
└── tokenLimits.ts           # Token constants
```

### 5.2 Layered Architecture

```
┌─────────────────────────────────────────┐
│         GeminiClient (high-level)       │  Orchestrates everything
├─────────────────────────────────────────┤
│    GeminiChat (conversation session)    │  Manages history & streaming
├─────────────────────────────────────────┤
│  LoggingContentGenerator (decorator)    │  Telemetry wrapper
├─────────────────────────────────────────┤
│    ContentGenerator (interface)         │  Abstract LLM API
├─────────────────────────────────────────┤
│  GoogleGenAI SDK / Other backends       │  Actual API calls
└─────────────────────────────────────────┘
```

### 5.3 ContentGenerator Interface

```typescript
interface ContentGenerator {
  generateContent(request, userPromptId): Promise<GenerateContentResponse>;
  generateContentStream(request, userPromptId): Promise<AsyncGenerator<Response>>;
  countTokens(request): Promise<CountTokensResponse>;
  embedContent(request): Promise<EmbedContentResponse>;
}
```

### 5.4 Multi-Level Streaming

**Level 1: API Stream**

```typescript
// Raw chunks from LLM API
generateContentStream(): AsyncGenerator<GenerateContentResponse>
```

**Level 2: Stream Events (GeminiChat)**

```typescript
enum StreamEventType {
  CHUNK = 'chunk', // Regular content
  RETRY = 'retry', // Before retry attempt
}
```

**Level 3: Typed Events (Turn)**

```typescript
enum GeminiEventType {
  Content = 'content',
  ToolCallRequest = 'tool_call_request',
  ToolCallResponse = 'tool_call_response',
  ToolCallConfirmation = 'tool_call_confirmation',
  Thought = 'thought',
  Finished = 'finished',
  Error = 'error',
  // ...more
}
```

### 5.5 Retry Strategy

```typescript
// Retry conditions
- Empty responses
- Missing finish reason
- Malformed function calls

// Retry behavior
- Max 2 attempts (1 initial + 1 retry)
- 500ms base delay with backoff
- Temperature bumped to 1 on retry
- Rate limit (429) triggers model fallback
```

### 5.6 History Management

```typescript
// Two versions maintained
- Comprehensive: All turns including invalid outputs
- Curated: Only valid turns (used in requests)

// Compression
- ChatCompressionService compresses when approaching token limits
- Preserves recent turns, summarizes older ones
```

---

## 6. Configuration Management

### 6.1 File Structure

```
config/
├── config.ts           # Main Config class (1,560 lines)
├── storage.ts          # File-based persistence
├── constants.ts        # Default filtering options
├── defaultModelConfigs.ts  # Model defaults
└── models.ts           # Model definitions
```

### 6.2 Config Pattern: God Object + DI

```typescript
class Config {
  // Injected via constructor
  constructor(params: ConfigParameters) { ... }

  // Lazy initialization
  async initialize(): Promise<void> {
    this.toolRegistry = new ToolRegistry(this);
    this.messageBus = new MessageBus(this.policyEngine);
    // ...more
  }

  // Getter pattern
  getModel(): string;
  getTelemetryEnabled(): boolean;
  getTargetDir(): string;

  // Services (lazy-loaded)
  getToolRegistry(): ToolRegistry;
  getMessageBus(): MessageBus;
  getFileSystemService(): FileSystemService;
}
```

### 6.3 Storage Locations

```
~/.gemini/                    # Global
├── settings.json             # User settings
├── credentials/              # API keys
└── bin/                      # CLI binaries

.gemini/                      # Project
├── settings.json             # Project settings
├── GEMINI.md                 # Project context
└── hooks/                    # Project hooks
```

**FlowMaster Adaptation**: Use proper DI container instead of god object, but keep lazy initialization pattern.

---

## 7. Message Bus & Policy Engine

### 7.1 File Structure

```
confirmation-bus/
├── message-bus.ts    # Core pub-sub + request-response
├── types.ts          # Message type definitions
└── index.ts          # Exports

policy/
├── policy-engine.ts  # Rule matching
├── types.ts          # Policy types
├── config.ts         # Policy loading
├── toml-loader.ts    # TOML parsing
└── stable-stringify.ts  # Deterministic JSON
```

### 7.2 MessageBus Pattern

```typescript
class MessageBus extends EventEmitter {
  constructor(private policyEngine: PolicyEngine) {}

  // Pub-sub
  publish(message: Message): Promise<void>;
  subscribe<T>(type: T['type'], listener: (msg: T) => void): void;
  unsubscribe<T>(type: T['type'], listener: (msg: T) => void): void;

  // Request-response with correlation
  async request<TReq, TRes>(
    request: TReq,
    responseType: TRes['type'],
    timeoutMs?: number
  ): Promise<TRes>;
}
```

### 7.3 Message Types

```typescript
enum MessageBusType {
  TOOL_CONFIRMATION_REQUEST = 'tool_confirmation_request',
  TOOL_CONFIRMATION_RESPONSE = 'tool_confirmation_response',
  TOOL_POLICY_REJECTION = 'tool_policy_rejection',
  TOOL_EXECUTION_SUCCESS = 'tool_execution_success',
  TOOL_EXECUTION_FAILURE = 'tool_execution_failure',
  UPDATE_POLICY = 'update_policy',
  HOOK_EXECUTION_REQUEST = 'hook_execution_request',
  HOOK_EXECUTION_RESPONSE = 'hook_execution_response',
  HOOK_POLICY_DECISION = 'hook_policy_decision',
}
```

### 7.4 Policy Engine

```typescript
enum PolicyDecision {
  ALLOW = 'allow', // Auto-proceed
  DENY = 'deny', // Reject
  ASK_USER = 'ask_user', // Prompt user
}

interface PolicyRule {
  toolName?: string; // Exact or wildcard (e.g., "server__*")
  argsPattern?: RegExp; // Regex on args
  decision: PolicyDecision;
  priority?: number; // Higher = matches first
}
```

### 7.5 Confirmation Flow

```
Tool calls build() → Tool calls shouldConfirmExecute()
                          ↓
              MessageBus.publish(TOOL_CONFIRMATION_REQUEST)
                          ↓
              PolicyEngine.check(toolCall)
                          ↓
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
       ALLOW            DENY           ASK_USER
         ↓                ↓                ↓
     Execute         Throw Error      Prompt User
                                          ↓
                                    User Decision
                                          ↓
                               Execute or Cancel
```

---

## 8. Telemetry

### 8.1 File Structure

```
telemetry/
├── index.ts              # Main exports
├── sdk.ts                # OpenTelemetry SDK init
├── loggers.ts            # Event logging functions
├── metrics.ts            # Metrics collection
├── trace.ts              # Distributed tracing
├── activity-monitor.ts   # Activity tracking
├── memory-monitor.ts     # Memory monitoring
├── sanitize.ts           # Data sanitization
├── rate-limiter.ts       # Rate limiting
├── clearcut-logger/      # Google Clearcut integration
└── gcp-exporters.ts      # GCP export
```

### 8.2 Pattern: Direct Function Calls

**NOT event-driven** - telemetry uses direct function calls:

```typescript
// Event logging
logCliConfiguration();
logUserPrompt();
logToolCall();
logApiRequest();
logApiResponse();
logApiError();
logConversationFinishedEvent();

// Metrics
recordToolCallMetrics();
recordTokenUsageMetrics();
recordApiResponseMetrics();
recordMemoryUsage();
recordCpuUsage();
```

### 8.3 Export Targets

```typescript
enum TelemetryTarget {
  GCP = 'gcp', // Google Cloud
  LOCAL = 'local', // Local OTLP endpoint
}
```

### 8.4 OpenTelemetry Integration

- Uses OpenTelemetry semantic conventions
- GenAI-specific attributes
- Span status codes
- Multi-target export strategy

---

## 9. Services

### 9.1 Service Catalog

| Service                    | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| **ModelConfigService**     | Model alias resolution, config inheritance |
| **FileDiscoveryService**   | File searching with gitignore support      |
| **FileSystemService**      | Abstraction over fs operations             |
| **GitService**             | Git operations, commit history             |
| **ShellExecutionService**  | Shell command execution with PTY           |
| **ChatCompressionService** | Message history compression                |
| **ChatRecordingService**   | Recording/replaying conversations          |
| **LoopDetectionService**   | Detect infinite execution loops            |

### 9.2 Pattern: Single Responsibility

Each service:

- Focused responsibility
- Injected into Config
- Provides sync/async operations
- Independently testable
- Uses composition, not inheritance

---

## 10. Hooks System

### 10.1 File Structure

```
hooks/
├── hookSystem.ts       # Main orchestrator
├── hookRegistry.ts     # Hook registration
├── hookRunner.ts       # Executes hook commands
├── hookAggregator.ts   # Combines results
├── hookPlanner.ts      # Determines which hooks run
├── hookEventHandler.ts # Event firing
├── hookTranslator.ts   # Format conversion
└── types.ts            # Type definitions (603 lines!)
```

### 10.2 Hook Event Types

```typescript
enum HookEventType {
  BeforeTool,
  AfterTool,
  BeforeAgent,
  AfterAgent,
  SessionStart,
  SessionEnd,
  PreCompress,
  BeforeModel,
  AfterModel,
  BeforeToolSelection,
  Notification,
}
```

### 10.3 Hook Sources (Priority Order)

```typescript
type HookSource = 'project' | 'user' | 'system' | 'extension';
```

### 10.4 Hook Configuration

```typescript
interface HookDefinition {
  matcher?: string; // Event filter pattern
  sequential?: boolean; // Serial vs parallel
  hooks: HookConfig[]; // Actual hooks
}

interface CommandHookConfig {
  type: HookType.Command;
  command: string; // Shell command
  timeout?: number;
}
```

---

## 11. Key Architectural Patterns

### 11.1 Pattern Summary

| Pattern                    | Where Used              | Description                          |
| -------------------------- | ----------------------- | ------------------------------------ |
| **Unified Executor**       | AgentExecutor           | Agent owns LLM + Tools + History     |
| **Declarative Definition** | Tools, Agents           | Config objects, not classes          |
| **Two-Phase Execution**    | Tools                   | Validate (build) → Execute (execute) |
| **Decorator**              | LoggingContentGenerator | Wraps for telemetry                  |
| **Async Generator**        | Streaming               | Multi-level event streams            |
| **Request-Response**       | MessageBus              | Correlation IDs for pairing          |
| **Policy Engine**          | Confirmations           | Rule-based decisions                 |
| **Lazy Init**              | Config                  | Expensive resources on-demand        |
| **Service Objects**        | FileSystem, Git         | Single responsibility                |

### 11.2 Data Flow

```
User Input
    ↓
AgentExecutor.run()
    ↓
GeminiChat.sendMessageStream()
    ↓
ContentGenerator.generateContentStream()
    ↓
Gemini API (streaming)
    ↓
Parse response → Extract tool calls
    ↓
ToolRegistry.getTool(name)
    ↓
Tool.build(params) → Validate
    ↓
MessageBus → PolicyEngine → Approval
    ↓
ToolInvocation.execute()
    ↓
Tool results → Back to chat history
    ↓
Continue until complete_task
    ↓
Validate output with Zod
    ↓
Return typed result
```

---

## 12. FlowMaster Component Mapping

### 12.1 Direct Mappings

| Gemini                             | FlowMaster                   | Notes                     |
| ---------------------------------- | ---------------------------- | ------------------------- |
| AgentExecutor + GeminiChat + Tools | **Agent Runtime**            | Unified component         |
| Config                             | **Configuration Manager**    | Adapt: use proper DI      |
| MessageBus                         | **Message Manager**          | Same pattern              |
| PolicyEngine                       | **Configuration Manager**    | Merge into config         |
| Telemetry                          | **Telemetry**                | Same pattern              |
| ToolRegistry                       | **Agent Runtime** (internal) | Part of unified component |
| Services                           | **Various**                  | Adapt as needed           |

### 12.2 FlowMaster Additions (Not in Gemini)

| Component                 | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| **Orchestrator**          | Workflow state machines, phase coordination   |
| **State Manager**         | Persistent state, crash recovery              |
| **Context Manager**       | Build context from multiple sources           |
| **Task Manager**          | External task systems (Jira, Linear)          |
| **Gateway**               | BFF for Web UI                                |
| **Agent Hierarchy**       | Workflow → Phase → Command agents             |
| **Clarification Routing** | Child asks parent before user                 |
| **Two-Phase Output**      | generateText → generateObject (Vercel AI SDK) |

---

## 13. What FlowMaster Adopts vs Skips

### 13.1 ADOPT (Use Same Pattern)

| Module              | Gemini Pattern                         | FlowMaster Implementation |
| ------------------- | -------------------------------------- | ------------------------- |
| `/agents`           | AgentExecutor, declarative definitions | Agent Runtime executor    |
| `/tools`            | DeclarativeTool, ToolRegistry          | Agent Runtime tools       |
| `/confirmation-bus` | MessageBus with correlation IDs        | Message Manager           |
| `/telemetry`        | Direct function calls, OpenTelemetry   | Telemetry                 |
| `/services`         | Single responsibility services         | Various services          |

### 13.2 ADAPT (Modify for Our Needs)

| Module    | Gemini Pattern      | FlowMaster Adaptation          |
| --------- | ------------------- | ------------------------------ |
| `/config` | God object with DI  | Proper DI container            |
| `/core`   | Gemini-specific LLM | Vercel AI SDK (multi-provider) |
| `/hooks`  | Lifecycle hooks     | Simpler version initially      |
| `/policy` | TOML-based policies | Configuration-based            |

### 13.3 SKIP (Not Needed)

| Module         | Reason                       |
| -------------- | ---------------------------- |
| `/mcp`         | Future consideration         |
| `/ide`         | Not building IDE extension   |
| `/code_assist` | Google-specific OAuth        |
| `/routing`     | We use Vercel AI SDK routing |
| `/safety`      | Different safety approach    |

---

## 14. FlowMaster's Unique Additions

### 14.1 Orchestration Layer

```typescript
// Gemini: Single agent execution
AgentExecutor.run(inputs, signal)

// FlowMaster: Workflow → Phase → Command hierarchy
Orchestrator.executeWorkflow(workflowDef, taskId)
  → For each phase:
      → AgentRuntime.executePhase(phaseDef, context)
        → For each command:
            → AgentRuntime.executeCommand(commandDef, context)
```

### 14.2 State Persistence

```typescript
// Gemini: In-memory only
// FlowMaster: Persistent state for crash recovery

StateManager.checkpoint(taskId, {
  phase: currentPhase,
  step: currentStep,
  outputs: phaseOutputs,
  agentSessions: sessions,
});

// On crash recovery:
StateManager.loadCheckpoint(taskId)
  → Resume from last successful step
```

### 14.3 Agent Hierarchy with Clarification

```typescript
// Gemini: Flat agent structure
// FlowMaster: Hierarchical with routing

Command Agent has question
    → Ask Phase Agent (parent)
        → Phase Agent knows? → Answer
        → Doesn't know? → Ask Workflow Agent
            → Workflow Agent knows? → Answer
            → Doesn't know? → Ask User
```

### 14.4 Two-Phase Structured Output

```typescript
// Gemini: complete_task tool with Zod validation
// FlowMaster: Two-phase with Vercel AI SDK

// Phase 1: Agentic work
const result = await generateText({
  model: provider,
  tools: { readFile, writeFile, ... },
  maxSteps: 50,
  prompt: context,
});

// Phase 2: Structured extraction
const structured = await generateObject({
  model: provider,
  schema: outputSchema,
  messages: reduceConversation(result.messages),
});
// GUARANTEED schema compliance
```

### 14.5 Multi-Provider Support

```typescript
// Gemini: Google Gemini only
// FlowMaster: Via Vercel AI SDK

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

// Same code works with any provider
const result = await generateText({
  model: anthropic('claude-sonnet-4-5-20250514'),  // or google('gemini-2.0-flash')
  ...
});
```

---

## Summary: FlowMaster Architecture

Based on Gemini CLI patterns + our unique needs:

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLOWMASTER ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ User         │  │ Gateway      │  │ Message Manager      │  │
│  │ Interface    │──│ (BFF)        │  │ (pub-sub + req-res)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                │                                       │
│         └────────────────┼───────────────────────────────────┐  │
│                          ↓                                   │  │
│  ┌───────────────────────────────────────────────────────┐  │  │
│  │                    ORCHESTRATOR                        │  │  │
│  │  (Workflow state machines, phase coordination)         │  │  │
│  └────────────────────────┬──────────────────────────────┘  │  │
│                           ↓                                  │  │
│  ┌───────────────────────────────────────────────────────┐  │  │
│  │                   AGENT RUNTIME                        │◄─┘  │
│  │  (Unified: Agents + LLM + Tools + Hierarchy)           │     │
│  │                                                        │     │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │     │
│  │  │ Executor     │  │ Tool         │  │ LLM Client  │  │     │
│  │  │ (two-phase)  │  │ Registry     │  │ (Vercel SDK)│  │     │
│  │  └──────────────┘  └──────────────┘  └─────────────┘  │     │
│  └────────────────────────┬──────────────────────────────┘     │
│                           ↓                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Context      │  │ State        │  │ Configuration        │  │
│  │ Manager      │  │ Manager      │  │ Manager              │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ Task         │  │ Telemetry    │                             │
│  │ Manager      │  │              │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

10 Components (down from 12):
1. Message Manager
2. Configuration Manager
3. State Manager
4. Telemetry
5. Context Manager
6. Task Manager
7. Agent Runtime (unified)
8. Orchestrator
9. User Interface
10. Gateway
```

---

## Document History

| Version | Date       | Author            | Changes                        |
| ------- | ---------- | ----------------- | ------------------------------ |
| 1.0     | 2025-12-02 | Architecture Team | Initial comprehensive research |

---

## References

### Gemini CLI Source Files

**Agents:**

- `/examplecode/gemini/packages/core/src/agents/executor.ts`
- `/examplecode/gemini/packages/core/src/agents/types.ts`
- `/examplecode/gemini/packages/core/src/agents/registry.ts`

**Tools:**

- `/examplecode/gemini/packages/core/src/tools/tools.ts`
- `/examplecode/gemini/packages/core/src/tools/tool-registry.ts`
- `/examplecode/gemini/packages/core/src/tools/read-file.ts`

**Core:**

- `/examplecode/gemini/packages/core/src/core/geminiChat.ts`
- `/examplecode/gemini/packages/core/src/core/contentGenerator.ts`
- `/examplecode/gemini/packages/core/src/core/turn.ts`

**Supporting:**

- `/examplecode/gemini/packages/core/src/config/config.ts`
- `/examplecode/gemini/packages/core/src/confirmation-bus/message-bus.ts`
- `/examplecode/gemini/packages/core/src/telemetry/index.ts`
