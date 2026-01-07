# TASK-11: Workflow JSON File Loading

## Overview

Enable users to define workflows as JSON files in `.flomaster/workflows/` that FloMaster can discover, validate, and execute. This implements **HL-WF-002 (Declarative Workflow Definitions)** and **HL-CF-001 (Global and Per-Step Configuration)** from the requirements.

## Problem Statement

Currently, workflows are hardcoded as TypeScript objects in `packages/flomaster/src/orchestrator/workflows/`. Users cannot:
- Create custom workflows without modifying source code
- Share workflows via version control
- Discover available workflows via CLI

The existing in-memory registry in `workflow.ts:21-25` maps workflow names to hardcoded imports:
```typescript
const workflows: Record<string, { workflow: WorkflowData; inputNodeId: string; outputNodeId: string }> = {
  test: { workflow: testWorkflow, inputNodeId: "input-1", outputNodeId: "agent-1" },
  research: { workflow: researchWorkflow, inputNodeId: "input-1", outputNodeId: "research-1" },
  sdlc: { workflow: sdlcWorkflow, inputNodeId: "input", outputNodeId: "review" },
}
```

## Requirements

### Functional Requirements

1. **File Storage**: Workflows stored in `.flomaster/workflows/*.json` at project root
2. **Simple Format**: User-friendly JSON schema that converts to React Flow format internally
3. **Metadata**: Required `name` and `description` fields for discovery
4. **Defaults**: Workflow-level defaults that steps inherit (agent, timeout, retries)
5. **Dependencies**: Explicit `depends_on` array for step ordering
6. **Validation**: Strict validation at load time including interpolation reference checking
7. **Discovery**: CLI commands to list, inspect, and validate workflows
8. **Migration**: Convert existing TypeScript workflows to JSON format

### Non-Functional Requirements

- **NFR-USE-001**: JSON files readable with standard Unix tools
- **NFR-MNT-002**: Text-based, meaningful diffs in version control
- **NFR-MNT-003**: Validation errors include file/line details

## Traceability

| Requirement | Description | This Task |
|-------------|-------------|-----------|
| HL-WF-002 | Declarative Workflow Definitions | Simple JSON format with metadata |
| HL-CF-001 | Global and Per-Step Configuration | Defaults section + step overrides |
| HL-CF-002 | Command Template System | Step prompts with `{{stepId.output}}` |
| NFR-USE-001 | Inspectable State | JSON files in `.flomaster/workflows/` |

## Scope

### In Scope

- Simple workflow JSON schema design
- Workflow file loader (`loadWorkflow()`, `discoverWorkflows()`)
- Simple format → React Flow format converter
- Zod schema for validation
- CLI updates (`workflow list`, `workflow run`, `workflow validate`, `workflow inspect`)
- Migration of `sdlc-workflow.ts`, `research-workflow.ts`, `test-workflow.ts` to JSON
- Strict validation of `{{stepId.output}}` references at load time

### Out of Scope

- Visual workflow editor (Phase 2 - HL-UI-006)
- SubFlow composition (deferred - keep simple)
- Human approval gates (HL-WF-007 - separate task)
- Output schema validation (HL-VL-001 - separate task)
- Conditional step syntax documentation (separate task)
- Loop step parallel execution (separate task)

## Simple Workflow JSON Schema

```typescript
type WorkflowFile = {
  // Required metadata
  name: string              // Unique identifier (e.g., "sdlc")
  description: string       // Human-readable description

  // Optional workflow-level defaults
  defaults?: {
    agent?: string          // Default agent (e.g., "build")
    timeout_ms?: number     // Default timeout (default: 300000)
    max_retries?: number    // Default retries (default: 3)
    model?: string          // Default model
  }

  // Steps array
  steps: StepDefinition[]
}

type StepDefinition = {
  id: string                // Unique step ID
  type: "agent" | "input" | "output" | "conditional" | "loop"
  name: string              // Display name
  depends_on?: string[]     // Dependencies (empty = entry point)

  // Type-specific config (flat structure)
  agent?: string            // For agent steps
  prompt?: string           // Prompt with {{stepId.output}} interpolation
  system_prompt?: string    // Additional system prompt
  timeout_ms?: number       // Override default
  max_retries?: number      // Override default
  model?: string            // Override default
}
```

## Example Workflow

```json
{
  "name": "sdlc",
  "description": "Full software development lifecycle: research → plan → implement → review",

  "defaults": {
    "agent": "build",
    "timeout_ms": 300000,
    "max_retries": 3
  },

  "steps": [
    {
      "id": "input",
      "type": "input",
      "name": "Task Input"
    },
    {
      "id": "research",
      "type": "agent",
      "name": "Research Codebase",
      "depends_on": ["input"],
      "agent": "research-agent",
      "prompt": "Research the codebase for: {{input.prompt}}",
      "timeout_ms": 180000,
      "max_retries": 1
    },
    {
      "id": "plan",
      "type": "agent",
      "name": "Create Implementation Plan",
      "depends_on": ["research"],
      "agent": "plan-agent",
      "prompt": "Based on the research:\n\n{{research.response}}\n\nCreate a plan for: {{input.prompt}}",
      "timeout_ms": 120000,
      "max_retries": 2
    },
    {
      "id": "implement",
      "type": "agent",
      "name": "Implement Changes",
      "depends_on": ["plan"],
      "prompt": "Implement the following plan:\n\n{{plan.response}}",
      "timeout_ms": 300000,
      "max_retries": 3
    },
    {
      "id": "review",
      "type": "agent",
      "name": "Review Implementation",
      "depends_on": ["implement"],
      "agent": "review-agent",
      "prompt": "Review:\n\n{{implement.response}}\n\nPlan: {{plan.response}}",
      "timeout_ms": 120000,
      "max_retries": 1
    }
  ]
}
```

## Validation Rules

| Rule | Error Message |
|------|---------------|
| `name` required | "Workflow missing required 'name' field" |
| `description` required | "Workflow missing required 'description' field" |
| `steps` non-empty | "Workflow must have at least one step" |
| Unique step IDs | "Duplicate step ID: '{id}'" |
| Valid step types | "Invalid step type: '{type}'" |
| Valid `depends_on` refs | "Step '{id}' depends on unknown step: '{ref}'" |
| Valid interpolation refs | "Step '{id}' references unknown step: '{{ref}}'" |
| Interpolation in dependency chain | "Step '{id}' references '{{ref}}' but does not depend on it" |
| No cycles | "Workflow contains cycle: {path}" |
| Agent steps have prompt | "Agent step '{id}' missing 'prompt'" |
| Agent exists (if specified) | "Step '{id}' references unknown agent: '{agent}'" |

## CLI Commands

```bash
# List available workflows
flomaster workflow list --workflows
# Or short form:
flomaster workflow list -W

# Run a workflow
flomaster workflow run --name sdlc --prompt "Add user authentication"
# Or short form:
flomaster workflow run -n sdlc -p "Add user authentication"

# Dry run (validate without executing)
flomaster workflow run --name sdlc --prompt "Test task" --dry-run

# Validate workflow file
flomaster workflow validate <name>

# Show workflow definition details
flomaster workflow show <name>
```

## Success Criteria

### Automated Verification

- [ ] `bun turbo typecheck` passes
- [ ] `bun test` passes (all existing + new tests)
- [ ] Workflow files load correctly: `flomaster workflow list -W`
- [ ] SDLC workflow dry run: `flomaster workflow run -n sdlc -p "test task" --dry-run`
- [ ] Validation catches invalid references: test with bad `{{stepId}}`
- [ ] Built-in workflows are JSON files (no TypeScript workflow builders)
- [ ] Auto-install works on fresh project (no .flomaster/workflows/)

### Manual Verification

- [ ] `flomaster workflow run -n sdlc -p "Add hello world function"` executes successfully
- [ ] Output matches previous TypeScript workflow behavior
- [ ] Error messages are clear and actionable
- [ ] JSON files are human-readable and editable
- [ ] `flomaster workflow show sdlc` displays workflow details

## Dependencies

- TASK-10 (Step Configuration Schema) - **Complete**
- OpenCode Session/Agent infrastructure - **Available**

## References

- Design: `design/01-overview/02-requirements-overview.md` (HL-WF-002, HL-CF-001)
- Architecture: `design/01-overview/04-opencode-architecture.md`
- Current parser: `packages/flomaster/src/orchestrator/parser/workflowParser.ts`
- Current CLI: `packages/flomaster/src/cli/workflow.ts`
- Schema validator: `packages/flomaster/src/orchestrator/utils/schemaValidator.ts`
