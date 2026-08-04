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

  test("lists the root Honey plugin in the native Codex marketplace", async () => {
    const marketplace = JSON.parse(
      await readFile(path.join(root, ".agents/plugins/marketplace.json"), "utf8")
    )
    expect(marketplace.name).toBe("honey")
    expect(marketplace.interface).toEqual({ displayName: "Honey" })
    expect(marketplace.plugins).toEqual([
      {
        name: "honey",
        source: { source: "local", path: "." },
        policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
        category: "Coding",
      },
    ])
    expect(path.resolve(root, marketplace.plugins[0].source.path)).toBe(root)
  })
})
