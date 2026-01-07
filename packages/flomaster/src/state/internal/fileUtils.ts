/**
 * File I/O Utilities
 *
 * Internal helpers for reading/writing state files.
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"

/**
 * Type guard for Node.js errors with code property.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error
}

/**
 * Safely extract error message from unknown error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/** Valid characters for execution IDs: alphanumeric, dash, underscore */
const VALID_EXECUTION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

/** Maximum length for execution IDs */
const MAX_EXECUTION_ID_LENGTH = 256

/**
 * Validate execution ID is safe for use in file paths.
 * Prevents path traversal attacks.
 *
 * @param executionId - ID to validate
 * @throws Error if ID is invalid
 */
export function validateExecutionId(executionId: string): void {
  if (!executionId || executionId.length === 0) {
    throw new Error("Execution ID cannot be empty")
  }

  if (executionId.length > MAX_EXECUTION_ID_LENGTH) {
    throw new Error(`Execution ID exceeds maximum length of ${MAX_EXECUTION_ID_LENGTH}`)
  }

  if (executionId.includes("\x00")) {
    throw new Error("Execution ID contains null bytes")
  }

  if (executionId.includes("..") || executionId.includes("/") || executionId.includes("\\")) {
    throw new Error("Execution ID contains invalid path characters")
  }

  if (!VALID_EXECUTION_ID_PATTERN.test(executionId)) {
    throw new Error("Execution ID contains invalid characters (allowed: a-z, A-Z, 0-9, _, -)")
  }
}

/**
 * Read and parse a JSON file.
 * Returns null if file doesn't exist.
 */
export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    return JSON.parse(content) as T
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return null
    }
    throw error
  }
}

/**
 * Write JSON to a file with pretty formatting.
 * Creates parent directories if they don't exist.
 */
export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
}

/**
 * Check if a file exists.
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Delete a directory recursively.
 * Returns true if deleted, false if didn't exist.
 */
export async function deleteDirectory(dirPath: string): Promise<boolean> {
  try {
    // Check if exists first
    await fs.access(dirPath)
    await fs.rm(dirPath, { recursive: true, force: true })
    return true
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false
    }
    throw error
  }
}

/**
 * List subdirectories in a directory.
 * Returns empty array if directory doesn't exist.
 */
export async function listSubdirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return []
    }
    throw error
  }
}
