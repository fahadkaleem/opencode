---
title: Performance Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-21
applies_to:
  - Core Package
  - CLI Package
  - All Services
related_patterns:
  - ./05-testing-patterns.md#performance-testing
  - ./11-stream-processing.md#async-patterns
  - ./08-dependency-management.md#lazy-initialization
---

# 14. Performance Patterns

> **Purpose**: Production-tested performance optimization patterns including caching, rate limiting, lazy initialization, and memory management to ensure responsive user experience.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: LRU Cache with Automatic Eviction](#pattern-1-lru-cache-with-automatic-eviction)
- [Pattern 2: Prefix-Based Result Cache](#pattern-2-prefix-based-result-cache)
- [Pattern 3: TTL-Based Cache with Hash Invalidation](#pattern-3-ttl-based-cache-with-hash-invalidation)
- [Pattern 4: Batched Async Operations](#pattern-4-batched-async-operations)
- [Pattern 5: Event Loop Yielding](#pattern-5-event-loop-yielding)
- [Pattern 6: Adaptive Algorithm Selection](#pattern-6-adaptive-algorithm-selection)
- [Pattern 7: Rate Limiting with Priority Levels](#pattern-7-rate-limiting-with-priority-levels)
- [Pattern 8: High Water Mark Detection](#pattern-8-high-water-mark-detection)
- [Pattern 9: Lazy Initialization with State Guards](#pattern-9-lazy-initialization-with-state-guards)
- [Quick Reference](#quick-reference)
- [Related Patterns](#related-patterns)
- [References](#references)
- [Changelog](#changelog)

---

## Overview

Performance optimization is critical for CLI tools where users expect instant feedback. Poor performance manifests as slow command execution, UI freezes, high memory usage, or excessive API calls. These patterns address common performance bottlenecks through proven techniques.

Effective performance optimization requires measurement before optimization, choosing the right pattern for the specific bottleneck, and validating improvements with metrics. Premature optimization wastes effort, but neglecting performance creates poor user experience.

**Why performance patterns matter:**

- Prevent UI blocking during expensive operations
- Reduce redundant computations and API calls
- Control memory growth in long-running processes
- Minimize file system operations
- Provide responsive user experience

**In this document:**

- **LRU Cache** - Memory-bounded caching with automatic eviction
- **Prefix-Based Result Cache** - Incremental search optimization
- **TTL-Based Cache** - Time-based cache invalidation with hash fingerprinting
- **Batched Async Operations** - Prevent resource exhaustion with concurrency limits
- **Event Loop Yielding** - Prevent blocking during large operations
- **Adaptive Algorithm Selection** - Choose algorithms based on dataset size
- **Rate Limiting** - Control event frequency with priority levels
- **High Water Mark Detection** - Detect significant metric changes
- **Lazy Initialization** - Defer expensive initialization until needed

**Prerequisites:**

- Understanding of JavaScript event loop
- Familiarity with async/await patterns
- Basic knowledge of caching strategies
- Understanding of TypeScript generics

---

## Pattern 1: LRU Cache with Automatic Eviction

### Intent

Implement memory-bounded caching that automatically evicts least recently used items when capacity is reached.

### Problem

Unbounded caches grow indefinitely, consuming memory until the application crashes. Manual cache management is error-prone and adds complexity. Fixed-size caches without eviction strategy either reject new entries or overwrite randomly, both leading to poor cache hit rates.

### Solution

Use a Least Recently Used (LRU) cache that maintains a fixed maximum size and automatically evicts the oldest entry when adding new items to a full cache. Access operations update the recency order, keeping frequently accessed items in cache longer.

### Structure

```typescript
class LruCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  get(key: K): V | undefined; // Updates recency
  set(key: K, value: V): void; // Evicts if needed
}
```

### Implementation

**Step 1: Initialize cache with max size**

```typescript
export class LruCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map<K, V>();
    this.maxSize = maxSize;
  }
}
```

**Step 2: Implement get with recency update**

```typescript
get(key: K): V | undefined {
  const value = this.cache.get(key);
  if (value !== undefined) {
    // Move to end to mark as recently used
    // Map maintains insertion order
    this.cache.delete(key);
    this.cache.set(key, value);
  }
  return value;
}
```

**Step 3: Implement set with automatic eviction**

```typescript
set(key: K, value: V): void {
  if (this.cache.has(key)) {
    // Update existing entry and move to end
    this.cache.delete(key);
  } else if (this.cache.size >= this.maxSize) {
    // Evict least recently used (first entry)
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
    }
  }
  this.cache.set(key, value);
}
```

### Complete Example

```typescript
// packages/core/src/utils/LruCache.ts
export class LruCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map<K, V>();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end to mark as recently used
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
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

  get size(): number {
    return this.cache.size;
  }
}

// Usage: Cache parsed workflow definitions
const workflowCache = new LruCache<string, Workflow>(50);

async function loadWorkflow(path: string): Promise<Workflow> {
  const cached = workflowCache.get(path);
  if (cached) {
    return cached;
  }

  const workflow = await parseWorkflowFile(path);
  workflowCache.set(path, workflow);
  return workflow;
}
```

**Example explained:**

- Lines 1-9: Constructor initializes Map and max size
- Lines 11-19: Get operation moves accessed items to end (marks as recent)
- Lines 21-32: Set evicts oldest item when at capacity
- Lines 34-46: Utility methods for cache management
- Lines 49-60: Real-world usage caching parsed workflows

### When to Use

**Use this pattern when:**

- Caching expensive operations with unbounded input space
- Memory budget is limited and fixed
- Recent items are more likely to be accessed again
- Cache hit rate is more important than cache completeness

**Avoid this pattern when:**

- All items must be cached (use different eviction policy)
- Cache size is very small (overhead may not be worth it)
- Access pattern is not recency-based (consider LFU or other policies)

### Benefits

- **Memory Safety**: Guaranteed maximum memory usage
- **Automatic Management**: No manual eviction logic needed
- **Good Hit Rates**: Recency-based eviction works well for many access patterns
- **Simple API**: Minimal interface, easy to use

### Trade-offs

- **Eviction Overhead**: Each get/set operation requires delete+set
- **Not Optimal for All Patterns**: LRU may evict important items if access pattern is not recency-based
- **No TTL**: Items never expire based on time

### Common Mistakes

**Mistake 1: Forgetting to update recency on get**

**Bad example:**

```typescript
get(key: K): V | undefined {
  return this.cache.get(key);
  // Does not mark as recently used
}
```

**Correct approach:**

```typescript
get(key: K): V | undefined {
  const value = this.cache.get(key);
  if (value !== undefined) {
    // Update recency by moving to end
    this.cache.delete(key);
    this.cache.set(key, value);
  }
  return value;
}
```

**Why this matters**: Without updating recency, frequently accessed items get evicted, defeating the LRU strategy.

**Mistake 2: Not handling existing keys in set**

**Bad example:**

```typescript
set(key: K, value: V): void {
  if (this.cache.size >= this.maxSize) {
    const firstKey = this.cache.keys().next().value;
    this.cache.delete(firstKey);
  }
  this.cache.set(key, value);
  // If key exists, cache grows beyond maxSize
}
```

**Correct approach:**

```typescript
set(key: K, value: V): void {
  if (this.cache.has(key)) {
    this.cache.delete(key); // Remove first to avoid size increase
  } else if (this.cache.size >= this.maxSize) {
    const firstKey = this.cache.keys().next().value;
    this.cache.delete(firstKey);
  }
  this.cache.set(key, value);
}
```

**Why this matters**: Updating existing keys without checking causes cache to exceed maxSize.

### Testing Strategy

**What to Test:**

- Cache respects max size limit
- LRU eviction order is correct
- Get operations update recency
- Updating existing keys does not increase size

**Test Organization:**

- Co-locate tests: `LruCache.ts` → `LruCache.test.ts`
- Test each operation independently
- Test eviction scenarios

**Mock Strategy:**

- No mocks needed - pure data structure
- Use real Map implementation

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { LruCache } from './LruCache.js';

describe('LruCache', () => {
  it('should respect maximum size', () => {
    // Arrange
    const cache = new LruCache<string, number>(3);

    // Act
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // Should evict 'a'

    // Assert
    expect(cache.size).to.equal(3);
    expect(cache.has('a')).to.be.false;
    expect(cache.has('d')).to.be.true;
  });

  it('should evict least recently used item', () => {
    // Arrange
    const cache = new LruCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Act: Access 'a' to make it recently used
    cache.get('a');
    cache.set('d', 4); // Should evict 'b', not 'a'

    // Assert
    expect(cache.has('a')).to.be.true;
    expect(cache.has('b')).to.be.false;
    expect(cache.has('d')).to.be.true;
  });

  it('should update existing keys without increasing size', () => {
    // Arrange
    const cache = new LruCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);

    // Act
    cache.set('a', 10);

    // Assert
    expect(cache.size).to.equal(2);
    expect(cache.get('a')).to.equal(10);
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Branch coverage: 100%
- Test all eviction scenarios

### Related Patterns

- **[TTL-Based Cache](#pattern-3-ttl-based-cache-with-hash-invalidation)** - Combines size and time-based eviction
- **[Lazy Initialization](#pattern-9-lazy-initialization-with-state-guards)** - Often used together with caching

---

## Pattern 2: Prefix-Based Result Cache

### Intent

Optimize incremental searches by reusing results from broader queries as the starting point for narrower queries.

### Problem

Incremental searches (user typing "foo" then "foobar") repeat expensive filtering operations over the entire dataset. Each keystroke triggers a full search, causing poor performance and UI lag. This is particularly problematic for large file lists or search results.

### Solution

Cache search results keyed by query string. When a new query is a continuation of a previous query (shares a prefix), use the cached results from the prefix as the starting dataset instead of filtering all items again.

### Structure

```typescript
class ResultCache {
  private cache: Map<string, string[]>;

  // Returns exact match or best prefix match
  get(
    query: string,
    allItems: string[]
  ): {
    items: string[];
    isExactMatch: boolean;
  };

  set(query: string, results: string[]): void;
}
```

### Implementation

**Step 1: Check for exact cache match**

```typescript
export class ResultCache {
  private readonly cache: Map<string, string[]>;
  private hits = 0;
  private misses = 0;

  constructor(private allFiles: string[]) {
    this.cache = new Map<string, string[]>();
  }

  async get(query: string): Promise<{ files: string[]; isExactMatch: boolean }> {
    const isCacheHit = this.cache.has(query);

    if (isCacheHit) {
      this.hits++;
      return { files: this.cache.get(query)!, isExactMatch: true };
    }

    this.misses++;
    // Continue to prefix matching...
  }
}
```

**Step 2: Find best prefix match**

```typescript
async get(query: string): Promise<{ files: string[]; isExactMatch: boolean }> {
  // ... exact match check from Step 1

  // Find most specific cached query that is a prefix of current query
  let bestBaseQuery = '';
  for (const key of this.cache.keys()) {
    if (query.startsWith(key) && key.length > bestBaseQuery.length) {
      bestBaseQuery = key;
    }
  }

  // Use prefix results as starting point
  const filesToSearch = bestBaseQuery
    ? this.cache.get(bestBaseQuery)!
    : this.allFiles;

  return { files: filesToSearch, isExactMatch: false };
}
```

**Step 3: Cache new results**

```typescript
set(query: string, results: string[]): void {
  this.cache.set(query, results);
}

getStats(): { hits: number; misses: number; hitRate: number } {
  const total = this.hits + this.misses;
  return {
    hits: this.hits,
    misses: this.misses,
    hitRate: total > 0 ? this.hits / total : 0
  };
}
```

### Complete Example

```typescript
// packages/core/src/utils/filesearch/result-cache.ts
export class ResultCache {
  private readonly cache: Map<string, string[]>;
  private hits = 0;
  private misses = 0;

  constructor(private allFiles: string[]) {
    this.cache = new Map<string, string[]>();
  }

  async get(query: string): Promise<{ files: string[]; isExactMatch: boolean }> {
    const isCacheHit = this.cache.has(query);

    if (isCacheHit) {
      this.hits++;
      return { files: this.cache.get(query)!, isExactMatch: true };
    }

    this.misses++;

    // Core optimization: Find most specific cached prefix query
    let bestBaseQuery = '';
    for (const key of this.cache.keys()) {
      if (query.startsWith(key) && key.length > bestBaseQuery.length) {
        bestBaseQuery = key;
      }
    }

    const filesToSearch = bestBaseQuery ? this.cache.get(bestBaseQuery)! : this.allFiles;

    return { files: filesToSearch, isExactMatch: false };
  }

  set(query: string, results: string[]): void {
    this.cache.set(query, results);
  }

  getStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}

// Usage: File search with prefix optimization
async function searchFiles(query: string, allFiles: string[]): Promise<string[]> {
  const cache = new ResultCache(allFiles);

  // Get cached results or subset to search
  const { files, isExactMatch } = await cache.get(query);

  if (isExactMatch) {
    return files;
  }

  // Filter items by query (smaller dataset from prefix)
  const results = files.filter((file) => file.includes(query));

  // Cache results for future queries
  cache.set(query, results);

  return results;
}
```

**Example explained:**

- Lines 1-8: Constructor initializes cache and statistics
- Lines 10-18: Check for exact match first (fastest path)
- Lines 22-29: Find longest cached prefix (optimization)
- Lines 31-34: Return prefix results or all files
- Lines 52-67: Real-world usage showing dramatic performance improvement

### When to Use

**Use this pattern when:**

- Users perform incremental searches (typing character by character)
- Dataset is large and filtering is expensive
- Queries naturally build on previous queries
- Search results are subsets of broader queries

**Avoid this pattern when:**

- Queries are random with no prefix relationships
- Dataset is small and filtering is cheap
- Memory constraints prevent caching results

### Benefits

- **Dramatic Performance Gain**: Searches narrower dataset instead of all items
- **Automatic Optimization**: No user intervention needed
- **Statistics Tracking**: Monitor cache effectiveness with hit rates
- **Graceful Degradation**: Falls back to full search if no prefix match

### Trade-offs

- **Memory Usage**: Stores results for each query
- **Prefix Search Overhead**: Must iterate cache keys to find best prefix
- **Stale Data**: Cached results not updated if underlying data changes

### Common Mistakes

**Mistake 1: Not finding longest prefix**

**Bad example:**

```typescript
// Returns first prefix found
let bestBaseQuery = '';
for (const key of this.cache.keys()) {
  if (query.startsWith(key)) {
    bestBaseQuery = key;
    break; // Stops at first match
  }
}
```

**Correct approach:**

```typescript
// Finds longest prefix for maximum optimization
let bestBaseQuery = '';
for (const key of this.cache.keys()) {
  if (query.startsWith(key) && key.length > bestBaseQuery.length) {
    bestBaseQuery = key;
  }
}
```

**Why this matters**: Shorter prefixes return larger datasets, reducing optimization benefit.

**Mistake 2: Not tracking statistics**

**Bad example:**

```typescript
async get(query: string): Promise<{ files: string[]; isExactMatch: boolean }> {
  if (this.cache.has(query)) {
    return { files: this.cache.get(query)!, isExactMatch: true };
  }
  // No hit/miss tracking
}
```

**Correct approach:**

```typescript
async get(query: string): Promise<{ files: string[]; isExactMatch: boolean }> {
  if (this.cache.has(query)) {
    this.hits++; // Track successes
    return { files: this.cache.get(query)!, isExactMatch: true };
  }
  this.misses++; // Track failures
  // ...
}
```

**Why this matters**: Statistics reveal cache effectiveness and guide tuning.

### Testing Strategy

**What to Test:**

- Exact match returns cached results
- Prefix match uses narrower dataset
- Statistics accurately track hits and misses
- Handles queries with no prefix matches

**Test Organization:**

- Co-locate tests: `result-cache.ts` → `result-cache.test.ts`
- Test progressive query refinement
- Verify optimization behavior

**Mock Strategy:**

- No mocks needed - test with real data
- Use small test datasets for clarity

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { ResultCache } from './result-cache.js';

describe('ResultCache', () => {
  it('should return exact match from cache', async () => {
    // Arrange
    const allFiles = ['foo.txt', 'foobar.js', 'baz.md'];
    const cache = new ResultCache(allFiles);
    cache.set('foo', ['foo.txt', 'foobar.js']);

    // Act
    const { files, isExactMatch } = await cache.get('foo');

    // Assert
    expect(isExactMatch).to.be.true;
    expect(files).to.deep.equal(['foo.txt', 'foobar.js']);
  });

  it('should use prefix results as starting point', async () => {
    // Arrange
    const allFiles = ['foo.txt', 'foobar.js', 'foobaz.md', 'other.txt'];
    const cache = new ResultCache(allFiles);
    cache.set('foo', ['foo.txt', 'foobar.js', 'foobaz.md']);

    // Act: Query for 'foobar' should search within 'foo' results
    const { files, isExactMatch } = await cache.get('foobar');

    // Assert: Should return 'foo' cached results, not all files
    expect(isExactMatch).to.be.false;
    expect(files).to.deep.equal(['foo.txt', 'foobar.js', 'foobaz.md']);
    expect(files).to.not.include('other.txt');
  });

  it('should track cache statistics', async () => {
    // Arrange
    const cache = new ResultCache(['a', 'b', 'c']);
    cache.set('query', ['a']);

    // Act
    await cache.get('query'); // Hit
    await cache.get('other'); // Miss

    // Assert
    const stats = cache.getStats();
    expect(stats.hits).to.equal(1);
    expect(stats.misses).to.equal(1);
    expect(stats.hitRate).to.equal(0.5);
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Branch coverage: 100%
- Test prefix matching logic thoroughly

### Related Patterns

- **[LRU Cache](#pattern-1-lru-cache-with-automatic-eviction)** - Can combine for memory-bounded prefix cache
- **[Event Loop Yielding](#pattern-5-event-loop-yielding)** - Used during filtering operations

---

## Pattern 3: TTL-Based Cache with Hash Invalidation

### Intent

Implement time-based cache expiration combined with content-based invalidation using hash fingerprinting.

### Problem

Caches need invalidation strategies beyond size limits. Stale data causes bugs when underlying content changes. Time-based expiration alone misses content changes, while hash-based alone retains stale data indefinitely. Manual invalidation is error-prone and requires explicit coordination.

### Solution

Combine time-to-live (TTL) automatic expiration with SHA256 hash-based cache keys. Cache entries auto-delete after TTL expires, and content changes produce different hash keys, automatically invalidating stale entries.

### Structure

```typescript
const cache = new Map<string, T[]>();
const timers = new Map<string, NodeJS.Timeout>();

getCacheKey(input: string, config: string): string;  // SHA256 hash
write(key: string, data: T[], ttlMs: number): void;  // With timer
read(key: string): T[] | undefined;
clear(): void;  // Cleanup all timers
```

### Implementation

**Step 1: Generate content-based cache key**

```typescript
import * as crypto from 'node:crypto';

export const getCacheKey = (
  directory: string,
  ignoreContent: string,
  maxDepth?: number
): string => {
  const hash = crypto.createHash('sha256');
  hash.update(directory);
  hash.update(ignoreContent);
  if (maxDepth !== undefined) {
    hash.update(String(maxDepth));
  }
  return hash.digest('hex');
};
```

**Step 2: Write with automatic TTL expiration**

```typescript
const crawlCache = new Map<string, string[]>();
const cacheTimers = new Map<string, NodeJS.Timeout>();

export const write = (key: string, results: string[], ttlMs: number): void => {
  // Clear any existing timer for this key
  if (cacheTimers.has(key)) {
    clearTimeout(cacheTimers.get(key)!);
  }

  crawlCache.set(key, results);

  // Automatically delete after TTL
  const timerId = setTimeout(() => {
    crawlCache.delete(key);
    cacheTimers.delete(key);
  }, ttlMs);

  cacheTimers.set(key, timerId);
};
```

**Step 3: Read and cleanup operations**

```typescript
export const read = (key: string): string[] | undefined => {
  return crawlCache.get(key);
};

export const clear = (): void => {
  for (const timerId of cacheTimers.values()) {
    clearTimeout(timerId);
  }
  crawlCache.clear();
  cacheTimers.clear();
};
```

### Complete Example

```typescript
// packages/core/src/utils/filesearch/crawlCache.ts
import * as crypto from 'node:crypto';

const crawlCache = new Map<string, string[]>();
const cacheTimers = new Map<string, NodeJS.Timeout>();

export const getCacheKey = (
  directory: string,
  ignoreContent: string,
  maxDepth?: number
): string => {
  const hash = crypto.createHash('sha256');
  hash.update(directory);
  hash.update(ignoreContent);
  if (maxDepth !== undefined) {
    hash.update(String(maxDepth));
  }
  return hash.digest('hex');
};

export const write = (key: string, results: string[], ttlMs: number): void => {
  // Clear any existing timer for this key (reset TTL on update)
  if (cacheTimers.has(key)) {
    clearTimeout(cacheTimers.get(key)!);
  }

  crawlCache.set(key, results);

  // Automatically delete after TTL
  const timerId = setTimeout(() => {
    crawlCache.delete(key);
    cacheTimers.delete(key);
  }, ttlMs);

  cacheTimers.set(key, timerId);
};

export const read = (key: string): string[] | undefined => {
  return crawlCache.get(key);
};

export const clear = (): void => {
  for (const timerId of cacheTimers.values()) {
    clearTimeout(timerId);
  }
  crawlCache.clear();
  cacheTimers.clear();
};

// Usage: Directory crawl caching
async function crawlDirectory(
  dir: string,
  ignoreRules: string,
  maxDepth?: number
): Promise<string[]> {
  // Generate cache key from inputs
  const cacheKey = getCacheKey(dir, ignoreRules, maxDepth);

  // Check cache
  const cached = read(cacheKey);
  if (cached) {
    return cached;
  }

  // Perform expensive crawl
  const results = await performDirectoryCrawl(dir, ignoreRules, maxDepth);

  // Cache with 5-minute TTL
  write(cacheKey, results, 5 * 60 * 1000);

  return results;
}
```

**Example explained:**

- Lines 7-18: Hash-based key generation from all inputs affecting results
- Lines 20-35: TTL-based auto-expiration with timer reset on updates
- Lines 37-47: Read and cleanup operations
- Lines 50-70: Real-world usage caching expensive directory crawls

### When to Use

**Use this pattern when:**

- Cached data becomes stale over time
- Cache invalidation depends on multiple input parameters
- Automatic cleanup is preferred over manual management
- Content changes should invalidate cache even within TTL

**Avoid this pattern when:**

- Data never becomes stale
- Immediate invalidation is required (use event-based)
- TTL cannot be reasonably estimated

### Benefits

- **Automatic Expiration**: No manual cleanup needed
- **Content-Based Invalidation**: Different inputs produce different keys
- **Timer Reset**: Updates extend freshness period
- **Memory Safety**: Old entries auto-deleted

### Trade-offs

- **Timer Overhead**: Each entry requires a timer
- **Hash Computation**: SHA256 adds CPU cost
- **No Immediate Invalidation**: Must wait for TTL or hash change

### Common Mistakes

**Mistake 1: Not clearing old timers on update**

**Bad example:**

```typescript
export const write = (key: string, results: string[], ttlMs: number): void => {
  crawlCache.set(key, results);

  // Creates new timer without clearing old one
  const timerId = setTimeout(() => {
    crawlCache.delete(key);
  }, ttlMs);

  cacheTimers.set(key, timerId);
};
```

**Correct approach:**

```typescript
export const write = (key: string, results: string[], ttlMs: number): void => {
  // Clear existing timer first
  if (cacheTimers.has(key)) {
    clearTimeout(cacheTimers.get(key)!);
  }

  crawlCache.set(key, results);

  const timerId = setTimeout(() => {
    crawlCache.delete(key);
    cacheTimers.delete(key);
  }, ttlMs);

  cacheTimers.set(key, timerId);
};
```

**Why this matters**: Without clearing, old timers leak and may delete fresh data.

**Mistake 2: Incomplete hash inputs**

**Bad example:**

```typescript
export const getCacheKey = (directory: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(directory);
  // Missing ignoreContent and maxDepth
  return hash.digest('hex');
};
```

**Correct approach:**

```typescript
export const getCacheKey = (
  directory: string,
  ignoreContent: string,
  maxDepth?: number
): string => {
  const hash = crypto.createHash('sha256');
  hash.update(directory);
  hash.update(ignoreContent); // Include all inputs
  if (maxDepth !== undefined) {
    hash.update(String(maxDepth)); // Include all inputs
  }
  return hash.digest('hex');
};
```

**Why this matters**: Incomplete hashing causes cache hits when inputs differ, returning wrong results.

### Testing Strategy

**What to Test:**

- Cache entries auto-expire after TTL
- Timer resets on updates extend expiration
- Different inputs produce different cache keys
- Cleanup clears all timers and entries

**Test Organization:**

- Co-locate tests: `crawlCache.ts` → `crawlCache.test.ts`
- Use fake timers for TTL tests
- Test hash collision scenarios

**Mock Strategy:**

- Use `vi.useFakeTimers()` for timer control
- No mocks for crypto (real SHA256)

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { vi } from 'vitest';
import { getCacheKey, write, read, clear } from './crawlCache.js';

describe('CrawlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    clear();
  });

  it('should auto-evict after TTL expires', async () => {
    // Arrange
    const key = 'test-key';
    const data = ['file1.txt', 'file2.txt'];
    const ttl = 5000;

    // Act
    write(key, data, ttl);

    // Assert: Available immediately
    expect(read(key)).to.deep.equal(data);

    // Assert: Still available before expiration
    await vi.advanceTimersByTimeAsync(ttl - 1);
    expect(read(key)).to.deep.equal(data);

    // Assert: Evicted after expiration
    await vi.advanceTimersByTimeAsync(1);
    expect(read(key)).to.be.undefined;
  });

  it('should reset timer when entry is updated', async () => {
    // Arrange
    const key = 'update-key';
    const ttl = 5000;

    // Act: Initial write
    write(key, ['initial'], ttl);
    await vi.advanceTimersByTimeAsync(3000);

    // Act: Update resets timer
    write(key, ['updated'], ttl);
    await vi.advanceTimersByTimeAsync(3000);

    // Assert: Not evicted (timer was reset)
    expect(read(key)).to.deep.equal(['updated']);

    // Assert: Evicted after new TTL
    await vi.advanceTimersByTimeAsync(2001);
    expect(read(key)).to.be.undefined;
  });

  it('should generate different keys for different inputs', () => {
    // Arrange & Act
    const key1 = getCacheKey('/dir', 'ignore1', 5);
    const key2 = getCacheKey('/dir', 'ignore2', 5);
    const key3 = getCacheKey('/dir', 'ignore1', 10);

    // Assert: All keys are unique
    expect(key1).to.not.equal(key2);
    expect(key1).to.not.equal(key3);
    expect(key2).to.not.equal(key3);
  });

  it('should clear all timers and entries', () => {
    // Arrange
    write('key1', ['data1'], 5000);
    write('key2', ['data2'], 5000);

    // Act
    clear();

    // Assert
    expect(read('key1')).to.be.undefined;
    expect(read('key2')).to.be.undefined;
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Branch coverage: 100%
- Test timer interactions thoroughly

### Related Patterns

- **[LRU Cache](#pattern-1-lru-cache-with-automatic-eviction)** - Complementary eviction strategy
- **[Rate Limiting](#pattern-7-rate-limiting-with-priority-levels)** - Often used together for resource control

---

## Pattern 4: Batched Async Operations

### Intent

Prevent resource exhaustion by limiting concurrent asynchronous operations through batching.

### Problem

Spawning unlimited concurrent file operations causes EMFILE errors (too many open files). Promise.all on large arrays exhausts file descriptors, memory, or network connections. Individual sequential operations are too slow for large datasets.

### Solution

Process items in fixed-size batches with controlled concurrency. Use Promise.allSettled to continue processing remaining batches even if some items fail. Adjust batch size based on operation type and resource constraints.

### Structure

```typescript
const CONCURRENT_LIMIT = 10;

for (let i = 0; i < items.length; i += CONCURRENT_LIMIT) {
  const batch = items.slice(i, i + CONCURRENT_LIMIT);
  const promises = batch.map((item) => processItem(item));
  const results = await Promise.allSettled(promises);
  // Handle results
}
```

### Implementation

**Step 1: Define concurrency limit**

```typescript
// Lower limit for expensive operations (directory crawls)
const CONCURRENT_DIR_LIMIT = 10;

// Higher limit for lighter operations (file reads)
const CONCURRENT_FILE_LIMIT = 20;
```

**Step 2: Create batches and process concurrently**

```typescript
async function processBatchedOperations<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrentLimit: number
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrentLimit) {
    const batch = items.slice(i, i + concurrentLimit);
    const batchPromises = batch.map((item) => processor(item));

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
      // Log or handle rejections
    }
  }

  return results;
}
```

**Step 3: Apply to specific operations**

```typescript
async function readFiles(filePaths: string[]): Promise<FileContent[]> {
  return processBatchedOperations(
    filePaths,
    async (path) => {
      const content = await fs.readFile(path, 'utf-8');
      return { path, content };
    },
    CONCURRENT_FILE_LIMIT
  );
}
```

### Complete Example

```typescript
// packages/core/src/utils/memoryDiscovery.ts

// Different limits for different operation costs
const CONCURRENT_DIR_LIMIT = 10; // Directory operations (expensive)
const CONCURRENT_FILE_LIMIT = 20; // File reads (less expensive)

async function crawlDirectories(directories: string[], ignoreRules: string): Promise<string[]> {
  const pathsArrays: string[][] = [];

  for (let i = 0; i < directories.length; i += CONCURRENT_DIR_LIMIT) {
    const batch = directories.slice(i, i + CONCURRENT_DIR_LIMIT);

    const batchPromises = batch.map((dir) => crawlSingleDirectory(dir, ignoreRules));

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        pathsArrays.push(result.value);
      } else {
        // Log error but continue with other batches
        console.error(`Failed to crawl directory: ${result.reason}`);
      }
    }
  }

  // Flatten and deduplicate
  const paths = pathsArrays.flat();
  return Array.from(new Set(paths));
}

async function readFiles(filePaths: string[]): Promise<FileContent[]> {
  const results: FileContent[] = [];

  for (let i = 0; i < filePaths.length; i += CONCURRENT_FILE_LIMIT) {
    const batch = filePaths.slice(i, i + CONCURRENT_FILE_LIMIT);

    const batchPromises = batch.map(async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { filePath, content };
      } catch (error) {
        return { filePath, content: null, error };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      }
    }
  }

  return results;
}
```

**Example explained:**

- Lines 3-4: Different concurrency limits based on operation cost
- Lines 6-33: Directory crawling with 10 concurrent operations
- Lines 20-26: Promise.allSettled ensures partial failures don't stop processing
- Lines 35-61: File reading with higher concurrency (20 operations)

### When to Use

**Use this pattern when:**

- Processing large arrays of async operations
- Risk of resource exhaustion (file descriptors, memory, connections)
- Some operations may fail but processing should continue
- Performance matters but resource limits exist

**Avoid this pattern when:**

- Array is small (overhead not worth it)
- Operations must be strictly sequential
- Unlimited concurrency is acceptable

### Benefits

- **Prevents Resource Exhaustion**: Controlled concurrency prevents EMFILE errors
- **Maintains Parallelism**: Much faster than sequential processing
- **Graceful Degradation**: Promise.allSettled continues on partial failures
- **Tunable Performance**: Adjust batch size for different operations

### Trade-offs

- **Not Fully Parallel**: Slower than unlimited Promise.all
- **Fixed Batch Size**: May not be optimal for all scenarios
- **Memory Accumulation**: Results accumulate in memory

### Common Mistakes

**Mistake 1: Using Promise.all instead of Promise.allSettled**

**Bad example:**

```typescript
const batchResults = await Promise.all(batchPromises);
// Entire batch fails if one promise rejects
```

**Correct approach:**

```typescript
const batchResults = await Promise.allSettled(batchPromises);

for (const result of batchResults) {
  if (result.status === 'fulfilled') {
    results.push(result.value);
  } else {
    console.error('Operation failed:', result.reason);
  }
}
```

**Why this matters**: Promise.all fails fast and stops processing, losing all partial results.

**Mistake 2: Not adjusting batch size for operation type**

**Bad example:**

```typescript
const LIMIT = 100; // Same for all operations

await processBatched(heavyDirs, crawlDir, LIMIT); // Too high, EMFILE
await processBatched(lightFiles, readFile, LIMIT); // Could be higher
```

**Correct approach:**

```typescript
const DIR_LIMIT = 10; // Lower for expensive operations
const FILE_LIMIT = 20; // Higher for lighter operations

await processBatched(dirs, crawlDir, DIR_LIMIT);
await processBatched(files, readFile, FILE_LIMIT);
```

**Why this matters**: Different operations have different resource costs and optimal concurrency levels.

### Testing Strategy

**What to Test:**

- Batching respects concurrency limit
- All items are processed across batches
- Partial failures don't stop processing
- Results are correctly accumulated

**Test Organization:**

- Integration tests for batch processing
- Mock slow operations to test concurrency
- Verify resource limits are respected

**Mock Strategy:**

- Mock fs operations with delays
- Track concurrent call count
- Use counters to verify limits

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { vi } from 'vitest';
import { processBatchedOperations } from './batched-operations.js';

describe('Batched Operations', () => {
  it('should respect concurrency limit', async () => {
    // Arrange
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const items = Array.from({ length: 50 }, (_, i) => i);
    const processor = async (item: number) => {
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

      await new Promise((resolve) => setTimeout(resolve, 10));

      currentConcurrent--;
      return item * 2;
    };

    // Act
    await processBatchedOperations(items, processor, 10);

    // Assert
    expect(maxConcurrent).to.be.lessThanOrEqual(10);
  });

  it('should process all items despite partial failures', async () => {
    // Arrange
    const items = [1, 2, 3, 4, 5];
    const processor = async (item: number) => {
      if (item === 3) {
        throw new Error('Failed');
      }
      return item * 2;
    };

    // Act
    const results = await processBatchedOperations(items, processor, 2);

    // Assert: Should have 4 results (5 items - 1 failure)
    expect(results).to.have.lengthOf(4);
    expect(results).to.deep.equal([2, 4, 8, 10]);
  });

  it('should process items in batches', async () => {
    // Arrange
    const batchSizes: number[] = [];
    let currentBatchSize = 0;

    const items = Array.from({ length: 25 }, (_, i) => i);
    const processor = async (item: number) => {
      currentBatchSize++;

      // Delay to ensure batch boundary
      await new Promise((resolve) => setTimeout(resolve, 1));

      // Record batch size at completion
      if (item % 10 === 9 || item === 24) {
        batchSizes.push(currentBatchSize);
        currentBatchSize = 0;
      }

      return item;
    };

    // Act
    await processBatchedOperations(items, processor, 10);

    // Assert: Should have 3 batches (10, 10, 5)
    expect(batchSizes).to.deep.equal([10, 10, 5]);
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+
- Test various batch sizes and array lengths
- Test error scenarios

### Related Patterns

- **[Event Loop Yielding](#pattern-5-event-loop-yielding)** - Complementary for sync operations
- **[Rate Limiting](#pattern-7-rate-limiting-with-priority-levels)** - Can combine for additional control

---

## Pattern 5: Event Loop Yielding

### Intent

Prevent UI blocking during long synchronous operations by periodically yielding control to the event loop.

### Problem

Long-running synchronous operations (filtering large arrays, processing files) block the JavaScript event loop, freezing the UI and preventing cancellation. Users perceive the application as unresponsive. AbortSignal cannot be checked during tight loops.

### Solution

Use setImmediate to yield control back to the event loop after processing a batch of items. Check AbortSignal during yields to enable graceful cancellation. Balance batch size against responsiveness.

### Structure

```typescript
for (const [i, item] of items.entries()) {
  // Yield every N items
  if (i % YIELD_INTERVAL === 0) {
    await new Promise((resolve) => setImmediate(resolve));
    if (signal?.aborted) {
      throw new AbortError();
    }
  }
  // Process item
}
```

### Implementation

**Step 1: Define yield interval**

```typescript
const YIELD_INTERVAL = 1000; // Yield every 1000 items
```

**Step 2: Implement yielding loop**

```typescript
async function processLargeArray<T, R>(
  items: T[],
  processor: (item: T) => R,
  signal?: AbortSignal
): Promise<R[]> {
  const results: R[] = [];

  for (const [i, item] of items.entries()) {
    // Yield control every YIELD_INTERVAL items
    if (i % YIELD_INTERVAL === 0) {
      await new Promise((resolve) => setImmediate(resolve));

      // Check for cancellation
      if (signal?.aborted) {
        throw new AbortError('Operation cancelled');
      }
    }

    results.push(processor(item));
  }

  return results;
}
```

**Step 3: Apply to filtering operations**

```typescript
async function filterLargeArray<T>(
  items: T[],
  predicate: (item: T) => boolean,
  signal?: AbortSignal
): Promise<T[]> {
  const results: T[] = [];

  for (const [i, item] of items.entries()) {
    if (i % YIELD_INTERVAL === 0) {
      await new Promise((resolve) => setImmediate(resolve));
      if (signal?.aborted) {
        throw new AbortError('Operation cancelled');
      }
    }

    if (predicate(item)) {
      results.push(item);
    }
  }

  return results;
}
```

### Complete Example

```typescript
// packages/core/src/utils/filesearch/fileSearch.ts
import picomatch from 'picomatch';

class AbortError extends Error {
  constructor(message = 'Operation aborted') {
    super(message);
    this.name = 'AbortError';
  }
}

export async function filter(
  allPaths: string[],
  pattern: string,
  signal: AbortSignal | undefined
): Promise<string[]> {
  const patternFilter = picomatch(pattern, {
    dot: true,
    contains: true,
    nocase: true,
  });

  const results: string[] = [];

  for (const [i, p] of allPaths.entries()) {
    // Yield control every 1000 items to prevent blocking
    if (i % 1000 === 0) {
      await new Promise((resolve) => setImmediate(resolve));

      // Enable cancellation
      if (signal?.aborted) {
        throw new AbortError();
      }
    }

    if (patternFilter(p)) {
      results.push(p);
    }
  }

  // Fast sort: ~40% faster than localeCompare
  results.sort((a, b) => {
    const aIsDir = a.endsWith('/');
    const bIsDir = b.endsWith('/');

    // Directories first
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;

    // Simple string comparison (faster than locale)
    return a < b ? -1 : a > b ? 1 : 0;
  });

  return results;
}

// Usage: Search large file list without blocking UI
async function searchFiles(
  allFiles: string[],
  searchPattern: string,
  controller: AbortController
): Promise<string[]> {
  try {
    const matches = await filter(allFiles, searchPattern, controller.signal);
    return matches;
  } catch (error) {
    if (error instanceof AbortError) {
      console.log('Search cancelled by user');
      return [];
    }
    throw error;
  }
}
```

**Example explained:**

- Lines 5-9: Custom AbortError for cancellation
- Lines 24-31: Yield every 1000 items with cancellation check
- Lines 40-49: Optimized sorting (40% faster than localeCompare)
- Lines 54-67: Real-world usage with AbortController

### When to Use

**Use this pattern when:**

- Processing large arrays synchronously (>10,000 items)
- UI responsiveness is critical
- Operations should be cancellable
- Items are processed independently

**Avoid this pattern when:**

- Array is small (overhead not worth it)
- Operation is already async (natural yielding)
- Strict timing requirements (yields add unpredictability)

### Benefits

- **Prevents UI Blocking**: Regular yields keep UI responsive
- **Enables Cancellation**: AbortSignal can be checked during yields
- **Simple Implementation**: Minimal code changes
- **Tunable Responsiveness**: Adjust yield interval for performance vs. responsiveness

### Trade-offs

- **Performance Overhead**: Yielding adds latency
- **Unpredictable Timing**: Yields introduce variability
- **Not True Parallelism**: Still single-threaded

### Common Mistakes

**Mistake 1: Not checking AbortSignal**

**Bad example:**

```typescript
for (const [i, item] of items.entries()) {
  if (i % 1000 === 0) {
    await new Promise((resolve) => setImmediate(resolve));
    // No cancellation check
  }
  processItem(item);
}
```

**Correct approach:**

```typescript
for (const [i, item] of items.entries()) {
  if (i % 1000 === 0) {
    await new Promise((resolve) => setImmediate(resolve));
    if (signal?.aborted) {
      throw new AbortError();
    }
  }
  processItem(item);
}
```

**Why this matters**: Without checking AbortSignal, operation cannot be cancelled.

**Mistake 2: Wrong yield interval**

**Bad example:**

```typescript
// Yields too frequently (poor performance)
if (i % 10 === 0) {
  await new Promise((resolve) => setImmediate(resolve));
}

// Yields too rarely (UI still freezes)
if (i % 100000 === 0) {
  await new Promise((resolve) => setImmediate(resolve));
}
```

**Correct approach:**

```typescript
// Balanced yield interval (1000 items)
if (i % 1000 === 0) {
  await new Promise((resolve) => setImmediate(resolve));
}
```

**Why this matters**: Too frequent yields hurt performance, too rare yields don't prevent blocking.

### Testing Strategy

**What to Test:**

- Yields occur at correct intervals
- AbortSignal is respected
- Results are correct despite yielding
- Performance is acceptable

**Test Organization:**

- Integration tests for large arrays
- Mock setImmediate for unit tests
- Measure performance impact

**Mock Strategy:**

- Use fake timers sparingly (affects setImmediate)
- Test with real event loop for integration tests
- Mock AbortSignal for cancellation tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { filter } from './fileSearch.js';

describe('Event Loop Yielding', () => {
  it('should filter large arrays without blocking', async () => {
    // Arrange
    const largeArray = Array.from({ length: 10000 }, (_, i) => `file${i}.txt`);
    const pattern = 'file1*';

    // Act
    const results = await filter(largeArray, pattern, undefined);

    // Assert
    expect(results.length).to.be.greaterThan(0);
    expect(results.every((f) => f.startsWith('file1'))).to.be.true;
  });

  it('should respect AbortSignal', async () => {
    // Arrange
    const largeArray = Array.from({ length: 100000 }, (_, i) => `file${i}.txt`);
    const controller = new AbortController();

    // Abort after small delay
    setTimeout(() => controller.abort(), 10);

    // Act & Assert
    await expect(filter(largeArray, '*', controller.signal)).to.be.rejectedWith('aborted');
  });

  it('should yield at correct intervals', async () => {
    // Arrange
    let yieldCount = 0;
    const originalSetImmediate = global.setImmediate;

    global.setImmediate = ((fn: () => void) => {
      yieldCount++;
      return originalSetImmediate(fn);
    }) as typeof setImmediate;

    const items = Array.from({ length: 5000 }, (_, i) => `item${i}`);

    // Act
    await filter(items, '*', undefined);

    // Assert: Should yield 5 times (0, 1000, 2000, 3000, 4000)
    expect(yieldCount).to.equal(5);

    // Cleanup
    global.setImmediate = originalSetImmediate;
  });
});
```

**Coverage Goals:**

- Line coverage: 90%+
- Test with various array sizes
- Test cancellation scenarios

### Related Patterns

- **[Batched Async Operations](#pattern-4-batched-async-operations)** - For async operations
- **[Adaptive Algorithm Selection](#pattern-6-adaptive-algorithm-selection)** - Can combine for scale-based optimization

---

## Pattern 6: Adaptive Algorithm Selection

### Intent

Choose algorithms dynamically based on dataset characteristics to optimize for scale.

### Problem

Different algorithms have different performance characteristics at different scales. A precise but slow algorithm works well for small datasets but becomes unusable at scale. A fast but approximate algorithm wastes resources on small datasets where precision is cheap.

### Solution

Implement multiple algorithms and select based on runtime characteristics. Define thresholds for switching between algorithms. Prefer precision for small datasets, performance for large datasets.

### Structure

```typescript
function processData<T>(items: T[]): Result {
  if (items.length > THRESHOLD) {
    return fastButApproximateAlgorithm(items);
  } else {
    return slowButPreciseAlgorithm(items);
  }
}
```

### Implementation

**Step 1: Define threshold**

```typescript
const SCALE_THRESHOLD = 20000; // Switch at 20k items
```

**Step 2: Implement both algorithms**

```typescript
import { AsyncFzf } from 'fzf';

interface FuzzySearchOptions {
  algorithm: 'v1' | 'v2';
}

function createFuzzySearch(items: string[], options?: FuzzySearchOptions): AsyncFzf<string> {
  return new AsyncFzf(items, {
    fuzzy: options?.algorithm || 'v2',
  });
}
```

**Step 3: Select based on dataset size**

```typescript
function createOptimalFuzzySearch(items: string[]): AsyncFzf<string> {
  // v1: Faster but less accurate (searches first occurrence only)
  // v2: Slower but more accurate (comprehensive search)
  const algorithm = items.length > SCALE_THRESHOLD ? 'v1' : 'v2';

  return new AsyncFzf(items, { fuzzy: algorithm });
}
```

### Complete Example

```typescript
// packages/core/src/utils/filesearch/fileSearch.ts
import { AsyncFzf } from 'fzf';

const FUZZY_SEARCH_THRESHOLD = 20000;

interface SearchOptions {
  disableFuzzySearch?: boolean;
}

class FileSearch {
  private fzf?: AsyncFzf<string>;
  private allFiles: string[];
  private options: SearchOptions;

  constructor(allFiles: string[], options: SearchOptions = {}) {
    this.allFiles = allFiles;
    this.options = options;
    this.buildSearchIndex();
  }

  private buildSearchIndex(): void {
    if (this.options.disableFuzzySearch) {
      return;
    }

    // Adaptive algorithm selection based on dataset size
    const algorithm =
      this.allFiles.length > FUZZY_SEARCH_THRESHOLD
        ? 'v1' // Fast but less accurate for >20k files
        : 'v2'; // Slow but more accurate for <=20k files

    this.fzf = new AsyncFzf(this.allFiles, {
      fuzzy: algorithm,
    });
  }

  async search(query: string): Promise<string[]> {
    if (!this.fzf) {
      // Fallback to simple filtering
      return this.allFiles.filter((f) => f.includes(query));
    }

    const results = await this.fzf.find(query);
    return results.map((r) => r.item);
  }

  // For testing: expose which algorithm was selected
  getAlgorithm(): 'v1' | 'v2' | undefined {
    return this.fzf?.options?.fuzzy as 'v1' | 'v2' | undefined;
  }
}

// Usage: Automatic optimization based on file count
async function searchProjectFiles(allFiles: string[], query: string): Promise<string[]> {
  const searcher = new FileSearch(allFiles);
  return searcher.search(query);
  // Automatically uses v1 for >20k files, v2 for <=20k
}
```

**Example explained:**

- Lines 3: Threshold for algorithm switching (20,000 files)
- Lines 20-31: Adaptive algorithm selection in constructor
- Lines 26-28: v1 for large datasets (performance), v2 for small (accuracy)
- Lines 52-58: Real-world usage with transparent optimization

### When to Use

**Use this pattern when:**

- Multiple algorithms solve the same problem with different trade-offs
- Dataset size varies significantly across use cases
- Performance characteristics change dramatically at scale
- Runtime selection is possible and cheap

**Avoid this pattern when:**

- Only one algorithm exists
- Performance difference is negligible
- Selection overhead outweighs benefits
- Dataset size is predictable and fixed

### Benefits

- **Optimal Performance**: Best algorithm for each scenario
- **Transparent**: Users get optimization without configuration
- **Flexible**: Easy to add new algorithms or adjust thresholds
- **Tunable**: Threshold can be adjusted based on benchmarks

### Trade-offs

- **Code Complexity**: Must maintain multiple implementations
- **Testing Overhead**: Must test all code paths
- **Threshold Selection**: Requires benchmarking to find optimal threshold

### Common Mistakes

**Mistake 1: Hardcoding algorithm selection**

**Bad example:**

```typescript
// Always uses v1, regardless of dataset size
const fzf = new AsyncFzf(allFiles, { fuzzy: 'v1' });
```

**Correct approach:**

```typescript
// Selects based on dataset characteristics
const algorithm = allFiles.length > THRESHOLD ? 'v1' : 'v2';
const fzf = new AsyncFzf(allFiles, { fuzzy: algorithm });
```

**Why this matters**: Hardcoding wastes precision on small datasets or performance on large ones.

**Mistake 2: Wrong threshold selection**

**Bad example:**

```typescript
// Threshold too low (uses fast algorithm too often)
const algorithm = allFiles.length > 100 ? 'v1' : 'v2';

// Threshold too high (uses slow algorithm too long)
const algorithm = allFiles.length > 1000000 ? 'v1' : 'v2';
```

**Correct approach:**

```typescript
// Benchmark-driven threshold selection
const THRESHOLD = 20000; // Based on performance testing
const algorithm = allFiles.length > THRESHOLD ? 'v1' : 'v2';
```

**Why this matters**: Poor threshold selection negates optimization benefits.

### Testing Strategy

**What to Test:**

- Correct algorithm selected based on dataset size
- Both algorithms produce acceptable results
- Threshold boundary conditions
- Performance characteristics match expectations

**Test Organization:**

- Unit tests for algorithm selection logic
- Integration tests for both algorithm paths
- Performance tests to validate thresholds

**Mock Strategy:**

- Mock algorithm implementations for unit tests
- Use real algorithms for integration tests
- Measure performance in benchmarks

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { FileSearch } from './fileSearch.js';

describe('Adaptive Algorithm Selection', () => {
  it('should use v2 for small datasets', () => {
    // Arrange
    const smallDataset = Array.from({ length: 1000 }, (_, i) => `file${i}.txt`);

    // Act
    const searcher = new FileSearch(smallDataset);

    // Assert
    expect(searcher.getAlgorithm()).to.equal('v2');
  });

  it('should use v1 for large datasets', () => {
    // Arrange
    const largeDataset = Array.from({ length: 25000 }, (_, i) => `file${i}.txt`);

    // Act
    const searcher = new FileSearch(largeDataset);

    // Assert
    expect(searcher.getAlgorithm()).to.equal('v1');
  });

  it('should produce results with both algorithms', async () => {
    // Arrange
    const files = ['foo.txt', 'bar.txt', 'foobar.js'];
    const query = 'foo';

    // Act: Small dataset (v2)
    const smallSearcher = new FileSearch(files);
    const v2Results = await smallSearcher.search(query);

    // Act: Large dataset (v1) - repeat files to exceed threshold
    const largeDuplicated = Array.from({ length: 10000 }, () => files).flat();
    const largeSearcher = new FileSearch(largeDuplicated);
    const v1Results = await largeSearcher.search(query);

    // Assert: Both find 'foo' matches (exact results may differ)
    expect(v2Results.some((f) => f.includes('foo'))).to.be.true;
    expect(v1Results.some((f) => f.includes('foo'))).to.be.true;
  });

  it('should switch at threshold boundary', () => {
    // Arrange & Act
    const atThreshold = new FileSearch(Array(20000).fill('file.txt'));
    const aboveThreshold = new FileSearch(Array(20001).fill('file.txt'));

    // Assert
    expect(atThreshold.getAlgorithm()).to.equal('v2');
    expect(aboveThreshold.getAlgorithm()).to.equal('v1');
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Test both algorithm paths
- Test threshold boundaries

### Related Patterns

- **[Event Loop Yielding](#pattern-5-event-loop-yielding)** - Can combine for responsive large-scale processing
- **[Prefix-Based Result Cache](#pattern-2-prefix-based-result-cache)** - Often used together for search optimization

---

## Pattern 7: Rate Limiting with Priority Levels

### Intent

Control event frequency with support for high-priority events that bypass standard rate limits.

### Problem

Unrestricted event emission floods telemetry systems, wastes resources, and obscures important signals. Fixed rate limiting treats all events equally, delaying critical alerts. Manual throttling is error-prone and inconsistent.

### Solution

Implement configurable rate limiting with priority levels. High-priority events use a fraction of the standard interval (e.g., 50%), allowing critical events through faster while still preventing floods.

### Structure

```typescript
class RateLimiter {
  private lastRecordTimes: Map<string, number>;
  private minIntervalMs: number;

  shouldRecord(key: string, isHighPriority: boolean): boolean;
  forceRecord(key: string): void;
  getTimeUntilNextAllowed(key: string): number;
}
```

### Implementation

**Step 1: Initialize rate limiter**

```typescript
export class RateLimiter {
  private lastRecordTimes: Map<string, number> = new Map();
  private readonly minIntervalMs: number;
  private static readonly HIGH_PRIORITY_DIVISOR = 2; // 2x faster

  constructor(minIntervalMs: number = 60000) {
    this.minIntervalMs = minIntervalMs;
  }
}
```

**Step 2: Implement priority-aware checking**

```typescript
shouldRecord(metricKey: string, isHighPriority: boolean = false): boolean {
  const now = Date.now();
  const lastRecordTime = this.lastRecordTimes.get(metricKey) || 0;

  // High priority events use 50% of the interval
  const interval = isHighPriority
    ? Math.round(this.minIntervalMs / RateLimiter.HIGH_PRIORITY_DIVISOR)
    : this.minIntervalMs;

  if (now - lastRecordTime >= interval) {
    this.lastRecordTimes.set(metricKey, now);
    return true;
  }

  return false;
}
```

**Step 3: Add utility methods**

```typescript
forceRecord(metricKey: string): void {
  this.lastRecordTimes.set(metricKey, Date.now());
}

getTimeUntilNextAllowed(
  metricKey: string,
  isHighPriority: boolean = false,
): number {
  const now = Date.now();
  const lastRecordTime = this.lastRecordTimes.get(metricKey) || 0;
  const interval = isHighPriority
    ? Math.round(this.minIntervalMs / RateLimiter.HIGH_PRIORITY_DIVISOR)
    : this.minIntervalMs;
  const nextAllowedTime = lastRecordTime + interval;

  return Math.max(0, nextAllowedTime - now);
}

cleanup(maxAgeMs: number = 3600000): void {
  const cutoffTime = Date.now() - maxAgeMs;

  for (const [key, time] of this.lastRecordTimes.entries()) {
    if (time < cutoffTime) {
      this.lastRecordTimes.delete(key);
    }
  }
}
```

### Complete Example

```typescript
// packages/core/src/telemetry/rate-limiter.ts
export class RateLimiter {
  private lastRecordTimes: Map<string, number> = new Map();
  private readonly minIntervalMs: number;
  private static readonly HIGH_PRIORITY_DIVISOR = 2;

  constructor(minIntervalMs: number = 60000) {
    this.minIntervalMs = minIntervalMs;
  }

  shouldRecord(metricKey: string, isHighPriority: boolean = false): boolean {
    const now = Date.now();
    const lastRecordTime = this.lastRecordTimes.get(metricKey) || 0;

    const interval = isHighPriority
      ? Math.round(this.minIntervalMs / RateLimiter.HIGH_PRIORITY_DIVISOR)
      : this.minIntervalMs;

    if (now - lastRecordTime >= interval) {
      this.lastRecordTimes.set(metricKey, now);
      return true;
    }

    return false;
  }

  forceRecord(metricKey: string): void {
    this.lastRecordTimes.set(metricKey, Date.now());
  }

  getTimeUntilNextAllowed(metricKey: string, isHighPriority: boolean = false): number {
    const now = Date.now();
    const lastRecordTime = this.lastRecordTimes.get(metricKey) || 0;
    const interval = isHighPriority
      ? Math.round(this.minIntervalMs / RateLimiter.HIGH_PRIORITY_DIVISOR)
      : this.minIntervalMs;
    const nextAllowedTime = lastRecordTime + interval;

    return Math.max(0, nextAllowedTime - now);
  }

  cleanup(maxAgeMs: number = 3600000): void {
    const cutoffTime = Date.now() - maxAgeMs;

    for (const [key, time] of this.lastRecordTimes.entries()) {
      if (time < cutoffTime) {
        this.lastRecordTimes.delete(key);
      }
    }
  }
}

// Usage: Telemetry with priority levels
const rateLimiter = new RateLimiter(60000); // 1 minute minimum

function recordMetric(metricName: string, value: number, isCritical: boolean = false) {
  if (rateLimiter.shouldRecord(metricName, isCritical)) {
    sendToTelemetry(metricName, value);
  }
  // Else: silently drop to prevent flood
}

// Normal events: 1 per minute maximum
recordMetric('user_action', 1, false);

// Critical events: 1 per 30 seconds maximum (2x faster)
recordMetric('memory_leak_detected', memoryUsage, true);
```

**Example explained:**

- Lines 3-4: Configurable interval with priority divisor constant
- Lines 14-16: High-priority events get 50% of normal interval
- Lines 44-51: Cleanup prevents unbounded memory growth
- Lines 54-68: Real-world usage showing dual-level rate limiting

### When to Use

**Use this pattern when:**

- Event frequency needs control to prevent resource exhaustion
- Some events are more important than others
- Telemetry or logging systems have rate limits
- Memory usage from event tracking needs bounds

**Avoid this pattern when:**

- All events have equal priority
- Event volume is naturally low
- Lossless event recording is required

### Benefits

- **Prevents Floods**: Controls maximum event frequency
- **Priority Support**: Critical events bypass normal limits
- **Memory Bounded**: Cleanup prevents unbounded growth
- **Flexible**: Configurable interval and priority divisor

### Trade-offs

- **Event Loss**: Some events are silently dropped
- **Cleanup Overhead**: Periodic cleanup adds cost
- **State Management**: Requires tracking per-key timestamps

### Common Mistakes

**Mistake 1: Not using priority for critical events**

**Bad example:**

```typescript
// Critical event uses same limit as normal events
rateLimiter.shouldRecord('out_of_memory', false);
```

**Correct approach:**

```typescript
// Critical events use high priority for faster recording
rateLimiter.shouldRecord('out_of_memory', true);
```

**Why this matters**: Critical alerts may be delayed by normal rate limits.

**Mistake 2: Not cleaning up old entries**

**Bad example:**

```typescript
// Never cleans up, memory grows unbounded
const limiter = new RateLimiter(60000);
// No cleanup() calls
```

**Correct approach:**

```typescript
const limiter = new RateLimiter(60000);

// Periodic cleanup (e.g., every 15 minutes)
setInterval(
  () => {
    limiter.cleanup(); // Default 1-hour max age
  },
  15 * 60 * 1000
);
```

**Why this matters**: Without cleanup, memory usage grows as unique keys accumulate.

### Testing Strategy

**What to Test:**

- Rate limiting respects minimum interval
- High-priority events use reduced interval
- Cleanup removes old entries
- Time calculations are correct

**Test Organization:**

- Unit tests with fake timers
- Test priority vs. normal intervals
- Test cleanup behavior

**Mock Strategy:**

- Use `vi.useFakeTimers()` for time control
- No external dependencies to mock

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { vi } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should rate limit to minimum interval', () => {
    // Arrange
    const limiter = new RateLimiter(60000); // 1 minute

    // Act & Assert
    expect(limiter.shouldRecord('metric1', false)).to.be.true; // First allowed

    vi.advanceTimersByTime(30000); // Advance 30 seconds
    expect(limiter.shouldRecord('metric1', false)).to.be.false; // Too soon

    vi.advanceTimersByTime(30000); // Advance 30 more seconds (total 60)
    expect(limiter.shouldRecord('metric1', false)).to.be.true; // Allowed again
  });

  it('should allow high-priority events more frequently', () => {
    // Arrange
    const limiter = new RateLimiter(60000); // Normal: 1 minute, High: 30 seconds

    // Act & Assert
    expect(limiter.shouldRecord('critical', true)).to.be.true; // First allowed

    vi.advanceTimersByTime(29000); // Advance 29 seconds
    expect(limiter.shouldRecord('critical', true)).to.be.false; // Too soon

    vi.advanceTimersByTime(1000); // Advance 1 more second (total 30)
    expect(limiter.shouldRecord('critical', true)).to.be.true; // Allowed again
  });

  it('should cleanup old entries', () => {
    // Arrange
    const limiter = new RateLimiter(60000);
    limiter.shouldRecord('old_metric', false);

    // Act: Advance beyond cleanup threshold (1 hour)
    vi.advanceTimersByTime(3600000 + 1000);
    limiter.cleanup();

    // Assert: Old entry should be removed (next call allowed immediately)
    expect(limiter.shouldRecord('old_metric', false)).to.be.true;
  });

  it('should calculate time until next allowed', () => {
    // Arrange
    const limiter = new RateLimiter(60000);
    limiter.shouldRecord('metric', false);

    // Act: Advance 20 seconds
    vi.advanceTimersByTime(20000);

    // Assert: 40 seconds remaining
    expect(limiter.getTimeUntilNextAllowed('metric', false)).to.equal(40000);
  });

  it('should force record bypassing rate limit', () => {
    // Arrange
    const limiter = new RateLimiter(60000);
    limiter.shouldRecord('metric', false);

    // Act
    limiter.forceRecord('metric');
    vi.advanceTimersByTime(1000); // Only 1 second later

    // Assert: Cannot record again (force updated timestamp)
    expect(limiter.shouldRecord('metric', false)).to.be.false;
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Branch coverage: 100%
- Test all priority levels and cleanup

### Related Patterns

- **[High Water Mark Detection](#pattern-8-high-water-mark-detection)** - Often used together for telemetry
- **[TTL-Based Cache](#pattern-3-ttl-based-cache-with-hash-invalidation)** - Similar time-based expiration

---

## Pattern 8: High Water Mark Detection

### Intent

Detect significant metric changes while ignoring noise by tracking high water marks with configurable thresholds.

### Problem

Metrics fluctuate constantly with minor variations. Recording every change floods telemetry with noise. Fixed absolute thresholds fail to scale with metric magnitude. Percentage-based detection without tracking causes repeated alerts for the same baseline.

### Solution

Track high water marks (maximum values seen) per metric. Only record when current value exceeds previous high water mark by a configurable percentage threshold (default 5%). This filters noise while detecting genuine growth.

### Structure

```typescript
class HighWaterMarkTracker {
  private waterMarks: Map<string, number>;
  private growthThresholdPercent: number;

  shouldRecordMetric(metricType: string, currentValue: number): boolean;
  cleanup(maxAgeMs: number): void;
}
```

### Implementation

**Step 1: Initialize tracker**

```typescript
export class HighWaterMarkTracker {
  private waterMarks: Map<string, number> = new Map();
  private lastUpdateTimes: Map<string, number> = new Map();
  private readonly growthThresholdPercent: number;

  constructor(growthThresholdPercent: number = 5) {
    this.growthThresholdPercent = growthThresholdPercent;
  }
}
```

**Step 2: Implement threshold checking**

```typescript
shouldRecordMetric(metricType: string, currentValue: number): boolean {
  const now = Date.now();
  this.lastUpdateTimes.set(metricType, now);

  const currentWaterMark = this.waterMarks.get(metricType) || 0;

  // First measurement always recorded
  if (currentWaterMark === 0) {
    this.waterMarks.set(metricType, currentValue);
    return true;
  }

  // Record only if exceeds threshold (5% by default)
  const thresholdValue = currentWaterMark * (1 + this.growthThresholdPercent / 100);

  if (currentValue > thresholdValue) {
    this.waterMarks.set(metricType, currentValue);
    return true;
  }

  return false;
}
```

**Step 3: Add cleanup**

```typescript
cleanup(maxAgeMs: number = 3600000): void {
  const cutoffTime = Date.now() - maxAgeMs;

  for (const [metricType, lastTime] of this.lastUpdateTimes.entries()) {
    if (lastTime < cutoffTime) {
      this.lastUpdateTimes.delete(metricType);
      this.waterMarks.delete(metricType);
    }
  }
}

getWaterMark(metricType: string): number | undefined {
  return this.waterMarks.get(metricType);
}

reset(metricType?: string): void {
  if (metricType) {
    this.waterMarks.delete(metricType);
    this.lastUpdateTimes.delete(metricType);
  } else {
    this.waterMarks.clear();
    this.lastUpdateTimes.clear();
  }
}
```

### Complete Example

```typescript
// packages/core/src/telemetry/high-water-mark-tracker.ts
export class HighWaterMarkTracker {
  private waterMarks: Map<string, number> = new Map();
  private lastUpdateTimes: Map<string, number> = new Map();
  private readonly growthThresholdPercent: number;

  constructor(growthThresholdPercent: number = 5) {
    this.growthThresholdPercent = growthThresholdPercent;
  }

  shouldRecordMetric(metricType: string, currentValue: number): boolean {
    const now = Date.now();
    this.lastUpdateTimes.set(metricType, now);

    const currentWaterMark = this.waterMarks.get(metricType) || 0;

    // First measurement always recorded
    if (currentWaterMark === 0) {
      this.waterMarks.set(metricType, currentValue);
      return true;
    }

    // Record only if exceeds threshold
    const thresholdValue = currentWaterMark * (1 + this.growthThresholdPercent / 100);

    if (currentValue > thresholdValue) {
      this.waterMarks.set(metricType, currentValue);
      return true;
    }

    return false;
  }

  cleanup(maxAgeMs: number = 3600000): void {
    const cutoffTime = Date.now() - maxAgeMs;

    for (const [metricType, lastTime] of this.lastUpdateTimes.entries()) {
      if (lastTime < cutoffTime) {
        this.lastUpdateTimes.delete(metricType);
        this.waterMarks.delete(metricType);
      }
    }
  }

  getWaterMark(metricType: string): number | undefined {
    return this.waterMarks.get(metricType);
  }

  reset(metricType?: string): void {
    if (metricType) {
      this.waterMarks.delete(metricType);
      this.lastUpdateTimes.delete(metricType);
    } else {
      this.waterMarks.clear();
      this.lastUpdateTimes.clear();
    }
  }
}

// Usage: Memory monitoring with high water marks
const memoryTracker = new HighWaterMarkTracker(5); // 5% threshold

function monitorMemory() {
  const memoryUsage = process.memoryUsage();

  // Only record if RSS grows by >5%
  if (memoryTracker.shouldRecordMetric('rss', memoryUsage.rss)) {
    recordTelemetry('memory_rss', memoryUsage.rss);
    console.log(`Memory RSS increased to ${memoryUsage.rss}`);
  }

  // Only record if heap grows by >5%
  if (memoryTracker.shouldRecordMetric('heapUsed', memoryUsage.heapUsed)) {
    recordTelemetry('memory_heap', memoryUsage.heapUsed);
    console.log(`Heap usage increased to ${memoryUsage.heapUsed}`);
  }
}

// Monitor every 10 seconds, but only record significant changes
setInterval(monitorMemory, 10000);
```

**Example explained:**

- Lines 7: Configurable threshold (default 5% growth)
- Lines 17-20: First measurement always recorded as baseline
- Lines 23-28: Only record if value exceeds previous high by threshold percent
- Lines 56-77: Real-world usage filtering memory monitoring noise

### When to Use

**Use this pattern when:**

- Metrics have natural fluctuations (memory, CPU, response times)
- Only significant changes matter
- Baseline values vary widely across different metrics
- Telemetry noise reduction is important

**Avoid this pattern when:**

- Every metric change must be recorded
- Decreases are important (high water marks ignore drops)
- Fixed absolute thresholds are more appropriate

### Benefits

- **Noise Reduction**: Filters minor fluctuations automatically
- **Scale-Independent**: Percentage-based threshold works at any magnitude
- **Memory Bounded**: Cleanup prevents unbounded growth
- **Configurable**: Adjustable threshold for different sensitivities

### Trade-offs

- **Lost Decreases**: Only tracks increases, not decreases
- **Delayed Detection**: Small gradual increases may go undetected
- **State Management**: Requires tracking per-metric high water marks

### Common Mistakes

**Mistake 1: Using absolute thresholds instead of percentages**

**Bad example:**

```typescript
// Fixed absolute threshold doesn't scale
if (currentValue > previousValue + 1000000) {
  record(currentValue);
}
```

**Correct approach:**

```typescript
// Percentage-based threshold scales with magnitude
const threshold = previousValue * 1.05; // 5% increase
if (currentValue > threshold) {
  record(currentValue);
}
```

**Why this matters**: Absolute thresholds fail when baseline values vary (100MB vs 10GB).

**Mistake 2: Recording all measurements**

**Bad example:**

```typescript
// Records every measurement (floods telemetry)
function monitorMemory() {
  const memory = process.memoryUsage();
  recordTelemetry('memory', memory.rss);
}
setInterval(monitorMemory, 1000);
```

**Correct approach:**

```typescript
// Only records significant growth
function monitorMemory() {
  const memory = process.memoryUsage();
  if (tracker.shouldRecordMetric('rss', memory.rss)) {
    recordTelemetry('memory', memory.rss);
  }
}
setInterval(monitorMemory, 1000);
```

**Why this matters**: Recording every measurement wastes resources and obscures trends.

### Testing Strategy

**What to Test:**

- First measurement is always recorded
- Threshold calculation is correct
- Only records when threshold exceeded
- Cleanup removes old entries

**Test Organization:**

- Unit tests for threshold logic
- Test various growth scenarios
- Test cleanup behavior

**Mock Strategy:**

- No mocks needed for core logic
- Use fake timers for cleanup tests

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { HighWaterMarkTracker } from './high-water-mark-tracker.js';

describe('HighWaterMarkTracker', () => {
  it('should record first measurement', () => {
    // Arrange
    const tracker = new HighWaterMarkTracker(5);

    // Act
    const shouldRecord = tracker.shouldRecordMetric('memory', 100000);

    // Assert
    expect(shouldRecord).to.be.true;
    expect(tracker.getWaterMark('memory')).to.equal(100000);
  });

  it('should not record below threshold', () => {
    // Arrange
    const tracker = new HighWaterMarkTracker(5);
    tracker.shouldRecordMetric('memory', 100000); // Baseline: 100k

    // Act: Increase by 4% (below 5% threshold)
    const shouldRecord = tracker.shouldRecordMetric('memory', 104000);

    // Assert
    expect(shouldRecord).to.be.false;
    expect(tracker.getWaterMark('memory')).to.equal(100000); // Unchanged
  });

  it('should record when exceeding threshold', () => {
    // Arrange
    const tracker = new HighWaterMarkTracker(5);
    tracker.shouldRecordMetric('memory', 100000); // Baseline: 100k

    // Act: Increase by 6% (above 5% threshold)
    const shouldRecord = tracker.shouldRecordMetric('memory', 106000);

    // Assert
    expect(shouldRecord).to.be.true;
    expect(tracker.getWaterMark('memory')).to.equal(106000); // Updated
  });

  it('should use configurable threshold', () => {
    // Arrange
    const tracker = new HighWaterMarkTracker(10); // 10% threshold
    tracker.shouldRecordMetric('memory', 100000);

    // Act & Assert: 5% increase should not trigger
    expect(tracker.shouldRecordMetric('memory', 105000)).to.be.false;

    // Act & Assert: 11% increase should trigger
    expect(tracker.shouldRecordMetric('memory', 111000)).to.be.true;
  });

  it('should track multiple metrics independently', () => {
    // Arrange
    const tracker = new HighWaterMarkTracker(5);

    // Act
    tracker.shouldRecordMetric('rss', 100000);
    tracker.shouldRecordMetric('heap', 50000);

    // Assert
    expect(tracker.getWaterMark('rss')).to.equal(100000);
    expect(tracker.getWaterMark('heap')).to.equal(50000);
  });

  it('should reset specific metric', () => {
    // Arrange
    const tracker = new HighWaterMarkTracker(5);
    tracker.shouldRecordMetric('memory', 100000);

    // Act
    tracker.reset('memory');

    // Assert
    expect(tracker.getWaterMark('memory')).to.be.undefined;
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Branch coverage: 100%
- Test threshold boundary conditions

### Related Patterns

- **[Rate Limiting](#pattern-7-rate-limiting-with-priority-levels)** - Often used together for comprehensive telemetry control
- **[TTL-Based Cache](#pattern-3-ttl-based-cache-with-hash-invalidation)** - Similar cleanup strategy

---

## Pattern 9: Lazy Initialization with State Guards

### Intent

Defer expensive initialization until first use while preventing accidental use before initialization with state guards.

### Problem

Eager initialization increases startup time and wastes resources for unused components. Manual initialization coordination is error-prone. Allowing operations before initialization causes crashes or undefined behavior. Concurrent initialization attempts can create duplicate resources.

### Solution

Encapsulate initialization in a LazyValue wrapper that tracks initialization state and prevents operations before initialization. Use async initialization with promise tracking to handle concurrent access correctly.

### Structure

```typescript
class LazyValue<T> {
  private value?: T;
  private initialized = false;
  private initPromise?: Promise<T>;

  async get(): Promise<T>; // Initializes on first call
  isInitialized(): boolean; // Check state
  reset(): void; // Clear for re-initialization
}
```

### Implementation

**Step 1: Create lazy wrapper**

```typescript
class LazyValue<T> {
  private value?: T;
  private initialized = false;
  private initPromise?: Promise<T>;

  constructor(private initializer: () => T | Promise<T>) {}
}
```

**Step 2: Implement safe initialization**

```typescript
async get(): Promise<T> {
  // Already initialized
  if (this.initialized) {
    return this.value!;
  }

  // Initialization in progress, wait for it
  if (this.initPromise) {
    return this.initPromise;
  }

  // Start initialization
  this.initPromise = Promise.resolve(this.initializer());

  try {
    this.value = await this.initPromise;
    this.initialized = true;
    return this.value;
  } finally {
    this.initPromise = undefined;
  }
}
```

**Step 3: Add utility methods**

```typescript
isInitialized(): boolean {
  return this.initialized;
}

reset(): void {
  this.value = undefined;
  this.initialized = false;
  this.initPromise = undefined;
}
```

### Complete Example

```typescript
// packages/core/src/utils/LazyValue.ts
export class LazyValue<T> {
  private value?: T;
  private initialized = false;
  private initPromise?: Promise<T>;

  constructor(private initializer: () => T | Promise<T>) {}

  async get(): Promise<T> {
    // Already initialized
    if (this.initialized) {
      return this.value!;
    }

    // Initialization in progress, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start initialization
    this.initPromise = Promise.resolve(this.initializer());

    try {
      this.value = await this.initPromise;
      this.initialized = true;
      return this.value;
    } finally {
      this.initPromise = undefined;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  reset(): void {
    this.value = undefined;
    this.initialized = false;
    this.initPromise = undefined;
  }
}

// Usage: Lazy database connection
class DatabaseService {
  private connection = new LazyValue(async () => {
    console.log('Connecting to database...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return createDatabaseConnection();
  });

  async query(sql: string): Promise<unknown[]> {
    const conn = await this.connection.get(); // Initializes on first query
    return conn.query(sql);
  }

  async close(): Promise<void> {
    if (this.connection.isInitialized()) {
      const conn = await this.connection.get();
      await conn.close();
      this.connection.reset();
    }
  }
}

// Usage: Lazy provider initialization
class ProviderFactory {
  private providers = new Map<string, LazyValue<ExecutionProvider>>();

  register(providerId: string, factory: () => Promise<ExecutionProvider>): void {
    this.providers.set(providerId, new LazyValue(factory));
  }

  async getProvider(providerId: string): Promise<ExecutionProvider> {
    const lazyProvider = this.providers.get(providerId);
    if (!lazyProvider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    // Only initialized on first use
    return lazyProvider.get();
  }

  isProviderLoaded(providerId: string): boolean {
    return this.providers.get(providerId)?.isInitialized() ?? false;
  }
}

// Register providers (cheap, no initialization)
const factory = new ProviderFactory();
factory.register('claude', async () => {
  console.log('Initializing Claude provider...');
  return new ClaudeProvider();
});

factory.register('codex', async () => {
  console.log('Initializing Codex provider...');
  return new CodexProvider();
});

// Only Claude is initialized (Codex remains uninitialized)
const provider = await factory.getProvider('claude');
```

**Example explained:**

- Lines 10-14: Fast path returns cached value if already initialized
- Lines 16-19: Concurrent calls wait for in-progress initialization
- Lines 21-29: Single initialization even with concurrent get() calls
- Lines 44-61: Real-world database connection lazy initialization
- Lines 64-91: Provider factory with lazy initialization per provider

### When to Use

**Use this pattern when:**

- Initialization is expensive (network calls, file I/O, complex setup)
- Component may not be used in all code paths
- Reducing startup time is important
- Initialization requires async operations

**Avoid this pattern when:**

- Initialization is cheap
- Component is always used
- Eager initialization provides better error detection
- Synchronous initialization is required

### Benefits

- **Faster Startup**: Defers expensive initialization
- **Resource Savings**: Unused components never initialize
- **Concurrent-Safe**: Handles multiple simultaneous get() calls correctly
- **Clear State**: Easy to check if initialized

### Trade-offs

- **First-Use Latency**: Initial operation is slower
- **Complexity**: More complex than eager initialization
- **Error Handling**: Errors occur during first use, not startup

### Common Mistakes

**Mistake 1: Not handling concurrent initialization**

**Bad example:**

```typescript
async get(): Promise<T> {
  if (!this.initialized) {
    this.value = await this.initializer(); // Runs multiple times if concurrent
    this.initialized = true;
  }
  return this.value!;
}
```

**Correct approach:**

```typescript
async get(): Promise<T> {
  if (this.initialized) {
    return this.value!;
  }

  // Check for in-progress initialization
  if (this.initPromise) {
    return this.initPromise; // Wait for existing initialization
  }

  this.initPromise = Promise.resolve(this.initializer());
  try {
    this.value = await this.initPromise;
    this.initialized = true;
    return this.value;
  } finally {
    this.initPromise = undefined;
  }
}
```

**Why this matters**: Without promise tracking, concurrent calls initialize multiple times.

**Mistake 2: Not using state guards in consuming code**

**Bad example:**

```typescript
class Service {
  private config?: Config;

  async doWork() {
    // No check if config is initialized
    return this.config!.getValue(); // May be undefined
  }
}
```

**Correct approach:**

```typescript
class Service {
  private config = new LazyValue(async () => loadConfig());

  async doWork() {
    const config = await this.config.get(); // Ensures initialization
    return config.getValue();
  }
}
```

**Why this matters**: State guards prevent use-before-initialization bugs.

### Testing Strategy

**What to Test:**

- Initialization only occurs once
- Concurrent get() calls don't duplicate initialization
- Initialized value is cached and reused
- Reset allows re-initialization

**Test Organization:**

- Unit tests with mock initializers
- Track initialization call count
- Test concurrent access

**Mock Strategy:**

- Mock initializer function
- Use counters to track calls
- Use delays to test concurrency

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { LazyValue } from './LazyValue.js';

describe('LazyValue', () => {
  it('should initialize on first get', async () => {
    // Arrange
    let initCount = 0;
    const lazy = new LazyValue(async () => {
      initCount++;
      return 'value';
    });

    // Assert: Not initialized yet
    expect(lazy.isInitialized()).to.be.false;

    // Act
    const value = await lazy.get();

    // Assert
    expect(value).to.equal('value');
    expect(initCount).to.equal(1);
    expect(lazy.isInitialized()).to.be.true;
  });

  it('should cache initialized value', async () => {
    // Arrange
    let initCount = 0;
    const lazy = new LazyValue(async () => {
      initCount++;
      return 'value';
    });

    // Act
    await lazy.get();
    await lazy.get();
    await lazy.get();

    // Assert: Initialized only once
    expect(initCount).to.equal(1);
  });

  it('should handle concurrent get calls', async () => {
    // Arrange
    let initCount = 0;
    const lazy = new LazyValue(async () => {
      initCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'value';
    });

    // Act: Multiple concurrent calls
    const [value1, value2, value3] = await Promise.all([lazy.get(), lazy.get(), lazy.get()]);

    // Assert: Initialized only once despite concurrent calls
    expect(initCount).to.equal(1);
    expect(value1).to.equal('value');
    expect(value2).to.equal('value');
    expect(value3).to.equal('value');
  });

  it('should allow reset and re-initialization', async () => {
    // Arrange
    let initCount = 0;
    const lazy = new LazyValue(async () => {
      initCount++;
      return `value${initCount}`;
    });

    // Act
    const value1 = await lazy.get();
    lazy.reset();
    const value2 = await lazy.get();

    // Assert
    expect(value1).to.equal('value1');
    expect(value2).to.equal('value2');
    expect(initCount).to.equal(2);
  });

  it('should handle initialization errors', async () => {
    // Arrange
    const lazy = new LazyValue(async () => {
      throw new Error('Initialization failed');
    });

    // Act & Assert
    await expect(lazy.get()).to.be.rejectedWith('Initialization failed');

    // Should not be marked as initialized after error
    expect(lazy.isInitialized()).to.be.false;
  });
});
```

**Coverage Goals:**

- Line coverage: 100%
- Test concurrent access thoroughly
- Test error scenarios

### Related Patterns

- **[LRU Cache](#pattern-1-lru-cache-with-automatic-eviction)** - Can combine for cached lazy initialization
- **[Batched Async Operations](#pattern-4-batched-async-operations)** - Can use lazy initialization for batch processing setup

---

## Quick Reference

### Pattern Summary Table

| Pattern             | Use When                   | Avoid When               | Key Benefit                   |
| ------------------- | -------------------------- | ------------------------ | ----------------------------- |
| LRU Cache           | Caching with memory limits | All items must be cached | Memory-bounded caching        |
| Prefix Cache        | Incremental searches       | Random queries           | Dramatic search speedup       |
| TTL Cache           | Time-sensitive data        | Data never stales        | Auto-expiration               |
| Batched Async       | Large async arrays         | Small arrays             | Prevents resource exhaustion  |
| Event Loop Yielding | Large sync operations      | Small operations         | Prevents UI blocking          |
| Adaptive Selection  | Multiple algorithm options | Single algorithm         | Optimal per-scale performance |
| Rate Limiting       | Event flood prevention     | All events critical      | Controls event frequency      |
| High Water Marks    | Noisy metrics              | Every change matters     | Filters metric noise          |
| Lazy Initialization | Expensive setup            | Always needed            | Faster startup                |

### Code Snippets

**LRU Cache - Minimal Example:**

```typescript
const cache = new LruCache<string, Workflow>(50);

async function loadWorkflow(path: string): Promise<Workflow> {
  const cached = cache.get(path);
  if (cached) return cached;

  const workflow = await parseWorkflow(path);
  cache.set(path, workflow);
  return workflow;
}
```

**Prefix Cache - Minimal Example:**

```typescript
const cache = new ResultCache(allFiles);

async function search(query: string): Promise<string[]> {
  const { files, isExactMatch } = await cache.get(query);
  if (isExactMatch) return files;

  const results = files.filter((f) => f.includes(query));
  cache.set(query, results);
  return results;
}
```

**TTL Cache - Minimal Example:**

```typescript
const key = getCacheKey(dir, ignoreRules, maxDepth);
const cached = read(key);
if (cached) return cached;

const results = await crawl(dir);
write(key, results, 5 * 60 * 1000); // 5 min TTL
return results;
```

**Batched Async - Minimal Example:**

```typescript
const LIMIT = 10;

for (let i = 0; i < items.length; i += LIMIT) {
  const batch = items.slice(i, i + LIMIT);
  const results = await Promise.allSettled(batch.map((item) => processItem(item)));
  handleResults(results);
}
```

**Event Loop Yielding - Minimal Example:**

```typescript
for (const [i, item] of items.entries()) {
  if (i % 1000 === 0) {
    await new Promise((resolve) => setImmediate(resolve));
    if (signal?.aborted) throw new AbortError();
  }
  processItem(item);
}
```

**Adaptive Selection - Minimal Example:**

```typescript
const algorithm = items.length > 20000 ? 'v1' : 'v2';
const searcher = new AsyncFzf(items, { fuzzy: algorithm });
```

**Rate Limiting - Minimal Example:**

```typescript
const limiter = new RateLimiter(60000);

function recordMetric(name: string, value: number, critical: boolean) {
  if (limiter.shouldRecord(name, critical)) {
    sendTelemetry(name, value);
  }
}
```

**High Water Marks - Minimal Example:**

```typescript
const tracker = new HighWaterMarkTracker(5); // 5% threshold

function monitorMemory() {
  const mem = process.memoryUsage();
  if (tracker.shouldRecordMetric('rss', mem.rss)) {
    recordTelemetry('memory_rss', mem.rss);
  }
}
```

**Lazy Initialization - Minimal Example:**

```typescript
class Service {
  private db = new LazyValue(() => connectDatabase());

  async query(sql: string) {
    const connection = await this.db.get();
    return connection.query(sql);
  }
}
```

---

## Related Patterns

- **[Testing Patterns](./05-testing-patterns.md)** - Test performance optimizations thoroughly
- **[Stream Processing](./11-stream-processing.md)** - Async patterns for streaming
- **[Dependency Management](./08-dependency-management.md)** - Lazy initialization for dependencies
- **[Error Handling](./04-error-handling-patterns.md)** - Handle performance-related errors

---

## References

**Source Code Examples:**

- [LruCache.ts](../../examplecode/gemini/packages/core/src/utils/LruCache.ts) - LRU cache implementation
- [result-cache.ts](../../examplecode/gemini/packages/core/src/utils/filesearch/result-cache.ts) - Prefix-based caching
- [crawlCache.ts](../../examplecode/gemini/packages/core/src/utils/filesearch/crawlCache.ts) - TTL-based cache
- [memoryDiscovery.ts](../../examplecode/gemini/packages/core/src/utils/memoryDiscovery.ts) - Batched operations
- [fileSearch.ts](../../examplecode/gemini/packages/core/src/utils/filesearch/fileSearch.ts) - Event loop yielding
- [rate-limiter.ts](../../examplecode/gemini/packages/core/src/telemetry/rate-limiter.ts) - Rate limiting
- [high-water-mark-tracker.ts](../../examplecode/gemini/packages/core/src/telemetry/high-water-mark-tracker.ts) - High water marks

**External Resources:**

- [Node.js Event Loop](https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick/) - Understanding async performance
- [V8 Memory Management](https://v8.dev/blog/trash-talk) - Garbage collection and memory
- [Cache Eviction Policies](https://en.wikipedia.org/wiki/Cache_replacement_policies) - LRU and alternatives

---

## Changelog

- **2025-01-21**: Initial performance patterns documentation extracted from production codebase
