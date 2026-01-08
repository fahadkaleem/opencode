/**
 * Abort Utilities
 *
 * Utilities for handling abort signals and nested cancellation.
 * Provides composable abort controllers for hierarchical workflows.
 */

/**
 * Options for creating a child abort controller.
 */
export type ChildAbortOptions = {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Additional cleanup function to run on abort */
  onAbort?: () => void;
};

/**
 * Creates a child AbortController that aborts when the parent does.
 *
 * @param parentSignal - Parent abort signal
 * @param options - Options for the child controller
 * @returns Child AbortController
 */
export function createChildController(
  parentSignal?: AbortSignal,
  options?: ChildAbortOptions,
): AbortController {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort(parentSignal.reason);
    } else {
      const handler = () => {
        controller.abort(parentSignal.reason);
        options?.onAbort?.();
      };
      parentSignal.addEventListener('abort', handler, { once: true });

      // Cleanup listener when child aborts for other reasons
      controller.signal.addEventListener(
        'abort',
        () => {
          parentSignal.removeEventListener('abort', handler);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          options?.onAbort?.();
        },
        { once: true },
      );
    }
  }

  if (options?.timeout !== undefined) {
    timeoutId = setTimeout(() => {
      controller.abort(new Error('Operation timed out'));
    }, options.timeout);
  }

  return controller;
}

/**
 * Combines multiple abort signals into one.
 * The combined signal aborts when any of the input signals abort.
 *
 * @param signals - Signals to combine
 * @returns Combined AbortController
 */
export function combineAbortSignals(
  ...signals: Array<AbortSignal | undefined>
): AbortController {
  const controller = new AbortController();
  const validSignals = signals.filter((s): s is AbortSignal => s !== undefined);

  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }

    signal.addEventListener(
      'abort',
      () => {
        controller.abort(signal.reason);
      },
      { once: true },
    );
  }

  return controller;
}

/**
 * Wraps a promise to reject when an abort signal is triggered.
 *
 * @param promise - The promise to wrap
 * @param signal - Abort signal to watch
 * @returns Promise that rejects on abort
 */
export function withAbort<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!signal) {
    return promise;
  }

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Operation aborted'));
      return;
    }

    const abortHandler = () => {
      reject(new Error('Operation aborted'));
    };

    signal.addEventListener('abort', abortHandler, { once: true });

    promise
      .then((value) => {
        signal.removeEventListener('abort', abortHandler);
        resolve(value);
      })
      .catch((error: unknown) => {
        signal.removeEventListener('abort', abortHandler);
        reject(error);
      });
  });
}

/**
 * Creates a timeout signal.
 *
 * @param ms - Timeout in milliseconds
 * @returns AbortController that aborts after the timeout
 */
export function createTimeoutController(ms: number): AbortController {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Operation timed out after ${ms}ms`));
  }, ms);

  controller.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timeoutId);
    },
    { once: true },
  );

  return controller;
}

/**
 * Checks if an error was caused by an abort.
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === 'AbortError' ||
      error.message === 'Operation aborted' ||
      error.message.includes('aborted')
    );
  }
  return false;
}

/**
 * Wraps a function to check for abort before execution.
 */
export function withAbortCheck<T extends (...args: unknown[]) => unknown>(
  fn: T,
  signal?: AbortSignal,
): T {
  return ((...args: unknown[]) => {
    if (signal?.aborted === true) {
      throw new Error('Operation aborted');
    }
    return fn(...args);
  }) as T;
}

/**
 * Creates an abort controller that aborts after a delay.
 * Useful for implementing request timeouts.
 */
export function createDelayedAbort(
  delay: number,
  reason?: string,
): { controller: AbortController; cancel: () => void } {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(reason ?? `Aborted after ${delay}ms`));
  }, delay);

  const cancel = () => {
    clearTimeout(timeoutId);
  };

  controller.signal.addEventListener('abort', cancel, { once: true });

  return { controller, cancel };
}

/**
 * Runs a callback when an abort signal is triggered.
 *
 * @param signal - Abort signal to watch
 * @param callback - Callback to run on abort
 * @returns Cleanup function
 */
export function onAbort(
  signal: AbortSignal | undefined,
  callback: (reason?: unknown) => void,
): () => void {
  if (!signal) {
    // No-op cleanup function when signal is undefined
    return () => {
      // Intentionally empty
    };
  }

  if (signal.aborted) {
    callback(signal.reason);
    // No-op cleanup function when signal is already aborted
    return () => {
      // Intentionally empty
    };
  }

  const handler = () => {
    callback(signal.reason);
  };

  signal.addEventListener('abort', handler, { once: true });

  return () => {
    signal.removeEventListener('abort', handler);
  };
}

/**
 * Creates an abort controller with cleanup callbacks.
 */
export function createAbortControllerWithCleanup(): {
  controller: AbortController;
  addCleanup: (fn: () => void) => void;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const cleanupFunctions: Array<() => void> = [];

  const cleanup = () => {
    for (const fn of cleanupFunctions) {
      try {
        fn();
      } catch {
        // Ignore cleanup errors
      }
    }
    cleanupFunctions.length = 0;
  };

  controller.signal.addEventListener('abort', cleanup, { once: true });

  return {
    controller,
    addCleanup: (fn) => cleanupFunctions.push(fn),
    cleanup,
  };
}
