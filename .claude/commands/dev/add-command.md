---
description:
  Scaffold new oclif CLI commands with tests following established patterns
model: sonnet
---

# CLI Command Scaffolding

You are tasked with creating a new oclif command for the Atlas CLI, including
comprehensive tests, following established patterns and best practices.

## Input Methods

This command accepts command specifications in two ways:

**1. As inline parameter:**

```
/dev/add-command Create a command to list OpsGenie alerts with filtering by status
```

**2. As file reference:**

```
/dev/add-command path/to/command-spec.md
```

**3. No parameters (interactive):**

```
/dev/add-command
```

## Command Structure Overview

Atlas CLI uses strict separation of concerns:

```
packages/atlas/src/
├── commands/             # Thin CLI wrappers (flags, args, output)
│   └── <domain>/         # Grouped by domain (observability, data, zodiac)
│       └── <service>/
│           └── <action>.ts
├── lib/                  # Business logic (API calls, data processing)
│   └── <domain>/         # Mirrors command structure
│       └── <service>/
│           └── <action>.ts
├── validation/           # Shared Zod schemas
│   └── schemas.ts
└── base-command.ts       # Base class with lazy-loaded clients

packages/plugin-routing/src/
├── commands/routing/     # Routing plugin commands
├── lib/                  # Routing business logic
└── base-routing-command.ts

test/                     # Tests mirror src/ exactly
├── commands/             # Command tests with mocks
└── lib/                  # Business logic unit tests
```

## Initial Context Gathering

When this command is invoked:

**If specification provided (file or parameter):**

<procedure>
1. Read specification file completely if file path provided
2. Parse requirements from specification
3. Create comprehensive todo list using TodoWrite
4. Begin research process immediately
</procedure>

**If no parameters provided:**

<message>
I'll help you create a new oclif command with comprehensive tests following Atlas CLI patterns.

Please provide either:

**Option 1 - Inline specification:** Describe the command you want to create,
including:

- Command name and domain (e.g., `atlas opsgenie alerts note`)
- Purpose: What does this command do?
- Required inputs (flags/args)
- Optional inputs
- Which API client it uses (opsgenieClient, mitClient, cpClient, etc.)
- Expected output format

**Option 2 - File specification:** Path to a file containing the command
specification

**Example inline:**

```
Create command to add notes to OpsGenie alerts by alert ID.
Requires: alert ID (arg), note text (arg)
Optional: source, user flags
Uses: opsgenieClient
Output: Success confirmation
```

**Example file:**

```
Path: specs/opsgenie-note-command.md
```

</message>

Wait for user input before proceeding.

## Step 1: Create Planning Todo List

<procedure>
1. Use TodoWrite to create comprehensive implementation todos:
</procedure>

<todo_structure> Todos should include:

- [ ] Research similar commands (pending)
- [ ] Analyze patterns (pending)
- [ ] Check validation schemas (pending)
- [ ] Verify client access (pending)
- [ ] Create/update validation schemas (pending)
- [ ] Create lib file with business logic (pending)
- [ ] Create command file (pending)
- [ ] Create lib unit tests (pending)
- [ ] Create command integration tests (pending)
- [ ] Build project (pending)
- [ ] Run linting (pending)
- [ ] Run formatting (pending)
- [ ] Test command execution (pending)
- [ ] Verify all tests pass (pending) </todo_structure>

## Step 2: Research Similar Commands

**IMPORTANT:** Research actual codebase patterns before implementing.

<procedure>
1. Mark research todo as in_progress

2. Spawn parallel research tasks to find similar commands: </procedure>

<task_examples> Task 1 - Find similar commands: Search for commands in the same
domain or with similar functionality. Focus on:
packages/atlas/src/commands/<relevant-domain>/ Return: File paths of 2-3 similar
commands with brief descriptions of their patterns.

Task 2 - Analyze lib patterns: Find existing lib implementations for similar
operations. Focus on: packages/atlas/src/lib/<relevant-domain>/ Return: Patterns
used (validation approach, error handling, 204 handling, formatting).

Task 3 - Check validation schemas: Find existing Zod schemas that can be reused.
Focus on: packages/atlas/src/validation/schemas.ts,
packages/shared/src/validation/ Return: Relevant schemas and their usage
patterns.

Task 4 - Verify client access: Check BaseCommand to understand available
clients. Focus on: packages/atlas/src/base-command.ts or
packages/plugin-routing/src/base-routing-command.ts Return: Client getters, lazy
initialization patterns, configuration requirements.

Task 5 - Find test patterns: Locate similar command tests to understand testing
approach. Focus on: packages/atlas/test/commands/<relevant-domain>/ Return: Test
structure, mocking patterns, coverage approach. </task_examples>

<procedure>
3. Wait for ALL research tasks to complete

4. Read the most relevant similar command AND test files FULLY into context

5. Mark research todos complete, mark next implementation todo as in_progress
   </procedure>

## Step 3: Present Understanding

After research completes:

<output_format> Based on my research, I found:

**Similar Commands:**

- [command-path] - [brief description and key patterns used]
- [test-path] - [test coverage and mocking approach]

**Patterns to Follow:**

- [Pattern 1 with file:line reference]
- [Pattern 2 with specific example from code]

**Testing Patterns:**

- [Test structure used]
- [Mocking approach for this client type]
- [Coverage requirements: 80% lines, 80% functions, 70% branches]

**Validation Schemas Available:**

- [Schema name from validation/schemas.ts or note if new ones needed]

**Client Access:**

- Use `this.[clientName]` from BaseCommand (lazy-loaded)
- [Any specific configuration requirements from .env]

**Implementation Plan:**

1. Create validation schemas (if needed)
2. Create lib file: `packages/[package]/src/lib/[path]/[name].ts`
3. Create command file: `packages/[package]/src/commands/[path]/[name].ts`
4. Create lib unit tests: `packages/[package]/test/lib/[path]/[name].test.ts`
5. Create command tests:
   `packages/[package]/test/commands/[path]/[name].test.ts`
6. Build, lint, format, test

**Expected Test Coverage:**

- Command tests: Success cases, validation, error handling, both output formats
- Lib tests: Business logic, edge cases, API error handling

Does this approach align with your intent? </output_format>

Wait for user confirmation before proceeding.

## Step 4: Implementation Phase

### 4.1 Create Validation Schemas (if needed)

<procedure>
1. Mark validation todo as in_progress

2. Check existing schemas before creating new ones:
   - `packages/atlas/src/validation/schemas.ts` (atlas-specific)
   - `packages/shared/src/validation/` (cross-package)

3. Add to appropriate location if needed

4. Mark validation todo complete </procedure>

<example>
// In packages/atlas/src/validation/schemas.ts
import { z } from 'zod';

export const AlertIdSchema = z.string().min(1, 'Alert ID is required');

export const TimeRangeSchema = z .string() .regex(/^\d+[hdwmy]$/, 'Time range
must be in format: 7d, 30d, 1y, etc.'); </example>

### 4.2 Create Lib File

<procedure>
1. Mark lib todo as in_progress

2. Create `packages/[package]/src/lib/[domain]/[service]/[action].ts`

3. Follow template below

4. Mark lib todo complete, mark lib test todo as in_progress </procedure>

**Lib File Template:**

```typescript
import type { [ClientName]Client } from '../../../lib/clients/factory.js';
// Or for auto-generated: import type { createApiClient } from '../../../clients/[service]/zod-schemas.js';

import { [ValidationSchema] } from '@atlas/shared/validation';
// Or: import { [ValidationSchema] } from '../../../validation/schemas.js';

import { is204SuccessError } from '@atlas/shared/utils';
// Or: import { is204SuccessError } from '../../../utils/errors.js';

// Extract actual API return type
type [ClientName]Client = ReturnType<typeof createApiClient>; // If using zod-schemas client
type ApiResponse = Awaited<ReturnType<[ClientName]Client['methodName']>>;

export interface OperationOptions {
  requiredField: string;
  optionalField?: boolean;
}

export interface OperationResult {
  success: boolean;
  data?: ApiResponse;
}

/**
 * [Clear description of what this function does]
 *
 * @param client - [Client name] API client
 * @param options - Operation options
 * @returns Operation result
 *
 * @throws {import('zod').ZodError} If validation fails
 * @throws {Error} If API call fails
 *
 * @example
 * const result = await operationName(client, {
 *   requiredField: 'value',
 *   optionalField: true
 * });
 */
export async function operationName(
  client: [ClientName]Client,
  options: OperationOptions,
): Promise<OperationResult> {
  const validatedField = [ValidationSchema].parse(options.requiredField);

  try {
    const response = await client.methodName(validatedField, {
      params: { /* path params */ },
      queries: { /* query params */ },
    });

    return { success: true, data: response };
  } catch (error) {
    if (is204SuccessError(error)) {
      return { success: true };
    }
    throw error;
  }
}

/**
 * Format result for text output
 *
 * @param result - Operation result
 * @returns Array of formatted text lines
 */
export function formatOperationText(result: OperationResult): string[] {
  const lines: string[] = [];

  lines.push('');
  lines.push('=== Operation Result ===');
  lines.push('');
  lines.push(`Status: ${result.success ? 'Success' : 'Failed'}`);

  if (result.data) {
    lines.push(`Field: ${result.data.field}`);
  }

  lines.push('');

  return lines;
}
```

### 4.3 Create Lib Unit Tests

<procedure>
1. Create `packages/[package]/test/lib/[domain]/[service]/[action].test.ts`

2. Test business logic in isolation with mocked clients

3. Mark lib test todo complete, mark command todo as in_progress </procedure>

**Lib Test Template:**

```typescript
import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import sinon from 'sinon';
import nock from 'nock';

import { operationName } from '../../../../src/lib/[domain]/[service]/[action].js';
import { createApiClient } from '../../../../src/clients/[service]/zod-schemas.js';

describe('lib', () => {
  describe('[domain]', () => {
    describe('[service]', () => {
      describe('[action]', () => {
        const mockClient = createApiClient('http://test-api.com');

        afterEach(() => {
          sinon.restore();
          nock.cleanAll();
        });

        describe('operationName', () => {
          it('should successfully perform operation', async () => {
            nock('http://test-api.com')
              .post('/endpoint')
              .reply(200, { success: true });

            const result = await operationName(mockClient, {
              requiredField: 'test-value',
            });

            expect(result).to.have.property('success', true);
          });

          it('should validate required fields', async () => {
            await expect(
              operationName(mockClient, {
                requiredField: '',
              }),
            ).to.be.rejectedWith(/validation/i);
          });

          it('should handle 204 responses', async () => {
            nock('http://test-api.com').post('/endpoint').reply(204);

            const result = await operationName(mockClient, {
              requiredField: 'test-value',
            });

            expect(result).to.have.property('success', true);
          });

          it('should handle API errors', async () => {
            nock('http://test-api.com')
              .post('/endpoint')
              .reply(500, { message: 'Server error' });

            await expect(
              operationName(mockClient, {
                requiredField: 'test-value',
              }),
            ).to.be.rejected;
          });

          it('should handle network errors', async () => {
            nock('http://test-api.com')
              .post('/endpoint')
              .replyWithError('Network timeout');

            await expect(
              operationName(mockClient, {
                requiredField: 'test-value',
              }),
            ).to.be.rejected;
          });
        });
      });
    });
  });
});
```

### 4.4 Create Command File

<procedure>
1. Create `packages/[package]/src/commands/[domain]/[service]/[action].ts`

2. Follow template below

3. Mark command todo complete, mark command test todo as in_progress
   </procedure>

**Command File Template:**

```typescript
import { Args, Flags } from '@oclif/core';
import { outdent } from 'outdent';
import { z } from 'zod';

import { BaseCommand } from '../../../base-command.js'; // Adjust path depth
// Or for routing plugin: import { BaseRoutingCommand } from '../../../base-routing-command.js';

import {
  operationName,
  formatOperationText,
} from '../../../lib/[domain]/[service]/[action].js';

import { formatJson } from '@atlas/shared/utils';
// Or: import { formatJson } from '../../../utils/json-output.js';

export default class DomainServiceAction extends BaseCommand<typeof DomainServiceAction> {
  static override description = outdent`
    Brief description of what the command does.

    Detailed explanation of the command's purpose, use cases, and behavior.
    Can be multiple paragraphs explaining when and why to use this command.

    IMPORTANT NOTES:
    - Use bullet points for key information
    - Explain ID types, formats, and constraints
    - Note any destructive operations
    - Mention required environment variables or configuration
  `;

  static override examples = [
    {
      command: '<%= config.bin %> <%= command.id %> value1 --flag value2',
      description: 'Basic usage example',
    },
    {
      command: '<%= config.bin %> <%= command.id %> --flag value --format json',
      description: 'Output as JSON for programmatic use',
    },
    {
      command: outdent`
        <%= config.bin %> <%= command.id %> arg "$(cat <<'EOF'
        Multi-line
        input content
        EOF
        )"
      `,
      description: 'Multi-line input using heredoc syntax',
    },
  ];

  static override args = {
    requiredArg: Args.string({
      description: 'Description of required argument',
      required: true,
    }),
  };

  static override flags = {
    // === REQUIRED FLAGS (if any) ===
    requiredFlag: Flags.string({
      char: 'r',
      description: 'Description of required flag with details',
      required: true,
      summary: 'Short summary for help',
    }),

    // === OPTIONAL FLAGS ===
    optionalFlag: Flags.string({
      char: 'o',
      default: 'default-value',
      description: 'Description of optional flag',
      summary: 'Short summary',
    }),
  };

  public async run(): Promise<void> {
    try {
      const result = await operationName(this.[clientName], {
        requiredField: this.args.requiredArg,
        optionalField: this.flags.optionalFlag,
      });

      if (this.flags.format === 'json') {
        this.log(formatJson(result));
      } else {
        const lines = formatOperationText(result);
        for (const line of lines) {
          this.log(line);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        this.error(`Validation error: ${errorMessages}`);
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.error(`Failed to [operation]: ${errorMessage}`);
    }
  }
}
```

### 4.5 Create Command Integration Tests

<procedure>
1. Create `packages/[package]/test/commands/[domain]/[service]/[action].test.ts`

2. Test full command execution with mocked HTTP/external dependencies

3. Use @oclif/test runCommand API

4. Cover: success, validation, errors, both output formats, edge cases

5. Mark command test todo complete </procedure>

**Command Test Template:**

```typescript
import { expect } from 'chai';
import { runCommand } from '@oclif/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import nock from 'nock';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../../../');

describe('commands', () => {
  describe('[domain]', () => {
    describe('[service]', () => {
      describe('[action]', () => {
        const mockResponse = {
          success: true,
          result: 'Operation successful',
        };

        afterEach(() => {
          nock.cleanAll();
        });

        context('with required arguments', () => {
          it('should require [arg] argument', async () => {
            const { error } = await runCommand(
              '[domain]:[service]:[action]',
              root,
            );

            expect(error).to.exist;
            expect(error?.message).to.match(/Missing \d required arg/i);
          });

          it('should execute successfully with valid arguments', async () => {
            nock('https://api.example.com')
              .post('/endpoint')
              .reply(200, mockResponse);

            const { stdout } = await runCommand(
              '[domain]:[service]:[action] value1 --format json',
              root,
            );
            const output = JSON.parse(stdout);

            expect(output).to.have.property('success', true);
          });
        });

        context('with flags', () => {
          it('should use default flag values', async () => {
            nock('https://api.example.com')
              .post('/endpoint', (body) => {
                return body.source === 'atlas-cli';
              })
              .reply(200, mockResponse);

            await runCommand(
              '[domain]:[service]:[action] value1 --format json',
              root,
            );

            expect(nock.isDone()).to.be.true;
          });

          it('should accept custom flag values', async () => {
            nock('https://api.example.com')
              .post('/endpoint', (body) => {
                return body.customField === 'custom-value';
              })
              .reply(200, mockResponse);

            await runCommand(
              '[domain]:[service]:[action] value1 --custom-flag custom-value --format json',
              root,
            );

            expect(nock.isDone()).to.be.true;
          });
        });

        context('with text format', () => {
          it('should display human-readable output', async () => {
            nock('https://api.example.com')
              .post('/endpoint')
              .reply(200, mockResponse);

            const { stdout } = await runCommand(
              '[domain]:[service]:[action] value1 --format text',
              root,
            );

            expect(stdout).to.contain('=== Operation Result ===');
            expect(stdout).to.contain('Status: Success');
          });
        });

        context('with JSON format', () => {
          it('should output valid JSON', async () => {
            nock('https://api.example.com')
              .post('/endpoint')
              .reply(200, mockResponse);

            const { stdout } = await runCommand(
              '[domain]:[service]:[action] value1 --format json',
              root,
            );

            const output = JSON.parse(stdout);
            expect(output).to.have.property('success');
          });

          it('should default to JSON format', async () => {
            nock('https://api.example.com')
              .post('/endpoint')
              .reply(200, mockResponse);

            const { stdout } = await runCommand(
              '[domain]:[service]:[action] value1',
              root,
            );

            const output = JSON.parse(stdout);
            expect(output).to.have.property('success');
          });
        });

        context('validation', () => {
          it('should validate required fields', async () => {
            const { error } = await runCommand(
              '[domain]:[service]:[action] ""',
              root,
            );

            expect(error).to.exist;
            expect(error?.message).to.match(/validation error/i);
          });

          it('should validate field formats', async () => {
            const { error } = await runCommand(
              '[domain]:[service]:[action] invalid-format',
              root,
            );

            expect(error).to.exist;
            expect(error?.message).to.match(/validation error/i);
          });
        });

        context('error handling', () => {
          it('should handle API errors', async () => {
            nock('https://api.example.com')
              .post('/endpoint')
              .reply(404, { message: 'Not found' });

            const { error } = await runCommand(
              '[domain]:[service]:[action] value1',
              root,
            );

            expect(error).to.exist;
            expect(error?.message).to.contain('Failed to');
          });

          it('should handle network errors', async () => {
            nock('https://api.example.com')
              .post('/endpoint')
              .replyWithError('Network timeout');

            const { error } = await runCommand(
              '[domain]:[service]:[action] value1',
              root,
            );

            expect(error).to.exist;
            expect(error?.message).to.contain('Failed to');
          });

          it('should handle 500 server errors', async () => {
            nock('https://api.example.com')
              .post('/endpoint')
              .reply(500, { message: 'Internal server error' });

            const { error } = await runCommand(
              '[domain]:[service]:[action] value1',
              root,
            );

            expect(error).to.exist;
          });
        });

        context('edge cases', () => {
          it('should handle empty API response', async () => {
            nock('https://api.example.com').post('/endpoint').reply(200, {});

            const { stdout } = await runCommand(
              '[domain]:[service]:[action] value1 --format json',
              root,
            );

            const output = JSON.parse(stdout);
            expect(output).to.exist;
          });

          it('should handle special characters in input', async () => {
            const specialChars = 'test@#$%^&*()';
            nock('https://api.example.com')
              .post('/endpoint')
              .reply(200, mockResponse);

            await runCommand(
              `[domain]:[service]:[action] "${specialChars}" --format json`,
              root,
            );

            expect(nock.isDone()).to.be.true;
          });
        });
      });
    });
  });
});
```

## Step 5: Build and Verify

<procedure>
1. Mark build todo as in_progress

2. Build the project (REQUIRED): </procedure>

```bash
npm run build
```

<procedure>
3. Mark lint todo as in_progress

4. Run linting and fix issues: </procedure>

```bash
npm run lint
```

<procedure>
5. Mark format todo as in_progress

6. Format code: </procedure>

```bash
npm run format
```

<procedure>
7. Mark todos complete as they pass

8. If any fail, fix issues and retry </procedure>

## Step 6: Test Execution

### 6.1 Run Test Suite

<procedure>
1. Mark test todo as in_progress

2. Run all tests: </procedure>

```bash
npm test
```

<procedure>
3. Verify coverage meets requirements:
   - Lines: 80%+
   - Statements: 80%+
   - Functions: 80%+
   - Branches: 70%+

4. If tests fail, fix and rerun

5. Mark test todo complete when all pass </procedure>

### 6.2 Test Command Help

```bash
./bin/dev.js [domain] [service] [action] --help
```

Verify:

- Description displays correctly
- Examples show properly
- Flags listed with descriptions
- Args documented

### 6.3 Test Command Execution

**IMPORTANT: Destructive Command Check**

<procedure>
1. Determine if command is destructive:
   - Creates/modifies/deletes resources?
   - Has side effects?
   - Makes API calls that change state?

2. If destructive, ask user for permission: </procedure>

<message>
This command appears to be DESTRUCTIVE (creates/modifies/deletes resources).

Do you want me to test it with real execution?

**WARNING:** This will:

- [List specific actions the command will take]
- [Mention any resources that will be affected]

Options:

- "yes" - Test with real execution (you provide safe test values)
- "no" - Skip real execution testing (rely on mocked tests only)
- "mock-only" - I'll verify mocks cover the functionality </message>

<procedure>
3. If user approves destructive testing:
   - Ask for safe test values
   - Execute command with those values
   - Verify results
   - Document what was created/modified

4. If user declines:
   - Skip real execution
   - Verify test mocks cover all scenarios
   - Document that real testing was skipped </procedure>

**For Non-Destructive Commands:**

Test with sample data:

```bash
# Test JSON output
./bin/dev.js [domain] [service] [action] [args] --format json

# Test text output
./bin/dev.js [domain] [service] [action] [args] --format text

# Test validation
./bin/dev.js [domain] [service] [action] invalid-input

# Test error handling (if safe)
./bin/dev.js [domain] [service] [action] nonexistent-id
```

## Step 7: Final Verification

Run complete preflight check:

```bash
npm run preflight
```

This runs:

- Format check
- Linting
- Type checking
- Full test suite with coverage

Mark all remaining todos complete if preflight passes.

## Step 8: Present Results

Show the user:

<output_format>

## Command Creation Complete ✓

**Files Created:**

- `[command-path]` - Command implementation
- `[lib-path]` - Business logic and formatting
- `[lib-test-path]` - Business logic unit tests (XX tests)
- `[command-test-path]` - Command integration tests (XX tests)

**Validation:**

- Build: ✓ Passed
- Lint: ✓ Passed
- Type Check: ✓ Passed
- Format: ✓ Applied
- Tests: ✓ Passed (XX total tests)
- Coverage: ✓ Lines: XX%, Functions: XX%, Branches: XX%

**Test Coverage Details:**

- Lib tests: [XX tests covering business logic, validation, errors]
- Command tests: [XX tests covering CLI behavior, flags, formats]
- Edge cases: [List any notable edge cases tested]

**Command Testing Results:**

- Help display: ✓ Verified
- JSON output: ✓ Tested
- Text output: ✓ Tested
- Validation: ✓ Tested
- Error handling: ✓ Tested [If destructive and tested:]
- Real execution: ✓ Tested with [describe what was done] [If destructive and
  skipped:]
- Real execution: ⊘ Skipped (user choice) - mocked tests cover functionality

**Usage Examples:**

```bash
# Basic usage
atlas [domain] [service] [action] [args]

# JSON output
atlas [domain] [service] [action] [args] --format json

# Text output
atlas [domain] [service] [action] [args] --format text

# Help
atlas [domain] [service] [action] --help
```

**Next Steps:** The command is fully implemented and tested. Ready for:

- Code review
- Git commit (use `/dev/commit`)
- Pull request

Would you like me to:

- [ ] Create related commands?
- [ ] Add more test cases?
- [ ] Create documentation?
- [ ] Nothing more (we're done) </output_format>

## Important Guidelines

**Always Do:**

- Use TodoWrite to track ALL tasks throughout process
- Research actual codebase patterns first
- Create BOTH lib and command implementations
- Create BOTH lib unit tests and command integration tests
- Follow AAA pattern (Arrange, Act, Assert) in tests
- Test success paths AND error paths
- Support both JSON and text output formats
- Handle validation errors separately
- Use `.js` extensions in all imports
- Ask permission before testing destructive commands
- Achieve 80%+ line/function coverage, 70%+ branch coverage
- Run full preflight before completion

**Never Do:**

- Skip test creation
- Test only happy paths
- Put business logic in commands
- Skip validation
- Hardcode values that should be configurable
- Edit auto-generated client files
- Use `any` type
- Test without mocking external dependencies
- Commit without running preflight

## Common Patterns by Client Type

**OpsGenie Commands:**

- Use `this.opsgenieClient`
- Handle tiny ID vs UUID with `detectIdType()`
- Common 204 responses - use `is204SuccessError()`
- Test with `nock('https://api.opsgenie.com')`

**MIT/Routing Commands:**

- Use `this.mitClient` or `this.cpClient`
- Validate ZIP codes, ZUIDs
- Common 204 responses on mutations
- Test with mock client

**Databricks/SQL Commands:**

- Use `this.getSqlServer(database)` or `this.databricks`
- Only dev/stage (prod blocked)
- Connection pooled
- Mock database responses

**Splunk Commands:**

- Use `await this.getSplunkClient()`
- Requires SPLUNK_TOKEN
- Mock Splunk API responses

## Troubleshooting

**If tests fail:**

1. Check nock mocks match actual API calls
2. Verify client method signatures
3. Check validation schema requirements
4. Review error handling paths

**If coverage is low:**

1. Add tests for error paths
2. Test edge cases
3. Test validation failures
4. Test both output formats

**If build fails:**

1. Check import extensions (`.js` required)
2. Verify types are exported
3. Check for missing dependencies

## Reference Commands & Tests

**Simple Command with Tests:**

- Command: `packages/atlas/src/commands/observability/opsgenie/alerts/note.ts`
- Lib: `packages/atlas/src/lib/observability/opsgenie/alerts/note.ts`
- Lib test: `packages/atlas/test/lib/observability/opsgenie/alerts/note.test.ts`
- Command test:
  `packages/atlas/test/commands/observability/opsgenie/alerts/note.test.ts`

**Complex Routing Command with Tests:**

- Command:
  `packages/plugin-routing/src/commands/routing/connection-pacing/assignments/add.ts`
- Lib: `packages/plugin-routing/src/lib/connection-pacing/assignments/add.ts`
- Tests: Mirror structure in test/ directory

## Completion Checklist

Before marking complete, verify:

- [ ] TodoWrite created with all tasks
- [ ] Research completed with parallel tasks
- [ ] Similar commands and tests analyzed
- [ ] Validation schemas added/reused
- [ ] Lib file created with business logic
- [ ] Command file created extending BaseCommand
- [ ] Lib unit tests created (80%+ coverage)
- [ ] Command integration tests created (comprehensive)
- [ ] All imports use `.js` extensions
- [ ] JSDoc comments on lib functions
- [ ] Both JSON and text output implemented
- [ ] Validation errors handled separately
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run format` applied
- [ ] `npm test` passes (all tests)
- [ ] Coverage meets requirements (80/80/70)
- [ ] Command help displays correctly
- [ ] Command executes successfully
- [ ] Destructive commands tested with permission
- [ ] All todos marked complete
- [ ] `npm run preflight` passes

## Relationship to Other Commands

Recommended workflow:

1. `/dev/research` - Research patterns if unfamiliar
2. `/dev/add-command` - Create command with tests (this workflow)
3. `/dev/verify` - Verify implementation correctness
4. `/dev/commit` - Create git commits
5. Manual testing - User tests the command
6. PR creation - Submit for review
