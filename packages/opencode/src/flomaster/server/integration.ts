/**
 * FloMaster Server Integration
 *
 * Provides a function to register FloMaster routes with an OpenCode server instance.
 * This is the integration point between FloMaster and OpenCode's server.
 */

import type { Hono } from "hono"
import { createWorkflowRoutes } from "./routes"

/**
 * Register FloMaster workflow routes with an OpenCode Hono app.
 *
 * @example
 * ```typescript
 * // In opencode/src/server/server.ts
 * import { registerWorkflowRoutes } from "@opencode-ai/flomaster/server/integration"
 *
 * // Inside the app setup:
 * registerWorkflowRoutes(app)
 * ```
 */
export function registerWorkflowRoutes(app: Hono): void {
  const workflowRoutes = createWorkflowRoutes()
  app.route("/", workflowRoutes)
}
