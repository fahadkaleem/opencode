# TASK-02: Update Utility Imports (pino → Log, async-mutex → Lock)

## Summary

Replace flomaster-prototype utility dependencies with opencode's built-in equivalents. This involves updating imports from `pino` to opencode's `Log` utility and `async-mutex` to opencode's `Lock` utility.

## Context

The flomaster-prototype uses external packages for logging (pino) and mutex locking (async-mutex). OpenCode has built-in utilities that provide equivalent functionality:
- `src/util/log.ts` - Provides `Log.create({ service: 'name' })` for tagged logging
- `src/util/lock.ts` - Provides `Lock.write(key)` for exclusive locks

## Scope

### In Scope

- Replace `pino` imports with `../util/log.js` imports
- Replace `async-mutex` imports with `../util/lock.js` imports
- Update logging API calls to match opencode's `Log` interface
- Update mutex API calls to match opencode's `Lock` interface
- Remove any flomaster-specific logging configuration

### Out of Scope

- SDK-related imports (handled in TASK-03/04)
- Adding new logging functionality
- Modifying opencode's existing utilities

## Mapping Reference

### Logging (pino → Log)

| flomaster-prototype | opencode |
|---------------------|----------|
| `import pino from 'pino'` | `import { Log } from '../util/log.js'` |
| `pino({ name: 'component' })` | `Log.create({ service: 'component' })` |
| `logger.info(msg)` | `log.info(msg)` |
| `logger.error(msg, { err })` | `log.error(msg, { error: err })` |
| `logger.debug(msg)` | `log.debug(msg)` |

### Mutex (async-mutex → Lock)

| flomaster-prototype | opencode |
|---------------------|----------|
| `import { Mutex } from 'async-mutex'` | `import { Lock } from '../util/lock.js'` |
| `mutex.runExclusive(fn)` | `using lock = await Lock.write(key); fn()` |

## Success Criteria

- [ ] No imports from `pino` in orchestrator files
- [ ] No imports from `async-mutex` in orchestrator files
- [ ] All logging calls use opencode's `Log` utility
- [ ] All mutex calls use opencode's `Lock` utility
- [ ] `bun turbo typecheck` passes for modified files

## Dependencies

- TASK-01 must be completed first

## Files to Modify

Files that import pino or async-mutex will be identified during implementation. Expected locations:
- `orchestrator/engine/*.ts` (logging)
- `orchestrator/registry/executors/*.ts` (logging)
- Any files that use `LockManager` pattern
