---
paths: src/features/**/stores/*-store.ts
---

# Feature Store Guidelines

> Rules for creating Zustand stores. Read this when implementing a `[name]-store.ts` file.

---

## Context

Stores manage ONE domain of state. Zustand 5.x with TypeScript. Separate State and Actions types for cleaner testing. Always use devtools middleware for debugging. Extract selectors - never inline them in components.

---

## File Structure

```
stores/
├── [store-name]-store.ts       # Store implementation
└── [store-name]-store.test.ts  # Store tests
```

---

## Code Order

1. Imports (zustand, middleware, types)
2. Types (State type, Actions type, Store type)
3. Initial State (constant for reset)
4. Selectors (exported functions)
5. Store (the `create()` call)
6. Exports (named only)

---

## Location Rules

| Category | Location | Example |
|----------|----------|---------|
| Global/Shared | `src/stores/` | `notifications-store.ts`, `theme-store.ts` |
| Feature-specific | `src/features/[feature]/stores/` | `chat-store.ts`, `agent-store.ts` |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| File | kebab-case + `-store.ts` | `chat-store.ts` |
| Store hook | `use[Domain]Store` | `useChatStore` |
| State type | `[Domain]State` | `ChatState` |
| Actions type | `[Domain]Actions` | `ChatActions` |
| Store type | `[Domain]Store` | `ChatStore` |

### Action Names

| Pattern | Convention | Example |
|---------|------------|---------|
| Add item | `add[Item]` | `addMessage` |
| Remove item | `remove[Item]` | `removeMessage` |
| Update item | `update[Item]` | `updateMessage` |
| Set value | `set[Value]` | `setLoading`, `setError` |
| Toggle value | `toggle[Value]` | `toggleSidebar` |
| Clear/Reset | `clear[Items]` / `reset` | `clearMessages`, `reset` |

### Selector Names

| Pattern | Convention | Example |
|---------|------------|---------|
| Select state | `select[Thing]` | `selectMessages` |
| Select derived | `select[Computed]` | `selectMessageCount` |
| Select by param | `select[Thing]ById` | `selectMessageById` |

---

<rules>

## Do

- One store per domain
- Separate State and Actions types
- Extract selectors as standalone functions
- Always wrap with `devtools()` middleware
- Include `reset` action that restores `initialState`
- Name devtools actions (third param in `set()`)

## Don't

- Mix unrelated state → Split into separate stores
- Inline selectors in components → Use extracted selectors
- Default exports → Use named exports only
- Skip devtools → Always use for debugging
- Skip action names → Name all actions for devtools

## When

- WHEN state needs persistence → Use `persist()` middleware
- WHEN store is global → Place in `src/stores/`
- WHEN store is feature-specific → Place in `src/features/[feature]/stores/`
- WHEN selector needs parameter → Return function: `selectById(id) => (state) => ...`
- WHEN resetting store → Use spread of `initialState` constant

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
npm run test -- [store-name]-store    # Run store tests
```

---

<example>

## Complete Example: Feature Store

A chat store in `src/features/chat/stores/`. Demonstrates: separated types, selectors, devtools, action naming.

```typescript
// ============================================================
// FILE: src/features/chat/stores/chat-store.ts
// Demonstrates: All store guidelines
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { create } from 'zustand';                               // Rule: zustand first
import { devtools } from 'zustand/middleware';                  // Rule: middleware second

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type ChatState = {                                              // Rule: Separate State type
  messages: Message[];
  isGenerating: boolean;
  error: string | null;
};

type ChatActions = {                                            // Rule: Separate Actions type
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: string) => void;
  removeMessage: (id: string) => void;
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  reset: () => void;
};

type ChatStore = ChatState & ChatActions;                       // Rule: Combined type

// ------------------------------------------------------------
// 3. INITIAL STATE
// ------------------------------------------------------------
const initialState: ChatState = {                               // Rule: Constant for reset
  messages: [],
  isGenerating: false,
  error: null,
};

// ------------------------------------------------------------
// 4. SELECTORS
// ------------------------------------------------------------
const selectMessages = (state: ChatStore) => state.messages;    // Rule: Extract selectors
const selectIsGenerating = (state: ChatStore) => state.isGenerating;
const selectError = (state: ChatStore) => state.error;
const selectMessageCount = (state: ChatStore) => state.messages.length;  // Rule: Derived selector
const selectMessageById = (id: string) => (state: ChatStore) => // Rule: Parameterized selector
  state.messages.find((m) => m.id === id);

// ------------------------------------------------------------
// 5. STORE
// ------------------------------------------------------------
const useChatStore = create<ChatStore>()(
  devtools(                                                     // Rule: Always use devtools
    (set) => ({
      ...initialState,

      addMessage: (message) =>
        set(
          (state) => ({
            messages: [
              ...state.messages,
              { ...message, id: crypto.randomUUID(), timestamp: new Date() },
            ],
          }),
          false,
          'addMessage'                                          // Rule: Name action for devtools
        ),

      updateMessage: (id, content) =>
        set(
          (state) => ({
            messages: state.messages.map((m) =>
              m.id === id ? { ...m, content } : m
            ),
          }),
          false,
          'updateMessage'
        ),

      removeMessage: (id) =>
        set(
          (state) => ({
            messages: state.messages.filter((m) => m.id !== id),
          }),
          false,
          'removeMessage'
        ),

      setGenerating: (isGenerating) =>
        set({ isGenerating }, false, 'setGenerating'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      clearMessages: () =>
        set({ messages: [] }, false, 'clearMessages'),

      reset: () =>
        set(initialState, false, 'reset'),                      // Rule: reset uses initialState
    }),
    { name: 'ChatStore' }                                       // Rule: Name store for devtools
  )
);

// ------------------------------------------------------------
// 6. EXPORTS
// ------------------------------------------------------------
export { useChatStore };                                        // Rule: Named exports only
export {
  selectMessages,
  selectIsGenerating,
  selectError,
  selectMessageCount,
  selectMessageById,
};
export type { ChatState, ChatActions, ChatStore, Message };
```

</example>

---

<example>

## Contrast: Store with Persist

A theme store with localStorage persistence. Demonstrates: `persist()` middleware.

```typescript
// ============================================================
// FILE: src/stores/theme-store.ts
// Demonstrates: Store with persist middleware
// ============================================================

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type ThemeState = {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
};

type ThemeActions = {
  setTheme: (theme: ThemeState['theme']) => void;
  setAccentColor: (color: string) => void;
  reset: () => void;
};

type ThemeStore = ThemeState & ThemeActions;

const initialState: ThemeState = {
  theme: 'system',
  accentColor: '#3b82f6',
};

const selectTheme = (state: ThemeStore) => state.theme;
const selectAccentColor = (state: ThemeStore) => state.accentColor;

const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(                                                    // Rule: persist wraps store
      (set) => ({
        ...initialState,

        setTheme: (theme) =>
          set({ theme }, false, 'setTheme'),

        setAccentColor: (accentColor) =>
          set({ accentColor }, false, 'setAccentColor'),

        reset: () =>
          set(initialState, false, 'reset'),
      }),
      { name: 'theme-store' }                                   // Rule: localStorage key
    ),
    { name: 'ThemeStore' }
  )
);

export { useThemeStore };
export { selectTheme, selectAccentColor };
export type { ThemeState, ThemeActions, ThemeStore };
```

</example>
