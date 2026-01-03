# TASK-05: Add CLI Command and Hardcoded Test Workflow

## Summary

Add a `flomaster` CLI command to opencode that executes a hardcoded test workflow. This provides end-to-end verification that the orchestrator integration works correctly.

## Context

With TASK-01 through TASK-04 complete, the orchestrator is integrated with opencode's session system. This task adds user-facing functionality:
1. A CLI command to trigger workflow execution
2. A simple hardcoded workflow for testing (plan → implement)
3. Console output showing workflow progress

This is intentionally minimal - just enough to prove the integration works. Configuration-driven workflows come later.

## Scope

### In Scope

- Add `flomaster` command to CLI (`src/cli/cmd/flomaster.ts`)
- Create hardcoded test workflow definition
- Initialize WorkflowEngine with AgentAdapter
- Execute workflow and display progress events
- Handle basic error cases

### Out of Scope

- Workflow configuration files
- Workflow selection/listing
- Persistence of workflow results
- UI integration
- Multiple concurrent workflows

## CLI Design

```bash
# Run the hardcoded test workflow
opencode flomaster

# Future (not in this task):
# opencode flomaster run <workflow-name>
# opencode flomaster list
```

## Hardcoded Test Workflow

A simple 2-step workflow to verify the integration:

```
┌─────────────┐     ┌──────────────┐
│   Input     │────▶│   Agent      │
│  (prompt)   │     │  (respond)   │
└─────────────┘     └──────────────┘
```

**Step 1: Input**
- Type: `Input`
- Provides: User's prompt/task

**Step 2: Agent**
- Type: `Agent`
- Uses: `build` agent (opencode's default)
- Receives: Input from Step 1
- Produces: AI response

## Implementation Approach

```typescript
// src/cli/cmd/flomaster.ts

import { WorkflowEngine, createWorkflowEngine } from '../orchestrator/index.js';
import { createAgentAdapter } from '../orchestrator/adapter/index.js';

export const command = 'flomaster';
export const describe = 'Run FloMaster workflow orchestrator';

export async function handler() {
  const adapter = createAgentAdapter({ directory: process.cwd() });
  const engine = createWorkflowEngine({ adapter });

  // Hardcoded workflow
  const workflow = {
    name: 'test-workflow',
    nodes: [...],
    edges: [...]
  };

  // Subscribe to events for console output
  engine.subscribe((event) => {
    console.log(`[${event.type}]`, event.data);
  });

  // Execute
  const result = await engine.executeWorkflow(workflow, {
    inputs: { prompt: 'Hello, this is a test!' }
  });

  console.log('Workflow completed:', result);
}
```

## Success Criteria

- [ ] `opencode flomaster` command exists and runs
- [ ] Workflow engine initializes without errors
- [ ] Test workflow executes successfully
- [ ] Progress events display in console
- [ ] Agent step produces AI response
- [ ] Workflow completes with success status
- [ ] Errors are handled gracefully with helpful messages

## Dependencies

- TASK-04 must be completed first (agentExecutor uses AgentAdapter)

## Files to Create/Modify

```
packages/opencode/src/cli/cmd/
├── flomaster.ts          # New CLI command

packages/opencode/src/orchestrator/
├── workflows/
│   └── test-workflow.ts  # Hardcoded test workflow definition
```

## Manual Verification Steps

1. Build opencode: `bun run build`
2. Run command: `opencode flomaster`
3. Observe workflow execution in terminal
4. Verify agent step produces response
5. Verify clean completion message
