# TASK-05: Add CLI Command and Hardcoded Test Workflow

## Overview

Add a `flomaster` CLI command to opencode that executes a hardcoded test workflow. This provides end-to-end verification that the orchestrator integration works correctly.

## Current State Analysis

### OpenCode CLI Structure

From research, opencode CLI uses:
- **yargs** for command parsing
- **cmd()** helper for type-safe command definitions
- **@clack/prompts** for interactive UI
- **UI namespace** for styled output
- **Instance.provide()** for project context

### Example Command Pattern

```typescript
import { cmd } from "./cmd.js"
import { UI } from "../ui.js"
import * as prompts from "@clack/prompts"

export const MyCommand = cmd({
  command: "mycommand",
  describe: "description here",
  builder: (yargs) => yargs.option("flag", { type: "boolean" }),
  async handler(args) {
    await Instance.provide({
      directory: process.cwd(),
      async fn() {
        // Command logic
      }
    })
  }
})
```

### Key Discoveries

- Commands registered in `src/index.ts` via `.command(MyCommand)`
- `UI.println()` for styled output
- `prompts.spinner()` for progress indication
- `Instance.provide()` required for session operations

## Desired End State

After completion:
1. `opencode flomaster` command exists
2. Hardcoded 2-step workflow executes
3. Progress displayed in terminal
4. Agent produces response
5. Clean completion/error handling

## What We're NOT Doing

- Workflow configuration files
- Workflow selection/listing UI
- Persistence of results
- Multiple concurrent workflows
- Full TUI integration

## Implementation Approach

Create a minimal CLI command that:
1. Initializes WorkflowEngine with AgentAdapter
2. Loads a hardcoded test workflow
3. Subscribes to events for console output
4. Executes workflow and displays progress
5. Reports completion or error

---

## Phase 1: Create Test Workflow Definition

### Overview

Create a simple hardcoded workflow that can be used for testing.

### Changes Required

#### 1. Create Workflows Directory

```bash
mkdir -p packages/opencode/src/orchestrator/workflows
```

#### 2. Create Test Workflow

**File:** `packages/opencode/src/orchestrator/workflows/test-workflow.ts`

```typescript
/**
 * Test Workflow - Simple 2-step workflow for integration testing
 *
 * Input → Agent
 *
 * This workflow:
 * 1. Takes user input
 * 2. Sends to an agent for processing
 * 3. Returns the response
 */

import type { WorkflowData } from '../types.js';

/**
 * A simple test workflow with Input → Agent steps.
 */
export const testWorkflow: WorkflowData = {
  name: 'test-workflow',
  description: 'Simple test workflow for FloMaster integration verification',
  nodes: [
    {
      id: 'input-1',
      type: 'genericNode',
      position: { x: 0, y: 0 },
      data: {
        id: 'input-1',
        node: {
          displayName: 'User Input',
          baseClasses: ['Input'],
          template: {
            prompt: {
              name: 'prompt',
              type: 'str',
              required: true,
              value: '',
            },
          },
          outputs: [{ name: 'prompt', types: ['string'] }],
        },
      },
    },
    {
      id: 'agent-1',
      type: 'genericNode',
      position: { x: 300, y: 0 },
      data: {
        id: 'agent-1',
        node: {
          displayName: 'AI Agent',
          baseClasses: ['Agent'],
          template: {
            prompt: {
              name: 'prompt',
              type: 'str',
              required: true,
              value: '{{input-1.prompt}}',
            },
            agentType: {
              name: 'agentType',
              type: 'str',
              value: 'build',
            },
          },
          outputs: [{ name: 'response', types: ['string'] }],
        },
      },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'input-1',
      target: 'agent-1',
      sourceHandle: 'prompt',
      targetHandle: 'prompt',
    },
  ],
};

/**
 * Create a test workflow with custom input.
 */
export function createTestWorkflow(input: string): {
  workflow: WorkflowData;
  inputs: Record<string, unknown>;
} {
  // Clone and set the input value
  const workflow = JSON.parse(JSON.stringify(testWorkflow)) as WorkflowData;
  const inputNode = workflow.nodes.find((n) => n.id === 'input-1');
  if (inputNode?.data?.node?.template?.prompt) {
    inputNode.data.node.template.prompt.value = input;
  }

  return {
    workflow,
    inputs: {
      'input-1': { prompt: input },
    },
  };
}
```

### Success Criteria

- [ ] Workflow file exists
- [ ] Exports `testWorkflow` and `createTestWorkflow`
- [ ] No TypeScript errors

---

## Phase 2: Create FloMaster CLI Command

### Overview

Create the main CLI command for running workflows.

### Changes Required

#### 1. Create Command File

**File:** `packages/opencode/src/cli/cmd/flomaster.ts`

```typescript
/**
 * FloMaster CLI Command
 *
 * Run FloMaster workflow orchestrator.
 */

import * as prompts from '@clack/prompts';
import type { Argv } from 'yargs';

import { Instance } from '../../project/instance.js';
import { InstanceBootstrap } from '../bootstrap.js';
import { cmd } from './cmd.js';
import { UI } from '../ui.js';

// Orchestrator imports
import { createAgentAdapter } from '../../orchestrator/adapter/index.js';
import { createWorkflowEngine } from '../../orchestrator/engine/factory.js';
import { StepExecutorRegistry } from '../../orchestrator/registry/stepExecutorRegistry.js';
import { createTestWorkflow } from '../../orchestrator/workflows/test-workflow.js';
import type { WorkflowEvent } from '../../orchestrator/types.js';

/**
 * FloMaster command - run workflow orchestrator
 */
export const FloMasterCommand = cmd({
  command: 'flomaster [message]',
  describe: 'Run FloMaster workflow orchestrator',

  builder: (yargs: Argv) => {
    return yargs
      .positional('message', {
        describe: 'Message to send to the workflow',
        type: 'string',
      })
      .option('dry-run', {
        describe: 'Run workflow without executing agent steps',
        type: 'boolean',
        default: false,
      })
      .example('$0 flomaster', 'Run with interactive prompt')
      .example('$0 flomaster "Hello world"', 'Run with message')
      .example('$0 flomaster --dry-run', 'Test workflow without AI');
  },

  async handler(args) {
    const directory = process.cwd();

    await Instance.provide({
      directory,
      init: InstanceBootstrap,
      async fn() {
        prompts.intro(UI.Style.TEXT_HIGHLIGHT + 'FloMaster Workflow Engine' + UI.Style.TEXT_NORMAL);

        // Get message from args or prompt
        let message = args.message;
        if (!message) {
          const input = await prompts.text({
            message: 'Enter your message:',
            placeholder: 'Hello, FloMaster!',
            validate: (value) => {
              if (!value || value.trim().length === 0) {
                return 'Message is required';
              }
            },
          });

          if (prompts.isCancel(input)) {
            prompts.cancel('Cancelled');
            process.exit(0);
          }

          message = input as string;
        }

        prompts.log.info(`Running test workflow with message: "${message}"`);

        try {
          // Create adapter and registry
          const adapter = createAgentAdapter({ directory });

          const registry = new StepExecutorRegistry();
          await registry.initialize({ adapter });

          // Create workflow engine
          const engine = createWorkflowEngine({
            registry,
            snapshotDir: '.flomaster/snapshots',
          });

          // Create test workflow with input
          const { workflow, inputs } = createTestWorkflow(message);

          // Subscribe to events for progress display
          const spinner = prompts.spinner();
          let currentStep = '';

          const unsubscribe = engine.subscribe((event: WorkflowEvent) => {
            switch (event.type) {
              case 'WORKFLOW_STARTED':
                spinner.start('Workflow started...');
                break;

              case 'STEP_STARTED':
                currentStep = event.stepId ?? 'unknown';
                spinner.message(`Running step: ${currentStep}`);
                break;

              case 'STEP_COMPLETED':
                prompts.log.success(`Step completed: ${event.stepId}`);
                break;

              case 'STEP_FAILED':
                prompts.log.error(`Step failed: ${event.stepId} - ${event.error}`);
                break;

              case 'WORKFLOW_COMPLETED':
                spinner.stop('Workflow completed!');
                break;

              case 'WORKFLOW_FAILED':
                spinner.stop('Workflow failed');
                break;
            }
          });

          try {
            // Execute workflow
            const result = await engine.executeWorkflow(workflow, {
              taskId: 'flomaster-test',
              dryRun: args['dry-run'],
              inputs,
              timeout: 300000, // 5 minutes
            });

            // Display result
            if (result.status === 'completed') {
              prompts.log.success('Workflow completed successfully!');

              // Show agent response if available
              const agentOutput = result.outputs?.['agent-1'];
              if (agentOutput?.response) {
                UI.println();
                UI.println(UI.Style.TEXT_HIGHLIGHT + '--- Agent Response ---' + UI.Style.TEXT_NORMAL);
                UI.println(agentOutput.response as string);
                UI.println(UI.Style.TEXT_HIGHLIGHT + '----------------------' + UI.Style.TEXT_NORMAL);
              }
            } else {
              prompts.log.error(`Workflow ended with status: ${result.status}`);
              if (result.error) {
                prompts.log.error(`Error: ${result.error}`);
              }
            }
          } finally {
            unsubscribe();
          }
        } catch (error) {
          prompts.log.error(`Failed to execute workflow: ${error instanceof Error ? error.message : String(error)}`);
          process.exit(1);
        }

        prompts.outro('Done');
      },
    });
  },
});
```

### Success Criteria

- [ ] Command file exists
- [ ] Exports `FloMasterCommand`
- [ ] No TypeScript errors

---

## Phase 3: Register Command in CLI

### Overview

Add the FloMaster command to the main CLI entry point.

### Changes Required

#### 1. Import Command

**File:** `packages/opencode/src/index.ts`

Add import near other command imports (around line 30):

```typescript
import { FloMasterCommand } from './cli/cmd/flomaster.js';
```

#### 2. Register Command

In the yargs chain (around line 81-101), add:

```typescript
.command(FloMasterCommand)
```

Place it alphabetically among the other commands.

### Success Criteria

- [ ] FloMasterCommand imported in index.ts
- [ ] Command registered in yargs chain
- [ ] `opencode flomaster --help` shows command

---

## Phase 4: Update Orchestrator Barrel Export

### Overview

Ensure all necessary orchestrator exports are available.

### Changes Required

#### 1. Export Workflow Factory

**File:** `packages/opencode/src/orchestrator/index.ts`

Ensure these are exported:

```typescript
// Engine
export { createWorkflowEngine, DefaultWorkflowEngine } from './engine/workflowEngine.js';
export { WorkflowEngineFactory } from './engine/factory.js';

// Registry
export { StepExecutorRegistry } from './registry/stepExecutorRegistry.js';

// Adapter
export * from './adapter/index.js';

// Types
export * from './types.js';

// Workflows
export { testWorkflow, createTestWorkflow } from './workflows/test-workflow.js';
```

### Success Criteria

- [ ] All necessary exports available
- [ ] No import errors in flomaster.ts

---

## Phase 5: Test the Command

### Overview

Verify the command works end-to-end.

### Test Commands

```bash
cd /Users/fahadkaleem/Documents/Workspace/flomaster-opencode

# Build if necessary
bun run build

# Test help
bun run packages/opencode/src/index.ts flomaster --help

# Test dry-run (no AI calls)
bun run packages/opencode/src/index.ts flomaster --dry-run "Hello, test!"

# Test with actual AI (requires provider configured)
bun run packages/opencode/src/index.ts flomaster "What is 2+2?"
```

### Success Criteria

#### Automated Verification

- [ ] `--help` shows command documentation
- [ ] `--dry-run` completes without errors
- [ ] Workflow events display in terminal

#### Manual Verification

- [ ] Interactive prompt works when no message provided
- [ ] Agent step produces response (with configured provider)
- [ ] Error handling works for missing config
- [ ] Ctrl+C cancels gracefully

---

## Phase 6: Add Basic Error Handling

### Overview

Ensure the command handles common error scenarios gracefully.

### Error Scenarios to Handle

1. **No provider configured**
   - Check if providers are available
   - Show helpful message

2. **Workflow execution timeout**
   - Default 5 minute timeout
   - Show timeout message

3. **Agent step failure**
   - Capture and display error
   - Don't crash the CLI

### Changes Required

Add error handling in the command handler (already partially included in Phase 2):

```typescript
// Check for provider availability
const providers = await Provider.list();
if (providers.length === 0) {
  prompts.log.warn('No AI providers configured. Run: opencode auth login');
  if (!args['dry-run']) {
    process.exit(1);
  }
}
```

### Success Criteria

- [ ] Helpful error for missing provider
- [ ] Timeout message for long-running workflows
- [ ] Graceful error display

---

## Testing Strategy

### Manual Testing Steps

1. **Test help output:**
   ```bash
   opencode flomaster --help
   ```
   Expected: Shows command description and options

2. **Test dry-run:**
   ```bash
   opencode flomaster --dry-run "Test message"
   ```
   Expected: Workflow completes with mock response

3. **Test interactive:**
   ```bash
   opencode flomaster
   ```
   Expected: Prompts for message, executes workflow

4. **Test with message:**
   ```bash
   opencode flomaster "What is the capital of France?"
   ```
   Expected: Agent responds with answer

5. **Test cancellation:**
   Press Ctrl+C during execution
   Expected: Graceful cancellation, clean exit

---

## Rollback Procedure

If something goes wrong:

```bash
# Remove command file
rm packages/opencode/src/cli/cmd/flomaster.ts

# Remove workflow file
rm packages/opencode/src/orchestrator/workflows/test-workflow.ts

# Revert index.ts changes
git checkout packages/opencode/src/index.ts

# Revert orchestrator index changes
git checkout packages/opencode/src/orchestrator/index.ts
```

---

## Files Created/Modified Summary

| File | Type | Description |
|------|------|-------------|
| `cli/cmd/flomaster.ts` | **NEW** | CLI command implementation |
| `orchestrator/workflows/test-workflow.ts` | **NEW** | Hardcoded test workflow |
| `index.ts` | Modified | Register FloMasterCommand |
| `orchestrator/index.ts` | Modified | Export workflow and factory |

---

## Command Reference

After completion, these commands will be available:

```bash
# Show help
opencode flomaster --help

# Interactive mode (prompts for message)
opencode flomaster

# With message
opencode flomaster "Your message here"

# Dry run (no AI calls, tests workflow execution)
opencode flomaster --dry-run "Test"

# With message and dry run
opencode flomaster --dry-run "Test without AI"
```

---

## Future Enhancements (Not in Scope)

For reference, future tasks could add:

1. **Workflow configuration**: Load from `.flomaster/workflows/`
2. **Workflow listing**: `opencode flomaster list`
3. **Workflow selection**: `opencode flomaster run <name>`
4. **Parallel execution**: Multiple workflows
5. **TUI integration**: Visual workflow progress
6. **Result persistence**: Save outputs to files

---

## References

- OpenCode CLI: `packages/opencode/src/index.ts`
- Command pattern: `packages/opencode/src/cli/cmd/models.ts`
- UI utilities: `packages/opencode/src/cli/ui.ts`
- @clack/prompts: https://github.com/natemoo-re/clack
- Task definition: `.alfred/tasks/TASK-05/task.md`
