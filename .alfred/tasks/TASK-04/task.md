# TASK-04: Rename CLI to FloMaster + Add Workflow Command

## Summary

Rename the CLI from `opencode` to `flomaster` and add a `workflow` CLI command with subcommand structure (`workflow run`). This establishes FloMaster as a distinct product and provides end-to-end verification that the orchestrator integration works.

## Design Decisions (Finalized)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CLI name | `flomaster` | Distinct product, avoids conflict with global opencode |
| Command name | `workflow` | Matches noun-based naming convention, user mental model |
| Structure | Subcommands | Extensible pattern matching existing commands |
| Workflow location | `.flomaster/workflows/` | Consistent with new branding |
| Test workflow | Simple echo | Minimal verification first |

## Context

With TASK-01 through TASK-06 complete, the orchestrator is integrated with opencode's session system. This task:
1. Renames the CLI from `opencode` to `flomaster`
2. Adds a `workflow` command with `run` subcommand
3. Creates a simple hardcoded test workflow for verification
4. Displays workflow progress in the console

## Scope

### In Scope

- Rename CLI binary from `opencode` to `flomaster`
- Update script name and branding in index.ts
- Add `workflow` command with `run` subcommand
- Create hardcoded test workflow definition (echo workflow)
- Initialize WorkflowEngine with project directory
- Execute workflow and display progress events
- Handle basic error cases

### Out of Scope

- Workflow file loading from `.flomaster/workflows/` (future)
- `workflow list`, `workflow validate`, `workflow create` subcommands (future)
- UI integration (future)
- Full rebranding of all UI elements (future)

---

## CLI Usage

```bash
# Run the hardcoded test workflow with default prompt
flomaster workflow run

# Run with a custom prompt
flomaster workflow run "Explain what this codebase does"

# All existing opencode commands still work
flomaster run "Hello"
flomaster mcp list
flomaster auth login

# Future (not in this task):
# flomaster workflow run --file .flomaster/workflows/sdlc.json
# flomaster workflow list
```

---

## Implementation

### File Structure

```
packages/opencode/
├── package.json                           # Modify: bin entry
├── src/
│   ├── index.ts                           # Modify: scriptName, add WorkflowCommand
│   ├── cli/cmd/
│   │   └── workflow.ts                    # Create: workflow command
│   └── orchestrator/
│       ├── index.ts                       # Modify: ensure exports
│       └── workflows/
│           └── test-workflow.ts           # Create: test workflow
```

---

### Step 1: Rename CLI Binary

**File:** `packages/opencode/package.json`

Change the `bin` entry:

```json
"bin": {
  "flomaster": "./bin/opencode"
}
```

*(We keep the actual binary file as `bin/opencode` for now - just the command name changes)*

---

### Step 2: Update Script Name in index.ts

**File:** `packages/opencode/src/index.ts`

Change line 45:
```typescript
// Before
.scriptName("opencode")

// After
.scriptName("flomaster")
```

Add import at the top (with other imports):
```typescript
import { WorkflowCommand } from "./cli/cmd/workflow"
```

Add command registration (after line 101, with other `.command()` calls):
```typescript
.command(WorkflowCommand)
```

---

### Step 3: Create Test Workflow Definition

**File:** `packages/opencode/src/orchestrator/workflows/test-workflow.ts`

```typescript
import type { WorkflowData } from "../types.js"

/**
 * Simple echo workflow for testing the orchestrator integration.
 *
 * Flow: Input → Agent (echoes/responds to the input)
 */
export const testWorkflow: WorkflowData = {
  name: "test-workflow",
  description: "Simple test workflow that echoes input through an agent",
  nodes: [
    {
      id: "input-1",
      type: "genericNode",
      position: { x: 0, y: 0 },
      data: {
        id: "input-1",
        node: {
          displayName: "User Input",
          baseClasses: ["Input"],
          template: {
            prompt: { name: "prompt", type: "str", required: true },
          },
          outputs: [{ name: "prompt", types: ["string"] }],
        },
      },
    },
    {
      id: "agent-1",
      type: "genericNode",
      position: { x: 200, y: 0 },
      data: {
        id: "agent-1",
        node: {
          displayName: "AI Agent",
          baseClasses: ["Agent"],
          template: {
            prompt: { value: "{{input-1.prompt}}" },
          },
          outputs: [{ name: "response", types: ["string"] }],
        },
      },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "input-1",
      target: "agent-1",
      sourceHandle: "prompt",
      targetHandle: "prompt",
    },
  ],
}
```

---

### Step 4: Create Workflow Command

**File:** `packages/opencode/src/cli/cmd/workflow.ts`

```typescript
import type { Argv } from "yargs"
import { UI } from "../ui.js"
import { cmd } from "./cmd.js"
import { bootstrap } from "../bootstrap.js"
import { createWorkflowEngine } from "../../orchestrator/index.js"
import { testWorkflow } from "../../orchestrator/workflows/test-workflow.js"

/**
 * Workflow run subcommand
 */
const WorkflowRunCommand = cmd({
  command: "run [message..]",
  describe: "Run a workflow",
  builder: (yargs: Argv) => {
    return yargs
      .positional("message", {
        describe: "Initial prompt for the workflow",
        type: "string",
        array: true,
        default: [],
      })
      .option("dry-run", {
        describe: "Validate workflow without executing",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args) => {
    const message = args.message.length > 0
      ? args.message.join(" ")
      : "Hello! This is a test of the FloMaster workflow orchestrator."

    await bootstrap(process.cwd(), async () => {
      UI.println()
      UI.println(UI.Style.TEXT_INFO_BOLD + "◆ " + UI.Style.TEXT_NORMAL + "Starting workflow...")
      UI.println()

      const engine = createWorkflowEngine({
        directory: process.cwd(),
      })

      // Subscribe to workflow events
      const unsubscribe = engine.subscribe((event) => {
        switch (event.type) {
          case "WORKFLOW_STARTED":
            UI.println(
              UI.Style.TEXT_SUCCESS_BOLD + "│ " +
              UI.Style.TEXT_NORMAL + "Workflow started: " +
              UI.Style.TEXT_DIM + event.data.executionId
            )
            break

          case "STEP_STARTED":
            UI.println(
              UI.Style.TEXT_INFO_BOLD + "│ " +
              UI.Style.TEXT_NORMAL + "  Step started: " +
              UI.Style.TEXT_HIGHLIGHT_BOLD + event.data.stepId
            )
            break

          case "STEP_COMPLETED":
            UI.println(
              UI.Style.TEXT_SUCCESS_BOLD + "│ " +
              UI.Style.TEXT_NORMAL + "  Step completed: " +
              UI.Style.TEXT_HIGHLIGHT_BOLD + event.data.stepId
            )
            break

          case "STEP_FAILED":
            UI.println(
              UI.Style.TEXT_DANGER_BOLD + "│ " +
              UI.Style.TEXT_NORMAL + "  Step failed: " +
              event.data.stepId + " - " + event.data.error
            )
            break

          case "WORKFLOW_COMPLETED":
            UI.println(
              UI.Style.TEXT_SUCCESS_BOLD + "│ " +
              UI.Style.TEXT_NORMAL + "Workflow completed!"
            )
            break

          case "WORKFLOW_FAILED":
            UI.println(
              UI.Style.TEXT_DANGER_BOLD + "│ " +
              UI.Style.TEXT_NORMAL + "Workflow failed: " + event.data.error
            )
            break
        }
      })

      try {
        // Execute the workflow
        const result = await engine.executeWorkflow(testWorkflow, {
          inputs: { prompt: message },
          dryRun: args.dryRun,
        })

        UI.println()

        if (result.status === "completed") {
          // Extract and display the agent's response
          const agentOutput = result.outputs?.["agent-1"]
          if (agentOutput?.response) {
            UI.println(UI.Style.TEXT_INFO_BOLD + "◆ " + UI.Style.TEXT_NORMAL + "Agent Response:")
            UI.println()
            UI.println(UI.markdown(String(agentOutput.response)))
          }
        } else if (result.status === "failed") {
          UI.error(`Workflow failed: ${result.error}`)
          process.exit(1)
        }
      } finally {
        unsubscribe()
      }
    })
  },
})

/**
 * Main workflow command with subcommands
 */
export const WorkflowCommand = cmd({
  command: "workflow",
  describe: "Workflow orchestration commands",
  builder: (yargs: Argv) => {
    return yargs
      .command(WorkflowRunCommand)
      .demandCommand(1, "You must specify a subcommand (e.g., 'run')")
  },
  handler: () => {
    // This handler is called if no subcommand is provided
    // demandCommand above ensures we always have a subcommand
  },
})
```

---

### Step 5: Export from Orchestrator Index

**File:** `packages/opencode/src/orchestrator/index.ts`

Ensure these exports exist (may already be done in TASK-01):
```typescript
export { createWorkflowEngine } from "./engine/factory.js"
export type { WorkflowEngine } from "./engine/workflowEngine.js"
```

---

## Success Criteria

### Automated Verification

- [ ] TypeScript compiles without errors: `bun turbo typecheck`
- [ ] `bun dev --help` shows `flomaster` as script name
- [ ] `bun dev workflow` shows help with available subcommands
- [ ] `bun dev workflow run` executes without crashing

### Manual Verification

- [ ] Workflow events display in console (STARTED, STEP_STARTED, STEP_COMPLETED, COMPLETED)
- [ ] Agent step produces an AI response
- [ ] Response is displayed with markdown formatting
- [ ] `--dry-run` flag validates without executing
- [ ] Errors are handled gracefully with informative messages
- [ ] All existing commands still work (`bun dev run "hello"`)

---

## Verification Commands

```bash
# From packages/opencode directory:

# Build/typecheck
bun turbo typecheck

# Test the CLI name changed
bun dev --help
# Should show "flomaster" in the usage line

# Test workflow command exists
bun dev workflow --help

# Run test workflow
bun dev workflow run

# Run with custom prompt
bun dev workflow run "What is 2 + 2?"

# Dry run (validate only)
bun dev workflow run --dry-run

# Verify existing commands still work
bun dev run "Hello, are you working?"
```

---

## Dependencies

- TASK-01: Orchestrator files copied ✅
- TASK-02: Imports fixed ✅
- TASK-03: Initial session integration ✅
- TASK-06: Refined session integration ✅

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Change bin entry from `opencode` to `flomaster` |
| `src/index.ts` | Modify | Change scriptName to `flomaster`, add WorkflowCommand |
| `src/cli/cmd/workflow.ts` | Create | New workflow command with run subcommand |
| `src/orchestrator/workflows/test-workflow.ts` | Create | Hardcoded test workflow |
| `src/orchestrator/index.ts` | Modify | Ensure createWorkflowEngine exported |

---

## Implementation Order

1. **Modify `package.json`** - Change bin entry
2. **Modify `src/index.ts`** - Change scriptName, add import and command
3. **Create `src/orchestrator/workflows/test-workflow.ts`** - Test workflow definition
4. **Create `src/cli/cmd/workflow.ts`** - Workflow command
5. **Verify `src/orchestrator/index.ts`** - Ensure exports exist
6. **Run `bun turbo typecheck`** - Verify compilation
7. **Test with `bun dev workflow run`** - End-to-end verification

---

## Notes

### Development vs Production

During development, use:
```bash
cd packages/opencode
bun dev workflow run
```

After building/installing, users will use:
```bash
flomaster workflow run
```

### Future Enhancements (Not in this task)

1. **Full rebranding**: Update logo, help text, environment variables
2. **`workflow run --file`**: Load workflow from `.flomaster/workflows/`
3. **`workflow list`**: List available workflows
4. **`workflow validate`**: Validate workflow JSON
5. **`workflow create`**: Interactive workflow creator
6. **Streaming output**: Show agent responses as they stream

### Backward Compatibility

All existing opencode functionality remains intact:
- `flomaster run` = same as `opencode run`
- `flomaster mcp` = same as `opencode mcp`
- etc.

The only change is the command name from `opencode` to `flomaster`.
