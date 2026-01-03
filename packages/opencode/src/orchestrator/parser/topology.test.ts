import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { ParsedStep } from '../types.js';
import {
  CycleDetectedError,
  detectCycle,
  findEntryPoints,
  findExitPoints,
  isValidLoopCycle,
  topologicalSort,
} from './topology.js';

// Helper to create a minimal parsed node
function createParsedStep(
  id: string,
  type: ParsedStep['type'] = 'Generic',
): ParsedStep {
  return {
    id,
    type,
    inputs: {},
    outputs: [],
    position: { x: 0, y: 0 },
    config: { type: 'Generic', config: {} },
    displayName: `Node ${id}`,
  };
}

describe('topology', () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  });

  describe('topologicalSort', () => {
    it('should sort a linear graph', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
      ]);
      const adjacency = new Map([
        ['a', ['b']],
        ['b', ['c']],
        ['c', []],
      ]);
      const order = topologicalSort(nodes, adjacency);
      expect(order).toEqual(['a', 'b', 'c']);
    });

    it('should sort a diamond graph', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
        ['d', createParsedStep('d')],
      ]);
      // a -> b -> d
      // a -> c -> d
      const adjacency = new Map([
        ['a', ['b', 'c']],
        ['b', ['d']],
        ['c', ['d']],
        ['d', []],
      ]);
      const order = topologicalSort(nodes, adjacency);
      // a must come first, d must come last
      expect(order[0]).toBe('a');
      expect(order[order.length - 1]).toBe('d');
      expect(order.indexOf('b')).toBeGreaterThan(order.indexOf('a'));
      expect(order.indexOf('c')).toBeGreaterThan(order.indexOf('a'));
    });

    it('should handle disconnected nodes', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
      ]);
      const adjacency = new Map([
        ['a', ['b']],
        ['b', []],
        ['c', []], // disconnected
      ]);
      const order = topologicalSort(nodes, adjacency);
      expect(order).toHaveLength(3);
      expect(order.indexOf('b')).toBeGreaterThan(order.indexOf('a'));
    });

    it('should throw CycleDetectedError for cyclic graph', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
      ]);
      // a -> b -> c -> a (cycle)
      const adjacency = new Map([
        ['a', ['b']],
        ['b', ['c']],
        ['c', ['a']],
      ]);
      expect(() => topologicalSort(nodes, adjacency)).toThrow(
        CycleDetectedError,
      );
    });

    it('should handle empty graph', () => {
      const nodes = new Map<string, ParsedStep>();
      const adjacency = new Map<string, string[]>();
      const order = topologicalSort(nodes, adjacency);
      expect(order).toEqual([]);
    });

    it('should handle single node', () => {
      const nodes = new Map<string, ParsedStep>([['a', createParsedStep('a')]]);
      const adjacency = new Map([['a', []]]);
      const order = topologicalSort(nodes, adjacency);
      expect(order).toEqual(['a']);
    });
  });

  describe('detectCycle', () => {
    it('should return null for acyclic graph', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
      ]);
      const adjacency = new Map([
        ['a', ['b']],
        ['b', ['c']],
        ['c', []],
      ]);
      const cycle = detectCycle(nodes, adjacency);
      expect(cycle).toBeNull();
    });

    it('should detect a simple cycle', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
      ]);
      // a -> b -> c -> a
      const adjacency = new Map([
        ['a', ['b']],
        ['b', ['c']],
        ['c', ['a']],
      ]);
      const cycle = detectCycle(nodes, adjacency);
      expect(cycle).not.toBeNull();
      expect(cycle).toContain('a');
      expect(cycle).toContain('b');
      expect(cycle).toContain('c');
    });

    it('should detect a self-loop', () => {
      const nodes = new Map<string, ParsedStep>([['a', createParsedStep('a')]]);
      const adjacency = new Map([['a', ['a']]]);
      const cycle = detectCycle(nodes, adjacency);
      expect(cycle).not.toBeNull();
      expect(cycle).toContain('a');
    });

    it('should handle empty graph', () => {
      const nodes = new Map<string, ParsedStep>();
      const adjacency = new Map<string, string[]>();
      const cycle = detectCycle(nodes, adjacency);
      expect(cycle).toBeNull();
    });
  });

  describe('findEntryPoints', () => {
    it('should find nodes with no predecessors', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
      ]);
      // a -> b, c -> b (a and c are entry points)
      const reverseAdjacency = new Map([
        ['a', []],
        ['b', ['a', 'c']],
        ['c', []],
      ]);
      const entryPoints = findEntryPoints(nodes, reverseAdjacency);
      expect(entryPoints).toContain('a');
      expect(entryPoints).toContain('c');
      expect(entryPoints).not.toContain('b');
    });

    it('should return all nodes for disconnected graph', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
      ]);
      const reverseAdjacency = new Map([
        ['a', []],
        ['b', []],
      ]);
      const entryPoints = findEntryPoints(nodes, reverseAdjacency);
      expect(entryPoints).toHaveLength(2);
    });

    it('should handle empty graph', () => {
      const nodes = new Map<string, ParsedStep>();
      const reverseAdjacency = new Map<string, string[]>();
      const entryPoints = findEntryPoints(nodes, reverseAdjacency);
      expect(entryPoints).toEqual([]);
    });
  });

  describe('findExitPoints', () => {
    it('should find nodes with no successors', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
        ['c', createParsedStep('c')],
      ]);
      // a -> b, a -> c (b and c are exit points)
      const adjacency = new Map([
        ['a', ['b', 'c']],
        ['b', []],
        ['c', []],
      ]);
      const exitPoints = findExitPoints(nodes, adjacency);
      expect(exitPoints).toContain('b');
      expect(exitPoints).toContain('c');
      expect(exitPoints).not.toContain('a');
    });

    it('should return all nodes for disconnected graph', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
      ]);
      const adjacency = new Map([
        ['a', []],
        ['b', []],
      ]);
      const exitPoints = findExitPoints(nodes, adjacency);
      expect(exitPoints).toHaveLength(2);
    });
  });

  describe('isValidLoopCycle', () => {
    it('should return true for small cycle containing a Loop node', () => {
      const nodes = new Map<string, ParsedStep>([
        ['loop', createParsedStep('loop', 'Loop')],
        ['body', createParsedStep('body')],
      ]);
      // Small cycle (length <= 3) with a loop node
      const cycle = ['loop', 'body', 'loop'];
      expect(isValidLoopCycle(cycle, nodes)).toBe(true);
    });

    it('should return false for large cycle even with Loop node', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['loop', createParsedStep('loop', 'Loop')],
        ['c', createParsedStep('c')],
      ]);
      // Large cycle (length > 3)
      const cycle = ['a', 'loop', 'c', 'a'];
      expect(isValidLoopCycle(cycle, nodes)).toBe(false);
    });

    it('should return false for cycle without Loop node', () => {
      const nodes = new Map<string, ParsedStep>([
        ['a', createParsedStep('a')],
        ['b', createParsedStep('b')],
      ]);
      const cycle = ['a', 'b', 'a'];
      expect(isValidLoopCycle(cycle, nodes)).toBe(false);
    });

    it('should return false for empty cycle', () => {
      const nodes = new Map<string, ParsedStep>();
      expect(isValidLoopCycle([], nodes)).toBe(false);
    });
  });

  describe('CycleDetectedError', () => {
    it('should store the cycle path', () => {
      const cycle = ['a', 'b', 'c', 'a'];
      const error = new CycleDetectedError('Cycle detected', cycle);
      expect(error.cycle).toEqual(cycle);
      expect(error.message).toBe('Cycle detected');
      expect(error.name).toBe('CycleDetectedError');
    });
  });
});
