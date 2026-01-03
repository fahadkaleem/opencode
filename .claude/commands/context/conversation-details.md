---
description: Generate a comprehensive project status report from conversation context
model: opus
---

# Conversation Details and Project Status Report

You are tasked with generating a comprehensive, clean, and detailed write-up of the current project status by reflecting on the entire conversation. This report is intended for **junior engineers** who need to understand exactly what was done, what decisions were made, and what remains to be completed.

## CRITICAL: Report Quality Standards

**Your report MUST be:**

- **Clean and coherent** - Present information as if the project followed a straight path from start to current state
- **Exclude reversed decisions** - If something was decided and later changed, ONLY include the final decision
- **Extremely detailed** - Junior engineers should understand everything without asking questions
- **Precise** - Use exact file paths, task IDs, and technical terms
- **Actionable** - Clearly state what's done, what's pending, and what needs discussion

**Your report MUST NOT:**

- Include back-and-forth deliberations that were resolved
- Show decision flip-flops (only final decisions)
- Leave ambiguity about current state
- Use vague language like "we might" or "perhaps"

## Step 1: Analyze Conversation Context

<procedure>
1. Review the ENTIRE conversation from start to finish

2. Identify the following:
   - **Project goal**: What are we ultimately trying to accomplish?
   - **Starting point**: What existed before this conversation?
   - **Key decisions made**: Architecture choices, naming, patterns (ONLY FINAL decisions)
   - **Tasks created**: Any task files, plans, or work items
   - **Work completed**: What has been implemented and verified?
   - **Work in progress**: What is currently being worked on?
   - **Work pending**: What remains to be done?
   - **Blockers/Discussions needed**: What requires further discussion before proceeding?

3. For any decision that changed during the conversation:
   - ONLY report the final decision
   - Present it as if it was always the intended approach
   - Do NOT mention that alternatives were considered

4. Identify all file paths, task IDs, and technical artifacts mentioned
</procedure>

## Step 2: Structure the Report

Generate a comprehensive report using this structure:

<template>
```markdown
# [Project Name]: Project Status Report

## Executive Summary

[2-3 sentences describing what this project is and its current state]

---

## Background

### What is [Project Name]?

[Clear explanation of the project purpose and goals]

### Context

[Relevant context: repositories involved, why this work is being done, any important background]

---

## Architecture and Key Decisions

### [Decision Category 1]

[Explain the architectural decision and why it was made]

### [Decision Category 2]

[Continue for all major decisions]

---

## Task Breakdown

We divided the work into discrete, self-contained tasks:

### TASK-XX: [Task Name]

**Status:** ✅ COMPLETE | ⏳ IN PROGRESS | 📋 PENDING | ⚠️ NEEDS DISCUSSION

**What it does:**
[Clear description of what this task accomplishes]

**Key changes:**
- [Change 1]
- [Change 2]

**Task file:** `[path to task.md]`

[Repeat for each task]

---

## Current State

### What's Working

1. [Working item 1]
2. [Working item 2]

### What's Not Working / Known Issues

1. [Issue 1 - with context on severity]
2. [Issue 2]

### Verification Status

| Check | Status | Command/Method |
|-------|--------|----------------|
| [Check 1] | ✅/❌ | `command` |

---

## File Structure

[Show relevant directory structure with annotations]

```
path/to/files/
├── directory/          # Description
│   ├── file.ts         # What this file does
```

---

## What's Next

### Pending Tasks

| Task | Description | Blocker |
|------|-------------|---------|
| TASK-XX | [Description] | [Any blocker or "Ready"] |

### Decisions Needed

Before proceeding, the following need to be resolved:

1. **[Decision topic]**: [What needs to be decided and why]

---

## How to Continue

### For Developers

1. Read all task files in order:
   - `[path/to/TASK-01/task.md]`
   - `[path/to/TASK-02/task.md]`
   - [etc.]

2. Current work is on: **TASK-XX**

3. [Any specific instructions for picking up the work]

### Commands Reference

```bash
# [Relevant commands for the project]
```

---

## Summary Table

| Task | Status | Description |
|------|--------|-------------|
| TASK-01 | ✅ | [Brief description] |
| TASK-02 | ✅ | [Brief description] |
| TASK-XX | ⏳ | [Brief description] |

**Current blocker:** [State the current blocker or "None - ready to proceed"]

---

*This report reflects the project state as of this conversation. Please read the individual task files for detailed implementation instructions.*
```
</template>

## Step 3: Generate the Report

<procedure>
1. Fill in the template with information gathered from the conversation

2. Ensure every section is complete - do not leave placeholders

3. Double-check that:
   - All file paths are correct
   - All task statuses are accurate
   - No reversed decisions are included
   - Technical details are precise
   - A junior engineer could understand and continue the work

4. Present the report in a single, well-formatted markdown block
</procedure>

## Important Guidelines

**Be Comprehensive:**
- Include ALL relevant technical details
- Document file paths with exact locations
- Explain WHY decisions were made, not just WHAT

**Be Clear:**
- Use simple language where possible
- Define technical terms when first used
- Use tables for structured information

**Be Accurate:**
- Verify task statuses match conversation
- Ensure file paths are correct
- Double-check command syntax

**Be Actionable:**
- Make it clear what the next step is
- Highlight any blockers or decisions needed
- Point readers to the right files

**Target Audience:**
- Junior engineers who weren't part of this conversation
- They should be able to pick up and continue the work
- They should understand the full context without asking questions

## Example Output Characteristics

A good report:
- Reads like a technical design document
- Presents decisions as intentional, not evolved
- Has clear "done" vs "todo" separation
- Includes exact paths and commands
- Tells the reader exactly where to start

A bad report:
- Shows the messy process of decision-making
- Has vague status like "mostly done"
- Missing file paths or uses relative terms
- Leaves the reader unsure of next steps
- Requires asking follow-up questions

## When to Use This Command

Use `/context:conversation-details` when:
- Ending a long planning/implementation session
- Handing off work to another engineer
- Need to document project state for later reference
- Want a clean summary without conversation noise
- Onboarding someone to continue the work
