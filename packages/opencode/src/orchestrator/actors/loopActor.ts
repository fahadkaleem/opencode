/**
 * Loop Actor
 *
 * XState actor for handling loop/iteration logic.
 * Manages data iteration and result aggregation.
 */

import { assign, fromPromise, setup } from 'xstate';
import type { LoopOutput, LoopState } from '../types.js';

/**
 * Input for initializing a loop.
 */
export type LoopInitInput = {
  /** Unique identifier for this loop instance */
  stepId: string;
  /** Data to iterate over */
  data: unknown;
  /** Maximum iterations allowed */
  maxIterations: number;
};

/**
 * Events for the loop state machine.
 */
export type LoopEvent =
  | { type: 'INIT'; data: unknown }
  | { type: 'NEXT' }
  | { type: 'AGGREGATE'; value: unknown }
  | { type: 'STOP' };

/**
 * Validates and normalizes input data for iteration.
 * Converts various input types to an array.
 */
export function normalizeLoopData(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data === null || data === undefined) {
    return [];
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // Check for 'data' field (common in DataFrames)
    if ('data' in obj && Array.isArray(obj['data'])) {
      return obj['data'];
    }

    if ('rows' in obj && Array.isArray(obj['rows'])) {
      return obj['rows'];
    }

    if ('items' in obj && Array.isArray(obj['items'])) {
      return obj['items'];
    }

    if ('values' in obj && Array.isArray(obj['values'])) {
      return obj['values'];
    }

    // If it's an iterable, convert to array
    if (Symbol.iterator in obj) {
      try {
        return [...(obj as Iterable<unknown>)];
      } catch {
        // Not iterable in the expected way
      }
    }
  }

  // Wrap single value in array
  return [data];
}

/**
 * Loop state machine for managing iteration state.
 */
export const loopMachine = setup({
  types: {
    context: {} as LoopState,
    events: {} as LoopEvent,
    output: {} as LoopOutput,
  },
  guards: {
    isComplete: ({ context }) => context.index >= context.data.length,
    hasMore: ({ context }) => context.index < context.data.length - 1,
    isInitialized: ({ context }) => context.initialized,
  },
  actions: {
    initializeLoop: assign(({ event }) => {
      if (event.type !== 'INIT') return {};
      const data = normalizeLoopData(event.data);
      return {
        data,
        index: 0,
        aggregated: [],
        initialized: true,
      };
    }),
    advanceIndex: assign(({ context }) => ({
      index: context.index + 1,
    })),
    aggregateResult: assign(({ context, event }) => {
      if (event.type !== 'AGGREGATE') return {};
      return {
        aggregated: [...context.aggregated, event.value],
      };
    }),
  },
}).createMachine({
  id: 'loop',
  initial: 'uninitialized',
  context: {
    stepId: '',
    data: [] as unknown[],
    index: 0,
    aggregated: [] as unknown[],
    initialized: false,
  },
  states: {
    uninitialized: {
      on: {
        INIT: {
          target: 'checking',
          actions: 'initializeLoop',
        },
      },
    },
    checking: {
      always: [
        { target: 'done', guard: 'isComplete' },
        { target: 'iterating' },
      ],
    },
    iterating: {
      on: {
        NEXT: [
          {
            target: 'checking',
            actions: 'advanceIndex',
          },
        ],
        AGGREGATE: {
          actions: 'aggregateResult',
        },
        STOP: {
          target: 'done',
        },
      },
    },
    done: {
      type: 'final',
    },
  },
  output: ({ context }) => ({
    type: 'done',
    value: context.aggregated,
    index: context.index,
    isComplete: true,
  }),
});

/**
 * Gets the current item in a loop.
 */
export function getCurrentItem(state: LoopState): unknown {
  if (!state.initialized || state.index >= state.data.length) {
    return null;
  }
  return state.data[state.index];
}

/**
 * Checks if a loop is complete.
 */
export function isLoopComplete(
  state: LoopState,
  maxIterations: number,
): boolean {
  if (!state.initialized) {
    return false;
  }
  return state.index >= state.data.length || state.index >= maxIterations;
}

/**
 * Creates initial loop state.
 */
export function createLoopState(stepId: string): LoopState {
  return {
    stepId,
    data: [],
    index: 0,
    aggregated: [],
    initialized: false,
  };
}

/**
 * XState actor for loop initialization and iteration.
 */
export const loopInitActor = fromPromise<LoopState, LoopInitInput>(
  ({ input }) => {
    const data = normalizeLoopData(input.data);
    const limitedData = data.slice(0, input.maxIterations);

    return Promise.resolve({
      stepId: input.stepId,
      data: limitedData,
      index: 0,
      aggregated: [],
      initialized: true,
    });
  },
);

/**
 * Output for loop item.
 */
export type LoopItemOutput = {
  /** The current item */
  item: unknown;
  /** Current index */
  index: number;
  /** Total items */
  total: number;
  /** Whether more items remain */
  hasMore: boolean;
};

/**
 * Gets the item output for the current loop iteration.
 */
export function getLoopItemOutput(state: LoopState): LoopItemOutput {
  const item = getCurrentItem(state);
  return {
    item,
    index: state.index,
    total: state.data.length,
    hasMore: state.index < state.data.length - 1,
  };
}

/**
 * Output for loop done.
 */
export type LoopDoneOutput = {
  /** All aggregated results */
  readonly results: readonly unknown[];
  /** Total iterations performed */
  readonly iterations: number;
};

/**
 * Gets the done output for a completed loop.
 */
export function getLoopDoneOutput(state: LoopState): LoopDoneOutput {
  return {
    results: state.aggregated,
    iterations: state.index,
  };
}

/**
 * Advances a loop state to the next iteration.
 */
export function advanceLoop(
  state: LoopState,
  aggregateValue?: unknown,
): LoopState {
  const newAggregated =
    aggregateValue !== undefined
      ? [...state.aggregated, aggregateValue]
      : state.aggregated;

  return {
    ...state,
    index: state.index + 1,
    aggregated: newAggregated,
  };
}

/**
 * Initializes a loop state with data.
 */
export function initializeLoop(
  stepId: string,
  data: unknown,
  maxIterations: number,
): LoopState {
  const normalizedData = normalizeLoopData(data);
  const limitedData = normalizedData.slice(0, maxIterations);

  return {
    stepId,
    data: limitedData,
    index: 0,
    aggregated: [],
    initialized: true,
  };
}
