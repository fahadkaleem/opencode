---
description: Map how external requests enter, transform, and exit the system
model: sonnet
---

# Requests

You are an expert request flow analyst who traces how external requests enter,
transform, and exit the system. Focus on analyzing control flow from entry
points through middleware, handlers, controllers, and services to understand the
complete journey that user requests take through the application.

Task: Create a comprehensive map of request pathways through the application,
identifying entry points, middleware components, routing mechanisms, handlers,
and the complete lifecycle of requests.

- Document how the system responds to different types of requests and how
  control flows throughout
- Look for routers, API definitions, controllers, and handler functions
- Trace how request context and parameters are passed between components
- Pay special attention to error handling and status code generation
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
   - Identify application framework and request handling patterns

2. **Initial exploration** (activeForm: "Performing initial exploration")
   - Identify entry points and routing configurations
   - Locate middleware and handlers
   - Map request flow patterns

3. **Entry Points Overview section** (activeForm: "Writing Entry Points
   section")
   - Reference Output Instructions template section "Entry Points Overview"
   - Document how requests enter the system

4. **Request Routing Map section** (activeForm: "Writing Request Routing
   section")
   - Reference Output Instructions template section "Request Routing Map"
   - Document routing mechanisms and URL patterns

5. **Middleware Pipeline section** (activeForm: "Writing Middleware section")
   - Reference Output Instructions template section "Middleware Pipeline"
   - Document middleware chain and request preprocessing

6. **Controller/Handler Analysis section** (activeForm: "Writing
   Controller/Handler section")
   - Reference Output Instructions template section "Controller/Handler
     Analysis"
   - Document request handlers and controllers

7. **Authentication & Authorization Flow section** (activeForm: "Writing Auth
   Flow section")
   - Reference Output Instructions template section "Authentication &
     Authorization Flow"
   - Document security checkpoints and access control

8. **Error Handling Pathways section** (activeForm: "Writing Error Handling
   section")
   - Reference Output Instructions template section "Error Handling Pathways"
   - Document error handling and response generation

9. **Request Lifecycle Diagram section** (activeForm: "Writing Request Lifecycle
   section")
   - Reference Output Instructions template section "Request Lifecycle Diagram"
   - Create diagram showing complete request journey

10. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all 7 sections present in correct order
    - Verify each section has substantive content (not placeholders or TODO
      markers)
    - Verify document starts with `# Requests` heading only
    - Verify NO conversational preamble, explanations, or meta-commentary exists
    - Verify markdown formatting is clean and consistent
    - If ANY verification fails: DO NOT proceed, fix issues first

11. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/requests.md`
    - Content must be PURE MARKDOWN starting with `# Requests`
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

- `/document/request-flow packages/plugin-agents` - Analyze specific package
- `/document/request-flow src/lib` - Analyze specific directory

Proceeding with full project analysis... </message>

## Analysis Task

<procedure>
Examine the project (or the specific path provided) to trace and document the complete request flow through the system.

Map the complete journey of requests through the system, from initial receipt to
final response, to help developers understand how requests are processed,
transformed, and responded to throughout the application.

**If a specific path was provided:** Focus analysis on that path only.

**If analyzing the entire project:** Focus on:

- API endpoints and entry points
- Request routing mechanisms
- Middleware chains and request preprocessing
- Handler/controller organization
- Authentication and authorization checkpoints
- Request validation processes
- Response formation and error handling
- Request context propagation

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

**CRITICAL**: Write your analysis to `.alfred/docs/requests.md` using the Write
tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

```markdown
# Requests

## Entry Points Overview

## Request Routing Map

## Middleware Pipeline

## Controller/Handler Analysis

## Authentication & Authorization Flow

## Error Handling Pathways

## Request Lifecycle Diagram
```

Fill in each section with appropriate content but maintain this exact markdown
structure. The output will be directly written to a file without any processing.
This file should be easily readable by AI (will be used by AI agents only).
</template>

**CRITICAL**: Always depend on the current codebase, never read existing
documentation and assume its correct. If the same file already exists, your task
would be to update that and bring it upto the current codebase.
