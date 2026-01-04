/**
 * Validation Runner
 *
 * Utilities for running validation checks on workflow outputs.
 * Supports both deterministic and AI-based validation.
 */

import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Validation check types.
 */
export type ValidationCheckType =
  | 'file_exists'
  | 'command_succeeds'
  | 'regex_match'
  | 'json_schema'
  | 'custom';

/**
 * Validation check definition.
 */
export type ValidationCheck = {
  /** Check type */
  type: ValidationCheckType;
  /** Human-readable name */
  name: string;
  /** Check configuration */
  config: Record<string, unknown>;
  /** Whether this check is required */
  required: boolean;
};

/**
 * Validation check result.
 */
export type ValidationCheckResult = {
  /** Check name */
  name: string;
  /** Whether check passed */
  passed: boolean;
  /** Error message if failed */
  error?: string;
  /** Additional details */
  details?: Record<string, unknown>;
};

/**
 * Overall validation result.
 */
export type ValidationRunResult = {
  /** Whether all required checks passed */
  passed: boolean;
  /** Individual check results */
  results: ValidationCheckResult[];
  /** Summary message */
  summary: string;
};

/**
 * Runs a file existence check.
 */
async function runFileExistsCheck(
  config: Record<string, unknown>,
): Promise<ValidationCheckResult> {
  const filePath = config['path'] as string;
  const name = `File exists: ${filePath}`;

  try {
    await fs.access(filePath);
    return { name, passed: true };
  } catch {
    return { name, passed: false, error: `File not found: ${filePath}` };
  }
}

/**
 * Runs a command success check.
 */
async function runCommandCheck(
  config: Record<string, unknown>,
): Promise<ValidationCheckResult> {
  const command = config['command'] as string;
  const cwd = config['cwd'] as string | undefined;
  const expectedExitCode = (config['exitCode'] as number | undefined) ?? 0;
  const name = `Command succeeds: ${command}`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: (config['timeout'] as number | undefined) ?? 30000,
    });

    return {
      name,
      passed: true,
      details: { stdout: stdout.trim(), stderr: stderr.trim() },
    };
  } catch (error) {
    const execError = error as { code?: number; stderr?: string };
    return {
      name,
      passed: execError.code === expectedExitCode,
      error: execError.stderr ?? String(error),
      details: { exitCode: execError.code },
    };
  }
}

/**
 * Runs a regex match check.
 */
function runRegexCheck(config: Record<string, unknown>): ValidationCheckResult {
  const input = config['input'] as string;
  const pattern = config['pattern'] as string;
  const flags = (config['flags'] as string | undefined) ?? '';
  const name = `Regex match: ${pattern}`;

  try {
    const regex = new RegExp(pattern, flags);
    const matches = regex.test(input);
    const error = matches ? undefined : `Pattern did not match`;

    return {
      name,
      passed: matches,
      ...(error !== undefined && { error }),
      details: { input: input.slice(0, 100), pattern },
    };
  } catch (error) {
    return {
      name,
      passed: false,
      error: `Invalid regex: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Runs a JSON schema validation check.
 */
function runJsonSchemaCheck(
  config: Record<string, unknown>,
): ValidationCheckResult {
  const data = config['data'];
  const schema = config['schema'] as Record<string, unknown>;
  const name = `JSON schema validation`;

  // Basic schema validation (for full validation, use Zod or Ajv)
  try {
    if (schema['type'] === 'object' && typeof data !== 'object') {
      return { name, passed: false, error: 'Expected object type' };
    }
    if (schema['type'] === 'array' && !Array.isArray(data)) {
      return { name, passed: false, error: 'Expected array type' };
    }
    if (schema['type'] === 'string' && typeof data !== 'string') {
      return { name, passed: false, error: 'Expected string type' };
    }
    if (schema['type'] === 'number' && typeof data !== 'number') {
      return { name, passed: false, error: 'Expected number type' };
    }

    if (
      schema['required'] !== undefined &&
      Array.isArray(schema['required']) &&
      typeof data === 'object' &&
      data !== null
    ) {
      const obj = data as Record<string, unknown>;
      for (const prop of schema['required'] as string[]) {
        if (!(prop in obj)) {
          return {
            name,
            passed: false,
            error: `Missing required property: ${prop}`,
          };
        }
      }
    }

    return { name, passed: true };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Runs a custom validation check.
 */
async function runCustomCheck(
  config: Record<string, unknown>,
): Promise<ValidationCheckResult> {
  const name = (config['name'] as string | undefined) ?? 'Custom validation';
  const validator = config['validator'] as
    | ((config: Record<string, unknown>) => Promise<boolean>)
    | undefined;

  if (validator === undefined) {
    return { name, passed: false, error: 'No validator function provided' };
  }

  try {
    const result = await validator(config);
    return { name, passed: result };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Runs a single validation check.
 */
export async function runValidationCheck(
  check: ValidationCheck,
): Promise<ValidationCheckResult> {
  switch (check.type) {
    case 'file_exists':
      return runFileExistsCheck(check.config);
    case 'command_succeeds':
      return runCommandCheck(check.config);
    case 'regex_match':
      return runRegexCheck(check.config);
    case 'json_schema':
      return runJsonSchemaCheck(check.config);
    case 'custom':
      return runCustomCheck(check.config);
    default:
      return {
        name: check.name,
        passed: false,
        error: `Unknown check type: ${check.type}`,
      };
  }
}

/**
 * Runs all validation checks.
 */
export async function runValidation(
  checks: ValidationCheck[],
): Promise<ValidationRunResult> {
  const results: ValidationCheckResult[] = [];
  let allRequiredPassed = true;

  for (const check of checks) {
    const result = await runValidationCheck(check);
    results.push(result);

    if (check.required && !result.passed) {
      allRequiredPassed = false;
    }
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return {
    passed: allRequiredPassed,
    results,
    summary: `${passedCount}/${totalCount} checks passed`,
  };
}

/**
 * Creates a file exists check.
 */
export function createFileExistsCheck(
  filePath: string,
  required: boolean = true,
): ValidationCheck {
  return {
    type: 'file_exists',
    name: `File exists: ${filePath}`,
    config: { path: filePath },
    required,
  };
}

/**
 * Creates a command success check.
 */
export function createCommandCheck(
  command: string,
  options?: { cwd?: string; timeout?: number; exitCode?: number },
  required: boolean = true,
): ValidationCheck {
  return {
    type: 'command_succeeds',
    name: `Command: ${command}`,
    config: { command, ...options },
    required,
  };
}

/**
 * Creates a regex match check.
 */
export function createRegexCheck(
  input: string,
  pattern: string,
  flags?: string,
  required: boolean = true,
): ValidationCheck {
  return {
    type: 'regex_match',
    name: `Regex: ${pattern}`,
    config: { input, pattern, flags },
    required,
  };
}

/**
 * Creates a test runner check (npm test, pytest, etc.).
 */
export function createTestRunnerCheck(
  testCommand: string = 'npm test',
  cwd?: string,
): ValidationCheck {
  const commandCwd = cwd;
  return createCommandCheck(testCommand, {
    ...(commandCwd !== undefined && { cwd: commandCwd }),
    timeout: 120000,
  });
}

/**
 * Creates a build check.
 */
export function createBuildCheck(
  buildCommand: string = 'npm run build',
  cwd?: string,
): ValidationCheck {
  const commandCwd = cwd;
  return createCommandCheck(buildCommand, {
    ...(commandCwd !== undefined && { cwd: commandCwd }),
    timeout: 60000,
  });
}

/**
 * Creates a lint check.
 */
export function createLintCheck(
  lintCommand: string = 'npm run lint',
  cwd?: string,
): ValidationCheck {
  const commandCwd = cwd;
  return createCommandCheck(lintCommand, {
    ...(commandCwd !== undefined && { cwd: commandCwd }),
    timeout: 30000,
  });
}
