# FloMaster - Product Overview

> **Document Version**: 1.0
> **Last Updated**: 2025-12-25
> **Status**: Draft
> **Owner**: Product Team
>
> **Related**: [Requirements Overview](./02-requirements-overview.md) · [Architecture Overview](./03-architecture-overview.md)

---

## 1. Executive Summary

FloMaster is a **workflow orchestration platform for AI-powered development tasks**. It combines the declarative simplicity of GitHub Actions with the adaptive intelligence of modern AI agents, enabling developers to automate and simplify complex, multi-step development workflows that can think, adapt, and execute autonomously—while keeping developers in the loop when it matters.

FloMaster supports a flexible execution model: workflows can run fully automated for routine tasks, or include human checkpoints where developers review, approve, or guide the process. This hybrid approach lets teams balance speed with oversight based on task criticality.

Current AI coding assistants excel at executing single, well-scoped tasks but struggle with complex, multi-step workflows. Developers compensate by manually breaking tasks into subtasks, orchestrating multiple AI sessions, and managing context across them. FloMaster eliminates this orchestration burden by providing a declarative workflow layer that coordinates AI agents across the full software development lifecycle—from specification to production.

Success for FloMaster means developers can execute complete feature implementations with a single command, achieving 70%+ reduction in manual orchestration time while maintaining 90%+ workflow success rates.

---

## 2. Problem Statement

### 2.1 The Problem

**Current Situation**:
AI coding agents (Claude Code, Cursor, Codex) suffer from "context rot"—as sessions grow longer and context accumulates, output quality degrades. Models lose focus, reference irrelevant information, and produce brittle solutions. Single-session agents cannot reliably complete multi-step workflows, forcing developers into manual orchestration.

**Who Experiences This**:

- Individual developers working on complex, multi-step features
- Engineering teams seeking to standardize AI-assisted development workflows
- Technical leads wanting to ensure consistent quality across team output

**The Pain**:

Current developer workflow (manual orchestration):

```
1. Break spec into tasks (manual)
2. For each task:
   a. Plan and break task into subtasks (manual)
   b. For each subtask:
      i.   Start new AI agent session (manual)
      ii.  Provide context (manual)
      iii. Execute subtask (AI)
      iv.  Validate output (manual)
      v.   Fix issues (manual + AI)
   c. Integrate subtask results (manual)
3. Integrate task results (manual)
4. Merge to codebase (manual)
```

**The core problems**:

- **Spec → Tasks**: Breaking a spec into well-scoped tasks requires understanding the full context
- **Task → Subtasks**: Each task must be decomposed into subtasks small enough for AI agents to handle effectively—without this breakdown, agents lose focus and produce poor results
- **Context loss between tasks**: AI agents lack context from previous tasks, requiring manual context reconstruction

For a feature with 5 tasks averaging 4 subtasks each, this orchestration overhead dominates developer time.

**Example Scenario**:

> Alex, a senior developer, needs to implement a user authentication feature. They break the spec into 3 tasks (login, registration, password reset), then each task into 3-4 subtasks. For each of the 10+ subtasks, they start separate Claude Code sessions, re-explain the context, validate outputs, and fix integration issues. The feature takes 6 hours—3 of which are pure orchestration overhead that FloMaster would eliminate.

### 2.2 Why This Problem Matters Now

- **AI adoption is accelerating**: 84-90% of developers now use AI coding tools, with 51-65% using them daily
- **Multi-provider usage is standard**: 59% of developers use 3+ AI tools in parallel, switching between them for different tasks
- **Context window limitations persist**: Despite model improvements, context degradation remains a fundamental challenge for complex workflows
- **No orchestration standard exists**: Unlike CI/CD (GitHub Actions, Jenkins), there's no standard way to orchestrate AI development workflows

### 2.3 What Happens If We Don't Solve This

- Developers continue wasting 30-50% of their time on orchestration overhead
- AI tool potential remains underutilized for complex tasks
- Teams lack standardization, leading to inconsistent quality and onboarding challenges
- The vision of AI-augmented development remains fragmented across disconnected tools

### 2.4 Bridging Task Management and Execution

FloMaster bridges two distinct domains:

**Problem Domain (Task Management)**: Work items managed in systems like Jira or Linear

- **Spec** → broken into **Tasks** → broken into **Subtasks**
- Example: "User Authentication" spec → "Login", "Registration", "Password Reset" tasks → individual implementation subtasks

**Execution Domain (FloMaster)**: How work gets done through orchestrated AI agents

- **Workflow** → collection of **Steps** linked by **Connections**
- Steps execute based on dependencies (when upstream steps complete)
- Step types: AI steps, conditionals, loops, human input
- Example: "sdlc" workflow → planning step → implementation steps → testing steps

**The Connection**: A developer takes an Issue from Jira (e.g., "Implement Login") and executes a Workflow against it (e.g., `flomaster workflow sdlc --issue LOGIN-123`). The workflow's steps execute based on their dependencies, with AI agents potentially breaking the issue into subtasks during planning and executing them during implementation.

---

## 3. Vision & Solution Direction

### 3.1 Vision Statement

Development teams can execute complete features—from specification to production—through declarative workflows that intelligently orchestrate AI agents, automatically managing context, validating outputs, and adapting to failures, while developers focus on high-level design and final review.

**The Transformation**:

- **Today**: Developer is the orchestrator, AI is the tool
- **Tomorrow**: FloMaster is the orchestrator, developer is the architect

### 3.2 Solution Approach (High-Level)

The solution will:

1. **Provide declarative workflow definitions** - JSON-based workflows that describe multi-step development processes (like GitHub Actions for AI development), with a visual editor as the primary authoring interface

2. **Orchestrate AI agents through flat DAG execution** - A dependency-based workflow where steps execute when their upstream dependencies complete. Each step gets a fresh agent instance, preventing context rot. Independent steps run in parallel automatically.

3. **Integrate with task management** - Connect to task tracking systems (Linear, Jira) for context-aware development and automatic status updates. Issues from these systems represent the "what" (work to be done), while workflows represent the "how" (execution patterns).

4. **Validate and adapt** - Two-layer validation (deterministic + AI) with automatic retry logic and failure recovery

5. **Leverage opencode SDK** - Use opencode (`@opencode-ai/sdk`) as the execution layer for AI agents, tools, and session management. FloMaster provides workflow orchestration on top of opencode's agent infrastructure.

6. **Desktop-first with CLI support** - Desktop application (Electron) as the primary interface for interactive development, with CLI available for automation and CI/CD integration

**What This Is NOT**:

- **Not an AI coding assistant** - FloMaster orchestrates existing AI tools, not replaces them
- **Not a CI/CD replacement** - FloMaster handles development workflows; CI/CD handles build/deploy pipelines
- **Not limited to CLI power users** - While CLI is supported, the visual workflow builder is the primary authoring interface, enabling users to design and run workflows entirely through the UI without touching configuration files

---

## 4. Business Goals & Objectives

### 4.1 Primary Business Goals

| Goal ID | Goal                                       | Business Impact                                                                                                        |
| ------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| BG-001  | Eliminate developer orchestration overhead | 70%+ reduction in time spent on repetitive orchestration tasks                                                         |
| BG-002  | Enable complex task automation             | Execute multi-step workflows (spec → issues → subtasks → validated merges) with configurable human intervention points |
| BG-003  | Facilitate multi-provider optimization     | Route workflow tasks to optimal AI providers for cost/quality optimization                                             |
| BG-004  | Standardize team development workflows     | Consistent, shareable, version-controlled workflow definitions                                                         |

### 4.2 Success Metrics

| Metric ID | Metric                                     | Current State | Target           | Measurement Method       |
| --------- | ------------------------------------------ | ------------- | ---------------- | ------------------------ |
| SM-001    | Active users (monthly workflow executions) | 0             | 1,000            | Usage telemetry (opt-in) |
| SM-002    | Workflow success rate                      | N/A           | > 90%            | Execution logs           |
| SM-003    | Developer orchestration time reduction     | Baseline TBD  | 70%+ reduction   | User surveys             |
| SM-004    | Cost savings via provider routing          | N/A           | 40-50% reduction | Token usage comparison   |

---

## 5. Scope Definition

### 5.1 In Scope

The following capabilities are included in this initiative:

**Core Orchestration (Flat DAG)**:

- [ ] JSON-based declarative workflow definitions (visual editor output)
- [ ] Workflow composition via `uses:` references (like GitHub Actions)
- [ ] Dependency-based step execution (steps run when upstream completes)
- [ ] Automatic parallel execution for independent steps
- [ ] Shared context for data passing between steps
- [ ] Conditional steps (if/else branching)
- [ ] Loop steps with iteration and termination conditions

**Step Types**:

- [ ] AI steps (agent execution with tools)
- [ ] Conditional steps (branch based on condition)
- [ ] Loop steps (iterate over collections)
- [ ] Human input steps (pause for user approval/input)

**Execution Engine** (via opencode SDK):

FloMaster uses the opencode SDK (`@opencode-ai/sdk`) for AI execution:

- Provider-agnostic AI execution abstraction
- Multi-provider support (Claude, GPT, Gemini, Mistral, and more)
- Session management and context handling
- Fresh agent instances per step (preventing context rot)
- Built-in tools (read, write, edit, bash, grep, etc.)
- Permission system (ask/allow/deny per tool)
- Real-time event streaming (SSE)

**State Management**:

- Session and message persistence (via opencode SDK)
- [ ] Workflow-level checkpoint/resume
- [ ] Cross-step execution history

**Validation System**:

- [ ] Deterministic validation (file checks, command success)
- [ ] Schema validation (Zod-based)
- [ ] AI-powered semantic validation

**Integrations**:

- [ ] Task management integration (Linear, Jira) via MCP
- [ ] Observability platform integration (Langfuse)

**API Layer**:

- [ ] Unified API surface for all UI operations (FloAPI)
- [ ] Transport abstraction (IPC for Desktop, direct calls for CLI)
- [ ] Request validation and routing
- [ ] Event streaming to UI clients

**User Interfaces** (Desktop-First):

- [ ] Desktop application (Electron + React) - primary interface
- [ ] Workflow visualization (React Flow)
- [ ] CLI interface (future, for automation/CI-CD)

**Developer Experience**:

- [ ] Custom command templates (Markdown + Handlebars)
- [ ] Smart command resolution with namespacing
- [ ] Workflow hooks system

### 5.2 Out of Scope

The following are explicitly **excluded** from this initiative:

| Item                            | Reason                                                            | Future Consideration              |
| ------------------------------- | ----------------------------------------------------------------- | --------------------------------- |
| Cloud-hosted execution          | Local-first philosophy, privacy focus                             | Future - potential SaaS offering  |
| Non-developer users (Phase 1-2) | Initial focus on developers; visual builder expands accessibility | Phase 3 - visual workflow builder |
| Direct code generation          | We orchestrate AI tools, not replace them                         | Never - not our value proposition |
| Real-time collaboration         | Single-user workflows initially                                   | Phase 3+                          |
| Mobile applications             | Desktop/terminal focus                                            | TBD                               |
| Windows support                 | macOS/Linux primary                                               | Phase 2+                          |

### 5.3 Assumptions

| Assumption ID | Assumption                                                    | Impact if Wrong                                 |
| ------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| A-001         | Developers will increasingly adopt AI-assisted workflows      | Product has smaller addressable market          |
| A-002         | AI providers will maintain backward-compatible APIs           | Integration maintenance increases significantly |
| A-003         | Different AI models will continue to excel at different tasks | Multi-provider value proposition weakens        |
| A-004         | Target machines have 8GB+ RAM and reliable internet           | Performance issues, need offline mode           |

---

## 6. Constraints

### 6.1 Business Constraints

| Constraint ID | Constraint                        | Rationale                                                         |
| ------------- | --------------------------------- | ----------------------------------------------------------------- |
| BC-001        | No vendor lock-in                 | Must support multiple AI providers                                |
| BC-002        | Developer-focused (current phase) | Not building for non-technical users                              |
| BC-003        | Zero runtime costs                | No cloud infrastructure required; users pay AI providers directly |

### 6.2 Regulatory/Compliance Constraints

| Constraint                 | Regulation/Standard              | Implication                                                              |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| AI provider TOS compliance | Claude, OpenAI, Google API terms | Must respect rate limits, proper attribution                             |
| Privacy-first              | N/A                              | No collection of user code or data; no telemetry without explicit opt-in |

### 6.3 Organizational Constraints

- **Single maintainer initially**: Architecture must be maintainable by small team
- **AI-driven development**: Timelines assume AI agents assist with implementation
- **Node.js ecosystem**: TypeScript, npm workspaces, ES Modules

---

## 7. Stakeholders

### 7.1 Key Stakeholders

| Stakeholder           | Role                     | Interest/Concern                                   | Engagement Level |
| --------------------- | ------------------------ | -------------------------------------------------- | ---------------- |
| Individual Developers | Primary users            | Ease of use, reliability, speed, no vendor lock-in | Collaborate      |
| Engineering Managers  | Workflow standardization | Team consistency, quality assurance, observability | Consult          |
| DevOps Engineers      | Integration              | CI/CD compatibility, monitoring, error handling    | Consult          |
| AI Provider Companies | Integration partners     | Proper API usage, feature parity                   | Inform           |

### 7.2 Target Users

| User Type                         | Description                                   | Primary Goal                                             |
| --------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Individual Developer              | Works on complex, multi-step features         | Execute complete features without manual orchestration   |
| Engineering Team Lead             | Standardizes team workflows                   | Ensure consistent quality and onboarding                 |
| DevOps Engineer                   | Integrates with CI/CD                         | Automate development workflows in pipelines              |
| Product-Focused Engineer (Future) | Owns product vision, delegates implementation | Create spec → FloMaster orchestrates full implementation |

---

## 8. Dependencies & Risks

### 8.1 Dependencies

| Dependency                            | Owner         | Status    | Impact if Delayed                              |
| ------------------------------------- | ------------- | --------- | ---------------------------------------------- |
| **opencode SDK** (`@opencode-ai/sdk`) | opencode team | Available | Core AI execution blocked; critical dependency |
| Task management APIs (Linear, Jira)   | Third parties | Available | Task integration delayed                       |
| XState v5                             | Open source   | Stable    | State machine features blocked                 |
| React Flow                            | Open source   | Stable    | Workflow visualization blocked                 |

### 8.2 Key Risks

| Risk ID | Risk                                    | Likelihood | Impact | Mitigation                                                                   |
| ------- | --------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------- |
| R-001   | AI provider API changes break FloMaster | Low        | Medium | opencode SDK abstracts provider APIs; risk shifted to opencode maintainers   |
| R-002   | Low adoption rate                       | Medium     | High   | Focus on excellent documentation, showcase workflows, developer experience   |
| R-003   | Competing tools emerge                  | High       | Medium | Focus on unique value (orchestration, not execution); stay provider-agnostic |
| R-004   | opencode SDK breaking changes           | Medium     | High   | Pin SDK versions; monitor releases; maintain compatibility layer if needed   |
| R-005   | UI/UX complexity barrier                | Medium     | High   | Invest in design; progressive disclosure (simple → advanced)                 |
| R-006   | Provider rate limiting                  | Medium     | Medium | opencode SDK handles retries; FloMaster adds workflow-level recovery         |

---

## 9. Timeline & Milestones

> **Note**: The following milestones represent major capability areas. Specific phasing and timing are subject to refinement as development progresses.

| Milestone             | Target Timeframe | Description                                                                                                                                                                                                                                    |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MVP: Core Platform    | TBD              | Flat DAG orchestration (Workflow → Steps) with workflow composition via uses:, opencode SDK integration for AI execution, Desktop UI, workflow-level state management, crash recovery, basic validation, multi-provider support (via opencode) |
| Enhanced Intelligence | TBD              | Structured outputs, conditional execution, iteration system, AI-powered validation, advanced workflow patterns                                                                                                                                 |
| Visual Experience     | TBD              | Desktop UI (Electron), workflow visualization (React Flow), visual workflow builder, real-time monitoring dashboard                                                                                                                            |
| Ecosystem Growth      | TBD              | Workflow marketplace, enterprise features, team collaboration, community templates                                                                                                                                                             |

---

## 10. Glossary

### 10.1 Problem Domain (The "What")

These terms describe the work to be done, typically managed in task tracking systems like Jira or Linear:

| Term        | Definition                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec**    | High-level feature specification or requirement; broken down into tasks                                                                       |
| **Task**    | A discrete unit of work derived from a spec (e.g., "Add user authentication"); the primary work item that FloMaster executes against          |
| **Subtask** | A small, focused unit of work derived from a task (e.g., "Implement login endpoint"); granular enough for an AI agent to complete effectively |

### 10.2 Execution Domain (The "How")

These terms describe FloMaster's execution model—a flat DAG (Directed Acyclic Graph) where steps execute based on dependencies:

| Term               | Definition                                                                                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Workflow**       | Collection of steps and connections defining an execution flow. Steps execute based on dependencies. Defined in JSON (visual editor output). Workflows can compose other workflows via `uses:`. |
| **Step**           | Atomic execution unit in a workflow. Types: AI Step, Conditional, Loop, Human Input. Each step gets a fresh agent instance.                                                                     |
| **Connection**     | Link defining data flow and dependency between steps. A step executes when all upstream connections (dependencies) are satisfied.                                                               |
| **Shared Context** | Key-value store accessible by all steps for data passing. Steps write outputs to shared context; downstream steps read from it.                                                                 |
| **Agent**          | An AI provider instance (e.g., Claude) that executes an AI step. Each step gets a fresh agent instance to prevent context rot.                                                                  |

**Execution Model**:

```
Workflow
  ├── Step A (no dependencies) ──────┐
  ├── Step B (no dependencies) ──────┼──► Step D (depends on A, B)
  └── Step C (depends on A) ─────────┘         │
                                               ▼
                                          Step E (depends on D)
```

### 10.3 Supporting Concepts

| Term             | Definition                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider**     | AI service that powers agents (e.g., Claude, Codex, Gemini)                                                                                                                                       |
| **Session**      | A conversation between a user and an AI agent. Each step execution creates a fresh session, preserving message history and tool calls within that step while preventing context rot across steps. |
| **Context**      | Data available to an agent (files, previous outputs, issue details, environment)                                                                                                                  |
| **Artifact**     | Output file from agent execution (prompts, responses, diffs, logs)                                                                                                                                |
| **Checkpoint**   | Serializable execution state for crash recovery and resume                                                                                                                                        |
| **Validation**   | Checks that step output meets requirements (deterministic checks first, then AI-powered investigation)                                                                                            |
| **Context rot**  | Degradation of AI output quality as context accumulates; FloMaster prevents this by giving each step a fresh agent instance                                                                       |
| **MCP**          | Model Context Protocol; standardized integration protocol for AI tools                                                                                                                            |
| **opencode SDK** | The execution layer (`@opencode-ai/sdk`) that provides multi-provider LLM support, session management, tool execution, and event streaming. FloMaster uses opencode SDK for AI execution.         |

---

## Appendix A: Core Use Cases

### Use Case 1: SDLC Workflow (Essential)

**Workflow**: `plan → scaffold → implement → validate → review`

**Steps**:

1. **Planning**: Research codebase + web → Generate implementation plan
2. **Scaffolding**: Break plan into subtasks → Enhance with coding standards
3. **Implementation**: Execute each subtask → Generate code + tests (can run in parallel)
4. **Validation**: Run tests → Validate against requirements
5. **Review**: Code review via AI → Generate PR description

**Why This Matters**: This is the atomic unit of development. All other workflows build on this.

### Use Case 2: Git Workflow (Standard)

**Workflow**: `create-branch → SDLC → push → code-review → merge`

**Steps**:

1. Fetch issue from task management system
2. Create feature branch
3. Execute SDLC workflow (via `uses:`)
4. Push branch to remote
5. AI-powered code review
6. Merge to main (with approval)

### Use Case 3: Spec-to-Production Pipeline (Advanced)

**Workflow**: `spec → break-into-issues → for-each-issue(git-workflow) → integrate`

**Steps**:

1. Ingest project specification
2. Break spec into issues
3. Loop step: For each issue (parallel or sequential):
   - Execute Git workflow (via `uses:`)
   - Validate integration tests
   - Merge to main
4. Final integration validation

**Why This Matters**: This is the vision—entire features built from specs with minimal human intervention.

---

## Document History

| Version | Date       | Author       | Changes         |
| ------- | ---------- | ------------ | --------------- |
| 1.0     | 2025-12-25 | Product Team | Initial version |
