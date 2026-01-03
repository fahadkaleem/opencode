---
description: Create a UI component with story and test files using specialized agents
model: opus
---

# Create UI Component (Orchestrated)

Creates a complete UI component by orchestrating specialized agents. Uses artifact-based handoff to keep context clean.

## Phase 0: Check for Spec

Before setup, check if the component spec exists:

```bash
ls .ai/specs/components/$ARGUMENTS.md
```

**If spec exists:** Proceed to Setup.

**If spec does NOT exist:**

<procedure>
1. Inform the user that a spec is needed
2. Automatically launch the create-spec command using the Skill tool:
   ```
   skill: "ui:component:create-spec"
   args: "$ARGUMENTS"
   ```
3. Wait for the spec creation to complete
4. Verify the spec now exists at `.ai/specs/components/$ARGUMENTS.md`
5. Proceed to Setup
</procedure>

## Setup

Create the following todos using TodoWrite before starting any work:

| Phase | Todo Title | Status |
|-------|------------|--------|
| 1 | Scaffold $ARGUMENTS files and artifact folder | pending |
| 2 | Launch component-creator agent | pending |
| 3 | Launch component-reviewer agent | pending |
| 3b | Apply fixes if review failed | pending |
| 3c | Investigate persistent failures | pending |
| 4 | Final verification | pending |

Proceed to Phase 1.

## Phase 1: Scaffold

Mark todo "Scaffold $ARGUMENTS files and artifact folder" as `in_progress`.

**Read:** `.ai/specs/components/$ARGUMENTS.md`

<implement>
1. Parse the component spec to extract:
   - Component name (from spec)
   - Location type: `ui` (primitive) or `features` (feature component)
   - Full path based on location

2. Determine the correct path:
   - If primitive → `src/components/ui/$ARGUMENTS/`
   - If feature → path specified in spec (e.g., `src/features/chat/components/$ARGUMENTS/`)

3. Create the component folder and empty placeholder files:
   ```
   $ARGUMENTS/
   ├── $ARGUMENTS.tsx           → // Component implementation
   ├── $ARGUMENTS.stories.tsx   → // Storybook stories
   ├── $ARGUMENTS.test.tsx      → // Component tests
   └── index.ts                 → // Barrel exports
   ```

4. Create the artifact folder:
   ```bash
   mkdir -p .ai/artifacts/$ARGUMENTS
   ```

5. Record these values (you'll need them for agent prompts):
   - `COMPONENT_PATH`: Full path to component folder
   - `ARTIFACT_PATH`: `.ai/artifacts/$ARGUMENTS`
   - `SPEC_PATH`: `.ai/specs/components/$ARGUMENTS.md`
</implement>

<validate>
Verify all files and folders exist:
```bash
ls -la [COMPONENT_PATH]/
ls -la .ai/artifacts/$ARGUMENTS/
```

If any are missing, create them. Do not proceed until ready.
</validate>

Mark todo "Scaffold $ARGUMENTS files and artifact folder" as `completed`. Proceed to Phase 2.

## Phase 2: Launch Component Creator Agent

Mark todo "Launch component-creator agent" as `in_progress`.

<implement>
You MUST use the Task tool to launch the component-creator agent.

**Task tool parameters:**
```
subagent_type: "component-creator"
prompt: "Implement the $ARGUMENTS component.

        Component path: [COMPONENT_PATH]
        Spec path: [SPEC_PATH]
        Artifact folder: [ARTIFACT_PATH]

        Files to implement:
        - [COMPONENT_PATH]/$ARGUMENTS.tsx
        - [COMPONENT_PATH]/$ARGUMENTS.stories.tsx
        - [COMPONENT_PATH]/$ARGUMENTS.test.tsx
        - [COMPONENT_PATH]/index.ts

        Write your summary to: [ARTIFACT_PATH]/create-summary.md
        Return format: SUCCESS|[artifact-path] or FAIL|[artifact-path]"
description: "Implement $ARGUMENTS component"
```

**IMPORTANT:** Note the returned `agentId` - you may need it to resume the agent later.

Wait for the Task tool to return. Parse the response:
- Format: `STATUS|ARTIFACT_PATH`
- Example: `SUCCESS|.ai/artifacts/user-message/create-summary.md`
</implement>

<validate>
Check the response:
- If starts with `SUCCESS|` → Creator succeeded, proceed to Phase 3
- If starts with `FAIL|` → Creator failed, stop and report to user

Verify artifact exists:
```bash
cat [ARTIFACT_PATH]/create-summary.md
```
</validate>

Store the `agentId` for potential resume. Mark todo as `completed`. Proceed to Phase 3.

## Phase 3: Launch Component Reviewer Agent

Mark todo "Launch component-reviewer agent" as `in_progress`.

<implement>
You MUST use the Task tool to launch the component-reviewer agent.

**Task tool parameters:**
```
subagent_type: "component-reviewer"
prompt: "Review the $ARGUMENTS component.

        Component path: [COMPONENT_PATH]
        Artifact folder: [ARTIFACT_PATH]
        Create summary: [ARTIFACT_PATH]/create-summary.md

        Files to review:
        - [COMPONENT_PATH]/$ARGUMENTS.tsx
        - [COMPONENT_PATH]/$ARGUMENTS.stories.tsx
        - [COMPONENT_PATH]/$ARGUMENTS.test.tsx
        - [COMPONENT_PATH]/index.ts

        Write your report to: [ARTIFACT_PATH]/review-report.md

        IMPORTANT: You MUST return FAIL if ANY issues are found, no matter how minor.
        Only return PASS if the implementation is flawless with zero issues.

        Return format: PASS|[artifact-path] or FAIL|[artifact-path]"
description: "Review $ARGUMENTS component"
```

Wait for the Task tool to return. Parse the response:
- Format: `STATUS|ARTIFACT_PATH`
- Example: `PASS|.ai/artifacts/user-message/review-report.md`
</implement>

<validate>
Check the response:
- If starts with `PASS|` → Review passed, skip Phase 3b, proceed to Phase 4
- If starts with `FAIL|` → Review failed, proceed to Phase 3b

Verify artifact exists:
```bash
cat [ARTIFACT_PATH]/review-report.md
```
</validate>

Mark todo as `completed`. If PASS → skip to Phase 4. If FAIL → proceed to Phase 3b.

## Phase 3b: Apply Fixes (Resume Creator)

Mark todo "Apply fixes if review failed" as `in_progress`.

<implement>
You MUST use the Task tool to RESUME the component-creator agent.

**Task tool parameters:**
```
subagent_type: "component-creator"
resume: "[agentId-from-phase-2]"
prompt: "Review failed. Apply fixes from the review report.

        Review report: [ARTIFACT_PATH]/review-report.md
        Artifact folder: [ARTIFACT_PATH]

        Read the review report and apply each fix exactly as described.
        The report contains the file paths, guideline quotes, and fix instructions.

        Return format: SUCCESS|[artifact-path] or FAIL|[artifact-path]"
description: "Apply fixes to $ARGUMENTS"
```

Wait for the Task tool to return.
</implement>

<validate>
Check the response:
- If starts with `SUCCESS|` → Fixes applied
- If starts with `FAIL|` → Could not fix, report to user

After fixes, re-run the reviewer (launch fresh, not resume):

**Task tool parameters:**
```
subagent_type: "component-reviewer"
prompt: "Re-review the $ARGUMENTS component after fixes.

        Component path: [COMPONENT_PATH]
        Artifact folder: [ARTIFACT_PATH]

        Write your report to: [ARTIFACT_PATH]/review-report.md

        IMPORTANT: You MUST return FAIL if ANY issues are found, no matter how minor.
        Only return PASS if the implementation is flawless with zero issues.

        Return format: PASS|[artifact-path] or FAIL|[artifact-path]"
description: "Re-review $ARGUMENTS component"
```

- If `PASS|` → Proceed to Phase 4
- If `FAIL|` → Proceed to Phase 3c (investigate)
</validate>

Mark todo as `completed`. If PASS → Phase 4. If FAIL → Phase 3c.

## Phase 3c: Investigate Persistent Failures

Only enter this phase if re-review still returned FAIL.

<implement>
The creator attempted fixes but reviewer still found issues. Investigate:

1. **Read the review report:**
   ```bash
   cat [ARTIFACT_PATH]/review-report.md
   ```

2. **Check what's actually in the files** - read the specific files mentioned in failures

3. **Determine the issue:**
   - Is the fix instruction unclear?
   - Is there a dependency issue?
   - Is the guideline check too strict?
   - Did the creator misunderstand the fix?

4. **Attempt direct fix:**
   - If the issue is clear and simple, fix it directly
   - Run validation after each fix:
     ```bash
     npm run check-types && npm run lint
     ```

5. **If fixed:** Proceed to Phase 4
   **If cannot fix:** Report detailed findings to user with:
   - What was attempted
   - What's still failing
   - Why you couldn't resolve it
</implement>

Mark as investigated. Proceed to Phase 4 (or report to user if unresolvable).

## Phase 4: Final Verification

Mark todo "Final verification" as `in_progress`.

<implement>
Run the full validation suite:
```bash
npm run check-types && npm run lint && npm run test -- $ARGUMENTS
```
</implement>

<validate>
All three commands must pass:
- TypeScript: No type errors
- ESLint: No lint errors
- Tests: All tests pass

If any fail, report to user with specific errors.
</validate>

Mark todo "Final verification" as `completed`.

## Completion

Generate a context-friendly summary of what happened during execution.

**Build the summary dynamically based on what actually occurred:**

```markdown
# $ARGUMENTS Component Created

## Execution Summary

- Scaffolded component at `[COMPONENT_PATH]/`
- Creator agent implemented component, story, and tests
- [If first review passed:] Review passed on first attempt
- [If fixes were needed:] Review found [N] issues → Creator applied fixes → Re-review passed
- [If investigation needed:] Re-review failed → Investigated and fixed [N] remaining issues
- Final validation passed (TypeScript, ESLint, Tests)

## Files Created

- `[COMPONENT_PATH]/$ARGUMENTS.tsx` - Component implementation
- `[COMPONENT_PATH]/$ARGUMENTS.stories.tsx` - Storybook stories
- `[COMPONENT_PATH]/$ARGUMENTS.test.tsx` - Unit tests
- `[COMPONENT_PATH]/index.ts` - Barrel exports

## Artifacts

- `[ARTIFACT_PATH]/create-summary.md` - Implementation details
- `[ARTIFACT_PATH]/review-report.md` - Review results

## Validation

- TypeScript: PASS
- ESLint: PASS
- Tests: PASS ([N] passing)

## Next Steps

- `npm run storybook` - View component in Storybook
- `npm run test -- $ARGUMENTS` - Run component tests
```

**If there were unresolved issues**, adjust the summary:

```markdown
# $ARGUMENTS Component Created (with notes)

## Execution Summary

- Scaffolded component at `[COMPONENT_PATH]/`
- Creator agent implemented component, story, and tests
- Review found [N] issues → Creator applied fixes
- Re-review found [M] remaining issues → Investigated
- [X] issues resolved, [Y] issues remain (see notes below)

## Outstanding Items

- [Issue 1 that couldn't be resolved and why]
- [Issue 2]

## Files Created
...
```

## Guidelines

**Do:**
- Use the Task tool explicitly to launch agents
- Store the agentId from Phase 2 for potential resume in Phase 3b
- Parse agent responses as `STATUS|PATH` format
- Let agents communicate via artifact files
- Keep your context clean (agents do the heavy work)

**Don't:**
- Implement the component yourself (agents do this)
- Read guideline files yourself (agents do this)
- Pass large content between phases (use artifacts)
- Loop more than once on fixes (report to user instead)

**Critical:**
- ALWAYS use Task tool with `subagent_type` parameter
- ALWAYS use `resume` parameter in Phase 3b with the stored agentId
- NEVER attempt to do the agent's work yourself

**When:**
- WHEN creator fails → Stop and report to user
- WHEN review fails → Resume creator with fixes, then re-review
- WHEN re-review fails → Investigate and attempt direct fix (Phase 3c)
- WHEN investigation can't fix → Report detailed findings to user
- WHEN verification fails → Report to user with specific errors
