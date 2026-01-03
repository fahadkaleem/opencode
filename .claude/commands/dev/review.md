---
description:
  Comprehensive review of uncommitted code changes and tests against project
  standards
model: sonnet
---

# Comprehensive Code and Test Review

You are tasked with conducting a comprehensive review of all uncommitted
changes, covering both code quality and test quality. This command runs both
specialized review commands sequentially to provide complete coverage.

## Ticket ID Detection

**FIRST STEP:** Determine the ticket ID for this task.

<procedure>
1. Check if {{task_id}} template variable is provided (Alfred workflow mode):
   - If present, use {{task_id}} directly

2. If no template variable, check if ticket ID provided explicitly as parameter:
   - User may provide: `/dev/review AL-1234` or
     `/dev/review AL-1234 additional context`
   - If found, use that ticket ID

3. If no ticket ID provided, extract from current git branch:
   - Get branch name: `git branch --show-current`
   - Extract pattern: `feature/AL-1234`, `chore/AL-1234`, `bug/AL-1234`, etc.
   - Look for pattern: `AL-[0-9]+` (or similar Jira issue pattern)
   - If found, use that ticket ID

4. If no ticket ID found in branch name:
   - Ask user to provide ticket ID or ensure branch name contains it
   - Stop and wait for user input

5. Once ticket ID is determined:
   - Set TASK_DIR as `.alfred/tasks/${TICKET_ID}/`
   - Review results will be saved to `.alfred/tasks/${TICKET_ID}/review.md`
     </procedure>

**Present ticket detection result to user:**

```
Detected Ticket: AL-1234 (from branch feature/AL-1234-add-pacing-algorithm)
Task Directory: .alfred/tasks/AL-1234/
Review results will be saved to: review.md
```

## Overview

This command is a dispatcher that runs:

1. **`/dev/review-code`** - Code quality review
   - Python standards and type hints
   - Pydantic model usage
   - Naming conventions and code clarity
   - Error handling patterns
   - Code style uniformity with similar files
   - File organization

2. **`/dev/review-tests`** - Test quality review
   - Test structure and AAA pattern
   - pytest conventions and fixtures
   - Mocking strategies and test data
   - Test coverage completeness
   - Assertion quality
   - Test independence and maintainability
   - Test pattern consistency

## Execution

When this command is invoked, execute both review commands sequentially:

<procedure>
1. First, run code quality review
2. Wait for code review to complete
3. Then, run test quality review
4. Wait for test review to complete
5. Present combined summary
</procedure>

## Step 1: Run Code Quality Review

<message>
Starting comprehensive code and test review for ${TICKET_ID}...

[STEP 1/2] Running code quality review... </message>

Execute the code quality review command with the ticket ID:

```bash
# This will be executed by running /dev/review-code ${TICKET_ID}
```

Use the SlashCommand tool to execute `/dev/review-code ${TICKET_ID}`.

Wait for the code review to complete and capture the results.

## Step 2: Run Test Quality Review

<message>
[STEP 2/2] Running test quality review...
</message>

Execute the test quality review command with the ticket ID:

```bash
# This will be executed by running /dev/review-tests ${TICKET_ID}
```

Use the SlashCommand tool to execute `/dev/review-tests ${TICKET_ID}`.

Wait for the test review to complete and capture the results.

## Step 3: Present Combined Summary

After both reviews complete, save the combined results to
`.alfred/tasks/${TICKET_ID}/review.md` and present a summary:

<output_format>

# Comprehensive Code and Test Review Complete

**Task:** ${TICKET_ID}
**Review Results:** `.alfred/tasks/${TICKET_ID}/review.md`

---

## Code Quality Review Results

[Summary from /dev/review-code]

**Files Reviewed:** [N] source files **Status:** [[PASS] Approved / [IMPROVE]
Needs Improvement / [FAIL] Critical Issues] **Key Issues:** [Count or "None"]

---

## Test Quality Review Results

[Summary from /dev/review-tests]

**Test Files Reviewed:** [N] test files **Status:** [[PASS] Excellent / [GOOD]
Good / [IMPROVE] Needs Improvement / [FAIL] Poor] **Test Coverage:** [XX]%
lines, [XX]% functions, [XX]% branches **Key Issues:** [Count or "None"]

---

## Combined Action Items

### [FAIL] Must Fix (Blocking)

**Code Issues:**

- [List critical code issues from review-code]

**Test Issues:**

- [List critical test issues from review-tests]

### [IMPROVE] Should Fix (Before Merge)

**Code Issues:**

- [List code quality issues from review-code]

**Test Issues:**

- [List test quality issues from review-tests]

### [NOTE] Consider (Future Improvement)

**Code Issues:**

- [List code recommendations from review-code]

**Test Issues:**

- [List test improvements from review-tests]

---

## Overall Assessment

**Code Quality:** [[PASS] Approved / [IMPROVE] Needs Improvement / [FAIL]
Critical Issues] **Test Quality:** [[PASS] Excellent / [GOOD] Good / [IMPROVE]
Needs Improvement / [FAIL] Poor]

**Overall Status:** [[PASS] Ready to Commit / [IMPROVE] Approved with
Improvements / [FAIL] Requires Fixes]

**Next Steps:**

1. Address [FAIL] critical issues if any
2. Fix [IMPROVE] quality issues
3. Consider [NOTE] improvements for future
4. Re-run `/dev/review` after fixes
5. Run `/dev/verify` to verify functionality
6. Run `/dev/commit` when ready

---

**Would you like me to:**

- [ ] Fix specific issues automatically (where safe)
- [ ] Show examples of fixes from similar files
- [ ] Explain any specific findings in detail
- [ ] Re-review after you make changes
- [ ] Create missing test files
- [ ] Improve specific test quality issues

</output_format>

## Important Notes

**Sequential Execution:**

- Both reviews run sequentially, not in parallel
- Code review completes first, then test review
- This ensures thorough coverage of all changes

**Specialized Reviews:**

- Each review command is focused and comprehensive
- Code review focuses on code quality and patterns
- Test review focuses on test quality and coverage
- Together they provide complete review coverage

**Use Specialized Commands When:**

- You only need code review: use `/dev/review-code` directly
- You only need test review: use `/dev/review-tests` directly
- You need both: use `/dev/review` (this command)

**Prerequisites:**

- Both review commands will check for standards documentation
- If missing, they will prompt you to run:
  - `/generate-standards:coding` for code standards
  - `/generate-standards:testing` for test standards

## Relationship to Other Commands

Recommended workflow:

1. `/dev/plan` - Create implementation plan
2. `/dev/implement` - Implement the plan (code + tests)
3. `/dev/review` - Comprehensive review of code AND tests (this command)
4. Fix issues found in review
5. `/dev/verify` - Verify functionality
6. `/dev/commit` - Create git commits
7. Push to git / Create PR

Alternative workflow (when focusing on one aspect):

1. `/dev/implement` - Implement code
2. `/dev/review-code` - Review code only (faster)
3. Fix code issues
4. `/dev/review-tests` - Review tests only (focused)
5. Fix test issues
6. `/dev/verify` - Verify functionality
7. `/dev/commit` - Commit changes
