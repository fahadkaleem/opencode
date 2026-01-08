/**
 * Generic Step Executor
 *
 * Executes Generic, Input, and Output steps as pass-through nodes.
 */

import type { ExecuteStepOutput, ParsedStep } from '../../types.js';
import type { ExecutorContext, ExecutorOptions, StepExecutor } from '../types.js';
import { mergeStepInputs } from './executorUtils.js';

/**
 * Generic step executor.
 *
 * Pass-through executor that forwards inputs as outputs.
 * Used for Generic, Input, and Output step types.
 */
export const genericExecutor: StepExecutor<'Generic'> = {
  type: 'Generic',

  execute(
    step: ParsedStep,
    context: ExecutorContext,
    _options?: ExecutorOptions,
  ): Promise<ExecuteStepOutput> {
    const inputs = mergeStepInputs(step, context);
    return Promise.resolve({
      stepId: step.id,
      outputs: { ...inputs, stepId: step.id, displayName: step.displayName },
      complete: true,
    });
  },
};

/**
 * Input step executor.
 *
 * Handles workflow input parameters.
 */
export const inputExecutor: StepExecutor<'Input'> = {
  type: 'Input',

  execute(
    step: ParsedStep,
    context: ExecutorContext,
    _options?: ExecutorOptions,
  ): Promise<ExecuteStepOutput> {
    const inputs = mergeStepInputs(step, context);
    return Promise.resolve({
      stepId: step.id,
      outputs: { ...inputs, ...context.variables },
      complete: true,
    });
  },
};

/**
 * Output step executor.
 *
 * Handles workflow output collection.
 */
export const outputExecutor: StepExecutor<'Output'> = {
  type: 'Output',

  execute(
    step: ParsedStep,
    context: ExecutorContext,
    _options?: ExecutorOptions,
  ): Promise<ExecuteStepOutput> {
    return Promise.resolve({
      stepId: step.id,
      outputs: mergeStepInputs(step, context),
      complete: true,
    });
  },
};

// TODO(future): Factory functions for creating configurable executors
// function _createGenericExecutor(config?: GenericExecutorConfig): StepExecutor<'Generic'> {
//   return genericExecutor;
// }
// function _createInputExecutor(config?: InputExecutorConfig): StepExecutor<'Input'> {
//   return inputExecutor;
// }
// function _createOutputExecutor(config?: OutputExecutorConfig): StepExecutor<'Output'> {
//   return outputExecutor;
// }
