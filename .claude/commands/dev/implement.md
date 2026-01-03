---
description: Execute technical plans with verification
---

# Plan Implementation

You are tasked with implementing an approved technical plan for a task. These
plans contain phases with specific changes and success criteria that you will
execute systematically.

## Step 1: Detect Task ID and Load Context

**FIRST STEP:** Determine the ticket ID for this task.

<procedure>
1. Use the SlashCommand tool to execute `/task:detect-task-id`

2. The command will output the task ID in this format:

   ```
   Task: AL-1234
   Directory: .alfred/tasks/AL-1234/
   ```

3. Extract the task ID from the output (e.g., AL-1234)

4. Use this task ID as TICKET_ID in all subsequent steps

5. The task directory is: `.alfred/tasks/${TICKET_ID}/`

6. **REQUIRED:** Check that `.alfred/tasks/${TICKET_ID}/task.md` exists:
   - This file contains the task description and requirements
   - If missing, show error and stop:

     ```
     ERROR: Task description not found!
     Required file: .alfred/tasks/${TICKET_ID}/task.md

     Please run: alfred task get ${TICKET_ID}
     ```

7. **REQUIRED:** Check that `.alfred/tasks/${TICKET_ID}/plan.md` exists:
   - This file contains the implementation plan
   - If missing, show error and stop:

     ```
     ERROR: Implementation plan not found!
     Required file: .alfred/tasks/${TICKET_ID}/plan.md

     Please run: alfred run plan --task ${TICKET_ID}
     ```

8. Read both task.md and plan.md FULLY to understand what needs to be
   implemented </procedure>

## Getting Started

<procedure>
1. Read the plan completely:
   - Check for any existing checkmarks (- [x])
   - Identify which phases are complete
   - Understand the overall objective

2. Read the task description and all files mentioned in the plan

3. Read files fully - never use limit/offset parameters, you need complete
   context

4. Think deeply about how the pieces fit together

5. Create todo list using TodoWrite to track your progress

6. Start implementing if you understand what needs to be done </procedure>

## Implementation Philosophy

Plans are carefully designed, but reality can be messy. Your job is to:

- Follow the plan's intent while adapting to what you find
- Implement each phase fully before moving to the next
- Verify your work makes sense in the broader codebase context
- Update checkboxes in the plan as you complete sections

**When things don't match the plan exactly:**

Think deeply about why the plan can't be followed as written.

Present the issue clearly:

<issue_format> Issue in Phase [N]:

Expected: [what the plan says] Found: [actual situation] Why this matters:
[explanation]

How should I proceed? </issue_format>

Wait for user guidance before proceeding.

## Verification Approach

After implementing a phase:

<procedure>
1. Run the success criteria checks:
   - Usually `make check test` covers most automated verification
   - Run each specific command listed in plan's Automated Verification section

2. Fix any issues before proceeding to next phase

3. Update progress in both plan and todos:
   - Check off completed items in plan file using Edit
   - Mark todo as completed in todo list

4. Pause for human verification:
   - After completing all automated verification for a phase, PAUSE
   - Inform human that phase is ready for manual testing </procedure>

<pause_format> Phase [N] Complete - Ready for Manual Verification

Automated verification passed:

- [List automated checks that passed]

Please perform the manual verification steps listed in the plan:

- [List manual verification items from the plan]

Let me know when manual testing is complete so I can proceed to Phase [N+1].
</pause_format>

**IMPORTANT:** If instructed to execute multiple phases consecutively, skip the
pause until the last phase. Otherwise, assume you are doing one phase at a time.

**CRITICAL:** Do not check off items in manual testing steps until confirmed by
the user.

## If You Get Stuck

When something isn't working as expected:

<procedure>
1. Make sure you've read and understood all relevant code

2. Consider if codebase has evolved since plan was written

3. Present the mismatch clearly and ask for guidance </procedure>

Use sub-tasks sparingly - mainly for targeted debugging or exploring unfamiliar
territory.

## Resuming Work

If the plan has existing checkmarks:

<procedure>
1. Trust that completed work is done

2. Pick up from the first unchecked item

3. Verify previous work only if something seems off </procedure>

## Important Guidelines

**Follow the Plan:**

- Plans were created through thorough research
- Deviations should be rare and well-justified
- When in doubt, ask before deviating

**Implement Incrementally:**

- Complete one phase fully before starting next
- Don't skip ahead even if you see optimizations
- Each phase should be independently verifiable

**Verify Continuously:**

- Run automated checks after each phase
- Fix issues immediately, don't accumulate technical debt
- Keep tests passing at all times

**Track Progress:**

- Use TodoWrite to track implementation tasks
- Update plan checkboxes as you complete items
- Mark todos complete when done

**Communicate Blockers:**

- Don't struggle silently
- Present issues clearly with context
- Ask for guidance when stuck

**Maintain Quality:**

- Follow existing code patterns
- Write clean, readable code
- Add appropriate comments for complex logic
- Ensure error handling is robust

## Relationship to Other Commands

Recommended workflow:

1. `/dev/plan` - Create the implementation plan
2. `/dev/implement` - Execute the plan (this command)
3. `/dev/verify` - Verify implementation correctness
4. `/dev/commit` - Create git commits
5. Manual testing - Human verifies manual criteria

## Example Implementation Session

<example>
User: /dev/implement

# (On branch: feature/AL-1478-tier-based-penalties)

Assistant: I'll implement the parent-child tracking feature according to the
plan. Let me start by reading the plan completely.

[Reads plan file] [Reads original ticket] [Reads relevant code files]

I understand the plan has 4 phases:

1. Database Schema - Add parent_id column
2. Store Layer - Update event creation
3. API Layer - Expose parent_id in endpoints
4. Daemon Logic - Pass parent IDs when spawning sub-tasks

I'll create a todo list to track progress and start with Phase 1.

[Uses TodoWrite to create implementation todos]

**Starting Phase 1: Database Schema**

[Implements database migration] [Runs automated verification: make migrate, make
test]

Phase 1 complete. All automated checks pass:

- Migration applies cleanly: PASS
- Unit tests pass: PASS
- Type checking passes: PASS

No manual verification needed for this phase. Moving to Phase 2.

**Starting Phase 2: Store Layer**

[Updates event store methods] [Adds tests] [Runs make test]

Phase 2 complete. All automated checks pass:

- Unit tests pass: PASS (including 3 new tests)
- Type checking passes: PASS
- Linting passes: PASS

No manual verification needed. Moving to Phase 3.

**Starting Phase 3: API Layer**

[Updates API endpoints] [Updates API documentation] [Runs make test, make check]

Phase 3 complete. All automated checks pass:

- Unit tests pass: PASS
- Integration tests pass: PASS
- API returns correct responses: PASS

Moving to Phase 4.

**Starting Phase 4: Daemon Logic**

[Updates daemon event creation] [Adds logic to pass parent event IDs] [Runs full
test suite]

Phase 4 Complete - Ready for Manual Verification

Automated verification passed:

- All unit tests pass: make test (45 tests, 0 failures)
- Integration tests pass: make test-integration
- Type checking passes: npm run typecheck
- Linting passes: make lint

Please perform the manual verification steps listed in the plan:

- [ ] Create a sub-task in the UI and verify parent_id is set correctly
- [ ] Verify parent-child relationships display in event list
- [ ] Test filtering events by parent ID
- [ ] Verify performance with nested sub-tasks

Let me know when manual testing is complete.

User: Manual testing looks good. Everything works as expected.

Assistant: Excellent\! I've checked off all the manual verification items in the
plan. The implementation is complete and all success criteria are met. Ready for
code review and commit. </example>
