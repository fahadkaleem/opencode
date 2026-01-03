# Flow-OS: Specification-Driven Development System

> A custom AI development orchestration system for flawless implementation from specs.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Why Flow-OS](#why-flow-os)
4. [Core Philosophy](#core-philosophy)
5. [Context Engineering](#context-engineering)
6. [Architecture](#architecture)
7. [Monorepo Strategy](#monorepo-strategy)
8. [Implementation Plan](#implementation-plan)
9. [Prior Art](#prior-art)
10. [Glossary](#glossary)

---

## Executive Summary

**Flow-OS** is a custom AI development orchestration system that combines:

- **Spec-driven development** - Agree on what to build before coding
- **Role-based agents** - Specialized workers for each SDLC phase
- **Auto-loading rules** - Domain standards that inject into context automatically
- **CLAUDE.md orchestration** - Main Claude as planner/coordinator

The user interacts with a **single orchestrating Claude** that plans, generates specs, and delegates work to specialized agents. The agents follow auto-loaded rules and coding standards to produce flawless implementations.

---

## Problem Statement

### Current Pain Points

1. **Hardcoded Agents**
   - Current component-creator, component-reviewer are domain-specific
   - Not scalable - need separate agents for hooks, stores, features, etc.
   - Tightly coupled to specific file types and validation commands

2. **Manual Rule Application**
   - Agent-OS requires explicit `@agent-os/standards/...` references
   - Easy to forget, inconsistent application
   - Standards not automatically available in context

3. **No Unified Orchestration**
   - User must know which slash commands to invoke
   - No automatic recognition of intent
   - Scattered workflow across multiple commands

4. **Context Window Challenges**
   - Rules loaded at conversation start may have weak attention later
   - No reminders to check rules before implementation
   - Long conversations dilute rule influence

5. **Monorepo Complexity**
   - Rules must work across multiple packages (ui, cli, core)
   - Nested `.claude/rules/` doesn't work - only root level
   - Need path-based targeting for different packages

### What We Want

```
User: "I want to add a sidebar component"

Main Claude (Orchestrator):
├── Recognizes intent
├── Gathers requirements
├── Launches spec-writer agent → Creates spec
├── Launches implementer agent → Creates code (rules auto-load)
├── Launches reviewer agent → Validates (rules auto-load)
└── Reports results

User never invokes slash commands manually.
Agents automatically follow domain-specific rules.
Implementation is flawless and consistent.
```

---

## Why Flow-OS

### The Name

**Flow** represents:

- Flo Master (the parent product)
- Workflow automation
- Smooth, uninterrupted development flow
- Flow state for developers

### Why Not Use Existing Solutions?

| Solution               | Good At                       | Missing                                    |
| ---------------------- | ----------------------------- | ------------------------------------------ |
| **OpenSpec**           | Spec management, delta format | No implementation, no agents, no standards |
| **Agent-OS**           | Full SDLC, agents, standards  | Explicit standard refs, no auto-loading    |
| **Custom (hardcoded)** | Works for specific domains    | Not scalable, repetitive                   |

**Flow-OS** combines the best:

- OpenSpec's spec-first philosophy
- Agent-OS's SDLC structure and agents
- Claude Code's auto-loading rules (native feature)
- CLAUDE.md as the intelligent orchestrator

---

## Core Philosophy

### 1. Spec-First Development

> Agree on what to build before any code is written.

```
Spec → Tasks → Implementation → Review → Verification
```

No code without a spec. No implementation without agreed tasks.

### 2. Role-Based Agents

> Agents are workflow executors, not domain specialists.

**Wrong approach:** component-creator, hook-creator, store-creator (domain-based)

**Right approach:** spec-writer, implementer, reviewer, tester (role-based)

Domain knowledge comes from **auto-loaded rules**, not hardcoded agents.

### 3. Rules as Ground Truth

> Standards auto-load based on file paths. Agents don't need to know which rules apply.

```
Agent creates: src/components/ui/button/button.tsx
Rules auto-load: .claude/rules/ui/components.md
Agent follows loaded rules automatically.
```

### 4. Progressive Disclosure

> CLAUDE.md provides just enough context to steer, not overwhelm.

- High-level workflows in CLAUDE.md
- Detailed standards in auto-loading rules
- Implementation details in agent prompts
- Specific requirements in specs

### 5. Attention Management

> Rules loaded early may be forgotten. Agents must be reminded.

Every agent workflow includes:

```markdown
Before creating each file:

1. Check the rules loaded in your context
2. Re-read if needed (refreshes attention)
3. Create the file following rules exactly
4. Validate immediately
```

---

## Context Engineering

### What is Context Engineering?

Context engineering is the practice of carefully designing what information is available to an AI at what time. For Claude Code, this means:

1. **What rules load** - Based on `paths:` frontmatter
2. **When rules load** - When files matching paths are accessed
3. **What stays in context** - CLAUDE.md is always loaded
4. **What agents receive** - Their prompts plus auto-loaded rules

### How Auto-Loading Rules Work

Claude Code's rules system:

```markdown
# File: .claude/rules/ui/components.md

---

## paths: src/components/**/\*.tsx, src/features/**/components/\*_/_.tsx

# Component Standards

[Standards content here]
```

**Behavior:**

- Rules are in `.claude/rules/` at project root only
- Nested `.claude/rules/` in subdirectories does NOT work
- Rules auto-load when Claude reads/writes files matching `paths:`
- Once loaded, rules stay in context for the conversation
- Rules are loaded only once (not re-loaded on subsequent file access)

### The Loading Problem

```
┌─────────────────────────────────────────────────────────────┐
│ Conversation Start                                          │
│ → Rules auto-load ◄─── Strong attention here                │
├─────────────────────────────────────────────────────────────┤
│ ... 30 steps of work ...                                    │
│ ... gathering context ...                                   │
│ ... analyzing code ...                                      │
├─────────────────────────────────────────────────────────────┤
│ Step 47: Create component                                   │
│ → Rules loaded 30k tokens ago ◄─── Weak attention now       │
└─────────────────────────────────────────────────────────────┘
```

### The Solution: Remind Agents

Every agent workflow includes explicit rule-checking:

```markdown
## Workflow

For each file to create:

1. **Check context** - Review rules loaded in your context
2. **Create file** - Follow rules exactly
3. **Validate** - Run checks immediately
4. **Fix** - If validation fails, fix before proceeding
```

This "check rules before action" pattern refreshes attention.

### Context Layers

```
┌─────────────────────────────────────────────────────────────┐
│  CLAUDE.md (Always Loaded)                                  │
│  - Project overview                                         │
│  - Workflows and when to use them                           │
│  - Package structure                                        │
│  - High-level conventions                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Auto-Loading Rules (Path-Based)                            │
│  - Domain-specific standards                                │
│  - Coding conventions                                       │
│  - Examples and patterns                                    │
│  - Validation commands                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Agent Prompts (Task-Specific)                              │
│  - Role definition                                          │
│  - Workflow steps                                           │
│  - Input/output format                                      │
│  - Reminders to check rules                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Specs (Feature-Specific)                                   │
│  - Requirements                                             │
│  - Tasks                                                    │
│  - Visual designs                                           │
│  - Acceptance criteria                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Directory Structure

```
monorepo/
├── CLAUDE.md                        # Orchestrator - always loaded
│
├── flow-os/                         # Flow-OS system files
│   ├── config.yml                   # Flow-OS configuration
│   ├── product/                     # Product-level planning
│   │   └── roadmap.md
│   └── specs/                       # Feature specifications
│       └── [feature-name]/
│           ├── planning/
│           │   ├── requirements.md
│           │   └── visuals/
│           ├── spec.md
│           ├── tasks.md
│           ├── implementation/
│           └── verification/
│
│   # NOTE: No standards/ folder - we use .claude/rules/ instead
│
├── .claude/
│   ├── rules/                       # Auto-loading standards
│   │   ├── base/                    # Universal standards
│   │   │   └── coding-standards.md  # paths: packages/**/*.ts
│   │   ├── ui/                      # UI package standards
│   │   │   ├── components.md        # paths: packages/ui/**/components/**
│   │   │   ├── hooks.md             # paths: packages/ui/**/hooks/**
│   │   │   ├── stores.md            # paths: packages/ui/**/stores/**
│   │   │   └── features.md          # paths: packages/ui/**/features/**
│   │   ├── cli/                     # CLI package standards
│   │   │   └── cli-patterns.md      # paths: packages/cli/**
│   │   └── core/                    # Core package standards
│   │       └── core-patterns.md     # paths: packages/core/**
│   │
│   ├── agents/                      # Role-based agents
│   │   ├── flow-os/                 # Flow-OS agents
│   │   │   ├── spec-writer.md
│   │   │   ├── tasks-creator.md
│   │   │   ├── implementer.md
│   │   │   ├── reviewer.md
│   │   │   └── verifier.md
│   │   └── [other agents]
│   │
│   └── commands/                    # Slash commands
│       └── flow-os/
│           ├── create-spec.md
│           ├── implement.md
│           └── verify.md
│
└── packages/                        # Monorepo packages
    ├── ui/
    │   ├── CLAUDE.md                # UI-specific context
    │   └── src/
    ├── cli/
    │   ├── CLAUDE.md                # CLI-specific context
    │   └── src/
    └── core/
        ├── CLAUDE.md                # Core-specific context
        └── src/
```

### CLAUDE.md Structure

```markdown
# [Project Name]

## Overview

[Brief project description]

## Packages

- packages/ui - Frontend (React, TypeScript, Tailwind)
- packages/cli - CLI tool
- packages/core - Shared core logic

## Flow-OS Integration

This project uses Flow-OS for spec-driven development.

### When to Create a Spec

- New features or capabilities
- Breaking changes
- Architecture changes
- Performance/security updates

### When to Skip Spec

- Bug fixes (restoring intended behavior)
- Typos, formatting, comments
- Dependency updates (non-breaking)
- Configuration changes

### Automatic Workflows

When user wants to create a new feature:

1. Gather requirements through conversation
2. Launch spec-writer agent → Creates spec
3. Review spec with user → Iterate until approved
4. Launch implementer agent → Creates code
5. Launch reviewer agent → Validates against rules
6. Launch verifier agent → End-to-end verification
7. Report results

When user wants to review existing code:

1. Launch reviewer agent
2. Report findings

### Implementation Standards

Rules auto-load based on file paths:

- `packages/ui/**/components/**` → UI component rules
- `packages/ui/**/hooks/**` → Hook rules
- `packages/cli/**` → CLI patterns
- All files → Base coding standards

Agents automatically receive relevant rules. No manual attachment needed.

## Commands

[Standard commands like npm run dev, test, etc.]
```

### Agent Structure

Each agent follows this template:

```markdown
---
name: [agent-name]
description: [When to use this agent]
tools: [Available tools]
model: [Model to use]
---

# [Agent Name] Agent

[Role description - 1-2 sentences]

## Inputs

You will receive:

- [input 1]
- [input 2]

## Workflow

1. **[Step 1]**
   - [Details]

2. **[Step 2]**
   - [Details]
   - Before creating files: Check rules in your context

3. **[Step 3]**
   - [Details]

## Important

- Rules auto-load based on file paths - follow them exactly
- Before each file creation, check rules in your context
- Validate after each major step
- If validation fails, fix before proceeding

## Output Format

[What to return when complete]
```

### Rule Structure

Each rule follows this template:

````markdown
---
paths: [glob patterns]
---

# [Domain] Standards

> [One-line description]

## Context

[Why these standards exist]

## Do

- [Required practices]

## Don't

- [Anti-patterns]

## When

- WHEN [situation] → [action]

## Validation

```bash
[Commands to validate]
```
````

## Example

[One complete, comprehensive example]

```

---

## Monorepo Strategy

### The Constraint

Claude Code rules only load from **project root** `.claude/rules/`.

Nested `.claude/rules/` in packages does NOT work:
```

packages/ui/.claude/rules/ ← Does NOT auto-load
packages/cli/.claude/rules/ ← Does NOT auto-load

````

### The Solution

Use **path-based targeting** from root:

```markdown
# .claude/rules/ui/components.md
---
paths: packages/ui/src/components/**/*.tsx, packages/ui/src/features/**/components/**/*.tsx
---
````

### Monorepo Rule Organization

```
.claude/rules/
├── base/
│   └── coding-standards.md      # paths: packages/**/*.ts
├── ui/
│   ├── components.md            # paths: packages/ui/**/components/**
│   ├── hooks.md                 # paths: packages/ui/**/hooks/**
│   └── stores.md                # paths: packages/ui/**/stores/**
├── cli/
│   └── cli-patterns.md          # paths: packages/cli/**
└── core/
    └── core-patterns.md         # paths: packages/core/**
```

### Package-Level CLAUDE.md

Each package can have its own CLAUDE.md for package-specific context:

```
packages/
├── ui/
│   └── CLAUDE.md                # UI-specific: React patterns, design system
├── cli/
│   └── CLAUDE.md                # CLI-specific: Command patterns, UX
└── core/
    └── CLAUDE.md                # Core-specific: Shared logic patterns
```

These provide context but don't replace auto-loading rules.

---

## Implementation Plan

### Phase 1: Rebrand Agent-OS to Flow-OS + Strip Standards

**Goal:** Rename and remove useless standards

**Tasks:**

1. Rename `agent-os/` folder to `flow-os/`
2. **Delete `flow-os/standards/` entirely** - These are generic boilerplate with no value
3. Rename `.claude/agents/agent-os/` to `.claude/agents/flow-os/`
4. Rename `.claude/commands/agent-os/` to `.claude/commands/flow-os/`
5. Update all path references in agents from `agent-os/` to `flow-os/`
6. Update `config.yml` branding
7. Test that everything still works

### Phase 2: Update Agents to Use Auto-Loading Rules

**Goal:** Replace explicit standard references with auto-loading pattern

**Agents to update (6 total):**

- `implementer.md`
- `spec-writer.md`
- `spec-shaper.md`
- `spec-verifier.md`
- `tasks-list-creator.md`
- `product-planner.md`

**For each agent, replace this:**

```markdown
## User Standards & Preferences Compliance

IMPORTANT: Ensure that ... as detailed in the following files:

@agent-os/standards/backend/api.md
@agent-os/standards/frontend/components.md
... (15 explicit file references)
```

**With this:**

```markdown
## Standards Compliance

Rules auto-load from `.claude/rules/` based on file paths you touch.

Before creating or modifying each file:

1. Check the rules loaded in your context
2. Follow those rules exactly
3. Validate: `npm run check-types && npm run lint`

You don't need to explicitly read rules - they auto-load when you work with files matching their paths.
```

**Why this works:**

- We already have excellent rules in `.claude/rules/frontend/` (components, hooks, stores, etc.)
- These rules are detailed, project-specific, with examples
- They auto-load based on file paths
- No need to migrate agent-os/standards - they were generic and useless

### Phase 3: Simplify Agents

**Goal:** Make agents generic and role-based

**Tasks:**

1. Review each agent for hardcoded domain specifics
2. Update spec-writer to use specs, not hardcoded templates
3. Update implementer to follow spec-defined files
4. Update reviewer to check against auto-loaded rules
5. Add consistent "check rules before action" patterns
6. Test with different domains (component, hook, store)

### Phase 4: Update CLAUDE.md Orchestration

**Goal:** Main Claude automatically uses Flow-OS workflow

**Tasks:**

1. Add "Automatic Workflows" section to CLAUDE.md
2. Define intent patterns (when to create spec, when to implement, etc.)
3. Add guidance on agent delegation
4. Test that Claude recognizes intent and follows workflow

### Phase 5: Prepare for Monorepo

**Goal:** Rules work across packages

**Tasks:**

1. Update rule paths for `packages/ui/`, `packages/cli/`, `packages/core/`
2. Create package-level CLAUDE.md files
3. Test rules load correctly for each package
4. Document the monorepo structure

### Phase 6: Test and Iterate

**Goal:** Validate the complete flow

**Tasks:**

1. Test complete workflow: spec → implement → review → verify
2. Test with different artifact types (component, hook, store, CLI command)
3. Gather feedback
4. Iterate on pain points

---

## Prior Art

### OpenSpec

**Repository:** github.com/Fission-AI/OpenSpec

**What It Does:**

- Spec-driven development workflow
- Delta format (ADDED/MODIFIED/REMOVED)
- CLI validation and archiving
- Single AGENTS.md instruction file

**What We Take:**

- Spec-first philosophy
- Potentially delta format for change tracking
- Simple, focused approach

**What We Don't Take:**

- No implementation support
- No auto-loading rules

### Agent-OS

**What It Does:**

- Full SDLC workflow
- Role-based agents (spec-writer, implementer, verifier)
- Standards organized by domain (but generic/useless content)
- Orchestration via commands

**What We Take:**

- Agent structure and roles
- SDLC workflow (shape → write → tasks → implement → verify)
- Spec folder structure
- Command structure

**What We DON'T Take:**

- `agent-os/standards/` folder - Generic boilerplate, no value
- Explicit `@standards/` references in agents - Replaced with auto-loading

**What We Modify:**

- Explicit `@standards/` → Auto-loading rules from `.claude/rules/`
- Hardcoded patterns → Generic agents
- Command-based orchestration → CLAUDE.md orchestration
- Agent workflows → Add "check rules in context" reminders

**Why We Delete Standards:**

The agent-os standards are just generic software engineering principles:

```markdown
- **Single Responsibility**: Each component should have one clear purpose
- **Reusability**: Design components to be reused
```

Our `.claude/rules/` are actually useful:

```markdown
## Rules for Shared UI Components

| Requirement | Rule |
| forwardRef | REQUIRED for UI primitives |
| Spread Props | REQUIRED {...props} |

[+ complete code examples, validation commands, etc.]
```

We already have detailed, project-specific rules. Agent-OS standards add zero value.

### Claude Code Native Features

**Auto-Loading Rules:**

- `.claude/rules/` at project root
- `paths:` frontmatter for targeting
- Loads when files matching paths are accessed
- Stays in context for conversation

**CLAUDE.md:**

- Always loaded for every conversation
- Project-level context and instructions

**Agents:**

- Subprocesses with their own context
- Tools access based on agent definition
- Can be launched via Task tool

---

## Existing Rules (What We Already Have)

We already have excellent, detailed rules in `.claude/rules/frontend/`. These are what agents will use.

### Current Rule Structure

```
.claude/rules/frontend/
├── docs/reference/
│   └── BULLETPROOF_REFERENCE.md     # Architecture reference (always loaded)
├── shared/
│   ├── components/
│   │   ├── component.md             # paths: src/components/ui/**/*.tsx
│   │   ├── component-test.md        # paths: src/components/ui/**/*.test.tsx
│   │   └── story.md                 # paths: src/components/ui/**/*.stories.tsx
│   └── hooks/
│       ├── hook.md                  # paths: src/hooks/use-*.ts
│       └── hook-test.md             # paths: src/hooks/use-*.test.ts
├── features/
│   ├── feature-module.md            # paths: src/features/**/*
│   ├── components/
│   │   ├── component.md             # paths: src/features/**/components/**/*.tsx
│   │   ├── component-test.md
│   │   └── story.md
│   ├── hooks/
│   │   ├── hook.md
│   │   └── hook-test.md
│   ├── stores/
│   │   ├── store.md                 # paths: src/features/**/stores/*-store.ts
│   │   └── store-test.md
│   ├── api/
│   │   ├── api.md                   # paths: src/features/**/api/**/*.ts
│   │   └── api-test.md
│   ├── config/
│   │   └── config.md                # paths: src/features/**/config/**/*.ts
│   └── types/
│       └── types.md                 # paths: src/features/**/types/**/*.ts
├── data-fetching.md                 # TanStack Query patterns (always loaded)
└── theming.md                       # Design tokens (auto-loads for styling)
```

### Rule Quality

Each rule includes:

- **Context** - Why these standards exist
- **File Structure** - Expected folder/file organization
- **Naming Conventions** - Tables with patterns and examples
- **Do/Don't/When** - Clear rules with rationale
- **Validation Commands** - How to verify compliance
- **Complete Example** - Full working code

Example from `component.md`:

```markdown
## Rules for Shared UI Components

| Requirement      | Rule     | Reason                                 |
| ---------------- | -------- | -------------------------------------- |
| **forwardRef**   | REQUIRED | Enables composition and ref forwarding |
| **Spread Props** | REQUIRED | Maximum flexibility for consumers      |

## Do

- Use CVA when component has 2+ visual variants
- Use semantic tokens from THEMING.md

## Don't

- Default exports → Use named exports
- Raw colors → Use semantic tokens

[+ 100-line complete Button component example]
```

### Rules We May Need to Add

For monorepo, we'll need:

- `.claude/rules/base/coding-standards.md` - Universal standards
- `.claude/rules/cli/cli-patterns.md` - CLI-specific patterns
- `.claude/rules/core/core-patterns.md` - Shared logic patterns

These will be created when we port to the monorepo structure.

---

## Glossary

| Term                    | Definition                                         |
| ----------------------- | -------------------------------------------------- |
| **Flow-OS**             | The custom AI development orchestration system     |
| **Spec**                | A specification document defining what to build    |
| **Agent**               | A specialized AI subprocess for a specific task    |
| **Rule**                | An auto-loading standard based on file paths       |
| **Orchestrator**        | Main Claude that coordinates agents                |
| **SDLC**                | Software Development Life Cycle                    |
| **Context Engineering** | Designing what information AI receives when        |
| **Auto-Loading**        | Rules that inject into context based on file paths |
| **Delta**               | Changes expressed as ADDED/MODIFIED/REMOVED        |
| **Path Targeting**      | Using glob patterns to specify when rules apply    |

---

## Next Steps

1. **Read this document** - Ensure alignment on vision
2. **Phase 1** - Rebrand agent-os to flow-os
3. **Iterate** - Make changes incrementally, test as we go

---

## Changelog

| Version | Date       | Changes                                                          |
| ------- | ---------- | ---------------------------------------------------------------- |
| 0.2.0   | 2024-12-21 | Clarified: delete agent-os/standards, use existing .claude/rules |
| 0.1.0   | 2024-12-21 | Initial document                                                 |

---

_Last updated: 2024-12-21_
_Version: 0.2.0_
