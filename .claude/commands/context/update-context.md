---
description: Update CONTEXT.md with latest project state from conversation
model: opus
---

# Update CONTEXT.md from Conversation

You are tasked with updating the project's `CONTEXT.md` file to reflect the current state of the project based on this conversation. The goal is to maintain CONTEXT.md as the **single source of truth** for onboarding engineers.

## CRITICAL: Document Quality Standards

**CONTEXT.md MUST:**

- Read as the **current truth**, not a history of changes
- Present decisions as if they were always the intended approach
- Point to code files (e.g., `task.ts:43-139`) instead of duplicating code
- Be precise with file paths, type names, and technical terms
- Enable a new engineer to understand the project without asking questions

**CONTEXT.md MUST NOT:**

- Show decision evolution or flip-flops
- Include "we changed X to Y" language
- Duplicate code that exists in files (reference instead)
- Have outdated information from superseded decisions
- Use vague language like "we might" or "perhaps"

---

## Step 1: Read Current CONTEXT.md

<procedure>
1. Read the current CONTEXT.md file at the project root
2. Understand its current structure and sections
3. Note the Table of Contents for later update
</procedure>

---

## Step 2: Analyze Conversation for Updates

<procedure>
1. Review the ENTIRE conversation from start to finish

2. Identify changes that need to be reflected in CONTEXT.md:

   **Decisions Made or Changed:**
   - New architectural decisions
   - Changed approaches (only capture FINAL decision)
   - Naming conventions settled
   - Type definitions finalized

   **Task Progress:**
   - Tasks completed
   - Tasks started
   - New tasks identified
   - Task blockers resolved

   **New Content:**
   - New sections that should be added
   - New patterns discovered
   - New gotchas identified
   - New glossary terms

   **Superseded Content:**
   - Decisions that were reversed (remove old, add new)
   - Approaches that were abandoned
   - Types that were changed
   - Patterns that were updated

3. For EVERY change, determine:
   - WHERE in CONTEXT.md it belongs
   - WHETHER it replaces existing content or adds new
   - HOW to phrase it as "current truth" (not "we changed to")
</procedure>

---

## Step 3: Apply Updates

### Update Rules

**Rule 1: Replace, Don't Annotate**
```markdown
# WRONG - Shows history
The field was renamed from `abort` to `signal` for consistency.

# CORRECT - Current truth only
The field is named `signal` for AbortSignal propagation.
```

**Rule 2: Reference Files, Don't Duplicate**
```markdown
# WRONG - Duplicates code
The AgentConfig type looks like:
```typescript
interface AgentConfig {
  agentType: string
  model?: string
  // ... 20 more lines
}
```

# CORRECT - References file
The `AgentConfig` type is defined in `src/orchestrator/types.ts:382-415`.
Key fields: `agentType`, `model` (string format), `systemPrompt`, `tools`.
```

**Rule 3: Update Task Status Atomically**
```markdown
# Update the status emoji and description together
### TASK-07: Proper Agent Integration
**Status**: ✅ Complete  # Was: 📋 In Progress

# Also update the Summary Table at the bottom
```

**Rule 4: Keep Table of Contents Current**
- Add entries for new sections
- Remove entries for deleted sections
- Maintain correct numbering

**Rule 5: Update Decision Log**
- Add new decisions with date
- Do NOT remove old decisions (they're historical record)
- Format: `### YYYY-MM-DD: [Topic]`

---

## Step 4: Specific Section Updates

### For "Current State" Section
```markdown
### What Works
- Update based on verified functionality
- Add new working features
- Remove items that broke (update to "What's Broken")

### What's Broken / Missing
- Update based on current issues
- Remove items that were fixed
- Add newly discovered issues
```

### For Task Timeline
```markdown
# When a task completes:
### TASK-XX: [Name]
**Status**: ✅ Complete  # Update from 📋 or ⏳

**What**: [Keep existing description]

**Reference**: `.alfred/tasks/TASK-XX/task.md`  # Point to file, don't duplicate

# When a task starts:
**Status**: ⏳ In Progress
```

### For Type Definitions
```markdown
# Don't inline full types. Instead:
**Type Changes in TASK-XX**:
- `ExecutorContext`: Added `signal?: AbortSignal` - see `registry/types.ts`
- `AgentConfig.model`: Now string format - see `types.ts:402-404`
```

### For New Patterns
```markdown
# Point to canonical implementation
### Pattern N: [Name]

[Brief description of what the pattern does]

**Reference**: `src/path/to/file.ts:LINE-LINE`
```

### For Glossary
```markdown
# Add new terms in alphabetical order
| **New Term** | Definition pointing to relevant code/docs |
```

---

## Step 5: Quality Checklist

Before finalizing updates, verify:

- [ ] No "we changed" or "was previously" language
- [ ] All file references use format `path/file.ts:LINE` or `path/file.ts`
- [ ] Table of Contents matches actual sections
- [ ] Task statuses match conversation outcome
- [ ] No duplicated code blocks (references only)
- [ ] Decision Log has new entries (with dates)
- [ ] Glossary terms are alphabetized
- [ ] A new engineer could understand everything
- [ ] No outdated information remains

---

## Step 6: Apply Edits

<procedure>
1. Use the Edit tool to make targeted changes to CONTEXT.md
2. Make multiple small edits rather than rewriting entire file
3. After edits, verify Table of Contents is accurate
4. Update "Last Updated" date in header
5. Update "Current Phase" if task progress changed
</procedure>

---

## Output Format

After updating CONTEXT.md, provide a summary:

```markdown
## CONTEXT.md Updated

### Sections Modified
- [Section name]: [What was changed]

### Sections Added
- [New section name]: [Brief description]

### Content Removed
- [What was removed and why (superseded by X)]

### Task Status Changes
| Task | Old Status | New Status |
|------|------------|------------|
| TASK-XX | 📋 | ✅ |

### New Decision Log Entries
- [Date]: [Decision topic]

### Verification
- [ ] Read through updated CONTEXT.md
- [ ] Confirm no historical language
- [ ] Confirm file references are correct
```

---

## When to Use This Command

Use `/context:update-context` when:
- After completing significant work in a conversation
- After making architectural decisions
- After task status changes
- After discovering new patterns or gotchas
- Before ending a long implementation session
- When CONTEXT.md feels out of date

---

## Important: What NOT to Update

**Do NOT update:**
- The basic project description (unless fundamentally changed)
- Historical decision log entries (add new, don't modify old)
- File paths that haven't changed
- Working examples that are still accurate

**DO update:**
- Task statuses based on actual progress
- "Current State" based on verified reality
- Type definitions when they change
- Patterns when they're refined
- Gotchas when new ones are discovered

---

## Example Transformation

**Conversation excerpt:**
> "We decided to use `signal` instead of `abort` for the AbortSignal field name"

**Current CONTEXT.md (outdated):**
```markdown
// ExecutorContext - add abort signal
interface ExecutorContext {
  abort?: AbortSignal  // NEW - for cancellation
}
```

**Updated CONTEXT.md (correct):**
```markdown
// ExecutorContext - add signal for cancellation
interface ExecutorContext {
  signal?: AbortSignal  // For workflow cancellation
}
```

Note: No mention of "changed from abort" - just the current truth.
