# Honey Compound Skills Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Honey as a TypeScript/Bun, skills-only plugin bundle that runs inside existing agent hosts, provides independent planning/design/implementation learning researchers, and vendors Compound Engineering's `ce-compound` and `ce-compound-refresh` workflows with only portability and Korean trigger adaptations.

**Architecture:** Honey's canonical runtime content lives under root `skills/`. Existing agent hosts own model calls, conversations, tools, permissions, and subagents; Honey supplies self-contained Agent Skills plus native manifests/loaders. The two Compound Engineering skills are vendored from commit `c9e9d6292211256d3e9279b2abe54c6c1fcef08e`, while each Honey workflow owns its own `learnings-researcher.md` prompt and stage-specific invocation contract.

**Tech Stack:** TypeScript, Bun, Bun test runner, Markdown Agent Skills, JSON plugin manifests, small JavaScript/TypeScript native loader entrypoints.

## Global Constraints

- Honey is a skills bundle for existing hosts, not an independent LLM or tool-loop runtime.
- Root `skills/` is the sole canonical skill source; generated or compatibility copies must never become authoring sources.
- Vendor `skills/ce-compound/` and `skills/ce-compound-refresh/` as complete self-contained directories, including `SKILL.md`, `assets/`, `references/`, and `scripts/`.
- Preserve the upstream bug/knowledge tracks, existing frontmatter fields, required `component`, category mapping, parser-safety-only validation, refresh classifications, and exceptional stale metadata behavior.
- Do not add ADR support, `use_in`, `record_type`, `schema_version`, IDs, timestamps beyond upstream `date`, strict schema validation, a centralized researcher, or a deterministic success detector.
- Keep planning, design, and implementation researchers as three independent prompt files. Their search algorithm stays equivalent, while their invocation and output contracts are stage-specific.
- Preserve prompt-driven auto-invoke semantics. Add Korean examples alongside the upstream English phrases, but do not add hooks or string-matching code.
- Replace executable `${CLAUDE_SKILL_DIR}` paths in the vendored Compound skill with the model-filled `SKILL_DIR` pattern so bundled scripts work across supported hosts.
- Read-time references remain relative to each skill root. No skill may traverse into a sibling skill directory.
- If a host lacks a capability such as session history, GitHub access, a blocking question primitive, or parallel subagents, preserve upstream graceful degradation.
- Copy and retain the upstream MIT license notice and record the exact source commit plus Honey patches.
- Do not modify the source checkout at `/Users/seowon/Desktop/github/compound-engineering-plugin`.

---

## Planned File Structure

```text
honey/
├── AGENTS.md
├── README.md
├── THIRD_PARTY_NOTICES.md
├── package.json
├── tsconfig.json
├── .claude-plugin/plugin.json
├── .codex-plugin/plugin.json
├── .cursor-plugin/plugin.json
├── .kimi-plugin/plugin.json
├── .agy/plugin.json
├── .opencode/plugins/honey.js
├── .pi/extensions/honey.ts
├── vendor/compound-engineering.lock.json
├── skills/
│   ├── honey-plan/
│   │   ├── SKILL.md
│   │   └── references/agents/learnings-researcher.md
│   ├── honey-design/
│   │   ├── SKILL.md
│   │   └── references/agents/learnings-researcher.md
│   ├── honey-work/
│   │   ├── SKILL.md
│   │   └── references/agents/learnings-researcher.md
│   ├── ce-compound/
│   └── ce-compound-refresh/
└── tests/
    ├── helpers/frontmatter.ts
    ├── manifests.test.ts
    ├── skill-conventions.test.ts
    ├── stage-researchers.test.ts
    ├── vendored-compound.test.ts
    └── native-loaders.test.ts
```

### Responsibility Map

- `skills/honey-plan`: owns requirements/planning behavior and planning-specific learning distillation.
- `skills/honey-design`: owns technical design behavior and design-specific learning distillation.
- `skills/honey-work`: owns implementation behavior and implementation-specific learning distillation.
- `skills/ce-compound`: captures one verified reusable learning and selectively routes targeted refresh.
- `skills/ce-compound-refresh`: maintains the existing learning corpus using upstream Keep/Update/Consolidate/Replace/Delete/Stale behavior.
- `vendor/compound-engineering.lock.json`: records provenance and the intentionally maintained Honey patch set.
- Platform manifests/loaders: expose the same root skills tree to each host without copying skill contents.
- Contract tests: enforce self-containment, portability, stage researcher independence, upstream behavior, and native loader paths.

---

### Task 1: Bootstrap the Skills-Only Package

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `AGENTS.md`
- Create: `tests/helpers/frontmatter.ts`
- Create: `tests/skill-conventions.test.ts`

**Interfaces:**
- Consumes: Bun 1.x and repository-relative `skills/<name>/SKILL.md` directories.
- Produces: `bun test`, a reusable `parseFrontmatter(text)` helper, and repository rules for all later tasks.

- [ ] **Step 1: Write the failing skill discovery test**

Create `tests/skill-conventions.test.ts` with a test that enumerates immediate directories under `skills/`, requires a `SKILL.md`, parses YAML frontmatter, and requires ASCII `name` plus non-empty `description`.

```ts
import { describe, expect, test } from "bun:test"
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { parseFrontmatter } from "./helpers/frontmatter"

const root = path.resolve(import.meta.dir, "..")

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
})
```

- [ ] **Step 2: Run the test and verify the empty repository fails**

Run: `bun test tests/skill-conventions.test.ts`

Expected: FAIL because `package.json`, the helper, or `skills/` does not exist.

- [ ] **Step 3: Add the Bun package and TypeScript configuration**

Create `package.json`:

```json
{
  "name": "honey-agent-skills",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": ".opencode/plugins/honey.js",
  "scripts": {
    "test": "bun test",
    "validate": "bun test"
  },
  "pi": {
    "extensions": ["./.pi/extensions/honey.ts"],
    "skills": ["./skills"]
  },
  "devDependencies": {
    "bun-types": "^1.2.0",
    "js-yaml": "^4.1.0",
    "@types/js-yaml": "^4.0.9"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "types": ["bun-types"],
    "noEmit": true
  },
  "include": ["tests/**/*.ts", ".pi/**/*.ts"]
}
```

- [ ] **Step 4: Implement the frontmatter helper**

Create `tests/helpers/frontmatter.ts`:

```ts
import yaml from "js-yaml"

export function parseFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== "---") throw new Error("missing opening frontmatter delimiter")
  const end = lines.indexOf("---", 1)
  if (end === -1) throw new Error("missing closing frontmatter delimiter")
  const data = yaml.load(lines.slice(1, end).join("\n"))
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter must be a mapping")
  }
  return { data: data as Record<string, unknown>, body: lines.slice(end + 1).join("\n") }
}
```

- [ ] **Step 5: Add repository instructions**

Create `AGENTS.md` with these enforceable rules:

```markdown
# Honey Agent Instructions

- `skills/` is the canonical runtime source.
- Every skill is self-contained: never reference a sibling skill file by relative traversal.
- Keep identifiers and file names ASCII.
- Preserve vendored Compound behavior unless a patch is listed in `vendor/compound-engineering.lock.json`.
- Run `bun test` after any skill, manifest, loader, or test change.
- Do not add an LLM runtime, deterministic compound detector, ADR store, centralized researcher, or strict solution-schema validator without an explicit product decision.
- Use `SKILL_DIR` populated from the loaded `SKILL.md` path for executed bundled scripts; do not introduce host-specific skill-directory variables.
```

- [ ] **Step 6: Add the first temporary fixture skill and make the contract pass**

Create `skills/honey-plan/SKILL.md` with only valid frontmatter and a one-line temporary body; Task 4 replaces the body.

```markdown
---
name: honey-plan
description: Create a requirements plan with repository-grounded prior learnings.
---

# Honey Plan

Create a requirements plan.
```

Run: `bun install && bun test tests/skill-conventions.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the package foundation**

```bash
git add package.json tsconfig.json AGENTS.md tests skills/honey-plan/SKILL.md bun.lock
git commit -m "chore: bootstrap Honey skills bundle"
```

---

### Task 2: Vendor Compound and Refresh with Provenance

**Files:**
- Create: `skills/ce-compound/**`
- Create: `skills/ce-compound-refresh/**`
- Create: `vendor/compound-engineering.lock.json`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `tests/vendored-compound.test.ts`

**Interfaces:**
- Consumes: `/Users/seowon/Desktop/github/compound-engineering-plugin/skills/ce-compound`, `/Users/seowon/Desktop/github/compound-engineering-plugin/skills/ce-compound-refresh`, and upstream commit `c9e9d6292211256d3e9279b2abe54c6c1fcef08e`.
- Produces: two complete vendored Agent Skills and machine-readable provenance for review and future manual upgrades.

- [ ] **Step 1: Write failing completeness and provenance tests**

Create `tests/vendored-compound.test.ts`:

```ts
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
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `bun test tests/vendored-compound.test.ts`

Expected: FAIL because the vendored directories and lock file do not exist.

- [ ] **Step 3: Copy the complete skill directories mechanically**

Run from `/Users/seowon/Desktop/github/honey`:

```bash
cp -R /Users/seowon/Desktop/github/compound-engineering-plugin/skills/ce-compound skills/ce-compound
cp -R /Users/seowon/Desktop/github/compound-engineering-plugin/skills/ce-compound-refresh skills/ce-compound-refresh
```

Do not hand-select support files. The source skill directories are self-contained units.

- [ ] **Step 4: Record provenance and the only allowed patches**

Create `vendor/compound-engineering.lock.json`:

```json
{
  "repository": "https://github.com/EveryInc/compound-engineering-plugin",
  "commit": "c9e9d6292211256d3e9279b2abe54c6c1fcef08e",
  "sourceDirectories": ["skills/ce-compound", "skills/ce-compound-refresh"],
  "copiedOn": "2026-08-04",
  "skills": ["ce-compound", "ce-compound-refresh"],
  "patches": [
    "replace-claude-skill-dir-with-portable-skill-dir",
    "add-korean-compound-auto-invoke-examples"
  ],
  "updatePolicy": "manual-review-only"
}
```

- [ ] **Step 5: Preserve the upstream license**

Create `THIRD_PARTY_NOTICES.md` with the upstream repository, pinned commit, a statement that the two skill directories are modified copies, and the complete MIT license text from `/Users/seowon/Desktop/github/compound-engineering-plugin/LICENSE`.

- [ ] **Step 6: Verify the copied inventory and run the tests**

Run:

```bash
find skills/ce-compound skills/ce-compound-refresh -type f | sort
bun test tests/vendored-compound.test.ts tests/skill-conventions.test.ts
```

Expected: both suites PASS and the inventory includes every source file.

- [ ] **Step 7: Commit the unpatched vendor snapshot**

```bash
git add skills/ce-compound skills/ce-compound-refresh vendor THIRD_PARTY_NOTICES.md tests/vendored-compound.test.ts
git commit -m "feat: vendor compound learning workflows"
```

---

### Task 3: Apply the Two Honey Vendor Patches

**Files:**
- Modify: `skills/ce-compound/SKILL.md`
- Test: `tests/vendored-compound.test.ts`

**Interfaces:**
- Consumes: the upstream `ce-compound` workflow from Task 2.
- Produces: host-neutral bundled-script execution and bilingual prompt-level auto-invoke examples without changing workflow semantics.

- [ ] **Step 1: Add failing portability and trigger tests**

Append to `tests/vendored-compound.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests and verify both fail**

Run: `bun test tests/vendored-compound.test.ts`

Expected: FAIL because `${CLAUDE_SKILL_DIR}` remains and Korean examples are absent.

- [ ] **Step 3: Replace executable Claude-only path blocks**

For each current `${CLAUDE_SKILL_DIR}` command in `skills/ce-compound/SKILL.md`, replace it with a same-command model-filled anchor. The session-history discovery command must have this shape:

```bash
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
bash "$SKILL_DIR/scripts/session-history/discover-sessions.sh" "$REPO_NAME" "$SCAN_DAYS" --cwd "$REPO_ROOT" | tr '\n' '\0' | xargs -0 python3 "$SKILL_DIR/scripts/session-history/extract-metadata.py" --cwd-filter "$REPO_ROOT"
```

The frontmatter validator command must have this shape:

```bash
SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"
python3 "$SKILL_DIR/scripts/validate-frontmatter.py" <output-path>
```

Update adjacent prose so missing scripts produce the existing visible fallback, without claiming `SKILL_DIR` is an environment variable.

- [ ] **Step 4: Add Korean examples to the existing auto-invoke block**

Retain `<auto_invoke>` and append the seven Korean phrases from the failing test. Do not add a hook, matcher implementation, or new frontmatter key.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
bun test tests/vendored-compound.test.ts
bun test
```

Expected: PASS.

- [ ] **Step 6: Commit the reviewed vendor patches**

```bash
git add skills/ce-compound/SKILL.md tests/vendored-compound.test.ts
git commit -m "fix: make compound workflow portable across hosts"
```

---

### Task 4: Create Independent Stage Researchers

**Files:**
- Modify: `skills/honey-plan/SKILL.md`
- Create: `skills/honey-plan/references/agents/learnings-researcher.md`
- Create: `skills/honey-design/SKILL.md`
- Create: `skills/honey-design/references/agents/learnings-researcher.md`
- Create: `skills/honey-work/SKILL.md`
- Create: `skills/honey-work/references/agents/learnings-researcher.md`
- Create: `tests/stage-researchers.test.ts`

**Interfaces:**
- Consumes: a stage-owned `<work-context>` containing `Activity`, `Concepts`, `Decisions`, and `Domains`; the live `docs/solutions/` tree; optional root `CONCEPTS.md`.
- Produces: up to five distilled findings with path, relevance, applicable insight, and conflict/freshness warning for the calling stage.

- [ ] **Step 1: Write failing stage ownership and search-contract tests**

Create `tests/stage-researchers.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `bun test tests/stage-researchers.test.ts`

Expected: FAIL because the three complete stage skills and prompt assets do not exist.

- [ ] **Step 3: Seed three independent researcher prompts**

Copy `/Users/seowon/Desktop/github/compound-engineering-plugin/skills/ce-plan/references/agents/learnings-researcher.md` into each stage's `references/agents/` directory. Keep the search algorithm intact in all three files.

At the top of each file, replace only the invocation contract:

```markdown
## Honey Plan Invocation Contract

Distill relevant prior learnings into requirements constraints, prior decisions,
failed approaches, and product or workflow risks. Do not produce implementation design.
```

```markdown
## Honey Design Invocation Contract

Distill relevant prior learnings into architecture constraints, patterns to follow,
tooling decisions, conventions, and rejected technical approaches.
```

```markdown
## Honey Work Invocation Contract

Distill relevant prior learnings into concrete implementation cautions, affected
modules and components, known failure modes, prevention checks, and regression risks.
```

- [ ] **Step 4: Implement each stage's dispatch stub**

Each `SKILL.md` must construct this input from its current stage context and dispatch a generic subagent seeded with its local researcher file:

```xml
<work-context>
Activity: <the current stage objective>
Concepts: <domain and technical terms>
Decisions: <choices being considered or already settled>
Domains: <modules, components, and repository areas>
</work-context>
```

The stage must consume distilled findings before producing its own artifact. It must not pass the full solution corpus into the parent context.

- [ ] **Step 5: Run focused tests**

Run: `bun test tests/stage-researchers.test.ts tests/skill-conventions.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the independent researchers**

```bash
git add skills/honey-plan skills/honey-design skills/honey-work tests/stage-researchers.test.ts
git commit -m "feat: ground each Honey stage in prior learnings"
```

---

### Task 5: Enforce Self-Containment and Compound Behavior

**Files:**
- Modify: `tests/skill-conventions.test.ts`
- Modify: `tests/vendored-compound.test.ts`

**Interfaces:**
- Consumes: every `SKILL.md`, its own skill root, and the settled compound behavior contract.
- Produces: automated rejection of cross-skill paths, absolute installed-plugin paths, ADR drift, centralized retrieval, strict schema drift, and refresh-policy regressions.

- [ ] **Step 1: Add failing self-containment tests**

Extend `tests/skill-conventions.test.ts` to reject:

```ts
expect(content).not.toMatch(/(?:^|[\s`'(])\.\.\//m)
expect(content).not.toMatch(/~\/\.(?:claude|codex)\/plugins\//)
expect(content).not.toMatch(/\/Users\/[^\s`]+\/skills\//)
```

Allow only explanatory absolute paths inside fenced examples when the path contains `<absolute path`; reject real machine paths.

- [ ] **Step 2: Add failing compound policy assertions**

Extend `tests/vendored-compound.test.ts`:

```ts
test("preserves the settled solution-only knowledge model", async () => {
  const compound = await readFile(path.join(root, "skills/ce-compound/SKILL.md"), "utf8")
  const refresh = await readFile(path.join(root, "skills/ce-compound-refresh/SKILL.md"), "utf8")
  expect(compound).toContain("docs/solutions/")
  expect(compound).toContain("tooling_decision")
  expect(compound).toContain("architecture_pattern")
  expect(compound).not.toContain("docs/decisions/")
  expect(refresh).toContain("status: stale")
  expect(refresh).toContain("stale_reason")
  expect(refresh).toContain("stale_date")
  expect(refresh).toContain("Delete, don't archive")
})

test("keeps docs enumeration fresh", async () => {
  const compound = await readFile(path.join(root, "skills/ce-compound/SKILL.md"), "utf8")
  expect(compound).toContain("docs/solutions/` enumeration is NEVER cached")
})
```

- [ ] **Step 3: Run the tests against deliberate bad fixtures**

Temporarily add `../ce-compound/SKILL.md` to `skills/honey-plan/SKILL.md` and run:

`bun test tests/skill-conventions.test.ts`

Expected: FAIL naming `skills/honey-plan/SKILL.md`. Remove the deliberate violation and rerun.

- [ ] **Step 4: Run all contract tests**

Run: `bun test`

Expected: PASS.

- [ ] **Step 5: Commit the invariant suite**

```bash
git add tests/skill-conventions.test.ts tests/vendored-compound.test.ts
git commit -m "test: protect Honey skill and knowledge contracts"
```

---

### Task 6: Add Native Host Manifests and Loaders

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.codex-plugin/plugin.json`
- Create: `.cursor-plugin/plugin.json`
- Create: `.kimi-plugin/plugin.json`
- Create: `.agy/plugin.json`
- Create: `.opencode/plugins/honey.js`
- Create: `.pi/extensions/honey.ts`
- Create: `tests/manifests.test.ts`
- Create: `tests/native-loaders.test.ts`

**Interfaces:**
- Consumes: repository root and canonical `skills/` directory.
- Produces: direct local installation/discovery for Claude Code, Codex, Cursor, Kimi, Antigravity, OpenCode, and Pi without generated skill copies.

- [ ] **Step 1: Write failing manifest tests**

Create `tests/manifests.test.ts` to parse all five JSON manifests and require identical identity fields:

```ts
import { describe, expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "..")
const manifests = [
  ".claude-plugin/plugin.json",
  ".codex-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".kimi-plugin/plugin.json",
  ".agy/plugin.json"
]

describe("native plugin manifests", () => {
  test("share Honey identity and version", async () => {
    for (const relative of manifests) {
      const data = JSON.parse(await readFile(path.join(root, relative), "utf8"))
      expect(data.name).toBe("honey")
      expect(data.version).toBe("0.1.0")
      expect(data.description).toBe("Planning, design, implementation, and compounded engineering learnings")
    }
  })
})
```

Also assert `.codex-plugin/plugin.json` and `.kimi-plugin/plugin.json` contain `"skills": "./skills/"`.

- [ ] **Step 2: Write failing native loader tests**

Create `tests/native-loaders.test.ts` and verify both loader files resolve `../../skills`, contain no hard-coded checkout path, and register only that canonical path.

- [ ] **Step 3: Run both suites and verify they fail**

Run: `bun test tests/manifests.test.ts tests/native-loaders.test.ts`

Expected: FAIL because manifests and loaders do not exist.

- [ ] **Step 4: Add native manifests**

Use this shared identity:

```json
{
  "name": "honey",
  "version": "0.1.0",
  "description": "Planning, design, implementation, and compounded engineering learnings"
}
```

Add `"skills": "./skills/"` where the host manifest supports it. Keep Cursor and Claude manifests to fields their native validators accept.

- [ ] **Step 5: Add the OpenCode loader**

Create `.opencode/plugins/honey.js`:

```js
import path from "path"
import { fileURLToPath } from "url"

const pluginDir = path.dirname(fileURLToPath(import.meta.url))
const skillsDir = path.resolve(pluginDir, "../../skills")

export const HoneyPlugin = async () => ({
  config: async (config) => {
    config.skills = config.skills || {}
    config.skills.paths = config.skills.paths || []
    if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir)
  }
})

export default HoneyPlugin
```

- [ ] **Step 6: Add the Pi extension**

Create `.pi/extensions/honey.ts`:

```ts
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const extensionDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(extensionDir, "../..")
const skillsDir = resolve(packageRoot, "skills")

export default function honeyPiExtension(pi: any) {
  pi.on("resources_discover", async () => ({ skillPaths: [skillsDir] }))
}
```

- [ ] **Step 7: Run manifest, loader, and full validation**

Run:

```bash
bun test tests/manifests.test.ts tests/native-loaders.test.ts
bun test
```

Expected: PASS.

- [ ] **Step 8: Commit native host support**

```bash
git add .claude-plugin .codex-plugin .cursor-plugin .kimi-plugin .agy .opencode .pi tests package.json
git commit -m "feat: expose Honey skills to native agent hosts"
```

---

### Task 7: Document Installation and Run End-to-End Smoke Checks

**Files:**
- Create: `README.md`
- Create: `evals/stage-retrieval/README.md`
- Create: `evals/stage-retrieval/docs/solutions/runtime-errors/token-refresh-race.md`
- Modify: `tests/native-loaders.test.ts`
- Modify: `tests/stage-researchers.test.ts`

**Interfaces:**
- Consumes: the completed Honey skills bundle and a temporary fixture repository containing `docs/solutions/`.
- Produces: host installation instructions and proof that every stage discovers an uncommitted learning while compound/refresh remain manually invocable.

- [ ] **Step 1: Add a failing documentation contract test**

Extend `tests/native-loaders.test.ts` to require `README.md` sections for Claude Code, Codex, OpenCode, Pi, local development, validation, vendored provenance, and graceful degradation.

- [ ] **Step 2: Add a durable stage retrieval evaluation fixture**

Create this tracked fixture:

```text
evals/stage-retrieval/docs/solutions/runtime-errors/token-refresh-race.md
```

Use frontmatter containing `module: authentication`, `component: background_job`, `problem_type: runtime_error`, and tags `oauth`, `token-refresh`, `concurrency`. The body must explain that concurrent refresh workers overwrite rotated credentials and that a single-flight lock prevents the race.

Create `evals/stage-retrieval/README.md` with three evaluation prompts, one per stage. Each prompt must supply a `<work-context>` about OAuth refresh concurrency, require the stage skill to run its local researcher, and expect the returned findings to cite `docs/solutions/runtime-errors/token-refresh-race.md`. The fixture document must remain uncommitted inside the temporary evaluation repository during the run so the evaluation proves fresh filesystem enumeration rather than Git-index lookup.

Extend `tests/stage-researchers.test.ts` to require each researcher prompt to:

```ts
expect(content).toContain("docs/solutions/")
expect(content).toContain("at invocation time")
expect(content).toContain("Probe the live `docs/solutions/` directory")
expect(content).toContain("native file-search/glob tool")
```

These are static contract tests for fresh filesystem discovery; the LLM retrieval result is verified by the evaluation run in Step 6.

- [ ] **Step 3: Run the focused tests and verify they fail**

Run: `bun test tests/native-loaders.test.ts tests/stage-researchers.test.ts`

Expected: FAIL because documentation and the smoke helper are incomplete.

- [ ] **Step 4: Write the README**

Document:

- Honey is a skills-only bundle and requires an existing agent host.
- Installed skills: `honey-plan`, `honey-design`, `honey-work`, `ce-compound`, `ce-compound-refresh`.
- Each stage owns an independent researcher and searches the live `docs/solutions/` tree.
- `ce-compound` is manual or prompt-auto-invoked after a verified reusable success.
- Auto-invoke is an LLM instruction, not a deterministic hook.
- `ce-compound-refresh` is targeted by default; broad refresh requires explicit intent.
- Missing optional host capabilities degrade visibly without blocking core document creation.
- Vendored source and patch policy are recorded in `vendor/compound-engineering.lock.json` and `THIRD_PARTY_NOTICES.md`.
- Development commands are `bun install`, `bun test`, and `bun run validate`.

- [ ] **Step 5: Run all automated checks**

Run:

```bash
bun install
bun test
bun run validate
git status --short
```

Expected: all tests PASS; `validate` exits 0; only intended implementation files are modified before the final commit.

- [ ] **Step 6: Run the stage retrieval evaluation and host smoke checks**

Use `skill-creator`'s eval workflow to load each current `SKILL.md` and its local researcher from disk into a fresh generic subagent. Run the three prompts from `evals/stage-retrieval/README.md` against a temporary copy of `evals/stage-retrieval/`, and verify every result cites `docs/solutions/runtime-errors/token-refresh-race.md`. Record the three results in the eval workflow's normal scratch output; do not commit generated transcripts.

Then perform host validation when binaries are available.

Run only installed commands and record unavailable hosts as skipped:

```bash
command -v claude >/dev/null && claude plugin validate . || true
command -v agy >/dev/null && agy plugin validate "$PWD" || true
```

For Codex, OpenCode, and Pi, load the local checkout through each host's local-plugin mechanism and verify all five skills are listed. Do not copy skills into global directories during the automated test suite.

- [ ] **Step 7: Commit the completed bundle**

```bash
git add README.md evals tests
git commit -m "docs: explain Honey installation and knowledge workflow"
```

---

## Final Acceptance Checklist

- [ ] `bun test` and `bun run validate` pass.
- [ ] All five skills are discoverable from root `skills/`.
- [ ] No compatibility directory contains an independently maintained skill copy.
- [ ] Planning, design, and implementation each own their researcher prompt.
- [ ] Every researcher fresh-searches `docs/solutions/`, narrows above 25 candidates, broadens below 3, reads frontmatter first, and fully reads at most 5 findings.
- [ ] `ce-compound` and `ce-compound-refresh` retain complete upstream support files and workflows.
- [ ] Korean success phrases coexist with all upstream English phrases.
- [ ] No deterministic auto-invoke hook exists.
- [ ] All executed bundled-script paths use portable `SKILL_DIR` resolution.
- [ ] ADRs, `use_in`, strict solution-schema validation, centralized retrieval, and an independent LLM runtime remain out of scope.
- [ ] Upstream provenance and MIT license are present.
- [ ] Native manifests/loaders expose the canonical root skills to supported hosts.
