---
description: Assign task to yourself
model: haiku
---

# Assign Task to Me

Assign a task to yourself. This command makes it easy to take ownership of tasks
and add them to your workload.

## Getting Started

**If task ID provided as parameter:**

Assign immediately (e.g., `/task/assign-task AL-123`)

**If no parameter provided:**

Prompt for task ID, then assign to you.

## Step 1: Get Task ID

<procedure>
1. If task ID provided as parameter, use it

2. If no task ID provided, prompt: </procedure>

<message>
Enter the task ID you want to assign to yourself:

Example: AL-123 </message>

<procedure>
3. Wait for user input

4. Validate task ID format

5. Proceed to Step 2 </procedure>

## Step 2: Execute Assignment

<procedure>
1. Execute assign command with "me":
</procedure>

```bash
alfred task:assign {taskId} me
```

<procedure>
2. Monitor output for success or errors

3. If error, display message and suggest corrections

4. If successful, proceed to Step 3 </procedure>

## Step 3: Confirm Assignment

<output_format>

# Task Assigned to You!

**{Task ID}** is now assigned to you.

**Task:** {task summary} Previous assignee: {previous assignee or "Unassigned"}
New assignee: **{your name}**

**Quick actions:**

- View task: `/task/get-task {taskId}`
- Start work: `/task/transition-task {taskId}`
- View your tasks: `/task/get-open-tasks`
- Add comment: `alfred task:comment {taskId}` </output_format>

## Important Guidelines

**Automatic assignment:**

- Always assigns to "me" (current user)
- No need to specify assignee
- Quick way to take ownership of tasks

**Common use cases:**

- Taking ownership of unassigned tasks
- Reassigning task from someone else to yourself
- Adding task to your workload

**Error handling:**

- Task not found: Verify task ID
- Permission denied: Verify project permissions
- Already assigned to you: Confirms assignment
- Network errors: Check Jira connection

## Example Session

<example>
User: /task/assign-task AL-20
Assistant: Assigning task AL-20 to you...

[Runs alfred task:assign AL-20 me]

# Task Assigned to You\!

**AL-20** is now assigned to you.

**Task:** Implement user authentication Previous assignee: Unassigned New
assignee: **Mohammed Fahad Kaleem**

**Quick actions:**

- View task: `/task/get-task AL-20`
- Start work: `/task/transition-task AL-20`
- View your tasks: `/task/get-open-tasks`
- Add comment: `alfred task:comment AL-20` </example>
