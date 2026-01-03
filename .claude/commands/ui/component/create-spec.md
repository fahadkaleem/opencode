---
description: Create a component specification interactively
model: opus
---

# Create Component Spec

Interactively gathers requirements and generates a component specification file at `.ai/specs/components/[component-name].md`.

## Pre-requisites

- Do NOT read `docs/THEMING.md` until Step 3
- Do NOT read `.ai/templates/COMPONENT_SPEC_TEMPLATE.md` until Step 4

## Initial Context Gathering

**If invoked with component name as parameter:**

<procedure>
1. Extract component name from parameter
2. Ask user where the component belongs (primitive or feature)
3. Proceed to Setup
</procedure>

**If invoked without parameters:**

<message>
I'll help you create a component specification by gathering requirements interactively.

**What component do you want to spec?**

Please provide:
- Component name (e.g., "Button", "MessageBubble", "ToolCallCard")
- Brief description of what it does
</message>

Wait for user response, then proceed to ask about location.

## Setup

After receiving component name and determining location, create todos using TodoWrite:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Gather [ComponentName] requirements | pending |
| 2 | Define [ComponentName] variants and states | pending |
| 3 | Map [ComponentName] tokens | pending |
| 4 | Generate [ComponentName] spec | pending |

Proceed to Step 1.

## Step 1: Gather Core Requirements

Mark todo "Gather [ComponentName] requirements" as `in_progress`.

<procedure>
1. Ask about component location:
</procedure>

<message>
**Where does this component belong?**

1. **Primitive** (`src/components/ui/`) - Reusable building block like Button, Input, Badge
2. **Feature** (`src/features/[feature]/components/`) - Feature-specific like MessageBubble, ToolCallCard

Which type is [ComponentName]?
</message>

<procedure>
2. If feature component, ask which feature (chat, agent, flow, etc.)

3. Ask about the user experience:
</procedure>

<message>
**Describe the user experience:**

- What does the user SEE? (shape, colors, content)
- What does the user DO? (click, type, hover, drag)
- What FEEDBACK does the user get? (loading, success, error)
</message>

<procedure>
4. Ask about props:
</procedure>

<message>
**What props does [ComponentName] need?**

Think about:
- Content: What gets displayed? (children, label, title, content)
- Variants: Does it have different visual styles? (variant, size, color)
- State: Can it be disabled? Loading? Selected?
- Events: What callbacks? (onClick, onChange, onSubmit)

List the props you need, I'll help structure them.
</message>

<procedure>
5. Capture responses and summarize understanding
</procedure>

Mark todo "Gather [ComponentName] requirements" as `completed`. Proceed to Step 2.

## Step 2: Define Variants and States

Mark todo "Define [ComponentName] variants and states" as `in_progress`.

<procedure>
1. Based on props from Step 1, identify variant props (those with multiple visual options)

2. For each variant prop, ask:
</procedure>

<message>
**Let's define the `[variant-prop]` values:**

For each value, I need:
- **Name**: What to call it (e.g., "default", "secondary", "destructive")
- **Visual**: What it looks like (colors, borders, etc.)
- **Use case**: When to use this variant

What values should `[variant-prop]` have?
</message>

<procedure>
3. Define all interactive states:
</procedure>

<message>
**Let's define the states [ComponentName] can be in:**

| State | Trigger | Visual Change | Behavior Change |
|-------|---------|---------------|-----------------|
| Default | - | Normal appearance | Normal interaction |
| Hover | Mouse over | ? | ? |
| Focus | Tab/click | ? | ? |
| Disabled | disabled=true | ? | ? |
| Loading | isLoading=true | ? | ? |

Fill in what changes for each state, or tell me which states don't apply.
</message>

<procedure>
4. Ask about mockup/visual representation:
</procedure>

<message>
**Can you describe or sketch what [ComponentName] looks like?**

For example:
```
┌─────────────────┐
│   Button Text   │
└─────────────────┘
```

This helps ensure we're aligned on the visual design.
</message>

Mark todo "Define [ComponentName] variants and states" as `completed`. Proceed to Step 3.

## Step 3: Map Tokens

Mark todo "Map [ComponentName] tokens" as `in_progress`.

**Read:** `docs/THEMING.md`

<procedure>
1. Based on the visual descriptions from Steps 1-2, identify which semantic tokens apply

2. Present token mapping to user for confirmation:
</procedure>

<message>
**Based on your descriptions, here are the semantic tokens I recommend:**

| Element | Token | Description |
|---------|-------|-------------|
| [element] | [--token-name] | [what it styles] |

Does this look right? Any adjustments needed?
</message>

<procedure>
3. Adjust based on feedback
</procedure>

Mark todo "Map [ComponentName] tokens" as `completed`. Proceed to Step 4.

## Step 4: Generate Spec

Mark todo "Generate [ComponentName] spec" as `in_progress`.

**Read:** `.ai/templates/COMPONENT_SPEC_TEMPLATE.md`

<procedure>
1. Using the spec guideline and all gathered information, generate the complete spec

2. Write the spec file to `.ai/specs/components/[component-name].md` (kebab-case filename)

3. Use the exact structure from SPEC_TEMPLATE.md:
   - Title and description
   - Overview
   - Location
   - User Experience (Visual, Interaction, Feedback)
   - Props table
   - Variants sections
   - States table
   - Tokens table
   - Mockup
   - Examples
</procedure>

<validate>
Verify spec file was created:
```bash
cat .ai/specs/components/[component-name].md
```

Verify against SPEC_TEMPLATE.md checklist:
- [ ] Title is PascalCase component name
- [ ] Overview covers what, why, when
- [ ] Location specifies type, path, extends
- [ ] User Experience has visual, interaction, feedback
- [ ] Props table is complete
- [ ] Variants have subsections per variant prop
- [ ] States table covers all interactive states
- [ ] Tokens table maps elements to semantic tokens
- [ ] Mockup provides ASCII visual
- [ ] No implementation details (no code)
- [ ] No Tailwind classes (descriptions + tokens only)
</validate>

Mark todo "Generate [ComponentName] spec" as `completed`.

<message>
✓ Spec created successfully!

**Location:** `.ai/specs/components/[component-name].md`

**Next steps:**
1. Review the spec and let me know if any changes are needed
2. Run `/ui:component:create [component-name]` to generate the component

Would you like to:
- Review and refine the spec
- Create the component now
- Create another spec
</message>

## Guidelines

**Do:**
- Ask user directly about component location (primitive vs feature)
- Ask clarifying questions when descriptions are vague
- Suggest common patterns based on component type
- Validate token choices against THEMING.md
- Use tables for structured data

**Don't:**
- Include implementation details in the spec
- Use Tailwind classes - use visual descriptions + token names
- Skip any section of the spec template
- Assume props/variants without asking

**When:**
- WHEN user description is vague → Ask for specific visual/behavior details
- WHEN component is similar to existing patterns → Mention the pattern and ask if it applies
- WHEN token mapping is unclear → Show THEMING.md options and ask user to choose
