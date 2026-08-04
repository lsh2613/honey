import { describe, expect, test } from "bun:test"
import { readFile, stat } from "node:fs/promises"
import yaml from "js-yaml"
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

function knowledgeProblemTypes(schemaText: string): unknown[] {
  const schema = yaml.load(schemaText) as { tracks?: { knowledge?: { problem_types?: unknown } } }
  const problemTypes = schema.tracks?.knowledge?.problem_types
  if (!Array.isArray(problemTypes)) throw new Error("knowledge-track problem_types must be an array")
  return problemTypes
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

  test("preserves the settled solution-only knowledge model", async () => {
    const compound = await readFile(path.join(root, "skills/ce-compound/SKILL.md"), "utf8")
    const compoundSchema = await readFile(path.join(root, "skills/ce-compound/references/schema.yaml"), "utf8")
    const refresh = await readFile(path.join(root, "skills/ce-compound-refresh/SKILL.md"), "utf8")
    const refreshSchema = await readFile(
      path.join(root, "skills/ce-compound-refresh/references/schema.yaml"),
      "utf8"
    )

    expect(compound).toContain("docs/solutions/")
    expect(compound).not.toContain("docs/decisions/")
    expect(knowledgeProblemTypes(compoundSchema)).toEqual(
      expect.arrayContaining(["tooling_decision", "architecture_pattern"])
    )
    expect(knowledgeProblemTypes(refreshSchema)).toEqual(knowledgeProblemTypes(compoundSchema))
    expect(refreshSchema).toBe(compoundSchema)
    expect(refresh).toContain("status: stale")
    expect(refresh).toContain("stale_reason")
    expect(refresh).toContain("stale_date")
    expect(refresh).toContain("Delete, don't archive")
    expect(refresh).toMatch(
      /If classification is genuinely ambiguous \(Update vs Replace vs Consolidate vs Delete\) or Replace evidence is insufficient, mark as stale with `status: stale`, `stale_reason`, and `stale_date` in the frontmatter\./
    )
    expect(refresh).toMatch(
      /\*\*Insufficient evidence\*\*[\s\S]*?→ Mark as stale in place:[\s\S]*?`stale_reason: \[what you found\]`/
    )
  })

  test("keeps docs enumeration fresh", async () => {
    const compound = await readFile(path.join(root, "skills/ce-compound/SKILL.md"), "utf8")
    expect(compound).toContain("docs/solutions/` enumeration is NEVER cached")
  })
})
