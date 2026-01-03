---
description: Review an AI agent, tool, or schema against project guidelines and report compliance
model: opus
---

# Review API

Reviews an existing agent, tool, or schema implementation and tests against project guidelines. Produces a detailed compliance report with pass/fail checklist.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- API file must exist (will locate based on name parameter)
- If file doesn't exist, stop and inform user

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Locate [name] files | pending |
| 2 | Review [name] implementation | pending |
| 3 | Review [name] tests | pending |
| 4 | Generate review report | pending |

Replace `[name]` with the actual name from the parameter (e.g., `chat-agent`, `search-tool`).

Proceed to Phase 1.

## Phase 1: Locate API File

Mark todo "Locate [name] files" as `in_progress`.

<implement>
1. Determine the type from the file name:
   - `*-agent.ts` → Agent
   - `*-tool.ts` → Tool
   - Otherwise → Schema

2. Search for the file:
   ```bash
   find src/features -path "*/api/*" -name "[name]*" -type f
   find src/lib/ai -name "[name]*" -type f
   ```

3. Once found, verify expected files exist:

   **For Agent:**
   - `[name]-agent.ts`
   - `[name]-agent.test.ts`

   **For Tool:**
   - `[name]-tool.ts`
   - `[name]-tool.test.ts`

   **For Schema:**
   - `[name].ts` (or in shared schemas file)
   - Test may be in shared test file

4. Record which files exist and which are missing

5. Record the type (agent/tool/schema) for Phase 2
</implement>

<validate>
Main implementation file must exist.

If not found, stop and report:
```
API file "[name]" not found.
Searched: src/features/*/api/, src/lib/ai/
```

If found, proceed even if test file is missing (will note in report).
</validate>

Mark todo "Locate [name] files" as `completed`. Proceed to Phase 2.

## Phase 2: Review Implementation

Mark todo "Review [name] implementation" as `in_progress`.

**Read:** `.ai/guidelines/api.md`
**Read:** `[path]/[name].[ts]`

<implement>
Review against the appropriate checklist based on type detected in Phase 1.

### Agent Checklist

**File Structure:**
- [ ] File is named `[name]-agent.ts`
- [ ] One agent per file

**Code Order:**
- [ ] Imports: AI SDK → Zod → utilities → types → tools
- [ ] Types: Config, Input, Output defined
- [ ] Constants: default prompts, config values
- [ ] Agent functions (sync and stream)
- [ ] Named exports at end

**Naming:**
- [ ] Sync function: `[name]Agent`
- [ ] Stream function: `[name]AgentStream`
- [ ] Config type: `[Name]AgentConfig`
- [ ] Input type: `[Name]AgentInput`
- [ ] Output type: `[Name]AgentOutput`

**Required Features:**
- [ ] BOTH sync and stream versions exist
- [ ] Sync uses `generateText`
- [ ] Stream uses `streamText`
- [ ] Uses `getModel()` from providers (no hardcoded model names)
- [ ] Has JSDoc with `@example` for exported functions

**Types:**
- [ ] Config type with optional overrides
- [ ] Input type with required fields
- [ ] Output type with result structure

**Don't Rules:**
- [ ] No default exports
- [ ] No hardcoded model names
- [ ] No missing stream version

---

### Tool Checklist

**File Structure:**
- [ ] File is named `[name]-tool.ts`
- [ ] One tool per file

**Code Order:**
- [ ] Imports: AI SDK tool → Zod
- [ ] Types: Input, Output defined
- [ ] Constants: Zod schema for parameters
- [ ] Tool definition
- [ ] Named exports at end

**Naming:**
- [ ] Tool const: `[name]Tool`
- [ ] Input type: `[Name]ToolInput`
- [ ] Output type: `[Name]ToolOutput`

**Required Features:**
- [ ] Uses `tool()` from AI SDK
- [ ] Has `description` property
- [ ] Has `parameters` with Zod schema
- [ ] Each parameter has `.describe()` for AI context
- [ ] Has `execute` function
- [ ] Error handling in execute (try/catch)

**Don't Rules:**
- [ ] No default exports
- [ ] No missing parameter descriptions
- [ ] No unhandled errors in execute

---

### Schema Checklist

**File Structure:**
- [ ] File exists in schemas folder or lib/ai/schemas

**Code Order:**
- [ ] Imports: Zod
- [ ] Schema definitions
- [ ] Type inference with `z.infer`
- [ ] Named exports

**Naming:**
- [ ] Schema const: `[name]Schema` (camelCase)
- [ ] Inferred type: `[Name]` (PascalCase)

**Required Features:**
- [ ] Uses Zod for schema definition
- [ ] Exports both schema and inferred type
- [ ] Complex fields have `.describe()` for documentation

**Don't Rules:**
- [ ] No default exports
- [ ] No runtime type assertions (use Zod)
</implement>

<validate>
Count PASS and FAIL items. Record findings for final report.
Continue to Phase 3 regardless of failures (collecting all issues).
</validate>

Mark todo "Review [name] implementation" as `completed`. Proceed to Phase 3.

## Phase 3: Review Tests

Mark todo "Review [name] tests" as `in_progress`.

**Read:** `.ai/guidelines/api-test.md`
**Read:** `[path]/[name].test.ts` (if exists)

<implement>
If test file doesn't exist, mark all as MISSING and note in report.

If exists, review against the appropriate checklist:

### Agent Test Checklist

**Test Organization:**
- [ ] Has `describe('configuration')` block
- [ ] Has `describe('generation')` block
- [ ] Has `describe('streaming')` block
- [ ] Has `describe('error handling')` block

**Test Quality:**
- [ ] Mocks AI SDK functions:
  ```typescript
  vi.mock('ai', () => ({
    generateText: vi.fn(),
    streamText: vi.fn(),
  }));
  ```
- [ ] Uses AAA pattern with comments
- [ ] Tests both sync and stream versions

**Coverage:**
- [ ] Tests default config
- [ ] Tests custom config overrides
- [ ] Tests successful generation
- [ ] Tests tool calls (if agent has tools)
- [ ] Tests stream output
- [ ] Tests error handling

---

### Tool Test Checklist

**Test Organization:**
- [ ] Has `describe('parameters')` block
- [ ] Has `describe('execution')` block
- [ ] Has `describe('error handling')` block

**Test Quality:**
- [ ] Mocks external API calls
- [ ] Uses AAA pattern with comments

**Coverage:**
- [ ] Tests parameter schema validation
- [ ] Tests successful execution
- [ ] Tests error cases
- [ ] Tests edge cases (empty input, etc.)

---

### Schema Test Checklist

**Test Organization:**
- [ ] Has `describe('validation')` block
- [ ] Has `describe('rejection')` block

**Test Quality:**
- [ ] Uses `schema.parse()` for valid data
- [ ] Uses `schema.safeParse()` for invalid data
- [ ] Checks specific error messages

**Coverage:**
- [ ] Tests valid data passes
- [ ] Tests each required field
- [ ] Tests invalid data fails with correct errors
- [ ] Tests edge cases (optional fields, defaults)
</implement>

<validate>
Count PASS, FAIL, and MISSING items. Record findings for final report.
Continue to Phase 4.
</validate>

Mark todo "Review [name] tests" as `completed`. Proceed to Phase 4.

## Phase 4: Generate Report

Mark todo "Generate review report" as `in_progress`.

<implement>
Generate a comprehensive review report in this format:

```markdown
# API Review: [name]

**Location:** [path]
**Type:** [agent/tool/schema]
**Reviewed:** [date]

---

## Summary

| Category | Pass | Fail | Missing | Total |
|----------|------|------|---------|-------|
| Implementation | X | X | - | X |
| Tests | X | X | X | X |
| **Total** | X | X | X | X |

**Overall:** [PASS if all pass, NEEDS WORK if any fail/missing]

---

## Implementation Review

[List each checklist item with [PASS] or [FAIL]]

### Issues Found
- [Issue 1 with specific line/code reference]
- [Issue 2]

### Recommendations
- [How to fix issue 1]
- [How to fix issue 2]

---

## Test Review

[List each checklist item with [PASS], [FAIL], or [MISSING]]

### Issues Found
- [Issues]

### Recommendations
- [Fixes]

---

## Action Items

Priority fixes (ordered by importance):

1. [ ] [Most critical fix]
2. [ ] [Second priority]
3. [ ] [Third priority]
...
```
</implement>

<validate>
Report must include:
- Summary table with counts
- All checklist items with pass/fail status
- Specific issues with file/line references where possible
- Actionable recommendations
- Prioritized action items
</validate>

Mark todo "Generate review report" as `completed`.

Present the report to the user.

## Guidelines

**Do:**
- Read each guideline file only at the phase that requires it
- Be specific about issues (include line numbers, code snippets)
- Provide actionable recommendations (not just "fix this")
- Prioritize issues by impact
- Use the correct checklist based on type (agent/tool/schema)

**Don't:**
- Read all files upfront
- Stop at first failure (collect ALL issues)
- Be vague about problems
- Skip any checklist items
- Mix checklists between types

**When:**
- WHEN file is missing → Mark all items for that file as MISSING
- WHEN issue found → Note specific location and suggest fix
- WHEN all pass → Still generate report confirming compliance
- WHEN file not found → Stop and inform user
- WHEN agent missing stream version → Flag as high priority
- WHEN tool missing error handling → Flag as high priority
