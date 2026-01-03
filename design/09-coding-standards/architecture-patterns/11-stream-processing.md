---
title: Stream Processing Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - AI Execution Services
related_patterns:
  - ./04-error-handling-patterns.md#retry-with-backoff
  - ./05-testing-patterns.md#mock-objects
  - ./02-architectural-design-patterns.md#service-pattern
---

# 11. Stream Processing Patterns

> **Purpose**: Patterns for processing streaming API responses, handling real-time data flows, and managing asynchronous generators in AI execution contexts.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: Async Generator Stream Processing](#pattern-1-async-generator-stream-processing)
- [Pattern 2: Discriminated Union Stream Events](#pattern-2-discriminated-union-stream-events)
- [Pattern 3: JSONL Stream Formatting](#pattern-3-jsonl-stream-formatting)
- [Pattern 4: Stream Event Processing with State](#pattern-4-stream-event-processing-with-state)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Stream processing handles real-time data flows from AI APIs that return responses incrementally rather than all at once. Streaming improves user experience by showing progress immediately and reduces memory consumption by processing chunks as they arrive.

Modern AI APIs return streaming responses as async iterables, allowing incremental processing of generated content. Proper stream handling requires managing chunk accumulation, handling partial data, detecting stream completion or errors, and maintaining type safety throughout.

**Why stream processing matters:**

- Immediate user feedback for long-running AI operations
- Memory efficient processing of large responses
- Ability to cancel ongoing operations mid-stream
- Real-time progress updates and status changes
- Separation of data flow from business logic

**In this document:**

- **Async Generator Stream Processing** - Using async generators for streaming data
- **Discriminated Union Stream Events** - Type-safe stream event handling
- **JSONL Stream Formatting** - Newline-delimited JSON output formatting
- **Stream Event Processing with State** - Stateful stream event handling

**Prerequisites:**

- Understanding of JavaScript async/await
- Familiarity with TypeScript async iterables and generators
- Knowledge of discriminated unions
- Experience with event-driven architectures

---

## Pattern 1: Async Generator Stream Processing

### Intent

Process streaming AI API responses incrementally using async generators to enable real-time updates and cancellation.

### Problem

AI API responses can be large and take significant time to generate. Waiting for the complete response before displaying anything creates poor user experience. Additionally, synchronous processing blocks other operations and consumes excessive memory by loading entire responses. Users need the ability to cancel long-running operations.

### Solution

Use async generators to process streaming responses chunk by chunk. Async generators yield control back to the event loop between chunks, allowing cancellation via AbortSignal and enabling real-time processing of partial results.

### Structure

```typescript
async function* processStream(
  stream: AsyncIterable<ResponseChunk>,
  signal: AbortSignal
): AsyncGenerator<ProcessedEvent> {
  for await (const chunk of stream) {
    if (signal.aborted) {
      break;
    }
    // Process and yield
    yield processChunk(chunk);
  }
}
```

### Implementation

**Step 1: Define stream event types**

```typescript
import type { GenerateContentResponse } from '@google/genai';

export enum StreamEventType {
  CHUNK = 'chunk',
  RETRY = 'retry',
}

export type StreamEvent =
  | { type: StreamEventType.CHUNK; value: GenerateContentResponse }
  | { type: StreamEventType.RETRY };
```

**Step 2: Create async generator for stream processing**

```typescript
async function* sendMessageStream(
  message: string,
  signal: AbortSignal
): AsyncGenerator<StreamEvent> {
  try {
    const stream = await makeApiCall(message, signal);

    for await (const chunk of stream) {
      // Check for cancellation
      if (signal.aborted) {
        break;
      }

      // Yield each chunk as a stream event
      yield { type: StreamEventType.CHUNK, value: chunk };
    }
  } catch (error) {
    if (error instanceof InvalidStreamError) {
      // Signal retry needed
      yield { type: StreamEventType.RETRY };
    }
    throw error;
  }
}
```

**Step 3: Consume stream with cancellation support**

```typescript
async function processAIResponse(message: string, abortController: AbortController): Promise<void> {
  const stream = sendMessageStream(message, abortController.signal);

  for await (const event of stream) {
    switch (event.type) {
      case StreamEventType.CHUNK:
        handleChunk(event.value);
        break;
      case StreamEventType.RETRY:
        console.log('Retrying request...');
        break;
    }
  }
}
```

### Complete Example

```typescript
import type { GenerateContentResponse } from '@google/genai';

// Stream event types
export enum StreamEventType {
  CHUNK = 'chunk',
  RETRY = 'retry',
}

export type StreamEvent =
  | { type: StreamEventType.CHUNK; value: GenerateContentResponse }
  | { type: StreamEventType.RETRY };

// Custom error for invalid streams
export class InvalidStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStreamError';
  }
}

// Async generator for stream processing
class AIStreamProcessor {
  async *sendMessageStream(
    message: string,
    signal: AbortSignal,
    maxAttempts: number = 2
  ): AsyncGenerator<StreamEvent> {
    let lastError: unknown = new Error('Request failed after all retries.');

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          // Signal retry to consumer
          yield { type: StreamEventType.RETRY };
        }

        // Make API call and get stream
        const stream = await this.makeApiCall(message, signal);

        // Process each chunk
        for await (const chunk of stream) {
          if (signal.aborted) {
            break;
          }

          yield { type: StreamEventType.CHUNK, value: chunk };
        }

        // Success - clear error and exit
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        const isContentError = error instanceof InvalidStreamError;

        if (isContentError && attempt < maxAttempts - 1) {
          // Wait before retry with linear backoff
          await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
          continue;
        }

        // Not retryable or out of attempts
        break;
      }
    }

    if (lastError) {
      throw lastError;
    }
  }

  private async makeApiCall(
    message: string,
    signal: AbortSignal
  ): Promise<AsyncIterable<GenerateContentResponse>> {
    // Simulated API call returning async iterable
    return (async function* () {
      const chunks = ['Hello', ' ', 'world', '!'];
      for (const text of chunks) {
        if (signal.aborted) break;
        await new Promise((res) => setTimeout(res, 100));
        yield { candidates: [{ content: { parts: [{ text }] } }] } as GenerateContentResponse;
      }
    })();
  }
}

// Consumer with cancellation
async function main() {
  const processor = new AIStreamProcessor();
  const abortController = new AbortController();

  // Cancel after 250ms
  setTimeout(() => abortController.abort(), 250);

  try {
    const stream = processor.sendMessageStream('Hello', abortController.signal);

    for await (const event of stream) {
      switch (event.type) {
        case StreamEventType.CHUNK:
          console.log('Chunk:', event.value);
          break;
        case StreamEventType.RETRY:
          console.log('Retrying...');
          break;
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Stream cancelled');
    } else {
      console.error('Stream error:', error);
    }
  }
}
```

**Example explained:**

- Lines 1-12: Define discriminated union types for stream events
- Lines 14-19: Custom error class for stream validation failures
- Lines 22-64: Async generator with retry logic and cancellation support
- Lines 66-78: Simulated API call returning async iterable
- Lines 81-108: Consumer with timeout-based cancellation

### When to Use

**Use async generators for streams when:**

- Processing AI API streaming responses
- Implementing real-time progress updates
- Enabling user cancellation of long operations
- Processing large datasets that don't fit in memory
- Coordinating multiple concurrent streams

**Avoid async generators when:**

- Response is small and arrives immediately
- No need for cancellation or progress updates
- Synchronous processing is sufficient
- Stream complexity doesn't justify generator overhead

### Benefits

- **Cancellation Support**: AbortSignal enables mid-stream cancellation
- **Memory Efficient**: Process chunks incrementally without buffering entire response
- **Type Safety**: Discriminated unions provide compile-time event type checking
- **Immediate Feedback**: Yield results as soon as available
- **Composability**: Generators can be chained and transformed

### Trade-offs

- **Complexity**: More complex than simple promise-based APIs
- **Error Handling**: Requires careful handling of errors during iteration
- **Debugging**: Harder to debug than synchronous code
- **State Management**: Must track state across yields

### Common Mistakes

**Mistake 1: Not checking AbortSignal**

**Bad example:**

```typescript
async function* processStream(
  stream: AsyncIterable<Data>,
  signal: AbortSignal
): AsyncGenerator<Data> {
  for await (const chunk of stream) {
    // No cancellation check - continues even after abort
    yield chunk;
  }
}
```

**Correct approach:**

```typescript
async function* processStream(
  stream: AsyncIterable<Data>,
  signal: AbortSignal
): AsyncGenerator<Data> {
  for await (const chunk of stream) {
    if (signal.aborted) {
      break; // Exit immediately on abort
    }
    yield chunk;
  }
}
```

**Why this matters**: Without checking AbortSignal, the stream continues processing even after cancellation, wasting resources and potentially causing unexpected behavior.

**Mistake 2: Not handling stream errors gracefully**

**Bad example:**

```typescript
async function* processStream(stream: AsyncIterable<Data>): AsyncGenerator<Data> {
  for await (const chunk of stream) {
    yield chunk; // Error propagates without cleanup
  }
}
```

**Correct approach:**

```typescript
async function* processStream(stream: AsyncIterable<Data>): AsyncGenerator<Data> {
  try {
    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    // Log error, emit error event, or perform cleanup
    console.error('Stream error:', error);
    throw error; // Re-throw after handling
  }
}
```

**Why this matters**: Errors in streams need proper handling to clean up resources, log diagnostics, and provide user feedback.

### Testing Strategy

**What to Test:**

- Stream processes chunks incrementally
- Cancellation stops stream immediately
- Errors are properly propagated
- Retry logic works correctly
- All event types are yielded correctly

**Test Organization:**

- Co-locate tests: `streamProcessor.ts` → `streamProcessor.test.ts`
- Use AAA pattern (Arrange-Act-Assert)
- Mock async iterables for controlled testing
- Test both happy path and error cases

**Mock Strategy:**

- Create mock async iterables that yield controlled data
- Use fake timers for testing retry delays
- Mock AbortController for cancellation testing
- Don't mock the generator itself - test actual async iteration

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';

describe('AIStreamProcessor', () => {
  let processor: AIStreamProcessor;

  beforeEach(() => {
    processor = new AIStreamProcessor();
  });

  // Happy path - successful stream
  it('should process stream chunks in order', async () => {
    // Arrange
    const abortController = new AbortController();
    const chunks: string[] = [];

    // Act
    const stream = processor.sendMessageStream('test', abortController.signal);

    for await (const event of stream) {
      if (event.type === StreamEventType.CHUNK) {
        const text = event.value.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) chunks.push(text);
      }
    }

    // Assert
    expect(chunks).to.deep.equal(['Hello', ' ', 'world', '!']);
  });

  // Cancellation test
  it('should stop processing when aborted', async () => {
    // Arrange
    const abortController = new AbortController();
    const chunks: string[] = [];

    // Abort after first chunk
    setTimeout(() => abortController.abort(), 50);

    // Act
    const stream = processor.sendMessageStream('test', abortController.signal);

    try {
      for await (const event of stream) {
        if (event.type === StreamEventType.CHUNK) {
          const text = event.value.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) chunks.push(text);
        }
      }
    } catch (error) {
      // Cancellation may throw
    }

    // Assert - should have fewer chunks than total
    expect(chunks.length).to.be.lessThan(4);
  });

  // Retry test
  it('should retry on InvalidStreamError', async () => {
    // Arrange
    const abortController = new AbortController();
    const events: StreamEventType[] = [];
    let callCount = 0;

    // Mock API call that fails first time
    processor['makeApiCall'] = async () => {
      callCount++;
      if (callCount === 1) {
        throw new InvalidStreamError('Invalid stream');
      }
      return (async function* () {
        yield { candidates: [{ content: { parts: [{ text: 'success' }] } }] };
      })();
    };

    // Act
    const stream = processor.sendMessageStream('test', abortController.signal);

    for await (const event of stream) {
      events.push(event.type);
    }

    // Assert
    expect(events).to.deep.equal([StreamEventType.RETRY, StreamEventType.CHUNK]);
    expect(callCount).to.equal(2);
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+
- Branch coverage: 75%+ (stream states, retry paths, cancellation)
- Function coverage: 100%

### Related Patterns

- **[Discriminated Union Stream Events](#pattern-2-discriminated-union-stream-events)** - Type-safe stream event handling
- **[Retry with Backoff](./04-error-handling-patterns.md#retry-with-backoff)** - Error recovery in streams
- **[Service Pattern](./02-architectural-design-patterns.md#service-pattern)** - Encapsulating stream processing logic

---

## Pattern 2: Discriminated Union Stream Events

### Intent

Use TypeScript discriminated unions to create type-safe stream events that enable exhaustive pattern matching and prevent runtime errors.

### Problem

Stream events can have different shapes based on event type (chunk, error, complete, retry). Using loosely-typed events or type assertions leads to runtime errors when accessing event-specific properties. Switch statements without exhaustiveness checking miss new event types during refactoring.

### Solution

Define stream events as discriminated unions with a common `type` field. TypeScript narrows types automatically in switch/if statements, providing compile-time safety and IDE autocomplete for event-specific properties.

### Structure

```typescript
type StreamEvent =
  | { type: 'chunk'; value: Data }
  | { type: 'error'; error: Error }
  | { type: 'retry' }
  | { type: 'complete' };

function handleEvent(event: StreamEvent) {
  switch (event.type) {
    case 'chunk':
      event.value; // TypeScript knows value exists
      break;
    case 'error':
      event.error; // TypeScript knows error exists
      break;
    // etc.
  }
}
```

### Implementation

**Step 1: Define event type enum**

```typescript
export enum StreamEventType {
  CHUNK = 'chunk',
  RETRY = 'retry',
}
```

**Step 2: Create discriminated union type**

```typescript
import type { GenerateContentResponse } from '@google/genai';

export type StreamEvent =
  | { type: StreamEventType.CHUNK; value: GenerateContentResponse }
  | { type: StreamEventType.RETRY };
```

**Step 3: Use exhaustive switch for handling**

```typescript
function handleStreamEvent(event: StreamEvent): void {
  switch (event.type) {
    case StreamEventType.CHUNK:
      // TypeScript knows event.value exists here
      processChunk(event.value);
      break;
    case StreamEventType.RETRY:
      // TypeScript knows event has no value property
      console.log('Retrying...');
      break;
    default: {
      // Exhaustiveness check - compile error if case missing
      const unreachable: never = event;
      throw new Error(`Unhandled event type: ${unreachable}`);
    }
  }
}
```

### Complete Example

```typescript
// Event type enum
export enum JsonStreamEventType {
  INIT = 'init',
  MESSAGE = 'message',
  TOOL_USE = 'tool_use',
  TOOL_RESULT = 'tool_result',
  ERROR = 'error',
  RESULT = 'result',
}

// Individual event types
export interface InitEvent {
  type: JsonStreamEventType.INIT;
  timestamp: string;
  session_id: string;
  model: string;
}

export interface MessageEvent {
  type: JsonStreamEventType.MESSAGE;
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
  delta?: boolean;
}

export interface ToolUseEvent {
  type: JsonStreamEventType.TOOL_USE;
  timestamp: string;
  tool_name: string;
  tool_id: string;
  parameters: Record<string, unknown>;
}

export interface ToolResultEvent {
  type: JsonStreamEventType.TOOL_RESULT;
  timestamp: string;
  tool_id: string;
  status: 'success' | 'error';
  output?: string;
  error?: {
    type: string;
    message: string;
  };
}

export interface ErrorEvent {
  type: JsonStreamEventType.ERROR;
  timestamp: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ResultEvent {
  type: JsonStreamEventType.RESULT;
  timestamp: string;
  status: 'success' | 'error';
  stats: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    duration_ms: number;
    tool_calls: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

// Discriminated union of all event types
export type JsonStreamEvent =
  | InitEvent
  | MessageEvent
  | ToolUseEvent
  | ToolResultEvent
  | ErrorEvent
  | ResultEvent;

// Type-safe event processor
class StreamEventProcessor {
  processEvent(event: JsonStreamEvent): void {
    switch (event.type) {
      case JsonStreamEventType.INIT:
        console.log(`Session ${event.session_id} started with ${event.model}`);
        break;
      case JsonStreamEventType.MESSAGE:
        if (event.delta) {
          process.stdout.write(event.content);
        } else {
          console.log(`${event.role}: ${event.content}`);
        }
        break;
      case JsonStreamEventType.TOOL_USE:
        console.log(`Tool ${event.tool_name} called with:`, event.parameters);
        break;
      case JsonStreamEventType.TOOL_RESULT:
        if (event.status === 'success') {
          console.log(`Tool ${event.tool_id} succeeded:`, event.output);
        } else {
          console.error(`Tool ${event.tool_id} failed:`, event.error);
        }
        break;
      case JsonStreamEventType.ERROR:
        console.error(`[${event.severity}] ${event.message}`);
        break;
      case JsonStreamEventType.RESULT:
        console.log('Session completed:', event.stats);
        if (event.status === 'error') {
          console.error('Error:', event.error);
        }
        break;
      default: {
        // Exhaustiveness check - compiler error if case missing
        const unreachable: never = event;
        throw new Error(`Unhandled event type: ${unreachable}`);
      }
    }
  }
}

// Usage
const processor = new StreamEventProcessor();

const events: JsonStreamEvent[] = [
  {
    type: JsonStreamEventType.INIT,
    timestamp: new Date().toISOString(),
    session_id: 'sess-123',
    model: 'claude-3',
  },
  {
    type: JsonStreamEventType.MESSAGE,
    timestamp: new Date().toISOString(),
    role: 'user',
    content: 'Hello',
  },
  {
    type: JsonStreamEventType.MESSAGE,
    timestamp: new Date().toISOString(),
    role: 'assistant',
    content: 'Hi there!',
  },
];

events.forEach((event) => processor.processEvent(event));
```

**Example explained:**

- Lines 2-8: Enum defines all possible event types
- Lines 10-75: Individual event interfaces with specific fields
- Lines 78-83: Discriminated union combines all event types
- Lines 86-123: Type-safe event processor with exhaustive switch
- Lines 126-148: Usage example showing type safety in action

### When to Use

**Use discriminated unions for stream events when:**

- Stream has multiple event types with different shapes
- Need compile-time type safety for event handling
- Want exhaustive checking to catch missing cases
- Event types are known at design time

**Avoid discriminated unions when:**

- Only one event type exists
- Event structure is completely dynamic
- Using JavaScript without TypeScript

### Benefits

- **Type Safety**: Compiler catches missing event types
- **Exhaustiveness Checking**: `never` type ensures all cases handled
- **IDE Support**: Autocomplete for event-specific properties
- **Refactoring Safety**: Adding event types causes compile errors in incomplete switches
- **Self-Documenting**: Event shapes are explicit in types

### Trade-offs

- **Verbosity**: Requires explicit type definitions for each event
- **Rigid Structure**: Harder to handle dynamic event shapes
- **Learning Curve**: Developers must understand discriminated unions

### Common Mistakes

**Mistake 1: Not using exhaustiveness check in default case**

**Bad example:**

```typescript
function handleEvent(event: StreamEvent): void {
  switch (event.type) {
    case StreamEventType.CHUNK:
      processChunk(event.value);
      break;
    case StreamEventType.RETRY:
      retry();
      break;
    // No default - adding new event type won't cause compile error
  }
}
```

**Correct approach:**

```typescript
function handleEvent(event: StreamEvent): void {
  switch (event.type) {
    case StreamEventType.CHUNK:
      processChunk(event.value);
      break;
    case StreamEventType.RETRY:
      retry();
      break;
    default: {
      // Exhaustiveness check - compile error if event type missing
      const unreachable: never = event;
      throw new Error(`Unhandled event: ${unreachable}`);
    }
  }
}
```

**Why this matters**: Without exhaustiveness checking, adding new event types won't cause compile errors, leading to runtime failures when unhandled events occur.

**Mistake 2: Using type assertions instead of discriminated unions**

**Bad example:**

```typescript
function handleEvent(event: { type: string; data?: unknown }): void {
  if (event.type === 'chunk') {
    const chunk = event.data as ChunkData; // Unsafe type assertion
    processChunk(chunk);
  }
}
```

**Correct approach:**

```typescript
type StreamEvent = { type: 'chunk'; data: ChunkData } | { type: 'error'; error: Error };

function handleEvent(event: StreamEvent): void {
  if (event.type === 'chunk') {
    processChunk(event.data); // TypeScript knows data is ChunkData
  } else {
    logError(event.error); // TypeScript knows error exists
  }
}
```

**Why this matters**: Type assertions bypass type checking and can cause runtime errors. Discriminated unions provide compile-time safety.

### Testing Strategy

**What to Test:**

- All event types are handled correctly
- Exhaustiveness check catches new event types
- Type narrowing works in switch statements
- Event-specific properties are accessible

**Test Organization:**

- Co-locate tests with event processor
- Test each event type separately
- Test exhaustiveness with invalid event type (if possible)

**Mock Strategy:**

- Create test fixtures for each event type
- Use type-safe factory functions to create events
- Don't test TypeScript compiler behavior - focus on logic

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { StreamEventProcessor, JsonStreamEventType } from './stream-events.js';
import type { JsonStreamEvent, InitEvent, MessageEvent } from './stream-events.js';

describe('StreamEventProcessor', () => {
  let processor: StreamEventProcessor;
  let output: string[];

  beforeEach(() => {
    processor = new StreamEventProcessor();
    output = [];
    // Capture console output
    processor['log'] = (msg: string) => output.push(msg);
  });

  // Test init event
  it('should process init event', () => {
    // Arrange
    const event: InitEvent = {
      type: JsonStreamEventType.INIT,
      timestamp: '2025-01-21T12:00:00.000Z',
      session_id: 'sess-123',
      model: 'claude-3',
    };

    // Act
    processor.processEvent(event);

    // Assert
    expect(output).to.include('Session sess-123 started with claude-3');
  });

  // Test message event
  it('should process message event', () => {
    // Arrange
    const event: MessageEvent = {
      type: JsonStreamEventType.MESSAGE,
      timestamp: '2025-01-21T12:00:00.000Z',
      role: 'user',
      content: 'Hello',
    };

    // Act
    processor.processEvent(event);

    // Assert
    expect(output).to.include('user: Hello');
  });

  // Test delta message
  it('should handle delta messages for streaming', () => {
    // Arrange
    const event: MessageEvent = {
      type: JsonStreamEventType.MESSAGE,
      timestamp: '2025-01-21T12:00:00.000Z',
      role: 'assistant',
      content: 'chunk',
      delta: true,
    };

    // Act
    processor.processEvent(event);

    // Assert - delta writes without newline
    expect(output[0]).to.not.include('\n');
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (all event types)
- Branch coverage: 100% (all switch cases)
- Function coverage: 100%

### Related Patterns

- **[Type Safety Patterns](./03-type-safety-patterns.md)** - No `any` types, type guards
- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Error event types

---

## Pattern 3: JSONL Stream Formatting

### Intent

Format streaming events as newline-delimited JSON (JSONL) for machine-readable output that can be processed line-by-line.

### Problem

Streaming output needs to be consumable by both humans and other programs. Standard JSON requires complete document parsing, making it unsuitable for streaming. CSV lacks type information and nested structure support. Custom formats require specialized parsers.

### Solution

Use JSONL (JSON Lines) format where each event is a complete JSON object followed by a newline. This enables line-by-line parsing, streaming consumption, and compatibility with standard JSON parsers for each line.

### Structure

```typescript
class StreamJsonFormatter {
  formatEvent(event: JsonStreamEvent): string {
    return JSON.stringify(event) + '\n';
  }

  emitEvent(event: JsonStreamEvent): void {
    process.stdout.write(this.formatEvent(event));
  }
}
```

### Implementation

**Step 1: Create formatter class**

```typescript
export class StreamJsonFormatter {
  formatEvent(event: JsonStreamEvent): string {
    return JSON.stringify(event) + '\n';
  }
}
```

**Step 2: Add emission method**

```typescript
export class StreamJsonFormatter {
  formatEvent(event: JsonStreamEvent): string {
    return JSON.stringify(event) + '\n';
  }

  emitEvent(event: JsonStreamEvent): void {
    process.stdout.write(this.formatEvent(event));
  }
}
```

**Step 3: Add aggregation utilities**

```typescript
export class StreamJsonFormatter {
  formatEvent(event: JsonStreamEvent): string {
    return JSON.stringify(event) + '\n';
  }

  emitEvent(event: JsonStreamEvent): void {
    process.stdout.write(this.formatEvent(event));
  }

  convertToStreamStats(metrics: SessionMetrics, durationMs: number): StreamStats {
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    // Aggregate token counts across all models
    for (const modelMetrics of Object.values(metrics.models)) {
      totalTokens += modelMetrics.tokens.total;
      inputTokens += modelMetrics.tokens.prompt;
      outputTokens += modelMetrics.tokens.candidates;
    }

    return {
      total_tokens: totalTokens,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      duration_ms: durationMs,
      tool_calls: metrics.tools.totalCalls,
    };
  }
}
```

### Complete Example

```typescript
import type { JsonStreamEvent } from './types.js';
import type { SessionMetrics } from '../telemetry/uiTelemetry.js';

export interface StreamStats {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  tool_calls: number;
}

/**
 * Formatter for streaming JSON output.
 * Emits newline-delimited JSON (JSONL) events to stdout in real-time.
 */
export class StreamJsonFormatter {
  /**
   * Formats a single event as a JSON string with newline (JSONL format).
   */
  formatEvent(event: JsonStreamEvent): string {
    return JSON.stringify(event) + '\n';
  }

  /**
   * Emits an event directly to stdout in JSONL format.
   */
  emitEvent(event: JsonStreamEvent): void {
    process.stdout.write(this.formatEvent(event));
  }

  /**
   * Converts SessionMetrics to simplified StreamStats format.
   * Aggregates token counts across all models.
   */
  convertToStreamStats(metrics: SessionMetrics, durationMs: number): StreamStats {
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;

    // Aggregate token counts across all models
    for (const modelMetrics of Object.values(metrics.models)) {
      totalTokens += modelMetrics.tokens.total;
      inputTokens += modelMetrics.tokens.prompt;
      outputTokens += modelMetrics.tokens.candidates;
    }

    return {
      total_tokens: totalTokens,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      duration_ms: durationMs,
      tool_calls: metrics.tools.totalCalls,
    };
  }
}

// Usage
const formatter = new StreamJsonFormatter();

// Emit events as they occur
formatter.emitEvent({
  type: JsonStreamEventType.INIT,
  timestamp: new Date().toISOString(),
  session_id: 'sess-123',
  model: 'claude-3',
});

formatter.emitEvent({
  type: JsonStreamEventType.MESSAGE,
  timestamp: new Date().toISOString(),
  role: 'user',
  content: 'Hello',
});

formatter.emitEvent({
  type: JsonStreamEventType.MESSAGE,
  timestamp: new Date().toISOString(),
  role: 'assistant',
  content: 'Hi!',
  delta: true,
});

// Output:
// {"type":"init","timestamp":"2025-01-21T12:00:00.000Z","session_id":"sess-123","model":"claude-3"}
// {"type":"message","timestamp":"2025-01-21T12:00:01.000Z","role":"user","content":"Hello"}
// {"type":"message","timestamp":"2025-01-21T12:00:02.000Z","role":"assistant","content":"Hi!","delta":true}
```

**Example explained:**

- Lines 1-10: Type definitions for stream stats
- Lines 17-20: Format event as minified JSON + newline
- Lines 25-27: Emit formatted event to stdout
- Lines 32-50: Aggregate metrics from multiple models
- Lines 54-74: Usage example showing JSONL output

### When to Use

**Use JSONL formatting when:**

- Output needs to be machine-readable
- Streaming output line-by-line
- Integrating with log processing tools
- Need both human and machine readability
- Building CLI tools with structured output

**Avoid JSONL when:**

- Output is purely for human consumption
- Need pretty-printed JSON for debugging
- File size is more important than streaming
- Consumers expect different format (CSV, XML)

### Benefits

- **Streaming Compatible**: Process line-by-line without buffering
- **Standard Format**: Works with standard JSON parsers
- **Tool Support**: Many log processors support JSONL
- **Simple Parsing**: Split by newline, parse each line
- **Human Readable**: Each line is readable JSON

### Trade-offs

- **Size**: Slightly larger than compact JSON array
- **No Pretty Printing**: Minified for size
- **Line-Based**: Each event must be self-contained

### Common Mistakes

**Mistake 1: Pretty-printing JSONL output**

**Bad example:**

```typescript
formatEvent(event: JsonStreamEvent): string {
  return JSON.stringify(event, null, 2) + '\n';
  // Multi-line JSON breaks JSONL format
}
```

**Correct approach:**

```typescript
formatEvent(event: JsonStreamEvent): string {
  return JSON.stringify(event) + '\n';
  // Minified JSON, single line
}
```

**Why this matters**: JSONL requires one JSON object per line. Pretty-printing creates multiple lines per object, breaking parsers.

**Mistake 2: Forgetting trailing newline**

**Bad example:**

```typescript
formatEvent(event: JsonStreamEvent): string {
  return JSON.stringify(event); // Missing newline
}
```

**Correct approach:**

```typescript
formatEvent(event: JsonStreamEvent): string {
  return JSON.stringify(event) + '\n';
}
```

**Why this matters**: The newline delimiter is essential for line-based parsing. Without it, events are concatenated.

### Testing Strategy

**What to Test:**

- Each event type formats as valid JSON
- Output includes trailing newline
- JSON is minified (no multi-line)
- Stats aggregation works correctly
- Emission writes to stdout

**Test Organization:**

- Test formatting separately from emission
- Test each event type
- Test stats conversion with various inputs

**Mock Strategy:**

- Mock process.stdout.write for emission tests
- Use actual JSON.stringify (don't mock)
- Create fixture events for each type

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import { StreamJsonFormatter } from './stream-json-formatter.js';
import { JsonStreamEventType } from './types.js';
import type { InitEvent, MessageEvent } from './types.js';

describe('StreamJsonFormatter', () => {
  let formatter: StreamJsonFormatter;
  let stdoutWriteSpy: any;

  beforeEach(() => {
    formatter = new StreamJsonFormatter();
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
  });

  describe('formatEvent', () => {
    it('should format init event as JSONL', () => {
      // Arrange
      const event: InitEvent = {
        type: JsonStreamEventType.INIT,
        timestamp: '2025-10-10T12:00:00.000Z',
        session_id: 'test-session-123',
        model: 'claude-3',
      };

      // Act
      const result = formatter.formatEvent(event);

      // Assert
      expect(result).to.equal(JSON.stringify(event) + '\n');
      expect(JSON.parse(result.trim())).to.deep.equal(event);
    });

    it('should produce minified JSON without pretty-printing', () => {
      // Arrange
      const event: MessageEvent = {
        type: JsonStreamEventType.MESSAGE,
        timestamp: '2025-10-10T12:00:00.000Z',
        role: 'user',
        content: 'Test',
      };

      // Act
      const result = formatter.formatEvent(event);

      // Assert - should not contain multiple spaces or newlines (except trailing)
      expect(result).to.not.contain('  ');
      expect(result.split('\n').length).to.equal(2); // JSON + trailing newline
    });
  });

  describe('emitEvent', () => {
    it('should write formatted event to stdout', () => {
      // Arrange
      const event: InitEvent = {
        type: JsonStreamEventType.INIT,
        timestamp: '2025-10-10T12:00:00.000Z',
        session_id: 'test-session',
        model: 'claude-3',
      };

      // Act
      formatter.emitEvent(event);

      // Assert
      expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
      expect(stdoutWriteSpy).toHaveBeenCalledWith(JSON.stringify(event) + '\n');
    });

    it('should emit multiple events sequentially', () => {
      // Arrange
      const event1: InitEvent = {
        type: JsonStreamEventType.INIT,
        timestamp: '2025-10-10T12:00:00.000Z',
        session_id: 'test-session',
        model: 'claude-3',
      };

      const event2: MessageEvent = {
        type: JsonStreamEventType.MESSAGE,
        timestamp: '2025-10-10T12:00:01.000Z',
        role: 'user',
        content: 'Hello',
      };

      // Act
      formatter.emitEvent(event1);
      formatter.emitEvent(event2);

      // Assert
      expect(stdoutWriteSpy).toHaveBeenCalledTimes(2);
      expect(stdoutWriteSpy).toHaveBeenNthCalledWith(1, JSON.stringify(event1) + '\n');
      expect(stdoutWriteSpy).toHaveBeenNthCalledWith(2, JSON.stringify(event2) + '\n');
    });
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Branch coverage: N/A (no branches)
- Function coverage: 100%

### Related Patterns

- **[Discriminated Union Stream Events](#pattern-2-discriminated-union-stream-events)** - Type-safe event definitions
- **[Async Generator Stream Processing](#pattern-1-async-generator-stream-processing)** - Streaming event generation

---

## Pattern 4: Stream Event Processing with State

### Intent

Process stream events with accumulated state across multiple chunks while maintaining type safety and enabling real-time UI updates.

### Problem

Stream events often need context from previous events to process correctly. Message deltas need accumulation, tool calls span multiple events, and UI needs updates as state changes. Managing this state while processing async streams is complex and error-prone.

### Solution

Use React hooks or service classes to maintain state across stream events. Accumulate message buffers, track pending operations, and emit state changes for UI updates. Process events in order while handling cancellation and errors.

### Structure

```typescript
class StreamEventProcessor {
  private messageBuffer = '';
  private pendingTools: ToolCall[] = [];

  async processStream(stream: AsyncIterable<Event>, signal: AbortSignal): Promise<ProcessedResult> {
    for await (const event of stream) {
      if (signal.aborted) break;

      switch (event.type) {
        case 'content':
          this.messageBuffer += event.value;
          this.emitUpdate();
          break;
        case 'tool_call':
          this.pendingTools.push(event.tool);
          break;
      }
    }
    return { message: this.messageBuffer, tools: this.pendingTools };
  }
}
```

### Implementation

**Step 1: Define state variables**

```typescript
const handleContentEvent = useCallback(
  (
    eventValue: string,
    currentGeminiMessageBuffer: string,
    userMessageTimestamp: number
  ): string => {
    let newGeminiMessageBuffer = currentGeminiMessageBuffer + eventValue;

    // Check if need to create new pending item
    if (
      pendingHistoryItemRef.current?.type !== 'gemini' &&
      pendingHistoryItemRef.current?.type !== 'gemini_content'
    ) {
      if (pendingHistoryItemRef.current) {
        addItem(pendingHistoryItemRef.current, userMessageTimestamp);
      }
      setPendingHistoryItem({ type: 'gemini', text: '' });
      newGeminiMessageBuffer = eventValue;
    }

    return newGeminiMessageBuffer;
  },
  [addItem, pendingHistoryItemRef, setPendingHistoryItem]
);
```

**Step 2: Process events in switch statement**

```typescript
const processGeminiStreamEvents = useCallback(
  async (
    stream: AsyncIterable<GeminiEvent>,
    userMessageTimestamp: number,
    signal: AbortSignal,
  ): Promise<void> {
    let geminiMessageBuffer = '';
    const toolCallRequests: ToolCallRequestInfo[] = [];

    for await (const event of stream) {
      switch (event.type) {
        case GeminiEventType.Content:
          geminiMessageBuffer = handleContentEvent(
            event.value,
            geminiMessageBuffer,
            userMessageTimestamp,
          );
          break;
        case GeminiEventType.ToolCallRequest:
          toolCallRequests.push(event.value);
          break;
        case GeminiEventType.Error:
          handleErrorEvent(event.value, userMessageTimestamp);
          break;
      }
    }

    // Process accumulated tool calls
    if (toolCallRequests.length > 0) {
      scheduleToolCalls(toolCallRequests, signal);
    }
  },
  [handleContentEvent, handleErrorEvent, scheduleToolCalls],
);
```

**Step 3: Handle state updates and cleanup**

```typescript
// Update pending item for UI
setPendingHistoryItem((item) => ({
  type: item?.type as 'gemini' | 'gemini_content',
  text: newGeminiMessageBuffer,
}));

// Finalize on completion
if (pendingHistoryItemRef.current) {
  addItem(pendingHistoryItemRef.current, userMessageTimestamp);
  setPendingHistoryItem(null);
}
```

### Complete Example

```typescript
import { useState, useRef, useCallback } from 'react';

enum GeminiEventType {
  Content = 'content',
  ToolCallRequest = 'tool_call_request',
  Error = 'error',
  Finished = 'finished',
}

type GeminiEvent =
  | { type: GeminiEventType.Content; value: string }
  | { type: GeminiEventType.ToolCallRequest; value: ToolCallInfo }
  | { type: GeminiEventType.Error; value: string }
  | { type: GeminiEventType.Finished; value: FinishReason };

interface HistoryItem {
  type: 'gemini' | 'gemini_content' | 'tool_group';
  text?: string;
  tools?: ToolCall[];
}

function useGeminiStream() {
  const [pendingHistoryItem, setPendingHistoryItem] = useState<HistoryItem | null>(null);
  const pendingHistoryItemRef = useRef<HistoryItem | null>(null);

  // Sync ref with state
  pendingHistoryItemRef.current = pendingHistoryItem;

  const handleContentEvent = useCallback(
    (eventValue: string, currentBuffer: string): string => {
      let newBuffer = currentBuffer + eventValue;

      // Check if need to create new pending item
      if (
        pendingHistoryItemRef.current?.type !== 'gemini' &&
        pendingHistoryItemRef.current?.type !== 'gemini_content'
      ) {
        if (pendingHistoryItemRef.current) {
          // Finalize previous pending item
          console.log('Finalizing:', pendingHistoryItemRef.current);
        }
        setPendingHistoryItem({ type: 'gemini', text: '' });
        newBuffer = eventValue;
      }

      // Update pending item
      setPendingHistoryItem((item) => ({
        type: item?.type as 'gemini' | 'gemini_content',
        text: newBuffer,
      }));

      return newBuffer;
    },
    [pendingHistoryItemRef, setPendingHistoryItem],
  );

  const handleErrorEvent = useCallback(
    (errorMessage: string) => {
      if (pendingHistoryItemRef.current) {
        console.log('Finalizing due to error:', pendingHistoryItemRef.current);
        setPendingHistoryItem(null);
      }
      console.error('Stream error:', errorMessage);
    },
    [pendingHistoryItemRef, setPendingHistoryItem],
  );

  const processGeminiStreamEvents = useCallback(
    async (
      stream: AsyncIterable<GeminiEvent>,
      signal: AbortSignal,
    ): Promise<void> {
      let geminiMessageBuffer = '';
      const toolCallRequests: ToolCallInfo[] = [];

      for await (const event of stream) {
        if (signal.aborted) {
          break;
        }

        switch (event.type) {
          case GeminiEventType.Content:
            geminiMessageBuffer = handleContentEvent(
              event.value,
              geminiMessageBuffer,
            );
            break;
          case GeminiEventType.ToolCallRequest:
            toolCallRequests.push(event.value);
            break;
          case GeminiEventType.Error:
            handleErrorEvent(event.value);
            break;
          case GeminiEventType.Finished:
            console.log('Stream finished:', event.value);
            break;
          default: {
            const unreachable: never = event;
            throw new Error(`Unhandled event: ${unreachable}`);
          }
        }
      }

      // Finalize pending item
      if (pendingHistoryItemRef.current) {
        console.log('Stream complete, finalizing:', pendingHistoryItemRef.current);
        setPendingHistoryItem(null);
      }

      // Process accumulated tool calls
      if (toolCallRequests.length > 0) {
        console.log('Processing tool calls:', toolCallRequests);
      }
    },
    [handleContentEvent, handleErrorEvent, pendingHistoryItemRef],
  );

  return {
    pendingHistoryItem,
    processGeminiStreamEvents,
  };
}

// Usage
async function example() {
  const { processGeminiStreamEvents, pendingHistoryItem } = useGeminiStream();
  const abortController = new AbortController();

  // Simulated stream
  const stream = (async function* () {
    yield { type: GeminiEventType.Content, value: 'Hello' };
    yield { type: GeminiEventType.Content, value: ' world' };
    yield { type: GeminiEventType.Finished, value: 'STOP' };
  })();

  await processGeminiStreamEvents(stream, abortController.signal);
}
```

**Example explained:**

- Lines 1-14: Event type definitions
- Lines 16-20: History item state type
- Lines 22-26: State management with useState and useRef
- Lines 28-51: Content event handler with buffer accumulation
- Lines 53-62: Error event handler with cleanup
- Lines 64-110: Main stream processing loop with exhaustive switch
- Lines 112-129: Usage example

### When to Use

**Use stateful stream processing when:**

- Need to accumulate data across multiple events
- UI needs real-time updates as stream progresses
- Events have dependencies on previous events
- Managing complex async operations (tool calls)

**Avoid stateful processing when:**

- Events are independent
- No UI updates needed during streaming
- Simple transformation of each event

### Benefits

- **Real-Time Updates**: UI reflects state immediately
- **Type Safety**: Discriminated unions ensure correct handling
- **Cancellation**: AbortSignal integration
- **Composability**: Callback-based event handlers
- **State Isolation**: Each stream maintains independent state

### Trade-offs

- **Complexity**: More complex than stateless processing
- **Memory**: State accumulation uses memory
- **Testing**: Harder to test stateful logic
- **Race Conditions**: Must handle concurrent state updates

### Common Mistakes

**Mistake 1: Not synchronizing ref with state**

**Bad example:**

```typescript
const [pendingItem, setPendingItem] = useState(null);
const pendingItemRef = useRef(null);
// Ref and state get out of sync
```

**Correct approach:**

```typescript
const [pendingItem, setPendingItem] = useState(null);
const pendingItemRef = useRef(null);
pendingItemRef.current = pendingItem; // Sync ref with state
```

**Why this matters**: Callbacks capture state at creation time. Without syncing, callbacks see stale state values.

**Mistake 2: Not finalizing pending state on stream completion**

**Bad example:**

```typescript
async function processStream(stream) {
  for await (const event of stream) {
    updatePendingState(event);
  }
  // Pending state never finalized
}
```

**Correct approach:**

```typescript
async function processStream(stream) {
  for await (const event of stream) {
    updatePendingState(event);
  }
  // Finalize pending state
  if (pendingState) {
    finalizePendingState();
  }
}
```

**Why this matters**: Pending state represents incomplete data. Not finalizing leaves UI in limbo state.

### Testing Strategy

**What to Test:**

- State accumulates correctly across events
- Pending items finalize on completion
- Error events clean up pending state
- Cancellation stops processing immediately
- All event types update state correctly

**Test Organization:**

- Test event handlers independently
- Test full stream processing with mock streams
- Test state transitions

**Mock Strategy:**

- Create mock async iterables for controlled streams
- Mock setState functions to verify calls
- Use fake timers if delays involved

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import { renderHook, act } from '@testing-library/react';

describe('useGeminiStream', () => {
  it('should accumulate content events', async () => {
    // Arrange
    const { result } = renderHook(() => useGeminiStream());
    const stream = (async function* () {
      yield { type: GeminiEventType.Content, value: 'Hello' };
      yield { type: GeminiEventType.Content, value: ' world' };
    })();
    const abortController = new AbortController();

    // Act
    await act(async () => {
      await result.current.processGeminiStreamEvents(stream, abortController.signal);
    });

    // Assert
    expect(result.current.pendingHistoryItem).to.be.null;
    // State was updated during processing and finalized
  });

  it('should finalize pending item on error', async () => {
    // Arrange
    const { result } = renderHook(() => useGeminiStream());
    const stream = (async function* () {
      yield { type: GeminiEventType.Content, value: 'Hello' };
      yield { type: GeminiEventType.Error, value: 'Test error' };
    })();
    const abortController = new AbortController();

    // Act
    await act(async () => {
      await result.current.processGeminiStreamEvents(stream, abortController.signal);
    });

    // Assert
    expect(result.current.pendingHistoryItem).to.be.null;
  });

  it('should stop processing on abort', async () => {
    // Arrange
    const { result } = renderHook(() => useGeminiStream());
    const events: string[] = [];
    const stream = (async function* () {
      events.push('event1');
      yield { type: GeminiEventType.Content, value: 'Hello' };
      events.push('event2');
      yield { type: GeminiEventType.Content, value: ' world' };
      events.push('event3');
      yield { type: GeminiEventType.Finished, value: 'STOP' };
    })();
    const abortController = new AbortController();

    // Abort after first event
    setTimeout(() => abortController.abort(), 10);

    // Act
    await act(async () => {
      await result.current.processGeminiStreamEvents(stream, abortController.signal);
    });

    // Assert - should have processed fewer events
    expect(events.length).to.be.lessThan(3);
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+
- Branch coverage: 75%+ (event types, state transitions)
- Function coverage: 90%+

### Related Patterns

- **[Async Generator Stream Processing](#pattern-1-async-generator-stream-processing)** - Stream iteration
- **[Discriminated Union Stream Events](#pattern-2-discriminated-union-stream-events)** - Type-safe events
- **[Service Pattern](./02-architectural-design-patterns.md#service-pattern)** - Encapsulating stream logic

---

## Quick Reference

### Pattern Summary Table

| Pattern                            | Use When                                   | Avoid When                | Key Benefit                         |
| ---------------------------------- | ------------------------------------------ | ------------------------- | ----------------------------------- |
| Async Generator Stream Processing  | Streaming AI responses, need cancellation  | Small immediate responses | Real-time updates, memory efficient |
| Discriminated Union Stream Events  | Multiple event types with different shapes | Single event type         | Compile-time type safety            |
| JSONL Stream Formatting            | Machine-readable streaming output          | Human-only output         | Line-by-line parsing                |
| Stream Event Processing with State | Need to accumulate data across events      | Independent events        | Real-time UI updates                |

### Code Snippets

**Async Generator Stream Processing - Minimal Example:**

```typescript
async function* processStream(
  stream: AsyncIterable<Data>,
  signal: AbortSignal
): AsyncGenerator<Data> {
  for await (const chunk of stream) {
    if (signal.aborted) break;
    yield chunk;
  }
}
```

**Discriminated Union Stream Events - Minimal Example:**

```typescript
type StreamEvent = { type: 'chunk'; value: Data } | { type: 'error'; error: Error };

function handleEvent(event: StreamEvent): void {
  switch (event.type) {
    case 'chunk':
      process(event.value);
      break;
    case 'error':
      log(event.error);
      break;
  }
}
```

**JSONL Stream Formatting - Minimal Example:**

```typescript
class StreamJsonFormatter {
  formatEvent(event: Event): string {
    return JSON.stringify(event) + '\n';
  }

  emitEvent(event: Event): void {
    process.stdout.write(this.formatEvent(event));
  }
}
```

**Stream Event Processing with State - Minimal Example:**

```typescript
async function processStream(stream: AsyncIterable<Event>): Promise<string> {
  let buffer = '';
  for await (const event of stream) {
    if (event.type === 'content') {
      buffer += event.value;
    }
  }
  return buffer;
}
```

---

## Enforcement

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "lib": ["ES2018", "ESNext.AsyncIterable"]
  }
}
```

**ESLint Configuration:**

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/await-thenable": "error"
  }
}
```

---

## Related Patterns

- **[Error Handling Patterns](./04-error-handling-patterns.md#retry-with-backoff)** - Retry logic for stream failures
- **[Type Safety Patterns](./03-type-safety-patterns.md)** - Type guards and discriminated unions
- **[Service Pattern](./02-architectural-design-patterns.md#service-pattern)** - Encapsulating stream processing
- **[Testing Patterns](./05-testing-patterns.md)** - Testing async generators

---

## References

**Source Code Examples:**

- [packages/core/src/core/geminiChat.ts](../../../examplecode/gemini/packages/core/src/core/geminiChat.ts) - Async generator stream processing with retry
- [packages/core/src/output/stream-json-formatter.ts](../../../examplecode/gemini/packages/core/src/output/stream-json-formatter.ts) - JSONL formatting implementation
- [packages/cli/src/ui/hooks/useGeminiStream.ts](../../../examplecode/gemini/packages/cli/src/ui/hooks/useGeminiStream.ts) - Stateful stream event processing
- [packages/core/src/output/stream-json-formatter.test.ts](../../../examplecode/gemini/packages/core/src/output/stream-json-formatter.test.ts) - JSONL formatter tests

**External Resources:**

- [JSONL Specification](https://jsonlines.org/) - Newline-delimited JSON format
- [TypeScript Async Iterators](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-3.html#async-iteration) - Official async iteration documentation
- [MDN AsyncGenerator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncGenerator) - Async generator reference

---

## Changelog

- **2025-01-21**: Initial stream processing patterns documentation extracted from reference codebase
