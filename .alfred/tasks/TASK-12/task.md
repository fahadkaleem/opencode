# TASK-12: Consolidate Execution State to Single JSON File

## Status: Planning

## Goal

Refactor FloMaster's execution state persistence from a 4-file structure to a single `execution.json` file per workflow execution.

## Why We're Doing This

### Current Problem: ~60% Storage Redundancy

FloMaster currently stores execution state across 4 separate files:

```
.flomaster/executions/{execution-id}/
├── state.json       # WorkflowExecution (status, stepStatuses, stepResults)
├── context.json     # SharedContext { [stepId]: outputs }
├── mapping.json     # { [stepId]: sessionId }
└── checkpoint.json  # Full copy of ALL above files
```

**The redundancy:**
1. `stepResults` in `state.json` already contains `outputs` AND `sessionId` per step
2. `context.json` duplicates the `outputs` from `stepResults`
3. `mapping.json` duplicates the `sessionId` from `stepResults`
4. `checkpoint.json` duplicates ALL of the above

This violates DRY (Don't Repeat Yourself) and SOLID principles.

### Benefits of Single File

1. **No Duplication** - Single source of truth for all execution data
2. **Atomic Operations** - Write one file = complete checkpoint
3. **Simpler Code** - Fewer file operations, no sync issues
4. **Easier Recovery** - One file to load, one file to restore
5. **Future-Ready** - Clean schema for artifacts-based context (planned future feature)

## Research Summary

### Files That Need Changes

| File | Role | Changes Required |
|------|------|------------------|
| `packages/flomaster/src/state/types.ts` | Type definitions | Add new `Execution` type, deprecate old types |
| `packages/flomaster/src/state/stateManager.ts` | Core implementation | Rewrite to use single file |
| `packages/flomaster/src/state/defaults.ts` | Constants | Update filenames |
| `packages/flomaster/src/cli/workflow.ts` | CLI commands | Update callers (minimal changes expected) |

### StateManager Interface Methods (must maintain compatibility)

**Keep these method signatures:**
- `createExecution()` - Create new execution
- `getExecution()` - Get execution by ID
- `updateStepStatus()` - Update step status
- `recordStepResult()` - Record step result with outputs
- `updateExecutionStatus()` - Update overall status
- `getContext()` - Get shared context
- `mergeStepOutputs()` - Merge step outputs
- `mapStepToSession()` - Map step to session ID
- `getSessionForStep()` - Get session for step
- `saveCheckpoint()` - Save checkpoint (now no-op or alias)
- `loadCheckpoint()` - Load checkpoint (now loads execution.json)

### Current Data Flow

```
CLI Command (workflow.ts)
    │
    ├── createExecution() → writes state.json, context.json, mapping.json
    │
    ├── recordStepResult() → updates state.json, context.json, mapping.json, checkpoint.json
    │
    └── getExecution() → reads state.json
```

### Proposed Data Flow

```
CLI Command (workflow.ts)
    │
    ├── createExecution() → writes execution.json
    │
    ├── recordStepResult() → updates execution.json (atomic)
    │
    └── getExecution() → reads execution.json
```

## Proposed Schema: Single Execution JSON

```typescript
interface Execution {
  // Header (immutable after creation)
  id: string
  workflowName: string
  workflowId?: string
  taskId?: string
  workflowSessionId?: string
  createdAt: string  // ISO 8601

  // Status (mutable)
  status: ExecutionStatus
  updatedAt: string  // ISO 8601
  startedAt?: string
  completedAt?: string

  // Steps - SINGLE SOURCE OF TRUTH
  steps: {
    [stepId: string]: {
      status: StepExecutionStatus
      sessionId?: string      // ← Was in mapping.json
      startTime?: number
      endTime?: number
      outputs?: Record<string, unknown>  // ← Was in context.json
      error?: string
      errorHistory?: StepError[]
      retryCount?: number
    }
  }

  // Metadata
  version: string  // Schema version "1.0"
  recoverable: boolean
}
```

**Key Changes:**
- `outputs` moved INTO `steps[stepId]` (was separate `context.json`)
- `sessionId` moved INTO `steps[stepId]` (was separate `mapping.json`)
- No separate `checkpoint.json` - the `execution.json` IS the checkpoint
- `recoverable` flag replaces checkpoint file existence check

## Out of Scope

- **Artifacts-based context** - Future feature, not this task
- **Migration of existing executions** - Old executions will use old format
- **Workflow engine changes** - Only StateManager changes
- **XState machine changes** - No changes needed

## Success Criteria

### Automated Verification
- [ ] All existing FloMaster tests pass: `cd packages/flomaster && bun test`
- [ ] TypeScript compiles: `bun turbo typecheck`
- [ ] SDLC workflow runs successfully: `bun run src/cli/index.ts workflow run --workflow sdlc "Test task"`

### Manual Verification
- [ ] New execution creates single `execution.json` (no context.json, mapping.json, checkpoint.json)
- [ ] Resume from execution works correctly
- [ ] `workflow list` shows correct information
- [ ] `workflow inspect` shows correct step details

## References

- Previous research: Agent outputs from this session
- Current implementation: `packages/flomaster/src/state/stateManager.ts`
- CLI callers: `packages/flomaster/src/cli/workflow.ts`
- Types: `packages/flomaster/src/state/types.ts`
