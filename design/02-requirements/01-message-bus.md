# Message Bus - Component Requirements

> **Component ID**: COMP-001
> **Document Version**: 2.1
> **Last Updated**: 2025-11-30
> **Status**: Draft
> **Parent Document**: [System Architecture](../00-architecture.md)

---

## 1. Overview

### 1.1 Component Purpose

The Message Bus provides the communication infrastructure for FlowMaster. It implements a publish-subscribe event system for broadcasting execution events, supports request-response messaging for clarification routing, and delivers real-time streaming to UI clients. It ensures handler isolation so individual subscriber failures don't affect the overall system.

### 1.2 Scope

This document defines the functional requirements for the Message Bus component, derived from the following high-level requirements:

| HL Requirement | Title                                | Priority |
| -------------- | ------------------------------------ | -------- |
| HL-EV-001      | Publish-Subscribe Event Architecture | Critical |
| HL-EV-002      | Real-Time Event Streaming            | High     |
| HL-EV-003      | Handler Isolation and Reliability    | Critical |
| HL-EV-004      | Two-Phase Stream Processing          | High     |

### 1.3 Dependencies

| Component | Dependency Type | Purpose                                 |
| --------- | --------------- | --------------------------------------- |
| (None)    | -               | Message Bus is a foundational component |

### 1.4 Document Organization

This document follows progressive disclosure, organized from foundational concepts to advanced features:

| Section                        | Focus                                  | Prerequisites       |
| ------------------------------ | -------------------------------------- | ------------------- |
| 2.1 Core Event Infrastructure  | Fundamental pub-sub mechanism          | None                |
| 2.2 Event Catalog              | All event types in the system          | Core Infrastructure |
| 2.3 Subscription & Consumption | How consumers receive events           | Event Catalog       |
| 2.4 Real-Time Streaming        | Two-phase streaming and processing     | Subscription        |
| 2.5 Reliability                | Handler isolation and failure handling | All above           |

---

## 2. Functional Requirements

### 2.1 Core Event Infrastructure

This section defines the fundamental event system that all other features build upon.

#### FR-MM-001: Publish-Subscribe Event System

| Attribute      | Value                          |
| -------------- | ------------------------------ |
| **ID**         | FR-MM-001                      |
| **Title**      | Publish-Subscribe Event System |
| **Priority**   | Critical                       |
| **Implements** | HL-EV-001                      |

**Requirement**:
The system SHALL emit events during workflow execution using a publish-subscribe pattern so that multiple consumers (UI, logs, telemetry) can receive events independently.

**Acceptance Criteria**:

```gherkin
Feature: Publish-Subscribe Event System

  Scenario: Multiple consumers can subscribe to events independently
    Given a workflow is executing
    And a CLI consumer is subscribed to events
    And a Telemetry consumer is subscribed to events
    When the workflow emits a "phase-complete" event
    Then both consumers SHALL receive the event independently

  Scenario: Event emission doesn't require knowledge of consumers
    Given no consumers are subscribed
    When the workflow emits an event
    Then the event SHALL be emitted successfully
    And no error SHALL occur due to missing consumers

  Scenario: Adding new consumers requires no changes to execution code
    Given a workflow is executing and emitting events
    When a new WebSocket consumer subscribes mid-execution
    Then the consumer SHALL receive all subsequent events
    And no modification to the workflow code SHALL be required

  Scenario: Events include workflow, phase, tool, and message information
    Given a workflow is executing
    When events are emitted
    Then each event SHALL include taskId
    And each event SHALL include event type
    And each event SHALL include timestamp
    And each event SHALL include relevant payload data
```

**Rationale**:
Decoupling execution from presentation via events enables driving CLI output, UI updates, log files, and telemetry from the same event stream without tight coupling.

---

#### FR-MM-002: Type-Safe Event Contracts

| Attribute      | Value                     |
| -------------- | ------------------------- |
| **ID**         | FR-MM-002                 |
| **Title**      | Type-Safe Event Contracts |
| **Priority**   | High                      |
| **Implements** | HL-EV-001                 |

**Requirement**:
The system SHALL enforce type-safe event contracts with strongly-typed payloads so that invalid events are caught at build time and developers receive IDE support.

**Acceptance Criteria**:

```gherkin
Feature: Type-Safe Event Contracts

  Scenario: Each event type has explicit type definition
    Given the event system is initialized
    When a developer defines a new event type
    Then the event type SHALL have an explicit TypeScript interface
    And the payload structure SHALL be statically defined

  Scenario: Invalid events are caught during compilation
    Given a developer attempts to emit an event
    When the event payload doesn't match the type definition
    Then the TypeScript compiler SHALL report an error
    And the code SHALL NOT compile

  Scenario: Event consumers receive correctly typed events
    Given a consumer subscribes to "phase-complete" events
    When the consumer receives an event
    Then the event payload SHALL be correctly typed
    And no type casting SHALL be required

  Scenario: IDE provides autocomplete for event payloads
    Given a developer is writing event handling code
    When accessing event payload properties
    Then the IDE SHALL provide autocomplete suggestions
    And type information SHALL be displayed on hover
```

**Rationale**:
Type safety prevents invalid events from being emitted, provides self-documentation through type definitions, and enables safe refactoring with compiler verification.

---

### 2.2 Event Catalog

This section defines all event types that can be emitted in the system. Understanding these events is prerequisite to subscription and streaming.

#### FR-MM-003: Workflow Lifecycle Events

| Attribute      | Value                     |
| -------------- | ------------------------- |
| **ID**         | FR-MM-003                 |
| **Title**      | Workflow Lifecycle Events |
| **Priority**   | Critical                  |
| **Implements** | HL-EV-001                 |

**Requirement**:
The system SHALL emit workflow lifecycle events including start, complete, and error so that workflow execution can be monitored.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Lifecycle Events

  Scenario: Emit workflow-started event when workflow begins
    Given a workflow "sdlc" is triggered for task "TASK-123"
    When the workflow begins execution
    Then the Message Bus SHALL emit "workflow-started" event
    And the event SHALL include workflow name "sdlc"
    And the event SHALL include task ID "TASK-123"
    And the event SHALL include total phase count

  Scenario: Emit workflow-completed event when workflow succeeds
    Given a workflow is executing
    When all phases complete successfully
    Then the Message Bus SHALL emit "workflow-completed" event
    And the event SHALL include execution duration
    And the event SHALL include phase count completed

  Scenario: Emit workflow-failed event when workflow fails
    Given a workflow is executing
    When a phase fails after all retries
    Then the Message Bus SHALL emit "workflow-failed" event
    And the event SHALL include error message
    And the event SHALL include failed phase information

  Scenario: Events include relevant metadata
    Given a workflow is executing
    When any workflow lifecycle event is emitted
    Then the event SHALL include timestamp
    And the event SHALL include task ID
    And the event SHALL include workflow name
```

**Rationale**:
Workflow lifecycle events enable monitoring overall workflow progress and status at the highest level.

---

#### FR-MM-004: Phase Lifecycle Events

| Attribute      | Value                  |
| -------------- | ---------------------- |
| **ID**         | FR-MM-004              |
| **Title**      | Phase Lifecycle Events |
| **Priority**   | Critical               |
| **Implements** | HL-EV-001              |

**Requirement**:
The system SHALL emit phase lifecycle events including start, complete, and error so that individual phase execution can be tracked.

**Acceptance Criteria**:

```gherkin
Feature: Phase Lifecycle Events

  Scenario: Emit phase-started event when phase begins
    Given workflow is executing phase "implement"
    When the phase begins
    Then the Message Bus SHALL emit "phase-started" event
    And the event SHALL include phase index
    And the event SHALL include phase name "implement"

  Scenario: Emit phase-complete event when phase succeeds
    Given phase "implement" is executing
    When the phase completes successfully
    Then the Message Bus SHALL emit "phase-complete" event
    And the event SHALL include phase duration
    And the event SHALL include phase output summary

  Scenario: Emit phase-failed event when phase fails
    Given phase "implement" is executing
    When the phase fails
    Then the Message Bus SHALL emit "phase-failed" event
    And the event SHALL include error details
    And the event SHALL include retry count

  Scenario: Phase events include task and workflow context
    Given phase "plan" is executing for task "TASK-456"
    When any phase event is emitted
    Then the event SHALL include task ID "TASK-456"
    And the event SHALL include workflow name
```

**Rationale**:
Phase-level events enable detailed monitoring of workflow progress and identification of slow or failing phases.

---

#### FR-MM-005: Tool Execution Events

| Attribute      | Value                 |
| -------------- | --------------------- |
| **ID**         | FR-MM-005             |
| **Title**      | Tool Execution Events |
| **Priority**   | High                  |
| **Implements** | HL-EV-001             |

**Requirement**:
The system SHALL emit tool execution events for tool use and results so that tool activity can be monitored.

**Acceptance Criteria**:

```gherkin
Feature: Tool Execution Events

  Scenario: Emit tool-use event when tool is invoked
    Given an agent is executing a command
    When the agent invokes the "Read" tool
    Then the Message Bus SHALL emit "tool-use" event
    And the event SHALL include tool name "Read"
    And the event SHALL include tool input parameters

  Scenario: Emit tool-result event when tool completes
    Given a tool "Write" is executing
    When the tool completes
    Then the Message Bus SHALL emit "tool-result" event
    And the event SHALL include success status
    And the event SHALL include tool output

  Scenario: Tool events include task and phase context
    Given tool execution for task "TASK-789" phase "implement"
    When tool events are emitted
    Then each event SHALL include task ID "TASK-789"
    And each event SHALL include phase name "implement"

  Scenario: Tool events capture both success and failure
    Given a tool "Bash" is invoked
    When the tool fails with exit code 1
    Then the "tool-result" event SHALL include success=false
    And the event SHALL include the error output
```

**Rationale**:
Tool events provide fine-grained visibility into what operations are being performed during execution.

---

#### FR-MM-006: Assistant Message Events

| Attribute      | Value                    |
| -------------- | ------------------------ |
| **ID**         | FR-MM-006                |
| **Title**      | Assistant Message Events |
| **Priority**   | High                     |
| **Implements** | HL-EV-001                |

**Requirement**:
The system SHALL emit assistant message events including content and thinking blocks so that AI-generated content can be displayed.

**Acceptance Criteria**:

```gherkin
Feature: Assistant Message Events

  Scenario: Emit assistant-message event for AI messages
    Given an agent is generating a response
    When the agent produces text output
    Then the Message Bus SHALL emit "assistant-message" event
    And the event SHALL include the message content

  Scenario: Emit assistant-thinking event for thinking blocks
    Given an agent is using extended thinking
    When the agent produces a thinking block
    Then the Message Bus SHALL emit "assistant-thinking" event
    And the event SHALL include the thinking content

  Scenario: Events indicate streaming vs final status
    Given an agent is producing output
    When streaming events are emitted
    Then the event SHALL include streaming=true flag
    And when the final event is emitted
    Then it SHALL include streaming=false flag

  Scenario: Events include task and phase context
    Given agent execution for task "TASK-111"
    When assistant events are emitted
    Then each event SHALL include task ID "TASK-111"
    And each event SHALL include phase context
```

**Rationale**:
Assistant message events enable UI to display AI-generated content including reasoning and explanations.

---

#### FR-MM-007: Retry Events

| Attribute      | Value        |
| -------------- | ------------ |
| **ID**         | FR-MM-007    |
| **Title**      | Retry Events |
| **Priority**   | Medium       |
| **Implements** | HL-EV-001    |

**Requirement**:
The system SHALL emit retry events including attempt, success, and failure so that retry logic can be monitored and debugged.

**Acceptance Criteria**:

```gherkin
Feature: Retry Events

  Scenario: Emit retry-attempt event when retry begins
    Given a phase has failed and retry is configured
    When the system begins a retry attempt
    Then a "retry-attempt" event SHALL be emitted
    And the event SHALL include attempt number
    And the event SHALL include maximum retries

  Scenario: Emit retry-success event when retry succeeds
    Given a phase is being retried
    When the retry attempt succeeds
    Then a "retry-success" event SHALL be emitted
    And the event SHALL include final attempt number

  Scenario: Emit retry-failed event when retries exhausted
    Given a phase has failed all retry attempts
    When maximum retries are exhausted
    Then a "retry-failed" event SHALL be emitted
    And the event SHALL include total attempts made
    And the event SHALL include the final error

  Scenario: Events include delay information
    Given retry events are being emitted
    When a retry-attempt event occurs
    Then the event SHALL include delay before next attempt
    And the event SHALL include backoff strategy used
```

**Rationale**:
Retry events enable monitoring retry behavior, identifying phases that require multiple attempts, and understanding system resilience patterns.

---

#### FR-MM-008: Validation Events

| Attribute      | Value             |
| -------------- | ----------------- |
| **ID**         | FR-MM-008         |
| **Title**      | Validation Events |
| **Priority**   | Medium            |
| **Implements** | HL-EV-001         |

**Requirement**:
The system SHALL emit validation events for output validation so that the validation process can be monitored and debugged.

**Acceptance Criteria**:

```gherkin
Feature: Validation Events

  Scenario: Emit validation-start event when validation begins
    Given a phase has completed execution
    When output validation begins
    Then a "validation-start" event SHALL be emitted
    And the event SHALL include phase information

  Scenario: Emit validation-complete event when validation finishes
    Given validation is in progress
    When validation completes
    Then a "validation-complete" event SHALL be emitted
    And the event SHALL include pass/fail status

  Scenario: Events include validation type
    Given different validation types are configured
    When validation events are emitted
    Then events SHALL include validation type (deterministic, schema, AI)

  Scenario: Failed validation events include error details
    Given validation has failed
    When the validation-complete event is emitted
    Then the event SHALL include validation errors
    And errors SHALL describe what failed and why
```

**Rationale**:
Validation events enable monitoring the output validation process and understanding why validation succeeds or fails, aiding in debugging and process improvement.

---

#### FR-MM-009: Progress Update Events

| Attribute      | Value                  |
| -------------- | ---------------------- |
| **ID**         | FR-MM-009              |
| **Title**      | Progress Update Events |
| **Priority**   | Medium                 |
| **Implements** | HL-EV-001              |

**Requirement**:
The system SHALL emit progress update events with workflow completion percentage so that overall progress can be displayed to users.

**Acceptance Criteria**:

```gherkin
Feature: Progress Update Events

  Scenario: Emit progress-update events during execution
    Given a workflow is executing
    When phases complete
    Then "progress-update" events SHALL be emitted

  Scenario: Events include completion percentage
    Given a workflow with 4 phases
    When 2 phases have completed
    Then the progress event SHALL indicate 50% completion

  Scenario: Events include phase counts
    Given a workflow is executing
    When a progress event is emitted
    Then the event SHALL include current phase number
    And the event SHALL include total phase count

  Scenario: Progress updates at appropriate intervals
    Given a long-running phase is executing
    When progress events are emitted
    Then updates SHALL occur at reasonable intervals
    And updates SHALL NOT flood the event system
```

**Rationale**:
Progress events enable displaying completion percentage and estimated time remaining to users, improving the user experience during long-running workflows.

---

#### FR-MM-010: Phase Skip Event Emission

| Attribute      | Value                     |
| -------------- | ------------------------- |
| **ID**         | FR-MM-010                 |
| **Title**      | Phase Skip Event Emission |
| **Priority**   | Medium                    |
| **Implements** | HL-EV-001                 |

**Requirement**:
The system SHALL emit events when phases are skipped due to conditions so that workflow execution flow can be understood.

**Acceptance Criteria**:

```gherkin
Feature: Phase Skip Event Emission

  Scenario: Emit event when phase is skipped
    Given a phase has a skipIf condition
    When the condition evaluates to true
    Then a "phase-skipped" event SHALL be emitted

  Scenario: Event includes phase information
    Given a phase is being skipped
    When the skip event is emitted
    Then the event SHALL include phase index
    And the event SHALL include phase name

  Scenario: Event includes skip reason
    Given a phase is skipped due to a condition
    When the skip event is emitted
    Then the event SHALL include the skip reason
    And the reason SHALL describe why the phase was skipped

  Scenario: Skip events are distinguishable from failures
    Given phases can be skipped or fail
    When reviewing event logs
    Then skip events SHALL be clearly distinct from failure events
    And event type SHALL indicate "skipped" not "failed"
```

**Rationale**:
Understanding workflow execution requires visibility into which phases were skipped due to conditions, enabling proper debugging and audit trails.

---

#### FR-MM-011: Checkpoint Pause Event Emission

| Attribute      | Value                           |
| -------------- | ------------------------------- |
| **ID**         | FR-MM-011                       |
| **Title**      | Checkpoint Pause Event Emission |
| **Priority**   | High                            |
| **Implements** | HL-EV-001                       |

**Requirement**:
The system SHALL emit events when checkpoints are reached and execution pauses for approval so that UI can prompt users appropriately.

**Acceptance Criteria**:

```gherkin
Feature: Checkpoint Pause Event Emission

  Scenario: Emit event when checkpoint is reached
    Given a phase is configured with a checkpoint
    When execution reaches the checkpoint
    Then a "checkpoint-reached" event SHALL be emitted

  Scenario: Event includes checkpoint context
    Given a checkpoint event is emitted
    When UI processes the event
    Then the event SHALL include phase index
    And the event SHALL include checkpoint description
    And the event SHALL include information for user review

  Scenario: Event enables UI to prompt user
    Given a checkpoint event is received by UI
    When the UI displays the checkpoint
    Then sufficient information SHALL be available to prompt user
    And approval options SHALL be clear

  Scenario: Checkpoint events include approval requirements
    Given different checkpoints may have different requirements
    When a checkpoint event is emitted
    Then the event SHALL indicate what approval is needed
    And any review materials SHALL be referenced
```

**Rationale**:
Checkpoint approvals require UI notification so users can review execution state and approve or reject continuation, enabling human oversight at critical points.

---

### 2.3 Subscription & Consumption

This section defines how consumers receive and filter events. Understanding subscription is prerequisite to streaming and transport.

#### FR-MM-012: Event Filtering by Subscription

| Attribute      | Value                           |
| -------------- | ------------------------------- |
| **ID**         | FR-MM-012                       |
| **Title**      | Event Filtering by Subscription |
| **Priority**   | Medium                          |
| **Implements** | HL-EV-001                       |

**Requirement**:
The system SHALL support event filtering so that consumers only receive events they care about, reducing unnecessary processing.

**Acceptance Criteria**:

```gherkin
Feature: Event Filtering by Subscription

  Scenario: Consumers can subscribe to specific event types
    Given a consumer wants only phase events
    When the consumer subscribes with filter "phase-*"
    Then the consumer SHALL receive phase-started events
    And the consumer SHALL receive phase-complete events
    And the consumer SHALL NOT receive workflow:* events

  Scenario: Consumers can provide filter functions
    Given a consumer needs custom filtering logic
    When the consumer provides a filter function
    Then the filter function SHALL receive each event
    And only events where filter returns true SHALL be delivered

  Scenario: Filtering doesn't affect other consumers
    Given consumer A filters for "phase-*" events
    And consumer B subscribes to all events
    When a "workflow-completed" event is emitted
    Then consumer A SHALL NOT receive it
    And consumer B SHALL receive it

  Scenario: Multiple filter criteria can be combined
    Given a consumer wants phase events for specific tasks
    When the consumer subscribes with type filter and task filter
    Then only events matching both criteria SHALL be delivered
```

**Rationale**:
Event filtering reduces unnecessary processing and network traffic by delivering only relevant events to each consumer, improving overall system efficiency.

---

#### FR-MM-013: Promise-Based Event Waiting

| Attribute      | Value                       |
| -------------- | --------------------------- |
| **ID**         | FR-MM-013                   |
| **Title**      | Promise-Based Event Waiting |
| **Priority**   | Medium                      |
| **Implements** | HL-EV-001                   |

**Requirement**:
The system SHALL support promise-based waiting for specific events with timeout so that workflows can coordinate on event occurrences asynchronously.

**Acceptance Criteria**:

```gherkin
Feature: Promise-Based Event Waiting

  Scenario: Wait for specific event type
    Given a component needs to wait for "phase-complete"
    When the component calls waitForEvent("phase-complete")
    Then a promise SHALL be returned
    And the promise SHALL resolve when the event occurs

  Scenario: Wait operation supports timeout
    Given a component waits for an event with 5 second timeout
    When 5 seconds pass without the event occurring
    Then the promise SHALL reject with timeout error
    And resources SHALL be cleaned up

  Scenario: Wait automatically unsubscribes after event received
    Given a component is waiting for "workflow-completed"
    When the event is received and promise resolves
    Then the subscription SHALL be automatically removed
    And no memory leaks SHALL occur

  Scenario: Waiting for multiple events
    Given a component needs to wait for multiple events
    When using waitForAnyEvent(["phase-complete", "phase-failed"])
    Then the promise SHALL resolve on the first matching event
    And the event type SHALL be included in the result
```

**Rationale**:
Promise-based waiting enables async workflows to coordinate execution based on specific events without manual subscription management, simplifying complex coordination patterns.

---

#### FR-MM-014: Event Statistics for Debugging

| Attribute      | Value                          |
| -------------- | ------------------------------ |
| **ID**         | FR-MM-014                      |
| **Title**      | Event Statistics for Debugging |
| **Priority**   | Low                            |
| **Implements** | HL-EV-001                      |

**Requirement**:
The system SHALL track event emission statistics including counts and timing so that event flow can be debugged and analyzed during development.

**Acceptance Criteria**:

```gherkin
Feature: Event Statistics for Debugging

  Scenario: Track event emission counts by type
    Given multiple events have been emitted
    When querying event statistics
    Then counts SHALL be available per event type
    And total emission count SHALL be available

  Scenario: Track timing information
    Given events have been emitted over time
    When querying event statistics
    Then last emission time per event type SHALL be available
    And average time between emissions SHALL be calculated

  Scenario: Statistics are queryable for debugging
    Given a developer is debugging event flow
    When requesting statistics via debug interface
    Then all tracked metrics SHALL be returned
    And the data SHALL be formatted for readability

  Scenario: Statistics can be reset
    Given statistics have accumulated during testing
    When reset is requested
    Then all counters SHALL be cleared
    And timing information SHALL be reset
```

**Rationale**:
Event statistics help debug performance issues, identify event hotspots, and validate event flow patterns during development and troubleshooting.

---

### 2.4 Real-Time Streaming

This section defines how events are streamed in real-time, including two-phase processing for transient and final events.

#### FR-MM-015: Real-Time Stream Processing

| Attribute      | Value                       |
| -------------- | --------------------------- |
| **ID**         | FR-MM-015                   |
| **Title**      | Real-Time Stream Processing |
| **Priority**   | High                        |
| **Implements** | HL-EV-002                   |

**Requirement**:
The system SHALL process streaming output from execution providers in real-time so that users see progress as commands execute.

**Acceptance Criteria**:

```gherkin
Feature: Real-Time Stream Processing

  Scenario: Process output as it arrives from provider
    Given an agent is executing a long-running command
    When the provider streams output chunks
    Then the Message Bus SHALL emit events for each chunk
    And events SHALL be emitted within 100ms of chunk arrival

  Scenario: Emit events for each processed chunk
    Given streaming output is being received
    When 5 chunks arrive sequentially
    Then 5 corresponding events SHALL be emitted
    And the order SHALL be preserved

  Scenario: Maintain minimal buffering for real-time display
    Given streaming is active
    When output arrives
    Then buffering delay SHALL NOT exceed 100ms
    And users SHALL see output as it arrives

  Scenario: Handle streaming for providers that support it
    Given a provider supports streaming
    When execution begins
    Then streaming mode SHALL be enabled
    And incremental output SHALL be emitted
```

**Rationale**:
Long-running AI commands benefit from real-time output streaming to show progress and maintain user engagement.

---

#### FR-MM-016: Sub-Second Event Delivery

| Attribute      | Value                     |
| -------------- | ------------------------- |
| **ID**         | FR-MM-016                 |
| **Title**      | Sub-Second Event Delivery |
| **Priority**   | High                      |
| **Implements** | HL-EV-002                 |

**Requirement**:
The system SHALL stream events to UI clients in real-time via WebSocket with sub-second latency so that users see execution progress as it happens.

**Acceptance Criteria**:

```gherkin
Feature: Sub-Second Event Delivery

  Scenario: Events delivered with sub-100ms latency
    Given a UI client is connected via WebSocket
    When an event is emitted internally
    Then the client SHALL receive it within 100ms

  Scenario: Multiple UI clients can receive stream simultaneously
    Given 5 UI clients are connected
    When events are emitted
    Then all 5 clients SHALL receive events
    And latency SHALL remain under 100ms for each

  Scenario: Streaming works during long-running executions
    Given a workflow runs for 10 minutes
    When events are emitted throughout
    Then streaming SHALL remain active
    And latency SHALL remain consistent

  Scenario: No polling required for updates
    Given a UI client is connected
    When events occur
    Then the client SHALL receive push notifications
    And the client SHALL NOT need to poll for updates
```

**Rationale**:
Real-time streaming provides immediate feedback during long-running workflows, maintaining user engagement and enabling live monitoring.

---

#### FR-MM-017: Route Transient Streaming Events

| Attribute      | Value                            |
| -------------- | -------------------------------- |
| **ID**         | FR-MM-017                        |
| **Title**      | Route Transient Streaming Events |
| **Priority**   | High                             |
| **Implements** | HL-EV-004                        |

**Requirement**:
The system SHALL emit transient streaming events during execution for live UI updates so that interactive interfaces can show real-time progress.

**Acceptance Criteria**:

```gherkin
Feature: Transient Streaming Events

  Scenario: Streaming events include streaming=true flag
    Given an agent is producing output incrementally
    When streaming events are emitted
    Then each event SHALL include streaming=true flag

  Scenario: Streaming events include partial content as it arrives
    Given output is being streamed
    When a partial chunk arrives
    Then the event SHALL include the partial content
    And the content SHALL NOT wait for completion

  Scenario: Streaming events are marked as transient
    Given streaming events are emitted
    When the State Manager receives them
    Then they SHALL be identified as transient
    And they SHALL NOT be persisted to task state

  Scenario: UI can differentiate between streaming and final events
    Given a UI is receiving events
    When a streaming event arrives
    Then the UI SHALL identify it as transient
    And the UI SHALL know to expect a final event later
```

**Rationale**:
Two-phase event emission (transient then final) enables real-time UI updates while maintaining clean final state.

---

#### FR-MM-018: Route Final Persisted Events

| Attribute      | Value                        |
| -------------- | ---------------------------- |
| **ID**         | FR-MM-018                    |
| **Title**      | Route Final Persisted Events |
| **Priority**   | Critical                     |
| **Implements** | HL-EV-004                    |

**Requirement**:
The system SHALL emit final persisted events after execution completes for state management so that task state reflects complete execution results.

**Acceptance Criteria**:

```gherkin
Feature: Final Persisted Events

  Scenario: Final events include streaming=false flag
    Given an agent has completed execution
    When the final event is emitted
    Then the event SHALL include streaming=false flag

  Scenario: Final events contain complete deduplicated content
    Given multiple streaming chunks were emitted
    When the final event is emitted
    Then it SHALL contain the complete output
    And duplicate content SHALL be removed

  Scenario: Final events are persisted to task state
    Given a final event is emitted
    When the State Manager processes it
    Then the event content SHALL be persisted
    And the task state SHALL be updated

  Scenario: Final events are emitted after all streaming completes
    Given streaming is in progress
    When all chunks have been received
    Then the final event SHALL be emitted
    And no more streaming events SHALL follow for that phase
```

**Rationale**:
Final persisted events provide clean, complete state for task persistence, resumption, and historical review.

---

### 2.5 Reliability

This section defines how the Message Bus handles failures to ensure system stability.

#### FR-MM-027: Handler Failure Isolation

| Attribute      | Value                     |
| -------------- | ------------------------- |
| **ID**         | FR-MM-027                 |
| **Title**      | Handler Failure Isolation |
| **Priority**   | Critical                  |
| **Implements** | HL-EV-003                 |

**Requirement**:
The system SHALL isolate event handler failures so that one handler's failure doesn't affect others and the event system remains operational.

**Acceptance Criteria**:

```gherkin
Feature: Handler Failure Isolation

  Scenario: Handler exceptions are caught and logged
    Given a "logging" handler throws an exception
    When an event is processed
    Then the exception SHALL be caught
    And the exception SHALL be logged with details
    And the system SHALL NOT crash

  Scenario: Other handlers continue executing after one fails
    Given 3 handlers are subscribed to events
    And the second handler throws an exception
    When an event is emitted
    Then the first handler SHALL execute successfully
    And the third handler SHALL execute successfully
    And only the second handler SHALL fail

  Scenario: Handler failures don't stop event emission
    Given a handler is failing consistently
    When new events are emitted
    Then events SHALL continue to be emitted
    And other handlers SHALL continue to receive events

  Scenario: Event system remains operational after handler failure
    Given multiple handler failures have occurred
    When new handlers subscribe
    Then they SHALL receive events normally
    And the event system SHALL be fully functional

  Scenario: Handler failures are reported separately
    Given a handler "telemetry" fails
    When the failure is logged
    Then the log SHALL identify the failing handler
    And the log SHALL include the error message
    And the log SHALL include the event that caused the failure
```

**Rationale**:
One consumer's failure (e.g., file system full) shouldn't break other consumers (e.g., WebSocket streaming). Handler isolation ensures system reliability.

---

## 3. Error Handling

> **Note**: All errors use the canonical error codes and reason codes defined in the [Error Types Shared Schema](../integration/schemas/00-error-types.md).

### 3.1 Error Scenarios

| Error Code           | Reason Code                      | Scenario                       | Severity | Recovery Action                         |
| -------------------- | -------------------------------- | ------------------------------ | -------- | --------------------------------------- |
| `UNAVAILABLE`        | `WEBSOCKET_CONNECTION_FAILED`    | WebSocket connection failed    | Warning  | Retry connection with backoff           |
| `INTERNAL`           | `HANDLER_EXCEPTION`              | Handler threw exception        | Warning  | Log error, continue with other handlers |
| `RESOURCE_EXHAUSTED` | `EVENT_QUEUE_OVERFLOW`           | Event queue overflow           | Error    | Drop oldest events, log warning         |
| `INVALID_ARGUMENT`   | `MALFORMED_EVENT_PAYLOAD`        | Malformed event payload        | Error    | Log and skip event, don't propagate     |
| `INTERNAL`           | `SUBSCRIBER_REGISTRATION_FAILED` | Subscriber registration failed | Error    | Return error to caller                  |
| `UNAVAILABLE`        | `WEBSOCKET_BROADCAST_FAILED`     | WebSocket broadcast failed     | Warning  | Remove failed client, continue          |
| `DEADLINE_EXCEEDED`  | `STREAM_PROCESSING_TIMEOUT`      | Stream processing timeout      | Warning  | Emit partial content, log timeout       |

### 3.2 Retry Behavior

| Condition                 | Retry? | Max Attempts | Backoff Strategy      |
| ------------------------- | ------ | ------------ | --------------------- |
| WebSocket connection lost | Yes    | 5            | Exponential (1s base) |
| Handler exception         | No     | -            | Handler is isolated   |
| Event delivery failure    | Yes    | 3            | Linear (100ms)        |
| Client broadcast failure  | No     | -            | Client is removed     |

### 3.3 Error Response Format

All Message Bus errors follow the standard error response format from SCH-001:

```json
{
  "success": false,
  "error": {
    "code": "UNAVAILABLE",
    "message": "WebSocket connection failed",
    "httpStatus": 503,
    "isRetryable": true,
    "timestamp": "2025-11-29T10:30:00Z",
    "requestId": "req-abc123",
    "details": {
      "reason": "WEBSOCKET_CONNECTION_FAILED",
      "domain": "message-manager",
      "metadata": {
        "clientId": "client-456",
        "attemptCount": "3"
      }
    }
  }
}
```

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface | Provider Component | Purpose                                 |
| --------- | ------------------ | --------------------------------------- |
| (None)    | -                  | Message Bus is a foundational component |

### 4.2 Provided Interfaces (For Other Components)

| Interface                  | Consumer Component(s)                          | Purpose                                               |
| -------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| Event Publishing           | COMP-008 Orchestrator, COMP-007 Agent Executor | Emit workflow, phase, and tool events                 |
| Event Subscription         | COMP-010 Gateway, COMP-009 User Interface      | Subscribe to events for streaming to UI               |
| Request-Response Messaging | COMP-007 Agent Executor                        | Route clarification questions through agent hierarchy |

---

## 5. Data Requirements

### 5.1 Managed Entities

| Entity        | Description                          | Storage   |
| ------------- | ------------------------------------ | --------- |
| EventQueue    | Queue of pending events for delivery | In-memory |
| Subscriptions | Registered event handlers            | In-memory |

### 5.2 Data Constraints

| Constraint             | Description                            |
| ---------------------- | -------------------------------------- |
| Event queue max size   | 10,000 events before overflow handling |
| Event payload max size | 1MB per event                          |

> **Note**: Event backlog was removed. Late-connecting UI (e.g., Web UI connecting after startup) uses State Manager hydration (GW-OP-011 getExecutionState) to catch up on missed events.

### 5.3 Event Schema

```json
{
  "type": "phase-complete",
  "timestamp": "2025-11-25T10:35:00.000Z",
  "taskId": "TASK-123",
  "streaming": false,
  "payload": {
    "phaseIndex": 1,
    "phaseName": "implement",
    "duration": 120000,
    "output": "Implementation completed successfully"
  }
}
```

---

## 6. Traceability

### 6.1 HL to FR Mapping

| HL Requirement | Functional Requirements                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HL-EV-001      | FR-MM-001, FR-MM-002, FR-MM-003, FR-MM-004, FR-MM-005, FR-MM-006, FR-MM-007, FR-MM-008, FR-MM-009, FR-MM-010, FR-MM-011, FR-MM-012, FR-MM-013, FR-MM-014 |
| HL-EV-002      | FR-MM-015, FR-MM-016                                                                                                                                     |
| HL-EV-003      | FR-MM-027                                                                                                                                                |
| HL-EV-004      | FR-MM-017, FR-MM-018                                                                                                                                     |

### 6.2 FR Renumbering Reference

This table maps the new FR numbers to the original document for traceability:

| New ID    | Original ID | Title                            |
| --------- | ----------- | -------------------------------- |
| FR-MM-001 | FR-MM-001   | Publish-Subscribe Event System   |
| FR-MM-002 | FR-MM-015   | Type-Safe Event Contracts        |
| FR-MM-003 | FR-MM-002   | Workflow Lifecycle Events        |
| FR-MM-004 | FR-MM-003   | Phase Lifecycle Events           |
| FR-MM-005 | FR-MM-004   | Tool Execution Events            |
| FR-MM-006 | FR-MM-005   | Assistant Message Events         |
| FR-MM-007 | FR-MM-019   | Retry Events                     |
| FR-MM-008 | FR-MM-020   | Validation Events                |
| FR-MM-009 | FR-MM-021   | Progress Update Events           |
| FR-MM-010 | FR-MM-022   | Phase Skip Event Emission        |
| FR-MM-011 | FR-MM-023   | Checkpoint Pause Event Emission  |
| FR-MM-012 | FR-MM-016   | Event Filtering by Subscription  |
| FR-MM-013 | FR-MM-017   | Promise-Based Event Waiting      |
| FR-MM-014 | FR-MM-018   | Event Statistics for Debugging   |
| FR-MM-015 | FR-MM-006   | Real-Time Stream Processing      |
| FR-MM-016 | FR-MM-008   | Sub-Second Event Delivery        |
| FR-MM-017 | FR-MM-010   | Route Transient Streaming Events |
| FR-MM-018 | FR-MM-011   | Route Final Persisted Events     |
| FR-MM-027 | FR-MM-009   | Handler Failure Isolation        |

---

## 7. Open Questions

| Question ID | Question                                                      | Owner     | Target Date | Resolution                                                                             |
| ----------- | ------------------------------------------------------------- | --------- | ----------- | -------------------------------------------------------------------------------------- |
| Q-MM-001    | Should event backlog support replay for reconnecting clients? | Arch Team | 2025-11-30  | **Resolved**: No backlog. Late-connecting UI uses State Manager hydration (GW-OP-011). |
| Q-MM-002    | What event filtering options should WebSocket clients have?   | TBD       | TBD         | Pending                                                                                |
| Q-MM-003    | Should events be persisted for audit purposes?                | TBD       | TBD         | Pending                                                                                |

---

## 8. Requirements Index

| ID        | Title                            | Priority | Implements | Status |
| --------- | -------------------------------- | -------- | ---------- | ------ |
| FR-MM-001 | Publish-Subscribe Event System   | Critical | HL-EV-001  | Draft  |
| FR-MM-002 | Type-Safe Event Contracts        | High     | HL-EV-001  | Draft  |
| FR-MM-003 | Workflow Lifecycle Events        | Critical | HL-EV-001  | Draft  |
| FR-MM-004 | Phase Lifecycle Events           | Critical | HL-EV-001  | Draft  |
| FR-MM-005 | Tool Execution Events            | High     | HL-EV-001  | Draft  |
| FR-MM-006 | Assistant Message Events         | High     | HL-EV-001  | Draft  |
| FR-MM-007 | Retry Events                     | Medium   | HL-EV-001  | Draft  |
| FR-MM-008 | Validation Events                | Medium   | HL-EV-001  | Draft  |
| FR-MM-009 | Progress Update Events           | Medium   | HL-EV-001  | Draft  |
| FR-MM-010 | Phase Skip Event Emission        | Medium   | HL-EV-001  | Draft  |
| FR-MM-011 | Checkpoint Pause Event Emission  | High     | HL-EV-001  | Draft  |
| FR-MM-012 | Event Filtering by Subscription  | Medium   | HL-EV-001  | Draft  |
| FR-MM-013 | Promise-Based Event Waiting      | Medium   | HL-EV-001  | Draft  |
| FR-MM-014 | Event Statistics for Debugging   | Low      | HL-EV-001  | Draft  |
| FR-MM-015 | Real-Time Stream Processing      | High     | HL-EV-002  | Draft  |
| FR-MM-016 | Sub-Second Event Delivery        | High     | HL-EV-002  | Draft  |
| FR-MM-017 | Route Transient Streaming Events | High     | HL-EV-004  | Draft  |
| FR-MM-018 | Route Final Persisted Events     | Critical | HL-EV-004  | Draft  |
| FR-MM-027 | Handler Failure Isolation        | Critical | HL-EV-003  | Draft  |

---

## 9. Requirements Summary

| Category                   | Count  | Critical | High  | Medium | Low   |
| -------------------------- | ------ | -------- | ----- | ------ | ----- |
| Core Event Infrastructure  | 2      | 1        | 1     | 0      | 0     |
| Event Catalog              | 9      | 2        | 2     | 5      | 0     |
| Subscription & Consumption | 3      | 0        | 0     | 2      | 1     |
| Real-Time Streaming        | 4      | 1        | 3     | 0      | 0     |
| Reliability                | 1      | 1        | 0     | 0      | 0     |
| **Total**                  | **19** | **5**    | **6** | **7**  | **1** |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                                                             |
| ------- | ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-25 | Claude            | Initial version                                                                                                                                                     |
| 1.1     | 2025-11-26 | Claude            | Added FR-MM-015 through FR-MM-028                                                                                                                                   |
| 2.0     | 2025-11-26 | Claude            | Reorganized using progressive disclosure; renumbered FRs; updated component ID to COMP-001                                                                          |
| 2.1     | 2025-11-30 | Architecture Team | Removed FR-MM-019, FR-MM-020, FR-MM-021 (moved to LLM Manager); removed FR-MM-028 (logging not owned by Message Bus); renamed FR-MM-017/018 to clarify routing role |
| 2.2     | 2025-11-30 | Architecture Team | Removed FR-MM-022 through FR-MM-026 (WebSocket/SSE moved to Gateway); Message Bus is now internal event bus only                                                    |
