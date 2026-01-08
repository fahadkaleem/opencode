/**
 * Loop Step Executor
 *
 * Executes Loop steps by iterating over collections.
 */

import { getLoopItemOutput, initializeLoop, isLoopComplete } from '../../actors/loopActor.js';
import { LoopExecutionError } from '../../errors.js';
import type { ExecuteStepOutput, ParsedStep } from '../../types.js';
import type { ExecutorContext, ExecutorOptions, StepExecutor } from '../types.js';
import { mergeStepInputs } from './executorUtils.js';

// Re-export for backward compatibility
export { LoopExecutionError } from '../../errors.js';

/**
 * Loop step executor.
 *
 * Handles loop initialization, iteration, and aggregation.
 * Each execution returns either the next item or completion status.
 */
export const loopExecutor: StepExecutor<'Loop'> = {
  type: 'Loop',

  validate(step: ParsedStep) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step.config.type !== 'Loop') {
      errors.push(`Invalid config type: expected 'Loop', got '${step.config.type}'`);
    } else {
      const config = step.config.config;
      if (typeof config.maxIterations !== 'number' || config.maxIterations <= 0) {
        warnings.push('maxIterations should be a positive number');
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  execute(
    step: ParsedStep,
    context: ExecutorContext,
    _options?: ExecutorOptions,
  ): Promise<ExecuteStepOutput> {
    const config = step.config;

    if (config.type !== 'Loop') {
      return Promise.reject(
        new LoopExecutionError(`Invalid config type for loop step: ${config.type}`, step.id),
      );
    }

    const stepInputs = mergeStepInputs(step, context);
    let loopState = context.loopStates.get(step.id);

    if (loopState?.initialized !== true) {
      const data = stepInputs['data'] ?? stepInputs['items'] ?? stepInputs['list'] ?? [];
      loopState = initializeLoop(step.id, data, config.config.maxIterations);
    }

    if (isLoopComplete(loopState, config.config.maxIterations)) {
      return Promise.resolve({
        stepId: step.id,
        outputs: { done: loopState.aggregated, results: loopState.aggregated },
        loopState,
        complete: true,
      });
    }

    const itemOutput = getLoopItemOutput(loopState);

    return Promise.resolve({
      stepId: step.id,
      outputs: {
        item: itemOutput.item,
        index: itemOutput.index,
        total: itemOutput.total,
        hasMore: itemOutput.hasMore,
      },
      loopState,
      complete: false,
    });
  },
};

// TODO(future): Factory function for creating configurable loop executors
// function _createLoopExecutor(config?: LoopExecutorConfig): StepExecutor<'Loop'> {
//   return loopExecutor;
// }
