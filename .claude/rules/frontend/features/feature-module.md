---
paths: src/features/**/*
---

# Feature Module Guidelines

> Rules for creating feature modules. Read this when scaffolding a new feature in `src/features/`.

---

## Context

Features are self-contained modules that encapsulate related functionality. Each feature owns its components, hooks, stores, API, types, and utilities. Features cannot import from other features - only from shared code. This isolation enables parallel development and easy extraction to other projects.

---

## File Structure

```
features/[feature-name]/
├── api/                          # AI agents, tools, data fetching
│   ├── agents/
│   ├── tools/
│   ├── schemas/
│   └── index.ts
├── components/                   # Feature components
│   └── [component-name]/
│       ├── [component-name].tsx
│       ├── [component-name].stories.tsx
│       ├── [component-name].test.tsx
│       └── index.ts
├── config/                       # Static config data (nav, routes, menus)
│   ├── [config-name].ts
│   └── index.ts
├── hooks/                        # Feature hooks
│   ├── use-[hook-name].ts
│   └── use-[hook-name].test.ts
├── stores/                       # Feature Zustand stores
│   ├── [store-name]-store.ts
│   └── [store-name]-store.test.ts
├── types/                        # Feature types
│   └── index.ts
├── utils/                        # Feature utilities
│   └── [util-name].ts
└── index.ts                      # Public API (barrel export)
```

---

## Naming

| Item | Convention | Example |
|------|------------|---------|
| Feature folder | kebab-case | `chat/`, `agent-flow/` |
| Feature barrel | `index.ts` | `features/chat/index.ts` |
| Subfolder barrels | `index.ts` | `api/index.ts`, `components/index.ts` |

---

## Import Rules

| From | Can Import | Cannot Import |
|------|------------|---------------|
| Feature | Shared (`@/components`, `@/hooks`, `@/lib`) | Other features |
| Feature | Own internal modules | Other features' internals |
| App layer | Features (via barrel) | Features' internals |
| Shared | Nothing from features | Features |

### Cross-Feature Communication

When features need to communicate:
1. **Shared stores** in `src/stores/` (global state)
2. **Events/callbacks** passed from app layer
3. **URL state** via router

---

<rules>

## Do

- Export only public API from feature barrel (hide internals)
- Keep feature self-contained (no cross-feature imports)
- Create `types/index.ts` for all shared feature types
- Use subfolder barrels (`api/index.ts`, `components/index.ts`) for organization
- Include tests alongside source files (`*.test.ts`)

## Don't

- Import from other features → Use shared code or app-level composition
- Export internal implementation → Only export what consumers need
- Skip the types folder → Centralize types even if few
- Create deeply nested structures → Keep flat within subfolders
- Create all subfolders upfront → Only create what you need

## When

- WHEN feature needs state shared with others → Create store in `src/stores/`
- WHEN component is used by multiple features → Move to `src/components/`
- WHEN type is used by multiple features → Move to `src/types/`
- WHEN feature has no AI/data needs → Skip `api/` folder
- WHEN feature has no custom hooks → Skip `hooks/` folder
- WHEN feature has no local state → Skip `stores/` folder
- WHEN feature has 3+ config files → Create `config/` subfolder
- WHEN feature has 1-2 config files → Place at feature root (e.g., `nav-groups.ts`)

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint import rules catch cross-feature imports
npm run test           # All feature tests
```

---

<example>

## Complete Example

A chat feature with components, hooks, store, and API. Demonstrates: folder structure, barrel exports, import patterns, cross-feature isolation.

```
features/chat/
├── api/
│   ├── agents/
│   │   └── chat-agent.ts
│   ├── tools/
│   │   └── search-tool.ts
│   ├── schemas/
│   │   └── index.ts
│   └── index.ts                              # Rule: Subfolder barrel
├── components/
│   ├── message-bubble/
│   │   ├── message-bubble.tsx
│   │   ├── message-bubble.stories.tsx
│   │   ├── message-bubble.test.tsx           # Rule: Tests alongside source
│   │   └── index.ts
│   ├── message-list/
│   │   └── ...
│   └── message-input/
│       └── ...
├── hooks/
│   ├── use-auto-scroll.ts
│   ├── use-auto-scroll.test.ts
│   ├── use-chat-input.ts
│   └── use-chat-input.test.ts
├── stores/
│   ├── chat-store.ts
│   └── chat-store.test.ts
├── types/
│   └── index.ts                              # Rule: Centralize types
└── index.ts                                  # Rule: Feature public API
```

```typescript
// ============================================================
// FILE: features/chat/types/index.ts
// Demonstrates: Centralized feature types
// ============================================================

export type MessageRole = 'user' | 'assistant';           // Rule: Export types

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
};

export type ChatState = {
  messages: Message[];
  isGenerating: boolean;
};
```

```typescript
// ============================================================
// FILE: features/chat/components/message-bubble/message-bubble.tsx
// Demonstrates: Feature component imports
// ============================================================

import { cn } from '@/lib/utils';                         // Rule: Import shared utils
import { Avatar } from '@/components/ui/avatar';          // Rule: Import shared UI

import type { Message } from '../../types';               // Rule: Import own types

export type MessageBubbleProps = {
  message: Message;
  className?: string;
};

function MessageBubble({ message, className }: MessageBubbleProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      <Avatar role={message.role} />
      <p>{message.content}</p>
    </div>
  );
}

MessageBubble.displayName = 'MessageBubble';

export { MessageBubble };
```

```typescript
// ============================================================
// FILE: features/chat/index.ts
// Demonstrates: Feature public API (barrel export)
// ============================================================

// Components - only public ones                          // Rule: Export only public API
export { MessageBubble } from './components/message-bubble';
export { MessageList } from './components/message-list';
export { MessageInput } from './components/message-input';

// Hooks
export { useAutoScroll } from './hooks/use-auto-scroll';
export { useChatInput } from './hooks/use-chat-input';

// Store
export { useChatStore } from './stores/chat-store';

// API
export { chatAgent, chatAgentStream } from './api';

// Types                                                  // Rule: Export all public types
export type { Message, MessageRole, ChatState } from './types';
```

```typescript
// ============================================================
// FILE: src/app/pages/chat-page.tsx
// Demonstrates: App layer importing from feature barrel
// ============================================================

import { MessageList, MessageInput, useChatStore } from '@/features/chat';  // Rule: Import via barrel
// import { useChatStore } from '@/features/chat/stores/chat-store';        // Rule: Never import internals

function ChatPage() {
  const messages = useChatStore((state) => state.messages);
  return (
    <div>
      <MessageList messages={messages} />
      <MessageInput />
    </div>
  );
}
```

---

## Contrast: Minimal Feature

A feature with only components (no hooks, store, or API).

```
features/onboarding/
├── components/
│   ├── welcome-screen/
│   │   └── ...
│   └── setup-wizard/
│       └── ...
├── types/
│   └── index.ts                              # Rule: Always have types
└── index.ts
```

```typescript
// features/onboarding/index.ts
export { WelcomeScreen } from './components/welcome-screen';
export { SetupWizard } from './components/setup-wizard';
export type { OnboardingStep } from './types';

// Note: No api/, hooks/, stores/, utils/ folders       // Rule: Only create what you need
```

</example>
