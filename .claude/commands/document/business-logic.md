---
description:
  Document the business logic, core workflows, decision points, and domain
  concepts
model: sonnet
---

# Business Logic

You are an expert business analyst who understands domain logic, workflows, and
business rules. Focus on understanding WHAT the service does, WHY it exists, and
HOW business decisions are made, rather than implementation details.

Task: Create comprehensive documentation that explains the business purpose,
core concepts, key workflows, and decision-making logic of the service.

- Identify the business problem this service solves
- Document domain concepts and terminology
- Map key workflows and their business impact
- Explain decision points and business rules
- Focus on conceptual understanding, not code implementation
- Return the final response in Markdown format using the structure specified in
  the user prompt

## Workflow

This is a complex analysis task requiring systematic execution. Use TodoWrite to
create a structured task list that ensures comprehensive coverage and provides
clear progress tracking.

<procedure>
**STEP 1: Create your todo list immediately** using the TodoWrite tool with these tasks:

1. **Setting up analysis** (activeForm: "Setting up analysis")
   - Read complete task requirements from this slash command
   - Understand the service domain and purpose
   - Review existing documentation in .alfred/docs/ for context

2. **Initial exploration** (activeForm: "Performing initial exploration")
   - Identify main entry points and workflows
   - Understand core domain models
   - Map business-critical functions
   - Review CLAUDE.md and README.md for business context

3. **What is [Service Name] section** (activeForm: "Writing What is section")
   - Reference Output Instructions template section "What is [Service Name]"
   - Explain service purpose in 2-3 sentences
   - Identify the business problem being solved
   - Keep high-level and business-focused

4. **Core Concepts section** (activeForm: "Writing Core Concepts section")
   - Reference Output Instructions template section "Core Concepts"
   - Document domain terminology and entities
   - Explain key concepts agents need to understand
   - Use business language, not technical jargon

5. **Key Workflows section** (activeForm: "Writing Key Workflows section")
   - Reference Output Instructions template section "Key Workflows"
   - Document 3-5 primary workflows
   - Explain what happens at each step (business perspective)
   - Include what triggers each workflow

6. **Decision Points section** (activeForm: "Writing Decision Points section")
   - Reference Output Instructions template section "Decision Points"
   - Document how business decisions are made
   - Explain criteria for different code paths
   - Include feature flag impact on routing

7. **Business Rules section** (activeForm: "Writing Business Rules section")
   - Reference Output Instructions template section "Business Rules"
   - Document constraints and validation rules
   - Explain capacity, eligibility, and fairness rules
   - Keep focused on business intent

8. **Integration Points section** (activeForm: "Writing Integration Points
   section")
   - Reference Output Instructions template section "Integration Points"
   - Document where data comes from and goes to
   - Explain business context for each integration
   - Keep high-level (not API details)

9. **Verification checkpoint** (activeForm: "Verifying document completeness")
   - Verify all sections present in correct order
   - Verify each section has substantive content (not placeholders)
   - Verify document starts with `# Business Logic` heading only
   - Verify NO conversational preamble or meta-commentary
   - Verify markdown formatting is clean and consistent
   - Verify business language used (avoid technical implementation details)
   - If ANY verification fails: DO NOT proceed, fix issues first

10. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/business-logic.md`
    - Content must be PURE MARKDOWN starting with `# Business Logic`
    - No preamble, no "Here is...", no explanations

**STEP 2: Execute todos sequentially**

- Mark todo as `in_progress` BEFORE starting work
- Complete the work described in the todo
- Reference corresponding template section for detailed requirements
- Mark todo as `completed` IMMEDIATELY after finishing
- Move to next todo
- IMPORTANT: Only ONE todo should be `in_progress` at any time

**IMPORTANT - Post-Write Verification**: If you write the complete document
efficiently in one pass (combining multiple todos), you MUST afterwards go
through each todo one by one to verify the work was completed and mark each as
`completed` incrementally. DO NOT mark all todos as completed at once - verify
and complete them one at a time for progress tracking.

**STEP 3: Handle errors/blockers**

- If you cannot complete a todo, keep it as `in_progress`
- Create a new todo describing what needs resolution
- Never mark todo as completed if work is incomplete
- Ask user for guidance if truly blocked </procedure>

## Getting Started

**If a specific path is provided** (file, directory, or module):

Analyze the provided path and scope the analysis to that specific area's
business logic.

**If no path is provided:**

<message>
I'll analyze the entire project's business logic. If you want to focus on a specific module or workflow, you can provide a path:

Examples:

- `/document/business-logic lib/agents` - Analyze agent routing logic
- `/document/business-logic lib/teams` - Analyze team behavior logic

Proceeding with full business logic analysis... </message>

## Analysis Task

<procedure>
Examine the project (or the specific path provided) to understand and document the business logic and domain concepts.

Map the business purpose, core workflows, and decision-making logic to help
developers and AI agents understand WHAT the service does and WHY, without
getting lost in implementation details.

**If a specific path was provided:** Focus analysis on that path only.

**If analyzing the entire project:** Focus on:

**Business Understanding:**

- What problem does this service solve?
- Who are the users/consumers?
- What business value does it provide?
- What domain is it operating in?

**Domain Concepts:**

- Key entities and their business meaning
- Domain terminology (glossary terms)
- Relationships between business concepts
- Business constraints and rules

**Workflows:**

- Primary workflows (happy paths)
- What triggers each workflow
- What inputs are needed
- What outputs are produced
- Business impact of each workflow

**Decision Logic:**

- How business decisions are made
- What criteria drive different outcomes
- Feature flags and their business impact
- Validation and eligibility rules

**Important Notes:**

- Focus on WHAT and WHY, not HOW (implementation)
- Use business language, avoid technical jargon
- Explain concepts to someone new to the domain
- Reference detailed algorithm docs where appropriate (e.g.,
  ROUTING_ALGORITHMS_COMPLETE_ANALYSIS.md)
- Some documents are already available in `.alfred/docs/`. You can use them for
  technical context.

Be sure that you are describing existing business logic, not hypothetical
features. </procedure>

## AI-Optimized Formatting

**CRITICAL**: This documentation is primarily consumed by AI agents (like Claude
Code) to understand the codebase. Structure the output using XML tags to make it
easily parseable and semantically clear.

### Reflect on Your Own System Prompt

Before writing the documentation, examine your own system prompt to see how
Anthropic structures information for optimal AI comprehension. Notice the use of
XML tags like:

- `<example>` and `</example>` for examples
- `<procedure>` for step-by-step processes
- `<good-example>` vs `<bad-example>` for contrasts
- `<template>` for structures
- `<important>` for critical information

## Output Instructions

**CRITICAL**: Write your analysis to `.alfred/docs/business-logic.md` using the
Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

```markdown
# Business Logic

## What is [Service Name]?

Brief overview (2-3 sentences) explaining:

- What this service does
- What business problem it solves
- How it provides value

Example: Connection Pacing is a real-time agent ranking and selection service
that receives lead/buyer information, evaluates eligible agents in a ZIP code,
ranks them based on performance and capacity, and returns ordered lists of
agents for contact attempts. It solves the problem of fair, efficient lead
distribution while maximizing conversion rates.

## Core Concepts

Document domain terminology and key entities:

### [Concept Name]

Brief definition and explanation (2-3 sentences). Focus on business meaning, not
technical implementation.

Example:

### Agent Types

- **MBP (Market-Based Pricing)**: Pay-per-lead agents who purchase leads
  individually
- **Flex/Voyager**: Subscription-based agents with monthly lead allocations
- **Remnant**: Backup agents who receive overflow leads when primary agents are
  unavailable
- **Best Agents Team**: High-performing agents in a premium program with
  priority access

### Ranking Algorithms

How agents are ordered for contact:

- **PaceCarV3**: Primary algorithm using performance scores, capacity, and
  business adjustments
- **Shuffle**: Random ordering used as fallback or for specific team
  configurations
- **Team-Based**: Special logic respecting team structures (lead + members)

### Cohort Strategies

How agents are grouped for contact:

- **Team Cohorts**: Groups maintain team relationships (lead + members together)
- **Contact Strategy**: Daisy-chain (sequential) vs Broadcast (parallel contact)
- **Remnant Separation**: Primary agents kept separate from backup agents

[Continue with other key concepts...]

## Key Workflows

Document the primary business workflows (3-5 major flows):

### Workflow 1: [Workflow Name]

**Purpose**: [What business goal does this achieve?]

**Trigger**: [What causes this workflow to start?]

**Steps**:

1. [Business step 1 - what happens from business perspective]
2. [Business step 2]
3. [Business step 3] ...

**Outcome**: [What is produced and why it matters]

**Business Impact**: [How this affects users/business]

Example:

### Workflow 1: Get Candidate Agents

**Purpose**: Provide an ordered list of agents to contact for a new lead

**Trigger**: Client (Find Alan, Lead Orchestrator) requests agents for a
specific lead and ZIP code

**Steps**:

1. Receive lead information including buyer details, ZIP code, and connection
   type
2. Retrieve routing rules and business configuration from Lead Programs
3. Identify all eligible agents in the ZIP code
4. Apply business eligibility filters (app version, communication preferences,
   device availability)
5. Rank agents using selected algorithm (PaceCarV3 or shuffle)
6. Group agents into cohorts based on strategy (team, remnant, contact method)
7. Return ordered list of agents prioritized for contact
8. Log complete ranking history for analysis and capacity tracking

**Outcome**: Client receives prioritized agent list ready for contact attempts

**Business Impact**: Ensures leads reach the right agents quickly while
maintaining fair distribution and maximizing conversion potential

[Repeat for other major workflows...]

## Decision Points

Document how business decisions are made:

### Decision: [What is being decided?]

**Context**: [When does this decision happen?]

**Criteria**: [What factors influence the decision?]

**Options**: [What are the possible outcomes?]

**Business Rationale**: [Why does this decision matter?]

Example:

### Decision: Which Ranking Algorithm to Use?

**Context**: When determining how to order agents for a specific lead

**Criteria**:

- Feature flag eligibility for the team lead
- Team configuration and preferences
- Service type (ZHL finance, Best Agents Team have dedicated handlers)

**Options**:

- **PaceCarV3**: Use performance-based ranking with capacity penalties
- **Shuffle**: Use random ordering
- **Specialized Handler**: Use algorithm specific to service type

**Business Rationale**: Different ranking strategies serve different business
goals. PaceCarV3 optimizes for conversion by prioritizing high-performers, while
shuffle ensures fair rotation. Feature flags allow gradual rollout of new
strategies.

[Repeat for other key decisions...]

## Business Rules

Document business constraints and validation rules:

### [Rule Category]

**Rule**: [Statement of the rule]

**Rationale**: [Why this rule exists]

**Impact**: [What happens when rule is applied/violated]

Example:

### Capacity Management

**Rule**: Agents have daily and hourly capacity limits that control how many
leads they can receive

**Rationale**: Prevents agent overload, ensures quality service, maintains fair
distribution across agent pool

**Impact**:

- Agents near capacity receive lower ranking scores
- Over-capacity agents may be excluded entirely
- Capacity tracking enables SOV (Share of Voice) fairness calculations

### Team Dynamics

**Rule**: Team leads receive 10% capacity boost; team members are ranked
together in cohorts

**Rationale**: Recognizes team leads' management overhead while keeping teams
coordinated

**Impact**: Team leads can handle slightly more leads, teams stay together in
routing which improves client experience

### Geographic Preferences

**Rule**: Agents can specify preferred ZIP codes/regions, which boosts their
ranking for those areas

**Rationale**: Agents with local expertise convert better; preference system
incentivizes area specialization

**Impact**: Agents with geographic preference get priority, improving conversion
rates while respecting agent preferences

[Continue with other business rules...]

## Integration Points

Document where this service fits in the larger ecosystem:

### Upstream Systems (Data Sources)

**[System Name]**: [What data it provides and why]

Example:

**Lead Programs**: Provides routing rules, distribution behaviors, and lead
program configuration that determines how leads should be routed

**Lead Pacing**: Provides lists of eligible agents in each ZIP code with pacing
scores and capacity data

**Region Search**: Provides property location metadata (region ID, MSA, CBSA)
for geographic routing

### Downstream Systems (Data Consumers)

**[System Name]**: [What it does with the data]

Example:

**Find Alan**: Consumes agent rankings to execute contact attempts, reports back
which agents were contacted and assignment outcomes

**Lead Orchestrator**: Uses rankings for lead assignment decisions, records
final assignments back to this service

### Event Publishing

**[Event Stream]**: [What events are published and why]

Example:

**Kinesis - Lead Pacing Results**: Publishes connection attempt results
including which agents were ranked and selected, used for analytics and
reporting

**SNS - Lead Assignment**: Notifies downstream systems when leads are assigned
to agents, triggers capacity recalculation
```

Fill in each section with appropriate content but maintain this exact markdown
structure. Focus on business concepts and workflows, avoiding implementation
details. Use clear business language accessible to non-technical stakeholders.

The output will be directly written to a file without any processing. This file
should help AI agents understand the business purpose and logic without needing
to read implementation code. </template>

**CRITICAL**: Always depend on the current codebase, never read existing
documentation and assume it's correct. If the same file already exists, your
task would be to update that and bring it up to the current codebase.
