import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path, { dirname, resolve } from "node:path"
import { pathToFileURL } from "node:url"

const root = path.resolve(import.meta.dir, "..")
const loaderFiles = [".opencode/plugins/honey.js", ".pi/extensions/honey.ts"]

describe("native skill loaders", () => {
  test("resolve only the canonical skills directory at runtime", async () => {
    for (const relative of loaderFiles) {
      const source = await readFile(path.join(root, relative), "utf8")
      expect(source).not.toMatch(/(?:^|["'])\/(?:Users|home)\//)
      expect(source).not.toContain("compatibility")
      expect(resolve(dirname(path.join(root, relative)), "../..", "skills")).toBe(path.join(root, "skills"))
    }
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
