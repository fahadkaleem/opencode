# Integration Architecture Brainstorming Guide

## Overview

This guide provides systematic techniques for deriving **component interfaces, shared schemas, and message definitions** from functional requirements. Use this guide during Stage 3c to ensure all components can integrate properly before diving into detailed design.

**Goal**: By the end of Stage 3c, you should be able to answer: _"If I'm implementing Component A, what do I need to know about every other component I interact with?"_

---

## Why This Stage Matters

```
┌──────────────────────────────────────────────────────────────────────┐
│                    THE INTEGRATION GAP                               │
│                                                                      │
│   Stage 3b: Component Requirements                                   │
│   "Each component knows WHAT it must do"                             │
│                          │                                           │
│                          ▼                                           │
│   ┌──────────────────────────────────────────────────────────────┐   │
│   │  ???  HOW DO COMPONENTS TALK TO EACH OTHER  ???              │   │
│   │                                                              │   │
│   │  • What data flows between them?                             │   │
│   │  • What operations can they call on each other?              │   │
│   │  • What assumptions do they make about each other?           │   │
│   │  • What happens when one component fails?                    │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                          │                                           │
│                          ▼                                           │
│   Stage 4: Detailed Design                                           │
│   "Each component knows HOW it works internally"                     │
└──────────────────────────────────────────────────────────────────────┘
```

**Without Stage 3c**: Components designed in isolation often fail to integrate. Assumptions become embedded in code and are expensive to change.

**With Stage 3c**: Contracts are defined upfront. Teams can work in parallel. Integration issues are discovered early when they're cheap to fix.

---

## The Six-Step Interface Derivation Process

Based on the Interface Analysis Template (IAT) methodology:

### Step 1: Map Use Cases to Component Interactions

**Input**: Functional requirements (FRs) from Stage 3b

**Activity**: For each significant FR, identify which components must collaborate.

**Questions to Ask**:

- Which component initiates this behavior?
- Which components must participate to complete it?
- What is the sequence of interactions?

**Output**: Component interaction list per FR

**Example**:

```
FR-OR-007: System SHALL spawn agents for phase execution

Component Interactions:
  1. Orchestrator → Agent Manager: "Spawn agent for this phase"
  2. Agent Manager → Context Manager: "Get context for this agent"
  3. Agent Manager → LLM Manager: "Execute this prompt"
  4. LLM Manager → Agent Manager: "Stream response"
  5. Agent Manager → Orchestrator: "Phase complete with result"
```

---

### Step 2: Identify Interfaces

**Input**: Component interaction lists

**Activity**: For each component pair that interacts, define an interface.

**Questions to Ask**:

- Is this interaction synchronous (call-and-wait) or asynchronous (fire-and-forget)?
- Is this a request-response pattern or a publish-subscribe pattern?
- What is the direction of data flow?

**Output**: Interface inventory

**Template**:
| From Component | To Component | Interface Type | Direction | Description |
|----------------|--------------|----------------|-----------|-------------|
| Orchestrator | Agent Manager | Sync Request-Response | Bidirectional | Spawn/manage agents |
| Agent Manager | Message Manager | Async Publish | Outbound | Emit lifecycle events |

---

### Step 3: Define Data Flows for Each Interface

**Input**: Interface inventory

**Activity**: For each interface, specify what data crosses the boundary.

**Questions to Ask**:

- What information must the caller provide?
- What information does the callee return?
- What error information might flow back?
- Are there optional vs. required fields?

**Output**: Data flow specifications

**Example**:

```
Interface: Orchestrator → Agent Manager (SpawnAgent)

Request Data:
  - phaseId: string (required) - unique identifier for the phase
  - command: string (required) - command name to execute
  - context: object (required) - context for the agent
  - parentAgentId: string (optional) - parent in agent hierarchy

Response Data:
  - agentId: string - unique identifier for spawned agent
  - status: enum [SPAWNED, FAILED]
  - error: object (if status=FAILED)
```

---

### Step 4: Identify Shared Data Structures

**Input**: Data flow specifications from all interfaces

**Activity**: Find data structures that appear across multiple interfaces.

**Questions to Ask**:

- Does this data structure appear in more than one interface?
- Do multiple components need to read/write the same fields?
- Would inconsistent definitions cause integration failures?

**Classification**:
| Type | Characteristics | Example |
|------|-----------------|---------|
| **Global Shared** | Used by 3+ components, same format everywhere | TaskState, WorkflowDefinition |
| **Domain Shared** | Used by 2-3 related components | AgentContext, ExecutionResult |
| **Component-Local** | Used only within one component | Internal cache structure |

**Decision Rule**: If a data structure appears in 2+ interfaces → Extract to shared schema.

**Output**: Shared schema candidates list

---

### Step 5: Define Contract Details (Design by Contract)

**Input**: Interface with data flows

**Activity**: For each interface operation, specify:

1. **Preconditions**: What must be true BEFORE calling?
2. **Postconditions**: What is guaranteed AFTER successful call?
3. **Invariants**: What must ALWAYS be true?
4. **Error Conditions**: What can go wrong and how is it reported?

**Questions to Ask**:

- What happens if the caller violates the precondition?
- What state changes occur on success?
- What side effects should the caller expect?
- How are errors propagated?

**Example**:

```
Operation: AgentManager.spawnAgent(request)

Preconditions:
  - request.phaseId is a valid, non-empty string
  - request.command exists in Configuration Manager
  - Orchestrator has active workflow in progress

Postconditions:
  - Agent is created and registered in Agent Manager
  - Agent has unique agentId
  - AGENT_SPAWNED event is published to Message Manager
  - Parent agent (if specified) has new child reference

Invariants:
  - Total active agents never exceeds configured limit
  - Every agent has exactly one parent (except root agents)

Error Conditions:
  - INVALID_PHASE_ID: phaseId is empty or malformed
  - COMMAND_NOT_FOUND: command doesn't exist
  - AGENT_LIMIT_EXCEEDED: too many concurrent agents
  - PARENT_NOT_FOUND: parentAgentId doesn't exist
```

---

### Step 6: Define Message Schemas (for Async Communication)

**Input**: Event-driven interfaces

**Activity**: For each event/message type, define the schema.

**Questions to Ask**:

- What event types can this component publish?
- Who subscribes to these events?
- What data must each event carry?
- What ordering or delivery guarantees are needed?

**Output**: Message catalog entries

**Example**:

```
Event: AGENT_SPAWNED

Publisher: Agent Manager
Subscribers: Telemetry, User Interface, State Manager

Schema:
  - eventId: string (UUID)
  - timestamp: datetime (ISO 8601)
  - agentId: string
  - phaseId: string
  - command: string
  - parentAgentId: string (nullable)
  - level: enum [PIPELINE, WORKFLOW, PHASE, COMMAND]

Delivery: At-least-once
Ordering: Per-agent ordering guaranteed
```

---

## Workshop Techniques

### Technique 1: Scenario Walkthrough

**Best For**: Discovering interactions for complex workflows

**How To**:

1. Pick a key use case (e.g., "Execute a workflow")
2. Walk through step-by-step: "First X happens, then Y..."
3. At each step, ask:
   - "Which component handles this?"
   - "What data does it need?"
   - "Where does that data come from?"
   - "What happens next?"

**Tip**: Role-play as components. "I'm the Orchestrator. I need to start a phase. Who do I talk to?"

---

### Technique 2: Failure Path Analysis

**Best For**: Discovering error handling interfaces

**How To**:

1. Take a happy-path scenario
2. At each step, ask: "What if this fails?"
3. Trace the error propagation:
   - Who detects the failure?
   - Who needs to be notified?
   - What recovery actions are needed?
   - What state needs to be cleaned up?

**Example Failures to Consider**:

- Network timeout
- Invalid input
- Resource exhausted
- Dependency unavailable
- Permission denied

---

### Technique 3: Event Storming

**Best For**: Discovering events and messages

**How To**:

1. Create a timeline (left = start, right = end)
2. Place events on sticky notes: "X happened"
3. For each event, identify:
   - What triggered it? (Command)
   - Who needs to know? (Subscribers)
   - What data must it carry? (Schema)

**Event Naming Convention**: Past tense verb + noun

- WorkflowStarted
- PhaseCompleted
- AgentSpawned
- ValidationFailed

---

### Technique 4: Dependency Matrix

**Best For**: Ensuring complete interface coverage

**How To**:

1. Create a matrix: components on both axes
2. For each cell (A, B), ask:
   - "Does A ever call B?" → Mark with →
   - "Does A ever send events to B?" → Mark with ⚡
   - "Does A share data with B?" → Mark with 📦

**Example**:

```
             │ Orch │ Agent │ LLM  │ Ctx  │ State │ Msg  │
─────────────┼──────┼───────┼──────┼──────┼───────┼──────┤
Orchestrator │  -   │  →    │      │      │  →    │  ⚡   │
Agent Mgr    │  →   │  -    │  →   │  →   │  →    │  ⚡   │
LLM Manager  │      │  →    │  -   │      │       │  ⚡   │
Context Mgr  │      │       │      │  -   │  →    │      │
State Mgr    │      │       │      │      │  -    │  ⚡   │
Message Mgr  │      │       │      │      │       │  -   │
```

---

### Technique 5: Data Entity Tracing

**Best For**: Identifying shared schemas

**How To**:

1. List all data entities mentioned in FRs (Task, Workflow, Agent, etc.)
2. For each entity, ask:
   - "Which components create this?"
   - "Which components read this?"
   - "Which components update this?"
   - "Which components delete this?"

**Decision**: If multiple components touch the same entity → Shared schema needed.

---

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Implicit Assumptions

**Problem**: "Component A assumes Component B will always return within 100ms"

**Solution**: Make ALL assumptions explicit in the contract. Include:

- Expected response times
- Expected data formats
- Expected error conditions

---

### Pitfall 2: Circular Dependencies

**Problem**: A depends on B, B depends on C, C depends on A

**Detection**: Build dependency matrix, look for cycles

**Solution Options**:

- Introduce an intermediary component
- Use events instead of direct calls
- Restructure responsibilities

---

### Pitfall 3: God Interfaces

**Problem**: One interface tries to do too many things

**Detection**: Interface has 10+ operations or 20+ data fields

**Solution**: Split into focused interfaces by capability area

---

### Pitfall 4: Missing Error Contracts

**Problem**: Happy path is defined, error path is "handle appropriately"

**Solution**: For every interface, explicitly define:

- What errors can occur
- How errors are represented
- What the caller should do for each error type

---

### Pitfall 5: Inconsistent Data Formats

**Problem**: Component A sends dates as "2025-01-15", Component B expects "01/15/2025"

**Solution**: Define shared schemas with explicit formats:

- Date/time: ISO 8601 (2025-01-15T10:30:00Z)
- IDs: Specify format (UUID, prefixed string, etc.)
- Enums: Define all valid values

---

## Checklist Before Moving to Stage 4

Before considering Stage 3c complete, verify:

### Interface Coverage

- [ ] Every component pair that interacts has a defined interface
- [ ] All FRs can be satisfied through the defined interfaces
- [ ] Dependency matrix has no unexpected gaps

### Contract Completeness

- [ ] Every interface operation has preconditions defined
- [ ] Every interface operation has postconditions defined
- [ ] Error conditions are explicitly documented
- [ ] No "handle appropriately" vagueness remains

### Schema Consistency

- [ ] Shared schemas are identified and extracted
- [ ] No duplicate data structure definitions
- [ ] All fields have types and constraints
- [ ] Formats are explicit (dates, IDs, enums)

### Message Catalog

- [ ] All event types are documented
- [ ] Publishers and subscribers are identified
- [ ] Event schemas are complete
- [ ] Delivery guarantees are specified

---

## Artifacts Produced

At the end of Stage 3c, you should have:

| Artifact             | Purpose                        | Location                               |
| -------------------- | ------------------------------ | -------------------------------------- |
| Integration Overview | Big picture, dependency matrix | `integration/overview.md`              |
| Interface Contracts  | Per-component interface specs  | `integration/contracts/{component}.md` |
| Shared Schemas       | Reusable data structures       | `integration/schemas/{schema}.md`      |
| Message Catalog      | All events and messages        | `integration/messages/catalog.md`      |

---

## Integration with Other Stages

### From Stage 3b (Component Requirements)

- FRs tell you WHAT each component must do
- Use FRs to identify WHERE interactions occur
- Every FR should map to interface operations

### To Stage 4 (Detailed Design)

- Interface contracts become API specifications
- Shared schemas become data model definitions
- Message catalog becomes event system implementation

### Traceability

```
FR-OR-007 (Orchestrator spawns agents)
    │
    └── Interface: Orchestrator → Agent Manager
            │
            ├── Operation: spawnAgent()
            │       └── Detailed in: contracts/orchestrator.md
            │
            └── Uses Schema: AgentSpawnRequest
                    └── Defined in: schemas/agent-context.md
```

---

## Quick Reference

### Key Questions for Each Interface

1. **Who calls whom?** (Direction)
2. **Sync or async?** (Pattern)
3. **What data flows?** (Schema)
4. **What can go wrong?** (Errors)
5. **What must be true before?** (Preconditions)
6. **What is guaranteed after?** (Postconditions)

### Interface Documentation Checklist

For each interface, document:

- [ ] Operation name and purpose
- [ ] Input parameters with types
- [ ] Output values with types
- [ ] Preconditions
- [ ] Postconditions
- [ ] Error conditions
- [ ] Performance expectations (if applicable)

### Shared Schema Checklist

For each shared schema, document:

- [ ] Schema name and purpose
- [ ] All fields with types
- [ ] Required vs optional fields
- [ ] Validation rules
- [ ] Format specifications
- [ ] Which components use it
- [ ] Concrete example
