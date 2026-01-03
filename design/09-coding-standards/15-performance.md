# Performance Guidelines

Reference: `design/09-coding-standards/standards-reference/15-performance.md`

<performance_rules>

## Core Principles

- **Bounded Resources**: All operations have explicit limits (memory, time, concurrency) because unbounded resources cause OOM crashes and runaway processes in production.

- **Graceful Degradation**: System remains responsive under load and fails predictably. Users can always interrupt; partial results are better than hung processes.

- **Cancellation Support**: All async operations respect `AbortSignal` so users can interrupt long operations. Nothing should ignore Ctrl+C.

- **Lazy Evaluation**: Defer work until necessary because upfront computation wastes resources when results aren't needed.

- **Measure First**: Profile before optimizing. Premature optimization wastes effort on non-bottlenecks.
  - ✓ Profile → identify hotspot → optimize → measure improvement
  - ✗ Guess what's slow → optimize prematurely → no measurable gain

## Async Patterns

- **Promise.allSettled for Independent Operations**: Use `Promise.allSettled()` instead of `Promise.all()` when partial success is acceptable. One failure shouldn't lose all results.

  ```typescript
  // ✓ Independent file reads - partial success OK
  const results = await Promise.allSettled(files.map((f) => readFile(f)));
  const successes = results.filter((r) => r.status === 'fulfilled');

  // ✗ Promise.all loses everything if one fails
  const data = await Promise.all(files.map((f) => readFile(f)));
  ```

- **Batched Concurrency for Resource-Intensive Operations**: Batch filesystem/network operations with explicit concurrency limits to avoid EMFILE errors and uncontrolled resource usage.

  ```typescript
  // ✓ Controlled parallelism
  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map((f) => processFile(f)));
  }

  // ✗ Unbounded parallelism - EMFILE crash
  await Promise.all(files.map((f) => processFile(f)));
  ```

- **Yield Control in Long-Running Loops**: In loops >1000 iterations, yield periodically and check for abort. This keeps the event loop responsive and allows user interruption.

  ```typescript
  for (let i = 0; i < items.length; i++) {
    if (i % 1000 === 0) {
      await new Promise((resolve) => setImmediate(resolve));
      if (signal?.aborted) return;
    }
    process(items[i]);
  }
  ```

- **AbortSignal in All Async Operations**: Accept optional `AbortSignal`, check `signal.aborted` early, listen for abort with `{ once: true }`, clear timeouts, remove listeners, and pass `signal` to child operations.

  ```typescript
  async function fetchData(url: string, signal?: AbortSignal): Promise<Data> {
    if (signal?.aborted) throw new AbortError();

    return new Promise((resolve, reject) => {
      const onAbort = () => reject(new AbortError());
      signal?.addEventListener('abort', onAbort, { once: true });

      try {
        // ... do work, pass signal to child ops
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
    });
  }
  ```

- **Promise.race for Timeouts**: Implement timeouts via `Promise.race()` with `AbortController`. Always clean up timers in `finally` to prevent memory leaks.
  ```typescript
  async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      return await Promise.race([promise, abortPromise(controller.signal)]);
    } finally {
      clearTimeout(timeout);
    }
  }
  ```

## Caching Strategies

- **LRU Cache for Bounded Memory**: Caches without TTL use LRU eviction with `maxSize`. Unbounded caches cause memory leaks in long-running processes.

  ```typescript
  // ✓ Bounded LRU cache
  const cache = new LRUCache<string, Data>({ maxSize: 1000 });

  // ✗ Unbounded Map - memory leak
  const cache = new Map<string, Data>();
  ```

- **TTL for Time-Sensitive Data**: Time-sensitive caches implement TTL with automatic expiration and cleanup. Stale data causes incorrect behavior.

  ```typescript
  const cache = new TTLCache<string, Token>({
    ttl: 5 * 60 * 1000, // 5 minutes
    checkInterval: 60 * 1000, // cleanup every minute
  });
  ```

- **Prefix Matching for Incremental Search**: For incremental/typeahead search, use longest-prefix cached results as the search space. Searching "abc" can filter cached "ab" results instead of re-querying.

## Buffer & Output Limits

- **Explicit Limits for All Buffers**: All buffers use explicit named size limits (no magic numbers). Unlimited buffers crash on large input.

  | Constant                   | Value       | Use Case                 |
  | -------------------------- | ----------- | ------------------------ |
  | `MAX_CHILD_PROCESS_BUFFER` | 16 MB       | Subprocess stdout/stderr |
  | `MAX_STDIN_SIZE`           | 8 MB        | User input               |
  | `MAX_TOOL_OUTPUT`          | 10 MB       | Tool result capture      |
  | `MAX_FETCH_CONTENT`        | 100 KB      | Web content              |
  | `MAX_LINE_LENGTH`          | 2,000 chars | Single line display      |
  | `MAX_SELECTED_TEXT`        | 16 KB       | Selected text operations |

- **Truncate Large Output with Indicators**: When truncating user-facing output, include a clear indicator of omitted data so users know content was cut.
  - ✓ `[First 100 lines shown, 2,847 more lines truncated]`
  - ✓ `Error details: Connection refused... and 5 more errors`
  - ✗ Silently truncating without indication

- **Detect Binary Data Early**: Detect binary within first 4KB (`MAX_SNIFF_SIZE=4096`) and handle separately. Processing binary as UTF-8 text wastes memory and produces garbage output.

## Retry & Error Handling

- **Exponential Backoff with Jitter**: Retries use exponential backoff with ±30% jitter. Fixed delays cause thundering herd when many clients retry simultaneously.

  ```typescript
  function getRetryDelay(attempt: number): number {
    const base = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
    const jitter = base * JITTER_FACTOR * (Math.random() * 2 - 1);
    return Math.min(base + jitter, MAX_RETRY_DELAY_MS);
  }
  ```

- **Classify Errors for Retry Decisions**: Retry only transient failures. Retrying terminal errors wastes resources and delays user feedback.

  | Error Type | Retry? | Examples                                       |
  | ---------- | ------ | ---------------------------------------------- |
  | Transient  | Yes    | HTTP 429, 5xx, network timeout, ECONNRESET     |
  | Terminal   | No     | HTTP 400, 401, 403, ValidationError, not found |

- **Separate Error Types**: Use `Retryable*Error` and `Terminal*Error` naming when retry semantics matter.

## Directory & File Operations

- **Batch Parallel Directory Reads**: Batch directory reads with controlled parallelism (e.g., batch size 15). Capture per-directory errors without aborting the full crawl.

  ```typescript
  const DIRECTORY_SCAN_CONCURRENCY = 15;

  async function crawlDirectories(dirs: string[]): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    for (let i = 0; i < dirs.length; i += DIRECTORY_SCAN_CONCURRENCY) {
      const batch = dirs.slice(i, i + DIRECTORY_SCAN_CONCURRENCY);
      const batchResults = await Promise.allSettled(batch.map(scanDir));
      results.push(...batchResults); // Keep failures, don't abort
    }
    return results;
  }
  ```

- **Async for Large Files**: Use async operations with streaming for large files. Sync operations block the event loop and freeze the UI.
  - ✓ `await fs.readFile()` with streaming for large files
  - ✗ `fs.readFileSync()` on files that could be large

## Algorithm Selection

- **Pointer-Based Queue for BFS**: Use pointer-based queue advancement instead of `Array.shift()` for BFS traversal. `shift()` is O(n) per operation, causing O(n²) total.

  ```typescript
  // ✓ O(1) dequeue
  const queue = [...initialItems];
  let head = 0;
  while (head < queue.length) {
    const item = queue[head++];
    queue.push(...getChildren(item));
  }

  // ✗ O(n) per shift - O(n²) total
  while (queue.length > 0) {
    const item = queue.shift();
  }
  ```

- **Input-Size-Based Algorithm Selection**: Choose algorithms based on input size. Naive O(n²) is faster for small sets due to lower overhead; hashed O(n) wins for large sets.
  ```typescript
  function findDuplicates(items: string[]): string[] {
    if (items.length < 50) {
      return naiveQuadraticSearch(items); // Lower overhead
    }
    return hashBasedSearch(items); // O(n) for large input
  }
  ```

</performance_rules>

## Standard Constants

### Timeout Values

| Constant             | Value            | Use Case                     |
| -------------------- | ---------------- | ---------------------------- |
| `DEFAULT_TIMEOUT_MS` | 120,000 (2 min)  | General async operations     |
| `HOOK_TIMEOUT_MS`    | 60,000 (1 min)   | Hook execution               |
| `FETCH_TIMEOUT_MS`   | 10,000 (10 sec)  | HTTP requests                |
| `MCP_TIMEOUT_MS`     | 600,000 (10 min) | Long-running tool operations |

### Concurrency Limits

| Constant                      | Value | Use Case                   |
| ----------------------------- | ----- | -------------------------- |
| `FILE_OPERATION_CONCURRENCY`  | 10    | File read/write operations |
| `DIRECTORY_SCAN_CONCURRENCY`  | 15    | Directory traversal        |
| `NETWORK_REQUEST_CONCURRENCY` | 5     | External API calls         |
| `HOOK_EXECUTION_CONCURRENCY`  | 10    | Parallel hook execution    |

### History/Queue Limits

| Constant               | Value  | Use Case             |
| ---------------------- | ------ | -------------------- |
| `MAX_CHAT_TURNS`       | 100    | Conversation history |
| `MAX_SHELL_HISTORY`    | 100    | Command history      |
| `MAX_EVENT_BACKLOG`    | 10,000 | Event queue          |
| `MAX_TELEMETRY_EVENTS` | 1,000  | Telemetry buffer     |

### Retry Parameters

| Constant                 | Value  | Use Case            |
| ------------------------ | ------ | ------------------- |
| `MAX_RETRY_ATTEMPTS`     | 3      | Default retry count |
| `INITIAL_RETRY_DELAY_MS` | 5,000  | First retry delay   |
| `MAX_RETRY_DELAY_MS`     | 30,000 | Maximum backoff     |
| `JITTER_FACTOR`          | 0.3    | ±30% randomization  |

## Decision Flowcharts

**Concurrency Strategy:**

- Partial success OK → `Promise.allSettled`
- All must succeed → `Promise.all`
- Timeout/first wins → `Promise.race`
- Resource-intensive → batched concurrency with limit
- Sequential dependencies → await in sequence

**Cache Type:**

- Known expiration → TTL cache
- Unpredictable size → LRU cache with maxSize
- Incremental search/filter → prefix cache
- Known scope lifetime → Map with cleanup on scope exit
- Cross-process persistence → file-based cache

**Retry Decision:**

- HTTP 400/401/403, ValidationError, unknown error → No retry
- HTTP 429/5xx, network timeout, ECONNRESET → Retry with backoff

## Performance Targets

| Metric                    | Target      | Test Method           |
| ------------------------- | ----------- | --------------------- |
| CLI startup time          | < 500ms     | Benchmark script      |
| Memory under load         | < 512MB     | Load test with limits |
| Response to Ctrl+C        | < 100ms     | Manual testing        |
| File search (10k files)   | < 2s        | Benchmark script      |
| Retry backoff correctness | Exponential | Unit test             |

## Exceptions

When performance rules cannot be followed:

| Scenario                    | Justification                                | Documentation Required    |
| --------------------------- | -------------------------------------------- | ------------------------- |
| Startup-critical sync reads | Blocking acceptable before event loop starts | Comment explaining timing |
| Small fixed-size operations | Overhead of async exceeds benefit            | Size limit documented     |
| Test fixtures               | Performance not relevant in tests            | None                      |

```typescript
/**
 * PERFORMANCE EXCEPTION: Sync file read
 * Reason: Config file read at startup before event loop active.
 * Size limit: Config file must be < 1KB.
 * Alternative considered: Async read adds complexity for no benefit at startup.
 */
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
```

## Verification Checklist

When reviewing code for performance compliance:

- [ ] All caches have bounded size (LRU maxSize or TTL with cleanup)
- [ ] Async operations accept and respect `AbortSignal`
- [ ] Long loops (>1000 iterations) yield via `setImmediate` and check abort
- [ ] Buffer sizes use named constants, not magic numbers
- [ ] Large output is truncated with clear indicators
- [ ] Binary data detected in first 4KB before text processing
- [ ] Retries use exponential backoff with jitter (±30%)
- [ ] Errors classified as retryable vs terminal before retry
- [ ] `Promise.allSettled` used for partial-success operations
- [ ] `Promise.all` only used when all-or-nothing is required
- [ ] External calls have timeouts via `Promise.race`
- [ ] Directory operations batched with concurrency limits
- [ ] No `Array.shift()` in hot loops (use pointer-based queue)
- [ ] No sync file operations on potentially large files
- [ ] Timeouts cleaned up in `finally` blocks

## Automated Checks

**ESLint Rules:**

- Forbid sync file ops: `no-restricted-syntax` selector for `readFileSync`, `writeFileSync`, `readdirSync`
- Warn on `no-await-in-loop` (may indicate missing batching)

**Code Review Checklist:**

- AbortSignal support in async APIs
- Bounded caches (LRU or TTL)
- Named buffer constants (no magic numbers)
- Exponential backoff with jitter on retries
- `Promise.allSettled` for partial success scenarios
- Timeouts on all external operations
- Binary detection before text processing
