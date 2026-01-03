# AI-Driven Design

> Rethinking how we structure design documentation for AI-assisted development.

## The Problem

### Current State

Our design documentation follows traditional software architecture patterns:

- High-level requirements (HLRs) in one place
- Functional requirements (FRs) in another
- Architecture decisions (ADRs) separately
- Interface contracts in detailed markdown documents
- Cross-references everywhere (FR-AM-045, ADR-008, etc.)

This structure was designed for human teams doing waterfall-style handoffs. It doesn't work well for AI-assisted development.

### Pain Points

1. **Scattered Context**
   - To understand one component, you need to read 3-4 documents
   - Requirements reference contracts reference decisions
   - AI agents lose context jumping between files

2. **Cascading Changes**
   - Updating one requirement means updating contracts, ADRs, and implementation
   - Easy to have inconsistencies across documents
   - No single source of truth

3. **Not Executable**
   - Documents describe what to build, not how to verify it's built correctly
   - Gap between specification and implementation
   - Tests are an afterthought

4. **Context Window Inefficiency**
   - Large contract documents (2000+ lines) burn through context
   - Most of the content isn't relevant to the current task
   - AI has to process everything to find what it needs

5. **Coarse-Grained Tasks**
   - "Implement AgentExecutor" is a project, not a task
   - No natural breakdown into atomic, testable units
   - Hard to track progress or parallelize work

## The Intent

We want a design approach that:

1. **Colocates context with code**
   - Design information lives where it's needed
   - AI automatically gets relevant context when working on a module

2. **Has a single source of truth**
   - No duplication across documents
   - Changes happen in one place
   - Easy to verify consistency

3. **Is executable**
   - Specifications can be tested
   - Tests can be written before implementation
   - Clear definition of "done"

4. **Is context-efficient**
   - Only load what's needed for the current task
   - Small, focused documents
   - Progressive disclosure (summary → details)

5. **Enables atomic tasks**
   - Work can be broken into small, independent units
   - Each task is testable in isolation
   - Clear dependencies between tasks

## Ideas To Explore

### CLAUDE.md Files

Claude Code automatically loads `CLAUDE.md` files from directories it's working in. This could be leveraged to:

- Provide module-specific context automatically
- Keep design documentation close to implementation
- Distribute context across the codebase

### Types as Contracts

TypeScript interfaces with JSDoc could serve as the specification:

- Types are always in sync with implementation (same language)
- JSDoc provides documentation inline
- Compiler enforces the contract
- No separate contract document to maintain

### Scaffolding with TODOs

Implementation files could be created upfront with:

- Class structure defined
- Method signatures in place
- TODO comments marking what needs implementation
- Each TODO becomes a task

### Test-Driven Development

Tests could be written before implementation:

- Tests define expected behavior
- Tests serve as executable specification
- Implementation is "done" when tests pass
- No ambiguity about requirements

### Atomic Task Breakdown

Components could be broken into very small tasks:

- Each task is ~30-100 lines of code
- Each task has clear inputs and outputs
- Each task can be reviewed in minutes
- Tasks can be tracked in Linear/Jira

## Questions To Consider

1. What's the right granularity for CLAUDE.md files? Per module? Per class?

2. How do we handle cross-cutting concerns that span multiple modules?

3. Where do high-level architectural decisions live?

4. How do we maintain consistency between CLAUDE.md files and types.ts?

5. What belongs in design documents vs. in code?

6. How do we handle the existing design documentation? Archive? Migrate? Delete?

7. What's the minimum viable structure to start building?

8. How do we make this work well for live streaming development?

## Related Considerations

- This approach assumes AI assistance is central to development
- Works best with TypeScript (types as documentation)
- May not suit all project types or team sizes
- Trade-off between upfront scaffolding effort and implementation speed

---

_This document captures intent, not prescription. The specific structure and implementation should emerge from experimentation._
