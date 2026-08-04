import { describe, expect, test } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter } from "./helpers/frontmatter"

const root = path.resolve(import.meta.dir, "..")
const modelFilledSkillDir = "<absolute path of the directory containing the SKILL.md you just read>"
const forbiddenSkillPathPatterns = [
  /(?:^|[\s`'(\"])\.\.\//m,
  /~\/\.(?:claude|codex)\/plugins\//,
  /~\/\.(?:cache|local\/share)\/[^\s`'\")]*\/skills\//,
  /\/(?:Users|home|root)\/[^\s`'\")]+\/skills\//,
  /\/(?:opt|var|private|usr\/local)\/[^\s`'\")]*\/skills\//,
  /\/\.(?:cache|claude|codex)\/[^\s`'\")]*\/skills\//
]

function preserveModelFilledSkillDir(content: string): string {
  return content.replace(/```[^\n]*\n[\s\S]*?```/g, (block) =>
    block.replaceAll(modelFilledSkillDir, "<model-filled-skill-dir>")
  )
}

function findForbiddenSkillPath(content: string): string | undefined {
  const portableContent = preserveModelFilledSkillDir(content)
  return forbiddenSkillPathPatterns.map((pattern) => portableContent.match(pattern)?.[0]).find(Boolean)
}

async function findSkillFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return findSkillFiles(entryPath)
      return entry.isFile() && entry.name === "SKILL.md" ? [entryPath] : []
    })
  )
  return nested.flat()
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

    for (const skillPath of await findSkillFiles(skillsRoot)) {
      expect(findForbiddenSkillPath(await readFile(skillPath, "utf8")), skillPath).toBeUndefined()
    }
  })

  test("allows portable and model-filled skill paths while rejecting concrete installed paths", () => {
    const portableFixture = `\`\`\`bash
SKILL_DIR="${modelFilledSkillDir}"
mkdir -p /tmp/compound-engineering/ce-compound/run-1
\`\`\``
    const concreteFixtures = [
      "../ce-compound/SKILL.md",
      "~/.claude/plugins/cache/compound/skills/ce-compound",
      "~/.codex/plugins/cache/compound/skills/ce-compound",
      "~/.cache/compound/skills/ce-compound",
      "/Users/alice/.cache/compound/skills/ce-compound",
      "/home/alice/.local/share/compound/skills/ce-compound",
      "/opt/vendor/skills/ce-compound",
      "/var/lib/vendor/skills/ce-compound",
      "/usr/local/share/vendor/skills/ce-compound",
      `\`\`\`bash
SKILL_DIR="${modelFilledSkillDir}"
source "/opt/vendor/skills/ce-compound"
\`\`\``
    ]

    expect(findForbiddenSkillPath(portableFixture)).toBeUndefined()
    for (const fixture of concreteFixtures) expect(findForbiddenSkillPath(fixture), fixture).toBeDefined()
  })
})
