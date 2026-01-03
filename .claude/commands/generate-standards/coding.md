---
description:
  Document comprehensive coding standards including style, naming, types, async
  patterns, error handling, and best practices
model: sonnet
---

# Coding Standards

You are an expert software engineer specializing in code quality, consistency,
and maintainability. Focus on discovering and documenting the actual coding
patterns, conventions, and standards used in this codebase by analyzing real
code examples.

Task: Produce comprehensive coding standards documentation that captures the
established patterns and conventions in the codebase, helping developers write
consistent, high-quality code.

- Identify actual coding patterns used in the codebase (don't invent standards)
- Document naming conventions, style guidelines, and structural patterns
- Extract type annotation patterns, async/await usage, and error handling
  approaches
- Find exemplary code that demonstrates best practices
- Provide file:line references to real examples throughout
- Focus on WHAT IS rather than WHAT SHOULD BE
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
   - Understand scope: full project vs. specific path
   - Identify programming language and frameworks

2. **Initial exploration** (activeForm: "Performing initial exploration")
   - Identify main source directories
   - Review project configuration files (pyproject.toml, package.json, etc.)
   - Locate linting/formatting configs (ruff.toml, .eslintrc, etc.)
   - Review CLAUDE.md or README for existing guidelines

3. **Overview & Philosophy section** (activeForm: "Writing Overview & Philosophy
   section")
   - Reference Output Instructions template section "Overview & Philosophy"
   - Document why standards matter for this project
   - Extract guiding principles from code patterns
   - Keep concise and project-specific

4. **Code Style & Formatting section** (activeForm: "Writing Code Style &
   Formatting section")
   - Reference Output Instructions template section "Code Style & Formatting"
   - Document indentation, line length, whitespace rules
   - Find these in linting configs or analyze code samples
   - Include file:line examples

5. **Naming Conventions section** (activeForm: "Writing Naming Conventions
   section")
   - Reference Output Instructions template section "Naming Conventions"
   - Analyze actual variable, function, class, file names
   - Document patterns for constants, enums, modules
   - Provide examples from real code with file:line refs

6. **Type Annotations section** (activeForm: "Writing Type Annotations section")
   - Reference Output Instructions template section "Type Annotations & Type
     Safety"
   - Document how types are used in the codebase
   - Show union types, Optional, generics patterns
   - Include actual code examples

7. **Async Programming section** (activeForm: "Writing Async Programming
   section")
   - Reference Output Instructions template section "Async Programming Patterns"
   - Document async/await usage patterns
   - Show context manager patterns
   - Analyze when sync vs async is used

8. **Error Handling section** (activeForm: "Writing Error Handling section")
   - Reference Output Instructions template section "Error Handling &
     Exceptions"
   - Document exception patterns and hierarchies
   - Show logging and error context patterns
   - Provide real examples with file:line refs

9. **Dependency Management section** (activeForm: "Writing Dependency Management
   section")
   - Reference Output Instructions template section "Dependency Management"
   - Document dependency injection patterns
   - Show import organization
   - Include examples from codebase

10. **API Design section** (activeForm: "Writing API Design section")
    - Reference Output Instructions template section "API Design Standards"
    - Document request/response model patterns
    - Show endpoint naming and versioning
    - Include actual API examples

11. **Database Patterns section** (activeForm: "Writing Database Patterns
    section")
    - Reference Output Instructions template section "Database Patterns"
    - Document session management patterns
    - Show query and transaction patterns
    - Provide code examples with file:line refs

12. **Observability section** (activeForm: "Writing Observability section")
    - Reference Output Instructions template section "Observability Standards"
    - Document logging, tracing, metrics patterns
    - Show decorator usage for tracing
    - Include real examples

13. **Security & Best Practices section** (activeForm: "Writing Security & Best
    Practices section")
    - Reference Output Instructions template section "Security & Best Practices"
    - Document authentication and validation patterns
    - Show secure coding practices
    - Provide examples from codebase

14. **Documentation Standards section** (activeForm: "Writing Documentation
    Standards section")
    - Reference Output Instructions template section "Documentation Standards"
    - Document docstring requirements
    - Show comment conventions
    - Include examples from well-documented code

15. **Code Organization section** (activeForm: "Writing Code Organization
    section")
    - Reference Output Instructions template section "Code Organization"
    - Document module structure and file organization
    - Show feature flag patterns
    - Describe responsibility boundaries

16. **Patterns & Anti-Patterns section** (activeForm: "Writing Patterns &
    Anti-Patterns section")
    - Reference Output Instructions template section "Common Patterns &
      Anti-Patterns"
    - Document approved design patterns
    - List things to avoid
    - Provide refactoring guidelines

17. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all sections present in correct order
    - Verify each section has substantive content (not placeholders or TODO
      markers)
    - Verify file:line references included throughout
    - Verify code examples are from actual codebase
    - Verify document starts with `# Coding Standards` heading only
    - Verify NO conversational preamble, explanations, or meta-commentary exists
    - Verify markdown formatting is clean and consistent
    - If ANY verification fails: DO NOT proceed, fix issues first

18. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/coding-standards.md`
    - Content must be PURE MARKDOWN starting with `# Coding Standards`
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

Analyze the provided path and scope the analysis to coding standards for that
specific area.

**If no path is provided:**

<message>
I'll analyze the entire project to document coding standards. If you want to focus on a specific directory, file, or module, you can provide a path:

Examples:

- `/document:coding-standards lib/agents` - Analyze agent-related code standards
- `/document:coding-standards routers/v1` - Analyze router code standards

Proceeding with full project analysis... </message>

## Analysis Task

<procedure>
Examine the project (or the specific path provided) to discover and document established coding standards and conventions.

Create a comprehensive guide that helps developers understand HOW to write code
that matches the existing patterns, WHAT conventions to follow, and WHERE to
find examples of good code.

**If a specific path was provided:** Focus analysis on that path only.

**If analyzing the entire project:** Focus on:

**Code Quality Foundations:**

- What are the formatting and style conventions?
- What linting and formatting tools are configured?
- What are the line length, indentation, and whitespace rules?
- How are imports organized?

**Naming and Structure:**

- Variable naming patterns (snake_case, camelCase, etc.)
- Function and class naming conventions
- Module and file naming standards
- Constant and enum patterns
- Database naming conventions

**Type Safety:**

- How are type annotations used?
- Union types vs Optional patterns
- Generic type usage
- Type aliases and custom types
- Return type annotation standards

**Async Programming:**

- When to use async vs sync
- async/await patterns
- Context manager usage
- Background task patterns
- Error handling in async code

**Error Handling:**

- Exception hierarchy and patterns
- Error logging conventions
- Graceful degradation strategies
- Error context and traceability
- User-facing vs internal errors

**Architecture Patterns:**

- Dependency injection patterns
- API design conventions
- Database session management
- Middleware patterns
- Feature flag usage

**Observability:**

- Logging conventions
- Tracing decorator usage
- Metrics collection patterns
- Structured logging formats

**Security:**

- Authentication patterns
- Input validation approaches
- Sensitive data handling
- Security best practices

**Important Notes:**

- Focus on EXISTING patterns, not aspirational ones
- Include file:line references to exemplary code throughout
- Provide code snippets from actual codebase
- Document both DO's and DON'Ts with examples
- Some documents are already available in `.alfred/docs/`. You can use them for
  context.
- CLAUDE.md may contain coding guidelines - use as reference

Be sure that you are describing existing coding practices actually used in the
codebase, not theoretical best practices. </procedure>

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

**CRITICAL**: Write your analysis to `.alfred/docs/coding-standards.md` using
the Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

````markdown
# Coding Standards

## Overview & Philosophy

Brief overview (2-3 paragraphs) of the coding approach:

Example: Connection Pacing follows modern Python 3.12+ conventions with strict
type safety and async-first design. Code prioritizes readability,
maintainability, and consistency. All developers are expected to follow these
standards to ensure the codebase remains coherent and easy to navigate.

Key principles:

- **Consistency over cleverness**: Favor readable, standard patterns over clever
  tricks
- **Type safety**: Use comprehensive type annotations for all public APIs
- **Async by default**: All I/O operations must be async
- **Explicit over implicit**: Make dependencies and behaviors clear

## Code Style & Formatting

### Formatting Tool

**Tool**: [Ruff, Black, Prettier, etc.]

**Configuration**: `[config file path with line ref]`

**Key Settings**:

- Line length: [X] characters
- Indentation: [X] spaces (or tabs)
- Quote style: [single/double]

### Indentation & Whitespace

- Use [X] spaces for indentation
- No trailing whitespace
- Single blank line between functions
- Two blank lines between classes
- [Additional rules from actual code]

**Examples**:

```python
# Good - from [file:line]
def function_name(param: str) -> int:
    result = process(param)
    return result


class ClassName:
    pass
```
````

### Import Organization

Order and grouping rules:

1. Standard library imports
2. Third-party imports
3. Local application imports

**Example** - from `[file:line]`:

```python
import asyncio
from typing import Annotated

import httpx
from fastapi import Depends

from lib.models import Agent
from lib.storage import Session
```

### Line Length

- Maximum line length: [X] characters
- Break long lines at logical points
- Use parentheses for multi-line expressions

## Naming Conventions

### Variables

**Pattern**: [snake_case, camelCase, etc.]

**Examples** from codebase:

```python
# Good - from [file:line]
agent_zuid: int = 12345
connection_attempt_id: UUID = uuid4()
is_eligible: bool = True

# Avoid
AgentZUID = 12345  # Should be lowercase
a_z = 12345  # Too abbreviated
```

### Functions & Methods

**Pattern**: [snake_case verbs]

**Examples** from `[file:line]`:

```python
# Good
async def get_agent_data(zuid: int) -> AgentData:
    pass

def calculate_capacity(agent: Agent) -> int:
    pass

# Avoid
async def AgentData(zuid):  # Should be verb, not noun
def calc(a):  # Too abbreviated
```

### Classes

**Pattern**: [PascalCase nouns]

**Examples** from `[file:line]`:

```python
# Good
class AgentEligibilityHandler:
    pass

class PaceCarV3Ranking:
    pass

# Avoid
class agent_handler:  # Should be PascalCase
class Handler:  # Too generic
```

### Constants & Enums

**Constants Pattern**: [UPPER_SNAKE_CASE]

**Enum Pattern**: [PascalCase class, values style]

**Examples** from `[file:line]`:

```python
# Constants - Good
MAX_AGENTS_PER_COHORT: int = 20
DEFAULT_TIMEOUT: float = 30.0
API_BASE_URL: str = "https://api.example.com"

# Enums - Good
class AgentStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
```

### Files & Modules

**Pattern**: [snake_case descriptive names]

**Structure**:

- `[pattern]` for models
- `[pattern]` for handlers
- `[pattern]` for utilities

**Examples** from project:

- `lib/agents/agent_eligibility_handler.py`
- `lib/models/agent.py`
- `routers/v1/agents.py`

### Database Tables & Columns

**Tables**: [naming pattern]

**Columns**: [naming pattern]

**Examples** from `[file:line]`:

```sql
-- Tables
agent_capacity
connection_attempts
team_behaviors

-- Columns
agent_zuid
created_at
is_active
```

## Type Annotations & Type Safety

### Type Annotation Requirements

**Required**:

- All function parameters
- All function return types
- All class attributes
- Public API contracts

**Optional**:

- Local variables (if type is obvious)
- Loop variables

**Examples** from `[file:line]`:

```python
# Good - comprehensive typing
async def get_agents(
    zuids: list[int],
    session: Annotated[Session, Depends(db_session)]
) -> list[Agent]:
    results: list[Agent] = []
    return results

# Avoid
async def get_agents(zuids, session):  # Missing all types
    return []
```

### Union Types vs Optional

**Modern Syntax**: Use `|` for unions (Python 3.10+)

**Examples** from `[file:line]`:

```python
# Good - modern union syntax
def process(value: str | int | None) -> dict | None:
    pass

# Avoid - old syntax
from typing import Union, Optional
def process(value: Union[str, int, None]) -> Optional[dict]:
    pass
```

### Generic Types

**Usage pattern**: [Document when and how generics are used]

**Examples** from `[file:line]`:

```python
from typing import TypeVar, Generic

T = TypeVar('T')

class Repository(Generic[T]):
    def get(self, id: int) -> T | None:
        pass
```

### Type Aliases

**Pattern**: [PascalCase for type aliases]

**Examples** from `[file:line]`:

```python
# Good - clear type aliases
AgentId = int
ZuidList = list[int]
JsonDict = dict[str, Any]

def process_agents(zuids: ZuidList) -> JsonDict:
    pass
```

### Pydantic Models

**Pattern**: [CamelAliasModel vs BaseModel usage]

**Examples** from `[file:line]`:

```python
# API models - use CamelAliasModel
class AgentRequest(CamelAliasModel):
    agent_zuid: int  # Converts to agentZuid in JSON
    max_capacity: int  # Converts to maxCapacity in JSON

# Internal models - use BaseModel
class AgentData(BaseModel):
    agent_zuid: int
    capacity: int
```

## Async Programming Patterns

### When to Use Async

**MUST use async**:

- All database operations
- All HTTP/API calls
- All I/O operations
- Route handlers with I/O

**Can use sync**:

- Pure calculations
- In-memory transformations
- Configuration loading

**Examples** from `[file:line]`:

```python
# Good - async for I/O
async def get_agent(zuid: int, session: Session) -> Agent:
    result = await session.execute(select(Agent).where(...))
    return result.scalar_one()

# Good - sync for pure logic
def calculate_score(metrics: Metrics) -> float:
    return metrics.success_rate * metrics.volume
```

### Async/Await Patterns

**Standard pattern**: [Document common patterns]

**Examples** from `[file:line]`:

```python
# Good - proper async/await
async def fetch_multiple_agents(zuids: list[int]) -> list[Agent]:
    tasks = [fetch_agent(zuid) for zuid in zuids]
    results = await asyncio.gather(*tasks)
    return results

# Avoid - blocking in async
async def bad_fetch():
    result = requests.get(url)  # Blocking! Use httpx instead
    return result
```

### Context Managers

**Pattern**: [Document async context manager usage]

**Examples** from `[file:line]`:

```python
# Good - async context managers
async with httpx.AsyncClient() as client:
    response = await client.get(url)

# Database sessions
with session:
    session.add(entity)
    session.commit()
```

### Background Tasks

**Pattern**: [FastAPI BackgroundTasks or similar]

**Examples** from `[file:line]`:

```python
from fastapi import BackgroundTasks

async def handler(background_tasks: BackgroundTasks):
    background_tasks.add_task(
        log_event,
        event_id=uuid4(),
        data={"key": "value"}
    )
    return {"status": "success"}
```

## Error Handling & Exceptions

### Exception Hierarchy

**Standard exceptions**: [Document project exception classes]

**Examples** from `[file:line]`:

```python
# Project exception hierarchy
class ServiceException(Exception):
    def __init__(self, message: str, context: dict | None = None):
        self.message = message
        self.context = context or {}

class ValidationException(ServiceException):
    pass

class ExternalServiceException(ServiceException):
    pass
```

### When to Raise vs Catch

**Raise exceptions for**:

- Invalid input
- Unrecoverable errors
- Contract violations
- Unexpected states

**Catch exceptions for**:

- External service failures (with graceful degradation)
- Expected error conditions
- Cleanup operations

**Examples** from `[file:line]`:

```python
# Good - raise for invalid input
def validate_agent(agent: Agent) -> None:
    if agent.zuid <= 0:
        raise ValidationException(
            "Invalid ZUID",
            context={"zuid": agent.zuid}
        )

# Good - catch for graceful degradation
async def get_agent_with_fallback(zuid: int) -> Agent | None:
    try:
        return await external_service.get_agent(zuid)
    except ExternalServiceException:
        logger.warning("Service unavailable, using fallback")
        return get_cached_agent(zuid)
```

### Error Logging

**Pattern**: [Structured logging with context]

**Examples** from `[file:line]`:

```python
# Good - structured logging
logger.error(
    "Failed to process agent",
    extra={
        "agent_zuid": agent.zuid,
        "error": str(e),
        "context": error_context
    }
)

# Avoid
logger.error(f"Error: {e}")  # No context
```

### Error Context & Traceability

**Pattern**: [Include trace IDs, correlation IDs]

**Examples** from `[file:line]`:

```python
# Good - include traceability
raise ServiceException(
    "Agent not found",
    context={
        "agent_zuid": zuid,
        "connection_attempt_id": attempt_id,
        "trace_id": trace_id
    }
)
```

## Dependency Management

### Dependency Injection

**Pattern**: [FastAPI Depends or similar]

**Examples** from `[file:line]`:

```python
# Good - dependency injection
def db_session() -> Generator[Session, None, None]:
    with LocalSession() as session:
        yield session

async def handler(
    db: Annotated[Session, Depends(db_session)]
) -> dict:
    return {"status": "ok"}

# Avoid - direct imports
async def bad_handler():
    session = LocalSession()  # Don't create directly
```

### Import Organization

**Pattern**: [Grouping and ordering rules]

**Examples** from `[file:line]`:

```python
# Good - organized imports
# Standard library
import asyncio
from typing import Annotated

# Third-party
from fastapi import Depends, HTTPException
import httpx

# Local
from lib.models import Agent
from lib.storage import Session
```

### Circular Dependency Avoidance

**Strategies**:

- [Document strategies used in project]
- Use TYPE_CHECKING imports
- Move shared types to separate modules

**Examples** from `[file:line]`:

```python
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from lib.agents import AgentHandler

def process(handler: "AgentHandler") -> None:
    pass
```

## API Design Standards

### Request/Response Models

**Pattern**: [CamelAliasModel for API, BaseModel for internal]

**Examples** from `[file:line]`:

```python
# Good - API models with camelCase conversion
class AgentRequest(CamelAliasModel):
    agent_zuids: list[int]  # → agentZuids in JSON
    max_capacity: int  # → maxCapacity in JSON

class AgentResponse(CamelAliasModel):
    agent_data: list[AgentData]
    total_count: int
```

### Endpoint Naming

**Pattern**: [REST conventions]

**Examples** from `[file:line]`:

```python
# Good - RESTful endpoints
@router.post("/v1/agents")  # Create/query agents
@router.get("/v1/agents/{zuid}")  # Get specific agent
@router.put("/v1/agents/{zuid}")  # Update agent
@router.delete("/v1/agents/{zuid}")  # Delete agent
```

### HTTP Status Codes

**Standard usage**:

- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Examples** from `[file:line]`:

```python
from fastapi import HTTPException, status

if not agent:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Agent not found"
    )
```

### Header Propagation

**Required headers**:

- [Document required headers]
- `x-z-client-id`
- `x-z-connection-attempt-id`
- `x-z-trace-id`

**Examples** from `[file:line]`:

```python
# Good - propagate headers
async def handler(
    request: Request,
    client: httpx.AsyncClient
):
    headers = {
        "x-z-client-id": request.headers.get("x-z-client-id"),
        "x-z-trace-id": request.headers.get("x-z-trace-id")
    }
    response = await client.get(url, headers=headers)
```

## Database Patterns

### Session Management

**Pattern**: [Context managers with automatic rollback]

**Examples** from `[file:line]`:

```python
# Good - context manager
with session:
    agent = session.execute(
        select(Agent).where(Agent.zuid == zuid)
    ).scalar_one()
    session.add(agent)
    session.commit()

# Avoid - manual session handling
session = LocalSession()
try:
    agent = session.query(Agent).filter_by(zuid=zuid).first()
    session.add(agent)
    session.commit()
finally:
    session.close()
```

### Query Patterns

**Pattern**: [SQLAlchemy 2.0 style]

**Examples** from `[file:line]`:

```python
# Good - SQLAlchemy 2.0 select
from sqlalchemy import select

result = session.execute(
    select(Agent).where(Agent.zuid == zuid)
).scalar_one_or_none()

# Avoid - legacy query API
result = session.query(Agent).filter_by(zuid=zuid).first()
```

### Transaction Boundaries

**Pattern**: [Document transaction patterns]

**Examples** from `[file:line]`:

```python
# Good - explicit transaction
with session:
    agent = session.get(Agent, zuid)
    agent.capacity += 10
    session.add(ConnectionAttempt(...))
    session.commit()  # Atomic transaction
```

### Base Model Patterns

**Pattern**: [Shared base class with common methods]

**Examples** from `[file:line]`:

```python
class Base:
    @classmethod
    def select_by_id(cls, id: int, session: Session) -> Self | None:
        return session.execute(
            select(cls).where(cls.id == id)
        ).scalar_one_or_none()

    @classmethod
    def add_all(cls, entities: list[Self], session: Session) -> None:
        session.add_all(entities)
        session.commit()
```

## Observability Standards

### Logging Patterns

**Logger configuration**: [Document logger setup]

**Pattern**: [Structured logging]

**Examples** from `[file:line]`:

```python
import logging

logger = logging.getLogger(__name__)

# Good - structured logging
logger.info(
    "Agent processed",
    extra={
        "agent_zuid": agent.zuid,
        "cohort_id": cohort_id,
        "duration_ms": duration
    }
)

# Avoid
logger.info(f"Processed agent {agent.zuid}")  # Unstructured
```

### Tracing Decorators

**Pattern**: [Datadog tracer or similar]

**Examples** from `[file:line]`:

```python
from ddtrace import tracer

@tracer.wrap()
async def get_agent_data(zuid: int) -> AgentData:
    # Automatically traced
    return await fetch_data(zuid)
```

### Metrics Collection

**Pattern**: [Prometheus or similar]

**Examples** from `[file:line]`:

```python
from prometheus_client import Counter, Histogram

request_counter = Counter(
    "requests_total",
    "Total requests",
    ["endpoint", "status"]
)

@time(duration_histogram)
async def handler():
    request_counter.labels(endpoint="/agents", status="200").inc()
```

### Structured Logging Format

**Format**: [JSON or key-value]

**Fields**: [Standard fields used]

**Example output**:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "Agent processed",
  "agent_zuid": 12345,
  "trace_id": "abc123",
  "context": {}
}
```

## Security & Best Practices

### Authentication Patterns

**Pattern**: [Document auth mechanism]

**Examples** from `[file:line]`:

```python
# Good - auth dependency
async def verify_token(
    authorization: str = Header(...)
) -> User:
    token = authorization.replace("Bearer ", "")
    return await validate_token(token)

@router.get("/protected")
async def protected_route(
    user: User = Depends(verify_token)
):
    return {"user": user.id}
```

### Input Validation

**Pattern**: [Pydantic validation]

**Examples** from `[file:line]`:

```python
# Good - Pydantic validation
class AgentRequest(CamelAliasModel):
    agent_zuids: list[int] = Field(..., min_items=1, max_items=100)
    max_capacity: int = Field(..., gt=0, le=1000)

    @field_validator("agent_zuids")
    def validate_zuids(cls, v):
        if any(zuid <= 0 for zuid in v):
            raise ValueError("ZUIDs must be positive")
        return v
```

### Sensitive Data Handling

**Rules**:

- Never log sensitive data (passwords, tokens, PII)
- Redact sensitive fields in error messages
- Use environment variables for secrets

**Examples** from `[file:line]`:

```python
# Good - redact sensitive data
logger.info(
    "API call failed",
    extra={
        "api_key": "***REDACTED***",
        "endpoint": url
    }
)

# Avoid
logger.info(f"API key: {api_key}")  # Exposes secret
```

### SQL Injection Prevention

**Pattern**: [Parameterized queries only]

**Examples** from `[file:line]`:

```python
# Good - parameterized
result = session.execute(
    select(Agent).where(Agent.zuid == zuid)
)

# NEVER - string concatenation
query = f"SELECT * FROM agents WHERE zuid = {zuid}"  # SQL injection!
```

## Documentation Standards

### Docstring Requirements

**Pattern**: [Google/NumPy style docstrings]

**Required for**:

- All public functions/methods
- All classes
- Complex algorithms
- Non-obvious behavior

**Examples** from `[file:line]`:

```python
def calculate_agent_score(
    agent: Agent,
    metrics: PerformanceMetrics
) -> float:
    """Calculate agent ranking score using PaceCarV3 algorithm.

    Args:
        agent: Agent entity with capacity and status
        metrics: Performance metrics including success rate and volume

    Returns:
        Normalized score between 0.0 and 1.0

    Raises:
        ValidationException: If agent is invalid or metrics are incomplete
    """
    pass
```

### Comment Guidelines

**When to comment**:

- Business logic explanation
- Non-obvious algorithms
- Workarounds or temporary fixes
- Complex data transformations

**When NOT to comment**:

- Self-explanatory code
- Redundant descriptions
- Commented-out code (delete instead)

**Examples** from `[file:line]`:

```python
# Good - explains WHY
# Team leads get 10% capacity boost per AL-1234 business rule
if agent.is_team_lead:
    capacity *= 1.10

# Avoid - explains WHAT (code is already clear)
# Add 1 to counter
counter += 1
```

### Type Documentation

**Pattern**: [Type hints are documentation]

**Examples** from `[file:line]`:

```python
# Good - types document contract
def process_agents(
    zuids: list[int],
    session: Session,
    max_results: int = 100
) -> list[Agent]:
    """Process agent list and return filtered results."""
    pass
```

## Code Organization

### Module Structure

**Standard structure**:

```
project/
├── lib/
│   ├── agents/          # Agent-related logic
│   ├── teams/           # Team-related logic
│   ├── models/          # Data models
│   ├── storage/         # Database layer
│   ├── api_clients/     # External API clients
│   └── utils/           # Shared utilities
├── routers/
│   └── v1/              # Versioned API routes
└── tests/               # Mirrors lib/ structure
```

### File Organization

**Pattern**: [One primary class/concept per file]

**Examples**:

- `agent_eligibility_handler.py` contains `AgentEligibilityHandler`
- `pacecar_v3_ranking.py` contains `PaceCarV3Ranking`

### Responsibility Boundaries

**Separation of concerns**:

- **Routers**: HTTP handling, validation, response formatting
- **Handlers**: Business logic orchestration
- **Models**: Data representation and persistence
- **Clients**: External service communication
- **Utils**: Shared helper functions

**Examples** from `[file:line]`:

```python
# Router - HTTP layer
@router.post("/v1/agents")
async def get_agents(request: AgentRequest) -> AgentResponse:
    result = await handler.process(request)
    return AgentResponse(**result)

# Handler - business logic
class AgentHandler:
    async def process(self, request: AgentRequest) -> dict:
        agents = await self.repository.find(request.zuids)
        return self.rank_agents(agents)
```

### Feature Flags

**Pattern**: [Config-based feature flags]

**Examples** from `[file:line]`:

```python
from config import CONFIG

# Good - feature flag check
if CONFIG.NEW_RANKING_ENABLED:
    agents = await new_ranking_algorithm(agents)
else:
    agents = await legacy_ranking(agents)
```

## Common Patterns & Anti-Patterns

### Approved Design Patterns

**Dependency Injection**:

- Use FastAPI `Depends()` for services and database sessions
- Reference: `[file:line]`

**Strategy Pattern**:

- Used for ranking algorithms, cohort strategies
- Reference: `[file:line]`

**Repository Pattern**:

- Database access abstraction
- Reference: `[file:line]`

**Decorator Pattern**:

- Used for tracing, timing, retries
- Reference: `[file:line]`

### Anti-Patterns to Avoid

**❌ Direct Database Session Creation**:

```python
# BAD
session = LocalSession()
# Use dependency injection instead
```

**❌ Synchronous I/O in Async Code**:

```python
# BAD
async def fetch():
    return requests.get(url)  # Blocking!
# Use httpx.AsyncClient instead
```

**❌ Mutable Default Arguments**:

```python
# BAD
def process(items=[]):  # Shared mutable default!
    items.append(1)

# GOOD
def process(items: list | None = None):
    items = items or []
    items.append(1)
```

**❌ Bare Exceptions**:

```python
# BAD
try:
    process()
except:  # Catches everything including KeyboardInterrupt!
    pass

# GOOD
except Exception as e:
    logger.error(f"Process failed: {e}")
    raise
```

### Refactoring Guidelines

**When to refactor**:

- Functions exceed [X] lines
- Classes have more than [X] public methods
- Cyclomatic complexity exceeds [X]
- Code is duplicated in 3+ places

**How to refactor safely**:

1. Write tests if they don't exist
2. Make small, incremental changes
3. Run tests after each change
4. Use type checker to catch issues

## Examples & References

### Exemplary Code Files

The following files demonstrate excellent adherence to coding standards:

- `[file:line]` - Example of clean async handler
- `[file:line]` - Example of proper type annotations
- `[file:line]` - Example of good error handling
- `[file:line]` - Example of well-structured tests

### Common Scenarios

**Scenario 1: Creating a new API endpoint**

1. Define Pydantic models (`CamelAliasModel`)
2. Create handler with business logic
3. Add router endpoint with dependency injection
4. Add background task for logging
5. Write unit tests
6. Reference: `[file:line]`

**Scenario 2: Adding external API client**

1. Create client class in `lib/api_clients/`
2. Add `@tracer.wrap()` decorator
3. Use `httpx.AsyncClient` for requests
4. Handle errors with graceful degradation
5. Add retry logic if needed
6. Reference: `[file:line]`

**Scenario 3: Database model**

1. Inherit from `Base`
2. Add type annotations for all columns
3. Add relationships if needed
4. Implement `__repr__` for debugging
5. Reference: `[file:line]`

## Related Documentation

**Project Guidelines**: See `CLAUDE.md` for project-specific constraints and
patterns

**Architecture**: See `.alfred/docs/architecture.md` for system structure

**Testing Standards**: See `.alfred/docs/testing-standards.md` for comprehensive
testing guidelines

**API Documentation**: See `.alfred/docs/api.md` for API contracts and
integration patterns

Fill in each section with appropriate content based on actual codebase patterns.
Include file:line references throughout pointing to exemplary code. The output
will be directly written to a file without any processing. This file should
serve as the definitive coding standards guide for all developers. </template>

**CRITICAL**: Always depend on the current codebase, never read existing
documentation and assume it's correct. If the same file already exists, your
task would be to update that and bring it up to the current codebase.
