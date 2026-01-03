# Configuration Manager - Functional Requirements

> **Component ID**: COMP-002
> **Document Version**: 3.0
> **Last Updated**: 2025-12-03
> **Status**: Draft
> **Owner**: FlowMaster Team
> **Related Documents**:
>
> - [Architecture Document](../00-architecture.md)
> - [High-Level Requirements](../../02-high-level-requirements/02-requirements.md)

---

## 1. Overview

### 1.1 Purpose

This document defines the detailed functional requirements for the **Configuration Manager** component. These requirements decompose the high-level requirements assigned to this component into specific, testable specifications.

### 1.2 Component Summary

| Attribute                      | Value                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------- |
| **Component ID**               | COMP-002                                                                     |
| **Responsibility**             | Workflow definitions, command definitions, configuration hierarchy, defaults |
| **Implements HL Requirements** | HL-WF-002, HL-CF-001, HL-CF-002, HL-CF-003                                   |

### 1.3 Requirement ID Convention

All requirements in this document follow the format: **FR-CF-XXX**

| Component             | Prefix | Example   |
| --------------------- | ------ | --------- |
| Configuration Manager | FR-CF  | FR-CF-001 |

### 1.4 Priority Levels

| Priority     | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Component cannot function without this. Must be in MVP.          |
| **High**     | Important for component's core responsibility. Should be in MVP. |
| **Medium**   | Valuable but not essential for initial release.                  |
| **Low**      | Nice to have. Future consideration.                              |

### 1.5 Document Organization

This document follows **progressive disclosure** principles. Requirements are organized from foundational to complex:

1. **Global Configuration Management** - Core configuration infrastructure (foundation)
2. **Credential Management** - Authentication built on configuration storage
3. **Workflow Definition Management** - Workflow loading using configuration
4. **Command Definition System** - Command loading and resolution
5. **Phase Execution Configuration** - Advanced features built on all above

---

## 2. Functional Requirements

### 2.1 Global Configuration Management

#### FR-CF-004: Global Configuration Storage

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL maintain global configuration including provider settings and user preferences so that system behavior can be customized.

**Acceptance Criteria**:

```gherkin
Scenario: Load global configuration
  Given a configuration file exists at "~/.flowmaster/config.yaml"
  When the Configuration Manager initializes
  Then the configuration should be loaded
  And all settings should be accessible

Scenario: Configuration includes provider settings
  Given a configuration with default provider "claude"
  When I query the default provider
  Then "claude" should be returned

Scenario: Configuration persists across sessions
  Given I set a configuration value
  When I restart the application
  Then the configuration value should still be set

Scenario: Update configuration via API
  Given an existing configuration
  When I update a setting programmatically
  Then the configuration file should be updated
  And the new value should take effect
```

**Rationale**:
Global configuration enables users to customize system behavior, set defaults, and manage provider preferences.

---

#### FR-CF-005: Configuration Defaults

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-001 |
| **Dependencies** | FR-CF-004 |

**Requirement**:
The system SHALL provide default configuration values when user configuration is absent so that the system works out-of-the-box.

**Acceptance Criteria**:

```gherkin
Scenario: Default provider when not configured
  Given no provider is configured
  When I query the default provider
  Then a sensible default should be returned
  And the system should function

Scenario: Default model when not configured
  Given no model preference is configured
  When I query the default model
  Then a sensible default should be returned

Scenario: Defaults are documented
  Given the system defaults
  When I inspect the default configuration
  Then all defaults should be clearly documented
  And their purposes should be explained

Scenario: Zero configuration startup
  Given no configuration files exist
  When the system starts
  Then the system should function with defaults
  And no errors should occur
```

**Rationale**:
Default configuration enables new users to start using the system immediately without complex setup.

---

#### FR-CF-006: Configuration Hierarchy

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-CF-001            |
| **Dependencies** | FR-CF-004, FR-CF-005 |

**Requirement**:
The system SHALL resolve configuration values using a hierarchy (CLI flags > environment variables > user config > project config > system defaults) so that configuration can be overridden at appropriate levels.

**Acceptance Criteria**:

```gherkin
Scenario: CLI flag overrides all
  Given user config has provider "claude"
  And CLI flag "--provider gemini" is passed
  When the provider is resolved
  Then "gemini" should be used

Scenario: Environment variable overrides config files
  Given project config has model "haiku"
  And environment variable FLOWMASTER_MODEL="sonnet" is set
  When the model is resolved
  Then "sonnet" should be used

Scenario: User config overrides project config
  Given project config has timeout 30
  And user config has timeout 60
  When the timeout is resolved
  Then 60 should be used

Scenario: Project config overrides system defaults
  Given system default retry is 3
  And project config has retry 5
  When retry count is resolved
  Then 5 should be used

Scenario: System defaults used when nothing else specified
  Given no configuration for a setting exists
  When the setting is resolved
  Then the system default should be used
```

**Rationale**:
Configuration hierarchy enables flexible customization at different levels while maintaining predictable precedence.

---

#### FR-CF-007: Global Workflow Defaults Loading

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-001 |
| **Dependencies** | FR-CF-004 |

**Requirement**:
The system SHALL load and parse global default settings from workflow YAML definitions (provider, model, retry configuration) so that these defaults are available for resolution during execution.

**Acceptance Criteria**:

```gherkin
Scenario: Parse defaults section from workflow YAML
  Given a workflow YAML with defaults section specifying provider "claude"
  When the workflow definition is loaded
  Then the defaults section should be parsed
  And provider default "claude" should be accessible

Scenario: Parse multiple default settings
  Given a workflow YAML with defaults for provider, model, and maxRetries
  When the workflow definition is loaded
  Then all three defaults should be parsed and accessible

Scenario: Handle missing defaults section
  Given a workflow YAML without defaults section
  When the workflow definition is loaded
  Then loading should succeed
  And defaults should be empty (system fallbacks apply at runtime)

Scenario: Validate default values
  Given a workflow YAML with defaults section
  When the workflow definition is loaded
  Then default values should be validated against schema
  And invalid values should produce clear errors
```

**Rationale**:
Loading and parsing workflow defaults from YAML enables Agent Executor to resolve and apply these defaults during execution. Configuration Manager owns the schema and parsing; Agent Executor owns the runtime resolution.

---

#### FR-CF-008: Per-Phase Configuration Override

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-001 |
| **Dependencies** | FR-CF-007 |

**Requirement**:
The system SHALL allow per-phase provider, model, and execution parameter overrides so that individual phases can customize their execution environment.

**Acceptance Criteria**:

```gherkin
Scenario: Phase specifies provider override
  Given workflow defaults with provider "claude"
  And a phase with provider "gemini"
  When the phase configuration is resolved
  Then provider should be "gemini"

Scenario: Phase specifies model override
  Given workflow defaults with model "haiku"
  And a phase with model "sonnet"
  When the phase configuration is resolved
  Then model should be "sonnet"

Scenario: Override applies only to specific phase
  Given phase A with model override "opus"
  And phase B without model override
  When both phases execute
  Then phase A should use "opus"
  And phase B should use workflow default

Scenario: Multiple overrides on same phase
  Given a phase with provider, model, and maxRetries overrides
  When the phase configuration is resolved
  Then all three overrides should apply
```

**Rationale**:
Different workflow phases may require different providers or models based on task complexity and cost optimization.

---

#### FR-CF-009: Path Placeholder System

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-CF-001 |
| **Dependencies** | FR-CF-004 |

**Requirement**:
The system SHALL support path placeholder definitions for reusable file references within workflow definitions using `${paths.name}` syntax.

**Acceptance Criteria**:

```gherkin
Scenario: Define path placeholder
  Given a workflow with paths section defining "output: .flowmaster/tasks/${taskId}/output"
  When the path is resolved with taskId "TASK-123"
  Then the path should be ".flowmaster/tasks/TASK-123/output"

Scenario: Use path placeholder in context
  Given a path placeholder "spec" defined
  And a phase using "${paths.spec}" in context
  When context is built
  Then the placeholder should be resolved to the actual path

Scenario: Invalid path reference error
  Given a phase using "${paths.undefined}"
  And "undefined" is not in paths section
  When the workflow is validated
  Then an error should indicate the undefined path reference

Scenario: Variable substitution in paths
  Given a path placeholder with "${taskId}" variable
  When the path is resolved
  Then taskId should be substituted from context
```

**Rationale**:
Path placeholders reduce duplication and make workflows more maintainable when the same files are referenced multiple times.

---

### 2.2 Credential Management

#### FR-CF-024: Provider Credential Storage

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-001 |
| **Dependencies** | FR-CF-004 |

**Requirement**:
The system SHALL support secure storage and retrieval of provider credentials and API keys so that users can authenticate with LLM providers.

**Acceptance Criteria**:

```gherkin
Scenario: Store provider API key
  Given a user configures a provider
  When they provide an API key
  Then the key should be stored securely
  And should not be logged or displayed in plain text

Scenario: Retrieve credentials for provider
  Given provider credentials are stored
  When Agent Executor requests credentials
  Then the credentials should be provided
  And should be usable for authentication

Scenario: Support multiple provider credentials
  Given credentials for Claude and Gemini
  When either provider is used
  Then the correct credentials should be retrieved

Scenario: Update existing credentials
  Given credentials exist for a provider
  When user updates the credentials
  Then the new credentials should replace the old
  And previous credentials should be invalidated

Scenario: Credential storage follows platform conventions
  Given the operating system is macOS/Windows/Linux
  When credentials are stored
  Then platform-appropriate secure storage should be used
  Or credentials should be stored in protected config file
```

**Rationale**:
Secure credential management is essential for authenticating with LLM providers while protecting sensitive API keys.

---

#### FR-CF-027: Authentication Clearing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-CF-001 |
| **Dependencies** | FR-CF-024 |

**Requirement**:
The system SHALL support clearing stored authentication credentials so that users can remove credentials when needed.

**Acceptance Criteria**:

```gherkin
Scenario: Clear credentials for specific provider
  Given credentials exist for provider "claude"
  When I run "flowmaster auth clear claude"
  Then credentials for "claude" should be removed
  And credentials for other providers should remain

Scenario: Clear all credentials
  Given credentials exist for multiple providers
  When I run "flowmaster auth clear --all"
  Then all stored credentials should be removed

Scenario: Confirm before clearing
  Given credentials exist
  When I run clear command without --force flag
  Then the user should be prompted to confirm
  And clearing should only proceed on confirmation

Scenario: Clear non-existent credentials
  Given no credentials exist for provider "gemini"
  When I run "flowmaster auth clear gemini"
  Then a message should indicate no credentials found
  And no error should occur
```

**Rationale**:
Users need to clear credentials for security reasons, when rotating keys, or when switching accounts.

---

### 2.3 Workflow Definition Management

> **Note**: This section defines the **schema and file format** for workflow definitions. The execution logic, lifecycle management, and state machine behavior for workflows are handled by the **Orchestrator (COMP-008)**. Configuration Manager is responsible for loading, validating, and providing these definitions—not executing them.

#### FR-CF-001: Workflow Definition Loading

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-CF-004 |

**Requirement**:
The system SHALL load workflow definitions from version-controllable files so that workflows can be versioned, shared, and collaboratively developed.

**Acceptance Criteria**:

```gherkin
Scenario: Load workflow from YAML file
  Given a workflow definition exists at ".flowmaster/workflows/dev-cycle.yaml"
  When Configuration Manager loads the workflow
  Then the workflow should be parsed successfully
  And the workflow object should be returned

Scenario: Workflow files are text-based
  Given a workflow definition in YAML format
  When the file is committed to git
  Then the file should be diffable and mergeable
  And comments in the file should be preserved

Scenario: List available workflows
  Given multiple workflow definitions exist in ".flowmaster/workflows/"
  When I request a list of workflows
  Then all workflow names should be returned
  And each workflow's description should be included

Scenario: Workflow not found
  Given no workflow exists at the requested path
  When I attempt to load the workflow
  Then an error should be returned
  And the error should list searched paths
```

**Rationale**:
Text-based workflow definitions enable version control, collaboration, code review, and CI/CD integration. This is fundamental to treating workflows as code.

---

#### FR-CF-002: Workflow Schema Validation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-CF-001 |

**Requirement**:
The system SHALL validate workflow definitions against the workflow schema when loaded so that syntax and structural errors are caught early.

**Acceptance Criteria**:

```gherkin
Scenario: Valid workflow passes validation
  Given a workflow definition with correct YAML syntax
  And all required fields are present
  When the workflow is loaded
  Then validation should pass
  And the workflow should be returned

Scenario: Invalid YAML syntax detected
  Given a workflow definition with malformed YAML
  When the workflow is loaded
  Then validation should fail
  And the error should indicate the syntax issue with line number

Scenario: Missing required field detected
  Given a workflow definition without "name" field
  When the workflow is loaded
  Then validation should fail
  And the error should identify the missing field

Scenario: Invalid field type detected
  Given a workflow definition with "phases" as a string instead of array
  When the workflow is loaded
  Then validation should fail
  And the error should show expected vs actual type
```

**Rationale**:
Early schema validation prevents confusing runtime errors and provides clear feedback about definition issues.

---

#### FR-CF-003: Backward Compatible Definitions

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Critical             |
| **Implements**   | HL-WF-002            |
| **Dependencies** | FR-CF-001, FR-CF-005 |

**Requirement**:
The system SHALL maintain backward compatibility so that existing workflow and command definitions continue working as new features are added.

**Acceptance Criteria**:

```gherkin
Scenario: Simple workflow without new features
  Given a workflow definition without defaults section
  And without path placeholders
  When the workflow is loaded
  Then loading should succeed
  And default values should be applied for missing fields

Scenario: Gradual feature adoption
  Given an existing workflow without iteration configuration
  When I add iteration to one phase
  Then the workflow should load successfully
  And phases without iteration should work unchanged

Scenario: New features are optional
  Given a minimal workflow with only name and phases
  When the workflow is loaded
  Then the workflow should be valid
  And all optional fields should use defaults
```

**Rationale**:
Backward compatibility ensures users can adopt new features gradually without breaking existing workflows.

---

### 2.4 Command Definition System

#### FR-CF-010: Command Definition Loading

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-CF-002 |
| **Dependencies** | FR-CF-004 |

**Requirement**:
The system SHALL load command definitions from markdown files so that commands are reusable and self-documenting.

**Acceptance Criteria**:

```gherkin
Scenario: Load command from file
  Given a command definition exists at ".flowmaster/commands/plan.md"
  When I request the "plan" command
  Then the command content should be loaded
  And the content should be returned

Scenario: Command with YAML frontmatter
  Given a command definition with YAML frontmatter
  When the command is loaded
  Then the frontmatter should be parsed
  And metadata should be accessible

Scenario: List available commands
  Given multiple command definitions exist
  When I request a list of commands
  Then all command names should be returned
  And descriptions from frontmatter should be included

Scenario: Command not found
  Given no command exists with name "nonexistent"
  When I request the command
  Then an error should be returned
  And the error should suggest similar commands if available
```

**Rationale**:
Markdown-based command definitions enable reuse, sharing, and self-documentation with embedded metadata.

---

#### FR-CF-011: Command Metadata Frontmatter

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-002 |
| **Dependencies** | FR-CF-010 |

**Requirement**:
Commands SHALL support YAML frontmatter with metadata including description, model defaults, output schema, and context requirements.

**Acceptance Criteria**:

```gherkin
Scenario: Parse command metadata
  Given a command with frontmatter containing description and model
  When the command is loaded
  Then description should be accessible
  And model should be accessible

Scenario: Output schema in frontmatter
  Given a command with output_schema in frontmatter
  When the command is loaded
  Then the schema should be parsed
  And should be available for validation

Scenario: Context requirements in frontmatter
  Given a command with required_context and optional_context
  When the command is loaded
  Then required contexts should be listed
  And optional contexts should be listed

Scenario: Invalid frontmatter validation
  Given a command with invalid frontmatter schema
  When the command is loaded
  Then validation should fail
  And the specific frontmatter error should be reported
```

**Rationale**:
Rich command metadata enables intelligent command selection, validation, and documentation generation.

---

#### FR-CF-012: Context Variable Declarations

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-CF-002 |
| **Dependencies** | FR-CF-011 |

**Requirement**:
Commands SHALL support required and optional context variable declarations for explicit dependency specification.

**Acceptance Criteria**:

```gherkin
Scenario: Required context validated
  Given a command with required_context: ["taskId", "spec"]
  And context is missing "spec"
  When the command is prepared for execution
  Then an error should indicate missing required context "spec"

Scenario: Optional context is optional
  Given a command with optional_context: ["previousOutput"]
  And context does not include "previousOutput"
  When the command is prepared for execution
  Then preparation should succeed
  And the variable should be empty in the prompt

Scenario: All required context present
  Given a command with required_context: ["taskId", "spec"]
  And context includes both "taskId" and "spec"
  When the command is prepared for execution
  Then preparation should succeed
  And both variables should be available

Scenario: Error message is actionable
  Given a command missing required context
  When the error is generated
  Then it should list all missing required variables
  And suggest how to provide them
```

**Rationale**:
Explicit context declarations make command dependencies clear and enable pre-execution validation.

---

#### FR-CF-013: Command Output Schema Definition

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-002 |
| **Dependencies** | FR-CF-011 |

**Requirement**:
The system SHALL support output schema definitions in command metadata so that command outputs can be validated.

**Acceptance Criteria**:

```gherkin
Scenario: Define output schema in frontmatter
  Given a command with output_schema defining required fields
  When the command is loaded
  Then the schema should be accessible
  And can be used for validation

Scenario: Schema supports JSON Schema format
  Given a command with JSON Schema style output_schema
  When the schema is parsed
  Then all JSON Schema keywords should be supported
  And complex types (objects, arrays) should work

Scenario: Schema injected into prompt
  Given a command with output_schema
  When the command prompt is prepared
  Then the schema should be appended to the prompt
  And formatting instructions should be included

Scenario: Missing schema is valid
  Given a command without output_schema
  When the command is loaded
  Then loading should succeed
  And no output validation will occur
```

**Rationale**:
Schema validation ensures command outputs are structured correctly for downstream consumption by dependent phases.

---

### 2.5 Command Definition and Resolution

#### FR-CF-014: Command Definition Loading

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-CF-002 |
| **Dependencies** | FR-CF-010 |

**Requirement**:
Commands SHALL be loaded from markdown files with instructions, context requirements, and tool access definitions.

**Acceptance Criteria**:

```gherkin
Scenario: Load command from file
  Given a command definition at ".flowmaster/commands/dev/implement.md"
  When I request the command "dev:implement"
  Then the command content should be loaded
  And all metadata should be accessible

Scenario: Command receives context
  Given a command with context requirements
  When the command is prepared for execution
  Then context from workflow and previous phases should be available

Scenario: Command output captured
  Given a command executes successfully
  When execution completes
  Then the output should be captured
  And should be available to subsequent phases

Scenario: Command inherits workflow defaults
  Given a command without explicit provider
  And workflow defaults specify provider "claude"
  When the command configuration is resolved
  Then provider should be "claude"
```

**Rationale**:
Commands encapsulate specific AI tasks with clear prompts and context, enabling reuse and composition in workflows.

---

#### FR-CF-015: Command Namespacing

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-002 |
| **Dependencies** | FR-CF-014 |

**Requirement**:
The system SHALL support command namespacing with namespace:name resolution patterns (e.g., dev:plan, git:commit).

**Acceptance Criteria**:

```gherkin
Scenario: Reference namespaced command
  Given a command at ".flowmaster/commands/dev/plan.md"
  When I reference "dev:plan"
  Then the command should be found and loaded

Scenario: Nested namespaces
  Given a command at ".flowmaster/commands/alfred/task-manager/create.md"
  When I reference "alfred:task-manager:create"
  Then the command should be found and loaded

Scenario: Namespace directory structure
  Given I create a namespace "security"
  When I add command "scan.md" to the security directory
  Then "security:scan" should resolve to that command

Scenario: Namespace provides organization
  Given multiple namespaces with similar command names
  When I list commands by namespace
  Then commands should be grouped by their namespace
```

**Rationale**:
Namespacing enables organizing commands by function (dev, git, security) and avoiding name collisions in large projects.

---

#### FR-CF-016: Command Resolution Algorithm

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-002 |
| **Dependencies** | FR-CF-015 |

**Requirement**:
The system SHALL resolve command references using exact match, short-name search, and flat-file priority rules.

**Acceptance Criteria**:

```gherkin
Scenario: Exact match resolution
  Given a command "dev:implement" exists
  When I reference "dev:implement"
  Then exact match should be found immediately

Scenario: Short-name resolution
  Given only one command named "implement" exists (in dev namespace)
  When I reference "implement" without namespace
  Then "dev:implement" should be found

Scenario: Flat file priority
  Given both ".flowmaster/commands/plan.md" and ".flowmaster/commands/dev/plan.md" exist
  When I reference "plan"
  Then ".flowmaster/commands/plan.md" should be used (flat file priority)

Scenario: Ambiguous reference error
  Given "test.md" exists in both "dev" and "qa" namespaces
  When I reference "test" without namespace
  Then an error should list both matches
  And suggest using full namespace reference

Scenario: Case-sensitive matching
  Given a command "Plan.md" exists
  When I reference "plan" (lowercase)
  Then matching should be case-insensitive on file systems that support it
```

**Rationale**:
Flexible resolution enables both explicit references and convenient short names while preventing ambiguity.

---

### 2.6 Phase Execution Configuration

#### FR-CF-018: Fallback Command Configuration

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-WF-002            |
| **Dependencies** | FR-CF-001, FR-CF-014 |

**Requirement**:
The system SHALL support fallback command specification that executes when a primary command fails so that workflows can gracefully degrade.

**Acceptance Criteria**:

```gherkin
Scenario: Specify fallback command for phase
  Given a workflow phase with command "implement"
  And a fallback command "implement-simple" specified
  When the workflow definition is loaded
  Then the fallback configuration should be parsed
  And both commands should be resolvable

Scenario: Fallback executes on primary failure
  Given a phase with fallback configured
  When the primary command fails
  Then the fallback command should execute automatically
  And execution should continue if fallback succeeds

Scenario: Fallback receives failure context
  Given a primary command has failed
  When the fallback command executes
  Then the fallback should receive context from the failed command
  And the failure reason should be included

Scenario: Log fallback execution
  Given a fallback command is executing
  When execution begins
  Then the system should log that fallback is being used
  And the original failure should be recorded
```

**Rationale**:
Fallback commands provide graceful degradation when complex commands fail, improving overall workflow reliability.

---

#### FR-CF-019: Conditional Phase Execution

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-CF-001 |

**Requirement**:
The system SHALL support conditional phase execution based on context expressions using `skipIf` configuration so that workflows can adapt dynamically.

**Acceptance Criteria**:

```gherkin
Scenario: Define skipIf condition on phase
  Given a workflow with a phase
  And the phase has skipIf: "{{testsAlreadyPassing}}"
  When the workflow is loaded
  Then the condition should be parsed and validated

Scenario: Skip phase when condition is true
  Given a phase with skipIf condition
  And the condition evaluates to true
  When the phase is reached during execution
  Then the phase should be skipped
  And execution should continue to the next phase

Scenario: Execute phase when condition is false
  Given a phase with skipIf condition
  And the condition evaluates to false
  When the phase is reached during execution
  Then the phase should execute normally

Scenario: Log skipped phases with reason
  Given a phase is skipped due to skipIf
  When the skip occurs
  Then the system should log the skip
  And the evaluated condition value should be recorded
```

**Rationale**:
Conditional execution enables dynamic workflows that adapt based on previous phase outputs or context values.

---

#### FR-CF-020: One-Time Phase Execution

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | Medium               |
| **Implements**   | HL-WF-002            |
| **Dependencies** | FR-CF-001, FR-CF-021 |

**Requirement**:
The system SHALL support one-time phase execution that runs only once even when workflow iterates using `runOnce` configuration so that setup phases don't repeat unnecessarily.

**Acceptance Criteria**:

```gherkin
Scenario: Define runOnce on phase
  Given a workflow with iterating phases
  And one phase has runOnce: true
  When the workflow is loaded
  Then the runOnce configuration should be parsed

Scenario: RunOnce phase executes first iteration only
  Given an iterating workflow with a runOnce phase
  When the first iteration executes
  Then the runOnce phase should execute
  And its output should be captured

Scenario: RunOnce phase skipped on subsequent iterations
  Given an iterating workflow that has completed first iteration
  When the second iteration begins
  Then the runOnce phase should be skipped automatically
  And execution should continue to next phase

Scenario: Track runOnce status in state
  Given a runOnce phase has executed
  When workflow state is persisted
  Then the runOnce execution status should be recorded
  And resumption should respect the runOnce flag
```

**Rationale**:
Setup phases should only run once even in iterative workflows to avoid redundant initialization.

---

#### FR-CF-021: Iteration Block Configuration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-CF-001 |

**Requirement**:
The system SHALL support iteration blocks with configurable termination conditions, checkpoint resumption, and safety limits so that workflows can repeat until objectives are achieved.

**Acceptance Criteria**:

```gherkin
Scenario: Define iteration block with until condition
  Given a workflow phase with iterate configuration
  And until condition: "{{testsPass}}"
  When the workflow is loaded
  Then the iteration block should be parsed
  And the termination condition should be captured

Scenario: Define iteration with maxIterations limit
  Given an iteration block
  And maxIterations: 10
  When the workflow is loaded
  Then the safety limit should be configured

Scenario: Iteration continues until condition met
  Given an iterating phase with until condition
  When the condition is not yet true
  Then the phase should repeat
  And context should be updated between iterations

Scenario: Iteration stops when condition met
  Given an iterating phase
  When the until condition becomes true
  Then iteration should stop
  And workflow should proceed to next phase

Scenario: Iteration stops at maxIterations
  Given an iterating phase with maxIterations: 5
  When 5 iterations complete without condition being met
  Then iteration should stop
  And a warning should be logged

Scenario: Configure delay between iterations
  Given an iteration block with delay: 2000
  When iterations occur
  Then there should be 2000ms pause between iterations
```

**Rationale**:
Iteration enables workflows that repeat until objectives are achieved, essential for autonomous development cycles.

---

#### FR-CF-022: Exponential Backoff for Iterations

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-CF-021 |

**Requirement**:
The system SHALL support exponential backoff delays between iteration attempts with configurable factor and maximum delay so that retry loops are well-behaved.

**Acceptance Criteria**:

```gherkin
Scenario: Configure backoff for iteration
  Given an iteration block with backoff configuration
  And factor: 2 and maxDelay: 30000
  When the workflow is loaded
  Then backoff settings should be captured

Scenario: Delay increases exponentially
  Given an iteration with backoff factor: 2 and initial delay: 1000
  When iterations occur
  Then delay should be 1000ms, then 2000ms, then 4000ms

Scenario: Delay capped at maxDelay
  Given an iteration with maxDelay: 5000
  And calculated delay would be 8000ms
  When the delay is applied
  Then actual delay should be 5000ms (capped)

Scenario: Backoff resets on success condition change
  Given an iterating phase making progress
  When partial progress is detected
  Then backoff may reset based on configuration
```

**Rationale**:
Exponential backoff prevents rapid retry loops and reduces resource consumption during error recovery.

---

#### FR-CF-023: Nested Iteration Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-WF-002 |
| **Dependencies** | FR-CF-021 |

**Requirement**:
The system SHALL support nested iteration blocks within phases for multi-level iterative workflows so that complex development patterns can be expressed.

**Acceptance Criteria**:

```gherkin
Scenario: Define nested iteration blocks
  Given a workflow with outer iteration
  And inner phases have their own iteration configuration
  When the workflow is loaded
  Then nested iteration structure should be parsed

Scenario: Nested iterations have independent counters
  Given nested iteration blocks
  When iterations execute
  Then outer and inner iteration counts should be independent
  And each level should track its own progress

Scenario: Nested iterations have different conditions
  Given outer iteration until: "{{allTasksComplete}}"
  And inner iteration until: "{{testsPass}}"
  When workflow executes
  Then each level should evaluate its own condition

Scenario: State tracks all iteration levels
  Given a nested iteration in progress
  When state is persisted
  Then all iteration levels should be recorded
  And resumption should restore correct iteration positions
```

**Rationale**:
Complex development workflows may require nested loops, such as iterating tasks with each task iterating until tests pass.

---

### 2.8 Tool Configuration

#### FR-CF-029: Command Tool Configuration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-CF-003 |
| **Dependencies** | FR-CF-011 |

**Requirement**:
Commands SHALL support tool configuration in frontmatter to define which tools are available during execution so that command authors can restrict tool access for safety or focus.

**Acceptance Criteria**:

```gherkin
Scenario: Define allowed tools in command frontmatter
  Given a command definition with tools field in frontmatter
  When the command is loaded
  Then the allowed tools should be parsed
  And should be available for execution configuration

Scenario: Command without tools uses defaults
  Given a command definition without tools field
  When the command is loaded
  Then default tool set should be applied

Scenario: Validate tool names
  Given a command specifies tools: ["Read", "InvalidTool"]
  When the command is loaded
  Then validation should warn about unrecognized tool names
```

**Rationale**:
Tool configuration at the command level enables command authors to define appropriate tool access based on the command's purpose (e.g., read-only for validation commands).

---

#### FR-CF-030: Per-Phase Tool Override

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | High                 |
| **Implements**   | HL-CF-003            |
| **Dependencies** | FR-CF-029, FR-CF-008 |

**Requirement**:
Phases SHALL support tool configuration to override command-level tool settings so that workflow authors can customize tool access per phase.

**Acceptance Criteria**:

```gherkin
Scenario: Phase overrides command tools
  Given a command with tools: ["Read", "Write", "Edit"]
  And a phase specifies tools: ["Read"]
  When the phase configuration is resolved
  Then only "Read" should be allowed

Scenario: Phase inherits command tools when not specified
  Given a command with tools: ["Read", "Write"]
  And a phase does not specify tools
  When the phase configuration is resolved
  Then tools should be ["Read", "Write"] from command

Scenario: Workflow defaults apply when neither specifies
  Given a command without tools configuration
  And a phase without tools configuration
  And workflow defaults specify tools: ["Read", "Glob", "Grep"]
  When the phase configuration is resolved
  Then workflow default tools should be used
```

**Rationale**:
Phase-level tool overrides enable workflows to restrict tools for specific phases (e.g., validation phases) without modifying command definitions.

---

#### FR-CF-031: Default Tool Sets

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-CF-003 |
| **Dependencies** | FR-CF-005 |

**Requirement**:
The system SHALL provide named default tool sets that can be referenced in configuration so that common tool configurations can be reused.

**Acceptance Criteria**:

```gherkin
Scenario: Reference named tool set
  Given a predefined tool set "read-only" exists
  When a phase specifies tools: "read-only"
  Then the named set should be expanded to its tool list

Scenario: Full-access tool set
  Given a predefined tool set "full-access" exists
  When a phase specifies tools: "full-access"
  Then all standard tools should be available

Scenario: Custom tool sets in configuration
  Given user configuration defines a tool set "safe-edit"
  When a phase references tools: "safe-edit"
  Then the user-defined tool set should be used
```

**Rationale**:
Named tool sets reduce configuration verbosity and ensure consistent tool access patterns across workflows.

---

### 2.9 Validation Configuration

This section covers configuration of validation schemas and validation behavior options.

---

#### FR-CF-032: Output Schema Definition in Workflows

| Attribute         | Value                                 |
| ----------------- | ------------------------------------- |
| **ID**            | FR-CF-032                             |
| **Title**         | Output Schema Definition in Workflows |
| **Priority**      | High                                  |
| **Implements**    | HL-VL-001                             |
| **Migrated From** | FR-VL-001 (Validation Manager)        |

**Requirement**:
The system SHALL support output schema definitions in workflow specifications so that agent outputs can be validated against expected structure.

**Acceptance Criteria**:

```gherkin
Scenario: Define output schema for phase
  Given a workflow with phase output schema defined
  When the workflow is loaded
  Then the schema should be available for validation

Scenario: Schema with required and optional fields
  Given a schema with required field "status" and optional field "details"
  When an output is validated
  Then missing "status" should fail validation
  And missing "details" should pass validation

Scenario: Schema supports primitive types
  Given a schema with string, integer, boolean, number fields
  When outputs are validated
  Then type mismatches should be detected

Scenario: Schema supports complex types
  Given a schema with array and object fields
  When outputs are validated
  Then nested structures should be validated correctly

Scenario: Schema validated at load time
  Given a workflow with invalid schema definition
  When the workflow is loaded
  Then validation should fail
  And the schema error should be reported
```

**Rationale**:
Structured outputs enable reliable conditional execution and data passing between phases. Schemas define the expected output structure.

---

#### FR-CF-033: Skip AI Validation Option

| Attribute         | Value                          |
| ----------------- | ------------------------------ |
| **ID**            | FR-CF-033                      |
| **Title**         | Skip AI Validation Option      |
| **Priority**      | Medium                         |
| **Implements**    | HL-VL-005                      |
| **Migrated From** | FR-VL-013 (Validation Manager) |

**Requirement**:
The system SHALL allow configuring skip AI validation when deterministic checks are sufficient so that time and cost can be saved for deterministic scenarios.

**Acceptance Criteria**:

```gherkin
Scenario: Skip AI validation configuration
  Given a phase with validation.skip_ai: true
  When the workflow is loaded
  Then the skip_ai flag should be available to WorkflowEngine

Scenario: Default skip_ai is false
  Given a phase without validation.skip_ai configured
  When the workflow is loaded
  Then skip_ai should default to false

Scenario: Global skip_ai configuration
  Given global config validation.skip_ai: true
  When a phase without explicit skip_ai is loaded
  Then it should inherit the global setting
```

**Rationale**:
When deterministic checks fully validate phase success (tests pass, build succeeds), AI validation is unnecessary and wasteful. Skip option optimizes for this case.

---

#### FR-CF-034: Configurable Validation Model Selection

| Attribute         | Value                                   |
| ----------------- | --------------------------------------- |
| **ID**            | FR-CF-034                               |
| **Title**         | Configurable Validation Model Selection |
| **Priority**      | Medium                                  |
| **Implements**    | HL-VL-004                               |
| **Migrated From** | FR-VL-018 (Validation Manager)          |

**Requirement**:
The system SHALL allow configuring which AI model performs validation so that costs can be optimized through model selection.

**Acceptance Criteria**:

```gherkin
Scenario: Default validation model
  Given no validation model is configured
  When validation model is requested
  Then it should return haiku (cost-effective default)

Scenario: Global validation model configuration
  Given global config validation.model: sonnet
  When validation model is requested
  Then it should return sonnet

Scenario: Per-phase model override
  Given global config validation.model: haiku
  And phase config validation.model: opus
  When validation model is requested for that phase
  Then it should return opus (phase override wins)
```

**Rationale**:
Validation is a frequent operation. Using cheaper model (haiku) for validation reduces costs while still catching agent shortcuts. Allow override for complex validation.

---

## 3. Error Handling Requirements

### 3.1 Error Scenarios

| Error Scenario               | Expected Behavior                        | Error Code |
| ---------------------------- | ---------------------------------------- | ---------- |
| Configuration file not found | Use defaults, log warning                | ERR_CF_001 |
| Configuration file corrupt   | Return error, use defaults               | ERR_CF_002 |
| Invalid YAML syntax          | Return error with line number            | ERR_CF_003 |
| Schema validation failed     | Return error with field details          | ERR_CF_004 |
| Workflow file not found      | Return clear error with searched paths   | ERR_CF_005 |
| Command not found            | Return error with suggestions            | ERR_CF_006 |
| Invalid frontmatter          | Return error with frontmatter path       | ERR_CF_007 |
| Ambiguous command reference  | Return error listing all matches         | ERR_CF_008 |
| Missing required context     | Return error listing missing variables   | ERR_CF_009 |
| Path placeholder undefined   | Return error with placeholder name       | ERR_CF_010 |
| Credential storage failure   | Return error, suggest alternatives       | ERR_CF_011 |
| Authentication failed        | Return error with provider-specific help | ERR_CF_012 |

### 3.2 Retry Behavior

| Condition                 | Retry? | Max Attempts | Backoff Strategy |
| ------------------------- | ------ | ------------ | ---------------- |
| File read error           | Yes    | 3            | Linear           |
| Parse error               | No     | -            | -                |
| Schema validation error   | No     | -            | -                |
| Configuration write error | Yes    | 3            | Exponential      |
| Credential storage error  | Yes    | 2            | Linear           |
| OAuth callback timeout    | No     | -            | -                |

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface | Provider Component | Purpose                                           |
| --------- | ------------------ | ------------------------------------------------- |
| (None)    | -                  | Configuration Manager is a foundational component |

### 4.2 Provided Interfaces (Dependents)

| Interface            | Consumer Component(s)   | Purpose                              |
| -------------------- | ----------------------- | ------------------------------------ |
| Configuration Access | All Components          | Get configuration values             |
| Defaults Resolution  | All Components          | Resolve configuration with hierarchy |
| Workflow Loading     | COMP-008 Orchestrator   | Load workflow definitions            |
| Command Loading      | COMP-007 Agent Executor | Load command definitions             |
| Credential Access    | COMP-007 Agent Executor | Get provider credentials             |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity                | Description                              | Persistence               |
| --------------------- | ---------------------------------------- | ------------------------- |
| Global Configuration  | User and system configuration            | Persistent file           |
| Project Configuration | Project-specific settings                | Persistent file           |
| Workflow Definition   | Parsed workflow YAML structure           | Loaded from file          |
| Command Definition    | Parsed command markdown with frontmatter | Loaded from file          |
| Path Placeholders     | Named path aliases                       | In-memory (from workflow) |
| Provider Credentials  | API keys and OAuth tokens                | Secure storage            |

### 5.2 Data Constraints

| Constraint           | Description                                       |
| -------------------- | ------------------------------------------------- |
| Valid YAML           | All YAML files must be syntactically valid        |
| Schema compliance    | Workflows must match workflow schema              |
| Unique command names | Command names must be unique within namespace     |
| Valid paths          | All file paths must be valid for the OS           |
| Secure credentials   | API keys must not be stored in plain text in logs |

---

## 6. Traceability

### 6.1 HL Requirement Decomposition

| HL Requirement | Functional Requirements                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------- |
| HL-WF-002      | FR-CF-001, FR-CF-002, FR-CF-003, FR-CF-018, FR-CF-019, FR-CF-020, FR-CF-021, FR-CF-022, FR-CF-023 |
| HL-CF-001      | FR-CF-004, FR-CF-005, FR-CF-006, FR-CF-007, FR-CF-008, FR-CF-009, FR-CF-024, FR-CF-027            |
| HL-CF-002      | FR-CF-010, FR-CF-011, FR-CF-012, FR-CF-013, FR-CF-014, FR-CF-015, FR-CF-016                       |
| HL-CF-003      | FR-CF-029, FR-CF-030, FR-CF-031                                                                   |
| HL-VL-001      | FR-CF-032                                                                                         |
| HL-VL-004      | FR-CF-034                                                                                         |
| HL-VL-005      | FR-CF-033                                                                                         |

### 6.2 Requirements Summary

| Category                        | Count | Critical | High | Medium | Low |
| ------------------------------- | ----- | -------- | ---- | ------ | --- |
| Global Configuration Management | 6     | 0        | 5    | 1      | 0   |
| Credential Management           | 2     | 0        | 1    | 1      | 0   |
| Workflow Definition Management  | 3     | 2        | 1    | 0      | 0   |
| Command Definition System       | 4     | 1        | 2    | 1      | 0   |
| Command Definition & Resolution | 3     | 1        | 2    | 0      | 0   |
| Phase Execution Configuration   | 6     | 0        | 2    | 4      | 0   |
| Tool Configuration              | 3     | 0        | 2    | 1      | 0   |
| Validation Configuration        | 3     | 0        | 1    | 2      | 0   |
| **Total**                       | 30    | 4        | 16   | 10     | 0   |

---

## 7. Open Questions

| Question ID | Question                                                         | Owner | Target Date | Resolution                                                                                                                                              |
| ----------- | ---------------------------------------------------------------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-CF-001    | Should configuration changes trigger reload of cached workflows? | Arch  | 2025-12-01  | **Resolved**: No - immutable after init. Config loaded once at startup, changes require restart.                                                        |
| Q-CF-002    | How should conflicting namespace:name patterns be handled?       | Arch  | 2025-12-01  | **Resolved**: Error with all matches listed. Throw `AmbiguousCommandError` listing all matches. User must be explicit.                                  |
| Q-CF-003    | Should we support configuration inheritance between projects?    | Arch  | 2025-12-01  | **Resolved**: Simple hierarchy. User config (~/.flowmaster) provides defaults, project config (.flowmaster) overrides. No `extends` mechanism.          |
| Q-CF-004    | What is the specific secure storage mechanism per platform?      | Arch  | 2025-12-01  | **Resolved**: Protected file only. `~/.flowmaster/credentials.yaml` with 600 permissions. Cross-platform, CI/CD friendly. Env vars checked as fallback. |

---

## 8. Requirements Index

| ID        | Title                                   | Priority | Implements | Status |
| --------- | --------------------------------------- | -------- | ---------- | ------ |
| FR-CF-004 | Global Configuration Storage            | High     | HL-CF-001  | Draft  |
| FR-CF-005 | Configuration Defaults                  | High     | HL-CF-001  | Draft  |
| FR-CF-006 | Configuration Hierarchy                 | High     | HL-CF-001  | Draft  |
| FR-CF-007 | Global Workflow Defaults Loading        | High     | HL-CF-001  | Draft  |
| FR-CF-008 | Per-Phase Configuration Override        | High     | HL-CF-001  | Draft  |
| FR-CF-009 | Path Placeholder System                 | Medium   | HL-CF-001  | Draft  |
| FR-CF-024 | Provider Credential Storage             | High     | HL-CF-001  | Draft  |
| FR-CF-027 | Authentication Clearing                 | Medium   | HL-CF-001  | Draft  |
| FR-CF-001 | Workflow Definition Loading             | Critical | HL-WF-002  | Draft  |
| FR-CF-002 | Workflow Schema Validation              | High     | HL-WF-002  | Draft  |
| FR-CF-003 | Backward Compatible Definitions         | Critical | HL-WF-002  | Draft  |
| FR-CF-010 | Command Definition Loading              | Critical | HL-CF-002  | Draft  |
| FR-CF-011 | Command Metadata Frontmatter            | High     | HL-CF-002  | Draft  |
| FR-CF-012 | Context Variable Declarations           | Medium   | HL-CF-002  | Draft  |
| FR-CF-013 | Command Output Schema Definition        | High     | HL-CF-002  | Draft  |
| FR-CF-014 | Command Definition Loading              | Critical | HL-CF-002  | Draft  |
| FR-CF-015 | Command Namespacing                     | High     | HL-CF-002  | Draft  |
| FR-CF-016 | Command Resolution Algorithm            | High     | HL-CF-002  | Draft  |
| FR-CF-018 | Fallback Command Configuration          | High     | HL-WF-002  | Draft  |
| FR-CF-019 | Conditional Phase Execution             | Medium   | HL-WF-002  | Draft  |
| FR-CF-020 | One-Time Phase Execution                | Medium   | HL-WF-002  | Draft  |
| FR-CF-021 | Iteration Block Configuration           | High     | HL-WF-002  | Draft  |
| FR-CF-022 | Exponential Backoff for Iterations      | Medium   | HL-WF-002  | Draft  |
| FR-CF-023 | Nested Iteration Support                | Medium   | HL-WF-002  | Draft  |
| FR-CF-029 | Command Tool Configuration              | High     | HL-CF-003  | Draft  |
| FR-CF-030 | Per-Phase Tool Override                 | High     | HL-CF-003  | Draft  |
| FR-CF-031 | Default Tool Sets                       | Medium   | HL-CF-003  | Draft  |
| FR-CF-032 | Output Schema Definition in Workflows   | High     | HL-VL-001  | Draft  |
| FR-CF-033 | Skip AI Validation Option               | Medium   | HL-VL-005  | Draft  |
| FR-CF-034 | Configurable Validation Model Selection | Medium   | HL-VL-004  | Draft  |

---

## Document History

| Version | Date       | Author          | Changes                                                                                                                                         |
| ------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-25 | FlowMaster Team | Initial version                                                                                                                                 |
| 1.1     | 2025-11-26 | Claude          | Added FR-CF-018 through FR-CF-024                                                                                                               |
| 1.2     | 2025-11-26 | Claude          | Added FR-CF-025 through FR-CF-028 (authentication)                                                                                              |
| 2.0     | 2025-11-26 | Claude          | Reorganized for progressive disclosure, updated COMP-002                                                                                        |
| 2.1     | 2025-11-27 | Claude          | Added FR-CF-029 through FR-CF-031 (tool configuration)                                                                                          |
| 2.2     | 2025-11-29 | Claude          | Removed FR-CF-017 (templating), renamed "command template" to "command definition"                                                              |
| 3.0     | 2025-12-03 | Claude          | Added Section 2.9 Validation Configuration; migrated FR-VL-001, FR-VL-013, FR-VL-018 from Validation Manager as FR-CF-032, FR-CF-033, FR-CF-034 |
