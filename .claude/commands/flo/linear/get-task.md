---
description: Fetch a Linear issue and create local task.json
model: haiku
---

# Get Linear Issue

Fetch a Linear issue by identifier and save it as a local task.json file.

---

## Prerequisites

<prerequisites>
- REQUIRED: `$ARGUMENTS` - Linear issue identifier (e.g., FL-1, TEST-123)
- If missing, use AskUserQuestion to prompt:
  - Question: "Which Linear issue should I fetch?"
  - Header: "Issue ID"
  - Options: "Enter ID" with description "e.g., FL-1, TEST-123"
</prerequisites>

---

## Setup

Create todos using TodoWrite to track progress through these steps.

---

## Execution

<steps>
1. Parse issue identifier from $ARGUMENTS

2. Call `mcp__linear__get_issue` with the identifier
   - If not found, return `FAIL|linear_fetch|Issue {identifier} not found`

3. Derive issue type from labels:
   - Contains "bug" → type = "bugfix"
   - Contains "chore" → type = "chore"
   - Otherwise → type = "feature"

4. Create directory `.flo/tasks/{identifier}/`

5. Write `.flo/tasks/{identifier}/task.json`:

```json
{
  "source": "linear",
  "identifier": "{identifier}",
  "title": "{title}",
  "description": "{description}",
  "url": "{url}",
  "status": "{status}",
  "type": "{derived_type}",
  "team": "{team}",
  "teamId": "{teamId}",
  "labels": [],
  "createdAt": "{createdAt}",
  "updatedAt": "{updatedAt}",
  "flo": {
    "phase": "fetched",
    "branch": null,
    "startedAt": null,
    "completedAt": null,
    "artifacts": {}
  }
}
```

</steps>

---

## Constraints

<constraints>
- Only fetch and save data; do not modify the Linear issue
- Do not create any files other than task.json
- Do not start any git operations or other workflow steps
- Preserve the full description markdown as-is
</constraints>

---

## Success Criteria

<success>
- task.json exists at `.flo/tasks/{identifier}/task.json`
- task.json is valid JSON with all required fields
</success>

---

## Artifact

<artifact>
path: `.flo/tasks/{identifier}/task.json`
</artifact>

---

## Return

**CRITICAL:** Your final response must be ONLY the JSON object below.

- No preamble (no "Here's the result:", no "I've completed...", no explanation)
- No postamble (no summary, no "Let me know if...", no follow-up text)
- Just the raw JSON object, nothing else

<return>
```json
{
  "status": "SUCCESS",
  "artifact": ".flo/tasks/{identifier}/task.json",
  "message": "Fetched {identifier} from Linear",
  "next_step": "/flo:git:branch {identifier}"
}
```
</return>

On failure:

<return>
```json
{
  "status": "FAIL",
  "artifact": null,
  "message": "Issue {identifier} not found in Linear",
  "next_step": "Verify the issue ID and retry /flo:linear:get-task {identifier}"
}
```
</return>
