# Performance Rules

## Example

```typescript
// Fault-tolerant parallel with batching
async function processUsers(ids: string[]): Promise<Map<string, User | null>> {
  const BATCH_SIZE = 10;
  const results = new Map<string, User | null>();

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map(getUser));

    settled.forEach((result, idx) => {
      results.set(
        batch[idx],
        result.status === 'fulfilled' ? result.value : null,
      );
    });
  }
  return results;
}
```

## Parallel Execution

- Use `Promise.allSettled()` when partial success is acceptable
- Batch concurrent ops with explicit limits (e.g., 10 at a time)

## Long Operations

- Yield in loops >1000 iterations: `await setImmediate` + check abort
- Accept `AbortSignal` for cancellable operations

## Caching

- All caches must be bounded: LRU with `maxSize` or TTL
- Never use unbounded `Map` - causes memory leaks

## Output

- Use named constants for limits, not magic numbers
- Truncate large output: `[2,847 more lines truncated]`

## Retries

- Retry only: 429, 5xx, timeout
- Never retry: 400, 401, 403
- Use exponential backoff with jitter
