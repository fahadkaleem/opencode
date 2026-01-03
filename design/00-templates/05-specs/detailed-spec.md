**_For any sections that do not apply, DELETE them entirely to avoid confusing downstream AI agents._**

# \[Project Name\] \- Detailed Engineering Spec

# Overview

\[_Provide a 1-2 paragraph overview of the project and the problem we are trying to solve._\]

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

- As a customer, I want to browse products by category, so that I can find relevant items quickly
- As a vendor, I want to upload product images, so that customers can see my inventory

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

\[What is the call pattern for each API? What is the expected volume (RPM/RPS) that could inform the need for any load tests?\]

## Events

\[_Identify new event flows or events that will be updated at a high-level (e.g. new infrastructure or sequence diagrams)_\]

## Data Storage

\[_Where is data stored? List any new databases or tables, and provide information on stored values in the table. Include indexes and constraints. Describe any special considerations about how the data will be read and written, including frequency, expected volume, whether data can be deleted, backup, and expiration._\]

| Field               | isRequired | Data Type | Description                   | Example                            |
| :------------------ | :--------- | :-------- | :---------------------------- | :--------------------------------- | ------------------- |
| \[**_FieldName_**\] | \[\*Yes    | No\*\]    | \[_Dependent on technology_\] | \[_Description of data meaning._\] | \[_Example value_\] |

# Observability

## Logging

\[_What info, warn, and error logs will be collected? What information will we need to investigate errors or interesting scenarios?_\]

## Metrics

\[_What events deserve metrics to help us understand usage or health? What thresholds will be set for those metrics? What dashboards or reports will allow viewing of the metrics?_\]

## Monitoring

\[_What provisions are in place for ensuring the features are behaving as expected? How will the team know if the features are not working properly?_\]

# Testing

\[_Describe our approach to testing the features. Consider test automation (unit tests, integration tests, user acceptance tests), post deployment tests, exploratory testing, and code coverage. Define the quality criteria the features must meet._\]

## Unit Tests

\[_What will be covered by unit tests?_\]

## Integration Tests

\[_What integration points need testing?_\]

## End to End Tests

\[_What critical user journeys need end-to-end test coverage?_\]

# Alternatives Considered

\[_List the alternatives that were considered when designing the implementation details for this project. What options did we rule out and why?_\]

---

## Optional Sections

_\[DELETE any of these sections if they are not relevant to your project\]_

## Front End Updates

\[_If your feature includes front end changes, add mocks for how the user experience is being changed. Include before and after screenshots._\]

## Auth

\[_Can this be accessed internally or externally? Are there limitations on who can access it? How will that be enforced?_\]

## Resiliency

\[_Describe how the product will react to diverse conditions. Outline plans for failover, rollback, and retries._\]

## Dependencies

\[_List dependencies, either existing components or new required components that are outside the scope of this design._\]

## Dependents

\[_List components that will be dependent on the new features._\]

## New Technologies Considered

\[_List new technologies considered and why they were chosen or rejected._\]
