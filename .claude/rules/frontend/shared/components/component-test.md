---
paths: src/components/ui/**/*.test.tsx
---

# Shared UI Component Test Guidelines

> Rules for creating component tests. Read this when implementing a `.test.tsx` file.

---

## Context

Tests verify user-facing behavior, not implementation details. Testing Library queries prioritize accessibility. AAA pattern (Arrange-Act-Assert) ensures readable, maintainable tests. Reliable tests enable confident refactoring.

---

## File Structure

```
[component-name]/
├── [component-name].tsx
├── [component-name].stories.tsx
├── [component-name].test.tsx    ← This file
└── index.ts
```

---

## Code Order

1. Imports (vitest, testing-library, userEvent, component)
2. Mocks (vi.mock calls, mock data constants)
3. Tests (describe blocks with test cases)

---

## Test Categories

| Category | Required | What to Test |
|----------|----------|--------------|
| `rendering` | ALWAYS | Default render, variants, props display |
| `interactions` | IF has callbacks | Click, type, submit behaviors |
| `edge cases` | ALWAYS | Empty, loading, error, long content |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| File | `[component].test.tsx` | `button.test.tsx` |
| Root describe | PascalCase component | `describe('Button', ...)` |
| Category describe | lowercase | `describe('rendering', ...)` |
| Condition describe | `when [condition]` | `describe('when disabled', ...)` |
| Test name | `should [verb] [outcome]` | `it('should render title', ...)` |
| Mock data | SCREAMING_SNAKE_CASE | `MOCK_USER`, `MOCK_MESSAGES` |
| Mock functions | `vi.fn()` inline | `const handleClick = vi.fn()` |
| User event | `user` | `const user = userEvent.setup()` |

---

## Query Priority

| Priority | Query | Use When | Example |
|----------|-------|----------|---------|
| 1 | `getByRole` | Buttons, inputs, links, headings | `getByRole('button', { name: /submit/i })` |
| 2 | `getByLabelText` | Form inputs with visible labels | `getByLabelText('Email address')` |
| 3 | `getByText` | Static text, paragraphs | `getByText('Welcome back')` |
| 4 | `getByPlaceholderText` | Inputs without visible labels | `getByPlaceholderText('Search...')` |
| 5 | `getByTestId` | Canvas, SVG visualizations, non-semantic containers | `getByTestId('chart-canvas')` |

`getByTestId` requires `data-testid` attributes in components, which couples tests to implementation details. If an element needs `getByTestId`, consider adding `aria-label` and using `getByRole` instead.

---

<rules>

## Do

- Use AAA pattern (Arrange, Act, Assert) with comments in every test
- Use `getByRole` as primary query method
- Use `userEvent.setup()` for interactions (not `fireEvent`)
- Test each variant value renders correctly
- Test callback props are called with correct arguments
- Use `vi.fn()` for mock functions

## Don't

- Snapshot tests → Test specific behaviors instead
- Test implementation details → Test user-visible behavior
- `fireEvent` → Use `userEvent` for realistic interactions
- Test internal state → Test rendered output
- Multiple assertions without clear purpose → One concept per test
- `getByTestId` for buttons, inputs, links → Use `getByRole('button')`, `getByRole('textbox')`, `getByRole('link')`

## When

- WHEN component has `onClick` → Test it's called on click
- WHEN component has `disabled` prop → Test button is disabled and onClick not called
- WHEN component has `isLoading` → Test loading indicator visible, interactions disabled
- WHEN component has variants → Test each variant renders distinct styles/content
- WHEN component forwards ref → Test ref.current is the DOM element
- WHEN element has implicit role (button, input, link, heading) → Use `getByRole`, never `getByTestId`
- WHEN element has no semantic role (div wrapper, canvas) → `getByTestId` is acceptable
- WHEN you would add `data-testid` → Add `aria-label` instead and use `getByRole`

</rules>

---

## Validation

```bash
npm run test                    # Run all tests
npm run test -- button.test    # Run specific test file
```

---

<example>

## Complete Example: UI Primitive Test

Test file for Button component. Demonstrates: AAA pattern, getByRole queries, userEvent interactions, variant testing, callback testing.

```tsx
// ============================================================
// FILE: src/components/ui/button/button.test.tsx
// Demonstrates: All test guidelines
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { describe, it, expect, vi } from 'vitest';              // Rule: Vitest imports
import { render, screen } from '@testing-library/react';        // Rule: Testing Library
import userEvent from '@testing-library/user-event';            // Rule: userEvent for interactions
import { createRef } from 'react';

import { Button } from './button';

// ------------------------------------------------------------
// 2. TESTS
// ------------------------------------------------------------
describe('Button', () => {                                      // Rule: PascalCase component name
  // --------------------------------------------------------------------------
  // rendering
  // --------------------------------------------------------------------------
  describe('rendering', () => {                                 // Rule: lowercase category
    it('should render with default props', () => {              // Rule: should [verb] [outcome]
      // Arrange & Act
      render(<Button>Click me</Button>);

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument();   // Rule: getByRole first (never getByTestId for buttons)
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should render all variant styles', () => {
      // Arrange
      const { rerender } = render(<Button variant="default">Button</Button>);

      // Assert default
      expect(screen.getByRole('button')).toBeInTheDocument();

      // Act & Assert secondary
      rerender(<Button variant="secondary">Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();

      // Act & Assert destructive
      rerender(<Button variant="destructive">Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render all size variants', () => {
      // Arrange
      const { rerender } = render(<Button size="sm">Small</Button>);

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument();

      // Act & Assert
      rerender(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      // Arrange & Act
      render(<Button className="custom-class">Button</Button>);

      // Assert
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // interactions
  // --------------------------------------------------------------------------
  describe('interactions', () => {                              // Rule: lowercase category
    it('should call onClick when clicked', async () => {
      // Arrange
      const handleClick = vi.fn();                              // Rule: vi.fn() for mocks
      const user = userEvent.setup();                           // Rule: userEvent.setup()
      render(<Button onClick={handleClick}>Click me</Button>);

      // Act
      await user.click(screen.getByRole('button'));             // Rule: userEvent for clicks

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick} disabled>Click me</Button>);

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick} isLoading>Click me</Button>);

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    describe('when disabled', () => {                           // Rule: when [condition]
      it('should have disabled attribute', () => {
        // Arrange & Act
        render(<Button disabled>Disabled</Button>);

        // Assert
        expect(screen.getByRole('button')).toBeDisabled();
      });
    });

    describe('when loading', () => {
      it('should be disabled when loading', () => {
        // Arrange & Act
        render(<Button isLoading>Loading</Button>);

        // Assert
        expect(screen.getByRole('button')).toBeDisabled();
      });
    });

    describe('with ref forwarding', () => {                     // Rule: Test ref forwarding for ui/
      it('should forward ref to button element', () => {
        // Arrange
        const ref = createRef<HTMLButtonElement>();

        // Act
        render(<Button ref={ref}>Button</Button>);

        // Assert
        expect(ref.current).toBeInstanceOf(HTMLButtonElement);
        expect(ref.current?.tagName).toBe('BUTTON');
      });
    });
  });
});
```

</example>

---

<example>

## Contrast: Feature Component Test

Test file for MessageBubble in features/. Demonstrates: No ref forwarding test (features don't use forwardRef), feature-specific behaviors.

```tsx
// ============================================================
// FILE: src/features/chat/components/message-bubble/message-bubble.test.tsx
// Demonstrates: Feature component test (no ref forwarding)
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MessageBubble } from './message-bubble';

// ------------------------------------------------------------
// MOCK DATA
// ------------------------------------------------------------
const MOCK_CONTENT = 'Hello, how can I help you?';              // Rule: SCREAMING_SNAKE_CASE

describe('MessageBubble', () => {
  describe('rendering', () => {
    it('should render message content', () => {
      // Arrange & Act
      render(<MessageBubble content={MOCK_CONTENT} />);

      // Assert
      expect(screen.getByText(MOCK_CONTENT)).toBeInTheDocument();
    });

    it('should render as user message when role is user', () => {
      // Arrange & Act
      render(<MessageBubble content={MOCK_CONTENT} role="user" />);

      // Assert
      expect(screen.getByText(MOCK_CONTENT)).toBeInTheDocument();
    });

    it('should render as assistant message when role is assistant', () => {
      // Arrange & Act
      render(<MessageBubble content={MOCK_CONTENT} role="assistant" />);

      // Assert
      expect(screen.getByText(MOCK_CONTENT)).toBeInTheDocument();
    });

    it('should render timestamp when provided', () => {
      // Arrange
      const timestamp = new Date('2024-01-15T10:30:00');

      // Act
      render(<MessageBubble content={MOCK_CONTENT} timestamp={timestamp} />);

      // Assert
      expect(screen.getByRole('time')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onRetry when retry button is clicked', async () => {
      // Arrange
      const handleRetry = vi.fn();
      const user = userEvent.setup();
      render(<MessageBubble content={MOCK_CONTENT} onRetry={handleRetry} />);

      // Act
      await user.click(screen.getByRole('button', { name: /retry/i }));

      // Assert
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    describe('when streaming', () => {
      it('should indicate streaming state', () => {
        // Arrange & Act
        render(<MessageBubble content={MOCK_CONTENT} isStreaming />);

        // Assert - component should show streaming indicator
        expect(screen.getByText(MOCK_CONTENT)).toBeInTheDocument();
      });
    });

    describe('with long content', () => {
      it('should render long messages without truncation', () => {
        // Arrange
        const longContent = 'A'.repeat(500);

        // Act
        render(<MessageBubble content={longContent} />);

        // Assert
        expect(screen.getByText(longContent)).toBeInTheDocument();
      });
    });

    describe('with empty content', () => {
      it('should render empty message gracefully', () => {
        // Arrange & Act
        render(<MessageBubble content="" />);

        // Assert - component should still render
        expect(document.body).toBeInTheDocument();
      });
    });
  });

  // Note: NO ref forwarding test - feature components don't use forwardRef
});
```

</example>
