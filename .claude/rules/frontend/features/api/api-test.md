---
paths: src/features/**/api/**/*.test.ts
---

# Feature API Test Guidelines

> Rules for testing AI agents, tools, and schemas. Read this when implementing tests for API layer code.

---

## Context

API tests verify agent behavior, tool execution, and schema validation without making real API calls. Mocking the Vercel AI SDK ensures fast, reliable tests. Testing both success and error paths prevents runtime failures in production.

---

## File Structure

```
api/
├── agents/
│   ├── [name]-agent.ts
│   └── [name]-agent.test.ts    <- Agent tests
├── tools/
│   ├── [name]-tool.ts
│   └── [name]-tool.test.ts     <- Tool tests
└── schemas/
    └── index.ts
```

---

## Code Order

1. Imports (vitest, mocks, module under test)
2. Mocks (vi.mock for Vercel AI SDK)
3. Mock data (MOCK_RESPONSE, MOCK_STREAM_CHUNKS)
4. Tests (describe blocks)

---

## Test Categories

### Agent Tests

| Category | Required | What to Test |
|----------|----------|--------------|
| `sync execution` | ALWAYS | Returns expected response |
| `stream execution` | IF has stream | Yields chunks correctly |
| `error handling` | ALWAYS | Handles API errors gracefully |
| `tool calls` | IF uses tools | Invokes tools, processes results |

### Tool Tests

| Category | Required | What to Test |
|----------|----------|--------------|
| `parameter validation` | ALWAYS | Zod schema rejects invalid input |
| `execution` | ALWAYS | Returns expected output |
| `error handling` | ALWAYS | Handles errors gracefully |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| Agent test file | `[name]-agent.test.ts` | `chat-agent.test.ts` |
| Tool test file | `[name]-tool.test.ts` | `search-tool.test.ts` |
| Root describe | function name | `describe('chatAgent', ...)` |
| Category describe | lowercase | `describe('sync execution', ...)` |
| Mock response | MOCK_* | `MOCK_RESPONSE`, `MOCK_STREAM_CHUNKS` |
| Mock data | SCREAMING_SNAKE_CASE | `MOCK_MESSAGES`, `MOCK_TOOL_INPUT` |

---

<rules>

## Do

- Mock Vercel AI SDK at module level with `vi.mock`
- Use AAA pattern with comments in every test
- Test both sync and stream versions of agents
- Test schema validation with invalid inputs
- Reset mocks in `beforeEach` with `vi.clearAllMocks()`
- Use `vi.fn()` for mock implementations

## Don't

- Make real API calls in tests → Mock the SDK
- Test Vercel AI SDK internals → Test your agent/tool behavior
- Skip error handling tests → Test API errors and validation errors
- Hardcode API responses inline → Use MOCK_* constants

## When

- WHEN agent has tools → Test tool invocation flow
- WHEN agent streams → Test chunk handling and accumulation
- WHEN tool has Zod schema → Test validation accepts valid, rejects invalid
- WHEN error occurs → Test error is handled/propagated correctly
- WHEN agent uses system prompt → Verify it's passed to SDK

</rules>

---

## Validation

```bash
npm run test -- [name]-agent    # Run agent tests
npm run test -- [name]-tool     # Run tool tests
npm run check-types             # Verify types
```

---

<example>

## Complete Example: Chat Agent and Search Tool Tests

Test file demonstrating agent sync/stream testing, tool validation testing, mocking patterns, error handling, AAA pattern, all test categories.

```ts
// ============================================================
// FILE: src/features/chat/api/agents/chat-agent.test.ts
// Demonstrates: All API test guidelines for agents (Vercel AI SDK v6)
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest';              // Rule: Vitest imports
import { generateText, streamText } from 'ai';

import { chatAgent, chatAgentStream } from './chat-agent';
import { searchTool, searchToolSchema } from '../tools/search-tool';

// ------------------------------------------------------------
// 2. MOCKS
// ------------------------------------------------------------
vi.mock('ai', () => ({                                                       // Rule: Mock SDK at module level
  generateText: vi.fn(),
  streamText: vi.fn(),
  tool: vi.fn((config) => config),                                           // Pass through tool config
}));

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(() => 'mocked-anthropic-model'),
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mocked-openai-model'),
}));

// ------------------------------------------------------------
// 3. MOCK DATA
// ------------------------------------------------------------
const MOCK_MESSAGES = [                                                     // Rule: SCREAMING_SNAKE_CASE for mock data
  { role: 'user' as const, content: 'Hello' },
];

const MOCK_RESPONSE = {                                                     // Rule: MOCK_* for responses
  text: 'Hello! How can I help you today?',
  finishReason: 'stop' as const,
  usage: { promptTokens: 10, completionTokens: 20 },
  toolCalls: [],
  toolResults: [],
};

const MOCK_TOOL_CALL_RESPONSE = {
  text: '',
  finishReason: 'tool-calls' as const,
  toolCalls: [
    {
      toolCallId: 'call_1',
      toolName: 'search',
      args: { query: 'weather today' },
    },
  ],
  toolResults: [],
};

const MOCK_STREAM_CHUNKS = [
  { type: 'text-delta', textDelta: 'Hello' },
  { type: 'text-delta', textDelta: '!' },
  { type: 'text-delta', textDelta: ' How can I help?' },
  { type: 'finish', finishReason: 'stop' },
];

// ------------------------------------------------------------
// 4. TESTS
// ------------------------------------------------------------
describe('chatAgent', () => {                                               // Rule: function name as root describe
  beforeEach(() => {
    vi.clearAllMocks();                                                     // Rule: Reset mocks in beforeEach
  });

  // --------------------------------------------------------------------------
  // sync execution
  // --------------------------------------------------------------------------
  describe('sync execution', () => {                                        // Rule: lowercase category
    it('should return assistant response', async () => {                    // Rule: should [verb] [outcome]
      // Arrange
      vi.mocked(generateText).mockResolvedValue(MOCK_RESPONSE);             // Rule: vi.fn() for mocks

      // Act
      const result = await chatAgent({ messages: MOCK_MESSAGES });

      // Assert
      expect(result.text).toBe('Hello! How can I help you today?');
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: MOCK_MESSAGES,
          model: expect.anything(),
        })
      );
    });

    it('should pass system prompt to SDK', async () => {
      // Arrange
      vi.mocked(generateText).mockResolvedValue(MOCK_RESPONSE);
      const systemPrompt = 'You are a helpful assistant';

      // Act
      await chatAgent({ messages: MOCK_MESSAGES, system: systemPrompt });

      // Assert
      expect(generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          system: systemPrompt,
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // stream execution
  // --------------------------------------------------------------------------
  describe('stream execution', () => {                                      // Rule: Test stream version
    it('should yield text chunks', async () => {
      // Arrange
      const mockTextStream = (async function* () {
        for (const chunk of MOCK_STREAM_CHUNKS) {
          yield chunk;
        }
      })();
      vi.mocked(streamText).mockResolvedValue({
        textStream: mockTextStream,
        fullStream: mockTextStream,
        text: Promise.resolve('Hello! How can I help?'),
      } as any);

      // Act
      const chunks: string[] = [];
      for await (const chunk of chatAgentStream({ messages: MOCK_MESSAGES })) {
        if (chunk.type === 'text-delta') {
          chunks.push(chunk.textDelta);
        }
      }

      // Assert
      expect(chunks).toContain('Hello');
      expect(chunks).toContain('!');
    });

    it('should handle stream interruption gracefully', async () => {
      // Arrange
      const mockTextStream = (async function* () {
        yield MOCK_STREAM_CHUNKS[0];
        throw new Error('Stream interrupted');
      })();
      vi.mocked(streamText).mockResolvedValue({
        fullStream: mockTextStream,
      } as any);

      // Act & Assert
      await expect(async () => {
        for await (const _ of chatAgentStream({ messages: MOCK_MESSAGES })) {
          // consume stream
        }
      }).rejects.toThrow('Stream interrupted');
    });
  });

  // --------------------------------------------------------------------------
  // tool calls
  // --------------------------------------------------------------------------
  describe('tool calls', () => {                                            // Rule: Test tool invocation
    it('should invoke tool when agent requests it', async () => {
      // Arrange
      vi.mocked(generateText)
        .mockResolvedValueOnce(MOCK_TOOL_CALL_RESPONSE as any)
        .mockResolvedValueOnce(MOCK_RESPONSE);

      // Act
      const result = await chatAgent({
        messages: MOCK_MESSAGES,
        tools: { search: searchTool },
      });

      // Assert
      expect(generateText).toHaveBeenCalledTimes(2);                        // Initial + after tool
      expect(result.text).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // error handling
  // --------------------------------------------------------------------------
  describe('error handling', () => {                                        // Rule: Test error paths
    it('should throw on API error', async () => {
      // Arrange
      vi.mocked(generateText).mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      // Act & Assert
      await expect(
        chatAgent({ messages: MOCK_MESSAGES })
      ).rejects.toThrow('API rate limit exceeded');
    });

    it('should handle network errors', async () => {
      // Arrange
      vi.mocked(generateText).mockRejectedValue(
        new Error('Network request failed')
      );

      // Act & Assert
      await expect(
        chatAgent({ messages: MOCK_MESSAGES })
      ).rejects.toThrow('Network request failed');
    });
  });
});

// ============================================================
// Tool Tests (can be in same file or separate)
// ============================================================
describe('searchTool', () => {
  // --------------------------------------------------------------------------
  // parameter validation
  // --------------------------------------------------------------------------
  describe('parameter validation', () => {                                  // Rule: Test Zod schema
    it('should accept valid parameters', () => {
      // Arrange
      const params = { query: 'test query', limit: 10 };

      // Act
      const result = searchToolSchema.safeParse(params);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should use default limit when not provided', () => {
      // Arrange
      const params = { query: 'test query' };

      // Act
      const result = searchToolSchema.safeParse(params);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);                                  // Default value
      }
    });

    it('should reject missing query', () => {
      // Arrange
      const params = { limit: 10 };

      // Act
      const result = searchToolSchema.safeParse(params);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject invalid limit type', () => {
      // Arrange
      const params = { query: 'test', limit: 'ten' };

      // Act
      const result = searchToolSchema.safeParse(params);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      // Arrange
      const params = { query: 'test', limit: -1 };

      // Act
      const result = searchToolSchema.safeParse(params);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // execution
  // --------------------------------------------------------------------------
  describe('execution', () => {
    it('should return search results', async () => {
      // Arrange
      const params = { query: 'test query', limit: 5 };

      // Act
      const result = await searchTool.execute(params);

      // Assert
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBeLessThanOrEqual(5);
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const params = { query: 'test query', limit: 2 };

      // Act
      const result = await searchTool.execute(params);

      // Assert
      expect(result.results.length).toBeLessThanOrEqual(2);
    });
  });

  // --------------------------------------------------------------------------
  // error handling
  // --------------------------------------------------------------------------
  describe('error handling', () => {
    it('should return empty results for empty query', async () => {
      // Arrange
      const params = { query: '', limit: 5 };

      // Act
      const result = await searchTool.execute(params);

      // Assert
      expect(result.results).toEqual([]);
    });

    it('should handle special characters in query', async () => {
      // Arrange
      const params = { query: 'test "quoted" & special <chars>', limit: 5 };

      // Act
      const result = await searchTool.execute(params);

      // Assert
      expect(result).toHaveProperty('results');                             // No error thrown
    });
  });
});
```

</example>
