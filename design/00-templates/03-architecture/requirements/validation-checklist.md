# Stage 3b: Component Requirements - Validation Checklist

Use this checklist to verify component requirements are complete before proceeding to Stage 4 (Detailed Design).

---

## Per-Component Completeness

For each component's requirements document, verify:

### Requirements Coverage

- [ ] All HL requirements assigned to this component are decomposed
- [ ] Each FR has unique ID (FR-[COMP]-XXX format)
- [ ] Each FR traces to an HL requirement
- [ ] Each FR has priority assigned
- [ ] Each FR has acceptance criteria (Gherkin format)
- [ ] Each FR has rationale explaining WHY

### Acceptance Criteria Quality

- [ ] Gherkin scenarios cover happy path
- [ ] Gherkin scenarios cover error cases
- [ ] Gherkin scenarios cover edge cases
- [ ] Each scenario is independent and testable
- [ ] Scenarios are specific (not vague)

### Error Handling

- [ ] Error scenarios are documented
- [ ] Error codes are defined
- [ ] Retry behavior is specified

### Interfaces

- [ ] Required interfaces (dependencies) documented
- [ ] Provided interfaces documented
- [ ] Interface purposes are clear

### Data Requirements

- [ ] Data entities this component manages are listed
- [ ] Persistence requirements are specified
- [ ] Data constraints are documented

### Traceability

- [ ] HL requirement decomposition table is complete
- [ ] Requirements summary is accurate
- [ ] Requirements index is populated

---

## Cross-Component Checks

### All Components Together

- [ ] All HL requirements are covered by at least one component's FRs
- [ ] No duplicate FRs across components
- [ ] Interface requirements are consistent between provider and consumer
- [ ] No orphan FRs (all trace to HL requirements)

### Interface Consistency

For each interface between components:

- [ ] Provider component documents it as "Provided Interface"
- [ ] Consumer component documents it as "Required Interface"
- [ ] Purpose descriptions are consistent

---

## Quality Checks

### Each Functional Requirement

- [ ] Describes specific, testable behavior
- [ ] Uses "SHALL" for mandatory requirements
- [ ] Is at the right level (not too high, not implementation detail)
- [ ] Could be implemented and tested independently
- [ ] Acceptance criteria are unambiguous

### Abstraction Level Test

For each FR, ask:

- Is it specific enough to implement?
- Is it too implementation-specific (should be in Stage 4)?

**Too high-level (should be HL)**:

> "System SHALL handle errors gracefully"

**Right level (FR)**:

> "System SHALL retry failed API calls up to 3 times before marking execution as failed"

**Too detailed (should be in Stage 4)**:

> "System SHALL use exponential backoff with base delay of 1000ms and multiplier of 2"

---

## Common Issues to Watch For

| Issue                     | How to Fix                                     |
| ------------------------- | ---------------------------------------------- |
| Requirements too vague    | Add specific acceptance criteria               |
| Requirements too detailed | Move implementation details to Stage 4         |
| Missing error handling    | Add error scenarios                            |
| Missing edge cases        | Add Gherkin scenarios for boundaries           |
| Orphan requirements       | Ensure all FRs trace to HL requirements        |
| Interface mismatch        | Align provider/consumer interface descriptions |
| Duplicate coverage        | Consolidate or assign to single component      |

---

## Approval Criteria

Before marking Stage 3b complete for a component:

1. **Author Review**: Author has reviewed all requirements
2. **Technical Review**: Developer has reviewed for clarity and feasibility
3. **Architecture Review**: Architect confirmed alignment with component responsibility
4. **All Questions Resolved**: No pending Q-XXX items
5. **Sign-off**: Component owner has approved
6. **Version Control**: Document committed

---

## Ready for Stage 4?

Answer these questions for each component:

1. Are all HL requirements assigned to this component fully decomposed?
   - [ ] Yes
   - [ ] No → Add missing FRs

2. Does every FR have testable acceptance criteria?
   - [ ] Yes
   - [ ] No → Add Gherkin scenarios

3. Are error scenarios documented?
   - [ ] Yes
   - [ ] No → Add error handling requirements

4. Are interfaces with other components clear?
   - [ ] Yes
   - [ ] No → Document required/provided interfaces

5. Can a developer start detailed design from these requirements?
   - [ ] Yes
   - [ ] No → Add missing detail or clarify ambiguous requirements

**If all checks pass for all components → Proceed to Stage 4: Detailed Design**

---

## Stage 4 Planning

Before starting Stage 4, for each component identify:

| Component | FR Count | Complexity   | Priority | Owner  |
| --------- | -------- | ------------ | -------- | ------ |
| COMP-XXX  | X        | High/Med/Low | 1        | [Name] |
| COMP-XXX  | X        | High/Med/Low | 2        | [Name] |
| COMP-XXX  | X        | High/Med/Low | 3        | [Name] |

High-complexity or high-priority components should be designed first.
