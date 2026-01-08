/**
 * Conditional Router Step Executor
 *
 * Executes ConditionalRouter steps by evaluating conditions and routing to branches.
 */

import { createConditionalInput, evaluateCondition } from '../../actors/conditionalActor.js';
import { ConditionalExecutionError } from '../../errors.js';
import type { ExecuteStepOutput, ParsedStep } from '../../types.js';
import type { ExecutorContext, ExecutorOptions, StepExecutor } from '../types.js';
import { mergeStepInputs } from './executorUtils.js';

// Re-export for backward compatibility
export { ConditionalExecutionError } from '../../errors.js';

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
      errors.push(`Invalid config type: expected 'ConditionalRouter', got '${step.config.type}'`);
    }

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
        new ConditionalExecutionError(`Invalid config type for conditional step: ${config.type}`, step.id),
      );
    }

    const stepInputs = mergeStepInputs(step, context);
    const conditionalInput = createConditionalInput(stepInputs, config.config, 0);

    const conditionResult = evaluateCondition(
      conditionalInput.inputText,
      conditionalInput.matchText,
      conditionalInput.operator,
      conditionalInput.caseSensitive,
    );

    const branch = conditionResult ? 'true' : 'false';
    const result = conditionResult ? conditionalInput.trueCaseMessage : conditionalInput.falseCaseMessage;

    return Promise.resolve({
      stepId: step.id,
      outputs: { [branch === 'true' ? 'true_result' : 'false_result']: result, branch },
      branch,
      complete: true,
    });
  },
};

// TODO(future): Factory function for creating configurable conditional executors
// function _createConditionalExecutor(config?: ConditionalExecutorConfig): StepExecutor<'ConditionalRouter'> {
//   return conditionalExecutor;
// }
