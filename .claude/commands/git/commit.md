---
description: Create git commits with user approval and no Claude attribution
model: sonnet
---

# Git Commit Creation

You are tasked with creating git commits for changes made during this session.
Commits must be well-structured, clearly described, and authored solely by the
user.

## Step 1: Understand What Changed

<procedure>
1. Review conversation history to understand what was accomplished

2. Run git commands to see current state: </procedure>

```bash
git status  # See all changed files
git diff    # Understand the modifications
```

<procedure>
3. Consider whether changes should be:
   - Single logical commit
   - Multiple atomic commits grouped by purpose
</procedure>

## Step 2: Plan Your Commits

<procedure>
1. Identify which files belong together:
   - Group related changes
   - Keep commits focused and atomic
   - Separate unrelated changes into different commits

2. Draft clear, descriptive commit messages:
   - Use imperative mood (e.g., "Add feature" not "Added feature")
   - Focus on WHY changes were made, not just WHAT
   - First line: concise summary (50 chars or less)
   - Additional lines: detailed explanation if needed

3. Follow conventional commits format if project uses it:
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation changes
   - refactor: Code refactoring
   - test: Test additions or changes
   - chore: Maintenance tasks </procedure>

## Step 3: Present Plan to User

Present your commit plan for approval:

<output_format> I plan to create [N] commit(s):

**Commit 1:** [commit message] Files to add:

- path/to/file1.ext
- path/to/file2.ext
- path/to/file3.ext

**Commit 2:** [commit message] Files to add:

- path/to/file4.ext
- path/to/file5.ext

Shall I proceed with these commits? </output_format>

Wait for user confirmation before proceeding.

## Step 4: Execute Upon Confirmation

<procedure>
1. Add files with specific paths:
   - Use `git add` with explicit file paths
   - NEVER use `git add -A` or `git add .`
   - Add files for each commit separately

2. Create commit with planned message:
   - Use `git commit -m "message"` for single-line
   - Use heredoc for multi-line messages

3. Repeat for each planned commit

4. Show results: </procedure>

```bash
git log --oneline -n [number]  # Show recent commits
git status                      # Confirm clean state
```

## Important Guidelines

**NEVER add Claude attribution:**

- Do NOT add "Generated with Claude Code" messages
- Do NOT add "Co-Authored-By: Claude" lines
- Do NOT include any Claude or AI attribution
- Commits should appear as if user wrote them directly

**Write clear commit messages:**

- Be specific and descriptive
- Explain the "why" behind changes
- Use imperative mood consistently
- Keep first line concise

**Stage files explicitly:**

- Always specify exact file paths
- Never use wildcards or `.` for staging
- Group files logically per commit

**Maintain atomicity:**

- Each commit should be a logical unit
- Related changes belong together
- Unrelated changes should be separate commits

**Seek confirmation:**

- Always present plan before executing
- Allow user to adjust commit strategy
- Don't commit without explicit approval

## Example Commit Session

<example>
User: /dev/commit

Assistant: I'll create git commits for the changes made. Let me check what was
modified.

[Runs git status and git diff]

I can see we added parent-child tracking across 4 files. I plan to create 2
commits:

**Commit 1:** feat: add parent_id to events schema Files to add:

- migrations/003_add_parent_id.sql
- hld/store/events.go

**Commit 2:** feat: implement parent-child event tracking in daemon Files to
add:

- hld/daemon/runner.go
- hld/api/events.go

Shall I proceed with these commits?

User: Yes, looks good.

Assistant: [Executes commits]

\`git add migrations/003_add_parent_id.sql hld/store/events.go\` \`git commit -m
"feat: add parent_id to events schema"\`

\`git add hld/daemon/runner.go hld/api/events.go\` \`git commit -m "feat:
implement parent-child event tracking in daemon"\`

Commits created successfully:

\`\`\` 7a3b9c2 feat: implement parent-child event tracking in daemon 5f1e8d4
feat: add parent_id to events schema \`\`\`

All changes committed. Working directory is clean. </example>
