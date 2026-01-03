---
description:
  Create a git branch from a task ID with validation and safety checks
model: haiku
---

# Create Branch from Task

Create a feature branch from a task ID with proper validation, safety checks,
and automatic code updates. This command ensures you're starting from a clean,
up-to-date main branch.

## Getting Started

**If task ID provided as parameter:**

Skip to Step 1: Setup Task Tracking

**If no task ID provided:**

<message>
Please provide the task ID for the branch you want to create.

Examples: AL-123, PROJ-456, JR-789

The branch will be created as: feature/{TASK-ID}

Enter the task ID: </message>

Wait for user input before proceeding.

## Step 1: Setup Task Tracking

<procedure>
1. Use TodoWrite to create task list for tracking progress:
</procedure>

```javascript
TodoWrite({
  todos: [
    {
      content: 'Validate task exists',
      activeForm: 'Validating task',
      status: 'in_progress',
    },
    {
      content: 'Check git status and current branch',
      activeForm: 'Checking git status',
      status: 'pending',
    },
    {
      content: 'Handle branch state and uncommitted changes',
      activeForm: 'Handling branch state',
      status: 'pending',
    },
    {
      content: 'Pull latest changes from remote',
      activeForm: 'Pulling latest changes',
      status: 'pending',
    },
    {
      content: 'Create feature branch',
      activeForm: 'Creating feature branch',
      status: 'pending',
    },
    {
      content: 'Verify branch creation',
      activeForm: 'Verifying branch creation',
      status: 'pending',
    },
  ],
});
```

<procedure>
2. Proceed to Step 2: Validate Task
</procedure>

## Step 2: Validate Task

<procedure>
1. Use the existing get-task command to validate the task exists:
</procedure>

```bash
alfred run task/get-task {taskId}
```

<procedure>
2. If command fails with "Task not found" or other error:
   - Show error message to user
   - Exit with helpful message about checking task ID

3. If successful:
   - Mark "Validate task exists" as completed
   - Proceed to Step 3 </procedure>

<output_format> Task {taskId} validated successfully! Proceeding to create
branch feature/{taskId}... </output_format>

## Step 3: Check Git Status

<procedure>
1. Mark "Check git status and current branch" as in_progress

2. Check current branch: </procedure>

```bash
git branch --show-current
```

<procedure>
3. Check for uncommitted changes:
</procedure>

```bash
git status --porcelain
```

<procedure>
4. Store the results for decision making in next step

5. Mark "Check git status and current branch" as completed

6. Proceed to Step 4: Handle Branch State </procedure>

## Step 4: Handle Branch State

<procedure>
1. Mark "Handle branch state and uncommitted changes" as in_progress

2. Analyze the git status from Step 3 and determine the scenario: </procedure>

### Scenario A: On main branch with NO uncommitted changes

<procedure>
- This is the ideal state
- Mark task as completed
- Proceed directly to Step 5: Pull Latest Changes
</procedure>

### Scenario B: On main branch with uncommitted changes

<procedure>
- Show error message
- Exit with instructions to commit or stash changes first
</procedure>

<output_format> Cannot create branch: You have uncommitted changes on main
branch.

Modified files: {list each modified file from git status}

Please either:

1. Commit your changes: `git add <files> && git commit -m "message"`
2. Stash your changes: `git stash save "WIP: description"`
3. Discard your changes: `git checkout -- <files>` (careful!)

Then run this command again. </output_format>

### Scenario C: On different branch with NO uncommitted changes

<procedure>
1. Switch to main branch:
</procedure>

```bash
git checkout main
```

<procedure>
2. Mark task as completed
3. Proceed to Step 5: Pull Latest Changes
</procedure>

### Scenario D: On different branch WITH uncommitted changes

<procedure>
1. Ask user what to do using the AskUserQuestion tool:
</procedure>

<message>
You're currently on branch {current_branch} with uncommitted changes.

What would you like to do? </message>

Options:

- **Stash changes** - Stash your changes, switch to main, create new branch
- **Commit changes** - Commit changes first, then switch to main, create new
  branch
- **Abort** - Cancel the operation and stay on current branch

<procedure>
2. If user chooses "Stash changes":
</procedure>

```bash
git stash save "WIP: {current_branch} - Auto-stashed before creating feature/{taskId}"
git checkout main
```

<procedure>
3. If user chooses "Commit changes":
   - Ask for commit message
   - Execute commit:
</procedure>

```bash
git add -A
git commit -m "{user_provided_message}"
git checkout main
```

<procedure>
4. If user chooses "Abort":
   - Show cancellation message
   - Exit command
</procedure>

<output_format> Operation cancelled. Still on branch {current_branch}. Run this
command again when ready to create feature/{taskId}. </output_format>

<procedure>
5. Mark task as completed
6. Proceed to Step 5: Pull Latest Changes
</procedure>

## Step 5: Pull Latest Changes

<procedure>
1. Mark "Pull latest changes from remote" as in_progress

2. Ensure we're on main branch: </procedure>

```bash
git branch --show-current
```

<procedure>
3. Pull latest changes from remote:
</procedure>

```bash
git pull origin main
```

<procedure>
4. If pull fails (merge conflicts, network issues, etc.):
   - Show the error
   - Exit with instructions to resolve manually

5. If successful:
   - Mark task as completed
   - Proceed to Step 6: Create Feature Branch </procedure>

<output_format> Updated main branch with latest changes from remote. Creating
feature branch now... </output_format>

## Step 6: Create Feature Branch

<procedure>
1. Mark "Create feature branch" as in_progress

2. Create and checkout the new branch: </procedure>

```bash
git checkout -b feature/{taskId}
```

<procedure>
3. If branch already exists locally:
   - Show error with suggestion to use different name or delete old branch
   - Exit

4. If successful:
   - Mark task as completed
   - Proceed to Step 7: Verify Branch Creation </procedure>

## Step 7: Verify Branch Creation

<procedure>
1. Mark "Verify branch creation" as in_progress

2. Confirm we're on the new branch: </procedure>

```bash
git branch --show-current
```

<procedure>
3. Show branch information:
</procedure>

```bash
git log --oneline -n 1
```

<procedure>
4. Mark task as completed

5. Show success message with next steps </procedure>

<output_format> Successfully created and switched to branch: feature/{taskId}

Branch created from latest main at commit: {commit_hash}

Next steps:

1. Make your code changes
2. Commit your work: `git add <files> && git commit -m "message"`
3. Push to remote: `git push -u origin feature/{taskId}`
4. Create a pull request when ready

Happy coding! </output_format>

## Important Guidelines

**Always validate the task:**

- Use `/task/get-task` to ensure task exists before creating branch
- This prevents creating branches for typos or invalid task IDs
- Cached task information available for context

**Ensure clean working state:**

- Never create branch with uncommitted changes on main
- On other branches, always ask user before auto-stashing
- Provide clear options and explanations

**Keep main branch updated:**

- Always pull latest changes before branching
- Ensures new branch starts from current codebase
- Prevents merge conflicts later

**Use TodoWrite for progress tracking:**

- Create task list at the start
- Mark tasks as in_progress when starting each step
- Mark completed before moving to next step
- Helps user see progress through the workflow

**Handle errors gracefully:**

- Git command failures: Show error and suggest resolution
- Branch already exists: Suggest alternatives
- Network issues: Provide manual fallback steps
- Uncommitted changes: Give user control over what to do

**Provide actionable feedback:**

- Show what's happening at each step
- Explain why each operation is needed
- Suggest next steps after success
- Include exact commands in error messages

## Example Sessions

### Example 1: Clean main branch (ideal case)

<example>
User: /git/create-branch AL-123
