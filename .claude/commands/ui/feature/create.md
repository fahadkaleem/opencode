---
description: Create a complete feature module with components, hooks, stores, and API
model: opus
---

# Create Feature

Creates a complete feature module with all specified units (components, hooks, stores, API). Scaffolds the folder structure first, then creates each unit following its respective guidelines.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- Feature spec must exist at `.ai/specs/features/[feature-name].md`
- If spec doesn't exist, stop and ask user to create it first
- Component specs will be generated from the feature spec

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Parse [feature-name] spec | pending |
| 2 | Scaffold [feature-name] structure | pending |
| 3 | Create [feature-name] types | pending |
| 4 | Create [feature-name] components | pending |
| 5 | Create [feature-name] hooks | pending |
| 6 | Create [feature-name] stores | pending |
| 7 | Create [feature-name] API | pending |
| 8 | Create [feature-name] barrel exports | pending |
| 9 | Final validation | pending |

Replace `[feature-name]` with the actual feature name from the parameter.

Proceed to Phase 1.

## Phase 1: Parse Feature Spec

Mark todo "Parse [feature-name] spec" as `in_progress`.

**Read:** `.ai/specs/features/[feature-name].md`

<implement>
1. Parse the feature spec to extract:
   - Feature name
   - Description
   - Components list (with props)
   - Hooks list (with options/returns)
   - Stores list (with state/actions)
   - API list (agents/tools with inputs/outputs)
   - Types needed

2. Create a mental inventory:
   ```
   Feature: [name]
   Components: [count] - [list]
   Hooks: [count] - [list]
   Stores: [count] - [list]
   API: [count] - [list]
   ```

3. Identify which subfolders are needed:
   - Always: `components/`, `types/`
   - If hooks specified: `hooks/`
   - If stores specified: `stores/`
   - If API specified: `api/`, `api/agents/`, `api/tools/`, `api/schemas/`
</implement>

<validate>
Feature spec must have at least:
- Feature name
- At least one component OR one hook OR one store

If spec is incomplete, stop and ask user to complete it.
</validate>

Mark todo "Parse [feature-name] spec" as `completed`. Proceed to Phase 2.

## Phase 2: Scaffold Structure

Mark todo "Scaffold [feature-name] structure" as `in_progress`.

**Read:** `.claude/rules/frontend/features/feature-module.md (auto-loads)`

<implement>
1. Create the feature folder:
   ```bash
   mkdir -p src/features/[feature-name]
   ```

2. Create required subfolders based on spec:
   ```bash
   # Always create
   mkdir -p src/features/[feature-name]/components
   mkdir -p src/features/[feature-name]/types

   # If hooks in spec
   mkdir -p src/features/[feature-name]/hooks

   # If stores in spec
   mkdir -p src/features/[feature-name]/stores

   # If API in spec
   mkdir -p src/features/[feature-name]/api/agents
   mkdir -p src/features/[feature-name]/api/tools
   mkdir -p src/features/[feature-name]/api/schemas
   ```

3. Create placeholder files:
   - `src/features/[feature-name]/index.ts` → `// Feature barrel - will be populated`
   - `src/features/[feature-name]/types/index.ts` → `// Feature types`
   - `src/features/[feature-name]/api/index.ts` → `// API barrel` (if API needed)
</implement>

<validate>
Verify folder structure exists:
```bash
find src/features/[feature-name] -type d
```

Should show all expected subfolders. If any missing, create them.
</validate>

Mark todo "Scaffold [feature-name] structure" as `completed`. Proceed to Phase 3.

## Phase 3: Create Types

Mark todo "Create [feature-name] types" as `in_progress`.

<implement>
1. Based on the feature spec, identify all types needed:
   - Message types, state types, prop types shared across components
   - Do NOT duplicate component-specific prop types here

2. Create `src/features/[feature-name]/types/index.ts`:
   - Define all shared types
   - Export all types

Example structure:
```typescript
// Types shared across the feature

export type [Entity] = {
  id: string;
  // ... fields from spec
};

export type [State] = {
  // ... state shape from spec
};
```
</implement>

<validate>
Run TypeScript check:
```bash
npm run check-types
```

Must pass. If type errors, fix them.
</validate>

Mark todo "Create [feature-name] types" as `completed`. Proceed to Phase 4.

## Phase 4: Create Components

Mark todo "Create [feature-name] components" as `in_progress`.

For EACH component in the feature spec, create the component following the component guidelines.

<implement>
For each component:

1. Create the component folder:
   ```
   src/features/[feature-name]/components/[component-name]/
   ```

2. **Read:** `.claude/rules/frontend/shared/components/component.md or .claude/rules/frontend/features/components/component.md (auto-loads)` (read once, apply to all)

3. Create component files:
   - `[component-name].tsx` - Implementation
   - `[component-name].stories.tsx` - Stories
   - `[component-name].test.tsx` - Tests
   - `index.ts` - Barrel export

4. Follow component guidelines:
   - NO forwardRef (feature components)
   - Explicit props only (no spread)
   - Import shared types from `../types`
   - Use semantic tokens

5. **Read:** `.claude/rules/frontend/shared/components/story.md or .claude/rules/frontend/features/components/story.md (auto-loads)` - Create stories

6. **Read:** `.claude/rules/frontend/shared/components/component-test.md or .claude/rules/frontend/features/components/component-test.md (auto-loads)` - Create tests

7. Update sub-todos for each component:
   - "Create [component-name] component"
</implement>

<validate>
After ALL components created:
```bash
npm run check-types && npm run lint
```

Must pass. Fix any errors before proceeding.
</validate>

Mark todo "Create [feature-name] components" as `completed`. Proceed to Phase 5.

## Phase 5: Create Hooks

Mark todo "Create [feature-name] hooks" as `in_progress`.

Skip this phase if no hooks in spec. Mark as completed and proceed to Phase 6.

<implement>
For each hook in the spec:

1. **Read:** `.claude/rules/frontend/shared/hooks/hook.md or .claude/rules/frontend/features/hooks/hook.md (auto-loads)` (read once, apply to all)

2. Create hook files:
   - `src/features/[feature-name]/hooks/use-[hook-name].ts`
   - `src/features/[feature-name]/hooks/use-[hook-name].test.ts`

3. Follow hook guidelines:
   - Function declaration (not arrow)
   - Export options and return types
   - Memoize callbacks with useCallback
   - Import types from `../types` if needed

4. **Read:** `.claude/rules/frontend/shared/hooks/hook-test.md or .claude/rules/frontend/features/hooks/hook-test.md (auto-loads)` - Create tests with renderHook
</implement>

<validate>
After ALL hooks created:
```bash
npm run check-types && npm run test -- use-
```

Must pass. Fix any errors before proceeding.
</validate>

Mark todo "Create [feature-name] hooks" as `completed`. Proceed to Phase 6.

## Phase 6: Create Stores

Mark todo "Create [feature-name] stores" as `in_progress`.

Skip this phase if no stores in spec. Mark as completed and proceed to Phase 7.

<implement>
For each store in the spec:

1. **Read:** `.claude/rules/frontend/features/stores/store.md (auto-loads)` (read once, apply to all)

2. Create store files:
   - `src/features/[feature-name]/stores/[store-name]-store.ts`
   - `src/features/[feature-name]/stores/[store-name]-store.test.ts`

3. Follow store guidelines:
   - Separate State and Actions types
   - Always use devtools middleware
   - Name all actions for devtools
   - Include reset action
   - Extract selectors
   - Import types from `../types` if needed

4. **Read:** `.claude/rules/frontend/features/stores/store-test.md (auto-loads)` - Create tests
</implement>

<validate>
After ALL stores created:
```bash
npm run check-types && npm run test -- store
```

Must pass. Fix any errors before proceeding.
</validate>

Mark todo "Create [feature-name] stores" as `completed`. Proceed to Phase 7.

## Phase 7: Create API

Mark todo "Create [feature-name] API" as `in_progress`.

Skip this phase if no API in spec. Mark as completed and proceed to Phase 8.

<implement>
For each agent/tool in the spec:

1. **Read:** `.claude/rules/frontend/features/api/api.md (auto-loads)` (read once, apply to all)

2. For agents:
   - Create `src/features/[feature-name]/api/agents/[name]-agent.ts`
   - Create `src/features/[feature-name]/api/agents/[name]-agent.test.ts`
   - Provide BOTH sync and stream versions

3. For tools:
   - Create `src/features/[feature-name]/api/tools/[name]-tool.ts`
   - Create `src/features/[feature-name]/api/tools/[name]-tool.test.ts`
   - Use Zod for parameter schemas

4. For schemas:
   - Create `src/features/[feature-name]/api/schemas/index.ts`
   - Export schemas and inferred types

5. Create API barrel:
   - Update `src/features/[feature-name]/api/index.ts`
   - Export all agents, tools, schemas

6. **Read:** `.claude/rules/frontend/features/api/api-test.md (auto-loads)` - Create tests
</implement>

<validate>
After ALL API created:
```bash
npm run check-types && npm run test -- agent && npm run test -- tool
```

Must pass. Fix any errors before proceeding.
</validate>

Mark todo "Create [feature-name] API" as `completed`. Proceed to Phase 8.

## Phase 8: Create Barrel Exports

Mark todo "Create [feature-name] barrel exports" as `in_progress`.

<implement>
1. Update `src/features/[feature-name]/index.ts`:

```typescript
// ============================================================
// FILE: src/features/[feature-name]/index.ts
// Feature public API
// ============================================================

// Components
export { ComponentA } from './components/component-a';
export { ComponentB } from './components/component-b';
// ... all public components

// Hooks (if any)
export { useHookA } from './hooks/use-hook-a';
// ... all public hooks

// Store (if any)
export {
  use[Feature]Store,
  selectX,
  selectY,
} from './stores/[feature]-store';

// API (if any)
export { [feature]Agent, [feature]AgentStream } from './api';
// ... public API

// Types
export type { TypeA, TypeB } from './types';
```

2. Only export what consumers need:
   - Main components (not internal helpers)
   - Public hooks
   - Store hook and selectors
   - Public types
</implement>

<validate>
Run TypeScript check to ensure all exports are valid:
```bash
npm run check-types
```

Test that imports work:
```typescript
// This should work from app layer:
import { ComponentA, useHookA, use[Feature]Store } from '@/features/[feature-name]';
```
</validate>

Mark todo "Create [feature-name] barrel exports" as `completed`. Proceed to Phase 9.

## Phase 9: Final Validation

Mark todo "Final validation" as `in_progress`.

<implement>
Run full validation suite:
```bash
npm run check-types && npm run lint && npm run test
```
</implement>

<validate>
All commands must pass:
- TypeScript: No type errors
- ESLint: No lint errors (especially import rules)
- Tests: All tests pass

If any fail, fix the issues and re-run.
</validate>

Mark todo "Final validation" as `completed`.

Report success to user:

```
Feature "[feature-name]" created successfully!

Structure:
src/features/[feature-name]/
├── api/           [X agents, Y tools]
├── components/    [Z components]
├── hooks/         [W hooks]
├── stores/        [V stores]
├── types/
└── index.ts

Files created: [total count]

Next steps:
- Import from: @/features/[feature-name]
- Run `npm run storybook` to view components
- Run `npm run test` to run all tests
```

## Guidelines

**Do:**
- Read each guideline only when that phase starts
- Validate after each phase before proceeding
- Use the feature spec as the source of truth
- Create all specified units before barrel exports
- Only export public API from feature barrel

**Don't:**
- Read all guidelines upfront
- Skip any unit specified in the spec
- Export internal implementation details
- Create cross-feature imports

**When:**
- WHEN no hooks in spec → Skip Phase 5
- WHEN no stores in spec → Skip Phase 6
- WHEN no API in spec → Skip Phase 7
- WHEN validation fails → Fix and re-validate, do not proceed
- WHEN spec is missing → Stop and ask user to create it
