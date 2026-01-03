---
description:
  Extract requirements from design docs and build/append to FlowMaster PRD
model: sonnet
---

# Build SRS/PRD from Design Documents

You are tasked with extracting clean requirements from existing design documents
and building a consolidated Product Requirements Document for FlowMaster.

**CRITICAL CONTEXT:**

- This project is being renamed from "Alfred" to "FlowMaster"
- ALL references to "Alfred" must be changed to "FlowMaster"
- We are extracting requirements from implementation-heavy docs
- Focus on WHAT (requirements), not HOW (implementation)

**CRITICAL RULE - DO NOT INVENT REQUIREMENTS:**

- ONLY extract requirements that are EXPLICITLY stated or clearly implied in the
  source documents
- DO NOT add requirements based on assumptions about what "should" be there
- DO NOT add requirements based on general best practices or common patterns
- DO NOT fill in gaps with your own ideas
- If unclear, mark as question for user - DO NOT guess
- Every requirement MUST trace back to specific content in source files
- Inventing requirements wastes tokens and creates bad user experience

## Step 1: Input Detection and Validation

<procedure>
1. Check if file or folder path provided as parameter
2. If no parameter provided, present this message:
</procedure>

<message>
I'll help you extract requirements from design documents and add them to the FlowMaster PRD.

Please provide:

- A file path: `/build-srs-prd design/alfred/01-types/data-model.md`
- OR a folder path: `/build-srs-prd design/alfred/04-execution/`

I'll extract functional requirements, non-functional requirements, and business
constraints, then append them to `design/flowmaster/01-product-requirements.md`.
</message>

<procedure>
3. If folder provided:
   - Use Glob with pattern `[folder]/**/*.md` to list all markdown files recursively
   - Display list of found files to user for confirmation
   - Ask: "Found [N] files. Proceed with extraction? (yes/no)"

4. Validate that file(s) exist:
   - If file not found, present error: "ERROR: File not found: [path]. Please
     check the path and try again."
   - If folder has no markdown files, present error: "ERROR: No markdown files
     found in: [folder]"
   - Stop execution if validation fails </procedure>

## Step 2: Read Source Content Completely

<procedure>
1. Read ALL provided files FULLY using Read tool WITHOUT limit or offset
2. For folders, read each markdown file completely
3. Parse and understand the content before extraction
4. Create TodoWrite task list for tracking:
   - "Reading source files" (in_progress)
   - "Extracting requirements" (pending)
   - "Grouping by module" (pending)
   - "Checking existing PRD" (pending)
   - "Writing/appending to PRD" (pending)
   - "Verification" (pending)

**REMINDER:** Only extract what EXISTS in the source files. Do not invent or add
requirements. </procedure>

## Step 3: Extract Requirements with Strict Filtering

<procedure>
1. Identify and extract requirements following these rules:
</procedure>

### ✅ INCLUDE (Requirements)

**Extract these as functional requirements (FR-XXX):**

- System behaviors and capabilities ("system must...", "system shall...")
- User-facing functionality
- Data persistence needs (what data, not how stored)
- Integration requirements (what systems, not protocols)
- Workflow orchestration requirements
- Error handling requirements (what errors, not implementation)

**Extract these as non-functional requirements (NFR-XXX):**

- Performance targets with measurable metrics
- Reliability and availability requirements
- Security requirements (authentication, authorization, data protection)
- Scalability requirements with specific targets
- Usability requirements with measurable criteria
- Maintainability requirements

**Extract these as business constraints (BC-XXX):**

- Regulatory requirements
- Budget/timeline constraints
- Legal requirements
- Organizational policies
- ONLY if externally mandated, not technical preferences

### ❌ EXCLUDE (Implementation Details)

**DO NOT include any of the following:**

**Code and Implementation:**

- TypeScript code, interfaces, classes, functions
- Database schemas and table structures
- API endpoint implementations
- Algorithm implementations
- File system structures
- Configuration file formats

**Technology Names and Tools:**

- Framework names: XState, oclif, React, Ink
- Libraries: Zod, Mocha, Chai, Commander
- Databases: PostgreSQL, Redis, MongoDB
- Cloud providers: AWS, Azure, GCP
- Programming languages: TypeScript, JavaScript, Python

**Architecture Patterns:**

- Design patterns: MVC, microservices, event-driven
- Architecture styles: layered, hexagonal, clean
- Specific patterns: provider abstraction, state machines

**References to Other Projects:**

- CodeMachine
- ClaudeFlow
- Gemini
- Claudeable
- Any other project names mentioned in docs

**Project Name Replacement:**

- Change ALL instances of "Alfred" to "FlowMaster"
- Change "alfred" to "flowmaster"
- Change `.alfred/` to `.flowmaster/`

<output_format> **Source:** `[file path]`

**Module/System:** [Identified module - e.g., "Workflow Orchestration",
"Configuration Management", "Provider Abstraction"]

**Extracted Functional Requirements:**

- FR-XXX: The system SHALL [capability] [condition] so that [business value]
- FR-YYY: When [trigger], the system SHALL [response]

**Extracted Non-Functional Requirements:**

- NFR-XXX: [Category] - The system SHALL [measurable requirement]
- NFR-YYY: [Category] - [quantifiable target]

**Extracted Business Constraints:**

- BC-XXX: [Type] - [constraint description]

**Implementation Bloat Removed:**

- Removed XState v5 references
- Removed TypeScript interfaces
- Removed file system structure details
- Changed Alfred → FlowMaster </output_format>

<procedure>
2. Group requirements by module/system:
   - Workflow Orchestration
   - State Management
   - Configuration Management
   - Provider Management
   - Task Management
   - Event System
   - Command Execution
   - Integration (Jira, MCP, etc.)
   - CLI Interface
   - Session Management

3. Apply "The Choice Test" to each requirement:
   - Ask: "Could this be implemented in multiple valid ways?"
   - YES → It's design/implementation, EXCLUDE it
   - NO → It's a requirement, INCLUDE it

4. Mark "Reading source files" as completed
5. Mark "Extracting requirements" as completed
6. Mark "Grouping by module" as in_progress </procedure>

## Step 4: Check Existing PRD File

<procedure>
1. Check if `design/flowmaster/01-product-requirements.md` exists
2. If exists:
   - Read it FULLY to understand existing structure
   - Identify existing requirement IDs (FR-XXX, NFR-XXX, BC-XXX)
   - Determine next available ID numbers for each category
   - Identify which modules already have requirements
3. If not exists:
   - Prepare to create new file using lean template
   - Start IDs at FR-001, NFR-PERF-001, BC-001

4. Mark "Checking existing PRD" as completed
5. Mark "Writing/appending to PRD" as in_progress </procedure>

## Step 5: Write or Append Requirements

<procedure>
1. If creating new file, use this structure:
</procedure>

<template>
```markdown
---
# FRONTMATTER - AI-Readable Metadata

document: type: "product_requirements_specification" title: "FlowMaster -
Requirements Specification" identifier: "PRD-FLOWMASTER-001" version: "1.0.0"
status: "draft" last_modified: "YYYY-MM-DD"

project: name: "FlowMaster" purpose: "AI-powered multi-step workflow
orchestration platform" target_release: "TBD"

ownership: product_owner: "TBD" technical_lead: "TBD"

audience:

- "product_managers"
- "technical_architects"
- "developers"
- "ai_agents"

keywords:

- "workflow_orchestration"
- "ai_agents"
- "cli_tool"
- "state_management"

---

# FlowMaster: Requirements Specification

> **Document Purpose**: This document specifies all functional and
> non-functional requirements for FlowMaster extracted from design documents. It
> defines what the system must do (functional), how well it must perform
> (non-functional), and what constraints govern implementation (business
> constraints).

---

## 1. Executive Summary

**Business Context:** [Extracted from design docs - to be filled during
extraction]

**Technical Approach:** [High-level requirements summary - to be filled during
extraction]

**Value Proposition:** [What capabilities FlowMaster enables - to be filled
during extraction]

---

## 4. Functional Requirements

### 4.1 Workflow Orchestration

[Requirements for workflow definition, execution, dependency management]

### 4.2 State Management

[Requirements for state persistence, recovery, tracking]

### 4.3 Configuration Management

[Requirements for configuration handling]

### 4.4 Provider Management

[Requirements for provider abstraction and switching]

### 4.5 Task Management

[Requirements for task tracking and lifecycle]

### 4.6 Event System

[Requirements for event emission and handling]

### 4.7 Command Execution

[Requirements for command execution and coordination]

### 4.8 Integration Requirements

[Requirements for external system integrations]

### 4.9 CLI Interface

[Requirements for command-line interface]

### 4.10 Session Management

[Requirements for session handling]

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

[Performance targets with metrics]

### 5.2 Reliability Requirements

[Availability, fault tolerance, recovery]

### 5.3 Security Requirements

[Authentication, authorization, data protection]

### 5.4 Usability Requirements

[Learnability, error messages, CLI UX]

### 5.5 Scalability Requirements

[Scaling targets and approaches]

### 5.6 Maintainability Requirements

[Code quality, observability, documentation]

### 5.7 Portability Requirements

[Platform support, compatibility]

---

## 6. Business Constraints

[Regulatory, budget, timeline, legal constraints]

---

## 10. Glossary

**FlowMaster**: AI-powered multi-step workflow orchestration platform

[Additional terms to be added during extraction]

---

```
</template>

<procedure>
2. If appending to existing file:
   - Locate the appropriate module section (e.g., "4.3 Configuration Management")
   - Add new requirements with next available IDs
   - Maintain consistent formatting with existing content
   - Add separator comments between different source files

3. Format each requirement following the lean template:
</procedure>

<output_format>
#### FR-XXX: [Requirement Title]
- **Requirement**: The system SHALL [specific capability] when [condition] so that [business value].
- **Priority**: [Critical|High|Medium|Low]
  - **Critical**: System cannot function without this
  - **High**: Core capability, needed for MVP
  - **Medium**: Important but can be deferred
  - **Low**: Nice-to-have, future enhancement
- **Acceptance Criteria**:
  - [ ] [Testable criterion 1]
  - [ ] [Testable criterion 2]
- **Rationale**: [Why this requirement exists - extracted from design doc context]
- **Source**: `[source file path]`

---

#### NFR-CATEGORY-XXX: [NFR Title]
- **Category**: [Performance|Reliability|Security|Usability|Scalability|Maintainability|Portability]
- **Requirement**: The system SHALL [measurable requirement].
- **Metric**: [Specific measurement - e.g., "95th percentile < 200ms"]
- **Verification**: [How to test]
- **Priority**: [Critical|High|Medium|Low]
- **Rationale**: [Why this performance/quality level matters]
- **Source**: `[source file path]`

---

#### BC-XXX: [Constraint Name]
- **Type**: [Regulatory|Budget|Timeline|Policy|Legal]
- **Constraint**: [What the constraint is]
- **Impact**: [How this affects the system]
- **Source**: [Where constraint comes from]
- **Extracted From**: `[source file path]`
</output_format>

<procedure>
4. Use Edit tool to append content if file exists, Write tool if creating new

5. Mark "Writing/appending to PRD" as completed
6. Mark "Verification" as in_progress
</procedure>

## Step 6: Verification

<procedure>
1. Read `design/flowmaster/01-product-requirements.md` COMPLETELY again

2. Verify ALL extracted requirements exist in the file

3. **CRITICAL VERIFICATION - Trace Requirements to Source:**
   - For EACH requirement added, verify it traces back to specific source file content
   - Re-read the source files if needed to confirm requirements weren't invented
   - Check that requirements reflect what source documents ACTUALLY say, not assumptions
   - If any requirement cannot be traced to source content, REMOVE it immediately
   - This prevents token waste and bad user experience from invented requirements

4. Check for forbidden content:
</procedure>

<checklist>
- [ ] NO code snippets or TypeScript interfaces in requirements
- [ ] NO technology names (XState, oclif, Zod, Mocha, etc.)
- [ ] NO architecture pattern names in requirements
- [ ] NO references to other projects (CodeMachine, ClaudeFlow, Gemini, Claudeable)
- [ ] NO emojis in technical document content
- [ ] ALL "Alfred" references changed to "FlowMaster"
- [ ] ALL ".alfred/" references changed to ".flowmaster/"
- [ ] Requirements are technology-neutral (could be implemented multiple ways)
- [ ] All requirements have acceptance criteria
- [ ] All NFRs have quantifiable metrics
- [ ] Requirements are atomic (one thing per requirement)
- [ ] Module sections properly organized
- [ ] Source files documented for traceability
- [ ] **CRITICAL**: All requirements trace back to actual source file content (NO invented requirements)
- [ ] **CRITICAL**: No requirements added based on assumptions or "best practices"
</checklist>

<procedure>
4. If verification fails:
   - Use Edit tool to fix issues
   - Remove forbidden content
   - Adjust requirement wording to be technology-neutral
   - Re-verify

5. Mark "Verification" as completed

6. Present summary to user:
</procedure>

<output_format>
**[SUCCESS] Requirements extracted and added to FlowMaster PRD**

**File:** `design/flowmaster/01-product-requirements.md`

**Source Documents Processed:**
- `[file 1]`
- `[file 2]`

**Requirements Added:**
- **Functional Requirements**: [N] requirements added to [Module Name]
- **Non-Functional Requirements**: [N] requirements added
- **Business Constraints**: [N] constraints added

**Next Available IDs:**
- FR-XXX: [next number]
- NFR-XXX: [next number]
- BC-XXX: [next number]

**Verification Passed:**
- [PASS] No code or implementation details
- [PASS] No technology names
- [PASS] No references to other projects
- [PASS] No emojis in technical content
- [PASS] All "Alfred" → "FlowMaster" conversions complete
- [PASS] All requirements testable and atomic
- [PASS] All requirements trace to actual source file content (nothing invented)

**To process more files, run:**
```

/build-srs-prd design/alfred/[next-file-or-folder]

````
</output_format>

## Important Guidelines

**Priority Assignment:**
Determine priority for each requirement using these guidelines:
- **Critical**: System cannot function without this (e.g., core orchestration, state management)
- **High**: Core capability needed for MVP (e.g., error handling, basic CLI)
- **Medium**: Important but can be deferred (e.g., advanced features, optimizations)
- **Low**: Nice-to-have, future enhancement (e.g., convenience features, extras)

**Be Meticulous:**
- Read source files completely before extraction
- Apply filtering rules strictly
- Every requirement must pass "The Choice Test"
- Technology-neutral wording only
- NO emojis in technical documents (requirements, PRD content)
- **CRITICAL**: Extract ONLY what exists in source files - DO NOT invent requirements

**The Choice Test:**
> "Could this be implemented in multiple valid ways?"
> - **YES** → It's design/implementation, EXCLUDE it
> - **NO** → It's a requirement, INCLUDE it

**Examples:**

BAD: "System must use XState for state management"
GOOD: "System SHALL track workflow execution state with crash recovery"

BAD: "Store workflow definitions in YAML files"
GOOD: "System SHALL persist workflow definitions in version-controllable format"

BAD: "Use oclif v4 CLI framework"
GOOD: "System SHALL provide command-line interface with help documentation"

BAD: "Like CodeMachine does for workflows"
GOOD: [Remove reference entirely, extract only the requirement]

**Project Rename:**
- "Alfred" → "FlowMaster"
- "alfred" → "flowmaster"
- ".alfred/" → ".flowmaster/"
- "Alfred CLI" → "FlowMaster CLI"

**Module Organization:**
Group related requirements together:
- Workflow-related: all workflow orchestration requirements
- State-related: all state management requirements
- Config-related: all configuration requirements
- Provider-related: all provider abstraction requirements

**Maintain Separation:**
When appending, add clear separators between different source documents:

```markdown
<!-- Requirements extracted from: design/alfred/01-types/data-model.md -->

#### FR-050: [Requirement]
...

---

<!-- Requirements extracted from: design/alfred/04-execution/engine-core.md -->

#### FR-060: [Requirement]
...
````

**Track Progress:** Use TodoWrite throughout to give user visibility into
extraction progress.

**No Assumptions - No Inventions:** If you encounter ambiguous content:

- Ask user for clarification
- Don't guess at requirements
- Don't invent requirements not in source docs
- Don't add requirements based on "best practices"
- Don't fill gaps with your own ideas
- When in doubt, SKIP IT and ask user

**Why This Matters:**

- Invented requirements waste tokens during extraction and later implementation
- User expects ONLY what's in their design docs
- Creating requirements from assumptions leads to bad experience
- If something is truly needed but missing, user will add it themselves

## Common Extraction Scenarios

**Scenario 1: TypeScript Interfaces**

Source document contains:

```typescript
interface WorkflowDefinition {
  id: string;
  phases: Phase[];
  retryPolicy: RetryPolicy;
}
```

Extract as:

```
FR-XXX: The system SHALL uniquely identify each workflow
FR-YYY: The system SHALL define workflows as sequences of phases
FR-ZZZ: The system SHALL support configurable retry policies per workflow
```

**Scenario 2: Architecture Patterns**

Source document says: "Uses XState v5 state machines for predictable state
management"

Extract as:

```
FR-XXX: The system SHALL track workflow execution state with predictable transitions
NFR-REL-XXX: The system SHALL maintain state consistency across process restarts
```

**Scenario 3: Technology Stack**

Source document says: "Built with oclif CLI framework, uses Ink for UI
rendering"

Extract as:

```
FR-XXX: The system SHALL provide command-line interface
FR-YYY: The system SHALL display real-time execution progress
NFR-USE-XXX: The system SHALL provide interactive terminal UI for workflow monitoring
```

**Scenario 4: References to Other Projects**

Source document says: "Similar to how CodeMachine handles task delegation"

Extract as:

```
FR-XXX: The system SHALL delegate tasks to specialized execution agents
```

(Remove project reference entirely)

## Example Interaction

<example>
User: /build-srs-prd design/alfred/01-types/data-model.md

Assistant: [Follows all steps above]

[Extracts requirements, creates/appends to PRD, verifies]

[SUCCESS] Requirements extracted successfully. </example>
