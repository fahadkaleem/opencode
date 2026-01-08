/**
 * Schema Validator
 *
 * JSON schema validation for workflow data.
 * Provides basic validation without requiring Zod/Ajv dependencies.
 */

import type { ValidationError, WorkflowData } from '../types.js';

/**
 * Validation result from schema validation.
 */
export type SchemaValidationResult = {
  /** Whether the schema is valid */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
};

/**
 * Validates that a value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Validates that a value is a number.
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Validates that a value is an object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates that a value is an array.
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Validates a Position object.
 */
function validatePosition(
  pos: Record<string, unknown>,
  path: string[],
  errors: ValidationError[],
): boolean {
  let valid = true;

  if (!isNumber(pos['x'])) {
    errors.push({
      code: 'INVALID_POSITION_X',
      message: 'Position x must be a number',
      path: [...path, 'x'],
    });
    valid = false;
  }

  if (!isNumber(pos['y'])) {
    errors.push({
      code: 'INVALID_POSITION_Y',
      message: 'Position y must be a number',
      path: [...path, 'y'],
    });
    valid = false;
  }

  return valid;
}

/**
 * Validates a StepData object.
 */
function validateNode(
  node: unknown,
  index: number,
  errors: ValidationError[],
): boolean {
  const path = ['nodes', String(index)];

  if (!isObject(node)) {
    errors.push({
      code: 'INVALID_NODE',
      message: `Node at index ${index} must be an object`,
      path,
    });
    return false;
  }

  let valid = true;

  // Required fields
  if (!isNonEmptyString(node['id'])) {
    errors.push({
      code: 'MISSING_NODE_ID',
      message: `Node at index ${index} missing required 'id' field`,
      path: [...path, 'id'],
    });
    valid = false;
  }

  if (!isNonEmptyString(node['type'])) {
    errors.push({
      code: 'MISSING_NODE_TYPE',
      message: `Node at index ${index} missing required 'type' field`,
      path: [...path, 'type'],
    });
    valid = false;
  } else if (node['type'] !== 'genericNode' && node['type'] !== 'noteNode') {
    errors.push({
      code: 'INVALID_NODE_TYPE',
      message: `Node type must be 'genericNode' or 'noteNode', got '${node['type']}'`,
      path: [...path, 'type'],
    });
    valid = false;
  }

  // Position
  if (!isObject(node['position'])) {
    errors.push({
      code: 'MISSING_POSITION',
      message: `Node at index ${index} missing required 'position' field`,
      path: [...path, 'position'],
    });
    valid = false;
  } else {
    validatePosition(
      node['position'] as Record<string, unknown>,
      [...path, 'position'],
      errors,
    );
  }

  // Data (required for genericNode)
  if (node['type'] === 'genericNode') {
    if (!isObject(node['data'])) {
      errors.push({
        code: 'MISSING_NODE_DATA',
        message: `Generic node at index ${index} missing required 'data' field`,
        path: [...path, 'data'],
      });
      valid = false;
    } else {
      const data = node['data'] as Record<string, unknown>;
      if (!isObject(data['node'])) {
        errors.push({
          code: 'MISSING_NODE_CONFIG',
          message: `Node at index ${index} missing 'data.node' configuration`,
          path: [...path, 'data', 'node'],
        });
        valid = false;
      } else {
        const nodeConfig = data['node'] as Record<string, unknown>;
        if (!isObject(nodeConfig['template'])) {
          errors.push({
            code: 'MISSING_TEMPLATE',
            message: `Node at index ${index} missing 'data.node.template'`,
            path: [...path, 'data', 'node', 'template'],
          });
          valid = false;
        }

        if (!isArray(nodeConfig['outputs'])) {
          errors.push({
            code: 'MISSING_OUTPUTS',
            message: `Node at index ${index} missing 'data.node.outputs'`,
            path: [...path, 'data', 'node', 'outputs'],
          });
          valid = false;
        }
      }
    }
  }

  return valid;
}

/**
 * Validates a ConnectionData object.
 */
function validateEdge(
  edge: unknown,
  index: number,
  nodeIds: Set<string>,
  errors: ValidationError[],
): boolean {
  const path = ['edges', String(index)];

  if (!isObject(edge)) {
    errors.push({
      code: 'INVALID_EDGE',
      message: `Edge at index ${index} must be an object`,
      path,
    });
    return false;
  }

  let valid = true;

  // Required fields
  if (!isNonEmptyString(edge['id'])) {
    errors.push({
      code: 'MISSING_EDGE_ID',
      message: `Edge at index ${index} missing required 'id' field`,
      path: [...path, 'id'],
    });
    valid = false;
  }

  if (!isNonEmptyString(edge['source'])) {
    errors.push({
      code: 'MISSING_EDGE_SOURCE',
      message: `Edge at index ${index} missing required 'source' field`,
      path: [...path, 'source'],
    });
    valid = false;
  } else if (!nodeIds.has(edge['source'] as string)) {
    errors.push({
      code: 'INVALID_EDGE_SOURCE',
      message: `Edge at index ${index} references non-existent source node '${edge['source']}'`,
      path: [...path, 'source'],
    });
    valid = false;
  }

  if (!isNonEmptyString(edge['target'])) {
    errors.push({
      code: 'MISSING_EDGE_TARGET',
      message: `Edge at index ${index} missing required 'target' field`,
      path: [...path, 'target'],
    });
    valid = false;
  } else if (!nodeIds.has(edge['target'] as string)) {
    errors.push({
      code: 'INVALID_EDGE_TARGET',
      message: `Edge at index ${index} references non-existent target node '${edge['target']}'`,
      path: [...path, 'target'],
    });
    valid = false;
  }

  return valid;
}

/**
 * Validates a WorkflowData object.
 *
 * @param graph - The graph data to validate
 * @returns Validation result with errors
 */
export function validateWorkflowSchema(
  workflow: unknown,
): SchemaValidationResult {
  const errors: ValidationError[] = [];

  if (!isObject(workflow)) {
    errors.push({
      code: 'INVALID_WORKFLOW',
      message: 'Workflow must be an object',
      path: [],
    });
    return { valid: false, errors };
  }

  if (!isArray(workflow['nodes'])) {
    errors.push({
      code: 'MISSING_NODES',
      message: "Workflow missing required 'nodes' array",
      path: ['nodes'],
    });
  } else {
    // Collect node IDs for connection validation
    const nodeIds = new Set<string>();
    const nodes = workflow['nodes'] as unknown[];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      validateNode(node, i, errors);

      if (isObject(node) && isNonEmptyString(node['id'])) {
        if (nodeIds.has(node['id'])) {
          errors.push({
            code: 'DUPLICATE_NODE_ID',
            message: `Duplicate node ID '${node['id']}'`,
            path: ['nodes', String(i), 'id'],
          });
        }
        nodeIds.add(node['id']);
      }
    }

    if (!isArray(workflow['edges'])) {
      errors.push({
        code: 'MISSING_CONNECTIONS',
        message: "Workflow missing required 'edges' array",
        path: ['edges'],
      });
    } else {
      const edgeIds = new Set<string>();
      const edges = workflow['edges'] as unknown[];

      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        validateEdge(edge, i, nodeIds, errors);

        if (isObject(edge) && isNonEmptyString(edge['id'])) {
          if (edgeIds.has(edge['id'])) {
            errors.push({
              code: 'DUPLICATE_CONNECTION_ID',
              message: `Duplicate connection ID '${edge['id']}'`,
              path: ['edges', String(i), 'id'],
            });
          }
          edgeIds.add(edge['id']);
        }
      }
    }
  }

  if (workflow['viewport'] !== undefined) {
    if (!isObject(workflow['viewport'])) {
      errors.push({
        code: 'INVALID_VIEWPORT',
        message: 'Viewport must be an object',
        path: ['viewport'],
      });
    } else {
      const viewport = workflow['viewport'] as Record<string, unknown>;
      if (!isNumber(viewport['x'])) {
        errors.push({
          code: 'INVALID_VIEWPORT_X',
          message: 'Viewport x must be a number',
          path: ['viewport', 'x'],
        });
      }
      if (!isNumber(viewport['y'])) {
        errors.push({
          code: 'INVALID_VIEWPORT_Y',
          message: 'Viewport y must be a number',
          path: ['viewport', 'y'],
        });
      }
      if (!isNumber(viewport['zoom'])) {
        errors.push({
          code: 'INVALID_VIEWPORT_ZOOM',
          message: 'Viewport zoom must be a number',
          path: ['viewport', 'zoom'],
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Type assertion helper for WorkflowData.
 */
export function assertWorkflowData(
  workflow: unknown,
): asserts workflow is WorkflowData {
  const result = validateWorkflowSchema(workflow);
  if (!result.valid) {
    const messages = result.errors.map((e) => e.message).join('; ');
    throw new Error(`Invalid workflow data: ${messages}`);
  }
}

/**
 * Safe parsing of workflow data with validation.
 */
export function parseWorkflowData(json: string): WorkflowData {
  const data = JSON.parse(json) as unknown;
  assertWorkflowData(data);
  return data;
}
