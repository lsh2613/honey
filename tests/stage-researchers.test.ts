import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter } from "./helpers/frontmatter"

const root = path.resolve(import.meta.dir, "..")
const stages = ["plan", "design", "work"] as const
const researcherBodyStart = "## Step 0: Ground in CONCEPTS.md (if present)"

function withoutInvocationContract(content: string): string {
  return content.replace(
    /^## (?:Plan|Design|Work) Invocation Contract\n[\s\S]*?(?=^## Step 0: Ground in CONCEPTS\.md \(if present\)$)/m,
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
      expect(researcher).toContain("at invocation time")
      expect(researcher).toContain("Probe the live `docs/solutions/` directory")
      expect(researcher).toContain("native file-search/glob tool")
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
      plan: "Produce the requirements plan",
      design: "Produce the technical design",
      work: "Implement and verify the approved work"
    }
    for (const stage of stages) {
      const skill = await readFile(path.join(root, "skills", stage, "SKILL.md"), "utf8")
      expect(skill).toContain("<work-context>")
      expect(skill).toContain("Activity:")
      expect(skill).toContain("Concepts:")
      expect(skill).toContain("Decisions:")
      expect(skill).toContain("Domains:")
      expect(skill).toContain("up to five distilled findings")
      expect(skill).toContain("path, exact source date, relevance, applicable insight, and conflict/freshness warning")
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

  test("each stage has a bounded local fallback when generic subagent dispatch is unavailable", async () => {
    for (const stage of stages) {
      const skill = await readFile(path.join(root, "skills", stage, "SKILL.md"), "utf8")
      const dispatchIndex = skill.indexOf("Dispatch a generic subagent")
      const fallbackIndex = skill.indexOf("If generic subagent creation or dispatch is unavailable or fails")
      const consumeIndex = skill.indexOf("Consume the returned findings")

      expect(fallbackIndex, stage).toBeGreaterThan(dispatchIndex)
      expect(consumeIndex, stage).toBeGreaterThan(fallbackIndex)
      expect(skill).toContain("run one bounded local researcher pass in the parent context")
      expect(skill).toContain("same complete local researcher prompt")
      expect(skill).toContain("fresh `docs/solutions/` enumeration")
      expect(skill).toContain("exact source-date reporting")
      expect(skill).toContain("up to five distilled findings")
    }
  })

  test("does not introduce stage metadata or a central researcher", async () => {
    for (const stage of stages) {
      const content = await readFile(
        path.join(root, "skills", stage, "references/agents/learnings-researcher.md"),
        "utf8"
      )
      expect(content).not.toContain("use_in")
      expect(content).not.toMatch(/\.\.\/[a-z0-9-]+/)
    }
  })

  test("keeps the retrieval fixture and evaluator rubric separate from forward prompts", async () => {
    const evaluation = await readFile(path.join(root, "evals/stage-retrieval/README.md"), "utf8")
    const fixture = await readFile(
      path.join(root, "evals/stage-retrieval/docs/solutions/runtime-errors/token-refresh-race.md"),
      "utf8"
    )
    const approvedPrompts = await readFile(
      path.join(root, "tests/fixtures/stage-retrieval-forward-prompts.md"),
      "utf8"
    )
    const promptsStart = evaluation.indexOf("## Forward-Test Prompts")
    const rubricStart = evaluation.indexOf("## Evaluator Rubric")
    const promptsEnd = evaluation.indexOf("\n## ", promptsStart + 1)
    const prompts = evaluation.slice(promptsStart, promptsEnd)
    const rubric = evaluation.slice(rubricStart)
    const rubricItems = [...rubric.matchAll(/^\d+\.\s[\s\S]*?(?=^\d+\.\s|(?![\s\S]))/gm)].map((match) => match[0])
    const { data, body } = parseFrontmatter(fixture)

    expect(promptsStart).toBeGreaterThanOrEqual(0)
    expect(rubricStart).toBeGreaterThan(promptsStart)
    expect(prompts.trim()).toBe(approvedPrompts.trim())
    expect(rubricItems).toHaveLength(6)
    const dateItem = rubricItems.find((item) => item.includes("exact source date"))
    const freshnessItem = rubricItems.find((item) => item.includes("visible conflict/freshness assessment"))
    expect(dateItem).toContain("exact source date: `2026-08-04`")
    expect(dateItem).not.toContain("conflict/freshness")
    expect(freshnessItem).toContain("visible conflict/freshness assessment")
    expect(freshnessItem).not.toContain("2026-08-04")
    expect(dateItem).not.toBe(freshnessItem)
    expect(evaluation).toContain("git init")
    expect(evaluation).toContain("git add README.md")
    const preRunStart = evaluation.indexOf("## Pre-Run Git Evidence")
    const postRunStart = evaluation.indexOf("## Post-Run Git Evidence")
    expect(preRunStart).toBeGreaterThanOrEqual(0)
    expect(postRunStart).toBeGreaterThan(preRunStart)
    const preRun = evaluation.slice(preRunStart, evaluation.indexOf("\n## ", preRunStart + 1))
    const postRun = evaluation.slice(postRunStart, evaluation.indexOf("\n## ", postRunStart + 1))
    for (const section of [preRun, postRun]) {
      expect(section).toContain("git status --short")
      expect(section).toContain("git ls-files docs/solutions")
    }
    expect(data.module).toBe("authentication")
    expect(data.component).toBe("background_job")
    expect(data.problem_type).toBe("runtime_error")
    expect(data.tags).toEqual(["oauth", "token-refresh", "concurrency"])
    expect(body).toContain("Concurrent background refresh workers")
    expect(body).toContain("single-flight lock")
  })
})
