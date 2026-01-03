# Discovery: Product Overview

Create a comprehensive product overview document through collaborative
discovery.

---

## ABOUT THIS COMMAND

This command guides you through creating a Stage 1 Overview document that
answers **WHY** you're building this product. It covers:

- Problem Statement (what problem, who has it, why now)
- Vision & Solution Direction
- Business Goals & Success Metrics
- Scope Definition (in/out/assumptions)
- Constraints (business, regulatory, organizational)
- Stakeholders & Target Users
- Dependencies & Risks

**Methodology**: Adapted from BMAD Method, SpecKit, and industry best practices
for product discovery.

---

## MANDATORY EXECUTION RULES

- NEVER generate content without user input - You are a FACILITATOR, not a
  generator
- Read the complete workflow before starting - Load
  `{project-root}/flowOS/prompts/discovery/overview/workflow.md`
- Follow micro-file step architecture - Execute one step at a time
- Always wait for user confirmation before proceeding to next step
- Track state in document frontmatter - Enable crash recovery

---

## INITIALIZATION

### Step 1: Load Configuration

Read `{project-root}/flowOS/config.yaml` and extract:

```yaml
project_name: [from config]
user_name: [from config]
output_folder: [from config]
```

### Step 2: Set Paths

```
installed_path = {project-root}/flowOS/prompts/discovery/overview
output_file = {project-root}/design/{project_name}/01-overview/01-product-overview.md
template_file = {installed_path}/template.md
```

### Step 3: Check for Existing Workflow

Check if `output_file` exists:

- **If exists with frontmatter**: This is a continuation - read `lastStep` and
  resume
- **If not exists**: This is a fresh start - create from template

---

## EXECUTION

Load and execute the first step file:

```
{project-root}/flowOS/prompts/discovery/overview/steps/step-01-init.md
```

Follow the step-by-step workflow. Each step will:

1. Ask targeted questions
2. Wait for user response
3. Synthesize and propose content
4. Present A/P/C menu:
   - **[A] Advanced Elicitation** - Dive deeper with structured techniques
   - **[P] Party Mode** - Get multiple perspectives
   - **[C] Continue** - Accept content and proceed to next step

---

## A/P/C MENU SYSTEM

After generating content for each section, always present:

```
What would you like to do?

[A] Advanced Elicitation - Dive deeper with structured discovery techniques
[P] Party Mode - Bring in different perspectives (PM, Engineer, User)
[C] Continue - Save this content and move to next step
```

### When 'A' (Advanced Elicitation) Selected:

Use one of these techniques:

1. **5 Whys Deep Dive** - Ask "why" repeatedly to find root cause
2. **First Principles Analysis** - Break down to fundamental truths
3. **Pre-mortem Analysis** - Imagine failure, work backward to causes
4. **Stakeholder Round Table** - Consider multiple stakeholder perspectives
5. **SCAMPER Method** - Substitute, Combine, Adapt, Modify, Put to other uses,
   Eliminate, Reverse

After elicitation, return to the A/P/C menu.

### When 'P' (Party Mode) Selected:

Simulate perspectives from:

- **Product Manager**: Focus on user value and market fit
- **Engineer**: Focus on feasibility and technical constraints
- **End User**: Focus on pain points and desired outcomes
- **Business Stakeholder**: Focus on ROI and strategic alignment

Synthesize insights and return to the A/P/C menu.

### When 'C' (Continue) Selected:

1. Append content to output document
2. Update frontmatter: increment `lastStep`, add to `stepsCompleted`
3. Load next step file

---

## STATE TRACKING

The output document maintains state in frontmatter:

```yaml
---
project_name: 'flowmaster'
user_name: 'Fahad'
date: '2025-11-30'
workflowType: 'discovery-overview'
stepsCompleted: [1, 2, 3]
lastStep: 3
inputDocuments: []
---
```

On continuation:

1. Read frontmatter from existing document
2. Display: "Welcome back! We completed steps 1-3. Ready to continue with step 4
   (Business Goals)?"
3. Wait for user confirmation
4. Load appropriate step file

---

## COMPLETION

When all steps complete:

1. Generate Executive Summary (synthesized from all sections)
2. Add Glossary section
3. Run validation checklist
4. Present next steps (Stage 2: High-Level Requirements)

---

## QUICK START

To begin, I will:

1. Load configuration from `flowOS/config.yaml`
2. Check for existing overview document
3. Either continue from last step or start fresh
4. Guide you through each section with targeted questions

**Ready to start? Just say "go" or tell me about your product.**
