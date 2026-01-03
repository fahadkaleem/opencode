# Specification Analysis Command

**Task ID:** {{task_id}}

You are an expert specification analyzer. Your task is to read and deeply
analyze the project specification to extract all key information needed for
implementation.

## Input Specification

Read the specification file from one of these locations (check in order):

1. `.alfred/specs/{{task_id}}-spec.md`
2. `docs/spec.md`
3. `docs/template/detailed-spec.md` (use as fallback if no spec exists)

## Analysis Output

Analyze the specification and extract the following information into a
structured format. Save your analysis to
`.alfred/tasks/{{task_id}}/artifacts/spec-analysis.json`:

```json
{
  "project_name": "string",
  "overview": "string - 1-2 paragraph summary",
  "success_definition": {
    "product_perspective": "string",
    "engineering_perspective": "string"
  },
  "user_journeys": [
    {
      "id": "UJ-001",
      "description": "As a [user type], I want to [action], so that [benefit]"
    }
  ],
  "requirements": {
    "functional": [
      {
        "id": "REQ-001",
        "priority": "P0|P1|P2|P3",
        "description": "string"
      }
    ],
    "non_functional": [
      {
        "id": "REQ-NFR-001",
        "priority": "P0|P1|P2|P3",
        "description": "string"
      }
    ]
  },
  "assumptions": ["string"],
  "out_of_scope": ["string"],
  "architecture": {
    "approach": "string - high-level technical approach",
    "components": [
      {
        "name": "string",
        "description": "string",
        "type": "service|ui|api|database|other"
      }
    ],
    "technologies": {
      "frontend": "string",
      "backend": "string",
      "database": "string",
      "other": ["string"]
    }
  },
  "testing_strategy": {
    "unit_tests": "string",
    "integration_tests": "string",
    "e2e_tests": "string"
  },
  "optional_sections": {
    "auth": "string",
    "dependencies": ["string"],
    "observability": {
      "logging": "string",
      "metrics": "string",
      "monitoring": "string"
    }
  }
}
```

## Analysis Guidelines

1. **Requirement Extraction:** Identify ALL requirements with their IDs (REQ-XXX
   format) and priority levels (P0-P3)
2. **Component Identification:** Extract all major components mentioned in the
   Design section
3. **Technology Stack:** Identify all technologies, frameworks, and libraries
   mentioned
4. **Architecture Understanding:** Understand the high-level architecture and
   how components interact
5. **Test Coverage:** Note the testing strategy and what types of tests are
   required
6. **Constraints:** Capture assumptions, dependencies, and out-of-scope items

## Context for Next Steps

Your analysis will be used by:

- `spec:decompose` - To break down into implementable tasks
- `impl:from-spec` - To guide code generation
- `validate:against-spec` - To verify implementation completeness

## Output

After creating the analysis file, output a human-readable summary:

### Specification Analysis Complete

**Project:** [project_name]

**Requirements Summary:**

- P0 Requirements: [count]
- P1 Requirements: [count]
- P2 Requirements: [count]
- P3 Requirements: [count]

**Architecture:**

- [component count] major components identified
- Tech stack: [list key technologies]

**Next Steps:** Run `alfred run spec:decompose --task {{task_id}}` to break down
into implementation tasks.

---

**Analysis saved to:** `.alfred/tasks/{{task_id}}/artifacts/spec-analysis.json`
