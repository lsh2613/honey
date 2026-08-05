import { describe, expect, test } from "bun:test"
import { readFile, realpath } from "node:fs/promises"
import path, { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const root = path.resolve(import.meta.dir, "..")
const loaderFiles = [".opencode/plugins/honey.js", ".pi/extensions/honey.ts"]

function withoutVendoredProvenance(readme: string) {
  const sectionStart = readme.indexOf("\n## Vendored Provenance\n")
  if (sectionStart === -1) return readme

  const nextSection = readme.indexOf("\n## ", sectionStart + 1)
  return `${readme.slice(0, sectionStart)}${nextSection === -1 ? "" : readme.slice(nextSection)}`
}

describe("native skill loaders", () => {
  test("keeps deprecated identifiers after vendored provenance in active checks", () => {
    const readme = [
      "## Skills",
      "## Vendored Provenance",
      "upstream `ce-compound` and `ce-compound-refresh`",
      "## Local Development",
      "honey-plan",
    ].join("\n")
    const activeReadme = withoutVendoredProvenance(readme)

    expect(activeReadme).toContain("honey-plan")
  })

  test("documents only the prefix-free public skill names", async () => {
    const [readme, ...otherDocs] = await Promise.all([
      "README.md",
      "evals/stage-retrieval/README.md",
      "tests/fixtures/stage-retrieval-forward-prompts.md",
    ].map((relative) => readFile(path.join(root, relative), "utf8")))
    const activeReadme = withoutVendoredProvenance(readme)
    const combined = [activeReadme, ...otherDocs].join("\n")

    for (const skill of ["`plan`", "`design`", "`work`", "`compound`", "`compound-refresh`"]) {
      expect(combined).toContain(skill)
    }
    for (const deprecated of [
      "honey-plan",
      "honey-design",
      "honey-work",
      "ce-compound",
      "ce-compound-refresh",
    ]) expect(combined).not.toContain(deprecated)
    expect(readme).toContain("upstream `ce-compound` and `ce-compound-refresh`")
  })

  test("documents native installation, development, provenance, and graceful degradation", async () => {
    const readme = await readFile(path.join(root, "README.md"), "utf8")
    const gitignore = await readFile(path.join(root, ".gitignore"), "utf8")

    for (const section of [
      "## Claude Code",
      "## Codex",
      "## OpenCode",
      "## Pi",
      "## Local Development",
      "## Validation",
      "## Vendored Provenance",
      "## Graceful Degradation",
    ]) {
      expect(readme).toContain(section)
    }
    expect(readme).toContain("Auto-invoke is an LLM instruction, not a deterministic hook")
    expect(readme).toContain("targeted by default")
    expect(readme).toContain("vendor/compound-engineering.lock.json")
    expect(readme).toContain("THIRD_PARTY_NOTICES.md")
    expect(readme).toContain('agy plugin install "$PWD/.agy"')
    expect(readme).toContain('agy plugin validate "$PWD/.agy"')
    expect(readme).not.toContain('agy plugin install "$PWD"\n')
    expect(readme).not.toContain('agy plugin validate "$PWD"\n')
    expect(readme).toContain('codex plugin marketplace add "$PWD"')
    expect(readme).toContain("codex plugin add honey@honey")
    expect(readme).toContain("Kimi command is upstream documented and was not smoke-tested in this environment.")
    expect(readme).toContain("Pi command is upstream documented and was not smoke-tested in this environment.")
    expect(readme).toContain("Antigravity validate command was empirically passed for `$PWD/.agy`.")
    expect(readme).toContain("Antigravity install command is upstream documented and was not locally executed.")
    expect(gitignore.trim()).toBe("node_modules/")
  })

  test("resolve only the canonical skills directory at runtime", async () => {
    for (const relative of loaderFiles) {
      const source = await readFile(path.join(root, relative), "utf8")
      expect(source).not.toMatch(/(?:^|["'])\/(?:Users|home)\//)
      expect(source).not.toContain("compatibility")
      expect(resolve(dirname(path.join(root, relative)), "../..", "skills")).toBe(path.join(root, "skills"))
    }
  })

  test("keeps the Antigravity compatibility entry pointed at canonical skills", async () => {
    expect(await realpath(path.join(root, ".agy", "skills"))).toBe(path.join(root, "skills"))
  })

  test("preserves OpenCode config while registering the canonical skills path once", async () => {
    const openCodeModule = await import(pathToFileURL(path.join(root, loaderFiles[0])).href)
    const openCode = await openCodeModule.default()
    const existingSkillsDir = "/opt/existing-skills"
    const honeySkillsDir = path.join(root, "skills")
    const openCodeConfig = {
      formatter: { enabled: true },
      skills: { paths: [existingSkillsDir] },
    }
    await openCode.config(openCodeConfig)
    await openCode.config(openCodeConfig)

    let discover: (() => Promise<{ skillPaths: string[] }>) | undefined
    const piModule = await import(pathToFileURL(path.join(root, loaderFiles[1])).href)
    piModule.default({
      on(event: string, handler: () => Promise<{ skillPaths: string[] }>) {
        expect(event).toBe("resources_discover")
        discover = handler
      },
    })

    expect(openCodeConfig.formatter).toEqual({ enabled: true })
    expect(openCodeConfig.skills.paths).toEqual([existingSkillsDir, honeySkillsDir])
    expect(openCodeConfig.skills.paths.filter((skillsDir) => skillsDir === honeySkillsDir)).toHaveLength(1)
    expect(await discover?.()).toEqual({ skillPaths: [honeySkillsDir] })
  })
})
