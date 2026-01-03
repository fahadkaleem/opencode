# Agent Executor - Functional Requirements

> **Component ID**: COMP-007
> **Document Version**: 4.2
> **Last Updated**: 2025-12-03
> **Status**: Draft
> **Owner**: Architecture Team
> **Related Documents**:
>
> - [Architecture Document](../00-architecture.md)
> - [High-Level Requirements](../../02-high-level-requirements/02-requirements.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the detailed functional requirements for the **Agent Executor** component. These requirements decompose the high-level requirements assigned to this component into specific, testable specifications.

This component consolidates what was previously split between Agent Executor (COMP-007) and LLM Manager (COMP-005) into a unified agent execution system.

> **Note**: FlowMaster follows a desktop-first development approach. Test scenarios in this document may reference CLI commands (e.g., `flowmaster provider list`) as examples. These represent functionality that will be available through both the Desktop UI (primary) and CLI (future, for automation). The Desktop UI will provide equivalent operations through its interface.

### 1.2 Component Summary

| Attribute                      | Value                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Component ID**               | COMP-007                                                                                                                                                                                                                                                                                                                                                                 |
| **Responsibility**             | Manages agent lifecycle (create, run, pause, resume, complete, terminate), spawns agents at each level (workflow, phase, command), maintains parent-child agent hierarchy, routes clarification questions up the hierarchy, pauses/resumes agents awaiting clarification, LLM integration, tool management, streaming output processing, provider selection and fallback |
| **Implements HL Requirements** | HL-WF-008, HL-CM-003, HL-VL-004, HL-PM-001, HL-PM-002, HL-PM-003, HL-PM-004, HL-PM-005, HL-PM-006, HL-PM-007, HL-AU-001                                                                                                                                                                                                                                                  |

### 1.3 Key Concept: Templates vs Agents

**A Command Template (static definition) is hydrated into a Command Agent (runtime instance) during execution.**

| Concept              | Owner                 | Description                                                                                                                 |
| -------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Command Template** | Configuration Manager | Static markdown file with instructions, context requirements, and metadata. Stored in `.flowmaster/commands/`.              |
| **Command Agent**    | Agent Executor        | Runtime instance created when a command executes. Has lifecycle, session, parent reference, and can request clarifications. |

The Configuration Manager provides the template; the Agent Executor creates and manages the running agent instance from that template.

### 1.4 Key Concept: Two-Phase Execution

AgentExecutor uses a two-phase execution pattern via Vercel AI SDK:

1. **Phase 1**: `generateText()` with tools - Agent performs agentic work (file operations, code changes, research)
2. **Phase 2**: `generateObject()` with schema - Extract guaranteed structured output for workflow continuation

This pattern ensures agents can leverage AI capabilities for complex tasks while producing deterministic, type-safe outputs for downstream processing.

### 1.5 Requirement ID Convention

All requirements in this document follow the format: **FR-AM-XXX**

| Component      | Prefix | Example   |
| -------------- | ------ | --------- |
| Agent Executor | FR-AM  | FR-AM-001 |

**Note**: Former LLM Manager requirements (FR-LM-XXX) have been renumbered to FR-AM-XXX. See Section 6.3 for the mapping table.

### 1.6 Priority Levels

| Priority     | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Component cannot function without this. Must be in MVP.          |
| **High**     | Important for component's core responsibility. Should be in MVP. |
| **Medium**   | Valuable but not essential for initial release.                  |
| **Low**      | Nice to have. Future consideration.                              |

### 1.7 Document Organization

This document follows progressive disclosure, organizing requirements from foundational to advanced:

| Section                           | Purpose                                 | Dependencies          |
| --------------------------------- | --------------------------------------- | --------------------- |
| 2.1 Core Lifecycle                | Agent creation, states, cleanup         | None (foundational)   |
| 2.2 Hierarchy Management          | Parent-child relationships, spawning    | Core Lifecycle        |
| 2.3 Session Management            | Session tracking, resumption, isolation | Hierarchy Management  |
| 2.4 Context Accumulation          | Output accumulation, context flow       | Session Management    |
| 2.5 Clarification Routing         | Questions, escalation, responses        | Hierarchy + Context   |
| 2.6 Provider Management           | Provider registration, auth, selection  | None (foundational)   |
| 2.7 LLM Integration               | Execution, context, defaults resolution | Provider Management   |
| 2.8 Structured Output             | Schema validation, output structure     | LLM Integration       |
| 2.9 Streaming & Output Processing | Real-time output, events, artifacts     | LLM Integration       |
| 2.10 Tool System                  | Tool registry, restrictions, metadata   | LLM Integration       |
| 2.11 Reliability & Recovery       | Fallback, retry, rate limiting          | Provider Management   |
| 2.12 Advanced Capabilities        | Validation, orchestration, logging      | All previous sections |

---

## 2. Functional Requirements

### 2.1 Core Lifecycle

This section covers foundational agent lifecycle operations that all other capabilities depend on.

---

#### FR-AM-001: Agent Creation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-008 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL create agents at each orchestration level (workflow, phase, command) with appropriate configuration and parent references so that agents can be properly managed and communicate within the hierarchy.

**Acceptance Criteria**:

```gherkin
Scenario: Create a top-level workflow agent
  Given a workflow is starting execution
  When the system creates a workflow agent
  Then the agent should be assigned a unique identifier
  And the agent should have no parent reference (root agent)
  And the agent should be in "created" state
  And the agent should be registered in the agent registry

Scenario: Create a nested workflow agent with parent
  Given a workflow agent exists with ID "workflow-123" and uses another workflow
  When the system creates a child workflow agent for the referenced workflow
  Then the agent should be assigned a unique identifier
  And the agent should have parent reference to "workflow-123"
  And the agent should be in "created" state

Scenario: Create a command agent with parent
  Given a phase agent exists with ID "phase-456"
  When the system creates a command agent for command "implement"
  Then the agent should be assigned a unique identifier
  And the agent should have parent reference to "phase-456"
  And the agent should be in "created" state
```

**Rationale**:
Agents must be created with proper hierarchy references to enable clarification routing and lifecycle management. Each level of orchestration requires its own agent instance.

---

#### FR-AM-002: Agent State Transitions

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-001 |

**Requirement**:
The system SHALL manage agent state transitions through a defined lifecycle (created → running → paused/completed/terminated) so that agent status is predictable and queryable.

**Acceptance Criteria**:

```gherkin
Scenario: Transition agent from created to running
  Given an agent exists in "created" state
  When the agent begins execution
  Then the agent state should transition to "running"
  And a state change event should be emitted

Scenario: Pause a running agent
  Given an agent exists in "running" state
  When a clarification is requested
  Then the agent state should transition to "paused"
  And the agent execution should be suspended
  And the pause reason should be recorded

Scenario: Resume a paused agent
  Given an agent exists in "paused" state
  And a clarification answer has been received
  When the agent is resumed
  Then the agent state should transition to "running"
  And execution should continue from where it paused

Scenario: Complete a running agent successfully
  Given an agent exists in "running" state
  When the agent finishes execution successfully
  Then the agent state should transition to "completed"
  And the agent output should be captured

Scenario: Terminate an agent due to failure
  Given an agent exists in "running" state
  When the agent encounters an unrecoverable error
  Then the agent state should transition to "terminated"
  And the error details should be recorded
```

**Rationale**:
Clear state transitions enable proper lifecycle management and allow the system to handle pausing for clarifications, resumption after answers, and proper cleanup on completion or failure.

---

#### FR-AM-003: Agent Cleanup on Completion

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-002 |

**Requirement**:
The system SHALL clean up agent resources when agents complete, fail, or are terminated so that system resources are properly released and no orphaned agents remain.

**Acceptance Criteria**:

```gherkin
Scenario: Cleanup completed agent
  Given an agent has transitioned to "completed" state
  When cleanup is triggered
  Then the agent session should be closed
  And the agent should be removed from the active registry
  And child agents should be cleaned up recursively

Scenario: Cleanup terminated agent with children
  Given a workflow agent has been terminated
  And it has 3 active child phase agents
  When cleanup is triggered
  Then all child agents should be terminated
  And all agent sessions should be closed
  And no orphaned agents should remain

Scenario: Force cleanup on timeout
  Given an agent has been in "running" state
  And the agent has exceeded its maximum execution time
  When the timeout is reached
  Then the agent should be forcefully terminated
  And cleanup should proceed normally
```

**Rationale**:
Proper cleanup prevents resource leaks and ensures the system remains stable during long-running operations. Hierarchical cleanup ensures no orphaned child agents.

---

### 2.2 Hierarchy Management

This section covers parent-child relationships and hierarchical spawning. These capabilities build on core lifecycle management.

---

#### FR-AM-004: Hierarchical Agent Spawning

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-001 |

**Requirement**:
The system SHALL support hierarchical spawning where workflow agents spawn phase agents, phase agents spawn command agents, and workflow agents can spawn child workflow agents (via uses:) so that the agent hierarchy mirrors the execution hierarchy.

**Acceptance Criteria**:

```gherkin
Scenario: Workflow agent spawns phase agent
  Given a workflow agent is executing
  When the workflow reaches a phase to execute
  Then the workflow agent should spawn a phase agent
  And the phase agent should have the workflow agent as parent
  And the phase agent should inherit workflow context

Scenario: Phase agent spawns command agent
  Given a phase agent is executing
  When the phase reaches a command to execute
  Then the phase agent should spawn a command agent
  And the command agent should have the phase agent as parent
  And the command agent should receive phase context

Scenario: Workflow agent spawns child workflow agent via uses
  Given a workflow agent is executing
  When the workflow uses another workflow via uses:
  Then the parent workflow agent should spawn a child workflow agent
  And the child workflow agent should have the parent workflow agent as parent
  And the child workflow agent should inherit parent workflow context
```

**Rationale**:
Hierarchical spawning enables proper context flow and clarification routing. Each level spawns the next level, maintaining clear parent-child relationships throughout execution. Workflow composition via uses: creates nested workflow agent hierarchies.

---

#### FR-AM-005: Parent-Child Relationship Tracking

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-004 |

**Requirement**:
The system SHALL maintain bidirectional parent-child relationships between agents so that clarifications can route up and answers can route down the hierarchy.

**Acceptance Criteria**:

```gherkin
Scenario: Query parent from child agent
  Given a command agent with parent phase agent "phase-123"
  When the command agent queries its parent
  Then it should receive reference to phase agent "phase-123"
  And the parent should be in a valid state

Scenario: Query children from parent agent
  Given a workflow agent with ID "workflow-456"
  And 3 phase agents have been spawned by this workflow
  When the workflow agent queries its children
  Then it should receive references to all 3 phase agents
  And the children should be in their current states

Scenario: Maintain relationship after child completion
  Given a workflow agent with 2 active phase agents
  When one phase agent completes
  Then the completed agent should be removed from active children
  And the workflow agent should still track the remaining child
```

**Rationale**:
Bidirectional relationships enable clarification routing (child to parent) and answer delivery (parent to child). Proper tracking ensures the hierarchy remains consistent throughout execution.

---

### 2.3 Session Management

This section covers session tracking, long-running sessions, and session isolation. These capabilities build on hierarchy management.

---

#### FR-AM-006: Session ID Tracking

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CM-003 |
| **Dependencies** | FR-AM-001 |

**Requirement**:
The system SHALL capture and persist session identifiers for multi-turn AI conversations so that conversation resumption is enabled across workflow phases.

**Acceptance Criteria**:

```gherkin
Scenario: Capture session ID from provider response
  Given a command agent is executing via LLM provider
  When the provider returns a response with session ID
  Then the session ID should be captured
  And the session ID should be associated with the agent
  And the session ID should be stored in the phase execution record

Scenario: Session ID persists across agent lifecycle
  Given a command agent has captured session ID "session-abc-123"
  When the agent completes execution
  Then the session ID should be persisted in task state
  And the session ID should be available for future resumption
```

**Rationale**:
Session IDs enable multi-turn conversations where AI maintains context across interactions. Tracking and persisting session IDs is essential for conversation continuity and session resumption.

---

#### FR-AM-007: Long-Running Workflow Agent Sessions

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-WF-008            |
| **Dependencies** | FR-AM-001, FR-AM-006 |

**Requirement**:
The system SHALL maintain long-running agent sessions for workflow agents throughout workflow execution so that workflow agents maintain continuity and accumulated context across all phases.

**Acceptance Criteria**:

```gherkin
Scenario: Workflow session persists across phases
  Given a workflow agent is created for workflow "feature-dev"
  When phase 1 "plan" completes
  And phase 2 "implement" begins
  Then the workflow agent session should still be active
  And the session should include phase 1 outputs

Scenario: Workflow session cleaned up on completion
  Given a workflow agent has completed all phases
  When the workflow is marked complete
  Then the workflow agent session should be closed
  And accumulated context should be persisted to state
```

**Rationale**:
Workflow agents need continuous sessions to maintain context across phases, answer clarifications with accumulated knowledge, and provide consistent guidance throughout workflow execution.

---

#### FR-AM-008: Long-Running Orchestrating Workflow Agent Sessions

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Medium               |
| **Implements**   | HL-WF-008            |
| **Dependencies** | FR-AM-001, FR-AM-006 |

**Requirement**:
The system SHALL maintain long-running agent sessions for orchestrating workflow agents that compose other workflows (via uses:) so that parent workflow agents maintain project-wide context across all child workflows.

**Acceptance Criteria**:

```gherkin
Scenario: Parent workflow session persists across child workflows
  Given a parent workflow agent is created for a workflow that uses other workflows
  When child workflow 1 "backend" completes
  And child workflow 2 "frontend" begins
  Then the parent workflow agent session should still be active
  And the session should include child workflow 1 outcomes

Scenario: Parent workflow session answers cross-workflow questions
  Given a parent workflow agent has context from child workflow 1
  When child workflow 2 asks about "API contract established in child workflow 1"
  Then the parent workflow agent should answer using child workflow 1 context
```

**Rationale**:
Orchestrating workflow agents coordinate multiple child workflows (via uses:) and need persistent sessions to maintain project-wide context, answer cross-workflow questions, and ensure architectural consistency.

---

#### FR-AM-009: Session Resumption

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CM-003 |
| **Dependencies** | FR-AM-006 |

**Requirement**:
The system SHALL support resuming AI sessions using stored session identifiers so that multi-turn conversations can continue across workflow phases or after interruptions.

**Acceptance Criteria**:

```gherkin
Scenario: Resume session for multi-turn conversation
  Given a previous execution stored session ID "session-abc-123"
  When a new execution requests session resumption
  Then the stored session ID should be passed to the LLM provider
  And the provider should restore conversation context
  And the conversation should continue from previous state

Scenario: Handle invalid session ID gracefully
  Given a stored session ID "session-expired-456" that is no longer valid
  When the system attempts to resume the session
  Then the system should detect the invalid session
  And the system should start a fresh session
  And a warning should be logged
```

**Rationale**:
Session resumption enables iterative refinement within phases and recovery from interruptions. This maintains conversation context without losing prior interactions.

---

#### FR-AM-010: Session Isolation Between Phases

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CM-003 |
| **Dependencies** | FR-AM-006 |

**Requirement**:
The system SHALL ensure each phase gets its own isolated session so that context rot is prevented and phases do not inadvertently share conversation state.

**Acceptance Criteria**:

```gherkin
Scenario: New phase gets fresh session
  Given phase 1 "plan" completed with session ID "session-plan-123"
  When phase 2 "implement" begins execution
  Then phase 2 should start with a new session
  And phase 2 should NOT inherit session "session-plan-123"
  And each phase should have its own isolated session ID

Scenario: Parallel phases have independent sessions
  Given a parallel block with 3 commands executing simultaneously
  When all 3 commands start execution
  Then each command should have its own unique session ID
  And sessions should not interfere with each other
  And outputs should be correctly attributed to each session
```

**Rationale**:
Session isolation prevents context rot—the core problem FlowMaster solves. Each phase operates with fresh context while explicit dependencies provide controlled context sharing.

---

#### FR-AM-011: Multi-Turn Command Conversations

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-WF-008            |
| **Dependencies** | FR-AM-006, FR-AM-009 |

**Requirement**:
The system SHALL support multi-turn conversations for command execution with multiple clarification cycles so that complex commands can iteratively resolve ambiguities.

**Acceptance Criteria**:

```gherkin
Scenario: Command asks multiple clarifications
  Given a command agent is executing a complex task
  When the command asks clarification question 1
  And receives an answer
  And then asks clarification question 2
  Then both questions should be handled in sequence
  And conversation history should be maintained
  And the command should continue after both answers

Scenario: Maximum turn limit prevents infinite loops
  Given a command agent has asked 10 clarification questions
  When the command attempts to ask an 11th question
  Then the system should reject the request
  And the command should be forced to proceed or fail
```

**Rationale**:
Complex tasks may require multiple clarifications to resolve all ambiguities. Supporting multi-turn conversations enables thorough resolution while preventing infinite clarification loops.

---

#### FR-AM-012: Checkpoint Resume on Approval

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-CM-003            |
| **Dependencies** | FR-AM-002, FR-AM-009 |

**Requirement**:
The system SHALL resume workflow execution from paused state upon user approval so that human-in-loop workflows can continue after checkpoint review.

**Acceptance Criteria**:

```gherkin
Scenario: Resume workflow after checkpoint approval
  Given a workflow is paused at an approval checkpoint
  And the user has reviewed the phase output
  When the user approves continuation
  Then the workflow should resume from the checkpoint
  And subsequent phases should execute normally
  And workflow state should be maintained across pause/resume

Scenario: Resume agent with approval context
  Given an agent is paused awaiting approval
  When approval is granted with optional feedback
  Then the agent should receive the approval status
  And any feedback should be included in resumed context
  And the agent should continue execution
```

**Rationale**:
Checkpoint resumption completes the human-in-loop approval process, allowing workflows to pause for human review and continue after approval without losing progress.

---

### 2.4 Context Accumulation

This section covers how agents accumulate and flow context. These capabilities build on session management.

---

#### FR-AM-013: Phase Output Accumulation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-007 |

**Requirement**:
The system SHALL accumulate context in workflow agents as phases complete so that later phases and clarification answers can reference earlier phase results.

**Acceptance Criteria**:

```gherkin
Scenario: Accumulate output from completed phase
  Given a workflow agent is managing workflow execution
  When phase "plan" completes with output
  Then the workflow agent should add phase output to accumulated context
  And the output should be available for subsequent phases
  And the output should be available when answering clarifications

Scenario: Multiple phase outputs accumulated
  Given phases "plan" and "implement" have completed
  When a clarification references "the plan from earlier"
  Then the workflow agent should have both phase outputs in context
  And should be able to reference specific phase outputs by name
```

**Rationale**:
Accumulated context enables workflow agents to provide informed answers and enables later phases to build on earlier work. This is essential for maintaining continuity across the workflow.

---

#### FR-AM-014: Context Flow to Child Agents

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-013 |

**Requirement**:
The system SHALL flow accumulated context from parent agents to child agents based on declared dependencies so that child agents have access to relevant prior outputs.

**Acceptance Criteria**:

```gherkin
Scenario: Command receives dependent phase output
  Given a command declares dependency on phase "plan"
  And phase "plan" has completed with output
  When the command agent is created
  Then the command should receive the plan phase output
  And the output should be included in command context

Scenario: No context leak without dependency
  Given a command does not declare dependency on phase "plan"
  When the command agent is created
  Then the command should not automatically receive plan output
  And only explicitly declared dependencies should be provided
```

**Rationale**:
Context flow based on dependencies ensures commands receive relevant information without context overload. This supports the principle of providing only necessary context to each agent.

---

### 2.5 Clarification Routing

This section covers how agents ask questions and route them through the hierarchy. These capabilities build on hierarchy management and context accumulation.

---

#### FR-AM-015: Command Clarification Requests

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-005 |

**Requirement**:
The system SHALL allow command agents to emit clarification requests when encountering ambiguity so that commands can resolve uncertainties during execution rather than guessing or failing.

**Acceptance Criteria**:

```gherkin
Scenario: Command emits clarification request
  Given a command agent is executing
  When the command encounters an ambiguous requirement
  Then the command should emit a structured clarification request
  And the request should include the question text
  And the request should include context about the ambiguity
  And the command should transition to "paused" state

Scenario: Clarification request includes context
  Given a command agent working on "implement authentication"
  When the command needs clarification on "which auth library to use"
  Then the clarification request should include:
    | field | value |
    | question | "Which authentication library should be used?" |
    | context | "Implementing user authentication feature" |
    | options | ["passport", "auth0-sdk", "custom"] |
  And the request should be routed to the parent agent
```

**Rationale**:
Commands often encounter situations where requirements are ambiguous or multiple valid approaches exist. Clarification requests enable intelligent decision-making rather than arbitrary choices.

---

#### FR-AM-016: Clarification Routing to Parent

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-015 |

**Requirement**:
The system SHALL route clarification requests from child agents to their parent agents so that parents can answer questions using their broader context.

**Acceptance Criteria**:

```gherkin
Scenario: Route clarification from command to phase
  Given a command agent has emitted a clarification request
  When the request is processed
  Then the request should be delivered to the parent phase agent
  And the phase agent should receive the full request context
  And the command agent should remain paused

Scenario: Route clarification from phase to workflow
  Given a phase agent cannot answer a clarification
  When the phase escalates to its parent
  Then the request should be delivered to the parent workflow agent
  And the escalation reason should be included
  And the original question context should be preserved
```

**Rationale**:
Parent agents have broader context from previous phases and higher-level decisions. Routing clarifications up the hierarchy leverages this accumulated knowledge.

---

#### FR-AM-017: Parent Agent Clarification Response

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-016 |

**Requirement**:
The system SHALL enable parent agents to answer clarification requests using their accumulated context so that child agents can continue execution with informed guidance.

**Acceptance Criteria**:

```gherkin
Scenario: Workflow agent answers clarification
  Given a workflow agent has received a clarification request
  And the workflow agent has context from 3 completed phases
  When the workflow agent processes the request
  Then it should generate an answer using accumulated context
  And the answer should be delivered to the requesting child agent
  And the child agent should resume execution

Scenario: Answer includes reasoning
  Given a clarification request about "database choice"
  When the workflow agent answers
  Then the answer should include:
    | field | value |
    | answer | "Use PostgreSQL" |
    | reasoning | "Previous phases established SQL requirements" |
  And the reasoning should be logged for debugging
```

**Rationale**:
Workflow agents maintain context across all phases and can provide informed answers based on accumulated knowledge. Including reasoning helps with debugging and audit trails.

---

#### FR-AM-018: Clarification Escalation to Parent Workflow

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-017 |

**Requirement**:
The system SHALL escalate clarification requests from child workflow agents to parent workflow agents (for composed workflows via uses:) when children cannot answer so that decisions can be made by agents with broader context.

**Acceptance Criteria**:

```gherkin
Scenario: Child workflow escalates to parent workflow
  Given a child workflow agent has received a clarification request
  And the question requires parent workflow context
  When the child workflow agent determines it cannot answer
  Then the request should be escalated to the parent workflow agent
  And the escalation should include the child workflow's assessment
  And the original question should be preserved

Scenario: Parent workflow provides contextual answer
  Given a parent workflow agent has received an escalated clarification
  And the question is about "approach to use based on earlier decisions"
  When the parent workflow agent processes the request
  Then it should provide an answer using its accumulated context
  And the answer should flow back to the child workflow agent
```

**Rationale**:
In composed workflows (via uses:), child workflows may need context from parent workflows. Parent workflow agents maintain this broader view and can provide informed guidance.

---

#### FR-AM-019: Direct User Escalation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-018 |

**Requirement**:
The system SHALL escalate clarification requests to the user when no agent in the hierarchy can answer so that truly novel or policy decisions receive human input.

**Acceptance Criteria**:

```gherkin
Scenario: Workflow escalates to user
  Given a top-level workflow agent has received an escalated clarification
  And the question cannot be answered from available context
  When the workflow agent determines it cannot answer
  Then the request should be escalated to the user interface
  And the user should see the question with full context
  And all agents in the chain should remain paused

Scenario: User answer flows back down
  Given a clarification has been escalated to the user
  When the user provides an answer
  Then the answer should flow back through the agent hierarchy
  And each paused agent should resume with the answer in context
  And the command should continue execution
```

**Rationale**:
Some decisions require human judgment or policy decisions that cannot be inferred from context. Direct escalation ensures these decisions are made by humans while keeping the system responsive.

---

### 2.6 Provider Management

This section covers LLM provider registration, authentication, and selection. These capabilities are foundational for LLM integration.

---

#### FR-AM-020: Multi-Provider Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-PM-001 |
| **Dependencies** | None      |
| **Former ID**    | FR-LM-007 |

**Requirement**:
The system SHALL support multiple execution providers for workflow command execution so that users can leverage different AI tools for different tasks.

**Acceptance Criteria**:

```gherkin
Scenario: Register multiple providers
  Given no providers are registered
  When I register a Claude provider
  And I register a Gemini provider
  Then both providers should be available for execution
  And the system should maintain 2 registered providers

Scenario: Provider isolation
  Given a Claude provider is registered
  And a Gemini provider is registered
  When the Claude provider encounters an error
  Then the Gemini provider should remain operational
  And the error should not affect other providers

Scenario: Execute with specific provider
  Given multiple providers are registered
  When I request execution with the Claude provider
  Then the system should use the Claude provider
  And should not invoke other providers
```

**Rationale**:
Different AI providers have different strengths, pricing models, and capabilities. Supporting multiple providers enables users to choose the best tool for each task and avoids vendor lock-in.

---

#### FR-AM-021: Provider Identification

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-PM-001 |
| **Dependencies** | FR-AM-020 |
| **Former ID**    | FR-LM-008 |

**Requirement**:
The system SHALL identify providers by unique identifier and display name so that providers can be referenced consistently across the system.

**Acceptance Criteria**:

```gherkin
Scenario: Provider has unique identifier
  Given I register a new provider
  When the provider is registered
  Then it should have a unique identifier (e.g., 'claude-cli')
  And it should have a human-readable display name

Scenario: Prevent duplicate identifiers
  Given a provider with identifier 'claude-cli' is registered
  When I attempt to register another provider with identifier 'claude-cli'
  Then the registration should fail
  And an error should indicate the identifier is already in use

Scenario: Identifier stability across restarts
  Given a provider is registered with identifier 'claude-cli'
  When the system restarts
  Then the provider should retain the same identifier
```

**Rationale**:
Consistent identification is necessary for provider selection, logging, telemetry, and user communication.

---

#### FR-AM-022: Provider Capability Reporting

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-PM-005 |
| **Dependencies** | FR-AM-020 |
| **Former ID**    | FR-LM-010 |

**Requirement**:
The system SHALL report provider capabilities including streaming support, multi-turn conversations, and supported tools so that users and workflows can make informed provider selections.

**Acceptance Criteria**:

```gherkin
Scenario: Report streaming capability
  Given a provider is registered
  When I query the provider capabilities
  Then it should report whether streaming is supported

Scenario: Report supported models
  Given a provider is registered
  When I query the provider capabilities
  Then it should list all supported models
  And should include maximum context size per model

Scenario: Query capabilities via CLI
  Given providers are registered
  When I run 'flowmaster provider list --capabilities'
  Then I should see capability information for each provider
  Including streaming, multi-turn, and supported tools
```

**Rationale**:
Different providers have different capabilities. Exposing this information enables intelligent provider selection based on requirements.

---

#### FR-AM-023: Independent Provider Authentication

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-AU-001 |
| **Dependencies** | FR-AM-020 |
| **Former ID**    | FR-LM-011 |

**Requirement**:
The system SHALL manage API key authentication independently for each execution provider so that each provider's credentials are isolated and properly handled.

**Acceptance Criteria**:

```gherkin
Scenario: Isolated API key state
  Given Claude provider has API key configured
  And Gemini provider does not have API key configured
  When I check authentication status
  Then Claude should show as authenticated
  And Gemini should show as not authenticated

Scenario: API key changes are isolated
  Given both providers have API keys configured
  When I clear API key for Claude
  Then Gemini should remain authenticated

Scenario: Provider-specific API key environment variables
  Given Claude uses ANTHROPIC_API_KEY
  And Gemini uses GOOGLE_API_KEY
  When both environment variables are set
  Then each provider should use its respective API key
  And both should be successfully authenticated
```

**Rationale**:
Each provider requires its own API key. Independent management ensures credentials are properly isolated and one provider's authentication state doesn't affect others.

---

#### FR-AM-024: API Key Authentication

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-AU-001 |
| **Dependencies** | FR-AM-023 |
| **Former ID**    | FR-LM-012 |

**Requirement**:
The system SHALL support API key authentication via environment variables and configuration files so that providers can be authenticated through standard mechanisms.

**Acceptance Criteria**:

```gherkin
Scenario: API key via environment variable
  Given a provider requires API key
  When the API key is set via environment variable (e.g., ANTHROPIC_API_KEY)
  Then the provider should authenticate successfully

Scenario: API key via configuration file
  Given a provider requires API key
  When the API key is set in ~/.flowmaster/credentials.yaml
  Then the provider should authenticate successfully

Scenario: Environment variable takes precedence
  Given API key is set in both environment variable and config file
  When authentication is performed
  Then the environment variable value should be used

Scenario: Report API key source
  Given I query provider status
  When authentication details are displayed
  Then it should show which source the API key came from (env/config)
```

**Rationale**:
API keys are the standard authentication mechanism for LLM provider APIs. Supporting both environment variables and configuration files provides flexibility for different deployment scenarios.

---

#### FR-AM-025: API Key Validation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-AU-001 |
| **Dependencies** | FR-AM-023 |
| **Former ID**    | FR-LM-013 |

**Requirement**:
The system SHALL validate API key presence and format before execution so that missing or malformed keys are detected early.

**Acceptance Criteria**:

```gherkin
Scenario: Check API key presence
  Given a provider requires ANTHROPIC_API_KEY
  When the environment variable is not set
  Then validation should fail
  And error should indicate which key is missing

Scenario: Check API key format
  Given an API key is provided
  When the key format doesn't match expected pattern (e.g., sk-ant-*)
  Then validation should warn about unexpected format
  But should not prevent execution (provider will validate)

Scenario: Cache validation result
  Given API key validation passed
  When workflow starts multiple phases
  Then validation should not repeat for each phase
  And cached result should be used

Scenario: Invalidate cache on key change
  Given validation result is cached
  When environment variable is changed
  Then the cache should be invalidated
  And fresh validation should occur
```

**Rationale**:
Early validation of API key presence prevents workflows from failing mid-execution. Format validation provides helpful warnings while deferring actual authentication to the provider.

---

#### FR-AM-026: Authentication Clearing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-AU-001 |
| **Dependencies** | FR-AM-023 |
| **Former ID**    | FR-LM-015 |

**Requirement**:
The system SHALL allow users to clear authentication data for any provider so that users can log out or reset authentication when needed. This operation invalidates the auth cache and delegates to Configuration Manager for removing stored credentials.

**Acceptance Criteria**:

```gherkin
Scenario: Clear authentication via CLI
  Given a provider is authenticated
  When I run 'flowmaster provider logout claude-cli'
  Then authentication should be cleared
  And the provider should show as not authenticated

Scenario: Clear removes all credentials
  Given a provider has stored credentials and tokens
  When I clear authentication
  Then all stored credentials should be removed
  And refresh tokens should be revoked if possible

Scenario: Confirm authentication cleared
  Given I clear authentication for a provider
  When the operation completes
  Then a confirmation message should be displayed
```

**Rationale**:
Users need ability to log out, switch accounts, or reset authentication for troubleshooting.

---

#### FR-AM-027: Authentication Instructions

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-004 |
| **Dependencies** | FR-AM-020 |
| **Former ID**    | FR-LM-016 |

**Requirement**:
The system SHALL provide authentication instructions including required environment variables and configuration files so that users know how to authenticate each provider.

**Acceptance Criteria**:

```gherkin
Scenario: Display authentication instructions
  Given Claude provider requires authentication
  When I run 'flowmaster provider auth claude-cli --help'
  Then I should see step-by-step authentication process
  And required environment variables
  And configuration file paths

Scenario: Include documentation links
  Given I request authentication help for a provider
  When the instructions are displayed
  Then they should include links to official provider documentation

Scenario: Show instructions on auth failure
  Given a provider authentication check fails
  When the error is displayed
  Then it should include actionable authentication instructions

Scenario: Check authentication status
  Given providers are configured
  When I run "flowmaster auth status"
  Then each configured provider should be listed
  And authentication status (authenticated/not authenticated) should be shown
  And authentication method should be indicated

Scenario: Verify authentication works
  Given credentials are configured for a provider
  When I run "flowmaster auth verify claude"
  Then the system should make a test request to the provider
  And report whether authentication succeeded or failed

Scenario: Expired token detection
  Given OAuth tokens are stored but expired
  When I check authentication status
  Then the status should indicate tokens are expired
  And instructions for re-authentication should be provided
```

**Rationale**:
Clear authentication instructions and status visibility reduce support burden and enable users to self-service authentication setup and troubleshooting.

---

#### FR-AM-028: Provider Readiness Check

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-PM-004            |
| **Dependencies** | FR-AM-020, FR-AM-023 |
| **Former ID**    | FR-LM-017            |

**Requirement**:
The system SHALL check provider readiness before execution including API key validity and SDK availability so that workflows fail fast with clear error messages.

**Acceptance Criteria**:

```gherkin
Scenario: Check API key presence
  Given ANTHROPIC_API_KEY is not set
  When I check provider readiness
  Then readiness check should fail
  And the error should indicate API key is missing
  And should include setup instructions

Scenario: Check API key validity
  Given API key is set but invalid
  When I check provider readiness
  Then readiness check should fail
  And the error should indicate API key is invalid
  And should suggest verifying the key

Scenario: Readiness check before workflow
  Given a workflow is ready to execute
  When the system attempts to start execution
  Then it should first verify provider readiness
  And should fail fast if provider is not ready

Scenario: Provider is ready
  Given valid API key is configured
  When I check provider readiness
  Then readiness check should pass
  And provider should be marked as available
```

**Rationale**:
Checking provider readiness upfront prevents workflows from failing mid-execution due to missing or invalid API keys.

---

#### FR-AM-029: Default Provider Setting

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-PM-002 |
| **Dependencies** | FR-AM-020 |
| **Former ID**    | FR-LM-018 |

**Requirement**:
The system SHALL allow users to set a default provider for workflow execution so that workflows without explicit provider specification use a consistent provider.

**Acceptance Criteria**:

```gherkin
Scenario: Set default provider via configuration
  Given Claude provider is registered
  When I set Claude as the default provider in configuration
  Then the setting should be saved
  And subsequent queries should return Claude as default

Scenario: Set default provider via CLI
  Given multiple providers are registered
  When I run "flowmaster config set default-provider claude-cli"
  Then Claude should become the default provider

Scenario: Use default when workflow doesn't specify
  Given Claude is set as default provider
  And a workflow does not specify a provider
  When the workflow executes
  Then it should use Claude provider

Scenario: Validate default provider exists
  Given I attempt to set default provider to "nonexistent"
  When the command executes
  Then it should fail with error
  And error should indicate provider not found

Scenario: Query current default provider
  Given Claude is set as default provider
  When I run "flowmaster config get default-provider"
  Then it should display "claude-cli"

Scenario: Persist default across sessions
  Given I set default provider to Claude
  When I restart the application
  Then Claude should still be the default provider
```

**Rationale**:
Default provider simplifies workflow definitions and provides consistent behavior when no provider is specified.

---

### 2.7 LLM Integration

This section covers executing prompts, workflow context, and provider/model selection. These capabilities build on provider management.

---

#### FR-AM-030: Global Workflow Defaults Resolution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-002 |
| **Dependencies** | FR-AM-029 |
| **Former ID**    | FR-LM-019 |

**Requirement**:
The system SHALL resolve and apply global default settings (provider, model, reasoning level, retry configuration) from workflow definitions during execution, applying them to all phases unless explicitly overridden.

**Acceptance Criteria**:

```gherkin
Scenario: Resolve and apply global defaults to all phases
  Given workflow defaults (loaded by Configuration Manager) specify provider 'claude-cli' and model 'haiku'
  And phase 1 does not specify provider or model
  And phase 2 does not specify provider or model
  When the workflow executes
  Then Agent Executor should resolve provider to 'claude-cli' for both phases
  And Agent Executor should resolve model to 'haiku' for both phases

Scenario: Phase-level overrides take precedence over defaults
  Given workflow defaults specify provider 'claude-cli'
  And phase 2 specifies provider 'gemini-cli'
  When the workflow executes
  Then phase 1 should resolve to 'claude-cli' (from workflow defaults)
  And phase 2 should resolve to 'gemini-cli' (from phase override)

Scenario: System fallbacks when no workflow defaults specified
  Given a workflow does not define defaults
  And phases do not specify provider
  When the workflow executes
  Then Agent Executor should fall back to system-level default provider
```

**Rationale**:
Agent Executor resolves the final execution configuration by merging workflow defaults (parsed by Configuration Manager) with phase-level overrides and system fallbacks. This separation ensures Configuration Manager owns schema/parsing while Agent Executor owns runtime resolution.

---

#### FR-AM-031: Phase-Level Provider Selection

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-002 |
| **Dependencies** | FR-AM-020 |
| **Former ID**    | FR-LM-020 |

**Requirement**:
The system SHALL allow provider selection at the workflow phase level so that different workflow phases can use different execution providers.

**Acceptance Criteria**:

```gherkin
Scenario: Specify provider per phase
  Given a workflow with two phases
  And phase 1 specifies provider 'claude-cli'
  And phase 2 specifies provider 'gemini-cli'
  When the workflow executes
  Then phase 1 should use Claude provider
  And phase 2 should use Gemini provider

Scenario: Validate provider availability before execution
  Given a workflow specifies provider 'nonexistent-provider'
  When I attempt to execute the workflow
  Then execution should fail before starting
  And the error should indicate the provider is unavailable

Scenario: Report provider used per phase
  Given a workflow executes with different providers per phase
  When I view execution results
  Then I should see which provider executed each phase
```

**Rationale**:
Complex workflows may benefit from different providers at different stages. For example, using a faster provider for simple tasks and a more capable provider for complex reasoning.

---

#### FR-AM-032: Model Selection Per Phase

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-002 |
| **Dependencies** | FR-AM-031 |
| **Former ID**    | FR-LM-021 |

**Requirement**:
The system SHALL allow model selection per workflow phase so that different phases can use different AI models based on task complexity.

**Acceptance Criteria**:

```gherkin
Scenario: Specify model per phase
  Given a workflow with two phases
  And phase 1 specifies model 'claude-haiku'
  And phase 2 specifies model 'claude-opus'
  When the workflow executes
  Then phase 1 should use the haiku model
  And phase 2 should use the opus model

Scenario: Validate model compatibility with provider
  Given a workflow phase specifies provider 'claude-cli'
  And specifies model 'gpt-4'
  When I attempt to execute the workflow
  Then execution should fail with incompatibility error

Scenario: Fall back to provider default model
  Given a workflow phase specifies provider but no model
  When the phase executes
  Then it should use the provider's default model
  And the default model should be logged in telemetry
```

**Rationale**:
Different workflow phases have different complexity requirements. Using appropriate models (e.g., fast models for simple tasks, capable models for complex reasoning) optimizes cost and performance.

---

#### FR-AM-033: Per-Phase Configuration Override

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-002 |
| **Dependencies** | FR-AM-030 |
| **Former ID**    | FR-LM-022 |

**Requirement**:
The system SHALL allow per-phase provider, model, and execution parameter overrides so that individual workflow phases can customize their execution environment.

**Acceptance Criteria**:

```gherkin
Scenario: Override provider at phase level
  Given a workflow with default provider 'claude-cli'
  And a phase specifies provider 'gemini-cli'
  When that phase executes
  Then it should use 'gemini-cli'
  And subsequent phases should revert to default 'claude-cli'

Scenario: Override multiple parameters
  Given a workflow phase
  When the phase specifies provider, model, reasoning_level, and max_turns
  Then all specified parameters should be used for that phase only

Scenario: Partial override
  Given a workflow with defaults for provider, model, and max_turns
  And a phase only overrides model
  When that phase executes
  Then provider and max_turns should come from defaults
  And model should come from phase override
```

**Rationale**:
Different workflow phases may require different providers or models based on task complexity and cost optimization.

---

#### FR-AM-034: Workflow Context Execution

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Critical             |
| **Implements**   | HL-PM-006            |
| **Dependencies** | FR-AM-001, FR-AM-031 |
| **Former ID**    | FR-LM-023            |

**Requirement**:
The system SHALL execute commands within workflow context including task ID, phase information, and previous step outputs so that providers have complete context for execution.

**Acceptance Criteria**:

```gherkin
Scenario: Include task identification in context
  Given a workflow is executing for task "TASK-123"
  When a command is sent to the provider
  Then the execution context should include the task ID
  And the provider should receive "TASK-123" as the task identifier

Scenario: Include phase information in context
  Given a workflow with 5 phases is executing
  And the current phase is phase 3
  When a command is sent to the provider
  Then the context should include current phase number (3)
  And the context should include total phases (5)

Scenario: Include previous step outputs
  Given phase 1 completed with output "implementation plan"
  When phase 2 executes
  Then the context should include phase 1 output
  And the provider should have access to the implementation plan

Scenario: Include complete prompt
  Given a command definition with context items
  When the command is prepared for execution
  Then the prompt should include the XML context block
  And the context block should be prepended to the command
```

**Rationale**:
Providers need full workflow context to make intelligent decisions and maintain continuity across multi-step workflows.

---

#### FR-AM-035: Stateless Provider Switching

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-PM-002            |
| **Dependencies** | FR-AM-031, FR-AM-034 |
| **Former ID**    | FR-LM-024            |

**Requirement**:
The system SHALL support provider switching between workflow phases without state loss so that workflows can use different providers for different phases.

**Acceptance Criteria**:

```gherkin
Scenario: Preserve outputs when switching providers
  Given phase 1 executes with Claude provider
  And phase 1 produces output "detailed plan"
  When phase 2 switches to Gemini provider
  Then the output from phase 1 should be preserved
  And phase 2 should have access to "detailed plan"

Scenario: Maintain task state across provider switches
  Given a workflow is in progress with Claude
  When the workflow switches to Gemini for the next phase
  Then task state should remain intact
  And workflow progress should be maintained

Scenario: Seamless workflow continuation
  Given phase 1 completes with provider A
  And phase 2 is configured to use provider B
  When phase 2 begins
  Then the workflow should continue without interruption
  And no manual intervention should be required

Scenario: Session information transition
  Given a multi-turn conversation with provider A
  When switching to provider B
  Then relevant session context should be available
  And the new provider should understand previous context
```

**Rationale**:
Each phase may have different provider requirements. State must be preserved across provider switches to maintain workflow continuity.

---

#### FR-AM-036: Abort Signal Handling

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-006 |
| **Dependencies** | None      |
| **Former ID**    | FR-LM-004 |

**Requirement**:
The system SHALL handle abort signals to cancel running SDK requests so that workflows can be cancelled cleanly.

**Acceptance Criteria**:

```gherkin
Scenario: Propagate abort signal to SDK
  Given an SDK request is in progress
  When an abort signal is received
  Then the AbortController should be triggered
  And the SDK request should be cancelled

Scenario: Immediate cancellation
  Given an SDK request receives abort signal
  When cancellation is requested
  Then the request should cancel immediately
  And should not wait for natural completion

Scenario: Report abortion in results
  Given an SDK request is aborted
  When the execution result is returned
  Then it should indicate the request was aborted
  And should not report success

Scenario: Clean up resources after abort
  Given an SDK request is aborted
  When the request terminates
  Then all resources should be cleaned up
  And streaming should stop immediately
```

**Rationale**:
Users need ability to cancel long-running workflows. AbortController enables clean cancellation of SDK requests.

---

#### FR-AM-037: Timeout Configuration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-036 |
| **Former ID**    | FR-LM-005 |

**Requirement**:
The system SHALL support timeout configuration for long-running SDK requests so that runaway requests don't consume resources indefinitely.

**Acceptance Criteria**:

```gherkin
Scenario: Apply configured timeout
  Given a request has timeout of 60 seconds
  When the request runs for more than 60 seconds
  Then the request should be cancelled via AbortController
  And a timeout error should be reported

Scenario: Per-phase timeout
  Given phase 1 has timeout of 30 seconds
  And phase 2 has timeout of 120 seconds
  When the workflow executes
  Then each phase should use its configured timeout

Scenario: Default timeout when not specified
  Given a phase does not specify timeout
  When the phase executes
  Then the system default timeout should apply

Scenario: Timeout error is distinct
  Given a request times out
  When the error is reported
  Then it should be clearly identified as timeout error
  And should include the timeout value that was exceeded
```

**Rationale**:
Some SDK requests may hang or run longer than expected. Timeouts provide safety mechanism to cancel runaway requests.

---

### 2.8 Structured Output

This section covers schema-based validation and structured output generation. These capabilities ensure agents produce predictable, type-safe outputs.

---

#### FR-AM-060: Schema-Based Output Validation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-034 |

**Requirement**:
The system SHALL validate agent outputs against declared schemas so that downstream consumers receive predictable, type-safe data.

**Acceptance Criteria**:

```gherkin
Scenario: Validate output against schema
  Given a phase declares an output schema
  When the agent completes execution
  Then the output should be validated against the schema
  And validation errors should be reported if output doesn't match

Scenario: Schema validation succeeds
  Given an agent produces output matching the declared schema
  When validation is performed
  Then validation should pass
  And the structured output should be returned

Scenario: Schema validation fails
  Given an agent produces output not matching the declared schema
  When validation is performed
  Then validation should fail
  And a detailed error should indicate which fields are invalid
  And the agent should be given opportunity to correct the output

Scenario: Required fields enforced
  Given a schema declares required fields
  When an agent output is missing required fields
  Then validation should fail
  And the error should list missing required fields

Scenario: Type constraints enforced
  Given a schema declares field types
  When an agent output has incorrect types
  Then validation should fail
  And the error should indicate type mismatches
```

**Rationale**:
Schema validation ensures agents produce outputs that match expected structures, enabling reliable downstream processing and preventing runtime errors from malformed data.

---

#### FR-AM-061: Output Schema Communication

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-060 |

**Requirement**:
The system SHALL communicate expected output structure to agents so that agents understand what format their output should take.

**Acceptance Criteria**:

```gherkin
Scenario: Agent receives schema information
  Given a phase declares an output schema
  When an agent is created for that phase
  Then the agent should be informed of the expected output structure
  And the schema should be available during execution

Scenario: Schema includes field descriptions
  Given an output schema with field descriptions
  When the schema is communicated to the agent
  Then field descriptions should be included
  And the agent should understand the purpose of each field

Scenario: Schema includes examples
  Given an output schema with example values
  When the schema is communicated to the agent
  Then examples should be included
  And the agent should understand expected value formats

Scenario: No schema specified
  Given a phase does not declare an output schema
  When an agent executes
  Then the agent should produce unstructured text output
  And no schema validation should occur
```

**Rationale**:
Agents must understand expected output format to produce compliant results. Communicating schema information enables agents to self-correct and produce valid outputs on first attempt.

---

#### FR-AM-062: Structured Output Parsing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-060 |

**Requirement**:
The system SHALL parse agent outputs into structured data so that downstream processing can reliably access output fields.

**Acceptance Criteria**:

```gherkin
Scenario: Parse structured output
  Given an agent produces schema-compliant output
  When the output is processed
  Then it should be parsed into structured data
  And individual fields should be accessible by name

Scenario: Handle malformed output
  Given an agent produces output that cannot be parsed
  When parsing is attempted
  Then a parse error should be raised
  And the raw output should be preserved for debugging

Scenario: Structured output available to dependent phases
  Given phase 1 produces structured output with field "plan"
  And phase 2 depends on phase 1
  When phase 2 accesses the output
  Then it should access the "plan" field directly
  And field access should be type-safe

Scenario: Preserve output for debugging
  Given an agent produces structured output
  When the output is parsed
  Then both raw and parsed outputs should be stored
  And debugging should have access to original output
```

**Rationale**:
Structured output enables reliable data flow between phases and to external systems. Parsing converts text-based agent output into programmatically accessible data structures.

---

### 2.9 Streaming & Output Processing

This section covers processing real-time output and generating execution artifacts. These capabilities build on LLM integration.

---

#### FR-AM-038: Real-Time Stream Processing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-034 |
| **Former ID**    | FR-LM-025 |

**Requirement**:
The system SHALL process streaming output from execution providers in real-time so that users see progress as commands execute.

**Acceptance Criteria**:

```gherkin
Scenario: Process output as it arrives
  Given a provider is executing a long-running command
  When the provider streams output
  Then the system should process each chunk immediately
  And not wait for complete output

Scenario: Emit events for each chunk
  Given streaming output is being processed
  When a new chunk arrives
  Then an event should be emitted for that chunk
  And subscribers should receive it in real-time

Scenario: Minimal buffering
  Given a provider is streaming output
  When output arrives
  Then buffering should be minimal (< 100ms delay)
  And display should update in near real-time

Scenario: Handle all streaming providers
  Given Claude provider supports streaming
  And Gemini provider supports streaming
  When either provider streams output
  Then the system should handle streaming consistently
```

**Rationale**:
Long-running AI commands benefit from real-time output streaming to show progress and maintain user engagement.

---

#### FR-AM-039: Emit Transient Streaming Events

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-038 |
| **Former ID**    | FR-LM-026 |

**Requirement**:
The system SHALL emit transient streaming events during execution for live UI updates so that interactive interfaces can show real-time progress.

**Acceptance Criteria**:

```gherkin
Scenario: Emit streaming events with flag
  Given a provider is streaming output
  When a streaming event is emitted
  Then it should have streaming=true flag

Scenario: Include partial content
  Given output is arriving in chunks
  When a streaming event is emitted
  Then it should include the partial content received so far

Scenario: Mark events as transient
  Given streaming events are being emitted
  When an event is created
  Then it should be marked as transient
  And should not be persisted to state

Scenario: UI differentiates streaming from final
  Given the UI is displaying execution progress
  When it receives an event
  Then it should check the streaming flag
  And handle streaming and final events differently
```

**Rationale**:
Two-phase event emission (transient then final) enables real-time UI updates while maintaining clean final state.

---

#### FR-AM-040: Emit Final Persisted Events

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-039 |
| **Former ID**    | FR-LM-027 |

**Requirement**:
The system SHALL emit final persisted events after execution completes for state management so that task state reflects complete execution results.

**Acceptance Criteria**:

```gherkin
Scenario: Emit final events with flag
  Given a command execution completes
  When the final event is emitted
  Then it should have streaming=false flag

Scenario: Include complete content
  Given streaming has finished
  When the final event is emitted
  Then it should contain complete, deduplicated content
  And no partial or duplicate data

Scenario: Persist final events
  Given a final event is emitted
  When state is saved
  Then the final event should be persisted to task state

Scenario: Emit after all streaming completes
  Given streaming is in progress
  When the last chunk is received
  Then final event should be emitted only after all streaming completes
```

**Rationale**:
Final persisted events provide clean, complete state for task persistence, resumption, and historical review.

---

#### FR-AM-041: Execution Result Reporting

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Critical             |
| **Implements**   | HL-PM-006            |
| **Dependencies** | FR-AM-034, FR-AM-040 |
| **Former ID**    | FR-LM-031            |

**Requirement**:
The system SHALL report execution results including success status, output, and telemetry so that workflows have complete information about each execution.

**Acceptance Criteria**:

```gherkin
Scenario: Include success/failure status
  Given a command execution completes
  When the result is returned
  Then it should include success or failure status

Scenario: Include complete output
  Given a command produces output
  When the result is returned
  Then it should include the complete command output

Scenario: Include session ID
  Given a command execution completes
  When the result is returned
  Then it should include session ID for potential resumption

Scenario: Include telemetry data
  Given a command execution completes
  When the result is returned
  Then it should include duration, token usage, and cost

Scenario: Include error information
  Given a command execution fails
  When the result is returned
  Then it should include exit code and error details
```

**Rationale**:
Comprehensive result reporting enables workflows to make decisions based on execution outcomes and enables proper telemetry.

---

#### FR-AM-042: Execution Artifact Persistence

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-041 |
| **Former ID**    | FR-LM-032 |

**Requirement**:
The system SHALL save execution artifacts including prompts, outputs, and message history so that executions can be reviewed and debugged.

**Acceptance Criteria**:

```gherkin
Scenario: Save prompt sent to provider
  Given a command is executed
  When execution completes
  Then the prompt sent should be saved as artifact

Scenario: Save complete output
  Given a provider returns output
  When execution completes
  Then complete output should be saved as artifact

Scenario: Save message history
  Given a multi-turn conversation occurs
  When execution completes
  Then full message history should be saved

Scenario: Save execution metadata
  Given a command is executed
  When artifacts are saved
  Then metadata (timestamps, model, provider) should be included

Scenario: Organize by task and phase
  Given artifacts are saved for task "TASK-123" phase 2
  When artifacts are stored
  Then they should be organized under task/phase directories

Scenario: Human-readable format
  Given artifacts are saved
  When a user views them
  Then they should be in human-readable format (JSON, text)
```

**Rationale**:
Execution artifacts enable post-execution review, debugging, compliance auditing, and quality improvement.

---

#### FR-AM-043: SDK Telemetry Processing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-004 |
| **Dependencies** | FR-AM-041 |
| **Former ID**    | FR-LM-033 |

**Requirement**:
The system SHALL process telemetry data from Vercel AI SDK responses to extract token usage and calculate cost so that all executions have consistent telemetry.

**Acceptance Criteria**:

```gherkin
Scenario: Extract input tokens from SDK response
  Given an SDK response includes usage data
  When telemetry is processed
  Then input token count should be extracted from response.usage.promptTokens

Scenario: Extract output tokens from SDK response
  Given an SDK response includes usage data
  When telemetry is processed
  Then output token count should be extracted from response.usage.completionTokens

Scenario: Calculate cost from token usage
  Given token usage is extracted
  And model pricing is configured
  When cost is calculated
  Then cost should be computed as (input_tokens * input_price + output_tokens * output_price)

Scenario: Handle missing usage data
  Given an SDK response does not include usage data
  When telemetry is processed
  Then tokens should be reported as unknown
  And cost should be reported as unknown

Scenario: Consistent format across providers
  Given Claude and Gemini are both used via SDK
  When their telemetry is processed
  Then the output format should be identical (SDK normalizes this)
```

**Rationale**:
Vercel AI SDK provides consistent token usage format across all providers. Cost calculation is based on configured pricing per model.

---

#### FR-AM-044: Observability Platform Integration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-004 |
| **Dependencies** | FR-AM-041 |
| **Former ID**    | FR-LM-034 |

**Requirement**:
The system SHALL integrate with observability platform for execution tracking so that all provider executions are tracked centrally.

**Acceptance Criteria**:

```gherkin
Scenario: Report execution start
  Given a provider execution begins
  When the execution starts
  Then an event should be reported to observability platform

Scenario: Report token usage
  Given a provider execution completes
  When telemetry is collected
  Then token usage should be reported to observability platform

Scenario: Report execution completion
  Given a provider execution completes successfully
  When the result is available
  Then completion should be reported to observability platform

Scenario: Report errors
  Given a provider execution fails
  When the error occurs
  Then error details should be reported to observability platform

Scenario: Include provider information
  Given execution data is reported
  When the report is sent
  Then it should include which provider was used
```

**Rationale**:
Centralized observability enables monitoring, debugging, cost tracking, and usage analysis across all executions.

---

### 2.10 Tool System

This section covers tool registration, restrictions, and metadata processing. These capabilities build on LLM integration.

---

#### FR-AM-045: Tool Registration for Execution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-007 |
| **Dependencies** | FR-AM-034 |
| **Former ID**    | FR-LM-039 |

**Requirement**:
The system SHALL register only allowed tools in the ToolRegistry when executing prompts so that agents operate within their defined tool boundaries.

**Acceptance Criteria**:

```gherkin
Scenario: Register only allowed tools
  Given a phase specifies tools: ["Read", "Glob", "Grep"]
  When the agent is created
  Then ToolRegistry should only contain Read, Glob, and Grep tools
  And Write, Edit, Shell tools should not be registered

Scenario: SDK receives only registered tools
  Given ToolRegistry contains Read, Glob, Grep
  When generateText() is called
  Then only registered tools should be passed to the SDK
  And agent can only call those tools

Scenario: No restrictions uses default tool set
  Given a phase does not specify tools
  When the agent is created
  Then ToolRegistry should contain the default tool set
  And default set should be configurable

Scenario: Validation agent with read-only tools
  Given a validation agent is spawned
  When ToolRegistry is configured
  Then only read-only tools (Read, Glob, Grep, List) should be registered
  And no write tools should be available
```

**Rationale**:
Defining allowed tools in ToolRegistry (rather than passing restrictions to CLI) gives FlowMaster full control over what tools agents can use. This enables safety controls like read-only validation agents.

---

#### FR-AM-046: Tool Metadata Processing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-038 |
| **Former ID**    | FR-LM-029 |

**Requirement**:
The system SHALL process structured tool metadata from SDK responses including tool name, action type, file paths, and parameters so that UI can display rich tool information.

**Acceptance Criteria**:

```gherkin
Scenario: Process tool name from SDK
  Given the SDK returns a tool call
  When the tool call is processed
  Then the system should capture the tool name

Scenario: Infer action type
  Given a tool call for "editFile" tool
  When the metadata is processed
  Then action type should be inferred as "edit"
  And should distinguish from read/write/bash/grep/glob

Scenario: Process file paths from parameters
  Given a tool operates on "/src/main.ts"
  When the parameters are processed
  Then file path should be captured as "/src/main.ts"

Scenario: Process line numbers for edits
  Given an edit operation targets lines 10-20
  When the parameters are processed
  Then line numbers should be included in metadata

Scenario: Include metadata in events
  Given tool metadata is processed
  When the tool use event is emitted
  Then the event should include all processed metadata
```

**Rationale**:
Rich tool metadata enables enhanced UI displays showing exactly what tools are doing with files and commands. SDK provides structured tool call data.

---

#### FR-AM-047: Duplicate Tool Call Detection

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Low       |
| **Implements**   | HL-PM-006 |
| **Dependencies** | FR-AM-046 |
| **Former ID**    | FR-LM-030 |

**Requirement**:
The system SHALL detect and flag duplicate tool calls to reduce visual noise so that UI can show cleaner, deduplicated tool information.

**Acceptance Criteria**:

```gherkin
Scenario: Track tool calls by signature
  Given a tool call with name "Read", file "/src/main.ts"
  When the call is processed
  Then a signature should be generated from tool+action+path

Scenario: Mark duplicates
  Given a tool call with signature "Read:/src/main.ts" was seen
  When another call with the same signature occurs
  Then the second call should be marked as duplicate

Scenario: Include duplicate flag in metadata
  Given a duplicate tool call is detected
  When the event is emitted
  Then duplicate=true should be in the metadata

Scenario: UI can hide duplicates
  Given the UI receives tool events
  When an event has duplicate=true
  Then the UI can choose to hide or collapse it
```

**Rationale**:
AI providers sometimes repeat tool calls during retries or clarification. Detecting duplicates reduces visual noise in tool displays.

---

#### FR-AM-048: Tool Execution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-PM-007 |
| **Dependencies** | FR-AM-045 |

**Requirement**:
The system SHALL execute tools invoked by agents and return results to the agent for continued processing so that agents can perform file operations, code changes, and system commands.

**Acceptance Criteria**:

```gherkin
Scenario: Execute read tool
  Given an agent requests to read file "/src/main.ts"
  When the read tool is executed
  Then the file contents should be returned to the agent
  And the agent should continue processing with the file contents

Scenario: Execute write tool
  Given an agent requests to write content to "/src/new-file.ts"
  When the write tool is executed
  Then the file should be created with the specified content
  And success status should be returned to the agent

Scenario: Execute shell tool
  Given an agent requests to run command "npm test"
  When the shell tool is executed
  Then the command should run in the working directory
  And stdout/stderr should be returned to the agent

Scenario: Tool execution error
  Given an agent requests to read non-existent file "/src/missing.ts"
  When the read tool is executed
  Then an error result should be returned to the agent
  And the agent should be able to handle the error and continue

Scenario: Tool execution with abort signal
  Given an agent is executing a long-running tool
  When an abort signal is received
  Then the tool execution should be cancelled
  And a cancellation result should be returned
```

**Rationale**:
Tools are the mechanism by which agents interact with the filesystem, execute commands, and perform work. Proper tool execution with result handling is essential for agentic workflows.

---

#### FR-AM-049: Tool Confirmation Flow

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-007 |
| **Dependencies** | FR-AM-048 |

**Requirement**:
The system SHALL support tool confirmation for dangerous operations so that users can approve or deny tool executions before they occur.

**Acceptance Criteria**:

```gherkin
Scenario: Tool requires confirmation based on policy
  Given a shell tool execution is requested
  And the policy engine returns ASK_USER for shell commands
  When the tool is about to execute
  Then execution should pause
  And a confirmation request should be sent to the UI
  And the agent should wait for user response

Scenario: User approves tool execution
  Given a tool confirmation request is pending
  When the user approves the execution
  Then the tool should execute normally
  And the result should be returned to the agent

Scenario: User denies tool execution
  Given a tool confirmation request is pending
  When the user denies the execution
  Then the tool should not execute
  And a denial result should be returned to the agent
  And the agent should handle the denial appropriately

Scenario: Tool auto-approved by policy
  Given a read tool execution is requested
  And the policy engine returns ALLOW for read operations
  When the tool is about to execute
  Then the tool should execute immediately
  And no confirmation should be requested

Scenario: Tool denied by policy
  Given a tool execution is requested
  And the policy engine returns DENY for that tool
  When the tool is about to execute
  Then the tool should not execute
  And a policy denial result should be returned to the agent

Scenario: Confirmation timeout
  Given a tool confirmation request is pending
  When the configured timeout expires without user response
  Then the tool execution should be cancelled
  And a timeout result should be returned to the agent
```

**Rationale**:
Some tool operations (file writes, shell commands, destructive operations) may require human oversight. Policy-based confirmation enables safety controls while allowing safe operations to proceed automatically.

---

#### FR-AM-050: Tool Result Structure

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-007 |
| **Dependencies** | FR-AM-048 |

**Requirement**:
The system SHALL return structured tool results containing content for the LLM, display content for the UI, and error information so that tool outputs can be appropriately routed.

**Acceptance Criteria**:

```gherkin
Scenario: Successful tool result includes LLM content
  Given a read tool successfully reads a file
  When the result is returned
  Then it should include content formatted for the LLM
  And the LLM content should be added to the conversation

Scenario: Tool result includes display content
  Given a tool execution completes
  When the result is returned
  Then it should include human-readable display content
  And the UI should be able to render the display content

Scenario: Error result includes error details
  Given a tool execution fails
  When the error result is returned
  Then it should include error type
  And it should include error message
  And it should indicate whether the error is retryable

Scenario: Large output is truncated appropriately
  Given a tool returns output exceeding size limits
  When the result is processed
  Then LLM content should be truncated to fit context limits
  And display content should indicate truncation occurred
  And full output should be available via artifact storage

Scenario: Result distinguishes LLM and display content
  Given a grep tool finds matches in multiple files
  When the result is returned
  Then LLM content should include structured match data
  And display content should include formatted, readable output
  And both should represent the same underlying result
```

**Rationale**:
Tools serve two audiences: the LLM (which needs content for continued reasoning) and the user (who needs readable output). Structured results enable appropriate handling for each audience while maintaining consistency.

---

#### FR-AM-051: Built-in Tool Set

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-PM-007 |
| **Dependencies** | FR-AM-045 |

**Requirement**:
The system SHALL provide a built-in set of tools for common file and system operations so that agents can perform standard development tasks without custom tool configuration.

**Acceptance Criteria**:

```gherkin
Scenario: Read file tool available
  Given an agent is created with default tools
  When the agent needs to read a file
  Then the read-file tool should be available
  And the tool should return file contents

Scenario: Write file tool available
  Given an agent is created with default tools
  When the agent needs to create or overwrite a file
  Then the write-file tool should be available
  And the tool should create or replace file contents

Scenario: Edit file tool available
  Given an agent is created with default tools
  When the agent needs to modify part of a file
  Then the edit tool should be available
  And the tool should replace specified text in the file

Scenario: Glob tool available
  Given an agent is created with default tools
  When the agent needs to find files by pattern
  Then the glob tool should be available
  And the tool should return matching file paths

Scenario: Grep tool available
  Given an agent is created with default tools
  When the agent needs to search file contents
  Then the grep tool should be available
  And the tool should return matching lines with context

Scenario: Shell tool available
  Given an agent is created with default tools
  When the agent needs to run a shell command
  Then the shell tool should be available
  And the tool should execute commands and return output

Scenario: List directory tool available
  Given an agent is created with default tools
  When the agent needs to list directory contents
  Then the list tool should be available
  And the tool should return directory entries

Scenario: Default tool set is configurable
  Given system configuration specifies a custom default tool set
  When an agent is created without explicit tool specification
  Then the agent should receive the configured default tools
```

**Rationale**:
A standard set of file and system tools enables agents to perform common development tasks. Providing these as built-ins ensures consistent behavior and reduces configuration overhead for typical workflows.

---

### 2.11 Reliability & Recovery

This section covers fallback, retry, and rate limiting. These are cross-cutting concerns that enhance reliability.

---

#### FR-AM-052: Provider Fallback

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-PM-003            |
| **Dependencies** | FR-AM-020, FR-AM-028 |
| **Former ID**    | FR-LM-035            |

**Requirement**:
The system SHALL fallback to alternative providers when requested provider is unavailable so that workflows continue executing when possible.

**Acceptance Criteria**:

```gherkin
Scenario: Fallback to default provider
  Given phase requests provider 'gemini-cli'
  And 'gemini-cli' is not available
  And default provider 'claude-cli' is available
  When the phase attempts to execute
  Then the system should fallback to 'claude-cli'
  And should log that fallback occurred

Scenario: Fallback to first available provider
  Given requested provider is unavailable
  And default provider is unavailable
  And 'backup-provider' is available
  When the phase attempts to execute
  Then the system should fallback to 'backup-provider'

Scenario: Report fallback in results
  Given a fallback occurred during execution
  When I view execution results
  Then I should see which provider was requested
  And which provider was ultimately used

Scenario: All providers unavailable
  Given no providers are available
  When a phase attempts to execute
  Then execution should fail
  And error should list all attempted providers
```

**Rationale**:
Automatic fallback increases workflow reliability by using any available provider rather than failing immediately when preferred provider is unavailable.

---

#### FR-AM-053: Retry Provider API Errors

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-005 |
| **Dependencies** | FR-AM-034 |
| **Former ID**    | FR-LM-036 |

**Requirement**:
The system SHALL retry provider API errors with appropriate backoff so that transient errors don't fail workflows unnecessarily.

**Acceptance Criteria**:

```gherkin
Scenario: Retry on provider errors
  Given a provider returns a transient error
  When retry logic is triggered
  Then the request should be retried

Scenario: Use longer backoff for rate limits
  Given a provider returns rate limit error (429)
  When retry is scheduled
  Then backoff should be longer than for other errors

Scenario: Respect maximum attempts
  Given retry is configured with max 3 attempts
  When 3 attempts fail
  Then no more retries should occur
  And error should be reported

Scenario: Exponential backoff
  Given retries are occurring
  When each retry is scheduled
  Then backoff should increase exponentially
```

**Rationale**:
AI provider API errors may be transient service issues. Retry with backoff provides resilience.

---

#### FR-AM-054: Provider Rate Limit Handling

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-PM-005 |
| **Dependencies** | FR-AM-053 |
| **Former ID**    | FR-LM-037 |

**Requirement**:
The system SHALL implement proper rate limit handling and respect provider rate limits so that provider APIs are not overwhelmed.

**Acceptance Criteria**:

```gherkin
Scenario: Detect rate limit responses
  Given a provider returns HTTP 429
  When the response is processed
  Then it should be identified as rate limit error

Scenario: Implement exponential backoff
  Given a rate limit error occurs
  When retry is scheduled
  Then exponential backoff should be used
  And backoff should respect provider guidelines

Scenario: Respect Retry-After header
  Given a rate limit response includes Retry-After header
  When retry is scheduled
  Then the specified delay should be respected

Scenario: Graceful degradation
  Given rate limits are being hit frequently
  When requests continue
  Then system should gracefully reduce request rate
  And not overwhelm the provider API
```

**Rationale**:
Proper rate limit handling is required by provider API agreements and ensures reliable service.

---

#### FR-AM-055: Cost Optimization Through Provider Routing

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Medium               |
| **Implements**   | HL-PM-002            |
| **Dependencies** | FR-AM-031, FR-AM-043 |
| **Former ID**    | FR-LM-038            |

**Requirement**:
The system SHALL provide cost optimization through provider routing so that users can minimize costs while maintaining quality.

**Acceptance Criteria**:

```gherkin
Scenario: Track cost per provider
  Given multiple providers are used in a workflow
  When executions complete
  Then cost should be tracked per provider

Scenario: Suggest cost-optimal provider
  Given a task type is identified (e.g., validation)
  When provider selection is needed
  Then system should suggest cost-optimal provider for that task

Scenario: Report cost savings
  Given a workflow used cost-optimized routing
  When execution completes
  Then report should show cost savings achieved

Scenario: Allow user override
  Given system suggests cheaper provider
  When user prefers a different provider
  Then user should be able to override the suggestion
```

**Rationale**:
Different AI models have significantly different costs. Intelligent routing to cheaper models for appropriate tasks can achieve significant cost savings.

---

### 2.12 Advanced Capabilities

This section covers advanced features that build on all previous capabilities.

---

#### FR-AM-056: AI-Based Output Validation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-013 |

**Requirement**:
The system SHALL enable workflow agents to validate command outputs using AI investigation so that incomplete or incorrect work is caught before proceeding to subsequent phases.

**Acceptance Criteria**:

```gherkin
Scenario: Workflow agent inspects created files
  Given a command has completed execution
  And the command claimed successful completion
  When the workflow agent validates the output
  Then the workflow agent should inspect files created by the command
  And the workflow agent should verify file contents match expectations

Scenario: Workflow agent compares output to requirements
  Given a phase has requirements defined
  And a command has produced output
  When the workflow agent validates the output
  Then the workflow agent should compare output against phase requirements
  And discrepancies should be identified and reported

Scenario: Workflow agent detects incomplete work
  Given a command reported success
  But the implementation is incomplete
  When the workflow agent validates the output
  Then the validation should detect the incomplete work
  And the validation result should include specific issues found

Scenario: Validation triggers retry with feedback
  Given validation has detected issues with command output
  When the workflow agent determines a retry is needed
  Then the retry should include specific feedback about issues found
  And the feedback should guide the command toward correct completion

Scenario: Validation triggers workflow decision
  Given validation has completed for a phase output
  When the validation result is processed
  Then the result should trigger one of: continue, retry, or fail
  And the decision should be based on validation findings
```

**Rationale**:
Workflow agents perform AI validation by inspecting files, comparing implementation to plans, and detecting when commands claim success but produce incomplete work. This provides intelligent validation integrated into workflow execution with specific actionable feedback for retries.

---

#### FR-AM-057: Intelligent Orchestration Agent

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-008 |
| **Dependencies** | FR-AM-008 |

**Requirement**:
The system SHALL support intelligent orchestration agents that provide project-wide context and coordinate workflow execution so that workflows can adapt dynamically based on project context and execution results.

**Acceptance Criteria**:

```gherkin
Scenario: Enable intelligent coordination for orchestration
  Given an orchestration is configured
  When intelligent coordination is enabled
  Then an orchestration agent should be created
  And the agent should have access to all workflow definitions
  And the agent should maintain project-wide context

Scenario: Orchestration agent maintains project context
  Given an orchestration agent is active
  When multiple workflows execute within the orchestration
  Then the orchestration agent should accumulate context from all workflows
  And the context should include outcomes, artifacts, and decisions
  And the context should persist across workflow boundaries

Scenario: Orchestration agent answers workflow questions
  Given an orchestration agent has project-wide context
  When a workflow agent escalates a question
  Then the orchestration agent should answer using project context
  And the answer should consider cross-workflow implications
  And the answer should be consistent with prior decisions

Scenario: Orchestration agent guides execution decisions
  Given an orchestration agent is coordinating workflows
  When a workflow reaches a decision point
  Then the orchestration agent can provide guidance
  And guidance should be based on project-wide context
  And guidance should consider dependencies between workflows
```

**Rationale**:
Intelligent orchestration enables dynamic workflow adaptation based on project context and execution results. The orchestration agent serves as the highest-level coordinator with visibility across all workflows.

---

#### FR-AM-058: Clarification Communication Logging

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Medium               |
| **Implements**   | HL-WF-008            |
| **Dependencies** | FR-AM-016, FR-AM-017 |

**Requirement**:
The system SHALL log all agent-to-agent clarification communication so that the escalation chain and responses can be audited and debugged.

**Acceptance Criteria**:

```gherkin
Scenario: Log clarification request
  Given an agent emits a clarification request
  When the request is routed to a parent agent
  Then the request should be logged with:
    | field | description |
    | timestamp | When the request was made |
    | source_agent | Agent that made the request |
    | target_agent | Agent that received the request |
    | question | The clarification question |
    | context | Context provided with the question |

Scenario: Log clarification response
  Given a parent agent responds to a clarification
  When the response is delivered to the child agent
  Then the response should be logged with:
    | field | description |
    | timestamp | When the response was provided |
    | responding_agent | Agent that provided the answer |
    | requesting_agent | Agent that asked the question |
    | answer | The clarification answer |
    | reasoning | Reasoning behind the answer |

Scenario: Log escalation chain
  Given a clarification escalates through multiple levels
  When the clarification reaches the user
  Then the full escalation chain should be logged
  And each escalation step should include the agent that couldn't answer
  And the final resolution should be logged with user attribution

Scenario: Query communication log for debugging
  Given clarification communication has been logged
  When a developer queries the log for a specific agent
  Then all clarifications involving that agent should be returned
  And the log should show both requests made and responses given
  And timestamps should enable reconstruction of the conversation flow
```

**Rationale**:
Agents may need guidance during execution, and the escalation chain enables getting context-aware answers from higher-level coordinators. Logging this communication is essential for debugging issues, understanding agent decisions, and auditing the execution flow.

---

#### FR-AM-059: AI Validation Agent with Read-Only Tools

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-VL-004 |
| **Dependencies** | FR-AM-045 |

**Requirement**:
The system SHALL provide an AI validation agent with read-only investigation tools so that work completion can be verified without modifying state.

**Acceptance Criteria**:

```gherkin
Scenario: Validation agent reads files
  Given an AI validation agent investigating phase output
  When it needs to verify file contents
  Then it should be able to read files
  And file contents should be accessible

Scenario: Validation agent runs commands
  Given an AI validation agent investigating phase output
  When it needs to check system state
  Then it should be able to run read-only bash commands
  And command output should be returned

Scenario: Validation agent cannot modify state
  Given an AI validation agent
  When it attempts to write files or modify state
  Then the operation should be blocked
  And an error should be logged

Scenario: Validation agent has context
  Given an AI validation agent
  When it starts investigation
  Then it should have access to the original prompt
  And it should have access to the phase output

Scenario: Validation agent tool restriction
  Given a validation agent is spawned
  When its tool registry is configured
  Then only read-only tools should be available (read-file, glob, grep, shell with restrictions)
  And write tools (write-file, edit) should be excluded
```

**Rationale**:
AI validation agent needs tools to investigate whether work was completed (read files, check git status, inspect outputs) but must not modify state to avoid corrupting workflow.

---

## 3. Error Handling Requirements

### 3.1 Error Scenarios

| Error Scenario                     | Expected Behavior                                  | Error Code |
| ---------------------------------- | -------------------------------------------------- | ---------- |
| Agent creation fails               | Log error, emit failure event, propagate to parent | ERR_AM_001 |
| Parent agent not found             | Log error, fail agent creation                     | ERR_AM_002 |
| Clarification timeout              | Escalate to next level or user                     | ERR_AM_003 |
| Agent session lost                 | Attempt recovery from state, fail if unrecoverable | ERR_AM_004 |
| Maximum turns exceeded             | Force agent to proceed or terminate                | ERR_AM_005 |
| Orphaned agent detected            | Force cleanup, log warning                         | ERR_AM_006 |
| Session ID invalid/expired         | Start fresh session, log warning                   | ERR_AM_007 |
| Session resumption fails           | Fallback to new session, emit warning event        | ERR_AM_008 |
| Provider not found                 | Return error with list of available providers      | ERR_AM_009 |
| Provider not authenticated         | Return error with authentication instructions      | ERR_AM_010 |
| API key invalid or expired         | Return error with re-authentication instructions   | ERR_AM_011 |
| All fallback providers unavailable | Return error listing all attempted providers       | ERR_AM_012 |
| Request timeout                    | Cancel request, return timeout error               | ERR_AM_013 |
| SDK connection failed              | Return error with network details                  | ERR_AM_014 |
| Model not supported by provider    | Return error with supported models list            | ERR_AM_015 |
| Authentication cache corrupted     | Clear cache, perform fresh auth check              | ERR_AM_016 |

### 3.2 Retry Behavior

| Condition                        | Retry? | Max Attempts | Backoff Strategy              |
| -------------------------------- | ------ | ------------ | ----------------------------- |
| Agent creation transient failure | Yes    | 3            | Exponential (1s, 2s, 4s)      |
| Clarification routing failure    | Yes    | 2            | Linear (2s)                   |
| Session recovery                 | Yes    | 3            | Exponential (1s, 2s, 4s)      |
| Session resumption failure       | No     | 0            | N/A (fallback to new session) |
| Parent communication failure     | Yes    | 3            | Linear (1s)                   |
| Provider temporarily unavailable | Yes    | 3            | Exponential (1s, 2s, 4s)      |
| Authentication token expired     | Yes    | 1            | None (refresh immediately)    |
| Request timeout                  | No     | 0            | None                          |
| API key invalid                  | No     | 0            | None                          |
| Network error                    | Yes    | 3            | Exponential (2s, 4s, 8s)      |
| Rate limit (429)                 | Yes    | 5            | Exponential with Retry-After  |

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface           | Provider Component    | Purpose                                    |
| ------------------- | --------------------- | ------------------------------------------ |
| Context Retrieval   | Context Manager       | Get context for each agent                 |
| Command Loading     | Configuration Manager | Get command definitions for command agents |
| Event Publishing    | Message Bus           | Emit agent lifecycle events                |
| State Persistence   | State Manager         | Track agent sessions and state             |
| Telemetry Reporting | Telemetry             | Report usage and errors                    |
| Provider Settings   | Configuration Manager | Get provider settings and credentials      |

### 4.2 Provided Interfaces (Dependents)

| Interface              | Consumer Component(s) | Purpose                            |
| ---------------------- | --------------------- | ---------------------------------- |
| Agent Spawning         | Orchestrator          | Create agents for execution levels |
| Agent Status Query     | Orchestrator          | Query agent state and children     |
| Clarification Delivery | User Interface        | Deliver user answers to agents     |
| Execute Prompt         | Self (internal)       | Execute prompts via providers      |
| Check Readiness        | Orchestrator          | Verify provider availability       |
| Get Capabilities       | Orchestrator          | Query provider capabilities        |
| List Providers         | User Interface        | Display available providers        |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity                 | Description                                                   | Persistence                         |
| ---------------------- | ------------------------------------------------------------- | ----------------------------------- |
| Agent                  | Running agent instance with state, parent reference, children | In-memory (state persisted)         |
| AgentSession           | LLM conversation session for an agent                         | In-memory (ID persisted)            |
| SessionID              | Unique identifier for multi-turn conversation session         | Persisted in task state             |
| ClarificationRequest   | Pending clarification with question and context               | In-memory                           |
| AccumulatedContext     | Phase outputs accumulated by workflow agent                   | In-memory (persisted on completion) |
| Provider Registry      | List of registered providers with metadata                    | In-memory                           |
| Provider Capabilities  | Capabilities per provider (streaming, models, etc.)           | In-memory                           |
| Authentication Cache   | Cached auth status per provider with TTL                      | In-memory                           |
| Active Processes       | Currently running provider processes                          | In-memory                           |
| Provider Configuration | Per-provider settings (default model, timeout)                | Persisted (config file)             |

### 5.2 Data Constraints

| Constraint                  | Description                                                  |
| --------------------------- | ------------------------------------------------------------ |
| Unique Agent IDs            | Each agent must have a globally unique identifier            |
| Valid Parent Reference      | Child agents must reference valid, existing parent agents    |
| Maximum Children            | A parent agent should not exceed 100 active children         |
| Maximum Clarification Queue | An agent should not have more than 10 pending clarifications |
| Unique provider identifiers | No two providers can have the same identifier                |
| Valid model references      | Model specified must be supported by the provider            |
| Process limit               | Maximum concurrent processes per provider (configurable)     |
| Cache TTL                   | Authentication cache expires after configured duration       |

---

## 6. Traceability

### 6.1 HL Requirement Decomposition

| HL Requirement | Functional Requirements                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HL-WF-008      | FR-AM-001, FR-AM-002, FR-AM-003, FR-AM-004, FR-AM-005, FR-AM-007, FR-AM-008, FR-AM-011, FR-AM-013, FR-AM-014, FR-AM-015, FR-AM-016, FR-AM-017, FR-AM-018, FR-AM-019, FR-AM-056, FR-AM-057, FR-AM-058 |
| HL-CM-003      | FR-AM-006, FR-AM-009, FR-AM-010, FR-AM-012                                                                                                                                                           |
| HL-VL-004      | FR-AM-059                                                                                                                                                                                            |
| HL-PM-001      | FR-AM-020, FR-AM-021                                                                                                                                                                                 |
| HL-PM-002      | FR-AM-029, FR-AM-030, FR-AM-031, FR-AM-032, FR-AM-033, FR-AM-035, FR-AM-055                                                                                                                          |
| HL-PM-003      | FR-AM-052                                                                                                                                                                                            |
| HL-PM-004      | FR-AM-027, FR-AM-028, FR-AM-043, FR-AM-044                                                                                                                                                           |
| HL-PM-005      | FR-AM-022, FR-AM-053, FR-AM-054                                                                                                                                                                      |
| HL-PM-006      | FR-AM-034, FR-AM-036, FR-AM-037, FR-AM-038, FR-AM-039, FR-AM-040, FR-AM-041, FR-AM-042, FR-AM-046, FR-AM-047, FR-AM-060, FR-AM-061, FR-AM-062                                                        |
| HL-PM-007      | FR-AM-045, FR-AM-048, FR-AM-049, FR-AM-050, FR-AM-051                                                                                                                                                |
| HL-AU-001      | FR-AM-023, FR-AM-024, FR-AM-025, FR-AM-026                                                                                                                                                           |

### 6.2 Requirements Summary

| Category                      | Count | Critical | High | Medium | Low |
| ----------------------------- | ----- | -------- | ---- | ------ | --- |
| Core Lifecycle                | 3     | 2        | 1    | 0      | 0   |
| Hierarchy Management          | 2     | 1        | 1    | 0      | 0   |
| Session Management            | 7     | 0        | 6    | 1      | 0   |
| Context Accumulation          | 2     | 0        | 2    | 0      | 0   |
| Clarification Routing         | 5     | 0        | 4    | 1      | 0   |
| Provider Management           | 10    | 4        | 4    | 2      | 0   |
| LLM Integration               | 8     | 1        | 6    | 1      | 0   |
| Structured Output             | 3     | 2        | 1    | 0      | 0   |
| Streaming & Output Processing | 7     | 2        | 5    | 0      | 0   |
| Tool System                   | 7     | 2        | 3    | 1      | 1   |
| Reliability & Recovery        | 4     | 0        | 3    | 1      | 0   |
| Advanced Capabilities         | 4     | 0        | 3    | 1      | 0   |
| **Total**                     | 62    | 14       | 39   | 8      | 1   |

### 6.3 FR-LM to FR-AM Mapping

The following table maps former LLM Manager requirement IDs to their new Agent Executor IDs:

| Former FR-LM ID | New FR-AM ID | Title                                      |
| --------------- | ------------ | ------------------------------------------ |
| FR-LM-004       | FR-AM-036    | Abort Signal Handling                      |
| FR-LM-005       | FR-AM-037    | Timeout Configuration                      |
| FR-LM-007       | FR-AM-020    | Multi-Provider Support                     |
| FR-LM-008       | FR-AM-021    | Provider Identification                    |
| FR-LM-010       | FR-AM-022    | Provider Capability Reporting              |
| FR-LM-011       | FR-AM-023    | Independent Provider Authentication        |
| FR-LM-012       | FR-AM-024    | API Key Authentication                     |
| FR-LM-013       | FR-AM-025    | API Key Validation                         |
| FR-LM-015       | FR-AM-026    | Authentication Clearing                    |
| FR-LM-016       | FR-AM-027    | Authentication Instructions                |
| FR-LM-017       | FR-AM-028    | Provider Readiness Check                   |
| FR-LM-018       | FR-AM-029    | Default Provider Setting                   |
| FR-LM-019       | FR-AM-030    | Global Workflow Defaults Resolution        |
| FR-LM-020       | FR-AM-031    | Phase-Level Provider Selection             |
| FR-LM-021       | FR-AM-032    | Model Selection Per Phase                  |
| FR-LM-022       | FR-AM-033    | Per-Phase Configuration Override           |
| FR-LM-023       | FR-AM-034    | Workflow Context Execution                 |
| FR-LM-024       | FR-AM-035    | Stateless Provider Switching               |
| FR-LM-025       | FR-AM-038    | Real-Time Stream Processing                |
| FR-LM-026       | FR-AM-039    | Emit Transient Streaming Events            |
| FR-LM-027       | FR-AM-040    | Emit Final Persisted Events                |
| FR-LM-029       | FR-AM-046    | Tool Metadata Processing                   |
| FR-LM-030       | FR-AM-047    | Duplicate Tool Call Detection              |
| FR-LM-031       | FR-AM-041    | Execution Result Reporting                 |
| FR-LM-032       | FR-AM-042    | Execution Artifact Persistence             |
| FR-LM-033       | FR-AM-043    | SDK Telemetry Processing                   |
| FR-LM-034       | FR-AM-044    | Observability Platform Integration         |
| FR-LM-035       | FR-AM-052    | Provider Fallback                          |
| FR-LM-036       | FR-AM-053    | Retry Provider API Errors                  |
| FR-LM-037       | FR-AM-054    | Provider Rate Limit Handling               |
| FR-LM-038       | FR-AM-055    | Cost Optimization Through Provider Routing |
| FR-LM-039       | FR-AM-045    | Tool Registration for Execution            |

### 6.4 New Tool System FRs

The following FRs were added as part of the unified Agent Executor to cover tool execution:

| FR ID     | Title                  | Notes                                            |
| --------- | ---------------------- | ------------------------------------------------ |
| FR-AM-048 | Tool Execution         | New - covers tool invocation and result handling |
| FR-AM-049 | Tool Confirmation Flow | New - policy-based approval for dangerous tools  |
| FR-AM-050 | Tool Result Structure  | New - structured results for LLM and UI          |
| FR-AM-051 | Built-in Tool Set      | New - standard development tools                 |

### 6.5 Structured Output FRs (Migrated from Validation Manager)

The following FRs were migrated from FR-VL-002, FR-VL-003, FR-VL-004 to cover schema-based validation:

| FR ID     | Former ID | Title                          | Notes                                      |
| --------- | --------- | ------------------------------ | ------------------------------------------ |
| FR-AM-060 | FR-VL-002 | Schema-Based Output Validation | Validates outputs against declared schemas |
| FR-AM-061 | FR-VL-003 | Output Schema Communication    | Communicates expected structure to agents  |
| FR-AM-062 | FR-VL-004 | Structured Output Parsing      | Parses outputs into structured data        |

---

## 7. Open Questions

| Question ID | Question                                                             | Owner        | Target Date | Resolution |
| ----------- | -------------------------------------------------------------------- | ------------ | ----------- | ---------- |
| Q-AM-001    | Should agent sessions be recoverable after process crash?            | Architecture | TBD         | Pending    |
| Q-AM-002    | What is the maximum clarification depth (levels of escalation)?      | Architecture | TBD         | Pending    |
| Q-AM-003    | Should clarification answers be cached for similar future questions? | Architecture | TBD         | Pending    |
| Q-AM-004    | Should we support provider plugins for custom providers?             | Architecture | TBD         | Pending    |
| Q-AM-005    | What should the default process timeout be?                          | Engineering  | TBD         | Pending    |
| Q-AM-006    | Should auth cache be persisted across restarts?                      | Engineering  | TBD         | Pending    |

---

## 8. Requirements Index

| ID        | Title                                              | Priority | Implements | Status |
| --------- | -------------------------------------------------- | -------- | ---------- | ------ |
| FR-AM-001 | Agent Creation                                     | Critical | HL-WF-008  | Draft  |
| FR-AM-002 | Agent State Transitions                            | Critical | HL-WF-008  | Draft  |
| FR-AM-003 | Agent Cleanup on Completion                        | High     | HL-WF-008  | Draft  |
| FR-AM-004 | Hierarchical Agent Spawning                        | Critical | HL-WF-008  | Draft  |
| FR-AM-005 | Parent-Child Relationship Tracking                 | High     | HL-WF-008  | Draft  |
| FR-AM-006 | Session ID Tracking                                | High     | HL-CM-003  | Draft  |
| FR-AM-007 | Long-Running Workflow Agent Sessions               | High     | HL-WF-008  | Draft  |
| FR-AM-008 | Long-Running Orchestrating Workflow Agent Sessions | Medium   | HL-WF-008  | Draft  |
| FR-AM-009 | Session Resumption                                 | High     | HL-CM-003  | Draft  |
| FR-AM-010 | Session Isolation Between Phases                   | High     | HL-CM-003  | Draft  |
| FR-AM-011 | Multi-Turn Command Conversations                   | High     | HL-WF-008  | Draft  |
| FR-AM-012 | Checkpoint Resume on Approval                      | High     | HL-CM-003  | Draft  |
| FR-AM-013 | Phase Output Accumulation                          | High     | HL-WF-008  | Draft  |
| FR-AM-014 | Context Flow to Child Agents                       | High     | HL-WF-008  | Draft  |
| FR-AM-015 | Command Clarification Requests                     | High     | HL-WF-008  | Draft  |
| FR-AM-016 | Clarification Routing to Parent                    | High     | HL-WF-008  | Draft  |
| FR-AM-017 | Parent Agent Clarification Response                | High     | HL-WF-008  | Draft  |
| FR-AM-018 | Clarification Escalation to Parent Workflow        | Medium   | HL-WF-008  | Draft  |
| FR-AM-019 | Direct User Escalation                             | High     | HL-WF-008  | Draft  |
| FR-AM-020 | Multi-Provider Support                             | Critical | HL-PM-001  | Draft  |
| FR-AM-021 | Provider Identification                            | Critical | HL-PM-001  | Draft  |
| FR-AM-022 | Provider Capability Reporting                      | Medium   | HL-PM-005  | Draft  |
| FR-AM-023 | Independent Provider Authentication                | Critical | HL-AU-001  | Draft  |
| FR-AM-024 | API Key Authentication                             | Critical | HL-AU-001  | Draft  |
| FR-AM-025 | API Key Validation                                 | High     | HL-AU-001  | Draft  |
| FR-AM-026 | Authentication Clearing                            | Medium   | HL-AU-001  | Draft  |
| FR-AM-027 | Authentication Instructions                        | High     | HL-PM-004  | Draft  |
| FR-AM-028 | Provider Readiness Check                           | High     | HL-PM-004  | Draft  |
| FR-AM-029 | Default Provider Setting                           | Medium   | HL-PM-002  | Draft  |
| FR-AM-030 | Global Workflow Defaults Resolution                | High     | HL-PM-002  | Draft  |
| FR-AM-031 | Phase-Level Provider Selection                     | High     | HL-PM-002  | Draft  |
| FR-AM-032 | Model Selection Per Phase                          | High     | HL-PM-002  | Draft  |
| FR-AM-033 | Per-Phase Configuration Override                   | High     | HL-PM-002  | Draft  |
| FR-AM-034 | Workflow Context Execution                         | Critical | HL-PM-006  | Draft  |
| FR-AM-035 | Stateless Provider Switching                       | High     | HL-PM-002  | Draft  |
| FR-AM-036 | Abort Signal Handling                              | High     | HL-PM-006  | Draft  |
| FR-AM-037 | Timeout Configuration                              | Medium   | HL-PM-006  | Draft  |
| FR-AM-038 | Real-Time Stream Processing                        | High     | HL-PM-006  | Draft  |
| FR-AM-039 | Emit Transient Streaming Events                    | High     | HL-PM-006  | Draft  |
| FR-AM-040 | Emit Final Persisted Events                        | Critical | HL-PM-006  | Draft  |
| FR-AM-041 | Execution Result Reporting                         | Critical | HL-PM-006  | Draft  |
| FR-AM-042 | Execution Artifact Persistence                     | High     | HL-PM-006  | Draft  |
| FR-AM-043 | SDK Telemetry Processing                           | High     | HL-PM-004  | Draft  |
| FR-AM-044 | Observability Platform Integration                 | High     | HL-PM-004  | Draft  |
| FR-AM-045 | Tool Registration for Execution                    | High     | HL-PM-007  | Draft  |
| FR-AM-046 | Tool Metadata Processing                           | Medium   | HL-PM-006  | Draft  |
| FR-AM-047 | Duplicate Tool Call Detection                      | Low      | HL-PM-006  | Draft  |
| FR-AM-048 | Tool Execution                                     | Critical | HL-PM-007  | Draft  |
| FR-AM-049 | Tool Confirmation Flow                             | High     | HL-PM-007  | Draft  |
| FR-AM-050 | Tool Result Structure                              | High     | HL-PM-007  | Draft  |
| FR-AM-051 | Built-in Tool Set                                  | Critical | HL-PM-007  | Draft  |
| FR-AM-052 | Provider Fallback                                  | High     | HL-PM-003  | Draft  |
| FR-AM-053 | Retry Provider API Errors                          | High     | HL-PM-005  | Draft  |
| FR-AM-054 | Provider Rate Limit Handling                       | High     | HL-PM-005  | Draft  |
| FR-AM-055 | Cost Optimization Through Provider Routing         | Medium   | HL-PM-002  | Draft  |
| FR-AM-056 | AI-Based Output Validation                         | High     | HL-WF-008  | Draft  |
| FR-AM-057 | Intelligent Orchestration Agent                    | High     | HL-WF-008  | Draft  |
| FR-AM-058 | Clarification Communication Logging                | Medium   | HL-WF-008  | Draft  |
| FR-AM-059 | AI Validation Agent with Read-Only Tools           | High     | HL-VL-004  | Draft  |
| FR-AM-060 | Schema-Based Output Validation                     | Critical | HL-PM-006  | Draft  |
| FR-AM-061 | Output Schema Communication                        | High     | HL-PM-006  | Draft  |
| FR-AM-062 | Structured Output Parsing                          | Critical | HL-PM-006  | Draft  |

---

## Document History

| Version | Date       | Author | Changes                                                                                                                                                                                                                                                                                                                |
| ------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-25 | Claude | Initial version - decomposed from HL-WF-009                                                                                                                                                                                                                                                                            |
| 1.1     | 2025-11-25 | Claude | Added HL-CM-003 (Session Management)                                                                                                                                                                                                                                                                                   |
| 1.2     | 2025-11-26 | Claude | Added FR-AM-020 through FR-AM-022                                                                                                                                                                                                                                                                                      |
| 2.0     | 2025-11-26 | Claude | Reorganized document for progressive disclosure                                                                                                                                                                                                                                                                        |
| 2.1     | 2025-11-27 | Claude | Updated Component ID due to Validation Manager addition                                                                                                                                                                                                                                                                |
| 3.0     | 2025-12-03 | Claude | Migrated FR-VL-016 from Validation Manager as FR-AM-059 (AI Validation Agent with Read-Only Tools)                                                                                                                                                                                                                     |
| 4.0     | 2025-12-03 | Claude | **Major consolidation**: Merged LLM Manager (COMP-005) into Agent Executor. Added 32 FRs from LLM Manager (FR-LM-004 through FR-LM-039) renumbered as FR-AM-020 through FR-AM-051. Reorganized document structure. Added Two-Phase Execution concept. Updated to directory-based organization.                         |
| 4.1     | 2025-12-03 | Claude | Added Tool System FRs: FR-AM-048 (Tool Execution), FR-AM-049 (Tool Confirmation Flow), FR-AM-050 (Tool Result Structure), FR-AM-051 (Built-in Tool Set). Renumbered FR-AM-048-055 to FR-AM-052-059 to accommodate new Tool FRs.                                                                                        |
| 4.2     | 2025-12-03 | Claude | Added Section 2.8 Structured Output with FR-AM-060 (Schema-Based Output Validation), FR-AM-061 (Output Schema Communication), FR-AM-062 (Structured Output Parsing). Migrated from FR-VL-002, FR-VL-003, FR-VL-004. Renumbered sections 2.8→2.9→2.10→2.11→2.12. Fixed incorrect document history entry. Total: 62 FRs. |
| 4.3     | 2025-12-15 | Claude | Desktop-first approach: Added note clarifying that CLI command examples in test scenarios represent functionality available in both Desktop UI (primary) and future CLI.                                                                                                                                               |
