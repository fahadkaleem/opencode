/**
 * Conditional Actor
 *
 * XState actor for evaluating conditional routing logic.
 * Handles branch evaluation based on comparison operators.
 */

import { fromPromise } from 'xstate';
import type { ConditionalOperator, ConditionalResult } from '../types.js';

/** Field names to check when extracting input text */
const INPUT_FIELD_NAMES = [
  'input_text',
  'inputText',
  'input',
  'text',
  'value',
  'message',
] as const;

/** Field names to check when extracting match text */
const MATCH_FIELD_NAMES = [
  'match_text',
  'matchText',
  'match',
  'pattern',
] as const;

/**
 * Input for the conditional actor.
 */
export type ConditionalInput = {
  /** The text/value to evaluate */
  inputText: string;
  /** The text/value to match against */
  matchText: string;
  /** The comparison operator */
  operator: ConditionalOperator;
  /** Whether comparison is case-sensitive */
  caseSensitive: boolean;
  /** Value to return if condition is true */
  trueCaseMessage: unknown;
  /** Value to return if condition is false */
  falseCaseMessage: unknown;
  /** Maximum iterations (for loop prevention) */
  maxIterations: number;
  /** Current iteration count */
  currentIteration?: number;
};

/**
 * Evaluates a condition using the specified operator.
 *
 * @param inputText - The text to evaluate
 * @param matchText - The text to match against
 * @param operator - The comparison operator
 * @param caseSensitive - Whether comparison is case-sensitive
 * @returns True if condition matches, false otherwise
 */
export function evaluateCondition(
  inputText: string,
  matchText: string,
  operator: ConditionalOperator,
  caseSensitive: boolean,
): boolean {
  let input = String(inputText);
  let match = String(matchText);

  // Apply case-insensitivity (except for regex)
  if (!caseSensitive && operator !== 'regex') {
    input = input.toLowerCase();
    match = match.toLowerCase();
  }

  switch (operator) {
    case 'equals':
      return input === match;

    case 'not equals':
      return input !== match;

    case 'contains':
      return input.includes(match);

    case 'not contains':
      return !input.includes(match);

    case 'starts with':
      return input.startsWith(match);

    case 'ends with':
      return input.endsWith(match);

    case 'regex': {
      try {
        const flags = caseSensitive ? '' : 'i';
        const regex = new RegExp(matchText, flags);
        return regex.test(inputText);
      } catch {
        // Invalid regex
        return false;
      }
    }

    case 'less than':
    case 'less than or equal':
    case 'greater than':
    case 'greater than or equal': {
      const inputNum = Number.parseFloat(input);
      const matchNum = Number.parseFloat(match);

      if (Number.isNaN(inputNum) || Number.isNaN(matchNum)) {
        return false;
      }

      switch (operator) {
        case 'less than':
          return inputNum < matchNum;
        case 'less than or equal':
          return inputNum <= matchNum;
        case 'greater than':
          return inputNum > matchNum;
        case 'greater than or equal':
          return inputNum >= matchNum;
        default:
          return false;
      }
    }

    default:
      return false;
  }
}

/**
 * XState actor for conditional evaluation.
 * Returns which branch was taken and the corresponding result.
 */
export const conditionalActor = fromPromise<
  ConditionalResult,
  ConditionalInput
>(({ input }) => {
  const currentIteration = input.currentIteration ?? 0;
  if (currentIteration >= input.maxIterations) {
    return Promise.resolve({
      branch: 'false' as const,
      result: input.falseCaseMessage,
    });
  }

  const result = evaluateCondition(
    input.inputText,
    input.matchText,
    input.operator,
    input.caseSensitive,
  );

  return Promise.resolve({
    branch: result ? 'true' : 'false',
    result: result ? input.trueCaseMessage : input.falseCaseMessage,
  });
});

/**
 * Extracts the input text from node inputs.
 * Handles various input formats.
 */
export function extractInputText(inputs: Record<string, unknown>): string {
  // Check for Message object first (higher priority)
  if (inputs['message'] != null && typeof inputs['message'] === 'object') {
    const msg = inputs['message'] as Record<string, unknown>;
    if (typeof msg['text'] === 'string') {
      return msg['text'];
    }
    if (typeof msg['content'] === 'string') {
      return msg['content'];
    }
  }

  for (const name of INPUT_FIELD_NAMES) {
    if (name in inputs) {
      const value = inputs[name];
      if (typeof value === 'string') {
        return value;
      }
      if (value !== null && value !== undefined) {
        return String(value);
      }
    }
  }

  return '';
}

/**
 * Extracts the match text from node inputs.
 */
export function extractMatchText(inputs: Record<string, unknown>): string {
  for (const name of MATCH_FIELD_NAMES) {
    if (name in inputs && inputs[name] !== null && inputs[name] !== undefined) {
      return String(inputs[name]);
    }
  }

  return '';
}

/**
 * Extracts the operator from node inputs.
 */
export function extractOperator(
  inputs: Record<string, unknown>,
): ConditionalOperator {
  const value = inputs['operator'];

  if (typeof value === 'string') {
    const validOperators: ConditionalOperator[] = [
      'equals',
      'not equals',
      'contains',
      'not contains',
      'starts with',
      'ends with',
      'regex',
      'less than',
      'less than or equal',
      'greater than',
      'greater than or equal',
    ];

    if (validOperators.includes(value as ConditionalOperator)) {
      return value as ConditionalOperator;
    }
  }

  return 'equals';
}

/**
 * Creates conditional input from parsed node data.
 */
export function createConditionalInput(
  inputs: Record<string, unknown>,
  config: {
    operator: ConditionalOperator;
    caseSensitive: boolean;
    maxIterations: number;
  },
  currentIteration: number = 0,
): ConditionalInput {
  return {
    inputText: extractInputText(inputs),
    matchText: extractMatchText(inputs),
    operator: config.operator,
    caseSensitive: config.caseSensitive,
    trueCaseMessage:
      inputs['true_case_message'] ?? inputs['trueCaseMessage'] ?? null,
    falseCaseMessage:
      inputs['false_case_message'] ?? inputs['falseCaseMessage'] ?? null,
    maxIterations: config.maxIterations,
    currentIteration,
  };
}
