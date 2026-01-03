# Git Workflow & Commit Standards

> **Standard ID**: STD-009
> **Document Version**: 1.0
> **Last Updated**: 2025-11-29
> **Status**: Active
> **Scope**: Git operations, commits, branches, pull requests
> **Enforcement**: Automated (Husky, CI) + Manual Review
> **Related Documents**:
>
> - [Naming Conventions](./naming-conventions.md) - STD-001
> - [Process Template](../../templates/99-standards/04-process-template.md)
> - [Validation Checklist](../../templates/99-standards/05-validation-checklist.md)

---

## 1. Overview

### 1.1 Purpose

This document establishes mandatory Git workflow standards for TypeScript/Node.js CLI projects. These standards ensure consistent version control practices, clear commit history, and streamlined collaboration for both human developers and AI code generation.

### 1.2 Scope

**Applies to**:

- All Git commits to the repository
- Branch creation and naming
- Pull request creation and review
- Release management
- Git hooks and automation

**Does NOT apply to**:

- Third-party forked repositories (until merged)
- Archived/legacy branches (documented exceptions)
- External dependency repositories

### 1.3 Enforcement Level

| Level      | Meaning                            | Mechanism             |
| ---------- | ---------------------------------- | --------------------- |
| **MUST**   | Mandatory; violations block merge  | Husky hooks, CI gates |
| **SHOULD** | Recommended; exceptions documented | Code review           |
| **MAY**    | Optional enhancement               | Team discretion       |

---

## 2. Guiding Principles

| Principle             | Description                                           |
| --------------------- | ----------------------------------------------------- |
| Atomic Commits        | Each commit represents one logical change             |
| Clear History         | Commit messages tell the story of the project         |
| Branch Isolation      | Features developed in isolation, merged when complete |
| Automated Enforcement | Humans review logic; machines enforce format          |
| Traceability          | Every change links to an issue or requirement         |

---

## 3. Process Overview

### 3.1 Git Workflow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Create    │────▶│   Develop   │────▶│   Submit    │────▶│   Merge     │
│   Branch    │     │   & Commit  │     │   PR        │     │   to Main   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Branch Name         Commit Msg          PR Template         Squash/Merge
  Validation          Validation          Checklist           to Main
```

### 3.2 Process Stages

| Stage           | Purpose           | Input            | Output         | Gate              |
| --------------- | ----------------- | ---------------- | -------------- | ----------------- |
| Branch Creation | Isolate work      | Issue/Task ID    | Named branch   | Naming validation |
| Development     | Implement changes | Requirements     | Commits        | Pre-commit hooks  |
| Pull Request    | Request review    | Completed work   | Reviewed PR    | CI checks pass    |
| Merge           | Integrate changes | Approved PR      | Updated main   | All checks green  |
| Release         | Publish version   | Release criteria | Tagged release | Release checklist |

### 3.3 Roles and Responsibilities

| Role       | Responsibilities                              |
| ---------- | --------------------------------------------- |
| Developer  | Create branches, write commits, submit PRs    |
| Reviewer   | Review code, validate PR checklist, approve   |
| Maintainer | Merge PRs, manage releases, resolve conflicts |
| CI System  | Enforce hooks, run tests, validate format     |

---

## 4. Commit Message Standards

### 4.1 Format: Conventional Commits

**Enforcement**: MUST
**Automation**: commitlint, Husky commit-msg hook

All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

#### 4.1.1 Commit Types

| Type       | Purpose                     | Example                                          |
| ---------- | --------------------------- | ------------------------------------------------ |
| `feat`     | New feature                 | `feat(cli): add --json flag to config command`   |
| `fix`      | Bug fix                     | `fix(parser): handle empty input gracefully`     |
| `docs`     | Documentation only          | `docs(readme): update installation instructions` |
| `style`    | Formatting, no logic change | `style(lint): fix indentation in utils`          |
| `refactor` | Code change, no feature/fix | `refactor(core): extract validation logic`       |
| `perf`     | Performance improvement     | `perf(loader): lazy load heavy modules`          |
| `test`     | Add/update tests            | `test(api): add integration tests for auth`      |
| `build`    | Build system changes        | `build(webpack): update bundle configuration`    |
| `ci`       | CI configuration            | `ci(github): add caching to workflow`            |
| `chore`    | Maintenance tasks           | `chore(deps): update dependencies`               |
| `revert`   | Revert previous commit      | `revert: feat(cli): add --json flag`             |

#### 4.1.2 Scope

Scope is optional but SHOULD be included for clarity:

| Scope     | When to Use             |
| --------- | ----------------------- |
| `cli`     | CLI command changes     |
| `core`    | Core library changes    |
| `api`     | API-related changes     |
| `config`  | Configuration handling  |
| `deps`    | Dependency updates      |
| `release` | Release-related commits |
| `docs`    | Documentation           |

#### 4.1.3 Description Rules

| Rule        | Requirement                         |
| ----------- | ----------------------------------- |
| Case        | Lowercase first letter              |
| Tense       | Imperative mood ("add" not "added") |
| Length      | Maximum 72 characters               |
| Punctuation | No period at end                    |
| Content     | What changed, not how               |

**Correct Examples**:

```bash
# Feature with scope
feat(cli): add --verbose flag for debug output

# Bug fix with body
fix(parser): handle unicode characters in input

The parser was failing on non-ASCII characters due to
incorrect encoding detection. This fix adds proper UTF-8
handling throughout the parsing pipeline.

Closes #123

# Breaking change
feat(api)!: change response format to JSON

BREAKING CHANGE: API responses are now JSON instead of plain text.
Clients must update their parsing logic.

# Chore with scope
chore(deps): update typescript to 5.3.0
```

**Incorrect Examples**:

```bash
# WRONG: No type
updated the config parser

# WRONG: Past tense
feat(cli): added new command

# WRONG: Capitalized
feat(cli): Add new command

# WRONG: Period at end
fix(parser): resolve null pointer issue.

# WRONG: Too vague
fix: stuff

# WRONG: Too long (over 72 chars)
feat(cli): add a new command that allows users to configure their settings
```

### 4.2 Commit Body Guidelines

**Enforcement**: SHOULD

When a body is needed:

| Include Body When | Content                                 |
| ----------------- | --------------------------------------- |
| Complex changes   | Explain the "why" not the "what"        |
| Breaking changes  | Document migration path                 |
| Bug fixes         | Reference the issue, explain root cause |
| Workarounds       | Explain why proper fix wasn't possible  |

**Body Format**:

- Blank line after description
- Wrap at 72 characters
- Use bullet points for multiple items
- Reference issues with `#123` format

### 4.3 Commit Footer

**Enforcement**: MUST for breaking changes, SHOULD for issue references

| Footer             | Purpose                   | Format                           |
| ------------------ | ------------------------- | -------------------------------- |
| `BREAKING CHANGE:` | Document breaking changes | `BREAKING CHANGE: <description>` |
| `Closes`           | Auto-close issues         | `Closes #123`                    |
| `Fixes`            | Auto-close bug issues     | `Fixes #456`                     |
| `Refs`             | Reference without closing | `Refs #789`                      |
| `Co-authored-by`   | Credit co-authors         | `Co-authored-by: Name <email>`   |

---

## 5. Branch Naming Standards

### 5.1 Branch Name Format

**Enforcement**: MUST
**Automation**: Branch name validation in CI

```
<type>/<issue-id>-<short-description>
```

#### 5.1.1 Branch Types

| Type       | Purpose                 | Example                           |
| ---------- | ----------------------- | --------------------------------- |
| `feature`  | New features            | `feature/AL-123-add-user-auth`    |
| `fix`      | Bug fixes               | `fix/AL-456-resolve-null-error`   |
| `hotfix`   | Urgent production fixes | `hotfix/AL-789-security-patch`    |
| `chore`    | Maintenance tasks       | `chore/AL-101-update-deps`        |
| `docs`     | Documentation           | `docs/AL-102-api-reference`       |
| `refactor` | Code refactoring        | `refactor/AL-103-extract-service` |
| `test`     | Test additions          | `test/AL-104-integration-tests`   |
| `release`  | Release branches        | `release/v1.2.0`                  |

#### 5.1.2 Naming Rules

| Rule        | Requirement                      | Example         |
| ----------- | -------------------------------- | --------------- |
| Separator   | Use `/` after type               | `feature/...`   |
| Issue ID    | Include task/issue ID            | `AL-123`        |
| Description | kebab-case, 2-5 words            | `add-user-auth` |
| Length      | Maximum 50 characters total      | -               |
| Characters  | Lowercase, alphanumeric, hyphens | -               |

**Correct Examples**:

```bash
feature/AL-123-add-user-authentication
fix/AL-456-null-pointer-in-parser
chore/AL-789-update-typescript
hotfix/AL-101-security-vulnerability
release/v1.2.0
```

**Incorrect Examples**:

```bash
# WRONG: No type prefix
AL-123-add-feature

# WRONG: No issue ID
feature/add-authentication

# WRONG: Uppercase
Feature/AL-123-Add-Auth

# WRONG: Underscores
feature/AL_123_add_auth

# WRONG: Too long description
feature/AL-123-add-comprehensive-user-authentication-with-oauth-support
```

### 5.2 Protected Branches

| Branch      | Protection Level   | Direct Push |
| ----------- | ------------------ | ----------- |
| `main`      | Full protection    | Forbidden   |
| `release/*` | Full protection    | Forbidden   |
| `develop`   | Partial protection | Restricted  |

### 5.3 Branch Lifecycle

```
Creating Branch:
├─ Branch from: main (features), release/* (hotfixes)
├─ Naming: Follow convention above
└─ Push: Set upstream immediately

During Development:
├─ Commits: Follow commit standards
├─ Sync: Rebase from main regularly
└─ Push: Push frequently for backup

Completing Work:
├─ Final rebase from main
├─ Create PR
└─ Delete branch after merge
```

---

## 6. Pull Request Standards

### 6.1 PR Title Format

**Enforcement**: MUST
**Automation**: PR title linting

PR titles MUST follow the same format as commit messages:

```
<type>(<scope>): <description>
```

This enables automatic changelog generation and consistent history.

### 6.2 PR Template

**Enforcement**: MUST use template

```markdown
## Summary

<!-- Concisely describe what this PR changes and why. Focus on impact. -->

## Details

<!-- Add extra context and design decisions. Keep it brief but complete. -->

## Related Issues

<!-- Use keywords to auto-close issues (Closes #123, Fixes #456).
     For partial fixes, use: Related to #123 -->

## How to Validate

<!-- List exact steps for reviewers to validate the change. Include:
     - Commands to run
     - Expected results
     - Edge cases to test -->

## Pre-Merge Checklist

- [ ] Updated relevant documentation (if needed)
- [ ] Added/updated tests (if needed)
- [ ] Noted breaking changes (if any)
- [ ] All CI checks pass
- [ ] Self-reviewed the diff
```

### 6.3 PR Requirements

| Requirement    | Enforcement | Details                        |
| -------------- | ----------- | ------------------------------ |
| Issue Link     | MUST        | Every PR references an issue   |
| Description    | MUST        | Summary explains the change    |
| Tests          | SHOULD      | New/changed code has tests     |
| Documentation  | SHOULD      | User-facing changes documented |
| Single Purpose | MUST        | One logical change per PR      |
| Size           | SHOULD      | Under 400 lines changed        |
| CI Passing     | MUST        | All automated checks green     |

### 6.4 PR Size Guidelines

| Lines Changed | Classification | Action             |
| ------------- | -------------- | ------------------ |
| 1-50          | Small          | Quick review       |
| 51-200        | Medium         | Normal review      |
| 201-400       | Large          | Consider splitting |
| 400+          | Too Large      | MUST split         |

### 6.5 PR Review Process

```
PR Submitted
│
├─ Automated Checks
│   ├─ Lint
│   ├─ Tests
│   ├─ Build
│   └─ Security scan
│
├─ Human Review
│   ├─ Code quality
│   ├─ Design patterns
│   ├─ Test coverage
│   └─ Documentation
│
├─ Approval
│   └─ Minimum 1 approval required
│
└─ Merge
    ├─ Squash and merge (preferred)
    └─ Delete branch
```

---

## 7. Git Hooks

### 7.1 Pre-commit Hook

**Enforcement**: MUST
**Tool**: Husky + lint-staged

```bash
#!/bin/bash
# .husky/pre-commit

npm run pre-commit || {
  echo ''
  echo '===================================================='
  echo 'Pre-commit checks failed. In case of emergency, run:'
  echo ''
  echo 'git commit --no-verify'
  echo '===================================================='
  exit 1
}
```

### 7.2 Lint-Staged Configuration

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix --max-warnings 0"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### 7.3 Commit Message Hook

**Enforcement**: MUST
**Tool**: commitlint

```bash
#!/bin/bash
# .husky/commit-msg

npx --no -- commitlint --edit $1
```

**commitlint Configuration**:

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

### 7.4 Husky Setup

```json
{
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

---

## 8. Release Workflow

### 8.1 Version Format

**Format**: Semantic Versioning (SemVer)

```
<major>.<minor>.<patch>[-<prerelease>]
```

| Component    | When to Increment                  |
| ------------ | ---------------------------------- |
| `major`      | Breaking changes                   |
| `minor`      | New features (backward compatible) |
| `patch`      | Bug fixes (backward compatible)    |
| `prerelease` | Pre-release versions               |

**Examples**:

```
1.0.0           # Stable release
1.1.0           # New feature
1.1.1           # Bug fix
2.0.0           # Breaking change
1.2.0-beta.1    # Beta prerelease
1.2.0-rc.1      # Release candidate
```

### 8.2 Release Channels

| Channel | npm Tag   | Purpose             | Version Pattern          |
| ------- | --------- | ------------------- | ------------------------ |
| Stable  | `latest`  | Production releases | `1.2.3`                  |
| Preview | `preview` | Pre-release testing | `1.2.3-preview.1`        |
| Nightly | `nightly` | Daily builds        | `1.2.3-nightly.20251129` |

### 8.3 Release Branch Strategy

```
main ─────────────────────────────────────────────────▶
   │
   ├─── release/v1.0.0 ───▶ Tag v1.0.0
   │
   ├─── release/v1.1.0 ───▶ Tag v1.1.0
   │         │
   │         └─── hotfix ──▶ Tag v1.1.1
   │
   └─── release/v2.0.0 ───▶ Tag v2.0.0
```

### 8.4 Release Checklist

#### Pre-Release

- [ ] All tests passing on main
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json
- [ ] No critical issues open

#### Release

- [ ] Create release branch: `release/v<version>`
- [ ] Final testing on release branch
- [ ] Create and push tag: `v<version>`
- [ ] GitHub Release created with notes
- [ ] npm publish to appropriate channel

#### Post-Release

- [ ] Verify npm package accessible
- [ ] Verify GitHub Release correct
- [ ] Announce release (if applicable)
- [ ] Monitor for immediate issues

---

## 9. CODEOWNERS

### 9.1 CODEOWNERS File

**Location**: `.github/CODEOWNERS`

```
# Default - require maintainer review
* @org/project-maintainers

# Critical files - require additional approval
/package.json @org/release-approvers
/package-lock.json @org/release-approvers
/.github/workflows/ @org/release-approvers
/src/security/ @org/security-team

# Documentation
/docs/ @org/docs-team
*.md @org/docs-team
```

### 9.2 Ownership Rules

| Path Pattern         | Owner Group       | Review Required |
| -------------------- | ----------------- | --------------- |
| `*`                  | maintainers       | 1 approval      |
| `package*.json`      | release-approvers | 1 approval      |
| `.github/workflows/` | release-approvers | 1 approval      |
| Security-sensitive   | security-team     | 1 approval      |

---

## 10. Issue/PR Lifecycle

### 10.1 Stale Policy

| Item   | Days to Stale | Days to Close | Exempt Labels        |
| ------ | ------------- | ------------- | -------------------- |
| Issues | 60            | 14            | `pinned`, `security` |
| PRs    | 30            | 7             | `pinned`, `security` |

### 10.2 Stale Workflow Configuration

```yaml
# .github/workflows/stale.yml
name: Stale Issue Management
on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  stale:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v9
        with:
          stale-issue-message: |
            This issue has been inactive for 60 days and will be
            closed in 14 days unless there is activity.
          stale-pr-message: |
            This PR has been inactive for 30 days and will be
            closed in 7 days unless there is activity.
          days-before-stale: 60
          days-before-close: 14
          exempt-issue-labels: 'pinned,security'
          exempt-pr-labels: 'pinned,security'
```

---

## 11. Anti-Patterns

### 11.1 Forbidden Practices

| Anti-Pattern               | Problem           | Correct Practice             |
| -------------------------- | ----------------- | ---------------------------- |
| Force push to main         | Destroys history  | PR-based workflow only       |
| Merge commits to main      | Cluttered history | Squash and merge             |
| Direct commits to main     | Bypasses review   | Always use PRs               |
| Vague commit messages      | Unclear history   | Conventional commits         |
| Large PRs (400+ lines)     | Review fatigue    | Split into smaller PRs       |
| Long-lived branches        | Merge conflicts   | Short-lived feature branches |
| Commit secrets             | Security breach   | Use environment variables    |
| Skip hooks (`--no-verify`) | Bypasses checks   | Fix the underlying issue     |

### 11.2 Common Mistakes

| Mistake                    | Consequence        | Prevention              |
| -------------------------- | ------------------ | ----------------------- |
| Forgetting issue reference | Lost traceability  | PR template enforcement |
| Not rebasing before PR     | Merge conflicts    | CI check for conflicts  |
| Committing build artifacts | Bloated repository | Proper .gitignore       |
| Mixing unrelated changes   | Unclear history    | Atomic commits          |

---

## 12. Decision Flowcharts

### 12.1 Commit Type Selection

```
What kind of change is this?
│
├─ Adds new functionality?
│   └─ Yes → feat
│
├─ Fixes a bug?
│   └─ Yes → fix
│
├─ Changes documentation only?
│   └─ Yes → docs
│
├─ Changes formatting/style only?
│   └─ Yes → style
│
├─ Restructures code without changing behavior?
│   └─ Yes → refactor
│
├─ Improves performance?
│   └─ Yes → perf
│
├─ Adds or modifies tests?
│   └─ Yes → test
│
├─ Changes build system?
│   └─ Yes → build
│
├─ Changes CI configuration?
│   └─ Yes → ci
│
└─ Maintenance/housekeeping?
    └─ Yes → chore
```

### 12.2 Branch Type Selection

```
What are you working on?
│
├─ New feature?
│   └─ feature/<issue-id>-<description>
│
├─ Bug fix (not urgent)?
│   └─ fix/<issue-id>-<description>
│
├─ Urgent production fix?
│   └─ hotfix/<issue-id>-<description>
│
├─ Documentation update?
│   └─ docs/<issue-id>-<description>
│
├─ Code restructuring?
│   └─ refactor/<issue-id>-<description>
│
├─ Dependency/maintenance?
│   └─ chore/<issue-id>-<description>
│
└─ Preparing a release?
    └─ release/v<version>
```

### 12.3 Merge Strategy Selection

```
How should this PR be merged?
│
├─ Feature branch with many commits?
│   └─ Squash and merge (preferred)
│
├─ Release branch to main?
│   └─ Merge commit (preserve history)
│
├─ Hotfix needing cherry-pick later?
│   └─ Merge commit (clean cherry-pick)
│
└─ Single-commit PR?
    └─ Squash and merge (no difference)
```

---

## 13. Enforcement

### 13.1 CI/CD Validation

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation
on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate PR Title
        uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            style
            refactor
            perf
            test
            build
            ci
            chore
            revert
          requireScope: false
          subjectPattern: ^[a-z].+$
          subjectPatternError: |
            PR title must start with lowercase letter.
```

### 13.2 Branch Protection Rules

Configure via GitHub Settings → Branches → Branch protection rules:

| Rule                        | Setting |
| --------------------------- | ------- |
| Require PR before merging   | Enabled |
| Required approvals          | 1       |
| Dismiss stale reviews       | Enabled |
| Require status checks       | Enabled |
| Require branches up to date | Enabled |
| Include administrators      | Enabled |

### 13.3 Preflight Command

```json
{
  "scripts": {
    "preflight": "npm run clean && npm ci && npm run format && npm run lint && npm run build && npm run typecheck && npm run test"
  }
}
```

Run before creating a PR:

```bash
npm run preflight
```

---

## 14. Quick Reference

### 14.1 Commit Message Cheat Sheet

```
feat(scope): add new feature          # New functionality
fix(scope): resolve bug               # Bug fix
docs(scope): update documentation     # Docs only
style(scope): format code             # Formatting
refactor(scope): restructure code     # No behavior change
perf(scope): improve performance      # Performance
test(scope): add tests                # Testing
build(scope): update build            # Build system
ci(scope): update CI                  # CI config
chore(scope): maintenance             # Housekeeping
```

### 14.2 Branch Naming Cheat Sheet

```
feature/AL-123-description    # New feature
fix/AL-123-description        # Bug fix
hotfix/AL-123-description     # Urgent fix
chore/AL-123-description      # Maintenance
docs/AL-123-description       # Documentation
refactor/AL-123-description   # Restructuring
release/v1.2.0                # Release branch
```

### 14.3 Common Commands

```bash
# Create feature branch
git checkout -b feature/AL-123-add-auth

# Stage and commit
git add .
git commit -m "feat(auth): add login endpoint"

# Push and set upstream
git push -u origin feature/AL-123-add-auth

# Rebase from main
git fetch origin
git rebase origin/main

# Interactive rebase to clean up commits
git rebase -i HEAD~3

# Amend last commit message
git commit --amend -m "feat(auth): add login endpoint"

# Create tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 14.4 Issue Keywords

| Keyword           | Effect                     |
| ----------------- | -------------------------- |
| `Closes #123`     | Closes issue on merge      |
| `Fixes #123`      | Closes issue on merge      |
| `Resolves #123`   | Closes issue on merge      |
| `Refs #123`       | References without closing |
| `Related to #123` | References without closing |

---

## 15. Traceability

### 15.1 Process Index

| Process ID | Name            | Section | Trigger       |
| ---------- | --------------- | ------- | ------------- |
| PROC-001   | Commit Creation | 4.0     | Every commit  |
| PROC-002   | Branch Creation | 5.0     | Starting work |
| PROC-003   | PR Submission   | 6.0     | Work complete |
| PROC-004   | Release         | 8.0     | Release cycle |

### 15.2 Related Standards

| Standard                   | Relationship                   |
| -------------------------- | ------------------------------ |
| STD-001 Naming Conventions | Branch names follow kebab-case |
| STD-016 Build & CI/CD      | CI validates git standards     |

---

## 16. Exceptions

### 16.1 Valid Exception Scenarios

| Scenario               | Justification Required | Approver   |
| ---------------------- | ---------------------- | ---------- |
| Emergency hotfix       | Documented in PR       | Maintainer |
| Dependency bot commits | Automated prefix       | Automatic  |
| Initial project setup  | First commit exception | None       |

### 16.2 Exception Documentation

When bypassing standards (e.g., `--no-verify`):

```markdown
## Git Standard Exception: STD-009

**Date**: YYYY-MM-DD
**Commit**: <sha>
**Bypassed Check**: pre-commit hook

**Reason**: [Why this was necessary]
**Follow-up**: [Actions to prevent recurrence]
```

---

## 17. Open Questions

| Question ID | Question                          | Owner | Status  |
| ----------- | --------------------------------- | ----- | ------- |
| GQ-001      | Should we enforce signed commits? | Team  | Pending |
| GQ-002      | Maximum PR age before auto-close? | Team  | Pending |

---

## Document History

| Version | Date       | Author            | Changes         |
| ------- | ---------- | ----------------- | --------------- |
| 1.0     | 2025-11-29 | Architecture Team | Initial version |
