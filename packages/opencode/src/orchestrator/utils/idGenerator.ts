/**
 * ID Generator Utilities
 *
 * Shared utilities for generating unique identifiers.
 */

/** Length of random portion in execution IDs */
const RANDOM_ID_LENGTH = 7;

/**
 * Generates a unique execution ID.
 *
 * @returns Unique execution ID in format `exec-{timestamp}-{random}`
 *
 * @example
 * ```typescript
 * const id = generateExecutionId();
 * // Returns: "exec-1703894400000-abc1234"
 * ```
 */
export function generateExecutionId(): string {
  const timestamp = Date.now();
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 2 + RANDOM_ID_LENGTH);
  return `exec-${timestamp}-${randomPart}`;
}
