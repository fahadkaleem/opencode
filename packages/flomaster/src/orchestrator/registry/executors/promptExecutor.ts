/**
 * Prompt Step Executor
 *
 * Executes Prompt steps by interpolating template variables.
 */

import { PromptExecutionError } from '../../errors.js';
import type { ExecuteStepOutput, ParsedStep } from '../../types.js';
import type { ExecutorContext, ExecutorOptions, StepExecutor } from '../types.js';
import { mergeStepInputs, replaceTemplateVariables } from './executorUtils.js';

// Re-export for backward compatibility
export { PromptExecutionError } from '../../errors.js';

/**
 * Prompt step executor.
 *
 * Handles template interpolation using {{variable}} syntax.
 * Combines config variables, step inputs, and context variables.
 */
export const promptExecutor: StepExecutor<'Prompt'> = {
  type: 'Prompt',

  validate(step: ParsedStep) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (step.config.type !== 'Prompt') {
      errors.push(`Invalid config type: expected 'Prompt', got '${step.config.type}'`);
    } else if (!step.config.config.template) {
      errors.push('Prompt template is required');
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  execute(
    step: ParsedStep,
    context: ExecutorContext,
    _options?: ExecutorOptions,
  ): Promise<ExecuteStepOutput> {
    const config = step.config;

    if (config.type !== 'Prompt') {
      return Promise.reject(
        new PromptExecutionError(`Invalid config type for prompt step: ${config.type}`, step.id),
      );
    }

    const stepInputs = mergeStepInputs(step, context);
    const allVars = { ...config.config.variables, ...stepInputs, ...context.variables };
    const template = replaceTemplateVariables(config.config.template, allVars);

    return Promise.resolve({
      stepId: step.id,
      outputs: { prompt: template, text: template },
      complete: true,
    });
  },
};

// TODO(future): Factory function for creating configurable prompt executors
// function _createPromptExecutor(config?: PromptExecutorConfig): StepExecutor<'Prompt'> {
//   return promptExecutor;
// }
