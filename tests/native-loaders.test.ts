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

  test("register only the canonical skills path", async () => {
    const openCodeModule = await import(pathToFileURL(path.join(root, loaderFiles[0])).href)
    const openCode = await openCodeModule.default()
    const openCodeConfig: { skills?: { paths?: string[] } } = {}
    await openCode.config(openCodeConfig)

    let discover: (() => Promise<{ skillPaths: string[] }>) | undefined
    const piModule = await import(pathToFileURL(path.join(root, loaderFiles[1])).href)
    piModule.default({
      on(event: string, handler: () => Promise<{ skillPaths: string[] }>) {
        expect(event).toBe("resources_discover")
        discover = handler
      },
    })

    expect(openCodeConfig.skills?.paths).toEqual([path.join(root, "skills")])
    expect(await discover?.()).toEqual({ skillPaths: [path.join(root, "skills")] })
  })
})
