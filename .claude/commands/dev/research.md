---
description: Document codebase as-is for task research
model: opus
---

# Codebase Research and Documentation

You are tasked with conducting comprehensive research across the codebase to
answer user questions by spawning parallel sub-agents and synthesizing their
findings.

## CRITICAL: Your Role is Documentation, Not Evaluation

**Your ONLY job is to document and explain the codebase as it exists today:**

- DO NOT suggest improvements or changes unless user explicitly asks
- DO NOT perform root cause analysis unless user explicitly asks
- DO NOT propose future enhancements unless user explicitly asks
- DO NOT critique the implementation or identify problems
- DO NOT recommend refactoring, optimization, or architectural changes
- ONLY describe what exists, where it exists, how it works, and how components
  interact

You are creating a technical map and documentation of the existing system.

## Step 1: Detect Task ID and Load Context

**FIRST STEP:** Determine the ticket ID for this task.

<procedure>
1. Use the SlashCommand tool to execute `/task:detect-task-id`

2. The command will output the task ID in this format:

   ```
   Task: AL-1234
   Directory: .alfred/tasks/AL-1234/
   ```

3. Extract the task ID from the output (e.g., AL-1234)

4. Use this task ID as TICKET_ID in all subsequent steps

5. The task directory is: `.alfred/tasks/${TICKET_ID}/`

6. **REQUIRED:** Check that `.alfred/tasks/${TICKET_ID}/task.md` exists:
   - This file contains the task description and requirements
   - If missing, show error and stop:

     ```
     ERROR: Task description not found!
     Required file: .alfred/tasks/${TICKET_ID}/task.md

     Please run: alfred task get ${TICKET_ID}
     Then proceed with research.
     ```

   - If exists, read it FULLY to understand what needs to be researched
     </procedure>

## Initial Setup

When this command is invoked:

<message>
I'm ready to research the codebase. Please provide your research question or area of interest, and I'll analyze it thoroughly by exploring relevant components and connections.
</message>

Wait for the user's research query.

## Step 2: Read Directly Mentioned Files

**IMPORTANT:** If user mentions specific files, read them FULLY first.

<procedure>
1. Read any directly mentioned files:
   - Ticket files
   - Documentation files
   - JSON data files
   - Use Read tool WITHOUT limit or offset parameters
   - Read these files yourself in main context BEFORE spawning sub-tasks
   - This ensures you have full context before decomposing the research
</procedure>

## Step 3: Analyze and Decompose Research Question

<procedure>
1. Break down user's query into composable research areas

2. Take time to think deeply about:
   - Underlying patterns the user might be seeking
   - Connections between components
   - Architectural implications

3. Identify specific components, patterns, or concepts to investigate

4. Create research plan using TodoWrite to track all subtasks

5. Consider which directories, files, or architectural patterns are relevant
   </procedure>

## Step 4: Spawn Parallel Sub-agent Tasks

<procedure>
1. Create multiple Task agents to research different aspects concurrently

2. Use specialized agents for specific research tasks: </procedure>

**For codebase research:**

- file-assistant: Find WHERE files and components live
- code-assistant: Understand HOW specific code works (without critiquing)
- pattern-assistant: Find examples of existing patterns (without evaluating)

**For project documentation:**

- doc-finder: Discover what documentation exists in .alfred/docs/ and
  .alfred/tasks/
- doc-assistant: Extract key insights from documentation (only most relevant
  ones)

**For web research (only if user explicitly asks):**

- research-assistant: External documentation and resources
- **IMPORTANT:** If using web research, instruct agents to return LINKS with
  findings
- INCLUDE those links in your final report

**IMPORTANT:** All agents are documentarians, not critics. They will describe
what exists without suggesting improvements or identifying issues.

<procedure>
3. Key principles for using agents:
   - Start with locator agents to find what exists
   - Then use analyzer agents on most promising findings to document how they work
   - Run multiple agents in parallel when searching for different things
   - Each agent knows its job - just tell it what you're looking for
   - Don't write detailed prompts about HOW to search - agents already know
   - Remind agents they are documenting, not evaluating or improving

4. Wait for ALL sub-agents to complete before proceeding </procedure>

## Step 5: Synthesize Findings

<procedure>
1. Wait for ALL sub-agent tasks to complete

2. Compile all sub-agent results from codebase and documentation

3. Connect findings across different components

4. Include specific file paths and line numbers for reference

5. Highlight patterns, connections, and architectural decisions

6. Answer user's specific questions with concrete evidence </procedure>

## Step 6: Gather Metadata for Research Document

<procedure>
1. Run `hack/spec_metadata.sh` script to generate all relevant metadata

2. Determine filepath:
   - Location: `.alfred/tasks/${TICKET_ID}/research.md`
   - Use the TICKET_ID detected at the start of this command
   - Example: `.alfred/tasks/AL-1234/research.md`
   - Ensure the task directory exists before writing </procedure>

## Step 7: Generate Research Document

Use metadata gathered in Step 6 and structure document with YAML frontmatter
followed by content:

<template>
```markdown
---
date: [Current date and time with timezone in ISO format]
researcher: [Researcher name from git config or "AI Assistant"]
git_commit: [Current commit hash]
branch: [Current branch name]
repository: [Repository name]
topic: "[User's Question/Topic]"
tags: [research, codebase, relevant-component-names]
status: complete
last_updated: [Current date in YYYY-MM-DD format]
last_updated_by: [Researcher name]
---

# Research: [User's Question/Topic]

**Date:** [Current date and time with timezone] **Researcher:** [Researcher name
from git config or "AI Assistant"] **Git Commit:** [Current commit hash]
**Branch:** [Current branch name] **Repository:** [Repository name]

## Research Question

[Original user query]

## Summary

[High-level documentation of what was found, answering user's question by
describing what exists]

## Detailed Findings

### [Component/Area 1]

- Description of what exists ([file.ext:line](link))
- How it connects to other components
- Current implementation details (without evaluation)

### [Component/Area 2]

...

## Code References

- `path/to/file.py:123` - Description of what's there
- `another/file.ts:45-67` - Description of the code block

## Architecture Documentation

[Current patterns, conventions, and design implementations found in codebase]

## Related Research

[Links to other task research if relevant: `.alfred/tasks/AL-XXXX/research.md`]
[Links to project documentation: `.alfred/docs/[relevant].md`]

## Open Questions

[Any areas that need further investigation]

```
</template>

## Step 8: Add GitHub Permalinks (if applicable)

<procedure>
1. Check if on main branch or if commit is pushed:
   - `git branch --show-current`
   - `git status`

2. If on main/master or pushed, generate GitHub permalinks:
   - Get repo info: `gh repo view --json owner,name`
   - Create permalinks: `https://github.com/{owner}/{repo}/blob/{commit}/{file}#L{line}`

3. Replace local file references with permalinks in document
</procedure>

## Step 9: Present Findings

<procedure>
1. Present concise summary of findings to user:
   - Include key file references for easy navigation
   - Highlight main discoveries
   - Show research document location

3. Ask if they have follow-up questions or need clarification
</procedure>

## Step 10: Handle Follow-up Questions

If user has follow-up questions:

<procedure>
1. Append to the same research document

2. Update frontmatter fields:
   - `last_updated`: Current date in YYYY-MM-DD format
   - `last_updated_by`: Researcher name
   - Add `last_updated_note: "Added follow-up research for [brief description]"`

3. Add new section: `## Follow-up Research [timestamp]`

4. Spawn new sub-agents as needed for additional investigation
</procedure>

## Important Notes

**Always use parallel Task agents** to maximize efficiency and minimize context usage.

**Always run fresh codebase research** - never rely solely on existing research documents.

**Focus on finding** concrete file paths and line numbers for developer reference.

**Research documents** should be self-contained with all necessary context.

**Each sub-agent prompt** should be specific and focused on read-only documentation operations.

**Document cross-component connections** and how systems interact.

**Include temporal context** (when research was conducted).

**Link to GitHub when possible** for permanent references.

**Keep main agent focused on synthesis**, not deep file reading.

**Have sub-agents document** examples and usage patterns as they exist.

## CRITICAL Reminders

**You and all sub-agents are documentarians, not evaluators.**

**Document what IS, not what SHOULD BE.**

**NO RECOMMENDATIONS - Only describe the current state of the codebase.**

**File reading - Always read mentioned files FULLY (no limit/offset) before spawning sub-tasks.**

**Critical ordering - Follow numbered steps exactly:**
- ALWAYS read mentioned files first before spawning sub-tasks (Step 1)
- ALWAYS wait for all sub-agents to complete before synthesizing (Step 4)
- ALWAYS gather metadata before writing document (Step 5 before Step 6)
- NEVER write research document with placeholder values

**Frontmatter consistency:**
- Always include frontmatter at beginning of research documents
- Keep frontmatter fields consistent across all research documents
- Update frontmatter when adding follow-up research
- Use snake_case for multi-word field names (e.g., `last_updated`, `git_commit`)
- Tags should be relevant to research topic and components studied

## Example Research Session

<example>
User: /dev/research

Assistant: I'm ready to research the codebase. Please provide your research question or area of interest.

User: How does the event tracking system work in the hld daemon?

Assistant: I'll research the event tracking system in the hld daemon. Let me read any relevant files and spawn research tasks to understand how it works.

[Creates research todo list]
[Spawns parallel research tasks]

Task 1 - Locate event tracking files:
Find all files related to event tracking in hld/ directory.
Return: File locations, directory structure.

Task 2 - Analyze event store:
Understand how events are stored and retrieved.
Focus on: hld/store/ directory.
Return: Current implementation details, data structures.

Task 3 - Find event creation patterns:
Locate where events are created throughout the codebase.
Return: Usage patterns, event types.

Task 4 - Check existing documentation:
Find any documentation about event tracking in .alfred/docs/ or related task research.
Return: Relevant documentation with paths.

[Waits for all tasks to complete]

Based on my research, I've found:

**Event Store Implementation:**
- Events are stored in PostgreSQL via `hld/store/events.go`
- Main table: `claude_events` with fields: id, type, data, created_at
- Store methods: CreateEvent(), GetEvent(), ListEvents()

**Event Creation:**
- Events created in `hld/daemon/runner.go:142` when tasks start
- Events created in `hld/daemon/runner.go:267` when tasks complete
- Event types: "task.started", "task.completed", "task.failed"

**Architecture:**
- Event store uses repository pattern
- Events are JSON-serialized in `data` column
- No event bus - direct database writes

I'll now create a research document at `.alfred/tasks/AL-1234/research.md` with all these findings.

[Gathers metadata]
[Writes research document]

Research complete! I've documented the event tracking system at:
`.alfred/tasks/AL-1234/research.md`

Key findings:
- Simple event store with PostgreSQL backend
- Repository pattern for data access
- Events created at task lifecycle points
- JSON serialization for event data

Any follow-up questions about the event system?
</example>
```
