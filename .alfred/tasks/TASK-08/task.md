# TASK-08: Default Step Agents

## Overview

Create pre-built agent definitions in `.opencode/agents/` optimized for common workflow step patterns. These agents leverage OpenCode's existing agent loading infrastructure - no code changes required.

## Background

TASK-07 established that `agentExecutor.ts` uses `Agent.get(agentType)` to look up agents. OpenCode automatically loads custom agents from `.opencode/agents/*.md` files via `Config.loadAgent()`. We simply need to create well-designed agent configurations.

## Deliverables

Create 4 agent markdown files in `packages/opencode/.opencode/agents/`:

| Agent | Purpose | Key Permissions |
|-------|---------|-----------------|
| `research-agent.md` | Codebase exploration & analysis | read, grep, glob only |
| `plan-agent.md` | Implementation planning | read + write to plan files |
| `implement-agent.md` | Code implementation | full build access |
| `review-agent.md` | Code review & analysis | read + analysis tools |

## Agent File Format

Each agent uses YAML frontmatter + markdown body:

```markdown
---
mode: subagent
description: Brief description for agent selection
permission:
  tool-name: allow|deny|ask
  "*": deny
---
System prompt content here...
```

## Key Constraints

1. **mode: subagent** - All workflow step agents must use subagent mode (not primary)
2. **No task permission** - Agents should NOT have `task` permission to prevent recursion (handled by `agentExecutor.ts` already)
3. **Clear permission boundaries** - Each agent should have well-defined, minimal permissions for its role
4. **Focused prompts** - System prompts should be concise and role-specific

## Success Criteria

- [ ] All 4 agent files exist in `packages/opencode/.opencode/agents/`
- [ ] `bun dev workflow run --workflow test` works with default agents
- [ ] Each agent has appropriate permission restrictions
- [ ] Agents can be used via `agentType` in workflow steps
- [ ] CONTEXT.md updated with TASK-08 completion

## Dependencies

- TASK-07 (Complete) - Agent integration in agentExecutor.ts

## Non-Goals

- No TypeScript code changes
- No new infrastructure or adapters
- No backward compatibility concerns (greenfield project)
