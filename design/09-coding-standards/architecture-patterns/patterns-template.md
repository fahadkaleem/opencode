# Pattern Documentation Template Guide

> **Purpose**: This document defines the standardized template for all pattern documentation files in this directory. Use this guide when creating new pattern documents or refactoring existing ones.

---

## Table of Contents

- [Overview](#overview)
- [Why Use This Template](#why-use-this-template)
- [Template Structure](#template-structure)
- [Section-by-Section Guide](#section-by-section-guide)
- [Writing Guidelines](#writing-guidelines)
- [Example Pattern Document](#example-pattern-document)
- [Quality Checklist](#quality-checklist)

---

## Overview

Every pattern document in this directory follows a consistent, standardized structure. This template ensures:

- **Consistency**: All documents have the same sections in the same order
- **Scannability**: Readers can quickly find what they need
- **Completeness**: No important information is missing
- **Maintainability**: Easy to update and keep current

Each document covers one category of patterns (e.g., Type Safety, Error Handling, Testing) and contains multiple related patterns within that category.

---

## Why Use This Template

### For Quick Reference Users

- **Front Matter**: Shows status, last update, and related documents at a glance
- **Table of Contents**: Jump directly to the pattern they need
- **Quick Reference Section**: Summary table and code snippets for copy-paste
- **Visual Markers**: Clear bad/good indicators for scanning

### For In-Depth Learners

- **Progressive Disclosure**: Intent → Problem → Solution → Implementation
- **Complete Examples**: Full working code, not fragments
- **When to Use/Avoid**: Clear guidance on applicability
- **Common Mistakes**: Learn from typical errors
- **Testing Strategy**: How to verify correct implementation

### For Maintainers

- **Structured Updates**: Know exactly where to add information
- **Changelog**: Track document evolution
- **Status Field**: Mark documents as draft/stable/deprecated
- **Consistent Format**: Easy to review and compare

---

## Template Structure

Every pattern document must include these sections in this exact order:

1. **Front Matter** (YAML)
2. **Title and Purpose**
3. **Table of Contents**
4. **Overview**
5. **Individual Patterns** (multiple)
6. **Quick Reference**
7. **Enforcement** (if applicable)
8. **Related Patterns**
9. **References**
10. **Changelog**

---

## Section-by-Section Guide

### 1. Front Matter (YAML)

**Purpose**: Machine-readable metadata for automation and indexing.

**Required Fields**:

```yaml
---
title: [Category Name] Patterns
category: architecture-patterns
status: stable | draft | deprecated
last_updated: YYYY-MM-DD
applies_to:
  - Component 1
  - Component 2
related_patterns:
  - ../XX-other-pattern.md#section
  - ../YY-another-pattern.md
---
```

**Field Descriptions**:

- `title`: Full name of the pattern category
- `category`: Always "architecture-patterns" for this directory
- `status`:
  - `draft` - Work in progress, may change
  - `stable` - Production-ready, changes need review
  - `deprecated` - No longer recommended, migration guide provided
- `last_updated`: Date of last substantive update (YYYY-MM-DD format)
- `applies_to`: List of system components using these patterns
- `related_patterns`: Links to other pattern documents with relevant sections

**Example**:

```yaml
---
title: Type Safety Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-15
applies_to:
  - Core Package
  - CLI Package
  - Test Utilities
related_patterns:
  - ../04-error-handling-patterns.md#type-guards
  - ../05-testing-patterns.md#mock-objects
---
```

---

### 2. Title and Purpose

**Purpose**: Immediate document identification and value proposition.

**Format**:

```markdown
# [Number]. [Category Name] Patterns

> **Purpose**: [Single sentence describing what patterns are covered and why they matter]
```

**Guidelines**:

- **Title**: Include the number (01-17) and full category name
- **Purpose**: One clear sentence, 15-25 words
- **Focus**: State the benefit, not just the content
- **Tone**: Direct and informative

**Examples**:

**Good**:

```markdown
# 3. Type Safety Patterns

> **Purpose**: Comprehensive type safety patterns using TypeScript features to eliminate runtime type errors and improve code reliability.
```

**Bad** (too vague):

```markdown
# Type Safety

> **Purpose**: This document covers types.
```

---

### 3. Table of Contents

**Purpose**: Quick navigation to specific patterns or sections.

**Format**:

```markdown
## Table of Contents

- [Overview](#overview)
- [Pattern 1: Pattern Name](#pattern-1-pattern-name)
- [Pattern 2: Another Pattern](#pattern-2-another-pattern)
- [Pattern N: Last Pattern](#pattern-n-last-pattern)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)
```

**Guidelines**:

- Use exact heading text for anchor links
- Include all major patterns
- Include standard sections (Overview, Quick Reference, etc.)
- Keep it concise - don't include sub-sections

---

### 4. Overview

**Purpose**: Set context for the entire document and explain why these patterns matter.

**Format**:

```markdown
## Overview

[2-3 paragraphs explaining the overall category and its importance]

**Why [category] matters:**

- Reason 1
- Reason 2
- Reason 3

**In this document:**

- **Pattern 1** - Brief one-line description
- **Pattern 2** - Brief one-line description
- **Pattern N** - Brief one-line description

**Prerequisites:**

- Required knowledge item 1
- Required knowledge item 2
- Link to foundational concepts if needed
```

**Guidelines**:

- Start with context (2-3 paragraphs)
- Explain the "why" before the "what"
- List all patterns with brief descriptions
- State prerequisites to help readers assess readiness
- Keep it high-level - details come in individual patterns

**Example**:

```markdown
## Overview

Type safety in TypeScript provides compile-time guarantees about data types, preventing entire categories of runtime errors. By leveraging TypeScript's type system correctly, we eliminate bugs, improve IDE support, and make refactoring safer.

Proper type safety goes beyond basic type annotations. It includes strategic use of `unknown` over `any`, type guards for runtime checking, discriminated unions for state management, and runtime validation for external data.

**Why type safety matters:**

- Catch errors at compile time, not runtime
- Enable confident refactoring with compiler verification
- Provide excellent IDE autocomplete and IntelliSense
- Document code structure through types
- Reduce need for defensive programming

**In this document:**

- **No Any Types** - Using `unknown` with type narrowing instead of `any`
- **Type Guards** - Functions that narrow types at runtime
- **Discriminated Unions** - Type-safe variant handling
- **Explicit Return Types** - Required return type annotations
- **Generic Types** - Flexible, reusable type-safe abstractions
- **Runtime Validation** - Validating external data with Zod

**Prerequisites:**

- Solid understanding of TypeScript basics
- Familiarity with union and intersection types
- Experience with TypeScript compiler options
```

---

### 5. Individual Pattern Structure

**Purpose**: Document each specific pattern with complete, actionable information.

**Format** (each pattern follows this structure):

```markdown
## Pattern [N]: [Pattern Name]

### Intent

[Single sentence describing what this pattern solves]

### Problem

[2-4 sentences describing the challenge this pattern addresses. Be specific about pain points.]

### Solution

[2-4 sentences describing the approach at a high level. Don't include code yet.]

### Structure

[Visual representation: diagram, ASCII art, or minimal code showing structure]
```

[Optional structure diagram or minimal code outline]

````

### Implementation

**Step-by-step implementation guide:**

1. **Step One Name**: Description of what this accomplishes
   ```typescript
   // Code for step one
````

2. **Step Two Name**: Description of what this accomplishes

   ```typescript
   // Code for step two
   ```

3. **Step Three Name**: Description of what this accomplishes
   ```typescript
   // Code for step three
   ```

### Complete Example

```typescript
// Full, self-contained working example
// Include all necessary imports
// Show the pattern in real-world context
// Use meaningful variable names
// Add inline comments for clarity
```

**Example explained:**

- Lines 1-5: [Explanation of what this section does]
- Lines 6-12: [Explanation of what this section does]
- Lines 13+: [Explanation of what this section does]

### When to Use

**Use this pattern when:**

- Specific condition or scenario 1
- Specific condition or scenario 2
- Specific condition or scenario 3

**Avoid this pattern when:**

- Specific condition or scenario 1
- Specific condition or scenario 2
- Specific condition or scenario 3

### Benefits

- **Benefit Name**: Explanation of the benefit and its impact
- **Another Benefit**: Explanation of the benefit and its impact
- **Third Benefit**: Explanation of the benefit and its impact

### Trade-offs

- **Trade-off Name**: Description of the cost or limitation and when it matters
- **Another Trade-off**: Description of the cost or limitation and when it matters

### Common Mistakes

**Mistake 1: [Descriptive mistake name]**

❌ **Bad example:**

```typescript
// Incorrect implementation
```

✅ **Correct approach:**

```typescript
// Proper implementation
```

**Why this matters**: [Explanation of consequences]

**Mistake 2: [Another mistake name]**

❌ **Bad example:**

```typescript
// Incorrect implementation
```

✅ **Correct approach:**

```typescript
// Proper implementation
```

**Why this matters**: [Explanation of consequences]

### Testing Strategy

**What to Test:**

- [Specific aspect 1 of the pattern to verify]
- [Specific aspect 2 of the pattern to verify]
- [Edge cases and error conditions]

**Test Organization:**

- Co-locate tests with source: `pattern-name.ts` → `pattern-name.test.ts`
- Use AAA pattern (Arrange-Act-Assert)
- One `describe` block per function/class
- One `it` block per test case

**Mock Strategy:**

- [What dependencies need mocking for this pattern]
- [What should use real implementations]
- [How to create mocks (via interfaces, etc.)]

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';

describe('PatternImplementation', () => {
  // Arrange - Setup
  let testSubject: PatternClass;
  let mockDependency: MockType;

  beforeEach(() => {
    // Initialize test fixtures
    mockDependency = createMockDependency();
    testSubject = new PatternClass(mockDependency);
  });

  afterEach(() => {
    // Cleanup if needed
  });

  // Happy path test
  it('should handle valid input correctly', () => {
    // Arrange
    const input = 'valid input';

    // Act
    const result = testSubject.process(input);

    // Assert
    expect(result).to.equal('expected output');
    expect(mockDependency.wasCalled()).to.be.true;
  });

  // Error case test
  it('should throw error for invalid input', () => {
    // Arrange
    const invalidInput = null;

    // Act & Assert
    expect(() => testSubject.process(invalidInput)).to.throw('Expected error message');
  });

  // Edge case test
  it('should handle edge case appropriately', () => {
    // Arrange
    const edgeCase = '';

    // Act
    const result = testSubject.process(edgeCase);

    // Assert
    expect(result).to.exist;
    expect(result).to.equal('edge case result');
  });
});
```

**Coverage Goals:**

- Line coverage: 80%+
- Statement coverage: 80%+
- Function coverage: 80%+
- Branch coverage: 70%+

### Related Patterns

- **[Pattern Name](./file.md#section)** - Relationship description
- **[Another Pattern](./file.md)** - Relationship description

````

**Guidelines for Pattern Writing**:

1. **Intent**: Single sentence, action-oriented (e.g., "Ensure type safety when handling unknown data")
2. **Problem**: Be specific about the pain point. Use real scenarios.
3. **Solution**: High-level strategy. Save implementation details for later.
4. **Structure**: Visual if possible. Show relationships between components.
5. **Implementation**: Step-by-step. Each step should be independently understandable.
6. **Complete Example**: Full, working code. Must be copy-paste-able.
7. **When to Use**: Be explicit. Use concrete conditions, not vague guidance.
8. **Benefits**: Focus on outcomes, not features.
9. **Trade-offs**: Be honest about costs. Helps readers make informed decisions.
10. **Common Mistakes**: Use real mistakes from experience. Show bad vs good.
11. **Testing Strategy**: Comprehensive testing guide including what to test, test organization (co-located, AAA pattern), mock strategy, complete test examples with multiple cases, and coverage goals.
12. **Related Patterns**: Link to complementary or alternative patterns.

---

### 6. Quick Reference

**Purpose**: One-page cheat sheet for experienced developers who need a quick reminder.

**Format**:

```markdown
## Quick Reference

### Pattern Summary Table

| Pattern | Use When | Avoid When | Key Benefit |
|---------|----------|------------|-------------|
| Pattern 1 | [Scenario] | [Scenario] | [Primary benefit] |
| Pattern 2 | [Scenario] | [Scenario] | [Primary benefit] |
| Pattern N | [Scenario] | [Scenario] | [Primary benefit] |

### Code Snippets

**Pattern 1 - Minimal Example:**
```typescript
// Absolute minimum code to use this pattern
// Must be complete and copy-paste-ready
````

**Pattern 2 - Minimal Example:**

```typescript
// Absolute minimum code to use this pattern
// Must be complete and copy-paste-ready
```

**Pattern N - Minimal Example:**

```typescript
// Absolute minimum code to use this pattern
// Must be complete and copy-paste-ready
```

````

**Guidelines**:

- **Summary Table**: One row per pattern, concise cells
- **Code Snippets**: Minimal but complete - no placeholders
- **Self-Contained**: Should work without referencing other sections
- **Copy-Paste Ready**: Include imports if needed

---

### 7. Enforcement (if applicable)

**Purpose**: Show how to automatically enforce these patterns using tooling.

**Format**:

```markdown
## Enforcement

**ESLint Configuration:**
```json
{
  "plugins": ["@typescript-eslint"],
  "rules": {
    "rule-name": "error",
    "another-rule": ["error", { "option": "value" }]
  }
}
````

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "option": true
  }
}
```

**Pre-commit Hooks:**

```json
{
  "scripts": {
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

**Build-Time Checks:**

```bash
npm run typecheck  # Fails build if type errors
npm run lint       # Fails build if linting errors
```

````

**Guidelines**:

- Only include if automation is possible
- Provide complete, working configurations
- Show multiple enforcement layers (ESLint, TypeScript, hooks, CI)
- Link to documentation for complex rules

---

### 8. Related Patterns

**Purpose**: Cross-reference related patterns to build understanding and show relationships.

**Format**:

```markdown
## Related Patterns

- **[Pattern Name](./XX-file-name.md#pattern-section)** - Describe relationship (e.g., "Builds on this pattern", "Alternative approach", "Use together")
- **[Another Pattern](./YY-file-name.md)** - Describe relationship
- **[Third Pattern](./ZZ-file-name.md#section)** - Describe relationship
````

**Guidelines**:

- Link to specific sections when relevant
- Explain the relationship (don't just list links)
- Include patterns from other documents
- Order by relevance (most related first)

---

### 9. References

**Purpose**: Provide sources and additional learning materials.

**Format**:

```markdown
## References

**Source Code Examples:**

- [File Path](../../path/to/source.ts) - Description of what to look at
- [Another File](../../path/to/another.ts) - Description

**External Resources:**

- [Resource Name](https://example.com) - Brief description
- [Another Resource](https://example.com) - Brief description

**Further Reading:**

- [Book/Article Title](https://example.com) - Why this is relevant
```

**Guidelines**:

- Separate internal (codebase) from external references
- Always include description with links
- Link to specific files/sections, not just directories
- Verify all links work before committing

---

### 10. Changelog

**Purpose**: Track document evolution and signal freshness.

**Format**:

```markdown
## Changelog

- **YYYY-MM-DD**: Initial pattern documentation
- **YYYY-MM-DD**: Added [specific pattern/section]
- **YYYY-MM-DD**: Updated [what was updated] based on [reason]
- **YYYY-MM-DD**: Deprecated [pattern name], see [alternative]
```

**Guidelines**:

- Use reverse chronological order (newest first)
- Include date in YYYY-MM-DD format
- Be specific about what changed
- Include reason for significant changes
- Update `last_updated` in front matter when adding entries

---

## Writing Guidelines

### Language and Tone

**DO:**

- Use active voice ("Create a class" not "A class should be created")
- Write in present tense ("Use this pattern when" not "You would use")
- Be direct and concise
- Use technical terms precisely
- Explain "why" not just "what"

**DON'T:**

- Use emojis or excessive punctuation
- Use vague language ("generally", "usually", "often")
- Include personal opinions without justification
- Write in first person ("I think", "We recommend")
- Use ambiguous terms ("better", "cleaner") without explanation

### Code Examples

**Requirements:**

- All code must be syntactically correct TypeScript
- Include necessary imports
- Use meaningful variable and function names
- Add comments for non-obvious logic
- Show complete examples, not fragments
- Format consistently (use Prettier)

**Pattern for Bad/Good Comparisons:**

```typescript
// ❌ BAD: [Explanation of why this is wrong]
function badExample() {
  // Problematic code
}

// ✅ GOOD: [Explanation of why this is correct]
function goodExample() {
  // Proper implementation
}
```

### Formatting Standards

**Headers:**

- Use ATX-style headers (`#` syntax)
- Include space after `#` symbols
- Use sentence case for headers
- Maintain hierarchy (don't skip levels)

**Lists:**

- Use `-` for unordered lists (not `*` or `+`)
- Use `1.` for ordered lists (let Markdown auto-number)
- Indent nested lists with 2 spaces
- Use parallel structure (all items same grammatical form)

**Code Blocks:**

- Always specify language for syntax highlighting
- Use `typescript` for TypeScript code
- Use `json` for JSON configuration
- Use `bash` for shell commands
- Include file names as comments when helpful

**Tables:**

- Align columns for readability in source
- Keep cell content concise
- Use header row
- Don't make tables too wide (3-4 columns max)

**Links:**

- Use descriptive link text (not "click here")
- Use relative links for internal documents
- Include section anchors when referencing specific parts
- Verify all links before committing

### Length Guidelines

**Per Pattern:**

- Intent: 1 sentence
- Problem: 2-4 sentences
- Solution: 2-4 sentences
- Implementation: 3-5 steps with code
- Complete Example: 20-50 lines
- When to Use: 3-5 items per list
- Benefits: 3-5 items
- Trade-offs: 2-4 items
- Common Mistakes: 2-3 mistakes with examples
- Testing Strategy: What to test (3-5 items), test organization notes, mock strategy, complete test example with 3+ test cases, coverage goals

**Per Document:**

- Overview: 3-5 paragraphs
- Patterns: 3-8 patterns per document
- Total length: 300-500 lines per document

---

## Example Pattern Document

Below is a complete example showing the template in practice:

````markdown
---
title: Type Safety Patterns
category: architecture-patterns
status: stable
last_updated: 2025-01-15
applies_to:
  - Core Package
  - CLI Package
related_patterns:
  - ../04-error-handling-patterns.md#type-guards
  - ../05-testing-patterns.md
---

# 3. Type Safety Patterns

> **Purpose**: Comprehensive type safety patterns using TypeScript features to eliminate runtime type errors and improve code reliability.

---

## Table of Contents

- [Overview](#overview)
- [Pattern 1: No Any Types](#pattern-1-no-any-types)
- [Pattern 2: Type Guards](#pattern-2-type-guards)
- [Quick Reference](#quick-reference)
- [Enforcement](#enforcement)
- [Related Patterns](#related-patterns)

---

## Overview

Type safety in TypeScript provides compile-time guarantees about data types, preventing entire categories of runtime errors. By leveraging TypeScript's type system correctly, we eliminate bugs, improve IDE support, and make refactoring safer.

Proper type safety goes beyond basic type annotations. It includes strategic use of `unknown` over `any`, type guards for runtime checking, discriminated unions for state management, and runtime validation for external data.

**Why type safety matters:**

- Catch errors at compile time, not runtime
- Enable confident refactoring with compiler verification
- Provide excellent IDE autocomplete and IntelliSense
- Document code structure through types

**In this document:**

- **No Any Types** - Using `unknown` with type narrowing instead of `any`
- **Type Guards** - Functions that narrow types at runtime

**Prerequisites:**

- Solid understanding of TypeScript basics
- Familiarity with union and intersection types

---

## Pattern 1: No Any Types

### Intent

Eliminate unsafe `any` types by using `unknown` with explicit type narrowing.

### Problem

The `any` type disables TypeScript's type checking, allowing any operation without compiler verification. This defeats the purpose of using TypeScript and reintroduces the runtime errors TypeScript aims to prevent. Code using `any` provides no IntelliSense support and silently accepts invalid operations.

### Solution

Use `unknown` for values of truly unknown type, then narrow to specific types using type guards before performing operations. This maintains type safety while handling dynamic data.

### Structure

```typescript
function handleValue(value: unknown) {
  // Type narrowing required before use
  if (typeof value === 'string') {
    // value is string here
  } else if (typeof value === 'number') {
    // value is number here
  }
}
```
````

### Implementation

**Step 1: Replace `any` with `unknown`**

```typescript
// Change from:
function processValue(value: any) {}

// To:
function processValue(value: unknown) {}
```

**Step 2: Add type narrowing checks**

```typescript
function processValue(value: unknown): string {
  // Narrow the type before using
  if (typeof value === 'string') {
    return value.toUpperCase();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  throw new Error(`Unsupported type: ${typeof value}`);
}
```

**Step 3: Extract type guards for reuse**

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function processValue(value: unknown): string {
  if (isString(value)) {
    return value.toUpperCase();
  }
  throw new Error(`Expected string, got ${typeof value}`);
}
```

### Complete Example

```typescript
// Type guard helpers
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Function using unknown with type narrowing
function formatValue(value: unknown): string {
  if (isString(value)) {
    return value.toUpperCase();
  }

  if (isNumber(value)) {
    return value.toFixed(2);
  }

  if (isRecord(value) && 'toString' in value) {
    return String(value.toString());
  }

  throw new Error(`Cannot format value of type: ${typeof value}`);
}

// Usage
const result1 = formatValue('hello'); // "HELLO"
const result2 = formatValue(123.456); // "123.46"
const result3 = formatValue({ toString: () => 'custom' }); // "custom"
// formatValue(true); // Throws error at runtime, caught by TypeScript
```

**Example explained:**

- Lines 1-11: Define reusable type guard functions for common types
- Lines 14-26: Use type guards to safely handle different value types
- Lines 29-32: Demonstrate usage with type-safe function calls

### When to Use

**Use `unknown` when:**

- Handling data from external sources (API responses, file reads)
- Working with third-party libraries with poor type definitions
- Deserializing JSON or parsing user input
- Writing generic utilities that work with any type

**Avoid `unknown` when:**

- Type is actually known at compile time
- Working with internal, well-typed code
- Generic types (`T`) would be more appropriate

### Benefits

- **Type Safety**: Compiler enforces narrowing before operations
- **IntelliSense**: Full IDE support after type narrowing
- **Refactoring**: Changes caught at compile time
- **Documentation**: Types document expected data shapes

### Trade-offs

- **Verbosity**: Requires explicit type checking code
- **Runtime Overhead**: Type guards execute at runtime
- **Learning Curve**: Developers must understand type narrowing

### Common Mistakes

**Mistake 1: Using type assertions instead of narrowing**

❌ **Bad example:**

```typescript
function processValue(value: unknown): string {
  return (value as string).toUpperCase();
  // No runtime check, crashes if value isn't a string
}
```

✅ **Correct approach:**

```typescript
function processValue(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Expected string');
  }
  return value.toUpperCase();
}
```

**Why this matters**: Type assertions bypass type checking. If value isn't actually a string, the code crashes at runtime.

**Mistake 2: Not handling all cases**

❌ **Bad example:**

```typescript
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  // What happens if value isn't a string?
}
```

✅ **Correct approach:**

```typescript
function processValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  throw new Error(`Expected string, got ${typeof value}`);
}
```

**Why this matters**: Implicit returns of undefined cause bugs. Always handle the fallthrough case.

### Testing Strategy

**What to Test:**

- Type narrowing correctly identifies types
- Operations only execute after narrowing
- Error thrown for unsupported types
- All type branches are covered

**Test Organization:**

- Co-locate test: `formatValue.ts` → `formatValue.test.ts`
- Use AAA pattern for each test
- Group related tests in describe blocks

**Mock Strategy:**

- No mocks needed - pure function
- Use real type values for testing

**Test Example:**

```typescript
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { formatValue } from './formatValue.js';

describe('formatValue', () => {
  // Happy path - string
  it('should format strings correctly', () => {
    // Arrange
    const input = 'hello';

    // Act
    const result = formatValue(input);

    // Assert
    expect(result).to.equal('HELLO');
  });

  // Happy path - number
  it('should format numbers correctly', () => {
    // Arrange
    const input = 123.456;

    // Act
    const result = formatValue(input);

    // Assert
    expect(result).to.equal('123.46');
  });

  // Error case - boolean
  it('should throw for unsupported types', () => {
    // Arrange & Act & Assert
    expect(() => formatValue(true)).to.throw('Cannot format value');
  });

  // Error case - null
  it('should throw for null values', () => {
    // Arrange & Act & Assert
    expect(() => formatValue(null)).to.throw('Cannot format value');
  });
});
```

**Coverage Goals:**

- Line coverage: 100% (small function)
- Branch coverage: 100% (all type paths tested)

### Related Patterns

- **[Type Guards](./03-type-safety-patterns.md#pattern-2-type-guards)** - Essential companion pattern for narrowing
- **[Runtime Validation](./03-type-safety-patterns.md#pattern-6-runtime-validation)** - For validating external data

---

## Pattern 2: Type Guards

[... similar structure for next pattern ...]

---

## Quick Reference

### Pattern Summary Table

| Pattern      | Use When               | Avoid When          | Key Benefit         |
| ------------ | ---------------------- | ------------------- | ------------------- |
| No Any Types | Handling external data | Internal typed code | Compile-time safety |
| Type Guards  | Runtime type checking  | Type already known  | Type narrowing      |

### Code Snippets

**No Any Types - Minimal Example:**

```typescript
function handleValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  throw new Error('Expected string');
}
```

**Type Guards - Minimal Example:**

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

---

## Enforcement

**ESLint Configuration:**

```json
{
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error"
  }
}
```

**TypeScript Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Related Patterns

- **[Error Handling Patterns](./04-error-handling-patterns.md)** - Use type guards for error checking
- **[Testing Patterns](./05-testing-patterns.md)** - Test type guard functions

---

## References

**External Resources:**

- [TypeScript Handbook - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) - Official guide to type narrowing
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) - Type predicate functions

---

## Changelog

- **2025-01-15**: Initial type safety patterns documentation
- **2025-01-16**: Added common mistakes section with examples
- **2025-01-17**: Updated testing examples for clarity

```

---

## Quality Checklist

Before considering a pattern document complete, verify:

### Content Completeness

- [ ] Front matter includes all required fields
- [ ] Title and purpose statement present
- [ ] Table of contents includes all sections
- [ ] Overview explains "why" not just "what"
- [ ] Every pattern has all 12 required subsections
- [ ] Quick reference section with table and snippets
- [ ] Enforcement section (if applicable)
- [ ] Related patterns section with descriptions
- [ ] References section with working links
- [ ] Changelog with at least initial entry

### Code Quality

- [ ] All code examples are syntactically correct
- [ ] Examples include necessary imports
- [ ] Complete examples are 20-50 lines
- [ ] Code uses meaningful names
- [ ] Each example has explanatory comments
- [ ] Bad/good comparisons use ❌/✅ markers
- [ ] Code snippets are copy-paste-ready

### Writing Quality

- [ ] Active voice throughout
- [ ] Present tense
- [ ] No emojis
- [ ] No vague language
- [ ] Technical terms used precisely
- [ ] Consistent formatting
- [ ] No spelling or grammar errors
- [ ] Appropriate length (300-500 lines)

### Navigation and Links

- [ ] All internal links work correctly
- [ ] Anchor links match actual headers
- [ ] External links verified
- [ ] Related patterns include descriptions
- [ ] Cross-references use specific sections

### Consistency

- [ ] Follows template structure exactly
- [ ] Section order matches template
- [ ] Formatting matches other documents
- [ ] Naming conventions followed
- [ ] Same level of detail as similar documents

---

## Applying This Template

### For New Documents

1. Copy the front matter section and fill in fields
2. Add title and purpose statement
3. Create table of contents with your patterns
4. Write overview section
5. Write each pattern following the 12-subsection structure
6. Add quick reference table and snippets
7. Add enforcement section if applicable
8. List related patterns with relationships
9. Add references and resources
10. Create initial changelog entry

### For Refactoring Existing Documents

1. Read the existing document completely
2. Extract patterns and examples (preserve all content)
3. Create new file with proper front matter
4. Reorganize content into template structure
5. Add missing sections (Intent, Problem, When to Use, etc.)
6. Generalize examples (remove specific references)
7. Add bad/good code comparisons
8. Create quick reference section
9. Update with changelog noting refactor
10. Verify all content is preserved

### Testing Your Document

1. Read through as if you're unfamiliar with the patterns
2. Try to follow a pattern implementation from scratch
3. Verify all code examples compile
4. Check that all links work
5. Ensure quick reference is truly quick
6. Confirm no information is missing
7. Ask: "Could I implement this from this document alone?"

---

## Conclusion

This template ensures all pattern documents are consistent, complete, and useful for both quick reference and deep learning. Follow this guide when creating new documents or refactoring existing ones.

**Key Principles:**
- Consistency enables scanning
- Structure enables learning
- Examples enable implementation
- Completeness enables independence

Every section has a purpose. Don't skip sections or change the order. If a section doesn't apply, explicitly state "Not applicable" with a reason.
```
