# [Standard Name] - Coding Standard

> **Standard ID**: STD-XXX
> **Document Version**: 1.0
> **Last Updated**: YYYY-MM-DD
> **Status**: Draft | In Review | Active
> **Scope**: [What this standard applies to]
> **Enforcement**: Process Validation + Automated Checks
> **Related Documents**:
>
> - [Base Standard Template](./base-standard-template.md) - Common structure reference
> - [Validation Checklist](./validation-checklist.md) - Use before marking Active
> - [Process Guide](../00-process/process-guide.md) - Stage 3d: Coding Standards

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory [testing/documentation/security] processes for TypeScript/Node.js projects. These processes define workflows, checklists, and quality gates that ensure consistent outcomes.

### 1.2 Scope

**Applies to**:

- [Specific areas covered]

**Does NOT apply to**:

- [Exclusions]

### 1.3 Enforcement Level

| Level      | Meaning                | Mechanism                 |
| ---------- | ---------------------- | ------------------------- |
| **MUST**   | Mandatory process step | CI gate, review checklist |
| **SHOULD** | Recommended practice   | Code review               |
| **MAY**    | Optional enhancement   | Team discretion           |

---

## 2. Guiding Principles

| Principle              | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| Shift Left             | Catch issues as early as possible in development        |
| Automation First       | Automate repeatable checks; reserve humans for judgment |
| Documentation as Code  | Process documentation lives with the code               |
| Continuous Improvement | Processes evolve based on lessons learned               |

---

## 3. Process Overview

<!--
TEMPLATE NOTE: Process-based standards benefit from visual
workflow diagrams showing the sequence of steps.
-->

### 3.1 Process Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Step 1    │────▶│   Step 2    │────▶│   Step 3    │
│  [Name]     │     │  [Name]     │     │  [Name]     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
  [Artifact]          [Artifact]          [Artifact]
```

### 3.2 Process Stages

| Stage     | Purpose   | Input   | Output   | Gate            |
| --------- | --------- | ------- | -------- | --------------- |
| [Stage 1] | [Purpose] | [Input] | [Output] | [Pass criteria] |
| [Stage 2] | [Purpose] | [Input] | [Output] | [Pass criteria] |
| [Stage 3] | [Purpose] | [Input] | [Output] | [Pass criteria] |

### 3.3 Roles and Responsibilities

| Role     | Responsibilities               |
| -------- | ------------------------------ |
| [Role 1] | [What they do in this process] |
| [Role 2] | [What they do in this process] |

---

## 4. Detailed Procedures

<!--
TEMPLATE NOTE: Each procedure includes step-by-step instructions,
commands to run, and expected outcomes.
-->

### 4.1 [Procedure Name]

#### 4.1.1 Purpose

[What this procedure accomplishes and why it matters]

#### 4.1.2 When to Execute

- [Trigger condition 1]
- [Trigger condition 2]

#### 4.1.3 Prerequisites

- [ ] [Prerequisite 1]
- [ ] [Prerequisite 2]

#### 4.1.4 Steps

**Step 1: [Step Name]**

```bash
# [Description of what this command does]
[command]
```

Expected output:

```
[expected output or success criteria]
```

**Step 2: [Step Name]**

```bash
# [Description of what this command does]
[command]
```

Expected output:

```
[expected output or success criteria]
```

**Step 3: [Step Name]**

[Continue for all steps...]

#### 4.1.5 Verification

- [ ] [Verification check 1]
- [ ] [Verification check 2]
- [ ] [Verification check 3]

#### 4.1.6 Troubleshooting

| Problem     | Cause          | Solution     |
| ----------- | -------------- | ------------ |
| [Problem 1] | [Likely cause] | [How to fix] |
| [Problem 2] | [Likely cause] | [How to fix] |

---

### 4.2 [Procedure Name]

[Continue pattern for additional procedures...]

---

## 5. Quality Gates

### 5.1 Gate Definitions

| Gate     | Stage   | Criteria        | Blocking |
| -------- | ------- | --------------- | -------- |
| [Gate 1] | [Stage] | [Pass criteria] | Yes/No   |
| [Gate 2] | [Stage] | [Pass criteria] | Yes/No   |
| [Gate 3] | [Stage] | [Pass criteria] | Yes/No   |

### 5.2 Gate Details

#### Gate: [Gate Name]

**Purpose**: [Why this gate exists]

**Pass Criteria**:

- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

**Failure Actions**:

1. [What to do if this gate fails]
2. [How to remediate]
3. [Who to contact]

**Override Process**:

- [When overrides are allowed]
- [Who can approve overrides]
- [Documentation required]

---

## 6. Checklists

<!--
TEMPLATE NOTE: Process-based standards include actionable
checklists that can be used during execution.
-->

### 6.1 [Checklist Name]

Use this checklist when [context for using this checklist].

#### Pre-Execution

- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]

#### During Execution

- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]

#### Post-Execution

- [ ] [Check 1]
- [ ] [Check 2]
- [ ] [Check 3]

### 6.2 [Checklist Name]

[Continue pattern for additional checklists...]

---

## 7. Automation

### 7.1 Automated Checks

| Check     | Tool   | Trigger     | Configuration     |
| --------- | ------ | ----------- | ----------------- |
| [Check 1] | [Tool] | [When runs] | [Config location] |
| [Check 2] | [Tool] | [When runs] | [Config location] |

### 7.2 CI/CD Integration

```yaml
# Example CI configuration for this process
name: [Process Name]
on: [triggers]

jobs:
  [job-name]:
    runs-on: ubuntu-latest
    steps:
      - name: [Step Name]
        run: |
          [commands]

      - name: [Step Name]
        run: |
          [commands]
```

### 7.3 Local Automation

```bash
#!/bin/bash
# [script-name].sh
# [Description of what this script automates]

set -euo pipefail

# Step 1: [Description]
[commands]

# Step 2: [Description]
[commands]

echo "Process completed successfully"
```

---

## 8. Metrics and Reporting

### 8.1 Key Metrics

| Metric     | Target         | Measurement Method |
| ---------- | -------------- | ------------------ |
| [Metric 1] | [Target value] | [How to measure]   |
| [Metric 2] | [Target value] | [How to measure]   |
| [Metric 3] | [Target value] | [How to measure]   |

### 8.2 Reporting Requirements

| Report     | Frequency   | Audience       | Content           |
| ---------- | ----------- | -------------- | ----------------- |
| [Report 1] | [Frequency] | [Who receives] | [What's included] |
| [Report 2] | [Frequency] | [Who receives] | [What's included] |

### 8.3 Dashboard

[Description of metrics dashboard or link to dashboard]

---

## 9. Anti-Patterns

### 9.1 Process Anti-Patterns

| Anti-Pattern     | Problem           | Correct Practice   |
| ---------------- | ----------------- | ------------------ |
| [Anti-pattern 1] | [What goes wrong] | [Correct approach] |
| [Anti-pattern 2] | [What goes wrong] | [Correct approach] |

### 9.2 Common Mistakes

| Mistake     | Consequence    | Prevention     |
| ----------- | -------------- | -------------- |
| [Mistake 1] | [What happens] | [How to avoid] |
| [Mistake 2] | [What happens] | [How to avoid] |

---

## 10. Decision Flowcharts

### 10.1 [Decision Name]

```
[Situation]?
│
├─ [Condition A]?
│   ├─ Yes → [Action A]
│   └─ No ─┐
│          │
├─ [Condition B]?
│   ├─ Yes → [Action B]
│   └─ No ─┐
│          │
└─ Default → [Default Action]
```

### 10.2 [Decision Name]

```
[Another decision flowchart...]
```

---

## 11. Enforcement

### 11.1 Process Validation

| Validation     | Method          | Frequency |
| -------------- | --------------- | --------- |
| [Validation 1] | [How validated] | [When]    |
| [Validation 2] | [How validated] | [When]    |

### 11.2 Audit Trail

| Event     | Logged Information | Retention       |
| --------- | ------------------ | --------------- |
| [Event 1] | [What's logged]    | [How long kept] |
| [Event 2] | [What's logged]    | [How long kept] |

### 11.3 Compliance Verification

- [ ] [Compliance check 1]
- [ ] [Compliance check 2]
- [ ] [Compliance check 3]

---

## 12. Exceptions

### 12.1 Exception Process

1. **Request**: [How to request an exception]
2. **Justification**: [What justification is required]
3. **Approval**: [Who approves exceptions]
4. **Documentation**: [How exceptions are documented]
5. **Review**: [When exceptions are reviewed]

### 12.2 Valid Exception Scenarios

| Scenario     | Justification Required  | Approver |
| ------------ | ----------------------- | -------- |
| [Scenario 1] | [What must be provided] | [Role]   |
| [Scenario 2] | [What must be provided] | [Role]   |

### 12.3 Exception Documentation

```markdown
## Process Exception: STD-XXX Section X.X

**Date**: YYYY-MM-DD
**Requested by**: [Name]
**Approved by**: [Name]

**Scenario**: [Description of the exception]
**Justification**: [Why this exception is necessary]
**Duration**: [Temporary until date / Permanent]
**Mitigation**: [Alternative controls in place]
```

---

## 13. Quick Reference

### 13.1 Process Summary

| Stage     | Key Action | Time Estimate |
| --------- | ---------- | ------------- |
| [Stage 1] | [Action]   | [Duration]    |
| [Stage 2] | [Action]   | [Duration]    |
| [Stage 3] | [Action]   | [Duration]    |

### 13.2 Command Quick Reference

```bash
# [Purpose 1]
[command]

# [Purpose 2]
[command]

# [Purpose 3]
[command]
```

### 13.3 Checklist Summary

**Before**: [Key pre-checks]
**During**: [Key actions]
**After**: [Key verifications]

---

## 14. Traceability

### 14.1 Procedure Index

| Procedure ID | Name   | Section | Trigger     |
| ------------ | ------ | ------- | ----------- |
| PROC-001     | [Name] | 4.1     | [When used] |
| PROC-002     | [Name] | 4.2     | [When used] |

### 14.2 Related Standards

| Standard | Relationship      |
| -------- | ----------------- |
| STD-XXX  | [How they relate] |

---

## 15. Open Questions

| Question ID | Question              | Owner  | Status  |
| ----------- | --------------------- | ------ | ------- |
| SQ-001      | [Unresolved question] | [Name] | Pending |

---

## Document History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | YYYY-MM-DD | [Name] | Initial version |
