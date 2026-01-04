/**
 * Conditional Router Step Executor
 *
 * Executes ConditionalRouter steps by evaluating conditions and routing to branches.
 */

import {
  createConditionalInput,
  evaluateCondition,
} from '../../actors/conditionalActor.js';
import type { ExecuteStepOutput, ParsedStep } from '../../types.js';
import type {
  ExecutorContext,
  ExecutorOptions,
  StepExecutor,
} from '../types.js';

/**
 * Error thrown when conditional execution fails.
 */
export class ConditionalExecutionError extends Error {
  readonly stepId: string;

  constructor(message: string, stepId: string) {
    super(message);
    this.name = 'ConditionalExecutionError';
    this.stepId = stepId;
  }
}

/**
 * Conditional router step executor.
 *
 * Evaluates conditions using various operators (equals, contains, regex, etc.)
 * and routes to the appropriate branch (true/false).
 */
export const conditionalExecutor: StepExecutor<'ConditionalRouter'> = {
  type: 'ConditionalRouter',

  validate(step: ParsedStep) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step.config.type !== 'ConditionalRouter') {
      errors.push(
        `Invalid config type: expected 'ConditionalRouter', got '${step.config.type}'`,
      );
    }
    // Note: operator is guaranteed by the type system after parsing

    return { valid: errors.length === 0, errors, warnings };
  },

  execute(
    step: ParsedStep,
    context: ExecutorContext,
    _options?: ExecutorOptions,
  ): Promise<ExecuteStepOutput> {
    const config = step.config;

    if (config.type !== 'ConditionalRouter') {
      return Promise.reject(
        new ConditionalExecutionError(
          `Invalid config type for conditional step: ${config.type}`,
          step.id,
        ),
      );
    }

    const stepInputs: Record<string, unknown> = { ...step.inputs };
    for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
      for (const [key, value] of Object.entries(stepOutputs)) {
        if (!(key in stepInputs)) {
          stepInputs[`${stepId}.${key}`] = value;
        }
      }
    }

    const conditionalInput = createConditionalInput(
      stepInputs,
      config.config,
      0,
    );

    // Evaluate the condition
    const conditionResult = evaluateCondition(
      conditionalInput.inputText,
      conditionalInput.matchText,
      conditionalInput.operator,
      conditionalInput.caseSensitive,
    );

    const branch = conditionResult ? 'true' : 'false';
    const result = conditionResult
      ? conditionalInput.trueCaseMessage
      : conditionalInput.falseCaseMessage;

    return Promise.resolve({
      stepId: step.id,
      outputs: {
        [branch === 'true' ? 'true_result' : 'false_result']: result,
        branch,
      },
      branch,
      complete: true,
    });
  },
};

/**
 * Factory function for creating the conditional executor.
 */
function _createConditionalExecutor(): StepExecutor<'ConditionalRouter'> {
  return conditionalExecutor;
}
