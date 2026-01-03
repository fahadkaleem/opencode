---
description:
  Comprehensive review of test quality, coverage, patterns, and best practices
model: sonnet
---

# Comprehensive Test Quality Review

You are tasked with conducting a thorough, comprehensive test quality review to
ensure tests meet testing standards, follow established patterns, provide
adequate coverage, and maintain high quality. **This focuses deeply on test
quality, structure, mocking, test data, and assertions. For code quality review,
use `/dev/review-code`.**

## Prerequisites Check

<procedure>
Before starting review, verify testing standards documentation exists:
</procedure>

```bash
ls -la .alfred/docs/testing-standards.md
```

**If testing standards file is missing:**

<message>
[FAIL] **Testing standards documentation not found!**

Please run the following command first to generate testing standards:

```bash
/generate-standards:testing
```

This will analyze the codebase and create `.alfred/docs/testing-standards.md`
with established test patterns, Mocha conventions, mocking strategies with
Sinon, test data management, and assertion patterns with Chai.

Cannot proceed with test quality review without standards documentation.
</message>

**Stop and wait for user to generate standards.**

## Ticket ID Detection

**SECOND STEP:** Determine the ticket ID for this task.

<procedure>
1. Check if {{task_id}} template variable is provided (Alfred workflow mode):
   - If present, use {{task_id}} directly

2. If no template variable, check if ticket ID provided explicitly as parameter:
   - User may provide: `/dev/review-tests AL-1234` or
     `/dev/review-tests AL-1234 additional context`
   - If found, use that ticket ID

3. If no ticket ID provided, extract from current git branch:
   - Get branch name: `git branch --show-current`
   - Extract pattern: `feature/AL-1234`, `chore/AL-1234`, `bug/AL-1234`, etc.
   - Look for pattern: `AL-[0-9]+` (or similar Jira issue pattern)

4. If ticket ID found:
   - Set TASK_DIR as `.alfred/tasks/${TICKET_ID}/`
   - Review report will be saved to `.alfred/tasks/${TICKET_ID}/review-tests.md`

5. If no ticket ID found:
   - Review will still proceed, but report will not be saved to task directory
   - Report will only be shown to user as output </procedure>

**If ticket detected, present to user:**

```
Detected Ticket: AL-1234 (from branch feature/AL-1234-add-pacing-algorithm)
Review report will be saved to: .alfred/tasks/AL-1234/review-tests.md
```

## Initial Setup

When this command is invoked:

**If specific test files provided as parameters:**

- Review only those test files
- Create todo list to track review tasks
- Deep-dive into test quality

**If no parameters provided:**

<procedure>
1. Identify all test-related changes:
</procedure>

```bash
git status
git diff --name-only | grep "^tests/"
```

<message>
I'll comprehensively review all test changes against testing standards. This includes:
- Test structure and AAA pattern
- Mocha conventions and test organization
- Mocking strategies (Sinon stubs/spies, test data)
- Test coverage completeness (happy/error/edge paths)
- Test data design and management
- Assertion quality and specificity (Chai assertions)
- Test independence and cleanup
- Async/await patterns
- Test maintainability
- Comparison with similar test files

Starting comprehensive test quality review... </message>

## Step 1: Identify Test Changes and Context

<procedure>
1. Get list of changed test files and their status:
</procedure>

```bash
git status --porcelain | grep "test/"
git diff --stat -- test/
```

<procedure>
2. Read the actual test changes:
</procedure>

```bash
git diff -- test/
```

<procedure>
3. Identify corresponding source files being tested:
</procedure>

```bash
# For each test file, identify what it's testing
# Example: test/lib/workflow/adhoc-workflow-generator.test.ts
#       → src/lib/workflow/adhoc-workflow-generator.ts
```

<procedure>
4. Create review todo list using TodoWrite:
   - Analyze changed test files
   - Identify source files being tested
   - Check test structure and AAA pattern
   - Review Mocha hooks (beforeEach, afterEach, before, after)
   - Evaluate mocking strategies (Sinon stubs/spies)
   - Assess test coverage completeness
   - Review assertion quality (Chai assertions)
   - Check test independence
   - Compare with similar test files
   - Verify test data quality
   - Check test naming conventions
   - Generate comprehensive test quality report

5. Categorize changes by test type:
   - New unit test files (\*.test.ts)
   - Modified unit test files
   - New integration test files
   - Modified integration test files
   - Test helpers and utilities
   - Test data factories </procedure>

## Step 2: Research Similar Test Files for Patterns

**CRITICAL:** Research existing test patterns before reviewing.

<procedure>
1. For each changed test file, spawn parallel research tasks to find similar test files:
</procedure>

<task_examples> Task 1 - Find similar test files: For [test-file-path], find 2-3
similar test files that test comparable functionality. Focus on: Same test
directory, similar source file type being tested, similar test patterns. Return:
Test file paths with brief description of test patterns used.

Task 2 - Analyze test patterns: Compare [test-file-path] with similar test
files. Focus on: Test organization (class-based vs function-based), fixture
usage, mocking strategy (mocker vs respx vs test data), assertion patterns.
Return: Patterns that should be followed, test quality issues, deviations found.

Task 3 - Find exemplary tests: Locate the best-quality test files in the same
domain/module. Focus on: Clear AAA structure, comprehensive coverage,
well-designed fixtures, good assertions. Return: File paths with what makes them
exemplary.

Task 4 - Check test data patterns: Review how [test-file-path] creates test
data. Focus on: Use of tests/mocks.py factories, fixture design, test data
reusability. Return: Test data patterns to follow, improvements needed.
</task_examples>

<procedure>
2. Wait for ALL research tasks to complete

3. Read similar test files AND exemplary tests FULLY into context for comparison
   </procedure>

## Step 3: Comprehensive Test Quality Review

Reference: `.alfred/docs/testing-standards.md`

Review each test file against these comprehensive standards:

### 3.1 Test File Structure and Organization

<checklist>
- [ ] Test file location mirrors source file location exactly
- [ ] Test file naming follows convention (test_[module].py)
- [ ] Test file has docstring explaining what is being tested
- [ ] Tests organized into classes when testing multiple related behaviors
- [ ] Test classes named Test[ClassName] matching source
- [ ] Test functions named test_[behavior]_when_[condition] or test_[behavior]_[expected_result]
- [ ] Tests grouped logically within classes
- [ ] Clear separation between unit tests and integration tests
- [ ] Module-level constants defined at top for test data
- [ ] Imports organized: pytest, source code under test, test helpers
</checklist>

### 3.2 pytest Framework and Conventions

<checklist>
- [ ] Uses pytest framework (not unittest)
- [ ] Imports: pytest, pytest.fixture, pytest.mark.parametrize
- [ ] For mocking: uses pytest-mock (mocker fixture)
- [ ] For HTTP mocking: uses respx
- [ ] Test functions are async when testing async code
- [ ] Uses @pytest.mark.parametrize for test variations
- [ ] Parametrized tests have clear test IDs
- [ ] Uses pytest.approx for floating point comparisons
- [ ] Uses pytest.raises for exception testing
- [ ] No unittest.TestCase base classes (pure pytest)
</checklist>

### 3.3 AAA Pattern (Arrange-Act-Assert)

**CRITICAL:** Every test must follow AAA pattern clearly.

<checklist>
- [ ] All tests have clear Arrange section (setup)
- [ ] All tests have clear Act section (execution)
- [ ] All tests have clear Assert section (verification)
- [ ] Sections separated by blank lines or comments
- [ ] Arrange section sets up all test data and mocks
- [ ] Act section performs ONE action/operation
- [ ] Assert section verifies expected outcomes
- [ ] No multiple unrelated actions in single test
- [ ] No assertions mixed into arrange section
</checklist>

**Example of good AAA pattern** from testing standards:

```python
def test_high_performer_uses_high_tier_params(self) -> None:
    """High performers should use high tier parameters with more lenient penalty."""
    # Arrange
    config = OverCapacityTierConfig(
        high_max_degradation=0.95,
        high_mid_point=7.0,
        high_steepness=0.3,
    )
    factor = TierBasedOverCapacityPenalty(config=config)
    agent = PacingAgent(...)
    context = FactorContext(...)

    # Act
    result = factor.get_multiplier(context)

    # Assert
    assert result.multiplier > 0.5
    assert result.multiplier < 1.0
```

### 3.4 Test Independence and Isolation

<checklist>
- [ ] Tests can run in any order (no order dependencies)
- [ ] Each test creates its own test data (no shared mutable state)
- [ ] Tests use function-scoped fixtures for mutable data
- [ ] No test modifies global state without cleanup
- [ ] No test depends on another test's execution
- [ ] Tests use unique test data (not shared constants that get mutated)
- [ ] Tests clean up after themselves (fixtures use yield pattern)
- [ ] No reliance on execution order for correctness
</checklist>

### 3.5 Fixture Design and Usage

<checklist>
- [ ] Fixtures defined in conftest.py for cross-module use
- [ ] Module-specific fixtures in same file or local conftest.py
- [ ] Fixture names are clear and descriptive
- [ ] Fixtures scoped appropriately (function, class, module, session)
- [ ] Mutable fixtures use function scope (default)
- [ ] Expensive immutable fixtures use session/module scope
- [ ] Fixtures have type hints
- [ ] Fixtures have docstrings explaining what they provide
- [ ] Fixtures use yield for setup/teardown pattern
- [ ] No fixture does too much (keep focused)
- [ ] Fixtures compose well (can be combined)
</checklist>

**Good fixture examples** from testing standards:

```python
@pytest.fixture(scope="function")
def standard_lead() -> LeadOpportunity:
    """Provides a standard lead opportunity for testing"""
    return mocks.get_standard_lead()

@pytest.fixture(scope="function")
def alan_pacing_simulation_storage() -> AlanPacingSimulationStorage:
    """Provides pacing simulation storage with test agent data"""
    return mocks.get_alan_pacing_simulation_storage()
```

### 3.6 Mocking Strategy and Quality

**CRITICAL:** Mock at boundaries (external I/O), not internals.

<checklist>
- [ ] Only external dependencies are mocked (no business logic mocking)
- [ ] HTTP calls use respx for mocking
- [ ] Database operations use in-memory storage or test data
- [ ] File operations are mocked (no real file I/O)
- [ ] Time-dependent code uses fixed timestamps from tests/mocks.py
- [ ] Prefers test data factories over heavy mocking
- [ ] Mocks return realistic test data
- [ ] Mock responses match actual API structure
- [ ] No mocking of code under test (test real implementation)
- [ ] Mock verification is appropriate (when needed)
- [ ] Mocks are cleaned up (if needed by library)
</checklist>

**Good mocking pattern** from testing standards:

```python
# GOOD - Use test data factories instead of mocking
def test_get_pacing_agents_apm():
    member_zuids = {AGENT_ZUID_ONE, AGENT_ZUID_TWO}
    storage = mocks.get_alan_pacing_simulation_storage()  # Real storage with test data
    storage_accessor = AgentStorageAccessor(storage)

    # Test real algorithm with controlled test data
    algorithm = PaceCarV3(...)
    pacing_agents = algorithm.get_pacing_agents(...)

    assert len(pacing_agents) == 2
```

### 3.7 Test Data Quality and Management

<checklist>
- [ ] Test data uses factories from tests/mocks.py
- [ ] Test data is realistic (not just id=1, name="test")
- [ ] Test data is minimal (only what's needed for test)
- [ ] Test constants defined in tests/mocks.py (AGENT_ZUID_ONE, etc.)
- [ ] No magic numbers or strings (use named constants)
- [ ] Test data documents expected structure
- [ ] Complex test data uses factory functions
- [ ] Test data is reusable across tests
- [ ] Edge case data is clearly labeled
- [ ] No production data in tests
- [ ] Test data matches source code types (Pydantic models)
</checklist>

**Good test data patterns** from testing standards:

```python
# From tests/mocks.py - shared constants
AGENT_ZUID_ONE = 12999
AGENT_ZUID_TWO = 13999
FLEX_TEAM_ZUID = 12345
START_AT = datetime(2024, 1, 1, tzinfo=TZ_UTC)

# Factory function for test data
def get_standard_lead() -> LeadOpportunity:
    return LeadOpportunity(
        sim_run_id=1,
        lead_id=uuid.uuid4(),
        created_at=START_AT,
        zip_code=ZIP_CODE_94105,
        ...
    )
```

### 3.8 Assertion Quality and Specificity

**CRITICAL:** Assertions must be specific and meaningful.

<checklist>
- [ ] Assertions are specific (not just assert result)
- [ ] Assertions verify behavior, not implementation
- [ ] Multiple related assertions grouped logically
- [ ] Assertion messages provide context when needed
- [ ] Error assertions check exception type and message
- [ ] Floating point assertions use pytest.approx
- [ ] Boolean assertions explicit (is True, is False, is None)
- [ ] No weak assertions (just checking existence)
- [ ] Assertions verify all critical aspects
- [ ] No unnecessary assertions (testing same thing twice)
</checklist>

**Good assertion examples** from testing standards:

```python
# Good - specific assertions
assert len(pacing_agents) == 2
assert agent.pacing_score > 0
assert agent.performance_score_type == PerformanceScoreType.APM_PCVR
assert agent.cvr_tier == CvrTier.HIGH
assert agent.pcvr == 0.11

# Good - floating point comparison
assert pacing_agents[1].call_cooldown_penalty_factor == pytest.approx(0.95, abs=0.01)

# Good - range assertions for calculated values
assert result.multiplier > 0.5
assert result.multiplier < 1.0

# Good - assertion with context
assert agent.cvr_tier == CvrTier.HIGH, \
    f"Expected HIGH tier but got {agent.cvr_tier} for agent {agent.zuid}"
```

### 3.9 Test Coverage Completeness

**CRITICAL:** Tests must cover happy paths, error paths, and edge cases.

<checklist>
- [ ] Happy path (success scenario) is tested
- [ ] Error paths are tested (all error scenarios)
- [ ] Edge cases are tested (zero, None, empty, boundary values)
- [ ] All public functions/methods are tested
- [ ] All branches of conditional logic are tested
- [ ] Validation errors are tested
- [ ] Missing required data is tested
- [ ] Invalid data types are tested
- [ ] Boundary conditions are tested
- [ ] Special states are tested (empty lists, None values)
</checklist>

**Coverage examples** from testing standards:

```python
class TestTierBasedOverCapacityPenalty:
    def test_high_performer_uses_high_tier_params(self) -> None:
        """Happy path: high performers get lenient penalty"""

    def test_fair_performer_uses_fair_tier_params(self) -> None:
        """Happy path: fair performers get standard penalty"""

    def test_low_performer_uses_low_tier_params(self) -> None:
        """Happy path: low performers get strict penalty"""

    def test_zero_leads_above_capacity_returns_no_penalty(self) -> None:
        """Edge case: no penalty when at/below capacity"""

    def test_none_performance_rating_uses_fair_tier(self) -> None:
        """Edge case: None rating defaults to fair tier"""
```

### 3.10 Parametrization Usage

<checklist>
- [ ] Uses @pytest.mark.parametrize for test variations
- [ ] Parametrized tests have clear test IDs
- [ ] All parameter combinations are meaningful
- [ ] Parameter names are descriptive
- [ ] Parametrization used when testing same logic with different inputs
- [ ] Not over-parametrized (too many combinations)
- [ ] Parametrized tests still follow AAA pattern
</checklist>

**Good parametrization examples** from testing standards:

```python
@pytest.mark.parametrize(
    "performance_score_data_source, default_factors",
    [
        pytest.param(
            PerformanceScoreDataSource.AGENT_PERFORMANCE_MODEL,
            {FactorName.ASSIGNMENT_COOLDOWN_PENALTY, FactorName.OVER_CAPACITY_PENALTY},
        ),
        pytest.param(
            PerformanceScoreDataSource.AGENT_SCORE_V0,
            {
                FactorName.ASSIGNMENT_COOLDOWN_PENALTY,
                FactorName.OVER_CAPACITY_PENALTY,
                FactorName.CALL_COOLDOWN_PENALTY,
            },
        ),
    ],
)
def test_default_factors(
    self,
    standard_lead: LeadOpportunity,
    alan_pacing_simulation_storage: AlanPacingSimulationStorage,
    performance_score_data_source: PerformanceScoreDataSource,
    default_factors: set[FactorName],
) -> None:
    algorithm = PaceCarV3(performance_score_data_source=performance_score_data_source, ...)
    assert {f.name for f in algorithm.factors} == default_factors
```

### 3.11 Test Naming and Documentation

<checklist>
- [ ] Test names follow pattern: test_[behavior]_when_[condition]
- [ ] Test names clearly describe what is being tested
- [ ] Test names are not too long (< 80 chars ideally)
- [ ] Test classes have docstrings explaining scope
- [ ] Complex tests have docstrings explaining setup/logic
- [ ] No test names like test_1, test_2, test_foo
- [ ] Test names are consistent within file
- [ ] Test names match behavior being verified
</checklist>

**Good naming examples** from testing standards:

```python
# Good test names
test_high_performer_uses_high_tier_params()
test_fair_performer_uses_fair_tier_params()
test_zero_leads_above_capacity_returns_no_penalty()
test_none_performance_rating_uses_fair_tier()
test_different_tiers_produce_different_penalties()

# Good test class docstring
class TestTierBasedOverCapacityPenalty:
    """Test suite for tier-based over-capacity penalty factor."""
```

### 3.12 Integration Test Specifics

For integration tests (tests/integration/), additional checks:

<checklist>
- [ ] Tests full end-to-end workflows
- [ ] Uses realistic test data (not minimal mocks)
- [ ] Tests multiple components working together
- [ ] Uses helper functions from tests/integration/helpers/
- [ ] Tests validate complete simulation results
- [ ] Performance is acceptable (< 10 seconds per test)
- [ ] Tests use factories from tests/integration/helpers/factory.py
- [ ] Assertions use helpers from tests/integration/helpers/assertions.py
- [ ] Test data uses constants from tests/integration/helpers/data.py
- [ ] Configuration uses builders from tests/integration/helpers/config.py
</checklist>

### 3.13 Test Maintainability

<checklist>
- [ ] Tests are easy to understand
- [ ] Tests are not too long (< 100 lines ideally)
- [ ] Complex setup extracted to fixtures or helpers
- [ ] Tests are DRY (reuse fixtures, not duplicate code)
- [ ] Test data is reusable
- [ ] No commented-out test code
- [ ] No .only() or .skip() left in tests
- [ ] No print() or debugging code left in tests
- [ ] Tests document expected behavior clearly
- [ ] Tests will be easy to update when requirements change
</checklist>

## Step 4: Compare with Similar Test Files

<procedure>
1. For each changed test file, compare with similar test files found in Step 2

2. Check for test pattern consistency: </procedure>

<comparison_checklist>

- [ ] Test structure matches similar test files
- [ ] Fixture usage consistent with similar tests
- [ ] Mocking strategy matches similar tests
- [ ] Assertion style matches similar tests
- [ ] Test organization mirrors similar test files
- [ ] Test data patterns consistent
- [ ] Parametrization usage matches
- [ ] Test naming style consistent
- [ ] AAA pattern clarity matches best examples </comparison_checklist>

<procedure>
3. Document deviations from established test patterns
</procedure>

## Step 5: Generate Comprehensive Test Quality Report

Create detailed test quality review with findings:

<report_template>

# Comprehensive Test Quality Review Report

**Date:** [Current date] **Reviewer:** Claude (AI Test Quality Review) **Test
Files Reviewed:** [Count] test files **Source Files Tested:** [Count] source
files **Review Status:** [[PASS] Excellent / [GOOD] Good / [IMPROVE] Needs
Improvement / [FAIL] Poor]

---

## Executive Summary

[High-level overview of test quality and completeness]

**Overall Test Quality:** [Excellent / Good / Needs Improvement / Poor]

**Key Strengths:**

- [Strength 1]
- [Strength 2]

**Key Issues:**

- [Issue 1]
- [Issue 2]

**Critical Gaps:**

- [Gap 1]
- [Gap 2]

---

## Test Files Reviewed

### [PASS] Excellent Quality Tests

[List test files with excellent structure, coverage, and patterns]

### [GOOD] Good Quality Tests (Minor Improvements)

[List test files that are good but have minor issues]

### [IMPROVE] Tests Needing Improvement

[List test files with significant quality issues]

### [FAIL] Poor Quality Tests (Major Issues)

[List test files with major problems requiring refactoring]

---

## Detailed Test File Analysis

### 1. [Test File Path]

**Status:** [[PASS] Excellent / [GOOD] Good / [IMPROVE] Needs Improvement /
[FAIL] Poor]

**Tests:** `[source-file-path]`

**Test Quality Score:** [Score out of 10 or description]

**Similar Test Files for Reference:**

- `[similar-test-1]` - [patterns used, why it's similar]
- `[similar-test-2]` - [patterns used, why it's similar]
- `[exemplary-test]` - [what makes it exemplary]

#### Test Structure

- [PASS] PASS: [What's structured well]
  - Tests organized in clear Test classes
  - Good test naming conventions
- [IMPROVE] IMPROVE: [Structure issues]
  - Line [N]: Test not grouped in class with related tests
  - Line [M]: Test name unclear (test_agent_one vs
    test_validates_agent_capacity)

#### AAA Pattern Adherence

- [PASS] PASS: [Tests following AAA correctly]
  - Lines [N-M]: Clear AAA structure with blank line separation
- [FAIL] FAIL: [Tests violating AAA with line numbers]
  - Line [X]: Arrange and Act mixed (creating data and calling function
    together)
  - Line [Y]: Multiple actions in Act section (should split into separate tests)
  - Line [Z]: Assertions scattered throughout test (group in Assert section)

#### Test Independence

- [PASS] PASS: [Tests properly isolated]
  - Each test creates own test data
  - No shared mutable state
- [FAIL] FAIL: [Tests with dependencies]
  - Line [N]: Test relies on execution order (depends on previous test's state)
  - Line [M]: Shared mutable fixture causing test interactions

#### Fixture Usage

- [PASS] PASS: [Good fixture usage]
  - Uses standard_lead fixture appropriately
  - Good fixture composition
- [IMPROVE] IMPROVE: [Fixture issues]
  - Line [N]: Should use fixture instead of recreating same data
  - Line [M]: Fixture scope too broad (should be function-scoped for mutable
    data)

#### Mocking Strategy

- **Approach:** [respx / mocker / test data factories / combination]
- **Quality:** [[PASS] Excellent / [GOOD] Good / [IMPROVE] Needs Improvement /
  [FAIL] Poor]
- [PASS] PASS: [What's mocked well]
  - Uses test data factories from tests/mocks.py
  - Only mocks external boundaries
- [IMPROVE] IMPROVE: [Mocking issues]
  - Line [N]: Mocking internal business logic (should test real implementation)
  - Line [M]: Mock doesn't match real API structure
  - Line [X]: Should use tests/mocks.py factory instead of mocker.patch

#### Coverage Completeness

- **Happy Paths:** [[PASS] Complete / [IMPROVE] Partial / [FAIL] Missing]
- **Error Paths:** [[PASS] Complete / [IMPROVE] Partial / [FAIL] Missing]
- **Edge Cases:** [[PASS] Complete / [IMPROVE] Partial / [FAIL] Missing]

**Coverage Matrix:**

| Scenario                     | Tested?        | Line # |
| ---------------------------- | -------------- | ------ |
| Success case                 | [PASS]         | 123    |
| ValueError for invalid input | [FAIL] Missing | -      |
| None handling                | [PASS]         | 145    |
| Empty list handling          | [FAIL] Missing | -      |
| Boundary condition (zero)    | [PASS]         | 167    |

**Missing Test Scenarios:**

1. [Scenario 1 that should be tested]
2. [Scenario 2 that should be tested]
3. [Scenario 3 that should be tested]

#### Assertion Quality

- [PASS] **Strong assertions:** [examples with line numbers]
  - Line 123: `assert agent.cvr_tier == CvrTier.HIGH` (specific, meaningful)
  - Line 145: `assert result.multiplier == pytest.approx(0.95, abs=0.01)`
    (proper float comparison)
- [FAIL] **Weak assertions to improve:**
  - Line 178: `assert result` → Should assert specific property (e.g.,
    `assert result.status == "success"`)
  - Line 190: `assert agents` → Should check length or contents (e.g.,
    `assert len(agents) == 2`)
  - Line 205: `assert data.get("key")` → Should check actual value (e.g.,
    `assert data["key"] == expected_value`)

#### Test Data Quality

- [PASS] PASS: [Well-structured test data]
  - Uses AGENT_ZUID_ONE constant from tests/mocks.py
  - Test data is realistic
- [IMPROVE] IMPROVE: [Test data issues]
  - Line [N]: Magic value should be named constant (123 → AGENT_ZUID_ONE)
  - Line [M]: Mock response doesn't match actual API structure
  - Line [X]: Should use get_standard_lead() factory instead of inline creation

#### Parametrization

- [PASS] PASS: [Good parametrization usage]
  - Clear test IDs for each parameter set
  - Meaningful parameter combinations
- [IMPROVE] IMPROVE: [Parametrization issues]
  - Line [N]: Could parametrize instead of duplicating similar tests
  - Line [M]: Too many parameters (consider splitting into multiple tests)

#### Test Naming

- [PASS] PASS: [Good test names]
  - `test_high_performer_uses_high_tier_params` (clear behavior)
- [IMPROVE] IMPROVE: [Naming issues]
  - Line [N]: `test_agent_one` → Should be `test_validates_agent_eligibility`
  - Line [M]: Name too long, simplify

#### Test Maintainability

- [PASS] PASS: [Maintainable aspects]
  - Tests are concise and focused
  - Good use of fixtures for reusability
- [IMPROVE] IMPROVE: [Maintainability issues]
  - Line [N]: Test is too long (150 lines, should extract helpers)
  - Line [M]: Duplicated test setup across multiple tests (extract fixture)

#### Specific Issues

1. **Line [N]:** [Issue description]
   - **Why:** [Explanation of why this is a test quality issue]
   - **Fix:** [Suggested fix with example]

   ```python
   # Current (incorrect)
   [bad test code]

   # Should be
   [good test code from similar test file]
   ```

2. **Line [M]:** [Issue description]
   - **Why:** [Explanation]
   - **Fix:** [Suggested fix]
   - **Reference:** See similar pattern in `[exemplary-test-file]:[line]`

#### Recommendations

1. [Test-specific recommendation 1 with action]
2. [Test-specific recommendation 2 with action]
3. [Test-specific recommendation 3 with action]

---

## Summary of Issues by Category

### [FAIL] Critical Test Issues (Must Fix)

1. [Issue with test-file:line reference]
2. [Issue with test-file:line reference]

### [IMPROVE] Test Quality Issues (Should Fix)

1. [Issue with test-file:line reference]
2. [Issue with test-file:line reference]

### [NOTE] Test Improvements (Nice to Have)

1. [Improvement with test-file:line reference]
2. [Improvement with test-file:line reference]

---

## Common Test Issues Found

Issues that appear across multiple test files:

1. **[Issue Type]:** Found in [N] test files
   - [test-file-1]:[line]
   - [test-file-2]:[line]
   - **Pattern:** [description]
   - **Fix:** [solution]

2. **[Issue Type]:** Found in [M] test files
   - [list]
   - **Pattern:** [description]
   - **Fix:** [solution]

---

## Coverage Gap Analysis

### Missing Test Coverage

**Critical functions/scenarios not tested:**

1. `[source-file]:[function]` - [No tests found]
2. `[source-file]:[function]` - [Only happy path tested, missing error cases]
3. `[source-file]:[function]` - [Missing edge case tests]

### Incomplete Test Coverage

**Functions with partial coverage:**

| Function        | Happy Path | Error Path | Edge Cases        |
| --------------- | ---------- | ---------- | ----------------- |
| calculate_score | [PASS]     | [FAIL]     | [IMPROVE] Partial |
| process_agents  | [PASS]     | [PASS]     | [FAIL]            |

---

## Mocking Quality Assessment

### [PASS] Well-Mocked Tests

- `[test-file-1]` - Uses test data factories appropriately
- `[test-file-2]` - Good respx HTTP mocking

### [IMPROVE] Mocking Issues

- `[test-file-1]`: Line [N] - Mocking internal business logic
- `[test-file-2]`: Line [M] - Should use tests/mocks.py factory
- `[test-file-3]`: Line [X] - Mock doesn't match real structure

### Mocking Strategy Summary

- **Good practices:** [count] tests use test data factories
- **Needs improvement:** [count] tests over-mock internal logic
- **Missing mocks:** [count] tests hit real external dependencies

---

## Test Maintainability Assessment

### [PASS] Highly Maintainable Tests

[List tests that are easy to understand and update]

### [IMPROVE] Tests Needing Refactoring

[List tests that are hard to maintain]

**Common maintainability issues:**

- [N] tests are too long (> 100 lines)
- [M] tests have duplicated setup (should extract fixtures)
- [x] tests have poor naming

---

## Pattern Deviations

Test files that deviate from established patterns:

1. **[test-file-path]**
   - **Pattern in `[exemplary-test]`:** [description]
   - **Current implementation:** [description]
   - **Impact:** [why this matters]
   - **Recommendation:** [align with pattern]

---

## Exemplary Tests to Reference

Use these as examples when improving test quality:

1. **`[exemplary-test-1]`** - [What makes it great]
   - Clear AAA structure
   - Comprehensive coverage
   - Good fixture design
   - Strong assertions

2. **`[exemplary-test-2]`** - [What makes it great]
   - Excellent parametrization
   - Realistic test data
   - Good mocking strategy

---

## Automated Test Checks

Run these to verify test quality:

```bash
# Run tests
poetry run pytest tests/ -v                                    # [PASS/FAIL]

# Run with coverage
poetry run pytest --cov=routing_simulator --cov-report=term    # [XX]% coverage

# Run specific test file
poetry run pytest tests/[path]/test_[module].py -v             # [PASS/FAIL]
```

**Test Results:**

- Total tests: [N]
- Passed: [N]
- Failed: [N]
- Skipped: [N]

**Coverage Report:**

- Lines: [XX]% (target: 80%+) [[PASS] PASS / [FAIL] FAIL]
- Functions: [XX]% (target: 80%+) [[PASS] PASS / [FAIL] FAIL]
- Branches: [XX]% (target: 70%+) [[PASS] PASS / [FAIL] FAIL]

---

## Action Items

### [FAIL] Must Fix (Critical)

- [ ] Fix broken AAA pattern in: [list with file:line]
- [ ] Add missing error path tests: [list]
- [ ] Fix over-mocking issues in: [list with file:line]
- [ ] Improve weak assertions in: [list with file:line]

### [IMPROVE] Should Fix (Before Merge)

- [ ] Extract duplicated fixtures in: [list]
- [ ] Improve test naming in: [list]
- [ ] Add missing edge case tests: [list]
- [ ] Use test data factories instead of mocks: [list]

### [NOTE] Consider (Future Improvement)

- [ ] Refactor long tests in: [list]
- [ ] Add integration tests for: [list]
- [ ] Improve test documentation: [list]

---

## Approval Status

**Overall Test Quality:** [[PASS] Excellent / [GOOD] Good / [IMPROVE] Needs
Improvement / [FAIL] Poor]

**Rationale:** [Detailed explanation of test quality assessment]

**Test Coverage:** [[PASS] Comprehensive / [IMPROVE] Adequate / [FAIL]
Insufficient]

**Test Maintainability:** [[PASS] High / [IMPROVE] Medium / [FAIL] Low]

**Recommendation:** [[PASS] Approved / [IMPROVE] Approved with improvements /
[FAIL] Requires major fixes before merge]

**Next Steps:**

1. [Step 1]
2. [Step 2]
3. Review code quality with `/dev/review-code` (if not done already)
4. [Additional steps]

</report_template>

## Step 6: Present Test Quality Findings

<output_format>

## Comprehensive Test Quality Review Complete

**Test Files Reviewed:** [N] test files **Source Files Tested:** [M] source
files **Overall Test Quality:** [[PASS] Excellent / [GOOD] Good / [IMPROVE]
Needs Improvement / [FAIL] Poor]

**Quick Summary:**

- [PASS] EXCELLENT: [N] test files (exemplary quality)
- [GOOD] GOOD: [N] test files (minor improvements)
- [IMPROVE] NEEDS WORK: [N] test files (significant issues)
- [FAIL] POOR: [N] test files (major refactoring needed)

**Test Coverage:** [XX]% lines, [XX]% functions, [XX]% branches

**Critical Test Issues:** [Count or "None"]

**Common Test Problems:** [Top 3-5 recurring issues]

**Missing Test Coverage:** [List critical gaps]

---

**Key Findings:**

**Strengths:**

- [Strength 1]
- [Strength 2]

**Issues:**

- [Issue 1]
- [Issue 2]

**Gaps:**

- [Gap 1]
- [Gap 2]

---

See full detailed report above for specifics on each test file.

**Would you like me to:**

- [ ] Show examples of fixes from exemplary test files
- [ ] Create missing test scenarios
- [ ] Refactor specific tests to improve quality
- [ ] Explain any specific test quality findings
- [ ] Re-review after you make improvements
- [ ] Run `/dev/review-code` for source code quality review

</output_format>

<procedure>
**After presenting findings:**

If ticket ID was detected:

1. Save the complete review report (including all sections above) to:
   `.ai/context/tasks/${TICKET_ID}/review-tests.md`
2. Inform user:
   ```
   Review report saved to: .ai/context/tasks/${TICKET_ID}/review-tests.md
   ```
   </procedure>

## Important Guidelines

**Be Thorough:**

- Review every changed test file comprehensively
- Check against all testing standards
- Compare with similar AND exemplary test files
- Don't skip any checklist items
- Analyze test quality deeply

**Be Specific:**

- Cite exact line numbers
- Quote problematic test code
- Suggest specific fixes with examples
- Reference exemplary test files
- Show code snippets of correct patterns from codebase

**Be Constructive:**

- Explain why test is weak or strong
- Provide actionable recommendations
- Show examples of excellent tests from codebase
- Acknowledge what's done well
- Prioritize issues (critical vs. improvements)

**Focus on Test Quality:**

- Prioritize critical issues (broken AAA, no error tests, weak assertions)
- Flag test maintainability problems
- Verify comprehensive coverage
- Ensure test pattern consistency
- Check fixture and mock quality

**Be Efficient:**

- Use parallel research tasks
- Don't repeat similar findings
- Group related issues
- Prioritize action items

## Relationship to Other Commands

Recommended workflow:

1. `/dev/plan` - Create implementation plan
2. `/dev/implement` - Implement the plan (code + tests)
3. `/dev/review-code` - Review code quality and standards
4. Fix code issues found
5. `/dev/review-tests` - Review test quality comprehensively (this command)
6. Fix test issues found
7. `/dev/verify` - Verify functionality
8. `/dev/commit` - Create git commits
9. Push to git / Create PR

## Common Test Issues to Watch For

### Broken AAA Pattern

```python
# BAD - Mixed arrange/act/assert
def test_process_agent():
    agent = create_agent()
    result = process(agent)  # Act before arrange is complete
    storage = get_storage()  # More arrange after act
    assert result.score > 0
    save(result)  # Another action!

# GOOD - Clear AAA structure
def test_process_agent():
    # Arrange
    agent = create_agent()
    storage = get_storage()

    # Act
    result = process(agent, storage)

    # Assert
    assert result.score > 0
```

### Weak Assertions

```python
# BAD - Too generic
assert result
assert agents
assert data.get("key")

# GOOD - Specific
assert result.status == "success"
assert len(agents) == 2
assert agents[0].zuid == AGENT_ZUID_ONE
assert data["key"] == expected_value
```

### Over-Mocking Internal Logic

```python
# BAD - Mocking code under test
def test_calculate_score(mocker):
    mock_calc = mocker.patch("lib.algorithms.calculate_score")
    mock_calc.return_value = 95.0
    # Not testing anything real!

# GOOD - Test real implementation with test data
def test_calculate_score():
    agent = mocks.get_standard_agent()
    lead = mocks.get_standard_lead()

    score = calculate_score(agent, lead)

    assert score > 0
    assert score == pytest.approx(expected_score, abs=0.1)
```

### Missing Error Path Tests

```python
# BAD - Only happy path
def test_get_agent():
    agent = get_agent(123)
    assert agent.zuid == 123

# GOOD - Test errors too
def test_get_agent_success():
    agent = get_agent(123)
    assert agent.zuid == 123

def test_get_agent_not_found():
    with pytest.raises(ValueError, match="Agent not found"):
        get_agent(999)

def test_get_agent_invalid_id():
    with pytest.raises(TypeError, match="Invalid agent ID"):
        get_agent("invalid")
```

### No Test Independence

```python
# BAD - Tests share state
shared_data = []

def test_add_item():
    shared_data.append(item)  # Modifies shared state
    assert len(shared_data) == 1

def test_process_items():
    # Depends on previous test!
    assert len(shared_data) > 0

# GOOD - Each test independent
def test_add_item():
    data = []  # Own data
    data.append(item)
    assert len(data) == 1

def test_process_items():
    data = [item1, item2]  # Own data
    assert len(data) == 2
```
