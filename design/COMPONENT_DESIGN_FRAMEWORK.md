# Component Design Framework

**A Software Engineering Framework for Designing Any Component**

---

## What is This Framework?

This is a systematic approach to designing software components—whether you're building a function, a tool, an agent, a service, or an entire system. The framework guides you through seven phases that collectively produce a complete specification before you write any code.

```
Purpose           What ONE thing does this do?
Inputs            What does it need?
Preconditions     What must be true before running?
Constraints       What boundaries can never be crossed?
Error Handling    What can go wrong? How do we handle it?
Execution Logic   How does it execute?
Outputs           What does it return or produce?
```

---

## Why Use This Framework?

> "The hardest single part of building a software system is deciding precisely what to build."
> — Fred Brooks, *The Mythical Man-Month*

Most software problems aren't coding problems—they're specification problems. This framework forces you to answer the hard questions before you start coding, when changes are cheap.

The framework is grounded in decades of software engineering research:

| Phase | Established Principle | Source |
|-------|----------------------|--------|
| Purpose | Single Responsibility Principle | Robert C. Martin, *Clean Code* |
| Inputs | Interface Design | API Design Best Practices |
| Preconditions | Preconditions | Bertrand Meyer, *Design by Contract* |
| Constraints | Invariants, Trust Boundaries | Security Engineering |
| Error Handling | Defensive Programming | Hunt & Thomas, *The Pragmatic Programmer* |
| Execution Logic | Algorithm Design | Computer Science Fundamentals |
| Outputs | Postconditions | Bertrand Meyer, *Design by Contract* |

---

## How to Use This Framework

### For Individual Learning
Work through each phase sequentially. Answer every question, even if the answer is "not applicable." The act of considering each question reveals assumptions and edge cases.

### For Team Design Sessions
Use the questions as a facilitation guide. Have team members answer questions independently, then compare answers. Disagreements reveal ambiguity in requirements.

### For AI-Assisted Development
Use the questions as prompts when working with AI assistants. The structured questions help AI tools give you more precise, actionable answers.

### Progressive Disclosure
Each phase has three levels:
1. **Quick Check** — Essential questions (5 minutes)
2. **Standard** — Thorough coverage (15-30 minutes)
3. **Deep Dive** — Comprehensive analysis (1+ hours)

Start with Quick Check. Go deeper only where complexity demands it.

---

## Framework Overview

This is the complete framework on one page. Use this for quick designs or as a checklist. Refer to the detailed chapters when you need more depth.

### The Questions

**PURPOSE**: What ONE thing does this do?
1. What does this component do? (One sentence, no "and")
2. What category is it? (Read, Write, Transform, Communicate, Orchestrate)
3. What can users accomplish that they couldn't before?

**INPUTS**: What does it need?
1. What inputs are required?
2. What inputs are optional? What are their defaults?
3. What types are each input?

**PRECONDITIONS**: What must be true before running?
1. What must exist before this runs? (Files, connections, resources)
2. What must be true about the inputs? (Format, range, relationships)
3. What happens if a precondition is violated?

**CONSTRAINTS**: What boundaries can never be crossed?
1. What should this component NEVER do?
2. What resources should it NEVER access?
3. When must a human approve before proceeding?

**ERROR HANDLING**: What can go wrong? How do we handle it?
1. What errors can occur?
2. Which errors are recoverable? (Retry, fallback, degrade)
3. Which errors require human intervention?

**EXECUTION LOGIC**: How does it execute?
1. What are the main steps?
2. What states can this component be in?
3. What triggers transitions between states?

**OUTPUTS**: What does it return or produce?
1. What does success look like? (Return value, side effects)
2. What does failure look like? (Error structure)
3. What metadata accompanies the result?

---

### The Deliverable

```
════════════════════════════════════════════════════════════════
                         [COMPONENT NAME]
════════════════════════════════════════════════════════════════

PURPOSE
───────
Name:       [component_name]
Category:   [Read | Write | Transform | Communicate | Orchestrate]
Purpose:    [One sentence]
Excludes:   [What this does NOT do]

INPUTS
──────
Required:   [name: type — description]
Optional:   [name: type = default — description]

PRECONDITIONS
─────────────
Before running:
  1. [Precondition] → if violated: [error message]
  2. [Precondition] → if violated: [error message]

CONSTRAINTS
───────────
Never:      [Absolute prohibitions]
Limits:     [Max size, timeout, rate]
Approval:   [When human approval required]

ERROR HANDLING
──────────────
| Error          | Recoverable? | Response              |
|----------------|--------------|----------------------|
| [error]        | [yes/no]     | [retry/fail/degrade] |

EXECUTION LOGIC
───────────────
1. [Step]
2. [Step]
   → If [condition]: [branch]
3. [Step]

OUTPUTS
───────
Success:    [What's returned]
Failure:    [Error structure]
Side effects: [What changes in the system]

════════════════════════════════════════════════════════════════
```

---

### Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT DESIGN FRAMEWORK                    │
├─────────────────────────────────────────────────────────────────┤
│   Purpose           What ONE thing does this do?                │
│   Inputs            What does it need?                          │
│   Preconditions     What must be true before running?           │
│   Constraints       What boundaries can never be crossed?       │
│   Error Handling    What can go wrong? How do we handle it?     │
│   Execution Logic   How does it execute?                        │
│   Outputs           What does it return or produce?             │
├─────────────────────────────────────────────────────────────────┤
│   Start with Quick Check (3 questions per phase)                │
│   Go deeper only where complexity demands it                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Seven Phases

---

# Purpose

**The Question: What ONE thing does this component do?**

> "A class should have one, and only one, reason to change."
> — Robert C. Martin, *Clean Code*

Purpose defines the **single responsibility** of your component. A well-scoped component does one thing and does it well. If you can't describe it in one sentence without using "and," it's probably doing too much.

---

## Quick Check

1. **What does this component do?** (One sentence, no "and")
2. **What category is it?** (Read, Write, Transform, Communicate, Orchestrate)
3. **What can users accomplish with this that they couldn't before?**

---

## Standard Questions

### Purpose & Responsibility

4. Why does this component need to exist?
5. What problem does it solve?
6. Who or what will use this component? (Human, another system, an AI agent)
7. If this component didn't exist, what would users have to do instead?

### Boundaries of Responsibility

8. What is explicitly **out of scope** for this component?
9. If someone asked this component to do X (a related task), should it handle that or should that be a separate component?
10. What assumptions does this component make about its environment?

### Naming & Language

11. What is the most accurate name for this component? (Verb-noun for actions: `read_file`, `send_email`)
12. What domain-specific terms does this component use?
13. How would an expert in this domain describe what this component does?

---

## Deep Dive Questions

### Decomposition Analysis

14. Can this component be broken into smaller, independent components?
15. If you had to split this into two components, where would the split be?
16. Does this component have "feature envy"—does it need to know too much about other components?

### Change Analysis

> "Gather together the things that change for the same reasons. Separate those things that change for different reasons."
> — Robert C. Martin, *Clean Architecture*

17. What would cause this component to change?
18. Are there multiple, unrelated reasons this component might need modification?
19. If the business rules change, does this component change? If the UI changes, does this component change? (These should be different components)

### Context & Dependencies

20. What does this component depend on?
21. What depends on this component?
22. Could this component be reused in a different project with minimal changes?

---

## Purpose Deliverable

```
PURPOSE STATEMENT
─────────────────
Name:           [component_name]
Category:       [Read | Write | Transform | Communicate | Orchestrate]
Purpose:        [One sentence, no "and"]
Enables:        [What users can now do]
Excludes:       [What this explicitly does NOT do]
Depends On:     [Other components/systems]
Used By:        [Who/what uses this]
```

---

# Inputs

**The Question: What does this component need?**

> "Make interfaces easy to use correctly and hard to use incorrectly."
> — Scott Meyers, *Effective C++*

Inputs define the **contract** between caller and component. Good input design makes correct usage obvious and incorrect usage difficult.

---

## Quick Check

1. **What inputs are required?** (Can't run without these)
2. **What inputs are optional?** (Enhance behavior but have sensible defaults)
3. **What types are each input?** (String, number, boolean, object, array)

---

## Standard Questions

### Required Inputs

4. For each required input:
   - What is its name? (Use domain vocabulary)
   - What is its type?
   - What makes a value valid vs. invalid?
   - What is a good example value?
   - What is an example of an invalid value?

5. Why is each required input necessary?
6. Could any required input have a sensible default instead?

### Optional Inputs

7. For each optional input:
   - What is the default value or behavior when omitted?
   - What use case does this input serve?
   - When would a user need to override the default?

8. Are there too many optional inputs? (More than 3-4 suggests the component is doing too much)

### Input Relationships

9. Are there inputs that must be used together?
10. Are there inputs that are mutually exclusive?
11. Does the meaning of one input change based on another input's value?

### Future-Proofing

12. If you need to add pagination later (offset, limit), is the interface designed to accommodate it?
13. If you need to add filtering or sorting, where would those inputs go?
14. What inputs might you wish you had added from the start?

### Descriptions for Documentation

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."
> — Martin Fowler

15. How would you describe each input so that someone unfamiliar with the codebase understands it?
16. What example values would clarify correct usage?
17. What common mistakes might users make with each input?

---

## Deep Dive Questions

### Type Design

18. Should any string input be an enum instead? (Constrained set of values)
19. Should any inputs be combined into an object? (Related values that travel together)
20. Should any object input be flattened into separate inputs? (Simplify common cases)

### Validation Rules

21. What are the minimum and maximum values for numeric inputs?
22. What format must string inputs follow? (Email, URL, path, date)
23. What length constraints apply? (Min/max characters, array sizes)

### Evolution & Compatibility

24. If you need to add a new input later, how will you do it without breaking existing users?
25. Should inputs be versioned?
26. What inputs might you regret adding? (Hard to remove once added)

### Consumer Experience

27. Can this component be called with just the required inputs for the common case?
28. Are input names self-documenting, or do they require explanation?
29. If a user guesses the input name, will they guess correctly?

### Caller-Provided Metadata

30. Should the caller provide risk/safety assessment? (e.g., "this operation is destructive")
31. Should the caller provide intent/description? (e.g., "installing dependencies")
32. How does caller-provided metadata affect execution? (approval flow, logging, prioritization)

### Embedded Resources (for free-form input parameters)

> Some inputs contain structured data embedded in unstructured text, such as URLs in a prompt or file paths in a command.

33. Does any input contain embedded resources? (URLs, file paths, code blocks, identifiers)
34. How are embedded resources extracted? (Regex, parser, heuristic detection)
35. How many embedded resources are allowed? (1, N, unlimited)
36. How is each extracted resource validated independently?
37. What happens if some resources are valid and others invalid? (Reject all, process valid only, warn)

### Conditional Requirements

> Some inputs are only required when another input has a specific value.

38. Are any inputs conditionally required based on other input values?
39. For each conditional requirement:
    - When [input A] equals [value], then [input B] is required
    - What error message if the conditional requirement is not met?
40. Are there mutually exclusive input combinations that should be rejected?

---

## Inputs Deliverable

```
INPUTS
──────
Required:
  - name:         [input_name]
    type:         [string | number | boolean | enum | object | array]
    description:  [What this input controls]
    valid_values: [Constraints: range, format, enum values]
    example:      [A concrete example]

Optional:
  - name:         [input_name]
    type:         [type]
    default:      [Default value or "none"]
    description:  [What this input controls]
    use_case:     [When to use this input]

Constraints:
  - [input_a] and [input_b] must be used together
  - [input_c] and [input_d] are mutually exclusive

Caller Metadata (if applicable):
  - [metadata_input]: [how it affects execution]

Embedded Resources (if applicable):
  Contains:           [URLs | file paths | code | identifiers]
  Extraction:         [method used to extract]
  Max count:          [limit or "unlimited"]
  Per-item validation: [validation applied to each]
  Partial validity:   [reject all | process valid | warn]

Conditional Requirements (if applicable):
  | When [input] equals | Then require |
  |---------------------|--------------|
  | [value]             | [input]      |
```

---

# Preconditions

**The Question: What must be true before this component runs?**

> "Precondition: An assertion which must be guaranteed by the client prior to any call to the routine."
> — Bertrand Meyer, *Object-Oriented Software Construction*

Preconditions are conditions that must be satisfied before execution begins. These are the responsibilities of the caller. If a precondition is violated, the component should fail immediately with a clear message.

---

## Quick Check

1. **What must exist before this runs?** (Files, connections, resources)
2. **What must be true about the inputs?** (Format, range, relationships)
3. **What happens if a precondition is violated?** (Error message, exception)

---

## Standard Questions

### Input Validation

4. For each input:
   - Is it present? (Not null, not undefined, not empty)
   - Is it the right type?
   - Is it within valid bounds?
   - Does it match the required format?

5. In what order should validations run? (Check cheapest first, fail fast)
6. Should all validation errors be collected, or stop at the first error?

### State Validation

7. What state must the system be in before this component can run?
8. What resources must exist? (Files, database records, network connections)
9. What resources must NOT exist? (For creation operations)
10. Does this component depend on another component having run first?

### Permission Validation

11. What permissions are required to run this component?
12. How is the caller authenticated?
13. How is the caller authorized?

### Environment Validation

14. What environment variables or configuration must be set?
15. What external services must be available?
16. What version requirements exist? (Libraries, APIs, protocols)

---

## Deep Dive Questions

### Error Message Design

> "When you must fail, fail noisily and as soon as possible."
> — Hunt & Thomas, *The Pragmatic Programmer*

17. For each precondition failure:
    - What error message will be shown?
    - Does the message explain what was wrong?
    - Does the message explain how to fix it?
    - Does the message include the invalid value (safely)?

18. Are error messages actionable? (User knows exactly what to do)
19. Do error messages avoid exposing sensitive information?

### Validation Complexity

20. Are there cross-field validations? (start_date must be before end_date)
21. Are there validations that require external calls? (Check if user exists)
22. Which validations are synchronous vs. asynchronous?

### Fail-Fast Strategy

23. Which validations catch the most common errors? (Check these first)
24. Which validations are most expensive? (Check these last)
25. Is there a logical dependency order? (Can't check Y until X passes)

### Idempotency & Safety

26. Can this component be called multiple times with the same inputs safely?
27. If interrupted mid-execution, what state is left behind?
28. Is there a "dry run" mode to validate without executing?

---

## Preconditions Deliverable

```
PRECONDITIONS (checked in order)
────────────────────────────────
1. [Precondition name]
   Check:    [What is validated]
   Failure:  [Error message with fix instructions]

2. [Precondition name]
   Check:    [What is validated]
   Failure:  [Error message with fix instructions]

VALIDATION ORDER RATIONALE:
[Why this order—cheapest first, most common errors early, dependencies]

IDEMPOTENCY:
[Yes/No—what happens if called twice with same inputs]
```

---

# Constraints

**The Question: What boundaries can NEVER be crossed?**

> "Invariant: An assertion which must be satisfied by every instance of a class, at all stable times."
> — Bertrand Meyer, *Object-Oriented Software Construction*

Constraints define **invariants** and **boundaries**—rules that must always hold, regardless of input. These are non-negotiable security and safety constraints that protect the system from misuse.

---

## Quick Check

1. **What should this component NEVER do?** (Absolute prohibitions)
2. **What resources should this component NEVER access?**
3. **When must a human approve before proceeding?**

---

## Standard Questions

### Security Boundaries

4. What is the trust boundary for this component?
5. What resources are off-limits? (Files outside workspace, certain APIs)
6. How is the boundary enforced? (Allowlist, denylist, path prefix check)
7. What happens when someone tries to cross the boundary?

### Invariants

> "An assertion that must be true at all times, not just before or after a routine."

8. What must ALWAYS be true, regardless of inputs?
   - "File paths must always be within workspace"
   - "User data must never be logged in plaintext"
   - "Requests must never exceed rate limit"

9. Can these invariants be bypassed by any combination of valid inputs?
10. Are there "escape hatches"? How are they controlled?

### Resource Limits

11. What is the maximum input size? (File size, request size, array length)
12. What is the maximum execution time? (Timeout)
13. What is the maximum memory usage?
14. What is the maximum number of retries?
15. What is the maximum cost? (API calls, compute, money)

### Human Approval Gates

16. What operations require explicit human approval?
17. What factors determine if approval is needed?
    - Operation type? (Read vs. write)
    - Location? (Inside vs. outside workspace)
    - Sensitivity? (PII, credentials, destructive)
18. What information does the human need to make a decision?
19. Can approval be automated based on policy? (Auto-approve reads)

---

## Deep Dive Questions

### Deny Lists & Ignore Patterns

20. What files or patterns should always be excluded? (`.env`, `.git/`, `node_modules/`)
21. How are exclusions configured? (System defaults, user config, both)
22. What takes precedence when rules conflict?

### Operation-Level Filtering

23. Are there specific operations or commands that should be blocked? (e.g., `rm -rf /`, `DROP TABLE`)
24. How are allowed/denied operations defined? (Allowlist, denylist, pattern matching)
25. Can users configure per-operation permissions? (e.g., "always allow `npm install`")

### Rate Limiting & Throttling

26. How many operations per time period are allowed?
27. What happens when rate limit is exceeded? (Queue, reject, degrade)
28. Are limits per-user, per-component, or global?

### Audit & Compliance

29. What operations must be logged for audit?
30. What information must be included in audit logs?
31. How long must audit logs be retained?
32. What compliance requirements apply? (GDPR, HIPAA, SOC2)

### Defense in Depth

33. What if the primary constraint check fails? Is there a backup?
34. What if an attacker controls the input entirely?
35. What is the blast radius if this component is compromised?

### Tool Exclusivity (for stateful or modal tools)

> Some tools "take over" and prevent other tools from being used until they complete or are explicitly closed.

36. Does this tool require exclusive access while active?
37. What other tools are blocked while this tool is active?
38. What tools (if any) can still be used during exclusivity?
39. What action releases exclusivity? (explicit close, timeout, error)
40. How is exclusivity enforced? (System blocks calls, LLM instructed, both)
41. What happens if the agent tries to use a blocked tool? (Error message, queue, ignore)

### Network Trust Boundaries (for network-accessing tools)

> Tools that access network resources may need different handling for public vs. private resources.

42. Does this tool access network resources?
43. How are public URLs/endpoints handled?
44. How are private IPs (10.x, 192.168.x, 172.16-31.x) handled differently?
45. How is localhost/127.0.0.1 handled?
46. What protocols are allowed? (http, https, file, ftp, etc.)
47. Are there domain allowlists or blocklists?

---

## Constraints Deliverable

```
CONSTRAINTS
───────────
SECURITY INVARIANTS (must ALWAYS be true):
  1. [Invariant statement]
  2. [Invariant statement]

RESOURCE LIMITS:
  - Max input size:     [size] → [behavior when exceeded]
  - Max execution time: [duration] → [behavior when exceeded]
  - Max retries:        [count] → [behavior when exceeded]

EXCLUSION PATTERNS:
  System defaults: [list of patterns]
  User configurable: [yes/no, how]

OPERATION FILTERING (if applicable):
  Blocked operations: [list of denied commands/operations]
  Allowed operations: [list or "all except blocked"]
  Per-operation permissions: [can users allowlist specific operations?]

APPROVAL MATRIX:
  | Condition              | Approval Required? |
  |------------------------|-------------------|
  | [condition]            | [yes/no/policy]   |

TRUST BOUNDARY:
  Inside: [what's allowed]
  Outside: [what requires special handling]

TOOL EXCLUSIVITY (if applicable):
  While active, blocks:  [list of tools]
  Still allows:          [list of tools or "none"]
  Release trigger:       [close action | timeout | error]
  Enforcement:           [system | LLM instruction | both]

NETWORK TRUST BOUNDARIES (if applicable):
  Public URLs:      [handling]
  Private IPs:      [handling]
  Localhost:        [handling]
  Allowed protocols: [http, https, ...]
  Domain rules:     [allowlist/blocklist or "none"]
```

---

# Error Handling

**The Question: What can go wrong? How do we handle it?**

> "Crash early. A dead program normally does a lot less damage than a crippled one."
> — Hunt & Thomas, *The Pragmatic Programmer*

Error Handling covers anticipating failures, deciding how to respond, and ensuring the system degrades gracefully. Every failure mode needs a defined response.

---

## Quick Check

1. **What errors can occur?** (List the failure modes)
2. **Which errors are recoverable?** (Retry, fallback, degrade)
3. **Which errors require human intervention?**

---

## Standard Questions

### Input Errors

4. What happens if required inputs are missing?
5. What happens if inputs are malformed?
6. What happens if inputs are out of range?

### State Errors

7. What happens if a required resource doesn't exist?
8. What happens if a resource exists but is the wrong type?
9. What happens if permissions are denied?
10. What happens if the resource changes during execution?

### External Errors

11. What external systems does this component depend on?
12. What happens if an external system is unavailable?
13. What happens if an external system returns an unexpected response?
14. What happens if network connectivity is lost?

### Resource Errors

15. What happens if the component runs out of memory?
16. What happens if disk space is exhausted?
17. What happens if a timeout is reached?
18. What happens if rate limits are exceeded?

---

## Deep Dive Questions

### Error Classification

19. For each error, is it:
    - **Transient**: Might succeed if retried (network timeout)
    - **Permanent**: Will never succeed (file doesn't exist)
    - **Partial**: Some operations succeeded, some failed

20. For each error, can it be:
    - **Handled automatically**: Retry, use fallback
    - **Handled by the caller**: Return error, let caller decide
    - **Escalated to human**: Alert, pause for intervention

### Retry Strategy

> "Use Timeouts. Don't wait forever for something that might never happen."
> — Michael Nygard, *Release It!*

21. Which errors should trigger automatic retries?
22. How many retries are appropriate?
23. What backoff strategy should be used? (Linear, exponential, jitter)
24. When should retries stop?

### Fallback Strategy

25. Is there a degraded mode this component can operate in?
26. Is there an alternative path to achieve the same result?
27. Is caching appropriate for fallback?
28. What does the user experience during degraded operation?

### Fallback Tiers (for multi-strategy fallback)

> Some components have multiple fallback strategies with different quality/reliability tradeoffs.

29. Are there multiple fallback tiers? If so, what are they?
30. For each tier:
    - What method does this tier use?
    - What triggers falling back to this tier?
    - What is the quality/capability tradeoff?
31. Is fallback automatic or does it require user confirmation?
32. Is telemetry captured when fallback is used? (Which tier, why triggered)
33. Can the user force a specific tier? (e.g., "always use direct fetch")

### Partial Failure

34. If this component operates on multiple items, what happens if some fail?
35. Should it stop on first error or continue?
36. How are partial results communicated?
37. Can the operation be rolled back?

### Error Messages

38. For each error type:
    - What message is returned to the caller?
    - Is the message actionable?
    - Does it include enough context to diagnose?
    - Does it avoid exposing sensitive information?

39. Should errors be structured (typed) or strings?
40. Should error codes be used for programmatic handling?

### Cleanup & Recovery

41. If interrupted mid-execution, what state is left behind?
42. How is that state cleaned up?
43. Is there a compensating transaction for rollback?

---

## Error Handling Deliverable

```
FAILURE MODES
─────────────
| Error             | Type       | Response          | Retriable | Message |
|-------------------|------------|-------------------|-----------|---------|
| [error name]      | [transient/permanent] | [retry/fail/degrade] | [yes/no] | [message] |

RETRY POLICY:
  Retriable errors: [list]
  Max attempts:     [number]
  Backoff:          [strategy: fixed/linear/exponential]
  Max delay:        [duration]

FALLBACK STRATEGY:
  [Describe degraded mode or alternative path]

FALLBACK TIERS (if multiple strategies):
  | Tier | Method          | Triggers when...        | Tradeoff              |
  |------|-----------------|-------------------------|----------------------|
  | 1    | [Primary]       | Default                 | [Best quality]       |
  | 2    | [Fallback]      | [Condition]             | [Lower quality]      |
  | 3    | [Last resort]   | [Condition]             | [Minimal capability] |

  Fallback telemetry: [What's logged when fallback used?]

ESCALATION TRIGGERS:
  - [condition that requires human intervention]
  - [condition that requires human intervention]

CLEANUP:
  On success: [what to clean up]
  On failure: [what to clean up]
  On timeout: [what to clean up]
```

---

# Execution Logic

**The Question: How does this component execute?**

Execution Logic describes the step-by-step process of how the component does its work. This is the algorithm, the state machine, the sequence of operations.

---

## Quick Check

1. **What are the main steps?** (High-level sequence)
2. **What states can this component be in?** (For stateful components)
3. **What triggers transitions between states?**

---

## Standard Questions

### Execution Sequence

4. What is the first thing this component does?
5. What is the last thing this component does?
6. What are all the steps in between?
7. Which steps are always executed?
8. Which steps are conditional?

### Branching Logic

9. What decisions does this component make?
10. What are the possible branches?
11. What data determines which branch is taken?

### Type & Format Handling

12. Does this component handle multiple input formats or types?
13. How is the format/type detected? (Extension, content inspection, magic bytes, headers)
14. Is there a distinct processing path for each type?
15. What happens if the type cannot be determined?

### State Management

16. What state does this component maintain during execution?
17. What state persists after execution completes?
18. How is state accessed and modified?
19. Are there race conditions to consider?

### Iteration & Loops

20. Does this component loop over items?
21. What determines when the loop ends?
22. What happens if the loop never ends? (Loop detection)
23. Can the loop be cancelled mid-iteration?

---

## Deep Dive Questions

### State Machine (for stateful components)

> "The State pattern allows an object to alter its behavior when its internal state changes."
> — Gang of Four, *Design Patterns*

24. What are all possible states?
25. For each state:
    - What triggers entry into this state?
    - What can happen while in this state?
    - What triggers exit from this state?
26. What are the terminal states? (Done, failed, cancelled)
27. Draw the state diagram.

### Concurrency

28. Can this component run concurrently with itself?
29. Can this component run concurrently with other components?
30. What shared resources require synchronization?
31. What locking strategy is used?
32. Are there deadlock risks?

### Performance

33. What is the time complexity? (O(1), O(n), O(n²))
34. What is the space complexity?
35. Where are the performance bottlenecks?
36. Can work be done in parallel?
37. Can work be done lazily (on-demand)?

### Streaming & Chunking

38. Does this component process data in chunks or all at once?
39. Can partial results be returned before completion?
40. How is progress communicated during long operations?

### Hooks & Extension Points

41. Should there be pre-execution hooks? (Run before)
42. Should there be post-execution hooks? (Run after)
43. Can hooks modify the execution?
44. Can hooks cancel the execution?

### External System Integration

45. Does this component integrate with external systems? (IDEs, editors, databases)
46. How does the component communicate with external systems? (API, events, files)
47. What happens if the external system is unavailable?
48. Can the external system modify the operation? (User edits in IDE before save)

### Transaction Boundaries

49. What operations must succeed or fail together?
50. How are transactions demarcated?
51. What happens if a transaction partially completes?

### Lifecycle Requirements (for tools with mandatory init/cleanup)

> Some tools have mandatory initialization and cleanup phases that must always occur.

52. Does this tool require mandatory initialization? What action must come first?
53. Does this tool require mandatory cleanup? What action must come last?
54. What happens if initialization is skipped? (Error, auto-init, undefined behavior)
55. What happens if cleanup is skipped? (Leaked resources, orphaned state, auto-cleanup)
56. Can the lifecycle be restarted? (Close and re-open)

### Multi-Turn Interaction (for conversational tools)

> Some tools operate across multiple conversation turns, with each response informing the next action.

57. Does this tool operate across multiple conversation turns?
58. How many actions can be performed per turn? (1, N, unlimited)
59. What response does each action produce that informs the next action?
60. Must the agent wait for a response before the next action?
61. How does the agent know when the multi-turn interaction is complete?
62. What happens if the conversation is interrupted mid-interaction?

### Streaming Behavior (for long-running operations)

> Some tools produce output incrementally during execution rather than all at once at the end.

63. Does this tool stream output during execution?
64. What is the update frequency? (Every N ms, every N bytes, on events)
65. Does the output format change during streaming? (e.g., binary detection mid-stream)
66. Is there inactivity detection? (Timeout if no output for N seconds)
67. Can the user interact with streamed output before completion?

### Transformation Pipeline (for content processing tools)

> Some tools transform content through multiple stages before producing final output.

68. Does this tool transform content through multiple stages?
69. What is the transformation pipeline? (Input → Stage 1 → Stage 2 → ... → Output)
70. Are any transformations conditional? (e.g., HTML-to-text only if content-type is HTML)
71. Where does truncation occur in the pipeline?
72. Can transformations fail independently? How is partial transformation handled?

---

## Execution Logic Deliverable

```
EXECUTION LOGIC
───────────────
STEPS:
  1. [Step description]
  2. [Step description]
     - If [condition]: [branch A]
     - Else: [branch B]
  3. [Step description]
  ...

STATE MACHINE (if applicable):
  States: [list]
  Initial state: [state]
  Terminal states: [list]

  Transitions:
    [state A] --[event]--> [state B]
    [state B] --[event]--> [state C]

LOOP STRUCTURE (if applicable):
  Iterates over: [what]
  Continues while: [condition]
  Terminates when: [condition]
  Loop detection: [strategy]

HOOKS:
  Before: [what can run before]
  After: [what can run after]
  Cancellation: [how hooks can cancel]

EXTERNAL INTEGRATIONS (if applicable):
  System: [IDE, database, external service]
  Communication: [API, events, files]
  Fallback: [behavior if unavailable]

LIFECYCLE REQUIREMENTS (if applicable):
  Must start with:  [required initialization action]
  Must end with:    [required cleanup action]
  If not closed:    [leaked resources | auto-cleanup | error]
  Restart allowed:  [yes/no]

MULTI-TURN PATTERN (if applicable):
  Actions per turn:      [1 | N | unlimited]
  Wait between turns:    [yes - for what response?]
  Response informs next: [what data guides next action]
  Completion signal:     [how agent knows to stop]

STREAMING BEHAVIOR (if applicable):
  Update frequency:       [interval or trigger]
  Format changes:         [e.g., binary detection]
  Inactivity timeout:     [duration or "none"]
  Interactive:            [can user respond during stream?]

TRANSFORMATION PIPELINE (if applicable):
  Input → [Stage 1] → [Stage 2] → ... → Output
  Conditional stages: [which stages are conditional]
  Truncation point:   [where truncation occurs]
```

---

# Outputs

**The Question: What does this component return or produce?**

> "Postcondition: An assertion which must be guaranteed on return by the routine."
> — Bertrand Meyer, *Object-Oriented Software Construction*

Outputs define **postconditions** and **results**—what the component guarantees after successful execution, and how it communicates results back to the caller.

---

## Quick Check

1. **What does success look like?** (Return value, side effects)
2. **What does failure look like?** (Error structure)
3. **What metadata accompanies the result?**

---

## Standard Questions

### Success Output

4. What does this component return on success?
5. What is the structure of the success response?
6. What fields are always present?
7. What fields are optional?
8. Is the output format consistent across all success cases?

### Failure Output

9. What does this component return on failure?
10. What is the structure of the error response?
11. How can the caller distinguish between error types?
12. Is there a standard error format?

### Side Effects

13. What changes in the system after this component runs?
14. What files are created, modified, or deleted?
15. What state is updated?
16. What events are emitted?
17. What notifications are sent?

### Metadata

18. What metadata accompanies the primary result?
    - Timing information?
    - Resource usage?
    - Pagination info?
    - Version info?

### Truncation & Continuation

19. Can the output exceed a reasonable size?
20. How is truncation communicated to the caller?
21. What information helps the caller request "more"? (offset, cursor, page token)
22. Does the output include total size/count so the caller knows their position?

### Output Audiences

23. Does this component serve multiple consumers with different needs?
24. What does the primary caller (code, API client, agent) need?
25. What does a human observer need? (Simpler summary? Different format?)
26. Are these separate output fields, or derived from the same result?

---

## Deep Dive Questions

### Success Guarantees

> "What's the contract guarantee? If preconditions are met, what can the caller rely on?"

27. After successful execution, what is guaranteed to be true?
28. What can the caller safely assume about the system state?
29. What invariants are maintained?

### Failure Guarantees

30. After failed execution, what is guaranteed?
31. Is state left clean? (No partial writes, no leaked resources)
32. Can the caller retry safely?

### Output Transformation

33. Should large outputs be summarized before returning?
34. Who performs summarization? (Component itself, separate service, caller)
35. What triggers summarization? (Size threshold, configuration, always)
36. Is the original output preserved alongside the summary?

### Observability

37. What should be logged for debugging?
38. What metrics should be tracked?
39. What traces should be captured?
40. What information helps with post-hoc analysis?

### Documentation

41. What examples show typical outputs?
42. What examples show edge cases?
43. Is the output self-describing? (Can you understand it without docs?)

### Evolution

44. How will output format changes be communicated?
45. Should output be versioned?
46. What fields might be added in the future?
47. What fields might be deprecated?

### Output Modality (for multi-modal outputs)

> Some tools return content in multiple modalities—text, images, audio, structured data.

48. What modalities can this tool return? (Text, images, audio, video, structured data)
49. For each modality:
    - When is this modality returned?
    - What format is used? (Plain text, markdown, base64, JSON schema)
    - What are the size/resolution constraints?
50. Can multiple modalities be returned in the same response?
51. How does the caller know which modalities to expect?

### Attribution & Sources (for tools that reference external information)

> Some tools return information derived from external sources that should be attributed.

52. Does this tool return information from external sources?
53. How are sources tracked? (URLs, titles, identifiers)
54. How are citations embedded in the content? (Inline markers, footnotes, separate list)
55. Is confidence/reliability metadata included for each source?
56. What happens if source attribution is unavailable?

---

## Outputs Deliverable

```
OUTPUTS
───────
SUCCESS:
  Structure:
    - [field]: [type] - [description]
    - [field]: [type] - [description]

  Guarantees:
    - [What is guaranteed to be true after success]

FAILURE:
  Structure:
    - error_type: [enum of error types]
    - message: [human-readable description]
    - details: [additional context]

  Guarantees:
    - [What is guaranteed even on failure]

SIDE EFFECTS:
  - [What changes in the system]

METADATA:
  - [field]: [what it communicates]

OUTPUT MODALITY (if multi-modal):
  | Modality   | When returned        | Format          | Constraints      |
  |------------|---------------------|-----------------|------------------|
  | Text       | [condition]         | [format]        | [limits]         |
  | Images     | [condition]         | [format]        | [limits]         |
  | Structured | [condition]         | [schema]        | [limits]         |

ATTRIBUTION (if sources referenced):
  Sources:     [How tracked - URLs, titles, etc.]
  Citations:   [How embedded - inline markers, footnotes]
  Confidence:  [Reliability metadata or "none"]

EXAMPLES:
  Success: [example output]
  Failure: [example error]
```

---

# Putting It All Together

## The Complete Template

After working through all seven phases, assemble your specification:

```
════════════════════════════════════════════════════════════════════
                    COMPONENT SPECIFICATION
════════════════════════════════════════════════════════════════════

PURPOSE
───────
Name:
Category:
Purpose:
Excludes:

INPUTS
──────
Required:
Optional:
Constraints:
Embedded Resources (if applicable):
Conditional Requirements (if applicable):

PRECONDITIONS
─────────────
Preconditions:
  1.
  2.
Validation Order:

CONSTRAINTS
───────────
Invariants:
Limits:
Approval:
Tool Exclusivity (if applicable):
Network Trust Boundaries (if applicable):

ERROR HANDLING
──────────────
Failure Modes:
Retry Policy:
Fallback Tiers (if applicable):
Escalation:

EXECUTION LOGIC
───────────────
Steps:
  1.
  2.
States (if applicable):
Hooks:
Lifecycle Requirements (if applicable):
Multi-Turn Pattern (if applicable):
Streaming Behavior (if applicable):
Transformation Pipeline (if applicable):

OUTPUTS
───────
Success Output:
Failure Output:
Side Effects:
Guarantees:
Output Modality (if applicable):
Attribution (if applicable):

════════════════════════════════════════════════════════════════════
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT DESIGN FRAMEWORK                    │
│                                                                 │
│   Purpose           What ONE thing does this do?                │
│                     → Single responsibility, clear boundaries   │
│                                                                 │
│   Inputs            What does it need?                          │
│                     → Types, validation rules, defaults         │
│                     → Embedded resources, conditional reqs      │
│                                                                 │
│   Preconditions     What must be true before running?           │
│                     → Fail fast, actionable error messages      │
│                                                                 │
│   Constraints       What boundaries can never be crossed?       │
│                     → Security, limits, approval gates          │
│                     → Tool exclusivity, network boundaries      │
│                                                                 │
│   Error Handling    What can go wrong? How do we handle it?     │
│                     → Errors, retries, fallback tiers           │
│                                                                 │
│   Execution Logic   How does it execute?                        │
│                     → Steps, states, loops, hooks               │
│                     → Lifecycle, multi-turn, streaming          │
│                                                                 │
│   Outputs           What does it return or produce?             │
│                     → Results, side effects, guarantees         │
│                     → Multi-modal output, attribution           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Advanced Patterns Checklist

Use this checklist for complex tools. Skip if not applicable:

```
□ Embedded Resources    — Does input contain URLs, paths, or code to extract?
□ Conditional Inputs    — Are some inputs required only when others have specific values?
□ Tool Exclusivity      — Does this tool block other tools while active?
□ Network Boundaries    — Different handling for public vs private IPs?
□ Fallback Tiers        — Multiple degradation strategies with different tradeoffs?
□ Lifecycle Required    — Mandatory init (launch) and cleanup (close) actions?
□ Multi-Turn            — Operates across conversation turns with feedback loops?
□ Streaming             — Produces incremental output during execution?
□ Transformation        — Multi-stage content processing pipeline?
□ Multi-Modal Output    — Returns text, images, audio, or structured data?
□ Attribution           — Sources and citations for external information?
```

---

## Applying the Framework at Different Scales

The framework works at every level of abstraction:

| Scale | Purpose Example | Inputs Example |
|-------|-----------------|----------------|
| **Function** | "Calculate tax for an order" | `order: Order, rate: number` |
| **Tool** | "Read a file from disk" | `path: string, encoding?: string` |
| **Service** | "Process payment transactions" | `POST /payments { amount, currency, source }` |
| **Agent** | "Assist with coding tasks" | `task: string, context: Context` |
| **System** | "E-commerce platform" | User requests, inventory data, payment info |

The questions scale with the component—larger components have more complex answers, but the questions remain the same.

---

## When to Use This Framework

**Always use when:**
- Building something new
- The requirements are unclear
- Multiple people need to agree on behavior
- The component will be used by others
- Mistakes would be costly to fix later

**Skip or abbreviate when:**
- Making a trivial change
- Prototyping to learn (but use before production)
- The component is temporary/throwaway

---

## References

### Books

- Meyer, Bertrand. *Object-Oriented Software Construction*, 2nd ed. Prentice Hall, 1997.
- Martin, Robert C. *Clean Code: A Handbook of Agile Software Craftsmanship*. Prentice Hall, 2008.
- Martin, Robert C. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.
- Hunt, Andrew and Thomas, David. *The Pragmatic Programmer*. Addison-Wesley, 1999.
- Gamma, Helm, Johnson, Vlissides. *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley, 1994.
- Nygard, Michael. *Release It! Design and Deploy Production-Ready Software*, 2nd ed. Pragmatic Bookshelf, 2018.
- Evans, Eric. *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley, 2003.
- Brooks, Fred. *The Mythical Man-Month*. Addison-Wesley, 1975.
- Meyers, Scott. *Effective C++*, 3rd ed. Addison-Wesley, 2005.

### Principles

- **Single Responsibility Principle**: A component should have one, and only one, reason to change.
- **Design by Contract**: Specify preconditions, postconditions, and invariants explicitly.
- **Fail Fast**: Detect errors as early as possible and report them clearly.
- **Defense in Depth**: Multiple layers of protection, never rely on a single check.
- **Separation of Concerns**: Different concerns should be handled by different components.

---

## License

This framework is provided for educational purposes. Use it, adapt it, share it.

---

*"Weeks of coding can save you hours of planning."* — Unknown
