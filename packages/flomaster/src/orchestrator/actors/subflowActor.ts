/**
 * SubFlow Actor
 *
 * XState actor for executing sub-workflows.
 * Spawns a child workflow machine and waits for completion.
 */

import { fromPromise } from 'xstate';
import type {
  SubFlowConfig,
  SubFlowOutput,
  WorkflowData,
  WorkflowResult,
} from '../types.js';

/**
 * Input for the subflow actor.
 */
export type SubFlowInput = {
  /** Flow ID to execute */
  flowId?: string;
  /** Flow name to execute */
  flowName?: string;
  /** Inputs to pass to the sub-flow */
  inputs: Record<string, unknown>;
  /** Parent context for variable inheritance */
  parentContext: Record<string, unknown>;
  /** Tweaks to apply to the flow */
  tweaks?: Record<string, unknown>;
  /** Whether to run synchronously */
  synchronous: boolean;
  /** Loader function for fetching flow definitions */
  loadFlow: (nameOrId: string) => Promise<WorkflowData>;
  /** Executor function for running the workflow */
  executeWorkflow: (
    graph: WorkflowData,
    taskId: string,
    inputs: Record<string, unknown>,
  ) => Promise<WorkflowResult>;
};

/**
 * Error thrown when subflow execution fails.
 */
export class SubFlowExecutionError extends Error {
  readonly flowId?: string;
  readonly flowName?: string;
  readonly originalCause?: Error;

  constructor(
    message: string,
    flowId?: string,
    flowName?: string,
    originalCause?: Error,
  ) {
    super(message);
    this.name = 'SubFlowExecutionError';
    if (flowId !== undefined) {
      this.flowId = flowId;
    }
    if (flowName !== undefined) {
      this.flowName = flowName;
    }
    if (originalCause !== undefined) {
      this.originalCause = originalCause;
    }
  }
}

/**
 * Applies tweaks to a graph.
 * Tweaks modify node template values.
 */
export function applyTweaks(
  graph: WorkflowData,
  tweaks: Record<string, unknown>,
): WorkflowData {
  if (Object.keys(tweaks).length === 0) {
    return graph;
  }

  // Deep clone the graph to avoid mutations
  const clonedGraph: WorkflowData = JSON.parse(
    JSON.stringify(graph),
  ) as unknown as WorkflowData;

  for (const node of clonedGraph.nodes) {
    const nodeId = node.id;
    const nodeTweaks = tweaks[nodeId] as Record<string, unknown> | undefined;

    if (nodeTweaks) {
      // Apply tweaks to node template
      const template = node.data.node.template as unknown as Record<
        string,
        Record<string, unknown>
      >;
      for (const [key, value] of Object.entries(nodeTweaks)) {
        if (key in template && typeof template[key] === 'object') {
          (template[key] as Record<string, unknown>)['value'] = value;
        }
      }
    }
  }

  return clonedGraph;
}

/**
 * Merges parent context into inputs.
 */
export function mergeContext(
  inputs: Record<string, unknown>,
  parentContext: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...parentContext,
    ...inputs,
  };
}

/**
 * Generates a unique task ID for the sub-flow.
 */
function generateSubFlowTaskId(flowId?: string, flowName?: string): string {
  const identifier = flowId ?? flowName ?? 'unknown';
  return `subflow-${identifier}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * XState actor for executing sub-workflows.
 */
export const subflowActor = fromPromise<SubFlowOutput, SubFlowInput>(
  async ({ input }) => {
    const {
      flowId,
      flowName,
      inputs,
      parentContext,
      tweaks,
      loadFlow,
      executeWorkflow,
    } = input;

    if (flowId === undefined && flowName === undefined) {
      throw new SubFlowExecutionError(
        'SubFlow requires either flowId or flowName',
        flowId,
        flowName,
      );
    }

    try {
      const flowIdentifier = flowId ?? flowName ?? '';
      const graph = await loadFlow(flowIdentifier);

      // Apply tweaks if provided
      const tweakedGraph = tweaks ? applyTweaks(graph, tweaks) : graph;

      const mergedInputs = mergeContext(inputs, parentContext);

      const taskId = generateSubFlowTaskId(flowId, flowName);

      const result = await executeWorkflow(tweakedGraph, taskId, mergedInputs);

      if (result.terminateMode === 'COMPLETED') {
        return {
          outputs: result.outputs,
          success: true,
        };
      }

      return {
        outputs: result.outputs,
        success: false,
        error:
          result.error ??
          `SubFlow terminated with mode: ${result.terminateMode}`,
      };
    } catch (error) {
      throw new SubFlowExecutionError(
        `Failed to execute sub-flow: ${error instanceof Error ? error.message : String(error)}`,
        flowId,
        flowName,
        error instanceof Error ? error : undefined,
      );
    }
  },
);

/**
 * Creates subflow input from parsed node data.
 */
export function createSubFlowInput(
  config: SubFlowConfig,
  inputs: Record<string, unknown>,
  parentContext: Record<string, unknown>,
  loadFlow: SubFlowInput['loadFlow'],
  executeWorkflow: SubFlowInput['executeWorkflow'],
): SubFlowInput {
  const flowId = config.flowId;
  const flowName = config.flowName;
  const tweaks = config.tweaks;

  return {
    ...(flowId !== undefined && { flowId }),
    ...(flowName !== undefined && { flowName }),
    inputs,
    parentContext,
    ...(tweaks !== undefined && { tweaks }),
    synchronous: config.synchronous,
    loadFlow,
    executeWorkflow,
  };
}

/**
 * Placeholder for async subflow execution (fire-and-forget).
 */
export type AsyncSubFlowHandle = {
  /** Unique ID for this execution */
  executionId: string;
  /** Check if execution is complete */
  isComplete: () => Promise<boolean>;
  /** Get the result (blocks until complete) */
  getResult: () => Promise<SubFlowOutput>;
  /** Cancel the execution */
  cancel: () => Promise<void>;
};

/**
 * Creates an async subflow handle.
 * Used for non-synchronous subflow execution.
 */
export function createAsyncSubFlowHandle(
  executionId: string,
  resultPromise: Promise<SubFlowOutput>,
  cancelFn: () => void,
): AsyncSubFlowHandle {
  let isCompleted = false;
  let result: SubFlowOutput | undefined;
  let error: Error | undefined;

  resultPromise
    .then((r) => {
      result = r;
      isCompleted = true;
    })
    .catch((e: unknown) => {
      error = e instanceof Error ? e : new Error(String(e));
      isCompleted = true;
    });

  return {
    executionId,
    isComplete: () => Promise.resolve(isCompleted),
    getResult: async () => {
      if (error) throw error;
      if (result) return result;
      return resultPromise;
    },
    cancel: () => {
      cancelFn();
      return Promise.resolve();
    },
  };
}
