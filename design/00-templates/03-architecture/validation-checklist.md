# Stage 3: Architecture - Validation Checklist

Use this checklist to verify the Architecture document is complete before proceeding to Stage 4 (Detailed Design).

---

## Completeness Checks

### Architectural Drivers

- [ ] Key functional requirements driving architecture are identified
- [ ] Key NFRs (performance, scalability, availability, security) are listed
- [ ] Architectural impact of each driver is explained
- [ ] Constraints from Overview/Requirements are documented

### System Context

- [ ] Context diagram shows system boundaries
- [ ] All external actors (users, systems) are identified
- [ ] Interactions with external actors are described
- [ ] System scope is clear (what's inside vs outside)

### Solution Strategy

- [ ] Primary architectural pattern is identified (microservices, monolith, etc.)
- [ ] Rationale for pattern choice is explained
- [ ] Key technology decisions are documented
- [ ] ADR references provided for major decisions
- [ ] Architectural principles are articulated

### Component Catalog

- [ ] All major components are identified
- [ ] Each component has unique ID (COMP-XXX)
- [ ] Each component has clear responsibility statement
- [ ] Each component has "NOT responsible for" boundaries
- [ ] Each component maps to requirements it implements
- [ ] Dependencies between components are documented
- [ ] Interface summary is provided for each component

### Component Interactions

- [ ] Communication patterns documented (sync/async)
- [ ] Protocols specified (REST, gRPC, messaging, etc.)
- [ ] Key interaction flows are diagrammed
- [ ] Steps in each flow are described

### Cross-Cutting Concerns

- [ ] Logging strategy documented
- [ ] Error handling strategy documented
- [ ] Security strategy documented
- [ ] Configuration management approach documented
- [ ] Monitoring & observability approach documented
- [ ] Each strategy is consistent and applies system-wide

### Data Architecture

- [ ] Data stores are identified
- [ ] Data ownership by component is clear
- [ ] High-level data flow is documented
- [ ] Consistency model is described

### Deployment Architecture

- [ ] Deployment diagram is provided
- [ ] Environments are listed (dev, staging, prod)
- [ ] Scaling approach is indicated

### Architecture Decision Records

- [ ] ADR exists for each significant decision
- [ ] ADRs follow the template structure
- [ ] ADRs document alternatives considered
- [ ] ADRs explain rationale (WHY)
- [ ] ADRs list consequences

---

## Quality Checks

### Each Component

- [ ] Responsibility is clear and singular (not compound)
- [ ] Boundaries are explicit
- [ ] Can be developed independently
- [ ] Implements traceable requirements
- [ ] Technology choice is appropriate

### Each ADR

- [ ] Context explains the situation requiring decision
- [ ] Decision is clearly stated
- [ ] Rationale explains WHY this option
- [ ] Alternatives are documented
- [ ] Consequences (positive and negative) are listed
- [ ] Implementation notes provided if applicable

### Cross-Cutting Concerns

- [ ] Strategies are specific enough to implement
- [ ] Standards are documented (log format, error codes, etc.)
- [ ] No gaps where behavior is undefined

### Diagrams

- [ ] Context diagram exists
- [ ] Component/container diagram exists
- [ ] Key interaction flows have sequence diagrams
- [ ] Diagrams are up-to-date with text
- [ ] Diagrams are clear and readable

### Consistency

- [ ] Component IDs used consistently
- [ ] Technology choices are consistent across components
- [ ] Patterns are applied consistently
- [ ] Terminology matches Requirements document

---

## Traceability Checks

### Requirements Coverage

- [ ] Every must-have FR is implemented by at least one component
- [ ] Every NFR has an architectural approach
- [ ] Traceability from component → requirements is documented

### Decision Traceability

- [ ] Decisions trace to requirements they address
- [ ] Related decisions reference each other

---

## Common Issues to Watch For

| Issue                  | How to Fix                                                |
| ---------------------- | --------------------------------------------------------- |
| Vague responsibilities | Be specific about what each component does and doesn't do |
| Missing interactions   | Review all FRs to ensure data/control flow is covered     |
| No error strategy      | Document how failures propagate and are handled           |
| Orphan components      | Every component should implement at least one requirement |
| Inconsistent patterns  | Apply same patterns across similar situations             |
| Missing ADRs           | Any "we decided to..." should have an ADR                 |
| Over-detailed          | Save implementation details for Stage 4                   |
| Under-detailed         | Components should be clear enough to design independently |

---

## Approval Criteria

Before marking this stage complete:

1. **Technical Review**: Architecture reviewed by senior engineers
2. **Cross-Team Review**: If components span teams, each team has reviewed
3. **All ADRs Accepted**: No ADRs in "Proposed" status
4. **Open Questions Resolved**: All AQ-XXX items resolved
5. **Sign-off**: Architecture owner has approved
6. **Version Control**: Document committed to version control

---

## Ready for Stage 4?

Answer these questions:

1. Can you draw all components and explain each one's responsibility?
   - [ ] Yes
   - [ ] No → Clarify component definitions

2. Are all component boundaries clear (what's in/out)?
   - [ ] Yes
   - [ ] No → Add "NOT responsible for" sections

3. Are key interaction flows documented?
   - [ ] Yes
   - [ ] No → Add sequence diagrams

4. Are all significant decisions captured in ADRs?
   - [ ] Yes
   - [ ] No → Create missing ADRs

5. Are cross-cutting concerns defined?
   - [ ] Yes
   - [ ] No → Document logging, errors, security, etc.

6. Can teams independently design each component?
   - [ ] Yes
   - [ ] No → Clarify interfaces between components

**If all checks pass → Proceed to Stage 4: Detailed Design**

---

## Stage 4 Planning

Before starting Stage 4, identify which components need detailed design:

| Component | Priority | Owner  | Notes       |
| --------- | -------- | ------ | ----------- |
| COMP-XXX  | High     | [Name] | [Any notes] |
| COMP-XXX  | High     | [Name] | [Any notes] |
| COMP-XXX  | Medium   | [Name] | [Any notes] |

Each high-priority component gets its own detailed design document in Stage 4.
