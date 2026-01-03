---
description: Review a complete feature module against project guidelines
model: opus
---

# Review Feature

Reviews an entire feature module - its structure, components, hooks, stores, API, and barrel exports against project guidelines. Produces a comprehensive compliance report.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- Feature must exist at `src/features/[feature-name]/`
- If feature doesn't exist, stop and inform user

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Inventory [feature-name] structure | pending |
| 2 | Review [feature-name] structure | pending |
| 3 | Review [feature-name] components | pending |
| 4 | Review [feature-name] hooks | pending |
| 5 | Review [feature-name] stores | pending |
| 6 | Review [feature-name] API | pending |
| 7 | Review [feature-name] barrel exports | pending |
| 8 | Generate feature report | pending |

Replace `[feature-name]` with the actual feature name from the parameter.

Proceed to Phase 1.

## Phase 1: Inventory Structure

Mark todo "Inventory [feature-name] structure" as `in_progress`.

<implement>
1. Verify feature exists:
   ```bash
   ls -la src/features/[feature-name]/
   ```

2. Inventory all contents:
   ```bash
   find src/features/[feature-name] -type f -name "*.ts" -o -name "*.tsx"
   ```

3. Count units found:
   - Components (folders in `components/`)
   - Hooks (files matching `use-*.ts` in `hooks/`)
   - Stores (files matching `*-store.ts` in `stores/`)
   - Agents (files in `api/agents/`)
   - Tools (files in `api/tools/`)
   - Schemas (files in `api/schemas/`)

4. Record inventory:
   ```
   Feature: [name]
   Components: [count] - [list]
   Hooks: [count] - [list]
   Stores: [count] - [list]
   Agents: [count] - [list]
   Tools: [count] - [list]
   Has types/index.ts: [yes/no]
   Has index.ts barrel: [yes/no]
   ```
</implement>

<validate>
Feature folder must exist with at least one unit.

If feature not found, stop and report:
```
Feature "[feature-name]" not found at src/features/[feature-name]/
```
</validate>

Mark todo "Inventory [feature-name] structure" as `completed`. Proceed to Phase 2.

## Phase 2: Review Structure

Mark todo "Review [feature-name] structure" as `in_progress`.

**Read:** `.claude/rules/frontend/features/feature-module.md (auto-loads)`

<implement>
Review the feature structure against checklist:

### Structure Checklist

**Required Files:**
- [ ] `index.ts` exists (feature barrel)
- [ ] `types/index.ts` exists

**Folder Organization:**
- [ ] Components in `components/[name]/` folders (not loose files)
- [ ] Hooks as `hooks/use-[name].ts` files
- [ ] Stores as `stores/[name]-store.ts` files
- [ ] API organized in `api/agents/`, `api/tools/`, `api/schemas/`

**Naming:**
- [ ] Feature folder is kebab-case
- [ ] All subfolders follow conventions

**No Empty Folders:**
- [ ] Each subfolder has content or is intentionally empty
</implement>

<validate>
Record all PASS/FAIL items. Continue regardless of failures.
</validate>

Mark todo "Review [feature-name] structure" as `completed`. Proceed to Phase 3.

## Phase 3: Review Components

Mark todo "Review [feature-name] components" as `in_progress`.

Skip if no components found. Mark as completed and proceed.

**Read:** `.claude/rules/frontend/shared/components/component.md or .claude/rules/frontend/features/components/component.md (auto-loads)`
**Read:** `.claude/rules/frontend/shared/components/story.md or .claude/rules/frontend/features/components/story.md (auto-loads)`
**Read:** `.claude/rules/frontend/shared/components/component-test.md or .claude/rules/frontend/features/components/component-test.md (auto-loads)`

<implement>
For EACH component in the feature, review against checklist:

### Per-Component Checklist

**Files:**
- [ ] `[name].tsx` exists
- [ ] `[name].stories.tsx` exists
- [ ] `[name].test.tsx` exists
- [ ] `index.ts` barrel exists

**Implementation (from component.md):**
- [ ] Code order correct (imports → types → variants → component → displayName → exports)
- [ ] NO forwardRef (feature components don't need it)
- [ ] NO props spreading (explicit props only)
- [ ] Props type exported
- [ ] displayName set
- [ ] Named exports only
- [ ] Uses semantic tokens

**Story (from story.md):**
- [ ] Title follows `Features/[Feature]/[Component]` pattern
- [ ] Has autodocs tag
- [ ] argTypes defined for all props
- [ ] Default story exists
- [ ] Variant stories exist

**Tests (from test.md):**
- [ ] Uses AAA pattern
- [ ] Has rendering tests
- [ ] Has interaction tests (if callbacks)
- [ ] Uses getByRole queries
</implement>

<validate>
Record all findings per component. Continue to next phase.
</validate>

Mark todo "Review [feature-name] components" as `completed`. Proceed to Phase 4.

## Phase 4: Review Hooks

Mark todo "Review [feature-name] hooks" as `in_progress`.

Skip if no hooks found. Mark as completed and proceed.

**Read:** `.claude/rules/frontend/shared/hooks/hook.md or .claude/rules/frontend/features/hooks/hook.md (auto-loads)`

<implement>
For EACH hook in the feature, review against checklist:

### Per-Hook Checklist

**Files:**
- [ ] `use-[name].ts` exists
- [ ] `use-[name].test.ts` exists

**Implementation:**
- [ ] Code order correct
- [ ] Function declaration (not arrow)
- [ ] Options type exported (if has options)
- [ ] Return type exported
- [ ] Callbacks memoized with useCallback
- [ ] Named exports only
- [ ] No data fetching (belongs in api/)

**Tests:**
- [ ] Uses renderHook
- [ ] Tests initialization
- [ ] Tests behavior
- [ ] Tests edge cases
</implement>

<validate>
Record all findings per hook. Continue to next phase.
</validate>

Mark todo "Review [feature-name] hooks" as `completed`. Proceed to Phase 5.

## Phase 5: Review Stores

Mark todo "Review [feature-name] stores" as `in_progress`.

Skip if no stores found. Mark as completed and proceed.

**Read:** `.claude/rules/frontend/features/stores/store.md (auto-loads)`

<implement>
For EACH store in the feature, review against checklist:

### Per-Store Checklist

**Files:**
- [ ] `[name]-store.ts` exists
- [ ] `[name]-store.test.ts` exists

**Implementation:**
- [ ] Code order correct
- [ ] State and Actions types separate
- [ ] initialState constant exists
- [ ] reset action exists
- [ ] Wrapped with devtools()
- [ ] Actions named for devtools
- [ ] Selectors extracted
- [ ] Named exports only

**Tests:**
- [ ] Tests initial state
- [ ] Tests each action
- [ ] Tests selectors
- [ ] Tests reset
- [ ] Resets state in beforeEach
</implement>

<validate>
Record all findings per store. Continue to next phase.
</validate>

Mark todo "Review [feature-name] stores" as `completed`. Proceed to Phase 6.

## Phase 6: Review API

Mark todo "Review [feature-name] API" as `in_progress`.

Skip if no API found. Mark as completed and proceed.

**Read:** `.claude/rules/frontend/features/api/api.md (auto-loads)`

<implement>
For EACH agent/tool in the feature, review against checklist:

### Per-Agent Checklist

- [ ] `[name]-agent.ts` exists
- [ ] `[name]-agent.test.ts` exists
- [ ] Has BOTH sync and stream versions
- [ ] Uses getModel() (no hardcoded models)
- [ ] Types exported (Config, Input, Output)
- [ ] JSDoc with @example

### Per-Tool Checklist

- [ ] `[name]-tool.ts` exists
- [ ] `[name]-tool.test.ts` exists
- [ ] Uses Zod for parameters
- [ ] Parameters have .describe()
- [ ] Error handling in execute

### API Barrel

- [ ] `api/index.ts` exists
- [ ] Exports all agents and tools
</implement>

<validate>
Record all findings. Continue to next phase.
</validate>

Mark todo "Review [feature-name] API" as `completed`. Proceed to Phase 7.

## Phase 7: Review Barrel Exports

Mark todo "Review [feature-name] barrel exports" as `in_progress`.

**Read:** `src/features/[feature-name]/index.ts`

<implement>
Review the feature barrel against checklist:

### Barrel Checklist

**Exports Present:**
- [ ] Components exported
- [ ] Hooks exported (if any)
- [ ] Store and selectors exported (if any)
- [ ] API exported (if any)
- [ ] Types exported

**Export Quality:**
- [ ] Only public API exported (not internal helpers)
- [ ] Named exports only (no default)
- [ ] No `export *` (explicit exports)
- [ ] Types exported with `export type`

**Import Rules:**
- [ ] No imports from other features
- [ ] Uses relative imports for own modules
- [ ] Uses @/ for shared code
</implement>

<validate>
Record all findings. Continue to final phase.
</validate>

Mark todo "Review [feature-name] barrel exports" as `completed`. Proceed to Phase 8.

## Phase 8: Generate Report

Mark todo "Generate feature report" as `in_progress`.

<implement>
Generate a comprehensive feature review report:

```markdown
# Feature Review: [feature-name]

**Location:** src/features/[feature-name]/
**Reviewed:** [date]

---

## Inventory

| Unit Type | Count | Items |
|-----------|-------|-------|
| Components | X | [list] |
| Hooks | X | [list] |
| Stores | X | [list] |
| Agents | X | [list] |
| Tools | X | [list] |

---

## Summary

| Category | Pass | Fail | Missing | Total |
|----------|------|------|---------|-------|
| Structure | X | X | X | X |
| Components | X | X | X | X |
| Hooks | X | X | X | X |
| Stores | X | X | X | X |
| API | X | X | X | X |
| Barrel | X | X | X | X |
| **Total** | X | X | X | X |

**Overall:** [PASS / NEEDS WORK]

---

## Structure Review

[Checklist with PASS/FAIL]

---

## Component Review

### [ComponentName]
[Checklist with PASS/FAIL]

### Issues Found
- [Issues]

### Recommendations
- [Fixes]

---

## Hook Review

[Same format per hook]

---

## Store Review

[Same format per store]

---

## API Review

[Same format per agent/tool]

---

## Barrel Export Review

[Checklist with PASS/FAIL]

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
- Complete inventory
- Summary table with counts
- All checklist items per unit
- Specific issues with file references
- Prioritized action items
</validate>

Mark todo "Generate feature report" as `completed`.

Present the report to the user.

## Guidelines

**Do:**
- Inventory everything before reviewing
- Review each unit type with its specific guideline
- Be specific about issues (file:line references)
- Provide actionable recommendations
- Prioritize issues by impact

**Don't:**
- Read all guidelines upfront
- Stop at first failure (collect ALL issues)
- Skip any unit found
- Be vague about problems

**When:**
- WHEN no units of a type → Skip that review phase
- WHEN unit missing tests → Flag as high priority
- WHEN cross-feature imports found → Flag as critical
- WHEN barrel exports internal code → Flag as high priority
