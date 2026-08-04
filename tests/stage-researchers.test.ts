import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const stages = ["honey-plan", "honey-design", "honey-work"] as const

describe("stage-owned learnings researchers", () => {
  test("each stage owns and dispatches its local researcher", async () => {
    for (const stage of stages) {
      const skill = await readFile(path.join(root, "skills", stage, "SKILL.md"), "utf8")
      const researcher = await readFile(
        path.join(root, "skills", stage, "references/agents/learnings-researcher.md"),
        "utf8"
      )
      expect(skill).toContain("references/agents/learnings-researcher.md")
      expect(skill).toContain("generic subagent")
      expect(researcher).toContain("docs/solutions/")
      expect(researcher).toContain("CONCEPTS.md")
    }
  })

  test("all researchers preserve the upstream retrieval budget", async () => {
    for (const stage of stages) {
      const content = await readFile(
        path.join(root, "skills", stage, "references/agents/learnings-researcher.md"),
        "utf8"
      )
      expect(content).toContain(">25 candidates")
      expect(content).toContain("<3 candidates")
      expect(content).toContain("first 30 lines")
      expect(content).toContain("up to 5 findings")
      expect(content).toContain("current code")
    }
  })

  test("each stage passes structured context and consumes bounded findings", async () => {
    for (const stage of stages) {
      const skill = await readFile(path.join(root, "skills", stage, "SKILL.md"), "utf8")
      expect(skill).toContain("<work-context>")
      expect(skill).toContain("Activity:")
      expect(skill).toContain("Concepts:")
      expect(skill).toContain("Decisions:")
      expect(skill).toContain("Domains:")
      expect(skill).toContain("up to five distilled findings")
      expect(skill).toContain("path, relevance, applicable insight, and conflict/freshness warning")
      expect(skill).toContain("before")
      expect(skill).toMatch(/full\s+`docs\/solutions\/` corpus/)
    }
  })

  test("does not introduce stage metadata or a central researcher", async () => {
    for (const stage of stages) {
      const content = await readFile(
        path.join(root, "skills", stage, "references/agents/learnings-researcher.md"),
        "utf8"
      )
      expect(content).not.toContain("use_in")
      expect(content).not.toContain("../honey-")
    }
  })
})
