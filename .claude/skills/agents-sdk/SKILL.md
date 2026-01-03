---
name: agents-sdk
description:
  Build production-ready AI agents with the Claude Agent SDK. Use for creating
  custom AI coding agents, business automation agents, interactive
  conversational systems, integrating Claude with external tools via MCP,
  session management, and programmatic agent control with TypeScript or Python.
---

# Claude Agent SDK Skill

Build production-ready AI agents using the official Claude Agent SDK (formerly
Claude Code SDK).

## Overview

The Claude Agent SDK provides the same agent harness that powers Claude Code
CLI, with automatic context management, rich tool ecosystem, advanced
permissions, and production-ready error handling.

## When to Use

- Building custom AI agents (coding, security review, SRE, business workflows)
- Creating programmatic interfaces to Claude with full tool access
- Integrating Claude with custom tools, databases, and APIs via MCP
- Managing multi-turn conversations with session persistence
- Implementing fine-grained permission control over agent capabilities
- Creating interactive agents with streaming responses and interruptions

## Quick Start

**Installation:**

```bash
# TypeScript
npm install @anthropic-ai/claude-agent-sdk

# Python
pip install claude-agent-sdk
```

**Authentication:**

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Basic Usage (TypeScript):**

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

for await (const message of query({
  prompt: 'Analyze the authentication system in this codebase',
  options: {
    model: 'claude-sonnet-4-5',
    allowedTools: ['Read', 'Grep', 'Glob'],
    maxTurns: 10,
  },
})) {
  if (message.type === 'result') {
    console.log(message.result);
    console.log(`Cost: $${message.total_cost_usd}`);
  }
}
```

**Basic Usage (Python):**

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Analyze the authentication system in this codebase",
    options=ClaudeAgentOptions(
        model="claude-sonnet-4-5",
        allowed_tools=["Read", "Grep", "Glob"],
        max_turns=10
    )
):
    if message.type == "result":
        print(message.result)
```

## Common Patterns

### 1. Code Review Agent

```typescript
const systemPrompt = `You are an expert code reviewer.
Review code for quality, performance, security, and best practices.`;

for await (const message of query({
  prompt: 'Review the changes in this pull request',
  options: {
    systemPrompt,
    allowedTools: ['Read', 'Grep', 'Glob', 'Bash'],
    permissionMode: 'plan', // Read-only
    maxTurns: 10,
  },
})) {
  if (message.type === 'result') console.log(message.result);
}
```

### 2. Session Management

```typescript
// Capture session ID
let sessionId: string;

for await (const message of query({
  /* ... */
})) {
  if (message.type === 'system' && message.subtype === 'init') {
    sessionId = message.session_id;
  }
}

// Resume later
for await (const message of query({
  prompt: 'Continue implementing authentication',
  options: { resume: sessionId },
})) {
  console.log(message);
}

// Fork to try alternative approach
for await (const message of query({
  prompt: 'Use OAuth instead',
  options: { resume: sessionId, forkSession: true },
})) {
  console.log(message);
}
```

### 3. Custom Tools via MCP

```typescript
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const customServer = createSdkMcpServer({
  name: 'my-tools',
  version: '1.0.0',
  tools: [
    tool(
      'get_weather',
      'Get current weather for a location',
      { location: z.string(), units: z.enum(['celsius', 'fahrenheit']) },
      async (args) => {
        const data = await fetchWeather(args.location, args.units);
        return {
          content: [{ type: 'text', text: `Temp: ${data.temp}°` }],
        };
      },
    ),
  ],
});

// Use with streaming input (required for MCP)
async function* messages() {
  yield { type: 'user', message: { role: 'user', content: 'Weather in SF?' } };
}

for await (const msg of query({
  prompt: messages(),
  options: {
    mcpServers: { 'my-tools': customServer },
    allowedTools: ['mcp__my-tools__get_weather'],
  },
})) {
  console.log(msg);
}
```

## Key Concepts

**Input Modes:**

- **Streaming** (recommended): Full capabilities - images, interruptions, hooks
- **Single Message**: Simpler one-shot queries

**Permission Modes:**

- `"default"` - Standard permission checks
- `"acceptEdits"` - Auto-accept file edits
- `"bypassPermissions"` - Skip all checks (CI/CD)
- `"plan"` - Read-only mode

**Session Forking:** Create conversation branches without modifying the original

**MCP Tool Format:** `mcp__{server_name}__{tool_name}`

**Settings Sources:** `["user", "project", "local"]` - Load CLAUDE.md with
`settingSources: ["project"]`

## Reference Documentation

See `./references/` for comprehensive guides:

- [agents-sdk-overview.md](./references/agents-sdk-overview.md) - SDK
  architecture and capabilities
- [claude-agents-sdk.md](./references/claude-agents-sdk.md) - Complete API
  reference
- [session-management.md](./references/session-management.md) - Session
  resumption and forking
- [custom-tools.md](./references/custom-tools.md) - Creating MCP tools with
  examples
- [streaming.md](./references/streaming.md) - Input modes comparison
- [handling-permissions.md](./references/handling-permissions.md) - Permission
  system details
- [mcp-in-sdk.md](./references/mcp-in-sdk.md) - MCP integration patterns
- [modifying-system-prompt.md](./references/modifying-system-prompt.md) - System
  prompt configuration
- [subagents.md](./references/subagents.md) - Launching specialized agents
- [message-examples.md](./references/message-examples.md) - Message format
  examples

## External Resources

- [TypeScript SDK GitHub](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Python SDK GitHub](https://github.com/anthropics/claude-agent-sdk-python)
- [Claude Code Documentation](https://code.claude.com/docs)
- [MCP Documentation](https://modelcontextprotocol.io)

## Quick Tips

- **Always capture session IDs** for resumption and forking
- **Use streaming mode** for full capabilities
- **Specific tool allowlists** improve security and reduce costs
- **Monitor costs:** Check `message.total_cost_usd` in result messages
- **MCP requires streaming:** Custom tools only work with async generator input
- **Flush in serverless:** `await langfuseSpanProcessor.forceFlush()` before
  exit
