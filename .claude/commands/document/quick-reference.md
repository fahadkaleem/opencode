---
description:
  Generate a 1-page quick reference cheat sheet for rapid AI agent orientation
model: sonnet
---

# Quick Reference

You are an expert technical writer specializing in creating concise, scannable
reference documentation. Focus on extracting the most critical facts that an AI
agent needs to orient themselves to a codebase in under 60 seconds.

Task: Create a comprehensive quick reference guide that serves as the first
document an AI agent reads when encountering this codebase.

## What to Include

- Synthesize information from existing documentation and codebase analysis
- Focus on actionable facts: what files to modify, what commands to run, what
  patterns to follow
- Prioritize information by frequency of use and criticality
- Keep each section scannable (bullets, short paragraphs, no walls of text)
- Return the final response in Markdown format using the structure specified in
  the user prompt
- Include commands that will be commonly used (build, lint, test, run single
  test)
- Focus on "big picture" architecture that requires reading multiple files to
  understand
- Include important parts from README.md if it exists
- Include project-specific glossary terms that appear frequently in the codebase

## What NOT to Include

- **Do not repeat yourself** - keep information dense and avoid redundancy
- **Do not include obvious instructions** like "Provide helpful error messages",
  "Write unit tests", "Never include sensitive information (API keys, tokens)"
- **Do not list every component or file** - avoid exhaustive file structure
  listings that can be easily discovered with ls or tree commands
- **Do not include generic development practices** - skip universal advice like
  "use meaningful variable names", "write clean code", etc.
- **Do not make up information** - if you don't find specific commands,
  patterns, or gotchas in the code/docs, don't invent generic ones
- **Do not add sections about "Common Development Tasks", "Tips for
  Development", or "Support and Documentation"** unless this information is
  expressly included in existing files
- **Do not write conversational fluff** - skip phrases like "This is a great
  project", "You should be careful", etc.

## Workflow

This is a synthesis task requiring reading existing documentation and extracting
key facts. Use TodoWrite to create a structured task list.

<procedure>
**STEP 1: Create your todo list immediately** using the TodoWrite tool with these tasks:

1. **Setting up analysis** (activeForm: "Setting up analysis")
   - Read complete task requirements from this slash command
   - Check for existing context files: README.md, CLAUDE.md, .cursor/rules/,
     .cursorrules, .github/copilot-instructions.md
   - Check for existing `.alfred/docs/quick-reference.md` (if exists, you're
     updating it)
   - Understand project type and technology stack

2. **Initial codebase exploration** (activeForm: "Performing initial codebase
   exploration")
   - Identify project type from package.json / go.mod / pom.xml /
     requirements.txt
   - Identify main entry points (bin/, cmd/, src/main.\*, etc.)
   - Map key directories (src/, lib/, pkg/, commands/, controllers/, etc.)
   - Scan README.md for project overview and quick start
   - Identify build system (package.json scripts, Makefile, build.gradle, etc.)

3. **Extract tech stack details** (activeForm: "Extracting tech stack details")
   - Parse package manager files for language, versions, runtime requirements
   - Identify framework from dependencies or imports
   - Determine project type (CLI, API, library, service, webapp)
   - Map module/package structure

4. **Project Identity section** (activeForm: "Writing Project Identity section")
   - Reference Output Instructions template section "Project Identity"
   - Name, purpose, language, framework, package manager, key versions

5. **File Structure section** (activeForm: "Writing File Structure section")
   - Reference Output Instructions template section "File Structure"
   - Critical paths that developers modify most frequently

6. **Common Patterns section** (activeForm: "Writing Common Patterns section")
   - Reference Output Instructions template section "Common Patterns"
   - Code patterns that appear throughout (base classes, validation, error
     handling)

7. **Most Common Commands/Operations section** (activeForm: "Writing Common
   Commands section")
   - Reference Output Instructions template section "Most Common Commands"
   - Commands/API calls used most frequently

8. **Quick Start section** (activeForm: "Writing Quick Start section")
   - Reference Output Instructions template section "Quick Start for
     Development"
   - Minimal steps to get started (install, build, run)

9. **Critical Gotchas section** (activeForm: "Writing Critical Gotchas section")
   - Reference Output Instructions template section "Critical Gotchas"
   - Things that will break if not done correctly

10. **Environment/Config section** (activeForm: "Writing Environment section")
    - Reference Output Instructions template section "Environment Management"
    - How to configure, where config lives

11. **Testing section** (activeForm: "Writing Testing section")
    - Reference Output Instructions template section "Testing"
    - How to run tests, coverage requirements

12. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all sections present and filled
    - Verify document is concise (target: 200-400 lines)
    - Verify document starts with `# Quick Reference` heading only
    - Verify NO conversational preamble exists
    - Verify all facts are verifiable from code or existing docs
    - Verify NO obvious/generic development advice included
    - Verify NO exhaustive file listings (only high-value paths)
    - Verify NO made-up commands, patterns, or gotchas
    - Verify NO repetitive information
    - If ANY verification fails: DO NOT proceed, fix issues first

13. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/quick-reference.md`
    - Content must be PURE MARKDOWN starting with `# Quick Reference`
    - No preamble, no "Here is...", no explanations

**STEP 2: Execute todos sequentially**

- Mark todo as `in_progress` BEFORE starting work
- Complete the work described in the todo
- Mark todo as `completed` IMMEDIATELY after finishing
- Move to next todo
- IMPORTANT: Only ONE todo should be `in_progress` at any time

**STEP 3: Handle errors/blockers**

- If you cannot complete a todo, keep it as `in_progress`
- Create a new todo describing what needs resolution
- Never mark todo as completed if work is incomplete
- Ask user for guidance if truly blocked </procedure>

## Context Awareness

Before beginning analysis, check for and incorporate information from:

- **README.md** - Project overview, quick start commands, setup instructions
- **CLAUDE.md** - Existing Claude Code guidance (incorporate important parts)
- **.cursor/rules/** or **.cursorrules** - Cursor AI rules (incorporate
  important patterns/constraints)
- **.github/copilot-instructions.md** - GitHub Copilot rules (incorporate
  important patterns/constraints)
- **Existing .alfred/docs/quick-reference.md** - If it exists, you're updating
  it to reflect current codebase state

Extract the non-obvious, project-specific information from these files. Skip
generic advice that would apply to any project.

## Getting Started

**If a specific path is provided** (file, directory, or module):

Analyze the provided path and scope the analysis to that specific area.

**If no path is provided:**

<message>
I'll analyze the entire project. If you want to focus on a specific directory, file, or module, you can provide a path:

Examples:

- `/document/quick-reference packages/plugin-agents` - Analyze specific package
- `/document/quick-reference src/lib` - Analyze specific directory

Proceeding with full project analysis... </message>

## Analysis Task

<procedure>
Create a quick reference guide by analyzing the codebase directly:

1. **Identify project fundamentals** from package files, README, entry points
2. **Map critical paths** by scanning directory structure (focus on frequently
   modified files, not exhaustive listings)
3. **Extract common patterns** from code analysis (project-specific patterns,
   not universal best practices)
4. **Document operational commands** from build scripts and README examples
   (actual commands found in files, not assumed ones)

**Quality Guidelines:**

- Every fact must be verifiable from the actual codebase or existing
  documentation
- Focus on high-value, hard-to-discover information (not things easily found
  with ls or grep)
- Prioritize information by frequency of use and criticality
- Keep information dense - no repetition, no generic advice, no conversational
  padding

Focus on answers to these questions:

**Orientation Questions:**

- What is this project? (name, purpose, tech stack)
- Where are the most frequently modified files?
- What are the core patterns I need to follow?
- How do I get started developing?

**Operational Questions:**

- What commands do I run most often?
- What are the critical gotchas that will break things?
- Where is configuration stored?
- How do I test my changes?

**Output Quality Standards:**

- Be concise but comprehensive. Target length: 200-400 lines
- Every fact should be immediately actionable
- No obvious instructions (e.g., "write tests", "use meaningful names")
- No exhaustive file listings - only high-impact paths
- No generic development practices that apply to all projects
- No made-up information - only verifiable facts from code/docs
- No repetition or redundancy </procedure>

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

**CRITICAL**: Write your analysis to `.alfred/docs/quick-reference.md` using the
Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. The
file content requirements:

- **Start with heading only**: First line must be `# Quick Reference`
- **No conversational preamble**: Do NOT include "Here is...", "I've
  created...", or any meta-commentary
- **No explanations about the task**: Skip "This document provides..." type
  introductions
- **Pure content only**: Write as if you're writing the final published document
- **Verifiable facts only**: Every piece of information must be traceable to
  actual code or documentation

<template>
The markdown must follow this EXACT structure:

````markdown
# Quick Reference

## Project Identity

- **Name**: [Project name]
- **Purpose**: [One sentence description]
- **Language**: [Primary language]
- **Framework**: [Main framework/library]
- **Package Manager**: [npm, go modules, maven, etc.]
- **Node/Runtime Version**: [Required version]
- **Main Entry**: [Entry point file]
- **Config Location**: [Where config files live]

## File Structure (Critical Paths)

List the most frequently modified directories/files:

- **[Path]**: [What lives here]
- **[Path]**: [What lives here]

Example:

- `src/commands/`: CLI command definitions
- `src/lib/`: Business logic
- `test/`: Test files mirroring src/

## Common Patterns

Patterns that appear throughout the codebase:

- **[Pattern name]**: [Description and example]
- **[Pattern name]**: [Description and example]

Example:

- **Commands extend BaseCommand**: All commands inherit from base class
- **Validation first**: Use Zod schemas before any operation
- **Dual output**: Support --format json|text

## Most Common Commands/Operations

List the most frequently used commands, API calls, or operations:

```bash
[command]  # Description
[command]  # Description
```
````

Example:

```bash
npm run build  # Compile TypeScript
atlas help     # Show available commands
npm test       # Run test suite
```

## Quick Start for Development

Minimal steps to get started:

```bash
1. [Step]
2. [Step]
3. [Step]
```

Example:

```bash
1. npm install
2. npm run build
3. npm link
4. atlas --version
```

## Critical Gotchas

Things that will break if not done correctly:

- **[Gotcha]**: [Why it breaks and how to fix]
- **[Gotcha]**: [Why it breaks and how to fix]

Example:

- **MUST use .js extension in imports**: ESM requires explicit extensions
- **Production database blocked**: CLI prevents prod DB access by design
- **Build before test**: Tests run against compiled dist/ not src/

## Environment Management

How to configure and manage environment:

- **Config**: [Where config lives]
- **Set environment**: [How to change env]
- **Check config**: [How to view current config]

Example:

- **Config**: `.env` file (gitignored)
- **Set environment**: `atlas config env set dev`
- **Check config**: `atlas config show`

## Testing

How to run tests and requirements:

```bash
[test command]      # Description
[coverage command]  # Description
```

- **Coverage required**: [Coverage threshold]
- **Test location**: [Where tests live]

Example:

```bash
npm test           # Run all tests
npm run coverage   # Generate coverage report
```

- **Coverage required**: 80% minimum
- **Test location**: `test/` directory mirrors `src/`

```

Fill in each section with appropriate content but maintain this exact markdown structure. Keep total length to 200-400 lines. Focus on high-frequency, high-criticality information.

The output will be directly written to a file without any processing. This file should be easily readable by AI (will be used by AI agents only).
</template>

**CRITICAL**: Always depend on the current codebase only. Do NOT read existing documentation in `.alfred/docs/` - analyze the code directly. Extract facts from:
1. package.json / go.mod / pom.xml / requirements.txt (tech stack)
2. README.md (project overview, quick start)
3. Directory structure (key paths)
4. Build scripts and Makefiles (common commands)
5. Entry point files (bin/, cmd/, src/main.*)
6. Code patterns (base classes, validation, imports)

If the same file already exists, your task is to update it to reflect the current state of the codebase.
```
