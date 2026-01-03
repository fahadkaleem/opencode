# ADR-XXX: [Decision Title]

> **Status**: Proposed | Accepted | Deprecated | Superseded by [ADR-XXX]
> **Date**: YYYY-MM-DD
> **Decision Makers**: [Names]
> **Consulted**: [Names of people consulted]
> **Informed**: [Names of people to be informed]

---

## Context

<!--
PURPOSE: Explain the situation that requires a decision.
What is the problem or opportunity we're addressing?

GUIDANCE:
- Describe the current state
- Explain what forces are at play (technical, business, organizational)
- Reference relevant requirements (FR-XXX, NFR-XXX)
- Keep it factual and objective
-->

[Describe the context that led to this decision being needed]

**Relevant Requirements**:

- [FR/NFR-XXX]: [Requirement summary]
- [FR/NFR-XXX]: [Requirement summary]

**Forces at Play**:

- [Force 1 - e.g., "We need to minimize latency"]
- [Force 2 - e.g., "Team has expertise in X technology"]
- [Force 3 - e.g., "Budget constraints limit options"]

---

## Decision

<!--
PURPOSE: State the decision clearly and unambiguously.
Use active voice: "We will..." or "We have decided to..."
-->

**We will [decision].**

[Additional details about the decision if needed]

---

## Rationale

<!--
PURPOSE: Explain WHY this option was chosen over alternatives.
This is the most important section - it preserves the reasoning for future readers.

GUIDANCE:
- Be explicit about the trade-offs
- Explain how this decision addresses the forces described in Context
- Reference any analysis, benchmarks, or research
-->

### Why This Option

[Explain why this option best addresses the context and forces]

### Trade-offs Accepted

| Benefit Gained | Trade-off Accepted |
| -------------- | ------------------ |
| [Benefit]      | [What we give up]  |
| [Benefit]      | [What we give up]  |

---

## Options Considered

<!--
PURPOSE: Document the alternatives that were evaluated.
This helps future readers understand why other approaches weren't chosen.
-->

### Option 1: [Option Name] (Selected)

**Description**: [Brief description of this option]

**Pros**:

- [Pro 1]
- [Pro 2]

**Cons**:

- [Con 1]
- [Con 2]

---

### Option 2: [Option Name]

**Description**: [Brief description of this option]

**Pros**:

- [Pro 1]
- [Pro 2]

**Cons**:

- [Con 1]
- [Con 2]

**Why Not Selected**: [Brief explanation]

---

### Option 3: [Option Name]

**Description**: [Brief description of this option]

**Pros**:

- [Pro 1]
- [Pro 2]

**Cons**:

- [Con 1]
- [Con 2]

**Why Not Selected**: [Brief explanation]

---

## Consequences

<!--
PURPOSE: Document the implications of this decision.
What changes as a result? What new constraints or opportunities emerge?
-->

### Positive Consequences

- [Positive outcome 1]
- [Positive outcome 2]
- [Positive outcome 3]

### Negative Consequences

- [Negative outcome 1 and how we'll mitigate it]
- [Negative outcome 2 and how we'll mitigate it]

### Neutral Consequences

- [Neutral outcome - things that change but aren't good or bad]

---

## Implementation Notes

<!--
PURPOSE: Capture any implementation guidance that follows from this decision.
This helps developers understand how to apply the decision.
-->

### What Changes

- [Component/system that changes and how]
- [New patterns or practices to adopt]

### What Stays the Same

- [Explicitly note what doesn't change if it might be unclear]

### Migration Plan (if applicable)

[If this decision requires migrating from an existing approach, outline the plan]

---

## Validation

<!--
PURPOSE: How will we know if this decision was correct?
What would cause us to revisit this decision?
-->

### Success Criteria

- [How we'll know this decision was right]
- [Metrics or observations to track]

### Review Triggers

This decision should be revisited if:

- [Condition that would trigger a review]
- [Condition that would trigger a review]

---

## Related Decisions

| ADR               | Relationship                                                       |
| ----------------- | ------------------------------------------------------------------ |
| [ADR-XXX](xxx.md) | [How they relate - e.g., "supersedes", "depends on", "related to"] |

---

## References

- [Link to relevant documentation, research, or discussion]
- [Link to benchmarks or analysis]
- [Link to related discussions or tickets]

---

## Decision History

| Date       | Status Change | Notes             |
| ---------- | ------------- | ----------------- |
| YYYY-MM-DD | Proposed      | Initial proposal  |
| YYYY-MM-DD | Accepted      | Approved by [who] |
