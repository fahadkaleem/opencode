---
description: Detect task ID from template variable, parameter, or git branch
model: haiku
---

# Task ID Detection

Detect the task ID for the current context from multiple sources in priority
order: Alfred workflow template variable, explicit parameter, or git branch
name.

## Detection Process

<procedure>
1. Check if {{task_id}} template variable is provided (Alfred workflow mode):
   - If present, use {{task_id}} directly
   - Source: Alfred workflow

2. If no template variable, check if ticket ID provided explicitly as parameter:
   - User may provide: `/task:detect-task-id AL-1234` or additional context
   - Extract first argument matching pattern: `AL-[0-9]+` or similar
   - If found, use that ticket ID
   - Source: Parameter

3. If no ticket ID provided, extract from current git branch:
   - Get branch name: `git branch --show-current`
   - Extract pattern: `feature/AL-1234`, `chore/AL-1234`, `bug/AL-1234`, etc.
   - Look for pattern: `AL-[0-9]+` (or similar Jira issue pattern)
   - If found, use that ticket ID
   - Source: Git branch

4. If no ticket ID found in branch name:
   - Ask user to provide ticket ID or ensure branch name contains it
   - Stop and wait for user input </procedure>

## Output Format

Once task ID is determined, output in this exact format:

```
Task: AL-1234
Directory: .alfred/tasks/AL-1234/
```

This standardized output can be parsed by other commands to extract the task ID
and directory path.

## Important Guidelines

**Detection Priority:**

- Template variable has highest priority (Alfred workflow mode)
- Explicit parameter second (direct invocation)
- Git branch third (implicit detection)
- User prompt last resort (when nothing found)

**Output Consistency:**

- Always use exact format shown above
- First line: `Task: {TASK_ID}`
- Second line: `Directory: .alfred/tasks/{TASK_ID}/`
- No additional text or formatting
- This enables reliable parsing by parent commands

**Error Handling:**

- If no task ID can be determined and user doesn't provide one, stop
- Never proceed without a valid task ID
- Validate task ID format matches expected pattern

## Usage Examples

**Alfred Workflow Mode:**

```yaml
# workflow.yaml
phases:
  - command: task:detect-task-id # Receives {{task_id}}
  - command: dev:plan # Uses detected task
```

**Standalone with Parameter:**

```bash
/task:detect-task-id AL-1234
```

**Standalone from Git Branch:**

```bash
# On branch: feature/AL-1234-add-authentication
/task:detect-task-id
# Output:
# Task: AL-1234
# Directory: .alfred/tasks/AL-1234/
```

**Standalone with Prompt:**

```bash
# On branch: main (no task ID in branch name)
/task:detect-task-id
# Prompts: "Please provide ticket ID"
```

## Example Session

<example>
User: /task:detect-task-id

# (On branch: feature/AL-1234-implement-auth)

Assistant: Extracting task ID from git branch...

Task: AL-1234 Directory: .alfred/tasks/AL-1234/ </example>
