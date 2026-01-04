/**
 * Research Workflow Definition
 *
 * Test workflow using the custom research-agent to verify agent integration.
 * Flow: Input -> Research Agent (read-only access)
 */

import type { WorkflowData } from "../types.js"

/**
 * Research workflow using a custom agent with restricted permissions.
 * Used to verify that custom agents from .opencode/agents/ are properly loaded.
 */
export const researchWorkflow: WorkflowData = {
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
      id: "research-1",
      type: "genericNode",
      position: { x: 200, y: 0 },
      data: {
        id: "research-1",
        node: {
          displayName: "Research Agent",
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
            agent_type: {
              name: "agent_type",
              displayName: "Agent Type",
              type: "str",
              value: "research-agent",
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
      target: "research-1",
      sourceHandle: JSON.stringify({
        dataType: "string",
        id: "input-1-output-prompt",
        name: "prompt",
        outputTypes: ["string"],
      }),
      targetHandle: JSON.stringify({
        fieldName: "prompt",
        id: "research-1-input-prompt",
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
          id: "research-1-input-prompt",
          inputTypes: ["string"],
          type: "str",
        },
      },
    },
  ],
}
