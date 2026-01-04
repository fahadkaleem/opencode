# TASK-09: Self-Contained FloMaster Module + State Management

## Overview

Restructure all FloMaster-specific code into a self-contained `src/flomaster/` folder, then port the StateManager from flomaster-prototype. This enables clean upstream merges from OpenCode and adds workflow state persistence.

## Motivation

1. **Upstream Mergeability**: All FloMaster changes in one folder = easy `git merge` from OpenCode main
2. **Clear Boundaries**: Obvious separation between OpenCode core and FloMaster additions
3. **State Persistence**: Enable workflow resume, step output inspection, crash recovery

## Current Structure (Before)

```
packages/opencode/src/
├── orchestrator/              ← FloMaster (scattered)
│   ├── engine/
│   ├── machine/
│   ├── parser/
│   ├── registry/
│   ├── workflows/
│   └── utils/
├── cli/cmd/
│   ├── workflow.ts            ← FloMaster (in OpenCode's CLI)
│   └── ... (OpenCode commands)
├── session/                   ← OpenCode core
├── agent/                     ← OpenCode core
└── ...
```

## Target Structure (After)

```
packages/opencode/src/
├── flomaster/                 ← ALL FloMaster code here
│   ├── orchestrator/          ← Moved from src/orchestrator/
│   │   ├── engine/
│   │   │   ├── workflowEngine.ts
│   │   │   └── factory.ts
│   │   ├── machine/
│   │   │   ├── workflowMachine.ts
│   │   │   ├── actions.ts
│   │   │   └── guards.ts
│   │   ├── parser/
│   │   │   ├── workflowParser.ts
│   │   │   └── topology.ts
│   │   ├── registry/
│   │   │   ├── stepExecutorRegistry.ts
│   │   │   ├── types.ts
│   │   │   └── executors/
│   │   │       ├── agentExecutor.ts
│   │   │       ├── conditionalExecutor.ts
│   │   │       ├── loopExecutor.ts
│   │   │       └── subflowExecutor.ts
│   │   ├── workflows/
│   │   │   ├── test-workflow.ts
│   │   │   ├── research-workflow.ts
│   │   │   └── sdlc-workflow.ts
│   │   ├── actors/
│   │   ├── utils/
│   │   └── types.ts
│   │
│   ├── state/                 ← NEW: Ported from prototype
│   │   ├── stateManager.ts
│   │   ├── types.ts
│   │   ├── defaults.ts
│   │   └── internal/
│   │       ├── fileUtils.ts
│   │       ├── lockManager.ts
│   │       └── validation.ts
│   │
│   ├── cli/                   ← Workflow CLI commands
│   │   └── workflow.ts        ← Moved from src/cli/cmd/workflow.ts
│   │
│   └── index.ts               ← Public exports
│
├── cli/cmd/
│   └── index.ts               ← Minimal change: import flomaster/cli
├── session/                   ← OpenCode core (untouched)
├── agent/                     ← OpenCode core (untouched)
└── ...
```

## Phase 1: Restructure to flomaster/ Folder

### Step 1.1: Create flomaster directory structure

```bash
mkdir -p packages/opencode/src/flomaster/{orchestrator,state,cli}
```

### Step 1.2: Move orchestrator files

```bash
# Move entire orchestrator directory
mv packages/opencode/src/orchestrator/* packages/opencode/src/flomaster/orchestrator/
rmdir packages/opencode/src/orchestrator
```

### Step 1.3: Move workflow CLI command

```bash
mv packages/opencode/src/cli/cmd/workflow.ts packages/opencode/src/flomaster/cli/workflow.ts
```

### Step 1.4: Create flomaster/index.ts

```typescript
// packages/opencode/src/flomaster/index.ts
export * from "./orchestrator/index.js"
export * from "./state/index.js"
export { WorkflowCommand } from "./cli/workflow.js"
```

### Step 1.5: Update all imports

Files that import from `../../orchestrator/` or `../orchestrator/` need updating:

| File | Old Import | New Import |
|------|------------|------------|
| `src/cli/cmd/workflow.ts` → now at `src/flomaster/cli/workflow.ts` | `../../orchestrator/...` | `../orchestrator/...` |
| Any test files | `../orchestrator/...` | `../flomaster/orchestrator/...` |

### Step 1.6: Update CLI to import from flomaster

```typescript
// packages/opencode/src/cli/cmd/index.ts
// Add this import:
import { WorkflowCommand } from "../../flomaster/cli/workflow.js"

// Add to commands array:
.command(WorkflowCommand)
```

### Step 1.7: Verification After Restructure

**STOP HERE AND VERIFY** before proceeding to Phase 2.

```bash
cd packages/opencode

# 1. TypeScript must compile
bun turbo typecheck
# Expected: "Tasks: X successful, X total" - NO ERRORS

# 2. Test simple workflow
bun dev workflow run --workflow test --dry-run "Hello"
# Expected:
#   - "Workflow started..."
#   - "Step started: User Input"
#   - "Step started: AI Agent"
#   - "Workflow completed!"
#   - "[DRY-RUN] Agent AI Agent (build) would execute"

# 3. Test SDLC workflow with all 4 agents
bun dev workflow run --workflow sdlc --dry-run "Test task"
# Expected:
#   - Step started: User Input
#   - Step started: Research
#   - Step started: Plan
#   - Step started: Implement
#   - Step started: Review
#   - Workflow completed!
#   - "[DRY-RUN] Agent Review (review-agent) would execute"

# 4. Test research workflow specifically
bun dev workflow run --workflow research --dry-run "Find files"
# Expected:
#   - Step started: Research Agent
#   - Workflow completed!
#   - "[DRY-RUN] Agent Research Agent (research-agent) would execute"

# 5. Verify help shows workflow command
bun dev workflow --help
# Expected: Shows "run [message..]" subcommand
```

### Step 1.8: Verify Import Paths Are Correct

```bash
# Check no broken imports remain
grep -r "from.*orchestrator" packages/opencode/src --include="*.ts" | grep -v flomaster | grep -v node_modules
# Expected: No output (all orchestrator imports should be via flomaster/)

# Check flomaster imports are used
grep -r "from.*flomaster" packages/opencode/src --include="*.ts" | head -5
# Expected: Shows imports from flomaster/ in cli/cmd/index.ts
```

### Phase 1 Complete Checklist

- [ ] `src/flomaster/` directory exists with orchestrator/, cli/ subdirectories
- [ ] `src/orchestrator/` directory is removed (no longer exists)
- [ ] `src/cli/cmd/workflow.ts` is removed (moved to flomaster/cli/)
- [ ] `bun turbo typecheck` passes with no errors
- [ ] All 3 workflows work in dry-run mode (test, research, sdlc)
- [ ] No broken import errors

**Only proceed to Phase 2 after all checks pass.**

---

## Phase 2: Port StateManager from Prototype

### Step 2.1: Copy state files from prototype

Source: `flomaster-prototype/packages/core/src/state/`

```bash
# Copy main files
cp flomaster-prototype/packages/core/src/state/stateManager.ts \
   packages/opencode/src/flomaster/state/stateManager.ts

cp flomaster-prototype/packages/core/src/state/types.ts \
   packages/opencode/src/flomaster/state/types.ts

cp flomaster-prototype/packages/core/src/state/defaults.ts \
   packages/opencode/src/flomaster/state/defaults.ts

# Copy internal utilities
mkdir -p packages/opencode/src/flomaster/state/internal
cp flomaster-prototype/packages/core/src/state/internal/*.ts \
   packages/opencode/src/flomaster/state/internal/
```

### Step 2.2: Replace SDK client calls with direct Session calls

The prototype uses `this.sdkClient.session.*` which needs to become direct `Session.*` calls:

| Prototype (SDK Client) | OpenCode (Direct) |
|------------------------|-------------------|
| `this.sdkClient.session.get({ path: { id } })` | `Session.get(id)` |
| `this.sdkClient.session.messages({ path: { id } })` | `Message.list({ sessionID: id })` |
| `this.sdkClient.session.children({ path: { id } })` | `Session.list({ parentID: id })` |

Update these methods in `stateManager.ts`:
- `getSessionDetails()`
- `getSessionMessages()`
- `getSessionChildren()`

### Step 2.3: Update imports in stateManager.ts

```typescript
// Remove SDK import
// import type { OpencodeClient } from '...'

// Add direct imports
import { Session } from "../../session/index.js"
import { Message } from "../../session/message.js"
```

### Step 2.4: Remove SDK client from constructor

```typescript
// Before (prototype):
constructor(
  private readonly sdkClient: OpencodeClient,
  config?: StateManagerConfig,
)

// After (opencode):
constructor(config?: StateManagerConfig)
```

### Step 2.5: Create state/index.ts

```typescript
// packages/opencode/src/flomaster/state/index.ts
export { DefaultStateManager, createStateManager } from "./stateManager.js"
export type { StateManager, StateManagerConfig } from "./stateManager.js"
export * from "./types.js"
```

### Step 2.6: Integrate StateManager with WorkflowEngine

Update `flomaster/orchestrator/engine/factory.ts`:

```typescript
import { createStateManager } from "../../state/index.js"

export async function createWorkflowEngine(options: WorkflowEngineOptions) {
  // Create state manager
  const stateManager = await createStateManager({
    executionsDir: path.join(options.directory, '.flomaster/executions'),
    checkpointOnStepComplete: true,
  })

  // ... rest of engine creation

  return { engine, stateManager }
}
```

### Step 2.7: Verification After StateManager Integration

**STOP HERE AND VERIFY** before proceeding to Phase 3.

```bash
cd packages/opencode

# 1. TypeScript must still compile
bun turbo typecheck
# Expected: "Tasks: X successful, X total" - NO ERRORS

# 2. Dry-run still works (regression test)
bun dev workflow run --workflow sdlc --dry-run "Test with state manager"
# Expected: Workflow completes as before

# 3. Run a REAL workflow (this will make API calls and create state)
bun dev workflow run --workflow test "Hello, verify state persistence"
# Expected:
#   - Workflow executes with real LLM response
#   - Workflow completed!
#   - Shows actual agent response (not dry-run)

# 4. Verify state files were created
ls -la .flomaster/executions/
# Expected: At least one execution directory (exec-XXXXX-XXXXX)

# Get the execution ID from the directory listing
EXEC_ID=$(ls .flomaster/executions/ | head -1)
echo "Execution ID: $EXEC_ID"

# 5. Verify all state files exist
ls -la .flomaster/executions/$EXEC_ID/
# Expected files:
#   - state.json
#   - context.json
#   - mapping.json
#   - checkpoint.json (if checkpointOnStepComplete is true)

# 6. Verify state.json has correct structure
cat .flomaster/executions/$EXEC_ID/state.json | jq '{status, stepStatuses}'
# Expected:
#   {
#     "status": "completed",
#     "stepStatuses": {
#       "input-1": "completed",
#       "agent-1": "completed"
#     }
#   }

# 7. Verify context.json has step outputs
cat .flomaster/executions/$EXEC_ID/context.json | jq 'keys'
# Expected: ["agent-1", "input-1"] (or similar step IDs)

# 8. Verify mapping.json has session mappings
cat .flomaster/executions/$EXEC_ID/mapping.json | jq .
# Expected: { "agent-1": "session_XXXXX" }
```

### Phase 2 Complete Checklist

- [ ] `src/flomaster/state/` directory exists with stateManager.ts, types.ts, etc.
- [ ] `bun turbo typecheck` passes with no errors
- [ ] Dry-run workflows still work (regression)
- [ ] Real workflow creates `.flomaster/executions/{id}/` directory
- [ ] `state.json` shows correct execution status
- [ ] `context.json` contains step outputs
- [ ] `mapping.json` contains step-to-session mappings

**Only proceed to Phase 3 after all checks pass.**

---

## Phase 3: Add CLI Commands for State Inspection

### Step 3.1: Add workflow list command

```typescript
// flomaster/cli/workflow.ts - Add subcommand

const WorkflowListCommand = cmd({
  command: "list",
  describe: "List workflow executions",
  handler: async () => {
    const stateManager = await getStateManager()
    const executions = await stateManager.listExecutions()
    // Display table of executions
  },
})
```

### Step 3.2: Add workflow inspect command

```typescript
const WorkflowInspectCommand = cmd({
  command: "inspect <executionId>",
  describe: "Inspect a workflow execution",
  handler: async (args) => {
    const stateManager = await getStateManager()
    const execution = await stateManager.getExecution(args.executionId)
    const context = await stateManager.getContext(args.executionId)
    // Display execution details and step outputs
  },
})
```

### Step 3.3: Add workflow resume command

```typescript
const WorkflowResumeCommand = cmd({
  command: "resume <executionId>",
  describe: "Resume a failed/incomplete workflow",
  handler: async (args) => {
    // Load checkpoint and resume
  },
})
```

## Files Changed Summary

### Moved Files

| From | To |
|------|-----|
| `src/orchestrator/**` | `src/flomaster/orchestrator/**` |
| `src/cli/cmd/workflow.ts` | `src/flomaster/cli/workflow.ts` |

### New Files

| File | Purpose |
|------|---------|
| `src/flomaster/index.ts` | Public exports |
| `src/flomaster/state/stateManager.ts` | Workflow state persistence |
| `src/flomaster/state/types.ts` | State types |
| `src/flomaster/state/defaults.ts` | Constants |
| `src/flomaster/state/internal/*.ts` | Utilities |

### Modified Files

| File | Change |
|------|--------|
| `src/cli/cmd/index.ts` | Import WorkflowCommand from flomaster |
| `src/flomaster/orchestrator/engine/factory.ts` | Integrate StateManager |

## End-to-End Testing Instructions

Run these tests after completing all phases to verify everything works correctly.

### Test 1: Basic Compilation & Dry-Run

```bash
cd packages/opencode

# 1. Verify TypeScript compiles
bun turbo typecheck
# Expected: "Tasks: X successful, X total"

# 2. Test dry-run (no API calls)
bun dev workflow run --workflow test --dry-run "Hello"
# Expected: "Workflow completed!" with "[DRY-RUN] Agent..."

bun dev workflow run --workflow sdlc --dry-run "Test task"
# Expected: All 4 steps complete (Research, Plan, Implement, Review)
```

### Test 2: Real Workflow Execution with State Persistence

```bash
cd packages/opencode

# 1. Run a real workflow (will make API calls)
bun dev workflow run --workflow sdlc "Create a simple hello world function in test-output.ts"

# Expected output:
# - Workflow started: exec-XXXXX
# - Step started/completed for each: input, research, plan, implement, review
# - Workflow completed!
# - Agent Response: [actual response from review agent]
# - Workflow Session: session_XXXXX

# 2. Note the execution ID from output (exec-XXXXX)
EXEC_ID="exec-XXXXX"  # Replace with actual ID
```

### Test 3: Verify State Files Created

```bash
# Check execution directory was created
ls -la .flomaster/executions/$EXEC_ID/
# Expected files:
# - state.json      (execution status, step statuses)
# - context.json    (outputs from each step)
# - mapping.json    (step-to-session mappings)
# - checkpoint.json (full checkpoint for recovery)

# View the context (step outputs)
cat .flomaster/executions/$EXEC_ID/context.json | jq .
# Expected: JSON with keys for each step (input, research, plan, implement, review)
# Each step should have "response" and "success" fields

# View step statuses
cat .flomaster/executions/$EXEC_ID/state.json | jq '.stepStatuses'
# Expected: All steps show "completed"

# View step-to-session mapping
cat .flomaster/executions/$EXEC_ID/mapping.json | jq .
# Expected: Each step ID maps to a session ID
```

### Test 4: List Executions

```bash
bun dev workflow list
# Expected: Table showing recent executions with:
# - Execution ID
# - Workflow name
# - Status (completed/failed/running)
# - Step count
# - Created/Updated timestamps
```

### Test 5: Inspect Execution

```bash
bun dev workflow inspect $EXEC_ID
# Expected: Detailed view showing:
# - Execution metadata
# - Status of each step
# - Output from each step (response text)
# - Session IDs for each step
```

### Test 6: Crash Recovery / Resume (Manual)

```bash
# 1. Start a workflow but kill it mid-execution
bun dev workflow run --workflow sdlc "Long task to test crash recovery" &
PID=$!
sleep 5  # Wait for first step or two to complete
kill $PID

# 2. Check checkpoint was created
ls -la .flomaster/executions/  # Find the new execution
NEW_EXEC_ID="exec-XXXXX"  # Get the ID
cat .flomaster/executions/$NEW_EXEC_ID/checkpoint.json | jq '.execution.status'
# Expected: "running" (was interrupted)

# 3. List incomplete executions
bun dev workflow list --status running
# Expected: Shows the interrupted execution

# 4. Resume the workflow
bun dev workflow resume $NEW_EXEC_ID
# Expected: Workflow resumes from last checkpoint, completes remaining steps
```

### Test 7: Verify Context Passing Between Steps

```bash
# After a successful SDLC workflow run, verify context was passed:

# Check that plan step received research output
cat .flomaster/executions/$EXEC_ID/context.json | jq '.plan.response' | head -20
# Should contain references to research findings

# Check that implement step received plan output
cat .flomaster/executions/$EXEC_ID/context.json | jq '.implement.response' | head -20
# Should reference the implementation plan

# Check that review step received implement output
cat .flomaster/executions/$EXEC_ID/context.json | jq '.review.response' | head -20
# Should reference what was implemented
```

### Test 8: Session Hierarchy Verification

```bash
# Get the workflow session ID from a completed run
WORKFLOW_SESSION=$(cat .flomaster/executions/$EXEC_ID/state.json | jq -r '.workflowSessionId // empty')

# If using OpenCode TUI, verify sessions appear:
bun dev
# In TUI: Check sidebar for workflow session with child sessions for each step
```

### Test 9: Clean Slate Test

```bash
# Remove all executions and test fresh
rm -rf .flomaster/executions/

# Run workflow
bun dev workflow run --workflow test "Clean slate test"

# Verify new execution created
ls .flomaster/executions/
# Expected: One new execution directory
```

## Success Criteria

### Automated Verification

- [ ] `bun turbo typecheck` passes
- [ ] `bun dev workflow run --workflow test --dry-run` works
- [ ] `bun dev workflow run --workflow sdlc --dry-run` works
- [ ] `bun dev workflow list` shows executions (after real run)
- [ ] `bun dev workflow inspect <id>` shows step outputs

### Manual Verification

- [ ] Run real SDLC workflow and verify state is persisted
- [ ] Check `.flomaster/executions/` for execution files
- [ ] Verify `context.json` contains step outputs
- [ ] Kill workflow mid-execution, verify checkpoint exists
- [ ] Resume workflow from checkpoint

## Dependencies

- TASK-08 (Complete) - Default step agents

## References

- Prototype StateManager: `flomaster-prototype/packages/core/src/state/stateManager.ts`
- Prototype Types: `flomaster-prototype/packages/core/src/state/types.ts`
- StateManager Contract: `flomaster-prototype/docs/standards/state-manager.md`

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: Restructure | 1-2 hours |
| Phase 2: Port StateManager | 2-3 hours |
| Phase 3: CLI Commands | 1-2 hours |
| Testing & Fixes | 1-2 hours |
| **Total** | **5-9 hours** |
