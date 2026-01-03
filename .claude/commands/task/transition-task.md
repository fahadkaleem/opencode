---
description: Change task status through available workflow transitions
model: haiku
---

# Transition Task Status

Change a task's status by selecting from available workflow transitions. This
command shows you valid status changes and executes the transition safely.

## Getting Started

**If task ID and status provided as parameters:**

Execute transition directly (e.g., `/task/transition-task AL-123 "In Progress"`)

**If only task ID provided:**

Show available transitions and prompt for selection.

**If no parameters provided:**

Prompt for task ID, then show available transitions.

## Step 1: Get Task ID

<procedure>
1. If task ID provided as parameter, use it

2. If no task ID provided, prompt: </procedure>

<message>
Enter the task ID you want to transition:

Example: AL-123 </message>

<procedure>
3. Wait for user input

4. Validate task ID format

5. Proceed to Step 2 </procedure>

## Step 2: Fetch Available Transitions

<procedure>
1. Execute transitions command:
</procedure>

```bash
alfred task:transitions {taskId}
```

<procedure>
2. Parse the available transitions

3. If no transitions available, inform user

4. If transitions found, proceed to Step 3 </procedure>

## Step 3: Display Transitions and Select

Present available transitions:

<output_format>

# Available Transitions for {Task ID}

Current Status: **{currentStatus}**

Available status changes:

1. {transition name} → {target status}
2. {transition name} → {target status}
3. {transition name} → {target status}

Which transition would you like to execute? (Enter number or status name)
</output_format>

<procedure>
1. If status already provided as parameter, skip to Step 4

2. If not, wait for user selection

3. Validate selection

4. Proceed to Step 4 </procedure>

## Step 4: Execute Transition

<procedure>
1. Execute transition command:
</procedure>

```bash
alfred task:transition {taskId} "{targetStatus}"
```

<procedure>
2. Monitor output for success or errors

3. If error, display message and suggest fixes

4. If successful, proceed to Step 5 </procedure>

## Step 5: Confirm Transition

<output_format>

# Transition Successful!

**{Task ID}** status changed: {oldStatus} → **{newStatus}**

Task updated successfully.

**Quick actions:**

- View task: `/task/get-task {taskId}`
- Add comment: `alfred task:comment {taskId} -c "Moved to {newStatus}"`
- View all open tasks: `/task/get-open-tasks` </output_format>

## Important Guidelines

**Valid transitions:**

- Only transitions configured in Jira workflow are available
- Cannot directly jump between arbitrary statuses
- Some transitions may require additional fields (resolution, etc.)

**Status names:**

- Use exact status names as shown in transitions list
- Status names with spaces need quotes
- Case-sensitive in some Jira configurations

**Common transitions:**

- "To Do" → "In Progress" (start work)
- "In Progress" → "Done" (complete task)
- "In Progress" → "To Do" (pause work)
- "Done" → "To Do" (reopen task)

**Error handling:**

- Invalid transition: Show available transitions
- Task not found: Verify task ID
- Permission errors: Check Jira permissions
- Workflow errors: Contact Jira admin

## Example Session

<example>
User: /task/transition-task AL-19
Assistant: Fetching available transitions for AL-19...

[Runs alfred task:transitions AL-19]

# Available Transitions for AL-19

Current Status: **In Progress**

Available status changes:

1. To Do → To Do
2. In Progress → In Progress
3. Done → Done

Which transition would you like to execute? (Enter number or status name)

User: Done

Assistant: Transitioning task to Done...

[Runs alfred task:transition AL-19 "Done"]

# Transition Successful\!

**AL-19** status changed: In Progress → **Done**

Task updated successfully.

**Quick actions:**

- View task: `/task/get-task AL-19`
- Add comment: `alfred task:comment AL-19 -c "Moved to Done"`
- View all open tasks: `/task/get-open-tasks` </example>
