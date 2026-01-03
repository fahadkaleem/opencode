---
# FRONTMATTER - AI-Readable Metadata

document:
  type: 'product_requirements_specification'
  title: 'FlowMaster - Requirements Specification'
  identifier: 'PRD-FLOWMASTER-001'
  version: '1.0.0'
  status: 'draft'
  last_modified: '2025-01-24'

project:
  name: 'FlowMaster'
  purpose: 'AI-powered multi-step workflow orchestration platform'
  target_release: 'TBD'

ownership:
  product_owner: 'TBD'
  technical_lead: 'TBD'

audience:
  - 'product_managers'
  - 'technical_architects'
  - 'developers'
  - 'ai_agents'

keywords:
  - 'workflow_orchestration'
  - 'ai_agents'
  - 'cli_tool'
  - 'state_management'
  - 'provider_abstraction'
---

# FlowMaster: Requirements Specification

> **Document Purpose**: This document specifies all functional and non-functional requirements for FlowMaster extracted from design documents. It defines what the system must do (functional), how well it must perform (non-functional), and what constraints govern implementation (business constraints).

---

## 1. Executive Summary

**Business Context:**
FlowMaster is an AI-powered developer workflow CLI that orchestrates multi-step development tasks through workflows. The system combines sequential and parallel command execution with state machines, provider abstraction, interactive UI, and persistent state management.

**Technical Approach:**
FlowMaster provides a workflow-integrated system for orchestrating multiple AI command-line execution providers within a task and workflow management platform. The system enables seamless provider switching at the workflow phase level while maintaining deep integration with task management, state persistence, event systems, and observability platforms.

**Value Proposition:**
FlowMaster enables development teams to automate complex multi-step workflows using multiple AI execution providers, providing flexibility, reliability, and observability for AI-powered development automation.

---

## 4. Functional Requirements

### 4.1 Provider Management

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### FR-001: Multi-Provider Support

- **Requirement**: The system SHALL support multiple execution providers for workflow command execution so that users can leverage different AI tools for different tasks.
- **Priority**: Critical
  - **Critical**: Core capability - system cannot orchestrate workflows without provider support
- **Acceptance Criteria**:
  - [ ] System can register multiple execution providers
  - [ ] System can execute commands using any registered provider
  - [ ] System maintains provider isolation (each provider is self-contained)
  - [ ] System supports at least two different provider implementations
- **Rationale**: Different AI providers have different strengths, pricing models, and capabilities. Supporting multiple providers enables users to choose the best tool for each task.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-002: Phase-Level Provider Selection

- **Requirement**: The system SHALL allow provider selection at the workflow phase level so that different workflow phases can use different execution providers.
- **Priority**: High
  - **High**: Core workflow capability needed for MVP
- **Acceptance Criteria**:
  - [ ] Workflow definitions can specify provider per phase
  - [ ] System switches providers between phases without state loss
  - [ ] System validates provider availability before phase execution
  - [ ] System reports which provider executed each phase
- **Rationale**: Complex workflows may benefit from different providers at different stages. For example, using a faster provider for simple tasks and a more capable provider for complex reasoning.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-003: Workflow Context Execution

- **Requirement**: The system SHALL execute commands within workflow context including task ID, phase information, and previous step outputs so that providers have complete context for execution.
- **Priority**: Critical
  - **Critical**: Context is essential for workflow continuity and provider execution
- **Acceptance Criteria**:
  - [ ] Execution context includes task identification
  - [ ] Execution context includes current phase number and total phases
  - [ ] Execution context includes outputs from previous workflow steps
  - [ ] Execution context includes command template and fully constructed prompt
  - [ ] Providers receive complete context for every execution
- **Rationale**: Providers need full workflow context to make intelligent decisions and maintain continuity across multi-step workflows.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-004: Provider Readiness Check

- **Requirement**: The system SHALL check provider readiness before execution including authentication and CLI availability so that workflows fail fast with clear error messages.
- **Priority**: High
  - **High**: Critical for user experience and workflow reliability
- **Acceptance Criteria**:
  - [ ] System checks if provider CLI is installed
  - [ ] System checks if provider is authenticated
  - [ ] System checks platform compatibility
  - [ ] System returns detailed status including reason for unavailability
  - [ ] System performs readiness check before workflow starts
- **Rationale**: Checking provider readiness upfront prevents workflows from failing mid-execution due to missing authentication or unavailable CLIs.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-005: Provider Fallback

- **Requirement**: The system SHALL fallback to alternative providers when requested provider is unavailable so that workflows continue executing when possible.
- **Priority**: High
  - **High**: Improves workflow reliability and user experience
- **Acceptance Criteria**:
  - [ ] System attempts requested provider first
  - [ ] System tries default provider if requested provider unavailable
  - [ ] System searches for first ready provider as last resort
  - [ ] System logs when fallback occurs
  - [ ] System reports which provider was ultimately used
- **Rationale**: Automatic fallback increases workflow reliability by using any available provider rather than failing immediately when preferred provider is unavailable.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-006: Stateless Provider Switching

- **Requirement**: The system SHALL support provider switching between workflow phases without state loss so that workflows can use different providers for different phases.
- **Priority**: High
  - **High**: Enables multi-provider workflows
- **Acceptance Criteria**:
  - [ ] Phase outputs are preserved when switching providers
  - [ ] Task state is maintained across provider switches
  - [ ] Session information is properly transitioned
  - [ ] Workflow continues seamlessly after provider switch
- **Rationale**: Each phase may have different provider requirements. State must be preserved across provider switches to maintain workflow continuity.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-007: Auto-Discovery and Registration

- **Requirement**: The system SHALL auto-discover and register available execution providers at startup so that users don't need to manually configure providers.
- **Priority**: Medium
  - **Medium**: Improves user experience but system can function with manual registration
- **Acceptance Criteria**:
  - [ ] System scans for available provider implementations at startup
  - [ ] System registers all discovered providers automatically
  - [ ] System logs successful registrations
  - [ ] System handles missing providers gracefully
  - [ ] Users can still manually register providers if needed
- **Rationale**: Auto-discovery reduces configuration burden and makes providers available immediately when their CLIs are installed.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-008: Provider Capability Reporting

- **Requirement**: The system SHALL report provider capabilities including streaming support, multi-turn conversations, and supported tools so that users and workflows can make informed provider selections.
- **Priority**: Medium
  - **Medium**: Important for advanced use cases but not essential for basic workflows
- **Acceptance Criteria**:
  - [ ] Each provider reports whether it supports streaming
  - [ ] Each provider reports whether it supports multi-turn conversations
  - [ ] Each provider reports list of supported tools
  - [ ] Each provider reports supported models
  - [ ] Each provider reports maximum context size
  - [ ] Capability information is accessible via CLI commands
- **Rationale**: Different providers have different capabilities. Exposing this information enables intelligent provider selection based on requirements.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-009: Provider Identification

- **Requirement**: The system SHALL identify providers by unique identifier and display name so that providers can be referenced consistently across the system.
- **Priority**: Critical
  - **Critical**: Essential for provider management and selection
- **Acceptance Criteria**:
  - [ ] Each provider has a unique identifier (e.g., 'claude-cli', 'codex-cli')
  - [ ] Each provider has a human-readable display name
  - [ ] Identifiers are stable across system restarts
  - [ ] System prevents registration of duplicate identifiers
  - [ ] Both identifier and display name are accessible to users
- **Rationale**: Consistent identification is necessary for provider selection, logging, telemetry, and user communication.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-010: Default Provider Configuration

- **Requirement**: The system SHALL allow users to set a default provider for workflow execution so that workflows without explicit provider specification use a consistent provider.
- **Priority**: Medium
  - **Medium**: Improves usability but workflows can specify providers explicitly
- **Acceptance Criteria**:
  - [ ] Users can set a default provider via configuration or CLI command
  - [ ] System uses default provider when workflow doesn't specify one
  - [ ] System validates that default provider exists and is available
  - [ ] Default provider setting persists across sessions
  - [ ] Users can query current default provider
- **Rationale**: Default provider simplifies workflow definitions and provides consistent behavior when no provider is specified.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

### 4.2 Authentication Management

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### FR-011: Independent Provider Authentication

- **Requirement**: The system SHALL manage authentication independently for each execution provider so that each provider's authentication is isolated and properly handled.
- **Priority**: Critical
  - **Critical**: Authentication is required for provider execution
- **Acceptance Criteria**:
  - [ ] Each provider has its own authentication manager
  - [ ] Authentication for one provider doesn't affect others
  - [ ] System supports different authentication methods per provider
  - [ ] Authentication state is persisted per provider
- **Rationale**: Different providers use different authentication mechanisms. Independent management ensures each provider's authentication is properly handled without interference.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-012: Authentication Status Caching

- **Requirement**: The system SHALL cache authentication status to prevent repeated slow checks so that workflow execution is not delayed by authentication overhead.
- **Priority**: High
  - **High**: Significant performance impact on workflow execution
- **Acceptance Criteria**:
  - [ ] Authentication status is cached with timestamp
  - [ ] Cache is checked before making new authentication check
  - [ ] Cache expires after configured time-to-live
  - [ ] Cache is invalidated when authentication is cleared or refreshed
  - [ ] Cache reduces authentication check latency measurably
- **Rationale**: Authentication checks can be slow (disk I/O, API calls). Caching prevents repeated checks and improves workflow startup time.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-013: Multiple Authentication Methods

- **Requirement**: The system SHALL support multiple authentication methods including API keys, OAuth, CLI login, and tokens so that providers can use their native authentication mechanisms.
- **Priority**: Critical
  - **Critical**: Different providers require different authentication methods
- **Acceptance Criteria**:
  - [ ] System supports API key-based authentication
  - [ ] System supports OAuth-based authentication
  - [ ] System supports CLI login flows
  - [ ] System supports token-based authentication
  - [ ] Each provider can specify which method it uses
  - [ ] Authentication method is reported in status checks
- **Rationale**: AI providers use various authentication mechanisms. Supporting multiple methods enables integration with diverse providers.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-014: Interactive Authentication Flows

- **Requirement**: The system SHALL provide interactive authentication flows with user prompts when authentication is required so that users can authenticate providers when needed.
- **Priority**: High
  - **High**: Essential for user experience when authentication is missing
- **Acceptance Criteria**:
  - [ ] System detects when provider is not authenticated
  - [ ] System prompts user to authenticate
  - [ ] System provides clear authentication instructions
  - [ ] System waits for authentication to complete
  - [ ] System confirms successful authentication
  - [ ] System reports authentication failures clearly
- **Rationale**: Automated workflows should prompt users for authentication when needed rather than failing silently.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-015: Authentication Clearing

- **Requirement**: The system SHALL allow users to clear authentication data for any provider so that users can log out or reset authentication when needed.
- **Priority**: Medium
  - **Medium**: Important for security and troubleshooting but not critical for core workflows
- **Acceptance Criteria**:
  - [ ] Users can clear authentication via CLI command
  - [ ] Clearing authentication removes all stored credentials
  - [ ] Clearing authentication invalidates auth cache
  - [ ] System confirms authentication has been cleared
  - [ ] Provider status correctly reflects unauthenticated state after clearing
- **Rationale**: Users need ability to log out, switch accounts, or reset authentication for troubleshooting.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-016: Authentication Instructions

- **Requirement**: The system SHALL provide authentication instructions including required environment variables and configuration files so that users know how to authenticate each provider.
- **Priority**: High
  - **High**: Critical for user onboarding and self-service troubleshooting
- **Acceptance Criteria**:
  - [ ] Each provider provides authentication instructions
  - [ ] Instructions include step-by-step authentication process
  - [ ] Instructions list required environment variables
  - [ ] Instructions list configuration file paths
  - [ ] Instructions include links to provider documentation
  - [ ] Instructions are accessible via CLI commands
- **Rationale**: Clear authentication instructions reduce support burden and enable users to self-service authentication setup.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

### 4.3 Stream Processing

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### FR-017: Real-Time Stream Processing

- **Requirement**: The system SHALL process streaming output from execution providers in real-time so that users see progress as commands execute.
- **Priority**: High
  - **High**: Real-time feedback is essential for long-running commands
- **Acceptance Criteria**:
  - [ ] System processes output as it arrives from provider
  - [ ] System emits events for each processed chunk
  - [ ] System maintains minimal buffering for real-time display
  - [ ] System handles streaming for all providers that support it
- **Rationale**: Long-running AI commands benefit from real-time output streaming to show progress and maintain user engagement.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-018: Transient Streaming Events

- **Requirement**: The system SHALL emit transient streaming events during execution for live UI updates so that interactive interfaces can show real-time progress.
- **Priority**: High
  - **High**: Enables rich interactive UI experiences
- **Acceptance Criteria**:
  - [ ] System emits streaming events with streaming=true flag
  - [ ] Streaming events include partial content as it arrives
  - [ ] Streaming events are marked as transient (not persisted)
  - [ ] UI can differentiate between streaming and final events
- **Rationale**: Two-phase event emission (transient then final) enables real-time UI updates while maintaining clean final state.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-019: Final Persisted Events

- **Requirement**: The system SHALL emit final persisted events after execution completes for state management so that task state reflects complete execution results.
- **Priority**: Critical
  - **Critical**: Persistent state is essential for workflow continuity and resumption
- **Acceptance Criteria**:
  - [ ] System emits final events with streaming=false flag
  - [ ] Final events contain complete, deduplicated content
  - [ ] Final events are persisted to task state
  - [ ] Final events are emitted after all streaming completes
- **Rationale**: Final persisted events provide clean, complete state for task persistence, resumption, and historical review.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-020: Tool Metadata Extraction

- **Requirement**: The system SHALL extract tool metadata from execution streams including tool name, action type, file paths, and line numbers so that UI can display rich tool information.
- **Priority**: Medium
  - **Medium**: Enhances UX but not essential for core functionality
- **Acceptance Criteria**:
  - [ ] System extracts tool name from tool use events
  - [ ] System infers action type (read/write/edit/bash/grep/glob) from tool name and input
  - [ ] System extracts file paths from tool input parameters
  - [ ] System extracts line numbers for edit operations
  - [ ] Metadata is included in tool use events
- **Rationale**: Rich tool metadata enables enhanced UI displays showing exactly what tools are doing with files and commands.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-021: Duplicate Tool Call Detection

- **Requirement**: The system SHALL detect and flag duplicate tool calls to reduce visual noise so that UI can show cleaner, deduplicated tool information.
- **Priority**: Low
  - **Low**: Nice-to-have UX enhancement
- **Acceptance Criteria**:
  - [ ] System tracks tool calls by signature (tool name + action + file path)
  - [ ] System marks subsequent identical calls as duplicates
  - [ ] Duplicate flag is included in tool metadata
  - [ ] UI can choose to hide or collapse duplicate calls
- **Rationale**: AI providers sometimes repeat tool calls during retries or clarification. Detecting duplicates reduces visual noise in tool displays.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-022: Text Output Normalization

- **Requirement**: The system SHALL normalize text output by handling ANSI escape sequences and carriage returns so that output displays consistently across providers.
- **Priority**: Medium
  - **Medium**: Improves output quality and consistency
- **Acceptance Criteria**:
  - [ ] System removes or preserves ANSI escape sequences based on configuration
  - [ ] System handles carriage return overwrites correctly
  - [ ] System normalizes line endings (CRLF to LF)
  - [ ] System collapses excessive newlines
  - [ ] Normalization is consistent across all providers
- **Rationale**: Different providers may include ANSI formatting or special characters. Normalization ensures consistent, readable output.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

### 4.4 Context Management

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### FR-023: Execution Context Building

- **Requirement**: The system SHALL build execution context including task information, previous step outputs, and command templates so that providers have all necessary information for execution.
- **Priority**: Critical
  - **Critical**: Context building is essential for workflow execution
- **Acceptance Criteria**:
  - [ ] Context includes task ID and working directory
  - [ ] Context includes previous step outputs and session IDs
  - [ ] Context includes command template and rendered prompt
  - [ ] Context includes workflow phase information
  - [ ] Context includes provider configuration
- **Rationale**: Providers need comprehensive context to execute commands correctly within multi-step workflows.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-024: Context Persistence

- **Requirement**: The system SHALL save execution context to disk for each command execution so that context is available for debugging and future executions.
- **Priority**: High
  - **High**: Critical for debugging and workflow resumption
- **Acceptance Criteria**:
  - [ ] System saves context after each command execution
  - [ ] Context includes command output
  - [ ] Context includes execution metadata (model, duration, etc.)
  - [ ] Context is saved in structured format
  - [ ] Context files are organized by task and command
- **Rationale**: Persisted context enables debugging, workflow resumption, and historical analysis of executions.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-025: Context Loading from Dependencies

- **Requirement**: The system SHALL load context from previous phases for commands with dependencies so that dependent commands have access to predecessor outputs.
- **Priority**: Critical
  - **Critical**: Dependency management is core to workflow orchestration
- **Acceptance Criteria**:
  - [ ] System identifies command dependencies from workflow definition
  - [ ] System loads outputs from dependency phases
  - [ ] System includes dependency outputs in command context
  - [ ] System fails gracefully if dependency context is missing
  - [ ] Dependency context is properly formatted for provider consumption
- **Rationale**: Workflow phases often depend on outputs from previous phases. Context loading enables this dependency chain.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-026: Output Truncation

- **Requirement**: The system SHALL truncate large outputs in context to prevent excessive file sizes so that context files remain manageable.
- **Priority**: Medium
  - **Medium**: Prevents disk space issues but not critical for functionality
- **Acceptance Criteria**:
  - [ ] System applies maximum length limit to outputs in context
  - [ ] System preserves most recent output when truncating
  - [ ] System indicates when output has been truncated
  - [ ] Truncation limit is configurable
  - [ ] Full output is still available in separate artifact files
- **Rationale**: Very large outputs can bloat context files. Truncation keeps context manageable while preserving recent output.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-027: Session Resumption

- **Requirement**: The system SHALL support session resumption for multi-turn conversations so that providers can continue conversations from previous executions.
- **Priority**: High
  - **High**: Enables multi-turn AI interactions
- **Acceptance Criteria**:
  - [ ] System stores session IDs in task state
  - [ ] System passes session IDs to providers for resumption
  - [ ] Providers can resume conversations using session IDs
  - [ ] Session resumption works across workflow phases
  - [ ] System handles session expiration gracefully
- **Rationale**: Multi-turn conversations allow AI to maintain context across multiple interactions, improving response quality.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

### 4.5 Process Management

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### FR-028: Child Process Spawning

- **Requirement**: The system SHALL spawn child processes for CLI-based provider execution so that providers can be invoked as external commands.
- **Priority**: Critical
  - **Critical**: Process spawning is fundamental to CLI provider execution
- **Acceptance Criteria**:
  - [ ] System spawns child processes with correct command and arguments
  - [ ] System configures working directory for child processes
  - [ ] System passes environment variables to child processes
  - [ ] System captures stdout and stderr from child processes
  - [ ] System reports exit codes from child processes
- **Rationale**: Many AI providers are CLI tools that must be invoked as separate processes.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-029: Active Process Tracking

- **Requirement**: The system SHALL track active processes for cleanup on shutdown so that no orphaned processes are left running.
- **Priority**: High
  - **High**: Prevents resource leaks and orphaned processes
- **Acceptance Criteria**:
  - [ ] System maintains registry of active processes
  - [ ] System adds processes to registry on spawn
  - [ ] System removes processes from registry on completion
  - [ ] System kills all tracked processes on shutdown
  - [ ] Process tracking works across all providers
- **Rationale**: Proper process tracking prevents resource leaks and ensures clean shutdown even when workflows are interrupted.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-030: Process Group Cleanup

- **Requirement**: The system SHALL kill process groups on Unix systems for proper cleanup so that child processes spawned by providers are also terminated.
- **Priority**: High
  - **High**: Prevents orphaned child processes on Unix systems
- **Acceptance Criteria**:
  - [ ] System spawns processes with detached flag on Unix
  - [ ] System kills entire process group on termination
  - [ ] System uses SIGTERM followed by SIGKILL if needed
  - [ ] Process group killing only applies on Unix platforms
  - [ ] Child processes of providers are properly cleaned up
- **Rationale**: Providers may spawn their own child processes. Process group termination ensures complete cleanup on Unix systems.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-031: Abort Signal Handling

- **Requirement**: The system SHALL handle abort signals to terminate running processes so that workflows can be cancelled cleanly.
- **Priority**: High
  - **High**: Essential for user control and graceful cancellation
- **Acceptance Criteria**:
  - [ ] System passes abort signals to child processes
  - [ ] System terminates processes when abort signal is received
  - [ ] System cleans up resources after abortion
  - [ ] System reports abortion in execution results
  - [ ] Abortion is immediate (no waiting for natural completion)
- **Rationale**: Users need ability to cancel long-running workflows. Abort signal handling enables clean cancellation.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-032: Timeout Configuration

- **Requirement**: The system SHALL support timeout configuration for long-running commands so that runaway processes don't consume resources indefinitely.
- **Priority**: Medium
  - **Medium**: Important safety feature but not essential for all workflows
- **Acceptance Criteria**:
  - [ ] Users can configure timeout per provider or per command
  - [ ] System terminates processes that exceed timeout
  - [ ] System reports timeout as distinct error type
  - [ ] Default timeout is applied when not specified
  - [ ] Timeout is enforced consistently across providers
- **Rationale**: Some commands may hang or run longer than expected. Timeouts provide safety mechanism to terminate runaway processes.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-033: Stdin Prompt Piping

- **Requirement**: The system SHALL pipe prompts to provider stdin for execution so that prompts can be provided via standard input stream.
- **Priority**: Critical
  - **Critical**: Many providers accept prompts via stdin
- **Acceptance Criteria**:
  - [ ] System writes prompt to process stdin
  - [ ] System closes stdin after writing prompt
  - [ ] System handles cases where stdin is not available
  - [ ] Prompt is written before waiting for output
  - [ ] Large prompts are handled without buffering issues
- **Rationale**: Many CLI providers accept prompts via stdin rather than command line arguments. This is the standard input method for long prompts.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

### 4.6 Provider Coordination

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### FR-034: Workflow State Machine Coordination

- **Requirement**: The system SHALL coordinate provider execution with workflow state machines so that provider execution is properly integrated with workflow orchestration.
- **Priority**: Critical
  - **Critical**: Integration with workflow state machines is fundamental to the system
- **Acceptance Criteria**:
  - [ ] Provider execution is invoked from workflow state machine services
  - [ ] Provider results trigger state machine transitions
  - [ ] Provider errors are handled by state machine error transitions
  - [ ] State machine context is updated with provider results
  - [ ] Workflow state reflects provider execution status
- **Rationale**: Provider execution must be integrated with workflow state machines to enable proper orchestration and error handling.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-035: Execution Result Reporting

- **Requirement**: The system SHALL report execution results including success status, output, and telemetry so that workflows have complete information about each execution.
- **Priority**: Critical
  - **Critical**: Result reporting is essential for workflow decision making
- **Acceptance Criteria**:
  - [ ] Execution results include success/failure status
  - [ ] Execution results include complete command output
  - [ ] Execution results include session ID for resumption
  - [ ] Execution results include telemetry data (duration, token usage, cost)
  - [ ] Execution results include exit code and error information
- **Rationale**: Comprehensive result reporting enables workflows to make decisions based on execution outcomes and enables proper telemetry.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-036: Observability Platform Integration

- **Requirement**: The system SHALL integrate with observability platform for execution tracking so that all provider executions are tracked centrally.
- **Priority**: High
  - **High**: Observability is critical for production use and debugging
- **Acceptance Criteria**:
  - [ ] Provider execution start is reported to observability platform
  - [ ] Token usage is reported to observability platform
  - [ ] Execution completion is reported to observability platform
  - [ ] Errors are reported to observability platform
  - [ ] Provider information is included in observability data
- **Rationale**: Centralized observability enables monitoring, debugging, cost tracking, and usage analysis across all executions.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### FR-037: Execution Artifact Persistence

- **Requirement**: The system SHALL save execution artifacts including prompts, outputs, and message history so that executions can be reviewed and debugged.
- **Priority**: High
  - **High**: Essential for debugging and compliance
- **Acceptance Criteria**:
  - [ ] System saves prompt sent to provider
  - [ ] System saves complete output from provider
  - [ ] System saves message history for conversational executions
  - [ ] System saves execution metadata (timestamps, model, etc.)
  - [ ] Artifacts are organized by task and phase
  - [ ] Artifacts are in human-readable format
- **Rationale**: Execution artifacts enable post-execution review, debugging, compliance auditing, and quality improvement.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

### 4.7 Context Building

<!-- Requirements extracted from: design/alfred/04-execution/context-builder.md -->

#### FR-038: Workflow Context Source Specification

- **Requirement**: The system SHALL allow workflows to specify context sources for each phase so that commands receive relevant data from previous phases and project files.
- **Priority**: Critical
  - **Critical**: Context passing is fundamental to multi-phase workflow execution
- **Acceptance Criteria**:
  - [ ] Workflows can specify context sources in phase definitions
  - [ ] Context sources can reference previous phase outputs
  - [ ] Context sources can reference project files
  - [ ] Context sources can use glob patterns for multiple files
  - [ ] System validates context source specifications at workflow load time
- **Rationale**: Commands need context from previous phases and project files to make informed decisions and maintain workflow continuity.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-039: Phase Output Reference Resolution

- **Requirement**: The system SHALL resolve phase output references to stored outputs from previous phases so that commands can access predecessor results.
- **Priority**: Critical
  - **Critical**: Phase dependencies are core to workflow orchestration
- **Acceptance Criteria**:
  - [ ] System resolves phase names to output file paths
  - [ ] System loads output content from resolved paths
  - [ ] System handles missing phase outputs with clear errors
  - [ ] Phase outputs are stored in predictable locations
  - [ ] Output resolution works for both sequential and parallel phases
- **Rationale**: Workflow phases often depend on outputs from previous phases. Automatic resolution enables seamless data flow between phases.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-040: Project File Reference Resolution

- **Requirement**: The system SHALL resolve file path references to project files so that commands can access project documentation and code.
- **Priority**: High
  - **High**: Access to project files is essential for many workflow commands
- **Acceptance Criteria**:
  - [ ] System resolves relative file paths from project root
  - [ ] System resolves absolute file paths
  - [ ] System loads file content from resolved paths
  - [ ] System validates file existence before loading
  - [ ] System provides clear errors for missing files
- **Rationale**: Commands need access to project files like specifications, architecture documents, and existing code to make informed decisions.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-041: Glob Pattern Support for Multiple Files

- **Requirement**: The system SHALL support glob patterns for loading multiple files as context so that commands can access collections of related files.
- **Priority**: High
  - **High**: Many workflows need to process multiple related files
- **Acceptance Criteria**:
  - [ ] System resolves glob patterns to matching file paths
  - [ ] System loads all matching files
  - [ ] System handles glob patterns with wildcards
  - [ ] System handles recursive glob patterns
  - [ ] System handles cases where glob matches zero files appropriately
- **Rationale**: Workflows often need to analyze multiple files (e.g., all test files, all documentation). Glob patterns enable efficient bulk file loading.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-042: Automatic Context Tag Generation

- **Requirement**: The system SHALL generate context tags automatically based on source type so that context items are identifiable in prompts.
- **Priority**: Medium
  - **Medium**: Improves context organization but not essential for functionality
- **Acceptance Criteria**:
  - [ ] Phase outputs use phase name as tag
  - [ ] Single files use basename without extension as tag
  - [ ] Multiple files use directory name as tag
  - [ ] Glob patterns use parent directory name as tag
  - [ ] Tag names are valid identifiers (alphanumeric)
- **Rationale**: Automatic tag generation creates consistent, predictable context organization without requiring manual tag specification.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-043: Context Block Appending

- **Requirement**: The system SHALL append context blocks to command prompts before execution so that commands receive all specified context.
- **Priority**: Critical
  - **Critical**: Context delivery is fundamental to command execution
- **Acceptance Criteria**:
  - [ ] System appends context after command template
  - [ ] Context is formatted with clear delimiters
  - [ ] Context includes source identification
  - [ ] Multiple context items are properly separated
  - [ ] Context appending happens before prompt is sent to provider
- **Rationale**: Commands need to receive context in a structured, parseable format to make use of previous outputs and project files.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-044: Optional Context Item Support

- **Requirement**: The system SHALL support optional context items that don't fail workflows if missing so that workflows can gracefully handle missing optional data.
- **Priority**: High
  - **High**: Enables robust workflows that adapt to available data
- **Acceptance Criteria**:
  - [ ] Workflows can mark context items as optional
  - [ ] Missing optional items are skipped silently
  - [ ] Missing optional items don't appear in context blocks
  - [ ] System logs when optional items are skipped
  - [ ] Required items still fail workflows if missing
- **Rationale**: Not all context is essential for every execution. Optional items enable flexible workflows that adapt to available data.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-045: Required Context Item Validation

- **Requirement**: The system SHALL validate required context items and fail workflows with clear errors if missing so that workflows fail fast when essential context is unavailable.
- **Priority**: Critical
  - **Critical**: Required context validation prevents downstream failures
- **Acceptance Criteria**:
  - [ ] System validates all required context items before execution
  - [ ] Missing required items cause immediate workflow failure
  - [ ] Error messages identify which context item is missing
  - [ ] Error messages include expected file path
  - [ ] Error messages include troubleshooting guidance
- **Rationale**: Missing required context causes confusing failures later in execution. Early validation provides clear, actionable errors.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-046: Multiple File Concatenation with Headers

- **Requirement**: The system SHALL separate multiple files with headers when concatenating so that command can distinguish between different source files.
- **Priority**: Medium
  - **Medium**: Improves context clarity but not essential for basic functionality
- **Acceptance Criteria**:
  - [ ] Each file is preceded by header comment with filename
  - [ ] Files are separated by horizontal rules or whitespace
  - [ ] Headers identify original file path
  - [ ] Concatenation preserves file order
  - [ ] Headers are in format that doesn't interfere with content
- **Rationale**: When loading multiple files, headers help commands understand which content came from which file, enabling more accurate analysis.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-047: Context Error Messaging

- **Requirement**: The system SHALL provide clear error messages when required context is not found including expected path and troubleshooting steps so that users can resolve context issues.
- **Priority**: High
  - **High**: Clear error messages reduce support burden and enable self-service
- **Acceptance Criteria**:
  - [ ] Error messages identify missing context item by name
  - [ ] Error messages include expected file path
  - [ ] Error messages indicate if item is phase output or file reference
  - [ ] Error messages include troubleshooting steps
  - [ ] Error messages explain how to mark items as optional
- **Rationale**: Context resolution failures are common during workflow development. Clear errors enable rapid troubleshooting.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-048: Output Limiting for Large Contexts

- **Requirement**: The system SHALL support output limiting to prevent excessively large context so that prompts remain within provider token limits.
- **Priority**: Medium
  - **Medium**: Prevents failures from oversized contexts but not needed for all workflows
- **Acceptance Criteria**:
  - [ ] Workflows can specify maximum lines for phase outputs
  - [ ] System truncates outputs exceeding the limit
  - [ ] System preserves most recent output when truncating
  - [ ] System indicates when output has been truncated
  - [ ] Full output remains available in artifact files
- **Rationale**: Some commands produce very large outputs. Limiting prevents context from exceeding token limits while preserving recent, relevant content.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### FR-049: Sub-Workflow Context Passing

- **Requirement**: The system SHALL support context passing between parent and sub-workflows so that nested workflows can access parent context.
- **Priority**: Low
  - **Low**: Advanced feature for complex workflow patterns
- **Acceptance Criteria**:
  - [ ] Sub-workflows can inherit parent workflow context
  - [ ] Sub-workflows can specify additional context
  - [ ] Parent workflows can access aggregated sub-workflow outputs
  - [ ] Context inheritance is properly scoped
  - [ ] Context passing works for parallel sub-workflows
- **Rationale**: Complex workflows may use sub-workflows for task delegation. Context passing enables sub-workflows to access parent data and return results.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

### 4.8 Command Execution Engine

<!-- Requirements extracted from: design/alfred/04-execution/engine-core.md -->

#### FR-050: Model Selection Per Workflow Phase

- **Requirement**: The system SHALL allow model selection per workflow phase so that different phases can use different AI models based on task complexity.
- **Priority**: High
  - **High**: Model selection optimization can significantly reduce cost and improve performance
- **Acceptance Criteria**:
  - [ ] Workflows can specify model per phase
  - [ ] System validates model compatibility with selected provider
  - [ ] System uses specified model for phase execution
  - [ ] System falls back to provider default model if not specified
  - [ ] Model selection is logged in execution telemetry
- **Rationale**: Different workflow phases have different complexity requirements. Using appropriate models (e.g., fast models for simple tasks, capable models for complex reasoning) optimizes cost and performance.
- **Source**: `design/alfred/04-execution/engine-core.md`

---

#### FR-051: Provider-Specific Telemetry Parsing

- **Requirement**: The system SHALL parse provider-specific telemetry formats to extract token usage and cost so that all providers report consistent telemetry data.
- **Priority**: High
  - **High**: Consistent telemetry is essential for cost tracking and usage analysis
- **Acceptance Criteria**:
  - [ ] System extracts input tokens from provider output
  - [ ] System extracts output tokens from provider output
  - [ ] System extracts cached tokens when available
  - [ ] System extracts cost information when available
  - [ ] System normalizes telemetry to consistent format across providers
- **Rationale**: Different providers format telemetry data differently. Provider-specific parsing enables consistent telemetry reporting across all providers.
- **Source**: `design/alfred/04-execution/engine-core.md`

---

### 4.9 Output Validation

<!-- Requirements extracted from: design/alfred/04-execution/output-parsing.md -->

#### FR-052: Output Schema Definition in Workflows

- **Requirement**: The system SHALL support output schema definitions in workflow specifications so that command outputs can be validated against expected structure.
- **Priority**: High
  - **High**: Schema validation enables reliable conditional execution and data flow
- **Acceptance Criteria**:
  - [ ] Workflows can define output schemas for phases
  - [ ] Schemas specify field names, types, and descriptions
  - [ ] Schemas can mark fields as required or optional
  - [ ] Schemas support primitive types (string, integer, boolean, number)
  - [ ] Schemas support complex types (arrays, objects)
  - [ ] Schemas are validated at workflow load time
- **Rationale**: Structured outputs enable reliable conditional execution and data passing between phases. Schemas define the expected output structure.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-053: Schema-Based Output Validation

- **Requirement**: The system SHALL validate command outputs against declared schemas so that only valid, well-structured outputs are accepted.
- **Priority**: High
  - **High**: Validation ensures data quality for downstream phases
- **Acceptance Criteria**:
  - [ ] System validates output against schema after command execution
  - [ ] System checks field presence for required fields
  - [ ] System checks field types match schema
  - [ ] System checks enum values when specified
  - [ ] System rejects outputs that fail validation
- **Rationale**: Schema validation ensures commands return expected data structures, preventing downstream failures from malformed data.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-054: Schema Injection into Command Prompts

- **Requirement**: The system SHALL inject schema requirements into command prompts so that commands understand expected output structure.
- **Priority**: Critical
  - **Critical**: Schema injection guides commands to produce valid outputs
- **Acceptance Criteria**:
  - [ ] System appends schema to command prompts when schema is defined
  - [ ] Schema injection includes field names, types, and descriptions
  - [ ] Schema injection includes required field list
  - [ ] Schema injection includes clear formatting instructions
  - [ ] Schema injection happens before prompt is sent to provider
- **Rationale**: Commands need to know expected output structure to produce valid outputs. Schema injection provides this information in the prompt.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-055: JSON Output Parsing

- **Requirement**: The system SHALL parse JSON-formatted outputs from commands so that structured data can be extracted and validated.
- **Priority**: Critical
  - **Critical**: JSON parsing is fundamental to structured output handling
- **Acceptance Criteria**:
  - [ ] System attempts to parse command output as JSON
  - [ ] System handles malformed JSON with clear errors
  - [ ] System extracts parsed data for validation
  - [ ] System handles JSON parsing errors gracefully
  - [ ] System supports large JSON outputs
- **Rationale**: JSON is the structured data format for command outputs. Parsing is necessary to extract and validate structured data.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-056: Validation Retry with Error Feedback

- **Requirement**: The system SHALL retry command execution with error feedback when validation fails so that commands can correct output structure.
- **Priority**: High
  - **High**: Retry with feedback significantly improves success rate
- **Acceptance Criteria**:
  - [ ] System retries command when output validation fails
  - [ ] System includes validation errors in retry prompt
  - [ ] System specifies which fields failed validation
  - [ ] System provides correction guidance in retry prompt
  - [ ] System limits number of retry attempts
- **Rationale**: Commands may produce invalid outputs on first attempt. Retry with specific error feedback enables commands to correct issues.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-057: Validated Output Context Availability

- **Requirement**: The system SHALL make validated outputs available to subsequent phases so that downstream commands can access structured data from predecessors.
- **Priority**: Critical
  - **Critical**: Output availability is fundamental to workflow data flow
- **Acceptance Criteria**:
  - [ ] Validated outputs are stored in task state
  - [ ] Validated outputs are accessible by phase name
  - [ ] System provides validated outputs to dependent phases
  - [ ] Validated outputs persist across workflow execution
  - [ ] Validated outputs are included in context for dependent phases
- **Rationale**: The purpose of structured outputs is to enable data flow between phases. Validated outputs must be accessible to subsequent phases.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-058: Field Access Syntax for Previous Outputs

- **Requirement**: The system SHALL support field access syntax for referencing specific fields from previous phase outputs so that workflows can use individual data elements.
- **Priority**: High
  - **High**: Field access enables fine-grained data flow and conditional logic
- **Acceptance Criteria**:
  - [ ] Workflows can reference fields using dot notation
  - [ ] Field references resolve to actual field values
  - [ ] Field references work in context specifications
  - [ ] Field references work in conditional expressions
  - [ ] System validates field references at workflow load time
- **Rationale**: Workflows need to reference specific fields from previous outputs for conditionals and context building. Field access syntax enables this.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-059: Schema-Based Conditional Execution

- **Requirement**: The system SHALL support conditional execution based on structured output fields so that workflows can branch based on command results.
- **Priority**: High
  - **High**: Conditionals enable adaptive workflows that respond to execution results
- **Acceptance Criteria**:
  - [ ] Workflows can use output fields in conditional expressions
  - [ ] System evaluates conditionals using validated output values
  - [ ] Conditionals support comparison operators
  - [ ] Conditionals support boolean logic (AND, OR, NOT)
  - [ ] System skips phases when conditionals evaluate to false
- **Rationale**: Different workflow paths may be appropriate based on command results. Conditionals enable adaptive workflows.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-060: Validation Error Messaging

- **Requirement**: The system SHALL provide detailed validation error messages with field-level feedback so that users can understand and fix validation failures.
- **Priority**: High
  - **High**: Clear error messages enable rapid troubleshooting
- **Acceptance Criteria**:
  - [ ] Error messages identify specific failing fields
  - [ ] Error messages explain validation failure reason
  - [ ] Error messages show expected vs actual types
  - [ ] Error messages include correction guidance
  - [ ] Error messages are included in retry prompts
- **Rationale**: Validation failures can be difficult to diagnose. Field-level error messages enable rapid identification and correction of issues.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### FR-061: Maximum Retry Enforcement

- **Requirement**: The system SHALL enforce maximum retry limits for validation failures so that workflows don't retry indefinitely.
- **Priority**: Critical
  - **Critical**: Retry limits prevent infinite loops and resource exhaustion
- **Acceptance Criteria**:
  - [ ] System limits validation retries to configured maximum
  - [ ] System fails workflow after exhausting retries
  - [ ] Retry limit is configurable per workflow or globally
  - [ ] System logs retry attempts and final failure
  - [ ] Error message indicates retry limit was exhausted
- **Rationale**: Some commands may be unable to produce valid outputs. Retry limits prevent infinite loops and provide clear failure conditions.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

### 4.10 Event System

<!-- Requirements extracted from: design/alfred/03-events/event-bus-architecture.md -->

#### FR-082: Publish-Subscribe Event System

- **Requirement**: The system SHALL emit events during workflow execution using a publish-subscribe pattern so that multiple consumers can receive execution events independently.
- **Priority**: Critical
  - **Critical**: Event system decouples execution from presentation and enables multiple simultaneous consumers
- **Acceptance Criteria**:
  - [ ] System emits events for workflow state changes
  - [ ] Multiple consumers can subscribe to events independently
  - [ ] Event emission doesn't require knowledge of consumers
  - [ ] Adding new consumers requires no changes to execution code
  - [ ] Events are delivered to all registered subscribers
- **Rationale**: Decoupling execution from presentation via events enables driving CLI output, UI updates, log files, and telemetry from the same event stream without tight coupling.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-083: Type-Safe Event Contracts

- **Requirement**: The system SHALL enforce type-safe event contracts with strongly-typed payloads so that invalid events are caught at build time.
- **Priority**: High
  - **High**: Type safety prevents runtime errors and provides IDE support
- **Acceptance Criteria**:
  - [ ] Each event type has explicit type definition
  - [ ] Event payloads are strongly typed
  - [ ] Invalid events are caught during compilation
  - [ ] Event consumers receive correctly typed events
  - [ ] IDE provides autocomplete for event payloads
- **Rationale**: Type safety prevents invalid events from being emitted, provides self-documentation, and enables safe refactoring.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-084: Multiple Independent Event Consumers

- **Requirement**: The system SHALL support multiple independent event consumers including console, file, WebSocket, and telemetry handlers so that events drive different outputs simultaneously.
- **Priority**: Critical
  - **Critical**: Multiple consumers are core to the event system value proposition
- **Acceptance Criteria**:
  - [ ] System supports console output handler
  - [ ] System supports file logging handler
  - [ ] System supports WebSocket streaming handler
  - [ ] System supports telemetry reporting handler
  - [ ] Each handler can subscribe independently
  - [ ] Handler failures don't affect other handlers
- **Rationale**: Same workflow execution should simultaneously drive CLI output, log files, real-time UI, and telemetry without any handler affecting others.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-085: WebSocket Server for Real-Time UI

- **Requirement**: The system SHALL provide WebSocket server for streaming events to UI clients so that real-time UI updates are enabled.
- **Priority**: High
  - **High**: Real-time UI is a key feature for interactive workflows
- **Acceptance Criteria**:
  - [ ] WebSocket server accepts client connections
  - [ ] Clients can subscribe to specific event types
  - [ ] Events are broadcast to subscribed clients
  - [ ] WebSocket server manages connection lifecycle
  - [ ] Connection failures are handled gracefully
- **Rationale**: WebSocket enables bi-directional communication with low latency for real-time UI updates as workflows execute.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-086: Event Filtering by Subscription

- **Requirement**: The system SHALL support event filtering so that consumers only receive events they care about.
- **Priority**: Medium
  - **Medium**: Improves efficiency but consumers can ignore unwanted events
- **Acceptance Criteria**:
  - [ ] Consumers can subscribe to specific event types
  - [ ] Consumers can provide filter functions
  - [ ] Only matching events are delivered to consumers
  - [ ] Filtering doesn't affect other consumers
  - [ ] Filter function receives event and returns boolean
- **Rationale**: Event filtering reduces unnecessary processing and network traffic by delivering only relevant events to each consumer.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-087: Event Statistics for Debugging

- **Requirement**: The system SHALL track event emission statistics including counts and timing so that event flow can be debugged and analyzed.
- **Priority**: Low
  - **Low**: Useful for debugging but not essential for core functionality
- **Acceptance Criteria**:
  - [ ] System tracks event emission counts by type
  - [ ] System tracks last emission time per event type
  - [ ] System tracks average time between emissions
  - [ ] Statistics are queryable for debugging
  - [ ] Statistics can be reset
- **Rationale**: Event statistics help debug performance issues, identify event hotspots, and validate event flow during development.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-088: Promise-Based Event Waiting

- **Requirement**: The system SHALL support promise-based waiting for specific events with timeout so that workflows can coordinate on event occurrences.
- **Priority**: Medium
  - **Medium**: Enables advanced coordination patterns but not needed for basic workflows
- **Acceptance Criteria**:
  - [ ] System provides method to wait for specific event type
  - [ ] Wait operation returns promise that resolves with event
  - [ ] Timeout is supported and rejects promise
  - [ ] Waiting for multiple events is supported
  - [ ] Wait automatically unsubscribes after event received
- **Rationale**: Promise-based waiting enables async workflows to coordinate execution based on specific events without manual subscription management.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-089: Workflow Lifecycle Events

- **Requirement**: The system SHALL emit workflow lifecycle events including start, complete, and error so that workflow execution can be monitored.
- **Priority**: Critical
  - **Critical**: Lifecycle events are fundamental to workflow monitoring
- **Acceptance Criteria**:
  - [ ] System emits workflow:start event when workflow begins
  - [ ] System emits workflow:complete event when workflow succeeds
  - [ ] System emits workflow:error event when workflow fails
  - [ ] Events include task ID and workflow name
  - [ ] Events include relevant metadata (duration, phase count, etc.)
- **Rationale**: Workflow lifecycle events enable monitoring overall workflow progress and status at the highest level.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-090: Phase Lifecycle Events

- **Requirement**: The system SHALL emit phase lifecycle events including start, complete, and error so that individual phase execution can be tracked.
- **Priority**: Critical
  - **Critical**: Phase events enable detailed execution monitoring
- **Acceptance Criteria**:
  - [ ] System emits phase:start event when phase begins
  - [ ] System emits phase:complete event when phase succeeds
  - [ ] System emits phase:error event when phase fails
  - [ ] Events include phase index and name
  - [ ] Events include phase duration and output
- **Rationale**: Phase-level events enable detailed monitoring of workflow progress and identification of slow or failing phases.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-091: Tool Execution Events

- **Requirement**: The system SHALL emit tool execution events for tool use and results so that tool activity can be monitored.
- **Priority**: High
  - **High**: Tool events provide detailed execution visibility
- **Acceptance Criteria**:
  - [ ] System emits tool:use event when tool is invoked
  - [ ] System emits tool:result event when tool completes
  - [ ] Events include tool name and input
  - [ ] Events include tool output and success status
  - [ ] Events include task and phase context
- **Rationale**: Tool events provide fine-grained visibility into what operations are being performed during execution.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-092: Assistant Message Events

- **Requirement**: The system SHALL emit assistant message events including content and thinking blocks so that AI-generated content can be displayed.
- **Priority**: High
  - **High**: Message events enable displaying AI responses to users
- **Acceptance Criteria**:
  - [ ] System emits assistant:message events for AI messages
  - [ ] System emits assistant:thinking events for thinking blocks
  - [ ] Events include message content
  - [ ] Events indicate if streaming or final
  - [ ] Events include task and phase context
- **Rationale**: Assistant message events enable UI to display AI-generated content including reasoning and explanations.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-093: Retry Events

- **Requirement**: The system SHALL emit retry events including attempt, success, and failure so that retry logic can be monitored.
- **Priority**: Medium
  - **Medium**: Helpful for debugging but not essential for basic workflows
- **Acceptance Criteria**:
  - [ ] System emits retry:attempt event when retry begins
  - [ ] System emits retry:success event when retry succeeds
  - [ ] System emits retry:failed event when retries exhausted
  - [ ] Events include attempt number and max retries
  - [ ] Events include delay before next attempt
- **Rationale**: Retry events enable monitoring retry behavior and identifying phases that require multiple attempts to succeed.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-094: Validation Events

- **Requirement**: The system SHALL emit validation events for output validation so that validation process can be monitored.
- **Priority**: Medium
  - **Medium**: Useful for debugging validation failures but not critical
- **Acceptance Criteria**:
  - [ ] System emits validation:start event when validation begins
  - [ ] System emits validation:complete event when validation finishes
  - [ ] Events include validation type (deterministic, schema, AI)
  - [ ] Events include pass/fail status
  - [ ] Events include validation errors when failing
- **Rationale**: Validation events enable monitoring output validation process and understanding why validation succeeds or fails.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-095: File-Based Event Logging

- **Requirement**: The system SHALL write events to log files for debugging and audit trail so that execution history is preserved.
- **Priority**: High
  - **High**: File logs are essential for debugging and compliance
- **Acceptance Criteria**:
  - [ ] Events are written to log files as they occur
  - [ ] Log files use append-only writes
  - [ ] Log files include timestamps
  - [ ] Log format is human-readable
  - [ ] Log files can be read with standard tools (tail, grep)
- **Rationale**: File-based logging enables debugging with standard Unix tools, provides audit trail, and enables replay of event sequences.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-096: WebSocket Client Registration

- **Requirement**: The system SHALL manage WebSocket client connections including registration and cleanup so that multiple UI clients can receive events.
- **Priority**: High
  - **High**: Client management is essential for multi-client support
- **Acceptance Criteria**:
  - [ ] System accepts WebSocket client connections
  - [ ] System assigns unique client IDs
  - [ ] System tracks active clients
  - [ ] System handles client disconnections
  - [ ] System cleans up resources on disconnect
- **Rationale**: Proper client management enables multiple UI windows, handles disconnections gracefully, and prevents resource leaks.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-097: Per-Client Event Filtering

- **Requirement**: The system SHALL filter events per WebSocket client based on subscriptions so that clients only receive requested events.
- **Priority**: Medium
  - **Medium**: Reduces network traffic but clients can ignore unwanted events
- **Acceptance Criteria**:
  - [ ] Clients can specify which event types to receive
  - [ ] System only sends subscribed events to each client
  - [ ] Client subscriptions are independent
  - [ ] Clients can update subscriptions dynamically
  - [ ] Filtering happens before network transmission
- **Rationale**: Per-client filtering reduces network bandwidth and processing overhead by only transmitting events clients actually want.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-098: WebSocket Heartbeat Monitoring

- **Requirement**: The system SHALL send heartbeat messages to detect dead connections so that stale clients are cleaned up.
- **Priority**: Medium
  - **Medium**: Improves resource management but not critical for functionality
- **Acceptance Criteria**:
  - [ ] System sends periodic ping messages to clients
  - [ ] System expects pong responses from clients
  - [ ] System detects clients that don't respond
  - [ ] System closes connections after timeout
  - [ ] Heartbeat interval is configurable
- **Rationale**: Heartbeat monitoring detects dead connections that fail to close properly, enabling timely cleanup of resources.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-099: Isolated Event Handler Failures

- **Requirement**: The system SHALL isolate event handler failures so that one handler's failure doesn't affect others.
- **Priority**: Critical
  - **Critical**: Handler isolation is essential for system reliability
- **Acceptance Criteria**:
  - [ ] Handler exceptions are caught and logged
  - [ ] Other handlers continue executing after one fails
  - [ ] Handler failures don't stop event emission
  - [ ] Handler failures are reported separately
  - [ ] Event system remains operational after handler failure
- **Rationale**: One consumer's failure (e.g., file system full) shouldn't break other consumers (e.g., WebSocket streaming). Handler isolation ensures system reliability.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### FR-100: Progress Update Events

- **Requirement**: The system SHALL emit progress update events with workflow completion percentage so that overall progress can be displayed.
- **Priority**: Medium
  - **Medium**: Improves UX but progress can be inferred from phase events
- **Acceptance Criteria**:
  - [ ] System emits progress:update events during execution
  - [ ] Events include current phase and total phases
  - [ ] Events include percentage completion
  - [ ] Progress is calculated based on completed phases
  - [ ] Progress updates are emitted at appropriate intervals
- **Rationale**: Progress events enable displaying completion percentage and estimated time remaining to users.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

### 4.11 Logging and Streaming

<!-- Requirements extracted from: design/alfred/03-events/logging-strategy.md -->

#### FR-101: Dual-Mode Operation

- **Requirement**: The system SHALL support dual-mode operation for UI and headless execution so that workflows work with or without interactive UI.
- **Priority**: Critical
  - **Critical**: Both modes are essential for different use cases (development vs CI/CD)
- **Acceptance Criteria**:
  - [ ] System detects UI mode vs headless mode automatically
  - [ ] UI mode streams events via WebSocket to UI clients
  - [ ] Headless mode writes events to stdout for CI/CD
  - [ ] Both modes write events to log files
  - [ ] Mode switching requires no code changes
- **Rationale**: Workflows need to work interactively with UI for development and non-interactively in CI/CD pipelines without modification.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-102: Real-Time Event Streaming

- **Requirement**: The system SHALL stream events to UI clients in real-time via WebSocket so that users see execution progress as it happens.
- **Priority**: High
  - **High**: Real-time streaming is key value proposition for interactive UI
- **Acceptance Criteria**:
  - [ ] Events are broadcast to UI clients immediately
  - [ ] Streaming latency is minimal (sub-second)
  - [ ] Multiple UI clients can receive stream simultaneously
  - [ ] Streaming works during long-running executions
  - [ ] No polling is required
- **Rationale**: Real-time streaming provides immediate feedback during long-running workflows, maintaining user engagement and enabling live monitoring.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-103: Crash Recovery via File Logging

- **Requirement**: The system SHALL write logs to files immediately so that logs survive process crashes.
- **Priority**: Critical
  - **Critical**: Crash recovery requires persistent logs
- **Acceptance Criteria**:
  - [ ] Log entries are written to files as events occur
  - [ ] Log writes are flushed immediately or with minimal buffering
  - [ ] Logs survive process termination
  - [ ] Logs are readable after crash
  - [ ] Logs contain complete execution history up to crash
- **Rationale**: Immediate file writing ensures logs are available for debugging after crashes, enabling identification of failure causes.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-104: Headless Mode Detection

- **Requirement**: The system SHALL automatically detect headless mode using CI environment variables and TTY checks so that appropriate output mode is selected.
- **Priority**: High
  - **High**: Automatic detection eliminates need for manual configuration
- **Acceptance Criteria**:
  - [ ] System checks for CI environment variable
  - [ ] System checks if stdout is a TTY
  - [ ] System checks for dumb terminal
  - [ ] System checks for explicit headless flag
  - [ ] Detection selects appropriate output handler
- **Rationale**: Automatic detection enables workflows to work correctly in different environments without user configuration.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-105: Structured Log Format

- **Requirement**: The system SHALL write logs in structured format with timestamps and event types so that logs are parseable and analyzable.
- **Priority**: High
  - **High**: Structured logs enable automated analysis and tooling
- **Acceptance Criteria**:
  - [ ] Log entries include ISO 8601 timestamps
  - [ ] Log entries include event type labels
  - [ ] Log entries include hierarchical phase/task identifiers
  - [ ] Log format is consistent across all event types
  - [ ] Logs can be parsed programmatically
- **Rationale**: Structured logs enable automated analysis, filtering, and correlation of events across executions.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-106: Verbose Mode Control

- **Requirement**: The system SHALL support verbose mode flag to control log detail level so that users can see more or less execution detail.
- **Priority**: Medium
  - **Medium**: Improves usability but default verbosity is sufficient for most use cases
- **Acceptance Criteria**:
  - [ ] System provides verbose mode flag or environment variable
  - [ ] Normal mode shows phases and errors
  - [ ] Verbose mode shows all events including tool calls
  - [ ] Verbosity is configurable per execution
  - [ ] Verbose mode works in both UI and headless modes
- **Rationale**: Verbose mode enables detailed debugging when needed without overwhelming users with information in normal operation.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-107: Multi-Client WebSocket Broadcasting

- **Requirement**: The system SHALL broadcast events to multiple WebSocket clients simultaneously so that multiple UI windows can monitor same workflow.
- **Priority**: Medium
  - **Medium**: Nice-to-have for advanced use cases but single client is typical
- **Acceptance Criteria**:
  - [ ] System accepts multiple WebSocket connections per task
  - [ ] Events are broadcast to all connected clients
  - [ ] Client additions don't affect existing clients
  - [ ] Client disconnections don't affect others
  - [ ] Broadcasting is efficient (single serialization)
- **Rationale**: Multiple clients enable team collaboration, monitoring from multiple machines, or multiple UI windows.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-108: Log File Organization by Phase

- **Requirement**: The system SHALL organize log files by phase or command so that logs for specific phases are easy to find.
- **Priority**: Medium
  - **Medium**: Improves debugging experience but not essential
- **Acceptance Criteria**:
  - [ ] Each phase writes to dedicated log file
  - [ ] Log files are named by phase or command name
  - [ ] Log files are organized in task directory
  - [ ] Log file naming is consistent and predictable
  - [ ] Log files can be accessed independently
- **Rationale**: Per-phase log files enable quick access to logs for specific workflow steps without searching through combined log.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-109: SSE Fallback for WebSocket

- **Requirement**: The system SHALL provide Server-Sent Events fallback when WebSocket is unavailable so that streaming works in restrictive network environments.
- **Priority**: Low
  - **Low**: WebSocket works in vast majority of cases
- **Acceptance Criteria**:
  - [ ] System provides SSE endpoint as alternative to WebSocket
  - [ ] Clients can use SSE when WebSocket fails
  - [ ] SSE provides same event stream as WebSocket
  - [ ] Fallback is automatic from client side
  - [ ] SSE includes heartbeat for connection monitoring
- **Rationale**: Some network environments block WebSocket. SSE fallback ensures streaming works even in restrictive environments.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### FR-110: Hybrid Persistence (Database and Files)

- **Requirement**: The system SHALL support optional dual-write to database and files so that fast UI queries and debugging transparency are both possible.
- **Priority**: Low
  - **Low**: Advanced feature for projects with large execution history
- **Acceptance Criteria**:
  - [ ] System can optionally write events to database
  - [ ] System always writes events to files regardless of database
  - [ ] Database enables fast queries and search
  - [ ] Files enable debugging with standard tools
  - [ ] System works without database (files are sufficient)
- **Rationale**: Database enables fast queries for UI, while files provide debugging transparency and portability. Hybrid approach provides best of both.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

### 4.10 State Management & Persistence

<!-- Requirements extracted from: design/alfred/02-state/persistence-layer.md -->

#### FR-062: Persistent Task Execution State

- **Requirement**: The system SHALL persist task execution state including status, phases, and outputs to recover from crashes so that no work is lost due to process termination.
- **Priority**: Critical
  - **Critical**: State persistence is fundamental to crash recovery and workflow reliability
- **Acceptance Criteria**:
  - [ ] Task state includes execution status (created, in_progress, completed, failed)
  - [ ] Task state includes all executed phases with timestamps
  - [ ] Task state includes outputs from each phase
  - [ ] Task state is persisted after each phase execution
  - [ ] Task state can be loaded after process restart
- **Rationale**: Workflows may be interrupted by crashes or user cancellation. Persistent state enables recovery and resumption without losing completed work.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-063: Workflow Snapshot Management

- **Requirement**: The system SHALL persist workflow execution snapshots to enable resumption after process termination so that interrupted workflows can continue from where they stopped.
- **Priority**: Critical
  - **Critical**: Workflow snapshots are essential for crash recovery
- **Acceptance Criteria**:
  - [ ] Snapshots capture complete workflow state including current phase
  - [ ] Snapshots include workflow context and phase outputs
  - [ ] Snapshots are persisted after each phase completion
  - [ ] Snapshots can be restored to resume execution
  - [ ] Snapshot restoration validates compatibility with current system
- **Rationale**: Process termination should not require restarting workflows from the beginning. Snapshots enable efficient resumption from last completed phase.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-064: Phase-Based Execution Logging

- **Requirement**: The system SHALL maintain execution logs organized by phase with timestamps so that workflow execution can be monitored and debugged.
- **Priority**: High
  - **High**: Execution logs are essential for monitoring and troubleshooting
- **Acceptance Criteria**:
  - [ ] Each phase has a dedicated log file
  - [ ] Log entries include timestamps
  - [ ] Logs capture phase start, tool use, and completion events
  - [ ] Logs are written in real-time as execution progresses
  - [ ] Logs are human-readable text format
- **Rationale**: Real-time logging enables monitoring of long-running workflows and provides detailed execution history for debugging.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-065: Command Artifact Storage

- **Requirement**: The system SHALL store command artifacts including prompts, outputs, diffs, and message histories so that executions can be reviewed and audited.
- **Priority**: High
  - **High**: Artifact storage is essential for debugging and compliance
- **Acceptance Criteria**:
  - [ ] Artifacts include prompts sent to providers
  - [ ] Artifacts include complete command outputs
  - [ ] Artifacts include full message history for conversational commands
  - [ ] Artifacts include code diffs when files are modified
  - [ ] Artifacts are organized by task and phase
  - [ ] Artifacts are in human-readable formats
- **Rationale**: Execution artifacts enable post-execution review, debugging, compliance auditing, and quality improvement.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-066: Workflow Definition Persistence

- **Requirement**: The system SHALL persist workflow definitions in version-controllable format so that workflows can be versioned, shared, and collaboratively developed.
- **Priority**: Critical
  - **Critical**: Workflow definitions are core to the system
- **Acceptance Criteria**:
  - [ ] Workflow definitions use text-based format
  - [ ] Workflow definitions can be stored in version control systems
  - [ ] Workflow definitions support comments and documentation
  - [ ] Workflow definitions are validated when loaded
  - [ ] System lists all available workflow definitions
- **Rationale**: Text-based workflow definitions enable version control, collaboration, code review, and CI/CD integration.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-067: Global Configuration Management

- **Requirement**: The system SHALL maintain global configuration including provider settings and user preferences so that system behavior can be customized.
- **Priority**: High
  - **High**: Configuration management enables system customization
- **Acceptance Criteria**:
  - [ ] Configuration includes default model selection
  - [ ] Configuration includes provider credentials
  - [ ] Configuration includes permission mode settings
  - [ ] Configuration persists across sessions
  - [ ] Configuration can be updated via CLI commands
  - [ ] Configuration provides defaults when not specified
- **Rationale**: Global configuration enables users to customize system behavior, set defaults, and manage provider credentials.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-068: Task Status Tracking

- **Requirement**: The system SHALL track task lifecycle states through created, in_progress, completed, and failed so that task progress is always visible.
- **Priority**: Critical
  - **Critical**: Status tracking is fundamental to workflow management
- **Acceptance Criteria**:
  - [ ] Tasks start in created state
  - [ ] Tasks transition to in_progress when execution begins
  - [ ] Tasks transition to completed when all phases succeed
  - [ ] Tasks transition to failed when a phase fails
  - [ ] Status transitions are logged with timestamps
  - [ ] Current status is always queryable
- **Rationale**: Clear status tracking enables users to understand task progress and system to make workflow decisions.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-069: Phase Output Management

- **Requirement**: The system SHALL capture and store named outputs from completed phases for use by dependent phases so that data flows between workflow steps.
- **Priority**: Critical
  - **Critical**: Phase outputs are essential for workflow data flow
- **Acceptance Criteria**:
  - [ ] Each phase can produce named outputs
  - [ ] Outputs are stored in task state
  - [ ] Outputs are accessible by output name
  - [ ] Outputs persist across workflow execution
  - [ ] Dependent phases can reference outputs by name
- **Rationale**: Workflow phases often need data from previous phases. Named outputs provide structured data flow mechanism.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-070: Error History Tracking

- **Requirement**: The system SHALL maintain error history including error messages, timestamps, and retry counts so that error patterns can be identified and debugged.
- **Priority**: High
  - **High**: Error history is critical for debugging and reliability improvement
- **Acceptance Criteria**:
  - [ ] Error history includes complete error messages
  - [ ] Error history includes error timestamps
  - [ ] Error history includes retry attempt count
  - [ ] Error history is persisted with task state
  - [ ] Error history is accessible for debugging
- **Rationale**: Error history enables debugging of intermittent failures and understanding of retry patterns.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-071: Incomplete Task Detection

- **Requirement**: The system SHALL detect tasks that did not complete successfully after process restart so that interrupted workflows can be identified.
- **Priority**: High
  - **High**: Detection is first step in crash recovery
- **Acceptance Criteria**:
  - [ ] System scans for tasks in in_progress state on startup
  - [ ] System verifies snapshot existence for incomplete tasks
  - [ ] System reports list of incomplete tasks
  - [ ] System distinguishes between recoverable and corrupted tasks
  - [ ] Detection occurs automatically on system startup
- **Rationale**: Crash recovery requires identifying which tasks were interrupted. Detection enables user decision on recovery actions.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-072: State Recovery from Snapshots

- **Requirement**: The system SHALL restore execution state from snapshots to resume incomplete workflows so that interrupted work can continue.
- **Priority**: High
  - **High**: Recovery is core value proposition of crash recovery
- **Acceptance Criteria**:
  - [ ] System loads snapshot for specified task
  - [ ] System validates snapshot compatibility
  - [ ] System restores workflow context from snapshot
  - [ ] System resumes from last completed phase
  - [ ] System handles snapshot restoration errors gracefully
- **Rationale**: Snapshot restoration enables efficient resumption without restarting from beginning, saving time and compute resources.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-073: State Integrity Validation

- **Requirement**: The system SHALL validate state integrity during recovery operations so that corrupted state is detected before resumption.
- **Priority**: High
  - **High**: Integrity validation prevents failures from corrupted state
- **Acceptance Criteria**:
  - [ ] System validates snapshot format and structure
  - [ ] System validates snapshot version compatibility
  - [ ] System verifies required fields are present
  - [ ] System marks corrupted tasks as failed
  - [ ] System provides clear errors for validation failures
- **Rationale**: State corruption can occur during crashes. Validation prevents attempting to resume from corrupted state.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-074: Task Directory Structure Management

- **Requirement**: The system SHALL create and maintain organized directory structure for each task so that task artifacts are well-organized.
- **Priority**: High
  - **High**: Organization is essential for debugging and artifact management
- **Acceptance Criteria**:
  - [ ] System creates task directory on workflow start
  - [ ] Task directory includes subdirectories for logs and artifacts
  - [ ] Artifacts are organized by phase name
  - [ ] Directory structure is consistent across tasks
  - [ ] Directories are created automatically as needed
- **Rationale**: Consistent directory structure enables predictable artifact location and simplifies debugging workflows.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-075: External Task Information Caching

- **Requirement**: The system SHALL cache external task information locally for offline execution so that workflows don't depend on external service availability.
- **Priority**: High
  - **High**: Local caching enables reliable offline execution
- **Acceptance Criteria**:
  - [ ] System fetches task info from external source on workflow start
  - [ ] System stores task info in local cache
  - [ ] Cached info is used during workflow execution
  - [ ] Cache is stored in human-readable format
  - [ ] Cache prevents repeated API calls during execution
- **Rationale**: External services may be slow or unavailable. Local caching improves performance and enables offline operation.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-076: Workflow Listing

- **Requirement**: The system SHALL list all available workflow definitions so that users can discover and select workflows.
- **Priority**: Medium
  - **Medium**: Improves discoverability but users can access workflows by name
- **Acceptance Criteria**:
  - [ ] System scans workflow directory for definitions
  - [ ] System returns list of workflow names
  - [ ] List includes all valid workflow files
  - [ ] List excludes invalid or corrupted workflows
  - [ ] List operation is fast (no validation overhead)
- **Rationale**: Workflow listing enables discovery and selection without needing to remember exact names.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-077: Real-Time Log Appending

- **Requirement**: The system SHALL append log entries in real-time during execution so that progress can be monitored as it happens.
- **Priority**: High
  - **High**: Real-time logging enables live monitoring
- **Acceptance Criteria**:
  - [ ] Log entries are written immediately when events occur
  - [ ] Log files can be tailed while workflow is executing
  - [ ] Concurrent writes to same log file are handled safely
  - [ ] Log entries include millisecond-precision timestamps
  - [ ] Log writes don't significantly impact execution performance
- **Rationale**: Real-time logging enables monitoring long-running workflows and immediate visibility into execution progress.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-078: Artifact Retrieval

- **Requirement**: The system SHALL retrieve stored artifacts by task, phase, and artifact type so that artifacts can be accessed for review.
- **Priority**: Medium
  - **Medium**: Improves debugging experience but not essential for core workflows
- **Acceptance Criteria**:
  - [ ] System loads artifacts by task ID, phase name, and type
  - [ ] System returns artifact content or file path
  - [ ] System handles missing artifacts gracefully
  - [ ] Retrieval supports both text and binary artifacts
  - [ ] Retrieval provides clear errors for missing artifacts
- **Rationale**: Artifact retrieval enables programmatic access to execution history for debugging and analysis tools.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-079: Configuration Defaults

- **Requirement**: The system SHALL provide default configuration values when user configuration is absent so that system works out-of-the-box.
- **Priority**: High
  - **High**: Defaults enable zero-configuration startup
- **Acceptance Criteria**:
  - [ ] System uses default model when not specified
  - [ ] System uses default permission mode when not specified
  - [ ] System provides sensible provider defaults
  - [ ] Defaults are documented and predictable
  - [ ] Defaults enable basic functionality without configuration
- **Rationale**: Default configuration enables new users to start using system immediately without complex setup.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-080: Task Cleanup

- **Requirement**: The system SHALL support cleanup operations for completed or failed tasks so that disk space can be reclaimed.
- **Priority**: Low
  - **Low**: Space management feature not essential for core functionality
- **Acceptance Criteria**:
  - [ ] System can delete task directories
  - [ ] Cleanup removes all task artifacts and logs
  - [ ] Cleanup operation requires confirmation
  - [ ] System provides cleanup statistics (space reclaimed)
  - [ ] Cleanup can target specific tasks or all completed tasks
- **Rationale**: Over time, task artifacts accumulate and consume disk space. Cleanup enables space management.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### FR-081: Version-Based Snapshot Compatibility

- **Requirement**: The system SHALL validate snapshot version compatibility before restoration so that version mismatches are detected early.
- **Priority**: High
  - **High**: Version checking prevents restoration failures
- **Acceptance Criteria**:
  - [ ] Snapshots include version identifier
  - [ ] System validates snapshot version on load
  - [ ] System rejects snapshots from newer versions
  - [ ] System provides clear error for version mismatches
  - [ ] Version check happens before restoration attempt
- **Rationale**: Snapshot format may evolve over time. Version checking prevents attempting to restore incompatible snapshots.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

### 4.12 CLI Interface

<!-- Requirements extracted from: design/alfred/06-interface/cli-commands.md -->

#### FR-111: Command Hierarchy Structure

- **Requirement**: The system SHALL provide a three-level command hierarchy using noun-verb-arguments format so that commands are organized and predictable.
- **Priority**: Critical
  - **Critical**: Command structure is fundamental to CLI usability
- **Acceptance Criteria**:
  - [ ] All commands follow noun-verb-arguments pattern
  - [ ] Command structure supports grouping by domain (workflow, task, command)
  - [ ] Subcommands are consistently organized under parent nouns
  - [ ] Command hierarchy is documented in help system
- **Rationale**: Consistent command structure improves discoverability and reduces learning curve for users.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-112: Workflow Execution Command

- **Requirement**: The system SHALL execute multi-step workflows by name with task identifier when requested.
- **Priority**: Critical
  - **Critical**: Core workflow execution capability
- **Acceptance Criteria**:
  - [ ] System accepts workflow name as parameter
  - [ ] System accepts task identifier as required parameter
  - [ ] System loads workflow definition from storage
  - [ ] System executes all workflow phases in sequence
  - [ ] System reports execution progress and results
- **Rationale**: Workflow execution is the primary use case for the system.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-113: Workflow Listing

- **Requirement**: The system SHALL list all available workflows so that users can discover what workflows exist.
- **Priority**: High
  - **High**: Essential for workflow discovery
- **Acceptance Criteria**:
  - [ ] System scans workflow storage location
  - [ ] System displays workflow names
  - [ ] System displays workflow descriptions
  - [ ] Output is formatted for readability
- **Rationale**: Users need to discover available workflows before executing them.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-114: Workflow Validation

- **Requirement**: The system SHALL validate workflow definitions when requested so that errors are caught before execution.
- **Priority**: High
  - **High**: Prevents runtime failures from invalid definitions
- **Acceptance Criteria**:
  - [ ] System parses workflow definition
  - [ ] System validates syntax against schema
  - [ ] System validates referenced commands exist
  - [ ] System validates dependency references
  - [ ] System reports specific validation errors
- **Rationale**: Early validation prevents wasted time and confusing runtime errors.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-115: Workflow Details Display

- **Requirement**: The system SHALL display workflow details including phases and commands when requested.
- **Priority**: Medium
  - **Medium**: Useful for understanding workflow structure
- **Acceptance Criteria**:
  - [ ] System displays workflow metadata (name, description)
  - [ ] System displays all phases in order
  - [ ] System displays commands for each phase
  - [ ] System displays dependencies between phases
  - [ ] Output is formatted for readability
- **Rationale**: Users need to understand workflow structure before execution.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-116: Individual Command Execution

- **Requirement**: The system SHALL execute individual commands by name with task identifier when requested.
- **Priority**: Critical
  - **Critical**: Supports ad-hoc command execution
- **Acceptance Criteria**:
  - [ ] System accepts command name as parameter
  - [ ] System accepts task identifier as required parameter
  - [ ] System loads command template from storage
  - [ ] System executes command with context
  - [ ] System reports execution results
- **Rationale**: Users need ability to run single commands without full workflow.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-117: Command Listing with Namespace Support

- **Requirement**: The system SHALL list available commands with optional namespace filtering so that users can discover commands.
- **Priority**: High
  - **High**: Essential for command discovery
- **Acceptance Criteria**:
  - [ ] System scans command storage location
  - [ ] System displays command names
  - [ ] System supports filtering by namespace
  - [ ] System displays command metadata
  - [ ] Output is formatted for readability
- **Rationale**: Users need to discover available commands and understand organization.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-118: Command Template Display

- **Requirement**: The system SHALL display command template content when requested so that users understand command inputs.
- **Priority**: Medium
  - **Medium**: Helpful for understanding command behavior
- **Acceptance Criteria**:
  - [ ] System reads command template file
  - [ ] System displays template content
  - [ ] System identifies template variables
  - [ ] Output is formatted for readability
- **Rationale**: Users need to understand what a command does before executing it.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-119: Custom Command Arguments

- **Requirement**: The system SHALL accept custom key-value arguments for command execution so that commands can be parameterized.
- **Priority**: High
  - **High**: Required for flexible command execution
- **Acceptance Criteria**:
  - [ ] System accepts multiple key-value pairs
  - [ ] System makes arguments available to command context
  - [ ] System validates argument format
  - [ ] Arguments override template defaults
  - [ ] Invalid arguments produce clear error messages
- **Rationale**: Commands need runtime parameterization for different scenarios.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-120: Task Retrieval from External System

- **Requirement**: The system SHALL retrieve task details from external task management system when requested.
- **Priority**: Critical
  - **Critical**: Core integration capability
- **Acceptance Criteria**:
  - [ ] System connects to external task system
  - [ ] System fetches task by identifier
  - [ ] System displays task metadata
  - [ ] System caches task details locally
  - [ ] System handles connection errors gracefully
- **Rationale**: Workflows need task context from external systems.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-121: Task Creation in External System

- **Requirement**: The system SHALL create tasks in external system with summary, description, and project.
- **Priority**: High
  - **High**: Enables task creation workflow
- **Acceptance Criteria**:
  - [ ] System accepts task summary
  - [ ] System accepts optional description
  - [ ] System accepts project identifier
  - [ ] System creates task via external API
  - [ ] System returns created task identifier
- **Rationale**: Users need to create tasks as part of workflow initialization.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-122: Task Updates in External System

- **Requirement**: The system SHALL update task status and fields in external system when requested.
- **Priority**: High
  - **High**: Required for task lifecycle management
- **Acceptance Criteria**:
  - [ ] System accepts task identifier
  - [ ] System accepts fields to update
  - [ ] System updates task via external API
  - [ ] System validates field values
  - [ ] System confirms update success
- **Rationale**: Task status must be synchronized as workflows progress.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-123: Task Search in External System

- **Requirement**: The system SHALL search tasks in external system by assignee, status, or custom query.
- **Priority**: Medium
  - **Medium**: Useful for task discovery
- **Acceptance Criteria**:
  - [ ] System accepts search filters (assignee, status)
  - [ ] System accepts custom query syntax
  - [ ] System queries external API
  - [ ] System displays matching tasks
  - [ ] System handles empty results gracefully
- **Rationale**: Users need to find relevant tasks to work on.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-124: Task Comments

- **Requirement**: The system SHALL add comments to tasks in external system when requested.
- **Priority**: Medium
  - **Medium**: Supports task collaboration
- **Acceptance Criteria**:
  - [ ] System accepts task identifier
  - [ ] System accepts comment text
  - [ ] System posts comment via external API
  - [ ] System confirms comment creation
  - [ ] System handles failures with clear messages
- **Rationale**: Users need to document progress and communicate on tasks.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-125: Task Assignment

- **Requirement**: The system SHALL assign tasks to users in external system when requested.
- **Priority**: High
  - **High**: Required for task management
- **Acceptance Criteria**:
  - [ ] System accepts task identifier
  - [ ] System accepts user identifier
  - [ ] System updates assignee via external API
  - [ ] System validates user exists
  - [ ] System confirms assignment success
- **Rationale**: Task assignment is fundamental to task management workflows.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-126: Task State Transitions

- **Requirement**: The system SHALL transition tasks between workflow states in external system.
- **Priority**: High
  - **High**: Required for task lifecycle
- **Acceptance Criteria**:
  - [ ] System accepts task identifier
  - [ ] System accepts target state
  - [ ] System validates transition is allowed
  - [ ] System performs transition via external API
  - [ ] System handles transition failures gracefully
- **Rationale**: Tasks must move through defined workflow states.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-127: Task Execution Status Display

- **Requirement**: The system SHALL display task execution history and current status when requested.
- **Priority**: Critical
  - **Critical**: Essential for monitoring execution
- **Acceptance Criteria**:
  - [ ] System loads task execution state
  - [ ] System displays workflow progress
  - [ ] System displays completed phases
  - [ ] System displays phase outputs
  - [ ] System displays error history if applicable
- **Rationale**: Users need visibility into workflow execution progress.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-128: Web UI Launch

- **Requirement**: The system SHALL launch web-based interface for workflow management when requested.
- **Priority**: Medium
  - **Medium**: Alternative interface option
- **Acceptance Criteria**:
  - [ ] System starts web server
  - [ ] System opens interface in browser
  - [ ] Interface accepts task identifier parameter
  - [ ] Interface accepts port parameter
  - [ ] System handles port conflicts gracefully
- **Rationale**: Web interface provides richer visualization and interaction.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-129: Project Initialization

- **Requirement**: The system SHALL initialize configuration in project directory when requested.
- **Priority**: Critical
  - **Critical**: Required for first-time setup
- **Acceptance Criteria**:
  - [ ] System creates configuration directory structure
  - [ ] System creates default configuration files
  - [ ] System prompts for initial settings
  - [ ] System validates configuration values
  - [ ] System confirms successful initialization
- **Rationale**: Users need guided setup for new projects.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-130: Help Documentation

- **Requirement**: The system SHALL provide help documentation for all commands when requested.
- **Priority**: Critical
  - **Critical**: Essential for usability
- **Acceptance Criteria**:
  - [ ] Every command has help text
  - [ ] Help includes usage syntax
  - [ ] Help includes parameter descriptions
  - [ ] Help includes examples
  - [ ] Help is displayed with --help flag
- **Rationale**: Users need reference documentation for command usage.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-131: AI Model Selection

- **Requirement**: The system SHALL allow selection of different AI models for workflow and command execution.
- **Priority**: High
  - **High**: Enables performance/cost tradeoffs
- **Acceptance Criteria**:
  - [ ] System accepts model parameter
  - [ ] System validates model is available
  - [ ] System uses specified model for execution
  - [ ] System falls back to default if model unavailable
  - [ ] System documents available models in help
- **Rationale**: Different tasks require different model capabilities and cost profiles.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-132: JSON Output Format

- **Requirement**: The system SHALL output results in JSON format when requested so that output is machine-parseable.
- **Priority**: High
  - **High**: Required for automation and scripting
- **Acceptance Criteria**:
  - [ ] System accepts JSON output flag
  - [ ] System outputs valid JSON
  - [ ] JSON includes all relevant data fields
  - [ ] JSON structure is documented
  - [ ] Errors are also formatted as JSON
- **Rationale**: Automation tools need structured, parseable output.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### FR-133: Color Output Control

- **Requirement**: The system SHALL support disabling colored output when requested or when output is redirected.
- **Priority**: Medium
  - **Medium**: Important for log file compatibility
- **Acceptance Criteria**:
  - [ ] System accepts no-color flag
  - [ ] System respects NO_COLOR environment variable
  - [ ] System auto-detects non-TTY output
  - [ ] Disabled colors don't break formatting
  - [ ] Color state is consistent across output
- **Rationale**: Color codes break log files and some terminal environments.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

### 4.13 Web UI Requirements

<!-- Requirements extracted from: design/alfred/06-interface/web-ui-core.md -->

#### 4.13.1 Workflow Visualization

#### FR-134: Real-Time Workflow Graph Display

- **Requirement**: The system SHALL provide real-time graphical representation of workflow execution showing sequential phases, parallel execution, conditional branching, and iteration loops so that users can understand workflow structure and progress at a glance.
- **Priority**: Critical
  - **Critical**: Core visualization capability for workflow monitoring
- **Acceptance Criteria**:
  - [ ] Workflow graph displays all phase types (sequential, parallel, conditional, iteration)
  - [ ] Graph updates in real-time as workflow executes
  - [ ] Visual distinction between different phase types
- **Rationale**: Core visualization capability for workflow monitoring enables users to understand complex workflows visually.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-135: Phase Status Visualization

- **Requirement**: The system SHALL display workflow phases with status indicators for pending, running, completed, failed, and skipped states so that users can track execution progress.
- **Priority**: Critical
  - **Critical**: Essential for understanding workflow execution state
- **Acceptance Criteria**:
  - [ ] Each phase shows current status with visual indicator
  - [ ] Status updates reflect backend state changes within 1 second
  - [ ] Failed phases display error information
- **Rationale**: Users need to understand which phases are executing and their outcomes to monitor workflow health.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-136: Interactive Graph Navigation

- **Requirement**: The system SHALL support interactive workflow graph navigation including pan, zoom, and fit-to-view capabilities so that users can explore complex workflows.
- **Priority**: High
  - **High**: Required for usability with complex workflows
- **Acceptance Criteria**:
  - [ ] Users can pan graph with mouse drag
  - [ ] Users can zoom with mouse wheel or pinch gesture
  - [ ] Keyboard shortcuts supported (arrows for pan, +/- for zoom)
  - [ ] Fit-to-view button centers and scales entire graph
- **Rationale**: Complex workflows with many phases require navigation controls for effective exploration.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-137: Phase-Chat Synchronization

- **Requirement**: The system SHALL provide clickable workflow nodes that synchronize with chat interface so that users can navigate to specific phase messages.
- **Priority**: Medium
  - **Medium**: Improves navigation efficiency
- **Acceptance Criteria**:
  - [ ] Clicking node scrolls chat to corresponding phase messages
  - [ ] Selected node displays visual highlight
- **Rationale**: Enables correlation between visual workflow representation and detailed execution logs.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-138: Phase Detail Tooltips

- **Requirement**: The system SHALL display detailed phase information on hover including phase name, command, duration, session ID, and output file path so that users can inspect phase details without navigation.
- **Priority**: Medium
  - **Medium**: Convenient for quick inspection
- **Acceptance Criteria**:
  - [ ] Tooltip appears on node hover with all metadata
  - [ ] Tooltip displays within 200ms of hover
- **Rationale**: Quick access to phase metadata improves workflow understanding without requiring navigation away from graph.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### 4.13.2 Real-Time Monitoring

#### FR-139: AI Agent Activity Display

- **Requirement**: The system SHALL display AI agent activity in chat-style interface showing tool usage, thinking blocks, and execution progress so that users can monitor detailed execution behavior.
- **Priority**: Critical
  - **Critical**: Core monitoring capability
- **Acceptance Criteria**:
  - [ ] Chat displays phase start/complete messages
  - [ ] Tool usage shown with parameters and status
  - [ ] Assistant messages and thinking blocks displayed
  - [ ] Messages appear in chronological order
- **Rationale**: Users need detailed visibility into AI agent actions during workflow execution to understand and debug behavior.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-140: Auto-Scroll Message Feed

- **Requirement**: The system SHALL support auto-scroll behavior that follows new messages with option to disable when user scrolls up so that users can review history without losing position.
- **Priority**: High
  - **High**: Essential for monitoring live execution
- **Acceptance Criteria**:
  - [ ] New messages automatically scroll chat to bottom
  - [ ] User scrolling up disables auto-scroll
  - [ ] "New messages" indicator appears when scrolled up
  - [ ] Clicking indicator re-enables auto-scroll and jumps to bottom
- **Rationale**: Balance between staying current with execution and reviewing historical messages improves usability.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-141: Phase-Based Message Filtering

- **Requirement**: The system SHALL filter chat messages by phase selection so that users can focus on specific phase execution.
- **Priority**: Medium
  - **Medium**: Useful for large workflows with many messages
- **Acceptance Criteria**:
  - [ ] User can select phase to filter messages
  - [ ] Only messages from selected phase displayed
  - [ ] Clear all filters option available
- **Rationale**: Large workflows generate many messages; filtering helps focus on specific phases of interest.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-142: Tool Execution Display

- **Requirement**: The system SHALL display tool execution with parameters, status (pending/completed/error), and results so that users understand tool usage patterns.
- **Priority**: High
  - **High**: Critical for understanding AI behavior
- **Acceptance Criteria**:
  - [ ] Tool name and parameters shown when tool invoked
  - [ ] Status updates from pending to completed/error
  - [ ] Results displayed for completed tool executions
- **Rationale**: Tool usage is central to AI agent behavior; users need visibility into what tools are being used and their outcomes.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### 4.13.3 State Management

#### FR-143: Stateless UI Architecture

- **Requirement**: The system SHALL maintain stateless UI where all workflow and task state resides in backend so that UI can be refreshed without data loss.
- **Priority**: Critical
  - **Critical**: Architectural requirement for reliability
- **Acceptance Criteria**:
  - [ ] Page refresh restores full workflow state from backend
  - [ ] Multiple browser tabs show synchronized view
  - [ ] No workflow state persisted in frontend storage
- **Rationale**: Stateless architecture enables reliability, multi-client support, and prevents state synchronization issues.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-144: Initial State Hydration

- **Requirement**: The system SHALL fetch initial state from backend on connection including workflow definition, phase status, and message history so that UI displays current execution state.
- **Priority**: Critical
  - **Critical**: Required for UI initialization
- **Acceptance Criteria**:
  - [ ] Initial state loaded within 1 second of connection
  - [ ] All phases with historical status displayed
  - [ ] Message history populated in chat
- **Rationale**: New connections or page refreshes must restore complete state to provide accurate view of workflow execution.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-145: UI Preferences Persistence

- **Requirement**: The system SHALL persist UI preferences including theme and layout settings in browser local storage so that user preferences survive page refreshes.
- **Priority**: Medium
  - **Medium**: Quality of life improvement
- **Acceptance Criteria**:
  - [ ] Theme selection (light/dark/system) persisted
  - [ ] Panel width adjustments persisted
  - [ ] Preferences restored on page load
- **Rationale**: UI customization should persist across sessions for better user experience.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-146: Sub-Second State Updates

- **Requirement**: The system SHALL update UI state from backend events with sub-second latency so that users see near real-time execution progress.
- **Priority**: Critical
  - **Critical**: Required for real-time monitoring
- **Acceptance Criteria**:
  - [ ] State updates appear within 1 second of backend event
  - [ ] No visible lag between execution and UI update
  - [ ] Event order preserved in UI
- **Rationale**: Real-time monitoring requires low-latency updates to be useful for observing workflow execution.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### 4.13.4 Communication Layer

#### FR-147: WebSocket Event Streaming

- **Requirement**: The system SHALL communicate with backend via WebSocket protocol for real-time event streaming so that UI receives workflow execution updates with minimal latency.
- **Priority**: Critical
  - **Critical**: Core communication mechanism
- **Acceptance Criteria**:
  - [ ] WebSocket connection established on UI load
  - [ ] Events received and processed within 1 second
  - [ ] Connection supports bidirectional communication
- **Rationale**: Real-time updates require persistent bidirectional connection; HTTP polling would introduce unacceptable latency.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-148: Connection Health Monitoring

- **Requirement**: The system SHALL support WebSocket connection health monitoring with heartbeat mechanism so that stale connections are detected and recovered.
- **Priority**: High
  - **High**: Required for reliability
- **Acceptance Criteria**:
  - [ ] Heartbeat messages sent at regular intervals
  - [ ] Disconnected sockets detected within 30 seconds
  - [ ] Automatic reconnection attempted on disconnect
- **Rationale**: Network issues must be detected and recovered automatically to maintain reliable monitoring.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-149: Comprehensive Event Support

- **Requirement**: The system SHALL receive workflow events including workflow lifecycle, phase transitions, tool usage, and assistant messages so that UI can synchronize with backend state.
- **Priority**: Critical
  - **Critical**: Complete event coverage required
- **Acceptance Criteria**:
  - [ ] All event types defined and handled
  - [ ] Events include timestamp and payload data
  - [ ] Event schema versioned for compatibility
- **Rationale**: Complete event coverage required for full UI synchronization with backend workflow execution.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-150: Multi-Client Support

- **Requirement**: The system SHALL support multiple concurrent UI clients viewing same task so that teams can collaborate on workflow monitoring.
- **Priority**: Medium
  - **Medium**: Enables team collaboration
- **Acceptance Criteria**:
  - [ ] Multiple browser tabs connect to same task
  - [ ] All clients receive same events
  - [ ] Connection pooling manages multiple clients per task
- **Rationale**: Team collaboration requires multi-client support for shared workflow observation.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-151: Task State REST API

- **Requirement**: The system SHALL provide REST API endpoint for fetching task state so that UI can hydrate on initial connection.
- **Priority**: Critical
  - **Critical**: Required for UI initialization
- **Acceptance Criteria**:
  - [ ] GET /tasks/{taskId}/state endpoint available
  - [ ] Response includes workflow definition, phases, and messages
  - [ ] Response time under 500ms for typical task
- **Rationale**: Initial state fetch required for page load and reconnection to display current workflow status.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### 4.13.5 User Interface

#### FR-152: Two-Panel Layout

- **Requirement**: The system SHALL provide two-panel layout with chat interface (40% width) and workflow visualization (60% width) so that users can monitor both execution details and workflow structure.
- **Priority**: Critical
  - **Critical**: Core UI layout requirement
- **Acceptance Criteria**:
  - [ ] Layout displays both panels simultaneously
  - [ ] Panel widths adjustable by user
  - [ ] Layout responsive to window resizing
- **Rationale**: Dual-view enables comprehensive workflow monitoring by showing both high-level structure and detailed logs.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-153: Contextual Header

- **Requirement**: The system SHALL display header with task ID, workflow name, status badge, and settings so that users can identify current execution context.
- **Priority**: High
  - **High**: Required for multi-task context awareness
- **Acceptance Criteria**:
  - [ ] Header shows task ID and workflow name
  - [ ] Status badge reflects current execution state
  - [ ] Settings accessible from header
- **Rationale**: Context awareness essential for multi-task monitoring and navigation.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-154: Theme Support

- **Requirement**: The system SHALL support light and dark themes with system preference detection so that users can customize visual appearance.
- **Priority**: Medium
  - **Medium**: Improves accessibility and user satisfaction
- **Acceptance Criteria**:
  - [ ] Light theme available
  - [ ] Dark theme available
  - [ ] System preference auto-detection
  - [ ] Theme toggle in UI
- **Rationale**: Theme support improves accessibility and accommodates user visual preferences and environmental lighting.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-155: Responsive Multi-Device Design

- **Requirement**: The system SHALL provide responsive design supporting desktop, tablet, and mobile devices so that users can monitor workflows on any device.
- **Priority**: High
  - **High**: Modern multi-device usage expectation
- **Acceptance Criteria**:
  - [ ] Desktop (≥1024px): Two-panel layout
  - [ ] Tablet (768-1023px): Condensed two-panel layout
  - [ ] Mobile (<768px): Tabbed interface with swipe
- **Rationale**: Modern applications require multi-device support for users working across different contexts.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-156: Event Notifications

- **Requirement**: The system SHALL display notifications for workflow errors and critical events so that users are alerted to important state changes.
- **Priority**: High
  - **High**: Critical for error awareness
- **Acceptance Criteria**:
  - [ ] Toast notifications for errors
  - [ ] Notification types: info, success, warning, error
  - [ ] Dismissible notifications
  - [ ] Configurable duration
- **Rationale**: Users need alerts for failures and important events to respond quickly to issues.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### 4.13.6 Deployment & Scalability

#### FR-157: Local Deployment Mode

- **Requirement**: The system SHALL support local deployment mode where CLI serves UI static files and WebSocket server so that users can run UI on single machine.
- **Priority**: Critical
  - **Critical**: Primary deployment model for MVP
- **Acceptance Criteria**:
  - [ ] CLI serves UI on HTTP port
  - [ ] WebSocket server runs on separate port
  - [ ] No authentication required for localhost
  - [ ] Single-user mode supported
- **Rationale**: Local-first deployment enables offline usage, privacy, and simplicity for individual developers.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-158: Cloud Deployment Mode

- **Requirement**: The system SHALL support cloud deployment mode with authentication, multi-tenant isolation, and horizontal scaling so that system can serve multiple users.
- **Priority**: Low
  - **Low**: Phase 2+ feature for future cloud offering
- **Acceptance Criteria**:
  - [ ] JWT authentication for WebSocket connections
  - [ ] TLS encryption (wss://)
  - [ ] Multi-tenant connection pooling
  - [ ] Horizontal scaling support
- **Rationale**: Future cloud deployment requires multi-user support with proper security and scalability.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-159: Backend Connection Abstraction

- **Requirement**: The system SHALL abstract backend connection interface so that local and cloud implementations can be swapped without UI code changes.
- **Priority**: High
  - **High**: Architectural requirement for cloud-readiness
- **Acceptance Criteria**:
  - [ ] Backend abstraction interface defined
  - [ ] Local implementation available
  - [ ] Cloud implementation swappable via configuration
  - [ ] No UI code changes required for deployment mode switch
- **Rationale**: Cloud-ready architecture enables future scalability without requiring UI rewrite.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### FR-160: Environment-Based Configuration

- **Requirement**: The system SHALL configure deployment mode via environment variables so that same codebase supports both local and cloud deployment.
- **Priority**: High
  - **High**: Required for flexible deployment
- **Acceptance Criteria**:
  - [ ] VITE_MODE environment variable controls deployment
  - [ ] VITE_WS_URL configures WebSocket endpoint
  - [ ] VITE_API_URL configures REST API endpoint
  - [ ] Default values support local deployment
- **Rationale**: Environment-based configuration enables flexible deployment without code changes.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

### 4.14 Desktop UI Requirements

<!-- Requirements extracted from: design/alfred/06-interface/electron-shell.md -->

#### 4.14.1 Desktop Application Core

#### FR-161: Desktop Graphical Interface

- **Requirement**: The system SHALL provide a desktop graphical user interface for workflow management so that users can interact with workflows through a native application.
- **Priority**: High
  - **High**: Alternative interface option for desktop users
- **Acceptance Criteria**:
  - [ ] Desktop application runs on macOS, Windows, and Linux
  - [ ] Application provides native window management
  - [ ] Application integrates with operating system UI conventions
- **Rationale**: Desktop application provides native experience for users who prefer installed applications over web interfaces.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-162: Multiple Concurrent Workflow Windows

- **Requirement**: The system SHALL support multiple concurrent workflow windows so that users can monitor multiple workflows simultaneously.
- **Priority**: Medium
  - **Medium**: Enables advanced multi-tasking scenarios
- **Acceptance Criteria**:
  - [ ] User can open multiple workflow windows
  - [ ] Each window tracks independent workflow execution
  - [ ] Windows can be arranged and managed independently
- **Rationale**: Power users need to monitor multiple workflows concurrently for complex development scenarios.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-163: Direct Core Library Integration

- **Requirement**: The system SHALL integrate with core workflow execution library directly without subprocess spawning so that desktop UI shares execution engine with CLI.
- **Priority**: Critical
  - **Critical**: Architectural requirement for consistency and performance
- **Acceptance Criteria**:
  - [ ] Desktop UI imports core library functions directly
  - [ ] No subprocess spawning for workflow execution
  - [ ] Shared event bus between UI and execution engine
- **Rationale**: Direct integration eliminates IPC overhead, ensures type safety, and maintains single execution engine implementation.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### 4.14.2 Workflow Visualization

#### FR-164: Interactive Workflow Graph Rendering

- **Requirement**: The system SHALL display real-time workflow visualization using interactive graph rendering so that users can understand workflow structure and progress visually.
- **Priority**: Critical
  - **Critical**: Core desktop UI capability
- **Acceptance Criteria**:
  - [ ] Workflow graph displays all phases as interactive nodes
  - [ ] Graph updates in real-time during execution
  - [ ] User can interact with nodes (click, hover)
- **Rationale**: Visual workflow representation is core value proposition of desktop UI over CLI.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-165: Sequential Phase Visualization

- **Requirement**: The system SHALL visualize sequential workflow phases as connected nodes so that users can understand execution order.
- **Priority**: Critical
  - **Critical**: Core visualization requirement
- **Acceptance Criteria**:
  - [ ] Sequential phases displayed as vertical or horizontal chain
  - [ ] Connections show execution flow direction
  - [ ] Phase names and status visible on nodes
- **Rationale**: Sequential execution is primary workflow pattern and must be clearly visualized.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-166: Parallel Execution Visualization

- **Requirement**: The system SHALL visualize parallel execution blocks with multiple simultaneous branches so that users can identify concurrent operations.
- **Priority**: High
  - **High**: Important for understanding parallelism
- **Acceptance Criteria**:
  - [ ] Parallel blocks displayed with multiple branches
  - [ ] Branches clearly grouped as parallel set
  - [ ] Concurrent execution indicated visually
- **Rationale**: Parallel execution requires distinct visual representation to communicate concurrency.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-167: Conditional Execution Visualization

- **Requirement**: The system SHALL visualize conditional execution branches so that users can understand decision points in workflows.
- **Priority**: High
  - **High**: Required for conditional workflow support
- **Acceptance Criteria**:
  - [ ] Conditional branches displayed with decision nodes
  - [ ] Branches labeled with conditions
  - [ ] Taken/not-taken paths indicated during execution
- **Rationale**: Conditional logic requires clear visualization of decision points and branch outcomes.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-168: Dependency Visualization

- **Requirement**: The system SHALL display dependencies between workflow phases using connecting edges so that users understand phase relationships.
- **Priority**: High
  - **High**: Critical for complex workflows
- **Acceptance Criteria**:
  - [ ] Dependencies shown as directed edges between nodes
  - [ ] Edge direction indicates dependency flow
  - [ ] Edge styling distinguishes dependency types
- **Rationale**: Dependencies between phases must be visualized to understand workflow structure and execution constraints.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-169: Real-Time Phase Status Updates

- **Requirement**: The system SHALL display real-time status updates for executing phases including pending, running, completed, and failed states so that users can monitor progress.
- **Priority**: Critical
  - **Critical**: Essential for execution monitoring
- **Acceptance Criteria**:
  - [ ] Phase nodes update status in real-time
  - [ ] Status changes reflected within 1 second
  - [ ] Visual indicators distinguish each status type
- **Rationale**: Real-time status visibility is core requirement for monitoring workflow execution.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### 4.14.3 Interactive Chat Interface

#### FR-170: AI Agent Chat Display

- **Requirement**: The system SHALL provide interactive chat interface for AI agent communication displaying messages, tool usage, and thinking blocks so that users can observe detailed agent behavior.
- **Priority**: Critical
  - **Critical**: Core monitoring capability
- **Acceptance Criteria**:
  - [ ] Chat displays all AI agent messages
  - [ ] Tool invocations shown with parameters
  - [ ] Thinking blocks displayed when available
  - [ ] Messages displayed in chronological order
- **Rationale**: Chat interface provides detailed view of AI agent execution complementing high-level workflow visualization.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-171: Tool Usage Display

- **Requirement**: The system SHALL display tool usage during AI agent execution showing tool names, parameters, and results so that users understand what actions agent is taking.
- **Priority**: High
  - **High**: Important for understanding agent behavior
- **Acceptance Criteria**:
  - [ ] Tool names displayed when invoked
  - [ ] Tool parameters shown in readable format
  - [ ] Tool results displayed after execution
  - [ ] Failed tool executions clearly indicated
- **Rationale**: Tool usage visibility helps users understand and debug AI agent behavior.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### 4.14.4 Drag-and-Drop Workflow Builder

#### FR-172: Drag-and-Drop Workflow Construction

- **Requirement**: The system SHALL support drag-and-drop workflow construction so that users can visually build workflows without editing YAML files.
- **Priority**: Medium
  - **Medium**: Quality of life improvement for workflow creation
- **Acceptance Criteria**:
  - [ ] User can drag phase nodes onto canvas
  - [ ] User can connect nodes to define dependencies
  - [ ] User can configure node properties via UI
  - [ ] Builder generates valid workflow definition
- **Rationale**: Visual workflow builder lowers barrier to workflow creation for users unfamiliar with YAML syntax.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### 4.14.5 Execution Control

#### FR-173: Workflow Execution Controls

- **Requirement**: The system SHALL provide interactive controls for workflow execution including pause, resume, and cancel operations so that users can control running workflows.
- **Priority**: High
  - **High**: Important for workflow management
- **Acceptance Criteria**:
  - [ ] Pause button stops workflow at phase boundary
  - [ ] Resume button continues paused workflow
  - [ ] Cancel button terminates workflow execution
  - [ ] Control state updates reflect workflow status
- **Rationale**: Interactive controls enable users to manage long-running workflows and respond to issues.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-174: Task Execution History

- **Requirement**: The system SHALL display execution history for tasks showing previous runs and their outcomes so that users can review historical executions.
- **Priority**: Medium
  - **Medium**: Useful for troubleshooting and auditing
- **Acceptance Criteria**:
  - [ ] History shows list of task executions
  - [ ] Each entry shows timestamp, status, and duration
  - [ ] User can select historical execution to view details
- **Rationale**: Historical view helps users understand task behavior over time and debug recurring issues.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### 4.14.6 Communication Architecture

#### FR-175: Inter-Process Command Channel

- **Requirement**: The system SHALL communicate execution commands through inter-process channels for triggering workflows, loading definitions, and managing configuration so that UI can control backend operations.
- **Priority**: Critical
  - **Critical**: Required for UI-backend communication
- **Acceptance Criteria**:
  - [ ] UI can trigger workflow execution via IPC
  - [ ] UI can load workflow definitions via IPC
  - [ ] UI can read and write configuration via IPC
  - [ ] IPC channels are type-safe
- **Rationale**: Desktop application requires secure, type-safe communication between UI process and main process.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-176: Real-Time Event Streaming

- **Requirement**: The system SHALL stream execution events in real-time to UI including workflow lifecycle, phase transitions, and tool usage so that UI stays synchronized with execution state.
- **Priority**: Critical
  - **Critical**: Required for real-time monitoring
- **Acceptance Criteria**:
  - [ ] Events streamed from backend to UI with sub-second latency
  - [ ] All event types supported (workflow, phase, tool, message)
  - [ ] Events delivered in order
  - [ ] UI updates immediately upon receiving events
- **Rationale**: Real-time event streaming enables live monitoring of workflow execution in desktop UI.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### 4.14.7 Security and Permissions

#### FR-177: File Operation Permission Dialogs

- **Requirement**: The system SHALL prompt for user approval before file write operations so that users can review and authorize file modifications.
- **Priority**: High
  - **High**: Important security safeguard
- **Acceptance Criteria**:
  - [ ] Dialog shown before file write operations
  - [ ] Dialog displays file path and operation type
  - [ ] User can approve or deny operation
  - [ ] Denied operations do not execute
- **Rationale**: User approval for file operations prevents unintended or malicious file modifications.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-178: File Deletion Permission Dialogs

- **Requirement**: The system SHALL prompt for user approval before file delete operations so that users can prevent unintended data loss.
- **Priority**: High
  - **High**: Important data protection safeguard
- **Acceptance Criteria**:
  - [ ] Dialog shown before file deletion
  - [ ] Dialog displays file path and warning
  - [ ] User can approve or deny deletion
  - [ ] Denied deletions do not execute
- **Rationale**: Deletion requires explicit approval to prevent accidental data loss.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-179: Command Execution Permission Dialogs

- **Requirement**: The system SHALL prompt for user approval before executing system commands so that users can review potentially dangerous operations.
- **Priority**: High
  - **High**: Critical security control
- **Acceptance Criteria**:
  - [ ] Dialog shown before command execution
  - [ ] Dialog displays command and arguments
  - [ ] User can approve or deny execution
  - [ ] Denied commands do not execute
- **Rationale**: Command execution approval prevents execution of malicious or unintended system commands.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-180: Permission Decision Caching

- **Requirement**: The system SHALL cache permission decisions when requested by user so that repeated operations do not require repeated approvals.
- **Priority**: Medium
  - **Medium**: Quality of life improvement
- **Acceptance Criteria**:
  - [ ] Permission dialogs include "Remember this decision" option
  - [ ] Cached decisions apply to subsequent identical operations
  - [ ] User can clear cached permissions
- **Rationale**: Caching reduces approval fatigue for trusted, repeated operations while maintaining security.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### FR-181: Input Validation for Security

- **Requirement**: The system SHALL validate all input to prevent path traversal attacks and ensure absolute file paths so that malicious inputs cannot compromise system security.
- **Priority**: Critical
  - **Critical**: Critical security requirement
- **Acceptance Criteria**:
  - [ ] File paths validated to prevent "../" traversal
  - [ ] Only absolute paths accepted for file operations
  - [ ] Invalid paths rejected with error message
- **Rationale**: Input validation prevents common security vulnerabilities including path traversal attacks.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

### 4.15 Configuration Management

<!-- Requirements extracted from: design/alfred/01-types/command-configuration.md -->

#### FR-182: Global Workflow Defaults

- **Requirement**: The system SHALL support global default settings (provider, model, reasoning level, retry configuration) that apply to all workflow steps unless explicitly overridden.
- **Priority**: High
  - **High**: Core workflow capability needed for MVP
- **Acceptance Criteria**:
  - [ ] Workflows can define a `defaults` section with provider, model, reasoning, retry settings
  - [ ] Default settings apply to all steps that don't specify their own values
  - [ ] Step-level overrides take precedence over defaults
  - [ ] Missing defaults use system-level fallbacks
- **Rationale**: Global defaults reduce workflow definition verbosity and ensure consistent execution behavior across steps.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-183: Per-Step Configuration Override

- **Requirement**: The system SHALL allow per-step provider, model, and execution parameter overrides so that individual workflow steps can customize their execution environment.
- **Priority**: High
  - **High**: Enables multi-provider workflows and step-specific optimization
- **Acceptance Criteria**:
  - [ ] Steps can specify provider override
  - [ ] Steps can specify model override
  - [ ] Steps can specify reasoning level override
  - [ ] Steps can specify max_turns override
  - [ ] Overrides apply only to the specific step
- **Rationale**: Different workflow steps may require different providers or models based on task complexity and cost optimization.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-184: Path Placeholder System

- **Requirement**: The system SHALL support path placeholder definitions for reusable file references within workflow definitions using `${paths.name}` syntax.
- **Priority**: Medium
  - **Medium**: Improves workflow maintainability but not essential for basic functionality
- **Acceptance Criteria**:
  - [ ] Workflows can define `paths` section with named path aliases
  - [ ] Path placeholders support variable substitution including `${taskId}`
  - [ ] Path placeholders can be used in context injection fields
  - [ ] Invalid path references produce clear error messages
- **Rationale**: Path placeholders reduce duplication and make workflows more maintainable when the same files are referenced multiple times.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-185: Fallback Command Configuration

- **Requirement**: The system SHALL support fallback command specification that executes when a primary command fails.
- **Priority**: High
  - **High**: Improves workflow reliability
- **Acceptance Criteria**:
  - [ ] Steps can specify a `fallback` command reference
  - [ ] Fallback command executes automatically when primary command fails
  - [ ] Fallback command receives context from failed command
  - [ ] System logs when fallback execution occurs
- **Rationale**: Fallback commands provide graceful degradation when complex commands fail, improving overall workflow reliability.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-186: Conditional Phase Execution

- **Requirement**: The system SHALL support conditional phase execution based on context expressions using `skipIf` configuration.
- **Priority**: Medium
  - **Medium**: Important for advanced workflows but not needed for basic use cases
- **Acceptance Criteria**:
  - [ ] Phases can specify `skipIf` condition expression
  - [ ] Condition expressions can reference context values
  - [ ] Phases are skipped when condition evaluates to true
  - [ ] Skipped phases are logged with skip reason
- **Rationale**: Conditional execution enables dynamic workflows that adapt based on previous phase outputs or context values.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-187: One-Time Phase Execution

- **Requirement**: The system SHALL support one-time phase execution that runs only once even when workflow iterates using `runOnce` configuration.
- **Priority**: Medium
  - **Medium**: Important for iterative workflows
- **Acceptance Criteria**:
  - [ ] Phases can specify `runOnce: true`
  - [ ] Phases marked runOnce execute only on first iteration
  - [ ] Subsequent iterations skip runOnce phases automatically
  - [ ] RunOnce status is tracked in workflow state
- **Rationale**: Setup phases should only run once even in iterative workflows to avoid redundant initialization.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-188: Iteration Block Configuration

- **Requirement**: The system SHALL support iteration blocks with configurable termination conditions, checkpoint resumption, and safety limits.
- **Priority**: High
  - **High**: Core capability for complex multi-step workflows
- **Acceptance Criteria**:
  - [ ] Phases can specify `iterate` block with `until` condition
  - [ ] Iterations can specify `checkpoint` for resumption points
  - [ ] Iterations can specify `maxIterations` safety limit
  - [ ] Iterations can specify `delay` between attempts
  - [ ] System stops when condition is met or limit reached
- **Rationale**: Iteration enables workflows that repeat until objectives are achieved, essential for autonomous development cycles.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-189: Exponential Backoff for Iterations

- **Requirement**: The system SHALL support exponential backoff delays between iteration attempts with configurable factor and maximum delay.
- **Priority**: Medium
  - **Medium**: Important for robust retry behavior
- **Acceptance Criteria**:
  - [ ] Iteration blocks can specify `backoff` configuration
  - [ ] Backoff supports `factor` multiplier
  - [ ] Backoff supports `maxDelay` ceiling
  - [ ] Delay increases exponentially between iterations
- **Rationale**: Exponential backoff prevents rapid retry loops and reduces resource consumption during error recovery.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-190: Nested Iteration Support

- **Requirement**: The system SHALL support nested iteration blocks within phases for multi-level iterative workflows.
- **Priority**: Medium
  - **Medium**: Advanced feature for complex workflows
- **Acceptance Criteria**:
  - [ ] Steps within iteration blocks can have their own iteration configuration
  - [ ] Nested iterations maintain independent counters
  - [ ] Nested iterations can have different termination conditions
  - [ ] State tracks all iteration levels correctly
- **Rationale**: Complex development workflows may require nested loops, such as iterating tasks with each task iterating until tests pass.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-191: Command Metadata Frontmatter

- **Requirement**: Commands SHALL support YAML frontmatter with metadata including description, model defaults, output schema, and context requirements.
- **Priority**: High
  - **High**: Core command definition capability
- **Acceptance Criteria**:
  - [ ] Commands support `id`, `name`, `description` fields
  - [ ] Commands support `model`, `reasoning`, `provider` defaults
  - [ ] Commands support `output_schema` for validation
  - [ ] Commands support `required_context` and `optional_context`
  - [ ] System validates frontmatter schema on load
- **Rationale**: Rich command metadata enables intelligent command selection, validation, and documentation generation.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-192: Command Output Schema Validation

- **Requirement**: The system SHALL validate command outputs against defined JSON schemas when `output_schema` is specified.
- **Priority**: High
  - **High**: Enables reliable command chaining and conditional logic
- **Acceptance Criteria**:
  - [ ] Commands can define JSON schema in frontmatter
  - [ ] System parses JSON output from command
  - [ ] System validates output against schema
  - [ ] Validation failures trigger retry with error feedback
  - [ ] Schema is injected into command prompt
- **Rationale**: Schema validation ensures command outputs are structured correctly for downstream consumption by dependent phases.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-193: Context Variable Declarations

- **Requirement**: Commands SHALL support required and optional context variable declarations for explicit dependency specification.
- **Priority**: Medium
  - **Medium**: Improves command documentation and validation
- **Acceptance Criteria**:
  - [ ] Commands can specify `required_context` array
  - [ ] Commands can specify `optional_context` array
  - [ ] System validates required context is available before execution
  - [ ] Missing required context produces clear error message
- **Rationale**: Explicit context declarations make command dependencies clear and enable pre-execution validation.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

#### FR-194: Backward Compatible Workflows

- **Requirement**: The system SHALL maintain backward compatibility so that existing workflows without new configuration features continue working unchanged.
- **Priority**: Critical
  - **Critical**: Essential for user trust and migration path
- **Acceptance Criteria**:
  - [ ] Workflows without defaults section execute successfully
  - [ ] Workflows without path placeholders execute successfully
  - [ ] Simple phase definitions work without iteration or condition
  - [ ] New features are optional and additive only
- **Rationale**: Backward compatibility ensures users can adopt new features gradually without breaking existing workflows.
- **Source**: `design/alfred/01-types/command-configuration.md`

---

### 4.16 Enhanced State Management

<!-- Requirements extracted from: design/alfred/01-types/data-model.md -->

#### FR-195: Atomic State Persistence

- **Requirement**: The system SHALL persist workflow execution state using atomic file operations with crash recovery support via temp file + rename pattern.
- **Priority**: Critical
  - **Critical**: Essential for data integrity and crash recovery
- **Acceptance Criteria**:
  - [ ] State writes use temp file then atomic rename
  - [ ] Partial writes do not corrupt state file
  - [ ] System recovers from mid-write crashes
  - [ ] State file integrity is maintained during concurrent operations
- **Rationale**: Atomic writes prevent state corruption during crashes or power failures, ensuring reliable workflow resumption.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-196: Three-Layer State Model

- **Requirement**: The system SHALL maintain a three-layer state model: external task source (e.g., Jira), local task cache, and workflow checkpoint.
- **Priority**: High
  - **High**: Core state management architecture
- **Acceptance Criteria**:
  - [ ] External task data is fetched and cached locally as markdown
  - [ ] Workflow execution state is stored in checkpoint file
  - [ ] Layers are clearly separated with defined responsibilities
  - [ ] Each layer can be inspected independently
- **Rationale**: Clear separation of concerns between external task data, local cache, and execution state improves debuggability and maintainability.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-197: Task Cache as Markdown

- **Requirement**: The system SHALL cache external task data locally as markdown files with frontmatter metadata before workflow execution begins.
- **Priority**: High
  - **High**: Enables offline execution and reduces external API calls
- **Acceptance Criteria**:
  - [ ] Task is fetched from external system at workflow start
  - [ ] Task data is stored as markdown with YAML frontmatter
  - [ ] Cached task includes summary, description, status, priority
  - [ ] Workflow uses cached task without additional API calls
- **Rationale**: Local caching reduces dependency on external systems during workflow execution and enables offline operation after initial fetch.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-198: Unified Checkpoint File

- **Requirement**: The system SHALL use a single atomic checkpoint file as the source of truth for workflow state including orchestration state and execution history.
- **Priority**: Critical
  - **Critical**: Core state management requirement
- **Acceptance Criteria**:
  - [ ] Single checkpoint.json file contains all workflow state
  - [ ] Checkpoint includes orchestration state (current phase, retry count)
  - [ ] Checkpoint includes execution history (phases, outputs, artifacts)
  - [ ] Checkpoint includes metadata (timestamps, resumability)
- **Rationale**: Single source of truth simplifies state management, crash recovery, and debugging compared to distributed state files.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-199: Execution History Tracking

- **Requirement**: The system SHALL track workflow execution history including phase outputs, generated artifacts, and error details in the checkpoint.
- **Priority**: High
  - **High**: Essential for debugging and workflow resumption
- **Acceptance Criteria**:
  - [ ] Each phase records timestamp, success status, and duration
  - [ ] Phase outputs are captured and stored
  - [ ] Artifact paths are tracked in execution history
  - [ ] Error details including code and message are preserved
- **Rationale**: Comprehensive execution history enables debugging, status reporting, and intelligent workflow resumption.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-200: Session ID Tracking

- **Requirement**: The system SHALL capture and persist session identifiers for multi-turn AI conversations to enable conversation resumption.
- **Priority**: High
  - **High**: Enables multi-turn AI interactions
- **Acceptance Criteria**:
  - [ ] Session ID is captured from provider responses
  - [ ] Session ID is stored in phase execution record
  - [ ] Session ID can be passed to subsequent executions
  - [ ] Session resumption is supported across workflow phases
- **Rationale**: Session IDs enable multi-turn conversations where AI maintains context across interactions, improving response quality.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-201: Workflow Resumption Support

- **Requirement**: The system SHALL support workflow resumption after crashes or interruptions from the last successful checkpoint.
- **Priority**: Critical
  - **Critical**: Essential for long-running workflow reliability
- **Acceptance Criteria**:
  - [ ] Resumable flag indicates workflow can be resumed
  - [ ] Workflow resumes from last successful phase
  - [ ] Previously completed phases are not re-executed
  - [ ] Partial phase execution is retried from beginning
- **Rationale**: Long-running workflows must be resumable to avoid losing progress from crashes, network issues, or user interruptions.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-202: Error Classification

- **Requirement**: The system SHALL classify errors by type to determine retry eligibility including claude_code_error, timeout_error, execution_error, validation_error, and dependency_error.
- **Priority**: High
  - **High**: Enables intelligent retry behavior
- **Acceptance Criteria**:
  - [ ] Errors are classified using defined error codes
  - [ ] Different error types have different retry eligibility
  - [ ] Error classification is logged with error details
  - [ ] Retry logic respects error classification
- **Rationale**: Not all errors are retryable. Classification enables intelligent retry decisions, avoiding futile retry loops.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-203: Multi-Format Context Injection

- **Requirement**: The system SHALL support context injection in multiple formats: phase output reference, file reference, glob pattern, and task reference.
- **Priority**: High
  - **High**: Core context building capability
- **Acceptance Criteria**:
  - [ ] Context supports `type: phase` for previous output reference
  - [ ] Context supports `type: file` for file content injection
  - [ ] Context supports `type: glob` for multiple file pattern matching
  - [ ] Context supports `type: jira-task` for task data injection
- **Rationale**: Flexible context sources enable commands to receive information from various sources including files, previous outputs, and task data.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-204: Context Shorthand Notation

- **Requirement**: The system SHALL support both object notation and shorthand notation for context specification (e.g., `plan` vs `{type: phase, name: plan}`).
- **Priority**: Medium
  - **Medium**: Improves workflow authoring experience
- **Acceptance Criteria**:
  - [ ] Shorthand notation is parsed into canonical object form
  - [ ] Shorthand supports type prefixes (file:, glob:, jira:)
  - [ ] Shorthand supports optional marker (? prefix)
  - [ ] Both notations produce equivalent execution behavior
- **Rationale**: Shorthand notation reduces verbosity for common cases while object notation provides full control when needed.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-205: Structured Context Injection Format

- **Requirement**: The system SHALL generate structured context injection with proper XML-like tagging for clear content boundaries.
- **Priority**: High
  - **High**: Essential for AI to parse context correctly
- **Acceptance Criteria**:
  - [ ] Context items are wrapped in named tags (e.g., `<plan>...</plan>`)
  - [ ] File content includes source file comment headers
  - [ ] Multiple files are concatenated with clear separators
  - [ ] Tag structure is consistent and parseable
- **Rationale**: Structured context with clear boundaries helps AI models understand and correctly attribute different context sources.
- **Source**: `design/alfred/01-types/data-model.md`

---

#### FR-206: Phase Output Persistence

- **Requirement**: The system SHALL persist phase outputs to individual files organized by task for easy inspection and context loading.
- **Priority**: High
  - **High**: Enables debugging and context chaining
- **Acceptance Criteria**:
  - [ ] Each phase output is saved to separate file
  - [ ] Outputs are organized under task directory
  - [ ] Output files use consistent naming convention
  - [ ] Outputs are loadable as context for subsequent phases
- **Rationale**: Individual output files enable easy inspection, debugging, and selective context loading for dependent phases.
- **Source**: `design/alfred/01-types/data-model.md`

---

### 4.17 Workflow Architecture

<!-- Requirements extracted from: design/alfred/01-types/naming.md -->

#### FR-207: Four-Tier Orchestration Hierarchy

- **Requirement**: The system SHALL use a four-tier hierarchy for workflow orchestration: Orchestration (top-level), Workflow (mid-level), Stage (execution block), and Agent (AI execution unit).
- **Priority**: Critical
  - **Critical**: Foundational architecture for workflow system
- **Acceptance Criteria**:
  - [ ] Orchestrations can contain multiple workflows
  - [ ] Workflows can contain multiple stages
  - [ ] Stages execute agents (sequential or parallel)
  - [ ] Agents are the fundamental AI execution units
- **Rationale**: Clear hierarchy enables organizing complex multi-step automation from high-level objectives down to individual AI executions.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-208: Orchestration Coordination

- **Requirement**: Orchestrations SHALL coordinate multiple workflows with dependency specifications and execution conditions.
- **Priority**: High
  - **High**: Enables complex multi-workflow automation
- **Acceptance Criteria**:
  - [ ] Orchestrations specify list of workflows to execute
  - [ ] Workflows can specify `depends_on` for sequencing
  - [ ] Workflows can specify execution conditions
  - [ ] Orchestration-level intelligence can guide execution
- **Rationale**: Orchestrations enable coordinating related workflows like planning, development, and deployment in proper sequence.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-209: Stage Execution Modes

- **Requirement**: Stages SHALL support sequential (single agent) or parallel (multiple agents) execution modes.
- **Priority**: Critical
  - **Critical**: Core workflow execution capability
- **Acceptance Criteria**:
  - [ ] Sequential stages execute a single agent
  - [ ] Parallel stages execute multiple agents concurrently
  - [ ] Parallel execution waits for all agents to complete
  - [ ] Stage type is clear from workflow definition
- **Rationale**: Parallel execution enables running independent tasks concurrently (e.g., tests, linting, security scans) for faster workflows.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-210: Agent Definition

- **Requirement**: Agents SHALL be the fundamental AI execution units with prompts, context, and tool access defined in markdown files.
- **Priority**: Critical
  - **Critical**: Core execution unit definition
- **Acceptance Criteria**:
  - [ ] Agents are defined as markdown files with instructions
  - [ ] Agents receive context from workflow and previous stages
  - [ ] Agents can use tools (Read, Write, Bash, etc.)
  - [ ] Agent outputs are captured for subsequent stages
- **Rationale**: Agents encapsulate specific AI tasks with clear prompts and context, enabling reuse and composition in workflows.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-211: Agent Namespacing

- **Requirement**: The system SHALL support agent namespacing with namespace:name resolution patterns (e.g., dev:plan, git:commit).
- **Priority**: High
  - **High**: Essential for organizing agents at scale
- **Acceptance Criteria**:
  - [ ] Agents can be organized in namespace directories
  - [ ] Namespace:name syntax references agents (e.g., `dev:plan`)
  - [ ] Namespaces support nesting (e.g., `alfred:task-manager:create`)
  - [ ] Namespace provides logical grouping of related agents
- **Rationale**: Namespacing enables organizing agents by function (dev, git, security) and avoiding name collisions in large projects.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-212: Agent Resolution Algorithm

- **Requirement**: The system SHALL resolve agent references using exact match, short-name search, and flat-file priority rules.
- **Priority**: High
  - **High**: Essential for flexible agent referencing
- **Acceptance Criteria**:
  - [ ] Exact match looks for fully qualified path first
  - [ ] Short-name searches all directories for matching file
  - [ ] Flat files (root level) take priority over namespaced
  - [ ] Ambiguous matches produce error with suggestions
- **Rationale**: Flexible resolution enables both explicit references and convenient short names while preventing ambiguity.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-213: Intelligent Orchestration Agent

- **Requirement**: The system SHALL support intelligent orchestration agents that provide project-wide context and coordinate workflow execution.
- **Priority**: High
  - **High**: Enables intelligent workflow coordination
- **Acceptance Criteria**:
  - [ ] Orchestrations can enable intelligent coordination
  - [ ] Orchestration agent maintains project-wide context
  - [ ] Orchestration agent can answer workflow-level questions
  - [ ] Orchestration agent guides workflow execution decisions
- **Rationale**: Intelligent orchestration enables dynamic workflow adaptation based on project context and execution results.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-214: Agent Clarification Communication

- **Requirement**: The system SHALL support agent-to-workflow-agent communication for clarifications that can escalate to orchestration level.
- **Priority**: Medium
  - **Medium**: Advanced feature for intelligent workflows
- **Acceptance Criteria**:
  - [ ] Agents can request clarification from workflow agent
  - [ ] Workflow agent can escalate to orchestration agent
  - [ ] Clarification responses flow back to requesting agent
  - [ ] Communication is logged for debugging
- **Rationale**: Agents may need guidance during execution. Escalation chain enables getting context-aware answers from higher-level coordinators.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-215: Iterative Stage with Checkpoints

- **Requirement**: Stages SHALL support iteration with named checkpoints for resumption when iteration is interrupted.
- **Priority**: High
  - **High**: Essential for reliable iterative workflows
- **Acceptance Criteria**:
  - [ ] Stages can specify `iterate` configuration
  - [ ] Stages can define `checkpoint` resumption points
  - [ ] Interrupted iterations resume from checkpoint
  - [ ] Iteration progress is tracked in state
- **Rationale**: Named checkpoints enable resuming iterative workflows from specific points, avoiding re-execution of completed steps.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-216: Human Approval Gates

- **Requirement**: The system SHALL support human approval gates at stage boundaries requiring user confirmation before proceeding.
- **Priority**: High
  - **High**: Critical for human-in-the-loop workflows
- **Acceptance Criteria**:
  - [ ] Stages can specify `approval_required: true`
  - [ ] Approval gates display artifacts for review
  - [ ] Users can approve, reject, or request refinement
  - [ ] Approval decision is logged in workflow state
- **Rationale**: Critical workflow stages may require human review before proceeding, especially for production deployments or important decisions.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-217: CLI Commands for All Levels

- **Requirement**: The system SHALL provide CLI commands for executing orchestrations, workflows, and individual agents.
- **Priority**: Critical
  - **Critical**: Essential for user interaction
- **Acceptance Criteria**:
  - [ ] `flowmaster orchestration <name>` executes orchestrations
  - [ ] `flowmaster workflow <name>` executes workflows
  - [ ] `flowmaster agent <name>` executes individual agents
  - [ ] All commands support task ID specification
- **Rationale**: Users need CLI access to all hierarchy levels for testing, debugging, and execution flexibility.
- **Source**: `design/alfred/01-types/naming.md`

---

#### FR-218: Terminology Migration Support

- **Requirement**: The system SHALL maintain backward compatibility with deprecated terminology (command, phase, pipeline) during migration to new terminology (agent, stage, orchestration).
- **Priority**: High
  - **High**: Essential for non-breaking migration
- **Acceptance Criteria**:
  - [ ] Old keywords (command, phase) are accepted with deprecation warnings
  - [ ] Old keywords are internally normalized to new terminology
  - [ ] Migration tool can update workflow files automatically
  - [ ] Deprecation period allows gradual transition
- **Rationale**: Terminology migration should not break existing workflows. Backward compatibility with warnings enables gradual adoption.
- **Source**: `design/alfred/01-types/naming.md`

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### NFR-PERF-001: Authentication Check Caching

- **Category**: Performance
- **Requirement**: The system SHALL cache authentication status for 5 minutes to minimize authentication check overhead.
- **Metric**: Authentication check latency reduced by >90% for cached checks
- **Verification**: Measure authentication check time with and without cache, verify cache hit rate
- **Priority**: High
- **Rationale**: Authentication checks can involve slow disk I/O or API calls. Five-minute caching significantly reduces workflow startup latency without sacrificing security.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-PERF-002: Minimal Stream Buffering

- **Category**: Performance
- **Requirement**: The system SHALL process streaming output with minimal buffering to provide real-time feedback.
- **Metric**: Output latency <100ms from provider to UI event emission
- **Verification**: Measure time from provider output to event emission
- **Priority**: Medium
- **Rationale**: Real-time feedback improves user experience for long-running commands. Minimal buffering ensures users see progress immediately.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

<!-- Requirements extracted from: design/alfred/04-execution/context-builder.md -->

#### NFR-PERF-003: File Content Caching

- **Category**: Performance
- **Requirement**: The system SHALL cache file contents during workflow execution to avoid redundant file reads.
- **Metric**: Cache hit rate >80% for repeated file access within workflow, 3-4x faster than sequential loading
- **Verification**: Monitor cache hits vs misses, measure file load time with and without cache
- **Priority**: Medium
- **Rationale**: Workflows may reference the same files multiple times. Caching prevents redundant disk I/O and improves performance.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

#### NFR-PERF-004: Parallel Context Item Loading

- **Category**: Performance
- **Requirement**: The system SHALL load context items in parallel when multiple are specified.
- **Metric**: Parallel loading is 3-4x faster than sequential loading for multiple context items
- **Verification**: Measure context loading time for workflows with multiple context items, compare parallel vs sequential
- **Priority**: Medium
- **Rationale**: Loading multiple context items sequentially is slow. Parallel loading significantly reduces context preparation time.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

<!-- Requirements extracted from: design/alfred/02-state/persistence-layer.md -->

#### NFR-PERF-005: Small Storage Footprint

- **Category**: Performance
- **Requirement**: The system SHALL maintain task state with minimal disk space usage.
- **Metric**: Task state files measured in kilobytes per task, not megabytes
- **Verification**: Measure state file sizes across representative workflows with varying complexity
- **Priority**: Medium
- **Rationale**: Single-user tool with local storage constraints requires efficient disk usage. Keeping state files small enables many tasks without storage concerns.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

### 5.2 Reliability Requirements

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### NFR-REL-001: Provider Fallback on Failure

- **Category**: Reliability
- **Requirement**: The system SHALL gracefully fallback to alternative providers when primary provider fails.
- **Metric**: 99% workflow success rate when at least one provider is available
- **Verification**: Test workflows with primary provider disabled, verify fallback to alternatives
- **Priority**: High
- **Rationale**: Provider availability may vary. Automatic fallback increases overall workflow reliability by using any available provider.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-REL-002: Process Cleanup on Shutdown

- **Category**: Reliability
- **Requirement**: The system SHALL properly cleanup child processes on system shutdown or abort.
- **Metric**: Zero orphaned processes after shutdown or abort
- **Verification**: Monitor process table before and after shutdown, verify all spawned processes are terminated
- **Priority**: Critical
- **Rationale**: Orphaned processes consume system resources and may cause security or stability issues. Complete cleanup is essential.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-REL-003: Complete Process Termination

- **Category**: Reliability
- **Requirement**: The system SHALL track process groups for complete process termination including child processes.
- **Metric**: All child processes terminated within 1 second of parent termination
- **Verification**: Spawn providers that create child processes, verify all children are terminated
- **Priority**: High
- **Rationale**: Providers may spawn child processes. Process group tracking ensures complete termination preventing resource leaks.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

<!-- Requirements extracted from: design/alfred/04-execution/output-parsing.md -->

#### NFR-REL-004: Validation Retry Limits

- **Category**: Reliability
- **Requirement**: The system SHALL enforce maximum retry limits to prevent infinite validation retry loops.
- **Metric**: Workflows fail after configured maximum retries (typically 3), not exceeding 5 retries
- **Verification**: Test with commands that produce invalid outputs, verify system stops after maximum retries
- **Priority**: Critical
- **Rationale**: Some commands may be unable to produce valid outputs. Retry limits prevent infinite loops and resource exhaustion while providing clear failure conditions.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

<!-- Requirements extracted from: design/alfred/02-state/persistence-layer.md -->

#### NFR-REL-005: File-Based Persistence

- **Category**: Reliability
- **Requirement**: The system SHALL persist all state to human-readable files without requiring database infrastructure.
- **Metric**: 100% of state stored in JSON/text/YAML files, zero database connections
- **Verification**: Verify no database processes required for operation, all state files are readable with standard tools
- **Priority**: Critical
- **Rationale**: Single-user CLI tool with small data size requires transparency for debugging. File-based persistence eliminates infrastructure dependencies and enables debugging with standard Unix tools.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### NFR-REL-006: Crash Recovery

- **Category**: Reliability
- **Requirement**: The system SHALL enable recovery and resumption of incomplete tasks after process termination.
- **Metric**: 100% of interrupted workflows can be detected and resumed from last completed phase
- **Verification**: Test crash scenarios at each execution phase, verify detection and successful resumption
- **Priority**: Critical
- **Rationale**: Process termination can occur due to crashes, user cancellation, or system issues. Ensuring work is not lost due to interruptions is essential for reliability.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### NFR-REL-007: Atomic State Updates

- **Category**: Reliability
- **Requirement**: The system SHALL use atomic write operations to prevent state corruption during updates.
- **Metric**: Zero partially-written state files after process termination or interruption
- **Verification**: Test process termination during state writes, verify state files are never corrupted
- **Priority**: Critical
- **Rationale**: State corruption from incomplete writes can cause unrecoverable failures. Atomic writes ensure state is either old or new, never partially written.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

#### NFR-REL-008: Concurrent Write Safety

- **Category**: Reliability
- **Requirement**: The system SHALL safely handle concurrent write operations to log files.
- **Metric**: Zero lost or corrupted log entries under concurrent writes from parallel phases
- **Verification**: Test with parallel phase execution writing to same log file, verify all entries present and intact
- **Priority**: High
- **Rationale**: Multiple processes or phases may write logs concurrently. Safe concurrent writes prevent log corruption and data loss.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

### 5.3 Usability Requirements

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### NFR-USE-001: Clear Provider Error Messages

- **Category**: Usability
- **Requirement**: The system SHALL provide clear error messages when providers are not ready including installation instructions.
- **Metric**: Error messages include specific action items (install command, authentication link, etc.)
- **Verification**: Test with missing providers, verify error messages contain actionable guidance
- **Priority**: High
- **Rationale**: Clear error messages with actionable instructions reduce support burden and enable self-service problem resolution.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-USE-002: Duplicate Tool Call Reduction

- **Category**: Usability
- **Requirement**: The system SHALL detect duplicate tool calls and reduce visual noise in UI.
- **Metric**: UI shows only first instance of identical tool calls by default
- **Verification**: Execute workflows with repeated tool calls, verify UI deduplication
- **Priority**: Low
- **Rationale**: AI providers sometimes repeat tool calls. Deduplication creates cleaner, more readable UI output.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-USE-003: Consistent Output Normalization

- **Category**: Usability
- **Requirement**: The system SHALL normalize provider output for consistent display across different providers.
- **Metric**: Output format (line endings, escape sequences) is consistent regardless of provider
- **Verification**: Compare output format across different providers, verify consistency
- **Priority**: Medium
- **Rationale**: Different providers may format output differently. Normalization ensures consistent, predictable display.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

<!-- Requirements extracted from: design/alfred/04-execution/context-builder.md -->

#### NFR-USE-004: Context Error Troubleshooting Guidance

- **Category**: Usability
- **Requirement**: Error messages for missing context SHALL include expected file path and troubleshooting steps.
- **Metric**: 100% of context errors include expected path, source type, and resolution guidance
- **Verification**: Trigger context errors, verify error messages contain all required information
- **Priority**: High
- **Rationale**: Context resolution failures are common during workflow development. Clear errors with troubleshooting guidance enable rapid problem resolution.
- **Source**: `design/alfred/04-execution/context-builder.md`

---

<!-- Requirements extracted from: design/alfred/04-execution/output-parsing.md -->

#### NFR-USE-005: Field-Level Validation Error Feedback

- **Category**: Usability
- **Requirement**: Validation error messages SHALL include specific field errors and correction guidance.
- **Metric**: 100% of validation errors identify failing fields and provide correction guidance
- **Verification**: Test with invalid outputs, verify error messages contain field-level details
- **Priority**: High
- **Rationale**: Validation failures can be difficult to diagnose. Field-level error messages enable rapid identification and correction of issues.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

#### NFR-USE-006: Schema Field Description Requirement

- **Category**: Usability
- **Requirement**: Schema definitions SHALL require field descriptions for LLM understanding.
- **Metric**: 100% of schema fields have descriptions, workflows fail validation if descriptions missing
- **Verification**: Test schemas without descriptions, verify validation fails at workflow load time
- **Priority**: Medium
- **Rationale**: Field descriptions guide LLM output generation. Requiring descriptions ensures schemas provide sufficient context for commands.
- **Source**: `design/alfred/04-execution/output-parsing.md`

---

<!-- Requirements extracted from: design/alfred/02-state/persistence-layer.md -->

#### NFR-USE-007: Inspectable State

- **Category**: Usability
- **Requirement**: The system SHALL store all state in formats readable by standard command-line tools.
- **Metric**: 100% of state files readable with cat/grep/jq/tail/ls without specialized tools
- **Verification**: Verify all files are plain text, standard JSON, or YAML, test with standard Unix tools
- **Priority**: High
- **Rationale**: Debugging and troubleshooting is significantly easier when state can be inspected with familiar Unix tools. Human-readable formats enable rapid diagnosis.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

<!-- Requirements extracted from: design/alfred/06-interface/cli-commands.md -->

#### NFR-USE-008: Human-Friendly Terminal Output

- **Category**: Usability
- **Requirement**: The system SHALL provide clear, readable terminal output for developers.
- **Metric**: User testing shows >90% task success rate for interpreting command output
- **Verification**: Conduct usability tests with developers, measure output comprehension
- **Priority**: High
- **Rationale**: Developers use CLI as primary interface. Clear, readable output reduces cognitive load and improves productivity.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-009: Machine-Parseable Logs

- **Category**: Usability
- **Requirement**: The system SHALL produce structured logs suitable for CI/CD pipelines and automation.
- **Metric**: All log output parseable with standard text processing tools (grep, awk, jq)
- **Verification**: Parse log output with automation scripts, verify structured format compatibility
- **Priority**: High
- **Rationale**: CI/CD systems and automation tools need structured, parseable output for integration.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-010: Minimal Default Output

- **Category**: Usability
- **Requirement**: The system SHALL show essential information by default with verbose mode available on demand.
- **Metric**: Default output is <50 lines for typical workflow, verbose mode shows all details
- **Verification**: Measure default output line count, verify verbose mode includes additional details
- **Priority**: High
- **Rationale**: Concise default output focuses user attention on critical information while verbose mode supports debugging.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-011: Stderr for Logging

- **Category**: Usability
- **Requirement**: The system SHALL write logs to stderr to keep stdout clean for piping.
- **Metric**: 100% of progress/status logs to stderr, only final results to stdout
- **Verification**: Redirect stderr and stdout, verify separation of concerns
- **Priority**: High
- **Rationale**: Separating logs (stderr) from results (stdout) enables standard Unix piping patterns.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-012: CI/CD Environment Compatibility

- **Category**: Usability
- **Requirement**: The system SHALL work in both interactive terminals and CI/CD pipelines.
- **Metric**: All commands function correctly in non-TTY environments
- **Verification**: Run all commands in CI/CD environment, verify correct operation and output
- **Priority**: Critical
- **Rationale**: CI/CD is primary use case for workflow automation. Commands must work reliably in non-interactive environments.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-013: Graceful Output Degradation

- **Category**: Usability
- **Requirement**: The system SHALL gracefully degrade output formatting in non-TTY environments.
- **Metric**: Output remains readable and parseable when colors and interactive features unavailable
- **Verification**: Test in non-TTY environment, verify output quality and parseability
- **Priority**: High
- **Rationale**: Non-TTY environments don't support colors or interactive features. Graceful degradation ensures functionality.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-014: Explicit Command Names

- **Category**: Usability
- **Requirement**: The system SHALL use explicit, verb-based command names for clarity.
- **Metric**: User testing shows >95% correct command prediction for common tasks
- **Verification**: Conduct user testing with developers unfamiliar with system, measure command discoverability
- **Priority**: High
- **Rationale**: Explicit verb-based commands (run, list, get) are more discoverable and intuitive than abbreviations.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-015: Consistent Color Coding

- **Category**: Usability
- **Requirement**: The system SHALL provide consistent color coding across all output.
- **Metric**: Same semantic meaning uses same color 100% of the time
- **Verification**: Audit all output for color consistency, verify semantic color mapping
- **Priority**: Medium
- **Rationale**: Consistent colors create visual language that users learn, reducing cognitive load.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-016: Automatic Color Detection

- **Category**: Usability
- **Requirement**: The system SHALL detect color support and disable colors when unsupported.
- **Metric**: Color codes not emitted when NO_COLOR set or terminal lacks support
- **Verification**: Test with NO_COLOR environment variable and terminals without color support
- **Priority**: High
- **Rationale**: Color codes break output in environments that don't support them. Auto-detection ensures compatibility.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

#### NFR-USE-017: Standard Environment Variable Support

- **Category**: Usability
- **Requirement**: The system SHALL respect standard environment variables (NO_COLOR, CI).
- **Metric**: 100% compliance with documented environment variable behavior
- **Verification**: Test with each supported environment variable, verify correct behavior
- **Priority**: High
- **Rationale**: Standard environment variables (NO_COLOR, CI) are widely used conventions. Compliance ensures interoperability.
- **Source**: `design/alfred/06-interface/cli-commands.md`

---

### 5.4 Maintainability Requirements

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### NFR-MAINT-001: Provider Logic Isolation

- **Category**: Maintainability
- **Requirement**: The system SHALL use provider abstraction to isolate provider-specific logic from workflow orchestration.
- **Metric**: Adding new provider requires <500 lines of code with no changes to workflow orchestration
- **Verification**: Implement new provider, measure code changes required in orchestration layer
- **Priority**: Critical
- **Rationale**: Clean abstraction enables independent evolution of providers and orchestration, simplifying maintenance.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-MAINT-002: Progressive Enhancement Support

- **Category**: Maintainability
- **Requirement**: The system SHALL support progressive enhancement by allowing incremental provider addition.
- **Metric**: System functions with single provider, additional providers add capabilities without breaking changes
- **Verification**: Deploy with one provider, add additional providers without system changes
- **Priority**: High
- **Rationale**: Progressive enhancement enables starting simple and adding complexity as needed, reducing initial implementation burden.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-MAINT-003: Common Stream Processing Interface

- **Category**: Maintainability
- **Requirement**: The system SHALL provide common interfaces for stream processing across all providers.
- **Metric**: >80% of stream processing code is shared across providers
- **Verification**: Measure code reuse in stream processors
- **Priority**: Medium
- **Rationale**: Common interfaces reduce code duplication and ensure consistent stream processing behavior.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

<!-- Requirements extracted from: design/alfred/02-state/persistence-layer.md -->

#### NFR-MAINT-004: Version Control Friendly

- **Category**: Maintainability
- **Requirement**: The system SHALL store workflows and execution traces in formats suitable for version control systems.
- **Metric**: All workflow and configuration files are text-based and produce meaningful diffs
- **Verification**: Verify git can track and produce readable diffs for all workflow files
- **Priority**: High
- **Rationale**: Version control enables workflow versioning, collaboration, code review, and change tracking. Text-based formats ensure meaningful diffs.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

### 5.5 Event System Performance Requirements

<!-- Requirements extracted from: design/alfred/03-events/event-bus-architecture.md -->

#### NFR-EVNT-001: Event Emission Overhead

- **Category**: Performance
- **Requirement**: The system SHALL emit events with minimal overhead to avoid impacting workflow execution performance.
- **Metric**: Event emission overhead <1ms per event including all handlers
- **Verification**: Measure time from event emission to all handlers completing
- **Priority**: High
- **Rationale**: Event system must not become performance bottleneck. Sub-millisecond overhead ensures events don't slow down workflow execution.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-002: WebSocket Streaming Latency

- **Category**: Performance
- **Requirement**: The system SHALL deliver events to UI clients with sub-100ms latency.
- **Metric**: <100ms from event emission to WebSocket message delivery to client
- **Verification**: Measure time from event emission to client receipt via WebSocket
- **Priority**: High
- **Rationale**: Low latency ensures real-time feel for UI updates. Sub-100ms is imperceptible to users.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-003: Handler Batch Processing

- **Category**: Performance
- **Requirement**: File handler SHALL batch multiple events into single I/O operation when possible.
- **Metric**: File writes batch up to 50 events or 100ms window, whichever comes first
- **Verification**: Monitor file I/O operations during high-frequency event emission
- **Priority**: Medium
- **Rationale**: Batching reduces I/O overhead and improves performance during rapid event emission.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-004: WebSocket Scalability

- **Category**: Performance
- **Requirement**: WebSocket handler SHALL support at least 10 concurrent UI clients efficiently.
- **Metric**: Support 10+ clients with <5ms broadcast overhead per event
- **Verification**: Test with 10 simultaneous WebSocket connections, measure broadcast time
- **Priority**: Medium
- **Rationale**: Multiple clients enable collaboration and multi-window monitoring. 10 clients is sufficient for typical usage.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-005: Console Handler Throttling

- **Category**: Performance
- **Requirement**: Console handler SHALL throttle output to prevent terminal overload during rapid events.
- **Metric**: Maximum 60 updates per second (16ms throttle window)
- **Verification**: Generate 1000+ rapid events, verify console updates at most 60 times per second
- **Priority**: Medium
- **Rationale**: Rapid console updates can freeze terminal. 60 FPS throttling prevents terminal overload while maintaining smooth updates.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-006: Memory Efficiency

- **Category**: Performance
- **Requirement**: Event system SHALL maintain minimal memory footprint without retaining event history.
- **Metric**: Event system baseline memory <10MB, no event retention in memory
- **Verification**: Monitor memory usage during extended workflow execution
- **Priority**: Medium
- **Rationale**: Event system shouldn't retain events in memory. File handler provides persistence. Memory efficiency enables long-running workflows.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

### 5.6 Event System Reliability Requirements

<!-- Requirements extracted from: design/alfred/03-events/event-bus-architecture.md -->

#### NFR-EVNT-REL-001: Synchronous Event Delivery

- **Category**: Reliability
- **Requirement**: Events SHALL be delivered synchronously in listener registration order.
- **Metric**: Events arrive in exact order emitted, stack traces show complete call chain
- **Verification**: Verify event order matches emission order across all handlers
- **Priority**: Critical
- **Rationale**: Synchronous delivery ensures predictable event order, easier debugging, and no race conditions.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-REL-002: Handler Isolation

- **Category**: Reliability
- **Requirement**: Handler failures SHALL NOT prevent other handlers from executing.
- **Metric**: 100% of remaining handlers execute successfully even when one handler fails
- **Verification**: Test with intentionally failing handler, verify other handlers continue
- **Priority**: Critical
- **Rationale**: One consumer failure (e.g., disk full) shouldn't break others. Isolation ensures system reliability.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-REL-003: Graceful WebSocket Degradation

- **Category**: Reliability
- **Requirement**: System SHALL continue functioning when WebSocket server fails to start.
- **Metric**: Workflow execution succeeds with file logging even when WebSocket unavailable
- **Verification**: Disable WebSocket server, verify workflows complete successfully
- **Priority**: High
- **Rationale**: WebSocket failure shouldn't prevent workflow execution. File logging and headless mode provide fallback.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-REL-004: WebSocket Heartbeat Detection

- **Category**: Reliability
- **Requirement**: System SHALL detect and cleanup dead WebSocket connections within 30 seconds.
- **Metric**: Dead connections detected and closed within 30s of last heartbeat
- **Verification**: Simulate dead connection, verify cleanup within timeout
- **Priority**: Medium
- **Rationale**: Dead connections consume resources. Heartbeat detection enables timely cleanup.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-REL-005: File Logging Safety

- **Category**: Reliability
- **Requirement**: File handler SHALL use file locking to prevent corruption during concurrent writes.
- **Metric**: Zero corrupted log files under concurrent execution from parallel phases
- **Verification**: Test parallel phase execution with concurrent log writes, verify file integrity
- **Priority**: High
- **Rationale**: Multiple phases may log concurrently. File locking prevents corruption and data loss.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

### 5.7 Event System Usability Requirements

<!-- Requirements extracted from: design/alfred/03-events/event-bus-architecture.md -->

#### NFR-EVNT-USE-001: Human-Readable Log Format

- **Category**: Usability
- **Requirement**: Log files SHALL use human-readable format readable with standard Unix tools.
- **Metric**: 100% of logs readable with cat/grep/tail without specialized tools
- **Verification**: Verify logs are plain text with clear formatting
- **Priority**: High
- **Rationale**: Human-readable logs enable debugging with familiar tools, reducing learning curve.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-USE-002: Event Correlation

- **Category**: Usability
- **Requirement**: All events SHALL include task ID for correlation across logs and systems.
- **Metric**: 100% of events include task ID in payload
- **Verification**: Verify all event types include task ID field
- **Priority**: Critical
- **Rationale**: Task ID enables correlating events across handlers, reconstructing execution timeline, and cross-system tracing.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-USE-003: Event Timestamp Precision

- **Category**: Usability
- **Requirement**: All events SHALL include millisecond-precision timestamps.
- **Metric**: Timestamps use ISO 8601 format with millisecond precision
- **Verification**: Verify event timestamps include milliseconds
- **Priority**: High
- **Rationale**: Millisecond precision enables accurate timeline reconstruction and performance analysis.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-USE-004: Telemetry Privacy Filtering

- **Category**: Usability
- **Requirement**: Telemetry handler SHALL strip sensitive data before sending to external services.
- **Metric**: Sensitive fields (file contents, outputs, errors) removed from telemetry events
- **Verification**: Inspect telemetry payloads, verify sensitive data absent
- **Priority**: Critical
- **Rationale**: Telemetry should track metadata without exposing sensitive content. Privacy filtering protects user data.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

#### NFR-EVNT-USE-005: Telemetry Opt-Out

- **Category**: Usability
- **Requirement**: Users SHALL be able to disable telemetry via environment variable.
- **Metric**: ALFRED_TELEMETRY=false completely disables telemetry reporting
- **Verification**: Set environment variable, verify no telemetry sent
- **Priority**: High
- **Rationale**: Users should have control over telemetry. Opt-out respects privacy preferences.
- **Source**: `design/alfred/03-events/event-bus-architecture.md`

---

### 5.8 Logging System Performance Requirements

<!-- Requirements extracted from: design/alfred/03-events/logging-strategy.md -->

#### NFR-LOG-001: Real-Time Streaming Latency

- **Category**: Performance
- **Requirement**: Event streaming to UI SHALL have sub-100ms latency from emission to client receipt.
- **Metric**: <100ms from event emission to UI client receiving WebSocket message
- **Verification**: Measure end-to-end latency with timestamp comparison
- **Priority**: High
- **Rationale**: Sub-100ms latency provides real-time feel for UI users, maintaining engagement during long workflows.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### NFR-LOG-002: File Write Latency

- **Category**: Performance
- **Requirement**: Log file writes SHALL have minimal impact on workflow execution time.
- **Metric**: Log write overhead <10ms per event with file locking
- **Verification**: Measure log write time including file locking
- **Priority**: Medium
- **Rationale**: File writes are slower than memory operations. Minimal latency ensures logging doesn't slow workflow execution.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

### 5.9 Logging System Reliability Requirements

<!-- Requirements extracted from: design/alfred/03-events/logging-strategy.md -->

#### NFR-LOG-003: Immediate Log Persistence

- **Category**: Reliability
- **Requirement**: Log entries SHALL be written to disk immediately to survive crashes.
- **Metric**: Log entries flushed to disk within 100ms or immediately on phase completion
- **Verification**: Test crash scenarios, verify logs present immediately before crash
- **Priority**: Critical
- **Rationale**: Immediate persistence ensures logs survive crashes, enabling post-crash debugging.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### NFR-LOG-004: Graceful Disk Full Handling

- **Category**: Reliability
- **Requirement**: System SHALL continue functioning when disk is full, logging to stderr as fallback.
- **Metric**: Workflow execution succeeds with stderr logging when disk full
- **Verification**: Fill disk, verify workflows complete with stderr fallback
- **Priority**: High
- **Rationale**: Disk full shouldn't stop workflows. Stderr fallback enables continued operation with reduced logging.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

### 5.10 Logging System Usability Requirements

<!-- Requirements extracted from: design/alfred/03-events/logging-strategy.md -->

#### NFR-LOG-005: Standard Tool Compatibility

- **Category**: Usability
- **Requirement**: All log files SHALL be readable with standard Unix command-line tools.
- **Metric**: 100% of logs work with tail -f, grep, cat, less, awk without errors
- **Verification**: Test common Unix tools on log files
- **Priority**: Critical
- **Rationale**: Standard tool compatibility enables familiar debugging workflows without learning specialized tools.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

#### NFR-LOG-006: Automatic Mode Detection

- **Category**: Usability
- **Requirement**: System SHALL automatically detect headless vs UI mode without user configuration.
- **Metric**: Correct mode selected in 100% of CI/CD and interactive environments
- **Verification**: Test in CI environment and interactive terminal, verify correct mode
- **Priority**: High
- **Rationale**: Automatic detection eliminates configuration burden and prevents mode mismatch errors.
- **Source**: `design/alfred/03-events/logging-strategy.md`

---

### 5.11 Portability Requirements

<!-- Requirements extracted from: design/alfred/04-execution/provider-abstraction.md -->

#### NFR-PORT-001: Platform Compatibility Checking

- **Category**: Portability
- **Requirement**: The system SHALL check platform compatibility before enabling platform-specific providers.
- **Metric**: Platform-specific providers are disabled on incompatible platforms with clear messaging
- **Verification**: Test on Windows, macOS, and Linux, verify correct provider availability
- **Priority**: Medium
- **Rationale**: Some providers are platform-specific. Compatibility checking prevents errors and provides clear messaging about platform limitations.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

#### NFR-PORT-002: Platform-Specific Process Management

- **Category**: Portability
- **Requirement**: The system SHALL use platform-specific process management strategies for Unix and Windows systems.
- **Metric**: Process cleanup works correctly on Windows, macOS, and Linux
- **Verification**: Test process cleanup on all platforms, verify complete termination
- **Priority**: High
- **Rationale**: Unix and Windows have different process management models. Platform-specific strategies ensure reliable process cleanup on all platforms.
- **Source**: `design/alfred/04-execution/provider-abstraction.md`

---

<!-- Requirements extracted from: design/alfred/02-state/persistence-layer.md -->

#### NFR-PORT-003: Directory Portability

- **Category**: Portability
- **Requirement**: The system SHALL maintain all state within a single directory structure that can be copied between systems.
- **Metric**: Workflow state fully functional after directory copy to different system or location
- **Verification**: Copy .flowmaster/ directory to different system, verify all operations work without reconfiguration
- **Priority**: High
- **Rationale**: Single directory structure enables easy migration, backup, and sharing of execution traces. State portability simplifies deployment and collaboration.
- **Source**: `design/alfred/02-state/persistence-layer.md`

---

### 5.12 Web UI Performance Requirements

<!-- Requirements extracted from: design/alfred/06-interface/web-ui-core.md -->

#### NFR-UI-PERF-001: Initial Load Time

- **Category**: Performance
- **Requirement**: The system SHALL load initial UI within 2 seconds on standard broadband connection so that users experience fast startup.
- **Metric**: Time to interactive (TTI) < 2000ms on 10 Mbps connection
- **Verification**: Lighthouse performance audit, synthetic monitoring with network throttling
- **Priority**: High
- **Rationale**: Fast load times critical for positive user experience; users abandon slow-loading applications.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### NFR-UI-PERF-002: Real-Time Update Latency

- **Category**: Performance
- **Requirement**: The system SHALL render workflow state updates within 1 second of backend event so that users see near real-time progress.
- **Metric**: 95th percentile event-to-render latency < 1000ms
- **Verification**: Event timing instrumentation with performance.mark() and performance.measure(), user timing API
- **Priority**: Critical
- **Rationale**: Real-time monitoring requires sub-second latency; delays reduce monitoring value and user confidence.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### NFR-UI-PERF-003: Animation Frame Rate

- **Category**: Performance
- **Requirement**: The system SHALL render smooth animations at 60 FPS for workflow graph transitions so that UI feels responsive.
- **Metric**: Frame rate ≥ 60 FPS during node state transitions and edge animations
- **Verification**: Chrome DevTools performance profiling, frame rate monitoring during animations
- **Priority**: Medium
- **Rationale**: Smooth animations improve perceived performance and UX; janky animations reduce user confidence in application quality.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

### 5.13 Web UI Usability Requirements

<!-- Requirements extracted from: design/alfred/06-interface/web-ui-core.md -->

#### NFR-UI-USE-001: Keyboard Accessibility

- **Category**: Usability
- **Requirement**: The system SHALL support keyboard navigation for all interactive elements so that users can operate UI without mouse.
- **Metric**: 100% keyboard navigability per WCAG 2.1 AA standards
- **Verification**: Keyboard navigation audit with tab/shift-tab through all interactive elements, automated accessibility testing with axe-core
- **Priority**: High
- **Rationale**: Accessibility requirement for users who cannot use mouse due to disability or preference; required for WCAG compliance.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

#### NFR-UI-USE-002: Screen Reader Compatibility

- **Category**: Usability
- **Requirement**: The system SHALL provide ARIA labels and semantic HTML for screen reader compatibility so that visually impaired users can use the UI.
- **Metric**: WCAG 2.1 AA compliance, zero critical accessibility errors in automated testing
- **Verification**: Screen reader testing with NVDA (Windows) and VoiceOver (macOS), automated accessibility scanning with axe-core and Lighthouse
- **Priority**: High
- **Rationale**: Accessibility requirement for visually impaired users; legal requirement in many jurisdictions for public-facing applications.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

### 5.14 Web UI Scalability Requirements

<!-- Requirements extracted from: design/alfred/06-interface/web-ui-core.md -->

#### NFR-UI-SCALE-001: Long Chat Message List Performance

- **Category**: Scalability
- **Requirement**: The system SHALL virtualize long chat message lists to maintain performance with thousands of messages so that UI remains responsive in long-running workflows.
- **Metric**: Scroll performance ≥ 60 FPS with 10,000 messages in chat, memory usage < 500MB for 10,000 messages
- **Verification**: Performance testing with synthetic long-running workflows generating 10,000+ messages, Chrome DevTools memory profiling
- **Priority**: Medium
- **Rationale**: Long workflows generate many messages; without virtualization, DOM bloat degrades performance and increases memory usage.
- **Source**: `design/alfred/06-interface/web-ui-core.md`

---

### 5.15 Desktop UI Performance Requirements

<!-- Requirements extracted from: design/alfred/06-interface/electron-shell.md -->

#### NFR-DESK-PERF-001: Application Startup Time

- **Category**: Performance
- **Requirement**: The system SHALL start the desktop application in under 3 seconds so that users experience minimal wait time.
- **Metric**: Application window visible and interactive < 3 seconds from launch
- **Verification**: Automated startup time measurement across supported platforms
- **Priority**: High
- **Rationale**: Fast startup improves user experience and developer productivity with frequent application launches.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-PERF-002: Idle Memory Usage

- **Category**: Performance
- **Requirement**: The system SHALL maintain memory usage below 200MB when idle so that desktop application is resource-efficient.
- **Metric**: Memory consumption < 200MB when no workflows executing
- **Verification**: Process memory monitoring on macOS, Windows, and Linux
- **Priority**: Medium
- **Rationale**: Low memory footprint enables desktop application to run alongside other development tools without resource contention.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-PERF-003: Real-Time Visualization Updates

- **Category**: Performance
- **Requirement**: The system SHALL update workflow visualization in real-time with minimal latency so that users see immediate feedback during execution.
- **Metric**: Visualization updates within 1 second of backend state change
- **Verification**: End-to-end latency measurement from event emission to UI update
- **Priority**: Critical
- **Rationale**: Real-time updates are essential for effective workflow monitoring and debugging.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

### 5.16 Desktop UI Reliability Requirements

<!-- Requirements extracted from: design/alfred/06-interface/electron-shell.md -->

#### NFR-DESK-REL-001: UI Responsiveness During Execution

- **Category**: Reliability
- **Requirement**: The system SHALL maintain UI responsiveness during long-running workflows so that users can interact with interface throughout execution.
- **Metric**: UI remains responsive (no freezes > 100ms) during workflow execution
- **Verification**: UI interaction testing during long-running workflow execution
- **Priority**: Critical
- **Rationale**: UI freezes during execution degrade user experience and prevent workflow management.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

### 5.17 Desktop UI Usability Requirements

<!-- Requirements extracted from: design/alfred/06-interface/electron-shell.md -->

#### NFR-DESK-USE-001: Visual Phase State Feedback

- **Category**: Usability
- **Requirement**: The system SHALL provide visual feedback for all phase state changes so that users can understand workflow progress at a glance.
- **Metric**: All state transitions have distinct visual indicators (color, icon, animation)
- **Verification**: Manual testing of all phase state transitions
- **Priority**: High
- **Rationale**: Clear visual feedback enables users to monitor workflow status without reading logs.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-USE-002: Clear Error Messaging

- **Category**: Usability
- **Requirement**: The system SHALL display clear error messages in the UI so that users can understand and resolve issues.
- **Metric**: All error states include human-readable description and suggested action
- **Verification**: Error scenario testing with user feedback on message clarity
- **Priority**: High
- **Rationale**: Clear error messages reduce debugging time and improve user productivity.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-USE-003: Loading State Indicators

- **Category**: Usability
- **Requirement**: The system SHALL provide loading indicators during asynchronous operations so that users understand when operations are in progress.
- **Metric**: All async operations > 500ms display loading indicator
- **Verification**: Manual testing of all async operations
- **Priority**: Medium
- **Rationale**: Loading indicators prevent user confusion about operation status and reduce perceived latency.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

### 5.18 Desktop UI Maintainability Requirements

<!-- Requirements extracted from: design/alfred/06-interface/electron-shell.md -->

#### NFR-DESK-MAINT-001: Component Size Target

- **Category**: Maintainability
- **Requirement**: UI components SHALL average under 200 lines of code so that codebase remains maintainable and testable.
- **Metric**: Average component size < 200 lines of code (measured via static analysis)
- **Verification**: Automated linting with component size limits
- **Priority**: Medium
- **Rationale**: Smaller components are easier to understand, test, and maintain over time.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

### 5.19 Desktop UI Security Requirements

<!-- Requirements extracted from: design/alfred/06-interface/electron-shell.md -->

#### NFR-DESK-SEC-001: File Write Operation Approval

- **Category**: Security
- **Requirement**: The system SHALL prompt for user approval before file write operations so that unintended file modifications are prevented.
- **Metric**: 100% of file write operations require user approval (unless cached)
- **Verification**: Security audit of file operation code paths
- **Priority**: High
- **Rationale**: File write approval protects users from unintended or malicious file modifications.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-SEC-002: File Delete Operation Approval

- **Category**: Security
- **Requirement**: The system SHALL prompt for user approval before file delete operations so that accidental data loss is prevented.
- **Metric**: 100% of file delete operations require user approval (unless cached)
- **Verification**: Security audit of file deletion code paths
- **Priority**: High
- **Rationale**: Delete approval prevents accidental or malicious data loss.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-SEC-003: Command Execution Approval

- **Category**: Security
- **Requirement**: The system SHALL prompt for user approval before command execution so that potentially dangerous operations are reviewed.
- **Metric**: 100% of system command executions require user approval (unless cached)
- **Verification**: Security audit of command execution code paths
- **Priority**: High
- **Rationale**: Command execution approval prevents execution of malicious or unintended system commands.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-SEC-004: Path Traversal Prevention

- **Category**: Security
- **Requirement**: The system SHALL validate all input to prevent path traversal attacks so that file system security is maintained.
- **Metric**: 100% of file operations validate paths for ".." patterns
- **Verification**: Security testing with malicious path inputs
- **Priority**: Critical
- **Rationale**: Path traversal prevention is critical security control against file system attacks.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

#### NFR-DESK-SEC-005: Absolute Path Enforcement

- **Category**: Security
- **Requirement**: The system SHALL validate all file paths as absolute paths so that relative path ambiguity is eliminated.
- **Metric**: 100% of file operations reject relative paths
- **Verification**: Input validation testing with relative paths
- **Priority**: Critical
- **Rationale**: Absolute path requirement prevents ambiguity and potential security issues from relative path resolution.
- **Source**: `design/alfred/06-interface/electron-shell.md`

---

## 6. Business Constraints

<!-- Requirements extracted from: design/alfred/02-state/persistence-layer.md -->

#### BC-001: Single-User Operation

- **Type**: Design Constraint
- **Constraint**: The system is designed for single-user, local operation without multi-machine concurrent access.
- **Impact**: Enables file-based persistence without distributed locking mechanisms. System does not need to handle concurrent access from multiple machines or users. File-level locking is sufficient for concurrent processes on same machine.
- **Source**: External constraint from product positioning
- **Extracted From**: `design/alfred/02-state/persistence-layer.md`

---

## 10. Glossary

**FlowMaster**: AI-powered multi-step workflow orchestration platform

**Provider**: An execution provider that wraps a specific AI CLI tool for integration with FlowMaster workflows

**Workflow Context**: Complete information about the current workflow execution including task ID, phase information, and previous step outputs

**Phase**: Individual step in a workflow that executes a single command or parallel set of commands

**Stream Processing**: Real-time processing of output from provider CLI tools as data arrives

**Two-Phase Streaming**: Pattern of emitting transient events during execution followed by final persisted events after completion

**Authentication Caching**: Temporary storage of authentication status to avoid repeated slow authentication checks

**Process Group**: Collection of processes that can be managed as a unit for cleanup and termination

**Tool Metadata**: Detailed information about tools used during execution including action type, file paths, and line numbers

**Session Resumption**: Ability to continue multi-turn conversations from previous executions using session identifiers

**Context Manager**: Component responsible for building, persisting, and loading execution context

**Observability Platform**: External system for tracking execution metrics, token usage, and performance data

**Context Source**: Reference to a data source (phase output, project file, or glob pattern) that provides context for command execution

**Context Tag**: Automatically generated identifier for context items based on source type (phase name, file basename, or directory name)

**Phase Output**: Stored result from a previous workflow phase that can be referenced as context by subsequent phases

**Glob Pattern**: Wildcard pattern for matching multiple files (e.g., `docs/**/*.md` matches all markdown files in docs directory)

**Optional Context Item**: Context reference that doesn't fail workflow if missing, enabling graceful handling of optional data

**Required Context Item**: Context reference that must be present, causing immediate workflow failure with clear error if missing

**Context Block**: Structured section appended to command prompts containing all specified context with clear delimiters

**Output Schema**: Definition of expected structure for command output including field names, types, descriptions, and required fields

**Schema Injection**: Process of appending schema requirements to command prompts to guide output structure

**Field Access Syntax**: Dot notation for referencing specific fields from previous phase outputs (e.g., `analyze.complexity`)

**Validation Retry**: Automatic re-execution of command with error feedback when output validation fails

**Structured Output**: JSON-formatted command output that conforms to a declared schema for reliable data flow

**Conditional Execution**: Workflow branching based on structured output fields from previous phases

**Telemetry Parsing**: Extraction of token usage, cost, and duration data from provider-specific output formats

**Model Selection**: Choice of specific AI model for workflow phase execution to optimize cost and performance

**Task State**: Persistent record of task execution including status, phases, outputs, and error history

**Workflow Snapshot**: Complete workflow execution state captured for crash recovery and resumption

**Phase-Based Logging**: Execution logging organized by workflow phase with timestamped entries

**Command Artifacts**: Stored outputs from command execution including prompts, outputs, diffs, and message histories

**Task Status**: Lifecycle state of task: created, in_progress, completed, or failed

**Phase Output**: Named data produced by workflow phase for use by dependent phases

**Error History**: Record of errors during execution with timestamps and retry counts

**Crash Recovery**: Capability to detect and resume interrupted workflows after process termination

**State Integrity**: Validation of state data structure and content to detect corruption

**Task Directory**: Organized directory structure for storing task artifacts, logs, and state

**External Task Caching**: Local storage of task information fetched from external services

**Atomic Write**: Write operation that completes entirely or not at all, preventing partial writes

**File Locking**: Mechanism to safely coordinate concurrent writes to shared files

**Snapshot Version**: Identifier for snapshot format version to ensure compatibility during restoration

**Event System**: Publish-subscribe architecture for decoupled communication between workflow execution and consumers (UI, logs, telemetry)

**Event Handler**: Consumer component that subscribes to events and performs specific actions (console output, file logging, WebSocket streaming, telemetry)

**WebSocket Server**: Server component enabling real-time bidirectional communication with UI clients for event streaming

**Event Filtering**: Mechanism to select subset of events based on type or custom filter function

**Event Statistics**: Tracking metrics for event emission including counts, timing, and frequency

**Promise-Based Event Waiting**: Async pattern for waiting on specific event occurrences with timeout support

**Workflow Lifecycle Events**: Events marking workflow start, completion, and failure

**Phase Lifecycle Events**: Events marking individual phase start, completion, and failure

**Tool Execution Events**: Events capturing tool invocation and results during workflow execution

**Assistant Message Events**: Events containing AI-generated messages and thinking blocks

**Retry Events**: Events tracking retry attempts, successes, and failures

**Validation Events**: Events monitoring output validation process

**Console Handler**: Event consumer that renders events to terminal stdout

**File Handler**: Event consumer that writes events to log files

**WebSocket Handler**: Event consumer that broadcasts events to connected UI clients

**Telemetry Handler**: Event consumer that sends events to observability platform

**Event Correlation**: Linking related events using task ID and phase identifiers

**Heartbeat Monitoring**: Periodic ping/pong messages to detect dead WebSocket connections

**Handler Isolation**: Error handling pattern preventing one handler's failure from affecting others

**Dual-Mode Operation**: System capability to run with UI (WebSocket streaming) or headless (stdout/files)

**Real-Time Streaming**: Immediate event delivery to UI clients via WebSocket with sub-100ms latency

**Headless Mode**: Execution mode for CI/CD environments using stdout and file logging without UI

**Structured Logs**: Log format with timestamps, event types, and hierarchical identifiers for machine parsing

**Verbose Mode**: Configurable log detail level showing all events vs. summary information

**Multi-Client Broadcasting**: Simultaneous event delivery to multiple WebSocket clients

**SSE (Server-Sent Events)**: HTTP-based streaming fallback for environments where WebSocket is unavailable

**Hybrid Persistence**: Optional dual-write to database (fast queries) and files (transparency and portability)

**Log File Organization**: Structured log directory layout organizing logs by task and phase

**File Locking**: Mechanism preventing log corruption during concurrent writes from parallel phases

**Privacy Filtering**: Removal of sensitive data from telemetry events before external transmission

**Telemetry Opt-Out**: User capability to disable telemetry via environment variable

**Mode Detection**: Automatic selection of UI vs headless mode based on environment variables and TTY checks

**Event Batching**: Grouping multiple events into single operation for improved I/O efficiency

**Console Throttling**: Rate limiting terminal updates to prevent overload during rapid event emission

---
