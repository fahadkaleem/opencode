/**
 * Abort Utilities Tests
 */

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test"
import {
  combineAbortSignals,
  createAbortControllerWithCleanup,
  createChildController,
  createDelayedAbort,
  createTimeoutController,
  isAbortError,
  onAbort,
  withAbort,
  withAbortCheck,
} from "./abortUtils.js"

describe("abort-utils", () => {
  beforeEach(() => {
    // TODO: jest.useFakeTimers();
  })

  afterEach(() => {
    // TODO: jest.useRealTimers();
    // Bun auto-restores mocks;
  })

  describe("createChildController", () => {
    it("should create a child controller", () => {
      const child = createChildController()

      expect(child).toBeInstanceOf(AbortController)
      expect(child.signal.aborted).toBe(false)
    })

    it("should abort child when parent aborts", () => {
      const parent = new AbortController()
      const child = createChildController(parent.signal)

      parent.abort()

      expect(child.signal.aborted).toBe(true)
    })

    it("should abort immediately when parent is already aborted", () => {
      const parent = new AbortController()
      parent.abort()

      const child = createChildController(parent.signal)

      expect(child.signal.aborted).toBe(true)
    })

    it("should call onAbort callback when parent aborts", () => {
      const parent = new AbortController()
      const onAbortFn = mock(() => {})

      createChildController(parent.signal, { onAbort: onAbortFn })
      parent.abort()

      expect(onAbortFn).toHaveBeenCalled()
    })

    // Skip: requires fake timer support
    it.skip("should abort after timeout", () => {
      const child = createChildController(undefined, { timeout: 1000 })

      expect(child.signal.aborted).toBe(false)

      // TODO: jest.advanceTimersByTime(1000);

      expect(child.signal.aborted).toBe(true)
    })
  })

  describe("combineAbortSignals", () => {
    it("should create combined controller", () => {
      const signal1 = new AbortController().signal
      const signal2 = new AbortController().signal

      const combined = combineAbortSignals(signal1, signal2)

      expect(combined).toBeInstanceOf(AbortController)
      expect(combined.signal.aborted).toBe(false)
    })

    it("should abort when any signal aborts", () => {
      const controller1 = new AbortController()
      const controller2 = new AbortController()

      const combined = combineAbortSignals(controller1.signal, controller2.signal)

      controller1.abort()

      expect(combined.signal.aborted).toBe(true)
    })

    it("should abort immediately when input signal is already aborted", () => {
      const controller = new AbortController()
      controller.abort()

      const combined = combineAbortSignals(controller.signal)

      expect(combined.signal.aborted).toBe(true)
    })

    it("should handle undefined signals", () => {
      const controller = new AbortController()

      const combined = combineAbortSignals(undefined, controller.signal, undefined)

      expect(combined.signal.aborted).toBe(false)
    })
  })

  describe("withAbort", () => {
    it("should resolve when promise resolves", async () => {
      const promise = Promise.resolve("value")

      const result = await withAbort(promise)

      expect(result).toBe("value")
    })

    it("should reject when signal is aborted before resolution", async () => {
      const controller = new AbortController()
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve("value"), 1000)
      })

      const wrapped = withAbort(promise, controller.signal)
      controller.abort()

      await expect(wrapped).rejects.toThrow("Operation aborted")
    })

    it("should reject immediately when signal is already aborted", async () => {
      const controller = new AbortController()
      controller.abort()

      const promise = Promise.resolve("value")

      await expect(withAbort(promise, controller.signal)).rejects.toThrow("Operation aborted")
    })

    it("should return original promise when no signal provided", async () => {
      const promise = Promise.resolve("value")

      const result = await withAbort(promise)

      expect(result).toBe("value")
    })

    it("should reject when original promise rejects", async () => {
      const error = new Error("original error")
      const promise = Promise.reject(error)

      await expect(withAbort(promise)).rejects.toBe(error)
    })
  })

  describe("createTimeoutController", () => {
    // Skip: requires fake timer support
    it.skip("should abort after specified timeout", () => {
      const controller = createTimeoutController(1000)

      expect(controller.signal.aborted).toBe(false)

      // TODO: jest.advanceTimersByTime(1000);

      expect(controller.signal.aborted).toBe(true)
    })

    it("should clear timeout when manually aborted", () => {
      const controller = createTimeoutController(1000)

      controller.abort()

      expect(controller.signal.aborted).toBe(true)
    })
  })

  describe("isAbortError", () => {
    it("should return true for AbortError", () => {
      const error = new DOMException("Aborted", "AbortError")

      expect(isAbortError(error)).toBe(true)
    })

    it("should return true for Operation aborted message", () => {
      const error = new Error("Operation aborted")

      expect(isAbortError(error)).toBe(true)
    })

    it("should return true for messages containing aborted", () => {
      const error = new Error("The request was aborted")

      expect(isAbortError(error)).toBe(true)
    })

    it("should return false for other errors", () => {
      const error = new Error("Something else went wrong")

      expect(isAbortError(error)).toBe(false)
    })

    it("should return false for non-error values", () => {
      expect(isAbortError("string")).toBe(false)
      expect(isAbortError(null)).toBe(false)
      expect(isAbortError(undefined)).toBe(false)
    })
  })

  describe("withAbortCheck", () => {
    it("should call function when not aborted", () => {
      const fn = mock((..._args: unknown[]) => "result")
      const wrapped = withAbortCheck(fn)

      const result: unknown = wrapped("arg1", "arg2")

      expect(result).toBe("result")
      expect(fn).toHaveBeenCalledWith("arg1", "arg2")
    })

    it("should throw when signal is aborted", () => {
      const controller = new AbortController()
      controller.abort()

      const fn = mock(() => {})
      const wrapped = withAbortCheck(fn, controller.signal)

      expect(() => {
        wrapped()
      }).toThrow("Operation aborted")
      expect(fn).not.toHaveBeenCalled()
    })
  })

  describe("createDelayedAbort", () => {
    // Skip: requires fake timer support
    it.skip("should abort after delay", () => {
      const { controller } = createDelayedAbort(1000)

      expect(controller.signal.aborted).toBe(false)

      // TODO: jest.advanceTimersByTime(1000);

      expect(controller.signal.aborted).toBe(true)
    })

    it("should not abort when cancelled", () => {
      const { controller, cancel } = createDelayedAbort(1000)

      cancel()

      expect(controller.signal.aborted).toBe(false)
    })

    // Skip: requires fake timer support
    it.skip("should use custom reason", () => {
      const { controller } = createDelayedAbort(1000, "Custom timeout")

      // TODO: jest.advanceTimersByTime(1000);

      expect(controller.signal.aborted).toBe(true)
    })
  })

  describe("onAbort", () => {
    it("should call callback when signal aborts", () => {
      const controller = new AbortController()
      const callback = mock(() => {})

      onAbort(controller.signal, callback)
      controller.abort("reason")

      expect(callback).toHaveBeenCalledWith("reason")
    })

    it("should call callback immediately when already aborted", () => {
      const controller = new AbortController()
      controller.abort("reason")
      const callback = mock(() => {})

      onAbort(controller.signal, callback)

      expect(callback).toHaveBeenCalledWith("reason")
    })

    it("should return cleanup function", () => {
      const controller = new AbortController()
      const callback = mock(() => {})

      const cleanup = onAbort(controller.signal, callback)
      cleanup()
      controller.abort()

      expect(callback).not.toHaveBeenCalled()
    })

    it("should return no-op for undefined signal", () => {
      const callback = mock(() => {})
      const cleanup = onAbort(undefined, callback)

      expect(typeof cleanup).toBe("function")
      cleanup() // Should not throw
    })
  })

  describe("createAbortControllerWithCleanup", () => {
    it("should create controller with cleanup functions", () => {
      const { controller, addCleanup, cleanup } = createAbortControllerWithCleanup()

      expect(controller).toBeInstanceOf(AbortController)
      expect(typeof addCleanup).toBe("function")
      expect(typeof cleanup).toBe("function")
    })

    it("should call cleanup functions on abort", () => {
      const { controller, addCleanup } = createAbortControllerWithCleanup()
      const cleanupFn1 = mock(() => {})
      const cleanupFn2 = mock(() => {})

      addCleanup(cleanupFn1)
      addCleanup(cleanupFn2)

      controller.abort()

      expect(cleanupFn1).toHaveBeenCalled()
      expect(cleanupFn2).toHaveBeenCalled()
    })

    it("should call cleanup functions when cleanup is called", () => {
      const { addCleanup, cleanup } = createAbortControllerWithCleanup()
      const cleanupFn = mock(() => {})

      addCleanup(cleanupFn)
      cleanup()

      expect(cleanupFn).toHaveBeenCalled()
    })

    it("should ignore errors in cleanup functions", () => {
      const { addCleanup, cleanup } = createAbortControllerWithCleanup()
      const cleanupFn1 = mock(() => {
        throw new Error("cleanup error")
      })
      const cleanupFn2 = mock(() => {})

      addCleanup(cleanupFn1)
      addCleanup(cleanupFn2)

      expect(() => cleanup()).not.toThrow()
      expect(cleanupFn2).toHaveBeenCalled()
    })
  })
})
