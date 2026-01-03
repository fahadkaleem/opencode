# Context Manager - Component Requirements

> **Component ID**: COMP-005
> **Document Version**: 3.0
> **Last Updated**: 2025-12-03
> **Status**: Draft
> **Parent Document**: [System Architecture](../00-architecture.md)

---

## 1. Overview

### 1.1 Component Purpose

The Context Manager is responsible for building, persisting, and loading execution context for agents at all levels of the orchestration hierarchy (workflow, phase, command). It aggregates information from multiple sources and provides it to agents in a structured format.

### 1.2 Scope

This document defines the functional requirements for the Context Manager component, derived from the following high-level requirements:

| HL Requirement | Title                                  | Priority |
| -------------- | -------------------------------------- | -------- |
| HL-CM-001      | Context Building from Multiple Sources | Critical |
| HL-CM-002      | Context Persistence and Loading        | High     |
| HL-CM-004      | Optional and Required Context Items    | High     |

### 1.3 Dependencies

| Component              | Dependency Type | Purpose                                  |
| ---------------------- | --------------- | ---------------------------------------- |
| COMP-003 State Manager | Required        | Retrieve previous outputs and task state |
| COMP-006 Task Manager  | Required        | Get task details for context building    |

### 1.4 Document Organization

This document follows progressive disclosure, organized from foundational concepts to advanced features:

1. **Core Context Model** - What context types exist
2. **Context Source Resolution** - How to load from different sources
3. **Context Building** - How to assemble complete context
4. **Context Formatting** - How context is structured and tagged
5. **Validation & Requirements** - Required vs optional items
6. **Size Management** - Truncation and limits
7. **Context Persistence** - Saving and loading context
8. **Expression Access** - Accessing context in expressions
9. **Cross-Boundary Passing** - Advanced cross-workflow features

---

## 2. Functional Requirements

### 2.1 Core Context Model

This section defines what context types exist and how they are specified.

---

#### FR-CM-001: Context Source Types

| Attribute      | Value                |
| -------------- | -------------------- |
| **ID**         | FR-CM-001            |
| **Title**      | Context Source Types |
| **Priority**   | Critical             |
| **Implements** | HL-CM-001            |

**Requirement**:
The system SHALL support context injection in multiple formats: phase output reference, file reference, glob pattern, and task reference so that workflows can specify diverse context sources.

**Acceptance Criteria**:

```gherkin
Feature: Context Source Types

  Scenario: Context supports phase output reference
    Given context item has type "phase"
    And references phase "plan"
    When the Context Manager processes the context item
    Then the system SHALL load the output from phase "plan"

  Scenario: Context supports file reference
    Given context item has type "file"
    And references path "docs/spec.md"
    When the Context Manager processes the context item
    Then the system SHALL load the file content

  Scenario: Context supports glob pattern
    Given context item has type "glob"
    And references pattern "src/**/*.ts"
    When the Context Manager processes the context item
    Then the system SHALL load all matching files

  Scenario: Context supports task reference
    Given context item has type "task"
    And the current task is "TASK-789"
    When the Context Manager processes the context item
    Then the system SHALL load task details from Task Manager
```

**Rationale**:
Flexible context sources enable commands to receive information from various sources including files, previous outputs, and task data.

---

#### FR-CM-002: Workflow Context Source Specification

| Attribute      | Value                                 |
| -------------- | ------------------------------------- |
| **ID**         | FR-CM-002                             |
| **Title**      | Workflow Context Source Specification |
| **Priority**   | Critical                              |
| **Implements** | HL-CM-001                             |

**Requirement**:
The system SHALL allow workflows to specify context sources for each phase so that commands receive relevant data from previous phases and project files.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Context Source Specification

  Scenario: Workflows specify context sources in phase definitions
    Given a workflow definition with phase "implement"
    And the phase specifies context source "plan.output"
    When the workflow is loaded
    Then the phase SHALL have context source "plan.output" registered

  Scenario: Context sources reference previous phase outputs
    Given phase "plan" completed with structured output
    And phase "implement" specifies context source "plan.output"
    When the Context Manager builds context for "implement"
    Then the context SHALL include the output from "plan"

  Scenario: Context sources reference project files
    Given a workflow phase specifies context source "file:docs/spec.md"
    And the file "docs/spec.md" exists in the project
    When the Context Manager builds context
    Then the context SHALL include the contents of "docs/spec.md"

  Scenario: Context sources use glob patterns
    Given a workflow phase specifies context source "glob:src/**/*.ts"
    And multiple TypeScript files exist in "src/"
    When the Context Manager builds context
    Then the context SHALL include contents of all matching files

  Scenario: Context source validation at workflow load time
    Given a workflow specifies context source "nonexistent.output"
    When the workflow is loaded
    Then the system SHALL validate the context source reference
    And the system SHALL warn if the reference cannot be resolved
```

**Rationale**:
Commands need context from previous phases and project files to make informed decisions and maintain workflow continuity.

---

### 2.2 Context Source Resolution

This section defines how to load context from different source types.

---

#### FR-CM-003: Project File Reference Resolution

| Attribute        | Value                             |
| ---------------- | --------------------------------- |
| **ID**           | FR-CM-003                         |
| **Title**        | Project File Reference Resolution |
| **Priority**     | High                              |
| **Implements**   | HL-CM-001                         |
| **Dependencies** | FR-CM-001                         |

**Requirement**:
The system SHALL resolve file path references to project files so that commands can access project documentation and code.

**Acceptance Criteria**:

```gherkin
Feature: Project File Reference Resolution

  Scenario: Resolve relative file paths from project root
    Given project root is "/home/user/myproject"
    And context specifies file reference "docs/README.md"
    When the Context Manager resolves the file reference
    Then the system SHALL resolve to "/home/user/myproject/docs/README.md"

  Scenario: Resolve absolute file paths
    Given context specifies file reference "/etc/config/settings.json"
    When the Context Manager resolves the file reference
    Then the system SHALL resolve to "/etc/config/settings.json"

  Scenario: Load file content from resolved paths
    Given file reference resolves to "/home/user/myproject/spec.md"
    And the file contains "Feature specification"
    When the Context Manager loads the file
    Then the context SHALL include content "Feature specification"

  Scenario: Validate file existence before loading
    Given context specifies file reference "docs/spec.md"
    And the file exists
    When the Context Manager resolves the file reference
    Then the system SHALL confirm the file exists before loading

  Scenario: Provide clear errors for missing files
    Given context specifies required file reference "missing.md"
    And the file does not exist
    When the Context Manager attempts to load the file
    Then the system SHALL return an error indicating file not found
    And the error SHALL include the expected path
```

**Rationale**:
Commands need access to project files like specifications, architecture documents, and existing code to make informed decisions.

---

#### FR-CM-004: Glob Pattern Support for Multiple Files

| Attribute        | Value                                   |
| ---------------- | --------------------------------------- |
| **ID**           | FR-CM-004                               |
| **Title**        | Glob Pattern Support for Multiple Files |
| **Priority**     | High                                    |
| **Implements**   | HL-CM-001                               |
| **Dependencies** | FR-CM-001                               |

**Requirement**:
The system SHALL support glob patterns for loading multiple files as context so that commands can access collections of related files.

**Acceptance Criteria**:

```gherkin
Feature: Glob Pattern Support for Multiple Files

  Scenario: Resolve glob patterns to matching file paths
    Given project contains files "src/a.ts", "src/b.ts", "src/c.js"
    And context specifies glob pattern "src/*.ts"
    When the Context Manager resolves the glob pattern
    Then the system SHALL return ["src/a.ts", "src/b.ts"]

  Scenario: Load all matching files
    Given glob pattern "tests/*.test.ts" matches 3 files
    When the Context Manager loads the glob pattern
    Then the context SHALL include content from all 3 files

  Scenario: Handle glob patterns with wildcards
    Given context specifies glob pattern "src/**/*.ts"
    When the Context Manager resolves the pattern
    Then the system SHALL match files in all subdirectories

  Scenario: Handle recursive glob patterns
    Given project has nested directories "src/a/b/c/file.ts"
    And context specifies glob pattern "src/**/*.ts"
    When the Context Manager resolves the pattern
    Then the system SHALL include "src/a/b/c/file.ts"

  Scenario: Handle glob patterns matching zero files
    Given context specifies optional glob pattern "nonexistent/*.md"
    And no files match the pattern
    When the Context Manager resolves the pattern
    Then the system SHALL return an empty result
    And the system SHALL NOT fail the context build
```

**Rationale**:
Workflows often need to analyze multiple files (e.g., all test files, all documentation). Glob patterns enable efficient bulk file loading.

---

#### FR-CM-005: Previous Phase Output Access

| Attribute        | Value                        |
| ---------------- | ---------------------------- |
| **ID**           | FR-CM-005                    |
| **Title**        | Previous Phase Output Access |
| **Priority**     | High                         |
| **Implements**   | HL-CM-001                    |
| **Dependencies** | FR-CM-001                    |

**Requirement**:
The system SHALL provide access to previous phase outputs for context building and expression evaluation so that subsequent phases can reference earlier results.

**Acceptance Criteria**:

```gherkin
Feature: Previous Phase Output Access

  Scenario: Context can reference phase outputs by name
    Given phase "analyze" completed with structured output
    When the Context Manager builds context referencing "analyze"
    Then the output from "analyze" SHALL be accessible

  Scenario: Unnamed phase outputs accessible by command name
    Given phase with command "lint" completed
    When the Context Manager references "lint" output
    Then the output SHALL be accessible by command name "lint"

  Scenario: Phase outputs are accessible as objects
    Given phase "analyze" output is {"complexity": "high", "files": 42}
    When the Context Manager loads the output
    Then it SHALL be accessible as a structured object

  Scenario: Structured outputs support property access
    Given phase output has property "analyze.complexity"
    When context references "analyze.complexity"
    Then the value "high" SHALL be returned

  Scenario: Missing outputs are handled according to configuration
    Given phase "optional-step" did not execute
    When context references "optional-step" output
    Then the system SHALL return undefined or error based on configuration
```

**Rationale**:
Later phases often need to access results from previous phases to make decisions or continue work based on earlier analysis.

---

#### FR-CM-006: Environment Variable Inclusion

| Attribute        | Value                          |
| ---------------- | ------------------------------ |
| **ID**           | FR-CM-006                      |
| **Title**        | Environment Variable Inclusion |
| **Priority**     | Medium                         |
| **Implements**   | HL-CM-001                      |
| **Dependencies** | FR-CM-001                      |

**Requirement**:
The system SHALL include environment variables in phase context so that phases can access environment-specific configuration.

**Acceptance Criteria**:

```gherkin
Feature: Environment Variable Inclusion

  Scenario: Phase definition can list needed environment variables
    Given a phase specifies environment variables ["NODE_ENV", "API_URL"]
    When the workflow is loaded
    Then the phase SHALL have environment requirements registered

  Scenario: System includes specified variables in context
    Given phase requires environment variable "API_URL"
    And API_URL is set to "https://api.example.com"
    When the Context Manager builds context
    Then the context SHALL include API_URL with value "https://api.example.com"

  Scenario: Missing optional environment variables are handled gracefully
    Given phase requests optional environment variable "DEBUG_MODE"
    And DEBUG_MODE is not set
    When the Context Manager builds context
    Then the context SHALL not fail
    And DEBUG_MODE SHALL be omitted or set to null

  Scenario: Missing required environment variables cause clear errors
    Given phase requires environment variable "API_KEY"
    And API_KEY is not set
    When the Context Manager builds context
    Then the system SHALL fail with error identifying missing "API_KEY"
```

**Rationale**:
Phases may need access to environment-specific configuration such as API endpoints, feature flags, or deployment settings.

---

#### FR-CM-007: Task Metadata Inclusion

| Attribute        | Value                   |
| ---------------- | ----------------------- |
| **ID**           | FR-CM-007               |
| **Title**        | Task Metadata Inclusion |
| **Priority**     | Medium                  |
| **Implements**   | HL-CM-001               |
| **Dependencies** | FR-CM-001               |

**Requirement**:
The system SHALL include task metadata in phase context so that phases have access to task identification and tracking information.

**Acceptance Criteria**:

```gherkin
Feature: Task Metadata Inclusion

  Scenario: Context includes task identifier
    Given task "TASK-456" is executing
    When the Context Manager builds context
    Then the context SHALL include task_id "TASK-456"

  Scenario: Context includes task timestamp
    Given task was created at "2025-01-15T10:30:00Z"
    When the Context Manager builds context
    Then the context SHALL include created_at timestamp

  Scenario: Context includes workflow name
    Given workflow "feature-implementation" is executing
    When the Context Manager builds context
    Then the context SHALL include workflow_name "feature-implementation"

  Scenario: Metadata is consistently formatted
    Given multiple phases execute within a task
    When the Context Manager builds context for each phase
    Then the metadata format SHALL be consistent across all phases
```

**Rationale**:
Phases may need task metadata for logging, tracking, or including in outputs such as commit messages or documentation.

---

### 2.3 Context Building

This section defines how to assemble complete context from resolved sources.

---

#### FR-CM-008: Workflow Context Assembly

| Attribute        | Value                     |
| ---------------- | ------------------------- |
| **ID**           | FR-CM-008                 |
| **Title**        | Workflow Context Assembly |
| **Priority**     | Critical                  |
| **Implements**   | HL-CM-001                 |
| **Dependencies** | FR-CM-001, FR-CM-002      |

**Requirement**:
The system SHALL execute commands within workflow context including task ID, phase information, and previous step outputs so that providers have complete context for execution.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Context Assembly

  Scenario: Context includes task identification
    Given a workflow is executing for task "TASK-123"
    When the Context Manager builds context for a command
    Then the context SHALL include the task ID "TASK-123"

  Scenario: Context includes phase information
    Given a workflow with 5 phases is executing
    And the current phase is phase 3
    When the Context Manager builds context for the current phase
    Then the context SHALL include current phase number 3
    And the context SHALL include total phases 5

  Scenario: Context includes previous step outputs
    Given phase "plan" has completed with output "Implementation plan created"
    When the Context Manager builds context for phase "implement"
    And phase "implement" depends on phase "plan"
    Then the context SHALL include the output from phase "plan"

  Scenario: Context includes command template
    Given a command template "implement.md" exists
    When the Context Manager builds context for the "implement" command
    Then the context SHALL include the fully rendered command prompt
```

**Rationale**:
Providers need full workflow context to make intelligent decisions and maintain continuity across multi-step workflows.

---

#### FR-CM-009: Execution Context Building

| Attribute        | Value                      |
| ---------------- | -------------------------- |
| **ID**           | FR-CM-009                  |
| **Title**        | Execution Context Building |
| **Priority**     | Critical                   |
| **Implements**   | HL-CM-001                  |
| **Dependencies** | FR-CM-008                  |

**Requirement**:
The system SHALL build execution context including task information, previous step outputs, and command templates so that providers have all necessary information for execution.

**Acceptance Criteria**:

```gherkin
Feature: Execution Context Building

  Scenario: Context includes task and working directory
    Given a task "TASK-456" in project "/home/user/myproject"
    When the Context Manager builds execution context
    Then the context SHALL include task ID "TASK-456"
    And the context SHALL include working directory "/home/user/myproject"

  Scenario: Context includes previous step outputs and session IDs
    Given phase "analyze" completed with session ID "sess-abc-123"
    And phase "analyze" produced output "Analysis complete"
    When the Context Manager builds context for the next phase
    Then the context SHALL include the session ID "sess-abc-123"
    And the context SHALL include the output "Analysis complete"

  Scenario: Context includes provider configuration
    Given the workflow specifies provider "claude" with model "sonnet"
    When the Context Manager builds execution context
    Then the context SHALL include provider "claude"
    And the context SHALL include model "sonnet"
```

**Rationale**:
Providers need comprehensive context to execute commands correctly within multi-step workflows.

---

#### FR-CM-010: Context Block Appending

| Attribute        | Value                   |
| ---------------- | ----------------------- |
| **ID**           | FR-CM-010               |
| **Title**        | Context Block Appending |
| **Priority**     | Critical                |
| **Implements**   | HL-CM-001               |
| **Dependencies** | FR-CM-008, FR-CM-009    |

**Requirement**:
The system SHALL append context blocks to command prompts before execution so that commands receive all specified context in a structured format.

**Acceptance Criteria**:

```gherkin
Feature: Context Block Appending

  Scenario: Context is appended after command template
    Given a command template with prompt "Implement the feature"
    And context includes phase output from "plan"
    When the Context Manager builds the final prompt
    Then the context SHALL appear after the command template

  Scenario: Context uses clear delimiters
    Given context includes multiple items
    When the Context Manager formats the context
    Then each context item SHALL have clear opening and closing delimiters

  Scenario: Context includes source identification
    Given context includes file "docs/spec.md"
    When the Context Manager formats the context
    Then the context SHALL identify the source as "docs/spec.md"

  Scenario: Multiple context items are properly separated
    Given context includes 3 different items
    When the Context Manager formats the context
    Then each item SHALL be visually separated from others
    And the separation SHALL be consistent across all items

  Scenario: Context appending happens before provider execution
    Given a command with context dependencies
    When the command is about to execute
    Then the Context Manager SHALL complete context appending
    And the prompt sent to provider SHALL include all context
```

**Rationale**:
Commands need to receive context in a structured, parseable format to make use of previous outputs and project files.

---

### 2.4 Context Formatting

This section defines how context is structured and tagged for consumption.

---

#### FR-CM-011: Automatic Context Tag Generation

| Attribute        | Value                            |
| ---------------- | -------------------------------- |
| **ID**           | FR-CM-011                        |
| **Title**        | Automatic Context Tag Generation |
| **Priority**     | Medium                           |
| **Implements**   | HL-CM-001                        |
| **Dependencies** | FR-CM-010                        |

**Requirement**:
The system SHALL generate context tags automatically based on source type so that context items are identifiable in prompts without manual tag specification.

**Acceptance Criteria**:

```gherkin
Feature: Automatic Context Tag Generation

  Scenario: Phase outputs use phase name as tag
    Given phase "analyze" produces output
    When the Context Manager generates a tag for the phase output
    Then the tag SHALL be "analyze"

  Scenario: Single files use basename without extension as tag
    Given context includes file "docs/architecture.md"
    When the Context Manager generates a tag for the file
    Then the tag SHALL be "architecture"

  Scenario: Multiple files use directory name as tag
    Given context includes glob pattern "src/components/*.tsx"
    And the pattern matches multiple files
    When the Context Manager generates a tag for the file group
    Then the tag SHALL be "components"

  Scenario: Glob patterns use parent directory name as tag
    Given context includes glob pattern "tests/**/*.test.ts"
    When the Context Manager generates a tag for the glob result
    Then the tag SHALL be "tests"

  Scenario: Generated tag names are valid identifiers
    Given a file path "docs/my-special-file.md"
    When the Context Manager generates a tag
    Then the tag SHALL contain only alphanumeric characters and underscores
    And the tag SHALL be "my_special_file"
```

**Rationale**:
Automatic tag generation creates consistent, predictable context organization without requiring manual tag specification in workflow definitions.

---

#### FR-CM-012: Multiple File Concatenation with Headers

| Attribute        | Value                                    |
| ---------------- | ---------------------------------------- |
| **ID**           | FR-CM-012                                |
| **Title**        | Multiple File Concatenation with Headers |
| **Priority**     | Medium                                   |
| **Implements**   | HL-CM-001                                |
| **Dependencies** | FR-CM-004, FR-CM-010                     |

**Requirement**:
The system SHALL separate multiple files with headers when concatenating so that commands can distinguish between different source files.

**Acceptance Criteria**:

```gherkin
Feature: Multiple File Concatenation with Headers

  Scenario: Each file is preceded by header with filename
    Given context includes files "src/a.ts" and "src/b.ts"
    When the Context Manager concatenates the files
    Then "src/a.ts" content SHALL be preceded by a header identifying "src/a.ts"
    And "src/b.ts" content SHALL be preceded by a header identifying "src/b.ts"

  Scenario: Files are separated by visual dividers
    Given context includes 3 files
    When the Context Manager concatenates the files
    Then each file SHALL be separated by horizontal rules or whitespace

  Scenario: Headers identify original file path
    Given context includes file "src/components/Button.tsx"
    When the Context Manager generates the header
    Then the header SHALL include the full path "src/components/Button.tsx"

  Scenario: Concatenation preserves file order
    Given context specifies files in order ["a.ts", "b.ts", "c.ts"]
    When the Context Manager concatenates the files
    Then the output SHALL contain files in the same order

  Scenario: Headers do not interfere with file content
    Given a file contains code with comment syntax
    When the Context Manager adds headers
    Then the headers SHALL use a format that doesn't break the file content
    And the headers SHALL be clearly distinguishable from file content
```

**Rationale**:
When loading multiple files, headers help commands understand which content came from which file, enabling more accurate analysis.

---

#### FR-CM-013: Context Shorthand Notation

| Attribute        | Value                      |
| ---------------- | -------------------------- |
| **ID**           | FR-CM-013                  |
| **Title**        | Context Shorthand Notation |
| **Priority**     | Medium                     |
| **Implements**   | HL-CM-001                  |
| **Dependencies** | FR-CM-001, FR-CM-002       |

**Requirement**:
The system SHALL support both object notation and shorthand notation for context specification so that workflow authors can use concise syntax for common cases.

**Acceptance Criteria**:

```gherkin
Feature: Context Shorthand Notation

  Scenario: Shorthand notation is parsed into canonical object form
    Given context is specified as "plan"
    When the Context Manager parses the context
    Then it SHALL be interpreted as {type: "phase", name: "plan"}

  Scenario: Shorthand supports type prefixes
    Given context is specified as "file:docs/spec.md"
    When the Context Manager parses the context
    Then it SHALL be interpreted as {type: "file", path: "docs/spec.md"}

  Scenario: Shorthand supports glob prefix
    Given context is specified as "glob:src/**/*.ts"
    When the Context Manager parses the context
    Then it SHALL be interpreted as {type: "glob", pattern: "src/**/*.ts"}

  Scenario: Shorthand supports optional marker
    Given context is specified as "?docs/optional.md"
    When the Context Manager parses the context
    Then it SHALL be interpreted as {type: "file", path: "docs/optional.md", optional: true}

  Scenario: Both notations produce equivalent execution behavior
    Given two workflows with equivalent context in different notations
    When both workflows execute with the same inputs
    Then the resulting context SHALL be identical
```

**Rationale**:
Shorthand notation reduces verbosity for common cases while object notation provides full control when needed.

---

#### FR-CM-014: Structured Context Injection Format

| Attribute        | Value                               |
| ---------------- | ----------------------------------- |
| **ID**           | FR-CM-014                           |
| **Title**        | Structured Context Injection Format |
| **Priority**     | High                                |
| **Implements**   | HL-CM-001                           |
| **Dependencies** | FR-CM-010, FR-CM-011                |

**Requirement**:
The system SHALL generate structured context injection with proper XML-like tagging for clear content boundaries so that AI models can correctly parse and attribute context sources.

**Acceptance Criteria**:

```gherkin
Feature: Structured Context Injection Format

  Scenario: Context items are wrapped in named tags
    Given context includes phase output named "plan"
    When the Context Manager formats the context
    Then the output SHALL be wrapped in tags like "<plan>...</plan>"

  Scenario: File content includes source file comment headers
    Given context includes file "src/main.ts"
    When the Context Manager formats the file content
    Then the content SHALL include a comment header identifying the source

  Scenario: Multiple files are concatenated with clear separators
    Given context includes 3 files from a glob pattern
    When the Context Manager concatenates the files
    Then each file SHALL be clearly separated with identifiable boundaries

  Scenario: Tag structure is consistent and parseable
    Given context includes multiple items of different types
    When the Context Manager formats all context
    Then all items SHALL use consistent tag naming conventions
    And the structure SHALL be programmatically parseable
```

**Rationale**:
Structured context with clear boundaries helps AI models understand and correctly attribute different context sources.

---

### 2.5 Validation & Requirements

This section defines how required and optional context items are handled.

---

#### FR-CM-015: Optional Context Item Support

| Attribute      | Value                         |
| -------------- | ----------------------------- |
| **ID**         | FR-CM-015                     |
| **Title**      | Optional Context Item Support |
| **Priority**   | High                          |
| **Implements** | HL-CM-004                     |

**Requirement**:
The system SHALL support optional context items that don't fail workflows if missing so that workflows can gracefully handle missing optional data.

**Acceptance Criteria**:

```gherkin
Feature: Optional Context Item Support

  Scenario: Workflows can mark context items as optional
    Given a workflow phase specifies context item "docs/optional-spec.md"
    And the context item is marked as optional
    When the workflow is loaded
    Then the context item SHALL be registered as optional

  Scenario: Missing optional items are skipped silently
    Given context item "docs/optional.md" is marked optional
    And the file does not exist
    When the Context Manager builds context
    Then the system SHALL skip the missing item
    And the system SHALL NOT raise an error

  Scenario: Missing optional items don't appear in context
    Given optional context item "extra-info.md" is missing
    When the Context Manager builds final context
    Then the context SHALL NOT include a placeholder for "extra-info.md"

  Scenario: System logs when optional items are skipped
    Given optional context item "missing.md" does not exist
    When the Context Manager skips the item
    Then the system SHALL log that "missing.md" was skipped
    And the log level SHALL be DEBUG or INFO

  Scenario: Required items still fail workflows if missing
    Given context item "required-spec.md" is marked required
    And the file does not exist
    When the Context Manager builds context
    Then the system SHALL fail with an error
```

**Rationale**:
Not all context is essential for every execution. Optional items enable flexible workflows that adapt to available data.

---

#### FR-CM-016: Required Context Item Validation

| Attribute        | Value                            |
| ---------------- | -------------------------------- |
| **ID**           | FR-CM-016                        |
| **Title**        | Required Context Item Validation |
| **Priority**     | Critical                         |
| **Implements**   | HL-CM-004                        |
| **Dependencies** | FR-CM-015                        |

**Requirement**:
The system SHALL validate required context items and fail workflows with clear errors if missing so that workflows fail fast when essential context is unavailable.

**Acceptance Criteria**:

```gherkin
Feature: Required Context Item Validation

  Scenario: Validate all required context items before execution
    Given workflow phase has 3 required context items
    When the Context Manager prepares context
    Then the system SHALL validate all 3 items exist before proceeding

  Scenario: Missing required items cause immediate workflow failure
    Given required context item "spec.md" does not exist
    When the Context Manager validates context
    Then the workflow SHALL fail immediately
    And the system SHALL NOT attempt to execute the phase

  Scenario: Error messages identify which context item is missing
    Given required context item "architecture.md" is missing
    When the validation fails
    Then the error message SHALL include "architecture.md"

  Scenario: Error messages include expected file path
    Given required file "docs/spec.md" is missing
    And project root is "/home/user/project"
    When the validation fails
    Then the error SHALL include path "/home/user/project/docs/spec.md"

  Scenario: Error messages include troubleshooting guidance
    Given required context item is missing
    When the validation fails
    Then the error message SHALL suggest how to resolve the issue
    And the error SHALL mention how to mark items as optional if appropriate
```

**Rationale**:
Missing required context causes confusing failures later in execution. Early validation provides clear, actionable errors.

---

#### FR-CM-017: Context Error Messaging

| Attribute        | Value                   |
| ---------------- | ----------------------- |
| **ID**           | FR-CM-017               |
| **Title**        | Context Error Messaging |
| **Priority**     | High                    |
| **Implements**   | HL-CM-004               |
| **Dependencies** | FR-CM-016               |

**Requirement**:
The system SHALL provide clear error messages when required context is not found including expected path and troubleshooting steps so that users can resolve context issues.

**Acceptance Criteria**:

```gherkin
Feature: Context Error Messaging

  Scenario: Error messages identify missing context item by name
    Given required context item named "feature-spec" is missing
    When the error is generated
    Then the error message SHALL include name "feature-spec"

  Scenario: Error messages include expected file path
    Given file context item "docs/api.md" is missing
    When the error is generated
    Then the error message SHALL include expected path "docs/api.md"

  Scenario: Error messages indicate context item type
    Given phase output reference "plan.output" cannot be resolved
    When the error is generated
    Then the error message SHALL indicate this is a "phase output reference"
    And the error SHALL differ from file reference errors

  Scenario: Error messages include troubleshooting steps
    Given required file "spec.md" is missing
    When the error is generated
    Then the error message SHALL suggest creating the file
    Or the error message SHALL suggest updating the workflow definition

  Scenario: Error messages explain how to mark items as optional
    Given a required context item fails validation
    When the error is generated
    Then the error message SHALL explain the optional flag syntax
```

**Rationale**:
Context resolution failures are common during workflow development. Clear errors enable rapid troubleshooting.

---

#### FR-CM-018: Context Variable Declarations

| Attribute        | Value                         |
| ---------------- | ----------------------------- |
| **ID**           | FR-CM-018                     |
| **Title**        | Context Variable Declarations |
| **Priority**     | Medium                        |
| **Implements**   | HL-CM-004                     |
| **Dependencies** | FR-CM-015, FR-CM-016          |

**Requirement**:
Commands SHALL support required and optional context variable declarations for explicit dependency specification.

**Acceptance Criteria**:

```gherkin
Feature: Context Variable Declarations

  Scenario: Commands can specify required_context array
    Given command template declares required_context ["task_id", "spec"]
    When the command is loaded
    Then the system SHALL register "task_id" as required
    And the system SHALL register "spec" as required

  Scenario: Commands can specify optional_context array
    Given command template declares optional_context ["previous_output"]
    When the command is loaded
    Then the system SHALL register "previous_output" as optional

  Scenario: System validates required context is available before execution
    Given command requires context variable "implementation_plan"
    And "implementation_plan" is not available
    When the Context Manager prepares to execute the command
    Then the system SHALL fail validation before execution

  Scenario: Missing required context produces clear error message
    Given command requires context "spec" which is missing
    When validation fails
    Then the error SHALL identify "spec" as the missing required context
    And the error SHALL reference the command that requires it
```

**Rationale**:
Explicit context declarations make command dependencies clear and enable pre-execution validation.

---

### 2.6 Size Management

This section defines how context size is managed to stay within limits.

---

#### FR-CM-019: Output Truncation

| Attribute        | Value             |
| ---------------- | ----------------- |
| **ID**           | FR-CM-019         |
| **Title**        | Output Truncation |
| **Priority**     | Medium            |
| **Implements**   | HL-CM-001         |
| **Dependencies** | FR-CM-010         |

**Requirement**:
The system SHALL truncate large outputs in context to prevent excessive prompt sizes so that context remains within provider token limits.

**Acceptance Criteria**:

```gherkin
Feature: Output Truncation

  Scenario: System applies maximum length limit to outputs
    Given a phase output exceeds 10000 characters
    And the truncation limit is set to 5000 characters
    When the Context Manager includes the output in context
    Then the included output SHALL be at most 5000 characters

  Scenario: System preserves most recent output when truncating
    Given a phase output of 10000 characters needs truncation
    When the Context Manager truncates to 5000 characters
    Then the preserved content SHALL be from the end of the output

  Scenario: System indicates when output has been truncated
    Given a phase output is truncated
    When the Context Manager formats the context
    Then the context SHALL include an indicator that truncation occurred
    And the indicator SHALL show original and truncated sizes

  Scenario: Truncation limit is configurable
    Given truncation limit is configured to 8000 characters
    When the Context Manager truncates output
    Then the limit of 8000 characters SHALL be respected

  Scenario: Full output is available in artifact files
    Given a phase output was truncated in context
    When a user needs the full output
    Then the complete output SHALL be available in the artifact files
```

**Rationale**:
Very large outputs can bloat context and exceed token limits. Truncation keeps context manageable while preserving the most relevant recent output.

---

#### FR-CM-020: Output Limiting for Large Contexts

| Attribute        | Value                              |
| ---------------- | ---------------------------------- |
| **ID**           | FR-CM-020                          |
| **Title**        | Output Limiting for Large Contexts |
| **Priority**     | Medium                             |
| **Implements**   | HL-CM-001                          |
| **Dependencies** | FR-CM-019                          |

**Requirement**:
The system SHALL support output limiting to prevent excessively large context so that prompts remain within provider token limits.

**Acceptance Criteria**:

```gherkin
Feature: Output Limiting for Large Contexts

  Scenario: Workflows can specify maximum lines for phase outputs
    Given a workflow phase specifies "maxOutputLines: 100"
    When the phase output has 500 lines
    Then only 100 lines SHALL be included in context

  Scenario: System truncates outputs exceeding the limit
    Given maxOutputLines is 50
    And phase output has 200 lines
    When the Context Manager builds context
    Then the output SHALL be truncated to 50 lines

  Scenario: System preserves most recent lines when truncating
    Given output has lines 1-200
    And maxOutputLines is 50
    When the Context Manager truncates
    Then lines 151-200 SHALL be preserved

  Scenario: System indicates when output has been truncated by lines
    Given output is truncated from 500 to 100 lines
    When the Context Manager formats the context
    Then a message SHALL indicate "Truncated from 500 to 100 lines"

  Scenario: Full output remains available in artifact files
    Given output was line-limited in context
    When the full output is needed
    Then it SHALL be retrievable from the artifact storage
```

**Rationale**:
Some commands produce very large outputs. Line limiting prevents context from exceeding token limits while preserving recent, relevant content.

---

### 2.7 Context Loading

This section defines how context is loaded from previous phase outputs stored by State Manager.

---

#### FR-CM-022: Context Loading from Dependencies

| Attribute        | Value                             |
| ---------------- | --------------------------------- |
| **ID**           | FR-CM-022                         |
| **Title**        | Context Loading from Dependencies |
| **Priority**     | Critical                          |
| **Implements**   | HL-CM-002                         |
| **Dependencies** | FR-CM-009                         |

**Requirement**:
The system SHALL load context from previous phases for commands with dependencies so that dependent commands have access to predecessor outputs.

**Acceptance Criteria**:

```gherkin
Feature: Context Loading from Dependencies

  Scenario: Identify command dependencies from workflow definition
    Given workflow defines phase "implement" with dependency "plan"
    When the Context Manager prepares context for "implement"
    Then the system SHALL identify "plan" as a dependency

  Scenario: Load outputs from dependency phases
    Given phase "plan" completed with output stored at ".flowmaster/tasks/TASK-123/plan/output.json"
    And phase "implement" depends on "plan"
    When the Context Manager loads dependency context
    Then the system SHALL load output from "plan"

  Scenario: Include dependency outputs in command context
    Given dependency "plan" has output "Create user authentication module"
    When the Context Manager builds context for "implement"
    Then the context SHALL include dependency output under key "plan"

  Scenario: Fail gracefully if dependency context is missing
    Given phase "implement" depends on "plan"
    And phase "plan" has no persisted output
    When the Context Manager attempts to load dependency context
    Then the system SHALL fail with clear error message
    And the error SHALL identify missing dependency "plan"

  Scenario: Format dependency context for provider consumption
    Given dependency outputs are loaded
    When the Context Manager builds final context
    Then the dependency context SHALL be formatted consistently
    And the context SHALL use clear section markers
```

**Rationale**:
Workflow phases often depend on outputs from previous phases. Context loading enables this dependency chain.

---

### 2.8 Expression Access

This section defines how context is accessed in expressions and conditions.

---

#### FR-CM-024: Environment Variable Access for Expressions

| Attribute        | Value                                       |
| ---------------- | ------------------------------------------- |
| **ID**           | FR-CM-024                                   |
| **Title**        | Environment Variable Access for Expressions |
| **Priority**     | High                                        |
| **Implements**   | HL-CM-001                                   |
| **Dependencies** | FR-CM-006                                   |

**Requirement**:
The system SHALL provide access to environment variables via a dedicated namespace so that expressions and conditions can reference environment configuration.

**Acceptance Criteria**:

```gherkin
Feature: Environment Variable Access for Expressions

  Scenario: Expressions can reference environment variables
    Given environment variable NODE_ENV is "production"
    When an expression references env.NODE_ENV
    Then the value "production" SHALL be returned

  Scenario: Environment variables accessible via 'env' namespace
    Given expression uses "env.API_URL"
    When the expression is evaluated
    Then the system SHALL look up API_URL from environment

  Scenario: Environment namespace is separate from phase outputs
    Given phase output "env" exists with different data
    And environment variable "env.DEBUG" is set
    When expression references "env.DEBUG"
    Then the environment variable SHALL be returned, not phase data

  Scenario: Missing environment variables are handled gracefully
    Given environment variable OPTIONAL_VAR is not set
    When expression references env.OPTIONAL_VAR
    Then the value SHALL be undefined
    And the expression SHALL not throw an error
```

**Rationale**:
Expressions and conditions may depend on environment configuration, such as checking deployment environment before executing certain phases.

---

#### FR-CM-025: Workflow Context Access for Expressions

| Attribute        | Value                                   |
| ---------------- | --------------------------------------- |
| **ID**           | FR-CM-025                               |
| **Title**        | Workflow Context Access for Expressions |
| **Priority**     | Medium                                  |
| **Implements**   | HL-CM-001                               |
| **Dependencies** | FR-CM-008                               |

**Requirement**:
The system SHALL provide access to workflow execution context via a dedicated namespace so that expressions can reference workflow state.

**Acceptance Criteria**:

```gherkin
Feature: Workflow Context Access for Expressions

  Scenario: Expressions can reference current phase index
    Given workflow is on phase 3 of 5
    When expression references workflow.currentPhaseIndex
    Then the value 3 SHALL be returned

  Scenario: Expressions can reference retry count
    Given current phase has been retried 2 times
    When expression references workflow.retryCount
    Then the value 2 SHALL be returned

  Scenario: Workflow context accessible via 'workflow' namespace
    Given expression uses "workflow.name"
    When the expression is evaluated
    Then the workflow name SHALL be returned

  Scenario: Workflow namespace provides execution metadata
    Given workflow is executing
    When expression references workflow.startTime
    Then the workflow start timestamp SHALL be returned
```

**Rationale**:
Expressions may need to check workflow execution state, such as phase progress or retry counts, to make dynamic decisions.

---

#### FR-CM-029: Field Access Syntax for Previous Outputs

| Attribute         | Value                                    |
| ----------------- | ---------------------------------------- |
| **ID**            | FR-CM-029                                |
| **Title**         | Field Access Syntax for Previous Outputs |
| **Priority**      | High                                     |
| **Implements**    | HL-VL-002                                |
| **Migrated From** | FR-VL-005 (Validation Manager)           |

**Requirement**:
The system SHALL support field access syntax for referencing specific fields from previous phase outputs so that workflows can use individual data elements.

**Acceptance Criteria**:

```gherkin
Scenario: Dot notation field access
  Given previous output {"result": {"status": "success"}}
  When I reference "plan.result.status"
  Then the value "success" should be returned

Scenario: Array index access
  Given previous output {"items": ["a", "b", "c"]}
  When I reference "plan.items[1]"
  Then the value "b" should be returned

Scenario: Field reference in context
  Given a phase context specification using "{{plan.status}}"
  When context is built
  Then the field value should be substituted

Scenario: Field reference in conditions
  Given a condition "plan.error_count > 0"
  When the condition is evaluated
  Then the field should be resolved before comparison

Scenario: Invalid field reference validated
  Given a workflow referencing "plan.nonexistent"
  When the workflow is validated
  Then a warning should be issued about potentially invalid reference
```

**Rationale**:
Workflows need to reference specific fields from previous outputs for conditionals and context building. Field access syntax enables this.

---

### 2.9 Cross-Boundary Context Passing

This section defines advanced context passing across workflow boundaries.

---

#### FR-CM-026: Context Accumulation Across Phases

| Attribute        | Value                              |
| ---------------- | ---------------------------------- |
| **ID**           | FR-CM-026                          |
| **Title**        | Context Accumulation Across Phases |
| **Priority**     | High                               |
| **Implements**   | HL-CM-002                          |
| **Dependencies** | FR-CM-022                          |

**Requirement**:
The system SHALL accumulate context as phases complete so that later phases and workflow agents have access to all previous results.

**Acceptance Criteria**:

```gherkin
Feature: Context Accumulation Across Phases

  Scenario: Workflow agent receives output from each completed phase
    Given phases "plan", "implement", "test" complete sequentially
    When the workflow agent context is queried
    Then it SHALL include outputs from all three phases

  Scenario: Accumulated context is available when answering questions
    Given a command agent asks a question
    And workflow agent has accumulated context from 5 phases
    When the workflow agent processes the question
    Then it SHALL have access to all 5 phase outputs

  Scenario: Context includes all phase outputs and decisions
    Given phase "analyze" made decision "use-typescript"
    When the context is accumulated
    Then the decision "use-typescript" SHALL be included

  Scenario: Context flows down to commands via dependencies
    Given phase "implement" depends on "plan" and "analyze"
    When the Context Manager builds context for "implement"
    Then outputs from both "plan" and "analyze" SHALL be included
```

**Rationale**:
Workflow agents accumulate context from all phase executions, enabling them to provide answers that consider previous results and maintain continuity across the workflow.

---

#### FR-CM-027: Cross-Workflow Context Passing

| Attribute        | Value                          |
| ---------------- | ------------------------------ |
| **ID**           | FR-CM-027                      |
| **Title**        | Cross-Workflow Context Passing |
| **Priority**     | High                           |
| **Implements**   | HL-CM-002                      |
| **Dependencies** | FR-CM-026                      |

**Requirement**:
The system SHALL pass context and data between workflows via uses: references so that workflows can share data and coordinate their work.

**Acceptance Criteria**:

```gherkin
Feature: Cross-Workflow Context Passing

  Scenario: Workflows can specify input variables from parent workflow context
    Given parent workflow has context variable "targetVersion"
    And child workflow specifies input "version" from parent.targetVersion
    When the child workflow executes
    Then it SHALL receive "targetVersion" as "version"

  Scenario: Workflows can export output variables to parent workflow context
    Given child workflow completes with output "releaseNotes"
    And child workflow specifies export "releaseNotes" to parent context
    When the child workflow completes
    Then parent workflow context SHALL include "releaseNotes"

  Scenario: Exported outputs are accessible to subsequent workflows
    Given workflow-A exports "analysisResult" via uses: composition
    When workflow-B executes after workflow-A
    Then workflow-B SHALL have access to "analysisResult"

  Scenario: Context uses namespacing to avoid variable collisions
    Given workflow-A and workflow-B both have output named "result"
    When both workflows export via uses: composition
    Then parent SHALL namespace as "workflowA.result" and "workflowB.result"

  Scenario: Context supports dot notation for nested access
    Given parent workflow context has "deploy.config.environment"
    When child workflow references "parent.deploy.config.environment"
    Then the nested value SHALL be returned
```

**Rationale**:
Workflows composed via uses: need to share data and coordinate their work through a shared context mechanism.

---

#### FR-CM-028: Sub-Workflow Context Passing

| Attribute        | Value                        |
| ---------------- | ---------------------------- |
| **ID**           | FR-CM-028                    |
| **Title**        | Sub-Workflow Context Passing |
| **Priority**     | Low                          |
| **Implements**   | HL-CM-002                    |
| **Dependencies** | FR-CM-027                    |

**Requirement**:
The system SHALL support context passing between parent and sub-workflows so that nested workflows can access parent context and return results.

**Acceptance Criteria**:

```gherkin
Feature: Sub-Workflow Context Passing

  Scenario: Sub-workflows can inherit parent workflow context
    Given parent workflow has context variable "projectName"
    When a sub-workflow is invoked
    Then the sub-workflow SHALL have access to "projectName"

  Scenario: Sub-workflows can specify additional context
    Given sub-workflow defines additional context items
    When the sub-workflow executes
    Then it SHALL have both inherited and additional context

  Scenario: Parent workflows can access aggregated sub-workflow outputs
    Given sub-workflow "analyze-module" completes with output
    When parent workflow continues
    Then parent SHALL have access to sub-workflow output

  Scenario: Context inheritance is properly scoped
    Given sub-workflow modifies a context variable
    When sub-workflow completes
    Then parent context SHALL not be affected unless explicitly exported

  Scenario: Context passing works for parallel sub-workflows
    Given parent invokes 3 sub-workflows in parallel
    When all sub-workflows complete
    Then parent SHALL have access to outputs from all 3
```

**Rationale**:
Complex workflows may use sub-workflows for task delegation. Context passing enables sub-workflows to access parent data and return results.

---

## 3. Error Handling

> **Note**: All errors use the canonical error codes and reason codes defined in the [Error Types Shared Schema](../integration/schemas/00-error-types.md).

### 3.1 Error Scenarios

| Error Code            | Reason Code                    | Scenario                         | Severity | Recovery Action                        |
| --------------------- | ------------------------------ | -------------------------------- | -------- | -------------------------------------- |
| `NOT_FOUND`           | `CONTEXT_FILE_NOT_FOUND`       | Required file not found          | Error    | Fail with path and suggestions         |
| `NOT_FOUND`           | `PHASE_OUTPUT_NOT_FOUND`       | Required phase output not found  | Error    | Fail with phase name and suggestions   |
| `INVALID_ARGUMENT`    | `INVALID_GLOB_PATTERN`         | Invalid glob pattern             | Error    | Fail with pattern and syntax guidance  |
| `PERMISSION_DENIED`   | `FILE_READ_DENIED`             | File read permission denied      | Error    | Fail with path and permission guidance |
| `FAILED_PRECONDITION` | `CIRCULAR_DEPENDENCY_DETECTED` | Circular dependency detected     | Error    | Fail with dependency chain             |
| `OUT_OF_RANGE`        | `CONTEXT_SIZE_EXCEEDED`        | Context size exceeds limit       | Warning  | Truncate with notification             |
| `INVALID_ARGUMENT`    | `INVALID_CONTEXT_REFERENCE`    | Invalid context reference format | Error    | Fail with format guidance              |
| `NOT_FOUND`           | `TASK_REFERENCE_FAILED`        | Task reference resolution failed | Error    | Fail with task ID and guidance         |

### 3.2 Retry Behavior

| Condition                 | Retry? | Max Attempts | Backoff Strategy         |
| ------------------------- | ------ | ------------ | ------------------------ |
| File read transient error | Yes    | 3            | Exponential (100ms base) |
| Glob pattern timeout      | Yes    | 2            | Linear (500ms)           |
| State Manager unavailable | Yes    | 3            | Exponential (200ms base) |
| Invalid context reference | No     | -            | -                        |
| Missing required item     | No     | -            | -                        |
| Permission denied         | No     | -            | -                        |

### 3.3 Error Response Format

All Context Manager errors follow the standard error response format from SCH-001:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Required phase output not found",
    "httpStatus": 404,
    "isRetryable": false,
    "timestamp": "2025-11-29T10:30:00Z",
    "requestId": "req-abc123",
    "details": {
      "reason": "PHASE_OUTPUT_NOT_FOUND",
      "domain": "context-manager",
      "metadata": {
        "contextItem": "plan_output",
        "type": "phase",
        "expected": "plan",
        "actual": "not found"
      }
    }
  }
}
```

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface            | Provider Component     | Purpose                                        |
| -------------------- | ---------------------- | ---------------------------------------------- |
| Phase Output Loading | COMP-003 State Manager | Retrieve previous phase outputs and task state |
| Task Details Loading | COMP-006 Task Manager  | Get task details for context building          |

### 4.2 Provided Interfaces (For Other Components)

| Interface          | Consumer Component(s)   | Purpose                                        |
| ------------------ | ----------------------- | ---------------------------------------------- |
| Context Building   | COMP-007 Agent Executor | Build complete execution context for commands  |
| Context Loading    | COMP-007 Agent Executor | Load context from previous phases              |
| Context Validation | COMP-008 Orchestrator   | Validate context requirements before execution |

---

## 5. Data Requirements

### 5.1 Managed Entities

| Entity           | Description                              | Storage             |
| ---------------- | ---------------------------------------- | ------------------- |
| ExecutionContext | Complete context for a command execution | JSON file per phase |
| PhaseOutput      | Output from completed phase              | JSON file per phase |
| ContextMetadata  | Metadata about context build             | Embedded in context |

### 5.2 Storage Structure

```
.flowmaster/
└── tasks/
    └── {taskId}/
        └── {phaseName}/
            ├── context.json      # Input context for phase
            ├── output.json       # Phase output
            └── metadata.json     # Execution metadata
```

### 5.3 Data Formats

#### context.json

```json
{
  "taskId": "TASK-123",
  "phaseName": "implement",
  "phaseIndex": 2,
  "totalPhases": 5,
  "workingDirectory": "/home/user/project",
  "renderedPrompt": "...",
  "dependencies": {
    "plan": "Implementation plan content..."
  },
  "files": {
    "docs/spec.md": "Specification content..."
  },
  "metadata": {
    "builtAt": "2025-11-25T10:30:00Z",
    "contextVersion": "1.0",
    "itemsLoaded": 5,
    "itemsSkipped": 1
  }
}
```

---

## 6. Traceability

### 6.1 HL to FR Mapping

| HL Requirement | Functional Requirements                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HL-CM-001      | FR-CM-001, FR-CM-002, FR-CM-003, FR-CM-004, FR-CM-005, FR-CM-006, FR-CM-007, FR-CM-008, FR-CM-009, FR-CM-010, FR-CM-011, FR-CM-012, FR-CM-013, FR-CM-014, FR-CM-019, FR-CM-020, FR-CM-024, FR-CM-025 |
| HL-CM-002      | FR-CM-022, FR-CM-026, FR-CM-027, FR-CM-028                                                                                                                                                           |
| HL-CM-004      | FR-CM-015, FR-CM-016, FR-CM-017, FR-CM-018                                                                                                                                                           |
| HL-VL-002      | FR-CM-029                                                                                                                                                                                            |

---

## 7. Open Questions

| Question ID | Question                                                 | Owner | Target Date | Resolution |
| ----------- | -------------------------------------------------------- | ----- | ----------- | ---------- |
| Q-CM-001    | Should context size limits be configurable per workflow? | TBD   | TBD         | Pending    |
| Q-CM-002    | How should binary files be handled in glob patterns?     | TBD   | TBD         | Pending    |

---

## 8. Requirements Index

| ID        | Title                                       | Priority | Implements | Status |
| --------- | ------------------------------------------- | -------- | ---------- | ------ |
| FR-CM-001 | Context Source Types                        | Critical | HL-CM-001  | Draft  |
| FR-CM-002 | Workflow Context Source Specification       | Critical | HL-CM-001  | Draft  |
| FR-CM-003 | Project File Reference Resolution           | High     | HL-CM-001  | Draft  |
| FR-CM-004 | Glob Pattern Support for Multiple Files     | High     | HL-CM-001  | Draft  |
| FR-CM-005 | Previous Phase Output Access                | High     | HL-CM-001  | Draft  |
| FR-CM-006 | Environment Variable Inclusion              | Medium   | HL-CM-001  | Draft  |
| FR-CM-007 | Task Metadata Inclusion                     | Medium   | HL-CM-001  | Draft  |
| FR-CM-008 | Workflow Context Assembly                   | Critical | HL-CM-001  | Draft  |
| FR-CM-009 | Execution Context Building                  | Critical | HL-CM-001  | Draft  |
| FR-CM-010 | Context Block Appending                     | Critical | HL-CM-001  | Draft  |
| FR-CM-011 | Automatic Context Tag Generation            | Medium   | HL-CM-001  | Draft  |
| FR-CM-012 | Multiple File Concatenation with Headers    | Medium   | HL-CM-001  | Draft  |
| FR-CM-013 | Context Shorthand Notation                  | Medium   | HL-CM-001  | Draft  |
| FR-CM-014 | Structured Context Injection Format         | High     | HL-CM-001  | Draft  |
| FR-CM-015 | Optional Context Item Support               | High     | HL-CM-004  | Draft  |
| FR-CM-016 | Required Context Item Validation            | Critical | HL-CM-004  | Draft  |
| FR-CM-017 | Context Error Messaging                     | High     | HL-CM-004  | Draft  |
| FR-CM-018 | Context Variable Declarations               | Medium   | HL-CM-004  | Draft  |
| FR-CM-019 | Output Truncation                           | Medium   | HL-CM-001  | Draft  |
| FR-CM-020 | Output Limiting for Large Contexts          | Medium   | HL-CM-001  | Draft  |
| FR-CM-022 | Context Loading from Dependencies           | Critical | HL-CM-002  | Draft  |
| FR-CM-024 | Environment Variable Access for Expressions | High     | HL-CM-001  | Draft  |
| FR-CM-025 | Workflow Context Access for Expressions     | Medium   | HL-CM-001  | Draft  |
| FR-CM-026 | Context Accumulation Across Phases          | High     | HL-CM-002  | Draft  |
| FR-CM-027 | Cross-Workflow Context Passing              | High     | HL-CM-002  | Draft  |
| FR-CM-028 | Sub-Workflow Context Passing                | Low      | HL-CM-002  | Draft  |
| FR-CM-029 | Field Access Syntax for Previous Outputs    | High     | HL-VL-002  | Draft  |

---

## 9. Requirements Summary

| Category                      | Count | Critical | High | Medium | Low |
| ----------------------------- | ----- | -------- | ---- | ------ | --- |
| 2.1 Core Context Model        | 2     | 2        | 0    | 0      | 0   |
| 2.2 Context Source Resolution | 5     | 0        | 3    | 2      | 0   |
| 2.3 Context Building          | 3     | 3        | 0    | 0      | 0   |
| 2.4 Context Formatting        | 4     | 0        | 1    | 3      | 0   |
| 2.5 Validation & Requirements | 4     | 1        | 2    | 1      | 0   |
| 2.6 Size Management           | 2     | 0        | 0    | 2      | 0   |
| 2.7 Context Loading           | 1     | 1        | 0    | 0      | 0   |
| 2.8 Expression Access         | 3     | 0        | 2    | 1      | 0   |
| 2.9 Cross-Boundary Passing    | 3     | 0        | 2    | 0      | 1   |
| **Total**                     | 27    | 7        | 10   | 9      | 1   |

---

## Document History

| Version | Date       | Author            | Changes                                                                                                                 |
| ------- | ---------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-25 | Architecture Team | Initial version                                                                                                         |
| 2.0     | 2025-11-26 | Architecture Team | Reorganized for progressive disclosure; renumbered FRs; updated component ID to COMP-005; updated dependency references |
| 3.0     | 2025-12-03 | Claude            | Migrated FR-VL-005 from Validation Manager as FR-CM-029 (Field Access Syntax for Previous Outputs)                      |
