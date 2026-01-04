/**
 * SubFlow Step Executor
 *
 * Executes SubFlow steps by invoking nested workflows.
 */

import { SubFlowExecutionError } from '../../actors/subflowActor.js';
import type {
  ExecuteStepOutput,
  ParsedStep,
  WorkflowData,
  WorkflowResult,
} from '../../types.js';
import type {
  ExecutorContext,
  ExecutorDependencies,
  ExecutorOptions,
  StepExecutor,
} from '../types.js';

/**
 * Dependencies required for SubFlow execution.
 */
export type SubFlowExecutorDependencies = {
  /** Load a workflow by name or ID */
  readonly loadWorkflow: (nameOrId: string) => Promise<WorkflowData>;
  /** Execute a loaded workflow */
  readonly executeWorkflow: (
    workflow: WorkflowData,
    taskId: string,
    inputs: Record<string, unknown>,
  ) => Promise<WorkflowResult>;
};

/**
 * Create a SubFlow step executor.
 *
 * @param dependencies - Load and execute workflow functions
 * @returns StepExecutor for SubFlow steps
 *
 * @example
 * ```typescript
 * const subflowExecutor = createSubFlowExecutor({
 *   loadWorkflow: (name) => engine.loadWorkflow(name),
 *   executeWorkflow: (workflow, taskId, inputs) => engine.executeWorkflow(workflow, taskId, { variables: inputs }),
 * });
 * registry.register(subflowExecutor, 'custom');
 * ```
 */
export function createSubFlowExecutor(
  dependencies: SubFlowExecutorDependencies,
): StepExecutor<'SubFlow'> {
  return {
    type: 'SubFlow',

    validate(step: ParsedStep) {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (step.config.type !== 'SubFlow') {
        errors.push(
          `Invalid config type: expected 'SubFlow', got '${step.config.type}'`,
        );
      } else {
        const config = step.config.config;
        if (config.flowId === undefined && config.flowName === undefined) {
          errors.push('SubFlow requires either flowId or flowName');
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    },

    async execute(
      step: ParsedStep,
      context: ExecutorContext,
      _options?: ExecutorOptions,
    ): Promise<ExecuteStepOutput> {
      const config = step.config;

      if (config.type !== 'SubFlow') {
        throw new SubFlowExecutionError(
          `Invalid config type for subflow step: ${config.type}`,
          undefined,
          undefined,
        );
      }

      const flowIdentifier =
        config.config.flowName ?? config.config.flowId ?? 'unknown';

      // In dry-run mode, return mock outputs
      if (context.dryRun) {
        return {
          stepId: step.id,
          outputs: {
            result: `[DRY-RUN] SubFlow ${flowIdentifier} would execute`,
            success: true,
          },
          complete: true,
        };
      }

      const stepInputs: Record<string, unknown> = { ...step.inputs };
      for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
        for (const [key, value] of Object.entries(stepOutputs)) {
          if (!(key in stepInputs)) {
            stepInputs[`${stepId}.${key}`] = value;
          }
        }
      }

      const parentContext: Record<string, unknown> = {};
      for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
        for (const [key, value] of Object.entries(stepOutputs)) {
          parentContext[`${stepId}.${key}`] = value;
        }
      }

      try {
        const { flowId, flowName, tweaks } = config.config;

        if (flowId === undefined && flowName === undefined) {
          throw new SubFlowExecutionError(
            'SubFlow requires either flowId or flowName',
            flowId,
            flowName,
          );
        }

        const flowIdentifierToLoad = flowId ?? flowName ?? '';
        const graph = await dependencies.loadWorkflow(flowIdentifierToLoad);

        // Apply tweaks if provided (deep clone to avoid mutations)
        let tweakedGraph = graph;
        if (tweaks && Object.keys(tweaks).length > 0) {
          tweakedGraph = JSON.parse(
            JSON.stringify(graph),
          ) as unknown as WorkflowData;
          for (const graphNode of tweakedGraph.nodes) {
            const nodeTweaks = tweaks[graphNode.id] as
              | Record<string, unknown>
              | undefined;
            if (nodeTweaks) {
              const template = graphNode.data.node
                .template as unknown as Record<string, Record<string, unknown>>;
              for (const [key, value] of Object.entries(nodeTweaks)) {
                if (key in template && typeof template[key] === 'object') {
                  (template[key] as Record<string, unknown>)['value'] = value;
                }
              }
            }
          }
        }

        const mergedInputs = { ...parentContext, ...stepInputs };

        const taskId = `subflow-${flowIdentifierToLoad}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        const result = await dependencies.executeWorkflow(
          tweakedGraph,
          taskId,
          mergedInputs,
        );

        if (result.terminateMode === 'COMPLETED') {
          return {
            stepId: step.id,
            outputs: {
              ...result.outputs,
              success: true,
            },
            complete: true,
          };
        }

        return {
          stepId: step.id,
          outputs: {
            ...result.outputs,
            success: false,
            error:
              result.error ??
              `SubFlow terminated with mode: ${result.terminateMode}`,
          },
          complete: true,
        };
      } catch (error) {
        if (error instanceof SubFlowExecutionError) {
          throw error;
        }
        throw new SubFlowExecutionError(
          `SubFlow execution failed: ${error instanceof Error ? error.message : String(error)}`,
          config.config.flowId,
          config.config.flowName,
          error instanceof Error ? error : undefined,
        );
      }
    },
  };
}

/**
 * Create a SubFlow executor from dependencies.
 */
export function createSubFlowExecutorFromDependencies(
  dependencies: ExecutorDependencies,
): StepExecutor<'SubFlow'> | null {
  if (!dependencies.loadWorkflow || !dependencies.executeWorkflow) {
    return null;
  }

  return createSubFlowExecutor({
    loadWorkflow: dependencies.loadWorkflow as (
      nameOrId: string,
    ) => Promise<WorkflowData>,
    executeWorkflow: dependencies.executeWorkflow as (
      workflow: WorkflowData,
      taskId: string,
      inputs: Record<string, unknown>,
    ) => Promise<WorkflowResult>,
  });
}

/**
 * Placeholder SubFlow executor for when dependencies are not available.
 */
export const placeholderSubFlowExecutor: StepExecutor<'SubFlow'> = {
  type: 'SubFlow',

  execute(
    step: ParsedStep,
    _context: ExecutorContext,
    _options?: ExecutorOptions,
  ): Promise<ExecuteStepOutput> {
    const flowIdentifier =
      step.config.type === 'SubFlow'
        ? (step.config.config.flowName ??
          step.config.config.flowId ??
          'unknown')
        : 'unknown';

    return Promise.resolve({
      stepId: step.id,
      outputs: {
        result: `SubFlow ${flowIdentifier} executed (no executor configured)`,
        success: true,
        _placeholder: true,
      },
      complete: true,
    });
  },
};
