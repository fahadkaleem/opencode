---
paths: src/features/**/stores/*-store.test.ts
---

# Feature Store Test Guidelines

> Rules for testing Zustand stores. Read this when implementing a `.test.ts` file for a store.

---

## Context

Zustand stores are tested by directly calling `getState()` and actions without React rendering. Resetting store state between tests ensures isolation and prevents flaky tests. Testing selectors separately from actions verifies derived state logic.

---

## File Structure

```
stores/
├── [store-name]-store.ts
└── [store-name]-store.test.ts    <- This file
```

---

## Code Order

1. Imports (vitest, store, selectors, types)
2. Mocks (MOCK_* constants, vi.mock calls)
3. Setup (beforeEach with store reset, vi.clearAllMocks)
4. Helpers (optional - mockFetchSuccess, mockFetchError)
5. Tests (describe blocks)

---

## Test Categories

| Category | Required | What to Test |
|----------|----------|--------------|
| `initial state` | ALWAYS | Default values match initialState |
| `actions` | ALWAYS | Each action modifies state correctly |
| `async actions` | IF has async | Loading, success, error states |
| `selectors` | IF has selectors | Selectors return derived values |
| `edge cases` | ALWAYS | Empty state, invalid inputs, rapid operations |
| `reset` | ALWAYS | Reset restores initial state |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| File | `[store]-store.test.ts` | `chat-store.test.ts` |
| Root describe | store hook name | `describe('useChatStore', ...)` |
| Category describe | lowercase | `describe('actions', ...)` |
| Action describe | action name | `describe('addMessage', ...)` |
| Test name | `should [verb] [outcome]` | `it('should add message to list', ...)` |
| Mock data | SCREAMING_SNAKE_CASE | `MOCK_MESSAGE`, `MOCK_USER` |

---

<rules>

## Do

- Reset store in `beforeEach` using the `reset` action
- Use `vi.clearAllMocks()` in `beforeEach` for mock cleanup
- Test each action in isolation
- Test selectors with known state
- Use `getState()` to read current state
- Use AAA pattern with comments in every test
- For async: test isLoading during request, state after success, error state on failure

## Don't

- Forget to reset between tests → Add `beforeEach` with `reset()` call
- Test Zustand internals → Test your store's specific behavior
- Mock the store itself → Test the real store implementation
- Inline selectors in tests → Import and test exported selectors

## When

- WHEN action modifies state → Verify state changed correctly
- WHEN action has side effects → Mock external dependencies with `vi.fn()`
- WHEN action is async → Test loading state during fetch, success state, error state
- WHEN selector derives data → Test with various state shapes
- WHEN store has middleware → Test middleware behavior (devtools naming)
- WHEN store persists → Test persistence and rehydration
- WHEN store uses fetch → Use helper functions (mockFetchSuccess, mockFetchError)

</rules>

---

## Validation

```bash
npm run test -- [store-name]-store    # Run store tests
npm run check-types                    # Verify types
```

---

<example>

## Complete Example: Chat Store Test

Test file for useChatStore. Demonstrates: beforeEach reset, getState() usage, action testing, selector testing, AAA pattern, all test categories.

```ts
// ============================================================
// FILE: src/features/chat/stores/chat-store.test.ts
// Demonstrates: All store test guidelines
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { describe, it, expect, beforeEach } from 'vitest';                  // Rule: Vitest imports

import {
  useChatStore,
  selectMessages,
  selectIsStreaming,
  selectMessageCount,
  selectLastMessage,
} from './chat-store';

// ------------------------------------------------------------
// 2. RESET HOOK
// ------------------------------------------------------------
describe('useChatStore', () => {                                            // Rule: store hook name as root describe
  beforeEach(() => {
    useChatStore.getState().reset();                                        // Rule: Reset in beforeEach
  });

  // --------------------------------------------------------------------------
  // initial state
  // --------------------------------------------------------------------------
  describe('initial state', () => {                                         // Rule: lowercase category
    it('should have empty messages array', () => {                          // Rule: should [verb] [outcome]
      // Arrange & Act
      const state = useChatStore.getState();                                // Rule: getState() to read state

      // Assert
      expect(state.messages).toEqual([]);
    });

    it('should not be streaming initially', () => {
      // Arrange & Act
      const state = useChatStore.getState();

      // Assert
      expect(state.isStreaming).toBe(false);
    });

    it('should have no active conversation', () => {
      // Arrange & Act
      const state = useChatStore.getState();

      // Assert
      expect(state.activeConversationId).toBeNull();
    });

    it('should have no error', () => {
      // Arrange & Act
      const state = useChatStore.getState();

      // Assert
      expect(state.error).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // actions
  // --------------------------------------------------------------------------
  describe('actions', () => {                                               // Rule: lowercase category
    describe('addMessage', () => {                                          // Rule: action name as describe
      it('should add message to messages array', () => {
        // Arrange
        const message = {
          id: '1',
          role: 'user' as const,
          content: 'Hello',
          timestamp: new Date(),
        };

        // Act
        useChatStore.getState().addMessage(message);                        // Rule: Test action in isolation

        // Assert
        const state = useChatStore.getState();
        expect(state.messages).toHaveLength(1);
        expect(state.messages[0]).toEqual(message);
      });

      it('should append to existing messages', () => {
        // Arrange
        const message1 = { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() };
        const message2 = { id: '2', role: 'assistant' as const, content: 'Hi!', timestamp: new Date() };

        // Act
        useChatStore.getState().addMessage(message1);
        useChatStore.getState().addMessage(message2);

        // Assert
        const state = useChatStore.getState();
        expect(state.messages).toHaveLength(2);
        expect(state.messages[0].id).toBe('1');
        expect(state.messages[1].id).toBe('2');
      });
    });

    describe('setStreaming', () => {
      it('should set streaming to true', () => {
        // Arrange & Act
        useChatStore.getState().setStreaming(true);

        // Assert
        expect(useChatStore.getState().isStreaming).toBe(true);
      });

      it('should set streaming to false', () => {
        // Arrange
        useChatStore.getState().setStreaming(true);

        // Act
        useChatStore.getState().setStreaming(false);

        // Assert
        expect(useChatStore.getState().isStreaming).toBe(false);
      });
    });

    describe('updateMessage', () => {
      it('should update existing message content', () => {
        // Arrange
        useChatStore.getState().addMessage({
          id: '1',
          role: 'assistant',
          content: 'Hello',
          timestamp: new Date(),
        });

        // Act
        useChatStore.getState().updateMessage('1', { content: 'Hello World' });

        // Assert
        expect(useChatStore.getState().messages[0].content).toBe('Hello World');
      });

      it('should not modify other messages', () => {
        // Arrange
        useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'Hi', timestamp: new Date() });
        useChatStore.getState().addMessage({ id: '2', role: 'assistant', content: 'Hello', timestamp: new Date() });

        // Act
        useChatStore.getState().updateMessage('2', { content: 'Updated' });

        // Assert
        expect(useChatStore.getState().messages[0].content).toBe('Hi');
        expect(useChatStore.getState().messages[1].content).toBe('Updated');
      });
    });

    describe('clearMessages', () => {
      it('should remove all messages', () => {
        // Arrange
        useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'Hi', timestamp: new Date() });
        useChatStore.getState().addMessage({ id: '2', role: 'assistant', content: 'Hello', timestamp: new Date() });

        // Act
        useChatStore.getState().clearMessages();

        // Assert
        expect(useChatStore.getState().messages).toEqual([]);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        // Arrange & Act
        useChatStore.getState().setError('Something went wrong');

        // Assert
        expect(useChatStore.getState().error).toBe('Something went wrong');
      });

      it('should clear error with null', () => {
        // Arrange
        useChatStore.getState().setError('Error');

        // Act
        useChatStore.getState().setError(null);

        // Assert
        expect(useChatStore.getState().error).toBeNull();
      });
    });
  });

  // --------------------------------------------------------------------------
  // selectors
  // --------------------------------------------------------------------------
  describe('selectors', () => {                                             // Rule: Test selectors separately
    describe('selectMessages', () => {
      it('should return messages array', () => {
        // Arrange
        const message = { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() };
        useChatStore.getState().addMessage(message);

        // Act
        const messages = selectMessages(useChatStore.getState());           // Rule: Import and test exported selectors

        // Assert
        expect(messages).toEqual([message]);
      });
    });

    describe('selectIsStreaming', () => {
      it('should return streaming state', () => {
        // Arrange
        useChatStore.getState().setStreaming(true);

        // Act
        const isStreaming = selectIsStreaming(useChatStore.getState());

        // Assert
        expect(isStreaming).toBe(true);
      });
    });

    describe('selectMessageCount', () => {
      it('should return number of messages', () => {
        // Arrange
        useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'Hi', timestamp: new Date() });
        useChatStore.getState().addMessage({ id: '2', role: 'assistant', content: 'Hello', timestamp: new Date() });

        // Act
        const count = selectMessageCount(useChatStore.getState());

        // Assert
        expect(count).toBe(2);
      });

      it('should return 0 for empty store', () => {
        // Act
        const count = selectMessageCount(useChatStore.getState());

        // Assert
        expect(count).toBe(0);
      });
    });

    describe('selectLastMessage', () => {
      it('should return last message', () => {
        // Arrange
        useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'First', timestamp: new Date() });
        useChatStore.getState().addMessage({ id: '2', role: 'assistant', content: 'Last', timestamp: new Date() });

        // Act
        const lastMessage = selectLastMessage(useChatStore.getState());

        // Assert
        expect(lastMessage?.content).toBe('Last');
      });

      it('should return undefined for empty messages', () => {
        // Act
        const lastMessage = selectLastMessage(useChatStore.getState());

        // Assert
        expect(lastMessage).toBeUndefined();
      });
    });
  });

  // --------------------------------------------------------------------------
  // reset
  // --------------------------------------------------------------------------
  describe('reset', () => {                                                 // Rule: Test reset action
    it('should restore initial state', () => {
      // Arrange
      useChatStore.getState().addMessage({ id: '1', role: 'user', content: 'Hi', timestamp: new Date() });
      useChatStore.getState().setStreaming(true);
      useChatStore.getState().setError('Error');

      // Act
      useChatStore.getState().reset();

      // Assert
      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.isStreaming).toBe(false);
      expect(state.error).toBeNull();
      expect(state.activeConversationId).toBeNull();
    });
  });
});
```

</example>
