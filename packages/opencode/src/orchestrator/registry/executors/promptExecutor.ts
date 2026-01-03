/**
 * Prompt Step Executor
 *
 * Executes Prompt steps by interpolating template variables.
 */

import type { ExecuteStepOutput, ParsedStep } from '../../types.js';
import type {
  ExecutorContext,
  ExecutorOptions,
  StepExecutor,
} from '../types.js';

/**
 * Error thrown when prompt execution fails.
 */
export class PromptExecutionError extends Error {
  readonly stepId: string;

  constructor(message: string, stepId: string) {
    super(message);
    this.name = 'PromptExecutionError';
    this.stepId = stepId;
  }
}

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
      errors.push(
        `Invalid config type: expected 'Prompt', got '${step.config.type}'`,
      );
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
        new PromptExecutionError(
          `Invalid config type for prompt step: ${config.type}`,
          step.id,
        ),
      );
    }

    const stepInputs = { ...step.inputs };
    for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
      for (const [key, value] of Object.entries(stepOutputs)) {
        if (!(key in stepInputs)) {
          stepInputs[`${stepId}.${key}`] = value;
        }
      }
    }

    let template = config.config.template;

    const allVars: Record<string, unknown> = {
      ...config.config.variables,
      ...stepInputs,
      ...context.variables,
    };

    // Simple template interpolation ({{variable}})
    for (const [key, value] of Object.entries(allVars)) {
      const pattern = new RegExp(
        `\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`,
        'g',
      );
      template = template.replace(pattern, String(value ?? ''));
    }

    return Promise.resolve({
      stepId: step.id,
      outputs: {
        prompt: template,
        text: template,
      },
      complete: true,
    });
  },
};

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Factory function for creating the prompt executor.
 */
function _createPromptExecutor(): StepExecutor<'Prompt'> {
  return promptExecutor;
}
