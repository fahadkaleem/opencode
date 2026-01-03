---
description: Create an AI agent, tool, or schema following project guidelines
model: opus
---

# Create API

Creates an AI agent, tool, or schema with implementation and test file. Each phase reads only the guideline it needs, preventing context overload.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- API spec must exist at `.ai/specs/api/[name].md`
- Spec must define `type: agent | tool | schema`
- If spec doesn't exist, stop and ask user to create it first

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Scaffold [name] files | pending |
| 2 | Implement [name] [type] | pending |
| 3 | Create [name] tests | pending |
| 4 | Final validation | pending |

Replace `[name]` with the actual name and `[type]` with agent/tool/schema from the spec.

Proceed to Phase 1.

## Phase 1: Scaffold

Mark todo "Scaffold [name] files" as `in_progress`.

**Read:** `.ai/specs/api/[name].md`

<implement>
1. Parse the spec to understand:
   - Name
   - Type (agent, tool, or schema)
   - Feature location
   - Inputs, outputs, behavior

2. Determine the correct path based on type:
   - Agent → `src/features/[feature]/api/agents/`
   - Tool → `src/features/[feature]/api/tools/`
   - Schema → `src/features/[feature]/api/schemas/` or `src/lib/ai/schemas/`

3. Create the files based on type:

   **For Agent:**
   ```
   agents/
   ├── [name]-agent.ts
   └── [name]-agent.test.ts
   ```

   **For Tool:**
   ```
   tools/
   ├── [name]-tool.ts
   └── [name]-tool.test.ts
   ```

   **For Schema:**
   ```
   schemas/
   └── [name].ts  (schemas typically don't need separate test files)
   ```

4. Create empty placeholder files:
   - `[name]-[type].ts` → `// [Type] implementation`
   - `[name]-[type].test.ts` → `// [Type] tests` (if applicable)
</implement>

<validate>
Verify files exist:
```bash
ls -la [path-to-api]/[subfolder]/[name]*
```

If any file is missing, create it. Do not proceed until all files exist.
</validate>

Mark todo "Scaffold [name] files" as `completed`. Proceed to Phase 2.

## Phase 2: Implement

Mark todo "Implement [name] [type]" as `in_progress`.

**Read:** `.ai/guidelines/api.md`

<implement>
Using the spec (from Phase 1) and API guidelines (just read), implement based on type:

### For Agent:

1. Follow the Code Order:
   - Imports (AI SDK, Zod, utilities, types)
   - Types (Config, Input, Output)
   - Constants (default prompts, config)
   - Agent functions (sync and stream versions)
   - Exports

2. Provide BOTH sync and stream versions:
   - `[name]Agent` - uses `generateText`
   - `[name]AgentStream` - uses `streamText`

3. Use `getModel()` from providers (never hardcode model names)

4. Include JSDoc with `@example` for all exported functions

### For Tool:

1. Follow the Code Order:
   - Imports (AI SDK tool, Zod)
   - Types (Input, Output)
   - Constants (Zod schema for parameters)
   - Tool definition
   - Exports

2. Use Zod for parameter schema with `.describe()` on each field

3. Handle errors gracefully in `execute` function

### For Schema:

1. Follow the Code Order:
   - Imports (Zod)
   - Schema definitions
   - Type inference (`z.infer`)
   - Exports

2. Export both schema and inferred type
</implement>

<validate>
Run TypeScript check:
```bash
npm run check-types
```

Must pass with no errors. If errors exist, fix them and re-run. Do not proceed until passing.
</validate>

Mark todo "Implement [name] [type]" as `completed`. Proceed to Phase 3.

## Phase 3: Create Tests

Mark todo "Create [name] tests" as `in_progress`.

**Read:** `.ai/guidelines/api-test.md`

<implement>
Using the test guidelines (just read) and the implementation:

### For Agent:

1. Create test categories:
   - `describe('configuration')` - Default config, custom config
   - `describe('generation')` - Text generation, tool calls
   - `describe('streaming')` - Stream version works
   - `describe('error handling')` - API errors, invalid input

2. Mock the AI SDK functions:
   ```typescript
   vi.mock('ai', () => ({
     generateText: vi.fn(),
     streamText: vi.fn(),
   }));
   ```

### For Tool:

1. Create test categories:
   - `describe('parameters')` - Schema validation
   - `describe('execution')` - Successful execution
   - `describe('error handling')` - API errors, edge cases

2. Mock external API calls

### For Schema:

1. Create test categories:
   - `describe('validation')` - Valid data passes
   - `describe('rejection')` - Invalid data fails with correct errors

2. Test schema parsing with `schema.parse()` and `schema.safeParse()`
</implement>

<validate>
Run tests:
```bash
npm run test -- [name]-[type]
```

All tests must pass. If any fail, fix and re-run. Do not proceed until all tests pass.

Note: Schema tests may be in a shared file. Adjust test command as needed.
</validate>

Mark todo "Create [name] tests" as `completed`. Proceed to Phase 4.

## Phase 4: Final Validation

Mark todo "Final validation" as `in_progress`.

<implement>
Run full validation suite:
```bash
npm run check-types && npm run lint && npm run test -- [name]
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
[Type] created successfully!

Files created:
- [path]/[name]-[type].ts
- [path]/[name]-[type].test.ts (if applicable)

Next steps:
- Import with: import { [name][Type] } from '[path]'
- For agents: Both sync and stream versions available
- Run `npm run test` to run all tests
```

## Guidelines

**Do:**
- Read each guideline file only at the phase that requires it
- Validate after each phase before proceeding
- Use the spec as the source of truth for inputs/outputs
- Provide both sync and stream versions for agents
- Use Zod for all schema validation

**Don't:**
- Read all guideline files upfront
- Skip validation steps
- Proceed to next phase if validation fails
- Hardcode model names (use `getModel()`)
- Skip error handling in tools

**When:**
- WHEN validation fails → Fix and re-validate, do not proceed
- WHEN spec is missing → Stop and ask user to create it
- WHEN creating agent → Always provide sync AND stream versions
- WHEN tool needs external API → Mock it in tests
- WHEN unclear about a decision → Check the spec first, then ask user
