---
description: Review a custom hook against project guidelines and report compliance
model: opus
---

# Review Hook

Reviews an existing hook's implementation and tests against project guidelines. Produces a detailed compliance report with pass/fail checklist.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- Hook must exist (will locate based on name parameter)
- If hook doesn't exist, stop and inform user

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Locate [hook-name] files | pending |
| 2 | Review [hook-name] implementation | pending |
| 3 | Review [hook-name] tests | pending |
| 4 | Generate review report | pending |

Replace `[hook-name]` with the actual hook name from the parameter (e.g., `use-toggle`).

Proceed to Phase 1.

## Phase 1: Locate Hook

Mark todo "Locate [hook-name] files" as `in_progress`.

<implement>
1. Search for the hook in both locations:
   ```bash
   find src/hooks -name "use-[hook-name]*" -type f
   find src/features -path "*/hooks/use-[hook-name]*" -type f
   ```

2. Once found, verify expected files exist:
   - `use-[hook-name].ts`
   - `use-[hook-name].test.ts`

3. Record which files exist and which are missing

4. Determine location type:
   - If in `src/hooks/` → shared hook
   - If in `src/features/[feature]/hooks/` → feature hook
</implement>

<validate>
Hook file must exist: `use-[hook-name].ts`

If hook not found, stop and report:
```
Hook "use-[hook-name]" not found.
Searched: src/hooks/, src/features/*/hooks/
```

If found, proceed even if test file is missing (will note in report).
</validate>

Mark todo "Locate [hook-name] files" as `completed`. Proceed to Phase 2.

## Phase 2: Review Implementation

Mark todo "Review [hook-name] implementation" as `in_progress`.

**Note:** Hook guidelines auto-load from `.claude/rules/frontend/shared/hooks/hook.md` or `.claude/rules/frontend/features/hooks/hook.md`
**Read:** `[path]/use-[hook-name].ts`

<implement>
Review the hook against the checklist below. For each item, mark PASS or FAIL.

### Implementation Checklist

**File Structure:**
- [ ] File is named `use-[hook-name].ts` (use- prefix, kebab-case)
- [ ] One hook per file

**Code Order:**
- [ ] Imports are ordered: React hooks → utilities → types
- [ ] Types section exists after imports
- [ ] Options type exported (if has options)
- [ ] Return type exported
- [ ] Constants defined (if any)
- [ ] Hook function defined (not arrow function)
- [ ] Named exports at end (no default export)

**Naming:**
- [ ] File uses `use-` prefix with kebab-case
- [ ] Hook function uses `use` prefix with PascalCase
- [ ] Options type is `Use[Name]Options`
- [ ] Return type is `Use[Name]Return`
- [ ] State variables are camelCase
- [ ] Setter functions use `set[State]` pattern
- [ ] Action functions use verb names

**Return Pattern:**
- [ ] 1 value → Direct return
- [ ] 2 values → Tuple with `as const`
- [ ] 3+ values → Object return

**Best Practices:**
- [ ] Callbacks memoized with `useCallback`
- [ ] Expensive computations use `useMemo`
- [ ] Types are exported for consumers
- [ ] No data fetching logic (belongs in api/)

**Don't Rules (should NOT have):**
- [ ] No default exports
- [ ] No multiple hooks in file
- [ ] No data fetching (use api/ folder with TanStack Query)
</implement>

<validate>
Count PASS and FAIL items. Record findings for final report.
Continue to Phase 3 regardless of failures (collecting all issues).
</validate>

Mark todo "Review [hook-name] implementation" as `completed`. Proceed to Phase 3.

## Phase 3: Review Tests

Mark todo "Review [hook-name] tests" as `in_progress`.

**Note:** Hook test guidelines auto-load when working on `.test.ts` files
**Read:** `[path]/use-[hook-name].test.ts` (if exists)

<implement>
If test file doesn't exist, mark all as MISSING and note in report.

If exists, review against checklist:

### Test Checklist

**File Structure:**
- [ ] File is named `use-[hook-name].test.ts`

**Code Order:**
- [ ] Imports first (vitest, @testing-library/react, hook)
- [ ] Mocks after imports (if any)
- [ ] describe blocks for tests

**Test Organization:**
- [ ] Root describe uses hook name
- [ ] Has `describe('initialization')` block
- [ ] Has `describe('behavior')` block
- [ ] Has `describe('edge cases')` block

**Test Quality:**
- [ ] Uses `renderHook` from `@testing-library/react`
- [ ] Uses AAA pattern with comments (Arrange, Act, Assert)
- [ ] Uses `vi.fn()` for mock functions
- [ ] Uses `act()` for state updates

**Coverage:**
- [ ] Tests default values / initial state
- [ ] Tests each option parameter
- [ ] Tests each return value / action
- [ ] Tests edge cases (empty, null, boundary)
- [ ] Tests cleanup (if hook has effects)

**Naming:**
- [ ] describe blocks use lowercase for categories
- [ ] Condition describes use `when [condition]`
- [ ] Test names use `should [verb] [outcome]`
</implement>

<validate>
Count PASS, FAIL, and MISSING items. Record findings for final report.
Continue to Phase 4.
</validate>

Mark todo "Review [hook-name] tests" as `completed`. Proceed to Phase 4.

## Phase 4: Generate Report

Mark todo "Generate review report" as `in_progress`.

<implement>
Generate a comprehensive review report in this format:

```markdown
# Hook Review: use[HookName]

**Location:** [path]
**Type:** [shared/feature]
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

**Don't:**
- Read all files upfront
- Stop at first failure (collect ALL issues)
- Be vague about problems
- Skip any checklist items

**When:**
- WHEN file is missing → Mark all items for that file as MISSING
- WHEN issue found → Note specific location and suggest fix
- WHEN all pass → Still generate report confirming compliance
- WHEN hook not found → Stop and inform user
- WHEN data fetching logic found → Flag as wrong location (should be in api/)
