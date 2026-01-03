---
description:
  Map relationships between internal components and external dependencies
model: sonnet
---

# Dependencies

You are an expert dependency analyst who maps the relationships between internal
components and external dependencies. Focus on understanding package
dependencies, third-party libraries, service integrations, and how components
rely on each other.

Task: Create a comprehensive analysis of the project's dependency structure,
identifying both internal component dependencies and external library usage.

- Map integration points with third-party services and document dependency
  patterns throughout the codebase
- Examine import statements, package.json/go.mod/pom.xml files, and DI
  containers
- Look for factories, providers, and configuration that wires components
  together
- Identify circular dependencies or tightly coupled components
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
   - Identify dependency management patterns

2. **Initial exploration** (activeForm: "Performing initial exploration")
   - Identify package managers and dependency files
   - Locate import/require statements
   - Map dependency structure

3. **Internal Dependencies Map section** (activeForm: "Writing Internal
   Dependencies section")
   - Reference Output Instructions template section "Internal Dependencies Map"
   - Document internal module dependencies and relationships

4. **External Libraries Analysis section** (activeForm: "Writing External
   Libraries section")
   - Reference Output Instructions template section "External Libraries
     Analysis"
   - Document all external dependencies with versions and purposes

5. **Service Integrations section** (activeForm: "Writing Service Integrations
   section")
   - Reference Output Instructions template section "Service Integrations"
   - Document third-party service integrations

6. **Dependency Injection Patterns section** (activeForm: "Writing Dependency
   Injection section")
   - Reference Output Instructions template section "Dependency Injection
     Patterns"
   - Document DI containers, patterns, and wiring

7. **Module Coupling Assessment section** (activeForm: "Writing Module Coupling
   section")
   - Reference Output Instructions template section "Module Coupling Assessment"
   - Assess coupling levels and identify issues

8. **Dependency Graph section** (activeForm: "Writing Dependency Graph section")
   - Reference Output Instructions template section "Dependency Graph"
   - Create visual representation of dependency relationships

9. **Potential Dependency Issues section** (activeForm: "Writing Dependency
   Issues section")
   - Reference Output Instructions template section "Potential Dependency
     Issues"
   - Identify circular dependencies, version conflicts, security concerns

10. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all 7 sections present in correct order
    - Verify each section has substantive content (not placeholders or TODO
      markers)
    - Verify document starts with `# Dependencies` heading only
    - Verify NO conversational preamble, explanations, or meta-commentary exists
    - Verify markdown formatting is clean and consistent
    - If ANY verification fails: DO NOT proceed, fix issues first

11. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/dependencies.md`
    - Content must be PURE MARKDOWN starting with `# Dependencies`
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
- Ask user for guidance if truly blocked </procedure>

## Getting Started

**If a specific path is provided** (file, directory, or module):

Analyze the provided path and scope the analysis to that specific area.

**If no path is provided:**

<message>
I'll analyze the entire project. If you want to focus on a specific directory, file, or module, you can provide a path:

Examples:

- `/document/dependencies packages/plugin-agents` - Analyze specific package
- `/document/dependencies src/lib` - Analyze specific directory

Proceeding with full project analysis... </message>

## Analysis Task

<procedure>
Examine the project (or the specific path provided) to identify and document all significant dependencies and their relationships.

Map all significant dependencies in the codebase, both internal and external, to
help developers understand component relationships, integration points, and
potential areas where decoupling could improve the system.

**If a specific path was provided:** Focus analysis on that path only.

**If analyzing the entire project:** Focus on:

- Internal package dependencies
- External library usage and versions
- Service integration points
- Dependency injection patterns
- Plugin or extension systems
- API clients for external services
- Module coupling and cohesion

Be sure that you are describing existing code, not hypothetical code. Some
documents are already available in `.alfred/docs/`. You can use them to
understand the codebase better. </procedure>

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

**CRITICAL**: Write your analysis to `.alfred/docs/dependencies.md` using the
Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

```markdown
# Dependencies

## Internal Dependencies Map

## External Libraries Analysis

## Service Integrations

## Dependency Injection Patterns

## Module Coupling Assessment

## Dependency Graph

## Potential Dependency Issues
```

Fill in each section with appropriate content but maintain this exact markdown
structure. The output will be directly written to a file without any processing.
This file should be easily readable by AI (will be used by AI agents only).
</template>

**CRITICAL**: Always depend on the current codebase, never read existing
documentation and assume it's correct. If the same file already exists, your
task would be to update that and bring it up to the current codebase.
