---
description: Review a Zustand store against project guidelines and report compliance
model: opus
---

# Review Store

Reviews an existing store's implementation and tests against project guidelines. Produces a detailed compliance report with pass/fail checklist.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- Store must exist (will locate based on name parameter)
- If store doesn't exist, stop and inform user

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Locate [store-name]-store files | pending |
| 2 | Review [store-name]-store implementation | pending |
| 3 | Review [store-name]-store tests | pending |
| 4 | Generate review report | pending |

Replace `[store-name]` with the actual store name from the parameter (e.g., `chat`).

Proceed to Phase 1.

## Phase 1: Locate Store

Mark todo "Locate [store-name]-store files" as `in_progress`.

<implement>
1. Search for the store in both locations:
   ```bash
   find src/stores -name "[store-name]-store*" -type f
   find src/features -path "*/stores/[store-name]-store*" -type f
   ```

2. Once found, verify expected files exist:
   - `[store-name]-store.ts`
   - `[store-name]-store.test.ts`

3. Record which files exist and which are missing

4. Determine location type:
   - If in `src/stores/` → global store
   - If in `src/features/[feature]/stores/` → feature store
</implement>

<validate>
Store file must exist: `[store-name]-store.ts`

If store not found, stop and report:
```
Store "[store-name]-store" not found.
Searched: src/stores/, src/features/*/stores/
```

If found, proceed even if test file is missing (will note in report).
</validate>

Mark todo "Locate [store-name]-store files" as `completed`. Proceed to Phase 2.

## Phase 2: Review Implementation

Mark todo "Review [store-name]-store implementation" as `in_progress`.

**Note:** Store guidelines auto-load from `.claude/rules/frontend/features/stores/store.md`
**Read:** `[path]/[store-name]-store.ts`

<implement>
Review the store against the checklist below. For each item, mark PASS or FAIL.

### Implementation Checklist

**File Structure:**
- [ ] File is named `[store-name]-store.ts` (kebab-case + -store)
- [ ] One store per file

**Code Order:**
- [ ] Imports are ordered: zustand → middleware → types
- [ ] Types section after imports
- [ ] State type defined and separate from Actions
- [ ] Actions type defined and separate from State
- [ ] Store type combines State & Actions
- [ ] Initial state constant defined
- [ ] Selectors defined before store
- [ ] Store creation with `create()`
- [ ] Named exports at end (no default export)

**Naming:**
- [ ] Store hook is `use[Domain]Store`
- [ ] State type is `[Domain]State`
- [ ] Actions type is `[Domain]Actions`
- [ ] Store type is `[Domain]Store`
- [ ] Actions follow patterns: `add[Item]`, `remove[Item]`, `set[Value]`, `toggle[Value]`
- [ ] Selectors follow pattern: `select[Thing]`

**Middleware:**
- [ ] Wrapped with `devtools()` middleware
- [ ] Store named in devtools: `{ name: '[Store]Store' }`
- [ ] All actions named (third param in `set()`): `'actionName'`
- [ ] Uses `persist()` if state needs persistence (check if appropriate)

**Required Features:**
- [ ] `initialState` constant exists (for reset)
- [ ] `reset` action exists that restores `initialState`
- [ ] Selectors are extracted as standalone functions
- [ ] Selectors are exported

**Don't Rules (should NOT have):**
- [ ] No default exports
- [ ] No multiple stores in file
- [ ] No mixed unrelated state domains
- [ ] No inline selectors in components (should be extracted)
</implement>

<validate>
Count PASS and FAIL items. Record findings for final report.
Continue to Phase 3 regardless of failures (collecting all issues).
</validate>

Mark todo "Review [store-name]-store implementation" as `completed`. Proceed to Phase 3.

## Phase 3: Review Tests

Mark todo "Review [store-name]-store tests" as `in_progress`.

**Note:** Store test guidelines auto-load when working on `*-store.test.ts` files
**Read:** `[path]/[store-name]-store.test.ts` (if exists)

<implement>
If test file doesn't exist, mark all as MISSING and note in report.

If exists, review against checklist:

### Test Checklist

**File Structure:**
- [ ] File is named `[store-name]-store.test.ts`

**Code Order:**
- [ ] Imports first (vitest, store, selectors)
- [ ] Mocks after imports (if any)
- [ ] describe blocks for tests

**Test Organization:**
- [ ] Root describe uses store name
- [ ] Has `describe('initial state')` block
- [ ] Has `describe('actions')` block
- [ ] Has `describe('selectors')` block
- [ ] Has `describe('reset')` block

**Test Quality:**
- [ ] Uses AAA pattern with comments (Arrange, Act, Assert)
- [ ] Uses `vi.fn()` for mock functions (if needed)
- [ ] Resets store between tests with `beforeEach`

**Test Setup:**
- [ ] Uses `beforeEach` to reset store state:
  ```typescript
  beforeEach(() => {
    useStore.getState().reset();
  });
  ```

**Coverage:**
- [ ] Tests initial state values
- [ ] Tests each action modifies state correctly
- [ ] Tests selectors return expected values
- [ ] Tests parameterized selectors (if any)
- [ ] Tests reset restores initial state
- [ ] Tests persist/rehydration (if uses persist middleware)

**Naming:**
- [ ] describe blocks use lowercase for categories
- [ ] Condition describes use `when [condition]`
- [ ] Test names use `should [verb] [outcome]`
</implement>

<validate>
Count PASS, FAIL, and MISSING items. Record findings for final report.
Continue to Phase 4.
</validate>

Mark todo "Review [store-name]-store tests" as `completed`. Proceed to Phase 4.

## Phase 4: Generate Report

Mark todo "Generate review report" as `in_progress`.

<implement>
Generate a comprehensive review report in this format:

```markdown
# Store Review: use[StoreName]Store

**Location:** [path]
**Type:** [global/feature]
**Uses Persist:** [yes/no]
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
- Check for devtools middleware and action naming

**Don't:**
- Read all files upfront
- Stop at first failure (collect ALL issues)
- Be vague about problems
- Skip any checklist items

**When:**
- WHEN file is missing → Mark all items for that file as MISSING
- WHEN issue found → Note specific location and suggest fix
- WHEN all pass → Still generate report confirming compliance
- WHEN store not found → Stop and inform user
- WHEN devtools missing → Flag as high priority fix
- WHEN actions not named → Flag for devtools debugging
