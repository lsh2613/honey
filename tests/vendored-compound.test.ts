import { describe, expect, test } from "bun:test"
import { readFile, stat } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")

async function exists(relativePath: string): Promise<boolean> {
  try {
    await stat(path.join(root, relativePath))
    return true
  } catch {
    return false
  }
}

describe("vendored Compound skills", () => {
  test("ship every load-bearing support file", async () => {
    const required = [
      "skills/ce-compound/SKILL.md",
      "skills/ce-compound/assets/resolution-template.md",
      "skills/ce-compound/references/schema.yaml",
      "skills/ce-compound/references/yaml-schema.md",
      "skills/ce-compound/references/grounding-validation.md",
      "skills/ce-compound/references/agents/repo-profiler.md",
      "skills/ce-compound/scripts/repo-profile-cache.py",
      "skills/ce-compound/scripts/validate-frontmatter.py",
      "skills/ce-compound/scripts/validate-doc-claims.py",
      "skills/ce-compound-refresh/SKILL.md",
      "skills/ce-compound-refresh/assets/resolution-template.md",
      "skills/ce-compound-refresh/references/per-action-flows.md",
      "skills/ce-compound-refresh/references/schema.yaml",
      "skills/ce-compound-refresh/scripts/validate-frontmatter.py",
      "skills/ce-compound-refresh/scripts/validate-doc-claims.py"
    ]
    for (const file of required) expect(await exists(file), file).toBe(true)
  })

  test("records the pinned source commit and allowed Honey patches", async () => {
    const lock = JSON.parse(await readFile(path.join(root, "vendor/compound-engineering.lock.json"), "utf8"))
    expect(lock.repository).toBe("https://github.com/EveryInc/compound-engineering-plugin")
    expect(lock.commit).toBe("c9e9d6292211256d3e9279b2abe54c6c1fcef08e")
    expect(lock.skills).toEqual(["ce-compound", "ce-compound-refresh"])
    expect(lock.patches).toEqual([
      "replace-claude-skill-dir-with-portable-skill-dir",
      "add-korean-compound-auto-invoke-examples"
    ])
  })

  test("uses portable skill-directory commands", async () => {
    const skill = await readFile(path.join(root, "skills/ce-compound/SKILL.md"), "utf8")
    expect(skill).not.toContain("${CLAUDE_SKILL_DIR}")
    expect(skill).toContain('SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"')
  })

  test("keeps English and Korean prompt-level auto-invoke examples", async () => {
    const skill = await readFile(path.join(root, "skills/ce-compound/SKILL.md"), "utf8")
    for (const phrase of [
      "that worked",
      "it's fixed",
      "working now",
      "problem solved",
      "잘 됐어",
      "이제 잘 돼",
      "고쳐졌어",
      "수정됐어",
      "해결됐어",
      "문제 해결됐어",
      "정상 동작해"
    ]) expect(skill).toContain(phrase)
    expect(skill).not.toContain("deterministic success detector")
  })
})
