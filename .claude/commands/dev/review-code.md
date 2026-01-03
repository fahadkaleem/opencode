---
description:
  Review uncommitted code changes against TypeScript coding standards, patterns,
  and best practices
model: sonnet
---

# Code Quality Review

You are tasked with conducting a thorough code quality review of uncommitted
changes to ensure they meet TypeScript coding standards, follow established
patterns, and maintain code quality before pushing to git. **This focuses on
code structure, standards, and organization. For deep test quality review, use
`/dev/review-tests`.**

## Prerequisites Check

<procedure>
Before starting review, verify coding standards documentation exists:
</procedure>

```bash
ls -la .alfred/docs/coding-standards.md
```

**If coding standards file is missing:**

<message>
[FAIL] **Coding standards documentation not found!**

Please run the following command first to generate coding standards:

```bash
/generate-standards:coding
```

This will analyze the codebase and create `.alfred/docs/coding-standards.md`
with established TypeScript patterns, type annotation conventions, naming
standards, and code organization guidelines.

Cannot proceed with code review without standards documentation. </message>

**Stop and wait for user to generate standards.**

## Ticket ID Detection

**SECOND STEP:** Determine the ticket ID for this task.

<procedure>
1. Check if {{task_id}} template variable is provided (Alfred workflow mode):
   - If present, use {{task_id}} directly

2. If no template variable, check if ticket ID provided explicitly as parameter:
   - User may provide: `/dev/review-code AL-1234` or
     `/dev/review-code AL-1234 additional context`
   - If found, use that ticket ID

3. If no ticket ID provided, extract from current git branch:
   - Get branch name: `git branch --show-current`
   - Extract pattern: `feature/AL-1234`, `chore/AL-1234`, `bug/AL-1234`, etc.
   - Look for pattern: `AL-[0-9]+` (or similar Jira issue pattern)

4. If ticket ID found:
   - Set TASK_DIR as `.alfred/tasks/${TICKET_ID}/`
   - Review report will be saved to `.alfred/tasks/${TICKET_ID}/review-code.md`

5. If no ticket ID found:
   - Review will still proceed, but report will not be saved to task directory
   - Report will only be shown to user as output </procedure>

**If ticket detected, present to user:**

```
Detected Ticket: AL-1234 (from branch feature/AL-1234-add-pacing-algorithm)
Review report will be saved to: .alfred/tasks/AL-1234/review-code.md
```

## Initial Setup

When this command is invoked:

**If specific files provided as parameters:**

- Review only those files
- Create todo list to track review tasks
- Focus on source code files (not deep test review)

**If no parameters provided:**

<procedure>
1. Identify all uncommitted changes:
</procedure>

```bash
git status
git diff --name-only
```

<message>
I'll review all uncommitted code changes against TypeScript coding standards. This includes:
- TypeScript coding standards and type annotations
- Code organization and module structure
- Variable naming and code clarity
- Comparison with similar files in the codebase
- Pattern consistency
- Zod schema usage
- Error handling
- Removal of useless comments
- Basic test existence check (not deep test quality)

Starting code quality review... </message>

## Step 1: Identify Changes and Context

<procedure>
1. Get list of changed files and their status:
</procedure>

```bash
git status --porcelain
git diff --stat
```

<procedure>
2. Read the actual changes:
</procedure>

```bash
git diff
```

<procedure>
3. Create review todo list using TodoWrite:
   - Analyze changed files
   - Check TypeScript coding standards
   - Verify file organization
   - Review naming conventions
   - Check type annotations and Zod schemas
   - Verify error handling
   - Compare with similar files
   - Check code clarity (remove useless comments)
   - Quick test existence check
   - Generate review report

4. Categorize changes by type:
   - New source files (packages/alfred/src/\*_/_.ts)
   - Modified source files
   - New test files (test/\*_/_.test.ts)
   - Modified test files
   - Deleted files
   - Renamed/moved files </procedure>

## Step 2: Research Similar Files for Code Style Uniformity

**PHILOSOPHY:** Functionality from the plan is primary. Uniformity is secondary
but important - new code should match established patterns in the same module so
it feels cohesive. Focus on **code style patterns** (naming, JSDoc comments,
error handling, Zod usage, logging) not formatting (Prettier handles that).

**CRITICAL:** Research existing codebase patterns before reviewing.

<procedure>
1. For each changed source file, spawn parallel research tasks to find similar files:
</procedure>

<task_examples> Task 1 - Find similar source files: For [file-path], find 2-3
similar files in the same module/directory. Focus on: Same directory, same file
type, similar functionality. Return: File paths with brief description of code
style patterns used (naming conventions, docstring style, error handling
approach).

Task 2 - Analyze code style patterns: Compare [file-path] with similar files.
Focus on: Variable/function naming style, JSDoc comment format, error handling
patterns, Zod schema usage, logging patterns, comment style (minimal vs
verbose). Return: Specific patterns to match, deviations in code style found.

Task 3 - Check module organization: Verify [file-path] belongs in its current
location. Focus on: Directory structure (lib/, db/, storage/, algorithms/),
module boundaries, separation of concerns. Return: Whether location is correct,
alternative location if wrong. </task_examples>

<procedure>
2. Wait for ALL research tasks to complete

3. Read similar files FULLY into context for comparison </procedure>

## Step 3: Review Against TypeScript Coding Standards

Reference: `.alfred/docs/coding-standards.md`

Review each source file against these standards:

### 3.1 TypeScript Standards Check

<checklist>
- [ ] Type annotations for all function parameters and return types
- [ ] NEVER uses `any` type (use `unknown` with type narrowing instead)
- [ ] Uses modern TypeScript syntax (union types with |, not Union<>)
- [ ] Zod schemas for data validation and runtime type checking
- [ ] JSDoc comments for all public functions, classes, and interfaces
- [ ] JSDoc comments follow format from coding standards
- [ ] Prettier formatting compliant (formatting checks passing)
- [ ] No mutable default parameters
- [ ] Uses interfaces/types for data structures (prefer over classes for data)
- [ ] Proper exception handling with custom error classes
- [ ] Error handling includes specific error types
- [ ] Resource cleanup handled properly (async cleanup, temp file removal)
- [ ] Type annotations include union types (|) and optionals (?) as needed
- [ ] Enums for fixed sets of values
- [ ] No `any` types without exceptional justification
</checklist>

### 3.2 Code Organization Check

<checklist>
- [ ] File in correct directory (src/commands/, src/lib/, src/types/, src/config/)
- [ ] CLI command logic in src/commands/ directory
- [ ] Business logic in src/lib/ directory
- [ ] Service classes in src/lib/services/ directory
- [ ] SDK wrappers in src/lib/sdk/ directory
- [ ] Integration code in src/lib/integrations/ directory
- [ ] Type definitions in src/types/ directory
- [ ] Test files mirror source structure in test/
- [ ] No business logic in test files
- [ ] Imports organized: node built-ins (node:), third-party, internal, type-only
- [ ] ALL imports use .js extension (even for .ts files)
- [ ] Node.js built-ins use node: protocol
- [ ] No circular imports
- [ ] All imports at the beginning of the file
</checklist>

### 3.3 Zod Schemas Check

<checklist>
- [ ] Uses Zod for runtime validation
- [ ] Uses Zod for configuration validation
- [ ] Schema fields have proper type definitions
- [ ] Required vs optional fields clearly defined with .optional()
- [ ] Uses .describe() for field documentation
- [ ] TypeScript types inferred from Zod schemas using z.infer<>
- [ ] Custom validation uses .refine() or .superRefine()
- [ ] Schemas exported alongside inferred TypeScript types
- [ ] Validation errors are caught and handled appropriately
</checklist>

### 3.4 Algorithm/Business Logic Patterns

<checklist>
- [ ] Pure functions where possible (no side effects)
- [ ] Clear separation of concerns
- [ ] Single responsibility principle followed
- [ ] Complex logic broken into smaller functions
- [ ] Algorithm parameters clearly defined with types
- [ ] Return types explicitly declared
- [ ] Edge cases handled explicitly
- [ ] Performance considerations documented if critical
</checklist>

### 3.5 Error Handling Check

<checklist>
- [ ] Specific exception types used (ValueError, TypeError, etc.)
- [ ] Custom exceptions defined when needed
- [ ] Error messages are descriptive and actionable
- [ ] No silent failures (except in justified cases)
- [ ] Error context preserved in exception chains
- [ ] No catching Exception without re-raising
- [ ] Validation errors raise appropriate exceptions
- [ ] Error handling follows patterns in similar files
</checklist>

### 3.6 Code Clarity Check

**CRITICAL:** Check for useless comments and code clarity issues.

<checklist>
- [ ] NO inline comments explaining what code does
- [ ] NO change logs in code (e.g., "2024-01-15: Fixed bug...")
- [ ] NO comments like "increment counter by 1"
- [ ] Variable names are self-explanatory (high_priority_agents not hpA)
- [ ] Function names express clear intent (calculate_team_pacing_boost not calc_boost)
- [ ] Code structure makes intent obvious without comments
- [ ] Only acceptable comments: non-obvious logic, complex algorithms, "why not how"
- [ ] No redundant comments that repeat what code obviously does
- [ ] No commented-out code blocks
- [ ] No TODO comments without tracking issue
</checklist>

### 3.7 Naming Conventions Check

<checklist>
- [ ] Files: snake_case.py
- [ ] Variables/Functions: snake_case
- [ ] Classes: PascalCase
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] Private variables/methods: _leading_underscore
- [ ] Boolean variables: is_/has_/should_ prefix (is_active, has_error)
- [ ] Meaningful names that explain purpose
- [ ] No abbreviations unless widely known
- [ ] Consistent naming within module
- [ ] Module names are short and descriptive
</checklist>

### 3.8 Type Annotations Quality

<checklist>
- [ ] All public functions have parameter type annotations
- [ ] All public functions have return type annotations
- [ ] Use `undefined` or `null` appropriately (not `| undefined | null`)
- [ ] Use | for unions (string | number) not Union<string, number>
- [ ] Collection types properly typed (Array<T>, Record<K, V>, Set<T>, Map<K, V>)
- [ ] Use readonly for immutable arrays/objects when appropriate
- [ ] Use Partial, Required, Pick, Omit utility types when appropriate
- [ ] Type aliases (type X = ...) used for complex type definitions
- [ ] Generic types properly parameterized with constraints
- [ ] No @ts-ignore or @ts-expect-error without justification comment
</checklist>

### 3.9 Test Existence Check (Surface Level)

**Note:** For deep test quality review, use `/dev/review-tests`

<checklist>
- [ ] Source file in src/ has corresponding test in test/
- [ ] Test file naming follows convention ([module].test.ts)
- [ ] Test file location mirrors source location
- [ ] New functionality appears to have test coverage
</checklist>

**If tests are missing:** Flag as critical issue but don't deep-dive into test
quality here.

## Step 4: Compare Code Style with Similar Files

**Remember:** Functionality is primary, code style uniformity is secondary. The
goal is cohesive code that feels like it belongs in the module, not nitpicking.

<procedure>
1. For each changed file, compare with similar files found in Step 2

2. Check for code style pattern consistency (what matters): </procedure>

<comparison_checklist> **Code Style Patterns (focus here):**

- [ ] Variable naming style matches similar files (agentZuid vs agentId vs
      agent_id)
- [ ] Function naming style matches similar files (calculateScore vs calcScore)
- [ ] JSDoc comment format matches similar files (detail level, @param/@returns
      usage)
- [ ] Error handling pattern matches similar files (throw Error vs custom error
      classes)
- [ ] Zod schema usage consistent with similar files (.describe(), validation
      patterns)
- [ ] Logging pattern matches similar files (console.log vs structured logging,
      detail level)
- [ ] Comment style matches similar files (minimal vs verbose, when used)
- [ ] Return value patterns consistent (explicit return vs implicit)
- [ ] Type annotation completeness matches similar files (all params vs partial)

**Formatting (Prettier handles, don't worry about):**

- Import order - Prettier handles
- Line length - Prettier handles
- Spacing - Prettier handles </comparison_checklist>

<procedure>
3. Document any deviations with reasoning
</procedure>

## Step 5: Check File Placement

<procedure>
1. Verify each file is in the correct directory:
</procedure>

<questions>
- Is this a CLI command? Should be in src/commands/
- Is this business logic? Should be in src/lib/
- Is this a service class? Should be in src/lib/services/
- Is this an SDK wrapper? Should be in src/lib/sdk/
- Is this an integration? Should be in src/lib/integrations/
- Is this a type definition? Should be in src/types/
- Is this a utility? Should be in src/utils/
- Is this a test? Should mirror source structure in test/
- Does the directory structure match the logical organization?
</questions>

<procedure>
2. Check if files should be moved:
</procedure>

<relocation_criteria> **Move if:**

- Service logic in lib/ root → Move to lib/services/
- SDK client logic outside lib/sdk/ → Move to lib/sdk/
- Type definitions outside src/types/ → Move to src/types/
- Utility used across modules → Move to src/utils/
- File doesn't match domain organization → Move to correct domain
- Test file doesn't mirror source → Move to correct test location
  </relocation_criteria>

## Step 6: Generate Code Quality Review Report

Create comprehensive review with findings:

<report_template>

# Code Quality Review Report

**Date:** [Current date] **Reviewer:** Claude (AI Code Review) **Changed
Files:** [Count] files ([N] source, [M] test) **Review Status:** [Pass with
recommendations / Requires changes / Critical issues]

---

## Executive Summary

[High-level overview of code changes and overall quality]

**Test Coverage Check (Surface Level):**

- [N] new/modified source files
- [M] corresponding test files exist
- [x] files missing tests [WARNING]
- Note: For deep test quality review, run `/dev/review-tests`

---

## Files Reviewed

### [PASS] Approved Files

[List files that meet all coding standards]

### [IMPROVE] Files with Recommendations

[List files with minor issues or improvements needed]

### [FAIL] Files Requiring Changes

[List files with critical issues that must be fixed]

### [WARNING] Missing Tests

[List source files that lack corresponding test files]

---

## Detailed Findings

### 1. [File Path 1]

**Status:** [[PASS] Approved / [IMPROVE] Needs Improvement / [FAIL] Critical
Issues]

**Type:** [Algorithm / Storage / Database / Simulation / Utility]

**Location:** [[PASS] Correct / [FAIL] Should move to X]

**Similar Files for Reference:**

- `[similar-file-1]` - [why it's similar, what patterns it uses]
- `[similar-file-2]` - [why it's similar, what patterns it uses]

**TypeScript Standards:**

- [PASS] PASS: [What's good]
  - Type annotations complete and accurate
  - Zod schemas used appropriately
- [IMPROVE] IMPROVE: [What needs improvement]
  - Line [N]: Missing return type annotation
  - Line [M]: Use string | number instead of any
- [FAIL] FAIL: [What must be fixed]
  - Line [X]: No type annotations on function parameters

**Code Organization:**

- [PASS] PASS: [What's good]
- [IMPROVE] IMPROVE: [What needs improvement]

**Code Clarity:**

- **Remove these useless comments:**
  ```python
  Line [N]: # Increment counter by 1
  Line [M]: # Loop through agents
  ```
- **Improve variable names:**
  - Line [N]: `ag` → `agent` (too abbreviated)
  - Line [M]: `data` → `agent_performance_data` (too vague)
- [PASS] PASS: [What's good about clarity]

**Pattern Consistency:**

- [PASS] PASS: Matches pattern from `[similar-file]`
  - [Specific pattern description]
- [IMPROVE] IMPROVE: Deviates from pattern in `[similar-file]`:
  - [Description of deviation and why it matters]

**Error Handling:**

- [PASS] PASS: [Good error handling examples]
- [IMPROVE] IMPROVE: [Error handling issues]
  - Line [N]: Should raise ValueError, not generic Exception
  - Line [M]: Error message should be more descriptive

**Type Annotations:**

- [PASS] PASS: [Well-typed code sections]
- [IMPROVE] IMPROVE: [Type annotation issues]
  - Line [N]: Function missing return type annotation
  - Line [M]: Should use string | null instead of any

**Test Existence:**

- Test file: `test/[test-file-path]` [[PASS] EXISTS / [FAIL] MISSING]
- If missing: **CRITICAL - Add test file at `test/[path]`**
- If exists: For test quality review, run `/dev/review-tests`

**Specific Issues:**

1. **Line [N]:** [Issue description]
   - **Why:** [Explanation of why this is an issue]
   - **Fix:** [Suggested fix with code example]

   ```python
   # Current (incorrect)
   [bad code]

   # Should be
   [good code]
   ```

2. **Line [M]:** [Issue description]
   - **Why:** [Explanation]
   - **Fix:** [Suggested fix]

**Recommendations:**

1. [Recommendation 1 with specific action]
2. [Recommendation 2 with specific action]

---

## Summary of Issues by Category

### [FAIL] Critical Issues (Must Fix Before Merge)

1. [Issue with file:line reference]
2. [Issue with file:line reference]

### [IMPROVE] Code Quality Issues (Should Fix)

1. [Issue with file:line reference]
2. [Issue with file:line reference]

### [NOTE] Recommendations (Nice to Have)

1. [Recommendation with file:line reference]
2. [Recommendation with file:line reference]

---

## Comments to Remove

[List all useless comments found with file:line references]

```python
# File: [file-path]
# Line [N]: # remove this useless comment
# Line [M]: # remove this one too

# File: [file-path-2]
# Line [X]: # increment counter
```

---

## Files to Relocate

| Current Location | Reason   | Suggested Location |
| ---------------- | -------- | ------------------ |
| [file]           | [reason] | [new-location]     |

---

## Pattern Deviations

Files that deviate from established patterns:

1. **[file-path]**
   - Pattern in `[similar-file]`: [description]
   - Current implementation: [description]
   - Recommendation: [align with pattern or justify deviation]

---

## Test Coverage Check (Surface Level)

### [PASS] Test Files Present

- [N] test files found for [N] source files

### [FAIL] Test Files Missing

**CRITICAL:** The following source files lack tests:

- `src/[path]` → Should have `test/[path]/[module].test.ts`

**Action:** Create test files before merging OR run `/dev/review-tests` for
existing test quality review.

---

## Automated Checks

Run these before pushing:

```bash
npm run lint                    # [PASS/FAIL] (ESLint checks)
npm run format                  # [PASS/FAIL] (Prettier formatting)
npm run typecheck               # [PASS/FAIL] (TypeScript type checking)
npm test                        # [PASS/FAIL] (Mocha tests)
```

**Linting/Format Status:**

- ESLint checks: [Status]
- Prettier format: [Status]
- TypeScript checks: [Status]

---

## Action Items

### [FAIL] Must Fix (Blocking)

- [ ] [Action item 1 with file:line reference]
- [ ] [Action item 2 with file:line reference]
- [ ] Add missing test files: [list]
- [ ] Fix critical code issues: [list]

### [IMPROVE] Should Fix (Before Merge)

- [ ] [Action item 1 with file:line reference]
- [ ] [Action item 2 with file:line reference]
- [ ] Remove useless comments: [count] comments
- [ ] Improve variable names: [list]

### [NOTE] Consider (Future Improvement)

- [ ] [Action item 1 with file:line reference]
- [ ] [Action item 2 with file:line reference]

---

## Approval Status

**Overall Assessment:** [[PASS] Approved / [IMPROVE] Approved with changes /
[FAIL] Rejected]

**Rationale:** [Detailed explanation of approval decision]

**Next Steps:**

1. [Step 1]
2. [Step 2]
3. Run `/dev/review-tests` for comprehensive test quality review
4. [Additional steps]

</report_template>

## Step 7: Run Automated Checks

<procedure>
1. Execute automated verification:
</procedure>

```bash
npm run lint
npm run format
npm run typecheck
npm test
```

<procedure>
2. Document results in review report including:
   - ESLint linting errors and warnings
   - Prettier format check status
   - TypeScript compilation status
   - Test results (pass/fail counts)
   - Include specific error messages if checks fail
</procedure>

## Step 8: Present Findings

<output_format>

## Code Quality Review Complete

**Files Reviewed:** [N] files ([X] source, [Y] test) **Overall Status:** [[PASS]
Pass / [IMPROVE] Needs Changes / [FAIL] Critical Issues]

**Quick Summary:**

- [PASS] APPROVED: [N] files approved
- [IMPROVE] IMPROVE: [N] files need minor improvements
- [FAIL] CRITICAL: [N] files have critical issues
- [WARNING] MISSING TESTS: [N] source files lack tests

**Critical Issues Found:** [List if any, or "None"]

**Common Problems:** [Top 3-5 recurring issues across files]

**Next Actions:** [List immediate action items]

---

**For Test Quality Review:**

Run `/dev/review-tests` to perform comprehensive test review including:

- Test structure and AAA pattern
- Mocking strategies and fixture design
- Coverage completeness (happy/error/edge paths)
- Assertion quality
- Test maintainability

---

See full detailed report above for specifics.

**Would you like me to:**

- [ ] Fix issues automatically (where safe to do so)
- [ ] Show examples of fixes from similar files
- [ ] Explain any specific findings in detail
- [ ] Re-review after you make changes
- [ ] Run `/dev/review-tests` for test quality review

</output_format>

<procedure>
**After presenting findings:**

If ticket ID was detected:

1. Save the complete review report (including all sections above) to:
   `.ai/context/tasks/${TICKET_ID}/review-code.md`
2. Inform user:
   ```
   Review report saved to: .ai/context/tasks/${TICKET_ID}/review-code.md
   ```
   </procedure>

## Important Guidelines

**Be Thorough:**

- Review every changed source file
- Check against all Python coding standards
- Compare with similar files for pattern consistency
- Don't skip any checklist items
- Check for test file existence (but don't deep-dive)

**Be Specific:**

- Cite exact line numbers
- Quote problematic code
- Suggest specific fixes with code examples
- Reference similar files for examples
- Show code snippets of correct patterns

**Be Constructive:**

- Explain why something is wrong
- Provide actionable recommendations
- Show examples of correct patterns from codebase
- Acknowledge what's done well
- Prioritize issues (critical vs. recommendations)

**Focus on Code Quality:**

- Prioritize critical issues (missing type hints, wrong location)
- Flag code clarity problems (useless comments, bad names)
- Verify file organization
- Ensure pattern consistency
- Check test existence (surface level only)

**Be Efficient:**

- Use parallel research tasks
- Don't repeat similar findings
- Group related issues
- Prioritize action items

## Relationship to Other Commands

Recommended workflow:

1. `/dev/plan` - Create implementation plan
2. `/dev/implement` - Implement the plan
3. `/dev/review-code` - Review code quality and standards (this command)
4. Fix code issues found
5. `/dev/review-tests` - Review test quality comprehensively
6. Fix test issues found
7. `/dev/verify` - Verify functionality
8. `/dev/commit` - Create git commits
9. Push to git / Create PR

## Common Code Issues to Watch For

### Missing Type Annotations

```typescript
// BAD - No type annotations
function calculateScore(agent, lead) {
  return agent.performance * lead.priority;
}

// GOOD - Complete type annotations
function calculateScore(agent: Agent, lead: Lead): number {
  return agent.performance * lead.priority;
}
```

### Useless Comments

```typescript
// BAD - Comment explains obvious code
// Increment counter by 1
counter += 1;

// Loop through agents
for (const agent of agents) {
  process(agent);
}

// GOOD - Self-explanatory code, no comments needed
counter += 1;
for (const agent of agents) {
  processAgentAssignment(agent);
}
```

### Poor Variable Names

```typescript
// BAD - Abbreviated, unclear
function procAgs(agLst: any[], ld: any): void {
  for (const ag of agLst) {
    const s = calc(ag, ld);
  }
}

// GOOD - Clear, descriptive
function processAgentAssignments(agents: Agent[], lead: Lead): void {
  for (const agent of agents) {
    const score = calculatePacingScore(agent, lead);
  }
}
```

### Using `any` Type

```typescript
// BAD - Using any (defeats TypeScript)
function getAgents(ids: any): any {
  // Type safety lost!
}

// GOOD - Proper types with union
function getAgents(ids: number[]): Record<string, unknown> | null {
  // Type safety maintained
}
```

### Missing .js Extensions in Imports

```typescript
// BAD - Missing .js extension (ES Modules requirement)
import { loadConfig } from './config/index';
import * as fs from 'fs';

// GOOD - Proper .js extensions and node: protocol
import { loadConfig } from './config/index.js';
import * as fs from 'node:fs';
```
