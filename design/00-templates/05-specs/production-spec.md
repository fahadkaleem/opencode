**_For any sections that do not apply, DELETE them entirely to avoid confusing downstream AI agents._**

# \[Project Name\] \- Production Engineering Spec

# Overview

\[_Provide a 1-2 paragraph overview of the project and the problem we are trying to solve. If there is a product brief, rely on that for most of the justification. If there is not a product brief, include justification for the project here. Additionally, the definition of success and the product perspective needs to be approved by Product before the spec is filled out._\]

| Product Reviewer | Status   | Notes |
| :--------------- | :------- | :---- |
| Person           | Unviewed |       |

## Definition of Success

\[_Provide context on what success looks like for this project._\]

### Product Perspective

\[_Describe how the above definition will be measured / quantified from a product perspective._\]

### Engineering Perspective

\[_Describe how the above definition will be measured / quantified from an engineering perspective._\]

## Glossary / Acronyms

\[_Include any terms and acronyms that should be defined for reference._\]

## User Journeys

\[_Describe key user journeys using the format: "As a [user type], I want to [action], so that [benefit]". Focus on the most critical paths through the system._\]

**Example:**

- As a customer, I want to view my order history, so that I can track past purchases
- As an admin, I want to generate sales reports, so that I can analyze business performance

## Requirements

_\[Each requirement must have a unique ID (REQ-001, REQ-002, etc.) and priority level (P0=Critical, P1=High, P2=Medium, P3=Low)\]_

### Functional Requirements

**REQ-001 [P0]**: _\[Requirement description as agile story: "As a user I want to X in order to do Y"\]_

**REQ-002 [P1]**: _\[Requirement description\]_

### Non-Functional Requirements

**REQ-NFR-001 [P0]**: _\[Non-functional requirement such as scalability, performance, security, etc.\]_

**Example:**

- **REQ-NFR-001 [P0]**: System must handle 10,000 concurrent users
- **REQ-NFR-002 [P1]**: API response time must be under 200ms for 95th percentile

## Assumptions

_\[Provide any assumptions about the domain\]_

## What We're NOT Doing

_\[Explicitly list features, capabilities, or scope items that are OUT OF SCOPE for this project. This prevents scope creep and sets clear boundaries.\]_

**Example:**

- NOT supporting real-time notifications (will be addressed in future release)
- NOT migrating legacy data from old system
- NOT supporting Internet Explorer browser

# Design

## Major Design Considerations

\[_This is the main section where major details will be documented. This may be a list of functionality, behaviors, interactions, etc. Call out major concepts and any considerations or details that a reviewer would not otherwise expect to see in a project like this. List steps in the process and main components._\]

## Architecture Diagrams

\[_Add architectural diagrams, sequence diagrams, or any other drawings that help give a high-level overview of the new system or the components that are changing. For each diagram, provide a 1-2 sentence description of what the diagram shows._\]

## API

\[_Identify new APIs or APIs whose behavior will be updated._\]

| API                                   | Description                                                        |
| :------------------------------------ | :----------------------------------------------------------------- |
| **\[_ApiName_\] \[Method\] \[Path\]** | \[_Description of API, request/response structure, status codes_\] |

### Usage Estimates

\[What is the call pattern for each API? What is the _expected volume (RPM/RPS) that could inform the need for any load tests._\]

## Events

\[_Identify new event flows or events that will be updated at a high-level (e.g. new infrastructure or sequence diagrams)_\]

## Front End Updates

\[_If your feature or project includes front end changes add mocks for how the user experience is being changed. Be sure to include before and after which clearly articulates how our customers will use this. For Metro, this likely refers to either the Agent Customer Admin tool, or Metro UI._ \]

## Data Storage

\[_Where is data stored? List any new databases or tables, and provide information on stored values in the table. Include indexes and constraints. Describe any special considerations about how the data will be read and written, including frequency, expected volume, whether data can be deleted, backup, and expiration. Can the data be manually inspected for debugging or investigative purposes? Are there any provisions for updating incorrect data?_\]

| Field               | isRequired | Data Type | Description                   | Example                            |
| :------------------ | :--------- | :-------- | :---------------------------- | :--------------------------------- | ------------------- |
| \[**_FieldName_**\] | \[\*Yes    | No\*\]    | \[_Dependent on technology_\] | \[_Description of data meaning._\] | \[_Example value_\] |

## Auth

\[_Can this be accessed internally or externally? Are there limitations on who can access it? How will that be enforced?_\]

## Resiliency

\[_Describe how the product will react to diverse conditions. Ensure that we have designed for failure and can succeed in as many cases as possible. Consider using queues and/or notifications to eliminate failures and the impact of disruptions. Outline plans for failover, rollback, and retries._\]

## Dependencies

\[_List dependencies, either existing components or new required components that are outside the scope of this design. What use cases on each dependency are you using ? Action item : Verify these use cases work as expected. For service dependencies, by sure to specify tasks for setting up network access (via Kong gateway or similar), requesting required access keys or scope permissions, etc\]_

## Dependents

\[_List components that will be dependent on the new features. These may be existing dependents that will be impacted by the changes, or future dependents that will be added after this project is complete. These are also called upstream dependencies_\]

# Observability

## Failure Scenarios

\[_List out different failure scenarios and how we plan to handle them, whether it’s propagating errors to downstream dependencies, or handling the error to provide an alternate successful path. List each dependency and how the product will attempt to be successful despite the dependency’s outage. If the product itself breaks, how can we still attempt to provide success to our users (through manual means or dependents’ reactions._ \]

## Logging

\[_What info, warn, and error logs will be collected? What information will we need to investigate errors or interesting scenarios? Does any data need to be sent to DataLake?_\]

## Metrics

\[_What events deserve metrics to help us understand usage or health? What thresholds will be set for those metrics? What dashboards or reports will allow viewing of the metrics?_\]

## Monitoring

\[_What provisions are in place for ensuring the features are behaving as expected? How will the team know if the features are not working properly? Describe any new or existing Panoptes Monitors, Zon tests. Splunk / Umbra Dashboard metrics to track (latency, requests, dependencies to monitor). Include access and error logging to be monitored_\]

# Testing

\[_Describe our approach to testing the features. Consider test automation (unit tests, integration tests, user acceptance tests), post deployment tests (pre-prod and/or prod), exploratory testing, static analysis tool, security analysis tool, and code coverage. Be explicit about test priority. Define the quality criteria the features must meet. Are there any designs that need to be considered to enable the testability of the features? What services will need to be mocked and what mocked data is required during development?\]_

## Integration Tests

## Internal (Manual) Tests

## Performance/Load Tests

## End to End Test

## New technologies considered

_\[List new technologies considered, if you haven’t considered them please take a minute to explore how new technologies could help\]_

# Rollout Plan

\[\*How will this feature be rolled out? Will it be turned on in stages? Do any components need to be rolled out in order? Are there any dependencies that need to be in place before this feature? How will we validate the release(s) or decide to rollback?

## Pre Launch Checklist

## Launch Checklist

## Post Launch Checklist

## A/B Testing

\[_What existing A/B trials will impact this feature? Are any new A/B trials planned for experimentation or rollout? List the trials, treatments, and what they mean._\]

| Trial               | Treatment           | Description             |
| :------------------ | :------------------ | :---------------------- |
| **\[_TrialName_\]** | CONTROL             | \[_Expected behavior_\] |
|                     | \[_TreatmentName_\] | \[_Expected behavior_\] |

# Release Milestones

\[_List the milestones that will be met during development of this project. Break the project down into as many milestones as feasible, including MVP (minimum viable product), to ensure that we are delivering incrementally. Include the approximate size of each milestone. Include future milestones that are not yet planned for delivery. You can use table to display a visual of the ticket dependenciesnbreakdown as well._\]

# Alternatives Considered

\[_List the alternatives that were considered when designing the implementation details for this project. What options did we rule out and why? Describing the alternatives will allow others to understand how we arrived at this design and not repeat evaluations of the same alternatives again. This section may also include original designs that needed to be pivoted away from during implementation. Please include a link to the Spike document so reviewers can look into the high-level alternatives considered if needed_\]

# Misc Considerations

N/A
