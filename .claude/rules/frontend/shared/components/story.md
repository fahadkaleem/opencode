---
paths: src/components/ui/**/*.stories.tsx
---

# Shared UI Component Story Guidelines

> Rules for creating Storybook stories. Read this when implementing a `.stories.tsx` file.

---

## Context

Stories document components visually and serve as living documentation. Comprehensive argTypes enable Storybook controls panel. CSF3 format is required for Storybook 8.x compatibility. Consistent story organization helps navigate the component library.

---

## File Structure

```
[component-name]/
├── [component-name].tsx
├── [component-name].stories.tsx    ← This file
├── [component-name].test.tsx
└── index.ts
```

---

## Code Order

1. Imports (Storybook types, test utilities, component)
2. Meta (title, component, tags, argTypes)
3. Type (`type Story = StoryObj<typeof meta>`)
4. Stories (Default, then variants, then edge cases)

---

## Title Convention

| Location | Title Pattern | Example |
|----------|---------------|---------|
| `src/components/ui/*` | `UI/[ComponentName]` | `UI/Button` |
| `src/features/*/components/*` | `Features/[Feature]/[ComponentName]` | `Features/Chat/MessageBubble` |
| `src/stories/recipes/*` | `Recipes/[RecipeName]` | `Recipes/ChatInterface` |

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| File | `[component].stories.tsx` | `button.stories.tsx` |
| Meta variable | `meta` | `const meta = { ... }` |
| Story type | `Story` | `type Story = StoryObj<typeof meta>` |
| Default story | `Default` | `export const Default: Story` |
| Variant stories | PascalCase | `Destructive`, `Outline`, `Ghost` |
| Size stories | PascalCase | `Small`, `Medium`, `Large` |
| State stories | PascalCase | `Disabled`, `Loading`, `Error` |
| Composed story | `AllVariants` | `export const AllVariants: Story` |

---

## argTypes Categories

| Category | Props |
|----------|-------|
| `Appearance` | `variant`, `size`, `color` |
| `State` | `disabled`, `isLoading`, `isSelected` |
| `Content` | `children`, `label`, `title`, `icon` |
| `Events` | `onClick`, `onChange`, `onSubmit` |
| `Styling` | `className` |

---

<rules>

## Do

- Include `tags: ['autodocs']` for automatic documentation generation
- Use `fn()` from `@storybook/test` for event handler args
- Document every prop in argTypes with control, description, and table
- Create a `Default` story showing the component's default state
- Create stories for each variant value
- Use `parameters: { layout: 'centered' }` for small components (buttons, badges)
- Use `parameters: { layout: 'padded' }` for larger components (cards, panels)

## Don't

- Default export for stories → Only meta uses default export
- Function syntax stories → Use CSF3 object syntax
- Skip argTypes → Document all props even if obvious
- Hardcode values in stories → Use args for configurability

## When

- WHEN component has variants → Create one story per variant + `AllVariants` composed story
- WHEN component has sizes → Create one story per size + `AllSizes` composed story
- WHEN component has loading state → Create `Loading` story
- WHEN component has disabled state → Create `Disabled` story
- WHEN component accepts children → Show realistic content examples
- WHEN testing interactions → Add `play` function with `userEvent` and `expect` from `@storybook/test`
- WHEN composing multiple components → Create recipe story in `src/stories/recipes/[name].stories.tsx` with title `Recipes/[Name]`
- WHEN component needs context provider → Add decorator to meta: `decorators: [(Story) => <Provider><Story /></Provider>]`

</rules>

---

## Validation

```bash
npm run storybook -- --smoke-test    # Verify stories compile
npm run storybook                    # Visual verification
```

---

<example>

## Complete Example: UI Primitive Story

Story file for Button component. Demonstrates: meta setup, argTypes documentation, Default story, variant stories, state stories, composed AllVariants story.

```tsx
// ============================================================
// FILE: src/components/ui/button/button.stories.tsx
// Demonstrates: All story guidelines
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import type { Meta, StoryObj } from '@storybook/react';         // Rule: Storybook types
import { fn } from '@storybook/test';                           // Rule: fn() for event handlers

import { Button } from './button';                              // Rule: Import component

// ------------------------------------------------------------
// 2. META
// ------------------------------------------------------------
const meta = {
  title: 'UI/Button',                                           // Rule: UI/ prefix for primitives
  component: Button,
  tags: ['autodocs'],                                           // Rule: Enable autodocs
  parameters: {
    layout: 'centered',                                         // Rule: Centered for small components
    docs: {
      description: {
        component: 'A button component with multiple variants and sizes.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive'],
      description: 'Visual style variant',                      // Rule: Document every prop
      table: {
        type: { summary: "'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'" },
        defaultValue: { summary: 'default' },
        category: 'Appearance',                                 // Rule: Use standard categories
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Size variant',
      table: {
        type: { summary: "'sm' | 'md' | 'lg' | 'icon'" },
        defaultValue: { summary: 'md' },
        category: 'Appearance',
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading spinner and disables button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    children: {
      control: 'text',
      description: 'Button content',
      table: {
        type: { summary: 'ReactNode' },
        category: 'Content',
      },
    },
    onClick: {
      action: 'clicked',                                        // Rule: Past tense for actions
      description: 'Click handler',
      table: {
        category: 'Events',
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
      table: {
        type: { summary: 'string' },
        category: 'Styling',
      },
    },
  },
  args: {
    children: 'Button',
    onClick: fn(),                                              // Rule: Use fn() for handlers
  },
} satisfies Meta<typeof Button>;

export default meta;                                            // Rule: Only meta is default export

// ------------------------------------------------------------
// 3. TYPE
// ------------------------------------------------------------
type Story = StoryObj<typeof meta>;                             // Rule: Always named Story

// ------------------------------------------------------------
// 4. STORIES
// ------------------------------------------------------------

// Default story
export const Default: Story = {};                               // Rule: Default shows default state

// Variant stories
export const Secondary: Story = {                               // Rule: PascalCase story names
  args: { variant: 'secondary' },
};

export const Outline: Story = {
  args: { variant: 'outline' },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
};

export const Destructive: Story = {
  args: { variant: 'destructive' },
};

// Size stories
export const Small: Story = {
  args: { size: 'sm' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

// State stories
export const Loading: Story = {                                 // Rule: Story for loading state
  args: { isLoading: true },
};

export const Disabled: Story = {                                // Rule: Story for disabled state
  args: { disabled: true },
};

// Composed story showing all variants
export const AllVariants: Story = {                             // Rule: AllVariants composed story
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
  parameters: {
    controls: { disable: true },                                // Rule: Disable controls for composed
  },
};

// Composed story showing all sizes
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};
```

</example>

---

<example>

## Contrast: Feature Component Story

Story file for MessageBubble in features/. Demonstrates: Features/ title prefix, feature-specific argTypes.

```tsx
// ============================================================
// FILE: src/features/chat/components/message-bubble/message-bubble.stories.tsx
// Demonstrates: Feature component story
// ============================================================

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { MessageBubble } from './message-bubble';

const meta = {
  title: 'Features/Chat/MessageBubble',                         // Rule: Features/[Feature]/ prefix
  component: MessageBubble,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',                                           // Rule: Padded for larger components
  },
  argTypes: {
    role: {
      control: 'select',
      options: ['user', 'assistant'],
      description: 'Who sent the message',
      table: {
        type: { summary: "'user' | 'assistant'" },
        defaultValue: { summary: 'assistant' },
        category: 'Appearance',
      },
    },
    content: {
      control: 'text',
      description: 'Message content',
      table: {
        type: { summary: 'string' },
        category: 'Content',
      },
    },
    isStreaming: {
      control: 'boolean',
      description: 'Whether message is currently streaming',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: 'State',
      },
    },
    onRetry: {
      action: 'retried',
      description: 'Called when retry button clicked',
      table: {
        category: 'Events',
      },
    },
  },
  args: {
    content: 'Hello, how can I help you today?',
    onRetry: fn(),
  },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const User: Story = {
  args: {
    role: 'user',
    content: 'Can you help me with this code?',
  },
};

export const Assistant: Story = {
  args: {
    role: 'assistant',
    content: 'Of course! I would be happy to help. What do you need?',
  },
};

export const Streaming: Story = {
  args: {
    isStreaming: true,
    content: 'Let me think about that...',
  },
};

export const LongContent: Story = {                             // Rule: Edge case story
  args: {
    content: 'This is a much longer message that demonstrates how the component handles longer content. It should wrap properly and maintain readability even when the message contains multiple sentences or paragraphs of text.',
  },
};

export const AllRoles: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-md">
      <MessageBubble role="user" content="Hello!" />
      <MessageBubble role="assistant" content="Hi there! How can I help?" />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};
```

</example>
