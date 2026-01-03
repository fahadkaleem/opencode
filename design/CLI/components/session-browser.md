# SessionBrowser Component Analysis

> Comprehensive analysis of the gemini-cli SessionBrowser component for FloMaster implementation reference.

**Source File**: `examplecode/gemini-cli/packages/cli/src/ui/components/SessionBrowser.tsx` (935 lines)

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Data Flow](#data-flow)
3. [State Management](#state-management)
4. [List Management](#list-management)
5. [Keyboard Navigation](#keyboard-navigation)
6. [Session Operations](#session-operations)
7. [UI Composition](#ui-composition)
8. [Implementation Recommendations](#implementation-recommendations)

---

## Component Architecture

### Overview

The SessionBrowser is a high-complexity Ink component that implements a full-featured session list browser with search, sorting, pagination, and CRUD operations. It follows a **centralized state pattern** with custom hooks for separation of concerns.

### Props Interface (Lines 25-34)

```typescript
export interface SessionBrowserProps {
  /** Application configuration object */
  config: Config;
  /** Callback when user selects a session to resume */
  onResumeSession: (session: SessionInfo) => void;
  /** Callback when user deletes a session */
  onDeleteSession: (session: SessionInfo) => Promise<void>;
  /** Callback when user exits the session browser */
  onExit: () => void;
}
```

**Key Patterns**:
- Config is passed in (not read from context) for testability
- Callbacks use async for delete operation (allows parent to handle I/O)
- Exit callback enables parent to control navigation flow

### Component Decomposition

```
SessionBrowser (Main - Lines 913-934)
├── useSessionBrowserState (State hook - Lines 567-635)
├── useLoadSessions (Data loading hook - Lines 640-707)
├── useMoveSelection (Navigation hook - Lines 712-738)
├── useCycleSortOrder (Sort hook - Lines 743-756)
├── useSessionBrowserInput (Input hook - Lines 761-880)
└── SessionBrowserView (View component - Lines 882-911)
    ├── SessionBrowserLoading (Lines 122-126)
    ├── SessionBrowserError (Lines 131-140)
    ├── SessionBrowserEmpty (Lines 145-150)
    ├── SessionListHeader (Lines 289-303)
    ├── SearchModeDisplay (Lines 274-284)
    ├── NoResultsDisplay (Lines 371-381)
    └── SessionList (Lines 534-562)
        ├── NavigationHelp (Lines 308-329)
        ├── SessionTableHeader (Lines 334-366)
        └── SessionItem (Lines 420-529)
            └── MatchSnippetDisplay (Lines 386-415)
```

---

## Data Flow

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SessionBrowser                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐     ┌───────────────────────────────────┐ │
│  │   Props (Config) │────▶│       useLoadSessions             │ │
│  └──────────────────┘     │  - Reads session files from disk  │ │
│                           │  - Parses JSON session data       │ │
│                           │  - Loads full content on search   │ │
│                           └─────────────┬─────────────────────┘ │
│                                         │                        │
│                                         ▼                        │
│  ┌──────────────────────────────────────────────────────────────┐
│  │              SessionBrowserState (Centralized)               │
│  ├──────────────────────────────────────────────────────────────┤
│  │  Data:                                                       │
│  │    sessions: SessionInfo[]                                   │
│  │    filteredAndSortedSessions: SessionInfo[] (computed)       │
│  │                                                               │
│  │  UI State:                                                    │
│  │    loading, error, activeIndex, scrollOffset, terminalWidth  │
│  │                                                               │
│  │  Search State:                                                │
│  │    searchQuery, isSearchMode, hasLoadedFullContent           │
│  │                                                               │
│  │  Sort State:                                                  │
│  │    sortOrder ('date' | 'messages' | 'name'), sortReverse     │
│  │                                                               │
│  │  Computed (via useMemo):                                      │
│  │    totalSessions, startIndex, endIndex, visibleSessions      │
│  └──────────────────────────────────────────────────────────────┘
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │ moveSelect  │  │ cycleSort   │  │ useSessionBrowser   │     │
│  │             │  │ Order       │  │ Input               │     │
│  │ (Navigation)│  │ (Sorting)   │  │ (Keyboard handling) │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
│                                                                  │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐
│  │                    SessionBrowserView                        │
│  │  Renders based on state:                                     │
│  │    - loading ────▶ SessionBrowserLoading                     │
│  │    - error ──────▶ SessionBrowserError                       │
│  │    - empty ──────▶ SessionBrowserEmpty                       │
│  │    - normal ─────▶ Header + Search + SessionList             │
│  └──────────────────────────────────────────────────────────────┘
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Session Loading Pipeline

```
getSessionFiles (sessionUtils.ts)
        │
        ▼
┌───────────────────────────────────────┐
│  1. Read directory (fs.readdir)       │
│  2. Filter session files (prefix)     │
│  3. Sort by filename (timestamp)      │
├───────────────────────────────────────┤
│  For each file (parallel):            │
│    - Parse JSON                       │
│    - Validate required fields         │
│    - Extract firstUserMessage         │
│    - Build SessionInfo object         │
├───────────────────────────────────────┤
│  4. Deduplicate by session ID         │
│  5. Sort by startTime (oldest first)  │
│  6. Assign 1-based indexes            │
└───────────────────────────────────────┘
```

---

## State Management

### Centralized State Interface (Lines 40-105)

The component uses a **centralized state pattern** where all state is collected into a single `SessionBrowserState` interface. This eliminates prop drilling and provides a single source of truth.

```typescript
export interface SessionBrowserState {
  // Data state
  sessions: SessionInfo[];
  filteredAndSortedSessions: SessionInfo[];

  // UI state
  loading: boolean;
  error: string | null;
  activeIndex: number;
  scrollOffset: number;
  terminalWidth: number;

  // Search state
  searchQuery: string;
  isSearchMode: boolean;
  hasLoadedFullContent: boolean;

  // Sort state
  sortOrder: 'date' | 'messages' | 'name';
  sortReverse: boolean;

  // Computed values
  totalSessions: number;
  startIndex: number;
  endIndex: number;
  visibleSessions: SessionInfo[];

  // State setters (all included for sub-components)
  setSessions: React.Dispatch<...>;
  setLoading: React.Dispatch<...>;
  // ... etc
}
```

### State Hook Implementation (Lines 567-635)

```typescript
export const useSessionBrowserState = (
  initialSessions: SessionInfo[] = [],
  initialLoading = true,
  initialError: string | null = null,
): SessionBrowserState => {
  const { columns: terminalWidth } = useTerminalSize();

  // Core state
  const [sessions, setSessions] = useState<SessionInfo[]>(initialSessions);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Sort state
  const [sortOrder, setSortOrder] = useState<'date' | 'messages' | 'name'>('date');
  const [sortReverse, setSortReverse] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [hasLoadedFullContent, setHasLoadedFullContent] = useState(false);

  // Derived state (memoized)
  const filteredAndSortedSessions = useMemo(() => {
    const filtered = filterSessions(sessions, searchQuery);
    return sortSessions(filtered, sortOrder, sortReverse);
  }, [sessions, searchQuery, sortOrder, sortReverse]);

  // Pagination computed values
  const totalSessions = filteredAndSortedSessions.length;
  const startIndex = scrollOffset;
  const endIndex = Math.min(scrollOffset + SESSIONS_PER_PAGE, totalSessions);
  const visibleSessions = filteredAndSortedSessions.slice(startIndex, endIndex);

  // Return complete state object with setters
  return { /* all state and setters */ };
};
```

**Key Patterns**:
1. **Testable Initialization**: Default parameters allow easy testing
2. **Memoized Derived State**: `useMemo` for expensive filter/sort operations
3. **Terminal Responsiveness**: `useTerminalSize` hook updates on resize
4. **Lazy Content Loading**: `hasLoadedFullContent` flag for search optimization

---

## List Management

### Pagination Configuration (Line 107)

```typescript
const SESSIONS_PER_PAGE = 20;
```

### Sorting (Lines 159-180)

Three sort criteria with direction toggle:

```typescript
const sortSessions = (
  sessions: SessionInfo[],
  sortBy: 'date' | 'messages' | 'name',
  reverse: boolean,
): SessionInfo[] => {
  const sorted = [...sessions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'messages':
        return b.messageCount - a.messageCount;
      case 'name':
        return a.displayName.localeCompare(b.displayName);
      default:
        return 0;
    }
  });
  return reverse ? sorted.reverse() : sorted;
};
```

### Filtering with Search (Lines 236-269)

```typescript
const filterSessions = (
  sessions: SessionInfo[],
  query: string,
): SessionInfo[] => {
  if (!query.trim()) {
    return sessions.map((session) => ({
      ...session,
      matchSnippets: undefined,
      matchCount: undefined,
    }));
  }

  const lowerQuery = query.toLowerCase();
  return sessions.filter((session) => {
    // Search in title, ID, first message
    const titleMatch =
      session.displayName.toLowerCase().includes(lowerQuery) ||
      session.id.toLowerCase().includes(lowerQuery) ||
      session.firstUserMessage.toLowerCase().includes(lowerQuery);

    // Search in full content (if loaded)
    const contentMatch = session.fullContent?.toLowerCase().includes(lowerQuery);

    if (titleMatch || contentMatch) {
      // Attach match snippets for display
      if (session.messages) {
        session.matchSnippets = findTextMatches(session.messages, query);
        session.matchCount = session.matchSnippets.length;
      }
      return true;
    }
    return false;
  });
};
```

### Text Match Extraction (Lines 189-227)

Creates search result snippets with context:

```typescript
const findTextMatches = (
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  query: string,
): TextMatch[] => {
  const matches: TextMatch[] = [];

  for (const message of messages) {
    const content = cleanMessage(message.content);
    const lowerContent = content.toLowerCase();
    let startIndex = 0;

    while (true) {
      const matchIndex = lowerContent.indexOf(query.toLowerCase(), startIndex);
      if (matchIndex === -1) break;

      // Extract 10 chars context before/after
      const contextStart = Math.max(0, matchIndex - 10);
      const contextEnd = Math.min(content.length, matchIndex + query.length + 10);

      // Add ellipsis for truncation
      let before = content.slice(contextStart, matchIndex);
      if (contextStart > 0) before = '...' + before;

      let after = content.slice(matchIndex + query.length, contextEnd);
      if (contextEnd < content.length) after = after + '...';

      matches.push({ before, match, after, role: message.role });
      startIndex = matchIndex + 1;
    }
  }
  return matches;
};
```

### Lazy Content Loading for Search (Lines 672-706)

Full content is only loaded when search mode is activated:

```typescript
useEffect(() => {
  const loadFullContent = async () => {
    if (isSearchMode && !hasLoadedFullContent) {
      const sessionData = await getSessionFiles(
        chatsDir,
        currentSessionId,
        { includeFullContent: true }  // Triggers full message loading
      );
      setSessions(sessionData);
      setHasLoadedFullContent(true);
    }
  };
  loadFullContent();
}, [isSearchMode, hasLoadedFullContent, /* deps */]);
```

---

## Keyboard Navigation

### Keyboard Handling Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Keyboard Input Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  stdin ──▶ KeypressProvider ──▶ useKeypress ──▶ handler         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Navigation Mode (isSearchMode = false)                     ││
│  │  ────────────────────────────────────────                   ││
│  │  Arrow Keys:  up/down = move selection                      ││
│  │  Page Keys:   pageup/pagedown = move by page                ││
│  │  vim-style:   g = first, G = last, u = half-page up,        ││
│  │               d = half-page down                            ││
│  │  Actions:     Enter = resume, x = delete, q/Esc = quit      ││
│  │  Search:      / = enter search mode                         ││
│  │  Sort:        s = cycle sort, r = reverse                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Search Mode (isSearchMode = true)                          ││
│  │  ───────────────────────────────                            ││
│  │  Any char:    append to search query                        ││
│  │  Backspace:   remove last char from query                   ││
│  │  Escape:      exit search mode, clear query                 ││
│  │  Arrow Keys:  still work for navigation                     ││
│  │  Enter:       resume selected session                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Input Handler Implementation (Lines 761-880)

```typescript
export const useSessionBrowserInput = (
  state: SessionBrowserState,
  moveSelection: (delta: number) => void,
  cycleSortOrder: () => void,
  onResumeSession: (session: SessionInfo) => void,
  onDeleteSession: (session: SessionInfo) => Promise<void>,
  onExit: () => void,
) => {
  useKeypress(
    (key) => {
      if (state.isSearchMode) {
        // SEARCH MODE INPUT HANDLING
        if (key.name === 'escape') {
          state.setIsSearchMode(false);
          state.setSearchQuery('');
          state.setActiveIndex(0);
          state.setScrollOffset(0);
        } else if (key.name === 'backspace') {
          state.setSearchQuery((prev) => prev.slice(0, -1));
          state.setActiveIndex(0);
          state.setScrollOffset(0);
        } else if (key.sequence && !key.ctrl && !key.meta && key.sequence.length === 1) {
          // Single printable character
          state.setSearchQuery((prev) => prev + key.sequence);
          state.setActiveIndex(0);
          state.setScrollOffset(0);
        }
      } else {
        // NAVIGATION MODE INPUT HANDLING
        if (key.sequence === 'g') {
          // Jump to first
          state.setActiveIndex(0);
          state.setScrollOffset(0);
        } else if (key.sequence === 'G') {
          // Jump to last
          state.setActiveIndex(state.totalSessions - 1);
          state.setScrollOffset(Math.max(0, state.totalSessions - SESSIONS_PER_PAGE));
        } else if (key.sequence === 's') {
          cycleSortOrder();
        } else if (key.sequence === 'r') {
          state.setSortReverse(!state.sortReverse);
        } else if (key.sequence === '/') {
          state.setIsSearchMode(true);
        } else if (key.sequence === 'q' || key.sequence === 'Q' || key.name === 'escape') {
          onExit();
        } else if (key.sequence === 'x' || key.sequence === 'X') {
          // Delete with validation
          const selected = state.filteredAndSortedSessions[state.activeIndex];
          if (selected && !selected.isCurrentSession) {
            onDeleteSession(selected).then(() => {
              state.setSessions(state.sessions.filter((s) => s.id !== selected.id));
              // Adjust activeIndex if needed
            }).catch((error) => {
              state.setError(`Failed to delete: ${error.message}`);
            });
          }
        } else if (key.sequence === 'u') {
          moveSelection(-Math.round(SESSIONS_PER_PAGE / 2));
        } else if (key.sequence === 'd') {
          moveSelection(Math.round(SESSIONS_PER_PAGE / 2));
        }
      }

      // COMMON HANDLERS (work in both modes)
      if (key.name === 'return') {
        const selected = state.filteredAndSortedSessions[state.activeIndex];
        if (selected && !selected.isCurrentSession) {
          onResumeSession(selected);
        }
      } else if (key.name === 'up') {
        moveSelection(-1);
      } else if (key.name === 'down') {
        moveSelection(1);
      } else if (key.name === 'pageup') {
        moveSelection(-SESSIONS_PER_PAGE);
      } else if (key.name === 'pagedown') {
        moveSelection(SESSIONS_PER_PAGE);
      }
    },
    { isActive: true },
  );
};
```

### Selection Movement with Scroll Sync (Lines 712-738)

```typescript
export const useMoveSelection = (state: SessionBrowserState) => {
  return useCallback(
    (delta: number) => {
      const newIndex = Math.max(
        0,
        Math.min(state.totalSessions - 1, state.activeIndex + delta),
      );
      state.setActiveIndex(newIndex);

      // Scroll viewport if selection moves outside visible range
      if (newIndex < state.scrollOffset) {
        state.setScrollOffset(newIndex);
      } else if (newIndex >= state.scrollOffset + SESSIONS_PER_PAGE) {
        state.setScrollOffset(newIndex - SESSIONS_PER_PAGE + 1);
      }
    },
    [state.totalSessions, state.activeIndex, state.scrollOffset, /* setters */],
  );
};
```

### Sort Order Cycling (Lines 743-756)

```typescript
export const useCycleSortOrder = (state: SessionBrowserState) => {
  return useCallback(() => {
    const orders: Array<'date' | 'messages' | 'name'> = ['date', 'messages', 'name'];
    const currentIndex = orders.indexOf(state.sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    state.setSortOrder(orders[nextIndex]);
  }, [state.sortOrder, state.setSortOrder]);
};
```

---

## Session Operations

### Resume Session Flow

```
┌──────────────────────────────────────────────────────────────┐
│  User presses Enter                                          │
├──────────────────────────────────────────────────────────────┤
│  1. Get selected session from filteredAndSortedSessions      │
│  2. Validate: !selectedSession.isCurrentSession              │
│  3. Call onResumeSession(selectedSession) callback           │
│  4. Parent handles session loading and UI transition         │
└──────────────────────────────────────────────────────────────┘
```

**Line 858-867**:
```typescript
if (key.name === 'return' && state.filteredAndSortedSessions[state.activeIndex]) {
  const selectedSession = state.filteredAndSortedSessions[state.activeIndex];
  if (!selectedSession.isCurrentSession) {
    onResumeSession(selectedSession);
  }
}
```

### Delete Session Flow

```
┌──────────────────────────────────────────────────────────────┐
│  User presses 'x' or 'X'                                     │
├──────────────────────────────────────────────────────────────┤
│  1. Get selected session                                     │
│  2. Validate: session exists AND !isCurrentSession           │
│  3. Call onDeleteSession(session) - async callback           │
│  4. On success:                                              │
│     - Filter out deleted session from state                  │
│     - Adjust activeIndex if at end of list                   │
│  5. On error:                                                │
│     - Set error state with message                           │
└──────────────────────────────────────────────────────────────┘
```

**Lines 821-847**:
```typescript
else if (key.sequence === 'x' || key.sequence === 'X') {
  const selectedSession = state.filteredAndSortedSessions[state.activeIndex];
  if (selectedSession && !selectedSession.isCurrentSession) {
    onDeleteSession(selectedSession)
      .then(() => {
        state.setSessions(
          state.sessions.filter((s) => s.id !== selectedSession.id),
        );
        if (state.activeIndex >= state.filteredAndSortedSessions.length - 1) {
          state.setActiveIndex(
            Math.max(0, state.filteredAndSortedSessions.length - 2),
          );
        }
      })
      .catch((error) => {
        state.setError(
          `Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      });
  }
}
```

**No Confirmation Pattern**: Note that gemini-cli does NOT use a confirmation dialog for delete. The delete is immediate. For FloMaster, consider adding a confirmation step.

---

## UI Composition

### Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│ Box (column, paddingX=1)                                       │
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ SessionListHeader (row, space-between)                   │   │
│ │   Left: "Chat Sessions (N total, filtered)"              │   │
│ │   Right: "sorted by {order} {direction}"                 │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ SearchModeDisplay (if isSearchMode)                      │   │
│ │   "Search: {query} (Esc to cancel)"                      │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ SessionList (if totalSessions > 0)                       │   │
│ │ ┌────────────────────────────────────────────────────┐   │   │
│ │ │ NavigationHelp                                     │   │   │
│ │ │   Navigate: arrows  Resume: Enter  Search: /       │   │   │
│ │ │   Sort: s  Reverse: r  First/Last: g/G             │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ │ ┌────────────────────────────────────────────────────┐   │   │
│ │ │ SessionTableHeader                                 │   │   │
│ │ │   scroll_up_indicator Index | Msgs | Age | Name    │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ │ ┌────────────────────────────────────────────────────┐   │   │
│ │ │ SessionItem (repeated for each visible session)    │   │   │
│ │ │   prefix #index | count | age | name/match         │   │   │
│ │ └────────────────────────────────────────────────────┘   │   │
│ │ scroll_down_indicator                                    │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ NoResultsDisplay (if totalSessions = 0 && searchQuery)   │   │
│ │   "No sessions found matching '{query}'."                │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Header/Footer Patterns

**Header with Status** (Lines 289-303):
```tsx
const SessionListHeader = ({ state }: { state: SessionBrowserState }) => (
  <Box flexDirection="row" justifyContent="space-between">
    <Text color={Colors.AccentPurple}>
      Chat Sessions ({state.totalSessions} total
      {state.searchQuery ? `, filtered` : ''})
    </Text>
    <Text color={Colors.Gray}>
      sorted by {state.sortOrder} {state.sortReverse ? 'asc' : 'desc'}
    </Text>
  </Box>
);
```

**Navigation Help** (Lines 308-329):
```tsx
const NavigationHelp = () => (
  <Box flexDirection="column">
    <Text color={Colors.Gray}>
      <Kbd name="Navigate" shortcut="up/down" />
      {'   '}
      <Kbd name="Resume" shortcut="Enter" />
      {'   '}
      <Kbd name="Search" shortcut="/" />
      {'   '}
      <Kbd name="Delete" shortcut="x" />
      {'   '}
      <Kbd name="Quit" shortcut="q" />
    </Text>
    <Text color={Colors.Gray}>
      <Kbd name="Sort" shortcut="s" />
      {'         '}
      <Kbd name="Reverse" shortcut="r" />
      {'      '}
      <Kbd name="First/Last" shortcut="g/G" />
    </Text>
  </Box>
);
```

**Kbd Helper** (Lines 113-118):
```tsx
const Kbd = ({ name, shortcut }: { name: string; shortcut: string }) => (
  <>
    {name}: <Text bold>{shortcut}</Text>
  </>
);
```

### Scroll Indicators (Lines 340, 558-560)

```tsx
// Up indicator in header
<Text>{state.scrollOffset > 0 ? <Text>up_arrow </Text> : '  '}</Text>

// Down indicator at bottom
<Text color={Colors.Gray}>
  {state.endIndex < state.totalSessions ? <>down_arrow</> : <Text dimColor>down_arrow</Text>}
</Text>
```

### State-Based Rendering

**View Component** (Lines 882-911):
```tsx
export function SessionBrowserView({ state }: { state: SessionBrowserState }) {
  if (state.loading) {
    return <SessionBrowserLoading />;
  }

  if (state.error) {
    return <SessionBrowserError state={state} />;
  }

  if (state.sessions.length === 0) {
    return <SessionBrowserEmpty />;
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <SessionListHeader state={state} />
      {state.isSearchMode && <SearchModeDisplay state={state} />}
      {state.totalSessions === 0 ? (
        <NoResultsDisplay state={state} />
      ) : (
        <SessionList state={state} formatRelativeTime={formatRelativeTime} />
      )}
    </Box>
  );
}
```

### UI States Summary

| State | Component | Description |
|-------|-----------|-------------|
| Loading | `SessionBrowserLoading` | "Loading sessions..." |
| Error | `SessionBrowserError` | Error message + "Press q to exit" |
| Empty | `SessionBrowserEmpty` | "No auto-saved conversations found." |
| No Results | `NoResultsDisplay` | "No sessions found matching '{query}'." |
| Normal | Full layout | Header + Help + Table + Items |

### Session Item Row (Lines 420-529)

Complex row with conditional styling:

```tsx
const SessionItem = ({ session, state, terminalWidth, formatRelativeTime }) => {
  const originalIndex = state.startIndex + state.visibleSessions.indexOf(session);
  const isActive = originalIndex === state.activeIndex;
  const isDisabled = session.isCurrentSession;

  // Dynamic text color based on state
  const textColor = (c: string = Colors.Foreground) => {
    if (isDisabled) return Colors.Gray;
    return isActive ? Colors.AccentPurple : c;
  };

  const prefix = isActive ? '> ' : '  ';  // Selection indicator

  // Calculate available width for name column
  const availableMessageWidth = Math.max(
    20,
    terminalWidth - FIXED_SESSION_COLUMNS_WIDTH - reservedForMeta,
  );

  return (
    <Box flexDirection="row">
      <Text color={textColor()} dimColor={isDisabled}>{prefix}</Text>
      <Box width={5}><Text color={textColor()}>#{originalIndex + 1}</Text></Box>
      <Text color={textColor(Colors.Gray)}> | </Text>
      <Box width={4}><Text>{session.messageCount}</Text></Box>
      <Text color={textColor(Colors.Gray)}> | </Text>
      <Box width={4}><Text>{formatRelativeTime(session.lastUpdated, 'short')}</Text></Box>
      <Text color={textColor(Colors.Gray)}> | </Text>
      <Box flexGrow={1}>
        <Text>{truncatedMessage}</Text>
        {additionalInfo && <Text color={textColor(Colors.Gray)}>{additionalInfo}</Text>}
      </Box>
    </Box>
  );
};
```

---

## Implementation Recommendations

### For FloMaster CLI

#### 1. State Management Pattern

**Adopt the centralized state pattern** but with TypeScript improvements:

```typescript
// Recommended: Use a discriminated union for loading states
type SessionBrowserStatus =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'empty' }
  | { status: 'ready'; sessions: SessionInfo[] };

interface SessionBrowserState {
  dataStatus: SessionBrowserStatus;
  ui: {
    activeIndex: number;
    scrollOffset: number;
    terminalWidth: number;
  };
  search: {
    query: string;
    isActive: boolean;
    hasLoadedFullContent: boolean;
  };
  sort: {
    order: 'date' | 'messages' | 'name';
    reversed: boolean;
  };
}
```

#### 2. Hook Composition

Create focused hooks that can be tested independently:

```typescript
// Separate concerns into testable hooks
export const useSessionData = (config: Config) => { /* data loading */ };
export const useSessionSearch = (sessions: SessionInfo[]) => { /* filtering */ };
export const useSessionSort = () => { /* sorting logic */ };
export const useListNavigation = (itemCount: number, pageSize: number) => { /* navigation */ };
export const useSessionBrowserKeyboard = (...) => { /* input handling */ };
```

#### 3. Delete Confirmation

**Add confirmation dialog** (gemini-cli skips this):

```typescript
interface SessionBrowserState {
  // ... existing state
  deleteConfirmation: {
    isOpen: boolean;
    sessionToDelete: SessionInfo | null;
  };
}

// In keyboard handler:
if (key.sequence === 'x') {
  state.setDeleteConfirmation({
    isOpen: true,
    sessionToDelete: selectedSession,
  });
}

// Render confirmation dialog when open
{state.deleteConfirmation.isOpen && (
  <ConfirmDialog
    message={`Delete session "${session.displayName}"?`}
    onConfirm={() => handleDelete()}
    onCancel={() => state.setDeleteConfirmation({ isOpen: false, sessionToDelete: null })}
  />
)}
```

#### 4. Keyboard Binding Configuration

Make keyboard shortcuts configurable:

```typescript
const DEFAULT_KEYBINDINGS = {
  navigation: {
    up: ['up', 'k'],
    down: ['down', 'j'],
    pageUp: ['pageup', 'ctrl+u'],
    pageDown: ['pagedown', 'ctrl+d'],
    first: ['g', 'home'],
    last: ['G', 'end'],
  },
  actions: {
    select: ['return'],
    delete: ['x', 'delete'],
    exit: ['q', 'escape'],
    search: ['/'],
    sort: ['s'],
    reverseSort: ['r'],
  },
};
```

#### 5. Accessibility Improvements

- Add ARIA-like announcements for screen readers (via terminal announcements)
- Ensure high contrast color scheme support
- Add audible feedback option for actions

#### 6. Performance Optimizations

```typescript
// Virtualize long lists
const VIEWPORT_BUFFER = 5; // Render a few extra items above/below viewport

// Debounce search
const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    setSearchQuery(query);
  }, 150),
  []
);

// Lazy load session content only when needed
const loadSessionContent = useCallback(async (sessionId: string) => {
  if (!loadedContent.has(sessionId)) {
    const content = await loadFullContent(sessionId);
    setLoadedContent(prev => new Map(prev).set(sessionId, content));
  }
}, [loadedContent]);
```

#### 7. Error Boundaries

Wrap the component in error boundaries for graceful degradation:

```typescript
export function SessionBrowserWithErrorBoundary(props: SessionBrowserProps) {
  return (
    <ErrorBoundary
      fallback={(error) => (
        <Box flexDirection="column">
          <Text color="red">Session browser error: {error.message}</Text>
          <Text color="gray">Press q to exit</Text>
        </Box>
      )}
    >
      <SessionBrowser {...props} />
    </ErrorBoundary>
  );
}
```

### File Structure for FloMaster

```
packages/cli/src/ui/
├── components/
│   └── sessionBrowser/
│       ├── sessionBrowser.tsx           # Main component
│       ├── sessionBrowser.test.tsx      # Tests
│       ├── hooks/
│       │   ├── useSessionBrowserState.ts
│       │   ├── useSessionData.ts
│       │   ├── useSessionSearch.ts
│       │   ├── useSessionSort.ts
│       │   ├── useListNavigation.ts
│       │   └── useSessionBrowserKeyboard.ts
│       ├── components/
│       │   ├── sessionItem.tsx
│       │   ├── sessionListHeader.tsx
│       │   ├── navigationHelp.tsx
│       │   ├── searchModeDisplay.tsx
│       │   └── stateViews.tsx           # Loading, Error, Empty
│       ├── utils/
│       │   ├── sorting.ts
│       │   ├── filtering.ts
│       │   └── textMatching.ts
│       └── index.ts                     # Public exports
```

---

## Summary

The SessionBrowser component demonstrates several advanced patterns for complex Ink components:

1. **Centralized State**: All state in one interface, passed to sub-components
2. **Hook Composition**: Separate hooks for data loading, navigation, input handling
3. **Modal Keyboard Handling**: Different key behaviors for search vs navigation modes
4. **Lazy Loading**: Full content loaded only when search is activated
5. **Responsive Layout**: Terminal width-aware column sizing
6. **State-Based Rendering**: Clean conditional rendering for loading/error/empty states

These patterns provide a solid foundation for implementing FloMaster's session management UI.
