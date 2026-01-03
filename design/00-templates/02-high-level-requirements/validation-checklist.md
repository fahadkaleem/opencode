# Stage 2: High-Level Requirements - Validation Checklist

Use this checklist to verify the High-Level Requirements document is complete before proceeding to Stage 3 (Architecture).

---

## Completeness Checks

### User Personas

- [ ] At least 2-3 primary personas defined
- [ ] Each persona has goals and pain points
- [ ] Technical skill level specified
- [ ] Typical scenario provided for each persona

### High-Level Requirements (HL-xxx)

- [ ] All requirements have unique IDs (HL-[AREA]-XXX format)
- [ ] Each requirement has priority (Critical/High/Medium/Low)
- [ ] Each requirement traces to a business goal
- [ ] Each requirement has rationale explaining WHY
- [ ] Each requirement has success criteria
- [ ] Requirements cover all capability areas
- [ ] Requirements are at the right level (capabilities, not features)

### Non-Functional Requirements (NFR-xxx)

- [ ] Performance requirements are quantified
- [ ] Reliability/availability targets specified
- [ ] Security requirements documented
- [ ] Usability requirements documented (if applicable)
- [ ] Scalability targets specified
- [ ] All NFRs are measurable (no vague terms)

### Traceability

- [ ] All business goals have at least one HL requirement
- [ ] Requirements summary table is complete
- [ ] Requirements index is populated

---

## Quality Checks

### Each High-Level Requirement

- [ ] Describes a CAPABILITY (not implementation)
- [ ] Uses "SHALL" for mandatory, "SHOULD" for recommended
- [ ] Is at the right abstraction level (not too detailed)
- [ ] Could map to multiple components (not prescriptive)
- [ ] Has clear business value

### Abstraction Level Test

For each HL requirement, ask:

- Does it describe WHAT the system does, not HOW?
- Could it be implemented in multiple ways?
- Is it too detailed for this stage?

**Too detailed (should be FR)**:

> "System SHALL retry failed API calls 3 times with exponential backoff"

**Right level (HL)**:

> "System SHALL recover gracefully from transient failures"

### Each Non-Functional Requirement

- [ ] Has specific, measurable target
- [ ] Specifies conditions (e.g., "under normal load")
- [ ] Has measurement method defined
- [ ] Is realistic and achievable

---

## Coverage Checks

### Business Goal Coverage

- [ ] Every business goal from Stage 1 has requirements addressing it
- [ ] No orphan requirements (all trace to goals)

### Capability Coverage

For each expected system capability, verify there's an HL requirement:

- [ ] Core functionality covered
- [ ] Error handling covered
- [ ] User-facing capabilities covered
- [ ] Integration capabilities covered
- [ ] Administrative capabilities covered

---

## Common Issues to Watch For

| Issue                     | How to Fix                                             |
| ------------------------- | ------------------------------------------------------ |
| Requirements too detailed | Elevate to capability level, save details for Stage 3b |
| Requirements too vague    | Add success criteria                                   |
| Missing rationale         | Add WHY - business justification                       |
| Implementation-focused    | Reframe as capability, remove technology references    |
| Unmeasurable NFRs         | Add specific targets and measurement methods           |
| Missing persona coverage  | Ensure key personas have requirements supporting them  |
| Overlapping requirements  | Consolidate or clarify boundaries                      |

---

## Approval Criteria

Before marking this stage complete:

1. **Author Review**: Author has reviewed all requirements
2. **Stakeholder Review**: Business stakeholders validated requirements
3. **Technical Review**: Technical lead confirmed requirements are feasible
4. **All Questions Resolved**: No pending Q-XXX items
5. **Sign-off**: Document owner has approved
6. **Version Control**: Document committed to version control

---

## Ready for Stage 3?

Answer these questions:

1. Do you have a complete picture of WHAT the system needs to do?
   - [ ] Yes
   - [ ] No → Add missing capability areas

2. Are all requirements at the capability level (not implementation)?
   - [ ] Yes
   - [ ] No → Elevate detailed requirements

3. Can requirements be grouped into components?
   - [ ] Yes - I can see natural groupings emerging
   - [ ] No → Requirements may be too detailed or too vague

4. Are all NFRs measurable with specific targets?
   - [ ] Yes
   - [ ] No → Add quantified targets

5. Does every business goal have supporting requirements?
   - [ ] Yes
   - [ ] No → Add missing requirements or update traceability

**If all checks pass → Proceed to Stage 3: Architecture**

---

## Preparing for Stage 3

Before starting Stage 3, consider these groupings:

| Potential Component Area | Related HL Requirements |
| ------------------------ | ----------------------- |
| [Area 1]                 | HL-xxx, HL-xxx, HL-xxx  |
| [Area 2]                 | HL-xxx, HL-xxx          |
| [Area 3]                 | HL-xxx, HL-xxx, HL-xxx  |

This exercise helps identify natural component boundaries, but the actual
component design happens in Stage 3.
