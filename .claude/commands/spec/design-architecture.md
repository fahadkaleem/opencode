# Architecture Design Command

**Task ID:** {{task_id}}

You are an expert system architect. Your task is to create a comprehensive,
multi-layered architecture design based on the specification analysis. This
design will guide all subsequent implementation tasks.

## Purpose

The architecture design phase transforms high-level requirements into a concrete
technical blueprint by:

1. **Defining system architecture** - How components interact
2. **Designing data models** - What data structures are needed
3. **Mapping behaviors** - What workflows and business logic exist
4. **Specifying interfaces** - APIs, events, and integration points
5. **Planning infrastructure** - Deployment, scaling, monitoring

## Input Context

Read the specification analysis from:

- `.alfred/tasks/{{task_id}}/artifacts/spec-analysis.json`

Optionally read:

- `.alfred/tasks/{{task_id}}/artifacts/spec-validation.json` (if available)
- Original spec: `.alfred/specs/{{task_id}}-spec.md`

## Multi-Layered Architecture Design

Design the architecture across **four specialized domains** (inspired by
CodeMachine's Blueprint Orchestrator):

### Domain 1: Foundation Architecture

**Focus:** Infrastructure, tech stack, deployment, tooling

**What to design:**

1. **Technology Stack:**
   - Programming languages and versions
   - Frameworks and libraries
   - Build tools and package managers
   - Development environment setup

2. **Infrastructure:**
   - Deployment architecture (monolith, microservices, serverless)
   - Hosting platform (AWS, GCP, Azure, on-prem)
   - Container strategy (Docker, Kubernetes)
   - Networking and security boundaries

3. **Development Tooling:**
   - Version control strategy
   - CI/CD pipeline design
   - Testing frameworks
   - Linting and formatting tools
   - Documentation generation

4. **Operational Concerns:**
   - Logging strategy
   - Monitoring and alerting
   - Error tracking
   - Performance profiling

**Output Structure:**

```json
{
  "foundation": {
    "tech_stack": {
      "frontend": {
        "language": "TypeScript",
        "framework": "React 18",
        "build_tool": "Vite",
        "ui_library": "Material-UI",
        "state_management": "Zustand"
      },
      "backend": {
        "language": "TypeScript",
        "runtime": "Node.js 20",
        "framework": "NestJS",
        "api_style": "REST",
        "validation": "Zod"
      },
      "database": {
        "primary": "PostgreSQL 15",
        "caching": "Redis",
        "orm": "Prisma"
      }
    },
    "infrastructure": {
      "deployment_model": "containerized microservices",
      "hosting": "AWS ECS",
      "cdn": "CloudFront",
      "secrets_management": "AWS Secrets Manager"
    },
    "tooling": {
      "version_control": "Git + GitHub",
      "ci_cd": "GitHub Actions",
      "testing": "Jest + Playwright",
      "linting": "ESLint + Prettier",
      "docs": "TypeDoc"
    },
    "observability": {
      "logging": "Winston + CloudWatch",
      "monitoring": "Datadog",
      "error_tracking": "Sentry",
      "tracing": "OpenTelemetry"
    }
  }
}
```

### Domain 2: Structural Data Architecture

**Focus:** Data models, schemas, storage, relationships

**What to design:**

1. **Entity Models:**
   - Core domain entities
   - Attributes and types
   - Validation rules
   - Unique constraints

2. **Relationships:**
   - One-to-one, one-to-many, many-to-many
   - Foreign keys and references
   - Cascade behaviors

3. **Database Schema:**
   - Table structures
   - Indexes for performance
   - Constraints (primary keys, foreign keys, unique, check)
   - Partitioning strategy (if needed)

4. **Data Access Patterns:**
   - Common queries and their optimization
   - Write patterns
   - Caching strategy
   - Data migration approach

**Output Structure:**

```json
{
  "data_architecture": {
    "entities": [
      {
        "name": "User",
        "attributes": [
          {
            "name": "id",
            "type": "uuid",
            "constraints": ["primary_key", "not_null"]
          },
          {
            "name": "email",
            "type": "string",
            "constraints": ["unique", "not_null"],
            "validation": "email format"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "default": "now()"
          }
        ],
        "indexes": ["email"],
        "relationships": [
          {
            "type": "one_to_many",
            "target": "Profile",
            "foreign_key": "user_id"
          }
        ]
      }
    ],
    "access_patterns": [
      {
        "operation": "findUserByEmail",
        "query_type": "index_lookup",
        "index_used": "email",
        "estimated_frequency": "high"
      }
    ],
    "caching_strategy": {
      "cache_layer": "Redis",
      "cached_entities": ["User session", "Frequently accessed profiles"],
      "ttl": "15 minutes"
    }
  }
}
```

### Domain 3: Behavior Architecture

**Focus:** Business logic, workflows, state machines, processes

**What to design:**

1. **Core Workflows:**
   - User journeys as state machines
   - Business process flows
   - Decision points and branching logic
   - Error handling and rollback

2. **Business Rules:**
   - Validation logic
   - Authorization rules
   - Business constraints
   - Calculations and transformations

3. **Service Layer:**
   - Service boundaries
   - Service responsibilities
   - Inter-service communication
   - Transaction boundaries

4. **State Management:**
   - Application state
   - Session state
   - Distributed state (if applicable)
   - State persistence strategy

**Output Structure:**

```json
{
  "behavior_architecture": {
    "workflows": [
      {
        "name": "UserRegistration",
        "trigger": "User submits registration form",
        "steps": [
          {
            "step": "Validate input",
            "validations": ["email format", "password strength", "unique email"]
          },
          {
            "step": "Create user account",
            "transaction": true
          },
          {
            "step": "Send verification email",
            "async": true,
            "error_handling": "log and retry"
          },
          {
            "step": "Return success response",
            "response": "User created with verification pending"
          }
        ],
        "error_states": [
          "ValidationError",
          "DuplicateEmailError",
          "EmailServiceError"
        ],
        "rollback": "Delete user if email fails after 3 retries"
      }
    ],
    "business_rules": [
      {
        "rule": "Password must be at least 8 characters with one special char",
        "enforced_at": "validation layer",
        "applies_to": ["UserRegistration", "PasswordReset"]
      }
    ],
    "services": [
      {
        "name": "AuthenticationService",
        "responsibilities": [
          "User login",
          "Token generation",
          "Session management"
        ],
        "dependencies": ["UserRepository", "TokenService"],
        "exposed_methods": [
          "login",
          "logout",
          "refreshToken",
          "validateSession"
        ]
      }
    ]
  }
}
```

### Domain 4: Interface Architecture

**Focus:** APIs, events, integrations, user interfaces

**What to design:**

1. **API Design:**
   - REST endpoints (or GraphQL schema)
   - Request/response formats
   - Status codes and error responses
   - Authentication and authorization
   - Rate limiting and quotas

2. **Event Architecture:**
   - Event types and schemas
   - Event producers and consumers
   - Event bus/queue architecture
   - Event ordering and idempotency

3. **External Integrations:**
   - Third-party services
   - API clients
   - Webhook handlers
   - Data synchronization

4. **User Interface Architecture:**
   - Component hierarchy
   - State management approach
   - Routing structure
   - Form handling strategy

**Output Structure:**

```json
{
  "interface_architecture": {
    "api_design": {
      "base_url": "/api/v1",
      "authentication": "JWT Bearer tokens",
      "endpoints": [
        {
          "path": "/users",
          "method": "POST",
          "description": "Create new user",
          "request_body": {
            "email": "string (required)",
            "password": "string (required)",
            "name": "string (optional)"
          },
          "responses": {
            "201": "User created successfully",
            "400": "Validation error",
            "409": "Email already exists"
          },
          "rate_limit": "10 requests per minute per IP"
        }
      ]
    },
    "events": {
      "event_bus": "Redis Pub/Sub",
      "events": [
        {
          "name": "user.created",
          "schema": {
            "user_id": "uuid",
            "email": "string",
            "created_at": "timestamp"
          },
          "producers": ["AuthenticationService"],
          "consumers": ["EmailService", "AnalyticsService"]
        }
      ]
    },
    "integrations": [
      {
        "service": "SendGrid",
        "purpose": "Email delivery",
        "authentication": "API key",
        "endpoints_used": ["/mail/send"],
        "error_handling": "Retry with exponential backoff"
      }
    ],
    "ui_architecture": {
      "framework": "React",
      "component_structure": "Atomic Design",
      "routing": "React Router",
      "state": "Context API + Zustand for global state",
      "forms": "React Hook Form + Zod validation",
      "styling": "Tailwind CSS"
    }
  }
}
```

## Design Process

### Step 1: Analyze Requirements

- Review all functional and non-functional requirements
- Identify architectural drivers (performance, scalability, security)
- Note constraints and assumptions

### Step 2: Make Architectural Decisions

For each major decision, document:

- **Decision:** What was chosen
- **Rationale:** Why it was chosen
- **Alternatives:** What else was considered
- **Trade-offs:** Pros and cons

**Example:**

```json
{
  "decision": "Use PostgreSQL instead of MongoDB",
  "rationale": "Data has clear relational structure, ACID guarantees needed",
  "alternatives_considered": ["MongoDB (document DB)", "MySQL (relational)"],
  "trade_offs": {
    "pros": ["Strong consistency", "Complex queries", "Mature ecosystem"],
    "cons": ["Less flexible schema", "Scaling requires more planning"]
  }
}
```

### Step 3: Validate Architecture

- Check against non-functional requirements (performance, scalability, security)
- Ensure all functional requirements can be implemented
- Identify potential bottlenecks or risks
- Verify technology choices are compatible

### Step 4: Create Component Diagram

Describe how components interact:

```
┌─────────────┐
│  Frontend   │
│   (React)   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐      ┌──────────┐
│  API Gateway│─────▶│  Redis   │
│  (NestJS)   │      │ (Cache)  │
└──────┬──────┘      └──────────┘
       │
       ▼
┌─────────────┐      ┌──────────┐
│  Services   │─────▶│PostgreSQL│
│   Layer     │      │   (DB)   │
└──────┬──────┘      └──────────┘
       │
       ▼
┌─────────────┐
│  External   │
│   APIs      │
└─────────────┘
```

## Output Format

Create architecture design document at
`.alfred/tasks/{{task_id}}/artifacts/architecture-design.json`:

```json
{
  "created_at": "ISO timestamp",
  "task_id": "{{task_id}}",
  "architecture_version": "1.0",
  "foundation": {
    /* Foundation architecture */
  },
  "data_architecture": {
    /* Data architecture */
  },
  "behavior_architecture": {
    /* Behavior architecture */
  },
  "interface_architecture": {
    /* Interface architecture */
  },
  "architectural_decisions": [
    {
      "id": "ADR-001",
      "decision": "string",
      "rationale": "string",
      "alternatives_considered": ["string"],
      "trade_offs": {
        "pros": ["string"],
        "cons": ["string"]
      }
    }
  ],
  "component_diagram": "ASCII art or description",
  "risks_and_mitigations": [
    {
      "risk": "Database becomes bottleneck under high load",
      "likelihood": "medium",
      "impact": "high",
      "mitigation": "Implement read replicas and connection pooling"
    }
  ],
  "non_functional_coverage": {
    "REQ-NFR-001": {
      "requirement": "Handle 10K concurrent users",
      "approach": "Horizontal scaling with load balancer, Redis caching",
      "validation": "Load testing with k6"
    }
  }
}
```

## Output Summary

After creating the architecture design, output:

### Architecture Design Complete

**Architecture Version:** 1.0

#### Foundation

- **Frontend:** [tech stack]
- **Backend:** [tech stack]
- **Database:** [tech stack]
- **Infrastructure:** [deployment model]

#### Data Models

- **Entities:** [count]
- **Relationships:** [count]
- **Indexes:** [count]

#### Workflows

- **Core Workflows:** [count]
- **Services:** [count]
- **Business Rules:** [count]

#### Interfaces

- **API Endpoints:** [count]
- **Events:** [count]
- **External Integrations:** [count]

#### Key Architectural Decisions

{{#each architectural_decisions}}

- **ADR-{{id}}**: {{decision}}
  - Rationale: {{rationale}} {{/each}}

#### Risks Identified

{{#each risks_and_mitigations}}

- **{{risk}}** ({{likelihood}}/{{impact}})
  - Mitigation: {{mitigation}} {{/each}}

---

**Next Steps:** Run `alfred run spec:decompose --task {{task_id}}` to break down
into implementation tasks based on this architecture.

**Architecture design saved to:**
`.alfred/tasks/{{task_id}}/artifacts/architecture-design.json`

## Design Guidelines

### Foundation Architecture

- Choose proven, production-ready technologies
- Prefer standard tools over exotic choices
- Consider team expertise
- Plan for observability from day one

### Data Architecture

- Design for the queries you'll actually run
- Index carefully (every index has write cost)
- Plan for data growth
- Consider privacy and compliance (GDPR, etc.)

### Behavior Architecture

- Keep business logic separate from infrastructure
- Design for testability
- Handle errors explicitly
- Make workflows resumable

### Interface Architecture

- Design APIs for clients, not implementation
- Version APIs from the start
- Validate all inputs
- Return meaningful errors

## Important Notes

- **Be specific:** Don't just say "use database", specify PostgreSQL 15
- **Be practical:** Choose technologies you can actually deploy and maintain
- **Be forward-thinking:** Consider scaling, monitoring, debugging
- **Be realistic:** Don't over-engineer for scale you don't need yet
- **Document decisions:** Future you will thank you for rationale
- **Consider trade-offs:** Every choice has pros and cons
- **Validate against requirements:** Architecture should support all REQ-XXX
  items
- **Think about operations:** How will this be deployed, monitored, debugged?

## Quality Checklist

Before completing, verify:

- [ ] All four architecture domains are designed
- [ ] Technology choices are justified
- [ ] All functional requirements can be implemented
- [ ] All non-functional requirements have approaches
- [ ] Data models support required queries
- [ ] Workflows handle error cases
- [ ] APIs are versioned and documented
- [ ] Security is addressed
- [ ] Monitoring and logging planned
- [ ] Deployment strategy defined
- [ ] Risks identified and mitigated
