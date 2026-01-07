# TASK-10: Step Configuration Schema

## Overview

Implement a comprehensive step configuration schema for FloMaster workflow steps, enabling per-step customization of agent behavior, timeouts, retries, and output structure.

## Background

FloMaster workflows consist of steps that execute AI agents. Currently, step configuration is limited:
- `agentType` works but defaults to "build"
- `model` override works
- `systemPrompt` works
- `tools` toggle works
- `temperature` and `maxTokens` are defined but **not usable** (SessionPrompt doesn't accept them)
- No per-step timeout
- No per-step retry configuration
- Output structure is inconsistent (no summary, no artifacts tracking)

## Requirements

### Functional Requirements

1. **Per-Step Timeout Configuration**
   - Steps can specify `timeoutMs` to override workflow default
   - Timeout triggers abort signal to cancel execution
   - Default: 300000ms (5 minutes)

2. **Per-Step Retry Configuration**
   - Steps can specify `maxRetries` to override workflow default
   - Retry logic already exists in XState machine (needs modification)
   - Default: workflow-level maxRetries (currently 3)

3. **Consistent Step Output Schema**
   - All steps return consistent structure: `{ success, summary, artifacts, response }`
   - `success`: boolean indicating step completion
   - `summary`: human-readable summary of what was done
   - `artifacts`: array of file paths created/modified
   - `response`: full agent text response (for {{step.response}} interpolation)

4. **Clean Up Unused Fields**
   - Remove `temperature` and `maxTokens` from AgentConfig (not supported by SessionPrompt)
   - Document that these must be configured at agent-level in `.opencode/agents/`

### Non-Functional Requirements

- Maintain backward compatibility with existing workflows
- Keep FloMaster self-contained (no modifications to OpenCode core outside `src/flomaster/`)
- All changes must pass `bun turbo typecheck`

## Out of Scope

- Per-step `temperature` configuration (SessionPrompt doesn't support it)
- Per-step `maxTokens` configuration (resolved from model limits)
- Retry backoff configuration (keep simple with just maxRetries)
- Output schema validation with Zod (defer to future task)
- Workflow JSON file loading from `.flomaster/workflows/` (TASK-11)

## Technical Constraints

### SessionPrompt.prompt() Limitations

From investigation of `src/session/prompt.ts`:

```typescript
// SessionPrompt.prompt() accepts:
sessionID, messageID, model, agent, noReply, tools, system, variant, parts

// It does NOT accept:
temperature, maxTokens, timeout
```

Temperature comes from `agent.temperature` in agent definition.
MaxTokens comes from `ProviderTransform.maxOutputTokens()` based on model limits.

### XState Machine Retry Logic

Current implementation at `src/flomaster/orchestrator/machine/workflowMachine.ts`:
- `handleError` state with `canRetry` guard
- `maxRetries` is workflow-level (context.maxRetries)
- Need to modify guard to read from step config

## Success Criteria

- [ ] Steps can specify `timeoutMs` and execution respects it
- [ ] Steps can specify `maxRetries` and retry logic uses it
- [ ] All agent steps return consistent `{ success, summary, artifacts, response }` outputs
- [ ] Existing workflows continue to work (backward compatible)
- [ ] `bun turbo typecheck` passes
- [ ] `bun dev workflow run --workflow sdlc "Test"` completes successfully

## Related Tasks

- **TASK-09**: State persistence (completed) - provides foundation for step output storage
- **TASK-11**: Workflow JSON file loading (future) - will use this schema
- **TASK-12**: Unit tests (future) - will test this functionality

## References

- Requirements: `design/01-overview/02-requirements-overview.md` (HL-CF-001, HL-WF-006)
- Architecture: `design/01-overview/04-opencode-architecture.md`
- Current types: `src/flomaster/orchestrator/types.ts`
- Agent executor: `src/flomaster/orchestrator/registry/executors/agentExecutor.ts`
- XState machine: `src/flomaster/orchestrator/machine/workflowMachine.ts`
