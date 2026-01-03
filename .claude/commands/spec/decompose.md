# Task Decomposition Command

**Task ID:** {{task_id}}

You are an expert at breaking down specifications into concrete, implementable
tasks. Your job is to read the specification analysis and decompose it into
discrete development tasks that can be implemented independently.

## Input

Read the specification analysis from:

- `.alfred/tasks/{{task_id}}/artifacts/spec-analysis.json`

## Task Decomposition Strategy

1. **Group by Component:** Organize tasks by the major components identified in
   the spec
2. **Prioritize by Requirement Priority:** P0 requirements should map to earlier
   tasks
3. **Consider Dependencies:** Order tasks so dependencies are implemented first
4. **Enable Parallelization:** Identify tasks that can be worked on
   simultaneously
5. **Include Infrastructure:** Don't forget setup, configuration, and testing
   tasks

## Iteration Support

**IMPORTANT:** This command supports iteration tracking for multi-iteration
implementations (like CodeMachine).

- **First Run:** Creates `task-breakdown-I1.json` (iteration 1)
- **Subsequent Runs:** Creates `task-breakdown-I2.json`,
  `task-breakdown-I3.json`, etc.
- **Latest Symlink:** Always updates `task-breakdown.json` →
  `task-breakdown-IN.json`

**Check for Previous Iterations:** Look for existing files matching
`task-breakdown-I*.json` to determine current iteration number.

## Output Format

Create a task breakdown file at
`.alfred/tasks/{{task_id}}/artifacts/task-breakdown-I{{iteration}}.json`:

```json
{
  "iteration": 1,
  "created_at": "ISO timestamp",
  "previous_iteration": null,
  "total_tasks": 0,
  "tasks": [
    {
      "task_id": "T001",
      "component": "string - component name",
      "title": "string - brief title",
      "description": "string - detailed description",
      "requirements": ["REQ-001", "REQ-002"],
      "type": "setup|implementation|testing|documentation|infrastructure",
      "priority": "P0|P1|P2|P3",
      "estimated_complexity": "low|medium|high",
      "dependencies": ["T000"],
      "parallelizable": true,
      "execute_once": false,
      "skip_on_retry": false,
      "target_files": ["path/to/file.ts"],
      "acceptance_criteria": ["Criteria 1", "Criteria 2"],
      "implementation_notes": "string - guidance for implementation"
    }
  ],
  "iteration_notes": "string - why this iteration was created",
  "parallel_groups": [
    {
      "group_id": "PG001",
      "description": "string - what can be done in parallel",
      "tasks": ["T001", "T002", "T003"]
    }
  ]
}
```

## Task Types

- **setup**: Project scaffolding, directory structure, configuration
- **implementation**: Feature development, business logic
- **testing**: Test creation, test infrastructure
- **documentation**: README, API docs, inline comments
- **infrastructure**: CI/CD, deployment, monitoring setup

## Task Execution Control

**execute_once (boolean):**

- `true`: Task runs exactly once, even in multi-iteration workflows
- `false`: Task can run in multiple iterations (default)
- **Use for:** Initial scaffolding, one-time setup tasks

**skip_on_retry (boolean):**

- `true`: Skip this task when retrying after failure
- `false`: Re-run this task on retry (default)
- **Use for:** Idempotent tasks that don't need re-running

## Decomposition Guidelines

1. **Atomic Tasks:** Each task should be independently completable in one
   session
2. **Clear Acceptance Criteria:** Each task must have verifiable completion
   criteria
3. **Requirement Mapping:** Link each task to specific requirements (REQ-XXX)
4. **File-Level Granularity:** Specify which files each task will create/modify
5. **Implementation Guidance:** Provide context about how to implement each task

## Example Task Breakdown Pattern

For a web application with auth, use this pattern:

**Phase 1: Setup** (T001-T003)

- T001: Project scaffolding
- T002: Database schema setup
- T003: Configuration management

**Phase 2: Core Features** (T004-T010) - Can parallelize

- T004: User model and database layer
- T005: Authentication service
- T006: API endpoints for auth
- T007: Frontend components for login
- T008: Session management
- T009: Authorization middleware
- T010: User profile management

**Phase 3: Testing** (T011-T013) - After Phase 2

- T011: Unit tests for auth service
- T012: Integration tests for API
- T013: E2E tests for user flows

**Phase 4: Documentation** (T014-T015) - Can parallelize with Phase 3

- T014: API documentation
- T015: README and setup instructions

## Output

After creating the task breakdown, output:

### Task Decomposition Complete

**Total Tasks:** [count]

**By Priority:**

- P0: [count] tasks
- P1: [count] tasks
- P2: [count] tasks
- P3: [count] tasks

**By Type:**

- Setup: [count]
- Implementation: [count]
- Testing: [count]
- Documentation: [count]
- Infrastructure: [count]

**Parallelization:**

- [count] parallel groups identified
- Up to [max] tasks can run simultaneously

**Next Steps:**

1. Review task breakdown in
   `.alfred/tasks/{{task_id}}/artifacts/task-breakdown.json`
2. Run `alfred run spec:scaffold --task {{task_id}}` to scaffold project
   structure (if T001 is setup task)
3. Start implementation with
   `alfred run impl:from-spec --task {{task_id}} --subtask T001`

---

**Task breakdown saved to:**

- Iteration file:
  `.alfred/tasks/{{task_id}}/artifacts/task-breakdown-I{{iteration}}.json`
- Latest symlink: `.alfred/tasks/{{task_id}}/artifacts/task-breakdown.json` →
  `task-breakdown-I{{iteration}}.json`

{{#if previous_iteration}} **Previous iteration:**
`task-breakdown-I{{previous_iteration}}.json` {{/if}}

{{#if tasks}} **Available for expansion:** The task breakdown includes a `tasks`
array that can be used with workflow `expand_on_success` to automatically create
phases for each task. {{/if}}

## Iteration Management

**Creating symlink:** After writing the iteration file, create a symlink for
easy access:

```bash
cd .alfred/tasks/{{task_id}}/artifacts/
ln -sf task-breakdown-I{{iteration}}.json task-breakdown.json
```

This ensures other commands can always reference `task-breakdown.json` without
knowing the iteration number.
