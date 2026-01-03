# Coding Standards - Process Guide

> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Purpose**: Guide for creating and maintaining coding standards documentation

---

## 1. Overview

This document defines the process for creating, validating, and maintaining coding standards for FlowMaster. These standards ensure that AI-generated and human-written code is consistent, maintainable, and high-quality.

### 1.1 Why Standards Matter for AI Code Generation

AI code generation requires **extremely precise, unambiguous guidelines** because:

- AI agents cannot ask clarifying questions mid-generation
- Ambiguous rules lead to inconsistent output
- Missing anti-patterns result in common mistakes
- Lack of examples causes interpretation errors

Every standard document must pass the test: **"Can an AI agent follow this without human clarification?"**

---

## 2. Document Inventory

### 2.1 Complete Standards List

| #   | Standard ID | Document Name                           | Template            | File Name                        | Status  |
| --- | ----------- | --------------------------------------- | ------------------- | -------------------------------- | ------- |
| 0   | -           | Standards Process                       | -                   | `00-standards-process.md`        | Active  |
| 1   | STD-001     | Naming Conventions                      | Rule-based          | `01-naming-conventions.md`       | Active  |
| 2   | STD-002     | Directory Structure & File Organization | Pattern-based       | `02-directory-structure.md`      | Pending |
| 3   | STD-003     | Code Style & Formatting                 | Rule-based          | `03-code-style.md`               | Pending |
| 4   | STD-004     | Architecture Patterns                   | Pattern-based       | `04-architecture-patterns.md`    | Pending |
| 5   | STD-005     | TypeScript Configuration                | Configuration-based | `05-typescript-configuration.md` | Pending |
| 6   | STD-006     | Testing Standards                       | Process-based       | `06-testing-standards.md`        | Pending |
| 7   | STD-007     | Error Handling Patterns                 | Pattern-based       | `07-error-handling.md`           | Pending |
| 8   | STD-008     | Documentation Standards                 | Rule-based          | `08-documentation-standards.md`  | Pending |
| 9   | STD-009     | Git Workflow & Commits                  | Rule-based          | `09-git-workflow.md`             | Pending |
| 10  | STD-010     | Dependency Management                   | Configuration-based | `10-dependency-management.md`    | Pending |
| 11  | STD-011     | Configuration Management                | Configuration-based | `11-configuration-management.md` | Pending |
| 12  | STD-012     | CLI Design Patterns                     | Pattern-based       | `12-cli-design-patterns.md`      | Pending |
| 13  | STD-013     | Logging & Observability                 | Pattern-based       | `13-logging-observability.md`    | Pending |
| 14  | STD-014     | Security Practices                      | Process-based       | `14-security-practices.md`       | Pending |
| 15  | STD-015     | Performance Guidelines                  | Rule-based          | `15-performance-guidelines.md`   | Pending |
| 16  | STD-016     | Build & CI/CD Standards                 | Configuration-based | `16-build-cicd.md`               | Pending |
| 17  | STD-017     | AI Code Generation Constraints          | Rule-based          | `17-ai-code-generation.md`       | Pending |

### 2.2 Template Assignments

| Template Type           | Use For                                        | Documents                                            |
| ----------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| **Rule-based**          | Discrete rules with correct/incorrect examples | STD-001, STD-003, STD-008, STD-009, STD-015, STD-017 |
| **Pattern-based**       | Architectural patterns, component structures   | STD-002, STD-004, STD-007, STD-012, STD-013          |
| **Configuration-based** | Literal config files, settings                 | STD-005, STD-010, STD-011, STD-016                   |
| **Process-based**       | Workflows, procedures, checklists              | STD-006, STD-014                                     |

### 2.3 Template Locations

```
design/templates/99-standards/
├── 00-base-standard-template.md      # Common structure for all standards
├── 01-rule-based-template.md         # For discrete rules (naming, style)
├── 02-pattern-based-template.md      # For patterns (architecture, errors)
├── 03-configuration-template.md      # For config files (tsconfig, deps)
├── 04-process-template.md            # For workflows (testing, security)
└── 05-validation-checklist.md        # Use before marking Active
```

---

## 3. Creation Order & Dependencies

Standards should be created in a specific order because later standards depend on earlier ones.

### 3.1 Dependency Graph

```
Phase 1: Foundation
┌─────────────────────────────────────────────────────────────┐
│  STD-002 Directory Structure                                │
│     └─ Defines WHERE files go                               │
│  STD-004 Architecture Patterns                              │
│     └─ Defines HOW components relate                        │
│  STD-005 TypeScript Configuration                           │
│     └─ Defines compiler settings                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Phase 2: Code Quality
┌─────────────────────────────────────────────────────────────┐
│  STD-003 Code Style (depends on: STD-001)                   │
│     └─ Formatting, imports, syntax                          │
│  STD-007 Error Handling (depends on: STD-004)               │
│     └─ Error classes, patterns                              │
│  STD-012 CLI Design (depends on: STD-002, STD-004)          │
│     └─ Command structure, options                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Phase 3: Process
┌─────────────────────────────────────────────────────────────┐
│  STD-006 Testing (depends on: STD-002, STD-007)             │
│     └─ Test structure, coverage, mocking                    │
│  STD-009 Git Workflow (standalone)                          │
│     └─ Branches, commits, PRs                               │
│  STD-016 Build & CI/CD (depends on: STD-005, STD-006)       │
│     └─ Build scripts, pipelines                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Phase 4: Support
┌─────────────────────────────────────────────────────────────┐
│  STD-008 Documentation (depends on: STD-001)                │
│     └─ JSDoc, README, comments                              │
│  STD-010 Dependency Management (depends on: STD-005)        │
│     └─ Package manager, versions                            │
│  STD-011 Configuration Management (depends on: STD-002)     │
│     └─ Config files, env vars                               │
│  STD-013 Logging & Observability (depends on: STD-004)      │
│     └─ Log levels, tracing, metrics                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Phase 5: Safety & Optimization
┌─────────────────────────────────────────────────────────────┐
│  STD-014 Security Practices (depends on: STD-007, STD-011)  │
│     └─ Input validation, secrets                            │
│  STD-015 Performance Guidelines (depends on: STD-004)       │
│     └─ Memory, startup, caching                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
Phase 6: AI-Specific
┌─────────────────────────────────────────────────────────────┐
│  STD-017 AI Code Generation Constraints (depends on: ALL)   │
│     └─ Consolidates critical rules for AI agents            │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Recommended Creation Sequence

| Order | Standard                         | Why This Order                     |
| ----- | -------------------------------- | ---------------------------------- |
| 1     | STD-001 Naming Conventions       | ✅ Foundation for all identifiers  |
| 2     | STD-002 Directory Structure      | Defines file organization          |
| 3     | STD-004 Architecture Patterns    | Defines component relationships    |
| 4     | STD-005 TypeScript Configuration | Enforces type safety               |
| 5     | STD-003 Code Style               | Depends on naming, adds formatting |
| 6     | STD-007 Error Handling           | Depends on architecture            |
| 7     | STD-012 CLI Design Patterns      | CLI-specific structure             |
| 8     | STD-006 Testing Standards        | Depends on structure, errors       |
| 9     | STD-009 Git Workflow             | Standalone, can be done anytime    |
| 10    | STD-016 Build & CI/CD            | Depends on testing                 |
| 11    | STD-008 Documentation            | Depends on naming                  |
| 12    | STD-010 Dependency Management    | Depends on TS config               |
| 13    | STD-011 Configuration Management | Depends on structure               |
| 14    | STD-013 Logging & Observability  | Depends on architecture            |
| 15    | STD-014 Security Practices       | Depends on errors, config          |
| 16    | STD-015 Performance Guidelines   | Depends on architecture            |
| 17    | STD-017 AI Code Generation       | Consolidates all standards         |

---

## 4. Document Creation Workflow

### 4.1 Per-Document Process

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: RESEARCH                                           │
│  ────────────────                                           │
│  • Research industry best practices for the topic           │
│  • Review existing codebases and documentation              │
│  • Identify patterns that work well for CLI/TypeScript      │
│  • Note both good patterns AND anti-patterns                │
│                                                             │
│  Sources: Industry standards, documentation, team experience│
│  Focus: Find 3-5 exemplary patterns per major section       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: EXTRACT                                            │
│  ──────────────                                             │
│  • Document patterns found in exploration                   │
│  • Create correct/incorrect example pairs                   │
│  • Identify enforcement mechanisms (ESLint, CI, manual)     │
│  • Note any exceptions or edge cases                        │
│                                                             │
│  Output: Raw notes with code snippets                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: WRITE                                              │
│  ───────────                                                │
│  • Select appropriate template (rule/pattern/config/process)│
│  • Fill ALL sections - no placeholders                      │
│  • Ensure every rule has MUST/SHOULD/MAY level              │
│  • Add decision flowcharts for complex choices              │
│  • Include anti-patterns section                            │
│                                                             │
│  Template: design/templates/99-standards/0X-*-template.md   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: VALIDATE                                           │
│  ────────────────                                           │
│  • Run through validation checklist                         │
│  • Verify AI can follow without clarification               │
│  • Check all examples compile/work                          │
│  • Ensure no subjective terms remain                        │
│                                                             │
│  Checklist: design/templates/99-standards/05-validation-... │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: ACTIVATE                                           │
│  ────────────────                                           │
│  • Update Status to "Active"                                │
│  • Update this process document's inventory                 │
│  • Update related standards with cross-references           │
│  • Commit with conventional commit message                  │
│                                                             │
│  Commit: docs(standards): add STD-XXX [name]                │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Research Approaches

When researching patterns for each standard type:

**For Rule-based Standards (naming, style, git)**:

- Review TypeScript/ESLint official style guides
- Study popular open-source CLI projects
- Consult team conventions and preferences
- Identify common naming patterns and anti-patterns

**For Pattern-based Standards (architecture, errors, CLI)**:

- Research layered architecture patterns for Node.js
- Study error handling best practices in TypeScript
- Review CLI framework documentation (oclif, Commander, Ink)
- Identify dependency injection and service patterns

**For Configuration-based Standards (tsconfig, deps, build)**:

- Review TypeScript strict mode recommendations
- Study monorepo and package management patterns
- Research CI/CD best practices for Node.js
- Consult security scanning and audit tools

**For Process-based Standards (testing, security)**:

- Research testing pyramid and coverage strategies
- Study mocking and fixture patterns for Node.js
- Review OWASP guidelines for CLI applications
- Consult input validation best practices

### 4.3 Quality Checklist (Quick Version)

Before marking a standard as Active:

- [ ] All rules have MUST/SHOULD/MAY level
- [ ] All rules have correct AND incorrect examples
- [ ] No placeholder text (`[TBD]`, `TODO`, `...`)
- [ ] No subjective terms without quantification
- [ ] Decision flowcharts for complex choices
- [ ] Anti-patterns section is complete
- [ ] Enforcement mechanisms specified
- [ ] Cross-references to related standards added

---

## 5. Directory Structure

### 5.1 Standards Output Location

```
design/flowmaster/99-standards/
├── 00-standards-process.md           # This document
├── 01-naming-conventions.md          # STD-001 ✅
├── 02-directory-structure.md         # STD-002 (pending)
├── 03-code-style.md                  # STD-003 (pending)
├── 04-architecture-patterns.md       # STD-004 (pending)
├── 05-typescript-configuration.md    # STD-005 (pending)
├── 06-testing-standards.md           # STD-006 (pending)
├── 07-error-handling.md              # STD-007 (pending)
├── 08-documentation-standards.md     # STD-008 (pending)
├── 09-git-workflow.md                # STD-009 (pending)
├── 10-dependency-management.md       # STD-010 (pending)
├── 11-configuration-management.md    # STD-011 (pending)
├── 12-cli-design-patterns.md         # STD-012 (pending)
├── 13-logging-observability.md       # STD-013 (pending)
├── 14-security-practices.md          # STD-014 (pending)
├── 15-performance-guidelines.md      # STD-015 (pending)
├── 16-build-cicd.md                  # STD-016 (pending)
└── 17-ai-code-generation.md          # STD-017 (pending)
```

### 5.2 File Naming Convention

- Prefix with two-digit number for ordering: `01-`, `02-`, etc.
- Use `kebab-case` for file names
- Extension: `.md`
- Format: `{NN}-{descriptive-name}.md`

---

## 6. Standard Document Structure

### 6.1 Required Sections (All Templates)

Every standard document MUST include:

| Section                   | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| **Header Block**          | ID, version, status, scope, enforcement, related docs |
| **1. Overview**           | Purpose, scope, enforcement levels                    |
| **2. Guiding Principles** | 3-5 principles as rationale                           |
| **3. Main Content**       | Rules, patterns, or procedures                        |
| **Anti-Patterns**         | What NOT to do (critical for AI)                      |
| **Enforcement**           | ESLint, CI, review checklists                         |
| **Exceptions**            | When rules can be broken                              |
| **Quick Reference**       | Cheat sheet for fast lookup                           |
| **Traceability**          | Index of rules, related standards                     |
| **Open Questions**        | Unresolved decisions                                  |
| **Document History**      | Version changelog                                     |

### 6.2 Template-Specific Sections

| Template                | Additional Sections                                                  |
| ----------------------- | -------------------------------------------------------------------- |
| **Rule-based**          | Lookup Tables, Decision Flowcharts                                   |
| **Pattern-based**       | Architectural Overview, Layer Diagram, Role Definitions              |
| **Configuration-based** | Required Config Files, Version Requirements, Environment Variables   |
| **Process-based**       | Process Flow Diagram, Detailed Procedures, Quality Gates, Checklists |

---

## 7. Cross-References

### 7.1 How Standards Relate

```
                    ┌─────────────────┐
                    │   STD-001       │
                    │   Naming        │
                    └────────┬────────┘
                             │ extends
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   STD-003     │   │   STD-008     │   │   STD-007     │
│   Code Style  │   │   Docs        │   │   Errors      │
└───────────────┘   └───────────────┘   └───────────────┘

        ┌─────────────────┐
        │   STD-002       │
        │   Directory     │
        └────────┬────────┘
                 │ defines structure for
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
┌───────────┐ ┌─────────┐ ┌───────────┐
│ STD-004   │ │ STD-006 │ │ STD-011   │
│ Arch      │ │ Testing │ │ Config    │
└───────────┘ └─────────┘ └───────────┘

        ┌─────────────────┐
        │   STD-017       │
        │   AI Generation │◄───── consolidates all
        └─────────────────┘
```

### 7.2 Updating Cross-References

When creating a new standard:

1. Add references TO new standard in related existing standards
2. Add references FROM new standard to standards it depends on
3. Update the Traceability section in both documents

---

## 8. Maintenance

### 8.1 When to Update Standards

| Trigger                 | Action                                  |
| ----------------------- | --------------------------------------- |
| New pattern discovered  | Add to relevant standard                |
| Bug caused by ambiguity | Clarify rule with examples              |
| Tool/framework update   | Update config requirements              |
| Team feedback           | Address in Open Questions, then resolve |
| AI generation issues    | Add to anti-patterns                    |

### 8.2 Version Control

- **Minor updates** (clarifications, examples): Increment patch version (1.0 → 1.1)
- **New rules added**: Increment minor version (1.1 → 1.2)
- **Breaking changes**: Increment major version (1.2 → 2.0)

### 8.3 Document History Format

```markdown
| Version | Date       | Author | Changes                               |
| ------- | ---------- | ------ | ------------------------------------- |
| 1.2     | 2025-12-15 | Team   | Added Rule 3.1.5 for async generators |
| 1.1     | 2025-12-01 | Team   | Clarified boolean prefix requirements |
| 1.0     | 2025-11-29 | Team   | Initial version                       |
```

---

## 9. Progress Tracking

### 9.1 Current Status

| Phase        | Standards                          | Status      |
| ------------ | ---------------------------------- | ----------- |
| Foundation   | STD-001                            | ✅ Complete |
| Foundation   | STD-002, STD-004, STD-005          | Pending     |
| Code Quality | STD-003, STD-007, STD-012          | Pending     |
| Process      | STD-006, STD-009, STD-016          | Pending     |
| Support      | STD-008, STD-010, STD-011, STD-013 | Pending     |
| Safety       | STD-014, STD-015                   | Pending     |
| AI-Specific  | STD-017                            | Pending     |

### 9.2 Next Steps

1. Create STD-002 (Directory Structure) - **NEXT**
2. Create STD-004 (Architecture Patterns)
3. Create STD-005 (TypeScript Configuration)
4. Continue per recommended sequence

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
