---
description: Create a custom React hook with test file following project guidelines
model: opus
---

# Create Hook

Creates a complete custom React hook with implementation and test file. Each phase reads only the guideline it needs, preventing context overload.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- Hook spec must exist at `.ai/specs/hooks/[hook-name].md`
- If spec doesn't exist, stop and ask user to create it first

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Scaffold [hook-name] files | pending |
| 2 | Implement [hook-name] hook | pending |
| 3 | Create [hook-name] tests | pending |
| 4 | Final validation | pending |

Replace `[hook-name]` with the actual hook name from the parameter (e.g., `use-toggle`).

Proceed to Phase 1.

## Phase 1: Scaffold

Mark todo "Scaffold [hook-name] files" as `in_progress`.

**Read:** `.ai/specs/hooks/[hook-name].md`

<implement>
1. Parse the hook spec to understand:
   - Hook name
   - Location (shared or feature)
   - Options, return values, behavior

2. Determine the correct path:
   - If shared → `src/hooks/`
   - If feature → `src/features/[feature]/hooks/`

3. Create the files:
   ```
   [location]/
   ├── use-[hook-name].ts
   └── use-[hook-name].test.ts
   ```

4. Create empty placeholder files:
   - `use-[hook-name].ts` → `// Hook implementation`
   - `use-[hook-name].test.ts` → `// Hook tests`
</implement>

<validate>
Verify both files exist:
```bash
ls -la [path-to-hooks]/use-[hook-name]*
```
Should show: `use-[hook-name].ts`, `use-[hook-name].test.ts`

If any file is missing, create it. Do not proceed until both files exist.
</validate>

Mark todo "Scaffold [hook-name] files" as `completed`. Proceed to Phase 2.

## Phase 2: Implement Hook

Mark todo "Implement [hook-name] hook" as `in_progress`.

**Note:** Hook guidelines auto-load from `.claude/rules/frontend/shared/hooks/hook.md` or `.claude/rules/frontend/features/hooks/hook.md` based on file path

<implement>
Using the hook spec (from Phase 1) and hook guidelines (just read), implement the hook:

1. Follow the Code Order exactly:
   - Imports (React hooks, utilities, types)
   - Types (export options and return types)
   - Constants (default values, if any)
   - Hook (function declaration, not arrow)
   - Exports (named only)

2. Apply Location Rules:
   - Shared hooks → `src/hooks/`
   - Feature hooks → `src/features/[feature]/hooks/`
   - Data fetching → `src/features/[feature]/api/` (NOT hooks)

3. Apply Return Pattern:
   - 1 value → Direct return
   - 2 values → Tuple with `as const`
   - 3+ values → Object return

4. Memoize all callbacks with `useCallback`

5. Export the hook and its types
</implement>

<validate>
Run TypeScript check:
```bash
npm run check-types
```

Must pass with no errors. If errors exist, fix them and re-run. Do not proceed until passing.
</validate>

Mark todo "Implement [hook-name] hook" as `completed`. Proceed to Phase 3.

## Phase 3: Create Tests

Mark todo "Create [hook-name] tests" as `in_progress`.

**Note:** Hook test guidelines auto-load when working on `.test.ts` files

<implement>
Using the test guidelines (just read) and the hook implementation:

1. Follow the Code Order:
   - Imports (vitest, @testing-library/react, renderHook, hook)
   - Mocks (if needed)
   - Tests (describe blocks)

2. Create test categories:
   - `describe('initialization')` - Default values, options
   - `describe('behavior')` - State changes, actions
   - `describe('edge cases')` - Error handling, boundary conditions

3. Use `renderHook` from `@testing-library/react` for testing hooks

4. Use AAA pattern with comments:
   - // Arrange
   - // Act
   - // Assert

5. Test each option and return value
</implement>

<validate>
Run tests:
```bash
npm run test -- use-[hook-name]
```

All tests must pass. If any fail, fix and re-run. Do not proceed until all tests pass.
</validate>

Mark todo "Create [hook-name] tests" as `completed`. Proceed to Phase 4.

## Phase 4: Final Validation

Mark todo "Final validation" as `in_progress`.

<implement>
Run full validation suite:
```bash
npm run check-types && npm run lint && npm run test -- use-[hook-name]
```
</implement>

<validate>
All three commands must pass:
- TypeScript: No type errors
- ESLint: No lint errors
- Tests: All tests pass

If any fail, fix the issues and re-run the full suite.
</validate>

Mark todo "Final validation" as `completed`.

Report success to user:

```
Hook created successfully!

Files created:
- [path]/use-[hook-name].ts
- [path]/use-[hook-name].test.ts

Next steps:
- Import with: import { use[HookName] } from '[path]'
- Run `npm run test` to run all tests
```

## Guidelines

**Do:**
- Read each guideline file only at the phase that requires it
- Validate after each phase before proceeding
- Use the hook spec as the source of truth for options/return values
- Follow location rules strictly (shared vs feature)

**Don't:**
- Read all guideline files upfront
- Skip validation steps
- Proceed to next phase if validation fails
- Put data fetching hooks in `hooks/` folder (use `api/` instead)

**When:**
- WHEN validation fails → Fix and re-validate, do not proceed
- WHEN spec is missing → Stop and ask user to create it
- WHEN unclear about a decision → Check the spec first, then ask user
