/**
 * Connection Parser
 *
 * Parses workflow connection data into our internal representation.
 * Extracts source/target port information for data flow.
 */

import type {
  ConnectionData,
  InputPortData,
  OutputPortData,
  ParsedConnection,
} from '../types.js';

/**
 * Extracts source output port data from a connection.
 * workflow stores port data both as a JSON string in sourceHandle
 * and as a parsed object in data.sourceHandle.
 *
 * @param connection - The workflow connection data
 * @returns Source output port data or null if not available
 */
export function extractOutputPort(
  connection: ConnectionData,
): OutputPortData | null {
  // Return the structured data (always available per ConnectionDataWrapper type)
  return connection.data.sourceHandle;
}

/**
 * Extracts target input port data from a connection.
 *
 * @param connection - The workflow connection data
 * @returns Target input port data or null if not available
 */
export function extractInputPort(
  connection: ConnectionData,
): InputPortData | null {
  // Return the structured data (always available per ConnectionDataWrapper type)
  return connection.data.targetHandle;
}

/**
 * Gets the output name from a source port.
 *
 * @param connection - The workflow connection data
 * @returns Output name or 'default' if not found
 */
export function getSourceOutput(connection: ConnectionData): string {
  const port = extractOutputPort(connection);
  return port?.name ?? 'default';
}

/**
 * Gets the input name from a target port.
 *
 * @param connection - The workflow connection data
 * @returns Input name or 'default' if not found
 */
export function getTargetInput(connection: ConnectionData): string {
  const port = extractInputPort(connection);
  return port?.fieldName ?? 'default';
}

/**
 * Parses a single workflow connection into our internal representation.
 *
 * @param connection - The workflow connection data
 * @returns Parsed connection representation
 */
export function parseConnection(connection: ConnectionData): ParsedConnection {
  return {
    id: connection.id,
    source: connection.source,
    target: connection.target,
    sourceOutput: getSourceOutput(connection),
    targetInput: getTargetInput(connection),
  };
}

/**
 * Parses multiple connections at once.
 *
 * @param connections - Array of workflow connection data
 * @returns Map of connection ID to parsed connection
 */
export function parseConnections(
  connections: ConnectionData[],
): Map<string, ParsedConnection> {
  const result = new Map<string, ParsedConnection>();

  for (const connection of connections) {
    result.set(connection.id, parseConnection(connection));
  }

  return result;
}

/**
 * Builds an adjacency list from connections.
 * Maps each step to its successor steps.
 *
 * @param connections - Array of workflow connection data
 * @param stepIds - Set of valid step IDs
 * @returns Map of step ID to array of successor step IDs
 */
export function buildAdjacencyList(
  connections: ConnectionData[],
  stepIds: Set<string>,
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();

  for (const stepId of stepIds) {
    adjacency.set(stepId, []);
  }

  for (const connection of connections) {
    // Only add if both source and target are valid steps
    if (stepIds.has(connection.source) && stepIds.has(connection.target)) {
      const successors = adjacency.get(connection.source) ?? [];
      if (!successors.includes(connection.target)) {
        successors.push(connection.target);
        adjacency.set(connection.source, successors);
      }
    }
  }

  return adjacency;
}

/**
 * Builds a reverse adjacency list from connections.
 * Maps each step to its predecessor steps.
 *
 * @param connections - Array of workflow connection data
 * @param stepIds - Set of valid step IDs
 * @returns Map of step ID to array of predecessor step IDs
 */
export function buildReverseAdjacencyList(
  connections: ConnectionData[],
  stepIds: Set<string>,
): Map<string, string[]> {
  const reverseAdjacency = new Map<string, string[]>();

  for (const stepId of stepIds) {
    reverseAdjacency.set(stepId, []);
  }

  for (const connection of connections) {
    // Only add if both source and target are valid steps
    if (stepIds.has(connection.source) && stepIds.has(connection.target)) {
      const predecessors = reverseAdjacency.get(connection.target) ?? [];
      if (!predecessors.includes(connection.source)) {
        predecessors.push(connection.source);
        reverseAdjacency.set(connection.target, predecessors);
      }
    }
  }

  return reverseAdjacency;
}

/**
 * Finds all connections between two steps.
 *
 * @param connections - Map of parsed connections
 * @param source - Source step ID
 * @param target - Target step ID
 * @returns Array of connections connecting source to target
 */
export function findConnectionsBetween(
  connections: Map<string, ParsedConnection>,
  source: string,
  target: string,
): ParsedConnection[] {
  const result: ParsedConnection[] = [];

  for (const connection of connections.values()) {
    if (connection.source === source && connection.target === target) {
      result.push(connection);
    }
  }

  return result;
}

/**
 * Gets all connections from a specific output port of a step.
 *
 * @param connections - Map of parsed connections
 * @param stepId - Source step ID
 * @param outputName - Output name to filter by
 * @returns Array of connections from the specified output
 */
export function getConnectionsFromOutput(
  connections: Map<string, ParsedConnection>,
  stepId: string,
  outputName: string,
): ParsedConnection[] {
  const result: ParsedConnection[] = [];

  for (const connection of connections.values()) {
    if (
      connection.source === stepId &&
      connection.sourceOutput === outputName
    ) {
      result.push(connection);
    }
  }

  return result;
}

/**
 * Gets all connections to a specific input port of a step.
 *
 * @param connections - Map of parsed connections
 * @param stepId - Target step ID
 * @param inputName - Input name to filter by
 * @returns Array of connections to the specified input
 */
export function getConnectionsToInput(
  connections: Map<string, ParsedConnection>,
  stepId: string,
  inputName: string,
): ParsedConnection[] {
  const result: ParsedConnection[] = [];

  for (const connection of connections.values()) {
    if (connection.target === stepId && connection.targetInput === inputName) {
      result.push(connection);
    }
  }

  return result;
}
