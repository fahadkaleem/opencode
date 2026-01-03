---
description: Create a UI component with story and test files following project guidelines
model: opus
---

# Create UI Component

Creates a complete UI component with implementation, Storybook story, and test file. Each phase reads only the guideline it needs, preventing context overload.

## Pre-requisites

- Guidelines auto-load from `.claude/rules/frontend/` based on file paths
- Component spec must exist at `.ai/specs/components/[component-name].md`
- If spec doesn't exist, stop and ask user to create it first

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Scaffold [component-name] files | pending |
| 2 | Implement [component-name] component | pending |
| 3 | Create [component-name] story | pending |
| 4 | Create [component-name] tests | pending |
| 5 | Final validation | pending |

Replace `[component-name]` with the actual component name from the parameter.

Proceed to Phase 1.

## Phase 1: Scaffold

Mark todo "Scaffold [component-name] files" as `in_progress`.

**Read:** `.ai/specs/components/[component-name].md`

<implement>
1. Parse the component spec to understand:
   - Component name
   - Location (ui/ or features/)
   - Props, variants, sizes

2. Determine the correct path:
   - If primitive → `src/components/ui/[component-name]/`
   - If feature → `src/features/[feature]/components/[component-name]/`

3. Create the folder structure:
   ```
   [component-name]/
   ├── [component-name].tsx
   ├── [component-name].stories.tsx
   ├── [component-name].test.tsx
   └── index.ts
   ```

4. Create empty placeholder files (just comments for now):
   - `[component-name].tsx` → `// Component implementation`
   - `[component-name].stories.tsx` → `// Storybook stories`
   - `[component-name].test.tsx` → `// Component tests`
   - `index.ts` → `// Barrel exports`
</implement>

<validate>
Verify all 4 files exist:
```bash
ls -la [path-to-component]/
```
Should show: `[component-name].tsx`, `[component-name].stories.tsx`, `[component-name].test.tsx`, `index.ts`

If any file is missing, create it. Do not proceed until all 4 files exist.
</validate>

Mark todo "Scaffold [component-name] files" as `completed`. Proceed to Phase 2.

## Phase 2: Implement Component

Mark todo "Implement [component-name] component" as `in_progress`.

**Note:** Component guidelines auto-load based on file path:
- If working in `src/components/ui/` → `.claude/rules/frontend/shared/components/component.md` loads automatically
- If working in `src/features/*/components/` → `.claude/rules/frontend/features/components/component.md` loads automatically

<implement>
Using the component spec (from Phase 1) and component guidelines (just read), implement the component:

1. Follow the Code Order exactly:
   - Imports (external → @/ → relative)
   - Types (export props type)
   - Constants (if needed)
   - Variants (CVA if 2+ variants)
   - Component
   - displayName
   - Exports

2. Apply Location Rules:
   - If `src/components/ui/` → Use forwardRef, spread props
   - If `src/features/` → No forwardRef, explicit props only

3. Write the `index.ts` barrel file with named exports

4. Use semantic tokens from the spec (never raw colors)
</implement>

<validate>
Run TypeScript check:
```bash
npm run check-types
```

Must pass with no errors. If errors exist, fix them and re-run. Do not proceed until passing.
</validate>

Mark todo "Implement [component-name] component" as `completed`. Proceed to Phase 3.

## Phase 3: Create Story

Mark todo "Create [component-name] story" as `in_progress`.

**Note:** Story guidelines auto-load when working on `.stories.tsx` files.

<implement>
Using the story guidelines (just read) and the component implementation (from Phase 2):

1. Follow the Code Order:
   - Imports
   - Meta (title, component, tags, argTypes)
   - Type
   - Stories

2. Set correct title:
   - If `ui/` → `UI/[ComponentName]`
   - If `features/` → `Features/[Feature]/[ComponentName]`

3. Create argTypes for ALL props with:
   - control type
   - description
   - table (type, defaultValue, category)

4. Create stories:
   - Default (empty args, shows defaults)
   - One per variant value
   - One per size value (if applicable)
   - Loading state (if has isLoading)
   - Disabled state (if has disabled)
   - AllVariants composed story
   - AllSizes composed story (if applicable)
</implement>

<validate>
Run Storybook smoke test:
```bash
npm run storybook -- --smoke-test
```

Must complete without errors. If errors exist, fix them and re-run. Do not proceed until passing.
</validate>

Mark todo "Create [component-name] story" as `completed`. Proceed to Phase 4.

## Phase 4: Create Tests

Mark todo "Create [component-name] tests" as `in_progress`.

**Note:** Test guidelines auto-load when working on `.test.tsx` files.

<implement>
Using the test guidelines (just read) and the component implementation:

1. Follow the Code Order:
   - Imports (vitest, testing-library, userEvent, component)
   - Mocks (if needed)
   - Tests (describe blocks)

2. Create test categories:
   - `describe('rendering')` - Default render, variants, props
   - `describe('interactions')` - Click, callbacks (if applicable)
   - `describe('edge cases')` - Disabled, loading, ref forwarding (if ui/)

3. Use AAA pattern with comments in every test:
   - // Arrange
   - // Act
   - // Assert

4. Use getByRole as primary query method

5. Use userEvent.setup() for interactions (not fireEvent)

6. If ui/ component → Include ref forwarding test
   If features/ component → Skip ref forwarding test
</implement>

<validate>
Run tests:
```bash
npm run test -- [component-name]
```

All tests must pass. If any fail, fix and re-run. Do not proceed until all tests pass.
</validate>

Mark todo "Create [component-name] tests" as `completed`. Proceed to Phase 5.

## Phase 5: Final Validation

Mark todo "Final validation" as `in_progress`.

<implement>
Run full validation suite:
```bash
npm run check-types && npm run lint && npm run test -- [component-name]
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
Component created successfully!

Files created:
- [path]/[component-name].tsx
- [path]/[component-name].stories.tsx
- [path]/[component-name].test.tsx
- [path]/index.ts

Next steps:
- Run `npm run storybook` to view the component
- Run `npm run test` to run all tests
```

## Guidelines

**Do:**
- Read each guideline file only at the phase that requires it
- Validate after each phase before proceeding
- Use the component spec as the source of truth for props/variants
- Follow location rules strictly (ui/ vs features/)

**Don't:**
- Read all guideline files upfront
- Skip validation steps
- Proceed to next phase if validation fails
- Deviate from the spec without asking user

**When:**
- WHEN validation fails → Fix and re-validate, do not proceed
- WHEN spec is missing → Stop and ask user to create it
- WHEN unclear about a decision → Check the spec first, then ask user
