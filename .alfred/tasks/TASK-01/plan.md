# TASK-01: Copy Orchestrator Files and Add XState Dependency

## Overview

Copy the complete orchestrator module (47 files) from flomaster-prototype to flomaster-opencode and add the xstate dependency required for the workflow state machine.

## Current State Analysis

### Source Location
```
/Users/fahadkaleem/Documents/Workspace/flomaster-prototype/packages/core/src/orchestrator/
```

### Target Location
```
/Users/fahadkaleem/Documents/Workspace/flomaster-opencode/packages/opencode/src/orchestrator/
```

### Key Discoveries

- **47 total files** (30 implementation + 17 test files)
- XState v5 is used for workflow state machine (`machine/workflowMachine.ts`)
- Zod is already present in opencode (`"zod": "catalog:"` at `package.json:118`)
- No orchestrator directory exists yet in opencode
- Package.json uses Bun workspace catalog for shared dependencies

## Desired End State

After completion:
1. All 47 orchestrator files exist in `packages/opencode/src/orchestrator/`
2. `xstate` dependency added to `packages/opencode/package.json`
3. `bun install` completes successfully
4. Directory structure matches source exactly

## What We're NOT Doing

- Fixing any import errors (TASK-02)
- Modifying file contents (TASK-02, TASK-03, TASK-04)
- Running typecheck (will fail until TASK-02)
- Running tests (will fail until TASK-04)

## Implementation Approach

Simple file copy using `cp -r` followed by dependency addition. This is a mechanical task with no decision points.

---

## Phase 1: Create Target Directory and Copy Files

### Overview

Create the orchestrator directory in opencode and copy all files from the prototype.

### Changes Required

#### 1. Create Target Directory

```bash
mkdir -p /Users/fahadkaleem/Documents/Workspace/flomaster-opencode/packages/opencode/src/orchestrator
```

#### 2. Copy All Orchestrator Files

```bash
cp -r /Users/fahadkaleem/Documents/Workspace/flomaster-prototype/packages/core/src/orchestrator/* \
      /Users/fahadkaleem/Documents/Workspace/flomaster-opencode/packages/opencode/src/orchestrator/
```

### Files Being Copied

```
orchestrator/
├── index.ts                              # Barrel export
├── types.ts                              # Core type definitions
├── actors/
│   ├── conditionalActor.ts               # Conditional branching actor
│   ├── conditionalActor.test.ts
│   ├── loopActor.ts                      # Loop iteration actor
│   ├── loopActor.test.ts
│   ├── stepActor.ts                      # Step execution actor
│   ├── stepActor.test.ts
│   ├── subflowActor.ts                   # Nested workflow actor
│   └── subflowActor.test.ts
├── engine/
│   ├── factory.ts                        # Engine factory
│   ├── factory.test.ts
│   ├── validationRunner.ts               # Workflow validation
│   ├── validationRunner.test.ts
│   ├── workflowEngine.ts                 # Main engine implementation
│   └── workflowEngine.test.ts
├── machine/
│   ├── actions.ts                        # XState actions
│   ├── actions.test.ts
│   ├── guards.ts                         # XState guards
│   ├── guards.test.ts
│   ├── workflowMachine.ts                # XState machine definition
│   └── workflowMachine.test.ts
├── parser/
│   ├── connectionParser.ts               # Edge/connection parsing
│   ├── stepParser.ts                     # Step/node parsing
│   ├── topology.ts                       # Graph topology analysis
│   ├── topology.test.ts
│   ├── workflowParser.ts                 # Main workflow parser
│   └── workflowParser.test.ts
├── registry/
│   ├── index.ts                          # Registry barrel
│   ├── stepExecutorRegistry.ts           # Executor registry
│   ├── stepExecutorRegistry.test.ts
│   ├── types.ts                          # Registry types
│   └── executors/
│       ├── index.ts                      # Executors barrel
│       ├── agentExecutor.ts              # AI agent step executor
│       ├── conditionalExecutor.ts        # Conditional step executor
│       ├── genericExecutor.ts            # Generic step executor
│       ├── loopExecutor.ts               # Loop step executor
│       ├── promptExecutor.ts             # Prompt step executor
│       └── subflowExecutor.ts            # Subflow step executor
└── utils/
    ├── abortUtils.ts                     # AbortSignal utilities
    ├── abortUtils.test.ts
    ├── contextAppender.test.ts           # Orphan test (no impl)
    ├── contextInterpolator.ts            # Variable interpolation
    ├── contextInterpolator.test.ts
    ├── idGenerator.ts                    # ID generation
    ├── schemaValidator.ts                # Zod validation
    └── schemaValidator.test.ts
```

### Success Criteria

#### Automated Verification

- [ ] Directory exists: `ls packages/opencode/src/orchestrator/`
- [ ] File count matches: `find packages/opencode/src/orchestrator -name "*.ts" | wc -l` should output `47`
- [ ] All subdirectories exist:
  ```bash
  ls packages/opencode/src/orchestrator/actors/
  ls packages/opencode/src/orchestrator/engine/
  ls packages/opencode/src/orchestrator/machine/
  ls packages/opencode/src/orchestrator/parser/
  ls packages/opencode/src/orchestrator/registry/
  ls packages/opencode/src/orchestrator/registry/executors/
  ls packages/opencode/src/orchestrator/utils/
  ```

#### Manual Verification

- [ ] Spot check a few files to ensure content copied correctly

**Implementation Note:** After completing this phase, verify file count before proceeding.

---

## Phase 2: Add XState Dependency

### Overview

Add the xstate package to opencode's dependencies. XState v5 is required for the workflow state machine.

### Changes Required

#### 1. Update package.json

**File:** `packages/opencode/package.json`

Add `xstate` to the dependencies section (alphabetically placed after `xdg-basedir`):

```json
{
  "dependencies": {
    ...
    "xdg-basedir": "5.1.0",
    "xstate": "^5.19.0",
    "yargs": "18.0.0",
    ...
  }
}
```

**Specific edit:**

Find line 116:
```json
    "xdg-basedir": "5.1.0",
```

Change to:
```json
    "xdg-basedir": "5.1.0",
    "xstate": "^5.19.0",
```

### Success Criteria

#### Automated Verification

- [ ] xstate in package.json: `grep '"xstate"' packages/opencode/package.json`

---

## Phase 3: Install Dependencies

### Overview

Run bun install to fetch the xstate package.

### Changes Required

#### 1. Install Dependencies

```bash
cd /Users/fahadkaleem/Documents/Workspace/flomaster-opencode && bun install
```

### Success Criteria

#### Automated Verification

- [ ] Install succeeds: `bun install` exits with code 0
- [ ] xstate installed: `ls node_modules/xstate/` shows package contents
- [ ] Lock file updated: `git diff bun.lock | head -20` shows xstate added

---

## Phase 4: Verify Installation

### Overview

Final verification that all files are in place and the dependency is installed.

### Verification Commands

```bash
# 1. Verify file count
find packages/opencode/src/orchestrator -name "*.ts" | wc -l
# Expected: 47

# 2. Verify key files exist
ls packages/opencode/src/orchestrator/index.ts
ls packages/opencode/src/orchestrator/types.ts
ls packages/opencode/src/orchestrator/machine/workflowMachine.ts
ls packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts

# 3. Verify xstate
grep '"xstate"' packages/opencode/package.json
ls node_modules/xstate/package.json

# 4. Verify no syntax errors in copied files (optional)
head -50 packages/opencode/src/orchestrator/machine/workflowMachine.ts
```

### Success Criteria

#### Automated Verification

- [ ] All 47 files present
- [ ] xstate in package.json
- [ ] xstate in node_modules
- [ ] bun.lock updated

#### Manual Verification

- [ ] Review a sample file to ensure content is correct
- [ ] Verify directory structure matches source

---

## Testing Strategy

### This Task

No tests to run - typecheck will fail due to missing imports (fixed in TASK-02).

### Verification Only

```bash
# Count files
find packages/opencode/src/orchestrator -name "*.ts" | wc -l

# Verify structure
tree packages/opencode/src/orchestrator -I node_modules
```

---

## Rollback Procedure

If something goes wrong:

```bash
# Remove copied files
rm -rf packages/opencode/src/orchestrator

# Revert package.json changes
git checkout packages/opencode/package.json

# Restore lock file
git checkout bun.lock

# Reinstall original dependencies
bun install
```

---

## Command Summary

Execute these commands in order:

```bash
# Phase 1: Copy files
mkdir -p /Users/fahadkaleem/Documents/Workspace/flomaster-opencode/packages/opencode/src/orchestrator
cp -r /Users/fahadkaleem/Documents/Workspace/flomaster-prototype/packages/core/src/orchestrator/* \
      /Users/fahadkaleem/Documents/Workspace/flomaster-opencode/packages/opencode/src/orchestrator/

# Phase 2: Add xstate (manual edit to package.json - add after xdg-basedir)
# "xstate": "^5.19.0",

# Phase 3: Install
cd /Users/fahadkaleem/Documents/Workspace/flomaster-opencode && bun install

# Phase 4: Verify
find packages/opencode/src/orchestrator -name "*.ts" | wc -l  # Should be 47
grep '"xstate"' packages/opencode/package.json                 # Should show xstate
```

---

## References

- Source orchestrator: `/Users/fahadkaleem/Documents/Workspace/flomaster-prototype/packages/core/src/orchestrator/`
- XState v5 docs: https://stately.ai/docs/xstate-v5
- Task definition: `.alfred/tasks/TASK-01/task.md`
