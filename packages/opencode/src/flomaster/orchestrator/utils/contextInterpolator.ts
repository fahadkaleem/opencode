/**
 * Context Interpolator
 *
 * Utilities for interpolating variables in templates and configurations.
 * Supports {{variable}} syntax with nested property access.
 * Also provides context appending functionality for the hybrid context model.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import type { PromptBuildConfig, StepContext } from '../types.js';

/**
 * Pattern for matching interpolation placeholders.
 * Matches: {{variable}}, {{ variable }}, {{object.property}}
 */
const INTERPOLATION_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g;

/**
 * Gets a nested value from an object using dot notation.
 *
 * @param obj - The object to get the value from
 * @param path - Dot-separated path (e.g., 'user.name')
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== 'object') {
      return undefined;
    }

    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    const propName = arrayMatch?.[1];
    const indexStr = arrayMatch?.[2];
    if (propName !== undefined && indexStr !== undefined) {
      const arr = (current as Record<string, unknown>)[propName];
      if (!Array.isArray(arr)) {
        return undefined;
      }
      current = arr[Number.parseInt(indexStr, 10)];
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Sets a nested value in an object using dot notation.
 *
 * @param obj - The object to set the value in
 * @param path - Dot-separated path
 * @param value - The value to set
 * @returns The modified object
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (part === undefined || part === '') {
      continue;
    }
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart !== undefined && lastPart !== '') {
    current[lastPart] = value;
  }
  return obj;
}

/**
 * Interpolates a string with values from a context object.
 *
 * @param template - The template string with {{placeholders}}
 * @param context - Object containing variable values
 * @param options - Interpolation options
 * @returns The interpolated string
 *
 * @example
 * interpolate('Hello, {{name}}!', { name: 'World' }) // 'Hello, World!'
 * interpolate('{{user.email}}', { user: { email: 'test@example.com' } }) // 'test@example.com'
 */
export function interpolate(
  template: string,
  context: Record<string, unknown>,
  options?: {
    /** What to use for undefined values */
    undefinedValue?: string;
    /** Whether to throw on undefined */
    throwOnUndefined?: boolean;
  },
): string {
  const { undefinedValue = '', throwOnUndefined = false } = options ?? {};

  return template.replace(INTERPOLATION_PATTERN, (_match, path: string) => {
    const value = getNestedValue(context, path.trim());

    if (value === undefined) {
      if (throwOnUndefined) {
        throw new Error(`Undefined variable: ${path.trim()}`);
      }
      return undefinedValue;
    }

    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value === null) {
      return 'null';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  });
}

/**
 * Finds all variable references in a template.
 *
 * @param template - The template string to scan
 * @returns Array of variable paths
 */
export function findVariables(template: string): string[] {
  const variables: string[] = [];

  const regex = new RegExp(INTERPOLATION_PATTERN.source, 'g');

  let match = regex.exec(template);
  while (match !== null) {
    const path = match[1]?.trim();
    if (path !== undefined && !variables.includes(path)) {
      variables.push(path);
    }
    match = regex.exec(template);
  }

  return variables;
}

/**
 * Checks if a string contains interpolation placeholders.
 */
export function hasInterpolation(str: string): boolean {
  return INTERPOLATION_PATTERN.test(str);
}

/**
 * Deep interpolates all strings in an object.
 *
 * @param value - The value to interpolate
 * @param context - Context for interpolation
 * @returns Interpolated value
 */
export function deepInterpolate(
  value: unknown,
  context: Record<string, unknown>,
): unknown {
  if (typeof value === 'string') {
    return interpolate(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepInterpolate(item, context));
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = deepInterpolate(val, context);
    }
    return result;
  }

  return value;
}

/**
 * Creates a context object from node outputs.
 *
 * @param outputs - Map of node outputs
 * @returns Flattened context object
 */
export function createContextFromOutputs(
  outputs: Record<string, Record<string, unknown>>,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  for (const [nodeId, nodeOutputs] of Object.entries(outputs)) {
    context[nodeId] = nodeOutputs;

    for (const [key, value] of Object.entries(nodeOutputs)) {
      context[`${nodeId}.${key}`] = value;
    }
  }

  return context;
}

/**
 * Merges multiple context objects.
 *
 * @param contexts - Context objects to merge (later ones override earlier)
 * @returns Merged context
 */
export function mergeContexts(
  ...contexts: Record<string, unknown>[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const context of contexts) {
    Object.assign(result, context);
  }

  return result;
}

/**
 * Validates that all required variables are present in context.
 *
 * @param template - Template to validate
 * @param context - Context to check against
 * @returns Array of missing variable names
 */
export function validateContext(
  template: string,
  context: Record<string, unknown>,
): string[] {
  const variables = findVariables(template);
  const missing: string[] = [];

  for (const variable of variables) {
    const value = getNestedValue(context, variable);
    if (value === undefined) {
      missing.push(variable);
    }
  }

  return missing;
}

/**
 * Options for resolving context sources.
 */
export type ResolveContextOptions = {
  /** Base directory for resolving relative file paths */
  readonly baseDir?: string;
};

/**
 * Resolves a context source to its string value.
 *
 * @param ctx - The context definition
 * @param sharedContext - Outputs from previous steps
 * @param options - Resolution options
 * @returns The resolved value, or null if not found
 *
 * @example
 * // Output type - resolve from step outputs
 * resolveContextSource(
 *   { name: 'spec', source: 'write-spec.document', type: 'output' },
 *   { 'write-spec': { document: 'Full spec content...' } }
 * ) // Returns: 'Full spec content...'
 *
 * // File type with contents mode - read file
 * resolveContextSource(
 *   { name: 'rules', source: 'rules.md', type: 'file', mode: 'contents' },
 *   {},
 *   { baseDir: '/project' }
 * ) // Returns: file contents
 *
 * // Static type - return literal
 * resolveContextSource(
 *   { name: 'note', source: 'Always run tests', type: 'static' },
 *   {}
 * ) // Returns: 'Always run tests'
 */
export async function resolveContextSource(
  ctx: StepContext,
  sharedContext: Record<string, Record<string, unknown>>,
  options?: ResolveContextOptions,
): Promise<string | null> {
  const { baseDir = process.cwd() } = options ?? {};

  switch (ctx.type) {
    case 'output': {
      // Resolve from shared context: "stepId.outputKey"
      const value = getNestedValue(sharedContext, ctx.source);
      if (value === undefined || value === null) {
        return null;
      }
      return typeof value === 'string' ? value : JSON.stringify(value);
    }

    case 'file': {
      const filePath = path.isAbsolute(ctx.source)
        ? ctx.source
        : path.resolve(baseDir, ctx.source);

      if (ctx.mode === 'contents') {
        try {
          return await fs.readFile(filePath, 'utf-8');
        } catch {
          return null;
        }
      } else {
        return ctx.source;
      }
    }

    case 'static': {
      return ctx.source;
    }

    default:
      return null;
  }
}

/**
 * Escapes XML special characters in content.
 */
function escapeXml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Options for building context blocks.
 */
export type BuildContextBlockOptions = ResolveContextOptions & {
  /** Whether to escape XML special characters in content */
  readonly escapeContent?: boolean;
};

/**
 * Builds an XML context block from context definitions.
 *
 * @param contexts - Array of context definitions
 * @param sharedContext - Outputs from previous steps
 * @param options - Build options
 * @returns XML context block string, or empty string if no contexts resolve
 *
 * @example
 * buildContextBlock(
 *   [
 *     { name: 'spec', source: 'write-spec.doc', type: 'output' },
 *     { name: 'note', source: 'Run tests first', type: 'static' },
 *   ],
 *   { 'write-spec': { doc: 'Spec content here' } }
 * )
 * // Returns:
 * // "<context>\n<spec>\nSpec content here\n</spec>\n<note>\nRun tests first\n</note>\n</context>"
 */
export async function buildContextBlock(
  contexts: readonly StepContext[],
  sharedContext: Record<string, Record<string, unknown>>,
  options?: BuildContextBlockOptions,
): Promise<string> {
  if (contexts.length === 0) {
    return '';
  }

  const { escapeContent = false, ...resolveOptions } = options ?? {};
  const blocks: string[] = [];

  for (const ctx of contexts) {
    const value = await resolveContextSource(
      ctx,
      sharedContext,
      resolveOptions,
    );
    if (value !== null) {
      const content = escapeContent ? escapeXml(value) : value;
      blocks.push(`<${ctx.name}>\n${content}\n</${ctx.name}>`);
    }
  }

  if (blocks.length === 0) {
    return '';
  }

  return `<context>\n${blocks.join('\n')}\n</context>`;
}

/**
 * Appends a context block to a prompt string.
 *
 * @param prompt - The base prompt (after interpolation)
 * @param contextBlock - The XML context block
 * @returns Combined prompt with context appended
 *
 * @example
 * appendContextToPrompt(
 *   'Implement the feature described below.',
 *   '<context>\n<spec>\nBuild auth system\n</spec>\n</context>'
 * )
 * // Returns:
 * // "Implement the feature described below.\n\n<context>\n<spec>\nBuild auth system\n</spec>\n</context>"
 */
export function appendContextToPrompt(
  prompt: string,
  contextBlock: string,
): string {
  if (contextBlock === '') {
    return prompt;
  }
  return `${prompt}\n\n${contextBlock}`;
}

/**
 * Options for building prompts.
 */
export type BuildPromptOptions = BuildContextBlockOptions & {
  /** What to use for undefined interpolation values */
  readonly undefinedValue?: string;
  /** Whether to throw on undefined interpolation variables */
  readonly throwOnUndefined?: boolean;
};

/**
 * Builds a complete prompt using the hybrid context model.
 *
 * 1. Interpolates {{variable}} placeholders in template
 * 2. Resolves and appends context blocks as XML
 *
 * @param config - Prompt configuration with template and context
 * @param sharedContext - Outputs from previous steps
 * @param options - Build options
 * @returns Complete prompt string
 *
 * @example
 * const prompt = await buildPrompt(
 *   {
 *     template: 'Implement: {{task.title}}\n\nFollow the spec and standards.',
 *     context: [
 *       { name: 'spec', source: 'planning.spec', type: 'output' },
 *       { name: 'standards', source: '.claude/rules/coding.md', type: 'file', mode: 'contents' },
 *     ],
 *   },
 *   {
 *     task: { title: 'User Authentication' },
 *     planning: { spec: 'Build OAuth2 login...' },
 *   },
 *   { baseDir: '/project' }
 * );
 * // Returns:
 * // "Implement: User Authentication
 * //
 * // Follow the spec and standards.
 * //
 * // <context>
 * // <spec>
 * // Build OAuth2 login...
 * // </spec>
 * // <standards>
 * // [file contents]
 * // </standards>
 * // </context>"
 */
export async function buildPrompt(
  config: PromptBuildConfig,
  sharedContext: Record<string, Record<string, unknown>>,
  options?: BuildPromptOptions,
): Promise<string> {
  const {
    undefinedValue = '',
    throwOnUndefined = false,
    ...contextOptions
  } = options ?? {};

  const flatContext = createContextFromOutputs(sharedContext);

  const interpolated = interpolate(config.template, flatContext, {
    undefinedValue,
    throwOnUndefined,
  });

  if (config.context === undefined || config.context.length === 0) {
    return interpolated;
  }

  const contextBlock = await buildContextBlock(
    config.context,
    sharedContext,
    contextOptions,
  );

  return appendContextToPrompt(interpolated, contextBlock);
}
