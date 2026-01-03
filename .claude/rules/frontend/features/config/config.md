---
paths: src/features/**/config/**/*.ts, src/features/**/config/**/*.tsx
---

# Feature Config Guidelines

> Rules for creating static configuration data in `src/features/*/config/`. Read this when implementing navigation, routes, menu items, or other declarative data structures.

---

## Context

Config files contain static, declarative data that drives UI behavior (navigation items, route definitions, menu structures). They are factory functions that accept runtime data and return typed configuration objects. Config is data, not logic - business logic belongs in hooks or utils. Colocating config with its feature enables parallel development and easy extraction.

---

## File Structure

```
config/
├── [config-name].ts           # Config implementation (or .tsx if icons)
└── index.ts                   # Barrel exports
```

Alternative (simple features with 1-2 configs):
```
features/[feature]/
├── [config-name].ts           # Config at feature root
├── components/
└── types/
```

---

## Code Order

1. Imports (icons, shared types, feature types)
2. Types (data type for factory function)
3. Constants (static values, if any)
4. Config (the factory function or constant)
5. Exports (named only)

---

## Location Rules

| Scenario | Location | Example |
|----------|----------|---------|
| 1-2 config files | Feature root | `features/navigation/nav-groups.tsx` |
| 3+ config files | `config/` subfolder | `features/navigation/config/nav-groups.tsx` |
| App-wide config | `src/config/` | `src/config/routes.ts` |

---

## Naming

### Files

| Item | Convention | Example |
|------|------------|---------|
| Config file | kebab-case, domain-specific | `nav-groups.tsx`, `sidebar-items.ts` |
| Barrel file | `index.ts` | `config/index.ts` |

### Exports

| Item | Convention | Example |
|------|------------|---------|
| Config constant | SCREAMING_SNAKE_CASE | `NAV_GROUPS`, `SIDEBAR_AREAS` |
| Factory function | camelCase + descriptive | `getNavGroups`, `createRoutes` |
| Data type | `[Config]Data` | `NavGroupsData` |
| Return type | Use feature types | `NavGroupType[]` |

### Config Item Properties

| Property | Convention | Example |
|----------|------------|---------|
| Display name | `name` | `name: 'Settings'` |
| Route path | `href` | `href: '/settings'` |
| Icon | `icon` | `icon: Gear2` |
| Active state | `active` or `isActive` | `active: pathname === '/'` |
| Nested items | `items` | `items: [...]` |

---

<rules>

## Do

- Use factory functions when config depends on runtime data (pathname, user, etc.)
- Type all config with explicit return types from `types/`
- Use SCREAMING_SNAKE_CASE for exported config constants
- Keep config purely declarative (data only, no side effects)
- Colocate types in feature's `types/index.ts`
- Export config and data type from barrel

## Don't

- Business logic in config → Extract to hooks or utils
- Inline large configs in components → Extract to config file
- Default exports → Use named exports only
- Generic names (`config.ts`, `data.ts`) → Use domain-specific names (`nav-groups.ts`)
- Fetch data in config → Config is static, use hooks for dynamic data

## When

- WHEN config is static → Use constant (no factory function needed)
- WHEN config depends on pathname/user → Use factory function with typed data param
- WHEN config includes JSX (icons) → Use `.tsx` extension
- WHEN config needs validation → Add Zod schema in same file
- WHEN feature has 3+ config files → Create `config/` subfolder
- WHEN config is used across features → Move to `src/config/` (app-level)

</rules>

---

## Validation

```bash
npm run check-types    # TypeScript compilation
npm run lint           # ESLint rules
```

---

<example>

## Complete Example: Navigation Config

A navigation feature with groups and areas config. Demonstrates: factory functions, typed data, icons, domain-specific naming.

```typescript
// ============================================================
// FILE: src/features/navigation/config/nav-groups.tsx
// Demonstrates: Factory function config with typed data
// ============================================================

// ------------------------------------------------------------
// 1. IMPORTS
// ------------------------------------------------------------
import { Msgs, Gear2 } from '@/components/ui/icons';           // Rule: Icons first

import type { SidebarNavGroups } from '../types';              // Rule: Feature types

// ------------------------------------------------------------
// 2. TYPES
// ------------------------------------------------------------
/** Data passed to navigation group factory */                 // Rule: Document data type
export type NavGroupsData = {
  /** Current pathname for active state */
  pathname: string;
};

// ------------------------------------------------------------
// 3. CONFIG
// ------------------------------------------------------------
/**
 * Navigation groups configuration
 * Returns array of icon groups shown in sidebar left column
 */
export const NAV_GROUPS: SidebarNavGroups<NavGroupsData> = ({  // Rule: SCREAMING_SNAKE_CASE
  pathname,
}) => [
  {
    name: 'Chat',                                              // Rule: name property
    description: 'Start conversations with AI agents.',
    icon: Msgs,                                                // Rule: icon property
    href: '/',                                                 // Rule: href property
    active: pathname === '/' || pathname.startsWith('/chat'), // Rule: active state
  },
  {
    name: 'Settings',
    description: 'Configure preferences and API keys.',
    icon: Gear2,
    href: '/settings',
    active: pathname.startsWith('/settings'),
  },
];
```

```typescript
// ============================================================
// FILE: src/features/navigation/config/nav-areas.tsx
// Demonstrates: Nested config structure
// ============================================================

import { Bell, Gear2, Globe, Msgs, Users } from '@/components/ui/icons';

import type { SidebarNavAreas } from '../types';
import type { NavGroupsData } from './nav-groups';

/**
 * Navigation areas configuration
 * Returns content panel config for each area
 */
export const NAV_AREAS: SidebarNavAreas<NavGroupsData> = {     // Rule: SCREAMING_SNAKE_CASE
  chat: () => ({                                               // Rule: Factory for each area
    title: 'Chat',
    direction: 'left',
    content: [
      {
        items: [
          {
            name: 'New Chat',
            icon: Msgs,
            href: '/',
            exact: true,                                       // Rule: exact for precise matching
          },
        ],
      },
      {
        name: 'Recent',                                        // Rule: Section with name
        items: [
          {
            name: 'All Conversations',
            icon: Msgs,
            href: '/chat/history',
          },
        ],
      },
    ],
  }),

  settings: () => ({
    title: 'Settings',
    backHref: '/',
    direction: 'right',
    content: [
      {
        name: 'General',
        items: [
          { name: 'Preferences', icon: Gear2, href: '/settings', exact: true },
          { name: 'Appearance', icon: Globe, href: '/settings/appearance' },
          { name: 'Notifications', icon: Bell, href: '/settings/notifications' },
        ],
      },
      {
        name: 'Account',
        items: [
          { name: 'Team', icon: Users, href: '/settings/team' },
        ],
      },
    ],
  }),
};
```

```typescript
// ============================================================
// FILE: src/features/navigation/config/index.ts
// Demonstrates: Barrel exports for config
// ============================================================

export { NAV_GROUPS } from './nav-groups';                     // Rule: Named exports
export type { NavGroupsData } from './nav-groups';

export { NAV_AREAS } from './nav-areas';
```

</example>

---

<example>

## Contrast: Static Config (No Factory)

A simple config that doesn't need runtime data.

```typescript
// ============================================================
// FILE: src/features/editor/config/toolbar-items.ts
// Demonstrates: Static config without factory function
// ============================================================

import { Bold, Italic, Code, Link } from '@/components/ui/icons';

import type { ToolbarItem } from '../types';

/**
 * Toolbar button configuration
 * Static config - no runtime data needed
 */
export const TOOLBAR_ITEMS: ToolbarItem[] = [                  // Rule: Direct constant
  { name: 'Bold', icon: Bold, shortcut: 'Mod+B', action: 'bold' },
  { name: 'Italic', icon: Italic, shortcut: 'Mod+I', action: 'italic' },
  { name: 'Code', icon: Code, shortcut: 'Mod+E', action: 'code' },
  { name: 'Link', icon: Link, shortcut: 'Mod+K', action: 'link' },
];
```

</example>

---

<example>

## Contrast: Config at Feature Root

When a feature has only 1-2 config files, place them at feature root.

```
features/shortcuts/
├── shortcuts.ts              # Config at root (only config file)
├── components/
│   └── shortcut-list/
├── types/
│   └── index.ts
└── index.ts
```

```typescript
// ============================================================
// FILE: src/features/shortcuts/shortcuts.ts
// Demonstrates: Single config at feature root
// ============================================================

import type { ShortcutGroup } from './types';

export const SHORTCUTS: ShortcutGroup[] = [
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['Mod', 'K'], description: 'Open command palette' },
      { keys: ['Mod', '/'], description: 'Toggle sidebar' },
    ],
  },
  {
    name: 'Editing',
    shortcuts: [
      { keys: ['Mod', 'S'], description: 'Save' },
      { keys: ['Mod', 'Z'], description: 'Undo' },
    ],
  },
];
```

</example>
