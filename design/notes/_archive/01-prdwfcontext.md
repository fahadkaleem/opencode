---
# FRONTMATTER - AI-Readable Metadata

document:
  type: 'product_requirements_specification'
  title: 'FlowMaster - Requirements Specification'
  identifier: 'PRD-FLOWMASTER-001'
  version: '1.0.0'
  status: 'draft'
  last_modified: '2025-11-24'
  extraction_sources:
    - 'design/alfred/00-context/01-business-context.md'
    - 'design/alfred/05-workflow/orchestrator-core.md'
    - 'design/alfred/05-workflow/intelligent-agents.md'
    - 'design/alfred/05-workflow/features/conditionals.md'
    - 'design/alfred/05-workflow/features/human-in-the-loop.md'
    - 'design/alfred/05-workflow/features/loops-and-iteration.md'
    - 'design/alfred/05-workflow/features/validation-logic.md'

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
  - 'multi_provider'
---

# FlowMaster: Requirements Specification

> **Document Purpose**: This document specifies all functional and non-functional requirements for FlowMaster extracted from design documents. It defines what the system must do (functional), how well it must perform (non-functional), and what constraints govern implementation (business constraints).

---

## 1. Executive Summary

**Business Context:**

FlowMaster is a workflow orchestration platform designed to eliminate the manual overhead developers currently experience when using AI coding assistants. Current AI tools (Claude Code, Cursor, Codex) excel at single tasks but require developers to manually orchestrate multi-step workflows: breaking tasks into subtasks, managing context across sessions, validating outputs, and merging results.

FlowMaster automates this orchestration, enabling complex features to be built from specifications with minimal human intervention. The platform combines declarative workflow definitions with multi-provider AI routing to optimize for cost, quality, and reliability.

**Technical Approach:**

FlowMaster provides a CLI-based orchestration layer that runs locally on developer machines. It executes workflows defined as code (YAML), supports multiple execution modes (interactive, headless, hybrid), and integrates with task management systems (Jira, Linear, GitHub Issues). The system maintains isolated execution contexts per command to prevent context degradation and supports both sequential and parallel execution.

**Value Proposition:**

- **70%+ reduction in developer orchestration time**
- **3x faster complex feature completion** versus manual AI orchestration
- **90%+ workflow success rate** for standard development workflows
- **50%+ cost savings** through optimal AI provider routing
- **Zero cloud infrastructure** required - runs entirely on local machines
- **No vendor lock-in** - supports multiple AI providers with provider abstraction

---

## 4. Functional Requirements

### 4.1 Core Workflow Orchestration

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### FR-001: Autonomous Multi-Step Workflow Orchestration

- **Requirement**: The system SHALL orchestrate multi-step development workflows autonomously to eliminate manual orchestration overhead.
- **Priority**: Critical
  - System's core value proposition and primary capability
- **Acceptance Criteria**:
  - [ ] System can execute multi-step workflows without human intervention between phases
  - [ ] System handles task breakdown, context management, validation, and merging automatically
  - [ ] System provides observability into workflow execution progress
- **Rationale**: Current AI coding assistants require developers to manually break tasks into subtasks, orchestrate multiple sessions, manage context, validate outputs, and merge results. This manual overhead dominates developer time for complex features. FlowMaster eliminates this burden through automated orchestration.
- **Source**: `design/alfred/00-context/01-business-context.md` (Problem Statement, lines 65-103)

---

#### FR-002: Complex Multi-Phase Task Execution

- **Requirement**: The system SHALL execute complex, multi-phase tasks from specifications through validated merges without requiring human intervention between phases.
- **Priority**: Critical
  - Enables the core use case of automating complex development tasks
- **Acceptance Criteria**:
  - [ ] System can execute workflows with specifications as input
  - [ ] System breaks specifications into subtasks automatically
  - [ ] System executes subtasks through to validated completion
  - [ ] System merges results without human intervention between phases
  - [ ] System handles tasks with hundreds of subtasks
- **Rationale**: Research shows AI agents succeed on 60-70% of typical development subtasks but fail on 30-40% involving multi-file changes and architectural decisions, primarily due to context window degradation. Multi-phase execution with isolated contexts addresses this limitation.
- **Source**: `design/alfred/00-context/01-business-context.md` (Business Goals, lines 51-62)

---

#### FR-003: Task Management System Integration

- **Requirement**: The system SHALL support integration with multiple task management systems (Jira, Linear, GitHub Issues).
- **Priority**: High
  - Essential for real-world developer workflows
- **Acceptance Criteria**:
  - [ ] System can fetch tasks from Jira
  - [ ] System can fetch tasks from Linear
  - [ ] System can fetch tasks from GitHub Issues
  - [ ] System can update task status in integrated systems
  - [ ] System uses task details to build workflow context
- **Rationale**: Real-world development workflows are organized around tasks in systems like Jira and Linear. Integration enables task-aware context building and automated task lifecycle management.
- **Source**: `design/alfred/00-context/01-business-context.md` (Differentiation, lines 547-550)

---

#### FR-004: Workflow-as-Code with Declarative Definitions

- **Requirement**: The system SHALL provide workflow-as-code capability with declarative workflow definitions.
- **Priority**: Critical
  - Core mechanism for defining and executing workflows
- **Acceptance Criteria**:
  - [ ] Workflows can be defined in version-controllable format
  - [ ] Workflow definitions support sequential execution
  - [ ] Workflow definitions support parallel execution
  - [ ] Workflow definitions support dependencies between steps
  - [ ] Workflow syntax is declarative (what, not how)
- **Rationale**: Teams need standardized, repeatable workflows that can be version-controlled and shared. Declarative definitions enable this standardization similar to how GitHub Actions standardized CI/CD workflows.
- **Source**: `design/alfred/00-context/01-business-context.md` (Differentiation, lines 537-541; Workflow Customization, lines 173-197)

---

#### FR-005: Reusable and Shareable Workflow Templates

- **Requirement**: The system SHALL support reusable and shareable workflow templates.
- **Priority**: High
  - Enables community ecosystem and team standardization
- **Acceptance Criteria**:
  - [ ] Workflows can be exported as templates
  - [ ] Workflows can be imported from templates
  - [ ] Templates can be shared across teams
  - [ ] Templates can be versioned
  - [ ] Template format is standardized
- **Rationale**: Teams will standardize development workflows similar to CI/CD standardization. An ecosystem of reusable workflows will emerge if sharing is easy and templates are standardized.
- **Source**: `design/alfred/00-context/01-business-context.md` (Workflow Standardization, lines 341-352; Workflow Sharing, lines 426-435)

---

### 4.2 Multi-Provider Support

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### FR-006: Multiple AI Provider Support

- **Requirement**: The system SHALL support multiple AI providers with minimum support for Claude, GPT/Codex, and Gemini.
- **Priority**: Critical
  - Core differentiator and cost optimization capability
- **Acceptance Criteria**:
  - [ ] System supports Claude provider
  - [ ] System supports GPT/Codex provider
  - [ ] System supports Gemini provider
  - [ ] System provides provider abstraction layer
  - [ ] Users can configure provider preferences
  - [ ] Users provide their own API keys
- **Rationale**: 59% of developers use 3+ AI tools in parallel, leveraging different models for different tasks. No vendor lock-in constraint requires multi-provider support. Different models excel at different tasks (planning, implementation, validation).
- **Source**: `design/alfred/00-context/01-business-context.md` (Multi-Provider Problem, lines 93-102; Constraints, lines 237-246; Differentiation, lines 542-546)

---

#### FR-007: Task-Based Provider Routing

- **Requirement**: The system SHALL route tasks to optimal AI models based on task characteristics.
- **Priority**: High
  - Enables quality optimization and model specialization
- **Acceptance Criteria**:
  - [ ] System can route planning tasks to specified provider
  - [ ] System can route implementation tasks to specified provider
  - [ ] System can route validation tasks to specified provider
  - [ ] Routing decisions are configurable per workflow
  - [ ] Routing decisions respect user preferences
- **Rationale**: Different AI models have task-specific strengths. Developers actively choose models based on capabilities: ChatGPT for reasoning, Copilot for inline code, Claude for long context, Cursor for editing. Task-based routing optimizes for quality.
- **Source**: `design/alfred/00-context/01-business-context.md` (Multi-Provider Problem, lines 93-102; Model Specialization, lines 382-397)

---

#### FR-008: Cost Optimization Through Provider Routing

- **Requirement**: The system SHALL provide cost optimization through provider routing.
- **Priority**: Medium
  - Important value proposition but not critical for MVP
- **Acceptance Criteria**:
  - [ ] System tracks cost per provider
  - [ ] System suggests cost-optimal provider for task types
  - [ ] System reports cost savings achieved
  - [ ] Users can override cost-based routing
- **Rationale**: Different AI models have significantly different costs (Gemini is 7x cheaper than Claude Opus). Intelligent routing to cheaper models for appropriate tasks (e.g., validation) can achieve 50%+ cost savings.
- **Source**: `design/alfred/00-context/01-business-context.md` (Multi-Provider Problem, lines 93-102; Success Criteria, lines 450-456)

---

### 4.3 Workflow Execution Modes

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### FR-009: Interactive Mode with Real-Time Progress

- **Requirement**: The system SHALL support interactive mode with real-time progress visualization.
- **Priority**: Critical
  - Primary user experience for developers
- **Acceptance Criteria**:
  - [ ] User can select task from UI
  - [ ] System displays real-time execution progress
  - [ ] System shows current phase and step
  - [ ] System displays outputs as they complete
  - [ ] UI updates without blocking execution
- **Rationale**: Developers need visibility into long-running workflows to understand progress, identify issues, and maintain confidence in the system.
- **Source**: `design/alfred/00-context/01-business-context.md` (Execution Modes, lines 201-206)

---

#### FR-010: Headless Mode for CI/CD Integration

- **Requirement**: The system SHALL support headless mode for CI/CD integration with stdout logging.
- **Priority**: High
  - Essential for automated pipelines and non-interactive environments
- **Acceptance Criteria**:
  - [ ] System can execute via CLI command
  - [ ] System logs progress to stdout
  - [ ] System requires no user interaction
  - [ ] System returns appropriate exit codes
  - [ ] System output is machine-parseable
- **Rationale**: CI/CD integration requires non-interactive execution. Headless mode enables automated pipelines and integration with existing development infrastructure.
- **Source**: `design/alfred/00-context/01-business-context.md` (Execution Modes, lines 208-212)

---

#### FR-011: Human-in-Loop Approvals

- **Requirement**: The system SHALL support optional human-in-loop approvals for critical decisions.
- **Priority**: Medium
  - Important for risk mitigation but not critical for MVP
- **Acceptance Criteria**:
  - [ ] Workflows can define approval points
  - [ ] System pauses at approval points
  - [ ] System presents decision context to user
  - [ ] User can approve or reject
  - [ ] Rejection triggers configurable fallback behavior
- **Rationale**: Some decisions (merges, deployments, architectural changes) may require human approval. Optional human-in-loop provides safety valve without sacrificing automation benefits.
- **Source**: `design/alfred/00-context/01-business-context.md` (Execution Modes, lines 201-206)

---

### 4.4 Workflow Execution Capabilities

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### FR-012: Sequential Phase Execution

- **Requirement**: The system SHALL support sequential execution of workflow phases.
- **Priority**: Critical
  - Fundamental workflow execution capability
- **Acceptance Criteria**:
  - [ ] Phases execute in defined order
  - [ ] Each phase waits for previous phase to complete
  - [ ] Phase outputs are available to subsequent phases
  - [ ] Execution stops on phase failure
- **Rationale**: Many workflows have natural sequential dependencies (plan before implement, implement before test). Sequential execution is the simplest and most common execution pattern.
- **Source**: `design/alfred/00-context/01-business-context.md` (Use Case 1 SDLC Workflow, lines 126-138)

---

#### FR-013: Parallel Phase Execution

- **Requirement**: The system SHALL support parallel execution of workflow phases.
- **Priority**: High
  - Important performance optimization
- **Acceptance Criteria**:
  - [ ] Independent phases can execute concurrently
  - [ ] Parallel execution is declared in workflow definition
  - [ ] System waits for all parallel phases to complete
  - [ ] Any parallel phase failure fails the entire parallel block
  - [ ] Parallel phases cannot depend on each other
- **Rationale**: Independent tasks (frontend + backend implementation, multiple test suites) can execute in parallel for faster completion. Example shows parallel execution in quality checks phase.
- **Source**: `design/alfred/00-context/01-business-context.md` (Workflow Customization, lines 190-197)

---

#### FR-014: Step Dependencies

- **Requirement**: The system SHALL support dependencies between workflow steps.
- **Priority**: Critical
  - Essential for context passing and conditional execution
- **Acceptance Criteria**:
  - [ ] Steps can declare dependencies on previous steps
  - [ ] Dependent step waits for dependency to complete
  - [ ] Dependent step receives dependency output in context
  - [ ] Dependency failures prevent dependent step execution
- **Rationale**: Steps often need outputs from previous steps (implementation needs plan, commit needs test results). Dependencies enable explicit context passing and prevent execution of steps with unmet prerequisites.
- **Source**: `design/alfred/00-context/01-business-context.md` (Use Case 1 SDLC Workflow phases show dependencies, lines 131-138)

---

#### FR-015: Customizable Workflow Composition

- **Requirement**: The system SHALL support customizable workflows with phase and command composition.
- **Priority**: Critical
  - Core extensibility requirement
- **Acceptance Criteria**:
  - [ ] Users can define custom workflows
  - [ ] Workflows are composed of phases
  - [ ] Phases are composed of commands
  - [ ] Commands can specify AI provider
  - [ ] Workflows can be modified and versioned
- **Rationale**: Teams have unique workflows and need extensibility. Workflow customization is a key insight: Workflow = Phases (sequential/parallel), Phase = Commands (AI tasks), Command = Prompt + Provider.
- **Source**: `design/alfred/00-context/01-business-context.md` (Workflow Customization, lines 173-197)

---

### 4.5 Session and Context Management

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### FR-016: Isolated Command Contexts

- **Requirement**: The system SHALL execute each command in isolated contexts to prevent context degradation.
- **Priority**: Critical
  - Core solution to context window problem
- **Acceptance Criteria**:
  - [ ] Each command starts with fresh context
  - [ ] Commands do not inherit accumulated context from previous commands
  - [ ] Command execution failures are isolated
  - [ ] Context isolation is transparent to users
- **Rationale**: Research finding shows AI coding agents suffer from "context rot" - as sessions grow longer and context accumulates, output quality degrades. Models lose focus and produce brittle solutions. Isolated contexts solve this by starting each command fresh.
- **Source**: `design/alfred/00-context/01-business-context.md` (Context Window Problem, lines 67-75; Differentiation, lines 552-556)

---

#### FR-017: Explicit Context Passing Between Phases

- **Requirement**: The system SHALL support explicit context passing between workflow phases.
- **Priority**: Critical
  - Essential for multi-phase workflows with dependencies
- **Acceptance Criteria**:
  - [ ] Phases can declare context dependencies
  - [ ] Context is passed explicitly, not implicitly
  - [ ] Passed context is limited to declared dependencies
  - [ ] Context passing mechanism is observable
- **Rationale**: While contexts must be isolated to prevent degradation, phases need outputs from previous phases (implementation needs plan). Explicit context passing provides necessary information flow while maintaining isolation benefits.
- **Source**: `design/alfred/00-context/01-business-context.md` (Differentiation, lines 552-556)

---

#### FR-018: Multi-Turn Conversation Session Tracking

- **Requirement**: The system SHALL maintain session history for multi-turn conversations.
- **Priority**: Medium
  - Important for complex commands requiring iteration
- **Acceptance Criteria**:
  - [ ] System tracks conversation sessions
  - [ ] Commands can resume previous sessions
  - [ ] Session history is persisted
  - [ ] Sessions can be viewed and inspected
- **Rationale**: Some commands may require multi-turn conversations with AI (e.g., iterative refinement, debugging). Session tracking enables these interactions while maintaining isolation between different commands.
- **Source**: `design/alfred/00-context/01-business-context.md` (implied by multi-phase execution requirement and workflow composition)

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### NFR-PERF-001: Workflow Orchestration Overhead

- **Category**: Performance
- **Requirement**: The system SHALL complete workflow orchestration overhead in less than 1 minute compared to direct AI usage.
- **Metric**: Orchestration overhead (time spent on workflow management, not AI execution) < 1 minute per workflow
- **Verification**: Measure total workflow time minus sum of AI execution times for all commands
- **Priority**: High
- **Rationale**: Orchestration should add minimal overhead. If overhead is significant, users will prefer manual orchestration. 1 minute is acceptable for workflows that save hours of manual work.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 450-451)

---

#### NFR-PERF-002: Feature Completion Speed

- **Category**: Performance
- **Requirement**: The system SHALL achieve 3x faster complex feature completion versus manual orchestration.
- **Metric**: Average time to complete complex feature with FlowMaster is ≤ 33% of manual orchestration time
- **Verification**: Compare completion times for benchmark complex features with FlowMaster vs manual orchestration
- **Priority**: High
- **Rationale**: Key value proposition is faster feature delivery. 3x improvement justifies adoption effort and workflow learning curve.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 455)

---

#### NFR-PERF-003: Cost Savings Through Provider Routing

- **Category**: Performance
- **Requirement**: The system SHALL achieve 50%+ cost savings via optimal provider routing.
- **Metric**: Total AI provider costs with routing ≤ 50% of costs with single-provider approach
- **Verification**: Track and compare costs across providers for equivalent workloads
- **Priority**: Medium
- **Rationale**: Different providers have significantly different pricing (Gemini 7x cheaper than Claude Opus). Intelligent routing to cheaper models for appropriate tasks provides measurable cost benefits.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 456)

---

#### NFR-PERF-004: Minimum System RAM

- **Category**: Performance
- **Requirement**: The system SHALL operate on machines with minimum 8GB RAM.
- **Metric**: System functions correctly with 8GB RAM
- **Verification**: Test on 8GB RAM machines
- **Priority**: Medium
- **Rationale**: Ensures accessibility to wide range of developers. 8GB is conservative baseline for modern development machines (most have 16GB+).
- **Source**: `design/alfred/00-context/01-business-context.md` (Technical Assumptions, lines 398-408)

---

#### NFR-PERF-005: Workflow State Storage

- **Category**: Performance
- **Requirement**: The system SHALL use less than 1GB disk space for typical workflow state storage.
- **Metric**: Disk space for .flowmaster/ directory < 1GB for typical usage patterns
- **Verification**: Monitor disk usage across variety of workflows
- **Priority**: Low
- **Rationale**: State storage should be negligible. 1GB is well within typical developer machine capacity and conservative estimate.
- **Source**: `design/alfred/00-context/01-business-context.md` (Technical Assumptions, lines 398-408)

---

#### NFR-PERF-006: Network Connectivity Requirement

- **Category**: Performance
- **Requirement**: The system SHALL require reliable internet connectivity for AI provider calls.
- **Metric**: System detects and handles network failures gracefully
- **Verification**: Test with intermittent connectivity
- **Priority**: Medium
- **Rationale**: AI provider APIs require network access. System must handle network issues gracefully but internet connectivity is standard for professional development environments.
- **Source**: `design/alfred/00-context/01-business-context.md` (Technical Assumptions, lines 398-408)

---

### 5.2 Reliability Requirements

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### NFR-REL-001: Workflow Success Rate

- **Category**: Reliability
- **Requirement**: The system SHALL achieve 90%+ workflow success rate for standard SDLC workflows.
- **Metric**: (Successful workflow completions / Total workflow attempts) ≥ 0.90 for standard workflows
- **Verification**: Track workflow outcomes across users
- **Priority**: Critical
- **Rationale**: System must be reliable enough for production use. 90% success rate provides acceptable reliability while accounting for AI model limitations and edge cases. Below 90%, users will lose confidence.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 449)

---

#### NFR-REL-002: Crash Rate

- **Category**: Reliability
- **Requirement**: The system SHALL maintain less than 5% crash rate (failures due to FlowMaster bugs, not AI errors).
- **Metric**: (FlowMaster crashes / Total workflow attempts) < 0.05
- **Verification**: Distinguish FlowMaster bugs from AI errors in failure analysis
- **Priority**: Critical
- **Rationale**: Workflow failures due to AI limitations are expected, but FlowMaster itself must be stable. 5% crash rate ensures system bugs are rare and don't undermine user confidence.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 450)

---

### 5.3 Efficiency Requirements

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### NFR-EFF-001: Developer Orchestration Time Reduction

- **Category**: Efficiency
- **Requirement**: The system SHALL reduce developer orchestration time by 70%+.
- **Metric**: (Manual orchestration time - FlowMaster orchestration time) / Manual orchestration time ≥ 0.70
- **Verification**: Time studies comparing manual vs automated orchestration
- **Priority**: Critical
- **Rationale**: Core value proposition is eliminating manual orchestration overhead. 70% reduction represents significant time savings that justify adoption. Lower reduction would not sufficiently differentiate from manual approaches.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 454)

---

### 5.4 Adoption and Growth (Success Criteria)

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### NFR-ADOPT-001: GitHub Stars Adoption Metric

- **Category**: Adoption
- **Requirement**: The system SHALL achieve adoption target of 10,000 GitHub stars within 6 months.
- **Metric**: GitHub stars ≥ 10,000 at 6 months post-launch
- **Verification**: Monitor GitHub stars count
- **Priority**: Medium
- **Rationale**: GitHub stars indicate community interest and adoption. 10,000 stars within 6 months indicates strong product-market fit. Below 1,000 stars would indicate critical failure.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 444; Failure Indicators, lines 482)

---

#### NFR-ADOPT-002: Active User Base

- **Category**: Adoption
- **Requirement**: The system SHALL achieve 1,000 active users with monthly workflow executions.
- **Metric**: Monthly active users (users who executed workflows in past 30 days) ≥ 1,000
- **Verification**: Track workflow executions with opt-in telemetry
- **Priority**: Medium
- **Rationale**: Active usage is more valuable than passive interest. 1,000 monthly active users indicates the tool provides ongoing value, not just initial curiosity.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 445)

---

#### NFR-ADOPT-003: Community-Contributed Workflows

- **Category**: Adoption
- **Requirement**: The system SHALL enable 100 community-contributed workflows within 1 year.
- **Metric**: Unique community-contributed workflow templates ≥ 100 at 1 year
- **Verification**: Track workflow template contributions
- **Priority**: Low
- **Rationale**: Community workflow contributions indicate ecosystem health and extensibility success. 100 workflows within 1 year shows community engagement similar to GitHub Actions marketplace growth.
- **Source**: `design/alfred/00-context/01-business-context.md` (Success Criteria, lines 446)

---

## 6. Business Constraints

### 6.1 Organizational Constraints

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### BC-001: Open Source MIT License

- **Type**: Policy
- **Constraint**: The system SHALL be distributed under MIT open source license.
- **Impact**: Code must be publicly available. Community-driven development model. No proprietary features.
- **Source**: Open source model requirement
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 237-241)

---

#### BC-002: No Vendor Lock-In

- **Type**: Policy
- **Constraint**: The system SHALL not create vendor lock-in with any AI provider.
- **Impact**: Must support multiple AI providers (Claude, Codex, Gemini minimum). Provider abstraction layer required. Users choose providers based on preferences.
- **Source**: Strategic requirement for market positioning
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 243-246)

---

#### BC-003: Developer Target Audience

- **Type**: Policy
- **Constraint**: The system SHALL target developers comfortable with YAML, CLI, and Git.
- **Impact**: Not building for non-technical users. Can assume technical comfort with command-line tools and version control.
- **Source**: Target user definition
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 248-250)

---

### 6.2 Financial Constraints

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### BC-004: Zero Cloud Infrastructure

- **Type**: Budget
- **Constraint**: The system SHALL not require cloud infrastructure or hosted services.
- **Impact**: All execution happens locally. No server-side components. No infrastructure costs to manage.
- **Source**: Financial model constraint
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 256-259)

---

#### BC-005: Direct Provider Payment Model

- **Type**: Budget
- **Constraint**: Users SHALL pay AI providers directly, not through FlowMaster.
- **Impact**: No payment processing. No revenue from API usage. Users bring their own API keys.
- **Source**: Financial model constraint
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 256-259)

---

#### BC-006: Free for All Users

- **Type**: Budget
- **Constraint**: The system SHALL be free for all users with no paid tiers or freemium model.
- **Impact**: No licensing revenue. Revenue (if any) from services/support only.
- **Source**: Financial model constraint
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 261-264)

---

### 6.3 Technical Constraints

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### BC-007: Local-First Execution

- **Type**: Policy
- **Constraint**: The system SHALL run on developer's local machine.
- **Impact**: No cloud deployment. Must work offline except for AI provider calls. Workflows stored locally.
- **Source**: Architecture requirement
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 270-273)

---

#### BC-008: No Cloud Dependencies

- **Type**: Policy
- **Constraint**: The system SHALL not depend on cloud services except AI provider APIs.
- **Impact**: Cannot use cloud storage, databases, or other SaaS services. All functionality must work locally.
- **Source**: Architecture requirement
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 270-273)

---

#### BC-009: Platform Support Requirements

- **Type**: Policy
- **Constraint**: The system SHALL support macOS and Linux (Windows via Electron as future enhancement).
- **Impact**: Must test on macOS and Linux. Cross-platform compatibility required. Windows support deferred.
- **Source**: Platform requirement
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 280-283)

---

#### BC-010: Node.js Version Requirement

- **Type**: Policy
- **Constraint**: The system SHALL require Node.js >= 18 (latest LTS).
- **Impact**: Can use Node.js 18+ features. Must document version requirement. No support for older Node.js versions.
- **Source**: Runtime requirement
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 285-287)

---

#### BC-011: ES Modules Only

- **Type**: Policy
- **Constraint**: The system SHALL use ES Modules only.
- **Impact**: No CommonJS. All imports use ES Module syntax. Dependencies must support ES Modules.
- **Source**: Module system requirement
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 285-287)

---

### 6.4 Timeline Constraints

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### BC-012: MVP Timeline - 3 Months

- **Type**: Timeline
- **Constraint**: The system SHALL reach MVP (basic workflow execution) within 3 months using AI-driven development.
- **Impact**: Aggressive timeline assumes AI agents as primary implementers with human oversight. Traditional human development timeline assumptions do not apply.
- **Source**: Project timeline
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 293-295)

---

#### BC-013: Multi-Provider Timeline - 6 Months

- **Type**: Timeline
- **Constraint**: The system SHALL support multiple providers (Claude, Codex, Gemini) within 6 months.
- **Impact**: Multi-provider architecture must be designed upfront even if MVP uses single provider.
- **Source**: Project timeline
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 297-298)

---

#### BC-014: v1.0 Timeline - 12 Months

- **Type**: Timeline
- **Constraint**: The system SHALL reach v1.0 release within 12 months.
- **Impact**: Feature scope must be realistic for 12-month timeline. Focus on core capabilities over nice-to-have features.
- **Source**: Project timeline
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 300-301)

---

### 6.5 Regulatory and Legal Constraints

<!-- Requirements extracted from: design/alfred/00-context/01-business-context.md -->

#### BC-015: AI Provider Terms of Service Compliance

- **Type**: Legal
- **Constraint**: The system SHALL respect Claude, OpenAI, and Google API terms of service.
- **Impact**: Must implement rate limiting. Must not abuse APIs. Must follow usage guidelines.
- **Source**: Provider API agreements
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 307-310)

---

#### BC-016: Provider Rate Limiting

- **Type**: Legal
- **Constraint**: The system SHALL implement proper retry logic and respect provider rate limits.
- **Impact**: Must handle rate limit errors gracefully. Must implement exponential backoff. Must not overwhelm provider APIs.
- **Source**: Provider API agreements
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 307-310; Business Risks, lines 501)

---

#### BC-017: Provider Attribution

- **Type**: Legal
- **Constraint**: The system SHALL provide proper attribution to AI providers.
- **Impact**: Must credit AI providers in outputs where appropriate. Must not misrepresent source of AI-generated content.
- **Source**: Provider API agreements
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 307-310)

---

#### BC-018: Privacy-First - No Data Collection

- **Type**: Regulatory
- **Constraint**: The system SHALL not collect user code or data.
- **Impact**: No telemetry without explicit opt-in. No uploading code to FlowMaster servers (there are none). User data stays on local machine.
- **Source**: Privacy policy
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 312-316)

---

#### BC-019: Telemetry Opt-In Required

- **Type**: Regulatory
- **Constraint**: The system SHALL require explicit opt-in for any telemetry.
- **Impact**: Telemetry disabled by default. Must obtain explicit user consent. Must clearly explain what data is collected.
- **Source**: Privacy policy
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 312-316)

---

#### BC-020: Local Execution Only

- **Type**: Regulatory
- **Constraint**: The system SHALL execute all operations locally.
- **Impact**: No remote execution. No cloud processing. All workflow state on user machine.
- **Source**: Privacy policy
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 312-316)

---

#### BC-021: MIT License Dependency Compatibility

- **Type**: Legal
- **Constraint**: The system SHALL maintain MIT license compatibility with all dependencies.
- **Impact**: Must audit dependency licenses. Cannot use incompatible licenses (e.g., GPL without exception).
- **Source**: Open source compliance
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 318-320)

---

#### BC-022: No GPL Contamination

- **Type**: Legal
- **Constraint**: The system SHALL avoid GPL-licensed dependencies.
- **Impact**: Must use MIT, Apache, BSD, or other permissive licenses. Cannot link GPL libraries without exception.
- **Source**: Open source compliance
- **Extracted From**: `design/alfred/00-context/01-business-context.md` (Constraints, lines 318-320)

---

### 4.6 Workflow Orchestration Core

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### FR-019: Workflow Definition Loading from Version Control

- **Requirement**: The system SHALL load workflow definitions from version-controllable configuration files.
- **Priority**: Critical
  - Workflows must be stored in a format that supports version control and collaboration
- **Acceptance Criteria**:
  - [ ] System can load workflow definitions from files
  - [ ] Workflow format supports version control systems
  - [ ] Workflow format is human-readable
  - [ ] System can discover workflows in configured directories
- **Rationale**: Workflows must be stored in a format that supports version control and collaboration, enabling teams to track changes and share workflow definitions.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 34-37)

---

#### FR-020: Workflow Schema Validation

- **Requirement**: The system SHALL validate workflow definitions against a schema before execution.
- **Priority**: Critical
  - Prevents runtime errors from malformed workflow definitions
- **Acceptance Criteria**:
  - [ ] System validates workflow syntax before execution
  - [ ] Validation errors include clear messages with file locations
  - [ ] Invalid workflows are rejected before execution starts
  - [ ] Validation catches common definition errors
- **Rationale**: Early validation prevents runtime errors from malformed workflow definitions and provides clear feedback to users.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 34-37, 267-272)

---

#### FR-021: Circular Dependency Detection

- **Requirement**: The system SHALL detect and reject circular dependencies in workflow phase dependencies.
- **Priority**: Critical
  - Circular dependencies would cause infinite loops and system failure
- **Acceptance Criteria**:
  - [ ] System builds dependency graph from workflow definition
  - [ ] System detects circular dependencies before execution
  - [ ] Error message includes the dependency cycle path
  - [ ] Workflows with cycles are rejected
- **Rationale**: Circular dependencies would cause infinite loops and system failure. Detection before execution prevents this failure mode.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 36, 237-263)

---

#### FR-022: Phase Dependency Validation

- **Requirement**: The system SHALL verify that phase dependency references point to valid phases before execution.
- **Priority**: Critical
  - Missing dependencies would cause runtime failures
- **Acceptance Criteria**:
  - [ ] System validates all dependency references exist
  - [ ] Error message identifies missing dependencies
  - [ ] Workflows with invalid dependencies are rejected
  - [ ] Validation occurs before workflow execution begins
- **Rationale**: Missing dependencies would cause runtime failures. Validation ensures all references are valid before execution.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 37, 228-235)

---

#### FR-025: Phase Dependency Context Passing

- **Requirement**: The system SHALL pass outputs from dependency phases to dependent phases as context.
- **Priority**: High
  - Dependent phases need access to data from their dependencies
- **Acceptance Criteria**:
  - [ ] Dependent phase receives output from dependency phase
  - [ ] Context passing uses dependency name as reference
  - [ ] Missing dependency outputs cause execution failure
  - [ ] Context format is consistent across phases
- **Rationale**: Dependent phases need access to data from their dependencies to perform their work.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1449-1460)

---

#### FR-026: Workflow Checkpoint Approval

- **Requirement**: The system SHALL support pausing workflow execution at designated checkpoints for user approval.
- **Priority**: High
  - Enables human review and approval before critical operations
- **Acceptance Criteria**:
  - [ ] Workflows can define checkpoint phases
  - [ ] System pauses execution at checkpoints
  - [ ] System waits for user approval or rejection
  - [ ] System continues on approval
  - [ ] System cancels on rejection
- **Rationale**: Enables human review and approval before critical operations such as deployments or architectural changes.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1515-1551)

---

#### FR-027: Checkpoint Resume on Approval

- **Requirement**: The system SHALL resume workflow execution from paused state upon user approval.
- **Priority**: High
  - Allows workflows to continue after checkpoint approval
- **Acceptance Criteria**:
  - [ ] System continues workflow from checkpoint after approval
  - [ ] Subsequent phases execute normally
  - [ ] Workflow state is maintained across pause/resume
- **Rationale**: Allows workflows to continue after checkpoint approval, completing the human-in-loop approval process.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1536-1550)

---

#### FR-028: Checkpoint Cancellation on Rejection

- **Requirement**: The system SHALL cancel workflow execution if checkpoint approval is rejected.
- **Priority**: High
  - Prevents unwanted operations from executing
- **Acceptance Criteria**:
  - [ ] System stops workflow execution on rejection
  - [ ] Workflow state is marked as cancelled/failed
  - [ ] Subsequent phases do not execute
  - [ ] Cancellation reason is recorded
- **Rationale**: Prevents unwanted operations from executing when user rejects checkpoint approval.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1547-1550)

---

#### FR-030: Dynamic Workflow Triggering

- **Requirement**: The system SHALL dynamically invoke additional workflows based on phase output conditions.
- **Priority**: Medium
  - Enables adaptive workflows that respond to runtime results
- **Acceptance Criteria**:
  - [ ] Phases can define trigger conditions based on outputs
  - [ ] System evaluates trigger conditions after phase completion
  - [ ] System invokes specified workflow when condition is true
  - [ ] Triggered workflow completes before main workflow continues
- **Rationale**: Enables adaptive workflows that respond to runtime results, such as triggering refactoring when code review identifies issues.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1554-1607)

---

#### FR-031: Fallback Workflow Execution on Failure

- **Requirement**: The system SHALL execute fallback recovery workflows when phases fail.
- **Priority**: Medium
  - Enables automated recovery from failures
- **Acceptance Criteria**:
  - [ ] Phases can specify fallback workflows
  - [ ] System executes fallback when phase fails
  - [ ] Fallback completes before retry or failure
  - [ ] Context from failed phase is available to fallback
- **Rationale**: Enables automated recovery from failures, such as executing rollback procedures when deployments fail.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1611-1638)

---

#### FR-032: Per-Phase Configuration Override

- **Requirement**: The system SHALL allow workflow definitions to override default configuration per phase.
- **Priority**: Medium
  - Different phases may require different execution parameters
- **Acceptance Criteria**:
  - [ ] Phases can override model selection
  - [ ] Phases can override provider selection
  - [ ] Phases can override timeout values
  - [ ] Phases can override retry counts
  - [ ] Phase-level config takes precedence over defaults
- **Rationale**: Different phases may require different execution parameters. Planning may use faster models while implementation uses more capable models.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1641-1678)

---

#### FR-033: Condition Expression Evaluation

- **Requirement**: The system SHALL evaluate condition expressions to determine phase execution.
- **Priority**: High
  - Conditional execution requires expression evaluation
- **Acceptance Criteria**:
  - [ ] System can parse condition expressions
  - [ ] System evaluates expressions to boolean results
  - [ ] Evaluation errors provide clear error messages
  - [ ] Expression syntax supports common operators
- **Rationale**: Conditional execution requires the ability to evaluate expressions and make execution decisions based on results.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1361-1365, 1067-1152)

---

#### FR-036: Logical Operators in Condition Expressions

- **Requirement**: The system SHALL support logical operators (AND, OR, NOT) in condition expressions.
- **Priority**: High
  - Complex conditions require logical operations
- **Acceptance Criteria**:
  - [ ] Expressions support AND operator (&&)
  - [ ] Expressions support OR operator (||)
  - [ ] Expressions support NOT operator (!)
  - [ ] Operator precedence is correct
- **Rationale**: Complex conditions require AND, OR, NOT operations such as checking if both tests passed AND build succeeded.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1372-1373)

---

#### FR-038: Conditional Phase Skipping

- **Requirement**: The system SHALL skip phases when their conditional expressions evaluate to false.
- **Priority**: High
  - Conditional phases should not execute when conditions are not met
- **Acceptance Criteria**:
  - [ ] System evaluates phase condition before execution
  - [ ] Phase is skipped when condition is false
  - [ ] Skipped phases are reported in workflow status
  - [ ] Workflow continues to next phase after skip
- **Rationale**: Conditional phases should not execute when conditions are not met, such as skipping design phase for simple features.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1363-1365)

---

#### FR-039: Workflow Composition from Multiple Definitions

- **Requirement**: The system SHALL compose workflows from multiple workflow definitions.
- **Priority**: Medium
  - Enables reusability and modular workflow design
- **Acceptance Criteria**:
  - [ ] Workflows can reference other workflow definitions
  - [ ] Composed workflows execute as single unit
  - [ ] Context passes between composed workflows
  - [ ] Composition supports conditional branching
- **Rationale**: Enables reusability and modular workflow design, allowing teams to build complex workflows from simpler building blocks.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2594-2599, 2760-2793)

---

#### FR-040: Sub-Workflow Invocation

- **Requirement**: The system SHALL support sub-workflows invoked from parent workflows.
- **Priority**: Medium
  - Enables hierarchical workflow organization
- **Acceptance Criteria**:
  - [ ] Phases can invoke sub-workflows
  - [ ] Sub-workflows receive inputs from parent
  - [ ] Sub-workflow outputs are available to parent
  - [ ] Sub-workflow failures propagate to parent
- **Rationale**: Enables hierarchical workflow organization, allowing common patterns to be extracted into reusable sub-workflows.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2601-2608)

---

<!-- Requirements extracted from: design/alfred/05-workflow/pipeline-hierarchy.md -->

#### FR-147: Three-Tier Workflow Hierarchy

- **Requirement**: The system SHALL support a three-tier hierarchy of Pipeline → Workflow → Phase → Commands for workflow orchestration.
- **Priority**: High
  - Enables complex workflow organization and modular design
- **Acceptance Criteria**:
  - [ ] System supports Pipeline as top-level organizational unit
  - [ ] Pipelines contain one or more Workflows
  - [ ] Workflows contain one or more Phases
  - [ ] Phases execute Commands
  - [ ] Hierarchy is visible in monitoring and status reporting
- **Rationale**: Enables complex workflow organization where pipelines orchestrate multiple workflows, workflows orchestrate phases, and phases execute commands. This hierarchy supports modular design and reusability.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 11-14, 33-34)

---

#### FR-148: Unified Run Command with Type Detection

- **Requirement**: The system SHALL provide a unified run command that can execute commands, workflows, or pipelines with explicit flags for deterministic behavior.
- **Priority**: High
  - Provides consistent user interface across all execution types
- **Acceptance Criteria**:
  - [ ] Single run command accepts --command, --workflow, or --pipeline flags
  - [ ] Flags are mutually exclusive
  - [ ] Without flags, system auto-detects type from name
  - [ ] Clear error messages when name is ambiguous
  - [ ] Help documentation explains flag usage
- **Rationale**: A unified interface simplifies user experience while explicit flags enable deterministic behavior in scripts and automation.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 33, 179-268)

---

#### FR-149: Smart Execution Type Resolution

- **Requirement**: The system SHALL provide smart resolution that automatically detects whether a name refers to a command, workflow, or pipeline.
- **Priority**: Medium
  - Convenience feature that reduces typing for users
- **Acceptance Criteria**:
  - [ ] System searches for commands first, then workflows, then pipelines
  - [ ] Resolution order is documented
  - [ ] Ambiguous names produce clear error messages listing all matches
  - [ ] Users can override resolution with explicit flags
- **Rationale**: Smart resolution reduces typing and improves user experience by automatically detecting what the user wants to execute.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 250-266, 270-323)

---

#### FR-150: Pipeline-Level Conditional Branching

- **Requirement**: The system SHALL support conditional branching at the pipeline level based on workflow execution results.
- **Priority**: High
  - Enables dynamic workflow selection based on results
- **Acceptance Criteria**:
  - [ ] Pipelines can define on_success branches for workflows
  - [ ] Pipelines can define on_failure branches for workflows
  - [ ] Branches can specify conditions using simple expressions
  - [ ] Branch conditions have access to workflow outputs
  - [ ] Multiple conditional branches are evaluated in order
- **Rationale**: Enables dynamic workflow orchestration where subsequent workflows are selected based on results (e.g., complexity analysis determines implementation workflow).
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 78-81, 390-397)

---

#### FR-151: Workflow-Level Conditional Branching

- **Requirement**: The system SHALL allow workflows to define on_success and on_failure branches.
- **Priority**: High
  - Enables error recovery and conditional workflow paths
- **Acceptance Criteria**:
  - [ ] Workflows can define on_success branches
  - [ ] Workflows can define on_failure branches
  - [ ] Branches can execute other workflows, pipelines, or inline phases
  - [ ] Branch conditions use simple expressions
  - [ ] Branches have access to workflow context
- **Rationale**: Enables error recovery workflows and conditional workflow paths based on execution outcomes.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 91-96, 122-125)

---

#### FR-152: Cross-Workflow Context Passing

- **Requirement**: The system SHALL pass context and data between workflows within a pipeline.
- **Priority**: High
  - Workflows need to share data and coordinate
- **Acceptance Criteria**:
  - [ ] Workflows can specify input variables from pipeline context
  - [ ] Workflows can export output variables to pipeline context
  - [ ] Exported outputs are accessible to subsequent workflows
  - [ ] Context uses namespacing to avoid variable collisions
  - [ ] Context supports dot notation for nested access
- **Rationale**: Workflows within a pipeline need to share data and coordinate their work through a shared context.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 82-85, 398-402, 430-478)

---

#### FR-153: Conditional Workflow Execution

- **Requirement**: The system SHALL support conditional execution of workflows based on simple expressions.
- **Priority**: High
  - Enables selective workflow execution based on context
- **Acceptance Criteria**:
  - [ ] Workflow references can include condition expressions
  - [ ] Conditions are evaluated before workflow execution
  - [ ] Workflows are skipped when conditions evaluate to false
  - [ ] Skipped workflows are reported in pipeline status
  - [ ] Conditions have access to pipeline context
- **Rationale**: Enables selective workflow execution based on context, such as running different workflows for different complexity levels.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 86-88, 377-386)

---

#### FR-154: Dynamic Phase Expansion

- **Requirement**: The system SHALL support dynamic phase expansion based on command outputs.
- **Priority**: High
  - Enables workflows that adapt to discovered work
- **Acceptance Criteria**:
  - [ ] Phases can define expand_on_success blocks
  - [ ] Expansion iterates over arrays from command output
  - [ ] Template phases are created for each array item
  - [ ] Expanded phases are tracked as dynamically created
  - [ ] Expansion works with iteration system
- **Rationale**: Enables workflows that discover work dynamically and create phases accordingly (e.g., analyze components, then implement each discovered component).
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 126-132, 541-584)

---

#### FR-155: Phase Dependency Management

- **Requirement**: The system SHALL allow phases to specify dependencies on other phases.
- **Priority**: Critical
  - Phases often depend on outputs from previous phases
- **Acceptance Criteria**:
  - [ ] Phases can declare dependencies using needs field
  - [ ] System validates dependencies exist before execution
  - [ ] Dependent phases wait for dependencies to complete
  - [ ] Dependency outputs are passed to dependent phases
  - [ ] Circular dependencies are detected and rejected
- **Rationale**: Phases often depend on outputs from previous phases and must execute in correct order.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 133-134)

---

#### FR-156: Nested Workflow Execution

- **Requirement**: The system SHALL support nested workflow execution within phases.
- **Priority**: Medium
  - Enables hierarchical workflow organization
- **Acceptance Criteria**:
  - [ ] Phases can specify a workflow instead of a command
  - [ ] Nested workflows execute as part of parent phase
  - [ ] Nested workflow outputs are available to parent workflow
  - [ ] Nested workflow failures propagate to parent
  - [ ] Nesting depth is tracked for monitoring
- **Rationale**: Enables hierarchical workflow organization where phases can invoke complete workflows as sub-units.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 119)

---

#### FR-157: Hierarchical Execution Tracking

- **Requirement**: The system SHALL track pipeline, workflow, and phase execution hierarchically.
- **Priority**: High
  - Enables visibility into complex multi-level execution
- **Acceptance Criteria**:
  - [ ] System records pipeline execution with child workflows
  - [ ] System records workflow execution with child phases
  - [ ] System records phase execution with commands
  - [ ] Hierarchy is preserved in status queries
  - [ ] Monitoring provides hierarchical view
- **Rationale**: Complex multi-level execution requires hierarchical tracking to provide visibility and understanding.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 605-733)

---

#### FR-158: Dynamic Phase Registration

- **Requirement**: The system SHALL track dynamically injected and expanded phases in the monitoring system.
- **Priority**: High
  - Dynamic phases must be visible and tracked like static phases
- **Acceptance Criteria**:
  - [ ] System registers dynamically created phases
  - [ ] Dynamic phases include metadata about their origin
  - [ ] System tracks which phase triggered expansion
  - [ ] System emits events when phases are dynamically added
  - [ ] Dynamic phases appear in status and monitoring
- **Rationale**: Dynamically created phases must be visible and tracked to provide complete workflow visibility.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 641-713)

---

#### FR-159: Declarative Workflow Configuration

- **Requirement**: The system SHALL store workflow definitions in declarative format.
- **Priority**: Critical
  - Workflows must be maintainable and version-controllable
- **Acceptance Criteria**:
  - [ ] Workflow format is declarative (what, not how)
  - [ ] Format is human-readable
  - [ ] Format supports conditional execution without complex templating
  - [ ] Format is version-controllable
  - [ ] Format avoids complex programming constructs
- **Rationale**: Declarative format keeps workflows clean, maintainable, and accessible without requiring programming knowledge.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 36-37, 50-52, 752-891)

---

#### FR-160: Workflow Schema Validation for Hierarchy

- **Requirement**: The system SHALL validate workflow and pipeline definitions against schemas.
- **Priority**: Critical
  - Prevents errors from malformed hierarchical definitions
- **Acceptance Criteria**:
  - [ ] System validates pipeline definitions
  - [ ] System validates workflow definitions with hierarchy features
  - [ ] Validation includes semantic checks (circular references, etc.)
  - [ ] Validation provides clear error messages
  - [ ] Validation occurs before execution
- **Rationale**: Validation prevents runtime errors from malformed hierarchical workflow definitions.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 752-891)

---

#### FR-161: Backward Compatibility with Flat Workflows

- **Requirement**: The system SHALL maintain backward compatibility with existing workflows during hierarchy implementation.
- **Priority**: Critical
  - Existing workflows must continue to work
- **Acceptance Criteria**:
  - [ ] Existing flat workflows execute without modification
  - [ ] No breaking changes to existing workflow format
  - [ ] New features are opt-in via configuration
  - [ ] Legacy adapter handles old workflow format
  - [ ] Migration path is documented
- **Rationale**: Existing workflows must continue to work to avoid breaking user workflows during system evolution.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 46-48, 893-968)

---

### 4.7 State Management

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### FR-041: Workflow Execution State Tracking

- **Requirement**: The system SHALL track current execution state for each workflow.
- **Priority**: Critical
  - State tracking enables pause/resume and progress monitoring
- **Acceptance Criteria**:
  - [ ] System maintains current phase index
  - [ ] System tracks phase outputs
  - [ ] System tracks retry counts
  - [ ] System tracks iteration counters
  - [ ] State is accessible during execution
- **Rationale**: State tracking enables pause/resume functionality and progress monitoring throughout workflow execution.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1758-1788)

---

#### FR-042: Workflow Snapshot Storage for Recovery

- **Requirement**: The system SHALL store workflow snapshots to enable crash recovery.
- **Priority**: Critical
  - Snapshots enable resuming workflows after failures
- **Acceptance Criteria**:
  - [ ] System creates snapshots at key points
  - [ ] Snapshots include complete workflow state
  - [ ] Snapshots can be loaded for resumption
  - [ ] Snapshot format supports version evolution
- **Rationale**: Snapshots enable resuming workflows after process crashes or other failures, preventing loss of work.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2114-2193)

---

#### FR-043: Snapshot on Workflow Initialization

- **Requirement**: The system SHALL persist snapshots at workflow initialization.
- **Priority**: Critical
  - Initial state needed for recovery from early failures
- **Acceptance Criteria**:
  - [ ] Snapshot created before first phase executes
  - [ ] Initial snapshot includes workflow definition
  - [ ] Initial snapshot includes execution parameters
- **Rationale**: Initial state snapshot enables recovery from failures that occur during early phases.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2129-2135)

---

#### FR-044: Snapshot After Phase Completion

- **Requirement**: The system SHALL persist snapshots after each phase completion.
- **Priority**: Critical
  - Ensures resume from latest completed phase
- **Acceptance Criteria**:
  - [ ] Snapshot created after every phase completes
  - [ ] Snapshot includes phase outputs
  - [ ] Snapshot includes updated state
- **Rationale**: Persisting state after each phase ensures resume can start from the latest completed phase, minimizing rework.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2129-2135)

---

#### FR-045: Snapshot Before Checkpoints

- **Requirement**: The system SHALL persist snapshots before entering checkpoints.
- **Priority**: High
  - Enables resuming from checkpoint after interruption
- **Acceptance Criteria**:
  - [ ] Snapshot created before checkpoint wait
  - [ ] Snapshot enables resume after timeout
  - [ ] Snapshot includes checkpoint context
- **Rationale**: Enables resuming from checkpoint state after process interruption or timeout.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2129-2135)

---

#### FR-046: Snapshot on Workflow Pause

- **Requirement**: The system SHALL persist snapshots on workflow pause.
- **Priority**: High
  - Enables resuming manually paused workflows
- **Acceptance Criteria**:
  - [ ] Snapshot created when user pauses workflow
  - [ ] Pause snapshot enables clean resume
  - [ ] Pause reason is recorded
- **Rationale**: Enables resuming manually paused workflows from exact pause point.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2129-2135)

---

#### FR-047: Snapshot on Phase Error

- **Requirement**: The system SHALL persist snapshots on phase errors for recovery.
- **Priority**: Critical
  - Enables debugging and recovery from failed phases
- **Acceptance Criteria**:
  - [ ] Snapshot created when phase fails
  - [ ] Error snapshot includes error details
  - [ ] Error snapshot enables retry from failure point
- **Rationale**: Enables debugging and recovery from failed phases by preserving exact failure state.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2129-2135)

---

#### FR-048: State Restoration from Snapshots

- **Requirement**: The system SHALL restore workflow state from snapshots on resume.
- **Priority**: Critical
  - Resume operation requires loading previous state
- **Acceptance Criteria**:
  - [ ] System can load snapshots
  - [ ] Loaded state is complete and valid
  - [ ] Workflow resumes from loaded state
  - [ ] Resume is transparent to workflow logic
- **Rationale**: Resume operation requires the ability to load and restore complete workflow state from snapshots.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2153-2193)

---

#### FR-049: Phase Output Tracking

- **Requirement**: The system SHALL track phase outputs for use by dependent phases.
- **Priority**: High
  - Data flow between phases requires output storage
- **Acceptance Criteria**:
  - [ ] System stores output from each phase
  - [ ] Outputs are accessible by phase name
  - [ ] Outputs persist across workflow execution
  - [ ] Output format is consistent
- **Rationale**: Data flow between phases requires storing phase outputs for access by dependent phases.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1770-1772)

---

#### FR-051: Retry Count Tracking

- **Requirement**: The system SHALL track retry counts for failed phases.
- **Priority**: High
  - Retry logic requires counting previous attempts
- **Acceptance Criteria**:
  - [ ] System maintains retry count per phase
  - [ ] Count increments with each retry
  - [ ] Count is checked against maximum
  - [ ] Count resets after phase success
- **Rationale**: Retry logic requires tracking number of attempts to enforce retry limits and implement backoff strategies.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1774-1776)

---

#### FR-052: Error Detail Storage

- **Requirement**: The system SHALL store error details for failed phases.
- **Priority**: High
  - Debugging requires detailed error information
- **Acceptance Criteria**:
  - [ ] System stores error category
  - [ ] System stores error message
  - [ ] System stores error timestamp
  - [ ] System stores attempt number
  - [ ] Error history is accessible
- **Rationale**: Debugging workflow failures requires detailed error information including category, message, and attempt history.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2256-2297)

---

### 4.8 Error Handling and Retry Logic

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### FR-053: Automatic Phase Retry

- **Requirement**: The system SHALL automatically retry failed phases up to a configurable maximum.
- **Priority**: High
  - Transient failures should not cause workflow failure
- **Acceptance Criteria**:
  - [ ] Failed phases automatically retry
  - [ ] Maximum retry count is configurable
  - [ ] Retry count is enforced
  - [ ] Retry exhaustion causes workflow failure
- **Rationale**: Transient failures (network issues, temporary service outages) should not cause complete workflow failure. Automatic retry provides resilience.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2196-2297)

---

#### FR-054: Exponential Backoff for Retries

- **Requirement**: The system SHALL use exponential backoff delays between retry attempts.
- **Priority**: High
  - Prevents overwhelming services with rapid retries
- **Acceptance Criteria**:
  - [ ] Retry delay increases exponentially
  - [ ] First retry delay is 1 second
  - [ ] Delay multiplier is 2x
  - [ ] Maximum delay is capped
- **Rationale**: Exponential backoff prevents overwhelming services with rapid retries and gives transient issues time to resolve.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2198-2228)

---

#### FR-055: Retry Jitter

- **Requirement**: The system SHALL add random jitter to retry delays.
- **Priority**: Medium
  - Prevents thundering herd when multiple workflows retry simultaneously
- **Acceptance Criteria**:
  - [ ] Jitter is added to each retry delay
  - [ ] Jitter is random within configured range
  - [ ] Jitter prevents synchronized retries
- **Rationale**: Random jitter prevents thundering herd problem when multiple workflows fail simultaneously and retry at the same time.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2206, 2217-2218)

---

#### FR-056: Error Type Classification

- **Requirement**: The system SHALL distinguish between retryable and non-retryable errors.
- **Priority**: High
  - Some errors cannot be resolved by retrying
- **Acceptance Criteria**:
  - [ ] Errors are classified by type
  - [ ] Retryable errors trigger retry logic
  - [ ] Non-retryable errors immediately fail workflow
  - [ ] Error classification is consistent
- **Rationale**: Some errors (invalid configuration, missing dependencies) cannot be resolved by retrying. Distinguishing error types prevents wasteful retry attempts.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2230-2254)

---

#### FR-057: No Retry for Validation Errors

- **Requirement**: The system SHALL NOT retry validation errors.
- **Priority**: High
  - Invalid input will not become valid on retry
- **Acceptance Criteria**:
  - [ ] Validation errors are classified as non-retryable
  - [ ] Validation errors immediately fail workflow
  - [ ] Reason for no-retry is clear in error message
- **Rationale**: Invalid input will not become valid on retry. Validation errors indicate incorrect workflow definition or input.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2240-2244)

---

#### FR-058: No Retry for Dependency Errors

- **Requirement**: The system SHALL NOT retry dependency errors.
- **Priority**: High
  - Missing dependencies will not appear on retry
- **Acceptance Criteria**:
  - [ ] Dependency errors are classified as non-retryable
  - [ ] Dependency errors immediately fail workflow
  - [ ] Error identifies missing dependency
- **Rationale**: Missing dependencies will not appear on retry. Dependency errors indicate workflow definition problems.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2240-2244)

---

#### FR-059: Retry Execution Errors

- **Requirement**: The system SHALL retry execution errors.
- **Priority**: High
  - Command failures may be transient
- **Acceptance Criteria**:
  - [ ] Execution errors trigger retry logic
  - [ ] Retry respects maximum attempt limit
  - [ ] Retry uses exponential backoff
- **Rationale**: Command execution failures may be transient (resource constraints, temporary issues). Retry provides resilience.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2234-2253)

---

#### FR-060: Retry Timeout Errors

- **Requirement**: The system SHALL retry timeout errors.
- **Priority**: High
  - Timeouts may be due to temporary resource constraints
- **Acceptance Criteria**:
  - [ ] Timeout errors trigger retry logic
  - [ ] Retry timeout may be adjusted
  - [ ] Retry respects maximum attempt limit
- **Rationale**: Timeout errors may result from temporary resource constraints or load. Retry with backoff may succeed.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2234-2253)

---

#### FR-061: Retry Provider API Errors

- **Requirement**: The system SHALL retry provider API errors.
- **Priority**: High
  - API errors may be transient service issues
- **Acceptance Criteria**:
  - [ ] Provider errors trigger retry logic
  - [ ] Rate limit errors use longer backoff
  - [ ] Retry respects maximum attempt limit
- **Rationale**: AI provider API errors may be transient service issues (overload, maintenance). Retry with backoff provides resilience.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2234-2253)

---

#### FR-062: Retry Network Errors

- **Requirement**: The system SHALL retry network errors.
- **Priority**: High
  - Network issues are often transient
- **Acceptance Criteria**:
  - [ ] Network errors trigger retry logic
  - [ ] Connection failures are retried
  - [ ] Retry respects maximum attempt limit
- **Rationale**: Network connectivity issues are often transient (DNS resolution, connection resets). Retry provides resilience.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2234-2253)

---

#### FR-063: Error History Recording

- **Requirement**: The system SHALL store error history for each phase attempt.
- **Priority**: Medium
  - Error history aids debugging and analysis
- **Acceptance Criteria**:
  - [ ] Each error attempt is recorded
  - [ ] History includes all retry attempts
  - [ ] History is accessible for debugging
  - [ ] History persists across execution
- **Rationale**: Complete error history aids debugging by showing patterns across retry attempts and helps identify root causes.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2256-2297)

---

#### FR-064: Complete Error Context

- **Requirement**: The system SHALL include error category, message, timestamp, and attempt number in error records.
- **Priority**: Medium
  - Complete error context aids troubleshooting
- **Acceptance Criteria**:
  - [ ] Error category is recorded
  - [ ] Error message is recorded
  - [ ] Timestamp is recorded
  - [ ] Attempt number is recorded
  - [ ] Optional stack trace is recorded
- **Rationale**: Complete error context including category, message, timestamp, and attempt number aids troubleshooting and root cause analysis.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2258-2269)

---

### 4.9 Event System

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### FR-065: Workflow Start Event Emission

- **Requirement**: The system SHALL emit events for workflow start.
- **Priority**: High
  - Listeners need to know when workflows begin
- **Acceptance Criteria**:
  - [ ] Event emitted when workflow starts
  - [ ] Event includes workflow name
  - [ ] Event includes task identifier
  - [ ] Event includes phase count
- **Rationale**: Progress monitoring and UI updates require notification when workflows begin execution.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 121-126, 443-449)

---

#### FR-066: Workflow Completion Event Emission

- **Requirement**: The system SHALL emit events for workflow completion.
- **Priority**: High
  - Listeners need to know when workflows finish successfully
- **Acceptance Criteria**:
  - [ ] Event emitted when workflow completes
  - [ ] Event includes workflow name
  - [ ] Event includes execution duration
  - [ ] Event includes final outputs
- **Rationale**: Progress monitoring and UI updates require notification when workflows complete successfully.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 121-126, 451-458)

---

#### FR-067: Workflow Error Event Emission

- **Requirement**: The system SHALL emit events for workflow errors.
- **Priority**: High
  - Listeners need to know when workflows fail
- **Acceptance Criteria**:
  - [ ] Event emitted when workflow fails
  - [ ] Event includes error details
  - [ ] Event includes failure phase
  - [ ] Event includes failure reason
- **Rationale**: Error monitoring and alerting require notification when workflows fail.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 121-126, 460-465)

---

#### FR-068: Phase Start Event Emission

- **Requirement**: The system SHALL emit events for phase start.
- **Priority**: High
  - Progress monitoring requires phase-level events
- **Acceptance Criteria**:
  - [ ] Event emitted when phase starts
  - [ ] Event includes phase index
  - [ ] Event includes phase name
  - [ ] Event includes command name
- **Rationale**: Detailed progress monitoring requires notification when individual phases start execution.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 467-481)

---

#### FR-069: Phase Completion Event Emission

- **Requirement**: The system SHALL emit events for phase completion.
- **Priority**: High
  - Progress monitoring requires knowing when phases finish
- **Acceptance Criteria**:
  - [ ] Event emitted when phase completes
  - [ ] Event includes phase index
  - [ ] Event includes phase output
  - [ ] Event includes execution duration
- **Rationale**: Detailed progress monitoring requires notification when individual phases complete successfully.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1790-1803)

---

#### FR-070: Phase Failure Event Emission

- **Requirement**: The system SHALL emit events for phase failures.
- **Priority**: High
  - Error monitoring requires phase-level failure notification
- **Acceptance Criteria**:
  - [ ] Event emitted when phase fails
  - [ ] Event includes phase index
  - [ ] Event includes error details
  - [ ] Event distinguishes from retry attempts
- **Rationale**: Error monitoring requires detailed notification of phase failures including context for debugging.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1790-1803)

---

#### FR-071: Phase Skip Event Emission

- **Requirement**: The system SHALL emit events for phase skips.
- **Priority**: Medium
  - Helps understand workflow flow when conditions skip phases
- **Acceptance Criteria**:
  - [ ] Event emitted when phase is skipped
  - [ ] Event includes phase index
  - [ ] Event includes skip reason
  - [ ] Event distinguishes from failures
- **Rationale**: Understanding workflow execution requires visibility into which phases were skipped due to conditions.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1790-1803)

---

#### FR-072: Checkpoint Pause Event Emission

- **Requirement**: The system SHALL emit events for checkpoint pauses.
- **Priority**: High
  - UI needs to prompt user for checkpoint approval
- **Acceptance Criteria**:
  - [ ] Event emitted when checkpoint is reached
  - [ ] Event includes phase index
  - [ ] Event includes checkpoint context
  - [ ] Event enables UI to prompt user
- **Rationale**: Checkpoint approvals require UI notification so users can review and approve/reject.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 483-491)

---

#### FR-073: Retry Attempt Event Emission

- **Requirement**: The system SHALL emit events for retry attempts.
- **Priority**: Medium
  - Helps users understand retry behavior
- **Acceptance Criteria**:
  - [ ] Event emitted before each retry
  - [ ] Event includes phase index
  - [ ] Event includes attempt number
  - [ ] Event includes retry delay
- **Rationale**: Visibility into retry behavior helps users understand why workflows take time and builds confidence in retry logic.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1790-1803)

---

#### FR-074: Multiple Concurrent Event Listeners

- **Requirement**: The system SHALL support multiple concurrent event listeners.
- **Priority**: High
  - Different consumers (UI, logs, telemetry) need same events
- **Acceptance Criteria**:
  - [ ] Multiple listeners can subscribe to events
  - [ ] All listeners receive all events
  - [ ] Listeners do not block each other
  - [ ] Listener errors do not stop event emission
- **Rationale**: Different consumers (UI, logs, telemetry) need the same events for different purposes. Multi-listener support enables this.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2063-2073)

---

### 4.10 Context Management

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### FR-075: Phase Execution Context Building

- **Requirement**: The system SHALL build execution context for each phase.
- **Priority**: High
  - Phases need access to relevant data and configuration
- **Acceptance Criteria**:
  - [ ] Context includes files specified in phase definition
  - [ ] Context includes dependency outputs
  - [ ] Context includes environment variables
  - [ ] Context includes task metadata
  - [ ] Context is built before phase execution
- **Rationale**: Phases need access to relevant data (files, outputs, configuration) to perform their work effectively.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 59-64, 1008-1063)

---

#### FR-076: File Content Inclusion in Context

- **Requirement**: The system SHALL include file contents in phase context when specified.
- **Priority**: High
  - Phases may need to read specific files
- **Acceptance Criteria**:
  - [ ] Phase definition can list files
  - [ ] System loads file contents
  - [ ] File paths are resolved relative to workflow
  - [ ] Missing files cause errors
- **Rationale**: Phases may need to read specific configuration files, documentation, or code files to perform their work.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1035-1041, 1841-1845)

---

#### FR-077: Glob Pattern File Resolution

- **Requirement**: The system SHALL resolve glob patterns to include matching files in context.
- **Priority**: High
  - Phases may need to process multiple files matching a pattern
- **Acceptance Criteria**:
  - [ ] Phase definition can specify glob patterns
  - [ ] System expands globs to matching files
  - [ ] Glob patterns support wildcards
  - [ ] All matching files are included in context
- **Rationale**: Phases may need to process multiple files matching a pattern (e.g., all test files, all source files).
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1043-1052, 1841-1845)

---

#### FR-078: Dependency Output Inclusion in Context

- **Requirement**: The system SHALL include outputs from dependency phases in context.
- **Priority**: High
  - Dependent phases need access to their dependencies' results
- **Acceptance Criteria**:
  - [ ] Context includes outputs from declared dependencies
  - [ ] Outputs are accessible by dependency name
  - [ ] Missing dependency outputs cause errors
- **Rationale**: Dependent phases need outputs from their dependencies to perform work (e.g., implementation needs plan output).
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1025-1033, 1841-1845)

---

#### FR-079: Environment Variable Inclusion in Context

- **Requirement**: The system SHALL include environment variables in phase context.
- **Priority**: Medium
  - Phases may need access to environment configuration
- **Acceptance Criteria**:
  - [ ] Phase definition can list needed environment variables
  - [ ] System includes specified variables in context
  - [ ] Missing environment variables are handled
- **Rationale**: Phases may need access to environment-specific configuration (API endpoints, feature flags, etc).
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1020-1023, 1841-1845)

---

#### FR-080: Task Metadata Inclusion in Context

- **Requirement**: The system SHALL include task metadata in phase context.
- **Priority**: Medium
  - Phases may need task identification and tracking information
- **Acceptance Criteria**:
  - [ ] Context includes task identifier
  - [ ] Context includes task timestamp
  - [ ] Context includes workflow name
  - [ ] Metadata is consistently formatted
- **Rationale**: Phases may need task metadata for logging, tracking, or including in outputs (e.g., commit messages).
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1016-1023)

---

### 4.11 Validation

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### FR-081: Deterministic Output Validation

- **Requirement**: The system SHALL validate phase outputs using deterministic checks.
- **Priority**: High
  - Ensures phases produced expected artifacts
- **Acceptance Criteria**:
  - [ ] Validation runs after phase execution
  - [ ] Multiple validation checks can be defined
  - [ ] All checks must pass for phase success
  - [ ] Validation failures trigger retry or workflow failure
- **Rationale**: Validation ensures phases produced expected artifacts and met success criteria before proceeding.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1472-1512)

---

#### FR-084: Pattern Matching Validation

- **Requirement**: The system SHALL support pattern matching validation checks.
- **Priority**: Medium
  - Enables verifying file contents match expected patterns
- **Acceptance Criteria**:
  - [ ] Validation can check if pattern exists in file
  - [ ] Regular expressions are supported
  - [ ] Missing pattern causes validation failure
  - [ ] File not found causes validation failure
- **Rationale**: Enables verifying file contents contain expected patterns (e.g., checking for export statements, specific code patterns).
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1487-1489)

---

#### FR-085: Structured Output Schema Validation

- **Requirement**: The system SHALL validate structured outputs against schemas.
- **Priority**: High
  - Ensures structured data has correct format
- **Acceptance Criteria**:
  - [ ] Phases can define output schemas
  - [ ] System validates outputs against schemas
  - [ ] Schema validation uses standard format
  - [ ] Invalid outputs cause validation failure
- **Rationale**: When phases produce structured data (JSON), schema validation ensures correct format before dependent phases consume it.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1491-1499)

---

#### FR-086: Retry on Validation Failure

- **Requirement**: The system SHALL retry phases when validation fails.
- **Priority**: High
  - Validation failures may be recoverable
- **Acceptance Criteria**:
  - [ ] Validation failure triggers retry logic
  - [ ] Retry respects maximum attempt limit
  - [ ] Validation runs after each retry
- **Rationale**: Validation failures may be recoverable through retry (e.g., flaky tests, timing issues). Retry logic provides resilience.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1506-1512)

---

#### FR-087: Workflow Failure on Validation Exhaustion

- **Requirement**: The system SHALL fail workflows when validation exhausts retries.
- **Priority**: High
  - Persistent validation failures indicate unrecoverable problems
- **Acceptance Criteria**:
  - [ ] Workflow fails after retry exhaustion
  - [ ] Failure includes validation errors
  - [ ] Failure state is persisted
- **Rationale**: When validation repeatedly fails despite retries, workflow should fail to prevent executing subsequent phases with invalid outputs.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1506-1512)

---

### 4.12 Intelligent Orchestration

<!-- Requirements extracted from: design/alfred/05-workflow/intelligent-agents.md -->

#### FR-088: Hierarchical Agent Communication

- **Requirement**: The system SHALL support hierarchical communication between pipeline agents, workflow agents, and command actors.
- **Priority**: High
  - Enables intelligent orchestration and clarification capabilities
- **Acceptance Criteria**:
  - [ ] Commands can send clarification requests to workflow agents
  - [ ] Workflow agents can escalate questions to pipeline agents
  - [ ] Answers flow back down the hierarchy
  - [ ] Communication protocol is bidirectional
- **Rationale**: Three-tier intelligent orchestration system where commands can ask workflow agents for clarification, and workflows can escalate to pipelines for project-level decisions. This enables adaptive decision-making during execution without requiring commands to execute blindly.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 23-30, 1193-1207)

---

#### FR-089: Command Clarification Requests

- **Requirement**: The system SHALL allow commands to request clarification when encountering ambiguity.
- **Priority**: High
  - Enables commands to resolve ambiguities during execution
- **Acceptance Criteria**:
  - [ ] Commands can output structured clarification requests
  - [ ] System detects clarification request markers
  - [ ] System routes requests to appropriate parent agent
  - [ ] Commands receive answers and continue execution
- **Rationale**: Commands often encounter ambiguous requirements or need architectural decisions. Clarification requests enable commands to ask workflow coordinators for guidance rather than guessing or failing.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 67-71, 586-679)

---

#### FR-090: Workflow Agent Session Management

- **Requirement**: The system SHALL maintain long-running agent sessions for workflow agents throughout workflow execution.
- **Priority**: High
  - Workflow agents need continuity across all phases
- **Acceptance Criteria**:
  - [ ] Workflow agent session created at workflow start
  - [ ] Session persists throughout all workflow phases
  - [ ] Session accumulates context from phase outputs
  - [ ] Session can answer command questions
  - [ ] Session is cleaned up on workflow completion
- **Rationale**: Workflow agents need long-running agent sessions that maintain context throughout the entire workflow, enabling them to answer questions from commands, validate outputs with accumulated knowledge, and maintain continuity across all phases.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 374-382, 841-854)

---

#### FR-091: Pipeline Agent Session Management

- **Requirement**: The system SHALL maintain long-running agent sessions for pipeline agents throughout pipeline execution.
- **Priority**: Medium
  - Pipeline agents coordinate multiple workflows
- **Acceptance Criteria**:
  - [ ] Pipeline agent session created at pipeline start
  - [ ] Session persists throughout all workflows
  - [ ] Session maintains project-wide context
  - [ ] Session can answer workflow-level questions
  - [ ] Session is cleaned up on pipeline completion
- **Rationale**: Pipeline agents have long-running agent sessions with project-wide context (architecture, constraints, goals) that can answer high-level questions escalated from workflows, such as architectural decisions that span multiple workflows.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 290-317, 1335-1346)

---

#### FR-092: Multi-Turn Command Conversations

- **Requirement**: The system SHALL support multi-turn conversations for command execution with clarification cycles.
- **Priority**: High
  - Commands may need multiple clarification rounds
- **Acceptance Criteria**:
  - [ ] Command execution maintains conversation history
  - [ ] Commands can ask multiple questions sequentially
  - [ ] Answers are added as user messages to conversation
  - [ ] Commands continue execution after receiving answers
  - [ ] Maximum turn limit prevents infinite loops
- **Rationale**: Multi-turn conversation pattern enables natural question-answer flow where commands output clarification requests, receive answers as the next user message, and continue execution. Commands may need multiple clarifications during complex tasks.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 588-680, 859-908)

---

#### FR-093: Clarification Request Escalation

- **Requirement**: The system SHALL escalate clarification requests from workflows to pipelines when workflows cannot answer.
- **Priority**: Medium
  - Enables project-level decisions beyond workflow scope
- **Acceptance Criteria**:
  - [ ] Workflow agents can determine when to escalate
  - [ ] Escalation sends request to pipeline agent
  - [ ] Pipeline agent provides project-context answer
  - [ ] Answer routes back through workflow to command
  - [ ] Escalation reason is tracked
- **Rationale**: Workflow agents evaluate whether they have sufficient context to answer questions. Questions requiring project-level decisions (architecture patterns, technology choices affecting multiple workflows) are escalated to pipeline agents with broader context.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 87-101, 800-810, 1236-1270)

---

#### FR-094: Workflow-Integrated Output Validation

- **Requirement**: The system SHALL enable workflow agents to validate command outputs using AI investigation.
- **Priority**: High
  - Catches incomplete work before proceeding to next phase
- **Acceptance Criteria**:
  - [ ] Workflow agents can inspect created files
  - [ ] Workflow agents can compare outputs to phase requirements
  - [ ] Workflow agents can detect incomplete or incorrect work
  - [ ] Validation results trigger continue, retry, or fail decisions
  - [ ] Retry includes specific feedback about issues found
- **Rationale**: Workflow agents perform AI validation by inspecting files, comparing implementation to plans, and detecting when commands claim success but produced incomplete work. This provides intelligent validation integrated into workflow execution with specific actionable feedback for retries.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 417-492)

---

#### FR-095: Context Accumulation Across Phases

- **Requirement**: The system SHALL accumulate context in workflow agents as phases complete.
- **Priority**: High
  - Later phases need access to earlier phase results
- **Acceptance Criteria**:
  - [ ] Workflow agent receives output from each completed phase
  - [ ] Accumulated context is available when answering questions
  - [ ] Context includes all phase outputs and decisions
  - [ ] Context flows down to commands via dependencies
- **Rationale**: Workflow agents accumulate context from all command executions, enabling them to provide answers that consider previous phase results, maintain continuity across the workflow, and give context-aware guidance when commands ask questions.
- **Source**: `design/alfred/05-workflow/intelligent-agents.md` (lines 392-401, 789-810)

---

### 4.13 Conditional Execution

<!-- Requirements extracted from: design/alfred/05-workflow/features/conditionals.md -->

#### FR-096: Conditional Phase Execution with If/Else/ElseIf

- **Requirement**: The system SHALL support conditional phase execution with if, elseIf, and else branching logic.
- **Priority**: High
  - Enables workflow branching based on runtime conditions
- **Acceptance Criteria**:
  - [ ] Phases can specify 'if' conditions
  - [ ] Phases can specify 'elseIf' conditions
  - [ ] Phases can specify 'else' default execution
  - [ ] Only first matching condition executes
  - [ ] Conditional blocks can contain multiple branches
- **Rationale**: Workflows need branching control flow based on runtime data from previous commands. This enables adaptive workflows that respond to complexity assessments, build results, environment detection, and quality gates.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 3-39)

---

#### FR-097: Condition Expression Evaluation with Operators

- **Requirement**: The system SHALL evaluate condition expressions using comparison, logical, string, and array operators.
- **Priority**: High
  - Complex conditions require operator support
- **Acceptance Criteria**:
  - [ ] Supports comparison operators (==, !=, >, <, >=, <=)
  - [ ] Supports logical operators (&&, ||, !)
  - [ ] Supports string methods (includes, startsWith, endsWith)
  - [ ] Supports array methods (includes, length)
  - [ ] Supports ternary operator
- **Rationale**: Condition expressions need rich operator support to express complex branching logic such as "complexity == 'high' || estimatedHours > 40".
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 42-59)

---

#### FR-098: Previous Phase Output Access in Conditions

- **Requirement**: The system SHALL provide access to previous phase outputs in condition expressions.
- **Priority**: High
  - Conditions must reference phase results
- **Acceptance Criteria**:
  - [ ] Expressions can reference phase outputs by name
  - [ ] Conditions can reference unnamed phase outputs by command name
  - [ ] Phase outputs are accessible as objects in expressions
  - [ ] Structured outputs support property access
  - [ ] Missing outputs evaluate to undefined or cause evaluation errors (configurable)
- **Rationale**: Conditions depend on results from previous phases, such as checking if analyze.complexity == 'high' or build.success == true. Conditions may also depend on results from previous phases to make execution decisions.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 63-73); `design/alfred/05-workflow/orchestrator-core.md` (lines 1369-1383)

---

#### FR-099: Environment Variable Access in Conditions

- **Requirement**: The system SHALL provide access to environment variables in condition expressions.
- **Priority**: High
  - Conditions may depend on environment configuration and deployment environment
- **Acceptance Criteria**:
  - [ ] Expressions can reference environment variables
  - [ ] Conditions can reference env.VARIABLE_NAME
  - [ ] Environment variables are accessible via 'env' namespace
  - [ ] Environment namespace is separate from phase outputs
  - [ ] Missing environment variables are handled gracefully
- **Rationale**: Conditions may depend on environment configuration, such as checking if env.NODE_ENV == 'production' before deploying or if NODE_ENV is production before deploying.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 75-79); `design/alfred/05-workflow/orchestrator-core.md` (lines 1378-1379)

---

#### FR-100: Task Metadata Access in Conditions

- **Requirement**: The system SHALL provide access to task metadata in condition expressions.
- **Priority**: Medium
  - Conditions may depend on task state
- **Acceptance Criteria**:
  - [ ] Conditions can reference task.status
  - [ ] Conditions can reference task.iteration
  - [ ] Task metadata accessible via 'task' namespace
- **Rationale**: Conditions may check task state, such as task.status == 'in_progress' or task.iteration > 1.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 81-85)

---

#### FR-101: Workflow Context Access in Conditions

- **Requirement**: The system SHALL provide access to workflow context in condition expressions.
- **Priority**: Medium
  - Conditions may depend on workflow execution state
- **Acceptance Criteria**:
  - [ ] Conditions can reference workflow.currentPhaseIndex
  - [ ] Conditions can reference workflow.retryCount
  - [ ] Workflow context accessible via 'workflow' namespace
- **Rationale**: Conditions may check workflow execution state, such as workflow.currentPhaseIndex > 5 or workflow.retryCount == 0.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 87-91)

---

#### FR-102: Conditional Block Sequential Evaluation

- **Requirement**: The system SHALL evaluate conditional blocks sequentially with first-match-wins semantics.
- **Priority**: High
  - Predictable branching requires deterministic evaluation order
- **Acceptance Criteria**:
  - [ ] Conditions evaluated in order (if → elseIf → else)
  - [ ] First matching branch executes
  - [ ] No subsequent branches evaluated after match
  - [ ] If no match and no else, entire block skipped
- **Rationale**: Sequential evaluation with first-match-wins provides predictable branching behavior similar to traditional if/elseIf/else statements.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 136-140)

---

#### FR-103: Skipped Phase State Recording

- **Requirement**: The system SHALL record skipped phases in workflow state with skip reason.
- **Priority**: High
  - Debugging requires visibility into which phases were skipped
- **Acceptance Criteria**:
  - [ ] Skipped phases marked as 'skipped' in state
  - [ ] Skip reason recorded
  - [ ] Skipped phases visible in workflow status
  - [ ] Skipped phases don't contribute outputs
- **Rationale**: Debugging and workflow understanding require visibility into which phases were skipped due to condition evaluation.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 142-149)

---

#### FR-104: Null Values for Skipped Phase Dependencies

- **Requirement**: The system SHALL provide null values to phases that depend on skipped phases.
- **Priority**: High
  - Dependent phases must handle missing dependencies
- **Acceptance Criteria**:
  - [ ] Dependencies on skipped phases receive null
  - [ ] Null dependencies don't cause errors
  - [ ] Phases can check for null dependencies
- **Rationale**: When a phase is skipped, dependent phases need to handle the absence of that phase's output by receiving null values.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 143-148)

---

#### FR-105: Conditionals with Parallel Execution

- **Requirement**: The system SHALL support conditional execution within parallel blocks.
- **Priority**: High
  - Parallel branches may be conditionally executed
- **Acceptance Criteria**:
  - [ ] Parallel block commands can have conditions
  - [ ] Independent conditions evaluated per command
  - [ ] Skipped parallel commands don't block others
  - [ ] Parallel block completes when all non-skipped commands complete
- **Rationale**: Parallel execution may conditionally execute branches, such as running backend tests only if backend changed and frontend tests only if frontend changed.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 152-175)

---

#### FR-106: Conditionals with Iteration

- **Requirement**: The system SHALL support conditional execution within iteration blocks.
- **Priority**: High
  - Iteration steps may be conditionally executed
- **Acceptance Criteria**:
  - [ ] Iteration steps can have conditions
  - [ ] Conditions evaluated each iteration
  - [ ] Different branches may execute different iterations
  - [ ] Skipped steps don't break iteration flow
- **Rationale**: Iteration blocks may contain conditional logic, such as processing different task types with different commands based on taskType.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 177-205)

---

#### FR-107: Expression Evaluator Sandboxing

- **Requirement**: The system SHALL evaluate expressions in sandboxed environment preventing code execution and code injection.
- **Priority**: Critical
  - Security requirement to prevent malicious workflow definitions
- **Acceptance Criteria**:
  - [ ] Expression evaluation is sandboxed
  - [ ] No eval() or Function() constructor
  - [ ] No arbitrary JavaScript execution
  - [ ] Arbitrary code execution is prevented
  - [ ] File system access is blocked
  - [ ] Network access is blocked
  - [ ] Only safe expression syntax is allowed
  - [ ] Read-only evaluation only
  - [ ] Deterministic evaluation
  - [ ] Timeout protection for long expressions
- **Rationale**: Expression evaluation must be sandboxed to prevent arbitrary code execution, file system access, and network access from malicious workflow definitions. Malicious workflow definitions could exploit arbitrary code execution in conditions. Sandboxed evaluation prevents this security risk.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 296-302); `design/alfred/05-workflow/orchestrator-core.md` (lines 1147-1151)

---

#### FR-108: Expression Type Coercion

- **Requirement**: The system SHALL automatically coerce types in expressions for common comparison cases.
- **Priority**: Medium
  - Simplifies expression writing
- **Acceptance Criteria**:
  - [ ] String to number coercion for numeric comparisons
  - [ ] Truthy/falsy coercion for boolean context
  - [ ] Null/undefined handling for skipped phases
- **Rationale**: Automatic type coercion simplifies expression writing by allowing comparisons like "5" > 3 without explicit conversion.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 304-309)

---

#### FR-109: Condition Expression Syntax Validation

- **Requirement**: The system SHALL validate condition expression syntax at workflow load time.
- **Priority**: High
  - Early validation prevents runtime errors
- **Acceptance Criteria**:
  - [ ] Syntax errors detected before execution
  - [ ] Unknown variables cause validation errors
  - [ ] Clear error messages with expression location
  - [ ] Invalid workflows rejected at load time
- **Rationale**: Validating expression syntax at workflow load time catches errors early and provides clear feedback before execution begins.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 334-340)

---

#### FR-110: Optional Chaining for Safe Null Access

- **Requirement**: The system SHALL support optional chaining (?.) for safe access to potentially null values.
- **Priority**: Medium
  - Simplifies handling of skipped phase outputs
- **Acceptance Criteria**:
  - [ ] Expressions support ?. operator
  - [ ] Optional chaining prevents null access errors
  - [ ] Expressions like analyze?.complexity work correctly
- **Rationale**: Optional chaining enables safe access to phase outputs that may be null due to skipped phases, such as analyze?.complexity == 'high'.
- **Source**: `design/alfred/05-workflow/features/conditionals.md` (lines 356-364)

---

### 4.14 Human-in-the-Loop Approvals

<!-- Requirements extracted from: design/alfred/05-workflow/features/human-in-the-loop.md -->

#### FR-111: Declarative Approval Gates in Workflow Definitions

- **Requirement**: The system SHALL support declarative approval gates defined in workflow definitions.
- **Priority**: High
  - Humans must control where reviews happen
- **Acceptance Criteria**:
  - [ ] Workflows can declare approval_required: true on phases
  - [ ] Approval points are explicit in workflow definition
  - [ ] AI cannot add approval gates at runtime
  - [ ] Approval configuration is version-controlled with workflow
- **Rationale**: Approval points must be declared in workflow definitions by humans, not requested by agents, ensuring humans maintain control over where reviews happen.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 5-29)

---

#### FR-112: Three-Action Approval System

- **Requirement**: The system SHALL support three approval actions: Approve, Deny, and Provide Refinements.
- **Priority**: Critical
  - Core human-in-loop capability
- **Acceptance Criteria**:
  - [ ] Human can approve and workflow continues
  - [ ] Human can deny and workflow fails
  - [ ] Human can provide refinements for retry
  - [ ] Actions are mutually exclusive
- **Rationale**: Three-action system enables humans to approve successful work, reject unacceptable work, or provide feedback for improvement through refinement loop.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 22-24)

---

#### FR-113: Refinement Loop with Feedback

- **Requirement**: The system SHALL retry commands with human feedback when refinements are provided.
- **Priority**: High
  - Enables iterative improvement without restarting workflow
- **Acceptance Criteria**:
  - [ ] Refinements trigger command retry
  - [ ] Human feedback injected into retry prompt
  - [ ] Command receives previous output and feedback
  - [ ] Retry produces new output for review
  - [ ] Loop continues until approved, denied, or max attempts
- **Rationale**: Refinement loop enables iterative improvement where human feedback guides the AI to improve its work without restarting the entire workflow.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 23, 121-138)

---

#### FR-114: Workflow Pause at Approval Gates

- **Requirement**: The system SHALL pause workflow execution at approval gates until human decision.
- **Priority**: Critical
  - Blocking execution is core to approval mechanism
- **Acceptance Criteria**:
  - [ ] Workflow pauses when approval_required phase completes
  - [ ] No subsequent phases execute during pause
  - [ ] State transitions to 'awaiting_approval'
  - [ ] Workflow waits indefinitely (or until timeout)
- **Rationale**: Approval gates must block workflow execution to give humans time to review and make informed decisions without pressure.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 24, 98-120)

---

#### FR-115: Artifact Display for Human Review

- **Requirement**: The system SHALL display artifacts generated by commands for human review.
- **Priority**: High
  - Humans need to see what they're approving
- **Acceptance Criteria**:
  - [ ] Approval UI shows configured artifacts
  - [ ] Artifacts can be viewed inline
  - [ ] Artifacts can be opened in editor
  - [ ] File paths resolved with template variables
- **Rationale**: Humans need easy access to generated artifacts (plans, code, reports) to make informed approval decisions.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 26, 55-62, 145-190)

---

#### FR-116: Review Checklist Display

- **Requirement**: The system SHALL display optional review checklists to guide human approval decisions.
- **Priority**: Medium
  - Helps ensure consistent review quality
- **Acceptance Criteria**:
  - [ ] Approval config can define checklist items
  - [ ] UI displays checklist with checkboxes
  - [ ] Checklist is informational, not enforced
  - [ ] Checklist helps guide review
- **Rationale**: Review checklists guide humans to check important criteria (architecture alignment, requirements coverage, edge cases) for consistent review quality.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 60-64, 163-170)

---

#### FR-117: Maximum Refinement Attempts Limit

- **Requirement**: The system SHALL limit refinement attempts to prevent infinite retry loops.
- **Priority**: Critical
  - Prevents workflows from looping indefinitely
- **Acceptance Criteria**:
  - [ ] max_refinement_attempts is configurable per phase
  - [ ] Default maximum is 3 attempts
  - [ ] Workflow fails when maximum exceeded
  - [ ] Attempt count shown in UI
- **Rationale**: Maximum refinement attempts prevent infinite loops when work cannot be completed satisfactorily despite multiple refinements.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 69, 186)

---

#### FR-118: Approval Timeout

- **Requirement**: The system SHALL timeout checkpoint approvals and approval gates after configurable duration.
- **Priority**: High
  - Prevents workflows from waiting indefinitely for human input
- **Acceptance Criteria**:
  - [ ] Checkpoint timeout duration is configurable
  - [ ] Timeout duration configurable per phase
  - [ ] Default timeout is 30 minutes (1800s)
  - [ ] System fails workflow when checkpoint times out
  - [ ] Workflow fails on timeout
  - [ ] Timeout reason is recorded in workflow state
  - [ ] Timeout countdown shown in UI
  - [ ] Default timeout value is defined
- **Rationale**: Timeout prevents workflows from waiting indefinitely when humans are unavailable to provide approval decisions. Prevents workflows from waiting indefinitely for human input that may never come.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 70, 88); `design/alfred/05-workflow/orchestrator-core.md` (lines 1530, 1541, 2620-2628)

---

#### FR-119: Auto-Approval Conditions

- **Requirement**: The system SHALL support optional auto-approval when specified conditions are met.
- **Priority**: Low
  - Convenience feature for low-risk scenarios
- **Acceptance Criteria**:
  - [ ] Phases can define auto_approve_if conditions
  - [ ] Conditions checked before pausing for human
  - [ ] All conditions must pass for auto-approval
  - [ ] Auto-approval bypasses human review
- **Rationale**: Auto-approval enables automated workflows in low-risk scenarios when specific conditions guarantee quality, such as required files exist with expected content.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 73-78)

---

#### FR-120: Refinement Context Injection

- **Requirement**: The system SHALL inject human feedback into command retry prompts with context.
- **Priority**: High
  - Commands need clear feedback to improve
- **Acceptance Criteria**:
  - [ ] Retry prompt includes original prompt
  - [ ] Retry prompt includes previous output summary
  - [ ] Retry prompt includes human feedback
  - [ ] Retry prompt includes attempt number
  - [ ] Retry prompt instructs AI to address feedback
- **Rationale**: Commands need context about what was wrong with previous attempt to produce improved output. Structured refinement prompts provide this guidance.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 327-366)

---

#### FR-121: Approval Decision Persistence

- **Requirement**: The system SHALL persist approval decisions in workflow state with history.
- **Priority**: High
  - Audit trail and recovery require persisted decisions
- **Acceptance Criteria**:
  - [ ] Each approval decision is recorded
  - [ ] Decision history includes action, reason, refinements
  - [ ] History includes attempt number and timestamp
  - [ ] Decisions persisted across process restarts
- **Rationale**: Approval decision history provides audit trail and enables workflow recovery after crashes during approval wait.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 545-561)

---

#### FR-122: Approval Recovery After Crash

- **Requirement**: The system SHALL recover approval state after process crashes.
- **Priority**: High
  - Approvals may wait hours, must survive crashes
- **Acceptance Criteria**:
  - [ ] Approval state persisted before pause
  - [ ] State includes phase context and artifacts
  - [ ] UI re-displays on restart
  - [ ] User can continue review or change decision
- **Rationale**: Approval gates may wait hours for human response. State must survive process crashes so humans don't lose context.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 563-571)

---

#### FR-123: Interactive and CLI Approval Modes

- **Requirement**: The system SHALL support both interactive modal and CLI approval interfaces.
- **Priority**: High
  - Different users prefer different interfaces
- **Acceptance Criteria**:
  - [ ] Modal mode provides rich interactive UI
  - [ ] CLI mode provides terminal-based prompts
  - [ ] Mode selection configurable per workflow
  - [ ] Both modes support all approval actions
- **Rationale**: Interactive developers prefer rich modal UI, while CLI-focused developers prefer terminal-based interaction. Both modes should be supported.
- **Source**: `design/alfred/05-workflow/features/human-in-the-loop.md` (lines 87, 140-229)

---

### 4.15 Iteration and Loops

<!-- Requirements extracted from: design/alfred/05-workflow/features/loops-and-iteration.md -->

#### FR-124: Iterative Phase Execution Until Condition

- **Requirement**: The system SHALL execute phases iteratively until specified condition becomes true, supporting both phase groups and individual phases.
- **Priority**: High
  - Enables retry loops, incremental workflows, and incremental improvement workflows
- **Acceptance Criteria**:
  - [ ] Phases can declare iterate.until condition
  - [ ] System can execute phase groups in loops
  - [ ] Loop exit condition is evaluated after each iteration
  - [ ] Condition evaluated after each iteration
  - [ ] Iteration continues while condition is false
  - [ ] Loop continues while condition is false
  - [ ] Iteration exits when condition is true
  - [ ] Loop exits when condition becomes true
  - [ ] Maximum iteration limit prevents infinite loops
- **Rationale**: Iterative execution enables test-fix-test cycles, incremental task completion, iterative refinement, and retry-until-success patterns without manual intervention. Enables retry loops and incremental improvement workflows.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 22-45); `design/alfred/05-workflow/orchestrator-core.md` (lines 1387-1426)

---

#### FR-125: Checkpoint-Based Iteration Resume

- **Requirement**: The system SHALL support resuming iteration from named checkpoints within iteration block.
- **Priority**: High
  - Enables skipping one-time setup in iterations
- **Acceptance Criteria**:
  - [ ] Iteration can define checkpoint as resume point
  - [ ] First iteration executes from beginning
  - [ ] Subsequent iterations resume from checkpoint
  - [ ] Steps before checkpoint marked with runOnce skip in iterations
- **Rationale**: Iteration blocks may have one-time setup steps that should only run once. Checkpoint-based resume enables efficient iteration by skipping completed setup.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 36-45)

---

#### FR-126: Maximum Iteration Limit Enforcement

- **Requirement**: The system SHALL enforce maximum iteration limits to prevent infinite loops, with configurable maximum per iteration block.
- **Priority**: Critical
  - Prevents runaway workflows from consuming unlimited resources
- **Acceptance Criteria**:
  - [ ] Iteration maximum is configurable per iteration block
  - [ ] maxIterations or maxAttempts configurable per iteration
  - [ ] Iteration stops when maximum reached
  - [ ] System stops iteration when maximum is reached
  - [ ] System reports when maximum iterations reached
  - [ ] Workflow continues to next phase after max iterations
  - [ ] Warning emitted when maximum reached without condition met
  - [ ] Default maximum iteration limit exists
- **Rationale**: Maximum iteration limits prevent runaway workflows when exit conditions are never met due to bugs or impossible conditions. Prevents runaway workflows from consuming unlimited resources when exit conditions are never met.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 31, 1418-1420); `design/alfred/05-workflow/orchestrator-core.md` (lines 1400-1401, 1418-1420)

---

#### FR-127: Iteration Context Accumulation

- **Requirement**: The system SHALL accumulate outputs from each iteration in workflow context.
- **Priority**: High
  - Later iterations need access to previous iteration results
- **Acceptance Criteria**:
  - [ ] Each iteration's outputs stored in context
  - [ ] Outputs accessible by iteration number
  - [ ] Commands can reference previous iteration outputs
  - [ ] Context grows with each iteration
- **Rationale**: Iterative workflows may need outputs from previous iterations to make progress, such as checking which tasks were completed in prior iterations.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 193-221)

---

#### FR-128: Iteration Counter Tracking in Context

- **Requirement**: The system SHALL track current iteration number in workflow context for iterative phases.
- **Priority**: High
  - Commands need to know which iteration they're in and iteration control requires counting loop iterations
- **Acceptance Criteria**:
  - [ ] System maintains counter per iteration block
  - [ ] iteration variable available in context
  - [ ] Counter starts at 0 or 1
  - [ ] Counter increments with each iteration
  - [ ] Counter is checked against maximum
  - [ ] Counter accessible in command templates
  - [ ] Counter resets after iteration completes
- **Rationale**: Commands may need iteration number for logging, progress reporting, or conditional logic based on iteration count. Iteration control requires tracking how many iterations have occurred to enforce maximum limits.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 389-417); `design/alfred/05-workflow/orchestrator-core.md` (lines 1778-1779)

---

#### FR-129: Run-Once Phase Skip in Iterations

- **Requirement**: The system SHALL skip phases marked runOnce in subsequent iterations.
- **Priority**: High
  - Setup phases should only execute once
- **Acceptance Criteria**:
  - [ ] Phases can be marked runOnce: true
  - [ ] runOnce phases execute in first iteration only
  - [ ] Subsequent iterations skip runOnce phases
  - [ ] Completed phases tracked in context
- **Rationale**: Iteration blocks often have setup phases (install dependencies, load specifications) that should only execute once, not every iteration.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 86-93, 308-329)

---

#### FR-130: Conditional Phase Skip in Iterations

- **Requirement**: The system SHALL skip phases conditionally in iterations based on skipIf expressions.
- **Priority**: Medium
  - Enables dynamic iteration behavior
- **Acceptance Criteria**:
  - [ ] Phases can define skipIf conditions
  - [ ] Conditions evaluated before phase execution
  - [ ] Phase skipped when condition is true
  - [ ] Workflow continues to next step after skip
- **Rationale**: Iterations may want to skip certain phases based on runtime conditions, such as skipping expensive operations when cache is valid.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 332-338)

---

#### FR-131: Nested Iteration Support

- **Requirement**: The system SHALL support nested iterations at command, phase, and workflow levels.
- **Priority**: Medium
  - Complex workflows may require nested loops
- **Acceptance Criteria**:
  - [ ] Commands can have iterate configuration
  - [ ] Phases can have iterate configuration
  - [ ] Workflows can have iterate configuration
  - [ ] Inner iterations complete before outer iteration advances
  - [ ] Nested iteration state is independent
- **Rationale**: Complex workflows may require nested iterations, such as iterating over features where each feature has its own test-fix-test iteration.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 533-547)

---

#### FR-132: Iteration with Command Output Structured Data

- **Requirement**: The system SHALL support commands returning structured data to control iteration decisions.
- **Priority**: High
  - Iteration decisions depend on command outputs
- **Acceptance Criteria**:
  - [ ] Commands return structured data (success, status, etc)
  - [ ] Iteration conditions reference command outputs
  - [ ] Structured outputs update context variables
  - [ ] Conditions evaluated against updated context
- **Rationale**: Iteration decisions depend on structured data from commands, such as checking if output.allDone == true or output.tasksComplete >= output.tasksTotal.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 264-302)

---

#### FR-133: State Restoration for Iteration Resume

- **Requirement**: The system SHALL restore iteration state from snapshots to resume after crashes.
- **Priority**: High
  - Long-running iterations must survive crashes
- **Acceptance Criteria**:
  - [ ] Iteration state persisted after each iteration
  - [ ] State includes iteration counter
  - [ ] State includes accumulated outputs
  - [ ] State includes completed phase tracking
  - [ ] Resume continues from last completed iteration
- **Rationale**: Long-running iterative workflows (hundreds of tasks) must survive process crashes and resume from the last completed iteration without losing work.
- **Source**: `design/alfred/05-workflow/features/loops-and-iteration.md` (lines 343-383)

---

### 4.16 Validation Logic

<!-- Requirements extracted from: design/alfred/05-workflow/features/validation-logic.md -->

#### FR-134: Layered Validation System

- **Requirement**: The system SHALL provide layered validation with deterministic checks and AI validation agent fallback.
- **Priority**: High
  - Catches agent shortcuts and incomplete work
- **Acceptance Criteria**:
  - [ ] Deterministic checks run first if specified
  - [ ] AI validation runs after deterministic checks
  - [ ] AI validation can be skipped if deterministic sufficient
  - [ ] Both layers can be combined
- **Rationale**: AI agents can "shortcut" by claiming task completion without actually doing work. Layered validation catches these shortcuts through deterministic checks (file existence, command success) and AI investigation when needed.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 5-68)

---

#### FR-135: File Existence Validation Check

- **Requirement**: The system SHALL validate that required files exist after phase execution.
- **Priority**: High
  - Common validation need for file creation tasks and requirement to verify files were created
- **Acceptance Criteria**:
  - [ ] Phases can declare file_exists: path or [paths]
  - [ ] Validation can check if file exists
  - [ ] System checks all specified files exist
  - [ ] File path is resolved relative to workspace
  - [ ] Missing files trigger retry or failure
  - [ ] Missing file causes validation failure
  - [ ] File paths support template variables
- **Rationale**: Many phases claim to create files but don't. File existence validation catches this failure mode with zero-cost deterministic check. Common requirement to verify that expected output files were created by the phase.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 31-34, 102-109); `design/alfred/05-workflow/orchestrator-core.md` (lines 1484-1485)

---

#### FR-136: Command Success Validation Check

- **Requirement**: The system SHALL validate that specified commands succeed (exit code 0) after phase execution.
- **Priority**: High
  - Enables running external validation tools and external validation commands
- **Acceptance Criteria**:
  - [ ] Phases can declare command_succeeds: command or [commands]
  - [ ] Validation can execute external commands
  - [ ] System executes all specified commands
  - [ ] Command exit code determines success/failure
  - [ ] Exit code 0 indicates success
  - [ ] Command output is captured for debugging
  - [ ] Failed commands cause validation failure
  - [ ] Non-zero exit code triggers retry or failure
- **Rationale**: External validation tools (test runners, linters, type checkers) provide deterministic validation. Command success checks leverage these tools. Enables running external validation tools (linters, test runners, type checkers) to verify phase output.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 35-36, 110-113); `design/alfred/05-workflow/orchestrator-core.md` (lines 1486)

---

#### FR-137: Skip AI Validation Option

- **Requirement**: The system SHALL allow skipping AI validation when deterministic checks are sufficient.
- **Priority**: Medium
  - Saves time and cost for deterministic scenarios
- **Acceptance Criteria**:
  - [ ] Phases can declare skip_validation: true
  - [ ] AI validation skipped when flag is true
  - [ ] Deterministic checks still run
  - [ ] Workflow continues if deterministic checks pass
- **Rationale**: When deterministic checks fully validate phase success (tests pass, build succeeds), AI validation is unnecessary and wasteful. Skip option optimizes for this case.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 38-39, 110-113)

---

#### FR-138: AI Validation Agent with Read-Only Tools

- **Requirement**: The system SHALL provide AI validation agent with read-only investigation tools.
- **Priority**: High
  - AI needs tools to verify work completion
- **Acceptance Criteria**:
  - [ ] Validation agent can read files
  - [ ] Validation agent can run bash commands
  - [ ] Validation agent cannot modify state
  - [ ] Validation agent has access to original prompt and output
  - [ ] Validation agent returns structured decision
- **Rationale**: AI validation agent needs tools to investigate whether work was completed (read files, check git status, inspect outputs) but must not modify state to avoid corrupting workflow.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 40-46, 334-374)

---

#### FR-139: Validation Agent Decision: Continue, Retry, or Fail

- **Requirement**: The system SHALL process validation agent decisions to continue, retry, or fail workflow.
- **Priority**: High
  - Validation outcomes must control workflow flow
- **Acceptance Criteria**:
  - [ ] Validation agent returns continue, retry, or fail
  - [ ] Continue advances to next phase
  - [ ] Retry re-executes current phase with feedback
  - [ ] Fail stops workflow with reason
  - [ ] Decision includes reasoning and confidence
- **Rationale**: Validation agent investigates completion and returns structured decision: continue if work verifiably complete, retry if incomplete/missing, fail if fundamentally wrong.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 47-51, 360-368)

---

#### FR-140: Configurable Validation Model Selection

- **Requirement**: The system SHALL allow configuring which AI model performs validation.
- **Priority**: Medium
  - Cost optimization through model selection
- **Acceptance Criteria**:
  - [ ] Global validation-agent.model configuration
  - [ ] Default model is haiku (cost-effective)
  - [ ] Can be overridden to sonnet or opus
  - [ ] Per-phase override possible
- **Rationale**: Validation is frequent operation. Using cheaper model (haiku) for validation reduces costs while still catching agent shortcuts. Allow override for complex validation.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 41, 95-99)

---

#### FR-141: Validation Disable Option

- **Requirement**: The system SHALL allow disabling validation system entirely.
- **Priority**: Low
  - Some users may want to opt out
- **Acceptance Criteria**:
  - [ ] Global validation-agent.enabled configuration
  - [ ] Default is enabled
  - [ ] Can be set to false to disable
  - [ ] Disabled validation skips all validation checks
- **Rationale**: While validation is recommended, some users may want to disable it for trusted workflows or debugging. Provide global off switch.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 98)

---

#### FR-142: Multiple Validation Commands

- **Requirement**: The system SHALL support validating with multiple commands that all must succeed.
- **Priority**: High
  - Complex validation may require multiple checks
- **Acceptance Criteria**:
  - [ ] command_succeeds accepts array of commands
  - [ ] All commands must return exit code 0
  - [ ] Commands execute sequentially
  - [ ] First failure stops validation
- **Rationale**: Complex phases may require multiple validation commands (build, typecheck, test, lint) that all must succeed for phase to be valid.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 154-164)

---

#### FR-143: Multiple Validation File Checks

- **Requirement**: The system SHALL support validating existence of multiple files.
- **Priority**: High
  - Phases often create multiple artifacts
- **Acceptance Criteria**:
  - [ ] file_exists accepts array of file paths
  - [ ] All files must exist
  - [ ] Missing any file triggers validation failure
  - [ ] File paths support template variables
- **Rationale**: Phases often create multiple artifacts (source file, test file, documentation). Validation should check all expected files exist.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 140-149)

---

#### FR-144: Validation Template Variable Substitution

- **Requirement**: The system SHALL substitute template variables in validation file paths.
- **Priority**: High
  - File paths depend on dynamic values
- **Acceptance Criteria**:
  - [ ] File paths can contain {taskId} variable
  - [ ] File paths can contain other context variables
  - [ ] Variables resolved before validation
  - [ ] Unresolved variables cause errors
- **Rationale**: Validation file paths depend on runtime values like taskId. Template substitution enables dynamic path construction.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 107, 144)

---

#### FR-145: Validation Retry with Feedback

- **Requirement**: The system SHALL inject validation feedback into phase retry attempts.
- **Priority**: High
  - Agents need to know why validation failed
- **Acceptance Criteria**:
  - [ ] Validation failure reasons captured
  - [ ] Retry prompt includes validation feedback
  - [ ] Agent receives specific guidance on what was wrong
  - [ ] Retry attempt increments
- **Rationale**: When validation detects incomplete work, retry should include specific feedback about what was missing or incorrect so agent can fix it.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines implied by retry decision)

---

#### FR-146: Validation Error Logging

- **Requirement**: The system SHALL log all validation decisions with reasoning for debugging.
- **Priority**: Medium
  - Debugging requires validation decision history
- **Acceptance Criteria**:
  - [ ] All validation decisions logged
  - [ ] Logs include action, reasoning, confidence
  - [ ] Logs include phase and attempt number
  - [ ] Logs accessible for debugging
- **Rationale**: Debugging validation issues requires detailed logs of validation decisions, reasoning, and confidence levels to understand why workflows failed or retried.
- **Source**: `design/alfred/05-workflow/features/validation-logic.md` (lines 452)

---

## 5. Non-Functional Requirements

### 5.5 Reliability Requirements (Additional)

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### NFR-REL-003: Deterministic Workflow Execution

- **Category**: Reliability
- **Requirement**: The system SHALL produce identical results for identical workflow inputs.
- **Metric**: 100% deterministic state transitions for same input
- **Verification**: Run same workflow multiple times with identical inputs and verify identical results
- **Priority**: Critical
- **Rationale**: Predictable behavior is essential for reliable workflow execution. Non-deterministic behavior would make debugging impossible and erode user confidence.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 107-110)

---

#### NFR-REL-004: Workflow Crash Recovery

- **Category**: Reliability
- **Requirement**: The system SHALL recover and resume workflows after process crashes.
- **Metric**: Ability to resume from last completed phase with 0% data loss
- **Verification**: Simulate process crashes at various workflow stages and verify successful resume
- **Priority**: Critical
- **Rationale**: Workflows must be resilient to infrastructure failures (OOM, process kills, power loss). Users should not lose work due to crashes.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 117-120, 2112-2193)

---

#### NFR-REL-005: State Persistence Reliability

- **Category**: Reliability
- **Requirement**: The system SHALL persist workflow state after each phase completion.
- **Metric**: State persisted within 1 second of phase completion with 100% success rate
- **Verification**: Monitor state persistence success rate and latency
- **Priority**: Critical
- **Rationale**: Crash recovery depends on reliable state persistence. Missing or delayed persistence would cause data loss.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2129-2151)

---

#### NFR-REL-006: State Consistency Across Restarts

- **Category**: Reliability
- **Requirement**: The system SHALL maintain state consistency across process restarts.
- **Metric**: 100% of resumed workflows continue from correct state
- **Verification**: Resume workflows after crash and verify state is correct
- **Priority**: Critical
- **Rationale**: Inconsistent state would corrupt workflow execution, causing incorrect results or failures.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2112-2193)

---

### 5.6 Performance Requirements (Additional)

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### NFR-PERF-007: Parallel Execution Performance

- **Category**: Performance
- **Requirement**: The system SHALL execute independent parallel phases concurrently without blocking.
- **Metric**: Parallel phases complete in time equal to longest phase, not sum of all phases (overhead < 10%)
- **Verification**: Measure parallel phase execution times and compare to sum of sequential times
- **Priority**: High
- **Rationale**: Parallel execution must provide performance benefits. If overhead is significant, parallel execution provides no value.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 1308-1314, 2303-2318)

---

#### NFR-PERF-008: State Persistence Performance

- **Category**: Performance
- **Requirement**: The system SHALL persist state without blocking workflow execution.
- **Metric**: State persistence completes within 500ms and does not block phase execution
- **Verification**: Measure state persistence latency and verify non-blocking behavior
- **Priority**: High
- **Rationale**: Slow or blocking persistence would significantly impact workflow throughput and user experience.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2320-2332)

---

#### NFR-PERF-009: Context Building Performance

- **Category**: Performance
- **Requirement**: The system SHALL build phase context efficiently without loading unnecessary data.
- **Metric**: Context building completes within 2 seconds for typical workflows
- **Verification**: Measure context building time across variety of workflows
- **Priority**: High
- **Rationale**: Slow context building would delay phase execution and reduce overall workflow throughput.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2333-2356)

---

#### NFR-PERF-010: Event Emission Performance

- **Category**: Performance
- **Requirement**: The system SHALL emit events without significantly impacting workflow execution performance.
- **Metric**: Event emission adds less than 50ms per phase
- **Verification**: Measure workflow execution time with and without event emission
- **Priority**: High
- **Rationale**: Event system is for observability and should not slow down core workflow execution.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2358-2387)

---

#### NFR-PERF-011: Retry Delay Cap

- **Category**: Performance
- **Requirement**: The system SHALL cap retry delays at a reasonable maximum.
- **Metric**: Maximum retry delay of 30 seconds
- **Verification**: Verify retry delays never exceed 30 seconds
- **Priority**: High
- **Rationale**: Excessive retry delays would make workflows unresponsive. 30 seconds provides time for transient issues to resolve while maintaining acceptable responsiveness.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2205, 2224-2228)

---

<!-- Requirements extracted from: design/alfred/05-workflow/pipeline-hierarchy.md -->

#### NFR-PERF-012: Lazy Workflow Definition Loading

- **Category**: Performance
- **Requirement**: The system SHALL load workflow definitions lazily to minimize startup time.
- **Metric**: Workflow definitions loaded on-demand, not during system initialization. Startup time under 500ms.
- **Verification**: Measure system startup time with large number of workflow definitions
- **Priority**: Medium
- **Rationale**: Large workflow libraries should not slow down system startup. Lazy loading ensures fast startup regardless of workflow count.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 997-1001)

---

#### NFR-PERF-013: Context Interpolation Caching

- **Requirement**: The system SHALL cache context interpolation results to improve execution speed.
- **Metric**: Repeated variable access has < 1ms overhead through caching
- **Verification**: Measure context interpolation performance with and without caching
- **Priority**: Medium
- **Rationale**: Context interpolation may occur frequently during workflow execution. Caching prevents repeated computation.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 1000)

---

#### NFR-PERF-014: Phase Queue Management Efficiency

- **Category**: Performance
- **Requirement**: The system SHALL manage phase queues efficiently for large dynamic expansions.
- **Metric**: System handles 1000+ dynamically expanded phases without memory issues or significant performance degradation
- **Verification**: Test with workflows that expand to large numbers of phases
- **Priority**: Medium
- **Rationale**: Dynamic phase expansion could create very large phase queues. Efficient queue management prevents memory issues and maintains performance.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 1002)

---

### 5.7 Usability Requirements

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### NFR-USE-002: Declarative Workflow Definitions

- **Category**: Usability
- **Requirement**: The system SHALL use declarative workflow definitions that describe desired state, not implementation steps.
- **Metric**: Workflow definitions contain no imperative control flow code (100% declarative)
- **Verification**: Audit workflow definitions for imperative patterns
- **Priority**: High
- **Rationale**: Declarative definitions are easier to understand, maintain, and reason about than imperative code. They focus on "what" rather than "how".
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 69-103)

---

<!-- Requirements extracted from: design/alfred/05-workflow/pipeline-hierarchy.md -->

#### NFR-USE-003: Clear Error Messages for Name Resolution

- **Category**: Usability
- **Requirement**: The system SHALL provide clear error messages for ambiguous name resolution.
- **Metric**: Error messages list all matching options and suggest using explicit flags
- **Verification**: Test with ambiguous names and verify error message quality
- **Priority**: High
- **Rationale**: When users provide ambiguous names (e.g., name matches both a command and workflow), clear error messages guide them to use explicit flags for deterministic behavior.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 264)

---

#### NFR-USE-004: Clean Declarative Syntax for Conditional Execution

- **Category**: Usability
- **Requirement**: The system SHALL use clean, declarative syntax for conditional execution in configuration files.
- **Metric**: Conditional execution requires no complex templating or programming constructs
- **Verification**: Review workflow examples for complexity and clarity
- **Priority**: High
- **Rationale**: Conditional logic should be intuitive and readable without requiring programming expertise or complex templating.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 36-37, 888-889)

---

### 5.8 Maintainability Requirements

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### NFR-MAINT-002: Workflow Definition Validation

- **Category**: Maintainability
- **Requirement**: The system SHALL validate workflow definitions before execution and provide clear error messages.
- **Metric**: 100% of validation errors include actionable error messages with file/line/column information
- **Verification**: Test with invalid workflows and verify error message quality
- **Priority**: High
- **Rationale**: Early validation prevents runtime errors and aids debugging. Clear error messages reduce troubleshooting time.
- **Source**: `design/alfred/05-workflow/orchestrator-core.md` (lines 267-272)

---

<!-- Requirements extracted from: design/alfred/05-workflow/pipeline-hierarchy.md -->

#### NFR-MAINT-003: Event Emission for UI Updates

- **Category**: Maintainability
- **Requirement**: The system SHALL emit events for UI updates during hierarchical execution.
- **Metric**: All state transitions emit appropriate events for UI consumption
- **Verification**: Verify all execution events are emitted with complete data
- **Priority**: High
- **Rationale**: Event emission decouples execution from UI, enabling flexible UI implementations and real-time monitoring.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 1001, 707-710)

---

#### NFR-MAINT-004: Hierarchical View for Monitoring

- **Category**: Maintainability
- **Requirement**: The system SHALL provide a hierarchical view of execution for monitoring purposes.
- **Metric**: Monitoring API provides complete pipeline → workflow → phase hierarchy
- **Verification**: Query monitoring API and verify hierarchical structure is complete
- **Priority**: High
- **Rationale**: Hierarchical view enables UI and monitoring tools to display execution structure and status clearly.
- **Source**: `design/alfred/05-workflow/pipeline-hierarchy.md` (lines 38, 715-732)

---

### 5.9 Business Constraints (Additional)

<!-- Requirements extracted from: design/alfred/05-workflow/orchestrator-core.md -->

#### BC-023: Maximum Retry Limit

- **Type**: Policy
- **Constraint**: The system SHALL limit retry attempts to prevent infinite retry loops.
- **Impact**: Default maximum of 3 retries, configurable per workflow. Must prevent resource waste on unrecoverable errors.
- **Source**: System design requirement
- **Extracted From**: `design/alfred/05-workflow/orchestrator-core.md` (lines 2201-2202)

---

## 10. Glossary

**FlowMaster**: AI-powered multi-step workflow orchestration platform that automates complex development workflows by coordinating multiple AI agent sessions with isolated contexts and explicit dependency management.

**Workflow**: A multi-step automation sequence defined declaratively, supporting sequential execution, parallel blocks, and dependencies between steps.

**Phase**: A single step in a workflow that executes one or more commands. Phases can be sequential or parallel.

**Command**: An individual unit of work executed by an AI agent, typically defined as a prompt template with context variables.

**Provider**: An AI service provider (e.g., Claude, GPT/Codex, Gemini) that executes commands.

**Context Degradation**: The phenomenon where AI agent output quality declines as session context accumulates over time. Also known as "context rot."

**Isolated Context**: A fresh execution environment for each command that prevents context accumulation and degradation.

**Session**: A conversation thread with an AI provider, potentially spanning multiple turns (messages back and forth).

**Task**: An execution instance with a unique identifier (e.g., from Jira/Linear) that represents a unit of development work.

**Orchestration Overhead**: Time spent on workflow management tasks (breaking down tasks, managing context, validating outputs, merging results) versus actual AI execution time.

**Provider Routing**: The capability to direct different workflow commands to different AI providers based on task characteristics, cost, or quality optimization.

**Local-First**: Architecture pattern where all processing and storage happens on the user's local machine, with no cloud dependencies except external API calls.

**Workflow-as-Code**: Practice of defining workflows in version-controllable declarative format (similar to Infrastructure-as-Code).

**Intelligent Orchestration**: System capability where AI agents at different orchestration levels (pipeline, workflow, command) can communicate bidirectionally for clarifications and decision-making during execution.

**Workflow Agent**: Long-running AI agent session that coordinates workflow execution, maintains context across phases, answers command clarifications, and validates outputs.

**Pipeline Agent**: Long-running AI agent session that coordinates multiple workflows, maintains project-wide context, and answers workflow-level escalations requiring architectural decisions.

**Clarification Request**: Structured question from a command or workflow to its parent agent when encountering ambiguity or needing guidance, enabling adaptive decision-making during execution.

**Escalation**: Process where workflow agents forward questions they cannot answer to pipeline agents with broader project-level context.

**Context Accumulation**: Process where workflow and pipeline agents accumulate knowledge from completed phases and workflows to inform subsequent decisions and validations.

**Conditional Execution**: Workflow control flow capability that enables branching logic with if/elseIf/else semantics based on runtime data from previous phases.

**Approval Gate**: Declarative checkpoint in workflow where execution pauses for human review and decision (approve, deny, or provide refinements) before continuing.

**Refinement Loop**: Human-in-loop pattern where humans provide feedback on AI-generated work, triggering command retry with feedback context until work is approved or maximum attempts reached.

**Iteration**: Workflow pattern where phase groups execute repeatedly until exit condition becomes true or maximum iteration limit reached, enabling retry-until-success and incremental completion patterns.

**Validation Agent**: AI agent with read-only tools that investigates whether phases completed their work correctly, returning structured decisions (continue/retry/fail) to catch shortcuts and incomplete work.

**Deterministic Validation**: Programmatic validation checks (file existence, command success) that provide zero-cost verification without AI involvement.

**Checkpoint**: Named resumption point in iteration block that enables skipping one-time setup phases in subsequent iterations.

**Expression Evaluator**: Sandboxed environment for evaluating condition expressions with access to phase outputs, environment variables, and workflow context.

**Skipped Phase**: Phase that did not execute due to condition evaluation being false, recorded in workflow state with skip reason for debugging.

**Run-Once Phase**: Phase marked to execute only on first iteration, automatically skipped in subsequent iterations to optimize iterative workflows.

---

## Document Control

**Version History:**

| Version | Date       | Author   | Changes                                                        |
| ------- | ---------- | -------- | -------------------------------------------------------------- |
| 1.0.0   | 2025-11-24 | AI Agent | Initial requirements extraction from business context document |

**Review Status:** Draft - Pending stakeholder review

**Next Review Date:** TBD

---

_End of Document_
