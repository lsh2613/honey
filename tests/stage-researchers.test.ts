import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const stages = ["honey-plan", "honey-design", "honey-work"] as const
const researcherBodyStart = "## Step 0: Ground in CONCEPTS.md (if present)"

function withoutInvocationContract(content: string): string {
  return content.replace(
    /^## Honey (?:Plan|Design|Work) Invocation Contract\n[\s\S]*?(?=^## Step 0: Ground in CONCEPTS\.md \(if present\)$)/m,
    "## Invocation Contract\n"
  )
}

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

  test("all researchers preserve the same upstream retrieval algorithm outside their invocation contracts", async () => {
    const bodies = []
    for (const stage of stages) {
      const content = await readFile(
        path.join(root, "skills", stage, "references/agents/learnings-researcher.md"),
        "utf8"
      )
      expect(content, stage).toContain(researcherBodyStart)
      bodies.push(withoutInvocationContract(content))
      expect(content).toContain(">25 candidates")
      expect(content).toContain("<3 candidates")
      expect(content).toContain("first 30 lines")
      expect(content).toContain("up to 5 findings")
      expect(content).toContain("current code")
    }
    expect(bodies).toEqual([bodies[0], bodies[0], bodies[0]])
  })

  test("each stage dispatches, consumes findings, then produces its artifact", async () => {
    const outputMarkers = {
      "honey-plan": "Produce the requirements plan",
      "honey-design": "Produce the technical design",
      "honey-work": "Implement and verify the approved work"
    }
    for (const stage of stages) {
      const skill = await readFile(path.join(root, "skills", stage, "SKILL.md"), "utf8")
      expect(skill).toContain("<work-context>")
      expect(skill).toContain("Activity:")
      expect(skill).toContain("Concepts:")
      expect(skill).toContain("Decisions:")
      expect(skill).toContain("Domains:")
      expect(skill).toContain("up to five distilled findings")
      expect(skill).toContain("path, relevance, applicable insight, and conflict/freshness warning")
      expect(skill).toMatch(/full\s+`docs\/solutions\/` corpus/)
      const dispatchIndex = skill.indexOf("Dispatch a generic subagent")
      const consumeIndex = skill.indexOf("Consume the returned findings")
      const outputIndex = skill.indexOf(outputMarkers[stage])
      expect(dispatchIndex, `${stage} dispatch marker`).toBeGreaterThanOrEqual(0)
      expect(consumeIndex, `${stage} consume marker`).toBeGreaterThanOrEqual(0)
      expect(outputIndex, `${stage} output marker`).toBeGreaterThanOrEqual(0)
      expect(consumeIndex, stage).toBeGreaterThan(dispatchIndex)
      expect(outputIndex, stage).toBeGreaterThan(consumeIndex)
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
