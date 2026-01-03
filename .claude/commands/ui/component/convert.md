---
description: Convert existing component code to project template structure
model: opus
---

# Convert UI Component

Converts existing component code (e.g., from shadcn, Radix, or other sources) to follow project guidelines. Restructures the code, generates stories from demo examples, and creates tests.

## Pre-requisites

- Do NOT read any guideline files until instructed in each phase
- User must provide source code (component implementation)
- User may optionally provide demo code (for story generation)
- Determine component name from the source code

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Analyze [component-name] source code | pending |
| 2 | Scaffold [component-name] files | pending |
| 3 | Convert [component-name] implementation | pending |
| 4 | Generate [component-name] stories | pending |
| 5 | Generate [component-name] tests | pending |
| 6 | Final validation | pending |

Extract `[component-name]` from the source code (e.g., `Button` -> `button`).

Proceed to Phase 1.

## Phase 1: Analyze Source Code

Mark todo "Analyze [component-name] source code" as `in_progress`.

**Read:** `docs/COMPONENT_INVENTORY.md`

<implement>
### 1.1 Determine Location

First, search COMPONENT_INVENTORY.md for the component name:
- If found in "Tier 1: Primitives" → location is `src/components/ui/`
- If found in "Tier 2: Chat Components" → location is `src/features/chat/components/`
- If found elsewhere → use the path specified in inventory
- If NOT found → ask user:
  ```
  Component "[name]" not found in COMPONENT_INVENTORY.md.

  Where should this component live?
  1. src/components/ui/ (primitive - reusable across app)
  2. src/features/chat/components/ (chat feature specific)
  3. Other (specify path)
  ```

Record the location for Phase 2.

### 1.2 Analyze Source Code

Analyze the provided source code to extract:

1. **Component name** (PascalCase from source)
2. **Props interface/type**:
   - List all props with types
   - Note which extend HTML attributes
   - Identify boolean props (disabled, loading, etc.)
   - Identify event handlers (onClick, etc.)

3. **Variants** (if CVA used):
   - List variant names (variant, size, etc.)
   - List values for each variant
   - Note default values

4. **Patterns used**:
   - forwardRef? (yes/no)
   - asChild/Slot? (yes/no)
   - CVA? (yes/no)
   - displayName set? (yes/no)

5. **From demo code** (if provided):
   - List demo function names
   - Map each to a variant/state combination
   - Note any props usage patterns

Present analysis to confirm understanding:

```
## Source Analysis: [ComponentName]

**Location:** [path from inventory or user choice]
**Type:** [primitive/feature]

**Props:**
| Prop | Type | Default | From HTML Attrs |
|------|------|---------|-----------------|
| ... | ... | ... | ... |

**Variants:**
| Name | Values | Default |
|------|--------|---------|
| ... | ... | ... |

**Patterns:**
- forwardRef: [yes/no] (required: [yes if ui/, no if features/])
- asChild: [yes/no]
- CVA: [yes/no]
- displayName: [yes/no]

**Demo -> Stories mapping:**
| Demo Function | Story Name | Props |
|---------------|------------|-------|
| ButtonDemo | Default | {} |
| ButtonSecondary | Secondary | { variant: 'secondary' } |
| ... | ... | ... |

**Missing (will add):**
- [x] isLoading prop (if not present but demo shows loading pattern)
- [x] Section comments for code order
- [x] Type export (if only interface exists)
```
</implement>

<validate>
Confirm analysis is correct. If source code is unclear or incomplete, ask user for clarification before proceeding.
</validate>

Mark todo "Analyze [component-name] source code" as `completed`. Proceed to Phase 2.

## Phase 2: Scaffold Files

Mark todo "Scaffold [component-name] files" as `in_progress`.

<implement>
1. Convert component name to kebab-case for file names

2. Use the location determined in Phase 1 to create folder structure:
   ```
   [location]/[component-name]/
   ├── [component-name].tsx
   ├── [component-name].stories.tsx
   ├── [component-name].test.tsx
   └── index.ts
   ```

   Examples:
   - Primitive: `src/components/ui/spinner/`
   - Feature: `src/features/chat/components/message-bubble/`

3. Create empty placeholder files
</implement>

<validate>
Verify all 4 files exist:
```bash
ls -la [location]/[component-name]/
```
</validate>

Mark todo "Scaffold [component-name] files" as `completed`. Proceed to Phase 3.

## Phase 3: Convert Implementation

Mark todo "Convert [component-name] implementation" as `in_progress`.

**Read:** `.claude/rules/frontend/shared/components/component.md or .claude/rules/frontend/features/components/component.md (auto-loads)`

<implement>
Restructure the source code following our template:

### Code Order

```tsx
// ============================================================
// 1. IMPORTS
// ============================================================
// External imports (keep from source)
// @/ imports (keep from source)
// Relative imports (add if needed)

// ============================================================
// 2. TYPES
// ============================================================
// Convert interface to type if needed
// Export the props type
// Keep the HTML attributes extension

// ============================================================
// 3. CONSTANTS (if any)
// ============================================================

// ============================================================
// 4. VARIANTS
// ============================================================
// Keep CVA variants from source (already good)

// ============================================================
// 5. COMPONENT
// ============================================================
// Keep forwardRef pattern
// Keep implementation logic

// ============================================================
// 6. DISPLAY NAME
// ============================================================
// Keep displayName (already good)

// ============================================================
// 7. EXPORTS
// ============================================================
// Named exports only
```

### Specific Transformations

1. **Interface to Type:**
   ```tsx
   // From:
   export interface ButtonProps extends ... { }

   // To:
   export type ButtonProps = ... & { }
   ```

2. **Add isLoading if missing:**
   If demo shows loading pattern (manual Loader2), add proper isLoading prop:
   ```tsx
   export type ButtonProps = ... & {
     isLoading?: boolean;
   };

   // In component:
   const Button = forwardRef<..., ButtonProps>(
     ({ ..., isLoading, disabled, children, ...props }, ref) => {
       return (
         <Comp
           disabled={disabled || isLoading}
           ...
         >
           {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
         </Comp>
       );
     }
   );
   ```

3. **Add/verify forwardRef based on location:**
   - If `src/components/ui/` (primitive) → ADD forwardRef if missing
   - If `src/features/` (feature) → REMOVE forwardRef if present

4. **Add section comments** for code order clarity

5. **Write index.ts barrel:**
   ```tsx
   export { Button, buttonVariants } from './button';
   export type { ButtonProps } from './button';
   ```
</implement>

<validate>
```bash
npm run check-types
```
Must pass with no errors.
</validate>

Mark todo "Convert [component-name] implementation" as `completed`. Proceed to Phase 4.

## Phase 4: Generate Stories

Mark todo "Generate [component-name] stories" as `in_progress`.

**Read:** `.claude/rules/frontend/shared/components/story.md or .claude/rules/frontend/features/components/story.md (auto-loads)`

<implement>
Generate stories from demo code mapping (from Phase 1 analysis).

Transform each demo function into a CSF3 story:

```tsx
// Demo: function ButtonDemo() { return <Button>Button</Button> }
// Becomes:
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

// Demo: function ButtonSecondary() { return <Button variant="secondary">Secondary</Button> }
// Becomes:
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

// Demo: function ButtonLoading() { return <Button disabled><Loader2 />Please wait</Button> }
// Becomes (using our isLoading prop):
export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Please wait',
  },
};

// Demo: function ButtonWithIcon() { return <Button><Mail />Login</Button> }
// Becomes:
export const WithIcon: Story = {
  render: () => (
    <Button>
      <Mail className="mr-2 h-4 w-4" />
      Login with Email
    </Button>
  ),
};
```

Include:
1. Meta with title (based on location), component, tags, argTypes
   - If `src/components/ui/` → title: `UI/[ComponentName]`
   - If `src/features/chat/` → title: `Features/Chat/[ComponentName]`
   - If other feature → title: `Features/[Feature]/[ComponentName]`
2. Default story
3. Story for each variant value
4. Story for each size value
5. State stories (Loading, Disabled)
6. Special cases from demo (WithIcon, AsChild)
7. AllVariants and AllSizes composed stories
</implement>

<validate>
```bash
npm run storybook -- --smoke-test
```
Must complete without errors.
</validate>

Mark todo "Generate [component-name] stories" as `completed`. Proceed to Phase 5.

## Phase 5: Generate Tests

Mark todo "Generate [component-name] tests" as `in_progress`.

**Read:** `.claude/rules/frontend/shared/components/component-test.md or .claude/rules/frontend/features/components/component-test.md (auto-loads)`

<implement>
Generate tests based on:
- Props from analysis
- Variants from analysis
- Demo patterns

Standard test structure:

```tsx
describe('[ComponentName]', () => {
  describe('rendering', () => {
    it('should render with default props', () => { ... });
    it('should render all variant styles', () => { ... });
    it('should render all size variants', () => { ... });
    it('should apply custom className', () => { ... });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', () => { ... });
    it('should not call onClick when disabled', () => { ... });
    it('should not call onClick when loading', () => { ... });
  });

  describe('edge cases', () => {
    describe('when disabled', () => { ... });
    describe('when loading', () => { ... });
    describe('with asChild', () => { ... });
    describe('with ref forwarding', () => { ... });
  });
});
```
</implement>

<validate>
```bash
npm run test -- [component-name]
```
All tests must pass.
</validate>

Mark todo "Generate [component-name] tests" as `completed`. Proceed to Phase 6.

## Phase 6: Final Validation

Mark todo "Final validation" as `in_progress`.

<implement>
Run full validation:
```bash
npm run check-types && npm run lint && npm run test -- [component-name]
```
</implement>

<validate>
All three must pass. If any fail, fix and re-run.
</validate>

Mark todo "Final validation" as `completed`.

Report to user:

```
Component converted successfully!

Source: [original source name, e.g., "shadcn Button"]
Output: src/components/ui/[component-name]/

Files created:
- [component-name].tsx (restructured with section comments, type export, isLoading)
- [component-name].stories.tsx (X stories from demo)
- [component-name].test.tsx (X test cases)
- index.ts (barrel exports)

Changes from source:
- [List specific changes made]

Run `npm run storybook` to view the component.
```

## Guidelines

**Do:**
- Preserve the original component logic (it's battle-tested)
- Add structure/comments without changing behavior
- Map demo functions directly to stories
- Add isLoading if demo shows manual loading pattern

**Don't:**
- Rewrite working logic unnecessarily
- Remove features from the original
- Change variant names/values (keep compatibility)
- Skip the analysis phase

**When:**
- WHEN source has interface → Convert to type
- WHEN source missing isLoading but demo shows loading → Add isLoading prop
- WHEN demo has render function with JSX → Use render() in story
- WHEN demo has simple props → Use args in story
