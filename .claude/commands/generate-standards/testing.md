---
description:
  Document comprehensive testing standards and guidelines including test design,
  coverage requirements, mocking strategies, and quality criteria
model: sonnet
---

# Testing Standards

You are an expert test engineer specializing in test design, quality assurance,
and testing best practices. Focus on discovering and documenting the actual
testing standards, patterns, and quality criteria used in this codebase by
analyzing real test examples.

Task: Produce comprehensive testing standards documentation that captures the
established testing practices and guidelines, helping developers write
effective, maintainable tests.

- Identify actual testing patterns used in the codebase (don't invent standards)
- Document test design principles, coverage requirements, and quality criteria
- Extract mocking strategies, assertion patterns, and fixture usage
- Find exemplary tests that demonstrate best practices
- Provide file:line references to real test examples throughout
- Focus on WHAT MAKES A GOOD TEST rather than just how to run tests
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
   - Identify testing framework and tools

2. **Initial exploration** (activeForm: "Performing initial exploration")
   - Review test directory structure
   - Identify testing frameworks (pytest, jest, etc.)
   - Locate test configuration files
   - Review existing test examples
   - Check `.alfred/docs/testing.md` for infrastructure context

3. **Testing Philosophy & Principles section** (activeForm: "Writing Testing
   Philosophy section")
   - Reference Output Instructions template section "Testing Philosophy &
     Principles"
   - Document testing mindset and guiding principles
   - Extract principles from actual test patterns
   - Keep project-specific and concrete

4. **Test Design Standards section** (activeForm: "Writing Test Design Standards
   section")
   - Reference Output Instructions template section "Test Design Standards"
   - Document test structure patterns (Arrange-Act-Assert)
   - Show test naming conventions
   - Include test size and scope guidelines

5. **Coverage Requirements section** (activeForm: "Writing Coverage Requirements
   section")
   - Reference Output Instructions template section "Coverage Requirements &
     Metrics"
   - Document minimum coverage percentages
   - Show what requires testing vs what doesn't
   - Include CI/CD enforcement rules

6. **Unit Testing Standards section** (activeForm: "Writing Unit Testing
   Standards section")
   - Reference Output Instructions template section "Unit Testing Standards"
   - Document isolation requirements
   - Show mocking boundaries
   - Include assertion guidelines

7. **Integration Testing Standards section** (activeForm: "Writing Integration
   Testing Standards section")
   - Reference Output Instructions template section "Integration Testing
     Standards"
   - Document when integration tests are needed
   - Show end-to-end test patterns
   - Include environment requirements

8. **Mocking & Test Doubles section** (activeForm: "Writing Mocking & Test
   Doubles section")
   - Reference Output Instructions template section "Mocking & Test Doubles"
   - Document what to mock vs what not to mock
   - Show mocking strategies and tools
   - Include verification patterns

9. **Fixture & Test Data section** (activeForm: "Writing Fixture & Test Data
   section")
   - Reference Output Instructions template section "Fixture & Test Data
     Management"
   - Document fixture design principles
   - Show test data creation patterns
   - Include factory patterns if used

10. **Assertion Best Practices section** (activeForm: "Writing Assertion Best
    Practices section")
    - Reference Output Instructions template section "Assertion Best Practices"
    - Document assertion patterns
    - Show error message conventions
    - Include assertion libraries used

11. **Async Testing Standards section** (activeForm: "Writing Async Testing
    Standards section")
    - Reference Output Instructions template section "Async Testing Standards"
    - Document async test patterns
    - Show timeout and timing handling
    - Include common pitfalls

12. **Test Maintenance section** (activeForm: "Writing Test Maintenance
    section")
    - Reference Output Instructions template section "Test Maintenance &
      Refactoring"
    - Document when to update tests
    - Show refactoring guidelines
    - Include anti-patterns to avoid

13. **Test Quality Checklist section** (activeForm: "Writing Test Quality
    Checklist section")
    - Reference Output Instructions template section "Test Quality Checklist"
    - Create checklist for good tests
    - Document code review criteria
    - Include common issues to check

14. **Verification checkpoint** (activeForm: "Verifying document completeness")
    - Verify all sections present in correct order
    - Verify each section has substantive content (not placeholders or TODO
      markers)
    - Verify file:line references included throughout
    - Verify examples are from actual test code
    - Verify document starts with `# Testing Standards` heading only
    - Verify NO conversational preamble, explanations, or meta-commentary exists
    - Verify markdown formatting is clean and consistent
    - If ANY verification fails: DO NOT proceed, fix issues first

15. **Write final output** (activeForm: "Writing final output file")
    - Use Write tool to create `.alfred/docs/testing-standards.md`
    - Content must be PURE MARKDOWN starting with `# Testing Standards`
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

Analyze the provided path and scope the analysis to testing standards for that
specific area.

**If no path is provided:**

<message>
I'll analyze the entire project to document testing standards. If you want to focus on specific test areas, you can provide a path:

Examples:

- `/document:testing-standards tests/lib/agents` - Analyze agent test standards
- `/document:testing-standards tests/integration_tests` - Analyze integration
  test standards

Proceeding with full project analysis... </message>

## Analysis Task

<procedure>
Examine the project (or the specific path provided) to discover and document established testing standards and quality guidelines.

Create a comprehensive guide that helps developers understand WHAT MAKES A GOOD
TEST, HOW to design effective tests, and WHAT quality criteria tests must meet.

**If a specific path was provided:** Focus analysis on that path only.

**If analyzing the entire project:** Focus on:

**Testing Philosophy:**

- What is the testing mindset?
- What principles guide test design?
- What makes a test valuable vs brittle?
- When should tests be written?

**Test Design:**

- How should tests be structured?
- What naming conventions are used?
- How granular should tests be?
- What's the right balance between coverage and maintainability?

**Coverage Standards:**

- What are minimum coverage requirements?
- What must be tested?
- What can be skipped?
- How is coverage enforced?

**Unit Test Guidelines:**

- What makes a good unit test?
- What should be mocked?
- What should NOT be mocked?
- How isolated should tests be?

**Integration Test Guidelines:**

- When are integration tests needed?
- What's the scope of integration tests?
- How are external dependencies handled?
- What's the performance budget?

**Mocking Strategies:**

- What mocking libraries are used?
- When to use mocks vs stubs vs fakes?
- How to verify mock interactions?
- What are mocking anti-patterns?

**Test Data Management:**

- How are fixtures designed?
- When to use factories vs fixtures?
- How is test data organized?
- What are test data best practices?

**Assertion Patterns:**

- What assertion libraries are used?
- How specific should assertions be?
- How to write clear error messages?
- What are assertion best practices?

**Async Testing:**

- How are async tests written?
- How are timeouts handled?
- What are async testing pitfalls?
- How is concurrency tested?

**Test Maintenance:**

- When should tests be updated?
- How to refactor tests safely?
- What makes tests brittle?
- How to keep tests maintainable?

**Important Notes:**

- Focus on EXISTING testing standards, not aspirational ones
- Include file:line references to exemplary tests throughout
- Provide test code snippets from actual codebase
- Document both DO's and DON'Ts with examples
- Reference `.alfred/docs/testing.md` for infrastructure context
- Reference `CLAUDE.md` for project-specific testing constraints

Be sure that you are describing existing testing standards actually practiced in
the codebase, not theoretical best practices. </procedure>

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

**CRITICAL**: Write your analysis to `.alfred/docs/testing-standards.md` using
the Write tool.

Your output must be PURE MARKDOWN starting immediately with the heading. Do NOT
include any conversational preamble, explanations about the task, or
meta-commentary. The output will be written directly to a file.

<template>
The markdown must follow this EXACT structure:

```markdown
# Testing Standards

## Testing Philosophy & Principles

Brief overview (2-3 paragraphs) of the testing philosophy:

Example: Connection Pacing treats tests as first-class code that must be
maintained with the same rigor as production code. Tests verify behavior, not
implementation details. We write tests to gain confidence in our code, not to
hit arbitrary coverage metrics. Tests should be fast, focused, and reliable.

Key principles:

- **Behavior over implementation**: Test what the code does, not how it does it
- **Fast feedback**: Tests should run in seconds, not minutes
- **Isolation**: Tests should not depend on each other or external state
- **Clarity**: Test names and assertions should clearly communicate intent
- **Maintainability**: Tests should be easy to update when requirements change

### Test-Driven Development (TDD)

[Document whether TDD is practiced, encouraged, optional]

### Testing Pyramid

[Document the testing pyramid followed - ratio of unit:integration:e2e tests]
```

     /\
    /E2E\        [X]% - Slow, expensive, high-level

/------\
 / INT \ [X]% - Medium speed, API-level /----------\
/ UNIT \ [X]% - Fast, focused, isolation

---

````

## Test Design Standards

### Test Structure (Arrange-Act-Assert)

**Pattern**: All tests follow AAA pattern

**Structure**:
```python
def test_behavior_when_condition():
    """Clear description of what is being tested"""
    # Arrange: Set up test data, mocks, and preconditions
    input_data = create_test_data()
    mock_service = setup_mock()

    # Act: Execute the behavior under test
    result = function_under_test(input_data, mock_service)

    # Assert: Verify expected outcomes
    assert result.status == "success"
    assert mock_service.called
````

**Examples** from `[file:line]`:

```python
# Good - clear AAA structure
def test_returns_eligible_agents_when_capacity_available():
    # Arrange
    agents = [Agent(zuid=123, capacity=10, used_capacity=5)]
    request = EligibilityRequest(agent_zuids=[123])

    # Act
    result = handler.filter_by_capacity(agents, request)

    # Assert
    assert len(result) == 1
    assert result[0].zuid == 123
```

### Test Naming Conventions

**Pattern**: `test_[behavior]_when_[condition]` or
`test_[behavior]_[expected_result]`

**Good examples** from `[file:line]`:

```python
test_returns_agents_when_eligible()
test_raises_validation_error_when_invalid_zuid()
test_filters_agents_by_capacity()
test_returns_empty_list_when_no_matches()
test_logs_error_when_service_fails()
```

**Avoid**:

```python
test_agents()  # Too vague
test_1()  # Meaningless
test_agent_eligibility_handler_returns_agents()  # Too verbose
```

### Test Size & Scope

**Unit tests**:

- Test ONE behavior/method
- Use mocks for external dependencies
- Should complete in milliseconds
- Maximum [X] lines of code

**Integration tests**:

- Test component interactions
- May use real services (or Docker)
- Should complete in seconds
- Maximum [X] lines of code

**E2E tests**:

- Test complete workflows
- Minimal mocking
- Should complete in seconds to minutes
- Focus on critical user journeys

### One Assertion Focus

**Principle**: Each test should verify ONE logical concept (may have multiple
assertion statements)

**Good** - from `[file:line]`:

```python
def test_creates_cohort_with_correct_structure():
    cohort = create_cohort([agent1, agent2])

    # Multiple assertions for one concept: cohort structure
    assert cohort.agent_count == 2
    assert cohort.agents[0].zuid == agent1.zuid
    assert cohort.strategy == "daisy_chain"
```

**Avoid**:

```python
def test_agent_processing():
    # Testing multiple unrelated concepts
    assert validate_agent(agent) is True  # Validation
    assert fetch_agent(123) == agent  # Fetching
    assert save_agent(agent) is None  # Persistence
    # Split into 3 separate tests!
```

## Coverage Requirements & Metrics

### Minimum Coverage

**Overall coverage**: [X]% minimum (enforced in CI/CD)

**Business logic**: [X]% minimum (lib/agents, lib/teams, etc.)

**New code**: [X]% minimum for new PRs

**Critical paths**: 100% coverage required for:

- Agent ranking algorithms
- Capacity calculations
- Financial transaction logic
- [Other critical areas]

### What Must Be Tested

**Required**:

- ✅ Business logic functions
- ✅ API endpoint handlers
- ✅ Data transformations
- ✅ Validation rules
- ✅ Error handling paths
- ✅ Algorithm implementations
- ✅ Database operations (with mocks)

### What Can Be Skipped

**Optional or excluded**:

- ❌ Generated code (migrations, schema)
- ❌ Third-party library code
- ❌ Simple getters/setters
- ❌ Configuration files
- ❌ Framework boilerplate

### Coverage Enforcement

**CI/CD checks**:

- Coverage report generated on every PR
- Build fails if coverage drops below [X]%
- Coverage badge in README
- [Tool used]: `pytest --cov` or similar

**Local development**:

```bash
# Generate coverage report
[command to run with coverage]

# View HTML report
[command to view report]
```

## Unit Testing Standards

### Isolation Requirements

**Principle**: Unit tests test ONE unit in isolation from external dependencies

**Must be mocked**:

- External APIs and HTTP calls
- Database sessions and queries
- File system operations
- Time/date functions
- AWS services (S3, SQS, etc.)
- Background tasks

**Should NOT be mocked**:

- Internal business logic
- Domain models (Pydantic, dataclasses)
- Pure functions
- Data transformations
- Validation rules

**Examples** from `[file:line]`:

```python
# Good - mock external API
@pytest.fixture
def mock_agent_api(respx_mock):
    return respx_mock.get("https://api.example.com/agents").mock(
        return_value=httpx.Response(200, json={"data": []})
    )

async def test_fetches_agents(mock_agent_api):
    result = await client.get_agents([123])
    assert mock_agent_api.called

# Good - don't mock internal logic
def test_calculates_score():
    # Don't mock calculate_score - test it directly
    score = calculate_score(metrics)
    assert score == 95.5
```

### Fast Execution

**Performance budget**:

- Individual test: < [X] ms
- Full unit test suite: < [X] seconds
- No actual network calls
- No actual database queries
- No sleep() calls

**Strategies**:

```python
# Good - mock time
@pytest.fixture(autouse=True)
def mock_sleep(mocker):
    mocker.patch("time.sleep")
    mocker.patch("asyncio.sleep")

# Good - mock slow operations
@pytest.fixture
def mock_slow_api(respx_mock):
    return respx_mock.get(url).mock(
        return_value=httpx.Response(200, json={})
    )  # Instant response
```

### Deterministic Tests

**Principle**: Tests should produce same result every time

**Avoid**:

- ❌ Random data without seeding
- ❌ System time without mocking
- ❌ Network-dependent tests
- ❌ Shared global state
- ❌ Test execution order dependencies

**Good patterns** from `[file:line]`:

```python
# Good - deterministic random
@pytest.fixture
def seeded_random():
    random.seed(42)
    return random

# Good - fixed time
@pytest.fixture
def fixed_time():
    with freeze_time("2024-01-15 10:00:00"):
        yield
```

## Integration Testing Standards

### When Integration Tests Are Needed

**Use integration tests for**:

- Database persistence and queries
- External API integration
- Multi-service workflows
- End-to-end request/response cycles
- Performance-sensitive operations

**Examples** from `[file:line]`:

```python
# Integration test - tests actual database
@pytest.mark.integration
async def test_saves_and_retrieves_agent(db_session):
    agent = Agent(zuid=123, name="Test")
    repository.save(agent, session=db_session)

    retrieved = repository.get(123, session=db_session)
    assert retrieved.name == "Test"
```

### Integration Test Scope

**Scope guidelines**:

- Test realistic workflows
- Use actual database (or Docker container)
- May use actual external services (dev/stage environments)
- Minimize mocking (mock only unreliable services)

### Environment Requirements

**Setup**:

- Tests run against [dev/stage/local Docker]
- Database is [seeded/cleared] before each test
- External services must be [available/mocked]
- Configuration via environment variables

**Example setup** from `[file:line]`:

```python
@pytest.fixture(scope="session")
def integration_db():
    """Set up integration test database"""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
```

### Performance Budget

**Integration test limits**:

- Individual test: < [X] seconds
- Full integration suite: < [X] minutes
- Tests should clean up after themselves
- Parallel execution supported

## Mocking & Test Doubles

### Mocking Strategy

**Principle**: Mock at the boundaries, not internals

**Mock external boundaries**:

- HTTP APIs (using respx, requests-mock, httpretty)
- Database sessions (using MagicMock or in-memory SQLite)
- AWS services (using moto)
- File system (using tmp_path fixture)
- Time/date (using freezegun)

**Don't mock internal code**:

- Business logic functions
- Domain models
- Calculations
- Validators

**Decision tree**:

```
Is it an external dependency (I/O, network, filesystem)?
├─ YES → Mock it
└─ NO → Is it internal business logic?
    ├─ YES → Don't mock, test directly
    └─ NO → Consider if test is testing the right thing
```

### Mocking Libraries & Patterns

**HTTP Mocking** - using `[respx/requests-mock/etc]`:

**Examples** from `[file:line]`:

```python
# Good - HTTP mock
@pytest.fixture
def mock_agent_service(respx_mock: respx.Router):
    return respx_mock.get("https://api.example.com/agents/123").mock(
        return_value=httpx.Response(
            status_code=200,
            json={"zuid": 123, "name": "Agent"}
        )
    )

async def test_fetches_agent_data(mock_agent_service):
    result = await client.get_agent(123)

    assert result.zuid == 123
    assert mock_agent_service.called
    assert mock_agent_service.call_count == 1
```

**Database Mocking** - using `[MagicMock/in-memory DB]`:

**Examples** from `[file:line]`:

```python
# Option 1: Mock session
@pytest.fixture
def mock_db_session(mocker):
    session = mocker.MagicMock(spec=Session)
    return session

# Option 2: In-memory SQLite
@pytest.fixture
def sqlite_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)()
```

**AWS Mocking** - using `[moto]`:

**Examples** from `[file:line]`:

```python
@pytest.fixture
def mock_s3():
    with mock_s3():
        yield boto3.client("s3")

def test_uploads_to_s3(mock_s3):
    mock_s3.create_bucket(Bucket="test-bucket")
    upload_file("test.txt", "test-bucket")
    # Verify upload
```

### Mock Verification

**Verification patterns**:

**Examples** from `[file:line]`:

```python
# Verify mock was called
assert mock_service.called
assert mock_service.call_count == 1

# Verify with specific arguments
mock_service.assert_called_once_with(
    agent_zuid=123,
    timeout=30
)

# Verify headers passed
request = mock_api.calls[0].request
assert request.headers["x-z-client-id"] == "test-client"
```

### Mocking Anti-Patterns

**❌ Over-mocking**:

```python
# BAD - mocking internal logic
mock_calculate_score = mocker.patch("lib.ranking.calculate_score")
mock_calculate_score.return_value = 95.0
# You're not testing anything real!
```

**❌ Mocking the system under test**:

```python
# BAD - mocking what you're testing
def test_agent_handler(mocker):
    mock_handler = mocker.patch("lib.agents.AgentHandler")
    # You should be testing AgentHandler, not mocking it!
```

**❌ Incomplete mocks**:

```python
# BAD - mock doesn't match real API
mock_api.return_value = {"data": None}  # Real API never returns None
# Use realistic mock data
```

## Fixture & Test Data Management

### Fixture Design Principles

**Principles**:

- Fixtures should be reusable
- Fixtures should be minimal (only what's needed)
- Fixtures should have clear names
- Fixtures should be scoped appropriately

**Fixture scopes**:

- `function` (default): New instance per test
- `class`: Shared within test class
- `module`: Shared within module
- `session`: Shared across all tests

**Examples** from `[file:line]`:

```python
# Good - reusable agent fixture
@pytest.fixture
def sample_agent() -> Agent:
    return Agent(
        zuid=12345,
        name="Test Agent",
        capacity=10,
        used_capacity=0
    )

# Good - session-scoped expensive fixture
@pytest.fixture(scope="session")
def app_client():
    return TestClient(app)
```

### Test Data Creation Patterns

**Option 1: Direct instantiation**

```python
def test_agent_processing():
    agent = Agent(zuid=123, name="Test")
    # Simple, explicit
```

**Option 2: Fixtures**

```python
@pytest.fixture
def agent():
    return Agent(zuid=123, name="Test")

def test_agent_processing(agent):
    # Reusable across tests
```

**Option 3: Factory fixtures**

```python
@pytest.fixture
def agent_factory():
    def _create_agent(zuid=123, **kwargs):
        return Agent(zuid=zuid, **kwargs)
    return _create_agent

def test_multiple_agents(agent_factory):
    agent1 = agent_factory(zuid=123)
    agent2 = agent_factory(zuid=456, capacity=20)
    # Flexible, customizable
```

### Test Data Best Practices

**DO**:

- ✅ Use realistic test data
- ✅ Keep test data minimal
- ✅ Make test data obvious (clear values like 123, 999)
- ✅ Use factories for complex objects
- ✅ Share fixtures in conftest.py

**DON'T**:

- ❌ Use production data in tests
- ❌ Use random data without seeding
- ❌ Create massive fixtures with unused fields
- ❌ Hard-code test data in multiple places

**Examples** from `[file:line]`:

```python
# Good - clear, minimal test data
agent = Agent(zuid=12345, capacity=10)

# Good - realistic but not actual production data
email = "test@example.com"  # Not real user email

# Avoid - unclear test data
agent = Agent(zuid=1, capacity=1)  # Too generic

# Avoid - production-like data
email = "john.smith@company.com"  # Looks like real user
```

### Conftest Organization

**Structure**:

```python
# tests/conftest.py - Global fixtures
@pytest.fixture(scope="session")
def app():
    return TestClient(app)

# tests/lib/agents/conftest.py - Module-specific fixtures
@pytest.fixture
def sample_agent():
    return Agent(zuid=123)
```

## Assertion Best Practices

### Assertion Patterns

**Prefer specific assertions**:

**Examples** from `[file:line]`:

```python
# Good - specific assertions
assert result.status == "success"
assert len(agents) == 3
assert agent.zuid in [123, 456, 789]

# Avoid - vague assertions
assert result  # What are we checking?
assert agents  # Empty list is falsy
```

### Error Messages

**Include context in assertions**:

**Examples** from `[file:line]`:

```python
# Good - helpful error message
assert result.status == "success", \
    f"Expected success but got {result.status} with error: {result.error}"

# Good - descriptive failure
assert len(agents) > 0, \
    f"Expected agents but got empty list. Request: {request}"

# Avoid - no context
assert result.status == "success"  # Why did it fail?
```

### Assertion Libraries

**Available libraries**: [pytest assertions, assertpy, hamcrest, etc.]

**Examples** from `[file:line]`:

```python
# Pytest built-in assertions
assert value == expected
assert value is not None
assert value in collection
assert "substring" in text

# Pytest raises
with pytest.raises(ValueError) as exc_info:
    function_that_should_raise()
assert "invalid" in str(exc_info.value)

# Pytest approx (for floats)
assert result == pytest.approx(95.5, abs=0.1)
```

### Multiple Assertions

**When multiple assertions are OK**:

```python
# Good - multiple assertions for one concept
def test_cohort_structure():
    cohort = create_cohort([agent1, agent2])

    # All assertions verify cohort structure
    assert cohort.size == 2
    assert cohort.agents[0] == agent1
    assert cohort.strategy == "daisy_chain"
```

**When to split tests**:

```python
# Bad - testing multiple behaviors
def test_agent_operations():
    assert validate_agent(agent)  # Split to test_validates_agent
    assert save_agent(agent)      # Split to test_saves_agent
    assert load_agent(123)        # Split to test_loads_agent
```

## Async Testing Standards

### Async Test Patterns

**Framework**: [pytest-asyncio, pytest-trio, etc.]

**Configuration**: `pytest.ini` with `asyncio_mode = auto`

**Examples** from `[file:line]`:

```python
# Good - async test
@pytest.mark.asyncio
async def test_async_operation():
    result = await async_function()
    assert result is not None

# Good - testing async with fixtures
@pytest.fixture
async def async_client():
    async with httpx.AsyncClient() as client:
        yield client

@pytest.mark.asyncio
async def test_with_async_fixture(async_client):
    response = await async_client.get("https://api.example.com")
    assert response.status_code == 200
```

### Timeout Handling

**Pattern**: Set explicit timeouts for async tests

**Examples** from `[file:line]`:

```python
# Good - explicit timeout
@pytest.mark.asyncio
@pytest.mark.timeout(5)  # 5 second timeout
async def test_operation_completes_quickly():
    result = await slow_operation()
    assert result

# Good - mock slow operations
@pytest.mark.asyncio
async def test_no_timeout_needed(mocker):
    mocker.patch("asyncio.sleep")  # Mock slow parts
    result = await operation_with_sleep()
    assert result
```

### Testing Concurrent Operations

**Examples** from `[file:line]`:

```python
# Good - test concurrent operations
@pytest.mark.asyncio
async def test_concurrent_requests():
    tasks = [fetch_agent(zuid) for zuid in [123, 456, 789]]
    results = await asyncio.gather(*tasks)

    assert len(results) == 3
    assert all(r is not None for r in results)

# Good - test race conditions
@pytest.mark.asyncio
async def test_handles_concurrent_updates():
    async def update():
        agent = await get_agent(123)
        agent.capacity += 1
        await save_agent(agent)

    await asyncio.gather(update(), update())
    final_agent = await get_agent(123)
    # Verify correct concurrent handling
```

### Async Testing Pitfalls

**❌ Forgetting await**:

```python
# BAD
result = async_function()  # Returns coroutine, not result!

# GOOD
result = await async_function()
```

**❌ Mixing sync and async**:

```python
# BAD
def test_async_code():  # Should be async def
    result = await async_function()  # SyntaxError!

# GOOD
async def test_async_code():
    result = await async_function()
```

## Test Maintenance & Refactoring

### When to Update Tests

**Update tests when**:

- ✅ Behavior changes (new requirements)
- ✅ Bug is fixed (add regression test)
- ✅ API contracts change
- ✅ Test is flaky or brittle

**Don't update tests when**:

- ❌ Only refactoring implementation (tests should still pass)
- ❌ Renaming internal variables
- ❌ Performance optimization (unless behavior changes)

### Refactoring Tests

**Safe refactoring steps**:

1. Ensure tests are passing
2. Refactor one test at a time
3. Run tests after each change
4. Extract common patterns to fixtures
5. Simplify test data
6. Improve test names

**Examples** from `[file:line]`:

```python
# Before - duplicated setup
def test_eligible_agent():
    agent = Agent(zuid=123, capacity=10, used_capacity=0)
    assert is_eligible(agent)

def test_ineligible_agent():
    agent = Agent(zuid=123, capacity=10, used_capacity=0)
    # Duplicated setup!
    assert not is_eligible(agent)

# After - shared fixture
@pytest.fixture
def agent():
    return Agent(zuid=123, capacity=10, used_capacity=0)

def test_eligible_agent(agent):
    assert is_eligible(agent)

def test_ineligible_agent(agent):
    agent.used_capacity = 10
    assert not is_eligible(agent)
```

### Avoiding Brittle Tests

**Causes of brittle tests**:

- ❌ Testing implementation details
- ❌ Over-specified mocks
- ❌ Exact string matching
- ❌ Hardcoded dates/times
- ❌ Test execution order dependencies

**Solutions** from `[file:line]`:

```python
# Brittle - tests implementation
def test_uses_cache():
    handler._cache.get.assert_called_once()  # Internal detail!

# Robust - tests behavior
def test_returns_agent_quickly():
    start = time.time()
    result = handler.get_agent(123)
    assert result.zuid == 123
    assert time.time() - start < 0.1  # Fast = using cache

# Brittle - exact string match
assert error_message == "Agent not found with ZUID 123"

# Robust - semantic match
assert "Agent not found" in error_message
assert "123" in error_message
```

### Test Code Quality

**Tests should follow same standards as production code**:

- Clear naming
- Type annotations
- DRY principle (use fixtures)
- Comments for complex setup
- Proper error handling

**Examples** from `[file:line]`:

```python
# Good - clean test code
@pytest.fixture
def eligible_agents() -> list[Agent]:
    """Create list of agents eligible for assignment"""
    return [
        Agent(zuid=123, capacity=10, used_capacity=5),
        Agent(zuid=456, capacity=20, used_capacity=10),
    ]

def test_filters_eligible_agents(eligible_agents: list[Agent]) -> None:
    """Verify only agents with available capacity are returned"""
    result = filter_by_capacity(eligible_agents, min_capacity=3)

    assert len(result) == 2
    assert all(a.capacity - a.used_capacity >= 3 for a in result)
```

## Test Quality Checklist

Use this checklist during code reviews and when writing tests:

### Test Design

- [ ] Test has clear, descriptive name following
      `test_[behavior]_when_[condition]` pattern
- [ ] Test follows Arrange-Act-Assert structure
- [ ] Test verifies ONE logical concept
- [ ] Test is focused on behavior, not implementation
- [ ] Test name clearly indicates what is being tested

### Test Data & Setup

- [ ] Test data is minimal (only what's needed)
- [ ] Test data is realistic
- [ ] Fixtures are reusable and well-named
- [ ] Setup is clear and easy to understand
- [ ] No hard-coded production data

### Mocking

- [ ] Only external dependencies are mocked
- [ ] Mocks match real API behavior
- [ ] Mock calls are verified when relevant
- [ ] Internal business logic is NOT mocked
- [ ] Mocks are not over-specified

### Assertions

- [ ] Assertions are specific and meaningful
- [ ] Assertion error messages provide context
- [ ] No assertions on internal implementation details
- [ ] Assertions verify the right level of detail

### Isolation & Independence

- [ ] Test does not depend on other tests
- [ ] Test does not share state with other tests
- [ ] Test cleans up after itself
- [ ] Test is deterministic (same result every time)
- [ ] Test does not depend on execution order

### Performance

- [ ] Test executes quickly (< [X]ms for unit tests)
- [ ] No actual network calls in unit tests
- [ ] No actual database calls in unit tests (unless integration test)
- [ ] Time-dependent code is mocked

### Coverage

- [ ] Happy path is tested
- [ ] Error cases are tested
- [ ] Edge cases are covered
- [ ] Test contributes to coverage goals

### Maintainability

- [ ] Test code is as clean as production code
- [ ] Test is easy to understand
- [ ] Test will be easy to update when requirements change
- [ ] Common patterns are extracted to fixtures
- [ ] Test has docstring if complex

### Async (if applicable)

- [ ] Async functions are properly awaited
- [ ] Async tests use `@pytest.mark.asyncio`
- [ ] Timeouts are handled appropriately
- [ ] No mixing of sync and async incorrectly

## Common Anti-Patterns to Avoid

### Anti-Pattern: Testing Implementation Details

**Problem**: Test breaks when refactoring even though behavior is unchanged

**Example**:

```python
# BAD - tests implementation
def test_uses_internal_cache():
    handler._cache_get.assert_called()  # Private method!

# GOOD - tests behavior
def test_returns_agent_data_quickly():
    result = handler.get_agent(123)
    assert result.zuid == 123
    # Fast response implies caching, but doesn't test internals
```

### Anti-Pattern: Mocking Everything

**Problem**: Test doesn't verify real behavior

**Example**:

```python
# BAD - over-mocking
mock_validate = mocker.patch("lib.validation.validate_agent")
mock_calculate = mocker.patch("lib.scoring.calculate_score")
mock_rank = mocker.patch("lib.ranking.rank_agents")
result = handler.process(agents)
# Not testing anything real!

# GOOD - only mock external boundaries
def test_processes_agents(mock_external_api):
    # validate, calculate, rank are real
    # only API is mocked
    result = handler.process(agents)
    assert result[0].score > result[1].score
```

### Anti-Pattern: Flaky Tests

**Problem**: Test passes sometimes, fails other times

**Causes**:

- Time-dependent code
- Race conditions
- External service dependencies
- Random data
- Test execution order

**Solutions**:

```python
# BAD - flaky
def test_operation():
    result = operation_with_delay()
    # Sometimes passes, sometimes times out

# GOOD - deterministic
def test_operation(mocker):
    mocker.patch("time.sleep")  # Mock timing
    result = operation_with_delay()
    assert result == expected
```

### Anti-Pattern: Giant Test Methods

**Problem**: Test is hard to understand and maintain

**Example**:

```python
# BAD - tests too much
def test_entire_workflow():
    # 100+ lines testing everything
    agent = create_agent()
    validate_agent(agent)
    calculate_score(agent)
    rank_agents([agent])
    save_to_database(agent)
    send_notification(agent)
    # Too much!

# GOOD - focused tests
def test_validates_agent():
    agent = create_agent()
    assert validate_agent(agent) is True

def test_calculates_score():
    agent = create_agent()
    score = calculate_score(agent)
    assert score == 95.5

# etc...
```

### Anti-Pattern: Unclear Test Failures

**Problem**: When test fails, it's unclear what went wrong

**Example**:

```python
# BAD - unclear failure
assert result

# GOOD - clear failure message
assert result is not None, \
    f"Expected result but got None. Input: {input_data}"

assert result.status == "success", \
    f"Operation failed with status: {result.status}, error: {result.error}"
```

## Related Documentation

**Test Infrastructure**: See `.alfred/docs/testing.md` for how to run tests,
test organization, and testing infrastructure

**Coding Standards**: See `.alfred/docs/coding-standards.md` for general code
quality standards

**Architecture**: See `.alfred/docs/architecture.md` for understanding system
structure

**Project Guidelines**: See `CLAUDE.md` for project-specific testing constraints
and patterns

```

Fill in each section with appropriate content based on actual test patterns in the codebase. Include file:line references throughout pointing to exemplary tests. The output will be directly written to a file without any processing. This file should serve as the definitive testing standards guide for all developers.
</template>

**CRITICAL**: Always depend on the current codebase, never read existing documentation and assume it's correct. If the same file already exists, your task would be to update that and bring it up to the current codebase.
```
