/**
 * Validation Runner Tests
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { ValidationCheck } from './validationRunner.js';
import {
  createBuildCheck,
  createCommandCheck,
  createFileExistsCheck,
  createLintCheck,
  createRegexCheck,
  createTestRunnerCheck,
  runValidation,
  runValidationCheck,
} from './validationRunner.js';

describe('validation-runner', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'validation-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('runValidationCheck', () => {
    describe('file_exists', () => {
      it('should pass when file exists', async () => {
        const filePath = path.join(tempDir, 'test.txt');
        await fs.writeFile(filePath, 'content');

        const check = createFileExistsCheck(filePath);
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(true);
      });

      it('should fail when file does not exist', async () => {
        const filePath = path.join(tempDir, 'nonexistent.txt');

        const check = createFileExistsCheck(filePath);
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toContain('File not found');
      });
    });

    describe('command_succeeds', () => {
      it('should pass when command succeeds', async () => {
        const check = createCommandCheck('echo "hello"');
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(true);
        expect(result.details?.stdout).toBe('hello');
      });

      it('should fail when command fails', async () => {
        const check = createCommandCheck('exit 1', { exitCode: 0 });
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
      });

      it('should pass when exit code matches expected', async () => {
        const check: ValidationCheck = {
          type: 'command_succeeds',
          name: 'Expected failure',
          config: { command: 'exit 1', exitCode: 1 },
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(true);
      });
    });

    describe('regex_match', () => {
      it('should pass when pattern matches', async () => {
        const check = createRegexCheck('hello world', 'world');
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(true);
      });

      it('should fail when pattern does not match', async () => {
        const check = createRegexCheck('hello world', 'foo');
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toBe('Pattern did not match');
      });

      it('should support regex flags', async () => {
        const check = createRegexCheck('HELLO', 'hello', 'i');
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(true);
      });

      it('should fail with invalid regex', async () => {
        const check = createRegexCheck('hello', '[invalid(');
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toContain('Invalid regex');
      });
    });

    describe('json_schema', () => {
      it('should pass when data matches schema type', async () => {
        const check: ValidationCheck = {
          type: 'json_schema',
          name: 'Schema check',
          config: {
            data: { foo: 'bar' },
            schema: { type: 'object' },
          },
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(true);
      });

      it('should fail when data does not match schema type', async () => {
        const check: ValidationCheck = {
          type: 'json_schema',
          name: 'Schema check',
          config: {
            data: 'string',
            schema: { type: 'object' },
          },
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toBe('Expected object type');
      });

      it('should fail when required property is missing', async () => {
        const check: ValidationCheck = {
          type: 'json_schema',
          name: 'Schema check',
          config: {
            data: { foo: 'bar' },
            schema: { type: 'object', required: ['baz'] },
          },
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toContain('Missing required property');
      });
    });

    describe('custom', () => {
      it('should pass when custom validator returns true', async () => {
        const check: ValidationCheck = {
          type: 'custom',
          name: 'Custom check',
          config: {
            validator: () => true,
          },
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(true);
      });

      it('should fail when custom validator returns false', async () => {
        const check: ValidationCheck = {
          type: 'custom',
          name: 'Custom check',
          config: {
            validator: () => false,
          },
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
      });

      it('should fail when no validator is provided', async () => {
        const check: ValidationCheck = {
          type: 'custom',
          name: 'Custom check',
          config: {},
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toBe('No validator function provided');
      });

      it('should fail when validator throws', async () => {
        const check: ValidationCheck = {
          type: 'custom',
          name: 'Custom check',
          config: {
            validator: () => {
              throw new Error('Validator error');
            },
          },
          required: true,
        };
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toBe('Validator error');
      });
    });

    describe('unknown type', () => {
      it('should fail for unknown check type', async () => {
        const check = {
          type: 'unknown',
          name: 'Unknown check',
          config: {},
          required: true,
        } as unknown as ValidationCheck;
        const result = await runValidationCheck(check);

        expect(result.passed).toBe(false);
        expect(result.error).toContain('Unknown check type');
      });
    });
  });

  describe('runValidation', () => {
    it('should return passed when all required checks pass', async () => {
      const checks = [
        createRegexCheck('hello', 'hello'),
        createRegexCheck('world', 'world'),
      ];
      const result = await runValidation(checks);

      expect(result.passed).toBe(true);
      expect(result.summary).toBe('2/2 checks passed');
    });

    it('should return failed when any required check fails', async () => {
      const checks = [
        createRegexCheck('hello', 'hello'),
        createRegexCheck('world', 'foo'),
      ];
      const result = await runValidation(checks);

      expect(result.passed).toBe(false);
      expect(result.summary).toBe('1/2 checks passed');
    });

    it('should pass when optional check fails', async () => {
      const checks = [
        createRegexCheck('hello', 'hello'),
        createRegexCheck('world', 'foo', undefined, false), // not required
      ];
      const result = await runValidation(checks);

      expect(result.passed).toBe(true);
      expect(result.summary).toBe('1/2 checks passed');
    });
  });

  describe('check creators', () => {
    it('should create file exists check', () => {
      const check = createFileExistsCheck('/path/to/file');

      expect(check.type).toBe('file_exists');
      expect(check.config.path).toBe('/path/to/file');
      expect(check.required).toBe(true);
    });

    it('should create command check', () => {
      const check = createCommandCheck('npm test', { cwd: '/project' });

      expect(check.type).toBe('command_succeeds');
      expect(check.config.command).toBe('npm test');
      expect(check.config.cwd).toBe('/project');
    });

    it('should create regex check', () => {
      const check = createRegexCheck('input', 'pattern', 'gi');

      expect(check.type).toBe('regex_match');
      expect(check.config.input).toBe('input');
      expect(check.config.pattern).toBe('pattern');
      expect(check.config.flags).toBe('gi');
    });

    it('should create test runner check', () => {
      const check = createTestRunnerCheck('npm test', '/project');

      expect(check.type).toBe('command_succeeds');
      expect(check.config.command).toBe('npm test');
      expect(check.config.timeout).toBe(120000);
    });

    it('should create build check', () => {
      const check = createBuildCheck('npm run build');

      expect(check.type).toBe('command_succeeds');
      expect(check.config.command).toBe('npm run build');
      expect(check.config.timeout).toBe(60000);
    });

    it('should create lint check', () => {
      const check = createLintCheck('npm run lint');

      expect(check.type).toBe('command_succeeds');
      expect(check.config.command).toBe('npm run lint');
      expect(check.config.timeout).toBe(30000);
    });
  });
});
