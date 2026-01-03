# State Manager - Component Requirements

> **Component ID**: COMP-003
> **Document Version**: 2.0
> **Last Updated**: 2025-11-26
> **Status**: Draft
> **Parent Document**: [System Architecture](../00-architecture.md)

---

## 1. Overview

### 1.1 Component Purpose

The State Manager is responsible for persisting task execution state, enabling crash recovery, and storing execution artifacts. It ensures no work is lost due to process termination and provides debuggable, auditable execution history.

### 1.2 Scope

This document defines the functional requirements for the State Manager component, derived from the following high-level requirements:

| HL Requirement | Title                                  | Priority |
| -------------- | -------------------------------------- | -------- |
| HL-SR-001      | Persistent Task Execution State        | Critical |
| HL-SR-002      | Crash Recovery and Workflow Resumption | Critical |
| HL-SR-003      | Execution Artifact Storage             | High     |

### 1.3 Dependencies

| Component              | Dependency Type | Purpose                  |
| ---------------------- | --------------- | ------------------------ |
| Message Bus (COMP-001) | Required        | Emit state change events |

### 1.4 Document Organization

This document follows progressive disclosure, organizing requirements from foundational concepts to advanced features:

1. **Foundation** - Core architecture and directory structure
2. **Task Lifecycle** - Basic state operations
3. **Phase Execution** - Phase-level state tracking
4. **Snapshots & Recovery** - Crash recovery mechanisms
5. **Session & Retry Tracking** - Execution tracking
6. **Error Management** - Error handling and classification
7. **Artifacts** - Output and log storage
8. **Maintenance** - Cleanup operations

---

## 2. Functional Requirements

### 2.1 Foundation

This section establishes the core architectural concepts that all other requirements build upon.

---

#### FR-SM-001: Three-Layer State Model

| Attribute      | Value                   |
| -------------- | ----------------------- |
| **ID**         | FR-SM-001               |
| **Title**      | Three-Layer State Model |
| **Priority**   | High                    |
| **Implements** | HL-SR-001               |

**Requirement**:
The system SHALL maintain workflow execution state separately from external task data so that execution progress is tracked independently of task metadata.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Execution State Separation

  Scenario: Workflow execution state is stored separately from task data
    Given external task data exists
    When workflow execution begins
    Then execution state SHALL be stored in checkpoint file
    And checkpoint SHALL be separate from task cache

  Scenario: Checkpoint tracks execution progress
    Given workflow is executing
    Then checkpoint SHALL track current phase index
    And checkpoint SHALL track phase outputs
    And checkpoint SHALL track execution status

  Scenario: Checkpoint can be inspected independently
    Given a task with workflow execution state
    When inspecting state
    Then checkpoint SHALL be readable independently
    And checkpoint SHALL have its own file(s)
```

**Rationale**:
Separating workflow execution state from task data enables independent management of execution progress and task metadata.

---

#### FR-SM-002: Task Directory Structure Management

| Attribute      | Value                               |
| -------------- | ----------------------------------- |
| **ID**         | FR-SM-002                           |
| **Title**      | Task Directory Structure Management |
| **Priority**   | High                                |
| **Implements** | HL-SR-003                           |

**Requirement**:
The system SHALL create and maintain organized directory structure for each task so that task artifacts are well-organized and predictable.

**Acceptance Criteria**:

```gherkin
Feature: Task Directory Structure Management

  Scenario: System creates task directory on workflow start
    Given workflow starts for task "TASK-123"
    Then directory ".flowmaster/tasks/TASK-123" SHALL be created

  Scenario: Task directory includes subdirectories for logs and artifacts
    Given task directory is created
    Then subdirectories for each phase SHALL be created as needed

  Scenario: Artifacts are organized by phase name
    Given phase "plan" produces artifacts
    Then artifacts SHALL be stored under "plan/" subdirectory

  Scenario: Directory structure is consistent across tasks
    Given tasks "TASK-123" and "TASK-456"
    Then directory structure SHALL be identical

  Scenario: Directories are created automatically as needed
    Given new phase "review" starts
    When artifacts need to be stored
    Then "review/" directory SHALL be created automatically
```

**Rationale**:
Consistent directory structure enables predictable artifact location and simplifies debugging workflows.

---

### 2.2 Task Lifecycle

This section defines core task state operations that form the foundation for all execution tracking.

---

#### FR-SM-003: Persistent Task Execution State

| Attribute      | Value                           |
| -------------- | ------------------------------- |
| **ID**         | FR-SM-003                       |
| **Title**      | Persistent Task Execution State |
| **Priority**   | Critical                        |
| **Implements** | HL-SR-001                       |

**Requirement**:
The system SHALL persist task execution state including status, phases, and outputs to recover from crashes so that no work is lost due to process termination.

**Acceptance Criteria**:

```gherkin
Feature: Persistent Task Execution State

  Scenario: Task state includes execution status
    Given a task "TASK-123" is executing
    When the State Manager persists the task state
    Then the state SHALL include status "in_progress"

  Scenario: Task state includes all executed phases with timestamps
    Given phase "plan" completed at "2025-11-25T10:30:00Z"
    And phase "implement" completed at "2025-11-25T10:35:00Z"
    When the State Manager persists the task state
    Then the state SHALL include phase "plan" with timestamp "2025-11-25T10:30:00Z"
    And the state SHALL include phase "implement" with timestamp "2025-11-25T10:35:00Z"

  Scenario: Task state includes outputs from each phase
    Given phase "plan" produced output "Implementation plan created"
    When the State Manager persists the task state
    Then the state SHALL include the output from phase "plan"

  Scenario: Task state persisted after each phase execution
    Given a workflow with 3 phases
    When phase 1 completes
    Then the State Manager SHALL persist the task state immediately
    And when phase 2 completes
    Then the State Manager SHALL persist the task state immediately

  Scenario: Task state loadable after process restart
    Given task state was persisted before process termination
    When the process restarts
    Then the State Manager SHALL successfully load the persisted state
    And all phase data SHALL be intact
```

**Rationale**:
Workflows may be interrupted by crashes or user cancellation. Persistent state enables recovery and resumption without losing completed work.

---

#### FR-SM-004: Task Status Tracking

| Attribute      | Value                |
| -------------- | -------------------- |
| **ID**         | FR-SM-004            |
| **Title**      | Task Status Tracking |
| **Priority**   | Critical             |
| **Implements** | HL-SR-001            |

**Requirement**:
The system SHALL track task lifecycle states through created, in_progress, completed, and failed so that task progress is always visible.

**Acceptance Criteria**:

```gherkin
Feature: Task Status Tracking

  Scenario: Tasks start in created state
    Given a new task "TASK-456" is initialized
    When the State Manager creates the task state
    Then the status SHALL be "created"

  Scenario: Tasks transition to in_progress when execution begins
    Given task "TASK-456" has status "created"
    When workflow execution begins
    Then the State Manager SHALL update status to "in_progress"

  Scenario: Tasks transition to completed when all phases succeed
    Given task "TASK-456" has status "in_progress"
    And all workflow phases have completed successfully
    When the workflow finishes
    Then the State Manager SHALL update status to "completed"

  Scenario: Tasks transition to failed when a phase fails
    Given task "TASK-456" has status "in_progress"
    And phase "implement" fails after all retries
    When the failure is recorded
    Then the State Manager SHALL update status to "failed"

  Scenario: Status transitions are logged with timestamps
    Given task "TASK-456" transitions from "created" to "in_progress"
    When the transition occurs
    Then the State Manager SHALL record the transition timestamp
    And the previous status SHALL be preserved in history

  Scenario: Current status is always queryable
    Given task "TASK-456" exists with status "in_progress"
    When the status is queried
    Then the State Manager SHALL return "in_progress" immediately
```

**Rationale**:
Clear status tracking enables users to understand task progress and system to make workflow decisions.

---

#### FR-SM-005: Atomic State Persistence

| Attribute      | Value                    |
| -------------- | ------------------------ |
| **ID**         | FR-SM-005                |
| **Title**      | Atomic State Persistence |
| **Priority**   | Critical                 |
| **Implements** | HL-SR-001                |

**Requirement**:
The system SHALL persist workflow execution state using atomic file operations with crash recovery support via temp file + rename pattern.

**Acceptance Criteria**:

```gherkin
Feature: Atomic State Persistence

  Scenario: State writes use temp file then atomic rename
    Given task state needs to be persisted
    When the State Manager writes the state
    Then it SHALL first write to a temporary file
    And then atomically rename to the final path

  Scenario: Partial writes do not corrupt state file
    Given state write is in progress
    When the process crashes mid-write
    Then the original state file SHALL remain intact
    And no partial data SHALL be present in the state file

  Scenario: System recovers from mid-write crashes
    Given a temporary state file exists from interrupted write
    When the system restarts
    Then the State Manager SHALL detect the orphaned temp file
    And the State Manager SHALL clean up the temp file
    And the State Manager SHALL use the last complete state

  Scenario: State file integrity maintained during concurrent operations
    Given multiple phases complete simultaneously
    When concurrent state updates occur
    Then each update SHALL be serialized
    And no state corruption SHALL occur
```

**Rationale**:
Atomic writes prevent state corruption during crashes or power failures, ensuring reliable workflow resumption.

---

### 2.3 Phase Execution

This section defines how phase-level execution is tracked and persisted.

---

#### FR-SM-006: Phase-Based Execution Logging

| Attribute      | Value                         |
| -------------- | ----------------------------- |
| **ID**         | FR-SM-006                     |
| **Title**      | Phase-Based Execution Logging |
| **Priority**   | High                          |
| **Implements** | HL-SR-001                     |

**Requirement**:
The system SHALL maintain execution logs organized by phase with timestamps so that workflow execution can be monitored and debugged.

**Acceptance Criteria**:

```gherkin
Feature: Phase-Based Execution Logging

  Scenario: Each phase has a dedicated log file
    Given workflow executes phases "plan", "implement", "test"
    When each phase completes
    Then the State Manager SHALL create separate log files for each phase

  Scenario: Log entries include timestamps
    Given phase "plan" is executing
    When a log entry is written
    Then the entry SHALL include ISO 8601 timestamp

  Scenario: Logs capture phase start, tool use, and completion events
    Given phase "implement" is executing
    When the phase starts
    Then the log SHALL record "phase_start" event
    And when tools are used
    Then the log SHALL record "tool_use" events
    And when the phase completes
    Then the log SHALL record "phase_complete" event

  Scenario: Logs are written in real-time as execution progresses
    Given phase "plan" is executing
    When an event occurs
    Then the log SHALL be written within 100ms
    And the log SHALL be readable immediately

  Scenario: Logs are human-readable text format
    Given execution logs exist
    When the log file is opened
    Then the content SHALL be valid JSON or plain text
    And the content SHALL be readable without special tools
```

**Rationale**:
Real-time logging enables monitoring of long-running workflows and provides detailed execution history for debugging.

**Scope**: This FR covers execution logging (agent output, tool calls, command results). System event logging (workflow lifecycle events) is handled via Message Bus's pub-sub mechanism.

---

#### FR-SM-007: Phase Output Management

| Attribute      | Value                   |
| -------------- | ----------------------- |
| **ID**         | FR-SM-007               |
| **Title**      | Phase Output Management |
| **Priority**   | Critical                |
| **Implements** | HL-SR-001               |

**Requirement**:
The system SHALL capture and store named outputs from completed phases for use by dependent phases so that data flows between workflow steps.

**Acceptance Criteria**:

```gherkin
Feature: Phase Output Management

  Scenario: Each phase can produce named outputs
    Given phase "plan" completes with output
    When the output is stored
    Then it SHALL be stored with name "plan"

  Scenario: Outputs are stored in task state
    Given phase produces output "Implementation approach defined"
    When phase completes
    Then output SHALL be persisted in task state file

  Scenario: Outputs are accessible by output name
    Given phase "plan" output is stored
    When querying outputs
    Then output SHALL be retrievable by name "plan"

  Scenario: Outputs persist across workflow execution
    Given phase 1 output is stored
    When phase 3 executes
    Then phase 1 output SHALL still be accessible

  Scenario: Dependent phases can reference outputs by name
    Given phase "implement" depends on phase "plan"
    When phase "implement" starts
    Then it SHALL receive "plan" output in context
```

**Rationale**:
Workflow phases often need data from previous phases. Named outputs provide structured data flow mechanism.

---

#### FR-SM-008: Phase Output Persistence

| Attribute      | Value                    |
| -------------- | ------------------------ |
| **ID**         | FR-SM-008                |
| **Title**      | Phase Output Persistence |
| **Priority**   | High                     |
| **Implements** | HL-SR-003                |

**Requirement**:
The system SHALL persist phase outputs to individual files organized by task for easy inspection and context loading so that outputs can be debugged and reused.

**Acceptance Criteria**:

```gherkin
Feature: Phase Output Persistence

  Scenario: Each phase output is saved to separate file
    Given phases "plan", "implement", "test" produce outputs
    When each phase completes
    Then each output SHALL be saved to its own file

  Scenario: Outputs are organized under task directory
    Given task "TASK-789" executes
    When outputs are saved
    Then files SHALL be under "tasks/TASK-789/" directory

  Scenario: Output files use consistent naming convention
    Given phase "plan" produces output
    When saving output
    Then file SHALL be named consistently (e.g., "plan/output.txt")

  Scenario: Outputs are loadable as context for subsequent phases
    Given phase "plan" output is persisted
    When phase "implement" needs context
    Then "plan" output SHALL be loadable from file
```

**Rationale**:
Individual output files enable easy inspection, debugging, and selective context loading for dependent phases.

---

#### FR-SM-009: Workflow Execution State Tracking

| Attribute      | Value                             |
| -------------- | --------------------------------- |
| **ID**         | FR-SM-009                         |
| **Title**      | Workflow Execution State Tracking |
| **Priority**   | Critical                          |
| **Implements** | HL-SR-001                         |

**Requirement**:
The system SHALL track current execution state for each workflow so that pause/resume and progress monitoring are possible.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Execution State Tracking

  Scenario: System maintains current phase index
    Given workflow is executing phase 3 of 5
    Then state SHALL include currentPhaseIndex = 3
    And state SHALL include totalPhases = 5

  Scenario: System tracks phase outputs
    Given phase "plan" produced output
    When state is queried
    Then phaseOutputs SHALL include "plan" output

  Scenario: System tracks retry counts
    Given phase "implement" has been retried twice
    When state is queried
    Then retryCount SHALL be 2

  Scenario: System tracks iteration counters
    Given workflow is in iteration 5 of 10
    When state is queried
    Then iterationIndex SHALL be 5

  Scenario: State is accessible during execution
    Given workflow is executing
    When state is queried
    Then current state SHALL be returned immediately
```

**Rationale**:
State tracking enables pause/resume functionality and progress monitoring throughout workflow execution.

---

#### FR-SM-010: Execution History Tracking

| Attribute      | Value                      |
| -------------- | -------------------------- |
| **ID**         | FR-SM-010                  |
| **Title**      | Execution History Tracking |
| **Priority**   | High                       |
| **Implements** | HL-SR-001                  |

**Requirement**:
The system SHALL track workflow execution history including phase outputs, generated artifacts, and error details in the checkpoint so that complete history is available.

**Acceptance Criteria**:

```gherkin
Feature: Execution History Tracking

  Scenario: Each phase records timestamp, success status, and duration
    Given phase "plan" completes successfully in 30 seconds
    Then history SHALL include startedAt timestamp
    And history SHALL include completedAt timestamp
    And history SHALL include success = true
    And history SHALL include duration = 30000ms

  Scenario: Phase outputs are captured and stored
    Given phase produces output "Plan created"
    Then history SHALL include output content

  Scenario: Artifact paths are tracked in execution history
    Given phase creates artifacts
    Then history SHALL include artifact file paths

  Scenario: Error details including code and message are preserved
    Given phase fails with error "Provider timeout"
    Then history SHALL include errorCode
    And history SHALL include errorMessage
```

**Rationale**:
Comprehensive execution history enables debugging, status reporting, and intelligent workflow resumption.

---

### 2.4 Snapshots & Recovery

This section defines crash recovery mechanisms through snapshots and state restoration.

---

#### FR-SM-013: Workflow Snapshot Management

| Attribute      | Value                        |
| -------------- | ---------------------------- |
| **ID**         | FR-SM-013                    |
| **Title**      | Workflow Snapshot Management |
| **Priority**   | Critical                     |
| **Implements** | HL-SR-002                    |

**Requirement**:
The system SHALL persist workflow execution snapshots to enable resumption after process termination so that interrupted workflows can continue from where they stopped.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Snapshot Management

  Scenario: Snapshots capture complete workflow state including current phase
    Given workflow is executing phase 3 of 5
    When the State Manager creates a snapshot
    Then the snapshot SHALL include current phase index 3
    And the snapshot SHALL include total phases 5

  Scenario: Snapshots include workflow context and phase outputs
    Given phase "plan" output is "Implementation plan"
    And workflow context includes task "TASK-789"
    When the State Manager creates a snapshot
    Then the snapshot SHALL include the phase output
    And the snapshot SHALL include the workflow context

  Scenario: Snapshots are persisted after each phase completion
    Given workflow has 4 phases
    When phase 2 completes successfully
    Then the State Manager SHALL persist a snapshot immediately
    And the snapshot SHALL reflect completion of phase 2

  Scenario: Snapshots can be restored to resume execution
    Given a valid snapshot exists for task "TASK-789"
    When the State Manager restores from snapshot
    Then the workflow state SHALL match the snapshot
    And execution SHALL be ready to continue from next phase

  Scenario: Snapshot restoration validates compatibility with current system
    Given a snapshot was created with system version 1.0
    And current system version is 2.0
    When the State Manager attempts to restore
    Then the system SHALL validate version compatibility
    And the system SHALL warn if incompatibilities exist
```

**Rationale**:
Process termination should not require restarting workflows from the beginning. Snapshots enable efficient resumption from last completed phase.

---

#### FR-SM-014: Snapshot on Workflow Initialization

| Attribute      | Value                               |
| -------------- | ----------------------------------- |
| **ID**         | FR-SM-014                           |
| **Title**      | Snapshot on Workflow Initialization |
| **Priority**   | Critical                            |
| **Implements** | HL-SR-002                           |

**Requirement**:
The system SHALL persist snapshots at workflow initialization so that recovery from early failures is possible.

**Acceptance Criteria**:

```gherkin
Feature: Snapshot on Workflow Initialization

  Scenario: Snapshot created before first phase executes
    Given workflow "sdlc" is starting
    When initialization completes
    Then snapshot SHALL be created
    And snapshot SHALL be created before phase 1 starts

  Scenario: Initial snapshot includes workflow definition
    Given workflow is initialized
    When snapshot is created
    Then snapshot SHALL include workflow definition

  Scenario: Initial snapshot includes execution parameters
    Given workflow starts with task "TASK-123"
    When snapshot is created
    Then snapshot SHALL include taskId "TASK-123"
    And snapshot SHALL include all execution parameters
```

**Rationale**:
Initial state snapshot enables recovery from failures that occur during early phases.

---

#### FR-SM-015: Snapshot Before Checkpoints

| Attribute      | Value                       |
| -------------- | --------------------------- |
| **ID**         | FR-SM-015                   |
| **Title**      | Snapshot Before Checkpoints |
| **Priority**   | High                        |
| **Implements** | HL-SR-002                   |

**Requirement**:
The system SHALL persist snapshots before entering checkpoints so that resuming from checkpoint after interruption is possible.

**Acceptance Criteria**:

```gherkin
Feature: Snapshot Before Checkpoints

  Scenario: Snapshot created before checkpoint wait
    Given workflow reaches checkpoint "review"
    When entering checkpoint
    Then snapshot SHALL be created first

  Scenario: Snapshot enables resume after timeout
    Given checkpoint times out
    When workflow resumes
    Then state SHALL be restored from pre-checkpoint snapshot

  Scenario: Snapshot includes checkpoint context
    Given checkpoint has conditions
    When snapshot is created
    Then checkpoint context SHALL be included
```

**Rationale**:
Enables resuming from checkpoint state after process interruption or timeout.

---

#### FR-SM-016: Snapshot on Workflow Pause

| Attribute      | Value                      |
| -------------- | -------------------------- |
| **ID**         | FR-SM-016                  |
| **Title**      | Snapshot on Workflow Pause |
| **Priority**   | High                       |
| **Implements** | HL-SR-002                  |

**Requirement**:
The system SHALL persist snapshots on workflow pause so that manually paused workflows can be resumed cleanly.

**Acceptance Criteria**:

```gherkin
Feature: Snapshot on Workflow Pause

  Scenario: Snapshot created when user pauses workflow
    Given workflow is executing phase 3
    When user pauses workflow
    Then snapshot SHALL be created immediately

  Scenario: Pause snapshot enables clean resume
    Given workflow was paused
    When user resumes workflow
    Then execution SHALL continue from pause point

  Scenario: Pause reason is recorded
    Given user pauses with reason "Need to review"
    When snapshot is created
    Then pause reason SHALL be recorded
```

**Rationale**:
Enables resuming manually paused workflows from exact pause point.

---

#### FR-SM-017: Snapshot on Phase Error

| Attribute      | Value                   |
| -------------- | ----------------------- |
| **ID**         | FR-SM-017               |
| **Title**      | Snapshot on Phase Error |
| **Priority**   | Critical                |
| **Implements** | HL-SR-002               |

**Requirement**:
The system SHALL persist snapshots on phase errors for recovery so that debugging and recovery from failed phases is possible.

**Acceptance Criteria**:

```gherkin
Feature: Snapshot on Phase Error

  Scenario: Snapshot created when phase fails
    Given phase "implement" encounters error
    When error is detected
    Then snapshot SHALL be created before retry or failure

  Scenario: Error snapshot includes error details
    Given phase fails with "Provider timeout"
    When error snapshot is created
    Then snapshot SHALL include error message
    And snapshot SHALL include error code
    And snapshot SHALL include stack trace if available

  Scenario: Error snapshot enables retry from failure point
    Given error snapshot exists
    When retry is initiated
    Then state SHALL be restored from error snapshot
```

**Rationale**:
Enables debugging and recovery from failed phases by preserving exact failure state.

---

#### FR-SM-018: Incomplete Task Detection

| Attribute      | Value                     |
| -------------- | ------------------------- |
| **ID**         | FR-SM-018                 |
| **Title**      | Incomplete Task Detection |
| **Priority**   | High                      |
| **Implements** | HL-SR-002                 |

**Requirement**:
The system SHALL detect tasks that did not complete successfully after process restart so that interrupted workflows can be identified.

**Acceptance Criteria**:

```gherkin
Feature: Incomplete Task Detection

  Scenario: System scans for tasks in in_progress state on startup
    Given task "TASK-111" has status "in_progress"
    And task "TASK-222" has status "completed"
    When the system starts
    Then the State Manager SHALL identify "TASK-111" as incomplete
    And the State Manager SHALL NOT flag "TASK-222"

  Scenario: System verifies snapshot existence for incomplete tasks
    Given task "TASK-111" is incomplete
    When the State Manager checks for recovery options
    Then it SHALL verify if a valid snapshot exists
    And it SHALL report snapshot availability

  Scenario: System reports list of incomplete tasks
    Given tasks "TASK-111" and "TASK-333" are incomplete
    When incomplete task detection runs
    Then the State Manager SHALL return both task IDs
    And each task SHALL include last known state information

  Scenario: System distinguishes between recoverable and corrupted tasks
    Given task "TASK-111" has valid snapshot
    And task "TASK-333" has corrupted state
    When incomplete task detection runs
    Then "TASK-111" SHALL be marked as recoverable
    And "TASK-333" SHALL be marked as corrupted

  Scenario: Detection occurs automatically on system startup
    When the system initializes
    Then incomplete task detection SHALL run automatically
    And results SHALL be available before accepting new commands
```

**Rationale**:
Crash recovery requires identifying which tasks were interrupted. Detection enables user decision on recovery actions.

---

#### FR-SM-019: State Recovery from Snapshots

| Attribute      | Value                         |
| -------------- | ----------------------------- |
| **ID**         | FR-SM-019                     |
| **Title**      | State Recovery from Snapshots |
| **Priority**   | High                          |
| **Implements** | HL-SR-002                     |

**Requirement**:
The system SHALL restore execution state from snapshots to resume incomplete workflows so that interrupted work can continue.

**Acceptance Criteria**:

```gherkin
Feature: State Recovery from Snapshots

  Scenario: System loads snapshot for specified task
    Given valid snapshot exists for task "TASK-555"
    When the State Manager initiates recovery for "TASK-555"
    Then the snapshot SHALL be loaded successfully

  Scenario: System validates snapshot compatibility
    Given snapshot has format version "1.0"
    When the State Manager loads the snapshot
    Then it SHALL validate the format version
    And it SHALL ensure required fields are present

  Scenario: System restores workflow context from snapshot
    Given snapshot contains workflow context with 5 phases
    When the State Manager restores from snapshot
    Then the workflow context SHALL have 5 phases
    And all phase configurations SHALL be restored

  Scenario: System resumes from last completed phase
    Given snapshot shows phase 3 of 5 completed
    When workflow resumes
    Then execution SHALL start from phase 4
    And phases 1-3 SHALL NOT be re-executed

  Scenario: System handles snapshot restoration errors gracefully
    Given snapshot file is corrupted
    When the State Manager attempts restoration
    Then it SHALL return a clear error message
    And it SHALL NOT leave system in inconsistent state
```

**Rationale**:
Snapshot restoration enables efficient resumption without restarting from beginning, saving time and compute resources.

---

#### FR-SM-020: State Integrity Validation

| Attribute      | Value                      |
| -------------- | -------------------------- |
| **ID**         | FR-SM-020                  |
| **Title**      | State Integrity Validation |
| **Priority**   | High                       |
| **Implements** | HL-SR-002                  |

**Requirement**:
The system SHALL validate state integrity during recovery operations so that corrupted state is detected before resumption.

**Acceptance Criteria**:

```gherkin
Feature: State Integrity Validation

  Scenario: System validates snapshot format and structure
    Given a snapshot file exists
    When the State Manager validates the snapshot
    Then it SHALL verify JSON structure is valid
    And it SHALL verify required sections exist

  Scenario: System validates snapshot version compatibility
    Given snapshot was created with format version "1.2"
    And current system supports versions "1.0" to "2.0"
    When the State Manager validates
    Then it SHALL confirm version "1.2" is supported

  Scenario: System verifies required fields are present
    Given a snapshot file exists
    When the State Manager validates
    Then it SHALL verify taskId is present
    And it SHALL verify status is present
    And it SHALL verify phases array is present

  Scenario: System marks corrupted tasks as failed
    Given snapshot validation fails for task "TASK-666"
    When validation completes
    Then the task status SHALL be updated to "failed"
    And the failure reason SHALL indicate corruption

  Scenario: System provides clear errors for validation failures
    Given snapshot is missing required field "phases"
    When validation fails
    Then the error SHALL identify the missing field
    And the error SHALL suggest recovery options
```

**Rationale**:
State corruption can occur during crashes. Validation prevents attempting to resume from corrupted state.

---

#### FR-SM-021: Workflow Resumption Support

| Attribute      | Value                       |
| -------------- | --------------------------- |
| **ID**         | FR-SM-021                   |
| **Title**      | Workflow Resumption Support |
| **Priority**   | Critical                    |
| **Implements** | HL-SR-002                   |

**Requirement**:
The system SHALL support workflow resumption after crashes or interruptions from the last successful checkpoint.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Resumption Support

  Scenario: Resumable flag indicates workflow can be resumed
    Given task "TASK-777" has incomplete status
    And valid snapshot exists
    When the State Manager checks resumability
    Then the task SHALL be marked as resumable

  Scenario: Workflow resumes from last successful phase
    Given phases 1 and 2 completed successfully
    And phase 3 was interrupted
    When workflow resumes
    Then execution SHALL start from phase 3
    And phases 1 and 2 outputs SHALL be available

  Scenario: Previously completed phases are not re-executed
    Given phase "plan" completed with output "Plan created"
    When workflow resumes
    Then phase "plan" SHALL NOT execute again
    And the original output SHALL be used

  Scenario: Partial phase execution is retried from beginning
    Given phase "implement" started but did not complete
    When workflow resumes
    Then phase "implement" SHALL execute from the beginning
    And no partial results SHALL be used
```

**Rationale**:
Long-running workflows must be resumable to avoid losing progress from crashes, network issues, or user interruptions.

---

#### FR-SM-022: Version-Based Snapshot Compatibility

| Attribute      | Value                                |
| -------------- | ------------------------------------ |
| **ID**         | FR-SM-022                            |
| **Title**      | Version-Based Snapshot Compatibility |
| **Priority**   | Medium                               |
| **Implements** | HL-SR-002                            |

**Requirement**:
The system SHALL validate snapshot version compatibility and reject snapshots created by newer versions so that forward compatibility issues are prevented and users receive clear guidance.

**Acceptance Criteria**:

```gherkin
Feature: Version-Based Snapshot Compatibility

  Scenario: Accept snapshots from same version
    Given current FlowMaster version is "1.5.0"
    And snapshot was created by version "1.5.0"
    When snapshot is loaded
    Then snapshot SHALL be accepted
    And recovery SHALL proceed normally

  Scenario: Accept snapshots from older compatible versions
    Given current FlowMaster version is "1.5.0"
    And snapshot was created by version "1.4.0"
    And versions are backward compatible
    When snapshot is loaded
    Then snapshot SHALL be accepted
    And any necessary migrations SHALL be applied

  Scenario: Reject snapshots from newer versions
    Given current FlowMaster version is "1.5.0"
    And snapshot was created by version "1.6.0"
    When snapshot is loaded
    Then snapshot SHALL be rejected
    And error message SHALL indicate version mismatch
    And suggestion to upgrade SHALL be provided

  Scenario: Version stored in snapshot metadata
    Given a snapshot is created
    When snapshot is serialized
    Then FlowMaster version SHALL be included in metadata
    And schema version SHALL be included

  Scenario: Clear error message for version mismatch
    Given snapshot version is incompatible
    When loading fails
    Then error message SHALL include snapshot version
    And error message SHALL include current version
    And error message SHALL suggest resolution
```

**Rationale**:
Version compatibility validation prevents cryptic errors from attempting to use snapshots with incompatible schema changes, providing clear guidance instead.

---

#### FR-SM-023: Unified Checkpoint File Architecture

| Attribute      | Value                                |
| -------------- | ------------------------------------ |
| **ID**         | FR-SM-023                            |
| **Title**      | Unified Checkpoint File Architecture |
| **Priority**   | Low                                  |
| **Implements** | HL-SR-002                            |

**Requirement**:
The system SHALL use a unified checkpoint file that combines state and context so that recovery requires only a single file and atomic operations are simplified.

**Acceptance Criteria**:

```gherkin
Feature: Unified Checkpoint File Architecture

  Scenario: Single checkpoint file contains all recovery data
    Given a checkpoint is created
    When checkpoint file is written
    Then it SHALL contain task state
    And it SHALL contain workflow context
    And it SHALL contain phase outputs
    And it SHALL contain execution position

  Scenario: Checkpoint file is self-contained
    Given a checkpoint file exists
    When recovery is attempted
    Then no other files SHALL be required for state recovery
    And checkpoint SHALL include all necessary context

  Scenario: Atomic checkpoint updates
    Given a checkpoint needs to be updated
    When update is performed
    Then update SHALL be atomic (write-rename pattern)
    And partial writes SHALL not corrupt checkpoint

  Scenario: Checkpoint includes integrity verification
    Given a checkpoint file
    When checkpoint is loaded
    Then checksum SHALL be verified
    And corrupted checkpoints SHALL be detected

  Scenario: Checkpoint file size is reasonable
    Given a large workflow with many phases
    When checkpoint is created
    Then file size SHALL be reasonable (< 10MB for typical workflows)
    And large artifacts SHALL be referenced, not embedded
```

**Rationale**:
A unified checkpoint simplifies recovery by requiring only one file, enables atomic updates, and reduces the risk of inconsistent state across multiple files.

---

### 2.5 Session & Retry Tracking

This section defines tracking mechanisms for sessions and retry attempts.

---

#### FR-SM-024: Session ID Tracking

| Attribute      | Value               |
| -------------- | ------------------- |
| **ID**         | FR-SM-024           |
| **Title**      | Session ID Tracking |
| **Priority**   | High                |
| **Implements** | HL-SR-002           |

**Requirement**:
The system SHALL capture and persist session identifiers for multi-turn AI conversations to enable conversation resumption so that context is maintained across interactions.

**Acceptance Criteria**:

```gherkin
Feature: Session ID Tracking

  Scenario: Session ID is captured from provider responses
    Given provider returns sessionId "sess-abc-123"
    Then the system SHALL extract the session ID

  Scenario: Session ID is stored in phase execution record
    Given phase completes with sessionId
    When state is persisted
    Then sessionId SHALL be in phase record

  Scenario: Session ID can be passed to subsequent executions
    Given previous phase has sessionId "sess-abc-123"
    When next execution starts
    Then sessionId SHALL be available for resumption

  Scenario: Session resumption is supported across workflow phases
    Given multi-turn conversation in progress
    When workflow resumes
    Then previous session SHALL be resumable
```

**Rationale**:
Session IDs enable multi-turn conversations where AI maintains context across interactions, improving response quality.

---

#### FR-SM-025: Retry Count Tracking

| Attribute      | Value                |
| -------------- | -------------------- |
| **ID**         | FR-SM-025            |
| **Title**      | Retry Count Tracking |
| **Priority**   | High                 |
| **Implements** | HL-SR-001            |

**Requirement**:
The system SHALL track retry counts for failed phases so that retry logic can enforce limits and implement backoff strategies.

**Acceptance Criteria**:

```gherkin
Feature: Retry Count Tracking

  Scenario: System maintains retry count per phase
    Given phase "implement" is executing
    Then retry count SHALL be tracked for that phase

  Scenario: Count increments with each retry
    Given phase failed and retry count is 1
    When phase is retried
    Then retry count SHALL become 2

  Scenario: Count is checked against maximum
    Given retry count is 3 and maximum is 3
    When checking if retry is allowed
    Then system SHALL indicate no more retries

  Scenario: Count resets after phase success
    Given phase "implement" had retry count 2
    When phase succeeds
    Then retry count SHALL reset to 0 for next execution
```

**Rationale**:
Retry logic requires tracking number of attempts to enforce retry limits and implement backoff strategies.

---

#### FR-SM-026: State Restoration for Iteration Resume

| Attribute      | Value                                  |
| -------------- | -------------------------------------- |
| **ID**         | FR-SM-026                              |
| **Title**      | State Restoration for Iteration Resume |
| **Priority**   | High                                   |
| **Implements** | HL-SR-002                              |

**Requirement**:
The system SHALL restore iteration state from snapshots to resume after crashes so that long-running iterations survive process failures.

**Acceptance Criteria**:

```gherkin
Feature: State Restoration for Iteration Resume

  Scenario: Iteration state persisted after each iteration
    Given workflow is in iteration 5
    When iteration completes
    Then iteration state SHALL be persisted

  Scenario: State includes iteration counter
    Given iteration 5 completes
    When state is persisted
    Then iterationIndex SHALL be 5

  Scenario: State includes accumulated outputs
    Given iterations 1-4 produced outputs
    When state is persisted
    Then all accumulated outputs SHALL be included

  Scenario: State includes completed phase tracking
    Given iteration completed phases 1-3
    When state is persisted
    Then completed phases SHALL be tracked

  Scenario: Resume continues from last completed iteration
    Given crash after iteration 7
    When workflow resumes
    Then execution SHALL continue from iteration 8
```

**Rationale**:
Long-running iterative workflows (hundreds of tasks) must survive process crashes and resume from the last completed iteration without losing work.

---

### 2.6 Error Management

This section defines how errors are stored, tracked, and classified.

---

#### FR-SM-027: Error Detail Storage

| Attribute      | Value                |
| -------------- | -------------------- |
| **ID**         | FR-SM-027            |
| **Title**      | Error Detail Storage |
| **Priority**   | High                 |
| **Implements** | HL-SR-001            |

**Requirement**:
The system SHALL store error details for failed phases so that debugging workflow failures is possible.

**Acceptance Criteria**:

```gherkin
Feature: Error Detail Storage

  Scenario: System stores error category
    Given phase fails with timeout error
    Then error category "timeout_error" SHALL be stored

  Scenario: System stores error message
    Given phase fails with message "Provider connection timed out"
    Then error message SHALL be stored verbatim

  Scenario: System stores error timestamp
    Given phase fails at "2025-11-25T10:30:00Z"
    Then error timestamp SHALL be stored

  Scenario: System stores attempt number
    Given phase fails on attempt 2
    Then attempt number SHALL be stored

  Scenario: Error history is accessible
    Given multiple errors occurred
    When querying error history
    Then all errors SHALL be returned in order
```

**Rationale**:
Debugging workflow failures requires detailed error information including category, message, and attempt history.

---

#### FR-SM-028: Error History Tracking

| Attribute      | Value                  |
| -------------- | ---------------------- |
| **ID**         | FR-SM-028              |
| **Title**      | Error History Tracking |
| **Priority**   | High                   |
| **Implements** | HL-SR-001              |

**Requirement**:
The system SHALL maintain error history including error messages, timestamps, and retry counts so that error patterns can be identified and debugged.

**Acceptance Criteria**:

```gherkin
Feature: Error History Tracking

  Scenario: Error history includes complete error messages
    Given phase fails with "Connection refused to provider"
    Then error history SHALL include complete message

  Scenario: Error history includes error timestamps
    Given error occurs at specific time
    Then error history SHALL include ISO 8601 timestamp

  Scenario: Error history includes retry attempt count
    Given error occurs on retry attempt 2
    Then error history SHALL include attempt number

  Scenario: Error history is persisted with task state
    Given errors have occurred
    When task state is saved
    Then error history SHALL be included

  Scenario: Error history is accessible for debugging
    Given multiple errors in history
    When querying error history
    Then all errors SHALL be returned chronologically
```

**Rationale**:
Error history enables debugging of intermittent failures and understanding of retry patterns.

---

#### FR-SM-029: Error Classification

| Attribute      | Value                |
| -------------- | -------------------- |
| **ID**         | FR-SM-029            |
| **Title**      | Error Classification |
| **Priority**   | High                 |
| **Implements** | HL-SR-002            |

**Requirement**:
The system SHALL classify errors by type to determine retry eligibility including claude_code_error, timeout_error, execution_error, validation_error, and dependency_error so that intelligent retry decisions can be made.

**Acceptance Criteria**:

```gherkin
Feature: Error Classification

  Scenario: Errors are classified using defined error codes
    Given an error occurs
    When error is recorded
    Then error SHALL have one of the defined error codes

  Scenario: Different error types have different retry eligibility
    Given timeout_error occurs
    Then error SHALL be marked as retryable
    Given validation_error occurs
    Then error SHALL be marked as non-retryable

  Scenario: Error classification is logged with error details
    Given error is classified as "execution_error"
    When error is logged
    Then classification SHALL be included in log

  Scenario: Retry logic respects error classification
    Given non-retryable "dependency_error" occurs
    When retry decision is made
    Then system SHALL NOT retry
```

**Rationale**:
Not all errors are retryable. Classification enables intelligent retry decisions, avoiding futile retry loops.

---

### 2.7 Artifacts

This section defines how execution artifacts are stored and retrieved.

---

#### FR-SM-030: Command Artifact Storage

| Attribute      | Value                    |
| -------------- | ------------------------ |
| **ID**         | FR-SM-030                |
| **Title**      | Command Artifact Storage |
| **Priority**   | High                     |
| **Implements** | HL-SR-003                |

**Requirement**:
The system SHALL store command artifacts including prompts, outputs, diffs, and message histories so that executions can be reviewed and audited.

**Acceptance Criteria**:

```gherkin
Feature: Command Artifact Storage

  Scenario: Artifacts include prompts sent to providers
    Given command "plan" executes with prompt "Create implementation plan"
    When the command completes
    Then the State Manager SHALL save the prompt as an artifact

  Scenario: Artifacts include complete command outputs
    Given command produces output "Implementation plan created"
    When the command completes
    Then the State Manager SHALL save the complete output

  Scenario: Artifacts include full message history for conversational commands
    Given command involves multi-turn conversation
    And 5 messages were exchanged
    When the command completes
    Then the State Manager SHALL save all 5 messages

  Scenario: Artifacts include code diffs when files are modified
    Given command modifies file "src/index.ts"
    When the command completes
    Then the State Manager SHALL save the diff of changes

  Scenario: Artifacts are organized by task and phase
    Given task "TASK-888" executes phase "implement"
    When artifacts are saved
    Then they SHALL be stored under "tasks/TASK-888/implement/"

  Scenario: Artifacts are in human-readable formats
    When artifacts are saved
    Then prompts SHALL be saved as plain text
    And outputs SHALL be saved as plain text or JSON
    And message history SHALL be saved as JSON
```

**Rationale**:
Execution artifacts enable post-execution review, debugging, compliance auditing, and quality improvement.

---

#### FR-SM-031: Artifact Retrieval

| Attribute      | Value              |
| -------------- | ------------------ |
| **ID**         | FR-SM-031          |
| **Title**      | Artifact Retrieval |
| **Priority**   | Medium             |
| **Implements** | HL-SR-003          |

**Requirement**:
The system SHALL retrieve stored artifacts by task, phase, and artifact type so that artifacts can be accessed for review.

**Acceptance Criteria**:

```gherkin
Feature: Artifact Retrieval

  Scenario: System loads artifacts by task ID, phase name, and type
    Given artifact exists for task "TASK-999", phase "plan", type "prompt"
    When the State Manager retrieves the artifact
    Then it SHALL return the prompt content

  Scenario: System returns artifact content or file path
    Given large artifact exists
    When the State Manager retrieves the artifact
    Then it SHALL return the content for small artifacts
    Or it SHALL return the file path for large artifacts

  Scenario: System handles missing artifacts gracefully
    Given no artifact exists for task "TASK-000"
    When the State Manager attempts retrieval
    Then it SHALL return null or empty result
    And it SHALL NOT throw an error

  Scenario: Retrieval supports both text and binary artifacts
    Given text prompt artifact exists
    And binary image artifact exists
    When the State Manager retrieves each
    Then it SHALL return text content for prompt
    And it SHALL return binary data or path for image

  Scenario: Retrieval provides clear errors for missing artifacts
    Given artifact is requested but does not exist
    When retrieval fails
    Then the error SHALL identify the task ID
    And the error SHALL identify the phase name
    And the error SHALL identify the artifact type requested
```

**Rationale**:
Artifact retrieval enables programmatic access to execution history for debugging and analysis tools.

---

#### FR-SM-032: Real-Time Log Appending

| Attribute      | Value                   |
| -------------- | ----------------------- |
| **ID**         | FR-SM-032               |
| **Title**      | Real-Time Log Appending |
| **Priority**   | High                    |
| **Implements** | HL-SR-003               |

**Requirement**:
The system SHALL append log entries in real-time during execution so that progress can be monitored as it happens.

**Acceptance Criteria**:

```gherkin
Feature: Real-Time Log Appending

  Scenario: Log entries are written immediately when events occur
    Given event occurs during execution
    Then log entry SHALL be written within 100ms

  Scenario: Log files can be tailed while workflow is executing
    Given workflow is executing
    When log file is tailed
    Then new entries SHALL appear in real-time

  Scenario: Concurrent writes to same log file are handled safely
    Given parallel phase execution
    When multiple events occur simultaneously
    Then all events SHALL be logged
    And no corruption SHALL occur

  Scenario: Log entries include millisecond-precision timestamps
    Given event occurs
    When log entry is written
    Then timestamp SHALL include milliseconds

  Scenario: Log writes don't significantly impact execution performance
    Given high-frequency events
    When logging is enabled
    Then execution overhead SHALL be less than 5%
```

**Rationale**:
Real-time logging enables monitoring long-running workflows and immediate visibility into execution progress.

---

### 2.8 Maintenance

This section defines maintenance operations for managing stored data.

---

#### FR-SM-033: Task Cleanup Operations

| Attribute      | Value                   |
| -------------- | ----------------------- |
| **ID**         | FR-SM-033               |
| **Title**      | Task Cleanup Operations |
| **Priority**   | Low                     |
| **Implements** | HL-SR-003               |

**Requirement**:
The system SHALL support cleanup operations for completed or failed tasks so that disk space can be reclaimed.

**Acceptance Criteria**:

```gherkin
Feature: Task Cleanup Operations

  Scenario: System can delete task directories
    Given task "TASK-123" is completed
    When cleanup is requested
    Then task directory SHALL be deleted

  Scenario: Cleanup removes all task artifacts and logs
    Given task has state, logs, and artifacts
    When cleanup completes
    Then all files SHALL be removed

  Scenario: Cleanup operation requires confirmation
    Given cleanup is requested
    Then system SHALL prompt for confirmation
    And cleanup SHALL only proceed if confirmed

  Scenario: System provides cleanup statistics
    Given cleanup completes
    Then system SHALL report space reclaimed
    And system SHALL report files deleted

  Scenario: Cleanup can target specific tasks or all completed tasks
    Given multiple completed tasks exist
    When cleanup is requested
    Then user SHALL be able to specify task ID
    Or user SHALL be able to cleanup all completed
```

**Rationale**:
Over time, task artifacts accumulate and consume disk space. Cleanup enables space management.

---

## 3. Error Handling

> **Note**: All errors use the canonical error codes and reason codes defined in the [Error Types Shared Schema](../integration/schemas/00-error-types.md).

### 3.1 Error Scenarios

| Error Code            | Reason Code                  | Scenario                   | Severity | Recovery Action                       |
| --------------------- | ---------------------------- | -------------------------- | -------- | ------------------------------------- |
| `NOT_FOUND`           | `STATE_FILE_NOT_FOUND`       | State file not found       | Error    | Create new state or fail if required  |
| `DATA_LOSS`           | `STATE_FILE_CORRUPTED`       | State file corrupted       | Error    | Mark task as failed, log details      |
| `INTERNAL`            | `ATOMIC_WRITE_FAILED`        | Atomic write failed        | Error    | Retry with backoff, preserve original |
| `DATA_LOSS`           | `SNAPSHOT_VALIDATION_FAILED` | Snapshot validation failed | Error    | Mark as unrecoverable, log details    |
| `INTERNAL`            | `ARTIFACT_STORAGE_FAILED`    | Artifact storage failed    | Warning  | Log error, continue execution         |
| `RESOURCE_EXHAUSTED`  | `DISK_SPACE_EXHAUSTED`       | Disk space exhausted       | Error    | Fail operation, emit alert            |
| `ABORTED`             | `CONCURRENT_WRITE_CONFLICT`  | Concurrent write conflict  | Warning  | Serialize writes, retry               |
| `FAILED_PRECONDITION` | `VERSION_INCOMPATIBLE`       | Version incompatibility    | Error    | Fail with migration guidance          |

### 3.2 Retry Behavior

| Condition                 | Retry? | Max Attempts | Backoff Strategy         |
| ------------------------- | ------ | ------------ | ------------------------ |
| Atomic write failure      | Yes    | 3            | Exponential (100ms base) |
| File read transient error | Yes    | 3            | Exponential (50ms base)  |
| Concurrent write conflict | Yes    | 5            | Linear (10ms)            |
| Disk space exhausted      | No     | -            | -                        |
| Corruption detected       | No     | -            | -                        |
| Permission denied         | No     | -            | -                        |

### 3.3 Error Response Format

All State Manager errors follow the standard error response format from SCH-001:

```json
{
  "success": false,
  "error": {
    "code": "DATA_LOSS",
    "message": "State file corrupted and cannot be recovered",
    "httpStatus": 500,
    "isRetryable": false,
    "timestamp": "2025-11-29T10:30:00Z",
    "requestId": "req-abc123",
    "details": {
      "reason": "STATE_FILE_CORRUPTED",
      "domain": "state-manager",
      "metadata": {
        "taskId": "TASK-123",
        "operation": "read",
        "path": ".flowmaster/tasks/TASK-123/state.json"
      }
    }
  }
}
```

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface      | Provider Component   | Purpose                            |
| -------------- | -------------------- | ---------------------------------- |
| Event Emission | COMP-001 Message Bus | Emit state change and error events |

### 4.2 Provided Interfaces (For Other Components)

| Interface             | Consumer Component(s)                           | Purpose                                                |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Task State Operations | COMP-008 Orchestrator, COMP-005 Context Manager | Create, read, update task state                        |
| Phase Operations      | COMP-008 Orchestrator, COMP-005 Context Manager | Add phase results, get phase outputs                   |
| Snapshot Operations   | COMP-008 Orchestrator                           | Create, restore, validate snapshots for crash recovery |
| Recovery Operations   | COMP-008 Orchestrator                           | Detect incomplete tasks, check resumability            |
| Artifact Operations   | COMP-005 Context Manager, COMP-004 Telemetry    | Save and retrieve execution artifacts                  |

---

## 5. Data Requirements

### 5.1 Managed Entities

| Entity       | Description                               | Storage                       |
| ------------ | ----------------------------------------- | ----------------------------- |
| TaskState    | Complete task execution state             | JSON file per task            |
| Snapshot     | Workflow state snapshot for recovery      | JSON file per snapshot        |
| PhaseResult  | Result from completed phase               | Embedded in TaskState         |
| Artifact     | Execution artifact (prompt, output, etc.) | Individual files per artifact |
| ExecutionLog | Phase execution log                       | Text file per phase           |

### 5.2 Storage Structure

```
.flowmaster/
└── tasks/
    └── {taskId}/
        ├── state.json           # Task state
        ├── snapshot.json        # Latest snapshot
        └── {phaseName}/
            ├── prompt.txt       # Prompt sent to provider
            ├── output.txt       # Provider output
            ├── messages.json    # Message history
            ├── diff.patch       # Code changes (if any)
            └── execution.log    # Execution log
```

### 5.3 Data Formats

#### state.json

```json
{
  "version": "1.0",
  "taskId": "TASK-123",
  "status": "in_progress",
  "workflowName": "sdlc",
  "currentPhaseIndex": 2,
  "totalPhases": 5,
  "phases": [
    {
      "name": "plan",
      "command": "plan",
      "status": "completed",
      "output": "Implementation plan created...",
      "startedAt": "2025-11-25T10:30:00Z",
      "completedAt": "2025-11-25T10:32:00Z",
      "sessionId": "sess-abc-123"
    },
    {
      "name": "implement",
      "command": "implement",
      "status": "running",
      "startedAt": "2025-11-25T10:33:00Z"
    }
  ],
  "createdAt": "2025-11-25T10:30:00Z",
  "updatedAt": "2025-11-25T10:33:00Z"
}
```

#### snapshot.json

```json
{
  "version": "1.0",
  "taskId": "TASK-123",
  "state": {
    /* TaskState object */
  },
  "context": {
    "workflowDefinition": {
      /* ... */
    },
    "phaseOutputs": {
      "plan": "Implementation plan created..."
    },
    "variables": {
      "task_id": "TASK-123"
    }
  },
  "createdAt": "2025-11-25T10:32:00Z",
  "checksum": "sha256:abc123..."
}
```

---

## 6. Traceability

### 6.1 HL to FR Mapping

| HL Requirement | Functional Requirements                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HL-SR-001      | FR-SM-001, FR-SM-003, FR-SM-004, FR-SM-005, FR-SM-006, FR-SM-007, FR-SM-009, FR-SM-010, FR-SM-025, FR-SM-027, FR-SM-028                                  |
| HL-SR-002      | FR-SM-013, FR-SM-014, FR-SM-015, FR-SM-016, FR-SM-017, FR-SM-018, FR-SM-019, FR-SM-020, FR-SM-021, FR-SM-022, FR-SM-023, FR-SM-024, FR-SM-026, FR-SM-029 |
| HL-SR-003      | FR-SM-002, FR-SM-008, FR-SM-030, FR-SM-031, FR-SM-032, FR-SM-033                                                                                         |

### 6.2 Requirements Summary

| Category                 | Count | Critical | High | Medium | Low |
| ------------------------ | ----- | -------- | ---- | ------ | --- |
| Foundation               | 2     | 0        | 2    | 0      | 0   |
| Task Lifecycle           | 3     | 2        | 1    | 0      | 0   |
| Phase Execution          | 5     | 2        | 3    | 0      | 0   |
| Snapshots & Recovery     | 11    | 4        | 5    | 1      | 1   |
| Session & Retry Tracking | 3     | 0        | 3    | 0      | 0   |
| Error Management         | 3     | 0        | 3    | 0      | 0   |
| Artifacts                | 3     | 0        | 2    | 1      | 0   |
| Maintenance              | 1     | 0        | 0    | 0      | 1   |
| **Total**                | 31    | 8        | 19   | 2      | 2   |

---

## 7. Open Questions

| Question ID | Question                                            | Owner | Target Date | Resolution |
| ----------- | --------------------------------------------------- | ----- | ----------- | ---------- |
| Q-SM-001    | Should snapshots be compressed for large workflows? | TBD   | TBD         | Pending    |
| Q-SM-002    | How long should artifacts be retained?              | TBD   | TBD         | Pending    |
| Q-SM-003    | Should there be a maximum artifact size limit?      | TBD   | TBD         | Pending    |

---

## 8. Requirements Index

| ID        | Title                                  | Priority | Implements | Status |
| --------- | -------------------------------------- | -------- | ---------- | ------ |
| FR-SM-001 | Three-Layer State Model                | High     | HL-SR-001  | Draft  |
| FR-SM-002 | Task Directory Structure Management    | High     | HL-SR-003  | Draft  |
| FR-SM-003 | Persistent Task Execution State        | Critical | HL-SR-001  | Draft  |
| FR-SM-004 | Task Status Tracking                   | Critical | HL-SR-001  | Draft  |
| FR-SM-005 | Atomic State Persistence               | Critical | HL-SR-001  | Draft  |
| FR-SM-006 | Phase-Based Execution Logging          | High     | HL-SR-001  | Draft  |
| FR-SM-007 | Phase Output Management                | Critical | HL-SR-001  | Draft  |
| FR-SM-008 | Phase Output Persistence               | High     | HL-SR-003  | Draft  |
| FR-SM-009 | Workflow Execution State Tracking      | Critical | HL-SR-001  | Draft  |
| FR-SM-010 | Execution History Tracking             | High     | HL-SR-001  | Draft  |
| FR-SM-013 | Workflow Snapshot Management           | Critical | HL-SR-002  | Draft  |
| FR-SM-014 | Snapshot on Workflow Initialization    | Critical | HL-SR-002  | Draft  |
| FR-SM-015 | Snapshot Before Checkpoints            | High     | HL-SR-002  | Draft  |
| FR-SM-016 | Snapshot on Workflow Pause             | High     | HL-SR-002  | Draft  |
| FR-SM-017 | Snapshot on Phase Error                | Critical | HL-SR-002  | Draft  |
| FR-SM-018 | Incomplete Task Detection              | High     | HL-SR-002  | Draft  |
| FR-SM-019 | State Recovery from Snapshots          | High     | HL-SR-002  | Draft  |
| FR-SM-020 | State Integrity Validation             | High     | HL-SR-002  | Draft  |
| FR-SM-021 | Workflow Resumption Support            | Critical | HL-SR-002  | Draft  |
| FR-SM-022 | Version-Based Snapshot Compatibility   | Medium   | HL-SR-002  | Draft  |
| FR-SM-023 | Unified Checkpoint File Architecture   | Low      | HL-SR-002  | Draft  |
| FR-SM-024 | Session ID Tracking                    | High     | HL-SR-002  | Draft  |
| FR-SM-025 | Retry Count Tracking                   | High     | HL-SR-001  | Draft  |
| FR-SM-026 | State Restoration for Iteration Resume | High     | HL-SR-002  | Draft  |
| FR-SM-027 | Error Detail Storage                   | High     | HL-SR-001  | Draft  |
| FR-SM-028 | Error History Tracking                 | High     | HL-SR-001  | Draft  |
| FR-SM-029 | Error Classification                   | High     | HL-SR-002  | Draft  |
| FR-SM-030 | Command Artifact Storage               | High     | HL-SR-003  | Draft  |
| FR-SM-031 | Artifact Retrieval                     | Medium   | HL-SR-003  | Draft  |
| FR-SM-032 | Real-Time Log Appending                | High     | HL-SR-003  | Draft  |
| FR-SM-033 | Task Cleanup Operations                | Low      | HL-SR-003  | Draft  |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                                             |
| ------- | ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-25 | Architecture Team | Initial version                                                                                                                                     |
| 2.0     | 2025-11-26 | Architecture Team | Reorganized with progressive disclosure; removed configuration requirements (moved to Configuration Manager); renumbered FRs; updated component IDs |
