---
description: Create a Zustand store with test file following project guidelines
model: opus
---

# Create Store

Creates a complete Zustand store with implementation and test file. Each phase reads only the guideline it needs, preventing context overload.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- Store spec must exist at `.ai/specs/stores/[store-name].md`
- If spec doesn't exist, stop and ask user to create it first

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Scaffold [store-name]-store files | pending |
| 2 | Implement [store-name]-store | pending |
| 3 | Create [store-name]-store tests | pending |
| 4 | Final validation | pending |

Replace `[store-name]` with the actual store name from the parameter (e.g., `chat`).

Proceed to Phase 1.

## Phase 1: Scaffold

Mark todo "Scaffold [store-name]-store files" as `in_progress`.

**Read:** `.ai/specs/stores/[store-name].md`

<implement>
1. Parse the store spec to understand:
   - Store name (domain)
   - Location (global or feature)
   - State shape, actions, selectors

2. Determine the correct path:
   - If global → `src/stores/`
   - If feature → `src/features/[feature]/stores/`

3. Create the files:
   ```
   [location]/
   ├── [store-name]-store.ts
   └── [store-name]-store.test.ts
   ```

4. Create empty placeholder files:
   - `[store-name]-store.ts` → `// Store implementation`
   - `[store-name]-store.test.ts` → `// Store tests`
</implement>

<validate>
Verify both files exist:
```bash
ls -la [path-to-stores]/[store-name]-store*
```
Should show: `[store-name]-store.ts`, `[store-name]-store.test.ts`

If any file is missing, create it. Do not proceed until both files exist.
</validate>

Mark todo "Scaffold [store-name]-store files" as `completed`. Proceed to Phase 2.

## Phase 2: Implement Store

Mark todo "Implement [store-name]-store" as `in_progress`.

**Note:** Store guidelines auto-load from `.claude/rules/frontend/features/stores/store.md` when working on `*-store.ts` files

<implement>
Using the store spec (from Phase 1) and store guidelines (just read), implement the store:

1. Follow the Code Order exactly:
   - Imports (zustand, middleware, types)
   - Types (State type, Actions type, Store type - separate)
   - Initial State (constant for reset)
   - Selectors (exported functions)
   - Store (the `create()` call)
   - Exports (named only)

2. Apply Location Rules:
   - Global/shared → `src/stores/`
   - Feature-specific → `src/features/[feature]/stores/`

3. Always wrap with `devtools()` middleware

4. Name all actions (third param in `set()`) for devtools

5. Include `reset` action that restores `initialState`

6. Extract all selectors as standalone functions

7. Export store, selectors, and types
</implement>

<validate>
Run TypeScript check:
```bash
npm run check-types
```

Must pass with no errors. If errors exist, fix them and re-run. Do not proceed until passing.
</validate>

Mark todo "Implement [store-name]-store" as `completed`. Proceed to Phase 3.

## Phase 3: Create Tests

Mark todo "Create [store-name]-store tests" as `in_progress`.

**Note:** Store test guidelines auto-load when working on `*-store.test.ts` files

<implement>
Using the test guidelines (just read) and the store implementation:

1. Follow the Code Order:
   - Imports (vitest, store, selectors)
   - Mocks (if needed)
   - Tests (describe blocks)

2. Create test categories:
   - `describe('initial state')` - Default values
   - `describe('actions')` - Each action behavior
   - `describe('selectors')` - Selector return values
   - `describe('reset')` - Reset restores initial state

3. Use AAA pattern with comments:
   - // Arrange
   - // Act
   - // Assert

4. Reset store state between tests using `beforeEach`:
   ```typescript
   beforeEach(() => {
     useStore.getState().reset();
   });
   ```

5. Test each action modifies state correctly

6. Test selectors return expected values
</implement>

<validate>
Run tests:
```bash
npm run test -- [store-name]-store
```

All tests must pass. If any fail, fix and re-run. Do not proceed until all tests pass.
</validate>

Mark todo "Create [store-name]-store tests" as `completed`. Proceed to Phase 4.

## Phase 4: Final Validation

Mark todo "Final validation" as `in_progress`.

<implement>
Run full validation suite:
```bash
npm run check-types && npm run lint && npm run test -- [store-name]-store
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
Store created successfully!

Files created:
- [path]/[store-name]-store.ts
- [path]/[store-name]-store.test.ts

Next steps:
- Import with: import { use[StoreName]Store, select* } from '[path]'
- Open Redux DevTools to inspect state
- Run `npm run test` to run all tests
```

## Guidelines

**Do:**
- Read each guideline file only at the phase that requires it
- Validate after each phase before proceeding
- Use the store spec as the source of truth for state/actions
- Follow location rules strictly (global vs feature)
- Always use devtools middleware

**Don't:**
- Read all guideline files upfront
- Skip validation steps
- Proceed to next phase if validation fails
- Mix unrelated state domains in one store
- Inline selectors in components

**When:**
- WHEN validation fails → Fix and re-validate, do not proceed
- WHEN spec is missing → Stop and ask user to create it
- WHEN state needs persistence → Add `persist()` middleware
- WHEN unclear about a decision → Check the spec first, then ask user
