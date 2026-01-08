/**
 * Lock Manager
 *
 * Provides mutex locking per execution ID to prevent concurrent modifications.
 * Uses a simple promise-based mutex implementation to avoid external dependencies.
 */

/**
 * Simple promise-based mutex.
 */
class SimpleMutex {
  private locked = false
  private queue: Array<() => void> = []

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true
      return
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
    })
  }

  release(): void {
    const next = this.queue.shift()
    if (next) {
      next()
    } else {
      this.locked = false
    }
  }

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

/**
 * Manages locks for execution state operations.
 *
 * Each execution ID gets its own mutex to allow parallel operations
 * on different executions while serializing operations on the same execution.
 */
export class LockManager {
  private readonly locks = new Map<string, SimpleMutex>()

  /**
   * Get or create a mutex for an execution ID.
   */
  private getMutex(executionId: string): SimpleMutex {
    const existing = this.locks.get(executionId)
    if (existing) {
      return existing
    }
    const mutex = new SimpleMutex()
    this.locks.set(executionId, mutex)
    return mutex
  }

  /**
   * Execute a function with exclusive access to an execution.
   */
  async withLock<T>(executionId: string, fn: () => Promise<T>): Promise<T> {
    const mutex = this.getMutex(executionId)
    return mutex.runExclusive(fn)
  }

  /**
   * Remove lock for an execution (call after deleteExecution).
   */
  removeLock(executionId: string): void {
    this.locks.delete(executionId)
  }

  /**
   * Clear all locks (for testing).
   */
  clear(): void {
    this.locks.clear()
  }
}
