/**
 * Execution Logger
 *
 * Provides execution-specific logging that persists to the execution directory.
 * Uses OpenCode's Log system as the base and tees output to execution-specific files.
 */

import * as fs from "node:fs"
import * as path from "node:path"
import { Log } from "opencode/util/log"
import { EXECUTIONS_DIR, FLOMASTER_DIR } from "./defaults.js"

// Constants
const LOGS_FILENAME = "logs.txt"

// Types
export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

export type ExecutionLogEntry = {
  timestamp: string
  level: LogLevel
  service: string
  message: string
  extra?: Record<string, unknown>
}

export type ExecutionLogger = {
  debug(message: string, extra?: Record<string, unknown>): void
  info(message: string, extra?: Record<string, unknown>): void
  warn(message: string, extra?: Record<string, unknown>): void
  error(message: string, extra?: Record<string, unknown>): void
  child(service: string): ExecutionLogger
  flush(): void
}

// Internal state
const loggerRegistry = new Map<string, ExecutionLoggerImpl>()

/**
 * Implementation of ExecutionLogger.
 *
 * Writes logs to both:
 * 1. OpenCode's global log (for TUI/console)
 * 2. Execution-specific log file (for persistence)
 */
class ExecutionLoggerImpl implements ExecutionLogger {
  private readonly executionId: string
  private readonly service: string
  private readonly logFilePath: string
  private readonly openCodeLog: Log.Logger
  private writeStream: fs.WriteStream | null = null

  constructor(executionId: string, service: string, executionsDir?: string) {
    this.executionId = executionId
    this.service = service

    const baseDir = executionsDir ?? path.join(FLOMASTER_DIR, EXECUTIONS_DIR)
    this.logFilePath = path.join(baseDir, executionId, LOGS_FILENAME)

    // Create OpenCode logger for console output
    this.openCodeLog = Log.create({ service: `flomaster:${service}` })
  }

  private ensureWriteStream(): fs.WriteStream {
    if (this.writeStream === null) {
      // Ensure directory exists
      const dir = path.dirname(this.logFilePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      this.writeStream = fs.createWriteStream(this.logFilePath, { flags: "a" })
    }
    return this.writeStream
  }

  private formatEntry(level: LogLevel, message: string, extra?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString()
    const extraStr = extra ? ` ${JSON.stringify(extra)}` : ""
    return `${timestamp} [${level.padEnd(5)}] [${this.service}] ${message}${extraStr}\n`
  }

  private log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
    // Write to execution-specific log file
    const entry = this.formatEntry(level, message, extra)
    const stream = this.ensureWriteStream()
    stream.write(entry)

    // Also write to OpenCode's global log (for console/TUI)
    switch (level) {
      case "DEBUG":
        this.openCodeLog.debug(message, extra)
        break
      case "INFO":
        this.openCodeLog.info(message, extra)
        break
      case "WARN":
        this.openCodeLog.warn(message, extra)
        break
      case "ERROR":
        this.openCodeLog.error(message, extra)
        break
    }
  }

  debug(message: string, extra?: Record<string, unknown>): void {
    this.log("DEBUG", message, extra)
  }

  info(message: string, extra?: Record<string, unknown>): void {
    this.log("INFO", message, extra)
  }

  warn(message: string, extra?: Record<string, unknown>): void {
    this.log("WARN", message, extra)
  }

  error(message: string, extra?: Record<string, unknown>): void {
    this.log("ERROR", message, extra)
  }

  child(service: string): ExecutionLogger {
    return new ExecutionLoggerImpl(this.executionId, `${this.service}:${service}`)
  }

  flush(): void {
    if (this.writeStream) {
      this.writeStream.end()
      this.writeStream = null
    }
  }
}

/**
 * Create or get an ExecutionLogger for a specific execution.
 *
 * Loggers are cached per execution to ensure all logs go to the same file.
 *
 * @param executionId - The execution ID
 * @param service - The service/component name (e.g., "WorkflowEngine", "AgentExecutor")
 * @param executionsDir - Optional custom executions directory
 * @returns An ExecutionLogger instance
 *
 * @example
 * ```typescript
 * const log = getExecutionLogger("exec-123", "AgentExecutor");
 * log.info("Starting agent execution", { stepId: "research" });
 * log.debug("Tool call received", { tool: "read", file: "src/index.ts" });
 * log.error("Execution failed", { error: "Timeout" });
 * ```
 */
export function getExecutionLogger(
  executionId: string,
  service: string,
  executionsDir?: string,
): ExecutionLogger {
  const key = `${executionId}:${service}`
  const cached = loggerRegistry.get(key)
  if (cached) {
    return cached
  }

  const logger = new ExecutionLoggerImpl(executionId, service, executionsDir)
  loggerRegistry.set(key, logger)
  return logger
}

/**
 * Flush and close all loggers for an execution.
 * Call this when an execution completes or fails.
 *
 * @param executionId - The execution ID to flush
 */
export function flushExecutionLoggers(executionId: string): void {
  for (const [key, logger] of loggerRegistry.entries()) {
    if (key.startsWith(`${executionId}:`)) {
      logger.flush()
      loggerRegistry.delete(key)
    }
  }
}

/**
 * Read logs for a specific execution.
 *
 * @param executionId - The execution ID
 * @param executionsDir - Optional custom executions directory
 * @returns The log contents as a string, or null if no logs exist
 */
export function readExecutionLogs(executionId: string, executionsDir?: string): string | null {
  const baseDir = executionsDir ?? path.join(FLOMASTER_DIR, EXECUTIONS_DIR)
  const logFilePath = path.join(baseDir, executionId, LOGS_FILENAME)

  try {
    return fs.readFileSync(logFilePath, "utf-8")
  } catch {
    return null
  }
}

/**
 * Get the log file path for an execution.
 *
 * @param executionId - The execution ID
 * @param executionsDir - Optional custom executions directory
 * @returns The absolute path to the log file
 */
export function getLogFilePath(executionId: string, executionsDir?: string): string {
  const baseDir = executionsDir ?? path.join(FLOMASTER_DIR, EXECUTIONS_DIR)
  return path.join(baseDir, executionId, LOGS_FILENAME)
}
