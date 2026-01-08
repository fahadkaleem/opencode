/**
 * Workflow File Loader
 *
 * Discovers, loads, and validates workflow JSON files from
 * `.flomaster/workflows/` directory.
 */

import { join, basename, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { readdirSync, copyFileSync, mkdirSync, existsSync } from "node:fs"
import { SimpleWorkflowSchema, type SimpleWorkflow } from "../schema/simpleWorkflowSchema"
import { convertSimpleToReactFlow, getInputNodeId, getOutputNodeId } from "../parser/simpleConverter"
import type { WorkflowData } from "../types"

/**
 * Workflow load result with metadata
 */
export type LoadedWorkflow = {
  name: string
  description: string
  workflow: WorkflowData
  inputNodeId: string
  outputNodeId: string
  filePath: string
}

/**
 * Workflow discovery result
 */
export type WorkflowInfo = {
  name: string
  description: string
  filePath: string
  stepCount: number
}

/**
 * Error thrown when workflow loading fails
 */
export class WorkflowLoadError extends Error {
  public readonly filePath: string
  public readonly errorCause?: unknown

  constructor(message: string, filePath: string, errorCause?: unknown) {
    super(message)
    this.name = "WorkflowLoadError"
    this.filePath = filePath
    this.errorCause = errorCause
  }
}

/**
 * Get the workflows directory path for a project
 */
export function getWorkflowsDir(projectDir: string): string {
  return join(projectDir, ".flomaster", "workflows")
}

/**
 * Discover all workflow files in the workflows directory
 */
export function discoverWorkflows(projectDir: string): WorkflowInfo[] {
  const workflowsDir = getWorkflowsDir(projectDir)

  if (!existsSync(workflowsDir)) {
    return []
  }

  const files = readdirSync(workflowsDir).filter((f: string) => f.endsWith(".json"))
  const workflows: WorkflowInfo[] = []

  for (const file of files) {
    const filePath = join(workflowsDir, file)
    try {
      const rawContent = require("node:fs").readFileSync(filePath, "utf-8") as string
      const json = JSON.parse(rawContent) as Record<string, unknown>

      const name = (json["name"] as string) ?? basename(file, ".json")
      const description = (json["description"] as string) ?? "No description"
      const steps = json["steps"]
      const stepCount = Array.isArray(steps) ? steps.length : 0

      workflows.push({ name, description, filePath, stepCount })
    } catch {
      // Skip invalid files in discovery
    }
  }

  return workflows.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Load a workflow by name from the workflows directory
 */
export function loadWorkflow(projectDir: string, name: string): LoadedWorkflow {
  const workflowsDir = getWorkflowsDir(projectDir)
  const filePath = join(workflowsDir, `${name}.json`)

  if (!existsSync(filePath)) {
    throw new WorkflowLoadError(`Workflow not found: ${name}. Expected file at: ${filePath}`, filePath)
  }

  return loadWorkflowFromFile(filePath)
}

/**
 * Parse JSON safely, returning result or error
 */
function safeParseJson(content: string): { data: unknown; error: null } | { data: null; error: Error } {
  try {
    return { data: JSON.parse(content), error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
  }
}

/**
 * Load a workflow from a specific file path
 */
export function loadWorkflowFromFile(filePath: string): LoadedWorkflow {
  if (!existsSync(filePath)) {
    throw new WorkflowLoadError(`Workflow file not found: ${filePath}`, filePath)
  }

  // Use sync read for simpler error handling in CLI context
  const content = require("node:fs").readFileSync(filePath, "utf-8") as string

  // Parse JSON with error handling
  const parseResult = safeParseJson(content)
  if (parseResult.error) {
    throw new WorkflowLoadError(
      `Invalid JSON in workflow file: ${filePath} - ${parseResult.error.message}`,
      filePath,
      parseResult.error,
    )
  }

  // Validate against schema
  const schemaResult = SimpleWorkflowSchema.safeParse(parseResult.data)
  if (!schemaResult.success) {
    const errors = schemaResult.error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n")
    throw new WorkflowLoadError(`Invalid workflow format in ${filePath}:\n${errors}`, filePath, schemaResult.error)
  }

  const simple = schemaResult.data

  // Validate interpolation references
  validateInterpolationReferences(simple, filePath)

  // Convert to React Flow format
  const workflow = convertSimpleToReactFlow(simple)
  const inputNodeId = getInputNodeId(simple)
  const outputNodeId = getOutputNodeId(simple)

  return {
    name: simple.name,
    description: simple.description,
    workflow,
    inputNodeId,
    outputNodeId,
    filePath,
  }
}

/**
 * Validate that all {{stepId.output}} references are valid
 */
function validateInterpolationReferences(workflow: SimpleWorkflow, filePath: string): void {
  const stepIds = new Set(workflow.steps.map((s) => s.id))
  const interpolationRegex = /\{\{([^.}]+)\.([^}]+)\}\}/g

  for (const step of workflow.steps) {
    const dependsOn = new Set(step.depends_on ?? [])

    // Check prompt field
    if (step.prompt) {
      const matches = [...step.prompt.matchAll(interpolationRegex)]
      for (const match of matches) {
        const referencedStepId = match[1]
        if (!referencedStepId) continue

        // Check if referenced step exists
        if (!stepIds.has(referencedStepId)) {
          throw new WorkflowLoadError(
            `Step '${step.id}' references unknown step '{{${referencedStepId}}}' in prompt`,
            filePath,
          )
        }

        // Check if referenced step is in dependency chain
        if (!dependsOn.has(referencedStepId) && referencedStepId !== step.id) {
          // Build transitive dependencies
          const transitiveDeps = getTransitiveDependencies(workflow.steps, step.id)
          if (!transitiveDeps.has(referencedStepId)) {
            throw new WorkflowLoadError(
              `Step '${step.id}' references '{{${referencedStepId}}}' but does not depend on it. ` +
                `Add '${referencedStepId}' to depends_on or add a dependency chain.`,
              filePath,
            )
          }
        }
      }
    }

    // Also check system_prompt
    if (step.system_prompt) {
      const matches = [...step.system_prompt.matchAll(interpolationRegex)]
      for (const match of matches) {
        const referencedStepId = match[1]
        if (!referencedStepId) continue
        if (!stepIds.has(referencedStepId)) {
          throw new WorkflowLoadError(
            `Step '${step.id}' references unknown step '{{${referencedStepId}}}' in system_prompt`,
            filePath,
          )
        }
      }
    }
  }
}

/**
 * Get all transitive dependencies for a step
 */
function getTransitiveDependencies(steps: SimpleWorkflow["steps"], stepId: string): Set<string> {
  const result = new Set<string>()
  const visited = new Set<string>()
  const stepMap = new Map(steps.map((s) => [s.id, s]))

  function visit(id: string) {
    if (visited.has(id)) return
    visited.add(id)

    const step = stepMap.get(id)
    if (!step) return

    for (const dep of step.depends_on ?? []) {
      result.add(dep)
      visit(dep)
    }
  }

  visit(stepId)
  return result
}

/**
 * Check if a workflow exists
 */
export function workflowExists(projectDir: string, name: string): boolean {
  const filePath = join(getWorkflowsDir(projectDir), `${name}.json`)
  return existsSync(filePath)
}

/**
 * Get the path to built-in workflows shipped with FloMaster
 */
export function getBuiltinWorkflowsDir(): string {
  // Built-in workflows are in the package's workflows directory
  const currentFile = fileURLToPath(import.meta.url)
  const packageDir = dirname(dirname(dirname(currentFile)))
  return join(packageDir, "orchestrator", "workflows")
}

/**
 * Copy built-in workflows to project's .flomaster/workflows/ directory
 * Only copies if target doesn't exist (won't overwrite user customizations)
 */
export function installBuiltinWorkflows(projectDir: string): string[] {
  const builtinDir = getBuiltinWorkflowsDir()
  const targetDir = getWorkflowsDir(projectDir)
  const installed: string[] = []

  // Create target directory if needed
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true })
  }

  // Find all JSON files in builtin directory
  if (!existsSync(builtinDir)) {
    return installed
  }

  const builtinFiles = readdirSync(builtinDir).filter((f: string) => f.endsWith(".json"))

  for (const file of builtinFiles) {
    const sourcePath = join(builtinDir, file)
    const targetPath = join(targetDir, file)

    // Only copy if target doesn't exist
    if (!existsSync(targetPath)) {
      copyFileSync(sourcePath, targetPath)
      installed.push(file.replace(".json", ""))
    }
  }

  return installed
}

/**
 * Ensure workflows directory exists and has built-in workflows
 * Called automatically on first CLI run
 */
export function ensureWorkflowsInitialized(projectDir: string): void {
  const workflowsDir = getWorkflowsDir(projectDir)

  // Check if directory exists and has any workflows
  const hasWorkflows = existsSync(workflowsDir) && readdirSync(workflowsDir).some((f: string) => f.endsWith(".json"))

  if (!hasWorkflows) {
    const installed = installBuiltinWorkflows(projectDir)
    if (installed.length > 0) {
      console.log(`Installed built-in workflows: ${installed.join(", ")}`)
    }
  }
}
