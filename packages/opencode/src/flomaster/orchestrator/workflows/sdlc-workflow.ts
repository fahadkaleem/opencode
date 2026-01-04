/**
 * SDLC Workflow Definition
 *
 * A realistic multi-step workflow demonstrating FloMaster's value:
 * - Research → Plan → Implement → Review
 * - Each step uses a specialized agent with appropriate permissions
 * - Context passes between steps via {{stepId.response}}
 * - Each step gets fresh context (no accumulated history)
 */

import type { WorkflowData } from "../types.js"

/**
 * Software Development Lifecycle workflow.
 *
 * Flow:
 *   Input → Research Agent → Plan Agent → Implement Agent → Review Agent
 *
 * Each step receives the output from the previous step, enabling
 * a coherent multi-step development process with context isolation.
 */
export const sdlcWorkflow: WorkflowData = {
  nodes: [
    // Step 0: User Input
    {
      id: "input",
      type: "genericNode",
      position: { x: 0, y: 0 },
      data: {
        id: "input",
        node: {
          displayName: "User Input",
          documentation: "The task description from the user",
          baseClasses: ["Input"],
          template: {
            prompt: {
              name: "prompt",
              displayName: "Task Description",
              type: "str",
              value: "",
              isRequired: true,
              isAdvanced: false,
            },
          },
          outputs: [{ name: "prompt", displayName: "Task", method: "output", types: ["string"] }],
        },
      },
    },

    // Step 1: Research Agent
    {
      id: "research",
      type: "genericNode",
      position: { x: 200, y: 0 },
      data: {
        id: "research",
        node: {
          displayName: "Research",
          documentation: "Analyze codebase and gather information",
          baseClasses: ["Agent"],
          template: {
            prompt: {
              name: "prompt",
              displayName: "Prompt",
              type: "str",
              value: `You are researching for this task: {{input.prompt}}

Analyze the codebase to understand:
1. What files and components are relevant
2. What patterns and conventions are used
3. What dependencies or constraints exist

Provide a structured summary of your findings.`,
              isRequired: true,
              isAdvanced: false,
            },
            agent_type: {
              name: "agent_type",
              displayName: "Agent Type",
              type: "str",
              value: "research-agent",
              isRequired: true,
              isAdvanced: false,
            },
          },
          outputs: [{ name: "response", displayName: "Research Findings", method: "output", types: ["string"] }],
        },
      },
    },

    // Step 2: Plan Agent
    {
      id: "plan",
      type: "genericNode",
      position: { x: 400, y: 0 },
      data: {
        id: "plan",
        node: {
          displayName: "Plan",
          documentation: "Create implementation plan based on research",
          baseClasses: ["Agent"],
          template: {
            prompt: {
              name: "prompt",
              displayName: "Prompt",
              type: "str",
              value: `Based on this research:

{{research.response}}

Create a detailed implementation plan for: {{input.prompt}}

Include:
1. Specific files to create or modify
2. Step-by-step implementation order
3. Key considerations and edge cases
4. Success criteria`,
              isRequired: true,
              isAdvanced: false,
            },
            agent_type: {
              name: "agent_type",
              displayName: "Agent Type",
              type: "str",
              value: "plan-agent",
              isRequired: true,
              isAdvanced: false,
            },
          },
          outputs: [{ name: "response", displayName: "Implementation Plan", method: "output", types: ["string"] }],
        },
      },
    },

    // Step 3: Implement Agent
    {
      id: "implement",
      type: "genericNode",
      position: { x: 600, y: 0 },
      data: {
        id: "implement",
        node: {
          displayName: "Implement",
          documentation: "Execute the implementation plan",
          baseClasses: ["Agent"],
          template: {
            prompt: {
              name: "prompt",
              displayName: "Prompt",
              type: "str",
              value: `Execute this implementation plan:

{{plan.response}}

Original task: {{input.prompt}}

Follow the plan step by step. After making changes, report what was done.`,
              isRequired: true,
              isAdvanced: false,
            },
            agent_type: {
              name: "agent_type",
              displayName: "Agent Type",
              type: "str",
              value: "implement-agent",
              isRequired: true,
              isAdvanced: false,
            },
          },
          outputs: [{ name: "response", displayName: "Implementation Report", method: "output", types: ["string"] }],
        },
      },
    },

    // Step 4: Review Agent
    {
      id: "review",
      type: "genericNode",
      position: { x: 800, y: 0 },
      data: {
        id: "review",
        node: {
          displayName: "Review",
          documentation: "Review the implementation",
          baseClasses: ["Agent"],
          template: {
            prompt: {
              name: "prompt",
              displayName: "Prompt",
              type: "str",
              value: `Review the implementation for: {{input.prompt}}

Implementation report:
{{implement.response}}

Original plan:
{{plan.response}}

Check for:
1. Correctness - does it meet the requirements?
2. Code quality - follows conventions?
3. Potential issues - bugs, security, performance?
4. Missing items - anything from the plan not implemented?

Provide your review with specific feedback.`,
              isRequired: true,
              isAdvanced: false,
            },
            agent_type: {
              name: "agent_type",
              displayName: "Agent Type",
              type: "str",
              value: "review-agent",
              isRequired: true,
              isAdvanced: false,
            },
          },
          outputs: [{ name: "response", displayName: "Review Results", method: "output", types: ["string"] }],
        },
      },
    },
  ],

  edges: [
    // Input → Research
    {
      id: "e-input-research",
      source: "input",
      target: "research",
      sourceHandle: JSON.stringify({
        dataType: "string",
        id: "input-output-prompt",
        name: "prompt",
        outputTypes: ["string"],
      }),
      targetHandle: JSON.stringify({
        fieldName: "prompt",
        id: "research-input-prompt",
        inputTypes: ["string"],
        type: "str",
      }),
      data: {
        sourceHandle: { dataType: "string", id: "input-output-prompt", name: "prompt", outputTypes: ["string"] },
        targetHandle: { fieldName: "prompt", id: "research-input-prompt", inputTypes: ["string"], type: "str" },
      },
    },

    // Research → Plan
    {
      id: "e-research-plan",
      source: "research",
      target: "plan",
      sourceHandle: JSON.stringify({
        dataType: "string",
        id: "research-output-response",
        name: "response",
        outputTypes: ["string"],
      }),
      targetHandle: JSON.stringify({
        fieldName: "prompt",
        id: "plan-input-prompt",
        inputTypes: ["string"],
        type: "str",
      }),
      data: {
        sourceHandle: { dataType: "string", id: "research-output-response", name: "response", outputTypes: ["string"] },
        targetHandle: { fieldName: "prompt", id: "plan-input-prompt", inputTypes: ["string"], type: "str" },
      },
    },

    // Plan → Implement
    {
      id: "e-plan-implement",
      source: "plan",
      target: "implement",
      sourceHandle: JSON.stringify({
        dataType: "string",
        id: "plan-output-response",
        name: "response",
        outputTypes: ["string"],
      }),
      targetHandle: JSON.stringify({
        fieldName: "prompt",
        id: "implement-input-prompt",
        inputTypes: ["string"],
        type: "str",
      }),
      data: {
        sourceHandle: { dataType: "string", id: "plan-output-response", name: "response", outputTypes: ["string"] },
        targetHandle: { fieldName: "prompt", id: "implement-input-prompt", inputTypes: ["string"], type: "str" },
      },
    },

    // Implement → Review
    {
      id: "e-implement-review",
      source: "implement",
      target: "review",
      sourceHandle: JSON.stringify({
        dataType: "string",
        id: "implement-output-response",
        name: "response",
        outputTypes: ["string"],
      }),
      targetHandle: JSON.stringify({
        fieldName: "prompt",
        id: "review-input-prompt",
        inputTypes: ["string"],
        type: "str",
      }),
      data: {
        sourceHandle: { dataType: "string", id: "implement-output-response", name: "response", outputTypes: ["string"] },
        targetHandle: { fieldName: "prompt", id: "review-input-prompt", inputTypes: ["string"], type: "str" },
      },
    },
  ],
}
