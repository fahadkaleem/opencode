# Codebase Concerns

**Analysis Date:** 2026-01-08

## Tech Debt

**Unimplemented HTTP Execution Listing:**
- Issue: `/workflow/executions` endpoint returns empty list with TODO comment
- Files: `packages/opencode/src/server/workflow.ts:115`
- Why: Wiring not completed during initial implementation
- Impact: Workflow execution history not accessible via HTTP API
- Fix approach: Wire StateManager into route handler

**Silent Error Swallowing in Workflow Loader:**
- Issue: Discovery phase catches all errors without logging
- Files: `packages/opencode/src/flomaster/orchestrator/loader/workflowLoader.ts:84-86`
- Why: Skip invalid files during discovery without breaking
- Impact: Invalid workflow files fail silently, difficult to debug
- Fix approach: Add warning log before skipping

**Placeholder Executor Pattern:**
- Issue: Fallback to placeholder executors when Session unavailable
- Files: `packages/opencode/src/flomaster/orchestrator/registry/stepExecutorRegistry.ts:361-367`
- Why: Allow tests to run without full Session setup
- Impact: Placeholders return `{ _placeholder: true }`, hiding init failures
- Fix approach: Make placeholder usage explicit, fail clearly in production

**Missing Debug Logging:**
- Issue: 5+ "TODO: Add debug logging here" comments in critical paths
- Files: Multiple in `packages/opencode/src/flomaster/orchestrator/`
- Why: Deferred during initial implementation
- Impact: Observability gaps during workflow execution
- Fix approach: Add structured logging at TODO locations

## Known Bugs

**Background Workflow Error Not Surfaced:**
- Symptoms: Failed workflows only logged, not visible to users
- Trigger: Workflow execution via HTTP API fails
- Files: `packages/opencode/src/server/workflow.ts:192-200`
- Workaround: Check logs or execution.json manually
- Root cause: .catch() logs but doesn't notify UI
- Fix: Add error event to bus, surface in TUI

## Security Considerations

**Path Traversal Risk in Workflow Loader:**
- Risk: Workflow name like `../../.secret` could load files outside `.flomaster/workflows/`
- Files: `packages/opencode/src/flomaster/orchestrator/loader/workflowLoader.ts:97`
- Current mitigation: None
- Recommendations: Validate name against `../` patterns; use path.resolve() and verify containment

**CLI Uses process.cwd() Instead of Instance.worktree:**
- Risk: In nested directories, `.flomaster/` may resolve to wrong location
- Files: `packages/opencode/src/flomaster/cli/workflow.ts:91,370,481,571,612,679`
- Current mitigation: Server uses correct worktree
- Recommendations: Consistently use `Instance.worktree` in CLI commands

## Performance Bottlenecks

**Synchronous File I/O in Discovery:**
- Problem: `readdirSync` and `readFileSync` block event loop
- Files: `packages/opencode/src/flomaster/orchestrator/loader/workflowLoader.ts:69-87`
- Measurement: Not measured (likely <100ms for typical workflow counts)
- Cause: Sync operations in discovery loop
- Improvement path: Convert to async `readdir`/`readFile` with Promise.all

**No Workflow Execution Timeout:**
- Problem: Infinite loops or stuck agents never abort
- Files: `packages/opencode/src/flomaster/orchestrator/engine/workflowEngine.ts`
- Measurement: N/A (infinite)
- Cause: No max execution timeout implemented
- Improvement path: Add configurable timeout per step and overall workflow

## Fragile Areas

**WorkflowEngine Class:**
- Files: `packages/opencode/src/flomaster/orchestrator/engine/workflowEngine.ts`
- Why fragile: 650+ lines managing execution, state, snapshots, actors, events
- Common failures: State transitions, actor lifecycle errors
- Safe modification: Add tests for state transitions before changes
- Test coverage: Good (unit tests exist)

**StepExecutorRegistry:**
- Files: `packages/opencode/src/flomaster/orchestrator/registry/stepExecutorRegistry.ts`
- Why fragile: Registration, initialization, lookup, error handling in one class
- Common failures: Executor lookup returning placeholder unexpectedly
- Safe modification: Verify initialization called before use
- Test coverage: Moderate (factory tests cover happy path)

**Initialization Order Dependencies:**
- Files: Multiple (StateManager, StepExecutorRegistry)
- Why fragile: `initialize()` must be called before use, not enforced
- Common failures: Methods called before initialization return undefined
- Safe modification: Check `isInitialized()` or add guards
- Test coverage: Not tested explicitly

## Scaling Limits

**Lock Registry Memory:**
- Current capacity: Unbounded Map in LockManager
- Files: `packages/opencode/src/flomaster/state/internal/lockManager.ts:51`
- Limit: Thousands of executions without cleanup
- Symptoms at limit: Memory leak
- Scaling path: Call `removeLock()` after execution completes, or add TTL

**StateManager Cache:**
- Current capacity: Unbounded Map per worktree
- Files: `packages/opencode/src/flomaster/server/routes.ts:38`
- Limit: Worktree context switches accumulate
- Symptoms at limit: Memory leak in long-running server
- Scaling path: Bounded cache with TTL eviction

## Dependencies at Risk

**XState v5:**
- Risk: Still evolving API (v5 is major version)
- Impact: Workflow machine may need updates on minor releases
- Migration plan: Pin version, update carefully with tests

## Missing Critical Features

**Plugin/Extension Point for Custom Executors:**
- Problem: Adding new step types requires modifying core registry
- Current workaround: Fork and modify
- Blocks: Users cannot add custom executor types
- Implementation complexity: Medium (design plugin interface)

**Abstraction for Workflow Loading:**
- Problem: Hard-coded to load from `.flomaster/workflows/*.json`
- Current workaround: Only file-based workflows
- Blocks: Cannot load from databases, remote servers
- Implementation complexity: Low (add loader interface)

**TUI Integration for Workflow State:**
- Problem: Workflow execution state not synced to TUI in real-time
- Current workaround: Manual refresh
- Blocks: Real-time workflow monitoring
- Implementation complexity: Medium (add SSE/bus integration)

## Test Coverage Gaps

**HTTP API Integration Tests:**
- What's not tested: Server routes for workflow operations
- Risk: API contract could break
- Priority: Medium
- Difficulty to test: Need to mock/setup full server

**CLI Directory Resolution:**
- What's not tested: CLI behavior from subdirectories
- Risk: Wrong `.flomaster/` location in nested directories
- Priority: High (known issue)
- Difficulty to test: Need to test from various working directories

**Middleware Chain:**
- What's not tested: Order-dependent middleware execution
- Risk: Breaking auth or validation
- Priority: Medium
- Difficulty to test: Need integration test setup

---

## Integration Status Summary

**FloMaster-OpenCode Integration: ~70% Complete**

**Working:**
- Workflow execution engine
- CLI commands (workflow run/list/inspect)
- Server routes mounted
- Session integration for step execution
- State persistence to disk
- Built-in workflows

**Incomplete:**
- HTTP API execution listing
- TUI dialog widget (exists but not integrated)
- Real-time state sync to TUI
- Error notification to UI
- Refinement feedback loop

---

*Concerns audit: 2026-01-08*
*Update as issues are fixed or new ones discovered*
