---
description:
  Refine existing implementation plans with thorough research and updates
model: opus
---

# Plan Refinement

You are tasked with updating existing implementation plans based on user
feedback. Your role is to be skeptical, thorough, and ensure changes are
grounded in actual codebase reality.

## Step 1: Detect Task ID and Load Context

**FIRST STEP:** Determine the ticket ID for this task.

<procedure>
1. Use the SlashCommand tool to execute `/task:detect-task-id`

2.  The command will output the task ID in this format:

    ```
    Task: AL-1234
    Directory: .alfred/tasks/AL-1234/
    ```

3.  Extract the task ID from the output (e.g., AL-1234)

4.  Use this task ID as TICKET_ID in all subsequent steps

5.  The task directory is: `.alfred/tasks/${TICKET_ID}/`

6.  Plan path is `.alfred/tasks/${TICKET_ID}/plan.md`

7.  **REQUIRED:** Check that `.alfred/tasks/${TICKET_ID}/plan.md` exists:
    - If missing, show error and stop: ``` ERROR: Implementation plan not found!
      Required file: .alfred/tasks/${TICKET_ID}/plan.md

           Please run: alfred run plan --task ${TICKET_ID}
           ```

      </procedure>

## Initial Input Handling

**If NO feedback provided:**

<message>
I've found the plan at .alfred/tasks/${TICKET_ID}/plan.md

What changes would you like to make?

Examples:

- "Add a phase for migration handling"
- "Update the success criteria to include performance tests"
- "Adjust the scope to exclude feature X"
- "Split Phase 2 into two separate phases" </message>

Wait for user input.

**If feedback provided:**

- Proceed immediately to Step 2

## Step 2: Read and Understand Current Plan

<procedure>
1. Read the existing plan file COMPLETELY:
   - Use Read tool WITHOUT limit or offset parameters
   - Understand current structure, phases, and scope
   - Note success criteria and implementation approach

2. Understand the requested changes:
   - Parse what user wants to add, modify, or remove
   - Identify if changes require codebase research
   - Determine scope of the update </procedure>

## Step 3: Research If Needed

**IMPORTANT:** Only spawn research tasks if changes require new technical
understanding.

If user feedback requires understanding new code patterns or validating
assumptions:

<procedure>
1. Create research todo list using TodoWrite

2. Spawn parallel sub-tasks for research:
   - Use appropriate agent for each research type:
     - file-assistant: Find relevant files
     - code-assistant: Understand implementation details
     - pattern-assistant: Find similar patterns
     - doc-finder: Find related research or decisions
     - doc-assistant: Extract insights from documents

3. Be EXTREMELY specific about directories:
   - Include full path context in prompts
   - Specify exact module paths (e.g., `routing_simulator/lib/algorithms/`)
   - Be clear about whether changes are in source code or tests

4. Read any new files identified by research FULLY into main context

5. Wait for ALL sub-tasks to complete before proceeding </procedure>

## Step 4: Present Understanding and Approach

Before making changes, confirm your understanding:

<output_format> Based on your feedback, I understand you want to:

- [Change 1 with specific detail]
- [Change 2 with specific detail]

My research found:

- [Relevant code pattern or constraint]
- [Important discovery affecting the change]

I plan to update the plan by:

1. [Specific modification to make]
2. [Another modification]

Does this align with your intent? </output_format>

Get user confirmation before proceeding.

## Step 5: Update the Plan

<procedure>
1. Make focused, precise edits to existing plan:
   - Use Edit tool for surgical changes
   - Maintain existing structure unless explicitly changing it
   - Keep all file:line references accurate
   - Update success criteria if needed

2. Ensure consistency:
   - If adding new phase, follow existing pattern
   - If modifying scope, update "What We're NOT Doing" section
   - If changing approach, update "Implementation Approach" section
   - Maintain distinction between automated vs manual success criteria

3. Preserve quality standards:
   - Include specific file paths and line numbers for new content
   - Write measurable success criteria
   - Use `make` commands for automated verification
   - Keep language clear and actionable </procedure>

## Step 6: Sync and Review

<procedure>
1. Present changes made to user </procedure>

<output_format> I've updated the plan at `.alfred/tasks/${TICKET_ID}/plan.md`

Changes made:

- [Specific change 1]
- [Specific change 2]

The updated plan now:

- [Key improvement]
- [Another improvement]

Would you like any further adjustments? </output_format>

<procedure>
3. Be ready to iterate further based on feedback
</procedure>

## Important Guidelines

**Be Skeptical:**

- Don't blindly accept change requests that seem problematic
- Question vague feedback - ask for clarification
- Verify technical feasibility with code research
- Point out potential conflicts with existing plan phases

**Be Surgical:**

- Make precise edits, not wholesale rewrites
- Preserve good content that doesn't need changing
- Only research what's necessary for specific changes
- Don't over-engineer the updates

**Be Thorough:**

- Read entire existing plan before making changes
- Research code patterns if changes require new technical understanding
- Ensure updated sections maintain quality standards
- Verify success criteria are still measurable

**Be Interactive:**

- Confirm understanding before making changes
- Show what you plan to change before doing it
- Allow course corrections
- Don't disappear into research without communicating

**Track Progress:**

- Use TodoWrite to track update tasks if complex
- Update todos as you complete research
- Mark tasks complete when done

**No Open Questions:**

- If requested change raises questions, ASK
- Research or get clarification immediately
- DO NOT update plan with unresolved questions
- Every change must be complete and actionable

## Success Criteria Guidelines

When updating success criteria, maintain the two-category structure:

**Automated Verification** (executable by agents):

- Commands that can be run: `make test`, `npm run lint`
- Prefer `make` commands over manual command chains
- Specific files that should exist
- Code compilation and type checking

**Manual Verification** (requires human testing):

- UI/UX functionality
- Performance under real conditions
- Edge cases hard to automate
- User acceptance criteria

## Sub-task Spawning Best Practices

When spawning research sub-tasks:

**Only spawn if truly needed** - don't research for simple changes.

**Spawn multiple tasks in parallel** for efficiency.

**Each task should be focused** on a specific area.

**Provide detailed instructions** including:

- Exactly what to search for
- Which directories to focus on
- What information to extract
- Expected output format

**Request specific file:line references** in responses.

**Wait for all tasks to complete** before synthesizing.

**Verify sub-task results** - if something seems off, spawn follow-up tasks.

## Example Interactions

<example>
**Scenario 1: User provides everything upfront**

User: /dev/refine AL-1234 - add phase for error handling

# (On branch: feature/AL-1234-add-feature)

Assistant: [Reads plan, researches error handling patterns, updates plan]

I've added a new Phase 3 for error handling that includes:

- Adding error boundaries in UI components
- Implementing retry logic for API calls
- Adding error logging and monitoring

The updated plan is ready for review. </example>

<example>
**Scenario 2: User provides just ticket ID**

User: /dev/refine

# (On branch: feature/AL-1234-add-feature)

Assistant: I've found the plan. What changes would you like to make?

User: Split Phase 2 into two phases - one for backend, one for frontend

Assistant: I understand you want to separate the backend and frontend work into
distinct phases. Let me read the current Phase 2 to understand how to split it
properly.

[Reads plan and analyzes Phase 2]

I'll split Phase 2 as follows:

- Phase 2: Backend Implementation - API endpoints, business logic, database
  changes
- Phase 3: Frontend Implementation - UI components, state management,
  integration

This will allow backend work to be completed and tested before frontend begins.
Does this split make sense?

User: Yes, that's perfect.

Assistant: [Makes the changes]

I've updated the plan. Phase 2 now focuses on backend with its own success
criteria, and the new Phase 3 handles all frontend work. Both phases have
automated and manual verification steps. </example>

<example>
**Scenario 3: User provides no arguments**

User: /dev/refine

Assistant: I'll help you refine an existing implementation plan.

Which plan would you like to update? Please provide the path to the plan file.

User: Added more specific success criteria

Assistant: I've found the plan. What changes would you like to make?

User: Add more specific success criteria

Assistant: I'll review the current success criteria and make them more specific.
Let me read the plan first.

[Reads plan]

I see the current success criteria are somewhat generic. I'll update them to be
more specific and measurable. For example, instead of "tests pass", I'll specify
which test suites and expected coverage thresholds.

[Makes updates]

I've updated all phases with more specific success criteria. Each automated
check now includes the exact command to run and what "passing" means. Each
manual check now describes the specific behavior to verify. </example>
