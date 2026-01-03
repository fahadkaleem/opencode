# TASK-02: Fix Orchestrator Imports

## Summary

Fix broken imports in the copied orchestrator files by replacing flomaster-specific modules with opencode equivalents.

## Context

After copying the orchestrator (TASK-01), several imports will be broken because they reference flomaster-specific modules that don't exist in opencode:
- `../../../logging/logger.js` → Use opencode's `Log` utility
- `../../../client/client.js` → Remove (will be replaced with direct Session imports in TASK-03)
- `../../config/config.js` → Remove (not needed for initial integration)

## Scope

### In Scope

- Replace `createLogger` imports with opencode's `Log.create()`
- Update logging API calls to match opencode's interface
- Remove or comment out `Client` type imports (TASK-03 will replace with direct imports)
- Remove or comment out `Config` type imports
- Ensure `bun turbo typecheck` passes

### Out of Scope

- Implementing the Session integration (TASK-03)
- Modifying non-import related code

## Import Mapping

### Logging

| Before (flomaster) | After (opencode) |
|--------------------|------------------|
| `import { createLogger } from '../../../logging/logger.js'` | `import { Log } from '../../../util/log.js'` |
| `const logger = createLogger('AgentExecutor')` | `const log = Log.create({ service: 'AgentExecutor' })` |
| `logger.info('message', { data })` | `log.info('message', { data })` |
| `logger.error('message', { err })` | `log.error('message', { error: err })` |
| `logger.debug('message')` | `log.debug('message')` |

### Client/Config (Remove for now)

```typescript
// BEFORE
import type { Client } from '../../../client/client.js';
import type { Config } from '../../config/config.js';

// AFTER - Comment out with TODO
// TODO(TASK-03): Replace with direct Session imports
// import type { Client } from '../../../client/client.js';
// import type { Config } from '../../config/config.js';
```

## Files to Modify

Based on research, these files have broken imports:

| File | Broken Imports |
|------|----------------|
| `engine/factory.ts` | `Client`, `Config` |
| `engine/factory.test.ts` | `Client`, `Config` |
| `registry/executors/agentExecutor.ts` | `Client`, `createLogger` |

## Success Criteria

- [ ] No imports from `../../../logging/` in orchestrator files
- [ ] No imports from `../../../client/` in orchestrator files
- [ ] No imports from `../../config/` in orchestrator files (except internal orchestrator config)
- [ ] All logging calls use opencode's `Log` utility
- [ ] Logging-related code passes `bun turbo typecheck`
- [ ] Files with commented Client/Config may have type errors (expected, will be fixed in TASK-03)

## Dependencies

- TASK-01 must be completed first
