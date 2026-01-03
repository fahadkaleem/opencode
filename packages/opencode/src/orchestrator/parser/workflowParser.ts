/**
 * Workflow Parser
 *
 * Main entry point for parsing workflow data.
 * Converts React Flow JSON format into our internal representation.
 */

import type {
  ConnectionData,
  ParsedStep,
  ParsedWorkflow,
  StepData,
} from '../types.js';
import {
  buildAdjacencyList,
  buildReverseAdjacencyList,
  parseConnections,
} from './connectionParser.js';
import { isNoteStep, parseStep } from './stepParser.js';
import {
  CycleDetectedError,
  detectCycle,
  findEntryPoints,
  findExitPoints,
  isValidLoopCycle,
  topologicalSort,
} from './topology.js';

/**
 * Error thrown when workflow parsing fails.
 */
export class WorkflowParseError extends Error {
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'WorkflowParseError';
    if (details !== undefined) {
      this.details = details;
    }
  }
}

/** Input type for parseWorkflow that allows validation of untrusted data */
type WorkflowDataInput = {
  readonly nodes?: unknown;
  readonly edges?: unknown;
  readonly viewport?: unknown;
};

/**
 * Parses a workflow into our internal representation.
 *
 * @param workflowData - The workflow data (may be untrusted input requiring validation)
 * @returns Parsed workflow with execution order and adjacency information
 * @throws WorkflowParseError if parsing fails
 * @throws CycleDetectedError if an invalid cycle is detected
 */
export function parseWorkflow(workflowData: WorkflowDataInput): ParsedWorkflow {
  if (!Array.isArray(workflowData.nodes)) {
    throw new WorkflowParseError(
      'Invalid workflow data: nodes must be an array',
    );
  }
  if (!Array.isArray(workflowData.edges)) {
    throw new WorkflowParseError(
      'Invalid workflow data: edges must be an array',
    );
  }

  // Type assertions after runtime validation
  const stepsData = workflowData.nodes as StepData[];
  const connectionsData = workflowData.edges as ConnectionData[];

  const nodes = new Map<string, ParsedStep>();
  for (const step of stepsData) {
    if (isNoteStep(step)) continue;

    try {
      const parsed = parseStep(step);
      nodes.set(step.id, parsed);
    } catch (error) {
      throw new WorkflowParseError(
        `Failed to parse step ${step.id}: ${error instanceof Error ? error.message : String(error)}`,
        { nodeId: step.id, node: step },
      );
    }
  }

  const nodeIds = new Set(nodes.keys());

  const edges = parseConnections(connectionsData);

  const adjacency = buildAdjacencyList(connectionsData, nodeIds);
  const reverseAdjacency = buildReverseAdjacencyList(connectionsData, nodeIds);

  const cycle = detectCycle(nodes, adjacency);
  if (cycle && !isValidLoopCycle(cycle, nodes)) {
    throw new CycleDetectedError(
      `Workflow contains an invalid cycle: ${cycle.join(' → ')}`,
      cycle,
    );
  }

  let executionOrder: string[];
  try {
    executionOrder = topologicalSort(nodes, adjacency);
  } catch (error) {
    if (error instanceof CycleDetectedError) {
      // Re-check if it's a valid loop cycle
      if (isValidLoopCycle(error.cycle, nodes)) {
        const cleanedAdjacency = removeLoopBackEdges(adjacency, nodes);
        executionOrder = topologicalSort(nodes, cleanedAdjacency);
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  const entryPoints = findEntryPoints(nodes, reverseAdjacency);
  const exitPoints = findExitPoints(nodes, adjacency);

  return {
    executionOrder,
    nodes,
    edges,
    adjacency,
    reverseAdjacency,
    entryPoints,
    exitPoints,
  };
}

/**
 * Removes loop back-edges from the adjacency list.
 * This allows topological sort to succeed for workflows with loops.
 */
function removeLoopBackEdges(
  adjacency: Map<string, string[]>,
  nodes: Map<string, ParsedStep>,
): Map<string, string[]> {
  const cleaned = new Map<string, string[]>();

  for (const [nodeId, successors] of adjacency) {
    const step = nodes.get(nodeId);
    if (step?.type === 'Loop') {
      // For loop steps, remove edges that go back to predecessors
      const filtered = successors.filter((successor) => {
        const successorStep = nodes.get(successor);
        // Keep edges that don't create cycles
        return successorStep?.type !== 'Loop';
      });
      cleaned.set(nodeId, filtered);
    } else {
      cleaned.set(nodeId, [...successors]);
    }
  }

  return cleaned;
}

/**
 * Gets all predecessors of a step (recursive).
 *
 * @param stepId - The step to get predecessors for
 * @param reverseAdjacency - Reverse adjacency list
 * @returns Set of all predecessor step IDs
 */
export function getAllPredecessors(
  stepId: string,
  reverseAdjacency: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const predecessors = new Set<string>();
  const queue = [...(reverseAdjacency.get(stepId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) continue;
    if (!predecessors.has(current)) {
      predecessors.add(current);
      queue.push(...(reverseAdjacency.get(current) ?? []));
    }
  }

  return predecessors;
}

/**
 * Gets all successors of a step (recursive).
 *
 * @param stepId - The step to get successors for
 * @param adjacency - Adjacency list
 * @returns Set of all successor step IDs
 */
export function getAllSuccessors(
  stepId: string,
  adjacency: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const successors = new Set<string>();
  const queue = [...(adjacency.get(stepId) ?? [])];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) continue;
    if (!successors.has(current)) {
      successors.add(current);
      queue.push(...(adjacency.get(current) ?? []));
    }
  }

  return successors;
}

/**
 * Gets the next runnable steps after a step completes.
 * A step is runnable if all its predecessors have completed.
 *
 * @param completedStepId - The step that just completed
 * @param workflow - The parsed workflow
 * @param completedSteps - Set of all completed step IDs
 * @returns Array of step IDs that can now be executed
 */
export function getNextRunnableSteps(
  completedStepId: string,
  workflow: ParsedWorkflow,
  completedSteps: ReadonlySet<string>,
): string[] {
  const runnable: string[] = [];
  const successors = workflow.adjacency.get(completedStepId) ?? [];

  for (const successor of successors) {
    const predecessors = workflow.reverseAdjacency.get(successor) ?? [];
    const allPredecessorsComplete = predecessors.every((pred) =>
      completedSteps.has(pred),
    );

    if (allPredecessorsComplete) {
      runnable.push(successor);
    }
  }

  return runnable;
}

/**
 * Gets input data for a step from its predecessors' outputs.
 *
 * @param stepId - The step to get inputs for
 * @param workflow - The parsed workflow
 * @param outputs - Accumulated outputs from all steps
 * @returns Record of input names to their values
 */
export function getStepInputs(
  stepId: string,
  workflow: ParsedWorkflow,
  outputs: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  const step = workflow.nodes.get(stepId);
  if (!step) return {};

  const inputs: Record<string, unknown> = { ...step.inputs };

  for (const connection of workflow.edges.values()) {
    if (connection.target === stepId) {
      const sourceOutputs = outputs[connection.source];
      if (sourceOutputs && connection.sourceOutput in sourceOutputs) {
        inputs[connection.targetInput] = sourceOutputs[connection.sourceOutput];
      }
    }
  }

  return inputs;
}

/**
 * Validates that a workflow is well-formed.
 *
 * @param workflow - The parsed workflow
 * @returns Array of validation error messages (empty if valid)
 */
export function validateWorkflow(workflow: ParsedWorkflow): string[] {
  const errors: string[] = [];

  if (workflow.entryPoints.length === 0) {
    errors.push('Workflow has no entry points (steps with no predecessors)');
  }

  if (workflow.exitPoints.length === 0) {
    errors.push('Workflow has no exit points (steps with no successors)');
  }

  const reachable = new Set<string>();
  const queue = [...workflow.entryPoints];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) continue;
    if (!reachable.has(current)) {
      reachable.add(current);
      queue.push(...(workflow.adjacency.get(current) ?? []));
    }
  }

  for (const stepId of workflow.nodes.keys()) {
    if (!reachable.has(stepId)) {
      errors.push(`Step ${stepId} is unreachable from entry points`);
    }
  }

  for (const step of workflow.nodes.values()) {
    if (step.type === 'SubFlow') {
      const config = step.config;
      if (
        config.type === 'SubFlow' &&
        config.config.flowName === undefined &&
        config.config.flowId === undefined
      ) {
        errors.push(`SubFlow step ${step.id} must have flowName or flowId`);
      }
    }
  }

  return errors;
}

export { parseConnection, parseConnections } from './connectionParser.js';
// Re-export from submodules for convenience
export { isFlowControlStep, isNoteStep, parseStep } from './stepParser.js';
export {
  CycleDetectedError,
  detectCycle,
  findEntryPoints,
  findExitPoints,
  topologicalSort,
} from './topology.js';
