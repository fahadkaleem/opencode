/**
 * Test Workflow Definition
 *
 * Simple echo workflow for testing the orchestrator integration.
 * Flow: Input -> Agent (echoes/responds to the input)
 */

import type { WorkflowData } from "../types.js"

/**
 * Simple test workflow that passes input through an agent.
 * Used for end-to-end verification of the orchestrator integration.
 */
export const testWorkflow: WorkflowData = {
  nodes: [
    {
      id: "input-1",
      type: "genericNode",
      position: { x: 0, y: 0 },
      data: {
        id: "input-1",
        node: {
          displayName: "User Input",
          documentation: "",
          baseClasses: ["Input"],
          template: {
            prompt: {
              name: "prompt",
              displayName: "Prompt",
              type: "str",
              value: "",
              isRequired: true,
              isAdvanced: false,
            },
          },
          outputs: [{ name: "prompt", displayName: "Prompt", method: "output", types: ["string"] }],
        },
      },
    },
    {
      id: "agent-1",
      type: "genericNode",
      position: { x: 200, y: 0 },
      data: {
        id: "agent-1",
        node: {
          displayName: "AI Agent",
          documentation: "",
          baseClasses: ["Agent"],
          template: {
            prompt: {
              name: "prompt",
              displayName: "Prompt",
              type: "str",
              value: "{{input-1.prompt}}",
              isRequired: true,
              isAdvanced: false,
            },
          },
          outputs: [{ name: "response", displayName: "Response", method: "output", types: ["string"] }],
        },
      },
    },
  ],
  edges: [
    {
      id: "e1",
      source: "input-1",
      target: "agent-1",
      sourceHandle: JSON.stringify({
        dataType: "string",
        id: "input-1-output-prompt",
        name: "prompt",
        outputTypes: ["string"],
      }),
      targetHandle: JSON.stringify({
        fieldName: "prompt",
        id: "agent-1-input-prompt",
        inputTypes: ["string"],
        type: "str",
      }),
      data: {
        sourceHandle: {
          dataType: "string",
          id: "input-1-output-prompt",
          name: "prompt",
          outputTypes: ["string"],
        },
        targetHandle: {
          fieldName: "prompt",
          id: "agent-1-input-prompt",
          inputTypes: ["string"],
          type: "str",
        },
      },
    },
  ],
}
