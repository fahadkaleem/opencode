/**
 * Agent Executor Tests (TASK-10)
 *
 * Tests for artifact extraction, summary generation, and output schema.
 */

import { describe, expect, it } from "bun:test"
import { extractArtifactsFromToolCalls, generateSummary } from "./agentExecutor.js"

describe("Agent Executor - Output Helpers (TASK-10)", () => {
  describe("extractArtifactsFromToolCalls", () => {
    it("should return empty array when no tool calls", () => {
      const artifacts = extractArtifactsFromToolCalls([])
      expect(artifacts).toEqual([])
    })

    it("should extract file path from edit tool (filePath)", () => {
      const toolCalls = [
        {
          name: "edit",
          args: { filePath: "/src/foo.ts", oldString: "old", newString: "new" },
          result: { success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual(["/src/foo.ts"])
    })

    it("should extract file path from edit tool (file_path)", () => {
      const toolCalls = [
        {
          name: "edit",
          args: { file_path: "/src/bar.ts", oldString: "old", newString: "new" },
          result: { success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual(["/src/bar.ts"])
    })

    it("should extract file path from write tool", () => {
      const toolCalls = [
        {
          name: "write",
          args: { filePath: "/src/new-file.ts", content: "content" },
          result: { success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual(["/src/new-file.ts"])
    })

    it("should extract file path from patch tool result", () => {
      const toolCalls = [
        {
          name: "patch",
          args: { patch: "diff content" },
          result: { path: "/src/patched.ts", success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual(["/src/patched.ts"])
    })

    it("should extract file path from patch result.file property", () => {
      const toolCalls = [
        {
          name: "patch",
          args: {},
          result: { file: "/src/modified.ts", success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual(["/src/modified.ts"])
    })

    it("should NOT extract from non-edit/write/patch tools", () => {
      const toolCalls = [
        {
          name: "some-other-tool",
          args: {},
          result: { file: "/src/should-not-extract.ts", success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual([])
    })

    it("should deduplicate file paths", () => {
      const toolCalls = [
        {
          name: "edit",
          args: { filePath: "/src/foo.ts" },
          result: { success: true },
        },
        {
          name: "edit",
          args: { filePath: "/src/foo.ts" },
          result: { success: true },
        },
        {
          name: "edit",
          args: { filePath: "/src/bar.ts" },
          result: { success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual(["/src/foo.ts", "/src/bar.ts"])
    })

    it("should handle multiple different tools", () => {
      const toolCalls = [
        {
          name: "edit",
          args: { filePath: "/src/edit.ts" },
          result: { success: true },
        },
        {
          name: "write",
          args: { filePath: "/src/write.ts" },
          result: { success: true },
        },
        {
          name: "patch",
          args: {},
          result: { path: "/src/patch.ts" },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      expect(artifacts).toEqual(["/src/edit.ts", "/src/write.ts", "/src/patch.ts"])
    })

    it("should ignore tools without file paths", () => {
      const toolCalls = [
        {
          name: "bash",
          args: { command: "ls" },
          result: { output: "file1\nfile2" },
        },
        {
          name: "read",
          args: { path: "/src/read.ts" },
          result: { content: "content" },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls)
      // read tool has result, but no path or file property in result
      expect(artifacts).toEqual([])
    })

    it("should handle null/undefined args", () => {
      const toolCalls = [
        {
          name: "edit",
          args: null,
          result: { success: true },
        },
        {
          name: "write",
          args: undefined,
          result: { success: true },
        },
      ]
      const artifacts = extractArtifactsFromToolCalls(toolCalls as any)
      expect(artifacts).toEqual([])
    })
  })

  describe("generateSummary", () => {
    it('should return "Step completed" for empty response and no artifacts', () => {
      const summary = generateSummary("", [])
      expect(summary).toBe("Step completed")
    })

    it("should return response as-is when short and no artifacts", () => {
      const summary = generateSummary("Task completed successfully", [])
      expect(summary).toBe("Task completed successfully")
    })

    it("should truncate long responses at 200 characters", () => {
      const longResponse = "A".repeat(250)
      const summary = generateSummary(longResponse, [])
      expect(summary.length).toBeLessThanOrEqual(203) // 200 + "..."
      expect(summary.endsWith("...")).toBe(true)
    })

    it("should prefix with single file modified message", () => {
      const summary = generateSummary("Made changes", ["/src/foo.ts"])
      expect(summary).toBe("Modified 1 file: /src/foo.ts. Made changes")
    })

    it("should prefix with multiple files modified message", () => {
      const summary = generateSummary("Made changes", ["/src/foo.ts", "/src/bar.ts"])
      expect(summary).toBe("Modified 2 files. Made changes")
    })

    it("should handle artifacts with empty response", () => {
      const summary = generateSummary("", ["/src/foo.ts"])
      expect(summary).toBe("Modified 1 file: /src/foo.ts")
    })

    it("should trim whitespace from response", () => {
      const summary = generateSummary("  Hello World  \n", [])
      expect(summary).toBe("Hello World")
    })

    it("should handle large number of artifacts", () => {
      const artifacts = Array.from({ length: 10 }, (_, i) => `/src/file${i}.ts`)
      const summary = generateSummary("Done", artifacts)
      expect(summary).toBe("Modified 10 files. Done")
    })

    it("should truncate then add artifact info", () => {
      const longResponse = "A".repeat(250)
      const summary = generateSummary(longResponse, ["/src/foo.ts", "/src/bar.ts"])
      expect(summary.startsWith("Modified 2 files. ")).toBe(true)
      expect(summary.endsWith("...")).toBe(true)
    })
  })
})
