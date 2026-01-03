# Specification-to-Code Commands

These commands enable Alfred to transform formal specifications into complete
implementations, matching CodeMachine's spec-to-code functionality.

## Command Overview

| Command                        | Purpose                                   | Input                      | Output                            |
| ------------------------------ | ----------------------------------------- | -------------------------- | --------------------------------- |
| `spec:validate-spec`           | **NEW** Validate specification quality    | Specification markdown     | `spec-validation.json`            |
| `spec:analyze`                 | Extract requirements and architecture     | Specification markdown     | `spec-analysis.json`              |
| `spec:design-architecture`     | **NEW** Multi-layered architecture design | `spec-analysis.json`       | `architecture-design.json`        |
| `spec:decompose`               | Break down into tasks (iteration-aware)   | `architecture-design.json` | `task-breakdown-I{N}.json`        |
| `spec:scaffold`                | Create project structure                  | `architecture-design.json` | Project files & configs           |
| `spec:install-dependencies`    | **NEW** Install & verify dependencies     | `scaffold-manifest.json`   | `dependencies-installation.json`  |
| `spec:implement-task`          | Implement specific tasks                  | `task-breakdown.json`      | Source code + tests               |
| `spec:validate-implementation` | Verify & auto-fix implementation          | All artifacts              | Validation report + behavior.json |
| `spec:trace-requirements`      | Requirements traceability                 | All artifacts              | Traceability matrix               |
| `spec:generate-deployment`     | **NEW** Generate deployment configs       | `architecture-design.json` | CI/CD, Docker, K8s configs        |

## Workflow: Specification to Implementation

### 0. Validate Specification (NEW)

```bash
alfred run spec:validate-spec --task AL-123
```

**What it does:**

- Validates spec completeness and quality
- Checks for ambiguous requirements
- Verifies all required sections exist
- Flags contradictions and missing information
- **Blocks implementation if spec has critical issues**

### 1. Analyze Specification

```bash
alfred run spec:analyze --task AL-123
```

**What it does:**

- Reads specification from `.alfred/specs/AL-123-spec.md`
- Extracts requirements (REQ-XXX) with priorities (P0-P3)
- Identifies architecture components and tech stack
- Saves analysis to `.alfred/tasks/AL-123/artifacts/spec-analysis.json`

### 2. Design Architecture (NEW)

```bash
alfred run spec:design-architecture --task AL-123
```

**What it does:**

- Creates multi-layered architecture design
- Designs foundation (tech stack, infrastructure)
- Designs data models and schemas
- Designs workflows and business logic
- Designs APIs and interfaces
- Saves to `.alfred/tasks/AL-123/artifacts/architecture-design.json`

### 3. Decompose into Tasks

```bash
alfred run spec:decompose --task AL-123
```

**What it does:**

- Breaks architecture into discrete implementation tasks
- Creates dependency graph
- Identifies parallelizable tasks
- Supports multi-iteration tracking (task-breakdown-I1.json, I2.json, etc.)
- Generates task breakdown with acceptance criteria
- Creates symlink to latest: `task-breakdown.json`

### 4. Scaffold Project

```bash
alfred run spec:scaffold --task AL-123
```

**What it does:**

- Creates directory structure based on architecture design
- Generates configuration files (package.json, tsconfig.json, etc.)
- Sets up test infrastructure
- Creates README with setup instructions
- Initializes git with appropriate .gitignore

### 5. Install Dependencies (NEW)

```bash
alfred run spec:install-dependencies --task AL-123
```

**What it does:**

- Installs all project dependencies
- Verifies dependency resolution (no conflicts)
- Runs security audit
- Configures development tools (linter, formatter)
- Sets up pre-commit hooks
- Verifies build works

### 6. Implement Features

Implement tasks sequentially or in parallel:

```bash
# Sequential
alfred run spec:implement-task --task AL-123 --subtask T001
alfred run spec:implement-task --task AL-123 --subtask T002

# Or let Alfred iterate through all tasks
alfred workflow implement-all --task AL-123
```

**What it does:**

- Reads task requirements and acceptance criteria
- Generates production-ready code
- Creates corresponding tests
- Adds documentation
- Saves implementation artifact

### 7. Validate Implementation

```bash
# Validate specific subtask
alfred run spec:validate-implementation --task AL-123 --subtask T001

# Or validate entire implementation
alfred run spec:validate-implementation --task AL-123
```

**What it does:**

- Verifies requirements are met
- Runs tests and linting
- Checks security issues
- **FIXES any issues found**
- Re-validates until all criteria pass
- **Signals workflow decision via behavior.json**

### 8. Generate Traceability Report

```bash
alfred run spec:trace-requirements --task AL-123
```

**What it does:**

- Maps requirements to implementations
- Calculates coverage percentage
- Identifies gaps (missing requirements)
- Flags extra features (not in spec)
- Generates JSON and Markdown reports

### 9. Generate Deployment Configuration (NEW)

```bash
alfred run spec:generate-deployment --task AL-123
```

**What it does:**

- Generates Dockerfile and docker-compose.yml
- Creates CI/CD pipelines (GitHub Actions, GitLab CI)
- Generates Kubernetes manifests (if applicable)
- Creates deployment scripts
- Generates environment configuration templates
- Produces infrastructure-as-code (Terraform, CloudFormation)

## Example Pipeline

Create a workflow in `.alfred/workflows/spec-to-code.yaml`:

```yaml
name: spec-to-code
description: Complete specification to implementation pipeline

phases:
  # Phase 0: Spec Validation
  - name: Validate Specification Quality
    command: spec:validate-spec

  # Phase 1: Analysis & Design
  - name: Analyze Specification
    command: spec:analyze

  - name: Design Architecture
    command: spec:design-architecture

  - name: Decompose into Tasks
    command: spec:decompose

  # Phase 2: Setup
  - name: Scaffold Project
    command: spec:scaffold

  - name: Install Dependencies
    command: spec:install-dependencies

  # Phase 3: Implementation (Dynamic)
  - name: Implement All Tasks
    command: spec:implement-task
    expand_on_success:
      for_each: tasks # From task-breakdown.json
      phases:
        - name: Implement Task
          command: spec:implement-task
          args:
            subtask: '{{item.task_id}}'

        - name: Validate Task
          command: spec:validate-implementation
          args:
            subtask: '{{item.task_id}}'
          iterate:
            until: validation_passed == true
            maxIterations: 3

  # Phase 4: Deployment & Verification
  - name: Generate Deployment Configs
    command: spec:generate-deployment

  - name: Generate Traceability Report
    command: spec:trace-requirements
```

Then run:

```bash
alfred workflow spec-to-code --task AL-123
```

## Specification Template

Place your specification in `.alfred/specs/AL-123-spec.md` using one of these
templates:

- `docs/template/quick-spec.md` - For simple features
- `docs/template/detailed-spec.md` - For moderate projects
- `docs/template/production-spec.md` - For production systems

**Required sections:**

- Overview
- Requirements (with REQ-XXX IDs and P0-P3 priorities)
- Design (architecture and components)
- Testing strategy

## Artifacts Generated

All artifacts are saved in `.alfred/tasks/{task_id}/artifacts/`:

```
.alfred/tasks/AL-123/
├── artifacts/
│   ├── spec-validation.json              # From spec:validate-spec (NEW)
│   ├── spec-analysis.json                # From spec:analyze
│   ├── architecture-design.json          # From spec:design-architecture (NEW)
│   ├── task-breakdown-I1.json            # From spec:decompose (iteration 1)
│   ├── task-breakdown-I2.json            # From spec:decompose (iteration 2, if needed)
│   ├── task-breakdown.json → I2.json     # Symlink to latest iteration
│   ├── scaffold-manifest.json            # From spec:scaffold
│   ├── dependencies-installation.json    # From spec:install-dependencies (NEW)
│   ├── T001-implementation.json          # From spec:implement-task
│   ├── T001-validation.json              # From spec:validate-implementation
│   ├── T002-implementation.json
│   ├── T002-validation.json
│   ├── deployment-manifest.json          # From spec:generate-deployment (NEW)
│   ├── requirements-traceability.json    # From spec:trace-requirements
│   └── TRACEABILITY.md                   # Human-readable report
└── behavior.json                          # Workflow decision protocol (NEW)
```

## Key Features

### 1. Requirement Traceability

Every requirement (REQ-XXX) is tracked from specification → implementation →
tests.

### 2. Priority-Based Implementation

- P0 (Critical): Must be implemented
- P1 (High): Should be implemented
- P2 (Medium): Nice to have
- P3 (Low): Optional

### 3. Validation Loop

The `validate:against-spec` command:

- Identifies issues
- **Fixes them automatically**
- Re-validates
- Repeats until all criteria pass

### 4. Parallel Execution

Task decomposition identifies parallelizable tasks, enabling faster
implementation.

### 5. Complete Coverage

Final traceability report ensures:

- All requirements implemented
- All implementations tested
- No unauthorized features
- Full audit trail

## Comparison to CodeMachine

| CodeMachine Feature             | Alfred Equivalent                     | Status    |
| ------------------------------- | ------------------------------------- | --------- |
| Specification input             | Alfred 3-tier spec templates          | ✅ Better |
| Spec validation                 | `spec:validate-spec`                  | ✅ NEW    |
| Architecture analysis           | `spec:analyze`                        | ✅        |
| Multi-agent architecture design | `spec:design-architecture`            | ✅ NEW    |
| Task breakdown                  | `spec:decompose`                      | ✅        |
| Iteration tracking              | `task-breakdown-I{N}.json`            | ✅ NEW    |
| Code generation                 | `spec:implement-task`                 | ✅        |
| Auto-fixing validation          | `spec:validate-implementation`        | ✅ Better |
| Requirements tracing            | `spec:trace-requirements`             | ✅ Better |
| Deployment automation           | `spec:generate-deployment`            | ✅ NEW    |
| Behavior protocol               | `behavior.json` workflow decisions    | ✅ NEW    |
| Execute-once control            | `execute_once` + `skip_on_retry`      | ✅ NEW    |
| Iterative refinement            | Built-in with `iterate.until`         | ✅        |
| Parallel execution              | `expand_on_success` + parallel blocks | ✅        |

### Alfred Advantages Over CodeMachine

1. **Auto-Fixing Validation** - Alfred fixes issues, CodeMachine just reports
2. **Three-Tier Templates** - Quick/Detailed/Production specs vs single template
3. **Explicit Traceability** - Forward + backward requirement tracing
4. **Spec Validation** - Pre-flight checks before implementation
5. **Dependency Management** - Automated install + verification
6. **Deployment Generation** - Full CI/CD + infrastructure-as-code

## Next Steps

1. Create a specification using the templates in `docs/template/`
2. Run the spec-to-code workflow
3. Review generated code and traceability report
4. Iterate on any gaps identified

For more details on each command, read the individual command files in this
directory.
