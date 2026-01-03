# Documentation Process Quick Reference

## The Seven Stages

| Stage                  | Focus            | Key Question                  | Output                              |
| ---------------------- | ---------------- | ----------------------------- | ----------------------------------- |
| **1. Overview**        | Business context | WHY are we building this?     | Problem, goals, scope, constraints  |
| **2. HL Requirements** | Capabilities     | WHAT capabilities do we need? | HL-xxx, NFR-xxx (~50-150)           |
| **3. Architecture**    | Components       | WHAT are the parts?           | Components, responsibilities, ADRs  |
| **3b. Component Reqs** | Detailed specs   | WHAT must each part do?       | FR-xxx per component (~350 total)   |
| **3c. Integration**    | Connections      | HOW do parts connect?         | Contracts, schemas, messages        |
| **3d. Standards**      | Code quality     | HOW should code be written?   | STD-xxx (naming, patterns, testing) |
| **4. Detailed Design** | Implementation   | HOW does each part work?      | APIs, data models, algorithms       |

---

## Stage 1: Overview

**Complete when**: Non-technical stakeholder understands the vision in 5 minutes.

| Section         | Question                   | Example                                                  |
| --------------- | -------------------------- | -------------------------------------------------------- |
| Problem         | What pain exists?          | "Developers spend 3 hours daily on manual orchestration" |
| Vision          | What's the ideal state?    | "One-click workflow execution"                           |
| Business Goals  | Why invest in this?        | "Reduce orchestration time by 70%"                       |
| Success Metrics | How do we measure success? | "Workflow success rate ≥ 90%"                            |
| Scope IN        | What's included?           | "Multi-step workflows, provider routing"                 |
| Scope OUT       | What's excluded?           | "Custom UI builder (Phase 2)"                            |
| Constraints     | What limits us?            | "BC-001: Must be open source"                            |

---

## Stage 2: High-Level Requirements

**Complete when**: All capabilities are documented without prescribing components.

| Type           | ID Format     | Example                                                |
| -------------- | ------------- | ------------------------------------------------------ |
| High-Level Req | HL-[AREA]-XXX | HL-WF-001: System SHALL execute workflows autonomously |
| Non-Functional | NFR-[CAT]-XXX | NFR-PERF-001: API response time < 200ms (p95)          |

**Capability Areas** (customize per project):

- WF = Workflow, PM = Provider, CM = Context, SR = State/Recovery, VL = Validation, IN = Integration, UI = Interface

**NFR Categories**:

- PERF = Performance, REL = Reliability, SEC = Security, USE = Usability, MNT = Maintainability, PORT = Portability

---

## Stage 3: Architecture

**Complete when**: You can draw all components and explain each one's responsibility.

| Output                 | Purpose                                         |
| ---------------------- | ----------------------------------------------- |
| Component Catalog      | COMP-XXX with responsibilities                  |
| HL → Component Mapping | Which HL requirements each component implements |
| Interaction Diagram    | How components communicate                      |
| Cross-Cutting Concerns | Logging, security, error handling strategies    |
| ADRs                   | WHY key decisions were made                     |

**Key Activity**: Group HL requirements into components.

---

## Stage 3b: Component Requirements

**Complete when**: Every HL requirement is decomposed into testable FRs.

| Type           | ID Format     | Example                                          |
| -------------- | ------------- | ------------------------------------------------ |
| Functional Req | FR-[COMP]-XXX | FR-OR-001: System SHALL load workflows from JSON |

**Decomposition Example**:

```
HL-WF-001 (autonomous execution)
    ├── FR-OR-001 (load workflow)
    ├── FR-OR-002 (validate workflow)
    ├── FR-OR-003 (execute phases)
    └── FR-OR-004 (pass outputs)
```

**Acceptance Criteria Format (Gherkin)**:

```gherkin
Given [precondition]
When [action]
Then [expected result]
```

---

## Stage 3c: Integration Architecture

**Complete when**: Developers can implement components in parallel without integration questions.

| Output              | Purpose                                                   |
| ------------------- | --------------------------------------------------------- |
| Interface Contracts | Preconditions, postconditions, errors for each operation  |
| Shared Schemas      | Data structures used by multiple components               |
| Message Catalog     | All events, commands, queries with publishers/subscribers |
| Dependency Matrix   | Which components depend on which                          |

**Key Techniques**: Scenario walkthrough, Design by Contract, Event Storming

---

## Stage 3d: Coding Standards

**Complete when**: AI agent can write code indistinguishable from any other code in the project.

| Standard Type | Purpose                 | Examples                     |
| ------------- | ----------------------- | ---------------------------- |
| Rule-based    | Discrete do/don't rules | Naming, style, git workflow  |
| Pattern-based | Structural templates    | Architecture, error handling |
| Configuration | Literal config files    | tsconfig, ESLint, deps       |
| Process       | Step-by-step workflows  | Testing, docs, security      |

**Key Requirement**: Every rule needs correct/incorrect examples and enforcement mechanism.

| ID      | Standard Document        |
| ------- | ------------------------ |
| STD-001 | Naming Conventions       |
| STD-002 | Code Style & Formatting  |
| STD-003 | Architecture Patterns    |
| STD-004 | TypeScript Configuration |
| STD-005 | Testing Standards        |
| STD-006 | Error Handling           |

---

## Stage 4: Detailed Design

**Complete when**: Developer can implement from spec without questions.

| Deliverable  | Format               | Purpose                             |
| ------------ | -------------------- | ----------------------------------- |
| API Contract | OpenAPI/YAML         | Endpoints, request/response, errors |
| Data Model   | Schema + constraints | Types, validation, relationships    |
| Logic        | Pseudocode/flowchart | Algorithms, state machines          |
| Tests        | Gherkin scenarios    | Acceptance criteria, edge cases     |
| Errors       | Error catalog        | Codes, messages, retry behavior     |

---

## ID Conventions

| Type                       | Format         | Example      |
| -------------------------- | -------------- | ------------ |
| Business Goal              | BG-XXX         | BG-001       |
| Success Metric             | SM-XXX         | SM-001       |
| Business Constraint        | BC-XXX         | BC-001       |
| High-Level Requirement     | HL-[AREA]-XXX  | HL-WF-001    |
| Non-Functional Requirement | NFR-[CAT]-XXX  | NFR-PERF-001 |
| Component                  | COMP-XXX       | COMP-ORCH    |
| Architecture Decision      | ADR-XXX        | ADR-001      |
| Functional Requirement     | FR-[COMP]-XXX  | FR-OR-001    |
| Interface Operation        | [COMP]-OP-XXX  | OR-OP-001    |
| Shared Schema              | SCH-XXX        | SCH-001      |
| Message                    | MSG-[TYPE]-XXX | MSG-EVT-001  |
| Coding Standard            | STD-XXX        | STD-001      |

---

## Traceability Flow

```
BG-001 → HL-WF-001 → COMP-ORCH → FR-OR-001 → API/Data Model
```

Every item traces back to business value.

---

## Folder Structure

```
{project}/
├── 01-overview/
│   └── overview.md
├── 02-high-level-requirements/
│   └── requirements.md
├── 03-architecture/
│   ├── architecture.md
│   ├── decisions/
│   │   └── *.md (ADRs)
│   ├── requirements/
│   │   └── {component}.md (Stage 3b)
│   └── integration/
│       ├── overview.md
│       ├── contracts/
│       ├── schemas/
│       └── messages/ (Stage 3c)
├── 99-standards/
│   ├── naming-conventions.md
│   ├── architecture-patterns.md
│   ├── testing-standards.md
│   └── ... (Stage 3d)
└── 04-detailed-design/
    └── {component}.md
```

---

## Stage Gate Checklist Summary

### Before Stage 2

- [ ] Problem statement is clear
- [ ] Business goals are quantified
- [ ] Scope is explicit (IN and OUT)

### Before Stage 3

- [ ] All HL requirements have IDs
- [ ] All NFRs are measurable
- [ ] Requirements trace to business goals

### Before Stage 3b

- [ ] All components identified
- [ ] HL requirements mapped to components
- [ ] Component boundaries are clear

### Before Stage 3c

- [ ] All HL requirements decomposed into FRs
- [ ] All FRs have acceptance criteria
- [ ] Error handling documented per component

### Before Stage 3d

- [ ] Interface contracts defined for all operations
- [ ] Shared schemas documented
- [ ] Message catalog complete with publishers/subscribers

### Before Stage 4

- [ ] All coding standards documented (STD-xxx)
- [ ] Every rule has correct/incorrect examples
- [ ] ESLint/TypeScript configs defined
- [ ] Validation checklist passed

### Before Implementation

- [ ] API contracts complete
- [ ] Data models have validation rules
- [ ] Test scenarios cover happy + edge cases
- [ ] All standards enforced in CI/CD

---

## Abstraction Level Guide

| Too High (Stage 2)           | Right Level                         | Too Low (Stage 4)                          |
| ---------------------------- | ----------------------------------- | ------------------------------------------ |
| "Handle errors gracefully"   | FR: "Retry 3 times before failing"  | "Use exponential backoff with 1000ms base" |
| "Support multiple providers" | FR: "Register providers at runtime" | "Store providers in Map<string, Provider>" |
| "Be fast"                    | NFR: "Response < 200ms p95"         | "Use Redis with 100ms TTL"                 |

---

## Anti-Patterns to Avoid

| Anti-Pattern                                  | Fix                                                    |
| --------------------------------------------- | ------------------------------------------------------ |
| Mixing capability and component in Stage 2    | Keep Stage 2 component-agnostic                        |
| Vague requirements                            | Add measurable acceptance criteria                     |
| Missing traceability                          | Every FR traces to HL, every HL traces to BG           |
| Implementation in requirements                | Save HOW for Stage 4                                   |
| Single massive document                       | Split Stage 3b by component                            |
| Skipping standards for AI code                | AI needs explicit rules; define STD-xxx before Stage 4 |
| Vague standards like "use appropriate naming" | Add correct/incorrect examples + enforcement           |
