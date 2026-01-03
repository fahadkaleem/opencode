# User Interface - Functional Requirements

> **Component ID**: COMP-009
> **Document Version**: 2.1
> **Last Updated**: 2025-11-27
> **Status**: Draft
> **Owner**: FlowMaster Team
> **Related Documents**:
>
> - [Architecture Document](../00-architecture.md)
> - [High-Level Requirements](../../02-high-level-requirements/02-requirements.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the detailed functional requirements for the **User Interface** component. These requirements decompose the high-level requirements assigned to this component into specific, testable specifications.

### 1.2 Component Summary

| Attribute                      | Value                                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Component ID**               | COMP-009                                                                                                                                                                |
| **Responsibility**             | Rendering execution status, handling user input, displaying agent outputs, presenting clarifications, supporting multiple interface modes, providing execution controls |
| **Implements HL Requirements** | HL-UI-001, HL-UI-002, HL-UI-003, HL-UI-004, HL-UI-005, HL-UI-006                                                                                                        |

### 1.3 Requirement ID Convention

All requirements in this document follow the format: **FR-UI-XXX**

| Component      | Prefix | Example   |
| -------------- | ------ | --------- |
| User Interface | FR-UI  | FR-UI-001 |

### 1.4 Priority Levels

| Priority     | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Component cannot function without this. Must be in MVP.          |
| **High**     | Important for component's core responsibility. Should be in MVP. |
| **Medium**   | Valuable but not essential for initial release.                  |
| **Low**      | Nice to have. Future consideration.                              |

### 1.5 Document Organization

> **Note**: FlowMaster follows a **desktop-first** development approach. The Electron desktop application is the primary interface, providing full file system access and native integration. CLI support will be added in a later phase for CI/CD automation and headless execution scenarios.

This document follows progressive disclosure principles, organized from foundational concepts to advanced features:

1. **Foundation** - Architecture and operational modes that underpin everything
2. **Desktop UI** - Visual interface fundamentals (primary interface)
3. **CLI Interface** - Command-line interaction capabilities (future, for automation)
4. **Execution & Control** - Runtime control capabilities
5. **Permissions & Approvals** - Security and human-in-the-loop features
6. **Advanced Features** - Optional and future capabilities

---

## 2. Functional Requirements

### 2.1 Foundation: Architecture & Modes

These foundational requirements establish how the UI operates across different environments and deployment modes.

---

#### FR-UI-001: Dual-Mode Operation Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support dual-mode operation for UI and headless execution so that workflows work with or without interactive UI.

**Acceptance Criteria**:

```gherkin
Scenario: UI mode operation
  Given a user is running in interactive terminal
  When executing a workflow
  Then events should stream via real-time display
  And interactive features should be available

Scenario: Headless mode operation
  Given the system is running in CI/CD environment
  When executing a workflow
  Then events should write to stdout/stderr
  And no interactive prompts should occur

Scenario: Both modes write logs
  Given any execution mode
  When a workflow executes
  Then events should be written to log files
  And logs should be consistent regardless of mode

Scenario: No code changes for mode switch
  Given a workflow definition
  When running in different modes
  Then the same workflow should work in both modes
  And no modifications should be required
```

**Rationale**:
Workflows need to work interactively with UI for development and non-interactively in CI/CD pipelines without modification.

---

#### FR-UI-002: Headless Mode Detection

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-004 |
| **Dependencies** | FR-UI-001 |

**Requirement**:
The system SHALL automatically detect headless mode using CI environment variables and TTY checks so that appropriate output mode is selected.

**Acceptance Criteria**:

```gherkin
Scenario: Detect CI environment
  Given CI environment variable is set
  When the system starts
  Then headless mode should be automatically selected

Scenario: Detect non-TTY stdout
  Given stdout is not a TTY
  When the system starts
  Then headless mode should be automatically selected

Scenario: Detect dumb terminal
  Given TERM is set to "dumb"
  When the system starts
  Then headless mode should be automatically selected

Scenario: Explicit headless flag
  Given --headless flag is provided
  When the system starts
  Then headless mode should be selected regardless of environment
```

**Rationale**:
Automatic detection enables workflows to work correctly in different environments without user configuration.

---

#### FR-UI-003: Human-Friendly Terminal Output

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL provide clear, readable terminal output for developers.

**Acceptance Criteria**:

```gherkin
Scenario: Clear progress indication
  Given a workflow is executing
  When viewing terminal output
  Then progress should be clearly indicated
  And current phase should be identifiable

Scenario: Readable error messages
  Given an error occurs
  When viewing terminal output
  Then the error should be clearly described
  And actionable remediation should be suggested when possible
```

**Rationale**:
Developers use CLI as primary interface. Clear, readable output reduces cognitive load and improves productivity.

---

#### FR-UI-004: Machine-Parseable Output

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL produce structured logs suitable for CI/CD pipelines and automation.

**Acceptance Criteria**:

```gherkin
Scenario: Logs parseable with standard tools
  Given a workflow has executed
  When parsing logs with grep, awk, or jq
  Then the logs should be parseable
  And structured data should be extractable

Scenario: Stderr for progress logs
  Given a workflow is executing
  When progress and status messages are written
  Then they should go to stderr
  And stdout should be reserved for final results
```

**Rationale**:
CI/CD systems and automation tools need structured, parseable output for integration. Separating logs (stderr) from results (stdout) enables standard Unix piping patterns.

---

#### FR-UI-005: Graceful Output Degradation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-004 |
| **Dependencies** | FR-UI-001 |

**Requirement**:
The system SHALL gracefully degrade output formatting in non-TTY environments.

**Acceptance Criteria**:

```gherkin
Scenario: Non-TTY environment handling
  Given the terminal does not support colors
  When output is generated
  Then output should remain readable
  And no color escape codes should corrupt output

Scenario: NO_COLOR environment variable
  Given NO_COLOR environment variable is set
  When output is generated
  Then no colors should be emitted

Scenario: Minimal output mode
  Given a non-interactive environment
  When verbose output is not requested
  Then default output should be concise (less than 50 lines for typical workflow)
```

**Rationale**:
Non-TTY environments don't support colors or interactive features. Graceful degradation ensures functionality.

---

#### FR-UI-006: Local Deployment Mode

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support local deployment mode where CLI serves UI static files and WebSocket server so that users can run UI on single machine.

**Acceptance Criteria**:

```gherkin
Scenario: CLI serves UI
  Given I run "flowmaster ui"
  When the command starts
  Then UI should be served on HTTP port
  And WebSocket server should run on separate port

Scenario: No authentication for localhost
  Given running in local mode
  When connecting from localhost
  Then no authentication should be required

Scenario: Single-user mode
  Given local deployment
  When using the UI
  Then single-user mode should be supported
  And no multi-tenant concerns should apply
```

**Rationale**:
Local-first deployment enables offline usage, privacy, and simplicity for individual developers.

---

#### FR-UI-007: Cloud Deployment Mode

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Low       |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-006 |

**Requirement**:
The system SHALL support cloud deployment mode with authentication, multi-tenant isolation, and horizontal scaling so that system can serve multiple users.

**Acceptance Criteria**:

```gherkin
Scenario: JWT authentication
  Given cloud deployment mode
  When connecting via WebSocket
  Then JWT authentication should be required

Scenario: TLS encryption
  Given cloud deployment
  When data is transmitted
  Then TLS encryption (wss://) should be used

Scenario: Multi-tenant support
  Given multiple users on cloud deployment
  When users connect
  Then connections should be isolated per tenant
  And horizontal scaling should be supported
```

**Rationale**:
Future cloud deployment requires multi-user support with proper security and scalability.

---

#### FR-UI-008: Backend Connection Abstraction

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL abstract backend connection interface so that local and cloud implementations can be swapped without UI code changes.

**Acceptance Criteria**:

```gherkin
Scenario: Define abstraction interface
  Given the UI codebase
  When implementing backend communication
  Then a backend abstraction interface should be defined

Scenario: Local implementation available
  Given local deployment mode
  When connecting to backend
  Then local implementation should be used

Scenario: Swap without UI changes
  Given UI code
  When switching from local to cloud mode
  Then no UI code changes should be required
  And only configuration should change
```

**Rationale**:
Cloud-ready architecture enables future scalability without requiring UI rewrite.

---

#### FR-UI-009: Environment-Based Configuration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-008 |

**Requirement**:
The system SHALL configure deployment mode via environment variables so that same codebase supports both local and cloud deployment.

**Acceptance Criteria**:

```gherkin
Scenario: Configure via environment
  Given environment variables are set
  When the UI starts
  Then deployment mode should be determined by FLOWMASTER_MODE

Scenario: Configure endpoints
  Given environment variables for endpoints
  When connecting to backend
  Then WebSocket and API URLs should use configured values

Scenario: Default to local
  Given no environment configuration
  When the UI starts
  Then local deployment defaults should be used
```

**Rationale**:
Environment-based configuration enables flexible deployment without code changes.

---

#### FR-UI-010: Stateless UI Architecture

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL maintain stateless UI where all workflow and task state resides in backend so that UI can be refreshed without data loss.

**Acceptance Criteria**:

```gherkin
Scenario: Page refresh restores state
  Given a workflow is executing in the UI
  When I refresh the page
  Then the full workflow state should be restored
  And execution should continue without interruption

Scenario: Multiple tabs synchronized
  Given I open the same task in multiple browser tabs
  When state changes in one tab
  Then all tabs should show synchronized view

Scenario: No frontend state persistence
  Given the UI is running
  When inspecting browser storage
  Then no workflow state should be persisted in frontend
  And only UI preferences should be stored locally
```

**Rationale**:
Stateless architecture enables reliability, multi-client support, and prevents state synchronization issues.

---

#### FR-UI-011: Initial State Hydration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-010 |

**Requirement**:
The system SHALL fetch initial state from backend on connection including workflow definition, phase status, and message history so that UI displays current execution state.

**Acceptance Criteria**:

```gherkin
Scenario: Load initial state quickly
  Given I connect to a running workflow
  When the UI initializes
  Then initial state should load within 1 second
  And all phase statuses should be displayed

Scenario: Populate message history
  Given a workflow has been executing with messages
  When I connect to the UI
  Then message history should be populated in chat
  And messages should be in chronological order
```

**Rationale**:
New connections or page refreshes must restore complete state to provide accurate view of workflow execution.

---

### 2.2 CLI Interface (Future - for Automation/CI-CD)

These requirements define command-line interaction capabilities for future implementation. CLI will be added after the desktop application to support CI/CD pipelines and headless automation scenarios.

---

#### FR-UI-012: Command Hierarchy Structure

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL provide a three-level command hierarchy using noun-verb-arguments format so that commands are organized and predictable.

**Acceptance Criteria**:

```gherkin
Scenario: Commands follow noun-verb pattern
  Given a user wants to execute a workflow
  When they use the CLI
  Then commands should follow the pattern "flowmaster <noun> <verb> [arguments]"
  And command structure should support grouping by domain

Scenario: Command structure is documented
  Given a user runs help
  When the help output is displayed
  Then the command hierarchy should be clearly documented
  And subcommands should be organized under parent nouns

Scenario: Consistent organization
  Given a user is familiar with one command group
  When they explore other command groups
  Then the structure should be consistent and predictable
```

**Rationale**:
Consistent command structure improves discoverability and reduces learning curve for users.

---

#### FR-UI-013: CLI Commands for All Hierarchy Levels

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-012 |

**Requirement**:
The system SHALL provide CLI commands for executing workflows and individual commands.

**Acceptance Criteria**:

```gherkin
Scenario: Execute workflow
  Given a workflow named "implement" exists
  When I run "flowmaster workflow run implement --task TASK-123"
  Then the workflow should execute all phases

Scenario: Execute composed workflow
  Given a workflow named "full-sdlc" exists with uses: references to other workflows
  When I run "flowmaster workflow run full-sdlc --task TASK-123"
  Then the workflow should execute all referenced workflows

Scenario: Execute command
  Given a command named "plan" exists
  When I run "flowmaster command run plan --task TASK-123"
  Then the individual command should execute

Scenario: All commands support task ID
  Given any execution command
  When I run without --task flag
  Then an error should indicate task ID is required
```

**Rationale**:
Users need CLI access to all hierarchy levels for testing, debugging, and execution flexibility.

---

#### FR-UI-014: Workflow Execution Command

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-012 |

**Requirement**:
The system SHALL execute multi-step workflows by name with task identifier when requested.

**Acceptance Criteria**:

```gherkin
Scenario: Execute workflow by name
  Given a workflow named "plan-implement" exists
  And a task ID "TASK-123" is provided
  When I run "flowmaster workflow run plan-implement --task TASK-123"
  Then the workflow definition should be loaded
  And all workflow phases should execute in sequence
  And execution progress should be displayed

Scenario: Missing task ID
  Given a workflow named "plan-implement" exists
  When I run "flowmaster workflow run plan-implement" without task ID
  Then an error should be displayed indicating task ID is required

Scenario: Non-existent workflow
  Given no workflow named "unknown" exists
  When I run "flowmaster workflow run unknown --task TASK-123"
  Then an error should be displayed indicating workflow not found
```

**Rationale**:
Workflow execution is the primary use case for the system.

---

#### FR-UI-015: Individual Command Execution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-012 |

**Requirement**:
The system SHALL execute individual commands by name with task identifier when requested.

**Acceptance Criteria**:

```gherkin
Scenario: Execute command by name
  Given a command definition named "plan" exists
  And a task ID "TASK-123" is provided
  When I run "flowmaster command run plan --task TASK-123"
  Then the command definition should be loaded
  And the command should execute with context
  And execution results should be displayed

Scenario: Command not found
  Given no command definition named "unknown" exists
  When I run "flowmaster command run unknown --task TASK-123"
  Then an error should be displayed indicating command not found
```

**Rationale**:
Users need ability to run single commands without full workflow for testing and ad-hoc execution.

---

#### FR-UI-016: Help Documentation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-012 |

**Requirement**:
The system SHALL provide help documentation for all commands when requested.

**Acceptance Criteria**:

```gherkin
Scenario: Command has help text
  Given any CLI command
  When I run the command with --help flag
  Then help text should be displayed
  And usage syntax should be shown
  And parameter descriptions should be included
  And examples should be provided

Scenario: Global help
  Given the CLI is installed
  When I run "flowmaster --help"
  Then all available command groups should be listed
  And brief descriptions should be provided for each
```

**Rationale**:
Users need reference documentation for command usage.

---

#### FR-UI-017: Project Initialization

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL initialize configuration in project directory when requested so that users can set up new projects.

**Acceptance Criteria**:

```gherkin
Scenario: Initialize new project
  Given a project directory without FlowMaster configuration
  When I run "flowmaster init"
  Then configuration directory structure should be created
  And default configuration files should be generated

Scenario: Prompt for initial settings
  Given I am initializing a new project
  When the init command runs
  Then I should be prompted for initial settings
  And values should be validated before saving

Scenario: Confirm successful initialization
  Given initialization completes successfully
  When the command finishes
  Then a success message should be displayed
  And next steps should be suggested
```

**Rationale**:
Users need guided setup for new projects.

---

#### FR-UI-018: Workflow Listing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL list all available workflow definitions so that users can discover and select workflows.

**Acceptance Criteria**:

```gherkin
Scenario: List available workflows
  Given workflow definitions exist in the workflows directory
  When I run "flowmaster workflow list"
  Then all valid workflow names should be displayed
  And the list should exclude invalid or corrupted workflows

Scenario: Fast listing without validation
  Given a large number of workflow files exist
  When I run "flowmaster workflow list"
  Then the list should return quickly without full validation
  And only basic file enumeration should occur

Scenario: Empty workflow directory
  Given no workflow definitions exist
  When I run "flowmaster workflow list"
  Then a message should indicate no workflows are available
```

**Rationale**:
Workflow listing enables discovery and selection without needing to remember exact names.

---

#### FR-UI-019: Workflow Details Display

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-018 |

**Requirement**:
The system SHALL display workflow details including phases and commands when requested so that users can understand workflow structure.

**Acceptance Criteria**:

```gherkin
Scenario: Display workflow metadata
  Given a workflow named "plan-implement" exists
  When I run "flowmaster workflow show plan-implement"
  Then workflow name and description should be displayed
  And all phases should be listed in order

Scenario: Display phase details
  Given a workflow with multiple phases exists
  When I view workflow details
  Then each phase command should be shown
  And dependencies between phases should be indicated

Scenario: Format output for readability
  Given a complex workflow definition
  When I view workflow details
  Then the output should be formatted for human readability
```

**Rationale**:
Users need to understand workflow structure before execution.

---

#### FR-UI-020: Workflow Validation Command

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-018 |

**Requirement**:
The system SHALL validate workflow definitions when requested so that errors are caught before execution.

**Acceptance Criteria**:

```gherkin
Scenario: Validate workflow syntax
  Given a workflow definition file exists
  When I run "flowmaster workflow validate plan-implement"
  Then the system should parse the workflow definition
  And validate syntax against schema

Scenario: Validate command references
  Given a workflow references commands "plan" and "implement"
  When I validate the workflow
  Then the system should verify referenced commands exist
  And report any missing command definitions

Scenario: Validate dependency references
  Given a workflow has phase dependencies
  When I validate the workflow
  Then the system should validate all dependency references
  And detect circular dependencies

Scenario: Report specific validation errors
  Given a workflow has multiple validation errors
  When I validate the workflow
  Then specific errors should be reported with locations
  And suggestions for fixing should be provided where possible

Scenario: Valid workflow confirmation
  Given a workflow with no errors
  When I validate the workflow
  Then a success message should confirm validity
```

**Rationale**:
Early validation prevents wasted time and confusing runtime errors.

---

#### FR-UI-021: Command Listing with Namespace Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL list available commands with optional namespace filtering so that users can discover commands.

**Acceptance Criteria**:

```gherkin
Scenario: List all commands
  Given command definitions exist in multiple namespaces
  When I run "flowmaster command list"
  Then all command names should be displayed
  And namespaces should be indicated

Scenario: Filter by namespace
  Given commands exist in "alfred" and "custom" namespaces
  When I run "flowmaster command list --namespace alfred"
  Then only commands in the "alfred" namespace should be displayed

Scenario: Display command metadata
  Given commands with descriptions exist
  When I list commands
  Then command descriptions should be shown
  And output should be formatted for readability
```

**Rationale**:
Users need to discover available commands and understand organization.

---

#### FR-UI-022: Command Definition Display

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-021 |

**Requirement**:
The system SHALL display command definition content when requested so that users understand command purpose.

**Acceptance Criteria**:

```gherkin
Scenario: Display command definition
  Given a command definition named "plan" exists
  When I run "flowmaster command show plan"
  Then the command content should be displayed
  And command metadata should be shown

Scenario: Show command metadata
  Given a command with description and context requirements
  When I view the command
  Then the description should be displayed
  And required context items should be listed

Scenario: Command not found
  Given no command named "unknown" exists
  When I run "flowmaster command show unknown"
  Then an error should indicate the command was not found
```

**Rationale**:
Users need to understand what a command does before executing it.

---

#### FR-UI-023: Custom Command Arguments

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-001 |
| **Dependencies** | FR-UI-015 |

**Requirement**:
The system SHALL accept custom key-value arguments for command execution so that commands can be parameterized.

**Acceptance Criteria**:

```gherkin
Scenario: Pass custom arguments
  Given a command definition with context requirements
  When I run "flowmaster command run plan --task TASK-123 --arg key1=value1 --arg key2=value2"
  Then the arguments should be available in command context
  And arguments should be included in the context block

Scenario: Arguments override defaults
  Given a command with default context values
  When I provide custom arguments
  Then custom values should override defaults

Scenario: Invalid argument format
  Given an incorrectly formatted argument
  When I run the command
  Then a clear error message should indicate the correct format
```

**Rationale**:
Commands need runtime parameterization for different scenarios.

---

#### FR-UI-024: AI Model Selection

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL allow selection of different AI models for workflow and command execution so that users can make performance and cost tradeoffs.

**Acceptance Criteria**:

```gherkin
Scenario: Specify model via flag
  Given multiple AI models are available
  When I run "flowmaster workflow run plan --task TASK-123 --model sonnet"
  Then the specified model should be used for execution

Scenario: Validate model availability
  Given an unavailable model is specified
  When I run the command
  Then an error should indicate the model is not available
  And available models should be listed

Scenario: Document available models
  Given I run help for a command
  When viewing model options
  Then available models should be documented
  And their characteristics should be described
```

**Rationale**:
Different tasks require different model capabilities and cost profiles.

---

#### FR-UI-025: JSON Output Format

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL output results in JSON format when requested so that output is machine-parseable.

**Acceptance Criteria**:

```gherkin
Scenario: JSON output flag
  Given any command that produces output
  When I run the command with --json flag
  Then output should be valid JSON
  And JSON should include all relevant data fields

Scenario: JSON structure is consistent
  Given multiple commands with --json flag
  When comparing their output structures
  Then common fields should have consistent naming
  And the structure should be documented

Scenario: Errors in JSON format
  Given a command that fails
  When I run with --json flag
  Then the error should also be formatted as JSON
  And should include error code and message
```

**Rationale**:
Automation tools need structured, parseable output for CI/CD integration.

---

#### FR-UI-026: Color Output Control

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Low       |
| **Implements**   | HL-UI-004 |
| **Dependencies** | FR-UI-003 |

**Requirement**:
The system SHALL support disabling color output via --no-color flag and NO_COLOR environment variable so that output is compatible with all terminals and logging systems.

**Acceptance Criteria**:

```gherkin
Scenario: Disable color via CLI flag
  Given a command that produces colored output
  When I run with --no-color flag
  Then output should contain no ANSI color codes

Scenario: Disable color via environment variable
  Given NO_COLOR environment variable is set
  When I run any command
  Then output should contain no ANSI color codes
  And the flag value does not matter (presence is sufficient)

Scenario: Color enabled by default in TTY
  Given output is to a TTY terminal
  And NO_COLOR is not set
  When I run a command
  Then output should include colors

Scenario: Color disabled in non-TTY by default
  Given output is piped or redirected
  When I run a command
  Then output should not include colors by default

Scenario: Force color in non-TTY
  Given output is piped
  When I run with --color flag
  Then output should include ANSI color codes
```

**Rationale**:
Respecting NO_COLOR and providing --no-color ensures compatibility with CI systems, log aggregators, and accessibility tools.

---

### 2.3 Desktop UI (Primary Interface)

These requirements define the visual interface fundamentals for the Electron desktop application, which is the primary interface for FlowMaster.

---

#### FR-UI-027: Two-Panel Layout

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL provide two-panel layout with chat interface and workflow visualization so that users can monitor both execution details and workflow structure.

**Acceptance Criteria**:

```gherkin
Scenario: Display both panels
  Given the desktop UI is open
  When viewing a workflow
  Then both chat and visualization panels should be visible
  And default widths should be approximately 40%/60%

Scenario: Adjustable panel widths
  Given the two-panel layout is displayed
  When I drag the divider
  Then panel widths should adjust accordingly
  And the adjustment should persist

Scenario: Responsive to window size
  Given the UI is displayed
  When I resize the window
  Then the layout should adapt responsively
```

**Rationale**:
Dual-view enables comprehensive workflow monitoring by showing both high-level structure and detailed logs.

---

#### FR-UI-028: Contextual Header

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL display header with task ID, workflow name, status badge, and settings so that users can identify current execution context.

**Acceptance Criteria**:

```gherkin
Scenario: Display task context
  Given I am viewing a task execution
  When looking at the header
  Then task ID and workflow name should be visible
  And current status should be shown as a badge

Scenario: Status badge updates
  Given a workflow is executing
  When status changes
  Then the status badge should update in real-time

Scenario: Access settings from header
  Given the header is displayed
  When I click settings
  Then settings should be accessible
```

**Rationale**:
Context awareness essential for multi-task monitoring and navigation.

---

#### FR-UI-029: Web UI Launch

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL launch web-based interface for workflow management when requested so that users have an alternative to CLI.

**Acceptance Criteria**:

```gherkin
Scenario: Launch web UI
  Given FlowMaster is installed
  When I run "flowmaster ui"
  Then a web server should start
  And the interface should open in the default browser

Scenario: Specify port
  Given the default port is in use
  When I run "flowmaster ui --port 3001"
  Then the UI should start on port 3001
  And a message should confirm the URL

Scenario: Handle port conflicts
  Given the specified port is in use
  When I launch the UI
  Then a clear error should indicate the conflict
  And an alternative port should be suggested
```

**Rationale**:
Web interface provides richer visualization and interaction.

---

#### FR-UI-030: Real-Time Workflow Graph Display

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL provide real-time graphical representation of workflow execution showing sequential phases, parallel execution, conditional branching, and iteration loops so that users can understand workflow structure and progress at a glance.

**Acceptance Criteria**:

```gherkin
Scenario: Display workflow graph
  Given a workflow with multiple phases
  When the workflow visualization is rendered
  Then all phase types should be displayed (sequential, parallel, conditional)
  And the graph should show connections between phases

Scenario: Real-time updates
  Given a workflow is executing
  When a phase completes
  Then the graph should update within 1 second
  And the completed phase should show success indicator

Scenario: Different phase types visually distinct
  Given a workflow with sequential and parallel phases
  When the graph is rendered
  Then sequential phases should be visually distinct from parallel blocks
```

**Rationale**:
Core visualization capability for workflow monitoring enables users to understand complex workflows visually.

---

#### FR-UI-031: Phase Status Visualization

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL display workflow phases with status indicators for pending, running, completed, failed, and skipped states so that users can track execution progress.

**Acceptance Criteria**:

```gherkin
Scenario: Pending phase indicator
  Given a workflow phase that has not started
  When the graph is rendered
  Then the phase should show pending status indicator

Scenario: Running phase indicator
  Given a workflow phase that is executing
  When the graph is rendered
  Then the phase should show running status indicator
  And the status should update within 1 second of state change

Scenario: Completed phase indicator
  Given a workflow phase that has completed successfully
  When the graph is rendered
  Then the phase should show completed status indicator

Scenario: Failed phase indicator
  Given a workflow phase that has failed
  When the graph is rendered
  Then the phase should show failed status indicator
  And error information should be accessible
```

**Rationale**:
Users need to understand which phases are executing and their outcomes to monitor workflow health.

---

#### FR-UI-032: Sequential Phase Visualization

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL visualize sequential workflow phases as connected nodes so that users can understand execution order.

**Acceptance Criteria**:

```gherkin
Scenario: Sequential phases displayed as chain
  Given a workflow with phases A -> B -> C
  When the graph is rendered
  Then phases should be displayed in a connected chain
  And connections should show execution flow direction
  And phase names should be visible on nodes

Scenario: Execution order clear
  Given a sequential workflow
  When viewing the graph
  Then it should be immediately clear which phase executes first
  And which executes last
```

**Rationale**:
Sequential execution is primary workflow pattern and must be clearly visualized.

---

#### FR-UI-033: Parallel Execution Visualization

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL visualize parallel execution blocks with multiple simultaneous branches so that users can identify concurrent operations.

**Acceptance Criteria**:

```gherkin
Scenario: Parallel block displayed
  Given a workflow with parallel phases [A, B, C]
  When the graph is rendered
  Then A, B, C should be displayed as parallel branches
  And branches should be clearly grouped as a parallel set

Scenario: Concurrent execution indicated
  Given parallel phases are executing
  When viewing the graph
  Then multiple running indicators should be visible
  And it should be clear they run concurrently
```

**Rationale**:
Parallel execution requires distinct visual representation to communicate concurrency.

---

#### FR-UI-034: Interactive Graph Navigation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL support interactive workflow graph navigation including pan, zoom, and fit-to-view capabilities so that users can explore complex workflows.

**Acceptance Criteria**:

```gherkin
Scenario: Pan graph
  Given a large workflow graph
  When I drag with mouse
  Then the graph should pan in the direction of drag

Scenario: Zoom graph
  Given a workflow graph displayed
  When I use mouse wheel or pinch gesture
  Then the graph should zoom in or out

Scenario: Fit to view
  Given a workflow graph
  When I click fit-to-view button
  Then the entire graph should be centered and scaled to fit

Scenario: Keyboard navigation
  Given a workflow graph
  When I use arrow keys
  Then the graph should pan
  And +/- keys should zoom
```

**Rationale**:
Complex workflows with many phases require navigation controls for effective exploration.

---

#### FR-UI-035: Dependency Edge Visualization

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL display dependencies between workflow phases using connecting edges so that users understand phase relationships.

**Acceptance Criteria**:

```gherkin
Scenario: Display dependency edges
  Given a workflow with phase dependencies
  When the graph is rendered
  Then dependencies should be shown as directed edges between nodes
  And edge direction should indicate dependency flow

Scenario: Distinguish dependency types
  Given different types of dependencies exist
  When viewing the graph
  Then edge styling should distinguish dependency types
  And a legend should explain the styling
```

**Rationale**:
Dependencies between phases must be visualized to understand workflow structure and execution constraints.

---

#### FR-UI-036: Conditional Execution Visualization

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL visualize conditional execution branches so that users can understand decision points in workflows.

**Acceptance Criteria**:

```gherkin
Scenario: Display conditional branches
  Given a workflow with conditional phases
  When the graph is rendered
  Then conditional branches should display with decision nodes
  And branches should be labeled with conditions

Scenario: Indicate taken path during execution
  Given a workflow with conditionals is executing
  When a condition is evaluated
  Then the taken path should be visually indicated
  And the not-taken path should be distinguished
```

**Rationale**:
Conditional logic requires clear visualization of decision points and branch outcomes.

---

#### FR-UI-037: Phase-Chat Synchronization

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Medium               |
| **Implements**   | HL-UI-002            |
| **Dependencies** | FR-UI-030, FR-UI-039 |

**Requirement**:
The system SHALL provide clickable workflow nodes that synchronize with chat interface so that users can navigate to specific phase messages.

**Acceptance Criteria**:

```gherkin
Scenario: Click node to scroll chat
  Given a workflow visualization and chat interface are displayed
  When I click on a phase node in the graph
  Then the chat should scroll to messages from that phase
  And the phase messages should be highlighted

Scenario: Visual highlight on selection
  Given a phase node is clicked
  When the selection is active
  Then the node should display a visual highlight
  And related chat messages should be distinguished
```

**Rationale**:
Enables correlation between visual workflow representation and detailed execution logs.

---

#### FR-UI-038: Phase Detail Tooltips

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL display detailed phase information on hover including phase name, command, duration, session ID, and output file path so that users can inspect phase details without navigation.

**Acceptance Criteria**:

```gherkin
Scenario: Tooltip on hover
  Given a workflow graph with completed phases
  When I hover over a phase node
  Then a tooltip should appear within 200ms
  And the tooltip should display all metadata

Scenario: Tooltip content
  Given a completed phase with metadata
  When viewing the tooltip
  Then phase name, command, and duration should be shown
  And session ID and output path should be accessible
```

**Rationale**:
Quick access to phase metadata improves workflow understanding without requiring navigation away from graph.

---

#### FR-UI-039: AI Agent Activity Display

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-003 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL display AI agent activity in chat-style interface showing tool usage, thinking blocks, and execution progress so that users can monitor detailed execution behavior.

**Acceptance Criteria**:

```gherkin
Scenario: Phase messages displayed
  Given a workflow phase starts
  When the chat interface is active
  Then a phase start message should appear
  And phase completion should show a message

Scenario: Tool usage displayed
  Given an agent uses a tool
  When the chat interface is active
  Then tool name and parameters should be displayed
  And tool status should be shown

Scenario: Assistant messages displayed
  Given an agent produces output
  When the chat interface is active
  Then assistant messages should be displayed
  And thinking blocks should be shown when available

Scenario: Chronological order
  Given multiple events occur
  When viewing the chat
  Then messages should appear in chronological order
```

**Rationale**:
Users need detailed visibility into AI agent actions during workflow execution to understand and debug behavior.

---

#### FR-UI-040: Tool Execution Display

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-003 |
| **Dependencies** | FR-UI-039 |

**Requirement**:
The system SHALL display tool execution with parameters, status (pending/completed/error), and results so that users understand tool usage patterns.

**Acceptance Criteria**:

```gherkin
Scenario: Tool invocation shown
  Given an agent invokes a tool
  When viewing the chat
  Then tool name should be displayed
  And tool parameters should be shown in readable format

Scenario: Tool status updates
  Given a tool is invoked
  When the tool completes
  Then status should update from pending to completed
  And results should be displayed

Scenario: Failed tool clearly indicated
  Given a tool execution fails
  When viewing the chat
  Then the failure should be clearly indicated
  And error details should be accessible
```

**Rationale**:
Tool usage is central to AI agent behavior; users need visibility into what tools are being used and their outcomes.

---

#### FR-UI-041: Auto-Scroll Message Feed

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-003 |
| **Dependencies** | FR-UI-039 |

**Requirement**:
The system SHALL support auto-scroll behavior that follows new messages with option to disable when user scrolls up so that users can review history without losing position.

**Acceptance Criteria**:

```gherkin
Scenario: Auto-scroll on new messages
  Given the chat is at the bottom
  When new messages arrive
  Then the chat should auto-scroll to show new messages

Scenario: Disable auto-scroll when scrolling up
  Given the chat is receiving messages
  When I scroll up to review history
  Then auto-scroll should disable
  And new messages should not move my view

Scenario: New messages indicator
  Given auto-scroll is disabled
  When new messages arrive
  Then a "new messages" indicator should appear

Scenario: Re-enable auto-scroll
  Given auto-scroll is disabled
  When I click the new messages indicator
  Then I should jump to the bottom
  And auto-scroll should re-enable
```

**Rationale**:
Balance between staying current with execution and reviewing historical messages improves usability.

---

#### FR-UI-042: Phase-Based Message Filtering

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-003 |
| **Dependencies** | FR-UI-039 |

**Requirement**:
The system SHALL filter chat messages by phase selection so that users can focus on specific phase execution.

**Acceptance Criteria**:

```gherkin
Scenario: Filter by phase
  Given a workflow with phases A, B, C has executed
  When I select phase B in the filter
  Then only messages from phase B should be displayed

Scenario: Clear filters
  Given messages are filtered
  When I click "clear all filters"
  Then all messages should be displayed again
```

**Rationale**:
Large workflows generate many messages; filtering helps focus on specific phases of interest.

---

#### FR-UI-043: Theme Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support light and dark themes with system preference detection so that users can customize visual appearance.

**Acceptance Criteria**:

```gherkin
Scenario: Light theme available
  Given the UI is open
  When I select light theme
  Then the interface should display in light colors

Scenario: Dark theme available
  Given the UI is open
  When I select dark theme
  Then the interface should display in dark colors

Scenario: Auto-detect system preference
  Given the system preference is dark mode
  When I first open the UI
  Then dark theme should be automatically selected

Scenario: Theme toggle accessible
  Given the UI is displayed
  When I look for theme settings
  Then a theme toggle should be easily accessible
```

**Rationale**:
Theme support improves accessibility and accommodates user visual preferences and environmental lighting.

---

#### FR-UI-044: Responsive Multi-Device Design

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-027 |

**Requirement**:
The system SHALL provide responsive design supporting desktop, tablet, and mobile devices so that users can monitor workflows on any device.

**Acceptance Criteria**:

```gherkin
Scenario: Desktop layout
  Given a screen width of 1024px or more
  When viewing the UI
  Then full two-panel layout should be displayed

Scenario: Tablet layout
  Given a screen width between 768px and 1023px
  When viewing the UI
  Then a condensed two-panel layout should be used

Scenario: Mobile layout
  Given a screen width less than 768px
  When viewing the UI
  Then a tabbed interface with swipe navigation should be used
```

**Rationale**:
Modern applications require multi-device support for users working across different contexts.

---

#### FR-UI-045: Event Notifications

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL display notifications for workflow errors and critical events so that users are alerted to important state changes.

**Acceptance Criteria**:

```gherkin
Scenario: Toast notification for errors
  Given a workflow encounters an error
  When the error occurs
  Then a toast notification should appear
  And the notification should be clearly marked as an error

Scenario: Notification types
  Given different event types occur
  When notifications are shown
  Then types should be distinguished (info, success, warning, error)

Scenario: Dismissible notifications
  Given a notification is displayed
  When I click dismiss
  Then the notification should close
  And notification duration should be configurable
```

**Rationale**:
Users need alerts for failures and important events to respond quickly to issues.

---

#### FR-UI-046: UI Preferences Persistence

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL persist UI preferences including theme and layout settings in browser local storage so that user preferences survive page refreshes.

**Acceptance Criteria**:

```gherkin
Scenario: Persist theme selection
  Given I select dark theme
  When I refresh the page
  Then dark theme should still be selected

Scenario: Persist panel adjustments
  Given I adjust panel widths
  When I refresh the page
  Then panel widths should be restored

Scenario: Restore preferences on load
  Given preferences are stored
  When I open the UI
  Then all preferences should be applied immediately
```

**Rationale**:
UI customization should persist across sessions for better user experience.

---

### 2.4 Execution & Control

These requirements define runtime control capabilities.

---

#### FR-UI-047: Workflow Execution Controls

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-005 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL provide interactive controls for workflow execution including pause, resume, and cancel operations so that users can control running workflows.

**Acceptance Criteria**:

```gherkin
Scenario: Pause workflow
  Given a workflow is executing
  When I click the pause button
  Then the workflow should stop at the next phase boundary
  And status should show "paused"

Scenario: Resume paused workflow
  Given a workflow is paused
  When I click the resume button
  Then the workflow should continue from where it paused

Scenario: Cancel workflow
  Given a workflow is executing
  When I click the cancel button
  Then the workflow should terminate
  And all child processes should be cleaned up

Scenario: Control state reflects workflow status
  Given a workflow is executing
  When the workflow pauses
  Then the pause button should be disabled
  And the resume button should be enabled
```

**Rationale**:
Interactive controls enable users to manage long-running workflows and respond to issues.

---

#### FR-UI-048: Inter-Process Command Channel

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-005 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL communicate execution commands through inter-process channels for triggering workflows, loading definitions, and managing configuration so that UI can control backend operations.

**Acceptance Criteria**:

```gherkin
Scenario: Trigger workflow via IPC
  Given the UI is running
  When I trigger workflow execution
  Then the command should be sent via IPC to backend
  And the workflow should start executing

Scenario: Load workflow definitions via IPC
  Given the UI is running
  When I request workflow list
  Then definitions should be loaded via IPC
  And the list should be displayed

Scenario: Configuration via IPC
  Given the UI is running
  When I read or write configuration
  Then changes should propagate via IPC
```

**Rationale**:
Desktop application requires secure, type-safe communication between UI process and main process.

---

#### FR-UI-049: Real-Time Event Streaming

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-048 |

**Requirement**:
The system SHALL stream execution events in real-time to UI including workflow lifecycle, phase transitions, and tool usage so that UI stays synchronized with execution state.

**Acceptance Criteria**:

```gherkin
Scenario: Sub-second event latency
  Given a workflow is executing
  When an event occurs in the backend
  Then the event should appear in UI within 1 second

Scenario: All event types streamed
  Given event streaming is active
  When workflow, phase, tool, and message events occur
  Then all event types should be received by UI

Scenario: Events in order
  Given multiple events occur rapidly
  When events are received by UI
  Then they should be delivered in order

Scenario: Immediate UI update
  Given an event is received
  When processing the event
  Then the UI should update immediately
```

**Rationale**:
Real-time event streaming enables live monitoring of workflow execution in desktop UI.

---

#### FR-UI-050: Task Execution History

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-005 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL display execution history for tasks showing previous runs and their outcomes so that users can review historical executions.

**Acceptance Criteria**:

```gherkin
Scenario: View execution history
  Given a task has been executed multiple times
  When I view the task history
  Then a list of executions should be displayed
  And each entry should show timestamp, status, and duration

Scenario: View historical execution details
  Given execution history is displayed
  When I select a historical execution
  Then I should see detailed information about that execution
```

**Rationale**:
Historical view helps users understand task behavior over time and debug recurring issues.

---

### 2.5 Permissions & Approvals

These requirements define security and human-in-the-loop features.

---

#### FR-UI-051: File Operation Permission Dialogs

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-005 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL prompt for user approval before file write operations so that users can review and authorize file modifications.

**Acceptance Criteria**:

```gherkin
Scenario: Prompt before file write
  Given an agent requests a file write
  When the operation is triggered
  Then a dialog should appear before execution
  And file path and operation type should be displayed

Scenario: User can approve or deny
  Given a permission dialog is displayed
  When I click approve
  Then the operation should proceed
  And when I click deny
  Then the operation should not execute
```

**Rationale**:
User approval for file operations prevents unintended or malicious file modifications.

---

#### FR-UI-052: File Deletion Permission Dialogs

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-051 |

**Requirement**:
The system SHALL prompt for user approval before file delete operations so that users can prevent unintended data loss.

**Acceptance Criteria**:

```gherkin
Scenario: Prompt before file deletion
  Given an agent requests a file deletion
  When the operation is triggered
  Then a dialog should appear with a warning
  And file path should be clearly displayed

Scenario: Deny prevents deletion
  Given a deletion permission dialog is displayed
  When I click deny
  Then the file should not be deleted
```

**Rationale**:
Deletion requires explicit approval to prevent accidental data loss.

---

#### FR-UI-053: Command Execution Permission Dialogs

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-051 |

**Requirement**:
The system SHALL prompt for user approval before executing system commands so that users can review potentially dangerous operations.

**Acceptance Criteria**:

```gherkin
Scenario: Prompt before command execution
  Given an agent requests system command execution
  When the operation is triggered
  Then a dialog should appear
  And command and arguments should be displayed

Scenario: Deny prevents execution
  Given a command permission dialog is displayed
  When I click deny
  Then the command should not execute
```

**Rationale**:
Command execution approval prevents execution of malicious or unintended system commands.

---

#### FR-UI-054: Permission Decision Caching

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Priority**     | Medium                          |
| **Implements**   | HL-UI-005                       |
| **Dependencies** | FR-UI-051, FR-UI-052, FR-UI-053 |

**Requirement**:
The system SHALL cache permission decisions when requested by user so that repeated operations do not require repeated approvals.

**Acceptance Criteria**:

```gherkin
Scenario: Remember decision option
  Given a permission dialog is displayed
  When I approve with "Remember this decision" checked
  Then subsequent identical operations should not prompt

Scenario: Cached decisions apply to identical operations
  Given a decision has been cached
  When the same operation is requested
  Then it should proceed without prompting

Scenario: Clear cached permissions
  Given cached permissions exist
  When I clear permissions
  Then all cached decisions should be removed
```

**Rationale**:
Caching reduces approval fatigue for trusted, repeated operations while maintaining security.

---

#### FR-UI-055: Human-in-Loop Approvals

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-005 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support optional human-in-loop approvals for critical decisions so that users can maintain control over important workflow steps.

**Acceptance Criteria**:

```gherkin
Scenario: Define approval points
  Given a workflow definition
  When I configure an approval point
  Then the workflow should pause at that point

Scenario: Present decision context
  Given workflow reaches an approval point
  When the UI presents the decision
  Then relevant context should be displayed
  And user can approve or reject

Scenario: Rejection triggers fallback
  Given an approval is rejected
  When configurable fallback exists
  Then the fallback behavior should be triggered
```

**Rationale**:
Some decisions may require human approval. Optional human-in-loop provides safety valve without sacrificing automation benefits.

---

#### FR-UI-056: Agent Clarification Display

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-039 |

**Requirement**:
The system SHALL display agent clarification requests and collect user responses through the UI so that agents can get human input when needed.

**Acceptance Criteria**:

```gherkin
Scenario: Display clarification request
  Given an agent requests clarification
  When the request reaches the UI
  Then the question should be displayed in the chat interface
  And the workflow should indicate it's waiting

Scenario: Collect and route response
  Given a clarification question is displayed
  When I provide a response
  Then the response should be sent to the requesting agent
  And execution should resume

Scenario: Log communication
  Given clarification communication occurs
  When reviewing the execution
  Then all clarification exchanges should be logged
```

**Rationale**:
Agents may need guidance during execution. UI must support this communication for effective human-agent collaboration.

---

#### FR-UI-057: Human Approval Gates

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-055 |

**Requirement**:
The system SHALL support human approval gates at stage boundaries requiring user confirmation before proceeding so that critical transitions are controlled.

**Acceptance Criteria**:

```gherkin
Scenario: Configure approval gate
  Given a workflow stage definition
  When I set approval_required to true
  Then the stage should require approval before proceeding

Scenario: Display artifacts for review
  Given an approval gate is reached
  When the UI presents the gate
  Then relevant artifacts should be displayed for review
  And user can approve, reject, or request refinement

Scenario: Log approval decisions
  Given an approval decision is made
  When the decision is recorded
  Then it should be logged in workflow state
```

**Rationale**:
Critical workflow stages may require human review before proceeding, especially for production deployments or important decisions.

---

#### FR-UI-058: Approval Review Checklist Display

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-057 |

**Requirement**:
The system SHALL display a structured review checklist alongside artifacts when presenting approval gates so that reviewers can systematically verify requirements before approving.

**Acceptance Criteria**:

```gherkin
Scenario: Display review checklist
  Given an approval gate with configured checklist items
  When the approval UI is displayed
  Then the checklist should appear alongside artifacts
  And each item should be individually checkable

Scenario: Track checklist completion
  Given a review checklist with 5 items
  When I check 3 items
  Then the UI should show 3/5 items completed
  And the approve button should indicate incomplete review

Scenario: Require checklist completion for approval
  Given a phase requires full checklist completion
  When checklist is incomplete
  Then the approve button should be disabled
  And a message should indicate remaining items

Scenario: Checklist items from workflow definition
  Given a workflow with custom checklist items defined
  When the approval gate is reached
  Then the custom checklist items should be displayed
```

**Rationale**:
Review checklists ensure systematic verification and reduce the risk of overlooking important considerations during approval.

---

#### FR-UI-059: Maximum Refinement Attempts

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-057 |

**Requirement**:
The system SHALL enforce a configurable maximum number of refinement attempts before requiring approval or denial so that refinement loops do not continue indefinitely.

**Acceptance Criteria**:

```gherkin
Scenario: Track refinement attempts
  Given an approval gate with maxRefinements: 3
  When the user requests refinement
  Then the refinement count should increment
  And the UI should show "Refinement 1 of 3"

Scenario: Enforce maximum refinements
  Given 3 refinements have been used (maxRefinements: 3)
  When viewing the approval gate
  Then the "Request Refinement" option should be disabled
  And only "Approve" or "Deny" should be available

Scenario: Reset refinements on approval
  Given refinements have been used
  When the phase is approved and re-executed
  Then the refinement count should reset to 0

Scenario: Configure max refinements per phase
  Given a workflow phase definition
  When I set maxRefinements: 5
  Then that phase should allow up to 5 refinement attempts
```

**Rationale**:
Maximum refinement limits prevent infinite loops and force decisions when refinement is not improving results.

---

#### FR-UI-060: Approval Timeout with Countdown

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-057 |

**Requirement**:
The system SHALL support configurable approval timeouts with visual countdown so that workflows do not block indefinitely waiting for human approval.

**Acceptance Criteria**:

```gherkin
Scenario: Display approval countdown
  Given an approval gate with timeout: 300 (seconds)
  When the approval gate is reached
  Then a countdown timer should be displayed
  And the remaining time should update in real-time

Scenario: Timeout triggers default action
  Given an approval gate with timeout and defaultAction: "approve"
  When the timeout expires without user action
  Then the default action (approve) should be taken automatically
  And the workflow should continue

Scenario: Timeout with deny default
  Given an approval gate with timeout and defaultAction: "deny"
  When the timeout expires
  Then the phase should be denied
  And the workflow should fail or follow failure path

Scenario: User action cancels timeout
  Given an approval countdown is running
  When the user approves or denies
  Then the timeout should be cancelled
  And the user's action should take effect

Scenario: Warning before timeout
  Given timeout is approaching (30 seconds remaining)
  When the countdown reaches 30 seconds
  Then a warning should be prominently displayed
  And audio/visual notification should be triggered if configured
```

**Rationale**:
Approval timeouts prevent workflows from blocking indefinitely and enable unattended operation with sensible defaults.

---

#### FR-UI-061: Auto-Approval Conditions

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Low       |
| **Implements**   | HL-UI-005 |
| **Dependencies** | FR-UI-057 |

**Requirement**:
The system SHALL support configurable auto-approval conditions based on validation results so that low-risk or validated outputs can proceed without manual intervention.

**Acceptance Criteria**:

```gherkin
Scenario: Auto-approve when validation passes
  Given an approval gate with autoApprove: "whenValidationPasses"
  When all validations pass
  Then the phase should be automatically approved
  And no user interaction should be required

Scenario: Require manual approval on validation failure
  Given auto-approval is configured
  When validation fails
  Then manual approval should be required
  And the validation failures should be highlighted

Scenario: Auto-approve based on confidence score
  Given an approval gate with autoApprove when confidence > 0.9
  When AI validation reports confidence: 0.95
  Then the phase should be automatically approved

Scenario: Log auto-approval decisions
  Given an auto-approval occurs
  When reviewing execution history
  Then the auto-approval should be logged
  And the conditions that triggered it should be recorded
```

**Rationale**:
Auto-approval for validated outputs reduces manual intervention while maintaining safety through conditional logic.

---

### 2.6 Advanced Features

These requirements define optional and future capabilities.

---

#### FR-UI-062: Drag-and-Drop Workflow Construction

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-006 |
| **Dependencies** | FR-UI-030 |

**Requirement**:
The system SHALL support drag-and-drop workflow construction so that users can visually build workflows without editing YAML files.

**Acceptance Criteria**:

```gherkin
Scenario: Drag phase onto canvas
  Given the workflow builder is open
  When I drag a phase node from palette
  Then the phase should appear on the canvas
  And I should be able to position it

Scenario: Connect nodes
  Given phases are on the canvas
  When I drag from one node to another
  Then a connection should be created
  And the connection should indicate execution order

Scenario: Configure phase properties
  Given a phase is on the canvas
  When I click to edit it
  Then I should be able to configure phase properties via UI

Scenario: Generate valid YAML
  Given I have built a workflow visually
  When I save the workflow
  Then valid YAML should be generated
  And the YAML should execute correctly
```

**Rationale**:
Visual workflow builder lowers barrier to workflow creation for users unfamiliar with YAML syntax.

---

#### FR-UI-063: Direct Core Library Integration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL integrate with core workflow execution library directly without subprocess spawning so that desktop UI shares execution engine with CLI.

**Acceptance Criteria**:

```gherkin
Scenario: Direct library import
  Given the desktop UI
  When executing workflows
  Then core library functions should be imported directly
  And no subprocess spawning should occur

Scenario: Shared event bus
  Given the desktop UI is running
  When workflow events occur
  Then the event bus should be shared between UI and execution engine
```

**Rationale**:
Direct integration eliminates IPC overhead, ensures type safety, and maintains single execution engine implementation.

---

#### FR-UI-064: Multiple Concurrent Workflow Windows

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support multiple concurrent workflow windows so that users can monitor multiple workflows simultaneously.

**Acceptance Criteria**:

```gherkin
Scenario: Open multiple windows
  Given the desktop application is running
  When I open a new workflow window
  Then a separate window should appear
  And each window should track independent workflow execution

Scenario: Independent window management
  Given multiple workflow windows are open
  When I arrange them
  Then windows should be managed independently
  And each should have its own state
```

**Rationale**:
Power users need to monitor multiple workflows concurrently for complex development scenarios.

---

#### FR-UI-065: Desktop Cross-Platform Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-UI-002 |
| **Dependencies** | FR-UI-063 |

**Requirement**:
The system SHALL support desktop application deployment on macOS, Windows, and Linux so that users can use the graphical interface regardless of their operating system.

**Acceptance Criteria**:

```gherkin
Scenario: macOS application
  Given a macOS system (Intel or Apple Silicon)
  When I install the desktop application
  Then it should run natively
  And follow macOS UI conventions
  And support macOS keyboard shortcuts (Cmd+C, Cmd+V, etc.)

Scenario: Windows application
  Given a Windows 10/11 system
  When I install the desktop application
  Then it should run natively
  And follow Windows UI conventions
  And support Windows keyboard shortcuts (Ctrl+C, Ctrl+V, etc.)

Scenario: Linux application
  Given a Linux system with X11 or Wayland
  When I install the desktop application
  Then it should run on major distributions (Ubuntu, Fedora, Debian)
  And support standard Linux keyboard shortcuts

Scenario: Consistent functionality across platforms
  Given any supported platform
  When I use the desktop application
  Then all features should work identically
  And workflow execution should behave the same

Scenario: Platform-appropriate file dialogs
  Given a file selection is needed
  When I trigger the file dialog
  Then the native file picker should be used
  And recent locations should be accessible

Scenario: Platform-appropriate notifications
  Given a notification-worthy event occurs
  When notification is triggered
  Then platform-native notification system should be used
```

**Rationale**:
Cross-platform support maximizes user accessibility and allows teams with mixed operating systems to use the same tooling.

---

## 3. Error Handling Requirements

### 3.1 Error Scenarios

| Error Scenario               | Expected Behavior                       | Error Code |
| ---------------------------- | --------------------------------------- | ---------- |
| Invalid command syntax       | Display usage help with correct syntax  | ERR_UI_001 |
| Workflow not found           | Display available workflows             | ERR_UI_002 |
| Command definition not found | Display available commands              | ERR_UI_003 |
| Missing required argument    | Display which argument is missing       | ERR_UI_004 |
| Connection to backend lost   | Display reconnection status, auto-retry | ERR_UI_005 |
| Event stream interrupted     | Buffer events, resume when reconnected  | ERR_UI_006 |

### 3.2 Retry Behavior

| Condition                | Retry? | Max Attempts | Backoff Strategy                  |
| ------------------------ | ------ | ------------ | --------------------------------- |
| Backend connection lost  | Yes    | 5            | Exponential (1s, 2s, 4s, 8s, 16s) |
| Event stream interrupted | Yes    | Infinite     | Fixed (1s)                        |
| IPC command timeout      | Yes    | 3            | Linear (2s)                       |
| Command parsing error    | No     | -            | None                              |

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface   | Provider Component | Purpose                                                          |
| ----------- | ------------------ | ---------------------------------------------------------------- |
| Gateway API | Gateway (COMP-010) | All requests (execution, tasks, settings) and event subscription |

> **Note**: UI does not directly access Message Bus, Orchestrator, Agent Executor, or Configuration Manager. All communication flows through Gateway, which provides a unified API surface and handles event streaming (see architecture BFF pattern).

### 4.2 Provided Interfaces (Dependents)

| Interface             | Consumer Component(s) | Purpose                                                     |
| --------------------- | --------------------- | ----------------------------------------------------------- |
| User Input            | Gateway (COMP-010)    | Receive user-initiated commands via Gateway API             |
| Clarification Display | Gateway (COMP-010)    | Present questions to user and collect responses via Gateway |
| Status Display        | Gateway (COMP-010)    | Display system status and events streamed through Gateway   |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity                 | Description                            | Persistence                             |
| ---------------------- | -------------------------------------- | --------------------------------------- |
| User Preferences       | Display settings, theme, output format | Persisted (via Configuration Manager)   |
| Execution History View | Cached view of task history            | In-memory, refreshed from State Manager |
| Event Buffer           | Buffered events during disconnection   | In-memory, temporary                    |
| Graph Layout State     | Pan/zoom position, node positions      | In-memory, session only                 |

### 5.2 Data Constraints

| Constraint            | Description                                         |
| --------------------- | --------------------------------------------------- |
| Event buffer limit    | Maximum 10,000 events buffered during disconnection |
| History view limit    | Display last 100 executions by default              |
| Message display limit | Keep last 1,000 messages in chat view               |

---

## 6. Traceability

### 6.1 HL Requirement Decomposition

| HL Requirement | Functional Requirements                                                                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HL-UI-001      | FR-UI-012, FR-UI-013, FR-UI-014, FR-UI-015, FR-UI-016, FR-UI-017, FR-UI-018, FR-UI-019, FR-UI-020, FR-UI-021, FR-UI-022, FR-UI-023, FR-UI-024, FR-UI-025                                                                                                                          |
| HL-UI-002      | FR-UI-006, FR-UI-007, FR-UI-008, FR-UI-009, FR-UI-010, FR-UI-011, FR-UI-027, FR-UI-028, FR-UI-029, FR-UI-030, FR-UI-031, FR-UI-032, FR-UI-033, FR-UI-034, FR-UI-035, FR-UI-036, FR-UI-037, FR-UI-038, FR-UI-043, FR-UI-044, FR-UI-045, FR-UI-046, FR-UI-063, FR-UI-064, FR-UI-065 |
| HL-UI-003      | FR-UI-039, FR-UI-040, FR-UI-041, FR-UI-042                                                                                                                                                                                                                                        |
| HL-UI-004      | FR-UI-001, FR-UI-002, FR-UI-003, FR-UI-004, FR-UI-005, FR-UI-026                                                                                                                                                                                                                  |
| HL-UI-005      | FR-UI-047, FR-UI-048, FR-UI-049, FR-UI-050, FR-UI-051, FR-UI-052, FR-UI-053, FR-UI-054, FR-UI-055, FR-UI-056, FR-UI-057, FR-UI-058, FR-UI-059, FR-UI-060, FR-UI-061                                                                                                               |
| HL-UI-006      | FR-UI-062                                                                                                                                                                                                                                                                         |

### 6.2 Requirements Summary

| Category                         | Count  | Critical | High   | Medium | Low   |
| -------------------------------- | ------ | -------- | ------ | ------ | ----- |
| Foundation: Architecture & Modes | 11     | 4        | 6      | 0      | 1     |
| CLI Interface (Future)           | 15     | 6        | 5      | 3      | 1     |
| Desktop UI (Primary)             | 20     | 5        | 9      | 6      | 0     |
| Execution & Control              | 4      | 2        | 1      | 1      | 0     |
| Permissions & Approvals          | 11     | 0        | 4      | 6      | 1     |
| Advanced Features                | 4      | 1        | 0      | 3      | 0     |
| **Total**                        | **65** | **18**   | **25** | **19** | **3** |

---

## 7. Open Questions

| Question ID | Question                                                                                           | Owner | Target Date | Resolution |
| ----------- | -------------------------------------------------------------------------------------------------- | ----- | ----------- | ---------- |
| Q-001       | Should Desktop UI, future browser Web UI, and CLI share components or be separate implementations? | TBD   | Stage 4     | Pending    |
| Q-002       | What accessibility standards should the UI comply with?                                            | TBD   | Stage 4     | Pending    |
| Q-003       | Should workflow builder support importing existing YAML for editing?                               | TBD   | Stage 4     | Pending    |

---

## 8. Requirements Index

| ID        | Title                                  | Priority | Implements | Status |
| --------- | -------------------------------------- | -------- | ---------- | ------ |
| FR-UI-001 | Dual-Mode Operation Support            | Critical | HL-UI-004  | Draft  |
| FR-UI-002 | Headless Mode Detection                | High     | HL-UI-004  | Draft  |
| FR-UI-003 | Human-Friendly Terminal Output         | High     | HL-UI-004  | Draft  |
| FR-UI-004 | Machine-Parseable Output               | High     | HL-UI-004  | Draft  |
| FR-UI-005 | Graceful Output Degradation            | High     | HL-UI-004  | Draft  |
| FR-UI-006 | Local Deployment Mode                  | Critical | HL-UI-002  | Draft  |
| FR-UI-007 | Cloud Deployment Mode                  | Low      | HL-UI-002  | Draft  |
| FR-UI-008 | Backend Connection Abstraction         | High     | HL-UI-002  | Draft  |
| FR-UI-009 | Environment-Based Configuration        | High     | HL-UI-002  | Draft  |
| FR-UI-010 | Stateless UI Architecture              | Critical | HL-UI-002  | Draft  |
| FR-UI-011 | Initial State Hydration                | Critical | HL-UI-002  | Draft  |
| FR-UI-012 | Command Hierarchy Structure            | Critical | HL-UI-001  | Draft  |
| FR-UI-013 | CLI Commands for All Hierarchy Levels  | Critical | HL-UI-001  | Draft  |
| FR-UI-014 | Workflow Execution Command             | Critical | HL-UI-001  | Draft  |
| FR-UI-015 | Individual Command Execution           | Critical | HL-UI-001  | Draft  |
| FR-UI-016 | Help Documentation                     | Critical | HL-UI-001  | Draft  |
| FR-UI-017 | Project Initialization                 | Critical | HL-UI-001  | Draft  |
| FR-UI-018 | Workflow Listing                       | Medium   | HL-UI-001  | Draft  |
| FR-UI-019 | Workflow Details Display               | Medium   | HL-UI-001  | Draft  |
| FR-UI-020 | Workflow Validation Command            | High     | HL-UI-001  | Draft  |
| FR-UI-021 | Command Listing with Namespace Support | High     | HL-UI-001  | Draft  |
| FR-UI-022 | Command Definition Display             | Medium   | HL-UI-001  | Draft  |
| FR-UI-023 | Custom Command Arguments               | High     | HL-UI-001  | Draft  |
| FR-UI-024 | AI Model Selection                     | High     | HL-UI-001  | Draft  |
| FR-UI-025 | JSON Output Format                     | High     | HL-UI-001  | Draft  |
| FR-UI-026 | Color Output Control                   | Low      | HL-UI-004  | Draft  |
| FR-UI-027 | Two-Panel Layout                       | Critical | HL-UI-002  | Draft  |
| FR-UI-028 | Contextual Header                      | High     | HL-UI-002  | Draft  |
| FR-UI-029 | Web UI Launch                          | Medium   | HL-UI-002  | Draft  |
| FR-UI-030 | Real-Time Workflow Graph Display       | Critical | HL-UI-002  | Draft  |
| FR-UI-031 | Phase Status Visualization             | Critical | HL-UI-002  | Draft  |
| FR-UI-032 | Sequential Phase Visualization         | Critical | HL-UI-002  | Draft  |
| FR-UI-033 | Parallel Execution Visualization       | High     | HL-UI-002  | Draft  |
| FR-UI-034 | Interactive Graph Navigation           | High     | HL-UI-002  | Draft  |
| FR-UI-035 | Dependency Edge Visualization          | High     | HL-UI-002  | Draft  |
| FR-UI-036 | Conditional Execution Visualization    | High     | HL-UI-002  | Draft  |
| FR-UI-037 | Phase-Chat Synchronization             | Medium   | HL-UI-002  | Draft  |
| FR-UI-038 | Phase Detail Tooltips                  | Medium   | HL-UI-002  | Draft  |
| FR-UI-039 | AI Agent Activity Display              | Critical | HL-UI-003  | Draft  |
| FR-UI-040 | Tool Execution Display                 | High     | HL-UI-003  | Draft  |
| FR-UI-041 | Auto-Scroll Message Feed               | High     | HL-UI-003  | Draft  |
| FR-UI-042 | Phase-Based Message Filtering          | Medium   | HL-UI-003  | Draft  |
| FR-UI-043 | Theme Support                          | Medium   | HL-UI-002  | Draft  |
| FR-UI-044 | Responsive Multi-Device Design         | High     | HL-UI-002  | Draft  |
| FR-UI-045 | Event Notifications                    | High     | HL-UI-002  | Draft  |
| FR-UI-046 | UI Preferences Persistence             | Medium   | HL-UI-002  | Draft  |
| FR-UI-047 | Workflow Execution Controls            | High     | HL-UI-005  | Draft  |
| FR-UI-048 | Inter-Process Command Channel          | Critical | HL-UI-005  | Draft  |
| FR-UI-049 | Real-Time Event Streaming              | Critical | HL-UI-005  | Draft  |
| FR-UI-050 | Task Execution History                 | Medium   | HL-UI-005  | Draft  |
| FR-UI-051 | File Operation Permission Dialogs      | High     | HL-UI-005  | Draft  |
| FR-UI-052 | File Deletion Permission Dialogs       | High     | HL-UI-005  | Draft  |
| FR-UI-053 | Command Execution Permission Dialogs   | High     | HL-UI-005  | Draft  |
| FR-UI-054 | Permission Decision Caching            | Medium   | HL-UI-005  | Draft  |
| FR-UI-055 | Human-in-Loop Approvals                | Medium   | HL-UI-005  | Draft  |
| FR-UI-056 | Agent Clarification Display            | Medium   | HL-UI-005  | Draft  |
| FR-UI-057 | Human Approval Gates                   | High     | HL-UI-005  | Draft  |
| FR-UI-058 | Approval Review Checklist Display      | Medium   | HL-UI-005  | Draft  |
| FR-UI-059 | Maximum Refinement Attempts            | Medium   | HL-UI-005  | Draft  |
| FR-UI-060 | Approval Timeout with Countdown        | Medium   | HL-UI-005  | Draft  |
| FR-UI-061 | Auto-Approval Conditions               | Low      | HL-UI-005  | Draft  |
| FR-UI-062 | Drag-and-Drop Workflow Construction    | Medium   | HL-UI-006  | Draft  |
| FR-UI-063 | Direct Core Library Integration        | Critical | HL-UI-002  | Draft  |
| FR-UI-064 | Multiple Concurrent Workflow Windows   | Medium   | HL-UI-002  | Draft  |
| FR-UI-065 | Desktop Cross-Platform Support         | Medium   | HL-UI-002  | Draft  |

---

## 9. Requirement ID Mapping

This section documents the mapping from the previous document version for traceability.

| Old ID    | New ID    | Title                                  |
| --------- | --------- | -------------------------------------- |
| FR-UI-016 | FR-UI-001 | Dual-Mode Operation Support            |
| FR-UI-017 | FR-UI-002 | Headless Mode Detection                |
| FR-UI-018 | FR-UI-003 | Human-Friendly Terminal Output         |
| FR-UI-019 | FR-UI-004 | Machine-Parseable Output               |
| FR-UI-020 | FR-UI-005 | Graceful Output Degradation            |
| FR-UI-046 | FR-UI-006 | Local Deployment Mode                  |
| FR-UI-047 | FR-UI-007 | Cloud Deployment Mode                  |
| FR-UI-048 | FR-UI-008 | Backend Connection Abstraction         |
| FR-UI-049 | FR-UI-009 | Environment-Based Configuration        |
| FR-UI-038 | FR-UI-010 | Stateless UI Architecture              |
| FR-UI-039 | FR-UI-011 | Initial State Hydration                |
| FR-UI-001 | FR-UI-012 | Command Hierarchy Structure            |
| FR-UI-004 | FR-UI-013 | CLI Commands for All Hierarchy Levels  |
| FR-UI-002 | FR-UI-014 | Workflow Execution Command             |
| FR-UI-003 | FR-UI-015 | Individual Command Execution           |
| FR-UI-005 | FR-UI-016 | Help Documentation                     |
| FR-UI-031 | FR-UI-017 | Project Initialization                 |
| FR-UI-026 | FR-UI-018 | Workflow Listing                       |
| FR-UI-027 | FR-UI-019 | Workflow Details Display               |
| FR-UI-059 | FR-UI-020 | Workflow Validation Command            |
| FR-UI-028 | FR-UI-021 | Command Listing with Namespace Support |
| FR-UI-029 | FR-UI-022 | Command Definition Display             |
| FR-UI-030 | FR-UI-023 | Custom Command Arguments               |
| FR-UI-032 | FR-UI-024 | AI Model Selection                     |
| FR-UI-006 | FR-UI-025 | JSON Output Format                     |
| FR-UI-064 | FR-UI-026 | Color Output Control                   |
| FR-UI-041 | FR-UI-027 | Two-Panel Layout                       |
| FR-UI-042 | FR-UI-028 | Contextual Header                      |
| FR-UI-037 | FR-UI-029 | Web UI Launch                          |
| FR-UI-007 | FR-UI-030 | Real-Time Workflow Graph Display       |
| FR-UI-008 | FR-UI-031 | Phase Status Visualization             |
| FR-UI-009 | FR-UI-032 | Sequential Phase Visualization         |
| FR-UI-010 | FR-UI-033 | Parallel Execution Visualization       |
| FR-UI-011 | FR-UI-034 | Interactive Graph Navigation           |
| FR-UI-036 | FR-UI-035 | Dependency Edge Visualization          |
| FR-UI-035 | FR-UI-036 | Conditional Execution Visualization    |
| FR-UI-033 | FR-UI-037 | Phase-Chat Synchronization             |
| FR-UI-034 | FR-UI-038 | Phase Detail Tooltips                  |
| FR-UI-012 | FR-UI-039 | AI Agent Activity Display              |
| FR-UI-015 | FR-UI-040 | Tool Execution Display                 |
| FR-UI-013 | FR-UI-041 | Auto-Scroll Message Feed               |
| FR-UI-014 | FR-UI-042 | Phase-Based Message Filtering          |
| FR-UI-043 | FR-UI-043 | Theme Support                          |
| FR-UI-044 | FR-UI-044 | Responsive Multi-Device Design         |
| FR-UI-045 | FR-UI-045 | Event Notifications                    |
| FR-UI-040 | FR-UI-046 | UI Preferences Persistence             |
| FR-UI-021 | FR-UI-047 | Workflow Execution Controls            |
| FR-UI-023 | FR-UI-048 | Inter-Process Command Channel          |
| FR-UI-024 | FR-UI-049 | Real-Time Event Streaming              |
| FR-UI-022 | FR-UI-050 | Task Execution History                 |
| FR-UI-052 | FR-UI-051 | File Operation Permission Dialogs      |
| FR-UI-053 | FR-UI-052 | File Deletion Permission Dialogs       |
| FR-UI-054 | FR-UI-053 | Command Execution Permission Dialogs   |
| FR-UI-055 | FR-UI-054 | Permission Decision Caching            |
| FR-UI-056 | FR-UI-055 | Human-in-Loop Approvals                |
| FR-UI-057 | FR-UI-056 | Agent Clarification Display            |
| FR-UI-058 | FR-UI-057 | Human Approval Gates                   |
| FR-UI-060 | FR-UI-058 | Approval Review Checklist Display      |
| FR-UI-061 | FR-UI-059 | Maximum Refinement Attempts            |
| FR-UI-062 | FR-UI-060 | Approval Timeout with Countdown        |
| FR-UI-063 | FR-UI-061 | Auto-Approval Conditions               |
| FR-UI-025 | FR-UI-062 | Drag-and-Drop Workflow Construction    |
| FR-UI-051 | FR-UI-063 | Direct Core Library Integration        |
| FR-UI-050 | FR-UI-064 | Multiple Concurrent Workflow Windows   |
| FR-UI-065 | FR-UI-065 | Desktop Cross-Platform Support         |

---

## Document History

| Version | Date       | Author          | Changes                                                                                                                                                                                                                                               |
| ------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-26 | FlowMaster Team | Initial version                                                                                                                                                                                                                                       |
| 2.0     | 2025-11-26 | Claude          | Reorganized using progressive disclosure principles; renumbered all FRs; added Section 9 (ID Mapping)                                                                                                                                                 |
| 2.1     | 2025-11-27 | Claude          | Updated Component ID to COMP-09 due to addition of Validation Manager (COMP-008); updated interface references to Orchestrator (COMP-08) and Agent Executor (COMP-07)                                                                                 |
| 2.2     | 2025-12-15 | Claude          | Desktop-first approach: Added note clarifying Electron desktop as primary interface, CLI for future automation. Renamed Section 2.3 from "Web UI Core" to "Desktop UI (Primary Interface)". Updated Section 2.2 header to indicate CLI is for future. |
