# [Standard Name] - Coding Standard

> **Standard ID**: STD-XXX
> **Document Version**: 1.0
> **Last Updated**: YYYY-MM-DD
> **Status**: Draft | In Review | Active
> **Scope**: [What this standard applies to]
> **Enforcement**: Configuration Files + CI Validation
> **Related Documents**:
>
> - [Base Standard Template](./base-standard-template.md) - Common structure reference
> - [Validation Checklist](./validation-checklist.md) - Use before marking Active
> - [Process Guide](../00-process/process-guide.md) - Stage 3d: Coding Standards

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory [configuration/build/dependency] standards for TypeScript/Node.js projects. These configurations are provided as literal files that MUST be used without modification unless explicitly documented.

### 1.2 Scope

**Applies to**:

- [Specific areas covered]

**Does NOT apply to**:

- [Exclusions]

### 1.3 Enforcement Level

| Level      | Meaning                      | Mechanism       |
| ---------- | ---------------------------- | --------------- |
| **MUST**   | Exact configuration required | CI validation   |
| **SHOULD** | Recommended setting          | Code review     |
| **MAY**    | Optional setting             | Team discretion |

---

## 2. Guiding Principles

| Principle       | Description                                         |
| --------------- | --------------------------------------------------- |
| Reproducibility | Same configuration produces same results everywhere |
| Strictness      | Enable all safety checks by default                 |
| Explicitness    | No implicit behaviors; all settings documented      |
| Version Control | All configuration files committed to repository     |

---

## 3. Required Configuration Files

<!--
TEMPLATE NOTE: Configuration-based standards provide literal
configuration files that projects MUST use.
-->

### 3.1 [Configuration File Name]

**File Location**: `[path/to/file]`
**Purpose**: [What this configuration controls]
**Modification**: [Forbidden | Allowed with justification | Freely customizable]

```json
{
  // ============================================================
  // [Section Name]
  // ============================================================

  // [Option Name] (MUST)
  // Purpose: [Why this setting exists]
  // Value: [Explanation of the chosen value]
  "[option]": [value],

  // [Option Name] (MUST)
  // Purpose: [Why this setting exists]
  // Value: [Explanation of the chosen value]
  "[option]": [value],

  // ============================================================
  // [Section Name]
  // ============================================================

  // [Option Name] (SHOULD)
  // Purpose: [Why this setting exists]
  // Value: [Explanation of the chosen value]
  "[option]": [value]
}
```

#### 3.1.1 Required Settings

| Setting     | Value     | Rationale        | Modifiable         |
| ----------- | --------- | ---------------- | ------------------ |
| `[setting]` | `[value]` | [Why this value] | No                 |
| `[setting]` | `[value]` | [Why this value] | No                 |
| `[setting]` | `[value]` | [Why this value] | With justification |

#### 3.1.2 Forbidden Settings

| Setting     | Forbidden Value | Reason          |
| ----------- | --------------- | --------------- |
| `[setting]` | `[value]`       | [Why forbidden] |
| `[setting]` | `[value]`       | [Why forbidden] |

---

### 3.2 [Configuration File Name]

**File Location**: `[path/to/file]`
**Purpose**: [What this configuration controls]
**Modification**: [Forbidden | Allowed with justification | Freely customizable]

```yaml
# ============================================================
# [Section Name]
# ============================================================

# [Option Name] (MUST)
# Purpose: [Why this setting exists]
[option]: [value]

# [Option Name] (SHOULD)
# Purpose: [Why this setting exists]
[option]: [value]
```

[Continue for additional configuration files...]

---

## 4. Settings Reference

<!--
TEMPLATE NOTE: Comprehensive table of all settings with
their required values and rationale.
-->

### 4.1 [Category] Settings

| Setting     | Required Value | Purpose   | Impact if Changed |
| ----------- | -------------- | --------- | ----------------- |
| `[setting]` | `[value]`      | [Purpose] | [What breaks]     |
| `[setting]` | `[value]`      | [Purpose] | [What breaks]     |

### 4.2 [Category] Settings

| Setting     | Required Value | Purpose   | Impact if Changed |
| ----------- | -------------- | --------- | ----------------- |
| `[setting]` | `[value]`      | [Purpose] | [What breaks]     |

---

## 5. Version Requirements

### 5.1 Runtime Versions

| Tool          | Minimum Version | Recommended Version | Rationale |
| ------------- | --------------- | ------------------- | --------- |
| Node.js       | [version]       | [version]           | [Why]     |
| npm/pnpm/yarn | [version]       | [version]           | [Why]     |
| TypeScript    | [version]       | [version]           | [Why]     |

### 5.2 Dependency Version Policies

| Dependency Type | Version Strategy | Example                |
| --------------- | ---------------- | ---------------------- |
| Production      | [Strategy]       | `"package": "^1.2.3"`  |
| Development     | [Strategy]       | `"package": "~1.2.3"`  |
| Peer            | [Strategy]       | `"package": ">=1.0.0"` |

### 5.3 Lock File Requirements

| Requirement      | Details                                          |
| ---------------- | ------------------------------------------------ |
| Lock file type   | [package-lock.json / pnpm-lock.yaml / yarn.lock] |
| Commit to VCS    | MUST be committed                                |
| Update frequency | [Policy]                                         |

---

## 6. Environment Configuration

### 6.1 Required Environment Variables

| Variable     | Purpose   | Required | Default   | Validation         |
| ------------ | --------- | -------- | --------- | ------------------ |
| `[VAR_NAME]` | [Purpose] | Yes/No   | [Default] | [Validation rules] |
| `[VAR_NAME]` | [Purpose] | Yes/No   | [Default] | [Validation rules] |

### 6.2 Environment Variable Naming

| Category     | Prefix      | Example          |
| ------------ | ----------- | ---------------- |
| [Category 1] | `[PREFIX]_` | `PREFIX_SETTING` |
| [Category 2] | `[PREFIX]_` | `PREFIX_SETTING` |

### 6.3 Environment File Template

```bash
# .env.example
# Copy to .env and fill in values

# ============================================================
# [Category Name]
# ============================================================

# [Description of this variable]
# Required: Yes/No
# Example: example_value
[VAR_NAME]=

# [Description of this variable]
# Required: Yes/No
# Default: default_value
[VAR_NAME]=default_value
```

---

## 7. Build Configuration

### 7.1 Build Scripts

| Script        | Command     | Purpose        |
| ------------- | ----------- | -------------- |
| `build`       | `[command]` | [What it does] |
| `build:watch` | `[command]` | [What it does] |
| `clean`       | `[command]` | [What it does] |

### 7.2 Build Output Structure

```
dist/
├── [output structure]
├── [output structure]
└── [output structure]
```

### 7.3 Build Artifacts

| Artifact   | Location | Purpose   | Git Status        |
| ---------- | -------- | --------- | ----------------- |
| [Artifact] | `[path]` | [Purpose] | Ignored/Committed |

---

## 8. Dependency Management

### 8.1 Allowed Dependencies

| Category   | Allowed Packages | Purpose   |
| ---------- | ---------------- | --------- |
| [Category] | [Package list]   | [Purpose] |
| [Category] | [Package list]   | [Purpose] |

### 8.2 Forbidden Dependencies

| Package     | Reason          | Alternative           |
| ----------- | --------------- | --------------------- |
| `[package]` | [Why forbidden] | [What to use instead] |
| `[package]` | [Why forbidden] | [What to use instead] |

### 8.3 Dependency Audit Requirements

| Check         | Frequency   | Blocking Severity     |
| ------------- | ----------- | --------------------- |
| `npm audit`   | [Frequency] | [Severity level]      |
| License check | [Frequency] | [Disallowed licenses] |

---

## 9. Anti-Patterns

### 9.1 Forbidden Configuration Patterns

| Pattern   | Why Forbidden | Correct Approach |
| --------- | ------------- | ---------------- |
| [Pattern] | [Explanation] | [Correct way]    |
| [Pattern] | [Explanation] | [Correct way]    |

### 9.2 Common Mistakes

```json
// INCORRECT: [Description of mistake]
{
  "[setting]": [wrong value]
}

// CORRECT: [Description of correct approach]
{
  "[setting]": [correct value]
}
```

---

## 10. Enforcement

### 10.1 Configuration Validation Script

```bash
#!/bin/bash
# validate-config.sh
# Validates project configuration against standards

# Check [config file]
if ! diff -q [expected] [actual] > /dev/null 2>&1; then
  echo "ERROR: [config file] does not match standard"
  exit 1
fi

echo "Configuration validation passed"
```

### 10.2 CI/CD Validation

```yaml
# .github/workflows/validate.yml
name: Validate Configuration
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate TypeScript Config
        run: |
          # Validation commands
      - name: Audit Dependencies
        run: npm audit --audit-level=high
```

### 10.3 Pre-commit Validation

```bash
#!/bin/bash
# .husky/pre-commit

# Validate configuration files haven't been modified incorrectly
[validation commands]
```

---

## 11. Exceptions

### 11.1 Allowed Modifications

| Setting     | When Modifiable | Documentation Required |
| ----------- | --------------- | ---------------------- |
| `[setting]` | [Condition]     | [What to document]     |

### 11.2 Exception Documentation

When modifying a required configuration:

```json
{
  // CONFIGURATION EXCEPTION: STD-XXX Section 3.1
  // Reason: [Why this exception is necessary]
  // Impact: [What this changes]
  // Approved: [Date]
  "[setting]": [modified value]
}
```

---

## 12. Quick Reference

### 12.1 File Checklist

| File     | Location | Required | Template    |
| -------- | -------- | -------- | ----------- |
| `[file]` | `[path]` | Yes/No   | Section X.X |
| `[file]` | `[path]` | Yes/No   | Section X.X |

### 12.2 Critical Settings Summary

| Setting     | Value     | File     |
| ----------- | --------- | -------- |
| `[setting]` | `[value]` | `[file]` |
| `[setting]` | `[value]` | `[file]` |

### 12.3 Version Matrix

| Component   | Version   |
| ----------- | --------- |
| [Component] | [Version] |
| [Component] | [Version] |

---

## 13. Traceability

### 13.1 Configuration Index

| Config ID | File     | Section | Purpose   |
| --------- | -------- | ------- | --------- |
| CFG-001   | `[file]` | 3.1     | [Purpose] |
| CFG-002   | `[file]` | 3.2     | [Purpose] |

### 13.2 Related Standards

| Standard | Relationship      |
| -------- | ----------------- |
| STD-XXX  | [How they relate] |

---

## 14. Open Questions

| Question ID | Question              | Owner  | Status  |
| ----------- | --------------------- | ------ | ------- |
| SQ-001      | [Unresolved question] | [Name] | Pending |

---

## Document History

| Version | Date       | Author | Changes         |
| ------- | ---------- | ------ | --------------- |
| 1.0     | YYYY-MM-DD | [Name] | Initial version |
