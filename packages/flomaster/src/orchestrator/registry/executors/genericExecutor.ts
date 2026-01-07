/**
 * Generic Step Executor
 *
 * Executes Generic, Input, and Output steps as pass-through nodes.
 */

import type { ExecuteStepOutput, ParsedStep } from '../../types.js';
import type {
  ExecutorContext,
  ExecutorOptions,
  StepExecutor,
} from '../types.js';

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
    const stepInputs: Record<string, unknown> = { ...step.inputs };
    for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
      for (const [key, value] of Object.entries(stepOutputs)) {
        if (!(key in stepInputs)) {
          stepInputs[`${stepId}.${key}`] = value;
        }
      }
    }

    return Promise.resolve({
      stepId: step.id,
      outputs: {
        ...stepInputs,
        stepId: step.id,
        displayName: step.displayName,
      },
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
    const stepInputs: Record<string, unknown> = { ...step.inputs };
    for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
      for (const [key, value] of Object.entries(stepOutputs)) {
        if (!(key in stepInputs)) {
          stepInputs[`${stepId}.${key}`] = value;
        }
      }
    }

    const outputs = {
      ...stepInputs,
      ...context.variables,
    };

    return Promise.resolve({
      stepId: step.id,
      outputs,
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
    const stepInputs: Record<string, unknown> = { ...step.inputs };
    for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
      for (const [key, value] of Object.entries(stepOutputs)) {
        if (!(key in stepInputs)) {
          stepInputs[`${stepId}.${key}`] = value;
        }
      }
    }

    return Promise.resolve({
      stepId: step.id,
      outputs: stepInputs,
      complete: true,
    });
  },
};

/**
 * Factory functions for creating the executors.
 */
function _createGenericExecutor(): StepExecutor<'Generic'> {
  return genericExecutor;
}

function _createInputExecutor(): StepExecutor<'Input'> {
  return inputExecutor;
}

function _createOutputExecutor(): StepExecutor<'Output'> {
  return outputExecutor;
}
