---
description:
  Autonomously remove excessive comments from git changed files based on Clean
  Code principles
model: haiku
---

# Clear Excessive Comments

You are tasked with autonomously reviewing all uncommitted git changes and
removing excessive comments that violate Uncle Bob's Clean Code principles. This
command analyzes changed files and eliminates comments that don't add value,
keeping only comments that explain non-obvious logic or "why" decisions.

No approvals needed - this task runs autonomously and completes automatically.
Summary results are returned in chat only (no report files generated).

## Philosophy: Uncle Bob's Clean Code

**Code should be self-documenting. Comments are a failure of expression.**

Only keep comments when:

- Explaining WHY a decision was made (not WHAT the code does)
- Clarifying non-obvious logic or algorithms
- Documenting important context or architecture decisions
- Noting complex workarounds or performance implications

Remove comments when:

- Duplicating what code obviously does
- Explaining variable/function names (rename instead)
- Describing obvious operations (incrementing, checking conditions)
- Serving as section headers for clear code
- Stating the obvious ("// initialize variable")

## Execution Flow

<message>
Scanning git changes for excessive comments and removing them...

I'll autonomously review all uncommitted changes and remove comments that
violate Clean Code principles:

- Remove comments that explain obvious code
- Remove redundant comments duplicating variable/function names
- Keep comments explaining WHY (architecture, design decisions)
- Keep comments explaining complex algorithms
- Ensure code is self-documenting through clear naming

Removing excessive comments now... </message>

## Step 1: Identify Changed Files

<procedure>
1. Get list of changed files:
   - `git diff --name-only --diff-filter=M`

2. Filter to code files only (exclude configs, docs):
   - Include: .ts, .tsx, .js, .jsx
   - Exclude: .md, .json, .yml, .yaml, .config.\*, test files

3. For each file, analyze the content and diff </procedure>

## Step 2: Classify and Remove Comments

For each changed file, identify and remove comments:

### REMOVE: Redundant Comments

- Comments explaining what obvious code does:
  - "// increment counter" before `counter++`
  - "// check if exists" before `if (exists)`
  - "// initialize variable" before `const x = value`
  - "// loop through items" before for loop

- Comments duplicating variable/function names:
  - Variable named `isActive` with comment "// is this active?"
  - Function named `calculateScore()` with comment "// calculate the score"

- Redundant section headers:
  - "// Configuration" when code structure is obvious
  - "// Initialization" when initialization is obvious
  - "// Helper methods" when class structure is clear

- Comments stating the obvious:
  - "// Build content" before building
  - "// Check conditions" before if statement
  - "// Return result" before return statement

- Commented-out code blocks (dead code)

- Filler comments:
  - "// TODO" without tracking issue
  - Random notes that don't explain intent
  - Historical notes

### KEEP: Valuable Comments

- Comments explaining WHY decisions were made
- Comments explaining complex logic or algorithms
- Step-by-step flow comments (Step 1, Step 2, etc.)
- JSDoc documentation
- Architectural/design context
- Important warnings or performance notes

## Step 3: Apply Changes

<procedure>
1. For each file with identified redundant comments:
   - Read the file completely
   - Remove all identified redundant comments
   - Preserve all valuable comments
   - Write back the cleaned file

2. After removing comments from all files:
   - Run build to verify syntax
   - Run typecheck for type safety
   - Verify linting passes </procedure>

## Step 4: Return Summary

After completing comment removal, present summary in chat only:

```
# Comment Cleanup Complete ✓

Files Processed: [N]
Comments Removed: [N]
Build Status: PASSING

Removed by Category:
- Explaining obvious code: [N]
- Duplicating names: [N]
- Redundant headers: [N]
- Commented-out code: [N]
- Filler comments: [N]

All changes applied and verified!
```

## Important Guidelines

**Follow Clean Code Principles:**

- Code is primary, comments are secondary
- Good code needs fewer comments
- Rename variables/functions instead of commenting
- Remove comments that duplicate code intent
- Keep only comments explaining complex logic or WHY

**Be Thorough:**

- Review every changed file completely
- Don't miss obvious redundant comments
- Verify no valuable comments are removed
- Check all comment types (inline, block, JSDoc)

**Be Safe:**

- Only remove comments (no code changes)
- Verify build succeeds after removal
- Keep all JSDoc documentation
- Preserve all architecture/design comments

## Autonomy

This command runs without human input:

- Automatically identifies excessive comments
- Automatically removes them
- Automatically verifies changes
- Reports results in chat when complete

No pauses, no confirmations, no decisions needed. Just clean code.

## Common Excessive Comments (Examples)

### Bad: Explaining Obvious Code

```typescript
// Increment the counter
counter++;

// Calculate the total
const total = items.reduce((sum, item) => sum + item.price, 0);
```

### Good: Self-documenting Code

```typescript
counter++;
const total = items.reduce((sum, item) => sum + item.price, 0);
```

### Bad: Duplicating Variable Names

```typescript
// Whether user is authenticated
const isAuthenticated = checkAuth();

// User's permission level
const userPermissionLevel = getPermissionLevel(user);
```

### Good: Clear Names

```typescript
const isAuthenticated = checkAuth();
const userPermissionLevel = getPermissionLevel(user);
```

### Good: Comments Worth Keeping

```typescript
// Using Strategy pattern because requirements may change
// and we need flexibility in processing
const processor = createProcessorStrategy(context);

// Intentionally using Map for O(1) lookups on millions of entries
const cache = new Map<string, Agent>();

// Step 1: Load configuration (may fail if missing)
// Step 2: Validate against schema (expensive operation)
// Step 3: Initialize services in order (order matters!)
```
