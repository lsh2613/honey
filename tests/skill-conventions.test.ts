import { describe, expect, test } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter } from "./helpers/frontmatter"

const root = path.resolve(import.meta.dir, "..")

describe("Agent Skills contract", () => {
  test("every skill has valid identifying frontmatter", async () => {
    const skillsRoot = path.join(root, "skills")
    const entries = await readdir(skillsRoot, { withFileTypes: true })
    const skillDirs = entries.filter((entry) => entry.isDirectory())
    expect(skillDirs.length).toBeGreaterThan(0)

    for (const entry of skillDirs) {
      const content = await readFile(path.join(skillsRoot, entry.name, "SKILL.md"), "utf8")
      const { data } = parseFrontmatter(content)
      expect(data.name).toMatch(/^[a-z0-9][a-z0-9-]*$/)
      expect(String(data.description ?? "").trim()).not.toBe("")
    }
  })
})
