# Stage 3c: Integration Architecture - Validation Checklist

Use this checklist to verify the Integration Architecture is complete before proceeding to Stage 4 (Detailed Design).

---

## Completeness Checks

### Integration Overview

- [ ] Dependency matrix includes all components
- [ ] All component pairs that interact are identified
- [ ] Communication patterns (sync/async) are documented
- [ ] Data flow diagrams cover major workflows
- [ ] Shared schema summary is complete
- [ ] Interface contract index links to all contracts

### Interface Contracts (Per Component)

- [ ] All provided interfaces are documented
- [ ] All required interfaces (dependencies) are documented
- [ ] Each operation has request/response schemas
- [ ] Preconditions are explicit for each operation
- [ ] Postconditions are explicit for each operation
- [ ] Error conditions are documented with error codes
- [ ] Events published are listed
- [ ] Events subscribed are listed

### Shared Schemas

- [ ] All schemas used by 2+ components are extracted
- [ ] Each schema has complete field definitions
- [ ] Field types and constraints are explicit
- [ ] Required vs optional fields are marked
- [ ] Format specifications are explicit (dates, IDs, etc.)
- [ ] Enum values are fully defined
- [ ] Validation rules are documented
- [ ] Usage by component is documented
- [ ] Examples are provided

### Message Catalog

- [ ] All events are documented
- [ ] All commands are documented
- [ ] All queries are documented
- [ ] Each message has publisher/sender identified
- [ ] Each message has subscribers/handler identified
- [ ] Payload schemas are complete
- [ ] Delivery guarantees are specified
- [ ] Message flows are documented for key scenarios

---

## Quality Checks

### Interface Contracts

- [ ] Preconditions are testable (not vague)
- [ ] Postconditions are verifiable
- [ ] Error codes are specific and actionable
- [ ] No "handle appropriately" vagueness
- [ ] Operations are at the right granularity (not too coarse, not too fine)

### Shared Schemas

- [ ] No duplicate schema definitions across documents
- [ ] Schema names are consistent across all references
- [ ] Field names follow consistent conventions
- [ ] Nested structures are fully defined
- [ ] Lifecycle (create/update/delete) is documented

### Message Catalog

- [ ] Event names use past tense (e.g., WorkflowStarted)
- [ ] Command names use imperative (e.g., StartWorkflow)
- [ ] Message payloads contain only necessary data
- [ ] No sensitive data in message payloads
- [ ] Ordering requirements are specified where needed

### Consistency

- [ ] Schema names match across overview, contracts, and catalog
- [ ] Component IDs are consistent (COMP-XXX format)
- [ ] Operation IDs follow convention ([COMP]-OP-XXX)
- [ ] Message IDs follow convention (MSG-[TYPE]-XXX)
- [ ] Error codes are consistent across components

---

## Coverage Checks

### FR to Interface Coverage

- [ ] Every FR maps to at least one interface operation
- [ ] Every interface operation traces to at least one FR
- [ ] No orphan operations (operations without FRs)
- [ ] No orphan FRs (FRs without operations)

### Component Coverage

- [ ] Every component has an interface contract document
- [ ] Every component that publishes events is documented
- [ ] Every component that subscribes to events is documented
- [ ] Dependency matrix has no unexpected blanks

### Schema Coverage

- [ ] Every data structure in interface operations references a schema
- [ ] Every message payload references a schema
- [ ] No inline schema definitions (all extracted to schemas/)

---

## Dependency Checks

### Circular Dependencies

- [ ] No circular synchronous dependencies (A → B → A)
- [ ] If cycles exist via events, they are intentional and documented
- [ ] Dependency matrix reviewed for cycles

### Missing Dependencies

- [ ] Every "required interface" has a matching "provided interface"
- [ ] No component requires interface that doesn't exist
- [ ] Event subscribers match event publishers

### Dependency Rationality

- [ ] Components only depend on what they need
- [ ] No unnecessary dependencies
- [ ] Infrastructure components (Message Manager, Config Manager) have minimal dependencies

---

## Contract Quality Checks

### Design by Contract Principles

For each interface operation, verify:

- [ ] Preconditions define caller's obligations
- [ ] Postconditions define component's guarantees
- [ ] Invariants define always-true conditions
- [ ] Contract is sufficient to implement against

### Error Handling

- [ ] Every operation documents what can go wrong
- [ ] Error codes are unique and descriptive
- [ ] Caller actions for each error are specified
- [ ] Retry-able vs non-retry-able errors are distinguished

### Performance Contracts

- [ ] Operations with SLAs have them documented
- [ ] Throughput expectations are specified where relevant
- [ ] Timeout expectations are documented

---

## Common Issues to Watch For

| Issue                    | How to Fix                                                                  |
| ------------------------ | --------------------------------------------------------------------------- |
| Vague preconditions      | Make them specific and testable: "X must be non-null" not "X must be valid" |
| Missing error cases      | Walk through failure scenarios for each operation                           |
| Duplicate schemas        | Extract to shared schema, reference from both places                        |
| Inconsistent field names | Establish naming conventions, apply consistently                            |
| Missing async flows      | Trace event flows for all key scenarios                                     |
| Implicit assumptions     | Make all assumptions explicit in contracts                                  |
| Over-coupled interfaces  | Split large interfaces into focused smaller ones                            |
| Under-specified messages | Ensure all payload fields are documented                                    |

---

## Approval Criteria

Before marking Stage 3c complete:

1. **Author Review**: Author has reviewed all documents
2. **Technical Review**: Senior engineer has reviewed contracts
3. **Cross-Component Review**: Each component owner has reviewed interfaces they provide/require
4. **All Questions Resolved**: No open integration questions remain
5. **Sign-off**: Architecture owner has approved
6. **Version Control**: All documents committed

---

## Ready for Stage 4?

Answer these questions:

1. **Can a developer implement Component A without asking about Component B?**
   - [ ] Yes - contracts are sufficient
   - [ ] No → Add missing details to contracts

2. **Are all data structures that cross boundaries defined?**
   - [ ] Yes - shared schemas are complete
   - [ ] No → Extract missing schemas

3. **Can integration tests be written from these contracts?**
   - [ ] Yes - contracts are testable
   - [ ] No → Make preconditions/postconditions more specific

4. **Are all async flows documented?**
   - [ ] Yes - message catalog is complete
   - [ ] No → Add missing events/flows

5. **Are error scenarios covered?**
   - [ ] Yes - error conditions documented
   - [ ] No → Walk through failure paths

6. **Is the dependency matrix complete and cycle-free?**
   - [ ] Yes
   - [ ] No → Resolve dependencies

**If all checks pass → Proceed to Stage 4: Detailed Design**

---

## Stage 4 Planning

Before starting Stage 4, prioritize components:

| Component | Interface Complexity | Dependencies | Priority |
| --------- | -------------------- | ------------ | -------- |
| COMP-XXX  | High/Med/Low         | X            | 1        |
| COMP-XXX  | High/Med/Low         | X            | 2        |

**Recommendation**: Start with components that have:

1. Fewest dependencies (can be designed independently)
2. Most dependents (unblocks other components)
3. Highest complexity (benefits most from detailed design)

---

## Integration Testing Planning

From Stage 3c artifacts, identify integration test scenarios:

| Scenario        | Components         | Key Messages | Priority |
| --------------- | ------------------ | ------------ | -------- |
| [Scenario name] | COMP-XXX, COMP-XXX | MSG-EVT-XXX  | High     |

These scenarios become integration test specifications in Stage 4.
