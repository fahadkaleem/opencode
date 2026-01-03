---
paths:
  - src/features/**/api/**/*.ts
  - "!src/features/**/api/**/*.test.ts"
---

# Feature API Guidelines

> Rules for creating AI agents, tools, and schemas using Vercel AI SDK. Read this when implementing files in `api/` folders.

---

## Context

The API layer handles all AI communication using Vercel AI SDK v6. Agents define behavior, tools provide capabilities, schemas enforce structure. Consistent patterns enable copy-paste to production Electron app and parallel development by multiple agents.

---

## File Structure

```
features/[feature]/api/
├── agents/
│   └── [agent-name]-agent.ts   # Agent definition
├── tools/
│   ├── [tool-name]-tool.ts     # Individual tool
│   └── index.ts                # Tool exports
├── schemas/
│   └── index.ts                # Feature schemas
└── index.ts                    # Public API exports

lib/ai/
├── providers.ts                # Model provider configuration
├── config.ts                   # Shared AI configuration
└── schemas/
    └── index.ts                # Shared schemas
```

---

## Code Order

1. Imports (AI SDK, Zod, utilities, types)
2. Types (config type, input type, output type)
3. Constants (default prompts, config values)
4. Definition (agent/tool/schema)
5. Exports (named only)

---

## Naming

### Files

| Item | Convention | Example |
|------|------------|---------|
| Agent file | kebab-case + `-agent.ts` | `chat-agent.ts` |
| Tool file | kebab-case + `-tool.ts` | `search-web-tool.ts` |
| Schema file | `index.ts` in schemas/ | `schemas/index.ts` |

### Agents

| Item | Convention | Example |
|------|------------|---------|
| Agent function | camelCase + `Agent` | `chatAgent` |
| Stream version | camelCase + `AgentStream` | `chatAgentStream` |
| Config type | `[Agent]Config` | `ChatAgentConfig` |
| Input type | `[Agent]Input` | `ChatAgentInput` |
| Output type | `[Agent]Output` | `ChatAgentOutput` |

### Tools

| Item | Convention | Example |
|------|------------|---------|
| Tool const | camelCase + `Tool` | `searchWebTool` |
| Input schema | camelCase + `InputSchema` | `searchToolInputSchema` |
| Input type | `[Tool]Input` | `SearchToolInput` |
| Output type | `[Tool]Output` | `SearchToolOutput` |

### Schemas

| Item | Convention | Example |
|------|------------|---------|
| Schema const | camelCase + `Schema` | `messageSchema` |
| Inferred type | PascalCase | `Message` (from `z.infer`) |

---

<rules>

## Do

- One agent/tool per file
- Use Zod for all schemas with `.describe()` on fields
- Type all inputs, outputs, and configs explicitly
- Provide both sync (`generateText`) and stream (`streamText`) versions for agents
- Include JSDoc with `@example` for exported functions
- Colocate AI code with its feature in `api/` folder
- Use `getModel()` from providers for model selection

## Don't

- Multiple agents/tools in one file → Split into separate files
- Default exports → Use named exports only
- Hardcode model names → Use `getModel()` from providers
- Swallow errors in tools → Throw with descriptive message or return typed error
- Skip input validation → Always use Zod schemas

## When

- WHEN creating agent → Provide both sync and stream functions
- WHEN tool needs external API → Handle errors gracefully, return typed result
- WHEN schema is shared across features → Place in `lib/ai/schemas/`
- WHEN schema is feature-specific → Place in `features/[feature]/api/schemas/`
- WHEN agent needs tools → Import from `../tools/` barrel

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
npm run test -- [name]-agent    # Run agent tests
```

---

<example>

## Complete Example

A research agent with web search tool and message schema. Demonstrates: code order, naming, typing, sync/stream versions, tool integration, Zod schemas.

```typescript
// ============================================================
// FILE: src/features/research/api/agents/research-agent.ts
// Demonstrates: All API guidelines for agents
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { generateText, streamText } from 'ai';                  // Rule: AI SDK first
import { z } from 'zod';                                        // Rule: Zod for schemas

import { getModel } from '@/lib/ai/providers';                  // Rule: Use getModel()

import { searchWebTool } from '../tools';                       // Rule: Import from barrel
import type { Message } from '../schemas';                      // Rule: Feature schemas

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
type ResearchAgentConfig = {                                    // Rule: [Agent]Config naming
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

type ResearchAgentInput = {                                     // Rule: [Agent]Input naming
  query: string;
  history?: Message[];
};

type ResearchAgentOutput = {                                    // Rule: [Agent]Output naming
  text: string;
  sources: Array<{ title: string; url: string }>;
  toolCalls: Array<{ name: string; args: unknown; result: unknown }>;
};

// ------------------------------------------------------------
// 3. CONSTANTS
// ------------------------------------------------------------
const DEFAULT_SYSTEM_PROMPT = `You are a research assistant.
Search the web to find accurate, up-to-date information.
Always cite your sources.`;

const DEFAULT_CONFIG: Required<ResearchAgentConfig> = {
  model: 'claude-sonnet-4-20250514',
  temperature: 0.3,
  maxTokens: 4096,
};

// ------------------------------------------------------------
// 4. AGENT
// ------------------------------------------------------------
/**
 * Research agent that searches the web for information
 *
 * @param input - Research query and conversation history
 * @param config - Optional configuration overrides
 * @returns Research results with sources
 *
 * @example                                                     // Rule: JSDoc with @example
 * ```typescript
 * const result = await researchAgent({
 *   query: 'Latest developments in quantum computing',
 * });
 * console.log(result.text, result.sources);
 * ```
 */
async function researchAgent(                                   // Rule: camelCase + Agent
  input: ResearchAgentInput,
  config: ResearchAgentConfig = {}
): Promise<ResearchAgentOutput> {                               // Rule: Explicit return type
  const { query, history = [] } = input;
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const result = await generateText({
    model: getModel(mergedConfig.model),                        // Rule: Use getModel()
    system: DEFAULT_SYSTEM_PROMPT,
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: query },
    ],
    temperature: mergedConfig.temperature,
    maxTokens: mergedConfig.maxTokens,
    tools: { searchWeb: searchWebTool },
    maxSteps: 5,
  });

  const toolCalls = result.steps
    .flatMap((step) => step.toolCalls ?? [])
    .map((tc) => ({ name: tc.toolName, args: tc.args, result: tc.result }));

  const sources = toolCalls
    .filter((tc) => tc.name === 'searchWeb')
    .flatMap((tc) => (tc.result as { results: Array<{ title: string; url: string }> })?.results ?? []);

  return { text: result.text, sources, toolCalls };
}

/**
 * Streaming version of research agent
 *
 * @example
 * ```typescript
 * const stream = await researchAgentStream({ query: 'AI trends 2025' });
 * for await (const chunk of stream.textStream) {
 *   process.stdout.write(chunk);
 * }
 * ```
 */
async function researchAgentStream(                             // Rule: Provide stream version
  input: ResearchAgentInput,
  config: ResearchAgentConfig = {}
) {
  const { query, history = [] } = input;
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return streamText({
    model: getModel(mergedConfig.model),
    system: DEFAULT_SYSTEM_PROMPT,
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: query },
    ],
    temperature: mergedConfig.temperature,
    maxTokens: mergedConfig.maxTokens,
    tools: { searchWeb: searchWebTool },
    maxSteps: 5,
  });
}

// ------------------------------------------------------------
// 5. EXPORTS
// ------------------------------------------------------------
export { researchAgent, researchAgentStream };                  // Rule: Named exports only
export type { ResearchAgentConfig, ResearchAgentInput, ResearchAgentOutput };
```

```typescript
// ============================================================
// FILE: src/features/research/api/tools/search-web-tool.ts
// Demonstrates: All API guidelines for tools
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { tool } from 'ai';                                      // Rule: AI SDK tool helper
import { z } from 'zod';                                        // Rule: Zod for schemas

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
type SearchWebToolInput = z.infer<typeof searchWebToolInputSchema>;

type SearchWebToolOutput = {                                    // Rule: [Tool]Output naming
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
};

// ------------------------------------------------------------
// 3. CONSTANTS
// ------------------------------------------------------------
const searchWebToolInputSchema = z.object({                     // Rule: Zod schema with .describe()
  query: z.string().describe('Search query to find information'),
  maxResults: z.number().default(5).describe('Maximum results to return'),
});

// ------------------------------------------------------------
// 4. TOOL
// ------------------------------------------------------------
/**
 * Web search tool for finding information online
 *
 * @example
 * ```typescript
 * tools: { searchWeb: searchWebTool }
 * ```
 */
const searchWebTool = tool({                                    // Rule: camelCase + Tool
  description: 'Search the web for current information on any topic',
  parameters: searchWebToolInputSchema,
  execute: async ({ query, maxResults }): Promise<SearchWebToolOutput> => {
    try {
      const response = await fetch(
        `https://api.search.example/search?q=${encodeURIComponent(query)}&limit=${maxResults}`
      );

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);  // Rule: Throw with message
      }

      const data = await response.json();
      return {
        query,
        results: data.results.map((r: { title: string; url: string; snippet: string }) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
        })),
      };
    } catch (error) {
      throw new Error(                                          // Rule: Don't swallow errors
        `Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});

// ------------------------------------------------------------
// 5. EXPORTS
// ------------------------------------------------------------
export { searchWebTool, searchWebToolInputSchema };             // Rule: Named exports only
export type { SearchWebToolInput, SearchWebToolOutput };
```

```typescript
// ============================================================
// FILE: src/features/research/api/schemas/index.ts
// Demonstrates: All API guidelines for schemas
// ============================================================

import { z } from 'zod';                                        // Rule: Zod for schemas

// ------------------------------------------------------------
// MESSAGE SCHEMA
// ------------------------------------------------------------
const messageSchema = z.object({
  id: z.string().describe('Unique message identifier'),
  role: z.enum(['user', 'assistant']).describe('Message sender role'),
  content: z.string().describe('Message text content'),
  createdAt: z.date().describe('Message creation timestamp'),
});

type Message = z.infer<typeof messageSchema>;                   // Rule: Infer type from schema

// ------------------------------------------------------------
// RESEARCH RESULT SCHEMA
// ------------------------------------------------------------
const researchResultSchema = z.object({
  query: z.string().describe('Original search query'),
  summary: z.string().describe('AI-generated summary'),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    snippet: z.string(),
  })).describe('Source references'),
  confidence: z.number().min(0).max(1).describe('Confidence score'),
});

type ResearchResult = z.infer<typeof researchResultSchema>;

// ------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------
export { messageSchema, researchResultSchema };                 // Rule: Named exports only
export type { Message, ResearchResult };
```

```typescript
// ============================================================
// FILE: src/features/research/api/index.ts
// Demonstrates: Feature API barrel exports
// ============================================================

// Agents
export { researchAgent, researchAgentStream } from './agents/research-agent';
export type {
  ResearchAgentConfig,
  ResearchAgentInput,
  ResearchAgentOutput,
} from './agents/research-agent';

// Tools
export { searchWebTool } from './tools';
export type { SearchWebToolInput, SearchWebToolOutput } from './tools';

// Schemas
export { messageSchema, researchResultSchema } from './schemas';
export type { Message, ResearchResult } from './schemas';
```

</example>
