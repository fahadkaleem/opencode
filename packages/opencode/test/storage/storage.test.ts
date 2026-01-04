import { describe, expect, test } from "bun:test"
import { Storage } from "../../src/storage/storage"

describe("Storage", () => {
  test("should write and read data", async () => {
    const key = ["test", "data"]
    const data = { value: "hello world" }

    await Storage.write(key, data)
    const result = await Storage.read<typeof data>(key)

    expect(result).toEqual(data)
  })

  test("should update data", async () => {
    const key = ["test", "update"]
    const initialData = { count: 1 }

    await Storage.write(key, initialData)

    const updated = await Storage.update<typeof initialData>(key, (draft) => {
      draft.count++
    })

    expect(updated.count).toBe(2)

    const result = await Storage.read<typeof initialData>(key)
    expect(result.count).toBe(2)
  })

  test("should list keys", async () => {
    const prefix = ["test", "list"]
    await Storage.write([...prefix, "a"], { id: "a" })
    await Storage.write([...prefix, "b"], { id: "b" })

    const list = await Storage.list(prefix)

    // list returns full keys (prefix + suffix)
    expect(list).toHaveLength(2)
    // The keys are arrays of strings.
    // We expect: [ ["test", "list", "a"], ["test", "list", "b"] ]
    // But list() implementation details might affect order or format, let's check.

    const stringifiedList = list.map((k) => k.join("/"))
    expect(stringifiedList).toContain("test/list/a")
    expect(stringifiedList).toContain("test/list/b")
  })

  test("should remove data", async () => {
    const key = ["test", "remove"]
    await Storage.write(key, { exists: true })

    await Storage.remove(key)

    // Verify it's gone
    // Storage.read throws NotFoundError if not found?
    // Let's check implementation of read.
    // It uses withErrorHandling which catches ENOENT and throws NotFoundError.

    let error: any
    try {
      await Storage.read(key)
    } catch (e) {
      error = e
    }

    expect(error).toBeInstanceOf(Storage.NotFoundError)
  })

  test("should handle nested keys", async () => {
    const key = ["test", "deep", "nested", "key"]
    const data = { foo: "bar" }
    await Storage.write(key, data)
    const result = await Storage.read(key)
    expect(result).toEqual(data)
  })
})
