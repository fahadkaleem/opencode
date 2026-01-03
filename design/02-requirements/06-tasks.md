# Task Manager - Functional Requirements

> **Component ID**: COMP-006
> **Document Version**: 2.0
> **Last Updated**: 2025-11-26
> **Status**: Draft
> **Owner**: FlowMaster Team
> **Related Documents**:
>
> - [Architecture Document](../00-architecture.md)
> - [High-Level Requirements](../../02-high-level-requirements/02-requirements.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the detailed functional requirements for the **Task Manager** component. These requirements decompose the high-level requirements assigned to this component into specific, testable specifications.

### 1.2 Component Summary

| Attribute                      | Value                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Component ID**               | COMP-006                                                                                                                                                |
| **Responsibility**             | Managing task lifecycle, providing unified task interface, handling external system authentication, fetching and syncing tasks, maintaining local cache |
| **Implements HL Requirements** | HL-TM-001                                                                                                                                               |

### 1.3 Requirement ID Convention

All requirements in this document follow the format: **FR-TM-XXX**

| Component    | Prefix | Example   |
| ------------ | ------ | --------- |
| Task Manager | FR-TM  | FR-TM-001 |

### 1.4 Priority Levels

| Priority     | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Component cannot function without this. Must be in MVP.          |
| **High**     | Important for component's core responsibility. Should be in MVP. |
| **Medium**   | Valuable but not essential for initial release.                  |
| **Low**      | Nice to have. Future consideration.                              |

### 1.5 Document Organization

Requirements are organized following progressive disclosure and dependency order:

| Section                 | Purpose                              | Dependencies |
| ----------------------- | ------------------------------------ | ------------ |
| 2.1 Core Interface      | Foundation - unified task operations | None         |
| 2.2 Task Sources        | What task systems are available      | 2.1          |
| 2.3 External Operations | CRUD operations on external tasks    | 2.1, 2.2     |
| 2.4 Caching & State     | Performance and offline support      | 2.3          |

---

## 2. Functional Requirements

### 2.1 Core Interface

This section defines the foundational interface that all other task operations build upon.

---

#### FR-TM-001: Unified Task Operations

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-TM-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL provide a unified task interface supporting create, fetch, update, and complete operations regardless of task source (local or external) so that other components don't need to know the task origin.

**Acceptance Criteria**:

```gherkin
Scenario: Create task through unified interface
  Given the Task Manager is initialized
  When I call create task with summary and description
  Then a task should be created
  And a task identifier should be returned
  And the interface should be the same for local and external tasks

Scenario: Fetch task through unified interface
  Given a task exists with ID "TASK-123"
  When I call fetch task with ID "TASK-123"
  Then the task details should be returned
  And the response format should be consistent regardless of source

Scenario: Update task through unified interface
  Given a task exists with ID "TASK-123"
  When I call update task with new field values
  Then the task should be updated
  And the change should be reflected in subsequent fetches

Scenario: Complete task through unified interface
  Given a task exists with ID "TASK-123"
  When I call complete task
  Then the task status should be set to completed
```

**Rationale**:
A unified interface abstracts the complexity of different task sources, enabling consistent workflow behavior regardless of whether tasks are local or from external systems.

---

### 2.2 Task Sources

This section defines how different task sources (local, Jira, Linear, GitHub) are registered and detected. These requirements depend on FR-TM-001 (Unified Task Operations).

---

#### FR-TM-002: Local Task Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-001 |

**Requirement**:
The system SHALL support local-only tasks without requiring external system connectivity so that workflows can execute in offline or isolated environments.

**Acceptance Criteria**:

```gherkin
Scenario: Create local task
  Given no external task system is configured
  When I create a task with summary "Implement feature"
  Then a local task should be created
  And the task should be persisted locally
  And no external API calls should be made

Scenario: Local task works offline
  Given a local task exists
  And no network connectivity
  When I fetch the task
  Then the task details should be returned from local storage

Scenario: Local task has unique identifier
  Given local tasks are being created
  When I create multiple tasks
  Then each task should have a unique identifier
  And identifiers should follow a consistent format
```

**Rationale**:
Local task support enables workflows to run without external dependencies, supporting offline development, testing, and environments without task management systems.

---

#### FR-TM-003: Multiple Task Source Registration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-001 |

**Requirement**:
The system SHALL support registration of multiple task sources (local, Jira, Linear) so that users can work with tasks from different systems.

**Acceptance Criteria**:

```gherkin
Scenario: Register Jira as task source
  Given valid Jira credentials
  When I configure Jira integration
  Then Jira should be registered as a task source
  And Jira tasks should be accessible

Scenario: Register Linear as task source
  Given valid Linear API key
  When I configure Linear integration
  Then Linear should be registered as a task source
  And Linear tasks should be accessible

Scenario: Multiple sources simultaneously
  Given both Jira and Linear are configured
  When I list available task sources
  Then both sources should be listed
  And tasks from either source should be accessible

Scenario: Local always available
  Given any configuration state
  When I check for local task support
  Then local tasks should always be available
  And no external configuration should be required
```

**Rationale**:
Different teams use different task management systems. Supporting multiple sources enables FlowMaster to work in diverse environments.

---

#### FR-TM-004: ~~Task Source Detection~~ (DEPRECATED)

| Attribute        | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| **Priority**     | ~~High~~ **DEPRECATED**                                                |
| **Implements**   | HL-TM-001                                                              |
| **Dependencies** | FR-TM-003                                                              |
| **Status**       | **DEPRECATED** - Replaced by explicit provider selection via user auth |

**Deprecation Notice**:
This requirement has been deprecated as of 2025-12-27. Auto-detection based on task ID regex patterns was problematic because:

1. **Ambiguity**: Linear "ENG-123" and Jira "PROJ-123" use identical formats
2. **Unnecessary**: Users explicitly authenticate with a provider in the app
3. **Simpler Design**: The system already knows which provider is active after login

**Replacement Design**:
Instead of detecting the provider from the task ID, the system:

1. Tracks which provider the user authenticated with (`activeProvider`)
2. Uses `getActiveProvider()` to get the authenticated provider
3. Routes all task operations to that provider

**Original Requirement** (for historical reference):
~~The system SHALL automatically detect task source from task identifier format so that users don't need to specify the source for each operation.~~

**Rationale for Deprecation**:
Explicit provider selection via user authentication is simpler, unambiguous, and aligns with how users actually interact with the system (they log into Linear OR Jira, not both simultaneously).

---

#### FR-TM-005: GitHub Issues Integration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-003 |

**Requirement**:
The system SHALL support integration with GitHub Issues as a task source so that teams using GitHub for project management can access their issues through FlowMaster workflows.

**Acceptance Criteria**:

```gherkin
Scenario: Fetch task from GitHub Issues
  Given GitHub integration is configured
  And an issue "owner/repo#123" exists in GitHub
  When I fetch task "owner/repo#123"
  Then the system should connect to GitHub API
  And issue details should be retrieved
  And issue metadata should be available for workflows

Scenario: Create issue in GitHub
  Given GitHub integration is configured
  When I create a task with summary "Fix bug in login"
  And repository "owner/repo"
  Then an issue should be created in GitHub
  And the GitHub issue number should be returned

Scenario: Update GitHub issue status
  Given a GitHub issue exists
  When I update the issue status
  Then the issue should be updated via GitHub API
  And labels or state should reflect the change

Scenario: Use task details for context
  Given a GitHub issue is fetched
  When a workflow accesses task context
  Then issue title, body, labels, and assignees should be available
  And the context should be consistent with other task sources
```

**Rationale**:
GitHub Issues is widely used for project management, especially in open-source projects. Supporting GitHub Issues extends FlowMaster's reach to teams not using dedicated task management systems.

---

### 2.3 External Operations

This section defines CRUD operations on external task systems. These requirements depend on FR-TM-001 (Unified Task Operations) and build upon the task source infrastructure from Section 2.2.

---

#### FR-TM-006: Task Retrieval from External System

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Critical             |
| **Implements**   | HL-TM-001            |
| **Dependencies** | FR-TM-001, FR-TM-003 |

**Requirement**:
The system SHALL retrieve task details from external task management systems (Jira, Linear) when requested so that workflows have access to full task context.

**Acceptance Criteria**:

```gherkin
Scenario: Retrieve task from Jira
  Given Jira integration is configured
  And a task "PROJ-123" exists in Jira
  When I fetch task "PROJ-123"
  Then the system should connect to Jira API
  And task details should be retrieved
  And task metadata should be displayed

Scenario: Retrieve task from Linear
  Given Linear integration is configured
  And a task "LIN-456" exists in Linear
  When I fetch task "LIN-456"
  Then the system should connect to Linear API
  And task details should be retrieved

Scenario: Handle connection errors
  Given Jira integration is configured
  And Jira API is unavailable
  When I attempt to fetch a task
  Then a clear error message should be displayed
  And the system should suggest checking connectivity

Scenario: Cache retrieved task
  Given a task is fetched from external system
  When the fetch completes successfully
  Then the task details should be cached locally
```

**Rationale**:
Workflows need task context from external systems to execute effectively. Retrieving full task details provides agents with necessary information.

---

#### FR-TM-007: Task Creation in External System

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-006 |

**Requirement**:
The system SHALL create tasks in external task management systems with summary, description, and project so that users can initialize workflows with new tasks.

**Acceptance Criteria**:

```gherkin
Scenario: Create task in Jira
  Given Jira integration is configured
  When I create a task with summary "Implement login"
  And description "Add OAuth login flow"
  And project "PROJ"
  Then the task should be created in Jira
  And the Jira task identifier should be returned

Scenario: Create task with required fields only
  Given Jira integration is configured
  When I create a task with summary only
  Then the task should be created with summary
  And other fields should use defaults

Scenario: Validate project exists
  Given Jira integration is configured
  When I create a task with invalid project "INVALID"
  Then an error should indicate project not found
  And available projects should be suggested
```

**Rationale**:
Task creation is often the first step in a workflow. Supporting creation in external systems enables end-to-end workflow automation.

---

#### FR-TM-008: Task Updates in External System

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-006 |

**Requirement**:
The system SHALL update task status and fields in external systems when requested so that task state stays synchronized as workflows progress.

**Acceptance Criteria**:

```gherkin
Scenario: Update task summary
  Given a task "PROJ-123" exists in Jira
  When I update the summary to "Updated title"
  Then the Jira task should be updated
  And the local cache should be updated

Scenario: Update task description
  Given a task "PROJ-123" exists in Jira
  When I update the description
  Then the Jira task description should be updated

Scenario: Validate field values
  Given a task exists in external system
  When I update with invalid field value
  Then the update should fail
  And a validation error should be displayed

Scenario: Confirm update success
  Given a task update is requested
  When the external API confirms success
  Then a success message should be displayed
```

**Rationale**:
Task fields need to be updated as work progresses. Synchronizing updates to external systems maintains a single source of truth.

---

#### FR-TM-009: Task Search in External System

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-006 |

**Requirement**:
The system SHALL search tasks in external systems by assignee, status, or custom query so that users can find relevant tasks to work on.

**Acceptance Criteria**:

```gherkin
Scenario: Search by assignee
  Given Jira integration is configured
  When I search tasks assigned to "me"
  Then tasks assigned to current user should be returned

Scenario: Search by status
  Given Jira integration is configured
  When I search tasks with status "In Progress"
  Then tasks with that status should be returned

Scenario: Custom JQL query
  Given Jira integration is configured
  When I search with custom query "project = PROJ AND sprint in openSprints()"
  Then tasks matching the JQL should be returned

Scenario: Handle empty results
  Given Jira integration is configured
  When I search with filters that match no tasks
  Then an empty result set should be returned
  And a message should indicate no matches found
```

**Rationale**:
Users need to discover and select tasks to work on. Search functionality enables finding relevant tasks across large task backlogs.

---

#### FR-TM-010: Task Comments

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-006 |

**Requirement**:
The system SHALL add comments to tasks in external systems when requested so that users can document progress and communicate on tasks.

**Acceptance Criteria**:

```gherkin
Scenario: Add comment to task
  Given a task "PROJ-123" exists in Jira
  When I add comment "Implementation complete, ready for review"
  Then the comment should be posted to Jira
  And confirmation should be displayed

Scenario: Comment with workflow context
  Given a workflow phase has completed
  When I add a comment with phase output
  Then the comment should include the output
  And the comment should be posted successfully

Scenario: Handle comment failure
  Given a task exists in external system
  And the external API is unavailable
  When I attempt to add a comment
  Then a clear error message should be displayed
```

**Rationale**:
Comments provide a record of progress and enable communication. Workflow phases may want to document their outputs or status.

---

#### FR-TM-011: Task Assignment

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-006 |

**Requirement**:
The system SHALL assign tasks to users in external systems when requested so that task ownership can be managed through workflows.

**Acceptance Criteria**:

```gherkin
Scenario: Assign task to user
  Given a task "PROJ-123" exists in Jira
  And a user "john@example.com" exists
  When I assign the task to "john@example.com"
  Then the task assignee should be updated in Jira
  And confirmation should be displayed

Scenario: Assign task to self
  Given a task "PROJ-123" exists
  When I assign the task to "me"
  Then the task should be assigned to the current user

Scenario: Validate user exists
  Given a task exists in external system
  When I assign to non-existent user "invalid@example.com"
  Then an error should indicate user not found
```

**Rationale**:
Task assignment is fundamental to task management. Workflows may need to assign tasks as part of their execution.

---

#### FR-TM-012: Task State Transitions

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-006 |

**Requirement**:
The system SHALL transition tasks between workflow states in external systems so that task status reflects workflow progress.

**Acceptance Criteria**:

```gherkin
Scenario: Transition task to In Progress
  Given a task "PROJ-123" is in "To Do" state
  When I transition to "In Progress"
  Then the task state should change to "In Progress"
  And the transition should be recorded in Jira

Scenario: Validate transition is allowed
  Given a task "PROJ-123" is in "Done" state
  When I attempt to transition to "To Do"
  Then the transition should fail if not allowed
  And available transitions should be displayed

Scenario: List available transitions
  Given a task "PROJ-123" exists
  When I query available transitions
  Then valid target states should be returned
  And transition requirements should be indicated

Scenario: Handle transition failure
  Given a task exists in external system
  When a transition fails
  Then a clear error should indicate the reason
  And the task should remain in original state
```

**Rationale**:
Tasks move through defined workflow states. Transitioning tasks programmatically enables automated workflow progression.

---

### 2.4 Caching & State

This section defines caching and state management for performance and offline support. These requirements depend on external operations from Section 2.3.

---

#### FR-TM-013: External Task Information Caching

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-006 |

**Requirement**:
The system SHALL cache external task information locally for offline execution so that workflows don't depend on external service availability during execution.

**Acceptance Criteria**:

```gherkin
Scenario: Cache task on fetch
  Given Jira integration is configured
  When I fetch task "PROJ-123"
  Then the task should be cached locally
  And subsequent fetches should use cache when appropriate

Scenario: Cache enables offline execution
  Given a task "PROJ-123" is cached
  And external system is unavailable
  When a workflow accesses task context
  Then cached task data should be used
  And execution should continue

Scenario: Human-readable cache format
  Given a task is cached
  When I inspect the cache file
  Then the cache should be in human-readable format (JSON/YAML)
  And task fields should be clearly identifiable

Scenario: Prevent repeated API calls
  Given a task "PROJ-123" was recently fetched
  When the task is accessed multiple times during execution
  Then the cache should be used
  And repeated API calls should be avoided
```

**Rationale**:
External services may be slow or unavailable. Local caching improves performance and enables offline operation during workflow execution.

---

#### FR-TM-014: Cache Refresh

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-013 |

**Requirement**:
The system SHALL support cache refresh to update local cache with latest external data so that workflows can access up-to-date task information when needed.

**Acceptance Criteria**:

```gherkin
Scenario: Force cache refresh
  Given a task "PROJ-123" is cached
  When I request fetch with force-refresh option
  Then the cache should be updated from external system
  And the latest data should be returned

Scenario: Cache expiration
  Given a task was cached more than configured TTL ago
  When the task is accessed
  Then the cache should be refreshed automatically
  And stale data should be replaced

Scenario: Refresh on workflow start
  Given a workflow is starting with task "PROJ-123"
  When workflow initialization occurs
  Then the task should be refreshed from external system
  And the cache should be updated
```

**Rationale**:
Cached data may become stale. Cache refresh ensures workflows have access to current task information when needed.

---

#### FR-TM-015: Three-Layer State Model

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-TM-001 |
| **Dependencies** | FR-TM-013 |

**Requirement**:
The system SHALL maintain a three-layer state model separating external task source, local task cache, and workflow checkpoint so that concerns are clearly separated and each layer can be inspected independently.

**Acceptance Criteria**:

```gherkin
Scenario: External layer contains source of truth
  Given a task exists in Jira
  When the three-layer model is applied
  Then the external layer should represent the Jira task
  And modifications to the task should ultimately sync to this layer

Scenario: Cache layer provides offline access
  Given a task has been fetched from external system
  When the task is cached
  Then the cache layer should contain a local copy
  And the cache should be accessible without external connectivity

Scenario: Checkpoint layer tracks execution state
  Given a workflow is executing with a task
  When workflow state changes
  Then the checkpoint layer should track execution progress
  And checkpoint should be separate from task cache

Scenario: Layers can be inspected independently
  Given all three layers exist for a task
  When I inspect the task state
  Then I should be able to view each layer separately
  And understand the state at each level
  And identify discrepancies between layers

Scenario: Clear separation of responsibilities
  Given the three-layer model
  Then external layer should handle sync with external systems
  And cache layer should handle offline access and performance
  And checkpoint layer should handle workflow execution state
```

**Rationale**:
Clear separation of concerns between external task data, local cache, and execution state improves debuggability and maintainability. Each layer has distinct responsibilities and can evolve independently.

---

#### FR-TM-016: JSON Cache Format

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-TM-001            |
| **Dependencies** | FR-TM-013, FR-TM-015 |

**Requirement**:
The system SHALL cache external task data locally as JSON files so that cached tasks can be easily parsed and used by the system without format conversion.

**Acceptance Criteria**:

```gherkin
Scenario: Cache task as JSON
  Given a task "PROJ-123" is fetched from external system
  When the task is cached
  Then the cache file should be JSON format at ".flowmaster/tasks/{id}/task.json"
  And the file should contain all task fields

Scenario: JSON contains task metadata
  Given a task is cached as JSON
  When I read the cache file
  Then it should contain:
    | field | description |
    | id | Task identifier |
    | summary | Task title/summary |
    | description | Full task description |
    | status | Current task status |
    | priority | Task priority |
    | assignee | Assigned user object |
    | source | External system name |
    | cachedAt | Timestamp of fetch |

Scenario: JSON preserves rich data
  Given a task with comments and attachments is cached
  When I read the JSON file
  Then the description should preserve markdown formatting
  And related data should be included if fetched
  And the structure should match the Task schema

Scenario: Workflow uses cached JSON
  Given a task is cached as JSON
  When a workflow accesses task context
  Then the system should parse the JSON cache directly
  And task fields should be available without transformation
  And no additional API calls should be required
```

**Rationale**:
JSON format is directly parseable by the system, consistent with other FlowMaster state files, and avoids the complexity of parsing markdown with YAML frontmatter. Users who need to inspect tasks should use the external system (Linear, Jira) as the source of truth.

---

## 3. Error Handling Requirements

### 3.1 Error Scenarios

| Error Scenario           | Expected Behavior                               | Error Code |
| ------------------------ | ----------------------------------------------- | ---------- |
| External API unavailable | Use cached data if available, else report error | ERR_TM_001 |
| Invalid task identifier  | Report task not found with suggestions          | ERR_TM_002 |
| Authentication failure   | Prompt for credential refresh                   | ERR_TM_003 |
| Rate limit exceeded      | Queue request, retry with backoff               | ERR_TM_004 |
| Invalid field value      | Report validation error with allowed values     | ERR_TM_005 |
| Transition not allowed   | Report current state and available transitions  | ERR_TM_006 |
| User not found           | Report error with search suggestions            | ERR_TM_007 |
| Project not found        | Report error with available projects            | ERR_TM_008 |

### 3.2 Retry Behavior

| Condition                  | Retry? | Max Attempts | Backoff Strategy           |
| -------------------------- | ------ | ------------ | -------------------------- |
| Network timeout            | Yes    | 3            | Exponential (1s, 2s, 4s)   |
| Rate limit (429)           | Yes    | 5            | Respect Retry-After header |
| Server error (5xx)         | Yes    | 3            | Exponential (2s, 4s, 8s)   |
| Authentication error (401) | No     | -            | Prompt for credentials     |
| Not found (404)            | No     | -            | None                       |
| Validation error (400)     | No     | -            | None                       |

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface        | Provider Component               | Purpose                                             |
| ---------------- | -------------------------------- | --------------------------------------------------- |
| Configuration    | Configuration Manager (COMP-002) | Get task source credentials and connection settings |
| Event Publishing | Message Bus (COMP-001)           | Emit task sync events and status updates            |

### 4.2 Provided Interfaces (Dependents)

| Interface       | Consumer Component(s)      | Purpose                                   |
| --------------- | -------------------------- | ----------------------------------------- |
| Task Operations | Orchestrator (COMP-008)    | Fetch task details for workflow context   |
| Task Operations | Context Manager (COMP-005) | Get task information for context building |
| Task Status     | User Interface (COMP-009)  | Display task information to users         |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity         | Description                                               | Persistence                           |
| -------------- | --------------------------------------------------------- | ------------------------------------- |
| Task           | Task details (ID, summary, description, status, assignee) | Persisted (cache)                     |
| TaskSource     | Configuration for external system connection              | Persisted (via Configuration Manager) |
| TaskTransition | Available state transitions for a task                    | In-memory, fetched on demand          |
| TaskComment    | Comment on a task                                         | Not cached (write-only)               |

### 5.2 Data Constraints

| Constraint         | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| Task ID uniqueness | Task IDs must be unique within their source                      |
| Cache TTL          | Cached task data expires after configurable TTL (default 1 hour) |
| Summary length     | Task summary must be non-empty, max 255 characters               |
| Comment length     | Comments must be non-empty                                       |

---

## 6. Traceability

### 6.1 HL Requirement Decomposition

| HL Requirement | Functional Requirements                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HL-TM-001      | FR-TM-001, FR-TM-002, FR-TM-003, FR-TM-004, FR-TM-005, FR-TM-006, FR-TM-007, FR-TM-008, FR-TM-009, FR-TM-010, FR-TM-011, FR-TM-012, FR-TM-013, FR-TM-014, FR-TM-015, FR-TM-016 |

### 6.2 Requirements Summary

| Category            | Count  | Critical | High   | Medium | Low   |
| ------------------- | ------ | -------- | ------ | ------ | ----- |
| Core Interface      | 1      | 1        | 0      | 0      | 0     |
| Task Sources        | 4      | 0        | 4      | 0      | 0     |
| External Operations | 7      | 1        | 4      | 2      | 0     |
| Caching & State     | 4      | 0        | 3      | 1      | 0     |
| **Total**           | **16** | **2**    | **11** | **3**  | **0** |

---

## 7. Open Questions

| Question ID | Question                                                                     | Owner | Target Date | Resolution |
| ----------- | ---------------------------------------------------------------------------- | ----- | ----------- | ---------- |
| Q-001       | Should cache be shared across workflow executions or isolated per-execution? | TBD   | Stage 4     | Pending    |
| Q-002       | How should conflicts between local cache and external data be resolved?      | TBD   | Stage 4     | Pending    |
| Q-003       | Should Linear and Jira have feature parity or minimal viable support?        | TBD   | Stage 4     | Pending    |

---

## 8. Requirements Index

| ID        | Title                               | Priority | Implements | Status         |
| --------- | ----------------------------------- | -------- | ---------- | -------------- |
| FR-TM-001 | Unified Task Operations             | Critical | HL-TM-001  | Draft          |
| FR-TM-002 | Local Task Support                  | High     | HL-TM-001  | Draft          |
| FR-TM-003 | Multiple Task Source Registration   | High     | HL-TM-001  | Draft          |
| FR-TM-004 | ~~Task Source Detection~~           | ~~High~~ | HL-TM-001  | **DEPRECATED** |
| FR-TM-005 | GitHub Issues Integration           | High     | HL-TM-001  | Draft          |
| FR-TM-006 | Task Retrieval from External System | Critical | HL-TM-001  | Draft          |
| FR-TM-007 | Task Creation in External System    | High     | HL-TM-001  | Draft          |
| FR-TM-008 | Task Updates in External System     | High     | HL-TM-001  | Draft          |
| FR-TM-009 | Task Search in External System      | Medium   | HL-TM-001  | Draft          |
| FR-TM-010 | Task Comments                       | Medium   | HL-TM-001  | Draft          |
| FR-TM-011 | Task Assignment                     | High     | HL-TM-001  | Draft          |
| FR-TM-012 | Task State Transitions              | High     | HL-TM-001  | Draft          |
| FR-TM-013 | External Task Information Caching   | High     | HL-TM-001  | Draft          |
| FR-TM-014 | Cache Refresh                       | Medium   | HL-TM-001  | Draft          |
| FR-TM-015 | Three-Layer State Model             | High     | HL-TM-001  | Draft          |
| FR-TM-016 | JSON Cache Format                   | High     | HL-TM-001  | Draft          |

---

## 9. Requirements Dependency Graph

```
FR-TM-001 (Unified Task Operations)
    │
    ├── FR-TM-002 (Local Task Support)
    │
    ├── FR-TM-003 (Multiple Task Source Registration)
    │       │
    │       ├── FR-TM-004 (Task Source Detection) [DEPRECATED]
    │       │
    │       └── FR-TM-005 (GitHub Issues Integration)
    │
    └── FR-TM-006 (Task Retrieval from External System)
            │
            ├── FR-TM-007 (Task Creation in External System)
            │
            ├── FR-TM-008 (Task Updates in External System)
            │
            ├── FR-TM-009 (Task Search in External System)
            │
            ├── FR-TM-010 (Task Comments)
            │
            ├── FR-TM-011 (Task Assignment)
            │
            ├── FR-TM-012 (Task State Transitions)
            │
            └── FR-TM-013 (External Task Information Caching)
                    │
                    ├── FR-TM-014 (Cache Refresh)
                    │
                    └── FR-TM-015 (Three-Layer State Model)
                            │
                            └── FR-TM-016 (JSON Cache Format)
```

---

## Document History

| Version | Date       | Author          | Changes                                                                                         |
| ------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-26 | FlowMaster Team | Initial version                                                                                 |
| 1.1     | 2025-11-26 | Claude          | Added FR-TM-014 through FR-TM-016                                                               |
| 2.0     | 2025-11-26 | Claude          | Reorganized for progressive disclosure; renumbered FRs; updated component IDs                   |
| 2.1     | 2025-12-27 | Claude          | DEPRECATED FR-TM-004 (Task Source Detection) - replaced by explicit provider selection via auth |
