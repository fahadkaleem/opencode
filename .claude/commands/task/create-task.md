---
description:
  Create Jira tasks (Epic, Task, Subtask) following spec-compliant format
model: sonnet
---

# Create Jira Task with Spec Format

Create a new task in Jira following the comprehensive format from
spec-to-tasks-generic-v2.md. This command supports creating Epics, Tasks, and
Subtasks with proper structure including Context, Implementation Notes,
Acceptance Criteria, AC Verification, and Dependencies.

## Input Methods

**1. Direct parameter with summary:**

```
/task/create-task [summary]
```

**2. Direct parameter with type and summary:**

```
/task/create-task type=Epic|Task|Subtask summary="Task title"
```

**3. Interactive mode (no parameters):**

```
/task/create-task
```

## Initial Context Gathering

<procedure>
1. Parse the command parameter to extract any provided details:
   - Check for `type=` parameter (Epic, Task, or Subtask)
   - Check for `parent=` parameter (for Subtask)
   - Check for `summary=` parameter or use remaining text as summary
   - Note which details are already provided

2. Identify what information is missing and proceed to gather it </procedure>

## Step 1: Determine Task Type (if not provided)

<procedure>
1. If task type already provided in parameter, skip to Step 2

2. If task type NOT provided, use AskUserQuestion tool to ask: </procedure>

Use `AskUserQuestion` with the following configuration:

```json
{
  "questions": [
    {
      "question": "What type of Jira issue would you like to create?",
      "header": "Issue Type",
      "multiSelect": false,
      "options": [
        {
          "label": "Epic",
          "description": "High-level feature or initiative spanning multiple tasks"
        },
        {
          "label": "Task",
          "description": "Standard work item with implementation details"
        },
        {
          "label": "Subtask",
          "description": "Sub-component of an existing task (requires parent)"
        }
      ]
    }
  ]
}
```

<procedure>
3. Store the selected task type
4. Proceed to Step 2
</procedure>

## Step 2: Get Parent Task ID (if Subtask)

<procedure>
1. If task type is NOT "Subtask", skip to Step 3

2. If task type IS "Subtask" and parent NOT provided in parameter: </procedure>

<message>
You're creating a Subtask. Please provide the parent task ID.

**Parent Task ID** (required for subtasks): Enter the ID of the parent task
(e.g., AL-22) </message>

<procedure>
3. Wait for user to provide parent task ID

4. Validate format (should match pattern like AL-\d+, PROJ-\d+)

5. Store parent task ID

6. Proceed to Step 3 </procedure>

## Step 3: Get Task Summary (if not provided)

<procedure>
1. If summary already provided in parameter, skip to Step 4

2. If summary NOT provided, prompt user: </procedure>

<message>
**Task Summary** (required):

Provide a clear, concise title for the task.

**Format guidance:**

- For service/repository tasks: `[repository-name] Action verb + target`
- For special types: `[Review] Document Name` or `Create TableName table`

**Examples:**

- `[search-service] Create ElasticSearch client`
- `[algorithms-lib] Implement scoring algorithm`
- `Create SearchHistory database table`
- `[Review] Advanced Search Tech Spec`

Enter your task summary: </message>

<procedure>
3. Wait for user input

4. Validate summary is not empty

5. Store summary

6. Proceed to Step 4 </procedure>

## Step 4: Build Context Section

<message>
Now let's build the **Context** section of your task.

The Context section should explain:

- WHAT needs to be done (1-3 paragraphs)
- WHY it's needed
- Link to relevant tech spec (if available)

**Context paragraphs:** Please provide the main context for this task. You can
provide multiple paragraphs. </message>

<procedure>
1. Wait for user to provide context paragraphs

2. Store context content

3. Ask if Implementation Notes are needed using AskUserQuestion: </procedure>

Use `AskUserQuestion`:

```json
{
  "questions": [
    {
      "question": "Do you want to add Implementation Notes with technical details?",
      "header": "Impl Notes",
      "multiSelect": false,
      "options": [
        {
          "label": "Yes",
          "description": "Add technical details, algorithms, schemas, or references"
        },
        {
          "label": "No",
          "description": "Skip Implementation Notes section"
        }
      ]
    }
  ]
}
```

<procedure>
4. If user selects "Yes", prompt for Implementation Notes:
</procedure>

<message>
**Implementation Notes** (technical details):

Provide technical details such as:

- Specific algorithms or formulas
- Database schemas
- API endpoints and authentication
- External documentation links
- Code examples or pseudo-code
- Configuration details

Enter Implementation Notes: </message>

<procedure>
5. Wait for user input and store Implementation Notes

6. Proceed to Step 5 </procedure>

## Step 5: Build Acceptance Criteria

<message>
Now let's define **Acceptance Criteria** for this task.

Acceptance Criteria should be:

- Specific and measurable
- Independently verifiable
- Present tense ("is created", "returns", "can fetch")
- Include both functional AND non-functional requirements

**Provide acceptance criteria** (one per line or as bullet points): </message>

<procedure>
1. Wait for user to provide acceptance criteria

2. Parse into bullet points if not already formatted

3. Store acceptance criteria

4. Proceed to Step 6 </procedure>

## Step 6: AC Verification (Auto-filled as TBD)

<procedure>
1. Automatically set AC Verification content as:

```
### AC Verification

TBD (will be filled later with specific verification steps, URLs, commands, and expected outcomes)
```

2. No user input needed for this section

3. Proceed to Step 7 </procedure>

## Step 7: Build Dependencies Section

<procedure>
1. Ask user about dependencies using AskUserQuestion:
</procedure>

Use `AskUserQuestion`:

```json
{
  "questions": [
    {
      "question": "Does this task have dependencies on other tasks?",
      "header": "Dependencies",
      "multiSelect": false,
      "options": [
        {
          "label": "Yes",
          "description": "This task is blocked by or blocks other tasks"
        },
        {
          "label": "No",
          "description": "No dependencies (can work independently)"
        }
      ]
    }
  ]
}
```

<procedure>
2. If user selects "Yes", prompt for dependency details:
</procedure>

<message>
**Dependencies:**

Please specify blocking relationships.

**Format:**

- Blocked by: [task IDs or descriptions]
- Blocks: [task IDs or descriptions]

**Example:**

- Blocked by: AL-20 (database table creation)
- Blocks: AL-25 (integration testing)

Enter dependencies: </message>

<procedure>
3. Wait for user input and store dependencies

4. If user selects "No", set dependencies as "None"

5. Proceed to Step 8 </procedure>

## Step 8: Collect Optional Metadata

<procedure>
1. Use AskUserQuestion to ask about additional metadata:
</procedure>

Use `AskUserQuestion`:

```json
{
  "questions": [
    {
      "question": "What priority should this task have?",
      "header": "Priority",
      "multiSelect": false,
      "options": [
        {
          "label": "High",
          "description": "Critical or time-sensitive work"
        },
        {
          "label": "Medium",
          "description": "Standard priority (default)"
        },
        {
          "label": "Low",
          "description": "Nice to have or future work"
        }
      ]
    },
    {
      "question": "Should this task be assigned to someone?",
      "header": "Assignee",
      "multiSelect": false,
      "options": [
        {
          "label": "Assign to me",
          "description": "Assign this task to yourself"
        },
        {
          "label": "Leave unassigned",
          "description": "Don't assign anyone yet"
        },
        {
          "label": "Assign to someone else",
          "description": "Specify email or account ID"
        }
      ]
    }
  ]
}
```

<procedure>
2. If user selects "Assign to someone else", prompt for assignee:
</procedure>

<message>
**Assignee:**
Enter the assignee's email address or account ID:
</message>

<procedure>
3. Wait for assignee input

4. Store priority and assignee selections

5. Proceed to Step 9 </procedure>

## Step 9: Assemble Task Description

<procedure>
1. Build the complete task description with CORRECTED heading levels:

```markdown
### Context

{context_paragraphs}

{optional: #### Implementation Notes} {optional: implementation_notes_content}

### Acceptance Criteria

{acceptance_criteria_bullets}

### AC Verification

TBD (will be filled later with specific verification steps, URLs, commands, and
expected outcomes)

### Dependencies

{dependencies_content}
```

2. Important: Use ### (H3) for main sections, #### (H4) for subsections

3. Store the assembled description

4. Proceed to Step 10 </procedure>

## Step 10: Create Task in Jira

<procedure>
1. Build the alfred task create command with all collected information:

For Epic or Task:

```bash
alfred task create -t {type} -s "{summary}" -d "{description}" --priority {priority} [-a {assignee}]
```

For Subtask:

```bash
alfred task create -t Subtask --parent {parent_id} -s "{summary}" -d "{description}" --priority {priority} [-a {assignee}]
```

2. Execute the command using Bash tool

3. Capture the output (task ID, status)

4. If error occurs:
   - Parse error message
   - Provide clear explanation
   - Suggest corrections
   - Ask if user wants to retry with corrections

5. If successful, extract task ID and proceed to Step 11 </procedure>

## Step 11: Confirmation and Next Steps

<procedure>
1. Fetch the created task to verify:

```bash
alfred task get {taskId} --format text
```

2. Present success message with task details: </procedure>

<output_format>

# Task Created Successfully!

**{Task ID}**: {Summary}

## Task Type

- **Type:** {Epic/Task/Subtask}
- **Status:** {status}
- **Priority:** {priority}
- **Assignee:** {assignee or "Unassigned"}

## Description Preview

### Context

{first 100 chars of context}...

### Acceptance Criteria

{first 2 criteria}...

### AC Verification

TBD (will be filled later)

### Dependencies

{dependencies}

## Next Steps

**View full task in Jira:** The task has been created and cached locally at
`.alfred/tasks/{taskId}/`

**Quick actions:**

- View full details: `/task/get-task {taskId}`
- Update task: `alfred task update {taskId}`
- Add AC Verification:
  `alfred task update {taskId} -d "...updated description..."`
- Transition status: `/task/transition-task {taskId}`
- Assign to someone: `alfred task assign {taskId}`
- Run workflow: `alfred workflow <name> --task {taskId}`

**Pro tip:** You can update the AC Verification section later once you have
specific verification steps, URLs, and expected outcomes. </output_format>

## Important Guidelines

**Task Type Selection:**

- **Epic**: Use for high-level features spanning multiple tasks
- **Task**: Standard implementation work with full details
- **Subtask**: Component of a larger task (requires parent ID)

**Heading Levels (CRITICAL):**

- Use `###` (H3) for main sections: Context, Acceptance Criteria, AC
  Verification, Dependencies
- Use `####` (H4) for subsections: Implementation Notes
- This ensures proper hierarchy under the main task description

**Required vs Optional Sections:**

- **Required**: Context, Acceptance Criteria
- **Auto-filled**: AC Verification (always TBD)
- **Optional**: Implementation Notes, Dependencies

**Context Section Best Practices:**

- Keep to 1-3 paragraphs
- Explain WHAT and WHY clearly
- Include tech spec links if available
- Move technical details to Implementation Notes

**Acceptance Criteria Best Practices:**

- Use present tense ("is created", not "should be created")
- Make them specific and measurable
- Include both functional and non-functional requirements
- Each criterion should be independently verifiable

**AC Verification:**

- Always starts as "TBD"
- Should be updated later with:
  - Specific URLs for review environments
  - Commands to run (curl, SQL queries)
  - Expected outcomes for each verification step
  - Database queries or API calls

**Dependencies:**

- Document blocking relationships clearly
- Reference specific task IDs when known
- Explain WHY the dependency exists
- Use format: "Blocked by: ...", "Blocks: ..."

**AskUserQuestion Usage:**

- The command uses AskUserQuestion extensively for better UX
- Users can click options instead of typing
- Only asks questions for information not already provided
- Makes task creation faster and more intuitive

**Error Handling:**

- Invalid project: List available projects
- Invalid type: Show available types for the project
- Invalid parent ID: Verify parent exists
- Invalid assignee: Suggest using email or "me"
- Network errors: Check Jira connection

## Example Sessions

<example>
**Scenario 1: Interactive mode with all questions**

User: /task/create-task

Assistant: [Uses AskUserQuestion tool for issue type]

What type of Jira issue would you like to create?

- Epic
- Task
- Subtask

User: Task

Assistant: **Task Summary** (required): Provide a clear, concise title for the
task.

User: [search-service] Implement query caching

Assistant: Now lets build the **Context** section of your task.

User: We need to add caching for search queries to reduce load on ElasticSearch
and improve response times. Currently every search hits the cluster directly.

Assistant: [Uses AskUserQuestion - Do you want Implementation Notes?]

User: Yes

Assistant: **Implementation Notes** (technical details):

User: - Use Redis for cache storage

- TTL: 5 minutes for search results
- Cache key format: search:{query_hash}
- Invalidate on index updates

Assistant: Now lets define **Acceptance Criteria**:

User:

- Redis cache client configured and connected
- Search queries check cache before hitting ElasticSearch
- Cache TTL set to 5 minutes
- Cache invalidation works on index updates
- Unit tests cover cache hit and miss scenarios
- Latency improved by 50% for cached queries

Assistant: AC Verification will be set as TBD.

[Uses AskUserQuestion - Dependencies?]

User: No

Assistant: [Uses AskUserQuestion - Priority and Assignee]

User selects: Medium priority, Assign to me

Assistant: Creating task...

[Executes: alfred task create -t Task -s "[search-service] Implement query
caching" -d "..." --priority Medium -a me]

# Task Created Successfully\!

**AL-24**: [search-service] Implement query caching

## Task Type

- **Type:** Task
- **Status:** To Do
- **Priority:** Medium
- **Assignee:** Mohammed Fahad Kaleem

## Next Steps

Task created and cached locally. You can now run workflows or update the AC
Verification section. </example>

<example>
**Scenario 2: Quick creation with type parameter**

User: /task/create-task type=Epic summary="Advanced Search Feature"

Assistant: Creating an Epic with summary "Advanced Search Feature".

[Skips type question, goes directly to Context]

Now lets build the **Context** section...

[Rest of flow continues normally] </example>

<example>
**Scenario 3: Creating a Subtask**

User: /task/create-task type=Subtask

Assistant: You are creating a Subtask. Please provide the parent task ID.

**Parent Task ID** (required for subtasks): Enter the ID of the parent task
(e.g., AL-22)

User: AL-22

Assistant: **Task Summary** (required):

User: Add connection retry logic

[Continues with Context, Acceptance Criteria, etc.]

[Executes: alfred task create -t Subtask --parent AL-22 -s "Add connection retry
logic" -d "..."]

# Task Created Successfully\!

**AL-25**: Add connection retry logic

## Task Type

- **Type:** Subtask
- **Parent:** AL-22
- **Status:** To Do </example>

## Related Commands

- `/task/get-task` - Fetch and view task details
- `/task/transition-task` - Change task status
- `/task/assign-task` - Assign task to user
- `alfred task update` - Update task fields

CRITICAL - Each time you present a question to the user, where you give options
or waiting for a response, use `AskUserQuestion` to make it easier to accept
responses.
