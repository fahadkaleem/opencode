/**
 * Topology Utilities
 *
 * Provides topological sorting and cycle detection for workflow graphs.
 * Uses Kahn's algorithm for sorting and DFS for cycle detection.
 */

import type { ParsedStep } from '../types.js';

/**
 * Error thrown when a cycle is detected in the graph.
 */
export class CycleDetectedError extends Error {
  readonly cycle: string[];

  constructor(message: string, cycle: string[]) {
    super(message);
    this.name = 'CycleDetectedError';
    this.cycle = cycle;
  }
}

/**
 * Performs topological sort using Kahn's algorithm.
 * Returns nodes in execution order (dependencies before dependents).
 *
 * @param nodes - Map of node ID to parsed node
 * @param adjacency - Adjacency list (node → successors)
 * @returns Array of node IDs in topological order
 * @throws CycleDetectedError if the graph contains cycles
 */
export function topologicalSort(
  nodes: Map<string, ParsedStep>,
  adjacency: Map<string, string[]>,
): string[] {
  const inDegree = new Map<string, number>();
  const result: string[] = [];
  const queue: string[] = [];

  // Calculate in-degrees for all nodes
  for (const id of nodes.keys()) {
    inDegree.set(id, 0);
  }

  for (const successors of adjacency.values()) {
    for (const successor of successors) {
      if (nodes.has(successor)) {
        inDegree.set(successor, (inDegree.get(successor) ?? 0) + 1);
      }
    }
  }

  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    result.push(current);

    // Decrease in-degree of successors
    for (const successor of adjacency.get(current) ?? []) {
      if (!nodes.has(successor)) continue;

      const newDegree = (inDegree.get(successor) ?? 0) - 1;
      inDegree.set(successor, newDegree);

      if (newDegree === 0) {
        queue.push(successor);
      }
    }
  }

  if (result.length !== nodes.size) {
    const remaining = [...nodes.keys()].filter((id) => !result.includes(id));
    const cycle = detectCycleFromNodes(remaining, adjacency);
    throw new CycleDetectedError(
      `Graph contains a cycle: ${cycle?.join(' → ') ?? 'unknown'}`,
      cycle ?? remaining,
    );
  }

  return result;
}

/**
 * Detects cycles in the graph using DFS.
 *
 * @param nodes - Map of node ID to parsed node
 * @param adjacency - Adjacency list (node → successors)
 * @returns The cycle path if found, null otherwise
 */
export function detectCycle(
  nodes: Map<string, ParsedStep>,
  adjacency: Map<string, string[]>,
): string[] | null {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    for (const successor of adjacency.get(nodeId) ?? []) {
      if (!nodes.has(successor)) continue;

      if (!visited.has(successor)) {
        const cycle = dfs(successor);
        if (cycle) return cycle;
      } else if (recursionStack.has(successor)) {
        // Found a cycle - extract the cycle path
        const cycleStart = path.indexOf(successor);
        return path.slice(cycleStart);
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return null;
  }

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      const cycle = dfs(nodeId);
      if (cycle) return cycle;
    }
  }

  return null;
}

/**
 * Detects cycle starting from a subset of nodes.
 * Used when topological sort fails to include all nodes.
 */
function detectCycleFromNodes(
  nodeIds: string[],
  adjacency: Map<string, string[]>,
): string[] | null {
  if (nodeIds.length === 0) return null;

  const nodeSet = new Set(nodeIds);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    for (const successor of adjacency.get(nodeId) ?? []) {
      if (!nodeSet.has(successor)) continue;

      if (!visited.has(successor)) {
        const cycle = dfs(successor);
        if (cycle) return cycle;
      } else if (recursionStack.has(successor)) {
        const cycleStart = path.indexOf(successor);
        return path.slice(cycleStart);
      }
    }

    path.pop();
    recursionStack.delete(nodeId);
    return null;
  }

  for (const nodeId of nodeIds) {
    if (!visited.has(nodeId)) {
      const cycle = dfs(nodeId);
      if (cycle) return cycle;
    }
  }

  return null;
}

/**
 * Finds entry points (nodes with no predecessors).
 *
 * @param nodes - Map of node ID to parsed node
 * @param reverseAdjacency - Reverse adjacency list (node → predecessors)
 * @returns Array of entry point node IDs
 */
export function findEntryPoints(
  nodes: Map<string, ParsedStep>,
  reverseAdjacency: Map<string, string[]>,
): string[] {
  const entryPoints: string[] = [];

  for (const nodeId of nodes.keys()) {
    const predecessors = reverseAdjacency.get(nodeId) ?? [];
    if (predecessors.length === 0) {
      entryPoints.push(nodeId);
    }
  }

  return entryPoints;
}

/**
 * Finds exit points (nodes with no successors).
 *
 * @param nodes - Map of node ID to parsed node
 * @param adjacency - Adjacency list (node → successors)
 * @returns Array of exit point node IDs
 */
export function findExitPoints(
  nodes: Map<string, ParsedStep>,
  adjacency: Map<string, string[]>,
): string[] {
  const exitPoints: string[] = [];

  for (const nodeId of nodes.keys()) {
    const successors = adjacency.get(nodeId) ?? [];
    if (successors.length === 0) {
      exitPoints.push(nodeId);
    }
  }

  return exitPoints;
}

/**
 * Checks if a cycle is a valid loop cycle.
 * Loop nodes are allowed to have back-edges to themselves.
 *
 * @param cycle - The detected cycle path
 * @param nodes - Map of node ID to parsed node
 * @returns True if the cycle is valid (part of a loop component)
 */
export function isValidLoopCycle(
  cycle: string[],
  nodes: Map<string, ParsedStep>,
): boolean {
  // A valid loop cycle should contain exactly one loop node
  // and the cycle should be self-referential through the loop
  const loopNodes = cycle.filter((id) => {
    const node = nodes.get(id);
    return node?.type === 'Loop';
  });

  // Valid if cycle contains a loop node and is small (loop back to itself)
  return loopNodes.length > 0 && cycle.length <= 3;
}

/**
 * Computes the level/depth of each node from entry points.
 * Useful for parallel execution planning.
 *
 * @param entryPoints - Array of entry point node IDs
 * @param adjacency - Adjacency list (node → successors)
 * @returns Map of node ID to level (0 = entry point)
 */
export function computeLevels(
  entryPoints: string[],
  adjacency: Map<string, string[]>,
): Map<string, number> {
  const levels = new Map<string, number>();
  const queue: Array<{ nodeId: string; level: number }> = [];

  for (const entry of entryPoints) {
    levels.set(entry, 0);
    queue.push({ nodeId: entry, level: 0 });
  }

  while (queue.length > 0) {
    const item = queue.shift();
    if (item === undefined) break;
    const { nodeId, level } = item;

    for (const successor of adjacency.get(nodeId) ?? []) {
      const existingLevel = levels.get(successor);

      // Update level to be max of current and new (for nodes with multiple predecessors)
      if (existingLevel === undefined || existingLevel < level + 1) {
        levels.set(successor, level + 1);
        queue.push({ nodeId: successor, level: level + 1 });
      }
    }
  }

  return levels;
}

/**
 * Groups nodes by their level for parallel execution.
 *
 * @param levels - Map of node ID to level
 * @returns Array of arrays, where each inner array contains nodes at that level
 */
export function groupByLevel(levels: Map<string, number>): string[][] {
  const groups = new Map<number, string[]>();

  for (const [nodeId, level] of levels) {
    const group = groups.get(level) ?? [];
    group.push(nodeId);
    groups.set(level, group);
  }

  const maxLevel = Math.max(...levels.values(), 0);
  const result: string[][] = [];

  for (let i = 0; i <= maxLevel; i++) {
    result.push(groups.get(i) ?? []);
  }

  return result;
}

/**
 * Finds all paths from source to target.
 *
 * @param source - Source node ID
 * @param target - Target node ID
 * @param adjacency - Adjacency list (node → successors)
 * @param maxDepth - Maximum path length to search
 * @returns Array of paths (each path is an array of node IDs)
 */
export function findAllPaths(
  source: string,
  target: string,
  adjacency: Map<string, string[]>,
  maxDepth: number = 100,
): string[][] {
  const paths: string[][] = [];
  const currentPath: string[] = [];

  function dfs(current: string, depth: number): void {
    if (depth > maxDepth) return;

    currentPath.push(current);

    if (current === target) {
      paths.push([...currentPath]);
    } else {
      for (const successor of adjacency.get(current) ?? []) {
        if (!currentPath.includes(successor)) {
          dfs(successor, depth + 1);
        }
      }
    }

    currentPath.pop();
  }

  dfs(source, 0);
  return paths;
}
