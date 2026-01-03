---
description:
  Quickly fetch and display comprehensive Jira task details using Alfred
model: haiku
---

# Get Jira Task

Fetch and display comprehensive Jira task details using Alfred's task management
system. This command retrieves task information from Jira via MCP, caches it
locally, and presents all relevant details.

## Ticket ID Detection

**FIRST STEP:** Determine the ticket ID for this task.

<procedure>
1. Check if {{task_id}} template variable is provided (Alfred workflow mode):
   - If present, use {{task_id}} directly

2. If no template variable, check if ticket ID provided explicitly as parameter:
   - User may provide: `/task/get-task AL-1234` or
     `/task/get-task AL-1234 additional context`
   - If found, use that ticket ID

3. If no ticket ID provided, extract from current git branch:
   - Get branch name: `git branch --show-current`
   - Extract pattern: `feature/AL-1234`, `chore/AL-1234`, `bug/AL-1234`, etc.
   - Look for pattern: `AL-[0-9]+` (or similar Jira issue pattern)
   - If found, use that ticket ID

4. If no ticket ID found in branch name:
   - Ask user to provide ticket ID or ensure branch name contains it
   - Stop and wait for user input </procedure>

**Present ticket detection result to user:**

```
Detected Ticket: AL-1234 (from branch feature/AL-1234-add-pacing-algorithm)
```

## Step 1: Fetch Task from Jira

<procedure>
1. Execute alfred task:get command:
</procedure>

```bash
alfred task:get {taskId}
```

<procedure>
2. Monitor the output for success or errors

3. If command fails, show error and exit

4. If successful, proceed to Step 2 </procedure>

## Step 2: Read Cached Task Details

<procedure>
1. Read the generated task file:
</procedure>

```bash
cat .alfred/tasks/{taskId}/task.md
```

<procedure>
2. Read the state file for transitions:
</procedure>

```bash
cat .alfred/tasks/{taskId}/state.json
```

<procedure>
3. Parse both files and extract key information
</procedure>

## Step 3: Display Comprehensive Summary

Present the task information clearly:

<output_format>

# Task {Task ID}: {Summary}

## Description

{Full description with markdown formatting preserved}

## Metadata

- **Status:** {status}
- **Type:** {type}
- **Priority:** {priority}
- **Assignee:** {assignee}
- **Project:** {project}
- **Created:** {createdAt}
- **Updated:** {updatedAt}

## Available Transitions

{List each transition as: "• {name} → {targetStatus}"}

## Local Cache

Task cached at `.alfred/tasks/{taskId}/`

- Task details: `task.md`
- Workflow state: `state.json`

**Ready for use in workflows!** </output_format>

## Step 4: Suggest Next Actions

<message>
What would you like to do next?

**Quick actions:**

- Update task: `alfred task:update {taskId}`
- Add comment: `alfred task:comment {taskId}`
- Change status: `alfred task:transition {taskId}`
- Assign task: `alfred task:assign {taskId}`
- Run workflow: `alfred workflow <name> --task {taskId}` </message>

## Important Guidelines

**Handle errors gracefully:**

- Task not found: Verify ID and check Jira permissions
- Network errors: Check connection and MCP server status
- Auth errors: Run `alfred task:init` to reconfigure
- Invalid format: Task ID must be {PROJECT}-{NUMBER}

**Display task information:**

- Preserve all markdown formatting from Jira description
- Show complete metadata for context
- List available transitions for quick status changes
- Provide local file paths for manual inspection

**Be concise:**

- Focus on displaying the task information clearly
- Don't repeat information already shown by alfred task:get
- Provide actionable next steps
- Keep explanations brief

## Example Session

<example>
User: /task/get-task AL-19
Assistant: Detected Ticket: AL-19 (from parameter)

Fetching task AL-19 from Jira...

[Runs alfred task:get AL-19]

# Task AL-19: E2E Test - Updated Title

## Description

## Updated Description

This task has been updated to test the update functionality.

### Update Test

- Updated summary
- Updated description with new markdown

**Status**: Testing updates

## Metadata

- **Status:** In Progress
- **Type:** Task
- **Priority:** Medium
- **Assignee:** Unassigned
- **Project:** AL
- **Created:** 2025-11-07T11:27:53.662-0800
- **Updated:** 2025-11-07T11:30:11.069-0800

## Available Transitions

• To Do → To Do • In Progress → In Progress • Done → Done

## Local Cache

Task cached at `.alfred/tasks/AL-19/`

- Task details: `task.md`
- Workflow state: `state.json`

**Ready for use in workflows\!**

What would you like to do next?

**Quick actions:**

- Update task: `alfred task:update AL-19`
- Add comment: `alfred task:comment AL-19`
- Change status: `alfred task:transition AL-19`
- Assign task: `alfred task:assign AL-19`
- Run workflow: `alfred workflow <name> --task AL-19` </example>
