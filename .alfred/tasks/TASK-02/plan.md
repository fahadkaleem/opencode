# TASK-02: Update Utility Imports and Convert Tests

## Overview

Replace flomaster-prototype internal utility imports with opencode equivalents and convert test framework from vitest to bun:test. This task focuses on making the copied orchestrator files compile within opencode's environment.

## Current State Analysis

### Source of Imports

After TASK-01, the orchestrator files reference flomaster-prototype internal modules that don't exist in opencode:

| Import | Used In | Replacement |
|--------|---------|-------------|
| `../../../logging/logger.js` | `agentExecutor.ts` | `../../../util/log.js` |
| `../../client/client.js` | `factory.ts`, `agentExecutor.ts` | Stub (TASK-04 replaces fully) |
| `../../config/config.js` | `factory.ts` | Stub (TASK-04 replaces fully) |
| `vitest` | 17 test files | `bun:test` |

### Key Discoveries

- **No direct pino/async-mutex imports** - The orchestrator uses flomaster's `createLogger` wrapper, not pino directly
- **Only 1 file uses logging** - `registry/executors/agentExecutor.ts` (line 9, 22)
- **17 test files use vitest** - All need conversion to bun:test
- **Logging API differs**:
  - Pino: `log.info({ key: value }, 'message')`
  - OpenCode: `log.info('message', { key: value })`

## Desired End State

After completion:
1. All orchestrator imports resolve to valid opencode modules
2. `createLogger` replaced with opencode's `Log.create()`
3. All tests use `bun:test` instead of `vitest`
4. `bun turbo typecheck` passes for orchestrator files (except SDK-related types deferred to TASK-04)

## What We're NOT Doing

- Replacing `Client` type with AgentAdapter (TASK-04)
- Replacing `Config` type with opencode config (TASK-04)
- Modifying executor logic (TASK-04)
- Adding new functionality
- Running tests (will need TASK-04 for full test execution)

## Implementation Approach

Systematic search-and-replace in three phases:
1. Replace logging imports and API calls
2. Convert vitest to bun:test
3. Stub SDK-related imports with TODO markers

---

## Phase 1: Replace Logging in agentExecutor.ts

### Overview

Replace the flomaster `createLogger` with opencode's `Log.create()` and update all logging calls to match opencode's API.

### Changes Required

#### 1. Update Import Statement

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

**Line 9 - Change from:**
```typescript
import { createLogger } from '../../../logging/logger.js';
```

**To:**
```typescript
import { Log } from '../../../util/log.js';
```

#### 2. Update Logger Creation

**Line 22 - Change from:**
```typescript
const log = createLogger('AgentExecutor');
```

**To:**
```typescript
const log = Log.create({ service: 'AgentExecutor' });
```

#### 3. Update All Logging Calls

The pino-style API puts the object first, message second. OpenCode's Log puts message first, object second.

**Pattern to replace throughout file:**

| Pino Style (Before) | OpenCode Style (After) |
|---------------------|------------------------|
| `log.info({ stepId: step.id }, 'message')` | `log.info('message', { stepId: step.id })` |
| `log.error({ stepId, error }, 'message')` | `log.error('message', { stepId, error })` |
| `log.debug({ stepId }, 'message')` | `log.debug('message', { stepId })` |

**Specific lines to update:**

- Line 141-143: `log.info({ stepId, stepName }, 'message')` → `log.info('message', { stepId, stepName })`
- Line 156-158: `log.info({ stepId }, 'message')` → `log.info('message', { stepId })`
- Line 179-181: `log.info({ stepId }, 'message')` → `log.info('message', { stepId })`
- Line 186-188: `log.info({ stepId, sessionId }, 'message')` → `log.info('message', { stepId, sessionId })`
- Line 193-195: `log.info({ stepId, promptLength }, 'message')` → `log.info('message', { stepId, promptLength })`
- Line 213-220: `log.info({ stepId, tools, model, hasSystem }, 'message')` → `log.info('message', { ... })`
- Line 229-231: `log.debug({ stepId, chunkType }, 'message')` → `log.debug('message', { stepId, chunkType })`
- Line 241-243: `log.info({ stepId, toolName }, 'message')` → `log.info('message', { stepId, toolName })`
- Line 254-256: `log.info({ stepId, toolName }, 'message')` → `log.info('message', { stepId, toolName })`
- Line 272-274: `log.error({ stepId, error }, 'message')` → `log.error('message', { stepId, error })`
- Line 284-290: `log.info({ stepId, responseLength, toolCallCount }, 'message')` → `log.info('message', { ... })`
- Line 304-306: `log.debug({ stepId }, 'message')` → `log.debug('message', { stepId })`
- Line 311-316: `log.error({ stepId, error }, 'message')` → `log.error('message', { stepId, error })`

### Success Criteria

#### Automated Verification

- [ ] No imports from `../../../logging/logger.js`: `grep -r "logging/logger" packages/opencode/src/orchestrator/`
- [ ] Uses Log from util: `grep "from.*util/log" packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

---

## Phase 2: Convert vitest to bun:test

### Overview

Convert all 17 test files from vitest to bun:test. The APIs are similar but have key differences.

### API Mapping

| vitest | bun:test |
|--------|----------|
| `import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'` | `import { describe, expect, it, mock, beforeEach, afterEach, spyOn } from 'bun:test'` |
| `vi.fn()` | `mock(() => {})` |
| `vi.fn().mockResolvedValue(x)` | `mock(() => Promise.resolve(x))` |
| `vi.fn().mockReturnValue(x)` | `mock(() => x)` |
| `vi.spyOn(obj, 'method')` | `spyOn(obj, 'method')` |
| `vi.clearAllMocks()` | Manual reset or use fresh mocks |
| `vi.resetAllMocks()` | Manual reset or use fresh mocks |
| `vi.mock('module')` | `mock.module('module', () => ({ ... }))` |

### Files to Update (17 total)

```
packages/opencode/src/orchestrator/
├── actors/
│   ├── conditionalActor.test.ts
│   ├── loopActor.test.ts
│   ├── stepActor.test.ts
│   └── subflowActor.test.ts
├── engine/
│   ├── factory.test.ts
│   ├── validationRunner.test.ts
│   └── workflowEngine.test.ts
├── machine/
│   ├── actions.test.ts
│   ├── guards.test.ts
│   └── workflowMachine.test.ts
├── parser/
│   ├── topology.test.ts
│   └── workflowParser.test.ts
├── registry/
│   └── stepExecutorRegistry.test.ts
└── utils/
    ├── abortUtils.test.ts
    ├── contextAppender.test.ts
    ├── contextInterpolator.test.ts
    └── schemaValidator.test.ts
```

### Changes Required

#### For Each Test File:

**Step 1: Update import statement**

Change from:
```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
```

To:
```typescript
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
```

**Step 2: Replace `vi.fn()` with `mock()`**

```typescript
// Before
const mockFn = vi.fn();
const mockFn = vi.fn().mockReturnValue(42);
const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

// After
const mockFn = mock(() => {});
const mockFn = mock(() => 42);
const mockFn = mock(() => Promise.resolve({ data: 'test' }));
```

**Step 3: Replace `vi.spyOn()` with `spyOn()`**

```typescript
// Before
vi.spyOn(object, 'method').mockReturnValue(value);

// After
spyOn(object, 'method').mockReturnValue(value);
```

**Step 4: Replace mock clearing**

```typescript
// Before
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// After
afterEach(() => {
  // Bun creates fresh mocks per test, or manually reset if needed
});
```

**Step 5: Replace `vi.mock()` module mocking**

```typescript
// Before
vi.mock('../module.js', () => ({
  someFunction: vi.fn(),
}));

// After
mock.module('../module.js', () => ({
  someFunction: mock(() => {}),
}));
```

### Success Criteria

#### Automated Verification

- [ ] No vitest imports: `grep -r "from 'vitest'" packages/opencode/src/orchestrator/` returns nothing
- [ ] All tests import from bun:test: `grep -r "from 'bun:test'" packages/opencode/src/orchestrator/ | wc -l` equals 17
- [ ] No `vi.` references: `grep -r "vi\." packages/opencode/src/orchestrator/` returns nothing

---

## Phase 3: Stub SDK-Related Imports

### Overview

The orchestrator imports `Client` and `Config` types from flomaster-prototype modules that don't exist in opencode. These will be properly replaced in TASK-04 when we create the AgentAdapter. For now, we stub them with TODO markers to allow typecheck to pass.

### Changes Required

#### 1. Create Stub Types File

**File:** `packages/opencode/src/orchestrator/stubs.ts` (new file)

```typescript
/**
 * Stub types for flomaster-prototype dependencies.
 *
 * TODO(TASK-04): Replace with AgentAdapter integration.
 * These stubs exist only to allow typecheck to pass until
 * the full SDK replacement is implemented.
 */

/**
 * Stub for flomaster Client type.
 * @deprecated Will be replaced by AgentAdapter in TASK-04
 */
export type Client = {
  session: {
    create(options: { title: string }): Promise<StubSession>;
  };
};

/**
 * Stub for flomaster Session type.
 * @deprecated Will be replaced by AgentAdapter in TASK-04
 */
export type StubSession = {
  id: string;
  stream(
    prompt: string,
    options?: {
      tools?: string[];
      model?: { provider: string; model: string };
      system?: string;
      signal?: AbortSignal;
    },
  ): AsyncIterable<StubStreamChunk>;
  close(): Promise<void>;
};

/**
 * Stub for stream chunk type.
 */
export type StubStreamChunk = {
  type: 'text' | 'tool_start' | 'tool_end' | 'error';
  content?: string;
  error?: string;
  toolCall?: {
    name: string;
    args: unknown;
    result?: unknown;
  };
};

/**
 * Stub for flomaster Config type.
 * @deprecated Will be removed in TASK-04
 */
export type Config = {
  getClient(): Client | null;
};
```

#### 2. Update agentExecutor.ts Import

**File:** `packages/opencode/src/orchestrator/registry/executors/agentExecutor.ts`

**Line 8 - Change from:**
```typescript
import type { Client } from '../../../client/client.js';
```

**To:**
```typescript
import type { Client } from '../../stubs.js';
```

#### 3. Update factory.ts Imports

**File:** `packages/opencode/src/orchestrator/engine/factory.ts`

**Lines 8-9 - Change from:**
```typescript
import type { Client } from '../../client/client.js';
import type { Config } from '../../config/config.js';
```

**To:**
```typescript
import type { Client, Config } from '../stubs.js';
```

#### 4. Update factory.test.ts Imports

**File:** `packages/opencode/src/orchestrator/engine/factory.test.ts`

**Lines 6-7 - Change from:**
```typescript
import type { Client } from '../../client/client.js';
import type { Config } from '../../config/config.js';
```

**To:**
```typescript
import type { Client, Config } from '../stubs.js';
```

### Success Criteria

#### Automated Verification

- [ ] No imports from `client/client.js`: `grep -r "client/client" packages/opencode/src/orchestrator/`
- [ ] No imports from `config/config.js`: `grep -r "config/config" packages/opencode/src/orchestrator/`
- [ ] Stubs file exists: `ls packages/opencode/src/orchestrator/stubs.ts`

---

## Phase 4: Verify Typecheck

### Overview

Run typecheck to verify all imports resolve correctly.

### Commands

```bash
cd /Users/fahadkaleem/Documents/Workspace/flomaster-opencode

# Run typecheck for orchestrator files
bun turbo typecheck

# Or specifically check orchestrator
npx tsc --noEmit -p packages/opencode/tsconfig.json 2>&1 | grep -i orchestrator
```

### Success Criteria

#### Automated Verification

- [ ] Typecheck passes: `bun turbo typecheck` exits with code 0
- [ ] No unresolved imports in orchestrator files

#### Manual Verification

- [ ] Review any remaining type errors
- [ ] Verify stubs are correctly typed

---

## Testing Strategy

### This Task

Tests won't fully run until TASK-04 completes the SDK replacement. However, we can verify:

1. Test files parse correctly (no syntax errors)
2. bun:test recognizes the test files
3. Type imports are correct

```bash
# Verify test files are recognized
bun test packages/opencode/src/orchestrator --dry-run 2>&1 | head -20

# Check for syntax errors in test files
npx tsc --noEmit packages/opencode/src/orchestrator/**/*.test.ts
```

### Expected Test Results

- Most tests will fail because mock implementations don't match real behavior
- This is expected until TASK-04 provides proper AgentAdapter

---

## Rollback Procedure

If something goes wrong:

```bash
# Restore orchestrator files from prototype
rm -rf packages/opencode/src/orchestrator
cp -r /Users/fahadkaleem/Documents/Workspace/flomaster-prototype/packages/core/src/orchestrator/* \
      packages/opencode/src/orchestrator/
```

---

## Command Summary

Execute these in order:

```bash
# Phase 1: Update logging in agentExecutor.ts (manual edits)
# - Replace import
# - Replace createLogger call
# - Update all log.xxx() call signatures

# Phase 2: Convert vitest to bun:test (for each of 17 test files)
# - Update import statement
# - Replace vi.fn() with mock()
# - Replace vi.spyOn() with spyOn()
# - Remove vi.clearAllMocks()/resetAllMocks()

# Phase 3: Create stubs and update imports
# - Create stubs.ts
# - Update agentExecutor.ts import
# - Update factory.ts imports
# - Update factory.test.ts imports

# Phase 4: Verify
bun turbo typecheck
grep -r "from 'vitest'" packages/opencode/src/orchestrator/  # Should return nothing
grep -r "logging/logger" packages/opencode/src/orchestrator/ # Should return nothing
grep -r "client/client" packages/opencode/src/orchestrator/  # Should return nothing
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `stubs.ts` | **NEW** - Stub types for Client, Config |
| `registry/executors/agentExecutor.ts` | Replace logging import + calls, update Client import |
| `engine/factory.ts` | Update Client, Config imports |
| `engine/factory.test.ts` | Update imports, convert vitest → bun:test |
| `actors/*.test.ts` (4 files) | Convert vitest → bun:test |
| `engine/*.test.ts` (3 files) | Convert vitest → bun:test |
| `machine/*.test.ts` (3 files) | Convert vitest → bun:test |
| `parser/*.test.ts` (2 files) | Convert vitest → bun:test |
| `registry/*.test.ts` (1 file) | Convert vitest → bun:test |
| `utils/*.test.ts` (4 files) | Convert vitest → bun:test |

**Total: 1 new file + 19 modified files**

---

## References

- OpenCode Log utility: `packages/opencode/src/util/log.ts`
- OpenCode Lock utility: `packages/opencode/src/util/lock.ts`
- Bun test documentation: https://bun.sh/docs/cli/test
- Task definition: `.alfred/tasks/TASK-02/task.md`
- TASK-01 plan: `.alfred/tasks/TASK-01/plan.md`
