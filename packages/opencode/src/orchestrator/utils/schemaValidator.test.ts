import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import {
  assertWorkflowData,
  parseWorkflowData,
  validateWorkflowSchema,
} from './schemaValidator.js';

describe('schema-validator', () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  });

  describe('validateWorkflowSchema', () => {
    it('should validate a minimal valid graph', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: {
              node: {
                template: {},
                outputs: [],
              },
            },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object graph', () => {
      const result = validateWorkflowSchema('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_WORKFLOW');
    });

    it('should reject null graph', () => {
      const result = validateWorkflowSchema(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_WORKFLOW');
    });

    it('should reject graph without nodes array', () => {
      const graph = { edges: [] };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_NODES')).toBe(true);
    });

    it('should reject graph without edges array', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_CONNECTIONS')).toBe(
        true,
      );
    });

    it('should reject node without id', () => {
      const graph = {
        nodes: [
          {
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_NODE_ID')).toBe(
        true,
      );
    });

    it('should reject node without type', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_NODE_TYPE')).toBe(
        true,
      );
    });

    it('should reject node with invalid type', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'invalidType',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_NODE_TYPE')).toBe(
        true,
      );
    });

    it('should accept noteNode type', () => {
      const graph = {
        nodes: [
          {
            id: 'note-1',
            type: 'noteNode',
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(true);
    });

    it('should reject node without position', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_POSITION')).toBe(
        true,
      );
    });

    it('should reject position with non-numeric x', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 'invalid', y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_POSITION_X')).toBe(
        true,
      );
    });

    it('should reject genericNode without data', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_NODE_DATA')).toBe(
        true,
      );
    });

    it('should reject genericNode without data.node', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: {},
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_NODE_CONFIG')).toBe(
        true,
      );
    });

    it('should reject genericNode without template', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { outputs: [] } },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_TEMPLATE')).toBe(
        true,
      );
    });

    it('should detect duplicate node IDs', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 100, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NODE_ID')).toBe(
        true,
      );
    });

    it('should reject edge without id', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
          {
            id: 'node-2',
            type: 'genericNode',
            position: { x: 100, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [{ source: 'node-1', target: 'node-2' }],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_EDGE_ID')).toBe(
        true,
      );
    });

    it('should reject edge with non-existent source node', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [{ id: 'edge-1', source: 'missing', target: 'node-1' }],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_EDGE_SOURCE')).toBe(
        true,
      );
    });

    it('should reject edge with non-existent target node', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'missing' }],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_EDGE_TARGET')).toBe(
        true,
      );
    });

    it('should detect duplicate edge IDs', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
          {
            id: 'node-2',
            type: 'genericNode',
            position: { x: 100, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
          { id: 'edge-1', source: 'node-2', target: 'node-1' },
        ],
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === 'DUPLICATE_CONNECTION_ID'),
      ).toBe(true);
    });

    it('should validate optional viewport', () => {
      const graph = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid viewport', () => {
      const graph = {
        nodes: [],
        edges: [],
        viewport: { x: 'invalid', y: 0, zoom: 1 },
      };
      const result = validateWorkflowSchema(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_VIEWPORT_X')).toBe(
        true,
      );
    });
  });

  describe('assertWorkflowData', () => {
    it('should not throw for valid graph', () => {
      const graph = {
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      };
      expect(() => assertWorkflowData(graph)).not.toThrow();
    });

    it('should throw for invalid workflow', () => {
      const workflow = { nodes: 'invalid' };
      expect(() => assertWorkflowData(workflow)).toThrow(
        'Invalid workflow data',
      );
    });
  });

  describe('parseWorkflowData', () => {
    it('should parse valid JSON graph', () => {
      const json = JSON.stringify({
        nodes: [
          {
            id: 'node-1',
            type: 'genericNode',
            position: { x: 0, y: 0 },
            data: { node: { template: {}, outputs: [] } },
          },
        ],
        edges: [],
      });
      const result = parseWorkflowData(json);
      expect(result.nodes).toHaveLength(1);
    });

    it('should throw for invalid JSON', () => {
      expect(() => parseWorkflowData('invalid json')).toThrow();
    });

    it('should throw for valid JSON but invalid workflow structure', () => {
      const json = JSON.stringify({ nodes: 'invalid' });
      expect(() => parseWorkflowData(json)).toThrow('Invalid workflow data');
    });
  });
});
