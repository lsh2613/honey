import { describe, expect, test } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter } from "./helpers/frontmatter"

const root = path.resolve(import.meta.dir, "..")

function preserveModelFilledAbsolutePathExamples(content: string): string {
  return content.replace(/```[^\n]*\n[\s\S]*?```/g, (block) =>
    block.replace(/<absolute path[^>]*>/g, "<model-filled-path>")
  )
}

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

  test("every skill stays self-contained and portable", async () => {
    const skillsRoot = path.join(root, "skills")
    const entries = await readdir(skillsRoot, { withFileTypes: true })

    for (const entry of entries.filter((entry) => entry.isDirectory())) {
      const skillPath = path.join(skillsRoot, entry.name, "SKILL.md")
      const content = preserveModelFilledAbsolutePathExamples(await readFile(skillPath, "utf8"))

      expect(content, skillPath).not.toMatch(/(?:^|[\s`'("])\.\.\//m)
      expect(content, skillPath).not.toMatch(/~\/\.(?:claude|codex)\/plugins\//)
      expect(content, skillPath).not.toMatch(/\/Users\/[^\s`]+\/skills\//)
    }
  })
})
