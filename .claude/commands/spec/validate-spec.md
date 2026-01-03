# Specification Validation Command

**Task ID:** {{task_id}}

You are a specification quality analyst. Your task is to validate the
specification document BEFORE any implementation begins, ensuring it is
complete, unambiguous, and ready for automated code generation.

## Purpose

Pre-implementation spec validation prevents:

1. **Ambiguous requirements** - Unclear or contradictory specs
2. **Missing critical information** - Gaps that block implementation
3. **Unmeasurable success criteria** - Can't verify completion
4. **Scope confusion** - Unclear boundaries
5. **Implementation blockers** - Missing dependencies, tech stack, etc.

## Input Specification

Read the specification file from one of these locations (check in order):

1. `.alfred/specs/{{task_id}}-spec.md`
2. `docs/spec.md`
3. Any spec file provided by user

## Validation Checks

### 1. Structural Completeness

**Required Sections:**

- [ ] Overview (1-2 paragraphs describing the project)
- [ ] Definition of Success (measurable outcomes)
- [ ] Requirements (with REQ-XXX IDs)
- [ ] Design/Architecture (high-level technical approach)
- [ ] Testing Strategy (how to verify it works)

**If missing:** Flag as BLOCKING issue.

### 2. Requirements Quality

For each requirement (REQ-XXX):

**REQ-001 [P?]**: Check that:

- [ ] Has unique ID in REQ-XXX format
- [ ] Has priority (P0, P1, P2, or P3)
- [ ] Is written as user story OR clear statement
- [ ] Is specific and implementable
- [ ] Has measurable acceptance criteria (implicit or explicit)

**Common Issues:**

- ❌ "System should be fast" → Too vague
- ✓ "API responses must be under 200ms for 95th percentile"
- ❌ "User can do stuff" → What stuff?
- ✓ "User can upload profile image (max 5MB, JPG/PNG only)"

**Ambiguity Detection:**

- Words like "fast", "scalable", "user-friendly" without metrics
- Requirements using "may", "could", "possibly" (unclear obligation)
- Contradictory requirements (REQ-001 says X, REQ-005 says not-X)
- Missing error handling specifications

### 3. Priority Validation

**Check priority distribution:**

- [ ] At least 1 P0 requirement exists
- [ ] P0 requirements are truly critical (system fails without them)
- [ ] Not everything is P0 (indicates lack of prioritization)
- [ ] P3 requirements are actually optional

**Red Flags:**

- All requirements are P0 (unrealistic)
- No P0 requirements (what's critical?)
- P0 requirement depends on P2 requirement (priority mismatch)

### 4. Success Criteria Validation

**Product Perspective:**

- [ ] Has measurable business metrics
- [ ] Clear definition of "done"
- [ ] User-facing outcomes defined

**Engineering Perspective:**

- [ ] Has technical metrics (performance, reliability)
- [ ] Quality bars defined (test coverage, code standards)
- [ ] Completion criteria specified

**If vague:** Flag examples and suggest concrete metrics.

### 5. Architecture Completeness

**Required Information:**

- [ ] Technology stack specified (languages, frameworks)
- [ ] Major components identified
- [ ] Data storage approach mentioned
- [ ] Integration points defined (if any)

**Missing = Blocker:**

- No tech stack → Can't scaffold project
- No components → Can't decompose tasks
- Vague architecture → Implementation will diverge

### 6. Scope Clarity

**"What We're NOT Doing" section:**

- [ ] Exists and has content
- [ ] Explicitly lists out-of-scope items
- [ ] Prevents scope creep

**If missing:** Warn that scope may expand during implementation.

### 7. Dependencies & Assumptions

**Dependencies:**

- [ ] External services/APIs listed
- [ ] Required libraries/frameworks mentioned
- [ ] Infrastructure requirements noted

**Assumptions:**

- [ ] Domain assumptions documented
- [ ] Technical assumptions stated
- [ ] Business assumptions noted

**If unclear:** Flag as risk for implementation.

### 8. Testing Clarity

**Testing Strategy:**

- [ ] Types of tests specified (unit, integration, e2e)
- [ ] What will be tested
- [ ] Acceptance criteria for quality

**If vague:** Implementation may skip tests.

### 9. Contradiction Detection

**Cross-check for conflicts:**

- Requirements contradicting each other
- Architecture incompatible with requirements
- Non-functional requirements (performance) vs approach
- Scope vs timeline mismatches

**Example Contradictions:**

- REQ-001: "Must support 10K concurrent users" (NFR)
- Design: "Simple single-server deployment" (Architecture)
- → These conflict!

### 10. Assumptions & Inference Tracking

**Document what you're inferring:**

- Assumptions made from incomplete info
- Defaults being applied
- Interpretations of vague requirements

**Example:**

> "Spec mentions 'user authentication' but doesn't specify method. ASSUMPTION:
> Using email/password with JWT tokens."

## Validation Output

Create validation report at
`.alfred/tasks/{{task_id}}/artifacts/spec-validation.json`:

```json
{
  "validated_at": "ISO timestamp",
  "task_id": "{{task_id}}",
  "spec_file": "path/to/spec.md",
  "validation_status": "passed|failed|warnings",
  "blocking_issues": [
    {
      "severity": "blocking",
      "category": "missing_section",
      "issue": "No 'Testing Strategy' section found",
      "impact": "Cannot determine acceptance criteria",
      "suggestion": "Add Testing section with unit/integration test requirements"
    }
  ],
  "warnings": [
    {
      "severity": "warning",
      "category": "ambiguous_requirement",
      "requirement_id": "REQ-005",
      "issue": "Requirement uses vague term 'fast response'",
      "suggestion": "Specify response time SLA (e.g., '< 200ms for 95th percentile')"
    }
  ],
  "quality_metrics": {
    "total_requirements": 15,
    "functional_requirements": 12,
    "non_functional_requirements": 3,
    "requirements_with_priorities": 15,
    "requirements_with_acceptance_criteria": 10,
    "ambiguous_requirements": 2,
    "contradictions_found": 0
  },
  "completeness": {
    "required_sections_present": 5,
    "required_sections_total": 5,
    "optional_sections_present": 3,
    "missing_sections": []
  },
  "assumptions_made": [
    {
      "topic": "Authentication",
      "assumption": "Using JWT-based auth with email/password",
      "confidence": "medium",
      "needs_clarification": true
    }
  ],
  "recommendations": [
    "Clarify REQ-005 response time requirements",
    "Add explicit acceptance criteria to REQ-007, REQ-009",
    "Specify database technology in Architecture section"
  ],
  "ready_for_implementation": false,
  "blockers_to_resolve": [
    "Missing Testing Strategy section",
    "No tech stack specified"
  ]
}
```

## Output Summary

After validation, output:

### Specification Validation Report

**Overall Status:** {{#if ready_for_implementation}}✓ READY{{else}}✗ NOT
READY{{/if}}

#### Quality Metrics

- Total Requirements: [count]
- With Priorities: [count]/[total]
- Ambiguous: [count]
- Contradictions: [count]

#### Completeness

- Required Sections: [present]/[total] {{#if missing_sections}}
- Missing: {{#each missing_sections}}{{this}}, {{/each}} {{/if}}

#### Issues Found

{{#if blocking_issues}} **🚫 Blocking Issues ([count]):**
{{#each blocking_issues}}

- **{{category}}**: {{issue}}
  - Impact: {{impact}}
  - Fix: {{suggestion}} {{/each}} {{/if}}

{{#if warnings}} **⚠️ Warnings ([count]):** {{#each warnings}}

- **{{requirement_id}}**: {{issue}}
  - Suggestion: {{suggestion}} {{/each}} {{/if}}

#### Assumptions Made

{{#each assumptions_made}}

- **{{topic}}**: {{assumption}} {{#if needs_clarification}}⚠️ Needs
  clarification{{/if}} {{/each}}

#### Recommendations

{{#each recommendations}}

1. {{this}} {{/each}}

---

**Next Steps:**

{{#if ready_for_implementation}} ✓ Specification is ready for implementation

Run: `alfred run spec:analyze --task {{task_id}}` {{else}} ✗ Resolve blocking
issues before proceeding:

{{#each blockers_to_resolve}}

- {{this}} {{/each}}

After fixes, re-run: `alfred run spec:validate-spec --task {{task_id}}` {{/if}}

**Validation report saved to:**
`.alfred/tasks/{{task_id}}/artifacts/spec-validation.json`

## Validation Severity Levels

**Blocking (MUST fix):**

- Missing required sections
- No tech stack specified
- No P0 requirements
- Contradictory requirements
- No success criteria

**Warning (SHOULD fix):**

- Ambiguous requirements
- Missing acceptance criteria
- Vague success metrics
- Undocumented assumptions
- No out-of-scope section

**Info (COULD fix):**

- Suggested improvements
- Best practice recommendations
- Clarifications that would help

## Important Notes

- **Be strict:** Better to catch issues now than during implementation
- **Be specific:** Don't just say "vague", explain WHY and HOW to fix
- **Document assumptions:** Every inference should be noted
- **Check contradictions:** Requirements may conflict with architecture
- **Prioritize blockers:** Focus on what prevents implementation
- **Provide examples:** Show good vs bad requirement writing
- **Be constructive:** Every issue should have a suggested fix

## When to Pass vs Fail

**PASS (ready_for_implementation: true):**

- All required sections present
- All requirements have IDs and priorities
- Tech stack specified
- Success criteria measurable
- No blocking contradictions
- Architecture clear enough to start

**FAIL (ready_for_implementation: false):**

- Missing required sections
- No tech stack
- Contradictory requirements
- Unmeasurable success criteria
- Critical ambiguities

**WARNINGS (pass with cautions):**

- Some ambiguous requirements
- Missing optional sections
- Unclear assumptions
- Could be better but implementable
