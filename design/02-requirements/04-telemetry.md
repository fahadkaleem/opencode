# Telemetry - Functional Requirements

> **Component ID**: COMP-004
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

This document defines the detailed functional requirements for the **Telemetry** component. These requirements decompose the high-level requirements assigned to this component into specific, testable specifications.

### 1.2 Component Summary

| Attribute                      | Value                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| **Component ID**               | COMP-004                                                                                   |
| **Responsibility**             | Tracing, logging, metrics collection, telemetry export, cost attribution, privacy controls |
| **Implements HL Requirements** | HL-OB-001, HL-OB-002, HL-OB-003, HL-OB-004, HL-OB-005, HL-OB-006, HL-OB-007                |

### 1.3 Requirement ID Convention

All requirements in this document follow the format: **FR-TL-XXX**

| Component | Prefix | Example   |
| --------- | ------ | --------- |
| Telemetry | FR-TL  | FR-TL-001 |

### 1.4 Priority Levels

| Priority     | Meaning                                                          |
| ------------ | ---------------------------------------------------------------- |
| **Critical** | Component cannot function without this. Must be in MVP.          |
| **High**     | Important for component's core responsibility. Should be in MVP. |
| **Medium**   | Valuable but not essential for initial release.                  |
| **Low**      | Nice to have. Future consideration.                              |

### 1.5 Document Organization

This document follows progressive disclosure principles. Requirements are organized from foundational to specialized:

1. **Privacy Controls** - Critical requirements that affect all telemetry (must understand first)
2. **Hierarchical Execution Tracing** - Foundation for correlation across execution levels
3. **Structured Logging** - Foundation for output and debugging
4. **Telemetry Export** - Depends on privacy controls; outputs traces and logs
5. **Execution Metrics** - Specific measurements built on tracing foundation
6. **Cost and Token Attribution** - Specialized metrics for AI usage
7. **Debug Mode** - Special operational mode for troubleshooting

---

## 2. Functional Requirements

### 2.1 Privacy Controls

Privacy controls are foundational because they affect ALL telemetry collection and export. Understanding these requirements first ensures proper context for subsequent sections.

#### FR-TL-001: Sensitive Data Filtering

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-OB-007 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL strip sensitive data from telemetry before external export so that user privacy is protected.

**Acceptance Criteria**:

```gherkin
Scenario: Strip file contents from telemetry
  Given telemetry includes file contents
  When telemetry is exported externally
  Then file contents should be removed
  And only metadata (file name, size) should remain

Scenario: Strip credentials from telemetry
  Given telemetry might include credentials
  When telemetry is exported
  Then any credential-like patterns should be redacted
  And replaced with [REDACTED]

Scenario: Strip command outputs from telemetry
  Given telemetry includes command outputs
  When telemetry is exported externally
  Then outputs should be summarized or removed
  And only success/failure status should remain
```

**Rationale**:
External telemetry should track metadata for monitoring without exposing sensitive code or credentials.

---

#### FR-TL-002: Telemetry Opt-Out

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-OB-007 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL provide complete telemetry opt-out via environment variable or configuration so that users can disable all external telemetry.

**Acceptance Criteria**:

```gherkin
Scenario: Opt-out via environment variable
  Given FLOWMASTER_TELEMETRY=false is set
  When workflows execute
  Then no telemetry should be sent externally
  And local logging should still function

Scenario: Opt-out via configuration
  Given telemetry.enabled = false in configuration
  When workflows execute
  Then no telemetry should be sent externally

Scenario: Verify no data sent when opted out
  Given telemetry is disabled
  When I monitor network traffic
  Then no telemetry data should be sent to external services
```

**Rationale**:
Users must have complete control over telemetry for privacy and compliance reasons.

---

#### FR-TL-003: Local-Only Mode

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-007 |
| **Dependencies** | FR-TL-002 |

**Requirement**:
The system SHALL support local-only mode that stores all telemetry locally without external export so that users can have full observability without sending data externally.

**Acceptance Criteria**:

```gherkin
Scenario: Enable local-only mode
  Given telemetry.localOnly = true in configuration
  When telemetry is generated
  Then telemetry should be stored locally
  And no external export should occur

Scenario: Local telemetry storage
  Given local-only mode is enabled
  When I query local telemetry
  Then all traces, metrics, and logs should be available
  And stored in .flowmaster/telemetry/

Scenario: Local telemetry retention
  Given local telemetry is accumulating
  When storage reaches a configured limit
  Then old telemetry should be pruned
  And recent telemetry should be retained
```

**Rationale**:
Local-only mode provides full observability for privacy-conscious users and air-gapped environments.

---

#### FR-TL-004: Telemetry Documentation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-007 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL clearly document what telemetry data is collected and exported so that users can make informed decisions.

**Acceptance Criteria**:

```gherkin
Scenario: Telemetry documentation available
  Given a user wants to understand telemetry
  When they access documentation
  Then they should find a complete list of collected data
  And what is sent externally vs kept locally

Scenario: Per-adapter documentation
  Given multiple export adapters
  When a user enables an adapter
  Then documentation should explain what data that adapter receives
  And where the data is sent

Scenario: Configuration reference
  Given telemetry configuration options
  When a user views configuration docs
  Then all telemetry settings should be documented
  And include privacy implications
```

**Rationale**:
Transparency about data collection builds trust and enables informed decisions about telemetry.

---

#### FR-TL-005: Privacy-First Data Collection Policy

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-OB-007 |
| **Dependencies** | FR-TL-001 |

**Requirement**:
The system SHALL follow a privacy-first approach where no user data, code, or execution content is collected or transmitted without explicit user consent so that user privacy is protected by default.

**Acceptance Criteria**:

```gherkin
Scenario: No data collection by default
  Given a fresh installation of FlowMaster
  When workflows execute
  Then no telemetry data should be sent to external services
  And no usage data should be collected

Scenario: Local-only operation without consent
  Given telemetry consent has not been given
  When I use FlowMaster features
  Then all data should remain local
  And no network requests should be made for telemetry purposes

Scenario: Code content never transmitted
  Given telemetry is enabled
  When workflow execution includes code content
  Then code content should never be included in telemetry
  And only metadata (file names, operation types) should be transmitted

Scenario: Explicit consent required for any collection
  Given a user wants to enable telemetry
  When they enable telemetry
  Then explicit consent dialog should be shown
  And the types of data collected should be clearly explained
  And consent must be affirmatively given
```

**Rationale**:
Privacy-first design ensures users maintain control over their data and builds trust in the system.

---

#### FR-TL-006: Telemetry Opt-In Requirement

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-OB-007 |
| **Dependencies** | FR-TL-005 |

**Requirement**:
The system SHALL require explicit opt-in for external telemetry collection (not opt-out) so that telemetry is disabled by default and users must actively choose to enable it.

**Acceptance Criteria**:

```gherkin
Scenario: Telemetry disabled by default
  Given a new installation
  When I check telemetry configuration
  Then external telemetry should be disabled
  And no external endpoints should be configured

Scenario: Opt-in via explicit command
  Given telemetry is disabled
  When I run "flowmaster telemetry enable"
  Then a consent prompt should be displayed
  And I must explicitly confirm to enable telemetry

Scenario: Opt-in via configuration
  Given telemetry is disabled
  When I set telemetry.enabled = true in configuration
  And I have not previously consented
  Then on next execution, consent should be requested
  And telemetry should not activate until consent is given

Scenario: Consent record persisted
  Given I have opted in to telemetry
  When I restart FlowMaster
  Then my consent should be remembered
  And telemetry should remain enabled

Scenario: Easy opt-out after opt-in
  Given telemetry is enabled
  When I run "flowmaster telemetry disable"
  Then telemetry should be immediately disabled
  And no confirmation should be required to disable
```

**Rationale**:
Opt-in by default respects user privacy and complies with privacy regulations that require affirmative consent for data collection.

---

### 2.2 Hierarchical Execution Tracing

Tracing provides the foundation for correlating events, logs, and metrics across the execution hierarchy (workflow → phase → command).

#### FR-TL-007: Trace ID Generation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-OB-001 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL generate unique trace IDs for each execution level (workflow, phase, command) so that executions can be uniquely identified and correlated.

**Acceptance Criteria**:

```gherkin
Scenario: Generate trace ID for workflow
  Given a workflow execution is started
  When the Telemetry component initializes tracing
  Then a unique trace ID should be generated
  And the trace ID should follow a consistent format

Scenario: Generate trace ID for phase
  Given a phase execution is started within a workflow
  When the Telemetry component initializes tracing
  Then a unique trace ID should be generated for the phase
  And the phase trace should reference the parent workflow trace ID

Scenario: Trace IDs are unique
  Given multiple executions are started concurrently
  When trace IDs are generated
  Then each trace ID should be globally unique
  And no collisions should occur
```

**Rationale**:
Unique trace IDs are the foundation of distributed tracing. They enable correlating events, logs, and metrics across the execution hierarchy.

---

#### FR-TL-008: Parent-Child Trace Correlation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-OB-001 |
| **Dependencies** | FR-TL-007 |

**Requirement**:
The system SHALL establish parent-child relationships between trace IDs so that the full execution hierarchy can be reconstructed from any trace.

**Acceptance Criteria**:

```gherkin
Scenario: Child trace references parent
  Given a workflow trace with ID "workflow-123"
  When a phase starts within that workflow
  Then the phase trace should include "workflow-123" as parent trace ID
  And the phase should have its own unique trace ID

Scenario: Full hierarchy reconstruction
  Given a command trace ID
  When I query the trace hierarchy
  Then I should see the parent phase trace
  And the parent workflow trace
  And any ancestor workflow traces (for composed workflows via uses:)

Scenario: Trace hierarchy in events
  Given a phase emits an event
  When the event is captured
  Then the event should include the phase trace ID
  And the workflow trace ID
  And any parent workflow trace IDs (for composed workflows)
```

**Rationale**:
Parent-child correlation enables drilling down from high-level failures to root causes and rolling up metrics from commands to workflows.

---

#### FR-TL-009: Trace Context Propagation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-001 |
| **Dependencies** | FR-TL-008 |

**Requirement**:
The system SHALL propagate trace context through all execution levels so that all logs, events, and telemetry include trace correlation.

**Acceptance Criteria**:

```gherkin
Scenario: Trace ID in all logs
  Given a workflow is executing with trace ID "wf-456"
  When a log entry is written
  Then the log entry should include trace ID "wf-456"

Scenario: Trace ID in all events
  Given a phase is executing with trace ID "ph-789"
  When a phase event is emitted
  Then the event payload should include trace ID "ph-789"

Scenario: Trace context crosses component boundaries
  Given the Orchestrator calls Agent Executor
  When Agent Executor executes a command
  Then the command should inherit the trace context
  And all command telemetry should include the trace IDs
```

**Rationale**:
Trace propagation ensures end-to-end visibility across all components and enables filtering logs and events by any trace ID in the hierarchy.

---

#### FR-TL-010: Trace Data Capture

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-001 |
| **Dependencies** | FR-TL-007 |

**Requirement**:
The system SHALL capture timing, status, and context data at each execution level so that traces provide complete execution visibility.

**Acceptance Criteria**:

```gherkin
Scenario: Capture execution timing
  Given a phase execution starts
  When the phase completes
  Then the trace should include start timestamp
  And end timestamp
  And calculated duration

Scenario: Capture execution status
  Given a command execution
  When the command completes
  Then the trace should include success/failure status
  And error details if failed
  And retry count if retried

Scenario: Capture execution context
  Given a workflow execution
  When the trace is recorded
  Then the trace should include workflow name
  And task ID
  And phase count
  And relevant configuration
```

**Rationale**:
Complete trace data enables debugging failures, identifying bottlenecks, and understanding execution patterns.

---

### 2.3 Structured Logging

Structured logging provides machine-readable output for debugging, monitoring, and integration with log aggregation systems.

#### FR-TL-011: JSON Log Format

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Critical  |
| **Implements**   | HL-OB-003 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL emit logs in JSON format with consistent schema so that logs can be parsed and analyzed programmatically.

**Acceptance Criteria**:

```gherkin
Scenario: Log entry is valid JSON
  Given a log event occurs
  When the log entry is written
  Then the entry should be valid JSON
  And parseable by standard JSON tools

Scenario: Consistent log schema
  Given multiple log entries from different components
  When the entries are compared
  Then all entries should have the same base fields
  And additional fields should follow a consistent pattern

Scenario: Log schema includes required fields
  Given a log entry
  When I inspect the entry
  Then it should include timestamp
  And level (DEBUG, INFO, WARN, ERROR, FATAL)
  And message
  And trace ID
  And execution level (workflow, phase, command)
```

**Rationale**:
JSON logs enable integration with log aggregation systems and programmatic analysis.

---

#### FR-TL-012: Log Severity Levels

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-003 |
| **Dependencies** | FR-TL-011 |

**Requirement**:
The system SHALL support standard log severity levels (DEBUG, INFO, WARN, ERROR, FATAL) so that logs can be filtered by importance.

**Acceptance Criteria**:

```gherkin
Scenario: Log with appropriate severity
  Given a successful phase completion
  When the event is logged
  Then the log level should be INFO

Scenario: Error severity for failures
  Given a phase execution fails
  When the error is logged
  Then the log level should be ERROR
  And error details should be included

Scenario: Debug level for verbose information
  Given debug mode is enabled
  When detailed execution information is logged
  Then the log level should be DEBUG
  And the information should include internal state

Scenario: Filter logs by level
  Given logs at multiple severity levels
  When I filter for ERROR and above
  Then only ERROR and FATAL logs should be returned
```

**Rationale**:
Standard severity levels enable filtering logs by importance and configuring alerting thresholds.

---

#### FR-TL-013: Log Output Destinations

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-003 |
| **Dependencies** | FR-TL-011 |

**Requirement**:
The system SHALL support multiple log output destinations (stdout/stderr, files) so that logs can be consumed by different systems.

**Acceptance Criteria**:

```gherkin
Scenario: Log to stderr
  Given default logging configuration
  When logs are written
  Then logs should be written to stderr
  And stdout should remain clean for piping results

Scenario: Log to file
  Given file logging is configured
  When logs are written
  Then logs should be appended to the configured file
  And the file should be readable with standard tools

Scenario: Log to multiple destinations
  Given both stderr and file logging are enabled
  When a log event occurs
  Then the log should be written to both destinations
```

**Rationale**:
Multiple destinations support different use cases: stderr for interactive use, files for persistence, stdout for piping.

---

#### FR-TL-014: Real-Time Log Streaming

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-003 |
| **Dependencies** | FR-TL-013 |

**Requirement**:
The system SHALL write logs in real-time as events occur so that progress can be monitored during execution.

**Acceptance Criteria**:

```gherkin
Scenario: Logs appear immediately
  Given a workflow is executing
  When a phase starts
  Then the phase start log should appear immediately
  And not be buffered until phase completion

Scenario: Tail logs during execution
  Given a workflow is running
  When I tail the log file
  Then I should see new entries as they occur
  And entries should have millisecond-precision timestamps

Scenario: Log writes don't block execution
  Given a long-running phase
  When many log entries are written
  Then execution performance should not be significantly impacted
  And log write overhead should be < 10ms per entry
```

**Rationale**:
Real-time logging enables monitoring long-running workflows and immediate visibility into execution progress.

---

#### FR-TL-015: Log Verbosity Configuration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-OB-003 |
| **Dependencies** | FR-TL-012 |

**Requirement**:
The system SHALL support configurable log verbosity per execution level so that users can control log detail.

**Acceptance Criteria**:

```gherkin
Scenario: Default verbosity shows essential info
  Given default logging configuration
  When a workflow executes
  Then phase starts and completions should be logged
  And errors should be logged
  And tool calls should not be logged

Scenario: Verbose mode shows all details
  Given verbose mode is enabled via --verbose flag
  When a workflow executes
  Then all events including tool calls should be logged
  And internal state transitions should be logged

Scenario: Per-level verbosity configuration
  Given configuration specifies DEBUG level for commands
  And INFO level for workflows
  When execution occurs
  Then command logs should include DEBUG entries
  And workflow logs should only include INFO and above
```

**Rationale**:
Configurable verbosity enables focused debugging without overwhelming users with information in normal operation.

---

### 2.4 Telemetry Export

Export capabilities allow telemetry data to be sent to external observability platforms. These requirements depend on privacy controls (Section 2.1) being understood first.

#### FR-TL-016: Pluggable Export Adapters

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-002 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support pluggable adapters for telemetry export so that teams can use their preferred observability platforms.

**Acceptance Criteria**:

```gherkin
Scenario: Register export adapter
  Given an OpenTelemetry adapter implementation
  When I register the adapter with Telemetry
  Then the adapter should receive telemetry data
  And the adapter should export to the target platform

Scenario: Multiple adapters active
  Given both Langfuse and OpenTelemetry adapters are registered
  When telemetry data is generated
  Then both adapters should receive the data
  And each should export to their respective platforms

Scenario: Add new adapter without code changes
  Given a new observability platform adapter
  When I configure the adapter in settings
  Then the adapter should be loaded
  And telemetry should be exported to the new platform
```

**Rationale**:
Pluggable adapters enable integration with diverse observability stacks without vendor lock-in.

---

#### FR-TL-017: OpenTelemetry Support

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-002 |
| **Dependencies** | FR-TL-016 |

**Requirement**:
The system SHALL support OpenTelemetry export format so that telemetry can be sent to any OTLP-compatible backend.

**Acceptance Criteria**:

```gherkin
Scenario: Export traces in OTLP format
  Given OpenTelemetry adapter is configured
  When execution traces are generated
  Then traces should be exported in OTLP format
  And traces should be receivable by any OTLP collector

Scenario: Export metrics in OTLP format
  Given OpenTelemetry adapter is configured
  When execution metrics are collected
  Then metrics should be exported in OTLP format
  And metrics should include standard attributes

Scenario: Configure OTLP endpoint
  Given an OTLP collector endpoint
  When I configure the endpoint in settings
  Then telemetry should be sent to that endpoint
```

**Rationale**:
OpenTelemetry is the industry standard for observability. Supporting OTLP enables integration with Jaeger, Grafana, Datadog, and other platforms.

---

#### FR-TL-018: Langfuse Integration

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-002 |
| **Dependencies** | FR-TL-016 |

**Requirement**:
The system SHALL support Langfuse export for LLM-specific observability so that AI execution can be monitored and analyzed.

**Acceptance Criteria**:

```gherkin
Scenario: Export to Langfuse
  Given Langfuse adapter is configured with API key
  When a command execution completes
  Then execution data should be sent to Langfuse
  And the execution should appear in Langfuse dashboard

Scenario: LLM-specific metrics in Langfuse
  Given a command using Claude provider
  When the execution is exported to Langfuse
  Then token usage should be included
  And model information should be included
  And prompt/response should be included (if not privacy-filtered)

Scenario: Langfuse trace hierarchy
  Given a workflow with multiple phases
  When exported to Langfuse
  Then the hierarchy should be preserved
  And phases should appear as spans under the workflow trace
```

**Rationale**:
Langfuse provides specialized LLM observability including prompt analysis, token tracking, and cost monitoring.

---

#### FR-TL-019: Export Failure Handling

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-002 |
| **Dependencies** | FR-TL-016 |

**Requirement**:
The system SHALL handle export failures gracefully without blocking workflow execution so that observability issues don't impact core functionality.

**Acceptance Criteria**:

```gherkin
Scenario: Export failure does not block execution
  Given an export adapter that fails
  When a workflow is executing
  Then the workflow should continue normally
  And the export failure should be logged locally

Scenario: Retry failed exports
  Given a transient network failure during export
  When the export fails
  Then the system should retry with backoff
  And succeed when connectivity is restored

Scenario: Buffer during export outage
  Given the export endpoint is unavailable
  When telemetry is generated
  Then telemetry should be buffered locally
  And exported when the endpoint becomes available
```

**Rationale**:
Workflow execution is the primary function. Observability is important but should not cause workflow failures.

---

#### FR-TL-020: Adapter Enable/Disable

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-OB-002 |
| **Dependencies** | FR-TL-016 |

**Requirement**:
The system SHALL allow enabling/disabling export adapters via configuration so that users can control where telemetry is sent.

**Acceptance Criteria**:

```gherkin
Scenario: Disable adapter via configuration
  Given Langfuse adapter is configured
  When I set langfuse.enabled = false in configuration
  Then no telemetry should be sent to Langfuse

Scenario: Enable adapter via environment variable
  Given OpenTelemetry adapter is disabled by default
  When I set FLOWMASTER_OTEL_ENABLED=true
  Then OpenTelemetry export should be enabled

Scenario: Runtime adapter toggle
  Given a running workflow
  When I disable an adapter
  Then subsequent telemetry should not be sent to that adapter
  And already-buffered telemetry should be discarded for that adapter
```

**Rationale**:
Users need control over telemetry destinations for privacy, cost, and operational reasons.

---

### 2.5 Execution Metrics

Execution metrics provide quantitative data about system performance and reliability, built on the tracing foundation.

#### FR-TL-021: Execution Duration Tracking

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-006 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL track execution duration at all levels (workflow, phase, command) so that performance can be monitored.

**Acceptance Criteria**:

```gherkin
Scenario: Track command duration
  Given a command execution
  When the command completes
  Then the duration should be recorded
  And associated with the command trace

Scenario: Track phase duration
  Given a phase execution
  When the phase completes
  Then the duration should be recorded
  And include time for all commands in the phase

Scenario: Duration breakdown
  Given a completed workflow
  When I query duration metrics
  Then I should see total workflow duration
  And breakdown by phase
  And identify which phases took longest
```

**Rationale**:
Duration tracking enables performance monitoring, bottleneck identification, and SLA tracking.

---

#### FR-TL-022: Success/Failure Rate Tracking

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-006 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL track success and failure rates per command, phase, and workflow so that reliability can be monitored.

**Acceptance Criteria**:

```gherkin
Scenario: Track command success rate
  Given multiple executions of a command
  When I query success metrics
  Then I should see total executions
  And successful executions
  And calculated success rate

Scenario: Track failure by error type
  Given multiple failed executions
  When I query failure metrics
  Then failures should be categorized by error type
  And counts should be available per error type

Scenario: Historical success rate
  Given executions over time
  When I query historical metrics
  Then I should see success rate trends
  And be able to detect regressions
```

**Rationale**:
Success/failure tracking enables reliability monitoring, alerting on regressions, and identifying problematic commands.

---

#### FR-TL-023: Retry Metrics

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-OB-006 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL track retry attempts and outcomes so that retry behavior can be analyzed.

**Acceptance Criteria**:

```gherkin
Scenario: Track retry count
  Given a phase that required retries
  When I query retry metrics
  Then I should see the number of retry attempts
  And the final outcome (success/failure)

Scenario: Retry rate by error type
  Given multiple executions with retries
  When I analyze retry metrics
  Then I should see which error types trigger retries
  And which error types are successfully retried

Scenario: Retry exhaustion tracking
  Given phases that exhausted all retries
  When I query retry metrics
  Then I should see retry exhaustion count
  And correlation with error types
```

**Rationale**:
Retry metrics help identify flaky operations, optimize retry configuration, and understand transient vs persistent failures.

---

#### FR-TL-024: Provider Latency Tracking

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-OB-006 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL track provider response latency per request so that provider performance can be monitored.

**Acceptance Criteria**:

```gherkin
Scenario: Track individual request latency
  Given a request to an LLM provider
  When the response is received
  Then the latency should be recorded
  And associated with the provider and model

Scenario: Provider latency comparison
  Given requests to multiple providers
  When I query latency metrics
  Then I should see average latency per provider
  And percentile distributions (p50, p95, p99)

Scenario: Detect provider degradation
  Given historical latency data
  When provider latency increases significantly
  Then the increase should be detectable in metrics
  And potentially trigger alerts
```

**Rationale**:
Provider latency tracking enables performance comparison between providers and early detection of provider issues.

---

#### FR-TL-025: Metrics Export

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-OB-006 |
| **Dependencies** | FR-TL-016 |

**Requirement**:
The system SHALL support metrics export to observability platforms so that metrics can be monitored externally.

**Acceptance Criteria**:

```gherkin
Scenario: Export metrics via OpenTelemetry
  Given OpenTelemetry adapter is configured
  When metrics are collected
  Then metrics should be exported in OTLP format
  And visible in the configured backend

Scenario: Real-time metrics streaming
  Given metrics export is configured
  When execution is in progress
  Then metrics should be streamed in near-real-time
  And not only at execution completion

Scenario: Historical metrics query
  Given metrics exported to a backend
  When I query the backend
  Then I should be able to see historical metrics
  And create dashboards and alerts
```

**Rationale**:
Metrics export enables integration with existing monitoring infrastructure and long-term trend analysis.

---

### 2.6 Cost and Token Attribution

Cost tracking provides visibility into AI usage costs, enabling budget management and optimization.

#### FR-TL-026: Token Usage Tracking

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-004 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL track input and output token counts per command execution so that AI usage can be monitored.

**Acceptance Criteria**:

```gherkin
Scenario: Track input tokens
  Given a command sends a prompt to an LLM
  When the response is received
  Then the input token count should be recorded
  And associated with the command trace

Scenario: Track output tokens
  Given a command receives an LLM response
  When the response is processed
  Then the output token count should be recorded
  And associated with the command trace

Scenario: Track cached tokens
  Given a provider supports token caching
  When cached tokens are used
  Then the cached token count should be recorded separately
  And distinguished from non-cached tokens
```

**Rationale**:
Token tracking is essential for understanding AI costs and optimizing prompt efficiency.

---

#### FR-TL-027: Cost Calculation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-004 |
| **Dependencies** | FR-TL-026 |

**Requirement**:
The system SHALL calculate costs based on provider/model pricing so that users understand execution costs.

**Acceptance Criteria**:

```gherkin
Scenario: Calculate cost from tokens
  Given a command used 1000 input tokens and 500 output tokens
  And the model is Claude Sonnet at $3/1M input, $15/1M output
  When cost is calculated
  Then the cost should be $0.0105

Scenario: Different pricing per model
  Given two commands using different models
  When costs are calculated
  Then each command should use its model's pricing
  And costs should be accurate per model

Scenario: Cost includes all token types
  Given a command with input, output, and cached tokens
  When cost is calculated
  Then all token types should be included
  And cached tokens should use cached pricing if available
```

**Rationale**:
Cost calculation enables budget management and identification of expensive operations.

---

#### FR-TL-028: Cost Aggregation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-004 |
| **Dependencies** | FR-TL-027 |

**Requirement**:
The system SHALL aggregate costs up the execution hierarchy (command -> phase -> workflow) so that costs can be analyzed at any level.

**Acceptance Criteria**:

```gherkin
Scenario: Phase cost is sum of command costs
  Given a phase with 3 commands costing $0.01, $0.02, $0.03
  When the phase cost is calculated
  Then the phase cost should be $0.06

Scenario: Workflow cost is sum of phase costs
  Given a workflow with 2 phases costing $0.10 and $0.15
  When the workflow cost is calculated
  Then the workflow cost should be $0.25

Scenario: Query cost at any level
  Given a completed workflow
  When I query the cost
  Then I should be able to get workflow total cost
  And breakdown by phase
  And breakdown by command
```

**Rationale**:
Hierarchical cost aggregation enables identifying expensive workflows, phases, and commands.

---

#### FR-TL-029: Cost Data in Artifacts

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-OB-004 |
| **Dependencies** | FR-TL-028 |

**Requirement**:
The system SHALL include cost data in execution artifacts and telemetry so that costs can be reviewed and exported.

**Acceptance Criteria**:

```gherkin
Scenario: Cost in execution artifacts
  Given a completed workflow
  When I inspect the execution artifacts
  Then cost data should be included
  And broken down by phase

Scenario: Cost in telemetry export
  Given telemetry export is configured
  When execution completes
  Then cost data should be included in exported telemetry
  And visible in the observability platform

Scenario: Historical cost data
  Given multiple workflow executions over time
  When I query historical cost data
  Then costs should be available per execution
  And aggregatable by time period
```

**Rationale**:
Cost data in artifacts enables historical analysis, reporting, and cost optimization efforts.

---

### 2.7 Debug Mode

Debug mode provides enhanced visibility for troubleshooting, capturing detailed execution data that is not collected in normal operation.

#### FR-TL-030: Debug Mode Activation

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-005 |
| **Dependencies** | None      |

**Requirement**:
The system SHALL support debug mode activation via CLI flag or environment variable so that verbose debugging can be enabled on demand.

**Acceptance Criteria**:

```gherkin
Scenario: Enable debug via CLI flag
  Given a workflow command
  When I add --debug flag
  Then debug mode should be enabled for that execution

Scenario: Enable debug via environment variable
  Given FLOWMASTER_DEBUG=true is set
  When I execute a workflow
  Then debug mode should be enabled

Scenario: Debug mode indicator
  Given debug mode is enabled
  When execution starts
  Then logs should indicate debug mode is active
  And UI should show debug mode indicator
```

**Rationale**:
On-demand debug mode enables detailed troubleshooting without impacting normal operation performance.

---

#### FR-TL-031: Full Prompt Capture

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-005 |
| **Dependencies** | FR-TL-030 |

**Requirement**:
The system SHALL capture full prompts sent to providers when debug mode is enabled so that prompt issues can be diagnosed.

**Acceptance Criteria**:

```gherkin
Scenario: Capture prompt in debug mode
  Given debug mode is enabled
  When a command sends a prompt to a provider
  Then the full prompt should be saved to artifacts
  And include all context and system prompts

Scenario: Prompt artifact location
  Given a debug-mode execution
  When I look for prompt artifacts
  Then they should be in .flowmaster/tasks/{taskId}/artifacts/{phase}/prompt.txt
  And be human-readable

Scenario: No prompt capture in normal mode
  Given debug mode is disabled
  When a command executes
  Then full prompts should not be saved
  And only summary information should be recorded
```

**Rationale**:
Full prompt capture enables diagnosing context building issues, template problems, and prompt engineering optimization.

---

#### FR-TL-032: Full Response Capture

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | High      |
| **Implements**   | HL-OB-005 |
| **Dependencies** | FR-TL-030 |

**Requirement**:
The system SHALL capture complete provider responses when debug mode is enabled so that response issues can be diagnosed.

**Acceptance Criteria**:

```gherkin
Scenario: Capture full response in debug mode
  Given debug mode is enabled
  When a provider returns a response
  Then the complete response should be saved to artifacts
  And include all tool uses and thinking blocks

Scenario: Response artifact format
  Given a debug-mode execution
  When I inspect response artifacts
  Then they should be in JSON format
  And include the full message history

Scenario: Streaming response capture
  Given a streaming response
  When the response completes
  Then all streamed content should be captured
  And assembled into the complete response
```

**Rationale**:
Full response capture enables understanding LLM behavior, debugging tool use issues, and improving prompts.

---

#### FR-TL-033: Intermediate State Capture

| Attribute        | Value     |
| ---------------- | --------- |
| **Priority**     | Medium    |
| **Implements**   | HL-OB-005 |
| **Dependencies** | FR-TL-030 |

**Requirement**:
The system SHALL capture intermediate execution state when debug mode is enabled so that execution flow can be analyzed.

**Acceptance Criteria**:

```gherkin
Scenario: Capture context at each phase
  Given debug mode is enabled
  When a phase starts
  Then the context available to that phase should be captured
  And saved to artifacts

Scenario: Capture state machine transitions
  Given debug mode is enabled
  When the orchestrator transitions state
  Then the transition should be logged
  And include from-state, to-state, and trigger

Scenario: Capture validation results
  Given debug mode is enabled
  When validation runs
  Then validation inputs and outputs should be captured
  And include reasoning if AI validation
```

**Rationale**:
Intermediate state capture enables step-by-step debugging of complex workflow issues.

---

## 3. Error Handling Requirements

### 3.1 Error Scenarios

| Error Scenario                    | Expected Behavior                         | Error Code |
| --------------------------------- | ----------------------------------------- | ---------- |
| Export adapter connection failure | Buffer locally, retry with backoff        | ERR_TL_001 |
| Invalid telemetry format          | Log error, skip invalid entry             | ERR_TL_002 |
| Disk full for local storage       | Warn user, continue without local storage | ERR_TL_003 |
| Missing trace context             | Create new root trace, log warning        | ERR_TL_004 |
| Configuration parse error         | Use defaults, log warning                 | ERR_TL_005 |
| Privacy filter failure            | Block export, log error                   | ERR_TL_006 |
| Metrics aggregation overflow      | Cap at maximum, log warning               | ERR_TL_007 |

### 3.2 Retry Behavior

| Condition                           | Retry? | Max Attempts | Backoff Strategy |
| ----------------------------------- | ------ | ------------ | ---------------- |
| Export network failure              | Yes    | 5            | Exponential      |
| Export timeout                      | Yes    | 3            | Exponential      |
| Invalid response from export target | No     | -            | -                |
| Local file write failure            | Yes    | 3            | Linear           |
| Configuration load failure          | No     | -            | -                |

---

## 4. Interface Requirements

### 4.1 Required Interfaces (Dependencies)

| Interface            | Provider Component             | Purpose                       |
| -------------------- | ------------------------------ | ----------------------------- |
| Event subscription   | COMP-001 Message Bus           | Subscribe to execution events |
| Configuration access | COMP-002 Configuration Manager | Get telemetry settings        |

### 4.2 Provided Interfaces (Dependents)

| Interface        | Consumer Component(s) | Purpose                               |
| ---------------- | --------------------- | ------------------------------------- |
| Trace context    | All components        | Get current trace IDs for correlation |
| Log writer       | All components        | Write structured logs                 |
| Metrics recorder | All components        | Record execution metrics              |
| Debug mode query | All components        | Check if debug mode is active         |

---

## 5. Data Requirements

### 5.1 Data Entities

| Entity           | Description                               | Persistence           |
| ---------------- | ----------------------------------------- | --------------------- |
| Trace            | Execution trace with hierarchy            | Exported / Local file |
| Log Entry        | Structured log record                     | File / Exported       |
| Metric           | Execution metric (duration, tokens, cost) | In-memory / Exported  |
| Artifact         | Debug mode capture (prompt, response)     | Local file            |
| Telemetry Config | Export adapter settings                   | Configuration file    |

### 5.2 Data Constraints

| Constraint             | Description                                       |
| ---------------------- | ------------------------------------------------- |
| Trace ID uniqueness    | Trace IDs must be globally unique                 |
| Timestamp precision    | All timestamps must have millisecond precision    |
| Log schema consistency | All logs must follow the defined JSON schema      |
| Privacy filtering      | External exports must pass privacy filters        |
| Retention limits       | Local telemetry must respect configured retention |

---

## 6. Traceability

### 6.1 HL Requirement Decomposition

| HL Requirement | Functional Requirements                                          |
| -------------- | ---------------------------------------------------------------- |
| HL-OB-001      | FR-TL-007, FR-TL-008, FR-TL-009, FR-TL-010                       |
| HL-OB-002      | FR-TL-016, FR-TL-017, FR-TL-018, FR-TL-019, FR-TL-020            |
| HL-OB-003      | FR-TL-011, FR-TL-012, FR-TL-013, FR-TL-014, FR-TL-015            |
| HL-OB-004      | FR-TL-026, FR-TL-027, FR-TL-028, FR-TL-029                       |
| HL-OB-005      | FR-TL-030, FR-TL-031, FR-TL-032, FR-TL-033                       |
| HL-OB-006      | FR-TL-021, FR-TL-022, FR-TL-023, FR-TL-024, FR-TL-025            |
| HL-OB-007      | FR-TL-001, FR-TL-002, FR-TL-003, FR-TL-004, FR-TL-005, FR-TL-006 |

### 6.2 Requirements Summary

| Category             | Count | Critical | High | Medium | Low |
| -------------------- | ----- | -------- | ---- | ------ | --- |
| Privacy Controls     | 6     | 4        | 2    | 0      | 0   |
| Hierarchical Tracing | 4     | 2        | 2    | 0      | 0   |
| Structured Logging   | 5     | 1        | 3    | 1      | 0   |
| Telemetry Export     | 5     | 0        | 4    | 1      | 0   |
| Execution Metrics    | 5     | 0        | 2    | 3      | 0   |
| Cost Attribution     | 4     | 0        | 3    | 1      | 0   |
| Debug Mode           | 4     | 0        | 3    | 1      | 0   |
| **Total**            | 33    | 7        | 19   | 7      | 0   |

---

## 7. Open Questions

| Question ID | Question                                              | Owner | Target Date | Resolution |
| ----------- | ----------------------------------------------------- | ----- | ----------- | ---------- |
| Q-TL-001    | What is the default local telemetry retention period? | TBD   | TBD         | Pending    |
| Q-TL-002    | Should we support custom privacy filter rules?        | TBD   | TBD         | Pending    |
| Q-TL-003    | What metrics should trigger automatic alerts?         | TBD   | TBD         | Pending    |

---

## 8. Requirements Index

| ID        | Title                                | Priority | Implements | Status |
| --------- | ------------------------------------ | -------- | ---------- | ------ |
| FR-TL-001 | Sensitive Data Filtering             | Critical | HL-OB-007  | Draft  |
| FR-TL-002 | Telemetry Opt-Out                    | Critical | HL-OB-007  | Draft  |
| FR-TL-003 | Local-Only Mode                      | High     | HL-OB-007  | Draft  |
| FR-TL-004 | Telemetry Documentation              | High     | HL-OB-007  | Draft  |
| FR-TL-005 | Privacy-First Data Collection Policy | Critical | HL-OB-007  | Draft  |
| FR-TL-006 | Telemetry Opt-In Requirement         | Critical | HL-OB-007  | Draft  |
| FR-TL-007 | Trace ID Generation                  | Critical | HL-OB-001  | Draft  |
| FR-TL-008 | Parent-Child Trace Correlation       | Critical | HL-OB-001  | Draft  |
| FR-TL-009 | Trace Context Propagation            | High     | HL-OB-001  | Draft  |
| FR-TL-010 | Trace Data Capture                   | High     | HL-OB-001  | Draft  |
| FR-TL-011 | JSON Log Format                      | Critical | HL-OB-003  | Draft  |
| FR-TL-012 | Log Severity Levels                  | High     | HL-OB-003  | Draft  |
| FR-TL-013 | Log Output Destinations              | High     | HL-OB-003  | Draft  |
| FR-TL-014 | Real-Time Log Streaming              | High     | HL-OB-003  | Draft  |
| FR-TL-015 | Log Verbosity Configuration          | Medium   | HL-OB-003  | Draft  |
| FR-TL-016 | Pluggable Export Adapters            | High     | HL-OB-002  | Draft  |
| FR-TL-017 | OpenTelemetry Support                | High     | HL-OB-002  | Draft  |
| FR-TL-018 | Langfuse Integration                 | High     | HL-OB-002  | Draft  |
| FR-TL-019 | Export Failure Handling              | High     | HL-OB-002  | Draft  |
| FR-TL-020 | Adapter Enable/Disable               | Medium   | HL-OB-002  | Draft  |
| FR-TL-021 | Execution Duration Tracking          | High     | HL-OB-006  | Draft  |
| FR-TL-022 | Success/Failure Rate Tracking        | High     | HL-OB-006  | Draft  |
| FR-TL-023 | Retry Metrics                        | Medium   | HL-OB-006  | Draft  |
| FR-TL-024 | Provider Latency Tracking            | Medium   | HL-OB-006  | Draft  |
| FR-TL-025 | Metrics Export                       | Medium   | HL-OB-006  | Draft  |
| FR-TL-026 | Token Usage Tracking                 | High     | HL-OB-004  | Draft  |
| FR-TL-027 | Cost Calculation                     | High     | HL-OB-004  | Draft  |
| FR-TL-028 | Cost Aggregation                     | High     | HL-OB-004  | Draft  |
| FR-TL-029 | Cost Data in Artifacts               | Medium   | HL-OB-004  | Draft  |
| FR-TL-030 | Debug Mode Activation                | High     | HL-OB-005  | Draft  |
| FR-TL-031 | Full Prompt Capture                  | High     | HL-OB-005  | Draft  |
| FR-TL-032 | Full Response Capture                | High     | HL-OB-005  | Draft  |
| FR-TL-033 | Intermediate State Capture           | Medium   | HL-OB-005  | Draft  |

---

## Document History

| Version | Date       | Author          | Changes                                                                                                                             |
| ------- | ---------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | 2025-11-25 | FlowMaster Team | Initial version                                                                                                                     |
| 1.1     | 2025-11-26 | FlowMaster Team | Added FR-TL-032, FR-TL-033 (privacy-first policy, opt-in requirement)                                                               |
| 2.0     | 2025-11-26 | FlowMaster Team | Reorganized for progressive disclosure; Privacy Controls moved to Section 2.1; Renumbered all FRs; Updated component ID to COMP-004 |
