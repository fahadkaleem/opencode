---
description:
  Verify implementation against plan, check success criteria, identify issues
---

# Implementation Verification

You are tasked with validating that an implementation plan was correctly
executed by verifying all success criteria and identifying any deviations or
issues.

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

6. Plan path is `.alfred/tasks/${TICKET_ID}/plan.md`

7. Verification report will be saved to `.alfred/tasks/${TICKET_ID}/verify.md`

8. **REQUIRED:** Check that `.alfred/tasks/${TICKET_ID}/plan.md` exists:
   - If missing, show error and stop:

     ```
     ERROR: Implementation plan not found!
     Required file: .alfred/tasks/${TICKET_ID}/plan.md

     Cannot verify without a plan to check against.
     ```

9. Read plan.md FULLY to understand what should have been implemented
   </procedure>

## Initial Setup

When invoked:

<procedure>
1. Determine context - Are you in an existing conversation or starting fresh?
   - If existing: Review what was implemented in this session
   - If fresh: Discover what was done through git and codebase analysis

2. Gather implementation evidence: </procedure>

```bash
# Check recent commits
git log --oneline -n 20
git diff HEAD~N..HEAD  # Where N covers implementation commits

# Run comprehensive checks
cd $(git rev-parse --show-toplevel) && make check test
```

## Step 1: Context Discovery

If starting fresh or need more context:

<procedure>
1. Read the implementation plan completely

2. Identify what should have changed:
   - List all files that should be modified
   - Note all success criteria (automated and manual)
   - Identify key functionality to verify

3. Spawn parallel research tasks to discover implementation: </procedure>

<task_examples> Task 1 - Verify database changes: Research if migration [N] was
added and schema changes match plan. Check: migration files, schema version,
table structure. Return: What was implemented vs what plan specified.

Task 2 - Verify code changes: Find all modified files related to [feature].
Compare actual changes to plan specifications. Return: File-by-file comparison
of planned vs actual.

Task 3 - Verify test coverage: Check if tests were added/modified as specified.
Run test commands and capture results. Return: Test status and any missing
coverage. </task_examples>

## Step 2: Systematic Validation

For each phase in the plan:

<procedure>
1. Check completion status:
   - Look for checkmarks in the plan (- [x])
   - Verify actual code matches claimed completion

2. Run automated verification:
   - Execute each command from "Automated Verification" section
   - Document pass/fail status
   - If failures, investigate root cause

3. Assess manual criteria:
   - List what needs manual testing
   - Provide clear steps for user verification

4. Think deeply about edge cases:
   - Were error conditions handled?
   - Are there missing validations?
   - Could the implementation break existing functionality? </procedure>

## Step 3: Generate Validation Report

Create comprehensive validation summary:

<report_template>

## Verification Report: [Plan Name]

### Implementation Status

- Phase 1: [Name] - [Status: Fully implemented / Partially implemented / Not
  started]
- Phase 2: [Name] - [Status]
- Phase 3: [Name] - [Status with issues if any]

### Automated Verification Results

- Build passes: `make build` - [PASS/FAIL]
- Tests pass: `make test` - [PASS/FAIL with details]
- Linting: `make lint` - [PASS/FAIL with warning count]
- Type checking: `npm run typecheck` - [PASS/FAIL]

### Code Review Findings

#### Matches Plan

- Database migration correctly adds [table]
- API endpoints implement specified methods
- Error handling follows plan

#### Deviations from Plan

- Used different variable names in [file:line] (reason if known)
- Added extra validation in [file:line] (improvement or concern?)
- Omitted [feature] mentioned in plan (reason needed)

#### Potential Issues

- Missing index on foreign key could impact performance
- No rollback handling in migration
- Error messages not user-friendly in [file:line]

### Manual Testing Required

1. UI functionality:
   - [ ] Verify [feature] appears correctly
   - [ ] Test error states with invalid input
   - [ ] Check responsive design on mobile

2. Integration:
   - [ ] Confirm works with existing [component]
   - [ ] Check performance with large datasets
   - [ ] Verify backwards compatibility

### Recommendations

- Address linting warnings before merge
- Consider adding integration test for [scenario]
- Document new API endpoints in [location]
- Add migration rollback script </report_template>

## Working with Existing Context

If you were part of the implementation:

- Review the conversation history
- Check your todo list for what was completed
- Focus validation on work done in this session
- Be honest about any shortcuts or incomplete items

## Important Guidelines

**Be Thorough but Practical:**

- Focus on what matters for production readiness
- Don't get lost in trivial style issues
- Prioritize functional correctness over perfection

**Run All Automated Checks:**

- Don't skip verification commands
- Document exact failure messages
- Investigate root causes of failures

**Document Everything:**

- Both successes and issues
- Deviations from plan with reasoning
- Recommendations for improvement

**Think Critically:**

- Question if implementation truly solves the problem
- Consider edge cases and error scenarios
- Evaluate if code is maintainable long-term

**Consider Maintenance:**

- Will this be maintainable six months from now?
- Is documentation sufficient?
- Are tests comprehensive enough?

## Verification Checklist

Always verify:

- [ ] All phases marked complete are actually done
- [ ] Automated tests pass
- [ ] Code follows existing patterns and conventions
- [ ] No regressions introduced
- [ ] Error handling is robust
- [ ] Documentation updated if needed
- [ ] Manual test steps are clear and complete
- [ ] Performance implications considered
- [ ] Security implications reviewed

## Relationship to Other Commands

Recommended workflow:

1. `/dev/implement` - Execute the implementation
2. `/dev/commit` - Create atomic commits for changes
3. `/dev/verify` - Verify implementation correctness (this command)
4. Manual testing - Human verifies manual criteria
5. Create PR - If verification passes

**IMPORTANT:** Verification works best after commits are made, as it can analyze
git history to understand what was implemented.

## Example Verification Session

<example>
User: /dev/verify

# (On branch: feature/AL-1234-add-feature)

Assistant: I'll verify the implementation against the plan. Let me start by
reading the plan and checking recent git commits.

[Reads plan file] [Runs git log and git diff]

I can see 5 commits were made for this feature. Let me now run the automated
verification checks.

[Runs make check test]

**Verification Report: Feature Implementation**

**Implementation Status:**

- Phase 1: Database Schema - Fully implemented
- Phase 2: API Endpoints - Fully implemented
- Phase 3: UI Components - Fully implemented

**Automated Verification Results:**

- Build passes: `make build` - PASS
- Tests pass: `make test` - PASS (42 tests, 0 failures)
- Linting: `make lint` - PASS with 2 warnings (unused imports)
- Type checking: `npm run typecheck` - PASS

**Code Review Findings:**

_Matches Plan:_

- Migration 003 correctly adds parent_id column
- API endpoints implement all specified methods
- Error handling follows established patterns

_Deviations:_

- Used `parentId` instead of `parent_id` in TypeScript (camelCase convention)
- Added input validation not mentioned in plan (improvement)

_Potential Issues:_

- Migration has no down() function for rollback
- No index on parent_id foreign key

**Manual Testing Required:**

1. UI functionality:
   - [ ] Verify parent-child relationships display correctly in UI
   - [ ] Test filtering by parent ID
   - [ ] Check error messages for invalid parent IDs

2. Integration:
   - [ ] Verify works with existing event list view
   - [ ] Check performance with 1000+ nested events

**Recommendations:**

- Fix 2 linting warnings (unused imports)
- Add migration rollback function
- Consider adding index on parent_id for query performance
- Add integration test for parent-child relationship queries

All automated verification passes. Ready for manual testing. </example>
