# CLI Design Patterns

Reference: `design/09-coding-standards/standards-reference/12-cli-design.md`

<cli_design_rules>

## Guiding Principles

These principles guide all CLI design decisions:

- **Predictability**: Commands behave consistently so users can predict behavior from patterns. Similar commands should work similarly.
- **Discoverability**: Help text, examples, and error messages guide users to correct usage. Users shouldn't need to read docs for basic operations.
- **Composability**: Commands work in pipelines; output is machine-parseable when needed. CLIs are building blocks for automation.
- **Graceful Failure**: Errors are clear, actionable, and never leave the system in a broken state. Users should know what went wrong and how to fix it.
- **Progressive Disclosure**: Simple commands are simple; advanced options are available but not required. Don't overwhelm new users.

## Architecture

### Layered Structure

Keep strict layering to separate concerns and enable testing. Each layer has one responsibility:

```
Entry Point → Parent Commands → Subcommands → Handlers
```

| Layer           | Responsibility                        | Contains                    | Depends On          |
| --------------- | ------------------------------------- | --------------------------- | ------------------- |
| Entry Point     | Parse args, route to commands         | CLI bootstrap, yargs setup  | Command definitions |
| Parent Commands | Group related subcommands             | Command modules, middleware | Subcommands         |
| Subcommands     | Define options, validate input        | Option definitions, checks  | Handlers            |
| Handlers        | Execute business logic, format output | Pure functions, services    | Core services       |

### File Organization

Follow this standard layout so files are predictable and discoverable:

```
src/
├── cli.ts                           # Entry point
├── commands/
│   ├── index.ts                     # Command registration
│   ├── [parent].ts                  # Parent command (e.g., extensions.ts)
│   ├── [parent]/
│   │   ├── index.ts                 # Subcommand registration
│   │   ├── [subcommand].ts          # Subcommand (e.g., add.ts)
│   │   └── [subcommand].test.ts     # Co-located tests
│   └── utils.ts                     # Command utilities
└── utils/
    ├── output.ts                    # Output formatting
    ├── errors.ts                    # Error handling
    └── cleanup.ts                   # Exit cleanup
```

### Component Roles

Each component has a specific role. Using the wrong component for a task creates coupling and hurts testability:

| Component        | Role                                | Depends On             |
| ---------------- | ----------------------------------- | ---------------------- |
| Command Module   | Define command, options, handler    | Handler functions      |
| Handler Function | Execute business logic              | Services, utilities    |
| Validator        | Validate arguments synchronously    | None                   |
| Output Formatter | Format output for display           | Logger                 |
| Error Handler    | Handle and format errors            | Logger, exit utilities |
| Cleanup Handler  | Run exit cleanup, register handlers | None                   |

### Dependency Rules

Commands should use services, not access infrastructure directly. This keeps commands testable and maintains separation of concerns:

- ✓ Command Module → Handler → Service → Database
- ✗ Command Module → Database directly
- ✓ Handler → `exitCli()` helper
- ✗ Handler → `process.exit()` directly
- ✓ Validator → Synchronous checks only
- ✗ Validator → Async operations (validation must be fast)

## Command Patterns

### Parent Commands

Use parent commands to group 3+ related subcommands under a domain namespace. This creates intuitive command hierarchies:

```typescript
// src/commands/extensions.ts
export const extensionsCommand: CommandModule = {
  command: 'extensions',
  aliases: ['extension'], // Singular alias for convenience
  describe: 'Manage CLI extensions',
  builder: (yargs) =>
    yargs
      .command(addCommand)
      .command(removeCommand)
      .command(listCommand)
      .demandCommand(1, 'Specify a subcommand: add, remove, list')
      .version(false), // Disable version on parent
  handler: () => {}, // Parent has no direct action
};
```

When to use parent commands:

- ✓ Grouping 3+ related subcommands (e.g., `extensions add/remove/list`)
- ✓ Creating domain namespaces (e.g., `config`, `servers`, `auth`)
- ✗ Only 1-2 commands (just make them top-level)
- ✗ Unrelated commands (find a better grouping)
- ✗ Nesting beyond 2 levels (`cli foo bar baz` is confusing)

### Subcommands

Subcommands implement a single action with clear input → output. Keep handler logic in a separate function for testability:

```typescript
// src/commands/extensions/add.ts
export const addCommand: CommandModule<{}, AddArgs> = {
  command: 'add <name>',
  describe: 'Add an extension',
  builder: (yargs) =>
    yargs
      .positional('name', { type: 'string', demandOption: true })
      .option('source', { type: 'string', alias: 's' }),
  handler: async (argv) => {
    await handleAdd(argv); // Testable function
    await exitCli(); // Clean exit
  },
};

// Separate, testable handler
async function handleAdd(args: AddArgs): Promise<void> {
  // Business logic here
}
```

When to use subcommands:

- ✓ Single, focused action
- ✓ Action that belongs to an existing group
- ✗ One-liner actions (use inline handler instead)
- ✗ Action that needs its own subcommands (make it a parent)

### Command Structure Decision Tree

```
Is this action part of an existing group?
  Yes → Add as subcommand
  No → Will there be 3+ related commands?
    Yes → Create parent command
    No → Is it frequently used?
      Yes → Top-level command
      No → Standalone command
```

## Options & Arguments

### Option Types

Choose the right option type for the data. This affects parsing, validation, and help text:

| Type                | Syntax            | Use When                   | Example                         |
| ------------------- | ----------------- | -------------------------- | ------------------------------- |
| Required positional | `<name>`          | Value is mandatory         | `command: 'add <name>'`         |
| Optional positional | `[name]`          | Value has sensible default | `command: 'show [name]'`        |
| Variadic            | `[args...]`       | Accepting multiple values  | `command: 'run [args...]'`      |
| Boolean flag        | `type: 'boolean'` | Toggle behavior on/off     | `--force`, `--verbose`          |
| String option       | `type: 'string'`  | Free-form text value       | `--output file.txt`             |
| Array option        | `type: 'array'`   | Multiple values            | `--env KEY=val --env KEY2=val2` |
| Choice option       | `choices: [...]`  | Value from fixed set       | `--format json\|table\|text`    |

Option type decision tree:

```
No value needed → type: 'boolean'
Single value from fixed set → choices: ['a', 'b', 'c']
Free text → type: 'string'
Number → type: 'number'
Multiple values → type: 'array', string: true
Required positional → <name> in command string
```

### Option Naming

Consistent naming lets users predict option names. Inconsistent naming (`-autoUpdate` vs `--auto-update`) confuses users:

| Type            | Convention     | Examples                                         |
| --------------- | -------------- | ------------------------------------------------ |
| Long options    | `kebab-case`   | `--auto-update`, `--pre-release`, `--output-dir` |
| Short options   | Single letter  | `-f`, `-v`, `-o`                                 |
| Boolean flags   | Positive form  | `--force` (not `--no-skip`)                      |
| Negatable flags | `--no-` prefix | `--no-color`, `--no-cache`                       |

### Common Short Flags

Use standard short flags so users can predict them across commands:

| Flag | Long Form                 | Usage                       |
| ---- | ------------------------- | --------------------------- |
| `-f` | `--force` or `--file`     | Force action / Specify file |
| `-v` | `--verbose`               | Verbose output              |
| `-q` | `--quiet`                 | Suppress output             |
| `-o` | `--output`                | Output destination          |
| `-c` | `--config`                | Config file path            |
| `-e` | `--env`                   | Environment variable        |
| `-s` | `--scope` or `--source`   | Context-dependent           |
| `-t` | `--type` or `--transport` | Context-dependent           |
| `-H` | `--header`                | HTTP header                 |
| `-r` | `--ref` or `--recursive`  | Context-dependent           |

### Argument Validation

Validate early with clear errors. Users shouldn't discover invalid input halfway through execution:

```typescript
builder: (yargs) => yargs
  .option('url', { type: 'string' })
  .option('transport', { choices: ['http', 'stdio'] })
  .check((argv) => {
    // Validate interdependencies
    if (argv.transport === 'http' && !argv.url) {
      throw new Error('HTTP transport requires --url option.');
    }

    // Validate format
    if (argv.env) {
      for (const env of argv.env as string[]) {
        if (!env.includes('=')) {
          throw new Error(`Invalid env format: "${env}". Use KEY=value.`);
        }
      }
    }

    return true;  // Validation passed
  }),
```

### Advanced Parsing

When passing arguments through to another command (like `--`), configure yargs to capture them:

```typescript
builder: (yargs) => yargs
  .parserConfiguration({
    'unknown-options-as-args': true,
    'populate--': true,
  })
  .middleware((argv) => {
    if (argv['--']) {
      argv.args = [...(argv.args || []), ...(argv['--'] as string[])];
    }
  }),
```

## Output & Formatting

### Output Streams

Use the correct stream so output can be filtered and redirected properly:

| Stream   | Purpose                      | Method                            |
| -------- | ---------------------------- | --------------------------------- |
| `stdout` | Normal output, data, results | `logger.log()`                    |
| `stderr` | Errors, warnings, progress   | `logger.error()`, `logger.warn()` |

### Output Formatting

Use centralized logger for all output. Direct `console.log` everywhere prevents output format control:

```typescript
// Centralized logger
import { logger } from '../utils/output';

// Format lists consistently
const items = ['item1', 'item2', 'item3'];
logger.log(items.join('\n')); // Simple list
logger.log(items.join('\n\n')); // List with separators
```

### Status Indicators

Use consistent status indicators so users recognize success/failure at a glance:

```typescript
const STATUS_INDICATORS = {
  success: '\u001b[32m✓\u001b[0m', // Green checkmark
  warning: '\u001b[33m…\u001b[0m', // Yellow ellipsis
  error: '\u001b[31m✗\u001b[0m', // Red X
  pending: '\u001b[34m○\u001b[0m', // Blue circle
};
```

### Colors

Use shared color constants for consistency. Respect `NO_COLOR` env var for accessibility:

```typescript
const COLORS = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m',
  gray: '\u001b[90m',
};
```

### Output Modes

Support multiple output formats for different use cases:

| Mode        | Constant                              | Use Case                          |
| ----------- | ------------------------------------- | --------------------------------- |
| Text        | `OutputFormat.TEXT = 'text'`          | Human-readable (default)          |
| JSON        | `OutputFormat.JSON = 'json'`          | Pipeline consumption, scripting   |
| Stream JSON | `OutputFormat.STREAM_JSON = 'stream'` | Long operations, real-time events |

Output format decision:

- Default to text for human users
- Provide `--json` flag for pipelines and scripting
- Use stream JSON for long-running operations with progress events
- Respect `NO_COLOR` env var when outputting colors

## Exit Codes & Cleanup

### Standard Exit Codes

Use standard exit codes so scripts can handle errors programmatically:

| Code  | Name              | Meaning                        |
| ----- | ----------------- | ------------------------------ |
| `0`   | Success           | Command completed successfully |
| `1`   | General error     | Unspecified error              |
| `2`   | Misuse            | Invalid arguments, bad usage   |
| `64`  | Usage error       | Command line usage error       |
| `65`  | Data error        | Input data incorrect           |
| `66`  | No input          | Input file missing             |
| `69`  | Unavailable       | Service unavailable            |
| `70`  | Internal error    | Software error                 |
| `74`  | I/O error         | Input/output error             |
| `77`  | Permission denied | Insufficient permissions       |
| `130` | Interrupted       | SIGINT (Ctrl+C)                |

### Exit Helper

Always exit via `exitCli()` helper to ensure cleanup runs. Direct `process.exit()` skips cleanup and can corrupt state:

```typescript
async function exitCli(exitCode = 0): Promise<never> {
  await runExitCleanup();
  process.exit(exitCode);
}

function getExitCode(error: unknown): number {
  if (error instanceof Error) {
    return (error as any).exitCode ?? (error as any).code ?? 1;
  }
  return 1;
}
```

### Partial Failure Reporting

For batch operations, report all failures before exiting. Don't exit on first failure when other items could succeed:

```typescript
async function handleBatchOperation(items: string[]): Promise<void> {
  const failures: Array<{ item: string; error: Error }> = [];

  for (const item of items) {
    try {
      await processItem(item);
    } catch (error) {
      failures.push({ item, error: error as Error });
      logger.error(`Failed to process ${item}: ${(error as Error).message}`);
    }
  }

  if (failures.length > 0) {
    await exitCli(1); // Exit non-zero when any operation fails
  }
}
```

## Interactive Prompts

### When to Use Prompts

Use interactive prompts for sensitive input and destructive confirmations. They prevent accidents and keep secrets out of shell history:

```typescript
import prompts from 'prompts';

// Sensitive input (passwords, tokens)
const { apiKey } = await prompts({
  type: 'password',
  name: 'apiKey',
  message: 'Enter API key:',
});

// Destructive confirmation
const { confirmed } = await prompts({
  type: 'confirm',
  name: 'confirmed',
  message: 'Delete all data? This cannot be undone.',
  initial: false,
});
```

### When NOT to Use Prompts

Avoid prompts when:

- ✗ Running in CI/CD (non-interactive mode)
- ✗ All required input can be provided via flags
- ✗ Command should be scriptable

### Non-Interactive Fallback

Always provide flag alternatives and check for TTY. Prompts that block automation are a usability failure:

```typescript
async function getConsent(argv: { consent?: boolean }): Promise<boolean> {
  // Flag provided - use it
  if (argv.consent !== undefined) {
    return argv.consent;
  }

  // Non-interactive - error with guidance
  if (!process.stdin.isTTY) {
    throw new Error(
      'Cannot prompt for consent in non-interactive mode. ' +
        'Use --consent flag to provide consent via command line.'
    );
  }

  // Interactive - prompt user
  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: 'Do you consent?',
  });

  // Handle cancelled prompt
  if (confirmed === undefined) {
    throw new Error('Prompt cancelled.');
  }

  return confirmed;
}
```

## Error Handling

### Centralized Error Handling

Handle errors in one place so formatting and exit codes are consistent:

```typescript
function handleCommandError(error: unknown, outputFormat: OutputFormat): never {
  const message = getErrorMessage(error);
  const exitCode = getExitCode(error);

  if (outputFormat === OutputFormat.JSON || outputFormat === OutputFormat.STREAM_JSON) {
    // JSON error to stderr for machine consumption
    logger.error(JSON.stringify({ error: message }));
  } else {
    // Human-readable error
    logger.error(`Error: ${message}`);
  }

  process.exit(exitCode);
}
```

### Error Message Guidelines

Good error messages are specific, actionable, and helpful. Bad error messages waste user time:

| Guideline       | Good                                                | Bad                    |
| --------------- | --------------------------------------------------- | ---------------------- |
| Be specific     | `File not found: config.json`                       | `Error occurred`       |
| Be actionable   | `Use --scope user to edit home directory settings.` | `Invalid scope`        |
| Include context | `Failed to connect to server "my-server": timeout`  | `Connection failed`    |
| Avoid jargon    | `Cannot find extension "foo"`                       | `ENOENT: no such file` |
| Suggest fix     | `Install with: npm install -g @scope/cli`           | `Module not found`     |

## Command Execution Flow

Follow this 6-step lifecycle for consistent command execution:

```
1. Parse     → Yargs parses arguments
2. Validate  → .check() validates input
3. Execute   → Handler calls business logic
4. Format    → Results formatted for output mode
5. Return    → Handler returns result
6. Display   → Output sent to appropriate stream
```

</cli_design_rules>

## Preferences

- **Error Handling Flow**: Format errors in one place, output once, ensure exit code reflects failure.
- **Structural Validation**: Command file naming matches command name, kebab-case options, `CommandModule` exports, async handlers.
- **Architecture Review**: Verify parent/subcommand pattern, `exitCli()` usage, option types + validation, actionable errors, TTY-guarded prompts, centralized logger, meaningful exit codes.

## Exceptions

When external constraints prevent following a rule:

| Scenario                 | Justification                  | Documentation Required     |
| ------------------------ | ------------------------------ | -------------------------- |
| Legacy command naming    | Backward compatibility         | Deprecation notice in help |
| Direct `console.log`     | Performance-critical streaming | Comment explaining why     |
| Deep nesting (3+ levels) | Complex domain requires it     | Architecture review        |

Document exceptions with a comment block:

```typescript
// CLI DESIGN EXCEPTION: STD-012
// Reason: Legacy compatibility with v1.x CLI
// Migration: Will be removed in v3.0
// Approved: 2024-01-15

export const legacyCommand: CommandModule = {
  command: 'old-name',
  deprecated: 'Use "new-name" instead.',
  // ...
};
```

## Verification Checklist

When reviewing CLI code for compliance:

**Architecture**

- [ ] Commands follow Entry Point → Parent → Subcommand → Handler layering
- [ ] File organization matches standard layout
- [ ] Handlers are separate, testable functions
- [ ] Commands use services, not direct infrastructure access

**Commands**

- [ ] Parent commands group 3+ related subcommands
- [ ] Parent commands have singular alias and `demandCommand(1)`
- [ ] Subcommands implement single, focused actions
- [ ] No command nesting beyond 2 levels

**Options**

- [ ] Long options use `kebab-case`
- [ ] Short options are single letters from common flags list
- [ ] Boolean flags use positive form
- [ ] Option types match data (boolean/string/array/choices)
- [ ] Required values use positional `<name>` syntax

**Validation**

- [ ] Arguments validated synchronously in `.check()`
- [ ] Validation errors are specific and actionable
- [ ] Interdependencies checked (e.g., `--url` required with `--transport http`)

**Output**

- [ ] Uses centralized logger (no direct `console.log`)
- [ ] `stdout` for data, `stderr` for errors/progress
- [ ] Status indicators use standard symbols
- [ ] Supports `--json` flag for machine output
- [ ] Respects `NO_COLOR` env var

**Exit & Cleanup**

- [ ] Uses `exitCli()` helper (no direct `process.exit()`)
- [ ] Exit codes follow standard meanings
- [ ] Batch operations report all failures before exiting

**Prompts**

- [ ] Interactive prompts guarded with `process.stdin.isTTY`
- [ ] Flag alternatives provided for all prompts
- [ ] Cancelled prompts handled as errors
- [ ] Sensitive input uses `type: 'password'`

**Errors**

- [ ] Errors formatted through centralized handler
- [ ] Error messages are specific, actionable, include context
- [ ] JSON output mode emits JSON errors to stderr
