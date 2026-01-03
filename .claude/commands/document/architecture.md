---
description:
  Comprehensive architecture analysis including components, patterns, entry
  points, public API, dependencies, and development workflow
model: sonnet
---

# Architecture

You are an expert software architect specializing in codebase structure analysis
and architectural documentation. Focus on understanding the organization,
abstraction patterns, and important services/modules in the codebase. Thoroughly
examine files, classes, interfaces, and their relationships without modifying
any code.

Task: Produce a comprehensive analysis of the codebase's architectural
structure, key components, and design patterns.

- Identify critical modules, interfaces, and core services that form the
  backbone of the application
- Document the responsibility boundaries and how components interact at a
  structural level
- Pay special attention to root directories, package organization, and naming
  conventions
- Look for interfaces, abstract classes, and factories as indicators of
  architectural boundaries
- Identify which components are domain-specific vs.
  infrastructure/framework-related
- Return the final response in Markdown format using the structure specified in
  the user prompt

## Workflow

This is a complex analysis task requiring systematic execution. Use TodoWrite to
create a structured task list that ensures comprehensive coverage and provides
clear progress tracking.

<procedure>
**STEP 1: Create your todo list immediately** using the TodoWrite tool with
these tasks:

1. **Setting up analysis** (activeForm: "Setting up analysis")
   - Read complete task requirements from this slash command
   - Understand scope: full project vs. specific path
   - Identify technology stack and project type

2. **Initial exploration** (activeForm: "Performing initial exploration")
   - Identify entry points and main files
   - Understand package/module structure
   - Map high-level organization

3. **Overview section** (activeForm: "Writing Overview section")
   - Reference Output Instructions template section "Overview"
   - Provide 2-3 sentence summary, key characteristics, design philosophy
   - Keep concise but informative

4. **System Context section** (activeForm: "Writing System Context section")
   - Reference Output Instructions template section "System Context"
   - Document what package does, ecosystem fit, consumers, integrations
   - Use bullet format as shown in template

5. **Entry Points section** (activeForm: "Writing Entry Points section")
   - Reference Output Instructions template section "Entry Points"
   - Document bootstrap process, main files, registration mechanisms, hooks
   - Include file:line references

6. **Core Components section** (activeForm: "Writing Core Components section")
   - Reference Output Instructions template section "Core Components"
   - Document each major component: purpose, capabilities, locations,
     characteristics
   - Use tables for token efficiency where appropriate

7. **Service Definitions section** (activeForm: "Writing Service Definitions
   section")
   - Reference Output Instructions template section "Service Definitions"
   - Document services/commands, purposes, workflows, configuration, contracts

8. **Public API & Module Boundaries section** (activeForm: "Writing Public API
   section")
   - Reference Output Instructions template section "Public API & Module
     Boundaries"
   - Document exports, internal vs external, public interfaces, usage guidance

9. **Interface Contracts section** (activeForm: "Writing Interface Contracts
   section")
   - Reference Output Instructions template section "Interface Contracts"
   - Show actual TypeScript interfaces, type signatures, contracts, examples

10. **Design Patterns section** (activeForm: "Writing Design Patterns section")
    - Reference Output Instructions template section "Design Patterns
      Identified"
    - Document patterns, implementations, rationale, benefits

11. **Component Relationships section** (activeForm: "Writing Component
    Relationships section")
    - Reference Output Instructions template section "Component Relationships"
    - Create ASCII diagram plus textual description of interactions, data flow,
      dependencies

12. **External Dependencies section** (activeForm: "Writing External
    Dependencies section")
    - Reference Output Instructions template section "External Dependencies"
    - Create table with: dependency name, purpose, version, type

13. **Key Methods & Functions section** (activeForm: "Writing Key Methods
    section")
    - Reference Output Instructions template section "Key Methods & Functions"
    - Document important methods: signatures, file:line refs, purposes,
      parameters

14. **Build & Development section** (activeForm: "Writing Build & Development
    section")
    - Reference Output Instructions template section "Build & Development"
    - Document build process, testing, extension points, workflow, tools

15. **Available Documentation section** (activeForm: "Writing Available
    Documentation section")
    - Reference Output Instructions template section "Available Documentation"
    - Evaluate existing docs: paths, quality assessment, coverage gaps,
      structure

16. **Key Terms Defined section** (activeForm: "Writing Key Terms Defined
    section")
    - Reference Output Instructions template section "Key Terms Defined"
    - Extract domain-specific terms discovered during analysis
    - Define each term clearly with context (1-2 sentences)
    - Focus on business domain terms, not generic programming terms

17. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all 14 sections present in correct order
    - Verify each section has substantive content (not placeholders or TODO
      markers)
    - Verify file:line references included throughout (e.g.,
      `src/lib/component.ts:42`)
    - Verify tables used where appropriate for token efficiency
    - Verify document starts with `# Architecture` heading only
    - Verify NO conversational preamble, explanations, or meta-commentary exists
    - Verify markdown formatting is clean and consistent
    - If ANY verification fails: DO NOT proceed, fix issues first

18. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/architecture.md`
    - Content must be PURE MARKDOWN starting with `# Architecture`
    - No preamble, no "Here is...", no explanations

**STEP 2: Execute todos sequentially**

- Mark todo as `in_progress` BEFORE starting work
- Complete the work described in the todo
- Reference corresponding template section for detailed requirements
- Mark todo as `completed` IMMEDIATELY after finishing
- Move to next todo
- IMPORTANT: Only ONE todo should be `in_progress` at any time

**IMPORTANT - Post-Write Verification**: If you write the complete document
efficiently in one pass (combining multiple todos), you MUST afterwards go
through each todo one by one to verify the work was completed and mark each as
`completed` incrementally. DO NOT mark all todos as completed at once - verify
and complete them one at a time for progress tracking.

**STEP 3: Handle errors/blockers**

- If you cannot complete a todo, keep it as `in_progress`
- Create a new todo describing what needs resolution
- Never mark todo as completed if work is incomplete
- Ask user for guidance if truly blocked

**NOTE:** Future enhancement will add a final verification step using Explore
agent to validate completeness against slash command requirements. For now,
manual verification checkpoint (todo #16) is sufficient. </procedure>

## Getting Started

**If a specific path is provided** (file, directory, or module):

Analyze the provided path and scope the analysis to that specific area.

**If no path is provided:**

<message>
I'll analyze the entire project. If you want to focus on a specific directory, file, or module, you can provide a path:

Examples:

- `/document/architecture packages/plugin-agents` - Analyze specific package
- `/document/architecture src/lib` - Analyze specific directory
- `/document/architecture src/commands/agents/analyze.ts` - Analyze specific
  file

Proceeding with full project analysis... </message>

## Analysis Task

<procedure>
Examine the project (or the specific path provided) to identify and document key structural elements.

Clearly map the structural architecture of the codebase, highlighting key
components, their responsibilities, and relationships. Provide a blueprint of
the system's organization that helps developers understand component boundaries
and system architecture.

**If a specific path was provided:** Focus analysis on that path only.

**If analyzing the entire project:** Start by understanding the repository's
high-level organization, then identify:

**System Understanding:**

- How the system fits in the larger ecosystem
- Entry points and initialization flow
- What's exported publicly vs what's internal

**Component Analysis:**

- Core modules and their purposes
- Key interfaces and abstractions
- Service components and their responsibilities
- Component relationships and dependencies

**Technical Details:**

- Architectural patterns used (MVC, hexagonal, microservices, etc.)
- Important methods and functions that define the application's capabilities
- External dependencies and why they're used
- Code organization principles and patterns

**Operational:**

- Build and development workflow
- How to extend the system
- Existing documentation quality

Focus on the "what" and "why" of components rather than implementation details.
Include file:line references throughout (e.g., `src/lib/component.ts:42`) to
help AI agents navigate the code. Use tables where they improve clarity and
token efficiency. Be sure that you are describing existing code, not
hypothetical code. Some documents are already available in `.alfred/docs/`. You
can use them to understand the codebase better. </procedure>

## AI-Optimized Formatting

**CRITICAL**: This documentation is primarily consumed by AI agents (like Claude
Code) to understand the codebase. Structure the output using XML tags to make it
easily parseable and semantically clear.

### Reflect on Your Own System Prompt

Before writing the documentation, examine your own system prompt to see how
Anthropic structures information for optimal AI comprehension. Notice the use of
XML tags like:

- `<example>` and `</example>` for examples
- `<procedure>` for step-by-step processes
- `<good-example>` vs `<bad-example>` for contrasts
- `<template>` for structures
- `<important>` for critical information

## Output Instructions

**CRITICAL**: Write your analysis to `.alfred/docs/architecture.md` using the
Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

```markdown
# Architecture

## Overview

Brief summary (2-3 sentences), key characteristics, and design philosophy.

## System Context

- What this package/module does
- How it fits in the larger ecosystem
- Key consumers/stakeholders
- External systems it integrates with

## Entry Points

- How the system bootstraps and initializes
- Main entry files and their purposes
- Command/plugin registration mechanisms
- Lifecycle hooks

## Core Components

Detailed breakdown of each major component with:

- Purpose and responsibilities
- Key capabilities
- File location with line references (e.g., `src/lib/component.ts:42`)
- Important characteristics

Use tables where appropriate for token efficiency.

## Service Definitions

Document services, commands, APIs, or major operational units:

- What services/commands exist
- Their purposes and workflows
- Configuration options
- Input/output contracts

## Public API & Module Boundaries

- What this module exports publicly
- Internal vs external facing components
- Public interfaces and contracts
- What external code can/should use

## Interface Contracts

Show actual TypeScript/code interfaces with:

- Interface definitions
- Type signatures
- Contract documentation
- Usage examples where helpful

## Design Patterns Identified

Patterns used and their purposes:

- Pattern name and type
- Where it's implemented
- Why it was chosen
- Benefits provided

## Component Relationships

Visual diagram (ASCII art preferred) plus textual description of:

- How components connect and interact
- Data flow directions
- Dependency relationships
- Communication patterns

## External Dependencies

Table format listing:

- Dependency name
- Purpose/why it's used
- Version (if relevant)
- Type (runtime, build, peer, etc.)

## Key Methods & Functions

Important methods that define capabilities:

- Method signature
- Location with file:line reference (e.g., `src/lib/runner.ts:46`)
- Purpose and algorithm description
- Key parameters and return values

## Build & Development

- How to build the package
- How to run/test locally
- How to extend (add new components/features)
- Development workflow essentials
- Build tools and scripts

## Available Documentation

Evaluate existing documentation:

- File paths to docs
- Quality assessment
- Coverage gaps
- Documentation structure

## Key Terms Defined

Define domain-specific terminology discovered during analysis:

**[Term]**: [Definition in 1-2 sentences with context]

Example: **Agent**: An independent actor in the routing system that receives
lead assignments. Can be MBP (Market-Based Partner) or Flex (Zillow-employed
agent).

**Routing**: The algorithmic process of assigning incoming leads to qualified
agents based on geography, performance metrics, and capacity constraints.
```

Fill in each section with appropriate content but maintain this exact markdown
structure. Use tables where they improve clarity and token efficiency. Include
file:line references throughout for AI navigation. The output will be directly
written to a file without any processing. This file should be easily readable by
AI (will be used by AI agents only). </template>

**CRITICAL**: Always depend on the current codebase, never read existing
documentation and assume its correct. If the same file already exists, your task
would be to update that and bring it upto the current codebase.
