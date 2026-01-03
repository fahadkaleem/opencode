# Git Workflow

Reference: `design/09-coding-standards/standards-reference/09-git-workflow.md`

<git_workflow_rules>

## Commits

### Conventional Commits Format

All commits follow Conventional Commits format because it enables automated changelog generation, semantic versioning, and clear history:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

- ✓ `feat(cli): add workflow list command`
- ✓ `fix(core): handle null config gracefully`
- ✗ `updated stuff`
- ✗ `Fixed bug`

### Commit Types

Use these types to categorize changes for changelog and versioning:

| Type       | Purpose                     | Affects Version |
| ---------- | --------------------------- | --------------- |
| `feat`     | New feature                 | Minor bump      |
| `fix`      | Bug fix                     | Patch bump      |
| `docs`     | Documentation only          | -               |
| `style`    | Formatting, no code change  | -               |
| `refactor` | Code change, no feature/fix | -               |
| `perf`     | Performance improvement     | Patch bump      |
| `test`     | Adding/fixing tests         | -               |
| `build`    | Build system, dependencies  | -               |
| `ci`       | CI configuration            | -               |
| `chore`    | Maintenance tasks           | -               |
| `revert`   | Revert previous commit      | Depends         |

### Commit Description Rules

Write descriptions that make `git log --oneline` useful:

- **Lowercase start**: Consistent with Conventional Commits spec
- **Imperative mood**: "add feature" not "added feature" (matches git's own messages)
- **Max 72 chars**: Fits terminal width and GitHub UI without truncation
- **No trailing period**: It's a title, not a sentence
- **What, not how**: The diff shows how; the message explains what changed

- ✓ `feat(api): add pagination to workflow list endpoint`
- ✗ `feat(api): Added pagination to the workflow list endpoint.`

### Commit Scope

Include scope for clarity about which area changed. Common scopes:
`cli`, `core`, `api`, `config`, `deps`, `release`, `docs`, `ui`

- ✓ `fix(cli): correct argument parsing for run command`
- ✓ `chore(deps): update vitest to 1.0.0`

### Commit Body

When the description isn't enough, add a body explaining **why** (the diff shows what):

- Wrap at 72 characters for readability
- Use bullets for multiple points
- Reference issues with `#123`

```
fix(core): prevent duplicate workflow execution

The state machine was allowing re-entry during async transitions.
This caused duplicate tool calls when network latency was high.

- Add mutex lock during state transitions
- Add integration test for concurrent access

Fixes #456
```

### Commit Footer

Footers enable automation and attribution:

- **Breaking changes**: Include `BREAKING CHANGE: <description>` to trigger major version bump
- **Issue references**: `Closes #123`, `Fixes #456`, `Refs #789` (Closes/Fixes auto-close the issue)
- **Co-authorship**: `Co-authored-by: Name <email>` for pair programming attribution

```
feat(api)!: change authentication to OAuth2

BREAKING CHANGE: Bearer token format changed from JWT to OAuth2 access tokens.
Existing integrations must update their auth flow.

Closes #234
Co-authored-by: Jane Dev <jane@example.com>
```

## Branches

### Branch Name Format

Branch names use `<type>/<issue-id>-<short-description>` to enable automation and provide context:

- ✓ `feature/AL-123-add-workflow-editor`
- ✓ `fix/AL-456-null-config-crash`
- ✗ `my-branch`
- ✗ `feature/add-new-feature-to-handle-workflow-editing-and-validation`

### Branch Types

| Type       | Purpose                 |
| ---------- | ----------------------- |
| `feature`  | New functionality       |
| `fix`      | Bug fixes               |
| `hotfix`   | Urgent production fixes |
| `chore`    | Maintenance, cleanup    |
| `docs`     | Documentation changes   |
| `refactor` | Code restructuring      |
| `test`     | Test additions/fixes    |
| `release`  | Release preparation     |

### Branch Naming Rules

These constraints prevent CI issues and keep names readable:

- Use `/` as type separator (conventional, parseable)
- Include issue/task ID (e.g., `AL-123`) for traceability
- Description in `kebab-case`, 2-5 words
- Total length ≤ 50 chars (some tools truncate longer names)
- Lowercase alphanumeric + hyphens only (cross-platform safe)

### Protected Branches

Protection prevents accidental damage to shared history:

| Branch      | Protection                    |
| ----------- | ----------------------------- |
| `main`      | No direct pushes, requires PR |
| `release/*` | No direct pushes, requires PR |
| `develop`   | Direct pushes restricted      |

### Branch Lifecycle

Follow this lifecycle to keep branches clean and conflicts minimal:

1. **Create**: Branch from `main` for features; from `release/*` for hotfixes
2. **Push**: Set upstream immediately (`git push -u origin <branch>`)
3. **Sync**: Rebase from `main` regularly to catch conflicts early
4. **Prepare**: Final rebase before opening PR
5. **Cleanup**: Delete branch after merge (remote and local)

Keep branches short-lived. Long-lived branches accumulate merge conflicts and drift from main.

## Pull Requests

### PR Title Format

PR titles follow Conventional Commits format because they become the squash commit message:

- ✓ `feat(cli): add workflow list command`
- ✗ `Add workflow list`

### PR Template

Use these sections for consistent, reviewable PRs:

```markdown
## Summary

[1-2 sentence overview]

## Details

[Implementation details, design decisions]

## Related Issues

Closes #123

## How to Validate

1. Step to reproduce/test
2. Expected outcome

## Pre-Merge Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console.logs or debug code
```

### PR Requirements

Every PR must meet these criteria for maintainable history:

- **References an issue**: Links work to requirements
- **Has summary/description**: Reviewers need context
- **Single-purpose**: One logical change (easier to review, revert, bisect)
- **CI checks green**: Automated quality gate
- **Tests included**: Where behavior changes
- **Docs updated**: Where user-facing behavior changes

### PR Size Guidelines

Smaller PRs get faster, better reviews:

| Lines Changed | Category  | Review Approach              |
| ------------- | --------- | ---------------------------- |
| 1-50          | Small     | Quick review, same-day merge |
| 51-200        | Medium    | Normal review cycle          |
| 201-400       | Large     | Consider splitting           |
| 400+          | Too large | Split into smaller PRs       |

PRs over 400 lines have significantly higher defect rates and review fatigue.

### PR Review & Merge

- **Minimum 1 approval** required before merge
- **Squash-and-merge** for feature branches (clean history)
- **Merge commits** for release branches and hotfixes (preserves history for cherry-pick)
- **Delete branch** after merge (both remote and local)

## Tooling & Automation

### Git Hooks

Hooks catch issues before they reach CI, saving time:

| Hook         | Tool                | Purpose                       |
| ------------ | ------------------- | ----------------------------- |
| `pre-commit` | Husky + lint-staged | Format and lint staged files  |
| `commit-msg` | commitlint          | Enforce commit message format |

Run `npm run pre-commit` to see what the hook executes.

### commitlint Rules

These rules enforce Conventional Commits:

| Rule                   | Value              | Purpose                       |
| ---------------------- | ------------------ | ----------------------------- |
| `type-enum`            | Allowed types list | Consistent categorization     |
| `subject-case`         | `lower-case`       | Conventional Commits spec     |
| `subject-max-length`   | `72`               | Fits standard terminal width  |
| `body-max-line-length` | `100`              | Readable in terminals/editors |

### CI Enforcement

Branch protection rules ensure quality:

- PR title linting (Conventional Commits format)
- Require PR for protected branches
- Require 1 approval minimum
- Require status checks to pass
- Require branch to be up-to-date with base
- Include administrators (no bypass)

### Preflight Check

Run before creating a PR to catch issues locally:

```bash
npm run preflight
```

This runs: `clean && ci && format && lint && build && typecheck && test`

## Releases

### Versioning (SemVer)

Use Semantic Versioning `<major>.<minor>.<patch>[-<prerelease>]`:

| Change Type     | Version Bump       | Example       |
| --------------- | ------------------ | ------------- |
| Breaking change | Major              | 1.0.0 → 2.0.0 |
| New feature     | Minor              | 1.0.0 → 1.1.0 |
| Bug fix         | Patch              | 1.0.0 → 1.0.1 |
| Pre-release     | Pre-release suffix | 1.1.0-beta.1  |

### Release Channels

| Channel   | Version Pattern          | Purpose                    |
| --------- | ------------------------ | -------------------------- |
| `latest`  | `1.2.3`                  | Stable production releases |
| `preview` | `1.2.3-preview.1`        | Release candidates         |
| `nightly` | `0.0.0-nightly.20240115` | Daily builds               |

### Release Flow

1. Create `release/v<version>` branch from `main`
2. Update version, changelog, documentation
3. Create PR, get approval, merge
4. Tag `v<version>` on main
5. Create GitHub release with changelog
6. Publish to npm
7. Delete release branch

### CODEOWNERS

Maintain `.github/CODEOWNERS` for automatic review assignment:

```
# Critical paths require specific reviewers
package*.json @core-team
.github/workflows/ @devops-team
src/security/ @security-team
docs/ @docs-team
```

### Stale Policy

Keeps the backlog clean:

| Item   | Stale After | Close After | Exempt Labels        |
| ------ | ----------- | ----------- | -------------------- |
| Issues | 60 days     | 14 days     | `pinned`, `security` |
| PRs    | 30 days     | 7 days      | `pinned`, `security` |

</git_workflow_rules>

## Preferences

- **Commit scope**: Include scope for clarity about which area changed
- **Commit body**: Explain "why" when the description isn't enough; wrap at 72 chars
- **Issue keywords**: Use `Closes`/`Fixes`/`Resolves` to auto-close; `Refs`/`Related to` for references
- **Short-lived branches**: Rebase early/often; avoid mixing unrelated changes; prefer atomic commits

## Exceptions

When emergency situations require bypassing standards:

- **Valid scenarios**: Emergency hotfixes, dependency bot commits, initial project setup
- **Documentation**: Add a "Git Standard Exception: STD-009" note with:
  - Date and commit SHA
  - Which check was bypassed
  - Reason for bypass
  - Follow-up action (if any)

Example bypass (use sparingly):

```bash
# Emergency hotfix - production down
git commit --no-verify -m "hotfix(api): disable rate limiting temporarily

Git Standard Exception: STD-009
Date: 2024-01-15
Bypassed: pre-commit hooks
Reason: Production incident, need immediate deploy
Follow-up: AL-999 to re-enable and add proper fix"
```

## Verification Checklist

When reviewing commits and PRs for workflow compliance:

### Commits

- [ ] Message follows `<type>(<scope>): <description>` format
- [ ] Type is one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- [ ] Description starts lowercase, imperative mood, ≤72 chars, no period
- [ ] Breaking changes have `BREAKING CHANGE:` footer
- [ ] Issue references use proper keywords (Closes, Fixes, Refs)
- [ ] No vague messages ("fix bug", "update", "WIP")

### Branches

- [ ] Name follows `<type>/<issue-id>-<description>` format
- [ ] Type is valid (feature, fix, hotfix, chore, docs, refactor, test, release)
- [ ] Includes issue/task ID
- [ ] Description is kebab-case, 2-5 words
- [ ] Total length ≤50 chars

### Pull Requests

- [ ] Title follows Conventional Commits format
- [ ] References related issue(s)
- [ ] Has meaningful summary/description
- [ ] Single-purpose (one logical change)
- [ ] Size is reasonable (<400 lines, ideally <200)
- [ ] All CI checks pass
- [ ] Tests included for behavior changes
- [ ] Documentation updated if user-facing

### Pre-Merge

- [ ] At least 1 approval received
- [ ] Branch is up-to-date with base
- [ ] `npm run preflight` passes locally
- [ ] No secrets or build artifacts in diff
- [ ] Merge strategy appropriate (squash for features, merge for releases)
