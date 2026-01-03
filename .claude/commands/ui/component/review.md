---
description: Review a UI component against project guidelines and report compliance
model: opus
---

# Review UI Component

Reviews an existing component's implementation, story, and tests against project guidelines. Produces a detailed compliance report with pass/fail checklist.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- Component must exist (will locate based on name parameter)
- If component doesn't exist, stop and inform user

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Locate [component-name] files | pending |
| 2 | Review [component-name] implementation | pending |
| 3 | Review [component-name] story | pending |
| 4 | Review [component-name] tests | pending |
| 5 | Generate review report | pending |

Replace `[component-name]` with the actual component name from the parameter.

Proceed to Phase 1.

## Phase 1: Locate Component

Mark todo "Locate [component-name] files" as `in_progress`.

<implement>
1. Search for the component in both locations:
   ```bash
   find src/components/ui -name "[component-name]" -type d
   find src/features -name "[component-name]" -type d
   ```

2. Once found, verify all expected files exist:
   - `[component-name].tsx`
   - `[component-name].stories.tsx`
   - `[component-name].test.tsx`
   - `index.ts`

3. Record which files exist and which are missing

4. Determine location type:
   - If in `src/components/ui/` → primitive (expects forwardRef)
   - If in `src/features/` → feature (no forwardRef)
</implement>

<validate>
Component folder must exist with at least `[component-name].tsx`.

If component not found, stop and report:
```
Component "[component-name]" not found.
Searched: src/components/ui/, src/features/
```

If found, proceed even if some files are missing (will note in report).
</validate>

Mark todo "Locate [component-name] files" as `completed`. Proceed to Phase 2.

## Phase 2: Review Implementation

Mark todo "Review [component-name] implementation" as `in_progress`.

**Read:** `.claude/rules/frontend/shared/components/component.md or .claude/rules/frontend/features/components/component.md (auto-loads)`
**Read:** `[path]/[component-name].tsx`

<implement>
Review the component against the checklist below. For each item, mark PASS or FAIL.

### Implementation Checklist

**File Structure:**
- [ ] File is named `[component-name].tsx` (kebab-case)
- [ ] Barrel `index.ts` exists with named exports

**Code Order:**
- [ ] Imports are ordered: external → @/ → relative
- [ ] Types section exists after imports
- [ ] Props type is exported
- [ ] Variants (if any) defined before component
- [ ] Component defined after types/variants
- [ ] displayName is set
- [ ] Named exports at end (no default export)

**Location Rules:**
- [ ] If ui/ → Uses forwardRef
- [ ] If ui/ → Spreads ...props onto root element
- [ ] If features/ → No forwardRef
- [ ] If features/ → Explicit props only (no spread)

**Naming:**
- [ ] Component name is PascalCase
- [ ] Props type is `[Component]Props`
- [ ] Variants const is `[component]Variants` (if CVA used)
- [ ] Boolean props use `is`/`has` prefix or adjective
- [ ] Event handlers use `on` prefix

**Styling:**
- [ ] Uses semantic tokens (no raw colors like `#fff` or `red-500`)
- [ ] className prop accepted for customization
- [ ] Uses `cn()` for class merging

**Don't Rules (should NOT have):**
- [ ] No default exports
- [ ] No multiple components in file
- [ ] No hooks defined in component file
- [ ] No helper functions in component file
</implement>

<validate>
Count PASS and FAIL items. Record findings for final report.
Continue to Phase 3 regardless of failures (collecting all issues).
</validate>

Mark todo "Review [component-name] implementation" as `completed`. Proceed to Phase 3.

## Phase 3: Review Story

Mark todo "Review [component-name] story" as `in_progress`.

**Read:** `.claude/rules/frontend/shared/components/story.md or .claude/rules/frontend/features/components/story.md (auto-loads)`
**Read:** `[path]/[component-name].stories.tsx` (if exists)

<implement>
If story file doesn't exist, mark all as MISSING and note in report.

If exists, review against checklist:

### Story Checklist

**File Structure:**
- [ ] File is named `[component-name].stories.tsx`

**Code Order:**
- [ ] Imports first (Storybook types, fn, component)
- [ ] Meta object defined
- [ ] Type `Story = StoryObj<typeof meta>` defined
- [ ] Stories exported after type

**Meta Configuration:**
- [ ] Title follows convention (UI/ or Features/[Feature]/)
- [ ] component property set
- [ ] tags includes 'autodocs'
- [ ] argTypes defined for all props
- [ ] argTypes have control, description, table.category

**Stories:**
- [ ] Default story exists
- [ ] Stories for each variant value
- [ ] Stories for each size value (if applicable)
- [ ] Loading state story (if has isLoading)
- [ ] Disabled state story (if has disabled)
- [ ] AllVariants composed story (if has variants)

**Best Practices:**
- [ ] Uses `fn()` for event handler args
- [ ] Uses layout parameter (centered/padded)
- [ ] No default exports for stories (only meta)
</implement>

<validate>
Count PASS, FAIL, and MISSING items. Record findings for final report.
Continue to Phase 4 regardless of failures.
</validate>

Mark todo "Review [component-name] story" as `completed`. Proceed to Phase 4.

## Phase 4: Review Tests

Mark todo "Review [component-name] tests" as `in_progress`.

**Read:** `.claude/rules/frontend/shared/components/component-test.md or .claude/rules/frontend/features/components/component-test.md (auto-loads)`
**Read:** `[path]/[component-name].test.tsx` (if exists)

<implement>
If test file doesn't exist, mark all as MISSING and note in report.

If exists, review against checklist:

### Test Checklist

**File Structure:**
- [ ] File is named `[component-name].test.tsx`

**Code Order:**
- [ ] Imports first (vitest, testing-library, userEvent, component)
- [ ] Mocks after imports (if any)
- [ ] describe blocks for tests

**Test Organization:**
- [ ] Root describe uses PascalCase component name
- [ ] Has `describe('rendering')` block
- [ ] Has `describe('interactions')` block (if has callbacks)
- [ ] Has `describe('edge cases')` block

**Test Quality:**
- [ ] Uses AAA pattern with comments (Arrange, Act, Assert)
- [ ] Uses `getByRole` as primary query
- [ ] Uses `userEvent.setup()` for interactions (not fireEvent)
- [ ] Uses `vi.fn()` for mock functions

**Coverage:**
- [ ] Tests default render
- [ ] Tests each variant renders
- [ ] Tests callbacks are called (if has onClick, etc.)
- [ ] Tests disabled state (if has disabled)
- [ ] Tests loading state (if has isLoading)
- [ ] Tests ref forwarding (if ui/ primitive)

**Naming:**
- [ ] describe blocks use lowercase for categories
- [ ] Condition describes use `when [condition]`
- [ ] Test names use `should [verb] [outcome]`
</implement>

<validate>
Count PASS, FAIL, and MISSING items. Record findings for final report.
Continue to Phase 5.
</validate>

Mark todo "Review [component-name] tests" as `completed`. Proceed to Phase 5.

## Phase 5: Generate Report

Mark todo "Generate review report" as `in_progress`.

<implement>
Generate a comprehensive review report in this format:

```markdown
# Component Review: [ComponentName]

**Location:** [path]
**Type:** [primitive/feature]
**Reviewed:** [date]

---

## Summary

| Category | Pass | Fail | Missing | Total |
|----------|------|------|---------|-------|
| Implementation | X | X | - | X |
| Story | X | X | X | X |
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

## Story Review

[List each checklist item with [PASS], [FAIL], or [MISSING]]

### Issues Found
- [Issues]

### Recommendations
- [Fixes]

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
- WHEN component not found → Stop and inform user
