---
paths: src/features/**/hooks/use-*.test.ts
---

# Feature Hook Test Guidelines

> Rules for testing custom React hooks. Read this when implementing a `.test.ts` file for a hook.

---

## Context

Hook tests use `renderHook` from Testing Library to test hooks in isolation. Testing behavior and return values (not implementation) ensures tests remain stable during refactors. AAA pattern and proper `act()`/`waitFor` usage prevent flaky tests and React warnings.

---

## File Structure

```
hooks/
├── use-[hook-name].ts
└── use-[hook-name].test.ts    <- This file
```

---

## Code Order

1. Imports (vitest, @testing-library/react, hook)
2. Mocks (vi.mock calls, mock data constants)
3. Setup (beforeEach, afterEach if needed)
4. Tests (describe blocks)

---

## Test Categories

| Category | Required | What to Test |
|----------|----------|--------------|
| `initial state` | ALWAYS | Default values, initial options |
| `actions` | IF has functions | Returned functions trigger correct behavior |
| `async` | IF has async | Loading, success, error states |
| `cleanup` | IF has effects | Cleanup runs on unmount/dependency change |
| `edge cases` | ALWAYS | Error states, boundary conditions |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| File | `use-[hook].test.ts` | `use-toggle.test.ts` |
| Root describe | hook name (camelCase) | `describe('useToggle', ...)` |
| Category describe | lowercase | `describe('initial state', ...)` |
| Condition describe | `when [condition]` | `describe('when disabled', ...)` |
| Test name | `should [verb] [outcome]` | `it('should return false initially', ...)` |
| Mock data | SCREAMING_SNAKE_CASE | `MOCK_OPTIONS`, `MOCK_USER` |
| Render result | `result` | `const { result } = renderHook(...)` |

---

## act() vs waitFor

| Situation | Use | Example |
|-----------|-----|---------|
| Sync state updates | `act()` | `act(() => { result.current.toggle(); });` |
| Timer advancement | `act()` | `act(() => { vi.advanceTimersByTime(500); });` |
| Async operations | `waitFor` | `await waitFor(() => { expect(result.current.data).toBeDefined(); });` |
| Loading states | `waitFor` | `await waitFor(() => { expect(result.current.isLoading).toBe(false); });` |

Simple reads don't need wrapping - access `result.current` directly for initial assertions.

---

<rules>

## Do

- Use `renderHook` from `@testing-library/react`
- Use `act()` for sync state updates, `waitFor` for async
- Use AAA pattern with comments in every test
- Reset mocks in `beforeEach` with `vi.clearAllMocks()`
- Use `vi.useFakeTimers()` for timer-based hooks
- Access values through `result.current` (never destructure)

## Don't

- Destructure `result.current` → Values become stale after updates
- Forget `act()` for state updates → Wrap in `act()` or use `waitFor`
- Use real `setTimeout` in tests → Use `vi.useFakeTimers()`
- Test implementation details → Test returned values and behavior
- Mock the hook itself → Test the real hook, mock its dependencies

## When

- WHEN hook returns state → Test initial value and updates
- WHEN hook returns functions → Test they modify state correctly
- WHEN hook uses timers → Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
- WHEN hook has cleanup → Test cleanup runs with `unmount()`
- WHEN hook consumes store → Mock the store with `vi.mock()`, type with `MockedFunction`
- WHEN hook fetches data → Mock fetch, test loading/success/error states

</rules>

---

## Validation

```bash
npm run test -- use-[hook-name]    # Run hook tests
npm run check-types                 # Verify types
```

---

<example>

## Complete Example: Sync Hook Test

Test file for useDebounce. Demonstrates: fake timers, act() for timer advancement, rerender for prop changes, cleanup testing.

```ts
// ============================================================
// FILE: src/hooks/use-debounce.test.ts
// Demonstrates: Sync hook with timers
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useDebounce } from './use-debounce';

// ------------------------------------------------------------
// 2. SETUP
// ------------------------------------------------------------
beforeEach(() => {
  vi.useFakeTimers();                                           // Rule: fake timers for timer hooks
});

afterEach(() => {
  vi.useRealTimers();
});

// ------------------------------------------------------------
// 3. TESTS
// ------------------------------------------------------------
describe('useDebounce', () => {                                 // Rule: hook name as root describe
  // --------------------------------------------------------------------------
  // initial state
  // --------------------------------------------------------------------------
  describe('initial state', () => {                             // Rule: lowercase category
    it('should return initial value immediately', () => {       // Rule: should [verb] [outcome]
      // Arrange & Act
      const { result } = renderHook(() => useDebounce('initial', 500));

      // Assert
      expect(result.current).toBe('initial');                   // Rule: Access via result.current
    });
  });

  // --------------------------------------------------------------------------
  // actions
  // --------------------------------------------------------------------------
  describe('actions', () => {
    it('should update value after delay', () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Act
      rerender({ value: 'updated', delay: 500 });               // Rule: rerender for prop changes
      act(() => {
        vi.advanceTimersByTime(500);                            // Rule: act() for timer advancement
      });

      // Assert
      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid updates', () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Act - rapid updates
      rerender({ value: 'update1', delay: 500 });
      act(() => vi.advanceTimersByTime(400));
      rerender({ value: 'final', delay: 500 });

      // Assert - still initial
      expect(result.current).toBe('initial');

      // Act - complete delay
      act(() => vi.advanceTimersByTime(500));

      // Assert - only final value
      expect(result.current).toBe('final');
    });
  });

  // --------------------------------------------------------------------------
  // cleanup
  // --------------------------------------------------------------------------
  describe('cleanup', () => {                                   // Rule: cleanup category for effects
    it('should clear timer on unmount', () => {
      // Arrange
      const { result, rerender, unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      // Act
      rerender({ value: 'updated', delay: 500 });
      unmount();                                                // Rule: unmount() for cleanup testing
      act(() => vi.advanceTimersByTime(500));

      // Assert - no error, timer was cleaned up
      expect(result.current).toBe('initial');
    });
  });

  // --------------------------------------------------------------------------
  // edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle zero delay', () => {
      // Arrange
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 0 } }
      );

      // Act
      rerender({ value: 'updated', delay: 0 });
      act(() => vi.advanceTimersByTime(0));

      // Assert
      expect(result.current).toBe('updated');
    });
  });
});
```

</example>

---

<example>

## Contrast: Async Hook Test

Test file for useFetch. Demonstrates: waitFor for async, loading/success/error states, store mocking with MockedFunction.

```ts
// ============================================================
// FILE: src/features/chat/hooks/use-chat-messages.test.ts
// Demonstrates: Async hook with store consumption
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { MockedFunction } from 'vitest';

// ------------------------------------------------------------
// 2. MOCKS
// ------------------------------------------------------------
vi.mock('@/features/chat/stores/chat-store', () => ({          // Rule: vi.mock before imports
  useChatStore: vi.fn(),
}));

import { useChatStore } from '@/features/chat/stores/chat-store';
import { useChatMessages } from './use-chat-messages';

const mockUseChatStore = useChatStore as MockedFunction<typeof useChatStore>;  // Rule: MockedFunction type

const MOCK_MESSAGES = [                                         // Rule: SCREAMING_SNAKE_CASE
  { id: '1', role: 'user', content: 'Hello' },
  { id: '2', role: 'assistant', content: 'Hi there!' },
];

const MOCK_STORE_STATE = {
  messages: MOCK_MESSAGES,
  isLoading: false,
  error: null,
  fetchMessages: vi.fn(),
};

// ------------------------------------------------------------
// 3. SETUP
// ------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();                                           // Rule: clearAllMocks in beforeEach
  mockUseChatStore.mockImplementation((selector) =>             // Rule: Mock selector pattern
    selector ? selector(MOCK_STORE_STATE) : MOCK_STORE_STATE
  );
});

// ------------------------------------------------------------
// 4. TESTS
// ------------------------------------------------------------
describe('useChatMessages', () => {
  // --------------------------------------------------------------------------
  // initial state
  // --------------------------------------------------------------------------
  describe('initial state', () => {
    it('should return messages from store', () => {
      // Arrange & Act
      const { result } = renderHook(() => useChatMessages());

      // Assert
      expect(result.current.messages).toEqual(MOCK_MESSAGES);
    });

    it('should return loading state from store', () => {
      // Arrange
      mockUseChatStore.mockImplementation((selector) =>
        selector ? selector({ ...MOCK_STORE_STATE, isLoading: true }) : { ...MOCK_STORE_STATE, isLoading: true }
      );

      // Act
      const { result } = renderHook(() => useChatMessages());

      // Assert
      expect(result.current.isLoading).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // async
  // --------------------------------------------------------------------------
  describe('async', () => {                                     // Rule: async category for data hooks
    it('should fetch messages on mount', async () => {
      // Arrange
      const mockFetch = vi.fn().mockResolvedValue(MOCK_MESSAGES);
      mockUseChatStore.mockImplementation((selector) =>
        selector ? selector({ ...MOCK_STORE_STATE, fetchMessages: mockFetch }) : { ...MOCK_STORE_STATE, fetchMessages: mockFetch }
      );

      // Act
      renderHook(() => useChatMessages({ autoFetch: true }));

      // Assert
      await waitFor(() => {                                     // Rule: waitFor for async
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('should handle fetch error', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockUseChatStore.mockImplementation((selector) =>
        selector ? selector({ ...MOCK_STORE_STATE, error: mockError }) : { ...MOCK_STORE_STATE, error: mockError }
      );

      // Act
      const { result } = renderHook(() => useChatMessages());

      // Assert
      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  // --------------------------------------------------------------------------
  // edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    describe('when no messages', () => {                        // Rule: when [condition]
      it('should return empty array', () => {
        // Arrange
        mockUseChatStore.mockImplementation((selector) =>
          selector ? selector({ ...MOCK_STORE_STATE, messages: [] }) : { ...MOCK_STORE_STATE, messages: [] }
        );

        // Act
        const { result } = renderHook(() => useChatMessages());

        // Assert
        expect(result.current.messages).toEqual([]);
        expect(result.current.isEmpty).toBe(true);
      });
    });
  });
});
```

</example>
