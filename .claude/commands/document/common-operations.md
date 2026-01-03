---
description: Document common operational patterns and task sequences
model: sonnet
---

# Common Operations

You are an expert in documenting operational procedures and task workflows.
Focus on identifying and documenting the most common sequences of commands, API
calls, or operations that developers and AI agents perform when working with
this project.

Task: Create a guide showing common operational patterns - the typical sequences
of steps that users perform to accomplish real-world tasks with this system.

- Extract common patterns from README examples, documentation, and test files
- Document command sequences and their purposes
- Include expected outputs and verification steps
- Organize by task category (development, testing, operations, debugging)
- Return the final response in Markdown format using the structure specified in
  the user prompt

## Workflow

This is a pattern extraction task. Use TodoWrite to create a structured task
list.

<procedure>
**STEP 1: Create your todo list immediately** using the TodoWrite tool with these tasks:

1. **Setting up analysis** (activeForm: "Setting up analysis")
   - Read complete task requirements from this slash command
   - Identify project type (CLI, API, library, service)
   - Understand primary use cases

2. **Scan package management files** (activeForm: "Scanning package files")
   - Read package.json scripts / Makefile / build.gradle / Rakefile
   - Extract build, test, lint, format, deploy commands
   - Identify development workflow commands

3. **Analyze README examples** (activeForm: "Analyzing README examples")
   - Extract usage examples from README.md
   - Identify command sequences shown in examples
   - Note expected outputs and verification steps

4. **Review test patterns** (activeForm: "Reviewing test patterns")
   - Scan test files for setup patterns (test/setup._, _\_test.go, etc.)
   - Identify test data creation patterns
   - Extract integration test workflows
   - Find cleanup/teardown patterns

5. **Identify entry points and usage** (activeForm: "Identifying usage
   patterns")
   - For CLI: Check bin/ or cmd/ for command invocations
   - For API: Check server startup in main files
   - For library: Check examples/ or docs/ for usage
   - Extract common invocation patterns

6. **Development Operations section** (activeForm: "Writing Development
   Operations section")
   - Reference Output Instructions template section "Development Operations"
   - Document common dev workflows (build, test, lint, etc.)

7. **Core Operations section** (activeForm: "Writing Core Operations section")
   - Reference Output Instructions template section "Core Operations"
   - Document primary use case workflows

8. **Testing Operations section** (activeForm: "Writing Testing Operations
   section")
   - Reference Output Instructions template section "Testing Operations"
   - Document test setup and execution patterns

9. **Debugging Operations section** (activeForm: "Writing Debugging Operations
   section")
   - Reference Output Instructions template section "Debugging Operations"
   - Document troubleshooting workflows

10. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all sections present
    - Verify code blocks are properly formatted
    - Verify examples are executable (can be copy-pasted)
    - Verify document starts with `# Common Operations` heading only
    - Verify NO conversational preamble exists
    - If ANY verification fails: DO NOT proceed, fix issues first

11. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/common-operations.md`
    - Content must be PURE MARKDOWN starting with `# Common Operations`
    - No preamble, no "Here is...", no explanations

**STEP 2: Execute todos sequentially**

- Mark todo as `in_progress` BEFORE starting work
- Complete the work described in the todo
- Mark todo as `completed` IMMEDIATELY after finishing
- Move to next todo
- IMPORTANT: Only ONE todo should be `in_progress` at any time

**STEP 3: Handle errors/blockers**

- If you cannot complete a todo, keep it as `in_progress`
- Create a new todo describing what needs resolution
- Never mark todo as completed if work is incomplete
- Ask user for guidance if truly blocked </procedure>

## Getting Started

**If a specific path is provided** (file, directory, or module):

Analyze the provided path and scope the analysis to that specific area.

**If no path is provided:**

<message>
I'll analyze the entire project. If you want to focus on a specific directory, file, or module, you can provide a path:

Examples:

- `/document/common-operations packages/plugin-agents` - Analyze specific
  package
- `/document/common-operations src/lib` - Analyze specific directory

Proceeding with full project analysis... </message>

## Analysis Task

<procedure>
Extract common operational patterns by analyzing the codebase directly:

1. **Parse package management files** (package.json, Makefile, etc.) for scripts
   and commands
2. **Scan README.md** for usage examples and command sequences
3. **Review test files** for setup/teardown patterns and test workflows
4. **Examine entry points** (bin/, cmd/, main files) for invocation patterns
5. **Check example directories** if they exist for usage patterns

Focus on:

- **Frequency**: Operations performed often
- **Complexity**: Multi-step sequences that benefit from documentation
- **Criticality**: Operations that are error-prone if done incorrectly

For each operation, provide:

- **Scenario**: What the user is trying to accomplish
- **Steps**: Numbered sequence of commands/actions
- **Expected Output**: What success looks like
- **Verification**: How to confirm it worked
- **Time Estimate**: Typical completion time (optional)

Avoid:

- Documenting every possible command (focus on common sequences)
- Single-step operations that are self-explanatory
- Overly detailed explanations (keep it concise) </procedure>

## AI-Optimized Formatting

**CRITICAL**: This documentation is primarily consumed by AI agents (like Claude
Code) to understand the codebase. Structure the output using XML tags to make it
easily parseable and semantically clear.

### Reflect on Your Own System Prompt

Before writing the documentation, examine your own system prompt to see how
Anthropic structures information for optimal AI comprehension. Notice the use of
XML tags like:

- `<example>` and `</example>` for examples
- `<procedure>` for step-by-step processes
- `<good-example>` vs `<bad-example>` for contrasts
- `<template>` for structures
- `<important>` for critical information

## Output Instructions

**CRITICAL**: Write your analysis to `.alfred/docs/common-operations.md` using
the Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

````markdown
# Common Operations

## Development Operations

### Operation: [Name of operation]

**Scenario**: [What the user is trying to accomplish]

**Steps**:

1. [Step with command]
   ```bash
   [command]
   ```
````

2. [Step with command]
   ```bash
   [command]
   ```

**Expected Output**:

```
[What success looks like]
```

**Verification**:

```bash
[How to verify it worked]
```

**Time to Complete**: [Estimate]

---

Example:

### Operation: Initial Project Setup

**Scenario**: Setting up the project for the first time on a new development
machine.

**Steps**:

1. Clone repository

   ```bash
   git clone <repo-url>
   cd <project>
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Build project

   ```bash
   npm run build
   ```

4. Verify installation
   ```bash
   npm test
   ```

**Expected Output**:

```
✓ All tests passed
Coverage: 85%
```

**Verification**:

```bash
# Check version
npm run --version
```

**Time to Complete**: 5-10 minutes

---

## Core Operations

### Operation: [Primary use case operation]

[Same format as above]

Example for a CLI:

### Operation: Execute Command with Custom Config

**Scenario**: Running a command with project-specific configuration.

**Steps**:

1. Set configuration

   ```bash
   project config set environment dev
   ```

2. Execute command
   ```bash
   project command --option value
   ```

**Expected Output**:

```json
{
  "status": "success",
  "result": {...}
}
```

---

Example for an API:

### Operation: Create Resource via API

**Scenario**: Creating a new resource using the REST API.

**Steps**:

1. Authenticate

   ```bash
   curl -X POST https://api.example.com/auth \
     -H "Content-Type: application/json" \
     -d '{"username":"user","password":"pass"}'
   ```

2. Create resource
   ```bash
   curl -X POST https://api.example.com/resources \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"example","type":"test"}'
   ```

**Expected Output**:

```json
{
  "id": "abc123",
  "name": "example",
  "type": "test",
  "created_at": "2025-10-26T10:00:00Z"
}
```

---

## Testing Operations

### Operation: [Testing workflow]

[Same format as above]

Example:

### Operation: Run Integration Tests

**Scenario**: Executing integration tests against test environment.

**Steps**:

1. Set test environment

   ```bash
   export NODE_ENV=test
   ```

2. Start test services

   ```bash
   docker-compose up -d
   ```

3. Run integration tests

   ```bash
   npm run test:integration
   ```

4. Cleanup
   ```bash
   docker-compose down
   ```

**Expected Output**:

```
Integration Tests: 42 passed
```

**Time to Complete**: 2-5 minutes

---

## Debugging Operations

### Operation: [Debugging workflow]

[Same format as above]

Example:

### Operation: Debug Failing Command

**Scenario**: Investigating why a command is failing.

**Steps**:

1. Run with debug output

   ```bash
   DEBUG=* project command
   ```

2. Check logs

   ```bash
   tail -f ~/.project/logs/debug.log
   ```

3. Test with minimal configuration
   ```bash
   project command --config minimal.json
   ```

**Expected Output**:

```
[Debug trace showing error location]
```

**Time to Complete**: 5-10 minutes

```

Fill in each section with appropriate content but maintain this exact markdown structure. Focus on common, multi-step operations that benefit from documentation. Keep each operation concise and executable.

The output will be directly written to a file without any processing. This file should be easily readable by AI (will be used by AI agents only).
</template>

**CRITICAL**: Always depend on the current codebase only. Do NOT read existing documentation in `.alfred/docs/` - analyze the code directly. Extract patterns from:
1. README.md (usage examples, quick start, common commands)
2. package.json / Makefile / build.gradle (scripts and tasks)
3. Test files (setup patterns, test workflows)
4. Entry point files (bin/, cmd/, main.* - invocation patterns)
5. Examples directory if exists (usage patterns)

Focus on frequently performed, multi-step operations. If the same file already exists, your task is to update it to reflect the current state of the codebase.
```
