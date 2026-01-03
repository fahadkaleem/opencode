# Product Documentation Process Guide

## Overview

This guide describes a **top-down, stage-based approach** to product and system documentation. Each stage builds on the previous one, progressively adding detail until all planning is complete and only implementation remains.

**Philosophy**: Thorough upfront planning minimizes changes during implementation. Each document captures decisions at its level of abstraction, with rationale documented inline.

---

## The Six Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 1: OVERVIEW                                                  │
│  WHY are we building this?                                          │
│  ─────────────────────────────────────────────────────────────────  │
│  Outputs: Problem statement, business goals, success metrics,       │
│           scope, business constraints                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 2: HIGH-LEVEL REQUIREMENTS                                   │
│  WHAT capabilities does the system need?                            │
│  ─────────────────────────────────────────────────────────────────  │
│  Outputs: High-level requirements (HL-xxx), non-functional          │
│           requirements (NFR-xxx), user personas                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 3: HIGH-LEVEL ARCHITECTURE                                   │
│  WHAT are the major components?                                     │
│  ─────────────────────────────────────────────────────────────────  │
│  Outputs: Components, responsibilities, interactions,               │
│           cross-cutting concerns, architecture decisions (ADRs)     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 3b: COMPONENT REQUIREMENTS                                   │
│  WHAT must each component do specifically?                          │
│  ─────────────────────────────────────────────────────────────────  │
│  Outputs: Detailed functional requirements (FR-xxx) per component,  │
│           acceptance criteria in Gherkin format                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 3c: INTEGRATION ARCHITECTURE                                 │
│  HOW do components connect to each other?                           │
│  ─────────────────────────────────────────────────────────────────  │
│  Outputs: Interface contracts, shared schemas, message catalog,     │
│           dependency matrix, data flow diagrams                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 3d: CODING STANDARDS                                         │
│  HOW should code be written?                                        │
│  ─────────────────────────────────────────────────────────────────  │
│  Outputs: Naming conventions, architecture patterns, testing        │
│           standards, error handling, configuration standards        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Stage 4: DETAILED DESIGN                                           │
│  HOW does each component work internally?                           │
│  ─────────────────────────────────────────────────────────────────  │
│  Outputs: API contracts, data models, algorithms, test specs        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ IMPLEMENTATION  │
                    │ (Pure coding)   │
                    └─────────────────┘
```

---

## Stage Details

### Stage 1: Overview

**Purpose**: Define WHY we're building this and WHAT problem we're solving.

**Key Questions to Answer**:

- What problem exists that we're solving?
- Who experiences this problem?
- Why is solving this problem valuable (business case)?
- How will we measure success?
- What's in scope? What's explicitly out of scope?
- What business constraints apply?

**When Complete**: You can explain the product vision to a non-technical stakeholder in 5 minutes and they understand why it matters.

**Outputs**:

- Problem statement
- Business goals (BG-xxx)
- Success metrics (SM-xxx)
- Scope (in/out)
- Business constraints (BC-xxx)
- Stakeholder identification

---

### Stage 2: High-Level Requirements

**Purpose**: Define WHAT capabilities the system needs at a strategic level.

**Key Questions to Answer**:

- Who are the users and what are their goals? (Personas)
- What capabilities must the system provide? (HL requirements)
- What quality attributes must it exhibit? (NFRs)

**When Complete**: You have a comprehensive list of capabilities (~50-150 items) that describe everything the system needs to do, without prescribing how it will be structured.

**Outputs**:

- User personas
- High-level requirements (HL-xxx) organized by capability area
- Non-functional requirements (NFR-xxx) - quantified and measurable

**Key Principle**: HL requirements describe CAPABILITIES, not components. Components emerge in Stage 3.

**Example HL Requirement**:

> HL-WF-001: The system SHALL execute multi-step workflows autonomously without human intervention between phases.

This describes a capability. HOW it's structured (which components handle it) comes later.

---

### Stage 3: High-Level Architecture

**Purpose**: Define the major components and how they're organized.

**Key Questions to Answer**:

- What are the major components/services of the system?
- What is each component responsible for?
- How do components interact with each other?
- How do we handle cross-cutting concerns (logging, security, errors)?
- What key architectural decisions have we made and WHY?

**When Complete**: You can draw a component diagram showing all major parts and their relationships. Each component has clear boundaries and assigned HL requirements.

**Outputs**:

- Component catalog (COMP-xxx)
- Component responsibilities and boundaries
- Component interaction diagrams
- Cross-cutting concern strategies
- Architecture Decision Records (ADRs)
- HL requirement → Component mapping

**Key Activity**: Group HL requirements into components. This is where you decide:

- "HL-WF-001, HL-WF-002, HL-VL-001 → Orchestrator Component"
- "HL-PM-001, HL-PM-002, HL-CM-001 → Execution Engine Component"

---

### Stage 3b: Component Requirements

**Purpose**: Decompose HL requirements into detailed, testable functional requirements for each component.

**Key Questions to Answer**:

- What specific behaviors must this component implement?
- What are the acceptance criteria for each behavior?
- How should errors be handled?
- What interfaces does this component need/provide?

**When Complete**: Each component has a requirements document with specific, testable FRs that fully implement all assigned HL requirements.

**Outputs** (per component):

- Detailed functional requirements (FR-[COMP]-xxx)
- Acceptance criteria in Gherkin format
- Error handling requirements
- Interface requirements (dependencies and dependents)

**Key Principle**: One HL requirement typically decomposes into multiple FRs.

**Example Decomposition**:

```
HL-WF-001: System SHALL execute multi-step workflows autonomously
    └── FR-OR-001: System SHALL load workflow definitions from JSON files
    └── FR-OR-002: System SHALL validate workflow definitions before execution
    └── FR-OR-003: System SHALL execute phases in defined sequence
    └── FR-OR-004: System SHALL pass outputs from one phase to the next
    └── FR-OR-005: System SHALL emit events for each phase transition
```

---

### Stage 3c: Integration Architecture

**Purpose**: Define HOW components connect to each other before designing their internals.

**Key Questions to Answer**:

- What interfaces does each component provide and require?
- What data structures are shared between components?
- What messages/events flow through the system?
- What are the contracts (preconditions, postconditions) for each interface?
- How do errors propagate between components?

**When Complete**: A developer implementing Component A knows exactly what to expect from every component it interacts with, without asking questions.

**Outputs**:

- Integration overview with dependency matrix
- Interface contracts (per component) with Design by Contract specifications
- Shared schemas (data structures used by multiple components)
- Message catalog (all events, commands, queries)

**Key Principle**: Define contracts BETWEEN components before designing WITHIN components. This prevents integration failures and enables parallel development.

**Key Techniques**:

- **Scenario Walkthrough**: Walk through key use cases asking "which components interact here?"
- **Design by Contract**: For each operation, define preconditions, postconditions, and invariants
- **Event Storming**: Identify events by placing "what happened" sticky notes on a timeline
- **Dependency Matrix**: Create a matrix showing all component interactions

**Example Interface Contract**:

```
Operation: AgentManager.spawnAgent(request)

Preconditions:
  - request.phaseId is non-empty string
  - request.command exists in Configuration Manager

Postconditions:
  - Agent is created with unique agentId
  - AGENT_SPAWNED event is published

Errors:
  - INVALID_PHASE_ID: phaseId is empty
  - COMMAND_NOT_FOUND: command doesn't exist
```

---

### Stage 3d: Coding Standards

**Purpose**: Establish HOW code should be written before implementation begins. Standards ensure consistency, maintainability, and quality across all code—especially critical for AI-generated code.

**Key Questions to Answer**:

- What naming conventions apply to variables, functions, classes, files?
- What architectural patterns should be used (services, managers, handlers)?
- How should errors be structured and handled?
- What testing standards apply (coverage, structure, patterns)?
- What configuration formats and settings are required?
- What security and performance practices are mandatory?

**When Complete**: An AI agent (or developer) can write code that is indistinguishable in style from any other code in the project. All rules are unambiguous and enforceable.

**Outputs**:

- Naming conventions (STD-xxx)
- Code style and formatting standards
- Architecture patterns (layers, roles, dependencies)
- TypeScript configuration standards
- Testing standards (structure, coverage, patterns)
- Error handling patterns
- Documentation standards
- Git workflow and commit conventions
- Dependency management standards
- CLI design patterns (for CLI projects)
- Security practices
- Performance guidelines
- Build and CI/CD standards
- AI code generation constraints

**Key Principle**: Standards must be precise enough for AI code generation. Vague rules like "use appropriate naming" are forbidden. Every rule needs:

- Explicit correct/incorrect examples
- Decision trees for complex choices
- ESLint/TypeScript enforcement where possible
- Documented exceptions with justification requirements

**Standard Types**:

| Type                | Purpose                               | Examples                          |
| ------------------- | ------------------------------------- | --------------------------------- |
| Rule-based          | Discrete rules with do/don't examples | Naming, style, git workflow       |
| Pattern-based       | Structural patterns with templates    | Architecture, error handling, CLI |
| Configuration-based | Literal config files                  | TypeScript, dependencies, build   |
| Process-based       | Step-by-step workflows                | Testing, documentation, security  |

**Example Standard Entry**:

```markdown
#### Rule 3.1.1: Boolean Variable Naming

| Attribute       | Value                                        |
| --------------- | -------------------------------------------- |
| **Enforcement** | MUST                                         |
| **Automation**  | ESLint: @typescript-eslint/naming-convention |

**Rule Statement**:
Boolean variables SHALL use is*, has*, can*, or should* prefix.

**Correct Examples**:

- isActive, isValid, isLoading
- hasPermission, hasError
- canEdit, canRetry

**Incorrect Examples**:

- active, valid, loading (missing prefix)
- enabled (use isEnabled)
```

---

### Stage 4: Detailed Design

**Purpose**: Provide implementation-ready specifications for each component.

**Key Questions to Answer** (per component):

- What interfaces does this component expose?
- What data structures does it use?
- What algorithms/logic does it implement?
- What are the test scenarios?
- What are the error codes and responses?

**When Complete**: A developer (or AI) can implement the component from the spec without asking clarifying questions.

**Outputs** (per component):

- Interface specifications (TypeScript interfaces or OpenAPI)
- Data models with validation rules
- Pseudocode for complex logic
- Test specifications (Gherkin scenarios)
- Error catalog

**Template Selection**: Choose the appropriate template based on your project type:

| Project Type               | Template                      | Use When                                                           |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| **Local/CLI applications** | `component-template-local.md` | File-based persistence, internal TypeScript modules, offline-first |
| **HTTP/Web services**      | `component-template-http.md`  | REST APIs, database persistence, networked services                |

See the [Template Selection Guide](#stage-4-template-selection) below for detailed criteria.

---

## Moving Between Stages

### Stage Gates (Validation Checklists)

Before moving from one stage to the next, use the **validation checklist** for that stage. This ensures:

- All required sections are complete
- Content is at the appropriate level of detail
- No open questions remain unresolved

### Handling Discoveries

When later stages reveal issues with earlier decisions:

1. **Minimize by thorough upfront thinking** (preferred)
2. **Document the discovery** in the current stage
3. **If significant**: Go back and update the earlier document
4. **Update traceability**: Ensure IDs and references remain consistent

---

## Document Organization

### Folder Structure for a Project

```
{project}/
├── 01-overview/
│   └── overview.md                    # Stage 1
│
├── 02-high-level-requirements/
│   └── requirements.md                # Stage 2
│
├── 03-architecture/
│   ├── architecture.md                # Stage 3
│   ├── decisions/                     # ADRs
│   │   ├── 001-database-choice.md
│   │   └── ...
│   ├── requirements/                  # Stage 3b
│   │   ├── orchestrator.md
│   │   ├── agent-manager.md
│   │   └── ...
│   └── integration/                   # Stage 3c
│       ├── overview.md                # Dependency matrix, data flows
│       ├── contracts/                 # Per-component interface contracts
│       │   ├── orchestrator.md
│       │   ├── agent-manager.md
│       │   └── ...
│       ├── schemas/                   # Shared data structures
│       │   ├── task-state.md
│       │   ├── workflow-definition.md
│       │   └── ...
│       └── messages/                  # Event/message catalog
│           └── catalog.md
│
├── 99-standards/                      # Stage 3d
│   ├── naming-conventions.md          # STD-001: Naming rules
│   ├── code-style.md                  # STD-002: Formatting, syntax
│   ├── architecture-patterns.md       # STD-003: Layers, roles, patterns
│   ├── typescript-config.md           # STD-004: tsconfig, compiler options
│   ├── testing-standards.md           # STD-005: Test structure, coverage
│   ├── error-handling.md              # STD-006: Error classes, patterns
│   ├── documentation-standards.md     # STD-007: JSDoc, comments
│   ├── git-workflow.md                # STD-008: Commits, branches, PRs
│   ├── dependency-management.md       # STD-009: Packages, versions
│   ├── cli-design.md                  # STD-010: Commands, options, output
│   ├── security-practices.md          # STD-011: Input validation, secrets
│   ├── performance-guidelines.md      # STD-012: Memory, async, caching
│   ├── build-standards.md             # STD-013: Build, CI/CD
│   ├── logging-observability.md       # STD-014: Logs, traces, metrics
│   ├── configuration-management.md    # STD-015: Config files, env vars
│   └── ai-constraints.md              # STD-016: AI-specific rules
│
└── 04-detailed-design/
    ├── orchestrator.md                # Stage 4
    ├── agent-manager.md
    └── ...
```

### ID Conventions

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

### Cross-References

Use explicit references between documents:

```markdown
This component implements [HL-WF-001](../../02-high-level-requirements/requirements.md#hl-wf-001).

Architecture decision [ADR-003](decisions/003-caching-strategy.md) explains
why we use Redis for caching.

See [FR-OR-015](requirements/orchestrator.md#fr-or-015) for retry behavior.
```

---

## Traceability Flow

```
BG-001 (Business Goal)
    │
    └── HL-WF-001 (High-Level Requirement)
            │
            └── COMP-ORCH (Component)
                    │
                    ├── FR-OR-001 (Functional Requirement)
                    ├── FR-OR-002
                    └── FR-OR-003
                            │
                            └── API endpoints, data models (Detailed Design)
```

Every item traces back to business value. No orphan requirements.

---

## Diagrams

### Required Diagrams by Stage

| Stage | Diagram Type                                  | Purpose                             |
| ----- | --------------------------------------------- | ----------------------------------- |
| 1     | (Optional) High-level context                 | Show system in its environment      |
| 2     | User journey diagrams                         | Show how users interact with system |
| 3     | Architecture diagram (C4 Context + Container) | Show components and relationships   |
| 3     | Component interaction diagram                 | Show how components communicate     |
| 4     | Sequence diagrams                             | Show interaction flows              |
| 4     | Data model diagrams                           | Show entity relationships           |

### Diagram Format Options

1. **Mermaid** (recommended for version control)
   - Text-based, renders in GitHub/GitLab
   - Easy to diff and review changes

2. **PlantUML**
   - More diagram types supported
   - Text-based, requires rendering

3. **Image embeds**
   - For diagrams from external tools (Figma, Lucidchart)
   - Store images in an `assets/` folder

---

## Best Practices for AI Consumption

When writing documents that AI will use for code generation:

### DO:

- **Be explicit and quantifiable**: "Response time < 200ms" not "should be fast"
- **Use unique IDs**: Every requirement, component, and API has a traceable ID
- **Include concrete examples**: Show input/output scenarios
- **Define all terms**: Include a glossary for domain-specific terminology
- **Use structured formats**: Tables, lists, Gherkin, and clear sections
- **Provide acceptance criteria**: Specific, testable conditions

### DON'T:

- **Don't be vague**: "Handle errors appropriately" - what does appropriate mean?
- **Don't assume context**: AI doesn't know your organizational conventions
- **Don't mix levels**: Keep each document at its intended abstraction level
- **Don't skip edge cases**: Document what happens in unusual scenarios
- **Don't use ambiguous language**: "Should", "might", "could" → use "SHALL"

---

## Quick Reference

See [quick-reference.md](quick-reference.md) for a 1-page cheat sheet of this process.

---

## Templates

Use the templates in each stage folder:

| Stage           | Template Location                                                 |
| --------------- | ----------------------------------------------------------------- |
| 1               | `01-overview/template.md`                                         |
| 2               | `02-high-level-requirements/template.md`                          |
| 3               | `03-architecture/template.md`                                     |
| 3 (ADR)         | `03-architecture/decisions/adr-template.md`                       |
| 3b              | `03-architecture/requirements/component-requirements-template.md` |
| 3c (Overview)   | `03-architecture/integration/integration-overview-template.md`    |
| 3c (Contract)   | `03-architecture/integration/interface-contract-template.md`      |
| 3c (Schema)     | `03-architecture/integration/shared-schema-template.md`           |
| 3c (Messages)   | `03-architecture/integration/message-catalog-template.md`         |
| 3c (Guide)      | `03-architecture/integration/integration-brainstorming-guide.md`  |
| 3d (Base)       | `99-standards/base-standard-template.md`                          |
| 3d (Rules)      | `99-standards/rule-based-template.md`                             |
| 3d (Patterns)   | `99-standards/pattern-based-template.md`                          |
| 3d (Config)     | `99-standards/configuration-template.md`                          |
| 3d (Process)    | `99-standards/process-template.md`                                |
| 3d (Validation) | `99-standards/validation-checklist.md`                            |
| 4 (Local/CLI)   | `04-detailed-design/component-template-local.md`                  |
| 4 (HTTP/Web)    | `04-detailed-design/component-template-http.md`                   |

Each template includes prompts and example content to guide document creation.

---

## Stage 4 Template Selection

Choose the appropriate Stage 4 template based on your project characteristics:

### Use `component-template-local.md` when:

- Building CLI tools or desktop applications
- Using file-based persistence (JSON, YAML, SQLite)
- Components are internal TypeScript modules (not network services)
- Need to handle concurrent file access and locking
- Require crash recovery and data integrity checks
- Operating in offline-first or local-first mode

**Key sections in this template**:

- TypeScript interface specifications
- File storage schemas and directory structures
- Concurrency and locking strategies
- Atomic write patterns
- Recovery procedures

### Use `component-template-http.md` when:

- Building web services or REST APIs
- Using database persistence (PostgreSQL, MongoDB, etc.)
- Components expose HTTP endpoints
- Authentication and authorization are required
- Horizontal scaling is a concern

**Key sections in this template**:

- OpenAPI-style endpoint specifications
- Database schemas with indexes and relationships
- HTTP status codes and API error responses
- Authentication and permission models
- Connection pooling and caching strategies

### Comparison

| Aspect              | Local Template                     | HTTP Template                 |
| ------------------- | ---------------------------------- | ----------------------------- |
| **Interface style** | TypeScript interfaces              | REST endpoints                |
| **Persistence**     | File system (JSON, directories)    | Database (tables, indexes)    |
| **Concurrency**     | File locks, atomic writes          | Database transactions         |
| **Error handling**  | Error classes, recovery procedures | HTTP status codes, API errors |
| **Security**        | File permissions, local encryption | JWT, RBAC, API keys           |
| **State machines**  | XState-friendly format             | Generic state diagrams        |
| **Testing focus**   | File system mocks, crash recovery  | API testing, DB fixtures      |
