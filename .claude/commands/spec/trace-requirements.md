# Requirements Traceability Report

**Task ID:** {{task_id}}

You are a requirements traceability analyst. Your task is to create a
comprehensive mapping between specification requirements and their
implementations, ensuring complete coverage and providing evidence of
fulfillment.

## Purpose

Requirements traceability ensures:

1. **Every requirement is implemented** - No missing features
2. **Every implementation maps to a requirement** - No scope creep
3. **Evidence of fulfillment** - Verifiable implementation
4. **Audit trail** - Track what was built and why

## Input Context

Read these artifacts:

- `.alfred/tasks/{{task_id}}/artifacts/spec-analysis.json` - All requirements
- `.alfred/tasks/{{task_id}}/artifacts/task-breakdown.json` - All implementation
  tasks
- All validation reports:
  `.alfred/tasks/{{task_id}}/artifacts/*-validation.json`
- All implementation reports:
  `.alfred/tasks/{{task_id}}/artifacts/*-implementation.json`

## Traceability Analysis

### Step 1: Forward Traceability (Requirements → Implementation)

For each requirement (REQ-XXX, REQ-NFR-XXX):

1. **Find Implementations:** Which tasks implemented this requirement?
2. **Identify Files:** Which source files contain the implementation?
3. **Locate Tests:** Which test files verify this requirement?
4. **Gather Evidence:** What proves this requirement is fulfilled?

### Step 2: Backward Traceability (Implementation → Requirements)

For each implementation file:

1. **Identify Requirements:** Which requirements does this file implement?
2. **Check Authorization:** Is each feature tied to a requirement?
3. **Flag Extras:** Are there features not in the specification?

### Step 3: Coverage Analysis

Calculate:

- **Total Requirements:** Count of all requirements
- **Implemented:** Requirements with implementations
- **Not Implemented:** Requirements without implementations
- **Partially Implemented:** Requirements with incomplete implementations
- **Coverage Percentage:** (Implemented / Total) × 100

### Step 4: Priority Analysis

Break down by priority level:

- **P0 (Critical):** Must be 100% implemented
- **P1 (High):** Should be implemented
- **P2 (Medium):** Nice to have
- **P3 (Low):** Optional

## Output Format

Create a traceability matrix at
`.alfred/tasks/{{task_id}}/artifacts/requirements-traceability.json`:

```json
{
  "generated_at": "ISO timestamp",
  "task_id": "{{task_id}}",
  "summary": {
    "total_requirements": 0,
    "functional_requirements": 0,
    "non_functional_requirements": 0,
    "implemented": 0,
    "not_implemented": 0,
    "partially_implemented": 0,
    "coverage_percentage": 0,
    "by_priority": {
      "P0": { "total": 0, "implemented": 0, "coverage": 0 },
      "P1": { "total": 0, "implemented": 0, "coverage": 0 },
      "P2": { "total": 0, "implemented": 0, "coverage": 0 },
      "P3": { "total": 0, "implemented": 0, "coverage": 0 }
    }
  },
  "traceability_matrix": [
    {
      "requirement_id": "REQ-001",
      "priority": "P0",
      "description": "string",
      "status": "implemented|not_implemented|partially_implemented",
      "implemented_by": {
        "tasks": ["T001", "T002"],
        "files": [
          {
            "path": "src/service/auth.ts",
            "lines": "10-50",
            "description": "Implements login functionality"
          }
        ],
        "tests": [
          {
            "path": "test/unit/auth.test.ts",
            "test_cases": [
              "should authenticate valid user",
              "should reject invalid credentials"
            ]
          }
        ]
      },
      "evidence": "string - proof of implementation",
      "notes": "string - any additional context"
    }
  ],
  "reverse_trace": {
    "src/service/auth.ts": ["REQ-001", "REQ-002"],
    "src/middleware/session.ts": ["REQ-003"]
  },
  "gaps": [
    {
      "requirement_id": "REQ-010",
      "priority": "P1",
      "description": "string",
      "reason": "Not implemented - was not in task breakdown"
    }
  ],
  "extra_features": [
    {
      "file": "src/utils/helper.ts",
      "feature": "string",
      "justification": "Helper utility, not in spec but needed for implementation"
    }
  ]
}
```

## Visual Traceability Matrix (Markdown)

Also create a markdown report at
`.alfred/tasks/{{task_id}}/artifacts/TRACEABILITY.md`:

```markdown
# Requirements Traceability Matrix

**Project:** [Project Name] **Task ID:** {{task_id}} **Generated:** [timestamp]

## Executive Summary

- **Total Requirements:** [count]
- **Implemented:** [count] ([percentage]%)
- **Not Implemented:** [count]
- **Gaps:** [count]

## Coverage by Priority

| Priority      | Total | Implemented | Coverage |
| ------------- | ----- | ----------- | -------- |
| P0 (Critical) | X     | Y           | Z%       |
| P1 (High)     | X     | Y           | Z%       |
| P2 (Medium)   | X     | Y           | Z%       |
| P3 (Low)      | X     | Y           | Z%       |

## Detailed Traceability

### Functional Requirements

#### REQ-001 [P0]: [Description]

**Status:** ✓ Implemented

**Implemented By:**

- Task T001: [task description]
- Task T002: [task description]

**Source Files:**

- `src/service/auth.ts` (lines 10-50): Implements login functionality
- `src/middleware/auth.ts` (lines 5-20): Authorization middleware

**Test Coverage:**

- `test/unit/auth.test.ts`:
  - ✓ should authenticate valid user
  - ✓ should reject invalid credentials
  - ✓ should handle missing credentials
- `test/integration/auth-flow.test.ts`:
  - ✓ should complete full login flow

**Evidence:** All acceptance criteria met. Tests passing. Validation passed.

---

#### REQ-002 [P1]: [Description]

**Status:** ⚠ Partially Implemented

**Implemented By:**

- Task T003: [task description] - IN PROGRESS

**Notes:** Implementation started but not complete. Missing error handling for
edge case X.

---

### Non-Functional Requirements

#### REQ-NFR-001 [P0]: System must handle 10,000 concurrent users

**Status:** ✓ Implemented

**Implemented By:**

- Task T020: Performance optimization

**Evidence:**

- Load testing results: Successfully handled 12,000 concurrent users
- See: `.alfred/tasks/{{task_id}}/artifacts/load-test-results.json`

---

## Gaps Analysis

### Not Implemented

1. **REQ-005 [P2]:** User profile customization
   - **Reason:** Deprioritized, scheduled for next iteration

2. **REQ-NFR-003 [P3]:** Admin dashboard analytics
   - **Reason:** Optional feature, not in MVP scope

### Partially Implemented

1. **REQ-003 [P1]:** Password reset flow
   - **Status:** Email sending implemented, UI pending
   - **Action:** Complete Task T015

## Extra Features (Not in Spec)

1. **Logging Utility** (`src/utils/logger.ts`)
   - **Justification:** Needed for debugging and monitoring
   - **Impact:** Low, helper utility

## Recommendations

1. Complete REQ-003 (password reset UI) - P1 priority
2. Add integration tests for REQ-002 - gap in test coverage
3. Consider implementing REQ-005 in next iteration - user requested

---

## Traceability Validation

✓ All P0 requirements implemented ✓ All P1 requirements implemented or in
progress ✓ No unauthorized features added ✓ All implementations traced to
requirements
```

## Output

After generating both reports, output:

### Requirements Traceability Report Complete

**Coverage Summary:**

- Total Requirements: [count]
- Implemented: [count] ([percentage]%)
- Not Implemented: [count]
- Partially Implemented: [count]

**By Priority:**

- P0: [count]/[total] ([percentage]%) ✓
- P1: [count]/[total] ([percentage]%)
- P2: [count]/[total] ([percentage]%)
- P3: [count]/[total] ([percentage]%)

**Gaps Identified:** [count] {{#each gaps}}

- {{requirement_id}} [{{priority}}]: {{description}} {{/each}}

**Extra Features:** [count] {{#each extras}}

- {{file}}: {{feature}} {{/each}}

**Status:** {{#if p0_complete}} ✓ All critical (P0) requirements implemented
{{else}} ✗ Missing critical requirements - BLOCKING {{/if}}

**Reports Generated:**

- JSON: `.alfred/tasks/{{task_id}}/artifacts/requirements-traceability.json`
- Markdown: `.alfred/tasks/{{task_id}}/artifacts/TRACEABILITY.md`

**Next Steps:** {{#if has_gaps}}

1. Review gaps and decide on action (implement, defer, or close)
2. Update specification if needed
3. Create follow-up tasks for incomplete requirements {{else}}
4. Share TRACEABILITY.md with stakeholders
5. Archive implementation artifacts
6. Close task {{task_id}} {{/if}}

## Analysis Guidelines

1. **Be Thorough:** Check every requirement, every file
2. **Provide Evidence:** Don't just say it's implemented, prove it
3. **Identify Gaps:** Be honest about what's missing
4. **Track Extras:** Note features not in the spec
5. **Prioritize Gaps:** Flag missing P0/P1 requirements
6. **Use Git History:** Check commits for implementation details
7. **Verify Tests:** Ensure requirements are tested, not just implemented

## Important Notes

- Missing P0 requirements are **BLOCKING** - must be addressed
- Missing P1 requirements should be flagged for immediate action
- P2/P3 gaps can be deferred to future iterations
- Extra features should be documented and justified
- Traceability matrix should be version controlled
- Update as requirements or implementations change
