/**
 * Executor Utilities
 *
 * Shared utility functions for step executors.
 * Reduces code duplication across executor implementations.
 */

import type { ParsedStep } from '../../types.js';
import type { ExecutorContext, ExecutorValidationResult } from '../types.js';

/**
 * Merge step inputs with outputs from previous steps.
 *
 * Each output is namespaced as `stepId.outputKey` to avoid conflicts.
 * Step's own inputs take precedence over inherited outputs.
 *
 * @param step - The step being executed
 * @param context - Executor context with previous outputs
 * @returns Merged inputs record
 */
export function mergeStepInputs(
  step: ParsedStep,
  context: ExecutorContext,
): Record<string, unknown> {
  const inputs: Record<string, unknown> = { ...step.inputs };

  for (const [stepId, stepOutputs] of Object.entries(context.outputs)) {
    for (const [key, value] of Object.entries(stepOutputs)) {
      const qualifiedKey = `${stepId}.${key}`;
      if (!(qualifiedKey in inputs)) {
        inputs[qualifiedKey] = value;
      }
    }
  }

  return inputs;
}

/**
 * Escape special regex characters in a string.
 *
 * Used when constructing regex patterns from user input
 * to prevent regex injection.
 *
 * @param str - String to escape
 * @returns Escaped string safe for regex
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create an empty validation result.
 *
 * @returns Object with empty errors and warnings arrays
 */
export function createValidationResult(): { errors: string[]; warnings: string[] } {
  return { errors: [], warnings: [] };
}

/**
 * Convert validation arrays to ExecutorValidationResult.
 *
 * @param errors - Array of error messages
 * @param warnings - Array of warning messages
 * @returns ExecutorValidationResult with valid flag
 */
export function toValidationResult(
  errors: string[],
  warnings: string[],
): ExecutorValidationResult {
  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate that step config matches expected type.
 *
 * @param step - Step to validate
 * @param expectedType - Expected config type
 * @returns Error message if mismatch, null if valid
 */
export function validateStepType(
  step: ParsedStep,
  expectedType: string,
): string | null {
  if (step.config.type !== expectedType) {
    return `Invalid config type: expected '${expectedType}', got '${step.config.type}'`;
  }
  return null;
}

/**
 * Replace template variables in a string.
 *
 * Replaces {{key}} patterns with values from the provided record.
 * Uses regex escaping to safely match keys containing special characters.
 *
 * @param template - String containing {{key}} placeholders
 * @param values - Record of key-value pairs for replacement
 * @returns String with placeholders replaced
 */
export function replaceTemplateVariables(
  template: string,
  values: Record<string, unknown>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, String(value ?? ''));
  }

  return result;
}
