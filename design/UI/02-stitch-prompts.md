# FloMaster UI - Stitch Prompts

> **Purpose**: Prompts for generating UI mockups using stitch.withgoogle.com
> **Related**: [High-Level Requirements](./01-high-level-requirements.md)
> **Last Updated**: 2025-12-30
> **Version**: 2.0

---

## How to Use These Prompts

1. Go to [stitch.withgoogle.com](https://stitch.withgoogle.com)
2. Select **Web** layout (not mobile)
3. Use **Iterative Prompts** (recommended) - build section by section
4. After each prompt, review and refine before moving to next
5. Export to Figma for further refinement if needed

**Recommended Order:**
1. Start with the Icon Rail (shared across all views)
2. Build each view separately
3. Create state variations last

---

## Design Tokens Reference

Use these consistently across all prompts:

```
COLORS:
- Background (darkest): #0D0D0D
- Background (elevated): #141414
- Background (surface): #1A1A1A
- Background (hover): #262626
- Border: #262626
- Text primary: #FFFFFF
- Text secondary: #A1A1AA
- Text muted: #71717A
- Accent (orange): #F97316
- Success (green): #22C55E
- Error (red): #EF4444
- Info (blue): #3B82F6

TYPOGRAPHY:
- Font family: Inter or SF Pro
- Headings: Bold/Semibold
- Body: Regular, 14px
- Small: 12px
- Monospace: JetBrains Mono or SF Mono

SPACING:
- Border radius: 8px (cards), 6px (buttons), 4px (badges)
- Panel padding: 16px
- Item gap: 8px
- Section gap: 24px
- Icon rail width: 48px
- Left panel width: ~280px (sessions, categories)
- Task panel width: ~320px
```

---

## View Overview

| View | Layout | Icon Rail State |
|------|--------|-----------------|
| Chat | Icon Rail + Sessions List + Chat | 💬 active |
| Tasks (Kanban) | Icon Rail + Full-width Kanban | 📋 active |
| Tasks (List) | Icon Rail + Full-width List | 📋 active |
| Task Detail | Icon Rail + Task Panel + Step Chat | 📋 active |
| Workflows (Browse) | Icon Rail + Workflow List + Preview | 🔀 active |
| Workflows (Edit) | Icon Rail + Full-width React Flow | 🔀 active |
| Settings | Icon Rail + Categories + Settings | ⚙️ active |

---

## Shared Component: Icon Rail

Use this for ALL views. Only change which icon is highlighted.

```
Create a thin vertical navigation rail on the left edge of a desktop web app.

Width: 48px
Background: #0D0D0D (darkest)
Full viewport height

Top section (centered):
- "FM" text logo in bold orange (#F97316), or a small spark/lightning icon in orange
- Subtle glow effect on hover

Middle section (icon buttons, vertically centered in available space):
- Chat icon (message bubble outline) - 24px, gray (#71717A)
- Tasks icon (clipboard/list outline) - 24px, gray
- Workflows icon (git-branch or flow icon) - 24px, gray
- Each icon has 24px vertical gap
- Hover state: icon becomes lighter (#A1A1AA)
- Active state: icon is white (#FFFFFF) with orange left border (3px) or orange background pill

Bottom section (fixed to bottom, 16px from edge):
- Settings gear icon - 24px, gray
- Hover shows tooltip "Settings"

All icons centered horizontally in the 48px width.
Tooltips appear on hover showing: "Chat", "Tasks", "Workflows", "Settings"
```

---

## View 1: Chat View

**Layout:** Icon Rail (48px) + Sessions List (~250px) + Chat Area (flex)

### Prompt 1.1: Chat View - Basic Layout

```
Desktop web app with dark theme. Full viewport height.

Three-panel layout:
- Left: 48px icon rail (already created)
- Middle: 250px sessions panel, background #141414, right border #262626
- Right: Fills remaining space, background #0D0D0D

Header bar spans middle and right panels:
- Background #141414
- Height: 56px
- Border bottom: #262626
- Left side: "FloMaster" text in white (16px semibold), then "Chat" label
- Right side: Settings gear icon (gray)
```

### Prompt 1.2: Chat View - Sessions List

```
In the middle panel (250px, sessions list):

Top section (padding 16px):
- "Sessions" label in small caps gray (#71717A), 11px
- Right side: "+ New" button (small, text only, gray, hover orange)

Sessions list (scrollable):
Each session row (padding 12px 16px):
- Active session:
  - Background: #1A1A1A
  - Orange left border (3px)
  - Title: "Auth implementation help" in white (14px, semibold)
  - Preview: "How does the JWT..." truncated, gray (#A1A1AA), 12px
  - Timestamp: "2m ago" gray, 11px, right aligned

- Other sessions (not active):
  - No background
  - No border
  - Title: session name in gray (#A1A1AA)
  - Preview: truncated text, gray (#71717A)
  - Timestamp: gray
  - Hover: background #1A1A1A

Show 5-6 session rows:
- "Auth implementation help" (active)
- "API design questions"
- "Bug investigation"
- "Refactoring advice"
- "Performance optimization"

Bottom: "+ New session" row with plus icon, dashed border on hover
```

### Prompt 1.3: Chat View - Chat Area

```
In the right panel (chat area):

Scrollable content area (padding 24px):

System message:
- Small gray italic text, 12px
- "Started new session" or timestamp

User message (right-aligned):
- Dark bubble background (#1F1F1F)
- Rounded corners (12px)
- Padding 12px 16px
- White text
- Max width 70%
- "How does authentication work in this project?"

Agent message (left-aligned):
- No bubble
- White text, markdown formatting
- "Based on my analysis of the codebase, authentication is handled through..."
- Bullet points with proper formatting

Tool call block:
- Background #1A1A1A
- Rounded, padding 12px
- Header: "▼ 3 tools" with folder icon (collapsible)
- Expanded shows: "Read src/auth/index.ts", "Read src/middleware/auth.ts", etc.

More agent text after tool calls.

Input bar (fixed at bottom):
- Background #141414
- Border top #262626
- Padding 16px
- Text input: full width, #1A1A1A background, rounded
- Placeholder: "Ask about your codebase... Type @ to search files."
- Below input: attachment icon, "Claude Code" dropdown, "Opus" dropdown on left
- Send button on right (arrow up, orange when has text)
```

---

## View 2: Tasks View - Kanban

**Layout:** Icon Rail (48px) + Full-width Kanban Board

### Prompt 2.1: Tasks Kanban - Layout

```
Desktop web app with dark theme. Full viewport height.

Two-panel layout:
- Left: 48px icon rail (Tasks icon is active/highlighted)
- Right: Full remaining width, background #0D0D0D

Header bar at top:
- Background #141414
- Height: 56px
- Border bottom #262626
- Left: "FloMaster" text, then "Tasks" label in white
- Center: View toggle - "Kanban" (active, white) | "List" (gray) - pill-style buttons
- Right: "+ New Task" button (orange background #F97316, white text, rounded), Settings icon
```

### Prompt 2.2: Tasks Kanban - Board

```
Below the header, create a Kanban board:

Full width, horizontal scrolling if needed
Padding: 24px
Gap between columns: 16px

Four columns, each:
- Width: 280px minimum
- Background: transparent (just a container)
- Header: Column name + count badge

Column 1 - "Backlog (2)":
- Gray header text (#A1A1AA)
- 2 task cards stacked vertically

Column 2 - "To Do (3)":
- Gray header
- 3 task cards

Column 3 - "In Progress (2)":
- White header (active column feel)
- 2 task cards, one with orange accent

Column 4 - "Done (4)":
- Gray header with checkmark icon
- 4 task cards, muted styling

Task card design:
- Background: #1A1A1A
- Border radius: 8px
- Padding: 12px 16px
- Hover: lighter background #262626, subtle shadow
- Content:
  - Task name (white, 14px, semibold): "Implement auth flow"
  - Description preview (gray, 12px, 1 line truncated)
  - Bottom row: Status dot (colored), Branch name in monospace (gray, small), "2h ago" timestamp
  - Optional: Progress bar or step indicator (●●○○)

"+ Add task" card at bottom of each column:
- Dashed border (#262626)
- Plus icon + "Add task" text (gray)
- Hover: border becomes solid
```

---

## View 3: Tasks View - List

**Layout:** Icon Rail (48px) + Full-width Task List

### Prompt 3.1: Tasks List - Layout

```
Desktop web app, dark theme, full viewport.

Same header as Kanban view but with "List" toggle active.

Below header, a full-width table/list:

Table header row:
- Background: #141414
- Columns: Status (60px), Task (flex), Branch (150px), Updated (100px)
- Text: small caps gray, 11px
- Sticky header

Table rows:
- Background: transparent, hover #1A1A1A
- Border bottom: #262626 (subtle)
- Padding: 12px 16px
- Clickable (cursor pointer)

Sample rows:
1. ● (green dot) | "Auth Feature" (white) | feature/auth-be7d (monospace gray) | 2h ago
2. ● (green dot) | "User Profile" (white) | feature/profile | 5h ago
3. ○ (gray dot) | "Bug: Login redirect" (gray) | fix/login-redirect | 1d ago
4. ○ (gray dot) | "Dashboard widgets" (gray) | feature/dashboard | 2d ago
5. ✓ (checkmark) | "Initial setup" (muted) | main | 1w ago

Status column: colored dot or checkmark
Task column: name in white (active) or gray (done/pending)
Branch column: monospace, gray
Updated column: relative time, gray, right-aligned
```

---

## View 4: Task Detail View

**Layout:** Icon Rail (48px) + Task Panel (~320px) + Step Chat (flex)

### Prompt 4.1: Task Detail - Header

```
Desktop web app, dark theme, full viewport.

Header bar (spans full width after icon rail):
- Background: #141414
- Height: 56px
- Border bottom: #262626

Header content:
- Left: "← Tasks" back link (gray, hover white)
- Center: "Auth Feature" task name + dropdown chevron (for quick switch)
- Right: "⎇ feature/auth-be7d" branch in monospace gray, Settings icon
```

### Prompt 4.2: Task Detail - Task Panel

```
Left panel after icon rail (width 320px):
- Background: #141414
- Right border: #262626
- Padding: 16px
- Scrollable

Top section:
- Status dropdown: "In Progress" with green background (#22C55E), white text, chevron
- "Merge" button: dark background (#262626), git-merge icon, white text
- Horizontal gap: 8px between buttons

Divider line (#262626)

STEPS section:
- Header: "STEPS" small caps gray, "Auto-start" toggle on right (orange when on)
- Step list (vertical):

Step 1 - Completed:
- Green checkmark in circle
- "Requirements" white text

Step 2 - Active:
- Blue filled circle
- "Technical Specification" white text
- Orange "In progress" badge
- Row has #1A1A1A background + orange left border (3px)

Step 3 - Pending:
- Gray circle outline
- "Planning" gray text

Step 4 - Conditional:
- Diamond icon (◇) gray
- "Auth Setup" gray text
- Indented children (24px left margin):
  - Gray circle, "Setup OAuth" + small "(if complex)" label
  - Gray circle, "Setup Basic" + small "(else)" label

Step 5 - Loop:
- Gray circle with ⟳ arrows
- "Implementation" gray text
- "0/3" counter badge

Step 6:
- Gray circle outline
- "Testing" gray text

Last row:
- "+ Add step" with plus icon, gray text

Divider line

CHANGES section (collapsible):
- Header: "CHANGES" gray + "(3)" badge + chevron
- Expanded:
  - 📄 src/auth.ts | +52 -3 (green/red)
  - 📄 src/config.ts | +12 -1
  - 📄 package.json | +3

Divider line

COMMITS section (collapsible):
- Header: "COMMITS" gray + "(2)" badge + chevron
- Expanded:
  - ⊙ "Add authentication logic" | a1b2c3d | 2m ago
  - ⊙ "Initial project setup" | e5f6g7h | 15m ago
```

### Prompt 4.3: Task Detail - Step Chat

```
Right panel (fills remaining width):
- Background: #0D0D0D

Chat header bar:
- Background: #141414
- Height: 48px
- Border bottom: #262626
- Left: "←" "→" navigation arrows (gray icons)
- Center: "Technical Specification" step name (white, semibold)
- Right: "● In Progress" green dot + gray text

Chat area (scrollable, padding 24px):

System message:
- Gray italic, 12px
- "System initialized with model: claude-opus-4-5-20251101"

User message (right-aligned bubble):
- Background #1F1F1F, rounded
- "Let's implement the step 'Technical Specification' in our plan"

Agent message (left, no bubble):
- "I'll start by reviewing the existing codebase..."

Tool call block:
- Background #1A1A1A, rounded
- "▼ 2 tools" header
- "Ran ls -la" with output
- "Read requirements.md"

Agent continuation:
- Markdown formatted response

Action required banner:
- Background #1A1A1A
- Orange left border (4px)
- Warning icon + "Action required" in orange
- "Agent needs your input" in gray

Input bar (fixed bottom):
- Background #141414
- Border top #262626
- Padding 16px
- Text input with placeholder "Continue working on this step..."
- Below: 📎 attachment, "Claude Code" dropdown, "Opus" dropdown
- Right: Send button (orange when has text)
```

---

## View 5: Workflows View - Browse

**Layout:** Icon Rail (48px) + Workflow List (~280px) + Preview (flex)

### Prompt 5.1: Workflows Browse - Layout

```
Desktop web app, dark theme, full viewport.

Header bar:
- Background #141414
- Height: 56px
- Border bottom #262626
- Left: "FloMaster" then "Workflows" label
- Right: "+ New Workflow" button (orange), Settings icon

Two panels below header:
- Left: 280px, background #141414, right border #262626
- Right: fills remaining, background #0D0D0D
```

### Prompt 5.2: Workflows Browse - List

```
Left panel (workflow list):

Section: "MY WORKFLOWS" (small caps gray header)
- List items (padding 12px 16px each):
  - Active: "Full SDD Workflow" - white text, #1A1A1A background, orange left border
  - "Quick Change" - gray text
  - "Bug Triage" - gray text
- Hover: #1A1A1A background

Divider

Section: "TEMPLATES" (small caps gray header)
- "SDLC Standard" - gray, with template icon
- "Code Review" - gray
- "Spec and Build" - gray
- "Feature Development" - gray

Each row shows:
- Workflow icon (or template icon for templates)
- Workflow name
- Small step count badge (e.g., "5 steps")
```

### Prompt 5.3: Workflows Browse - Preview

```
Right panel (workflow preview):

Workflow name: "Full SDD Workflow" as h2, white, bold

Description:
- Gray text, 14px
- "A complete software development lifecycle workflow with requirements gathering, technical specification, planning, implementation, and testing phases."

Steps preview (simple visual):
- Background #1A1A1A, rounded, padding 24px
- Simple flow diagram:
  [Requirements] → [Tech Spec] → [Planning]
                                    ↓
                            [Implementation]
                                    ↓
                              [Testing]
- Nodes are small rounded rectangles with text
- Arrows connect them

Metadata:
- "5 steps" • "Created 2 days ago" • "Used 12 times"
- Gray text, small

Action buttons (bottom):
- "Edit Workflow" button - outlined, white text
- "Use in Task" button - orange background, white text
```

---

## View 6: Workflows View - Edit (Build Mode)

**Layout:** Icon Rail (48px) + Full-width React Flow Canvas

### Prompt 6.1: Workflows Edit - Layout

```
Desktop web app, dark theme, full viewport.

Header bar:
- Background #141414
- Height: 56px
- Border bottom #262626
- Left: "← Workflows" back link (gray), "Full SDD Workflow" title (white, editable feel)
- Right: "Save" button (outlined), "Test Run ▶" button (orange), Settings icon

Below header: Full-width canvas
- Background: #0D0D0D with subtle dot grid pattern (like React Flow)
- This is where the node editor will be
```

### Prompt 6.2: Workflows Edit - Canvas with Nodes

```
On the canvas, show a workflow with connected nodes:

Node design:
- Background: #1A1A1A
- Border: #262626
- Border radius: 8px
- Padding: 12px 16px
- Width: ~160px
- White text for node name
- Small icon indicating type (step, condition, loop)
- Connection ports: small circles on left/right edges

Sample workflow layout:
- [Requirements] node at top-left
- Arrow connecting to [Tech Spec] node to its right
- [Tech Spec] arrow down to [Planning] node
- [Planning] arrow to [Implementation] node (with loop icon ⟳)
- [Implementation] arrow to [Testing] node

Selected node:
- Orange border (#F97316)
- Slight glow/shadow

Connection lines:
- Gray (#71717A) curved bezier lines
- Arrow heads at destination
- Animated dash when data flowing (optional)

Bottom toolbar:
- Background #141414
- Buttons: "+ Add Step", "+ Add Condition", "+ Add Loop"
- Zoom controls on right (+ / - / fit)
```

### Prompt 6.3: Workflows Edit - Properties Panel

```
When a node is selected, show a properties panel sliding in from the right:

Panel:
- Width: 320px
- Background: #141414
- Left border: #262626
- Padding: 16px

Header:
- Node name: "Technical Specification" (editable input)
- Close X button

Form fields:
- "Agent" dropdown: "Claude Code" selected
- "Model" dropdown: "Opus" selected
- "Prompt" textarea: Large, dark background, monospace
  - Placeholder or content: "Create a technical specification based on the requirements document at {artifacts_path}/requirements.md..."
- "Inputs" section: Pills showing "requirements.md"
- "Outputs" section: Input field for output file path

Bottom:
- "Delete Step" button (red outline, danger action)
```

---

## View 7: Settings View

**Layout:** Icon Rail (48px) + Categories (~250px) + Settings Form (flex)

### Prompt 7.1: Settings - Layout

```
Desktop web app, dark theme, full viewport.

Header bar:
- Background #141414
- Height: 56px
- Border bottom #262626
- Left: "FloMaster" then "Settings" label
- Right: User avatar, sign out option

Two panels below:
- Left: 250px, background #141414, right border #262626
- Right: fills remaining, background #0D0D0D
```

### Prompt 7.2: Settings - Categories

```
Left panel (categories list):

Section: "ACCOUNT" (small caps gray)
- "General" - white text, #1A1A1A background, orange left border (active)
- "API Keys" - gray text
- "Usage & Billing" - gray text

Section: "WORKSPACE" (small caps gray)
- "Projects" - gray text
- "Agents" - gray text
- "Integrations" - gray text
- "Team Members" - gray text

Section: "ADVANCED" (small caps gray)
- "Keyboard Shortcuts" - gray text
- "Data & Privacy" - gray text
- "About" - gray text

Each item: padding 12px 16px, hover #1A1A1A
```

### Prompt 7.3: Settings - Form Content

```
Right panel (settings form for "General"):

Heading: "General" h2, white, bold
Subheading: "Configure your FloMaster preferences" gray, 14px

Form sections with 24px gap between:

Section: "Appearance"
- "Theme" label (white, 14px)
- Three pill buttons: "Light" | "Dark" (selected, white bg) | "System"
- Each pill: padding 8px 16px, rounded

Section: "AI Settings"
- "Default Model" label
- Dropdown: "Claude Opus 4.5" selected, dark background, full width

- "Default Agent" label
- Dropdown: "Claude Code" selected

Section: "Workflow Behavior"
- "Auto-start next step" toggle
  - Label on left, toggle switch on right
  - Toggle is orange when on
  - Helper text below: "Automatically start the next step when the current one completes" (gray, 12px)

- "Require confirmation for merges" toggle
  - Same pattern

Section: "Notifications"
- Checkbox: "Desktop notifications" (checked)
- Checkbox: "Email notifications" (unchecked)
- Each with label on right of checkbox

Bottom:
- "Save Changes" button (orange, right-aligned) - or auto-save indicator
```

---

## View 8: Modals

### Prompt 8.1: Project Switcher Modal

```
Modal overlay:
- Background: black with 50% opacity
- Centered modal

Modal container:
- Background: #141414
- Border radius: 12px
- Width: 400px
- Max height: 500px
- Border: #262626

Header:
- "Switch Project" title (white, semibold)
- X close button (gray, top-right)
- Padding: 20px

Search:
- Full width input
- Background #1A1A1A
- Placeholder: "Search projects..."
- Search icon inside

Sections:
"RECENT" label (small caps gray)
- Project rows:
  - "● FloMaster" (green dot = current, white text, #1A1A1A background)
  - "○ Client Portal" (gray dot, gray text)
  - "○ Internal Tools" (gray)

"ALL PROJECTS" label
- More project rows (scrollable)

Footer:
- "+ Create Project" link (orange text)
- "Cancel" button (gray outline)
```

### Prompt 8.2: New Task Modal

```
Modal overlay with centered modal:
- Width: 500px
- Background: #141414
- Border radius: 12px

Header:
- "New Task" title
- X close button

Form (padding 24px):

"Task Name" label
- Text input, full width, background #1A1A1A
- Placeholder: "What do you want to build?"

"Description" label
- Textarea, 3 rows, background #1A1A1A
- Placeholder: "Describe your task... Use @ to reference files"

"Workflow Template" label
- Dropdown/select with options:
  - "Full SDD Workflow" (selected by default)
  - "Quick Change"
  - "Bug Fix"
  - "Custom..."

"Git Branch" section:
- Checkbox: "Create new branch" (checked)
- When checked, shows: Branch name input with auto-generated name "feature/task-xxxx"
- "from main ▼" branch selector

Footer:
- "Cancel" button (gray outline)
- "Create" button (dark)
- "Create & Run" button (orange) - primary action
```

---

## State Variations

### Variation A: Empty State (No Selection)

```
For Chat view with no session selected, or Task Detail with no step selected:

In the main content area, show:
- Centered vertically and horizontally
- Large icon (chat bubble or workflow icon), 48px, gray
- "Select a session to continue" or "Select a step to view conversation"
- Smaller gray text below with helpful hint
```

### Variation B: Loading/Running State

```
In chat area, show running state:

After messages, at bottom:
- Animated spinner icon (orange)
- "Running: Analyzing codebase..." text (gray)
- Pulsing animation
```

### Variation C: Error State

```
Error banner in chat:
- Background: #1A1A1A
- Left border: 4px solid red (#EF4444)
- Red warning icon
- "Step failed" in red text
- Error message in gray
- "Retry" button (red outline), "Skip" button (gray outline)
```

### Variation D: Step Completed

```
Step row changes:
- Blue circle becomes green checkmark
- Remove "In progress" badge
- Remove highlighted background
- Optional: "✓ Completed 5m ago" subtle text
```

---

## Tips for Best Results

1. **Build the Icon Rail first** - it's shared across all views
2. **Start with layout shells** before adding content
3. **Be specific about colors** - use exact hex codes
4. **Use iterative prompts** - don't try everything at once
5. **Review after each prompt** before continuing
6. **Quick adjustments**: "Make the X bigger/smaller/darker/more orange"
7. **Export to Figma** for final polish

---

## Visual Reference: All Layouts

### Chat View
```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│ FM │ Sessions             │ Chat                                    │
├────┼──────────────────────┼─────────────────────────────────────────┤
│ 💬 │ ● Auth help          │ User: How does auth work?               │
│━━━━│ ○ API design         │                                         │
│ 📋 │ ○ Bug investigation  │ Agent: Based on my analysis...          │
│ 🔀 │                      │                                         │
│    │ + New session        │ ▼ 3 tools                               │
│ ⚙️ │                      │ [Input bar]                             │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

### Tasks View - Kanban
```
┌────┬────────────────────────────────────────────────────────────────────┐
│ FM │ Tasks    [+ New Task]    [Kanban | List]                      [⚙️] │
├────┼────────────────────────────────────────────────────────────────────┤
│ 💬 │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│ 📋 │  │ Backlog  │  │ To Do    │  │ Progress │  │ Done     │           │
│━━━━│  │ [Card]   │  │ [Card]   │  │ [Card]   │  │ [Card]   │           │
│ 🔀 │  │ [Card]   │  │ [Card]   │  │ [Card]   │  │          │           │
│ ⚙️ │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└────┴────────────────────────────────────────────────────────────────────┘
```

### Task Detail View
```
┌────┬──────────────────────────────────────────────────────────────────────┐
│ FM │ ← Tasks    Auth Feature ▼    ⎇ feature/auth-be7d               [⚙️] │
├────┼────────────────────────────────┬─────────────────────────────────────┤
│ 💬 │  [In Progress ▼] [Merge]       │  ← → Technical Specification        │
│ 📋 │  ────────────────────────      │  ● In Progress                      │
│━━━━│  STEPS                         │  ─────────────────────────────────  │
│ 🔀 │  ✓ Requirements                │  Agent: I'll analyze...             │
│    │  ● Tech Spec    ← selected     │  ▼ 2 tools                          │
│    │  ○ Planning                    │  ─────────────────────────────────  │
│    │  + Add step                    │  ⚠ Action required                  │
│    │  CHANGES (3)                ▼  │  ─────────────────────────────────  │
│ ⚙️ │  COMMITS (2)                ▼  │  [Input bar]                        │
└────┴────────────────────────────────┴─────────────────────────────────────┘
```

### Workflows View - Browse
```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│ FM │ MY WORKFLOWS         │ Full SDD Workflow                       │
├────┼──────────────────────┼─────────────────────────────────────────┤
│ 💬 │ ● Full SDD Workflow  │ A complete SDLC workflow...             │
│ 📋 │ ○ Quick Change       │                                         │
│ 🔀 │ ○ Bug Triage         │ ┌─────────────────────────────────────┐ │
│━━━━│ ──────────────────── │ │ [Req]→[Spec]→[Plan]→[Impl]→[Test]  │ │
│    │ TEMPLATES            │ └─────────────────────────────────────┘ │
│    │ ○ SDLC Standard      │                                         │
│ ⚙️ │ ○ Code Review        │ [Edit Workflow] [Use in Task]           │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

### Workflows View - Edit
```
┌────┬────────────────────────────────────────────────────────────────────┐
│ FM │ ← Workflows    Full SDD Workflow    [Save] [Test Run ▶]       [⚙️] │
├────┼────────────────────────────────────────────────────────────────────┤
│ 💬 │                                                                    │
│ 📋 │        [Requirements] ──────→ [Tech Spec]                          │
│ 🔀 │               │                     │                              │
│━━━━│               ▼                     ▼                              │
│    │        [Planning] ──────────→ [Implementation]                     │
│    │                                     │                              │
│ ⚙️ │                                [Testing]                           │
│    │  [+ Add Step]  [+ Add Condition]  [+ Add Loop]     [Zoom: + - ⊡]  │
└────┴────────────────────────────────────────────────────────────────────┘
```

### Settings View
```
┌────┬──────────────────────┬─────────────────────────────────────────┐
│ FM │ ACCOUNT              │ General                                 │
├────┼──────────────────────┼─────────────────────────────────────────┤
│ 💬 │ ● General            │ Theme: [Light] [Dark] [System]          │
│ 📋 │ ○ API Keys           │                                         │
│ 🔀 │ ○ Usage & Billing    │ Default Model: [Claude Opus 4.5 ▼]      │
│    │ ──────────────────── │                                         │
│ ⚙️ │ WORKSPACE            │ Auto-start steps: [Toggle]              │
│━━━━│ ○ Projects           │                                         │
│    │ ○ Agents             │ Notifications: [✓] Desktop              │
│    │ ○ Integrations       │                                         │
└────┴──────────────────────┴─────────────────────────────────────────┘
```

---

## After Stitch: Next Steps

1. **Export to Figma** for refinement
2. **Extract component patterns** for implementation
3. **Document component specifications** (sizes, spacing, states)
4. **Map to React components** in `@flomaster/ui`
5. **Create Storybook stories** for each component

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-30 | Initial Task Detail view prompts |
| 2.0 | 2025-12-30 | Complete rewrite: Added all views (Chat, Tasks, Workflows, Settings), modals, state variations |
