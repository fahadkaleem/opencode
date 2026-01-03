---
description: List your open tasks (assigned to you, not completed)
model: haiku
---

# Get Open Tasks

Display all tasks assigned to you that are currently open (not completed). This
provides a quick overview of your active workload across all projects.

## Getting Started

**If project filter provided as parameter:**

Use the project key to filter results (e.g., `/task/get-open-tasks AL`)

**If no parameter provided:**

Show all open tasks across all projects.

## Step 1: Search for Open Tasks

<procedure>
1. Execute search command for tasks assigned to you that are not done:
</procedure>

```bash
alfred task:search --assignee me --status "To Do,In Progress" [--project {projectKey}]
```

<procedure>
2. Capture the search results

3. Parse the JSON output

4. If no tasks found, inform user

5. If tasks found, proceed to Step 2 </procedure>

## Step 2: Display Tasks

Present tasks in a clean, organized format:

<output_format>

# Your Open Tasks

Found {count} open task(s) assigned to you.

## Tasks by Status

### To Do ({count})

1. **{taskId}** - {summary} Priority: {priority} | Project: {project}

2. **{taskId}** - {summary} Priority: {priority} | Project: {project}

### In Progress ({count})

1. **{taskId}** - {summary} Priority: {priority} | Project: {project}

---

**Quick actions:**

- View task: `/task/get-task {taskId}`
- Update task: `alfred task:update {taskId}`
- Transition task: `/task/transition-task {taskId}` </output_format>

**If no tasks found:**

<output_format>

# Your Open Tasks

No open tasks found assigned to you.

You're all caught up! </output_format>

## Step 3: Offer Filters

<message>
Would you like to:
- Filter by specific project
- Filter by priority (High, Medium, Low)
- See completed tasks instead
- Create a new task

Just let me know or run the appropriate command. </message>

## Important Guidelines

**Status filtering:**

- "Open" means status is "To Do" or "In Progress"
- Excludes "Done", "Closed", "Resolved"
- Can be customized for your Jira workflow statuses

**Display organization:**

- Group by status for clarity
- Sort by priority within each group
- Show essential metadata only
- Keep output scannable

**Performance:**

- Use alfred task:search with specific filters
- Limit results to reasonable number (default 50)
- Cache results for quick re-display

**Empty results:**

- Positive messaging when no tasks found
- Suggest creating a new task
- Offer to search differently

## Example Session

<example>
User: /task/get-open-tasks
Assistant: Searching for your open tasks...

[Runs alfred task:search --assignee me --status "To Do,In Progress"]

# Your Open Tasks

Found 3 open task(s) assigned to you.

## Tasks by Status

### To Do (2)

1. **AL-20** - Implement user authentication Priority: High | Project: AL

2. **AL-22** - Update API documentation Priority: Medium | Project: AL

### In Progress (1)

1. **AL-19** - E2E Test - Updated Title Priority: Medium | Project: AL

---

**Quick actions:**

- View task: `/task/get-task {taskId}`
- Update task: `alfred task:update {taskId}`
- Transition task: `/task/transition-task {taskId}`

Would you like to:

- Filter by specific project
- Filter by priority (High, Medium, Low)
- See completed tasks instead
- Create a new task </example>
