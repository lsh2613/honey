import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const manifests = [
  ".claude-plugin/plugin.json",
  ".codex-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".kimi-plugin/plugin.json",
  ".agy/plugin.json",
]

describe("native plugin manifests", () => {
  test("share Honey identity and version", async () => {
    for (const relative of manifests) {
      const data = JSON.parse(await readFile(path.join(root, relative), "utf8"))
      expect(data.name).toBe("honey")
      expect(data.version).toBe("0.1.0")
      expect(data.description).toBe("Planning, design, implementation, and compounded engineering learnings")
    }
  })

  test("points Codex and Kimi at canonical skills", async () => {
    for (const relative of [".codex-plugin/plugin.json", ".kimi-plugin/plugin.json"]) {
      const data = JSON.parse(await readFile(path.join(root, relative), "utf8"))
      expect(data.skills).toBe("./skills/")
    }
  })
})
