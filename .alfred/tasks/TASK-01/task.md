# TASK-01: Copy Orchestrator Files and Add XState Dependency

## Summary

Copy the entire orchestrator module from flomaster-prototype to flomaster-opencode and add the xstate dependency to package.json.

## Context

The flomaster-prototype contains a complete, production-ready workflow orchestration engine in `packages/core/src/orchestrator/`. This task copies all 43 files (24 implementation + 19 test files) to the opencode package without modifications. The xstate dependency is required for the state machine-based workflow execution.

## Scope

### In Scope

- Copy `flomaster-prototype/packages/core/src/orchestrator/` → `flomaster-opencode/packages/opencode/src/orchestrator/`
- Add `xstate` (^5.0.0) to `packages/opencode/package.json` dependencies
- Run `bun install` to install the new dependency

### Out of Scope

- Modifying any copied files
- Fixing import errors (handled in TASK-02)
- SDK integration changes (handled in TASK-03/04)

## Success Criteria

- [ ] All 43 orchestrator files exist in `packages/opencode/src/orchestrator/`
- [ ] `xstate` appears in `packages/opencode/package.json` dependencies
- [ ] `bun install` completes without errors

## Dependencies

- None (this is the first task)

## Files Affected

### Source (flomaster-prototype)
```
packages/core/src/orchestrator/
├── index.ts
├── types.ts
├── actors/           (8 files)
├── engine/           (6 files)
├── machine/          (6 files)
├── parser/           (6 files)
├── registry/         (4 files)
│   └── executors/    (7 files)
└── utils/            (8 files)
```

### Target (flomaster-opencode)
```
packages/opencode/src/orchestrator/  (new directory)
packages/opencode/package.json       (add xstate dependency)
```
