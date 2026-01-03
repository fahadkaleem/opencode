# CLI Design Patterns - Coding Standard

> **Standard ID**: STD-012
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: Command-Line Interface Design and Implementation
> **Enforcement**: Manual Review + Structural Checks
> **Related Documents**:
>
> - [Base Standard Template](../../templates/99-standards/00-base-standard-template.md) - Common structure reference
> - [Pattern-Based Template](../../templates/99-standards/02-pattern-based-template.md) - Template used
> - [Naming Conventions](./naming-conventions.md) - Naming rules
> - [Error Handling Patterns](./06-error-handling.md) - Error patterns

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory CLI design patterns for TypeScript/Node.js command-line applications. These patterns provide structural guidance for command organization, option handling, output formatting, and user interaction to ensure consistent, professional CLI experiences.

### 1.2 Scope

**Applies to**:

- CLI command definitions and handlers
- Option and flag declarations
- Output formatting and display
- Help text and documentation
- Error messages and exit codes
- Interactive prompts and user input
- Signal handling and cleanup

**Does NOT apply to**:

- Internal API design (see Architecture Patterns)
- Web UI components
- Background service interfaces

### 1.3 Enforcement Level

| Level      | Meaning             | Mechanism                               |
| ---------- | ------------------- | --------------------------------------- |
| **MUST**   | Mandatory pattern   | Architecture review, structural linting |
| **SHOULD** | Recommended pattern | Code review                             |
| **MAY**    | Optional pattern    | Team discretion                         |

---

## 2. Guiding Principles

| Principle              | Description                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| Predictability         | Commands behave consistently; users can predict behavior from patterns      |
| Discoverability        | Help text, examples, and error messages guide users to correct usage        |
| Composability          | Commands work in pipelines; output is machine-parseable when needed         |
| Graceful Failure       | Errors are clear, actionable, and never leave the system in broken state    |
| Progressive Disclosure | Simple commands are simple; advanced options are available but not required |

---

## 3. Architectural Overview

### 3.1 Command Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Command Parser (Yargs)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Parent Commands                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ extensions  │  │    mcp      │  │   config    │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
│         │                │                │                         │
│         ▼                ▼                ▼                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Subcommands                               │   │
│  │  install, list, enable, add, remove, update, show, set...  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Command Handlers                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Handler   │  │   Logger    │  │  Exit/      │                 │
│  │   Logic     │  │   Output    │  │  Cleanup    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Layer Responsibilities

| Layer           | Responsibility                        | Contains                    | Depends On          |
| --------------- | ------------------------------------- | --------------------------- | ------------------- |
| Entry Point     | Parse args, route to commands         | CLI bootstrap, yargs setup  | Command definitions |
| Parent Commands | Group related subcommands             | Command modules, middleware | Subcommands         |
| Subcommands     | Define options, validate input        | Option definitions, checks  | Handlers            |
| Handlers        | Execute business logic, format output | Pure functions, services    | Core services       |

### 3.3 File Organization

```
src/
├── cli.ts                    # Entry point, yargs setup
├── commands/
│   ├── index.ts              # Command registration
│   ├── extensions.ts         # Parent command
│   ├── extensions/
│   │   ├── index.ts          # Subcommand exports
│   │   ├── install.ts        # Subcommand
│   │   ├── list.ts           # Subcommand
│   │   ├── enable.ts         # Subcommand
│   │   └── install.test.ts   # Tests co-located
│   ├── mcp.ts                # Parent command
│   ├── mcp/
│   │   ├── add.ts
│   │   ├── list.ts
│   │   └── remove.ts
│   └── utils.ts              # Shared command utilities
└── utils/
    ├── output.ts             # Output formatting
    ├── errors.ts             # CLI error handling
    └── cleanup.ts            # Exit cleanup
```

---

## 4. Patterns

### 4.1 Parent Command Pattern

#### 4.1.1 When to Use

Use this pattern when:

- Grouping 3+ related subcommands
- Commands share a domain (extensions, servers, config)
- Logical namespace improves discoverability

Do NOT use this pattern when:

- Only 1-2 commands in the group
- Commands are unrelated
- Nesting would exceed 2 levels

#### 4.1.2 Structure

```
commands/
├── extensions.ts         # Parent command definition
└── extensions/
    ├── index.ts          # Barrel export of subcommands
    ├── install.ts        # Subcommand
    ├── list.ts           # Subcommand
    └── uninstall.ts      # Subcommand
```

#### 4.1.3 Implementation Template

```typescript
import type { CommandModule, Argv } from 'yargs';
import { installCommand } from './extensions/install.js';
import { listCommand } from './extensions/list.js';
import { uninstallCommand } from './extensions/uninstall.js';

/**
 * Parent command for extension management.
 *
 * Responsibility:
 * - Register all extension-related subcommands
 * - Apply shared middleware
 * - Enforce subcommand requirement
 */
export const extensionsCommand: CommandModule = {
  command: 'extensions <command>',
  aliases: ['extension'],
  describe: 'Manage CLI extensions.',
  builder: (yargs: Argv) =>
    yargs
      .command(installCommand)
      .command(listCommand)
      .command(uninstallCommand)
      .demandCommand(1, 'You need at least one command.')
      .version(false),
  handler: () => {
    // Yargs shows help when no subcommand provided
  },
};
```

#### 4.1.4 Complete Example

```typescript
// File: src/commands/servers.ts

import type { CommandModule, Argv } from 'yargs';
import { addCommand } from './servers/add.js';
import { listCommand } from './servers/list.js';
import { removeCommand } from './servers/remove.js';
import { initializeOutputListeners } from '../utils/output.js';

export const serversCommand: CommandModule = {
  command: 'servers <command>',
  aliases: ['server'],
  describe: 'Manage MCP server connections.',
  builder: (yargs: Argv) =>
    yargs
      .middleware(() => initializeOutputListeners())
      .command(addCommand)
      .command(listCommand)
      .command(removeCommand)
      .demandCommand(1, 'Specify a subcommand: add, list, or remove.')
      .version(false),
  handler: () => {},
};
```

---

### 4.2 Subcommand Pattern

#### 4.2.1 When to Use

Use this pattern when:

- Implementing a specific action within a command group
- Command requires options, arguments, or validation
- Action has clear input → output behavior

Do NOT use this pattern when:

- Action is a one-liner (use inline handler)
- Command is a parent for other commands

#### 4.2.2 Structure

```
commands/extensions/
├── install.ts            # Command definition + handler
└── install.test.ts       # Command tests
```

#### 4.2.3 Implementation Template

```typescript
import type { CommandModule, Argv, ArgumentsCamelCase } from 'yargs';
import { logger } from '../../utils/output.js';
import { exitCli } from '../utils.js';

interface InstallArgs {
  source: string;
  ref?: string;
  autoUpdate: boolean;
}

/**
 * Handles extension installation logic.
 * Separated from command definition for testability.
 */
async function handleInstall(args: InstallArgs): Promise<void> {
  // Business logic here
  logger.log(`Installing from ${args.source}...`);
  // ... implementation
  logger.log('Installation complete.');
}

export const installCommand: CommandModule<object, InstallArgs> = {
  command: 'install <source>',
  describe: 'Installs an extension from a git URL or local path.',
  builder: (yargs: Argv) =>
    yargs
      .positional('source', {
        describe: 'Git repository URL or local path.',
        type: 'string',
        demandOption: true,
      })
      .option('ref', {
        alias: 'r',
        describe: 'Git ref (branch, tag, or commit) to install.',
        type: 'string',
      })
      .option('auto-update', {
        describe: 'Enable automatic updates for this extension.',
        type: 'boolean',
        default: false,
      }),
  handler: async (argv: ArgumentsCamelCase<InstallArgs>) => {
    await handleInstall({
      source: argv.source,
      ref: argv.ref,
      autoUpdate: argv.autoUpdate,
    });
    await exitCli();
  },
};
```

---

### 4.3 Option Definition Pattern

#### 4.3.1 When to Use

Use this pattern for:

- All command options and flags
- Positional arguments
- Validation constraints

#### 4.3.2 Option Types

| Type                  | Declaration       | Example                         |
| --------------------- | ----------------- | ------------------------------- | ----- | ----- |
| Positional (required) | `<name>`          | `command: 'add <name>'`         |
| Positional (optional) | `[name]`          | `command: 'show [name]'`        |
| Variadic              | `[args...]`       | `command: 'run [args...]'`      |
| Boolean flag          | `type: 'boolean'` | `--force`, `--verbose`          |
| String option         | `type: 'string'`  | `--output file.txt`             |
| Array option          | `type: 'array'`   | `--env KEY=val --env KEY2=val2` |
| Choice option         | `choices: [...]`  | `--format json                  | table | text` |

#### 4.3.3 Implementation Template

```typescript
.positional('name', {
  describe: 'Name of the resource.',
  type: 'string',
  demandOption: true,
})
.option('scope', {
  alias: 's',
  describe: 'Configuration scope.',
  type: 'string',
  default: 'project',
  choices: ['user', 'project'] as const,
})
.option('env', {
  alias: 'e',
  describe: 'Environment variables (KEY=value format).',
  type: 'array',
  string: true,
  nargs: 1,
})
.option('force', {
  alias: 'f',
  describe: 'Skip confirmation prompts.',
  type: 'boolean',
  default: false,
})
```

#### 4.3.4 Naming Conventions

| Convention    | Rule               | Example                          |
| ------------- | ------------------ | -------------------------------- |
| Long options  | kebab-case         | `--auto-update`, `--pre-release` |
| Short options | Single letter      | `-f`, `-v`, `-e`                 |
| Boolean flags | Positive form      | `--force` not `--no-skip`        |
| Negatable     | Use `--no-` prefix | `--no-color`                     |

#### 4.3.5 Common Short Flags

| Flag | Meaning          | Usage                 |
| ---- | ---------------- | --------------------- |
| `-f` | Force / File     | `--force` or `--file` |
| `-v` | Verbose          | `--verbose`           |
| `-q` | Quiet            | `--quiet`             |
| `-o` | Output           | `--output`            |
| `-c` | Config           | `--config`            |
| `-e` | Environment      | `--env`               |
| `-s` | Scope / Source   | Context-dependent     |
| `-t` | Type / Transport | Context-dependent     |
| `-H` | Header           | `--header`            |
| `-r` | Ref / Recursive  | Context-dependent     |

---

### 4.4 Argument Validation Pattern

#### 4.4.1 When to Use

Use this pattern when:

- Arguments have interdependencies
- Custom validation beyond type checking
- Early failure improves UX

#### 4.4.2 Implementation Template

```typescript
.check((argv) => {
  // Validate required combinations
  if (argv.transport === 'http' && !argv.url) {
    throw new Error('HTTP transport requires --url option.');
  }

  // Validate format
  if (argv.env) {
    for (const item of argv.env as string[]) {
      if (!item.includes('=')) {
        throw new Error(`Invalid env format: "${item}". Use KEY=value.`);
      }
    }
  }

  // Validate count
  if (!argv.names || (argv.names as string[]).length === 0) {
    throw new Error('At least one name is required.');
  }

  return true;
})
```

#### 4.4.3 Complete Example

```typescript
// File: src/commands/servers/add.ts

export const addCommand: CommandModule = {
  command: 'add <name> <commandOrUrl> [args...]',
  describe: 'Adds a new MCP server connection.',
  builder: (yargs: Argv) =>
    yargs
      .positional('name', {
        describe: 'Server name (unique identifier).',
        type: 'string',
        demandOption: true,
      })
      .positional('commandOrUrl', {
        describe: 'Command (stdio) or URL (sse, http).',
        type: 'string',
        demandOption: true,
      })
      .option('transport', {
        alias: 't',
        describe: 'Transport type.',
        type: 'string',
        default: 'stdio',
        choices: ['stdio', 'sse', 'http'] as const,
      })
      .option('env', {
        alias: 'e',
        describe: 'Environment variables (KEY=value).',
        type: 'array',
        string: true,
        nargs: 1,
      })
      .option('header', {
        alias: 'H',
        describe: 'HTTP headers for SSE/HTTP transports.',
        type: 'array',
        string: true,
        nargs: 1,
      })
      .parserConfiguration({
        'unknown-options-as-args': true,
        'populate--': true,
      })
      .middleware((argv) => {
        // Merge -- args into args array
        if (argv['--']) {
          const existingArgs = (argv['args'] as string[]) || [];
          argv['args'] = [...existingArgs, ...(argv['--'] as string[])];
        }
      })
      .check((argv) => {
        const transport = argv.transport as string;
        const commandOrUrl = argv.commandOrUrl as string;

        // URL transports require URL format
        if ((transport === 'sse' || transport === 'http') && !commandOrUrl.startsWith('http')) {
          throw new Error(
            `Transport "${transport}" requires a URL starting with http:// or https://`
          );
        }

        // Headers only valid for HTTP transports
        if (argv.header && transport === 'stdio') {
          throw new Error('Headers are only valid for sse or http transports.');
        }

        return true;
      }),
  handler: async (argv) => {
    await handleAdd({
      name: argv.name as string,
      commandOrUrl: argv.commandOrUrl as string,
      args: argv.args as string[] | undefined,
      transport: argv.transport as 'stdio' | 'sse' | 'http',
      env: argv.env as string[] | undefined,
      headers: argv.header as string[] | undefined,
    });
    await exitCli();
  },
};
```

---

### 4.5 Output Formatting Pattern

#### 4.5.1 When to Use

Use this pattern for:

- All user-facing output
- Consistent formatting across commands
- Machine-parseable output modes

#### 4.5.2 Output Streams

| Stream | Use For                    | Method                            |
| ------ | -------------------------- | --------------------------------- |
| stdout | Normal output, data        | `logger.log()`                    |
| stderr | Errors, warnings, progress | `logger.error()`, `logger.warn()` |

#### 4.5.3 Implementation Template

```typescript
import { logger } from '../utils/output.js';

// Standard output
logger.log('Operation completed successfully.');

// Error output
logger.error('Error: File not found.');

// Warning output
logger.warn('Warning: Using deprecated option.');

// Formatted list
logger.log(items.map((item) => formatItem(item)).join('\n'));

// Formatted with separators
logger.log(items.map((item) => formatItem(item)).join('\n\n'));
```

#### 4.5.4 Status Indicators

```typescript
const STATUS_INDICATORS = {
  success: '\u001b[32m✓\u001b[0m', // Green checkmark
  warning: '\u001b[33m…\u001b[0m', // Yellow ellipsis
  error: '\u001b[31m✗\u001b[0m', // Red cross
  pending: '\u001b[34m○\u001b[0m', // Blue circle
} as const;

// Usage
logger.log(`${STATUS_INDICATORS.success} Server connected`);
logger.log(`${STATUS_INDICATORS.error} Connection failed`);
```

#### 4.5.5 Color Constants

```typescript
export const COLORS = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',

  // Foreground
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m',
  gray: '\u001b[90m',
} as const;

// Usage
logger.log(`${COLORS.green}Success${COLORS.reset}: Operation completed.`);
```

#### 4.5.6 Output Modes

```typescript
export enum OutputFormat {
  TEXT = 'text', // Human-readable (default)
  JSON = 'json', // Machine-parseable JSON
  STREAM_JSON = 'stream', // Newline-delimited JSON events
}

// Text output (default)
logger.log('Extension "my-ext" installed successfully.');

// JSON output
console.log(
  JSON.stringify(
    {
      status: 'success',
      extension: 'my-ext',
      version: '1.0.0',
    },
    null,
    2
  )
);

// Stream JSON output
console.log(
  JSON.stringify({
    type: 'result',
    timestamp: new Date().toISOString(),
    status: 'success',
    data: { extension: 'my-ext' },
  })
);
```

---

### 4.6 Exit Code Pattern

#### 4.6.1 Standard Exit Codes

| Code | Meaning           | When to Use                    |
| ---- | ----------------- | ------------------------------ |
| 0    | Success           | Command completed successfully |
| 1    | General error     | Unspecified error              |
| 2    | Misuse            | Invalid arguments, bad usage   |
| 64   | Usage error       | Command line usage error       |
| 65   | Data error        | Input data incorrect           |
| 66   | No input          | Input file missing             |
| 69   | Unavailable       | Service unavailable            |
| 70   | Internal error    | Software error                 |
| 74   | I/O error         | Input/output error             |
| 77   | Permission denied | Insufficient permissions       |
| 130  | Interrupted       | SIGINT (Ctrl+C)                |

#### 4.6.2 Implementation Template

```typescript
// File: src/commands/utils.ts

import { runExitCleanup } from '../utils/cleanup.js';

/**
 * Exits the CLI with cleanup.
 * @param exitCode - Exit code (0 for success)
 */
export async function exitCli(exitCode = 0): Promise<never> {
  await runExitCleanup();
  process.exit(exitCode);
}

// File: src/utils/errors.ts

export function getExitCode(error: unknown): number {
  if (error instanceof Error) {
    const errorWithCode = error as { exitCode?: number; code?: number };
    if (typeof errorWithCode.exitCode === 'number') {
      return errorWithCode.exitCode;
    }
    if (typeof errorWithCode.code === 'number') {
      return errorWithCode.code;
    }
  }
  return 1;
}
```

#### 4.6.3 Usage Example

```typescript
// Success
await handleCommand(args);
await exitCli(0);

// Error with specific code
try {
  await handleCommand(args);
  await exitCli(0);
} catch (error) {
  logger.error(getErrorMessage(error));
  await exitCli(getExitCode(error));
}

// Multiple operations with partial failure
const errors: Array<{ name: string; error: string }> = [];

for (const name of names) {
  try {
    await uninstall(name);
    logger.log(`"${name}" uninstalled successfully.`);
  } catch (error) {
    errors.push({ name, error: getErrorMessage(error) });
  }
}

if (errors.length > 0) {
  for (const { name, error } of errors) {
    logger.error(`Failed to uninstall "${name}": ${error}`);
  }
  await exitCli(1);
}

await exitCli(0);
```

---

### 4.7 Interactive Prompt Pattern

#### 4.7.1 When to Use

Use this pattern when:

- Collecting sensitive input (passwords, tokens)
- Confirming destructive actions
- Gathering optional information interactively

Do NOT use this pattern when:

- Running in CI/CD (non-interactive mode)
- All required input can be provided via flags
- Command should be scriptable

#### 4.7.2 Implementation Template

```typescript
import prompts from 'prompts';

interface PromptResult {
  value: string;
}

/**
 * Prompts for a setting value.
 */
export async function promptForSetting(
  name: string,
  description: string,
  isSensitive: boolean
): Promise<string> {
  const response = await prompts({
    type: isSensitive ? 'password' : 'text',
    name: 'value',
    message: `${name}\n${description}`,
  });

  if (response.value === undefined) {
    throw new Error('Prompt cancelled by user.');
  }

  return response.value;
}

/**
 * Prompts for confirmation.
 */
export async function promptForConfirmation(message: string): Promise<boolean> {
  const response = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message,
    initial: false,
  });

  return response.confirmed === true;
}
```

#### 4.7.3 Non-Interactive Fallback

```typescript
interface CommandArgs {
  consent: boolean;
  // ... other args
}

async function handleInstall(args: CommandArgs): Promise<void> {
  // Check if consent is needed
  const hasConsent = args.consent ? true : await requestConsentInteractive();

  if (!hasConsent) {
    throw new Error('Installation requires consent. Use --consent flag in non-interactive mode.');
  }

  // Proceed with installation
}

async function requestConsentInteractive(): Promise<boolean> {
  if (!process.stdin.isTTY) {
    // Non-interactive mode
    return false;
  }

  return promptForConfirmation('This will install third-party code. Continue?');
}
```

---

### 4.8 Error Display Pattern

#### 4.8.1 When to Use

Use this pattern for:

- All error output to users
- Consistent error formatting
- Actionable error messages

#### 4.8.2 Implementation Template

```typescript
// File: src/utils/errors.ts

/**
 * Extracts a user-friendly error message.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Handles command errors with proper output format.
 */
export function handleCommandError(error: unknown, outputFormat: OutputFormat): never {
  const errorMessage = getErrorMessage(error);
  const exitCode = getExitCode(error);

  if (outputFormat === OutputFormat.JSON) {
    console.error(
      JSON.stringify(
        {
          status: 'error',
          error: {
            type: error instanceof Error ? error.constructor.name : 'Error',
            message: errorMessage,
            code: exitCode,
          },
        },
        null,
        2
      )
    );
  } else if (outputFormat === OutputFormat.STREAM_JSON) {
    console.error(
      JSON.stringify({
        type: 'result',
        timestamp: new Date().toISOString(),
        status: 'error',
        error: {
          type: error instanceof Error ? error.constructor.name : 'Error',
          message: errorMessage,
        },
      })
    );
  } else {
    console.error(`Error: ${errorMessage}`);
  }

  process.exit(exitCode);
}
```

#### 4.8.3 Error Message Guidelines

| Guideline       | Good                                                | Bad                    |
| --------------- | --------------------------------------------------- | ---------------------- |
| Be specific     | `File not found: config.json`                       | `Error occurred`       |
| Be actionable   | `Use --scope user to edit home directory settings.` | `Invalid scope`        |
| Include context | `Failed to connect to server "my-server": timeout`  | `Connection failed`    |
| Avoid jargon    | `Cannot find extension "foo"`                       | `ENOENT: no such file` |
| Suggest fix     | `Install with: npm install -g @scope/cli`           | `Module not found`     |

---

## 5. Role Definitions

### 5.1 Component Roles

| Role             | Responsibility                   | State                 | Dependencies           |
| ---------------- | -------------------------------- | --------------------- | ---------------------- |
| Command Module   | Define command, options, handler | None                  | Handler functions      |
| Handler Function | Execute business logic           | None                  | Services, utilities    |
| Validator        | Validate arguments               | None                  | None                   |
| Output Formatter | Format output for display        | None                  | Logger                 |
| Error Handler    | Handle and format errors         | None                  | Logger, exit utilities |
| Cleanup Handler  | Run exit cleanup                 | May register handlers | None                   |

### 5.2 Role Selection Flowchart

```
What is this code doing?
├─ Defining a CLI command → Command Module
├─ Executing business logic → Handler Function
├─ Validating arguments → Validator (.check())
├─ Formatting output → Output Formatter
├─ Handling errors → Error Handler
└─ Cleaning up on exit → Cleanup Handler
```

---

## 6. Interaction Patterns

### 6.1 Command Execution Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │  Yargs  │     │ Handler │     │ Output  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  1. Input     │               │               │
     │──────────────▶│               │               │
     │               │  2. Parse     │               │
     │               │──────────────▶│               │
     │               │               │  3. Execute   │
     │               │               │──────────────▶│
     │               │               │               │
     │               │               │  4. Format    │
     │               │               │◀──────────────│
     │               │  5. Result    │               │
     │               │◀──────────────│               │
     │  6. Display   │               │               │
     │◀──────────────│               │               │
```

**Steps**:

1. User enters command with arguments
2. Yargs parses arguments and validates
3. Handler executes business logic
4. Output formatter prepares display
5. Result returned to parser
6. Output displayed to user

### 6.2 Error Handling Flow

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Handler │     │  Error  │     │ Logger  │     │  Exit   │
│         │     │ Handler │     │         │     │         │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │  1. Throw     │               │               │
     │──────────────▶│               │               │
     │               │  2. Format    │               │
     │               │──────────────▶│               │
     │               │               │  3. Output    │
     │               │               │──────────────▶│
     │               │               │               │
     │               │  4. Exit code │               │
     │               │──────────────────────────────▶│
```

---

## 7. Anti-Patterns

### 7.1 Forbidden Patterns

| Anti-Pattern                    | Problem                          | Correct Pattern                        |
| ------------------------------- | -------------------------------- | -------------------------------------- |
| Inconsistent option naming      | `-autoUpdate` vs `--auto-update` | Always use kebab-case for long options |
| Direct `console.log` everywhere | No control over output format    | Use centralized logger                 |
| Swallowing errors               | Silent failures confuse users    | Always log errors before exit          |
| Exit without cleanup            | Resources leak, state corruption | Use `exitCli()` helper                 |
| Interactive prompts in scripts  | Blocks automation                | Check `process.stdin.isTTY`            |
| Deep command nesting            | `cli foo bar baz qux` confusing  | Max 2 levels: `cli group action`       |

### 7.2 Forbidden Dependencies

| From           | To                      | Why Forbidden                    |
| -------------- | ----------------------- | -------------------------------- |
| Command Module | Direct database         | Commands should use services     |
| Handler        | `process.exit` directly | Use cleanup wrapper              |
| Validator      | Async operations        | Validation should be synchronous |

### 7.3 Code Smell Examples

```typescript
// ANTI-PATTERN: Direct console.log
export const listCommand: CommandModule = {
  handler: async () => {
    const items = await getItems();
    console.log(items); // BAD: No format control
  },
};

// CORRECT PATTERN: Use logger
export const listCommand: CommandModule = {
  handler: async () => {
    const items = await getItems();
    logger.log(items.map(formatItem).join('\n'));
    await exitCli();
  },
};
```

```typescript
// ANTI-PATTERN: Exit without cleanup
export const deleteCommand: CommandModule = {
  handler: async () => {
    try {
      await deleteResource();
    } catch (error) {
      console.error(error);
      process.exit(1); // BAD: No cleanup
    }
  },
};

// CORRECT PATTERN: Use exit helper
export const deleteCommand: CommandModule = {
  handler: async () => {
    try {
      await deleteResource();
      await exitCli(0);
    } catch (error) {
      logger.error(getErrorMessage(error));
      await exitCli(1);
    }
  },
};
```

```typescript
// ANTI-PATTERN: Interactive prompt without TTY check
async function getApiKey(): Promise<string> {
  const response = await prompts({
    // BAD: Hangs in CI
    type: 'password',
    name: 'key',
    message: 'Enter API key:',
  });
  return response.key;
}

// CORRECT PATTERN: TTY check with flag fallback
async function getApiKey(providedKey?: string): Promise<string> {
  if (providedKey) {
    return providedKey;
  }

  if (!process.stdin.isTTY) {
    throw new Error('API key required. Use --api-key flag in non-interactive mode.');
  }

  const response = await prompts({
    type: 'password',
    name: 'key',
    message: 'Enter API key:',
  });

  if (!response.key) {
    throw new Error('API key is required.');
  }

  return response.key;
}
```

---

## 8. Decision Trees

### 8.1 Command Structure Decision

```
Does this action belong to an existing command group?
│
├─ Yes
│   └─ Add as subcommand to existing parent
│
└─ No
    │
    ├─ Will there be 3+ related commands?
    │   ├─ Yes → Create new parent command with subcommands
    │   └─ No → Create standalone command
    │
    └─ Is this a frequently-used utility?
        ├─ Yes → Consider making it a top-level command
        └─ No → Group under appropriate parent
```

### 8.2 Option Type Decision

```
What kind of value does this option accept?
│
├─ No value (flag) → type: 'boolean'
│
├─ Single value
│   ├─ From fixed set → choices: ['a', 'b', 'c']
│   ├─ Free text → type: 'string'
│   └─ Number → type: 'number'
│
├─ Multiple values
│   └─ type: 'array', string: true
│
└─ Required positional
    └─ Use <name> in command string
```

### 8.3 Output Format Decision

```
What is the user trying to do?
│
├─ Reading output manually → Text format (default)
│
├─ Piping to another tool → JSON format
│   └─ Provide --json flag
│
├─ Streaming long operation → Stream JSON
│   └─ Newline-delimited JSON events
│
└─ Logging/debugging → Text with colors
    └─ Respect NO_COLOR env var
```

---

## 9. Enforcement

### 9.1 Structural Validation

| Check               | Tool       | Configuration                |
| ------------------- | ---------- | ---------------------------- |
| Command file naming | ESLint     | File must match command name |
| Option naming       | ESLint     | kebab-case for long options  |
| Export structure    | TypeScript | CommandModule type           |
| Handler async       | ESLint     | All handlers must be async   |

### 9.2 Architecture Review Checklist

- [ ] Commands follow parent/subcommand pattern where appropriate
- [ ] All handlers use `exitCli()` for cleanup
- [ ] Options use correct types and validation
- [ ] Error messages are actionable
- [ ] Interactive prompts check for TTY
- [ ] Output uses centralized logger
- [ ] Exit codes are meaningful

### 9.3 Directory Structure Validation

```
Expected structure:
src/
├── commands/
│   ├── [parent].ts           # Parent command
│   ├── [parent]/
│   │   ├── [subcommand].ts   # Subcommand
│   │   └── [subcommand].test.ts
│   └── utils.ts              # Shared utilities
└── utils/
    ├── output.ts             # Logger, formatters
    ├── errors.ts             # Error handling
    └── cleanup.ts            # Exit cleanup
```

---

## 10. Exceptions

### 10.1 Valid Exception Scenarios

| Scenario                 | Justification                  | Documentation Required     |
| ------------------------ | ------------------------------ | -------------------------- |
| Legacy command naming    | Backward compatibility         | Deprecation notice in help |
| Direct `console.log`     | Performance-critical streaming | Comment explaining why     |
| Deep nesting (3+ levels) | Complex domain requires it     | Architecture review        |

### 10.2 Exception Documentation

```typescript
/**
 * CLI DESIGN EXCEPTION: STD-012 Section 7.1
 * Reason: Legacy command name preserved for backward compatibility.
 * Migration: Deprecated in v2.0, remove in v3.0.
 * Approved: 2025-01-15
 */
export const oldCommand: CommandModule = {
  command: 'oldname', // Should be 'new-name'
  deprecated: 'Use "new-name" instead.',
  // ...
};
```

---

## 11. Quick Reference

### 11.1 Pattern Selection Matrix

| Need                   | Pattern        | Example                       |
| ---------------------- | -------------- | ----------------------------- |
| Group related commands | Parent Command | `extensions <command>`        |
| Single action          | Subcommand     | `extensions install <source>` |
| User input             | Option         | `--scope user`                |
| Required input         | Positional     | `<name>`                      |
| Formatted output       | Output Pattern | `logger.log()`                |
| Clean exit             | Exit Pattern   | `await exitCli()`             |

### 11.2 Command Structure Quick Reference

| Element        | Convention    | Example                     |
| -------------- | ------------- | --------------------------- |
| Parent command | Plural noun   | `extensions`, `servers`     |
| Subcommand     | Verb          | `install`, `list`, `remove` |
| Long option    | kebab-case    | `--auto-update`             |
| Short option   | Single letter | `-f`, `-v`                  |
| Required arg   | `<name>`      | `<source>`                  |
| Optional arg   | `[name]`      | `[ref]`                     |
| Variadic       | `[args...]`   | `[args...]`                 |

### 11.3 Exit Code Quick Reference

| Code | Meaning              |
| ---- | -------------------- |
| 0    | Success              |
| 1    | General error        |
| 2    | Usage error          |
| 130  | Interrupted (Ctrl+C) |

---

## 12. Traceability

### 12.1 Pattern Index

| Pattern ID | Name                | Section | When to Use              |
| ---------- | ------------------- | ------- | ------------------------ |
| CLI-001    | Parent Command      | 4.1     | Grouping 3+ subcommands  |
| CLI-002    | Subcommand          | 4.2     | Single action in a group |
| CLI-003    | Option Definition   | 4.3     | All options and flags    |
| CLI-004    | Argument Validation | 4.4     | Complex validation       |
| CLI-005    | Output Formatting   | 4.5     | All user output          |
| CLI-006    | Exit Code           | 4.6     | All exits                |
| CLI-007    | Interactive Prompt  | 4.7     | User input collection    |
| CLI-008    | Error Display       | 4.8     | All error output         |

### 12.2 Related Standards

| Standard                      | Relationship                    |
| ----------------------------- | ------------------------------- |
| STD-001 Naming Conventions    | Command and option naming rules |
| STD-005 Architecture Patterns | Service layer used by handlers  |
| STD-006 Error Handling        | Error class definitions         |
| STD-007 Testing Standards     | Command testing patterns        |

---

## 13. Open Questions

| Question ID | Question                                       | Owner | Status  |
| ----------- | ---------------------------------------------- | ----- | ------- |
| SQ-001      | Should we support shell completion generation? | TBD   | Pending |
| SQ-002      | Standard for progress bar/spinner libraries?   | TBD   | Pending |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
