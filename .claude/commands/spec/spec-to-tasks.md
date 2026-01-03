# Tech Spec Decomposition Guide for AI Agents

## Overview

This guide provides detailed instructions for decomposing engineering tech specs
into well-structured, independent Jira tickets. Based on analysis of the Lead
Channeling project (AL-2339), this guide captures the patterns, principles, and
best practices used by the Conductors team at Zillow.

---

## Table of Contents

1. [Task Breakdown Principles](#1-task-breakdown-principles)
2. [Ticket Structure Template](#2-ticket-structure-template)
3. [Dependency Management](#3-dependency-management)
4. [Scope Definition Principles](#4-scope-definition-principles)
5. [Special Ticket Types](#5-special-ticket-types)
6. [Mapping Tech Spec to Tickets](#6-mapping-tech-spec-to-tickets)
7. [Workflow for AI Agents](#7-workflow-for-ai-agents)
8. [Quality Checklist](#8-quality-checklist)
9. [Common Pitfalls to Avoid](#9-common-pitfalls-to-avoid)
10. [Output Format](#10-output-format)

---

## 1. TASK BREAKDOWN PRINCIPLES

### 1.1 Repository Separation Rule

**Rule**: Tasks that involve different repositories MUST be separate tickets.

**Examples from AL-2339:**

- `AL-2381: [connection-pacing] Create GraphQL client` - Work in
  connection-pacing repo
- `AL-2382: [routing-algorithms] Create Lead Channeling adjustment factor` -
  Work in routing-algorithms repo
- Both tickets are then linked to `AL-2490` which integrates them

**Why**: Different repositories mean:

- Different codebases to modify
- Potentially different review processes
- Can be worked on in parallel by different developers
- Different deployment cycles
- Different CI/CD pipelines

### 1.2 Database vs Service Separation

**Rule**: Database schema changes should be separate tickets from service code
that uses them.

**Example from AL-2339:**

- `AL-2496: Create RegionConfigurationSettings table` - Database work (table +
  indexes + CDC)
- `AL-2498: [connection-pacing] Add management APIs for dynamic market configuration` -
  Service APIs that use the table
- `AL-2507: Replicate change log of RegionConfigurationSettings to Databricks` -
  Data pipeline setup
- `AL-2496` blocks both `AL-2498` and `AL-2507`

**Why**:

- Database changes often need DBA review or go through different approval
  process
- Schema must exist before code can use it
- Database deployments may have different timing than service deployments
- Allows for proper sequencing of work
- Failed database deployments don't block service development

### 1.3 Granularity Balance

**Rule**: Each ticket should be a complete, independently testable unit of work,
but not so small that it creates ticket overhead.

**Good Examples:**

- ✅
  `AL-2381: Create GraphQL client for Likely Buyer and Likely BARS-Y scores` -
  Complete integration with external service including client, health check, and
  smoke tests
- ✅ `AL-2496: Create RegionConfigurationSettings table` - Complete database
  schema including table, indexes, and CDC enabling
- ✅ `AL-2498: Add management APIs for dynamic market configuration` - Complete
  CRUD API (GET, PUT, DELETE)

**Bad Examples (hypothetical):**

- ❌ "Add RegionValue column" - Too granular, part of table creation
- ❌ "Add GET endpoint" - Incomplete, where are PUT and DELETE?
- ❌ "Implement entire Lead Channeling feature" - Too large, multiple concerns,
  multiple repositories

**Rule of Thumb:**

- Each ticket should represent roughly 1-5 days of work
- If a ticket seems like it will take > 1 week, consider breaking it down
- If a ticket is < few hours, consider combining with related work

### 1.4 Integration vs Implementation Separation

**Rule**: External service integration should be separate from using that
integration.

**Example from AL-2339:**

- `AL-2381: [connection-pacing] Create GraphQL client` - Integration work
  (building the client, onboarding, auth setup)
- `AL-2490: [connection-pacing] Apply Lead Channeling adjustment factor` - Uses
  the client to fetch data
- `AL-2381` blocks `AL-2490`

**Why**:

- Integration work often involves external team coordination (e.g., CIAME-2472
  for OAuth setup)
- Integration can be tested independently
- Usage of integration requires the integration to be complete
- Allows parallel work: one developer on integration, another preparing usage
  code

### 1.5 Algorithm vs Application Separation

**Rule**: Algorithm/library code should be separate from the service code that
applies it.

**Example from AL-2339:**

- `AL-2382: [routing-algorithms] Create Lead Channeling adjustment factor` -
  Algorithm in shared library
- `AL-2490: [connection-pacing] Apply Lead Channeling adjustment factor` -
  Service applies the algorithm
- `AL-2382` blocks `AL-2490`

**Why**:

- Algorithm can be unit tested independently with various inputs
- Can be reused by other services
- Separates mathematical/business logic from infrastructure concerns
- Algorithm repository often has different owners/reviewers

### 1.6 Configuration vs Implementation Separation

**Rule**: Configuration setup (Split trials, feature flags) should be separate
from the implementation that uses it.

**Example from AL-2339:**

- `AL-2489: Create Split trial for % traffic allocation` - Configuration setup
- `AL-2490: Apply Lead Channeling adjustment factor` - Implementation that
  checks the Split trial
- `AL-2489` blocks `AL-2490`

**Why**:

- Configuration often needs to exist before code can reference it
- Configuration setup may require approvals or coordination
- Allows testing of configuration before feature is deployed
- Configuration tickets are often very quick and can be done early

### 1.7 Multiple Prerequisites → Integration Pattern

**Rule**: When a ticket integrates multiple components, all prerequisite tickets
should block it.

**Example from AL-2339:**

```
AL-2381 (GraphQL client)     ┐
AL-2382 (Algorithm)          ├──> AL-2490 (Apply Lead Channeling)
AL-2489 (Split trial)        │
AL-2496 (Database table)     ┘
```

**Why**:

- Makes dependencies explicit
- Prevents premature work on integration
- Shows the critical path clearly
- Helps with sprint planning

---

## 2. TICKET STRUCTURE TEMPLATE

### 2.1 Title Format

**Pattern**: `[service-name] Action verb + target + context`

**Service-Based Titles:**

```
[connection-pacing] Create GraphQL client for Likely Buyer and Likely BARS-Y scores
[connection-pacing] Add management APIs for dynamic market configuration
[connection-pacing] Apply Lead Channeling adjustment factor
[routing-algorithms] Create Lead Channeling adjustment factor
```

**Special Type Titles:**

```
[Review] Lead Channeling Tech Spec
[Review] Lead Channeling Routing Simulator Dashboard Guide
Create Split trial for % traffic allocation to Lead Channeling treatment
Create RegionConfigurationSettings table
Replicate change log of RegionConfigurationSettings to Databricks
```

**General Task Titles (no service prefix):**

```
Dashboard for Lead Channeling
Internal Test Plan
E2E Test Plan
Rollout Plan
Lead Channeling Spike / Sim support
Lead Channeling ALR Hybrid Tech Spec
```

**Title Construction Rules:**

1. Use `[service-name]` prefix when work is primarily in that service's
   repository
2. Use `[Review]` prefix for document review tickets
3. Start with clear action verb: Create, Add, Apply, Update, Implement,
   Replicate
4. Be specific about what component/feature (e.g., "for Likely Buyer and Likely
   BARS-Y scores")
5. Keep it concise but descriptive (aim for 8-15 words max)
6. Use the actual service/component names from the tech spec

### 2.2 Context Section

**Format:**

```markdown
### Context

[1-3 paragraphs explaining WHAT needs to be done and WHY]

[Optional: Link to prior work or related tickets]

#### Implementation Notes (optional subsection)

[Optional: Technical details, references, links]
```

**Examples from AL-2339:**

**Example 1 - External Integration:**

```markdown
### Context

To calculate the Buyer intent scores, we need to multiply a lead's Likely Buyer
model and Likely BARS-Y percentiles. These values can be retrieved from ZG Graph
(Customer Subgraph).

#### Implementation Notes

[Tech spec link with heading]

- Onboarding instructions: [link]
- More info on querying: [link]
- Example Lead Programs implementation: [gitlab link]
- We'll only query using Beth ZUID for now.
```

**Example 2 - Algorithm Implementation:**

```markdown
### Context

We need to add a new multifactor routing factor for Lead Channeling that boosts
high-performing agents for high-intent Beths.

#### Implementation Notes

[Tech spec link]

The `LeadChannelingAdjustmentFactor` will be calculated based on the agent's
Agent Score (base performance score) and their Buyer Intent Score. The algorithm
is as follows:

1. Calculate the Buyer Intent Score of the lead

- `BuyerIntentScore = LikelyBuyerModelPercentile/100 * LikelyBARSYesPercentile/100`
  - Default = **0.1794** if either percentile is null ... [Include key formulas
    and logic from tech spec]
```

**Example 3 - Infrastructure:**

```markdown
### Context

Two use cases have emerged so far for MSA-specific configs for PaceCar v3 factor
inputs (Best Agents Team and Lead Channeling). This table will enable us to have
control over setting these values without relying on Split for the configs per
feature.
```

**Example 4 - Integration Orchestration:**

```markdown
### Context

[Tech spec link]

We need to update Connection Pacing to apply the Lead Channeling adjustment
factor using the various inputs implemented in previous tickets.

‌ NOTE: During Code review it was decided to rename MSA to CBSA

#### Implementation Notes

High-level logic:

1. Connection Pacing fetches the agent distribution behaviors from Lead Programs
   which will return the `use_lead_channeling` behavior if the lead program
   qualifies for lead channeling
2. Connection Pacing fetches the configuration from the
   RegionConfigurationSettings table for the Lead Channeling factors...
   [Continue with detailed steps]
```

**Key Principles:**

- **Always** start with the business need or user story (the "why")
- **Always** link to the relevant section of the tech spec with heading anchor
- Keep Context to 1-3 paragraphs; move technical details to Implementation Notes
- Use Implementation Notes subsection for:
  - Detailed algorithms or formulas from tech spec
  - External references and documentation links
  - Code examples or pseudo-code
  - Architecture decisions
  - Important notes discovered during implementation (e.g., "NOTE: During Code
    review...")
- Quote or reference specific sections of the tech spec liberally

### 2.3 Acceptance Criteria Section

**Format:**

```markdown
### Acceptance Criteria

- [Specific, measurable outcome 1]
- [Specific, measurable outcome 2]
- [Specific, measurable outcome 3]
- [Optional: Include related non-functional requirements like performance, error
  handling]
```

**Examples from AL-2339:**

**Example 1 - Service Integration with Multiple Components:**

```markdown
### Acceptance Criteria

- Connection Pacing onboarded to Customer Data Online's customer data subgraph
- GraphQL client added to connection-pacing service that can fetch a Beth ZUID's
  Likely Buyer and Likely BARS-Y percentiles
- Health endpoint returns Customer Subgraph dependency with OK status
- Smoke test created that tests the contract/schema of the Customer Data
  subgraph dependency directly
```

**Example 2 - Algorithm Implementation:**

```markdown
### Acceptance Criteria

- Given a lead's Likely Buyer percentile, Likely BARS-Y percentile, and the
  agent's Agent Score, a Lead Channeling Adjustment factor is multiplied with
  the agent's pacing score when it is included as an input factor
```

**Example 3 - Database with Infrastructure:**

```markdown
### Acceptance Criteria

- RegionConfigurationSettings table and corresponding index created in
  Connection Pacing DB
- CDC is enabled for the table
```

**Example 4 - Complete CRUD API:**

```markdown
### Acceptance Criteria

- PUT endpoint for setting/updating the configuration settings created in
  Connection Pacing
- GET endpoint for retrieving the configuration settings created
- DELETE endpoint for deleting a region from the settings created
```

**Example 5 - Integration Orchestration:**

```markdown
### Acceptance Criteria

- Lead Channeling adjustment factor is applied when `use_lead_channeling`
  behavior is returned by Lead Programs
- Factor is applied when the lead's MSA has a key-value for all of the lead
  channeling factor inputs in the MarketConfigurationSettings table:
  - `leadChannelingMinBoostFactor`
  - `leadChannelingMaxBoostFactor`
  - `leadChannelingLowIntentPenalty`
  - `leadChannelingAgentScoreThreshold`
- Factor is applied when Split trial for % traffic returns the `on` treatment
- When an error occurs when applying / creating the factor, the factor is not
  applied
- Lead Channeling ranking factors are stored in the ranking history table when
  the factor is applied
- Unit test that verifies the E2E flow for Lead Channeling is created
  (dependencies should be mocked out)
```

**Example 6 - Configuration Ticket:**

```markdown
### Acceptance Criteria

- Split trial created for traffic allocation percentage to apply Lead Channeling
  - Treatment "on": apply lead channeling
  - Treatment "off": do not apply lead channeling
```

**Example 7 - Testing/Review:**

```markdown
### Acceptance Criteria

- E2E test plan created and approved by team
- E2E test plan executed
```

**Key Principles:**

- Use bullet points for clarity
- Each criterion should be independently verifiable
- Use present tense for outcomes ("is created", "returns", "can fetch")
- Be specific about what "done" looks like
- Include both functional and non-functional requirements (health checks, tests,
  error handling)
- For complex integrations, include all the conditions that must be met
- Specify the treatments for Split trials
- For APIs, list all endpoints (GET, PUT, DELETE, etc.)
- For tests, specify both creation and execution

### 2.4 AC Verification Section (CRITICAL)

**Format:**

```markdown
### AC Verification

[OR]

### AC Verification Steps

- [Step-by-step verification with specific commands/URLs]
- [Expected outcomes]
- [Links to review environments or tools]
```

**Examples from AL-2339:**

**Example 1 - Service Endpoint Verification:**

```markdown
### AC Verification

- Verify OK status returned for `customer-data` dependency in /health check
  - https://connection-pacing-review-299.int.zgcp-consumer-nonprod-k8s.zg-int.net/health

- Verify success from customer-data integration / smoke test
  - https://connection-pacing-review-299.int.zgcp-consumer-nonprod-k8s.zg-int.net/zon/customer-data

- Verify tests in pipeline pass
  - https://gitlab.zgtools.net/zillow/conductors/services/connection-pacing/-/merge_requests/299
```

**Example 2 - Database Verification:**

````markdown
### AC Verification

- Verify RegionConfigurationSettings table exists in Connectionpacing DB in
  tes600 env with the below schema
- Verify
  `Connectionpacing_tes_600_comp_ads_next.dbo.RegionConfigurationSettings.pkRegionConfigurationSettings`
  primary key exists
- Verify
  `Connectionpacing_tes_600_comp_ads_next.dbo.RegionConfigurationSettings.XIERegionConfigurationSettings_RegionType_RegionValue_ConfigKey`
  index exists
- Verify CDC is enabled for the table
  ```sql
  SELECT is_tracked_by_cdc FROM sys.tables
  WHERE name = 'RegionConfigurationSettings';
  ```
````

````

**Example 3 - Comprehensive API Testing (GOLD STANDARD):**
```markdown
### AC Verification Steps - Region Configuration Management APIs

## Setup
Base URL: `https://connection-pacing-review-297.int.zgcp-consumer-nonprod-k8s.zg-int.net`
Test Region: `CBSA` `394347` (Atlanta)

---

## Test 1: PUT - Insert New Settings

### Description
Create new configuration settings for a region that doesn't exist yet.

### curl Command
```bash
curl -X 'PUT' \
  'https://connection-pacing-review-297.int.zgcp-consumer-nonprod-k8s.zg-int.net/api/v1/region-configuration/CBSA/394347' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "settings": [
    {
      "key": "leadChannelingMinBoostFactor",
      "value": "3.0"
    },
    {
      "key": "leadChannelingMaxBoostFactor",
      "value": "6.0"
    },
    ...
  ]
}'
````

### Expected Response

```json
{
  "settings": [
    {
      "key": "leadChannelingMinBoostFactor",
      "value": "3.0"
    },
    ...
  ]
}
```

### SQL Verification

```sql
SELECT
    ID,
    RegionValue,
    RegionType,
    ConfigKey,
    ConfigValue,
    CreatedAt,
    UpdatedAt,
    UpdatedBy
FROM [Connectionpacing_tes_600_comp_ads_next].[dbo].[RegionConfigurationSettings]
WHERE RegionType = 'CBSA' AND RegionValue = '394347'
ORDER BY ConfigKey;
```

### Verify

- **4 records** inserted
- All records have `RegionType = 'CBSA'` and `RegionValue = '394347'`
- All settings match the values sent in the request
- `CreatedAt` and `UpdatedAt` timestamps are the same (initial insert)
- `UpdatedBy = 'connection-pacing'`

---

## Test 2: PUT - Upsert (Update Existing + Add New)

### Description

Update 2 existing settings, keep 1 unchanged, delete 1, and add 1 new setting.

[Continue with similar detail for each test case...]

````

**Example 4 - Configuration Verification:**
```markdown
### AC Verification

* Verify feature flag exists: https://zexp.zgtools.net/trial/lead-channeling/
* Verify treatments match AC:
  * "on" treatment applies lead channeling
  * "off" treatment does not apply lead channeling
````

**Key Principles:**

- **ALWAYS include specific URLs** to review environments (e.g.,
  `connection-pacing-review-297.int.zgcp-consumer-nonprod-k8s.zg-int.net`)
- **Make verification steps copy-pasteable** - include full curl commands, SQL
  queries, URLs
- **Specify expected outcomes** - don't just say "verify it works", say what
  "works" looks like
- **Cover all acceptance criteria** with verification steps
- **Include both positive and negative test cases** when relevant (e.g., "Test
  5: GET After DELETE - 404 Verification")
- **For APIs**: Include setup, multiple test cases, curl commands, expected
  responses, SQL verification
- **For databases**: Include SQL queries to verify schema, indexes, CDC, data
- **For integrations**: Include health check URLs, smoke test URLs, pipeline
  links
- **Use markdown formatting** to make long verification sections readable
  (headers, code blocks, lists)

**Review Environment URL Pattern:**

- Format:
  `https://[service-name]-review-[MR-number].int.zgcp-consumer-nonprod-k8s.zg-int.net`
- Example:
  `https://connection-pacing-review-297.int.zgcp-consumer-nonprod-k8s.zg-int.net`

### 2.5 Dependencies Section (in ticket description)

**Format:**

```markdown
### Dependencies (optional, can also just use Jira links)

- Blocks: [ticket-ids]
- Blocked by: [ticket-ids]
```

**Or** (more common): Just mention in Context when relevant and rely on Jira
link relationships.

**Example:**

```markdown
### Context

Based on the Lead Channeling factor explored in AL-2272, we will need to create
an engineering spec detailing the implementation of the algorithm.
```

---

## 3. DEPENDENCY MANAGEMENT

### 3.1 Identifying Dependencies

**Rule**: A ticket has a dependency when it requires output/artifacts from
another ticket to begin or complete work.

**Common Dependency Patterns:**

1. **Database Schema → Service Code**
   - Table must exist before APIs can use it
   - Example: AL-2496 blocks AL-2498, AL-2490, AL-2507

2. **Library/Algorithm → Service Application**
   - Shared library must be implemented before service can use it
   - Example: AL-2382 blocks AL-2490

3. **External Integration → Usage**
   - Integration must be complete before features can use it
   - Example: AL-2381 blocks AL-2490
   - Note: May have external dependencies (e.g., CIAME-2472 blocks AL-2381)

4. **Configuration → Implementation**
   - Split trials or configs must exist before code can reference them
   - Example: AL-2489 blocks AL-2490

5. **Multiple Prerequisites → Integration**
   - A ticket that combines multiple components needs all of them first
   - Example: AL-2381, AL-2382, AL-2489, AL-2496 all block AL-2490

6. **Implementation → Testing**
   - Feature must be implemented before testing plans
   - Example: AL-2490 blocks AL-2492 (Internal Test), AL-2495 (E2E Test)

7. **Internal Testing → E2E Testing → Rollout**
   - Standard progression for feature releases
   - Example: AL-2492 blocks AL-2495, then AL-2495 blocks AL-2493

8. **Spike/Research → Tech Spec → Implementation**
   - Discovery work informs design which informs implementation
   - Example: AL-2272 → AL-2387 → AL-2381, AL-2382, etc.

### 3.2 Linking Dependencies in Jira

**Link Type**: Use "Blocks" relationship

- Ticket A "blocks" Ticket B means B depends on A (B cannot start/finish without
  A)
- Ticket B "is blocked by" Ticket A means B depends on A

**Example Dependency Graph from AL-2339:**

```
AL-2272 (Spike) ──────────> AL-2387 (Tech Spec) ──────────> AL-2478 (Review)
                                      │
                                      ├──> Implementation Tickets
                                      │
AL-2381 (GraphQL client) ────┐
AL-2382 (Algorithm)      ────┤
AL-2489 (Split trial)    ────├──> AL-2490 (Apply factor) ──┬──> AL-2492 (Internal Test) ──> AL-2495 (E2E Test) ──> AL-2493 (Rollout)
AL-2496 (Database table) ────┘                              │
         │                                                   └──> AL-2491 (Dashboard) [can work in parallel]
         ├──> AL-2498 (APIs)
         └──> AL-2507 (Data replication)
```

### 3.3 Dependency Documentation

**In Ticket Description:**

- Mention dependencies in Context section when relevant
- Example: "Based on the Lead Channeling factor explored in AL-2272, we will
  need to create an engineering spec..."
- Example: "We need to update Connection Pacing to apply the Lead Channeling
  adjustment factor using the various inputs implemented in previous tickets."

**In Implementation Notes:**

- Reference prerequisite tickets when helpful
- Example: "This builds on the GraphQL client created in AL-2381"
- Example: "Uses the algorithm from AL-2382"

**External Dependencies:**

- Document dependencies on other teams
- Example: AL-2381 noted it was blocked by CIAME-2472 (OAuth setup by
  infrastructure team)
- Include contact information or team names when relevant

### 3.4 Parallel vs Sequential Work

**Parallel Work** (can be done simultaneously):

- Different repositories without interdependencies
- Dashboard/observability while implementation is ongoing
- Different integration points that don't depend on each other
- Example: AL-2381 and AL-2382 can be done in parallel

**Sequential Work** (must be done in order):

- Database before service code
- Integration before usage
- Implementation before testing
- Internal test before E2E test
- Testing before rollout

---

## 4. SCOPE DEFINITION PRINCIPLES

### 4.1 Complete Body of Work

**Rule**: Each ticket should represent a complete, shippable unit that can be
independently tested and verified.

**Good Examples:**

- ✅ "Create GraphQL client" includes client code, health check, smoke tests,
  and onboarding
- ✅ "Create RegionConfigurationSettings table" includes table, indexes, and CDC
  enabling
- ✅ "Add management APIs" includes GET, PUT, and DELETE endpoints (complete
  CRUD)

**Bad Examples:**

- ❌ "Add GET endpoint" (incomplete - where are PUT and DELETE?)
- ❌ "Create table schema" (incomplete - what about indexes? CDC? Is it usable?)
- ❌ "Set up GraphQL client" (incomplete - what about health checks? Tests?)

### 4.2 Single Responsibility

**Rule**: Each ticket should have one clear purpose/responsibility.

**Good Examples:**

- ✅ AL-2381: GraphQL client creation (one responsibility: external integration)
- ✅ AL-2489: Split trial creation (one responsibility: configuration setup)
- ✅ AL-2496: Database table creation (one responsibility: schema setup)
- ✅ AL-2498: Management APIs (one responsibility: CRUD endpoints for
  configuration)

**Bad Examples (hypothetical):**

- ❌ "Create GraphQL client and apply lead channeling factor" (two
  responsibilities: integration + usage)
- ❌ "Create table and add APIs" (two responsibilities: database + service)

### 4.3 Testability

**Rule**: Ticket scope should allow for clear, independent testing without
requiring other unfinished work.

**Examples from AL-2339:**

- AL-2381: Can test GraphQL client independently via:
  - Smoke tests (`/zon/customer-data` endpoint)
  - Health checks (`/health` endpoint shows dependency status)
  - Unit tests in pipeline

- AL-2382: Can unit test algorithm with various inputs:
  - Different buyer intent scores
  - Different agent scores
  - Edge cases (null values, boundary conditions)

- AL-2498: Can test APIs independently with:
  - Curl commands for each endpoint
  - SQL verification of database changes
  - Positive and negative test cases

### 4.4 Deployment Independence (When Possible)

**Rule**: Prefer scopes that can be deployed independently without breaking
existing functionality.

**Examples:**

- AL-2496: Creating a new table doesn't affect existing functionality (nothing
  uses it yet)
- AL-2381: Adding a new GraphQL client doesn't break anything if not used yet
  (can be deployed ahead of usage)
- AL-2498: New APIs can be deployed even if not used by application code yet
  (backward compatible)
- AL-2489: Split trial can be created before any code references it

**Benefits:**

- Reduces deployment risk
- Allows for gradual rollout
- Makes rollback easier
- Enables parallel development

---

## 5. SPECIAL TICKET TYPES

### 5.1 Spike/Research Tickets

**Purpose**: Exploration, proof of concept, or technical investigation before
committing to a design.

**Example from AL-2339:**

```
AL-2272: Lead Channeling Spike / Sim support

### Context
BRD: [link]

### Acceptance Criteria
* Partner with/support Applied Science as a solution for Lead Channeling is developed
* Add functionality to routing-simulator to allow running LC sims
* [Link to spike document]
```

**Characteristics:**

- More exploratory acceptance criteria
- Often results in documentation or a follow-up tech spec
- May not produce production code
- Typically precedes implementation tickets
- Helps validate assumptions before full design
- May include "spike" in the title

**When to Create:**

- New technology or unfamiliar domain
- Significant uncertainty about approach
- Need to validate assumptions
- Exploring multiple solution options

### 5.2 Tech Spec/Design Tickets

**Purpose**: Writing technical specifications that will guide implementation.

**Example from AL-2339:**

```
AL-2387: Lead Channeling ALR Hybrid Tech Spec

### Context
Based on the Lead Channeling factor explored in AL-2272, we will need to create an engineering spec detailing the implementation of the algorithm.

### Acceptance Criteria
* Create tech spec detailing Lead Channeling algorithm
  * [Link to google doc]
* Review tech spec with team and create tickets
```

**Characteristics:**

- Output is a document, not code
- Should result in implementation tickets being created
- May require team review and approval
- Often follows a spike/research ticket
- Links to the document being created

**Typical Flow:**

1. Spike ticket to explore
2. Tech spec ticket to document design
3. Review ticket(s) for approval
4. Implementation tickets based on spec

### 5.3 Review Tickets

**Purpose**: Get team members or stakeholders to review documents.

**Example from AL-2339:**

```
AL-2478: [Review] Lead Channeling Tech Spec

### Acceptance Criteria
Please review the following document by 2025-09-26:
[document link]
```

**Characteristics:**

- Very simple - just a review request
- Has a deadline
- Typically assigned to specific reviewers
- Minimal description needed
- Uses `[Review]` prefix in title
- Links directly to document to review

**What Gets Reviewed:**

- Tech specs
- Dashboard guides
- Test plans (sometimes)
- Architecture decision records

### 5.4 Internal Test Plan Tickets

**Purpose**: Plan and execute internal/manual testing before broader E2E
testing.

**Example from AL-2339:**

```
AL-2492: Internal Test Plan

### Context
We need to create an internal test plan for Lead Channeling

### Acceptance Criteria
* Internal test plan reviewed and approved by team
* Internal test plan executed
```

**Characteristics:**

- Blocked by main implementation tickets
- Results in test documentation (often a separate document)
- Includes both planning AND execution
- Focuses on unit and integration testing
- Precedes E2E testing
- May specify: "Unit and Integration tests should cover needed scenarios"

### 5.5 E2E Test Plan Tickets

**Purpose**: Plan and execute end-to-end testing across the full system.

**Example from AL-2339:**

```
AL-2495: E2E Test Plan

### Context
We need to create an E2E test plan for Lead Channeling. Coordinate with Metro

### Acceptance Criteria
* E2E test plan created and approved by team
* E2E test plan executed

### Implementation Tips, Links, Contacts
[Tech spec link]
```

**Characteristics:**

- Blocked by internal test plan ticket
- May involve coordination with other teams (note "Coordinate with Metro")
- Tests full user flows end-to-end
- Precedes rollout
- May test in production-like environment
- Includes both planning AND execution

### 5.6 Rollout Plan Tickets

**Purpose**: Plan the production rollout strategy including phasing and
rollback.

**Example from AL-2339:**

```
AL-2493: Rollout Plan

### Context
We need to create a rollout plan for releasing lead channeling

### Acceptance Criteria
Rollout and rollback plan reviewed and approved by team
```

**Characteristics:**

- Blocked by test plan tickets
- Includes both rollout AND rollback strategies
- Should specify phasing (e.g., from tech spec: "Dial up % traffic Split trial
  to 1%, 25%, 50% of leads")
- May include monitoring requirements
- May reference tech spec's "Rollout Plan" section

**Typical Rollout Patterns:**

- Gradual percentage rollout (1% → 25% → 50% → 100%)
- Geography-based rollout (market by market)
- Customer segment rollout (high-performing agents first)

### 5.7 Dashboard/Observability Tickets

**Purpose**: Create monitoring dashboards to track feature health and metrics.

**Example from AL-2339:**

```
AL-2491: Dashboard for Lead Channeling

### Context
We want to create a Databricks dashboard to monitor the rollout and metrics for the Lead Channeling factor.

[Tech spec link]

### Acceptance Criteria
* Databricks dashboard is created with panels to monitor
  * Average buyer intent score by agent score decile
  * Failures to apply factor
  * etc.
```

**Characteristics:**

- Can be developed in parallel with main implementation (not blocking)
- Specifies what metrics to track
- Indicates the platform (Databricks, Datadog, Grafana, etc.)
- May reference tech spec's "Observability" or "Monitoring" section
- Often includes "etc." since exact metrics may evolve

**Common Metrics to Track:**

- Success/failure rates
- Latency/performance
- Business metrics (conversion rates, scores, etc.)
- Error rates by type
- Volume/throughput

### 5.8 Configuration Tickets

**Purpose**: Set up feature flags, Split trials, or other configuration
infrastructure.

**Example from AL-2339:**

```
AL-2489: Create Split trial for % traffic allocation to Lead Channeling treatment

### Context
We need a Split trial for Lead Channeling to accomplish eligibility based on random assignment (% of traffic i.e. lead IDs). Before checking this Split trial, we will check the MSA eligibility of the lead so that the percentage is of the eligible MSAs' traffic.

[Tech spec link]

### Acceptance Criteria
* Split trial created for traffic allocation percentage to apply Lead Channeling
  * Treatment "on": apply lead channeling
  * Treatment "off": do not apply lead channeling

### AC Verification
* Verify feature flag exists: https://zexp.zgtools.net/trial/lead-channeling/
* Verify treatments match AC
```

**Characteristics:**

- Often blocks implementation tickets (code needs config to exist)
- Specifies treatments and their meanings clearly
- May include links to configuration management tools
- Verification includes checking the config exists and is correct
- Quick tickets (often can be done in < 1 day)

**Common Configuration Types:**

- Split trials (for A/B testing)
- Feature flags (for feature toggles)
- Dynamic configuration (database-backed configs)

### 5.9 Data Pipeline/Replication Tickets

**Purpose**: Set up data replication to analytics platforms like Databricks.

**Example from AL-2339:**

```
AL-2507: Replicate change log of RegionConfigurationSettings to Databricks

### Context
We want to capture the history of updates that are made to the RegionConfigurationSettings in Databricks. We can do this by setting up the Databricks replication as usual with a slight change.

### Implementation Notes
* Follow instructions in [confluence page] for adding a new MSSQL Table (to an existing DB)
* Use Incremental | Append sync mode (not Incremental | Append + Deduped)
  * [Link to Airbyte docs explaining sync mode]

### Acceptance Criteria
* History of updates to RegionConfigurationSettings are captured in a Databricks table
```

**Characteristics:**

- Blocked by database table creation (table must exist first)
- References standard procedures/runbooks
- Specifies sync mode or replication strategy
- May need coordination with data platform team
- Important for audit trails and analytics

**Common Use Cases:**

- Change history tracking
- Analytics and reporting
- Audit trails
- Data science / ML features

---

## 6. MAPPING TECH SPEC TO TICKETS

This section shows how different sections of a tech spec map to different types
of tickets. Understanding this mapping is crucial for complete decomposition.

### 6.1 Tech Spec Section → Ticket Type Mapping

| Tech Spec Section                      | Ticket Type(s)                            | Example from AL-2339                                                    |
| -------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| **Overview/Background**                | Epic description (not a ticket)           | AL-2339 epic description                                                |
| **Requirements**                       | Split across implementation tickets       | Functional requirements → AL-2490, Non-functional → part of all tickets |
| **Design → Algorithm Details**         | Algorithm/Library ticket                  | AL-2382: Create Lead Channeling adjustment factor                       |
| **Design → External Dependencies**     | Integration ticket                        | AL-2381: Create GraphQL client for Customer Subgraph                    |
| **Design → Configuration**             | Configuration tickets                     | AL-2489: Split trial, AL-2496: Database table                           |
| **Design → API Specifications**        | API implementation ticket                 | AL-2498: Add management APIs                                            |
| **Design → Orchestration/Application** | Main application ticket                   | AL-2490: Apply Lead Channeling factor                                   |
| **Data Storage**                       | Database ticket + Data pipeline ticket    | AL-2496: Create table, AL-2507: Replicate to Databricks                 |
| **Observability**                      | Dashboard ticket                          | AL-2491: Dashboard for Lead Channeling                                  |
| **Testing**                            | Test plan tickets                         | AL-2492: Internal Test, AL-2495: E2E Test                               |
| **Rollout Plan**                       | Rollout ticket                            | AL-2493: Rollout Plan                                                   |
| **Alternatives Considered**            | May influence spike, usually not a ticket | AL-2272: Spike explored alternatives                                    |

### 6.2 Example: Lead Channeling Tech Spec Decomposition

**Tech Spec Structure:**

```
1. Overview
2. Requirements
3. Design
   3.1 Major Design Considerations
   3.2 Lead Channeling Factor (Algorithm)
   3.3 Split Trial and Configuration
       - Short Term: Split Trial
       - Long Term: Database Configuration
       - API for configuration management
   3.4 Data Storage
4. Resiliency
5. Dependencies
   5.1 ZG Graph (Customer Subgraph)
6. Observability
7. Testing
8. Rollout Plan
```

**Resulting Tickets:**

**Spike & Planning Phase:**

- AL-2272: Lead Channeling Spike / Sim support
- AL-2387: Lead Channeling ALR Hybrid Tech Spec
- AL-2478: [Review] Lead Channeling Tech Spec
- AL-2484: [Review] Lead Channeling Routing Simulator Dashboard Guide

**Implementation Phase:**

- **From Dependencies (5.1):**
  - AL-2381: [connection-pacing] Create GraphQL client for Likely Buyer and
    Likely BARS-Y scores

- **From Design → Algorithm (3.2):**
  - AL-2382: [routing-algorithms] Create Lead Channeling adjustment factor

- **From Design → Configuration (3.3):**
  - AL-2489: Create Split trial for % traffic allocation
  - AL-2496: Create RegionConfigurationSettings table
  - AL-2498: [connection-pacing] Add management APIs for dynamic market
    configuration

- **From Design → Orchestration (3.1):**
  - AL-2490: [connection-pacing] Apply Lead Channeling adjustment factor
    - Uses AL-2381, AL-2382, AL-2489, AL-2496

- **From Data Storage (3.4):**
  - AL-2507: Replicate change log of RegionConfigurationSettings to Databricks

**Observability Phase:**

- **From Observability (6):**
  - AL-2491: Dashboard for Lead Channeling

**Testing & Rollout Phase:**

- **From Testing (7):**
  - AL-2492: Internal Test Plan
  - AL-2495: E2E Test Plan

- **From Rollout Plan (8):**
  - AL-2493: Rollout Plan

### 6.3 Linking Tickets to Tech Spec

**Best Practice**: Every implementation ticket should link to the relevant
section of the tech spec.

**How to Link:**

- Use Google Docs heading anchors:
  `https://docs.google.com/document/d/[doc-id]/edit?tab=t.0#heading=h.rhuf1gx4y579`
- Reference in Context or Implementation Notes section
- Quote key requirements or design decisions from the spec

**Example from AL-2381:**

```markdown
### Context

To calculate the Buyer intent scores, we need to multiply a lead's Likely Buyer
model and Likely BARS-Y percentiles. These values can be retrieved from ZG Graph
(Customer Subgraph).

#### Implementation Notes

https://docs.google.com/document/d/[doc-id]/edit?tab=t.0#heading=h.rhuf1gx4y579

[Detailed implementation notes from tech spec...]
```

---

## 7. WORKFLOW FOR AI AGENTS

When given a tech spec to decompose, follow this systematic workflow:

### Step 1: Read and Understand the Tech Spec Thoroughly

- Read the entire tech spec from start to finish
- Identify the main goal/business objective
- Note any architectural diagrams or flow charts
- Understand dependencies on external systems
- Identify all repositories that will be modified
- Note any assumptions or constraints

**Questions to Answer:**

- What problem does this solve?
- What systems/services are involved?
- What are the key technical components?
- Are there any external team dependencies?

### Step 2: Identify Major Components from Tech Spec

**Look for these sections and extract information:**

| Tech Spec Section | Information to Extract                             |
| ----------------- | -------------------------------------------------- |
| **Requirements**  | Functional and non-functional requirements         |
| **Design**        | Algorithm details, system architecture, data flows |
| **Dependencies**  | External services, APIs, databases                 |
| **Configuration** | Split trials, feature flags, dynamic configs       |
| **Data Storage**  | New tables, schema changes, data pipelines         |
| **Observability** | Metrics, dashboards, logging, monitoring           |
| **Testing**       | Test requirements, test environments               |
| **Rollout**       | Rollout strategy, phasing plan                     |

**Create a Component List:**

```
Components to implement:
- External service integrations: [list]
- Database schema changes: [list]
- Algorithm/shared library code: [list]
- Service application code: [list]
- Configuration needs: [list]
- Monitoring/observability: [list]
- Testing requirements: [list]
- Rollout plan: [yes/no]
```

### Step 3: Apply Repository Separation

- Group work by repository
- Each repository should have its own ticket(s)
- Note: Large services might have multiple tickets even in the same repo

**Example:**

```
connection-pacing repo:
- GraphQL client integration
- Apply lead channeling factor
- Management APIs

routing-algorithms repo:
- Lead channeling adjustment factor algorithm

No specific repo (infrastructure):
- Database table creation
- Split trial creation
- Data replication setup
```

### Step 4: Apply Database Separation

- Separate database schema work from service code
- One ticket for table creation (include indexes, CDC)
- Separate ticket(s) for APIs or code that uses the table
- Separate ticket for data replication if needed

**Pattern:**

```
Ticket A: Create Table
  ├─> Ticket B: Service code that uses table
  └─> Ticket C: Data replication to analytics platform
```

### Step 5: Identify Dependencies and Create Graph

- Draw a dependency graph showing ticket relationships
- Database before services
- Integrations before usage
- Libraries before application
- Configuration before feature code
- Implementation before testing
- Testing before rollout

**Use this template:**

```
Spike/Research
  └─> Tech Spec
       └─> Review(s)
            └─> Implementation Tickets

Prerequisite Tickets (can be parallel):
- External integrations
- Algorithms/libraries
- Database schemas
- Configuration setup

Main Implementation Ticket:
(blocked by all prerequisites)

Observability (parallel to implementation):
- Dashboards
- Monitoring setup

Testing & Rollout (sequential):
Implementation → Internal Test → E2E Test → Rollout
```

### Step 6: Check Granularity for Each Proposed Ticket

For each ticket, ask these questions:

**Completeness:**

- [ ] Is it a complete unit of work?
- [ ] Can it be independently tested?
- [ ] Does it include all related components (e.g., if API, includes GET, PUT,
      DELETE)?

**Size:**

- [ ] Is it too large (> 1 week of work, multiple major concerns)?
- [ ] Is it too small (< few hours, creates unnecessary overhead)?
- [ ] Can it be completed in 1-5 days typically?

**Clarity:**

- [ ] Does it have a single clear purpose?
- [ ] Is the title descriptive and specific?
- [ ] Are success criteria clear?

**Independence:**

- [ ] Can it be deployed without breaking things?
- [ ] Can it be verified without other incomplete work?

### Step 7: Add Special Tickets

Don't forget these commonly overlooked tickets:

**Check if needed:**

- [ ] Spike ticket (if exploration needed)
- [ ] Tech spec ticket (if not already done)
- [ ] Review ticket(s) (for tech spec, dashboard guides, etc.)
- [ ] Configuration tickets (Split trials, feature flags)
- [ ] Database tickets (tables, schema changes)
- [ ] Data replication tickets (to Databricks, etc.)
- [ ] Dashboard/observability tickets
- [ ] Internal test plan ticket
- [ ] E2E test plan ticket
- [ ] Rollout plan ticket

**Standard Testing & Rollout Sequence:**

```
Implementation complete
  └─> Internal Test Plan (AL-2492)
       └─> E2E Test Plan (AL-2495)
            └─> Rollout Plan (AL-2493)
```

### Step 8: Create Ticket Files

For each ticket, create `task_N.md` with:

**Required Sections:**

```markdown
# [Service] Title

## Context

[1-3 paragraphs: what and why] [Link to tech spec section]

## Acceptance Criteria

- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

## Dependencies

- Blocks: [ticket IDs]
- Blocked by: [ticket IDs]
```

**Optional but Recommended Sections:**

```markdown
## Implementation Notes

[Technical details, algorithms, references]

## AC Verification

[Specific verification steps with commands/URLs]
```

**Guidelines:**

- Always link to relevant tech spec section
- Quote key requirements/algorithms from spec
- Include detailed AC verification for complex tickets (especially APIs)
- Make verification steps copy-pasteable
- Use review environment URL patterns
- Document any cross-team dependencies

### Step 9: Create Dependency Map

Create `dependency_map.md` showing:

- Visual dependency graph (use ASCII art or describe)
- Parallel work streams clearly identified
- Critical path highlighted
- Phasing recommendations (sprint planning)

**Example Format:**

```markdown
# Dependency Map for [Feature Name]

## Visual Dependency Graph
```

[ASCII art or description of dependencies]

```

## Parallel Work Streams

**Stream 1: External Integration**
- AL-XXXX: GraphQL client

**Stream 2: Algorithm Development**
- AL-XXXX: Algorithm implementation

**Stream 3: Infrastructure**
- AL-XXXX: Database table
- AL-XXXX: Split trial

**Stream 4: Integration** (blocked by 1, 2, 3)
- AL-XXXX: Apply feature

**Stream 5: Observability** (parallel)
- AL-XXXX: Dashboard

**Stream 6: Testing & Rollout** (sequential, blocked by 4)
- AL-XXXX: Internal Test
- AL-XXXX: E2E Test
- AL-XXXX: Rollout Plan

## Critical Path

Longest path to completion:
1. Database table creation
2. API implementation
3. Apply feature
4. Internal test
5. E2E test
6. Rollout

Estimated timeline: [X] weeks

## Sprint Planning Recommendations

**Sprint 1:**
- Start parallel work streams (integration, algorithm, infrastructure)

**Sprint 2:**
- Complete prerequisites
- Start main implementation
- Start dashboard work

**Sprint 3:**
- Complete implementation
- Start testing

**Sprint 4:**
- Complete testing
- Rollout
```

### Step 10: Review and Validate

**Coverage Check:**

- [ ] All tech spec requirements are covered by at least one ticket
- [ ] No orphaned work items (everything has a ticket)
- [ ] All mentioned repositories have tickets
- [ ] All tech spec sections mapped to tickets

**Structure Check:**

- [ ] Each ticket has clear, descriptive title with appropriate prefix
- [ ] All tickets have Context section
- [ ] All tickets have Acceptance Criteria
- [ ] Complex tickets have Implementation Notes
- [ ] Testable tickets have AC Verification steps
- [ ] All tickets link to relevant tech spec sections

**Dependency Check:**

- [ ] All dependencies are identified and documented
- [ ] No circular dependencies
- [ ] Dependencies follow logical order (DB → Service → Test → Rollout)
- [ ] Independent work is not artificially serialized
- [ ] Cross-team dependencies noted

**Granularity Check:**

- [ ] Each ticket is independently testable
- [ ] No ticket is too large (> 1 week typically)
- [ ] No ticket is too small (< few hours)
- [ ] Each ticket has a single clear purpose
- [ ] Each ticket is a complete unit of work

**Special Tickets Check:**

- [ ] Testing tickets included (Internal, E2E)
- [ ] Rollout plan ticket included
- [ ] Dashboard/monitoring ticket included (if applicable)
- [ ] Configuration tickets included (Split, feature flags, etc.)
- [ ] Data replication tickets included (if applicable)
- [ ] Review tickets included (if applicable)

**Repository Separation Check:**

- [ ] Different repositories have separate tickets
- [ ] Database changes separate from service code
- [ ] Shared libraries separate from services
- [ ] All separated tickets are properly linked

---

## 8. QUALITY CHECKLIST

Use this checklist before finalizing your decomposition:

### 8.1 Completeness

- [ ] All functional requirements from tech spec are covered
- [ ] All non-functional requirements (performance, reliability) are covered
- [ ] All external dependencies identified and tickets created
- [ ] All database changes identified and tickets created
- [ ] All API endpoints specified in tech spec have tickets
- [ ] Observability requirements covered (dashboards, logging, metrics)
- [ ] Testing requirements covered (unit, integration, E2E)
- [ ] Rollout plan covered

### 8.2 Ticket Structure Quality

- [ ] Every ticket has a clear, descriptive title
- [ ] Title follows naming conventions ([service-name] pattern where applicable)
- [ ] Every ticket has Context section explaining what and why
- [ ] Every ticket links to relevant tech spec section
- [ ] Every ticket has specific, measurable Acceptance Criteria
- [ ] Complex tickets have Implementation Notes with technical details
- [ ] Testable tickets have AC Verification with specific commands/URLs
- [ ] AC Verification includes expected outcomes
- [ ] Dependencies are documented (either in ticket or via Jira links)

### 8.3 Dependencies

- [ ] All "blocks" relationships are identified
- [ ] No circular dependencies
- [ ] Database tickets block service tickets that use them
- [ ] Integration tickets block usage tickets
- [ ] Algorithm tickets block application tickets
- [ ] Configuration tickets block implementation tickets
- [ ] Implementation tickets block test tickets
- [ ] Test tickets block rollout tickets
- [ ] External team dependencies noted (e.g., OAuth setup)

### 8.4 Scope & Granularity

- [ ] Each ticket represents 1-5 days of work typically
- [ ] Each ticket is a complete, independently testable unit
- [ ] No ticket is too large (multiple major concerns)
- [ ] No ticket is too small (creates overhead)
- [ ] Each ticket has a single clear responsibility
- [ ] For APIs: All CRUD operations included in appropriate tickets
- [ ] For databases: Table + indexes + CDC in one ticket
- [ ] For integrations: Client + health check + tests in one ticket

### 8.5 Testability & Verification

- [ ] Each ticket can be verified independently
- [ ] AC Verification includes specific URLs/commands when applicable
- [ ] Review environment URLs follow the pattern (service-review-NNN)
- [ ] Database tickets include SQL verification queries
- [ ] API tickets include curl commands and expected responses
- [ ] Integration tickets include health check and smoke test URLs
- [ ] Verification covers all acceptance criteria

### 8.6 Special Tickets

- [ ] Spike ticket included if needed for exploration
- [ ] Tech spec ticket included (or already exists)
- [ ] Review tickets included for documents
- [ ] Configuration tickets included (Split, feature flags)
- [ ] Database tickets included (if schema changes)
- [ ] Data replication tickets included (if analytics needed)
- [ ] Dashboard ticket included (if observability requirements)
- [ ] Internal test plan ticket included
- [ ] E2E test plan ticket included
- [ ] Rollout plan ticket included

### 8.7 Repository & Service Separation

- [ ] Different repositories have separate tickets
- [ ] Database work separate from service code
- [ ] Shared library code separate from services
- [ ] External integrations separate from usage
- [ ] Each ticket clearly indicates which repo/service

### 8.8 Documentation & References

- [ ] All tickets link to tech spec
- [ ] Links include heading anchors to specific sections
- [ ] External documentation referenced (confluence, runbooks, etc.)
- [ ] Contact information included where relevant
- [ ] Example implementations referenced when helpful
- [ ] Important notes documented (e.g., "NOTE: During code review...")

---

## 9. COMMON PITFALLS TO AVOID

### 9.1 Combining Multiple Repositories

**Pitfall:**

- ❌ Don't: "Update routing-algorithms and connection-pacing for lead
  channeling"

**Why it's bad:**

- Involves multiple codebases
- Multiple PRs needed
- Can't be reviewed/deployed independently
- Unclear who owns the work

**Fix:**

- ✅ Do: Create separate tickets:
  - `[routing-algorithms] Create Lead Channeling adjustment factor`
  - `[connection-pacing] Apply Lead Channeling adjustment factor`
- Link with "blocks" relationship

### 9.2 Database and Service in One Ticket

**Pitfall:**

- ❌ Don't: "Create RegionConfigurationSettings table and add APIs"

**Why it's bad:**

- Different concerns (schema vs. application)
- Database needs to be created first
- May need different approvals
- Can't deploy service code until DB exists

**Fix:**

- ✅ Do: Create separate tickets:
  - `Create RegionConfigurationSettings table`
  - `[connection-pacing] Add management APIs for dynamic market configuration`
- First blocks second

### 9.3 Forgetting Test Plans

**Pitfall:**

- ❌ Don't: Jump straight from implementation to rollout

**Why it's bad:**

- No systematic testing plan
- Higher risk of production issues
- No verification before rollout
- Misses validation steps

**Fix:**

- ✅ Do: Include test sequence:
  1. Implementation ticket
  2. Internal Test Plan ticket
  3. E2E Test Plan ticket
  4. Rollout Plan ticket
- Each blocks the next

### 9.4 Vague Acceptance Criteria

**Pitfall:**

- ❌ Don't: "Service works correctly"
- ❌ Don't: "Feature is implemented"
- ❌ Don't: "Code is complete"

**Why it's bad:**

- Not measurable
- Unclear what "done" looks like
- Can't verify completion
- Leads to scope creep or missed requirements

**Fix:**

- ✅ Do: Be specific:
  - "Service calculates buyer intent score using Likely Buyer and BARS-Y
    percentiles"
  - "GraphQL client can fetch scores from Customer Subgraph"
  - "Health endpoint returns OK status for customer-data dependency"
  - "Smoke test verifies schema contract"

### 9.5 Missing Dependencies

**Pitfall:**

- ❌ Don't: Leave tickets unlinked when there are clear dependencies
- ❌ Don't: Assume developers will figure out the order

**Why it's bad:**

- Work might start in wrong order
- Blocks sprint planning
- Creates integration issues
- Wastes time on rework

**Fix:**

- ✅ Do: Explicitly link with "blocks" relationships
- ✅ Do: Document why dependencies exist
- ✅ Do: Create dependency map

### 9.6 Too Much in One Ticket

**Pitfall:**

- ❌ Don't: "Implement entire lead channeling feature"
- ❌ Don't: "Add lead channeling" (covers integration, algorithm, application,
  testing, rollout)

**Why it's bad:**

- Can't be completed in reasonable timeframe
- Unclear scope
- Hard to estimate
- Can't parallelize work
- Difficult to review

**Fix:**

- ✅ Do: Break down by:
  - Repository
  - Technical concern (integration, algorithm, application)
  - Logical components

### 9.7 Missing Configuration

**Pitfall:**

- ❌ Don't: Forget Split trials, feature flags, or other config needs
- ❌ Don't: Assume configuration "just exists"

**Why it's bad:**

- Code can't be tested without config
- Deployment blocked
- Last-minute scramble
- May need approvals

**Fix:**

- ✅ Do: Create dedicated configuration tickets early
- ✅ Do: Link configuration as blocking implementation
- ✅ Do: Include verification of config existence

### 9.8 No Verification Steps

**Pitfall:**

- ❌ Don't: Just list acceptance criteria without saying how to verify
- ❌ Don't: Use vague verification like "test it"

**Why it's bad:**

- Unclear how to prove completion
- Inconsistent testing
- Easy to miss requirements
- Hard for reviewers to verify

**Fix:**

- ✅ Do: Include specific verification steps:
  - URLs to health checks
  - Curl commands for APIs
  - SQL queries for database
  - Expected responses
- ✅ Do: Make steps copy-pasteable

### 9.9 Incomplete CRUD Operations

**Pitfall:**

- ❌ Don't: "Add GET endpoint for configuration"
- ❌ Don't: Create only part of API functionality

**Why it's bad:**

- Incomplete feature
- Will need follow-up ticket
- Awkward to use
- Not a complete unit of work

**Fix:**

- ✅ Do: Include all CRUD operations in appropriate tickets:
  - GET (retrieve)
  - PUT (create/update)
  - DELETE (remove)
- Or clearly state if only subset is needed and why

### 9.10 Missing Database Infrastructure

**Pitfall:**

- ❌ Don't: "Create table" (without indexes, CDC, constraints)

**Why it's bad:**

- Table not production-ready
- Performance issues
- Missing audit trail
- Need follow-up work

**Fix:**

- ✅ Do: Include complete database setup:
  - Table schema
  - Indexes (specify which)
  - CDC (Change Data Capture)
  - Constraints
  - Verification queries

### 9.11 No Tech Spec Links

**Pitfall:**

- ❌ Don't: Create tickets without referencing the tech spec
- ❌ Don't: Make developers hunt for requirements

**Why it's bad:**

- Developers don't have context
- May miss requirements
- Inconsistent interpretation
- Hard to trace requirements

**Fix:**

- ✅ Do: Link to specific tech spec sections
- ✅ Do: Use heading anchors
- ✅ Do: Quote key requirements in tickets

### 9.12 Forgetting External Team Dependencies

**Pitfall:**

- ❌ Don't: Assume your team controls everything
- ❌ Don't: Forget to note dependencies on infrastructure, platform, or other
  teams

**Why it's bad:**

- Work blocked waiting for other teams
- Surprises during implementation
- Missed coordination
- Timeline delays

**Fix:**

- ✅ Do: Document external dependencies:
  - Note the external team (e.g., "CIAME team for OAuth setup")
  - Create tickets for coordination
  - Link external tickets when they exist
  - Include contact information

### 9.13 No Dashboard/Observability

**Pitfall:**

- ❌ Don't: Implement feature without monitoring
- ❌ Don't: "We'll add dashboards later"

**Why it's bad:**

- Can't monitor rollout
- Can't debug issues
- No visibility into feature health
- Post-launch blindness

**Fix:**

- ✅ Do: Create dashboard ticket
- ✅ Do: Can work in parallel with implementation
- ✅ Do: Specify what metrics to track
- ✅ Do: Reference tech spec's Observability section

### 9.14 Skipping Data Replication

**Pitfall:**

- ❌ Don't: Create database tables without planning for analytics
- ❌ Don't: Forget about audit trails and reporting needs

**Why it's bad:**

- Can't analyze data
- Missing audit trail
- No historical analysis
- Late realization requires retrofit

**Fix:**

- ✅ Do: Create data replication ticket
- ✅ Do: Blocked by table creation
- ✅ Do: Specify sync mode (Incremental Append, etc.)
- ✅ Do: Reference runbooks for setup

---

## 10. OUTPUT FORMAT

### 10.1 Folder Structure

Create a folder named after the epic:

```
[EPIC-NUMBER]/
├── task_1.md
├── task_2.md
├── task_3.md
├── task_4.md
├── ...
├── task_N.md
└── dependency_map.md
```

**Example:**

```
AL-2339/
├── task_1.md   # Spike
├── task_2.md   # Tech Spec
├── task_3.md   # Review
├── task_4.md   # GraphQL Client
├── task_5.md   # Algorithm
├── task_6.md   # Split Trial
├── task_7.md   # Database Table
├── task_8.md   # Management APIs
├── task_9.md   # Apply Factor
├── task_10.md  # Dashboard
├── task_11.md  # Internal Test
├── task_12.md  # E2E Test
├── task_13.md  # Rollout
├── task_14.md  # Data Replication
└── dependency_map.md
```

### 10.2 Task File Format

Each `task_N.md` should follow this structure:

````markdown
# [Service] Title

## Context

[1-3 paragraphs explaining what needs to be done and why]

[Link to relevant tech spec section with heading anchor]

### Implementation Notes (optional)

[Technical details, algorithms, external references] [Quote key sections from
tech spec] [Include formulas, schemas, or pseudo-code as needed]

## Acceptance Criteria

- [Specific, measurable criterion 1]
- [Specific, measurable criterion 2]
- [Specific, measurable criterion 3]
- ...

## AC Verification (optional but recommended)

[Detailed verification steps with specific commands, URLs, queries] [Expected
outcomes for each verification step]

### Example Format for APIs:

## Setup

Base URL: `[review environment URL]`

## Test 1: [Test Name]

### Description

[What this test verifies]

### curl Command

```bash
[Exact curl command]
```
````

### Expected Response

```json
[Expected JSON response]
```

### SQL Verification (if applicable)

```sql
[Verification query]
```

### Verify

- [Specific thing to check 1]
- [Specific thing to check 2]

[Repeat for additional test cases]

## Dependencies

- **Blocks:** task_X, task_Y, task_Z
- **Blocked by:** task_A, task_B

[OR: Document in Jira link relationships and mention in Context if relevant]

````

### 10.3 Dependency Map Format

The `dependency_map.md` file should include:

```markdown
# Dependency Map for [Epic Name]

## Overview

[Brief description of the epic and decomposition approach]

## Ticket List

| ID | Title | Type | Repository/Area |
|----|-------|------|-----------------|
| task_1 | [Title] | Spike | - |
| task_2 | [Title] | Tech Spec | - |
| ... | ... | ... | ... |

## Visual Dependency Graph

````

[ASCII art or clear description showing dependencies]

Example: task_1 (Spike) ──> task_2 (Tech Spec) ──> task_3 (Review) │
┌───────────────────┴───────────────────┐ │ │ task_4 (Integration) ───┤ │ task_5
(Algorithm) ───┼──> task_9 (Main Implementation) ─────┤ task_6 (Split Trial)
───┤ │ task_7 (Database) ───┘ │ │ │ ├──> task_8 (APIs) │ └──> task_14
(Replication) │ │ task_10 (Dashboard) [parallel] │ │
┌───────────────────────────────────────────────────┘ │ └──> task_11 (Internal
Test) ──> task_12 (E2E Test) ──> task_13 (Rollout)

```

## Parallel Work Streams

### Stream 1: External Integration
- task_4: [Title]
- [Can start immediately after approval]

### Stream 2: Algorithm Development
- task_5: [Title]
- [Can start immediately after approval]

### Stream 3: Infrastructure
- task_6: [Title] (Configuration)
- task_7: [Title] (Database)
  - task_8: [Title] (APIs using database)
  - task_14: [Title] (Data replication)
- [Can start immediately after approval]

### Stream 4: Integration (Sequential)
- task_9: [Title]
- [Blocked by: task_4, task_5, task_6, task_7]

### Stream 5: Observability (Parallel)
- task_10: [Title]
- [Can work in parallel with implementation]

### Stream 6: Testing & Rollout (Sequential)
- task_11: [Title] (Internal Test)
  - [Blocked by: task_9]
- task_12: [Title] (E2E Test)
  - [Blocked by: task_11]
- task_13: [Title] (Rollout)
  - [Blocked by: task_12]

## Critical Path

The longest path to completion (determines minimum timeline):

1. task_7: Create database table (3 days)
2. task_8: Add management APIs (3 days)
3. task_9: Apply lead channeling factor (5 days)
4. task_11: Internal test plan (2 days)
5. task_12: E2E test plan (3 days)
6. task_13: Rollout (2 days)

**Total Critical Path: ~18 days**

## Sprint Planning Recommendations

### Sprint 1: Foundation
- Complete spike and tech spec review
- Start parallel work streams:
  - task_4: Integration
  - task_5: Algorithm
  - task_6: Configuration
  - task_7: Database

### Sprint 2: Implementation
- Complete prerequisite tickets
- Start main implementation (task_9)
- Start dashboard (task_10) in parallel

### Sprint 3: Testing
- Complete implementation
- Execute internal tests (task_11)
- Start E2E tests (task_12)

### Sprint 4: Rollout
- Complete E2E tests
- Execute rollout plan (task_13)
- Monitor via dashboard

## Risks & Mitigation

### Risk 1: External Team Dependency
- **Risk:** OAuth setup (CIAME team) delays integration
- **Mitigation:** Start coordination early, have fallback auth approach

### Risk 2: Database Deployment Timing
- **Risk:** Database changes need DBA review, may take longer
- **Mitigation:** Submit DB ticket for review in Sprint 1

### Risk 3: Testing Reveals Issues
- **Risk:** E2E testing finds problems requiring rework
- **Mitigation:** Thorough internal testing first, plan buffer time

## Notes

- Dashboard work (task_10) can proceed in parallel with implementation
- Configuration tickets (task_6, task_7) should be prioritized as they block other work
- External team dependencies should be initiated as early as possible
- Review environment URLs will use pattern: [service]-review-[MR-number]
```

---

## 11. EXAMPLE COMPLETE DECOMPOSITION

### Example Scenario

**Given this simplified tech spec:**

> **Feature: Customer Risk Scoring Service**
>
> **Overview:** We need to add a new customer scoring service that calculates
> risk scores based on customer behavior and transaction history.
>
> **Design:**
>
> - Integrate with Customer API to retrieve customer data
> - Apply a risk scoring algorithm (sigmoid-based)
> - Store scores in a new CustomerRiskScores table
> - Expose REST API to retrieve scores
> - Monitor via Datadog dashboard
>
> **Dependencies:**
>
> - Customer API (requires OAuth setup by platform team)
> - Shared risk-algorithms library
>
> **Configuration:**
>
> - Split trial for gradual rollout (1% → 25% → 50% → 100%)
> - Dynamic thresholds stored in database
>
> **Testing:**
>
> - Unit tests for algorithm
> - Integration tests for API
> - E2E tests with real customer data
>
> **Rollout:**
>
> - Phased rollout by percentage
> - Monitor error rates and score distribution

### Resulting Decomposition

**Directory Structure:**

```
CS-1234/
├── task_1.md   # Tech Spec
├── task_2.md   # Review
├── task_3.md   # Customer API Client
├── task_4.md   # Risk Algorithm
├── task_5.md   # Database Table
├── task_6.md   # Split Trial
├── task_7.md   # Threshold APIs
├── task_8.md   # Score Calculation Service
├── task_9.md   # Score Retrieval API
├── task_10.md  # Datadog Dashboard
├── task_11.md  # Data Replication
├── task_12.md  # Internal Test Plan
├── task_13.md  # E2E Test Plan
├── task_14.md  # Rollout Plan
└── dependency_map.md
```

**Task 1: Tech Spec**

```markdown
# Customer Risk Scoring Tech Spec

## Context

We need to document the design for the new customer risk scoring service,
including architecture, algorithm details, and integration points.

## Acceptance Criteria

- Tech spec created covering:
  - Architecture and system design
  - Risk scoring algorithm details
  - Integration with Customer API
  - Database schema
  - API specifications
  - Observability requirements
- Tech spec reviewed and approved by team

## Dependencies

- **Blocks:** task_2 (Review)
```

**Task 2: [Review] Tech Spec**

```markdown
# [Review] Customer Risk Scoring Tech Spec

## Context

Please review the Customer Risk Scoring tech spec.

## Acceptance Criteria

- Tech spec reviewed by [Reviewer Names]
- Feedback incorporated or discussed
- Approval received by [Date]

## Dependencies

- **Blocked by:** task_1 (Tech Spec)
- **Blocks:** All implementation tickets
```

**Task 3: [customer-scoring] Create Customer API Client**

```markdown
# [customer-scoring] Create GraphQL Client for Customer API

## Context

To calculate risk scores, we need to retrieve customer behavior and transaction
data from the Customer API.

[Link to tech spec section]

### Implementation Notes

- Onboarding instructions: [link]
- Example implementation from billing service: [gitlab link]
- Requires OAuth setup by Platform team (ticket PLAT-456)
- Query customer behavior data and transaction history

## Acceptance Criteria

- customer-scoring service onboarded to Customer API
- GraphQL client can fetch customer behavior data
- GraphQL client can fetch transaction history
- Health endpoint returns OK status for customer-api dependency
- Smoke test verifies schema contract

## AC Verification

- Verify OK status for `customer-api` dependency:
  - https://customer-scoring-review-101.int.zgcp-consumer-nonprod-k8s.zg-int.net/health
- Verify smoke test success:
  - https://customer-scoring-review-101.int.zgcp-consumer-nonprod-k8s.zg-int.net/zon/customer-api
- Verify pipeline tests pass

## Dependencies

- **Blocked by:** PLAT-456 (OAuth setup by Platform team)
- **Blocks:** task_8 (Score Calculation Service)
```

**Task 4: [risk-algorithms] Implement Risk Scoring Algorithm**

```markdown
# [risk-algorithms] Implement Customer Risk Scoring Algorithm

## Context

We need to create a shared algorithm library for calculating customer risk
scores using a sigmoid-based approach.

[Link to tech spec section]

### Implementation Notes

Risk score formula:
```

RiskScore = 1 / (1 + e^(-k \* (x - x0)))

Where:

- x = weighted combination of behavior signals
- k = steepness parameter (configurable)
- x0 = inflection point (configurable)

````

Behavior signals include:
- Transaction frequency
- Transaction amount variance
- Account age
- Failed payment count

## Acceptance Criteria

* Algorithm implemented in risk-algorithms library
* Unit tests cover all scoring scenarios:
  * Low risk customers (score < 0.3)
  * Medium risk customers (0.3 <= score < 0.7)
  * High risk customers (score >= 0.7)
  * Edge cases (no data, missing fields)
* Algorithm accepts configurable parameters (k, x0)
* Returns score between 0.0 and 1.0

## AC Verification

* Unit tests pass in CI/CD pipeline
* Test cases include:
  ```python
  assert calculate_risk_score(low_risk_data) < 0.3
  assert calculate_risk_score(high_risk_data) >= 0.7
  assert 0.0 <= calculate_risk_score(any_data) <= 1.0
````

## Dependencies

- **Blocks:** task_8 (Score Calculation Service)

````

**Task 5: Create CustomerRiskScores Database Table**
```markdown
# Create CustomerRiskScores Database Table

## Context

We need to persist calculated risk scores for customers to enable historical tracking and API retrieval.

[Link to tech spec section]

### Implementation Notes

**CustomerRiskScores Table:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| CustomerID | VARCHAR(50) | False | Customer identifier |
| RiskScore | DECIMAL(5,4) | False | Score between 0.0000 and 1.0000 |
| CalculatedAt | DATETIME | False | When score was calculated |
| AlgorithmVersion | VARCHAR(20) | False | Version of algorithm used |
| CreatedAt | DATETIME | False | Record creation timestamp |
| UpdatedAt | DATETIME | False | Last update timestamp |

**Indexes:**
- Primary Key: (CustomerID, CalculatedAt)
- Index: (CustomerID, CalculatedAt DESC) for latest score queries
- Index: (CalculatedAt) for time-based queries

**Enable CDC for audit trail**

## Acceptance Criteria

* CustomerRiskScores table created in customer-scoring DB
* Primary key and indexes created as specified
* CDC enabled for the table

## AC Verification

* Verify table exists:
  ```sql
  SELECT * FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_NAME = 'CustomerRiskScores';
````

- Verify indexes:
  ```sql
  SELECT * FROM sys.indexes
  WHERE object_id = OBJECT_ID('CustomerRiskScores');
  ```
- Verify CDC enabled:
  ```sql
  SELECT is_tracked_by_cdc FROM sys.tables
  WHERE name = 'CustomerRiskScores';
  ```

## Dependencies

- **Blocks:** task_8 (Score Calculation), task_9 (Retrieval API), task_11 (Data
  Replication)

````

**Task 6: Create Split Trial for Risk Scoring Rollout**
```markdown
# Create Split Trial for Customer Risk Scoring Rollout

## Context

We need a Split trial to enable gradual rollout of risk scoring (1% → 25% → 50% → 100%).

## Acceptance Criteria

* Split trial created: `customer-risk-scoring`
* Treatments defined:
  * `off`: Do not calculate risk scores
  * `on`: Calculate and store risk scores
* Traffic allocation set to 0% initially (will be dialed up during rollout)

## AC Verification

* Verify trial exists: https://zexp.zgtools.net/trial/customer-risk-scoring/
* Verify treatments match specification
* Verify initial allocation is 0%

## Dependencies

* **Blocks:** task_8 (Score Calculation Service)
````

**Task 7: [customer-scoring] Add Risk Threshold Configuration APIs**

```markdown
# [customer-scoring] Add Risk Threshold Configuration APIs

## Context

We need APIs to manage dynamic risk thresholds (k, x0 parameters for the
algorithm) without code deployments.

### Implementation Notes

Store thresholds in RiskThresholds table:

- ThresholdType (k, x0)
- Value
- UpdatedAt
- UpdatedBy

## Acceptance Criteria

- PUT endpoint to update threshold values
- GET endpoint to retrieve current thresholds
- DELETE endpoint to reset to defaults
- Changes logged to database

## AC Verification

[Similar detailed verification as example in section 2.4]

## Dependencies

- **Blocked by:** Database table for thresholds (can be same ticket as task_5 or
  separate)
- **Blocks:** task_8 (Score Calculation Service)
```

**Task 8: [customer-scoring] Implement Risk Score Calculation Service**

```markdown
# [customer-scoring] Implement Risk Score Calculation and Storage

## Context

Apply risk algorithm to customer data and store results. This is the core
service logic that integrates all components.

[Link to tech spec section]

### Implementation Notes

Service flow:

1. Check Split trial for customer ID
2. If enabled, fetch customer data from Customer API client
3. Apply risk algorithm from risk-algorithms library
4. Store score in CustomerRiskScores table
5. Log metrics and errors
6. Handle failures gracefully (fallback to no score)

## Acceptance Criteria

- Service calculates risk scores using algorithm from task_4
- Service fetches customer data via client from task_3
- Service checks Split trial from task_6 before calculating
- Service stores scores in database table from task_5
- Service handles errors gracefully (Customer API down, algorithm errors, DB
  errors)
- Ranking factors stored include algorithm version and score
- Unit test verifies E2E flow with mocked dependencies

## Dependencies

- **Blocked by:** task_3 (Customer API Client), task_4 (Algorithm), task_5
  (Database), task_6 (Split Trial)
- **Blocks:** task_12 (Internal Test), task_13 (E2E Test)
```

**Task 9: [customer-scoring] Add Risk Score Retrieval API**

```markdown
# [customer-scoring] Add REST API for Risk Score Retrieval

## Context

Provide API endpoint for other services to retrieve customer risk scores.

## Acceptance Criteria

- GET /api/v1/customers/{customerId}/risk-score endpoint created
- Returns latest risk score for customer
- Returns 404 if no score exists
- Includes metadata (calculated timestamp, algorithm version)
- Includes error handling and validation

## AC Verification

[Detailed curl commands and verification as in section 2.4]

## Dependencies

- **Blocked by:** task_5 (Database Table)
- **Blocks:** task_13 (E2E Test)
```

**Task 10: Datadog Dashboard for Risk Scoring**

```markdown
# Datadog Dashboard for Customer Risk Scoring

## Context

Monitor risk score calculations, API usage, and score distribution.

## Acceptance Criteria

- Datadog dashboard created with panels:
  - Risk score calculation rate
  - Error rate (by error type)
  - API latency (p50, p95, p99)
  - Score distribution histogram
  - Customer API dependency health

## Dependencies

- **No blockers** (can work in parallel with implementation)
```

**Task 11: Replicate CustomerRiskScores to Databricks**

```markdown
# Replicate CustomerRiskScores Change Log to Databricks

## Context

Capture history of risk scores in Databricks for analytics and reporting.

### Implementation Notes

- Follow standard Databricks replication runbook: [link]
- Use Incremental | Append sync mode
- CDC already enabled in task_5

## Acceptance Criteria

- History of CustomerRiskScores captured in Databricks table
- Replication pipeline configured and tested
- Data appears in Databricks within 5 minutes of DB changes

## Dependencies

- **Blocked by:** task_5 (Database Table with CDC enabled)
```

**Task 12: Internal Test Plan**

```markdown
# Internal Test Plan for Customer Risk Scoring

## Context

Create and execute internal testing for customer risk scoring service.

## Acceptance Criteria

- Internal test plan created covering:
  - Unit tests for all components
  - Integration tests for APIs
  - Error handling scenarios
  - Performance tests
- Test plan reviewed and approved by team
- All tests executed successfully

## Dependencies

- **Blocked by:** task_8 (Score Calculation), task_9 (Retrieval API)
- **Blocks:** task_13 (E2E Test)
```

**Task 13: E2E Test Plan**

```markdown
# E2E Test Plan for Customer Risk Scoring

## Context

Test full customer risk scoring flow end-to-end with real customer data in test
environment.

## Acceptance Criteria

- E2E test plan created covering:
  - Full flow from customer data to score storage
  - Score retrieval via API
  - Monitoring and alerting
  - Rollback scenarios
- Test plan executed with real test data
- All scenarios pass

## Dependencies

- **Blocked by:** task_12 (Internal Test)
- **Blocks:** task_14 (Rollout)
```

**Task 14: Rollout Plan**

```markdown
# Rollout Plan for Customer Risk Scoring

## Context

Plan phased rollout of customer risk scoring with monitoring and rollback
strategy.

## Acceptance Criteria

- Rollout plan created with phases:
  - 1% of customers
  - 25% of customers
  - 50% of customers
  - 100% of customers
- Success criteria defined for each phase
- Rollback plan documented
- Monitoring thresholds set
- Plan reviewed and approved by team

## Dependencies

- **Blocked by:** task_13 (E2E Test)
```

**Dependency Map:**

```
task_1 (Tech Spec) ──> task_2 (Review) ──┐
                                         │
    ┌────────────────────────────────────┘
    │
    ├──> task_3 (Customer API Client) ───┐
    ├──> task_4 (Risk Algorithm)      ───┼──> task_8 (Score Calculation) ──┬──> task_12 (Internal Test)
    ├──> task_5 (Database Table)      ───┤                                  │      ↓
    │         │                           │                                  │    task_13 (E2E Test)
    │         ├──> task_7 (Threshold APIs)                                   │      ↓
    │         ├──> task_9 (Retrieval API) ────────────────────────────────────┤    task_14 (Rollout)
    │         └──> task_11 (Data Replication)                                │
    ├──> task_6 (Split Trial)         ───┘                                  │
    │                                                                         │
    └──> task_10 (Dashboard) [parallel] ─────────────────────────────────────┘
```

---

## Conclusion

This guide provides a comprehensive framework for decomposing tech specs into
well-structured Jira tickets. By following these principles and patterns, AI
agents can create ticket decompositions that:

- Are complete and cover all requirements
- Have clear dependencies and ordering
- Are appropriately scoped and testable
- Follow team conventions and best practices
- Enable effective sprint planning and parallel work
- Reduce implementation risk through proper separation of concerns

**Remember:** The goal is to create tickets that developers can pick up and
execute with minimal ambiguity, while maintaining flexibility for implementation
details discovered during development.
