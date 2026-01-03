# Performance Guidelines - Coding Standard

> **Standard ID**: STD-015
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: TypeScript/Node.js CLI Applications
> **Enforcement**: Automated + Manual Review
> **Related Documents**:
>
> - [Architecture Patterns](./05-architecture.md) - Component design patterns
> - [Error Handling](./06-error-handling.md) - Retry and failure patterns
> - [Testing Standards](./07-testing.md) - Performance testing requirements
> - [Validation Checklist](../templates/99-standards/05-validation-checklist.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory performance patterns for TypeScript/Node.js CLI applications. These guidelines ensure responsive user experience, efficient resource utilization, and predictable behavior under load.

### 1.2 Scope

**Applies to**:

- Async operation handling and concurrency control
- Caching strategies and memory management
- Rate limiting and retry mechanisms
- File system and I/O operations
- CLI startup and response time optimization

**Does NOT apply to**:

- Database query optimization (covered in data access standards)
- Network protocol tuning (infrastructure concern)
- Hardware-level optimizations

### 1.3 Enforcement Level

| Level      | Meaning                            | Mechanism                      |
| ---------- | ---------------------------------- | ------------------------------ |
| **MUST**   | Mandatory; violations block merge  | ESLint, CI checks, code review |
| **SHOULD** | Recommended; exceptions documented | Code review                    |
| **MAY**    | Optional                           | Team discretion                |

---

## 2. Guiding Principles

| Principle            | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| Bounded Resources    | All operations have explicit limits (memory, time, concurrency) |
| Graceful Degradation | System remains responsive under load; fails predictably         |
| Cancellation Support | All async operations respect AbortSignal for user interruption  |
| Lazy Evaluation      | Defer work until necessary; avoid upfront computation           |
| Measure First        | Profile before optimizing; avoid premature optimization         |

---

## 3. Async/Await Patterns

### 3.1 Concurrency Control

#### Rule 3.1.1: Use Promise.allSettled for Independent Operations

| Attribute       | Value                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| **Enforcement** | MUST                                                                      |
| **Automation**  | Code review                                                               |
| **Applies to**  | Multiple independent async operations where partial success is acceptable |

**Rule Statement**:
When executing multiple independent operations where some may fail without invalidating others, use `Promise.allSettled()` instead of `Promise.all()`.

**Correct Examples**:

```typescript
// CORRECT: Processing multiple files where some may fail
async function processFiles(filePaths: string[]): Promise<ProcessResult[]> {
  const results = await Promise.allSettled(
    filePaths.map(async (filePath) => {
      const content = await fs.readFile(filePath, 'utf-8');
      return processContent(content);
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { path: filePaths[index], success: true, data: result.value };
    }
    return { path: filePaths[index], success: false, error: result.reason };
  });
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: One failure stops all processing
async function processFiles(filePaths: string[]): Promise<ProcessResult[]> {
  const results = await Promise.all(
    filePaths.map(async (filePath) => {
      const content = await fs.readFile(filePath, 'utf-8');
      return processContent(content);
    })
  );
  return results;
}
```

**Rationale**:
`Promise.all` rejects immediately on first failure, losing results from successful operations. `Promise.allSettled` ensures all operations complete and returns both successes and failures.

---

#### Rule 3.1.2: Implement Batched Concurrency for Resource-Intensive Operations

| Attribute       | Value                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| **Enforcement** | MUST                                                                                   |
| **Automation**  | Code review                                                                            |
| **Applies to**  | File system operations, network requests, any operation that consumes system resources |

**Rule Statement**:
Operations that open file handles, network connections, or consume significant resources MUST be batched with explicit concurrency limits.

**Correct Examples**:

```typescript
// CORRECT: Batched directory processing with concurrency limit
const CONCURRENT_LIMIT = 10;

async function processDirectories(directories: string[]): Promise<void> {
  for (let i = 0; i < directories.length; i += CONCURRENT_LIMIT) {
    const batch = directories.slice(i, i + CONCURRENT_LIMIT);
    const batchPromises = batch.map((dir) => processDirectory(dir));
    await Promise.allSettled(batchPromises);
  }
}

// CORRECT: Generic batch processor utility
async function processBatched<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrencyLimit: number
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];

  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const batch = items.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.allSettled(batch.map((item) => processor(item)));
    results.push(...batchResults);
  }

  return results;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Unbounded concurrency causes EMFILE errors
async function processDirectories(directories: string[]): Promise<void> {
  await Promise.all(directories.map((dir) => processDirectory(dir)));
}
```

**Rationale**:
Unbounded concurrency exhausts file descriptors (EMFILE error), memory, or network connections. Batching ensures predictable resource usage.

---

#### Rule 3.1.3: Use Promise.race for Timeout Implementation

| Attribute       | Value                                                |
| --------------- | ---------------------------------------------------- |
| **Enforcement** | SHOULD                                               |
| **Automation**  | Manual                                               |
| **Applies to**  | Long-running operations that need timeout protection |

**Rule Statement**:
Implement timeouts using `Promise.race()` with a timeout promise rather than external timeout mechanisms.

**Correct Examples**:

```typescript
// CORRECT: Race between operation and timeout
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const fetchPromise = fetch(url);
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}

// CORRECT: With proper cleanup
async function operationWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await operation();
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Rationale**:
`Promise.race` provides clean timeout semantics without external dependencies. Combined with AbortController, it enables proper cleanup.

---

### 3.2 Event Loop Management

#### Rule 3.2.1: Yield Control in Long-Running Loops

| Attribute       | Value                                      |
| --------------- | ------------------------------------------ |
| **Enforcement** | MUST                                       |
| **Automation**  | Code review                                |
| **Applies to**  | Loops processing more than 1000 iterations |

**Rule Statement**:
Loops processing large datasets MUST yield control to the event loop periodically using `setImmediate()` to prevent blocking.

**Correct Examples**:

```typescript
// CORRECT: Yield every 1000 iterations with cancellation support
async function processLargeDataset(items: string[], signal?: AbortSignal): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < items.length; i++) {
    // Yield control periodically
    if (i % 1000 === 0) {
      await new Promise((resolve) => setImmediate(resolve));

      // Check for cancellation after yielding
      if (signal?.aborted) {
        throw new AbortError('Operation cancelled');
      }
    }

    results.push(processItem(items[i]));
  }

  return results;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Blocks event loop for entire duration
function processLargeDataset(items: string[]): string[] {
  return items.map((item) => processItem(item));
}
```

**Rationale**:
Long synchronous loops block the event loop, preventing I/O operations, user interrupts, and other async tasks from executing.

---

#### Rule 3.2.2: All Async Operations Must Accept AbortSignal

| Attribute       | Value                                                 |
| --------------- | ----------------------------------------------------- |
| **Enforcement** | MUST                                                  |
| **Automation**  | Code review                                           |
| **Applies to**  | All async functions that may run for extended periods |

**Rule Statement**:
Async operations that may take significant time MUST accept an optional `AbortSignal` parameter and respect cancellation.

**Correct Examples**:

```typescript
// CORRECT: Cancellable delay utility
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (signal.aborted) {
    return Promise.reject(new AbortError());
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      reject(new AbortError());
    };

    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

// CORRECT: Cancellable file search
async function searchFiles(pattern: string, options: { signal?: AbortSignal }): Promise<string[]> {
  const { signal } = options;

  if (signal?.aborted) {
    throw new AbortError();
  }

  // Pass signal to child operations
  const files = await crawlDirectory(rootDir, { signal });
  return filterFiles(files, pattern, { signal });
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: No cancellation support
async function searchFiles(pattern: string): Promise<string[]> {
  const files = await crawlDirectory(rootDir);
  return filterFiles(files, pattern);
}
```

**Rationale**:
Users expect Ctrl+C to cancel operations immediately. Without AbortSignal support, operations continue running after user requests cancellation.

---

## 4. Caching Patterns

### 4.1 LRU Cache Implementation

#### Rule 4.1.1: Use LRU Cache for Bounded Memory Caching

| Attribute       | Value                                            |
| --------------- | ------------------------------------------------ |
| **Enforcement** | MUST                                             |
| **Automation**  | Code review                                      |
| **Applies to**  | Any in-memory cache without automatic expiration |

**Rule Statement**:
In-memory caches without TTL MUST use LRU (Least Recently Used) eviction to bound memory usage.

**Correct Examples**:

```typescript
// CORRECT: LRU cache implementation
export class LruCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Unbounded cache grows forever
const cache = new Map<string, Data>();

function getCached(key: string): Data | undefined {
  return cache.get(key);
}

function setCached(key: string, value: Data): void {
  cache.set(key, value); // Never evicts, memory leak
}
```

**Rationale**:
Unbounded caches cause memory leaks in long-running processes. LRU provides automatic eviction of least-used entries.

---

### 4.2 TTL-Based Caching

#### Rule 4.2.1: Implement TTL for Time-Sensitive Cache Data

| Attribute       | Value                                                                       |
| --------------- | --------------------------------------------------------------------------- |
| **Enforcement** | MUST                                                                        |
| **Automation**  | Code review                                                                 |
| **Applies to**  | Cached data that becomes stale over time (file system state, API responses) |

**Rule Statement**:
Caches storing time-sensitive data MUST implement TTL (Time To Live) with automatic expiration.

**Correct Examples**:

```typescript
// CORRECT: TTL cache with automatic cleanup
const cache = new Map<string, CachedData>();
const cacheTimers = new Map<string, NodeJS.Timeout>();

export function writeCache(key: string, data: CachedData, ttlMs: number): void {
  // Clear existing timer if present
  if (cacheTimers.has(key)) {
    clearTimeout(cacheTimers.get(key)!);
  }

  cache.set(key, data);

  // Set expiration timer
  const timerId = setTimeout(() => {
    cache.delete(key);
    cacheTimers.delete(key);
  }, ttlMs);

  cacheTimers.set(key, timerId);
}

export function readCache(key: string): CachedData | undefined {
  return cache.get(key);
}

export function clearCache(): void {
  for (const timerId of cacheTimers.values()) {
    clearTimeout(timerId);
  }
  cache.clear();
  cacheTimers.clear();
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: No expiration, stale data served forever
const cache = new Map<string, FileList>();

function cacheFileList(directory: string, files: FileList): void {
  cache.set(directory, files);
}
```

**Rationale**:
File system state, API responses, and computed data become stale. TTL ensures fresh data is eventually fetched.

---

### 4.3 Prefix-Based Result Caching

#### Rule 4.3.1: Use Prefix Matching for Incremental Search Caching

| Attribute       | Value                                             |
| --------------- | ------------------------------------------------- |
| **Enforcement** | SHOULD                                            |
| **Automation**  | Manual                                            |
| **Applies to**  | Search/filter operations with incremental queries |

**Rule Statement**:
Search caches SHOULD implement prefix matching to reuse results from shorter queries as the starting point for longer queries.

**Correct Examples**:

```typescript
// CORRECT: Prefix-aware search cache
class SearchCache {
  private cache = new Map<string, string[]>();
  private allFiles: string[];

  constructor(allFiles: string[]) {
    this.allFiles = allFiles;
  }

  async search(query: string): Promise<string[]> {
    // Check for exact match
    if (this.cache.has(query)) {
      return this.cache.get(query)!;
    }

    // Find longest prefix match
    let bestPrefix = '';
    for (const cachedQuery of this.cache.keys()) {
      if (query.startsWith(cachedQuery) && cachedQuery.length > bestPrefix.length) {
        bestPrefix = cachedQuery;
      }
    }

    // Search within prefix results or all files
    const searchSpace = bestPrefix ? this.cache.get(bestPrefix)! : this.allFiles;

    const results = await this.filterFiles(searchSpace, query);
    this.cache.set(query, results);
    return results;
  }

  private async filterFiles(files: string[], query: string): Promise<string[]> {
    return files.filter((file) => file.includes(query));
  }
}
```

**Rationale**:
When users type "foo" then "foobar", results for "foobar" are a subset of "foo". Prefix caching avoids re-scanning the entire dataset.

---

## 5. Memory Management

### 5.1 Buffer Size Limits

#### Rule 5.1.1: Define Explicit Limits for All Buffers

| Attribute       | Value                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| **Enforcement** | MUST                                                                     |
| **Automation**  | Code review                                                              |
| **Applies to**  | Any buffer that accumulates data (stdout, file content, response bodies) |

**Rule Statement**:
All data buffers MUST have explicit size limits defined as named constants.

**Standard Buffer Limits**:

```typescript
// CORRECT: Named constants for all buffer limits
export const BUFFER_LIMITS = {
  /** Maximum size for child process stdout/stderr */
  MAX_CHILD_PROCESS_BUFFER: 16 * 1024 * 1024, // 16 MB

  /** Maximum size for stdin input */
  MAX_STDIN_SIZE: 8 * 1024 * 1024, // 8 MB

  /** Maximum size for tool stdout capture */
  MAX_TOOL_OUTPUT: 10 * 1024 * 1024, // 10 MB

  /** Maximum size for fetched web content */
  MAX_FETCH_CONTENT: 100_000, // 100 KB

  /** Maximum line length before truncation */
  MAX_LINE_LENGTH: 2000,

  /** Maximum selected text from editor */
  MAX_SELECTED_TEXT: 16 * 1024, // 16 KB
} as const;
```

**Incorrect Examples**:

```typescript
// INCORRECT: Magic numbers, no limits
const buffer: string[] = [];
process.stdout.on('data', (chunk) => {
  buffer.push(chunk.toString()); // Unbounded growth
});
```

**Rationale**:
Unbounded buffers cause out-of-memory crashes. Named constants document limits and make them adjustable.

---

### 5.2 Large Data Truncation

#### Rule 5.2.1: Truncate Large Output with Indicators

| Attribute       | Value                                    |
| --------------- | ---------------------------------------- |
| **Enforcement** | MUST                                     |
| **Automation**  | Code review                              |
| **Applies to**  | User-facing output, logs, error messages |

**Rule Statement**:
When truncating data, MUST include an indicator showing what was omitted.

**Correct Examples**:

```typescript
// CORRECT: Truncate with clear indicator
function formatFileList(files: string[], maxDisplay: number = 10): string {
  if (files.length <= maxDisplay) {
    return files.join('\n');
  }

  const displayed = files.slice(0, maxDisplay);
  const remaining = files.length - maxDisplay;

  return `${displayed.join('\n')}\n... and ${remaining} more files`;
}

// CORRECT: Truncate long lines with indicator
function truncateLine(line: string, maxLength: number): string {
  if (line.length <= maxLength) {
    return line;
  }
  return `${line.slice(0, maxLength - 3)}...`;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Silent truncation, user doesn't know data is missing
function formatFileList(files: string[]): string {
  return files.slice(0, 10).join('\n');
}
```

**Rationale**:
Silent truncation hides information from users. Explicit indicators inform users that more data exists.

---

### 5.3 Binary Data Detection

#### Rule 5.3.1: Detect and Handle Binary Data Early

| Attribute       | Value                                           |
| --------------- | ----------------------------------------------- |
| **Enforcement** | MUST                                            |
| **Automation**  | Code review                                     |
| **Applies to**  | File reading, command output, network responses |

**Rule Statement**:
When processing data that may be binary, detect binary content within the first 4KB and handle appropriately.

**Correct Examples**:

```typescript
// CORRECT: Early binary detection
const MAX_SNIFF_SIZE = 4096;

function isBinaryBuffer(buffer: Buffer): boolean {
  const sniffSize = Math.min(buffer.length, MAX_SNIFF_SIZE);

  for (let i = 0; i < sniffSize; i++) {
    const byte = buffer[i];
    // NULL bytes or other control characters indicate binary
    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      return true;
    }
  }

  return false;
}

async function readFileContent(filePath: string): Promise<FileContent> {
  const buffer = await fs.readFile(filePath);

  if (isBinaryBuffer(buffer)) {
    return {
      type: 'binary',
      size: buffer.length,
      message: `Binary file (${buffer.length} bytes)`,
    };
  }

  return {
    type: 'text',
    content: buffer.toString('utf-8'),
  };
}
```

**Rationale**:
Processing large binary files as text wastes memory and produces garbage output. Early detection prevents resource waste.

---

## 6. Rate Limiting and Retry Patterns

### 6.1 Exponential Backoff

#### Rule 6.1.1: Implement Exponential Backoff with Jitter

| Attribute       | Value                                  |
| --------------- | -------------------------------------- |
| **Enforcement** | MUST                                   |
| **Automation**  | Code review                            |
| **Applies to**  | All retry logic for transient failures |

**Rule Statement**:
Retry mechanisms MUST implement exponential backoff with jitter to prevent thundering herd problems.

**Correct Examples**:

```typescript
// CORRECT: Full retry implementation with backoff and jitter
export interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  shouldRetry: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  initialDelayMs: 5000,
  maxDelayMs: 30000,
  shouldRetry: (error) => isTransientError(error),
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  signal?: AbortSignal
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 0;
  let currentDelay = config.initialDelayMs;

  while (attempt < config.maxAttempts) {
    attempt++;

    try {
      return await operation();
    } catch (error) {
      if (!(error instanceof Error) || !config.shouldRetry(error)) {
        throw error;
      }

      if (attempt >= config.maxAttempts) {
        throw error;
      }

      // Exponential backoff with jitter (±30%)
      const jitter = currentDelay * 0.3 * (Math.random() * 2 - 1);
      const delayWithJitter = Math.max(0, currentDelay + jitter);

      await delay(delayWithJitter, signal);

      // Double delay for next attempt, capped at max
      currentDelay = Math.min(config.maxDelayMs, currentDelay * 2);
    }
  }

  throw new Error('Retry loop exited unexpectedly');
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: Fixed delay causes thundering herd
async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 3; i++) {
    try {
      return await operation();
    } catch {
      await delay(5000); // All clients retry at same time
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Rationale**:
Fixed delays cause synchronized retries across clients (thundering herd). Jitter distributes retry attempts over time.

---

### 6.2 Retry Decision Logic

#### Rule 6.2.1: Classify Errors for Retry Decisions

| Attribute       | Value                |
| --------------- | -------------------- |
| **Enforcement** | MUST                 |
| **Automation**  | Code review          |
| **Applies to**  | All retry mechanisms |

**Rule Statement**:
Retry logic MUST classify errors and only retry transient failures. Terminal failures MUST fail immediately.

**Correct Examples**:

```typescript
// CORRECT: Error classification for retry decisions
function isTransientError(error: Error): boolean {
  if (error instanceof ApiError) {
    // Don't retry client errors (except rate limiting)
    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return false;
    }
    // Retry rate limiting and server errors
    return error.status === 429 || (error.status >= 500 && error.status < 600);
  }

  // Retry network errors
  if (error instanceof NetworkError) {
    return true;
  }

  // Don't retry validation errors
  if (error instanceof ValidationError) {
    return false;
  }

  return false;
}

// CORRECT: Separate retryable and terminal error types
class RetryableQuotaError extends Error {
  constructor(
    message: string,
    readonly retryAfterMs: number
  ) {
    super(message);
    this.name = 'RetryableQuotaError';
  }
}

class TerminalQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TerminalQuotaError';
  }
}
```

**Rationale**:
Retrying terminal errors (auth failures, validation errors) wastes time and resources. Only transient errors benefit from retries.

---

## 7. File System Optimization

### 7.1 Directory Traversal

#### Rule 7.1.1: Use Pointer-Based Queue for BFS Traversal

| Attribute       | Value                             |
| --------------- | --------------------------------- |
| **Enforcement** | SHOULD                            |
| **Automation**  | Code review                       |
| **Applies to**  | Breadth-first directory traversal |

**Rule Statement**:
BFS directory traversal SHOULD use pointer-based queue advancement instead of `shift()` to avoid O(n) array operations.

**Correct Examples**:

```typescript
// CORRECT: Pointer-based queue avoids expensive shift()
async function bfsTraversal(rootDir: string, maxDirs: number): Promise<string[]> {
  const queue: string[] = [rootDir];
  const visited = new Set<string>();
  const results: string[] = [];

  let queueHead = 0; // Pointer instead of shift()
  let scannedCount = 0;

  while (queueHead < queue.length && scannedCount < maxDirs) {
    const currentDir = queue[queueHead];
    queueHead++; // O(1) vs O(n) for shift()

    if (visited.has(currentDir)) {
      continue;
    }
    visited.add(currentDir);
    scannedCount++;

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          queue.push(fullPath);
        } else {
          results.push(fullPath);
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  return results;
}
```

**Incorrect Examples**:

```typescript
// INCORRECT: shift() is O(n) on each call
while (queue.length > 0) {
  const currentDir = queue.shift()!; // O(n) operation
  // ...
}
```

**Rationale**:
`Array.shift()` is O(n) because it re-indexes all elements. Pointer advancement is O(1).

---

### 7.2 Parallel Directory Reading

#### Rule 7.2.1: Batch Parallel Directory Reads

| Attribute       | Value                          |
| --------------- | ------------------------------ |
| **Enforcement** | MUST                           |
| **Automation**  | Code review                    |
| **Applies to**  | Directory traversal operations |

**Rule Statement**:
Directory reads MUST be batched with controlled parallelism to balance throughput and resource usage.

**Correct Examples**:

```typescript
// CORRECT: Batched parallel directory reading
const PARALLEL_BATCH_SIZE = 15;

async function crawlDirectories(directories: string[]): Promise<FileEntry[]> {
  const allEntries: FileEntry[] = [];

  for (let i = 0; i < directories.length; i += PARALLEL_BATCH_SIZE) {
    const batch = directories.slice(i, i + PARALLEL_BATCH_SIZE);

    const readPromises = batch.map(async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        return { dir, entries, error: null };
      } catch (error) {
        return { dir, entries: [], error };
      }
    });

    const results = await Promise.all(readPromises);

    for (const { entries } of results) {
      allEntries.push(...entries);
    }
  }

  return allEntries;
}
```

**Rationale**:
Parallel reads improve throughput on SSDs and network filesystems. Batching prevents file descriptor exhaustion.

---

## 8. Algorithm Selection

### 8.1 Data-Size-Based Algorithm Selection

#### Rule 8.1.1: Select Algorithms Based on Input Size

| Attribute       | Value                                                          |
| --------------- | -------------------------------------------------------------- |
| **Enforcement** | SHOULD                                                         |
| **Automation**  | Manual                                                         |
| **Applies to**  | Search, sort, and filter operations on variable-sized datasets |

**Rule Statement**:
When multiple algorithms are available, select based on input size to optimize for the common case.

**Correct Examples**:

```typescript
// CORRECT: Algorithm selection based on data size
const LARGE_DATASET_THRESHOLD = 20000;

function createSearcher(files: string[]): Searcher {
  // Use faster but less accurate algorithm for large datasets
  const algorithm =
    files.length > LARGE_DATASET_THRESHOLD
      ? 'fast' // O(n) simple matching
      : 'fuzzy'; // O(n log n) fuzzy matching

  return new Searcher(files, { algorithm });
}

// CORRECT: Different strategies for small vs large collections
function findDuplicates<T>(items: T[], keyFn: (item: T) => string): T[][] {
  if (items.length < 100) {
    // Simple O(n²) comparison for small sets
    return findDuplicatesNaive(items, keyFn);
  }
  // Hash-based O(n) approach for larger sets
  return findDuplicatesHashed(items, keyFn);
}
```

**Rationale**:
Optimal algorithms differ by input size. Fuzzy matching may be acceptable for small datasets but too slow for large ones.

---

## 9. Performance Constants Reference

### 9.1 Standard Timeout Values

| Constant             | Value            | Use Case                     |
| -------------------- | ---------------- | ---------------------------- |
| `DEFAULT_TIMEOUT_MS` | 120,000 (2 min)  | General async operations     |
| `HOOK_TIMEOUT_MS`    | 60,000 (1 min)   | Hook execution               |
| `FETCH_TIMEOUT_MS`   | 10,000 (10 sec)  | HTTP requests                |
| `MCP_TIMEOUT_MS`     | 600,000 (10 min) | Long-running tool operations |

### 9.2 Standard Concurrency Limits

| Constant                      | Value | Use Case                   |
| ----------------------------- | ----- | -------------------------- |
| `FILE_OPERATION_CONCURRENCY`  | 10    | File read/write operations |
| `DIRECTORY_SCAN_CONCURRENCY`  | 15    | Directory traversal        |
| `NETWORK_REQUEST_CONCURRENCY` | 5     | External API calls         |
| `HOOK_EXECUTION_CONCURRENCY`  | 10    | Parallel hook execution    |

### 9.3 Standard Buffer Sizes

| Constant                   | Value       | Use Case                 |
| -------------------------- | ----------- | ------------------------ |
| `MAX_CHILD_PROCESS_BUFFER` | 16 MB       | Subprocess stdout/stderr |
| `MAX_STDIN_SIZE`           | 8 MB        | User input               |
| `MAX_TOOL_OUTPUT`          | 10 MB       | Tool result capture      |
| `MAX_FETCH_CONTENT`        | 100 KB      | Web content              |
| `MAX_LINE_LENGTH`          | 2,000 chars | Single line display      |

### 9.4 Standard History/Queue Limits

| Constant               | Value  | Use Case             |
| ---------------------- | ------ | -------------------- |
| `MAX_CHAT_TURNS`       | 100    | Conversation history |
| `MAX_SHELL_HISTORY`    | 100    | Command history      |
| `MAX_EVENT_BACKLOG`    | 10,000 | Event queue          |
| `MAX_TELEMETRY_EVENTS` | 1,000  | Telemetry buffer     |

### 9.5 Standard Retry Parameters

| Constant                 | Value  | Use Case            |
| ------------------------ | ------ | ------------------- |
| `MAX_RETRY_ATTEMPTS`     | 3      | Default retry count |
| `INITIAL_RETRY_DELAY_MS` | 5,000  | First retry delay   |
| `MAX_RETRY_DELAY_MS`     | 30,000 | Maximum backoff     |
| `JITTER_FACTOR`          | 0.3    | ±30% randomization  |

---

## 10. Anti-Patterns

### 10.1 Forbidden Patterns

| Pattern                                      | Why Forbidden                         | Correct Alternative             |
| -------------------------------------------- | ------------------------------------- | ------------------------------- |
| Unbounded caches                             | Memory leak in long-running processes | LRU cache with maxSize          |
| `Promise.all` for partial-success operations | One failure loses all results         | `Promise.allSettled`            |
| Fixed retry delays                           | Thundering herd problem               | Exponential backoff with jitter |
| `Array.shift()` in hot loops                 | O(n) per operation                    | Pointer-based queue             |
| Sync operations on large files               | Blocks event loop                     | Async + streaming               |
| Retrying terminal errors                     | Wastes resources                      | Error classification            |
| No timeout on external calls                 | Hangs indefinitely                    | `Promise.race` with timeout     |
| Processing binary as text                    | Memory waste, garbage output          | Early binary detection          |

### 10.2 Common Violations

```typescript
// VIOLATION: Blocking event loop with large sync operation
const content = fs.readFileSync(largePath, 'utf-8'); // Blocks!
processContent(content);

// FIX: Use async with streaming
const stream = fs.createReadStream(largePath, { encoding: 'utf-8' });
for await (const chunk of stream) {
  await processChunk(chunk);
}
```

```typescript
// VIOLATION: No cancellation support
async function longOperation(): Promise<Result> {
  // User cannot cancel this
  return await expensiveComputation();
}

// FIX: Accept and check AbortSignal
async function longOperation(signal?: AbortSignal): Promise<Result> {
  if (signal?.aborted) throw new AbortError();
  return await expensiveComputation(signal);
}
```

---

## 11. Decision Flowcharts

### 11.1 Concurrency Strategy Selection

```
What type of concurrent operations?
│
├─ Independent operations, partial success OK?
│   └─ Use Promise.allSettled
│
├─ All must succeed, fail fast on error?
│   └─ Use Promise.all
│
├─ Race to first completion (timeout)?
│   └─ Use Promise.race
│
├─ Resource-intensive (files, network)?
│   └─ Use batched concurrency with limit
│
└─ Sequential dependencies?
    └─ Use await in sequence
```

### 11.2 Cache Type Selection

```
What are the cache requirements?
│
├─ Data has known expiration time?
│   └─ TTL-based cache
│
├─ Data size unpredictable?
│   └─ LRU cache with maxSize
│
├─ Incremental search/filter?
│   └─ Prefix-matching cache
│
├─ Simple key-value, known scope?
│   └─ Map with cleanup on scope exit
│
└─ Cross-process persistence?
    └─ File-based cache (not in-memory)
```

### 11.3 Retry Decision

```
Should this error be retried?
│
├─ HTTP 400 (Bad Request)?
│   └─ NO - Fix the request
│
├─ HTTP 401/403 (Auth)?
│   └─ NO - Fix credentials
│
├─ HTTP 429 (Rate Limited)?
│   └─ YES - With backoff
│
├─ HTTP 5xx (Server Error)?
│   └─ YES - With backoff
│
├─ Network timeout?
│   └─ YES - With backoff
│
├─ Validation error?
│   └─ NO - Fix input
│
└─ Unknown error?
    └─ NO - Log and fail
```

---

## 12. Enforcement

### 12.1 ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Prevent sync file operations
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'CallExpression[callee.property.name=/^(readFileSync|writeFileSync|readdirSync)$/]',
        message: 'Use async file operations instead of sync versions',
      },
    ],

    // Prevent unbounded loops without yields
    'no-await-in-loop': 'warn',
  },
};
```

### 12.2 Code Review Checklist

- [ ] All async operations accept optional AbortSignal
- [ ] Caches have explicit size limits (LRU or TTL)
- [ ] Buffer sizes are bounded with named constants
- [ ] Retry logic uses exponential backoff with jitter
- [ ] Large loops yield to event loop periodically
- [ ] `Promise.allSettled` used for partial-success scenarios
- [ ] Timeouts specified for external operations
- [ ] Binary content detected before text processing

### 12.3 Performance Testing Requirements

| Metric                    | Target      | Test Method           |
| ------------------------- | ----------- | --------------------- |
| CLI startup time          | < 500ms     | Benchmark script      |
| Memory under load         | < 512MB     | Load test with limits |
| Response to Ctrl+C        | < 100ms     | Manual testing        |
| File search (10k files)   | < 2s        | Benchmark script      |
| Retry backoff correctness | Exponential | Unit test             |

---

## 13. Exceptions

### 13.1 Valid Exception Scenarios

| Scenario                    | Justification                                | Documentation Required    |
| --------------------------- | -------------------------------------------- | ------------------------- |
| Startup-critical sync reads | Blocking acceptable before event loop starts | Comment explaining timing |
| Small fixed-size operations | Overhead of async exceeds benefit            | Size limit documented     |
| Test fixtures               | Performance not relevant in tests            | None                      |

### 13.2 Exception Documentation

```typescript
/**
 * PERFORMANCE EXCEPTION: STD-015 Rule 5.1.1
 * Reason: Config file read at startup before event loop.
 * Size limit: Config file must be < 1KB.
 * Alternative considered: Async read adds complexity for no benefit at startup.
 */
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
```

---

## 14. Quick Reference

### 14.1 Concurrency Patterns Summary

| Pattern              | Use When             | Example                    |
| -------------------- | -------------------- | -------------------------- |
| `Promise.all`        | All must succeed     | Validating multiple inputs |
| `Promise.allSettled` | Partial success OK   | Processing multiple files  |
| `Promise.race`       | First wins / timeout | Timeout implementation     |
| Batched execution    | Resource-limited     | File operations            |
| Sequential await     | Dependencies exist   | Multi-step workflows       |

### 14.2 Cache Pattern Summary

| Pattern      | Use When                  | Eviction            |
| ------------ | ------------------------- | ------------------- |
| LRU Cache    | Memory-bounded, no expiry | Least recently used |
| TTL Cache    | Time-sensitive data       | After TTL expires   |
| Prefix Cache | Incremental search        | Manual clear        |
| Simple Map   | Known scope lifetime      | Scope exit          |

### 14.3 Key Constants Cheat Sheet

```
Timeouts:   DEFAULT=2min  HOOK=1min  FETCH=10sec  MCP=10min
Buffers:    PROCESS=16MB  STDIN=8MB  TOOL=10MB    FETCH=100KB
Concurrency: FILES=10     DIRS=15    NETWORK=5    HOOKS=10
Retry:      ATTEMPTS=3    INITIAL=5s  MAX=30s     JITTER=±30%
```

---

## 15. Traceability

### 15.1 Rules Index

| Rule ID | Title                                             | Enforcement | Automation  |
| ------- | ------------------------------------------------- | ----------- | ----------- |
| 3.1.1   | Use Promise.allSettled for Independent Operations | MUST        | Code review |
| 3.1.2   | Implement Batched Concurrency                     | MUST        | Code review |
| 3.1.3   | Use Promise.race for Timeout                      | SHOULD      | Manual      |
| 3.2.1   | Yield Control in Long-Running Loops               | MUST        | Code review |
| 3.2.2   | All Async Operations Accept AbortSignal           | MUST        | Code review |
| 4.1.1   | Use LRU Cache for Bounded Memory                  | MUST        | Code review |
| 4.2.1   | Implement TTL for Time-Sensitive Cache            | MUST        | Code review |
| 4.3.1   | Use Prefix Matching for Search Caching            | SHOULD      | Manual      |
| 5.1.1   | Define Explicit Limits for All Buffers            | MUST        | Code review |
| 5.2.1   | Truncate Large Output with Indicators             | MUST        | Code review |
| 5.3.1   | Detect and Handle Binary Data Early               | MUST        | Code review |
| 6.1.1   | Implement Exponential Backoff with Jitter         | MUST        | Code review |
| 6.2.1   | Classify Errors for Retry Decisions               | MUST        | Code review |
| 7.1.1   | Use Pointer-Based Queue for BFS                   | SHOULD      | Code review |
| 7.2.1   | Batch Parallel Directory Reads                    | MUST        | Code review |
| 8.1.1   | Select Algorithms Based on Input Size             | SHOULD      | Manual      |

### 15.2 Related Standards

| Standard               | Relationship                                                |
| ---------------------- | ----------------------------------------------------------- |
| STD-005 Architecture   | Defines component patterns that use these performance rules |
| STD-006 Error Handling | Defines error types referenced in retry logic               |
| STD-007 Testing        | Defines performance testing requirements                    |
| STD-013 Logging        | Defines telemetry limits and patterns                       |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
