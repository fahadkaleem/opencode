# TextInput Component Analysis

> Applying the Component Design Framework to understand and document the TextInput component from Gemini CLI.

---

## Overview: What Are We Looking At?

Before applying the framework, let's understand the component structure:

```
TextInput.tsx (105 lines)
    ↓ depends on
text-buffer.ts (~2500 lines)
    ↓ provides
useTextBuffer hook → TextBuffer interface
```

**Key Architectural Insight:**
The Gemini CLI uses a **"headless hook"** pattern where:
- `useTextBuffer` hook (in `text-buffer.ts`) manages ALL state and logic
- `TextInput` component (in `TextInput.tsx`) is a **thin rendering layer**

This is similar to how Radix UI separates primitives from logic, or how TanStack Query separates data fetching from UI.

---

## Phase 1: PURPOSE

### The Questions

**1. What does this component do? (One sentence, no "and")**

*First attempt:* "Renders text input with cursor and handles keyboard input."

*Problem:* Uses "and" — this is two responsibilities.

*Let's look at the code to understand:*

```typescript
export function TextInput({
  buffer,        // TextBuffer is passed in — state is external
  placeholder = '',
  onSubmit,      // Callback — doesn't handle submission internally
  onCancel,      // Callback — doesn't handle cancellation internally
  focus = true,
}: TextInputProps): React.JSX.Element {
```

The component receives `buffer` (TextBuffer) as a prop. It doesn't CREATE the buffer; it USES one provided by the parent.

*Refined answer:* "Renders a text buffer as visual lines with cursor highlighting."

Wait — the component also calls `useKeypress` and routes keys to `buffer.handleInput`. Is that a second responsibility?

Let me check:

```typescript
const handleKeyPress = useCallback(
  (key: Key) => {
    if (key.name === 'escape') {
      onCancel?.();
      return;
    }
    if (key.name === 'return') {
      onSubmit?.(text);
      return;
    }
    handleInput(key);  // Delegates to buffer
  },
  [handleInput, onCancel, onSubmit, text],
);

useKeypress(handleKeyPress, { isActive: focus });
```

The component:
1. Intercepts `escape` → calls `onCancel` callback
2. Intercepts `return` → calls `onSubmit` callback
3. Everything else → delegates to `buffer.handleInput`

This is the **"thin controller"** pattern — minimal routing logic in the component, all heavy lifting in the buffer.

*Final answer:* "Bridges keyboard input to a TextBuffer and renders its visual state."

**2. What category is it?**

The categories are: Read, Write, Transform, Communicate, Orchestrate

- It doesn't read from external sources (not Read)
- It doesn't write to external systems (not Write)
- It doesn't transform data (not Transform)
- It renders UI and handles user interaction

Actually, none of the standard categories fit perfectly. This is a **UI Component** — a presentation layer.

For UI components, I'd propose a new category: **Present** — renders state and captures user intent.

**3. What can users accomplish with this that they couldn't before?**

Users can:
- See text they're typing rendered with proper line wrapping
- See cursor position highlighted (via `chalk.inverse`)
- See placeholder text when empty
- Submit text with Enter
- Cancel with Escape

### Boundaries — What This Explicitly Does NOT Do

Looking at what's in `TextBuffer` but NOT in `TextInput`:

| Handled by TextBuffer | NOT handled by TextInput |
|----------------------|-------------------------|
| Cursor movement logic | (delegates to buffer) |
| Text insertion/deletion | (delegates to buffer) |
| Undo/redo | (delegates to buffer) |
| Word navigation | (delegates to buffer) |
| Vim mode operations | (delegates to buffer) |
| Visual line calculation | (delegates to buffer) |
| Scroll position tracking | (delegates to buffer) |

This tells us the component follows **Single Responsibility** — it only handles:
1. Key event routing (escape, return vs. others)
2. Visual rendering

### Purpose Deliverable

```
PURPOSE STATEMENT
─────────────────
Name:           TextInput
Category:       Present (UI Component)
Purpose:        Bridge keyboard input to a TextBuffer and render its visual state
Enables:        Users see typed text with cursor highlighting and can submit/cancel
Excludes:       Text manipulation logic, cursor movement, undo/redo, vim operations
Depends On:     TextBuffer (passed as prop), useKeypress hook, theme colors
Used By:        InputPrompt, dialog text fields, any component needing text input
```

---

## Phase 2: INPUTS

### The Questions

**1. What inputs are required?**

From the props interface:

```typescript
export interface TextInputProps {
  buffer: TextBuffer;           // Required
  placeholder?: string;         // Optional
  onSubmit?: (value: string) => void;  // Optional
  onCancel?: () => void;        // Optional
  focus?: boolean;              // Optional
}
```

Only `buffer` is required. But is it really? What happens without it?

The component destructures `buffer` immediately:
```typescript
const {
  text,
  handleInput,
  visualCursor,
  viewportVisualLines,
  visualScrollRow,
} = buffer;
```

If `buffer` is undefined, this would crash. So yes, **buffer is required**.

**2. What inputs are optional? What are their defaults?**

| Input | Type | Default | Purpose |
|-------|------|---------|---------|
| `placeholder` | `string` | `''` | Text shown when buffer is empty |
| `onSubmit` | `(value: string) => void` | `undefined` | Called when Enter pressed |
| `onCancel` | `() => void` | `undefined` | Called when Escape pressed |
| `focus` | `boolean` | `true` | Whether to capture keyboard input |

**3. What types are each input?**

Already covered above. But let's think deeper about `TextBuffer`:

```typescript
export interface TextBuffer {
  // State (read-only from component's perspective)
  lines: string[];
  text: string;
  cursor: [number, number];
  viewportVisualLines: string[];
  visualCursor: [number, number];
  visualScrollRow: number;
  // ... 50+ more methods and properties

  // Actions (called by component)
  handleInput: (key: Key) => void;
  // ... many more
}
```

The component only uses a small subset:
- `text` — for checking emptiness and passing to onSubmit
- `handleInput` — for delegating key events
- `visualCursor` — for cursor position
- `viewportVisualLines` — for rendering
- `visualScrollRow` — for calculating cursor line

This is interesting: **the component depends on a large interface but only uses ~5 properties**.

This could be a **Dependency Inversion** opportunity — define a smaller interface that TextInput actually needs.

### Input Relationships

**Are there inputs that must be used together?**

- `focus` and callbacks: If `focus=false`, neither `onSubmit` nor `onCancel` will ever fire (keyboard isn't captured)
- `buffer` and `placeholder`: Placeholder only shows when `buffer.text.length === 0`

**Are there mutually exclusive inputs?**

None identified.

### Inputs Deliverable

```
INPUTS
──────
Required:
  - name:         buffer
    type:         TextBuffer
    description:  State container providing text, cursor, and visual lines
    valid_values: Any valid TextBuffer instance
    example:      const buffer = useTextBuffer({ viewport, ... })

Optional:
  - name:         placeholder
    type:         string
    default:      '' (empty string)
    description:  Text shown when buffer is empty
    use_case:     Guide user on expected input

  - name:         onSubmit
    type:         (value: string) => void
    default:      undefined
    description:  Called when Enter key pressed
    use_case:     Form submission, command execution

  - name:         onCancel
    type:         () => void
    default:      undefined
    description:  Called when Escape key pressed
    use_case:     Dialog dismissal, mode exit

  - name:         focus
    type:         boolean
    default:      true
    description:  Whether component captures keyboard input
    use_case:     Disable input when modal/dialog shown

Constraints:
  - buffer is required; component crashes without it
  - onSubmit/onCancel only fire when focus=true

Minimal Interface Used:
  From TextBuffer, only these properties are accessed:
    - text: string
    - handleInput: (key: Key) => void
    - visualCursor: [number, number]
    - viewportVisualLines: string[]
    - visualScrollRow: number
```

---

## Phase 3: PRECONDITIONS

### The Questions

**1. What must exist before this runs?**

- **TextBuffer must be initialized**: The parent must call `useTextBuffer()` first
- **KeypressContext must be provided**: `useKeypress` depends on `useKeypressContext()`
- **Theme must be available**: Component uses `theme.text.secondary`

**2. What must be true about inputs?**

- `buffer` must not be null/undefined
- `buffer.viewportVisualLines` must be an array (even if empty)
- `buffer.visualCursor` must be a valid `[row, col]` tuple

**3. What happens if preconditions are violated?**

Let me trace through failure scenarios:

| Violation | Result |
|-----------|--------|
| `buffer` is undefined | Crash: "Cannot destructure property 'text' of undefined" |
| `buffer.viewportVisualLines` is undefined | Crash in `.map()` |
| `KeypressContext` missing | Crash from `useKeypressContext()` |
| `theme` unavailable | Crash: "Cannot read property 'secondary' of undefined" |

None of these have graceful error handling — they're all runtime crashes.

**Should we add defensive checks?**

Looking at the design philosophy:
- This is an internal component, not a public API
- The parent (`InputPrompt`) always provides valid props
- React's strict mode would catch undefined issues in development

Conclusion: **Preconditions are caller's responsibility** (Design by Contract).

### Preconditions Deliverable

```
PRECONDITIONS (checked in order)
────────────────────────────────
1. KeypressContext available
   Check:    Component must be rendered within KeypressProvider
   Failure:  Runtime crash from useKeypressContext()

2. TextBuffer is valid
   Check:    buffer !== undefined && buffer !== null
   Failure:  Runtime crash during destructuring

3. Visual lines exist
   Check:    buffer.viewportVisualLines is array
   Failure:  Runtime crash in .map()

4. Theme is available
   Check:    theme.text.secondary is string
   Failure:  Runtime crash in placeholder rendering

VALIDATION ORDER RATIONALE:
Not explicitly validated — relies on TypeScript compile-time checks
and caller responsibility. Crashes are acceptable for development-time bugs.

IDEMPOTENCY:
Yes — rendering with same props produces same output.
The component is pure (no side effects except keyboard subscription).
```

---

## Phase 4: CONSTRAINTS

### The Questions

**1. What should this component NEVER do?**

Looking at what it delegates vs. handles:

- **NEVER** modify `buffer` state directly — always go through `buffer.handleInput()`
- **NEVER** persist state — it's a pure rendering component
- **NEVER** access the DOM directly — Ink handles terminal rendering
- **NEVER** make network requests
- **NEVER** read files

**2. What resources should it NEVER access?**

- File system
- Network
- Global state (except theme, which is read-only)
- Other components' state

**3. When must human approve?**

Not applicable — this is a low-level UI primitive with no destructive operations.

### Security Considerations

Since this component deals with user input, consider:

- **Injection**: The component uses `chalk.inverse()` on user text. Is there terminal escape sequence injection risk?

Looking at the code:
```typescript
chalk.inverse(
  cpSlice(lineText, cursorVisualColAbsolute, cursorVisualColAbsolute + 1) || ' '
)
```

The `cpSlice` is a codepoint-safe slice from `textUtils.js`. It doesn't sanitize escape sequences.

**Potential issue**: If user pastes ANSI escape codes, they could mess up terminal rendering.

Looking at `text-buffer.ts`:
```typescript
const str = stripUnsafeCharacters(
  payload.replace(/\r\n/g, '\n').replace(/\r/g, '\n'),
);
```

There's `stripUnsafeCharacters` in the insert path! This sanitizes input before it enters the buffer. So by the time it reaches TextInput, it's already clean.

**Conclusion**: Security is handled at the `TextBuffer` layer, not in `TextInput`.

### Constraints Deliverable

```
CONSTRAINTS
───────────
SECURITY INVARIANTS (must ALWAYS be true):
  1. Component never mutates buffer directly; uses handleInput() API
  2. Component never persists state; fully controlled by parent
  3. User input is sanitized by TextBuffer before reaching this component

RESOURCE LIMITS:
  - No explicit limits; limited by terminal dimensions
  - Rendering cost: O(viewportVisualLines.length) per render

APPROVAL MATRIX:
  Not applicable — low-level UI primitive with no destructive operations

TRUST BOUNDARY:
  Inside: buffer, theme, KeypressContext
  Outside: Raw keyboard input (sanitized by TextBuffer)
```

---

## Phase 5: ERROR HANDLING

### The Questions

**1. What errors can occur?**

This is a pure rendering component. What could go wrong?

| Error Type | Cause | Likelihood |
|------------|-------|------------|
| Undefined buffer | Parent bug | Low (TypeScript catches) |
| Missing context | Setup bug | Low (caught early) |
| Invalid cursor position | Buffer bug | Very low |
| Rendering crash | Terminal issue | Very low |

**2. Which errors are recoverable?**

None are recoverable at this component's level. They're all:
- **Development-time bugs** that should be fixed, not handled
- **Environmental issues** outside component's control

**3. Which require human intervention?**

None — this component shouldn't require human intervention. If something's wrong, fix the code.

### Error Handling Strategy

The component uses **"Let it crash"** philosophy:
- No try/catch blocks
- No error boundaries
- No fallback UI

This is appropriate because:
1. It's a low-level primitive
2. Errors indicate bugs, not recoverable conditions
3. Parent components can add error boundaries if needed

### Error Handling Deliverable

```
FAILURE MODES
─────────────
| Error              | Type      | Response         | Message |
|--------------------|-----------|------------------|---------|
| Undefined buffer   | Bug       | Crash            | TypeScript should prevent |
| Missing context    | Setup     | Crash            | Add KeypressProvider |
| Invalid cursor     | Bug       | Visual glitch    | Fix TextBuffer |

RETRY POLICY:
  Not applicable — no operations to retry

FALLBACK STRATEGY:
  None — component is pure UI; parent handles error boundaries

ESCALATION TRIGGERS:
  None — crashes are development-time issues
```

---

## Phase 6: EXECUTION LOGIC

### The Questions

**1. What are the main steps?**

Let me trace through the component:

```
1. Destructure props and buffer state
2. Create handleKeyPress callback (memoized)
3. Subscribe to keypress events via useKeypress hook
4. Calculate showPlaceholder flag
5. Render:
   a. If showPlaceholder && focus: placeholder with cursor on first char
   b. If showPlaceholder && !focus: placeholder in secondary color
   c. Otherwise: render viewportVisualLines with cursor highlighting
```

**2. What states can this component be in?**

| State | Condition | Render |
|-------|-----------|--------|
| Empty + Focused | `text.length === 0 && focus` | Placeholder with cursor |
| Empty + Blurred | `text.length === 0 && !focus` | Placeholder (dimmed) |
| HasText | `text.length > 0` | Visual lines with cursor |

**3. Keyboard Event Flow**

```
Key pressed
    ↓
KeypressContext receives event
    ↓
Calls subscribed handlers
    ↓
TextInput.handleKeyPress receives Key
    ↓
    ├─ key.name === 'escape' → onCancel?.()
    ├─ key.name === 'return' → onSubmit?.(text)
    └─ otherwise → buffer.handleInput(key)
```

### Render Logic Deep Dive

The cursor rendering is the most interesting part:

```typescript
const isCursorLine = focus && currentVisualRow === cursorVisualRowAbsolute;

const lineDisplay = isCursorLine
  ? cpSlice(lineText, 0, cursorVisualColAbsolute) +    // Before cursor
    chalk.inverse(
      cpSlice(lineText, cursorVisualColAbsolute, cursorVisualColAbsolute + 1) || ' '
    ) +                                                  // Cursor char (inverted)
    cpSlice(lineText, cursorVisualColAbsolute + 1)      // After cursor
  : lineText;  // No cursor on this line
```

This is a **cursor overlay** pattern:
1. Split line at cursor position
2. Apply inverse style to character at cursor
3. If cursor is at end of line, show inverse space

### Execution Deliverable

```
EXECUTION LOGIC
───────────────
STEPS:
  1. Destructure buffer and props
     - Extract: text, handleInput, visualCursor, viewportVisualLines, visualScrollRow

  2. Create keypress handler (useCallback)
     - Intercept: escape → onCancel, return → onSubmit
     - Delegate: everything else → buffer.handleInput

  3. Subscribe to keyboard (useKeypress)
     - Only when focus=true
     - Cleanup on unmount or focus change

  4. Determine render mode
     → If text empty AND placeholder exists:
       - Show placeholder with cursor overlay if focused
       - Show dimmed placeholder if blurred
     → Otherwise:
       - Render viewportVisualLines with cursor on current line

RENDER ALGORITHM:
  For each visual line in viewportVisualLines:
    1. Calculate absolute visual row (visualScrollRow + index)
    2. Check if cursor is on this line (focus && row matches)
    3. If cursor on line:
       - Split: before cursor | cursor char (inverted) | after cursor
    4. Render line in Box with height=1

STATE MACHINE:
  Not applicable — component is stateless (all state in buffer)

KEYBOARD EVENT ROUTING:
  Key → handleKeyPress
    ├─ 'escape' → onCancel?.() [exit path]
    ├─ 'return' → onSubmit?.(text) [submit path]
    └─ other → buffer.handleInput(key) [edit path]
```

---

## Phase 7: OUTPUTS

### The Questions

**1. What does success look like?**

The component doesn't "return" a value; it:
- **Renders** visual lines in the terminal
- **Calls callbacks** (`onSubmit`, `onCancel`) on user actions

**2. What does failure look like?**

- Rendering crashes (no graceful degradation)
- Callbacks not called (if not provided)

**3. Side Effects**

| Side Effect | Trigger | Description |
|-------------|---------|-------------|
| Terminal output | Every render | Renders Box/Text components via Ink |
| Keyboard subscription | Mount with focus=true | Adds handler to KeypressContext |
| Callback execution | User action | Calls onSubmit/onCancel |

### Output Audiences

**Primary consumer**: Parent component (InputPrompt)
- Receives submit/cancel events via callbacks
- Controls buffer externally

**Secondary consumer**: User
- Sees rendered text in terminal
- Sees cursor position

### Outputs Deliverable

```
OUTPUTS
───────
VISUAL OUTPUT:
  Structure:
    <Box flexDirection="column">
      {viewportVisualLines.map((line, idx) => (
        <Box key={idx} height={1}>
          <Text>{lineWithCursorIfApplicable}</Text>
        </Box>
      ))}
    </Box>

  Guarantees:
    - Each visual line rendered in its own Box
    - Cursor shown as inverse character on focused line
    - Placeholder shown when buffer empty

CALLBACK OUTPUTS:
  - onSubmit(value: string): Called when Enter pressed (if provided)
  - onCancel(): Called when Escape pressed (if provided)

SIDE EFFECTS:
  - Terminal render: Visual output via Ink
  - Keyboard subscription: Added on mount if focus=true

GUARANTEES:
  - Render is deterministic given same props/buffer state
  - No state leakage between renders
  - Callbacks called synchronously on key events
```

---

## Complete Specification

```
════════════════════════════════════════════════════════════════════
                         TEXT INPUT
════════════════════════════════════════════════════════════════════

PURPOSE
───────
Name:       TextInput
Category:   Present (UI Component)
Purpose:    Bridge keyboard input to a TextBuffer and render visual state
Excludes:   Text manipulation, cursor logic, undo/redo (handled by TextBuffer)

INPUTS
──────
Required:
  - buffer: TextBuffer — state container with text, cursor, visual lines

Optional:
  - placeholder: string = '' — text shown when empty
  - onSubmit: (value) => void — callback for Enter key
  - onCancel: () => void — callback for Escape key
  - focus: boolean = true — enable keyboard capture

Minimal Buffer Interface Used:
  - text, handleInput, visualCursor, viewportVisualLines, visualScrollRow

PRECONDITIONS
─────────────
1. KeypressProvider must wrap this component
2. buffer must be valid TextBuffer instance
3. Theme context must be available

CONSTRAINTS
───────────
Invariants:
  - Never mutates buffer directly
  - Fully controlled by parent (no internal state)
Security:
  - Input sanitization handled by TextBuffer, not this component

ERROR HANDLING
──────────────
Strategy: Let it crash — errors are development bugs
No try/catch, no fallback UI, no error boundaries

EXECUTION LOGIC
───────────────
1. Extract state from buffer
2. Create keypress handler:
   - escape → onCancel
   - return → onSubmit
   - other → buffer.handleInput
3. Subscribe via useKeypress (if focus=true)
4. Render:
   - Empty + placeholder: show placeholder (with cursor if focused)
   - Has text: render visual lines with cursor overlay

OUTPUTS
───────
Visual: Box containing visual lines with cursor highlighting
Callbacks: onSubmit/onCancel fired on user action
Side Effects: Terminal render, keyboard subscription

════════════════════════════════════════════════════════════════════
```

---

## Key Insights from This Analysis

### 1. The "Headless Hook" Pattern

TextInput demonstrates separation of concerns:
- **useTextBuffer** (2500 lines): All logic, state, vim operations
- **TextInput** (105 lines): Pure rendering

This makes the logic portable — you could build a different UI on the same hook.

### 2. Thin Controller Pattern

The component intercepts only two keys (escape, return) and delegates everything else. This minimizes component complexity.

### 3. Minimal Interface Dependency

Although TextBuffer has 50+ properties/methods, TextInput uses only ~5. This could be formalized with a smaller interface type.

### 4. Trust Boundaries

Input sanitization happens in TextBuffer, not TextInput. The component trusts its buffer completely — appropriate for internal components.

### 5. Controlled Component Pattern

No internal state (`useState`). All state lives in the buffer prop. This makes the component predictable and easy to test.

---

## What We Learned About Applying the Framework

1. **Purpose is hard to nail down** — took 3 iterations to get a sentence without "and"

2. **Looking at what ISN'T in scope clarifies responsibility** — listing what TextBuffer handles revealed TextInput's thin role

3. **Preconditions for internal components are implicit** — Design by Contract, not defensive programming

4. **Some components don't fit standard categories** — needed "Present" for UI components

5. **Error handling can be "let it crash"** — appropriate for development-time bugs

6. **Tracing code reveals hidden patterns** — the cursor overlay algorithm wasn't obvious from props

---

*Analysis completed: 2024-12-31*
