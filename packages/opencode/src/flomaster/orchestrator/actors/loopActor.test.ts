/**
 * Loop Actor Tests
 */

import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import type { LoopState } from "../types"
import {
  advanceLoop,
  createLoopState,
  getCurrentItem,
  getLoopDoneOutput,
  getLoopItemOutput,
  initializeLoop,
  isLoopComplete,
  normalizeLoopData,
} from "./loopActor"

describe("loop-actor", () => {
  afterEach(() => {
    // Bun auto-restores mocks;
  })

  describe("normalizeLoopData", () => {
    it("should return array unchanged when input is already an array", () => {
      const data = [1, 2, 3]
      const result = normalizeLoopData(data)
      expect(result).toEqual([1, 2, 3])
    })

    it("should return empty array when input is null", () => {
      const result = normalizeLoopData(null)
      expect(result).toEqual([])
    })

    it("should return empty array when input is undefined", () => {
      const result = normalizeLoopData(undefined)
      expect(result).toEqual([])
    })

    it("should extract data field when input is DataFrame-like object", () => {
      const data = { data: [1, 2, 3] }
      const result = normalizeLoopData(data)
      expect(result).toEqual([1, 2, 3])
    })

    it("should extract rows field when input has rows", () => {
      const data = { rows: [{ id: 1 }, { id: 2 }] }
      const result = normalizeLoopData(data)
      expect(result).toEqual([{ id: 1 }, { id: 2 }])
    })

    it("should extract items field when input has items", () => {
      const data = { items: ["a", "b", "c"] }
      const result = normalizeLoopData(data)
      expect(result).toEqual(["a", "b", "c"])
    })

    it("should extract values field when input has values", () => {
      const data = { values: [10, 20, 30] }
      const result = normalizeLoopData(data)
      expect(result).toEqual([10, 20, 30])
    })

    it("should wrap single value in array when no special fields found", () => {
      const data = "single value"
      const result = normalizeLoopData(data)
      expect(result).toEqual(["single value"])
    })

    it("should handle iterable objects", () => {
      const data = new Set([1, 2, 3])
      const result = normalizeLoopData(data)
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe("createLoopState", () => {
    it("should create initial loop state with empty data", () => {
      const state = createLoopState("node-1")

      expect(state.stepId).toBe("node-1")
      expect(state.data).toEqual([])
      expect(state.index).toBe(0)
      expect(state.aggregated).toEqual([])
      expect(state.initialized).toBe(false)
    })
  })

  describe("initializeLoop", () => {
    it("should initialize loop with normalized data", () => {
      const state = initializeLoop("node-1", [1, 2, 3], 10)

      expect(state.stepId).toBe("node-1")
      expect(state.data).toEqual([1, 2, 3])
      expect(state.index).toBe(0)
      expect(state.aggregated).toEqual([])
      expect(state.initialized).toBe(true)
    })

    it("should limit data to maxIterations", () => {
      const state = initializeLoop("node-1", [1, 2, 3, 4, 5], 3)

      expect(state.data).toEqual([1, 2, 3])
    })

    it("should handle empty data", () => {
      const state = initializeLoop("node-1", [], 10)

      expect(state.data).toEqual([])
      expect(state.initialized).toBe(true)
    })
  })

  describe("getCurrentItem", () => {
    it("should return current item when loop is initialized", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 1,
        aggregated: [],
        initialized: true,
      }

      const item = getCurrentItem(state)
      expect(item).toBe("b")
    })

    it("should return null when loop is not initialized", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 0,
        aggregated: [],
        initialized: false,
      }

      const item = getCurrentItem(state)
      expect(item).toBeNull()
    })

    it("should return null when index is out of bounds", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 10,
        aggregated: [],
        initialized: true,
      }

      const item = getCurrentItem(state)
      expect(item).toBeNull()
    })
  })

  describe("isLoopComplete", () => {
    it("should return true when index equals data length", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 3,
        aggregated: [],
        initialized: true,
      }

      expect(isLoopComplete(state, 10)).toBe(true)
    })

    it("should return true when index equals maxIterations", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c", "d", "e"],
        index: 3,
        aggregated: [],
        initialized: true,
      }

      expect(isLoopComplete(state, 3)).toBe(true)
    })

    it("should return false when loop is not initialized", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: [],
        index: 0,
        aggregated: [],
        initialized: false,
      }

      expect(isLoopComplete(state, 10)).toBe(false)
    })

    it("should return false when more items remain", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 1,
        aggregated: [],
        initialized: true,
      }

      expect(isLoopComplete(state, 10)).toBe(false)
    })
  })

  describe("getLoopItemOutput", () => {
    it("should return correct item output", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 1,
        aggregated: [],
        initialized: true,
      }

      const output = getLoopItemOutput(state)

      expect(output.item).toBe("b")
      expect(output.index).toBe(1)
      expect(output.total).toBe(3)
      expect(output.hasMore).toBe(true)
    })

    it("should return hasMore as false for last item", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 2,
        aggregated: [],
        initialized: true,
      }

      const output = getLoopItemOutput(state)
      expect(output.hasMore).toBe(false)
    })
  })

  describe("getLoopDoneOutput", () => {
    it("should return aggregated results", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 3,
        aggregated: ["result-a", "result-b", "result-c"],
        initialized: true,
      }

      const output = getLoopDoneOutput(state)

      expect(output.results).toEqual(["result-a", "result-b", "result-c"])
      expect(output.iterations).toBe(3)
    })
  })

  describe("advanceLoop", () => {
    it("should increment index and preserve state", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 0,
        aggregated: [],
        initialized: true,
      }

      const newState = advanceLoop(state)

      expect(newState.index).toBe(1)
      expect(newState.aggregated).toEqual([])
    })

    it("should aggregate value when provided", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 0,
        aggregated: [],
        initialized: true,
      }

      const newState = advanceLoop(state, "result-a")

      expect(newState.index).toBe(1)
      expect(newState.aggregated).toEqual(["result-a"])
    })

    it("should append to existing aggregated values", () => {
      const state: LoopState = {
        stepId: "node-1",
        data: ["a", "b", "c"],
        index: 1,
        aggregated: ["result-a"],
        initialized: true,
      }

      const newState = advanceLoop(state, "result-b")

      expect(newState.aggregated).toEqual(["result-a", "result-b"])
    })
  })
})
