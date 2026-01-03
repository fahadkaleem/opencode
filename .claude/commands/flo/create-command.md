---
description: Interactively create a new Flo command following the template standard
model: opus
---

# Create Flo Command

Create a new atomic Flo command by working with the user to understand the
command's purpose, then generating a command file following the template
standard.

---

## Execution

<steps>
1. If `$ARGUMENTS` is provided, use it as the command name hint
2. Ask the user clarifying questions using AskUserQuestion:

**Question 1: Command Category**

- Question: "Which category does this command belong to?"
- Header: "Category"
- Options:
  - `spec` - Spec creation phase (init, shape, write, tasks)
  - `task` - Task execution phase (research, plan, implement, review, test,
    verify)
  - `ship` - Delivery phase (commit, pr)
  - `linear` - Linear/task management operations
  - `git` - Git operations
  - `_orchestrators` - High-level workflow orchestrators

**Question 2: Command Purpose**

- Question: "What is the ONE thing this command should do?"
- Header: "Purpose"
- Free-form input

**Question 3: Input Requirements**

- Question: "What inputs does this command need?"
- Header: "Inputs"
- Options:
  - `$ARGUMENTS` - Command-line argument (e.g., task ID)
  - `task.json` - Existing task file
  - `research.md` - Existing research artifact
  - `plan.md` - Existing plan artifact
  - Other (specify)

**Question 4: Output Artifact**

- Question: "What artifact does this command produce?"
- Header: "Output"
- Options:
  - JSON file (for structured data)
  - Markdown file (for AI-generated documents)
  - Git action (commit, branch, etc.)
  - Linear action (update, comment, etc.)
  - Other (specify)

3. Based on answers, determine:
   - File path: `.claude/commands/flo/{category}/{name}.md`
   - Model: `haiku` for simple/deterministic, `sonnet` for moderate, `opus` for
     complex
   - Prerequisites, constraints, success criteria

4. Generate the command file using the Template Standard below

5. Write the file to the correct path

6. Output confirmation with the file path </steps>

---

## Template Standard

All Flo commands MUST follow this structure:

```markdown
---
description: [one-line description]
model: [sonnet|opus|haiku]
---

# [Command Name]

[One sentence: what this command does]

---

## Prerequisites

<prerequisites>
- REQUIRED: `$ARGUMENTS` - [what arguments are needed, e.g., "Linear issue ID"]
- If `$ARGUMENTS` is missing or empty, use AskUserQuestion to prompt:
  - Question: "[Specific question to get the required input]"
  - Header: "[Short label]"
  - Options: Appropriate choices or free-form input description

- REQUIRED: `{path}` - [what file/artifact must exist]
- If missing, STOP and output:
```

MISSING: {path} Run [suggested command] first.

```
</prerequisites>

---

## Setup

Create todos using TodoWrite to track progress through the execution steps.
This provides visibility and enables resumability.

---

## Context

<context>
Read these files FULLY before executing:
- `{input_file}`
</context>

---

## Execution

<steps>
1. [Imperative action - "Read X", "Extract Y", "Write Z"]
2. [Next action]
3. [Next action]
</steps>

---

## Constraints

<constraints>
- [Boundary 1 - what to avoid]
- [Boundary 2 - scope limit]
- [Boundary 3 - behavioral guard]
</constraints>

---

## Success Criteria

<success>
- [What done looks like - measurable]
- [Another success indicator]
</success>

---

## Artifact

<artifact>
path: `{output_path}`
format: [json|markdown]
</artifact>

**Format conventions:**
- `task.json` - JSON for structured data from external sources (Linear, etc.)
- `research.md`, `plan.md`, `verify.md` - Markdown for AI-generated documents

---

## Return

**CRITICAL:** Your final response must be ONLY the JSON object below.
- No preamble (no "Here's the result:", no "I've completed...", no explanation)
- No postamble (no summary, no "Let me know if...", no follow-up text)
- Just the raw JSON object, nothing else

On success:
{
"status": "SUCCESS",
"artifact": "{output_path}",
"message": "Short summary of what was done",
"next_step": "/flo:{suggested:next:command}"
}

On failure:
{
"status": "FAIL",
"artifact": null,
"message": "What went wrong",
"next_step": "Recovery suggestion or retry command"
}

On partial completion:
{
"status": "PARTIAL",
"artifact": "{partial_output_path}",
"message": "What was completed and what remains",
"next_step": "How to continue or complete"
}
```

---

## Template Design Principles

1. **XML tags** - Claude 4.x follows XML-tagged sections precisely
2. **Imperative verbs** - "Read", "Write", "Extract" (not "you should")
3. **Constraints** - Explicit boundaries prevent drift and over-engineering
4. **Success Criteria** - Clear definition of "done"
5. **Fail fast** - Prerequisites checked first with clear error
6. **Artifact frontmatter** - Enables resumability and state tracking
7. **Structured returns** - Parseable by orchestrators, context-friendly

---

## Flo Structure Reference

```
.claude/commands/flo/
├── create-command.md            # THIS FILE
├── README.md                    # User-facing documentation
│
├── _orchestrators/              # High-level entry points
│   ├── feature.md               # Full feature: spec → tasks → ship
│   └── task.md                  # Single task: research → implement → ship
│
├── spec/                        # PHASE: Spec Creation
│   ├── init.md                  # Initialize spec folder + raw idea
│   ├── shape.md                 # Gather requirements interactively
│   ├── write.md                 # Write formal spec document
│   └── tasks.md                 # Break spec into task list
│
├── task/                        # PHASE: Task Execution
│   ├── research.md              # Explore codebase for context
│   ├── plan.md                  # Design implementation approach
│   ├── implement.md             # Execute one task
│   ├── review.md                # Review implementation
│   ├── test.md                  # Run/write tests
│   └── verify.md                # Verify against plan
│
├── ship/                        # PHASE: Delivery
│   ├── commit.md                # Create atomic commit
│   └── pr.md                    # Create pull request
│
├── linear/                      # Task Management (Linear)
│   ├── get-task.md              # Fetch task by ID → task.json
│   ├── create.md                # Create new task
│   ├── update.md                # Update task status/fields
│   ├── comment.md               # Add comment to task
│   ├── assign.md                # Assign task to user
│   └── list.md                  # List tasks
│
└── git/                         # Atomic Git Operations
    ├── branch.md                # Create feature branch from task ID
    ├── commit.md                # Create atomic commit
    ├── push.md                  # Push to remote
    ├── pr.md                    # Create pull request
    ├── sync.md                  # Sync with main (rebase/merge)
    └── status.md                # Show current state
```

---

## Key Principles

1. **One Command = One Artifact**
   - Each command produces exactly one output file (or one action like commit)
   - No command does multiple unrelated things

2. **Prerequisites Enforced**
   - Commands check for required input artifacts
   - Fail fast with helpful message if missing
   - Suggest which command to run first

3. **Artifact-Based Communication**
   - Agents communicate via files, not prompt content
   - Orchestrators pass file paths, not file contents
   - Keeps context clean

4. **Structured Return Format**
   - When run as subagent: `STATUS|artifact-path`
   - Deterministic, parseable responses
   - No prose in returns

5. **Dual-Use Design**
   - Every command works manually (user invokes directly)
   - Every command works via subagent (orchestrator delegates)
   - Same prompt, both contexts

---

## Artifact Flow Reference

```
SPEC PHASE                          TASK PHASE
──────────                          ──────────

.flo/specs/{name}/                  .flo/tasks/{id}/
│                                   │
├── raw-idea.md      ◀─ spec:init   ├── task.json      ◀─ linear:get-task
│                                   │
├── requirements.md  ◀─ spec:shape  ├── research.md    ◀─ task:research
│                                   │
├── spec.md          ◀─ spec:write  ├── plan.md        ◀─ task:plan
│                                   │
├── tasks.md         ◀─ spec:tasks  ├── verify.md      ◀─ task:verify
│                                   │
└── (spawns tasks) ────────────────▶└── [code changes] ◀─ task:implement
```

---

## Example Commands

### Simple Command (haiku)

See: `.claude/commands/flo/linear/get-task.md`

- Fetches from Linear API
- Writes task.json
- ~50 lines, deterministic

### Complex Command (opus)

See: `.claude/commands/ui/create-component.md`

- Orchestrates multiple subagents
- Manages retries and fixes
- ~300 lines, multi-phase

---

## Constraints

<constraints>
- Generate commands that follow the template EXACTLY
- Keep commands atomic - ONE job, ONE artifact
- Use appropriate model (haiku for simple, opus for complex)
- Always include Prerequisites, Constraints, Success Criteria, Return sections
- Do not create commands that duplicate existing functionality
</constraints>
