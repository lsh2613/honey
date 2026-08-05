# Prefix-Free Skill Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Honey's five prefixed skill identifiers with `plan`, `design`, `work`, `compound`, and `compound-refresh` without compatibility aliases.

**Architecture:** Treat skill names as one atomic runtime contract spanning directory names, frontmatter, command examples, cross-skill references, scratch namespaces, tests, and current documentation. Preserve the old upstream names only where they are factual provenance or part of the completed 2026-08-04 historical implementation plan.

**Tech Stack:** Agent Skills Markdown, Bun 1.3, TypeScript tests with `bun:test`, JSON plugin manifests, Python helper scripts.

## Global Constraints

- The canonical installed skill set is exactly `plan`, `design`, `work`, `compound`, and `compound-refresh`.
- Do not retain the old five directories, frontmatter names, slash commands, or compatibility aliases.
- Do not change the knowledge schema, `docs/solutions/` paths, stage retrieval algorithm, Korean trigger behavior, or graceful fallback behavior.
- Preserve `vendor/compound-engineering.lock.json.sourceDirectories` as `skills/ce-compound` and `skills/ce-compound-refresh` because those are factual upstream paths.
- Do not rewrite `docs/superpowers/plans/2026-08-04-honey-compound-skills-bundle.md`; it is a historical record.
- Use `apply_patch` for content changes. Use one explicit path-only move per skill directory so Git records renames without duplicating large vendored trees.
- Follow RED -> GREEN: contract tests must fail for the missing new identifiers before any skill directory is renamed.

---

## File Structure

- `skills/plan/`: requirements planning skill and its stage-owned learning researcher; renamed from `skills/honey-plan/`.
- `skills/design/`: technical design skill and its stage-owned learning researcher; renamed from `skills/honey-design/`.
- `skills/work/`: implementation skill and its stage-owned learning researcher; renamed from `skills/honey-work/`.
- `skills/compound/`: vendored learning-capture workflow; renamed from `skills/ce-compound/` and internally exposed as `/compound`.
- `skills/compound-refresh/`: vendored corpus-maintenance workflow; renamed from `skills/ce-compound-refresh/` and internally exposed as `/compound-refresh`.
- `tests/skill-conventions.test.ts`: owns the exact five-skill inventory and directory/frontmatter identity contract.
- `tests/stage-researchers.test.ts`: owns stage-name mappings, stage prompt parity, dispatch ordering, and fallback contracts.
- `tests/vendored-compound.test.ts`: owns destination paths, vendor metadata, portability, trigger examples, and knowledge-model preservation.
- `tests/native-loaders.test.ts`: owns active README/loader assertions and the absence of deprecated identifiers from current user-facing documentation.
- `vendor/compound-engineering.lock.json`: distinguishes original source directories from renamed Honey destination skills.
- `THIRD_PARTY_NOTICES.md`: identifies Honey's renamed directories and the original upstream skill names.
- `README.md`: documents only the five new installed identifiers and slash commands.
- `evals/stage-retrieval/README.md` and `tests/fixtures/stage-retrieval-forward-prompts.md`: retain the same forward-test semantics while referring to the new stage skill names.

---

### Task 1: Rename the Five Runtime Skills Atomically

**Files:**
- Modify: `tests/skill-conventions.test.ts`
- Modify: `tests/stage-researchers.test.ts`
- Modify: `tests/vendored-compound.test.ts`
- Move: `skills/honey-plan/` -> `skills/plan/`
- Move: `skills/honey-design/` -> `skills/design/`
- Move: `skills/honey-work/` -> `skills/work/`
- Move: `skills/ce-compound/` -> `skills/compound/`
- Move: `skills/ce-compound-refresh/` -> `skills/compound-refresh/`
- Modify: `skills/plan/SKILL.md`
- Modify: `skills/plan/references/agents/learnings-researcher.md`
- Modify: `skills/design/SKILL.md`
- Modify: `skills/design/references/agents/learnings-researcher.md`
- Modify: `skills/work/SKILL.md`
- Modify: `skills/work/references/agents/learnings-researcher.md`
- Modify: all Markdown, YAML, and Python files under `skills/compound/` that contain `ce-compound` or `ce-compound-refresh`
- Modify: all Markdown, YAML, and Python files under `skills/compound-refresh/` that contain `ce-compound` or `ce-compound-refresh`

**Interfaces:**
- Consumes: the exact mapping in `docs/superpowers/specs/2026-08-05-skill-prefix-removal-design.md`.
- Produces: five directories whose basename equals the `name` in their `SKILL.md`; `/compound` and `/compound-refresh` command names; `/tmp/compound-engineering/compound/<run-id>/` capture scratch artifacts.

- [ ] **Step 1: Write the failing exact-inventory and identity tests**

Add this contract near the start of `tests/skill-conventions.test.ts`:

```ts
const canonicalSkills = ["compound", "compound-refresh", "design", "plan", "work"] as const
const deprecatedSkills = [
  "ce-compound",
  "ce-compound-refresh",
  "honey-design",
  "honey-plan",
  "honey-work",
] as const

test("installs exactly the prefix-free skill inventory", async () => {
  const skillsRoot = path.join(root, "skills")
  const entries = await readdir(skillsRoot, { withFileTypes: true })
  const skillDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()

  expect(skillDirs).toEqual([...canonicalSkills])
  for (const skill of canonicalSkills) {
    const content = await readFile(path.join(skillsRoot, skill, "SKILL.md"), "utf8")
    expect(parseFrontmatter(content).data.name).toBe(skill)
  }
  for (const skill of deprecatedSkills) expect(skillDirs).not.toContain(skill)
})
```

Change the stage declaration in `tests/stage-researchers.test.ts` to:

```ts
const stages = ["plan", "design", "work"] as const
```

Change `outputMarkers` to use the same three keys. Change the invocation-contract normalizer to match `Plan Invocation Contract`, `Design Invocation Contract`, and `Work Invocation Contract` without a `Honey` prefix.

Update the portable path fixture in `tests/skill-conventions.test.ts` to use `/tmp/compound-engineering/compound/run-1`. Its concrete forbidden-path examples should use `skills/compound`, while the new `deprecatedSkills` list remains the only non-provenance test fixture that intentionally names the removed identifiers. Replace the stage test's `../honey-` assertion with a generic assertion that no researcher references a sibling stage directory.

Change every Honey destination path and `lock.skills` expectation in `tests/vendored-compound.test.ts` from `ce-compound*` to `compound*`. Keep the expected `sourceDirectories` values in a new explicit assertion:

```ts
expect(lock.sourceDirectories).toEqual(["skills/ce-compound", "skills/ce-compound-refresh"])
expect(lock.skills).toEqual(["compound", "compound-refresh"])
```

Change the expected patch list to include the destination rename:

```ts
expect(lock.patches).toEqual([
  "rename-vendored-skills-without-prefixes",
  "replace-claude-skill-dir-with-portable-skill-dir",
  "add-korean-compound-auto-invoke-examples",
])
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
bun test tests/skill-conventions.test.ts tests/stage-researchers.test.ts tests/vendored-compound.test.ts
```

Expected: FAIL because `skills/plan`, `skills/design`, `skills/work`, `skills/compound`, and `skills/compound-refresh` do not exist and the old directory inventory is still present.

- [ ] **Step 3: Move all five directories**

Run these explicit path-only moves from the Honey repository root:

```bash
mv skills/honey-plan skills/plan
mv skills/honey-design skills/design
mv skills/honey-work skills/work
mv skills/ce-compound skills/compound
mv skills/ce-compound-refresh skills/compound-refresh
```

Confirm the directory inventory:

```bash
find skills -mindepth 1 -maxdepth 1 -type d -print | sort
```

Expected: only `skills/compound`, `skills/compound-refresh`, `skills/design`, `skills/plan`, and `skills/work`.

- [ ] **Step 4: Update stage identifiers without changing researcher behavior**

Apply these exact identifier changes:

```text
skills/plan/SKILL.md: name: plan
skills/design/SKILL.md: name: design
skills/work/SKILL.md: name: work
```

Rename the researcher headings from `Honey Plan Invocation Contract`, `Honey Design Invocation Contract`, and `Honey Work Invocation Contract` to `Plan Invocation Contract`, `Design Invocation Contract`, and `Work Invocation Contract`. Replace any literal path or identifier containing `honey-plan`, `honey-design`, or `honey-work` with the corresponding prefix-free identifier. Do not alter the shared researcher algorithm below the invocation contract.

- [ ] **Step 5: Update compound identifiers and runtime namespaces**

Apply these exact changes throughout the two renamed skill trees:

```text
name: ce-compound              -> name: compound
name: ce-compound-refresh      -> name: compound-refresh
/ce-compound                   -> /compound
/ce-compound-refresh           -> /compound-refresh
`ce-compound`                  -> `compound`
`ce-compound-refresh`          -> `compound-refresh`
/tmp/compound-engineering/ce-compound/ -> /tmp/compound-engineering/compound/
ce-compound-sessions-XXXXXX    -> compound-sessions-XXXXXX
```

Use longest-token-first replacement so `ce-compound-refresh` becomes `compound-refresh` before replacing `ce-compound`. Update Python docstrings and YAML comments as well as Markdown prose. Preserve references to other upstream skills such as `ce-simplify-code`; only the two vendored skill names lose `ce-`.

- [ ] **Step 6: Update the vendor destination metadata**

Set `vendor/compound-engineering.lock.json` to:

```json
{
  "repository": "https://github.com/EveryInc/compound-engineering-plugin",
  "commit": "c9e9d6292211256d3e9279b2abe54c6c1fcef08e",
  "sourceDirectories": ["skills/ce-compound", "skills/ce-compound-refresh"],
  "copiedOn": "2026-08-04",
  "skills": ["compound", "compound-refresh"],
  "patches": [
    "rename-vendored-skills-without-prefixes",
    "replace-claude-skill-dir-with-portable-skill-dir",
    "add-korean-compound-auto-invoke-examples"
  ],
  "updatePolicy": "manual-review-only"
}
```

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```bash
bun test tests/skill-conventions.test.ts tests/stage-researchers.test.ts tests/vendored-compound.test.ts
```

Expected: all focused tests PASS. If the researcher parity test fails, compare only the three invocation-contract headers; do not normalize or weaken any other algorithm difference.

- [ ] **Step 8: Commit the runtime rename**

```bash
git add skills tests/skill-conventions.test.ts tests/stage-researchers.test.ts tests/vendored-compound.test.ts vendor/compound-engineering.lock.json
git commit -m "feat(skills): remove skill name prefixes"
```

---

### Task 2: Align Current Documentation, Provenance, and Loader Contracts

**Files:**
- Modify: `tests/native-loaders.test.ts`
- Modify: `README.md`
- Modify: `THIRD_PARTY_NOTICES.md`
- Modify: `evals/stage-retrieval/README.md`
- Modify: `tests/fixtures/stage-retrieval-forward-prompts.md`

**Interfaces:**
- Consumes: the canonical identifiers produced by Task 1 and the preserved upstream paths in `vendor/compound-engineering.lock.json.sourceDirectories`.
- Produces: current user-facing documentation with no deprecated identifier; an explicit notice mapping Honey's new destination paths to upstream's original source paths; unchanged stage-retrieval evaluation semantics.

- [ ] **Step 1: Write the failing active-documentation contract**

In `tests/native-loaders.test.ts`, add:

```ts
test("documents only the prefix-free public skill names", async () => {
  const currentDocs = await Promise.all([
    "README.md",
    "evals/stage-retrieval/README.md",
    "tests/fixtures/stage-retrieval-forward-prompts.md",
  ].map((relative) => readFile(path.join(root, relative), "utf8")))
  const combined = currentDocs.join("\n")

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
})
```

- [ ] **Step 2: Run the documentation test and verify RED**

Run:

```bash
bun test tests/native-loaders.test.ts
```

Expected: FAIL because `README.md` still lists the five deprecated names and does not list all five new identifiers in backticks.

- [ ] **Step 3: Update current user-facing documentation**

Replace the installed inventory at the top of `README.md` with:

```markdown
- `plan` creates requirements plans.
- `design` creates technical designs.
- `work` implements approved work.
- `compound` captures one verified, reusable learning.
- `compound-refresh` maintains existing learnings.
```

Replace all current usage references with `/compound` and `/compound-refresh`. Update the provenance section to say that `compound` and `compound-refresh` are renamed, modified copies of the upstream `ce-compound` and `ce-compound-refresh` skills. The old names may occur there only as explicitly labeled upstream source names.

Change the active-documentation test to exclude `README.md`'s clearly delimited `## Vendored Provenance` section from its deprecated-name absence check while separately asserting this sentence:

```ts
expect(readme).toContain("upstream `ce-compound` and `ce-compound-refresh`")
```

Update the stage evaluation headings and prompts to name the invoked skills explicitly as `plan`, `design`, and `work`. Apply the same prompt text to `tests/fixtures/stage-retrieval-forward-prompts.md` so the existing snapshot-equivalence test remains exact.

- [ ] **Step 4: Update the third-party notice without falsifying provenance**

Replace its opening paragraph with:

```markdown
The `skills/compound` and `skills/compound-refresh` directories are renamed, modified copies of the upstream `skills/ce-compound` and `skills/ce-compound-refresh` skills from [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin), pinned at commit `c9e9d6292211256d3e9279b2abe54c6c1fcef08e`.
```

- [ ] **Step 5: Run the documentation and loader tests and verify GREEN**

Run:

```bash
bun test tests/native-loaders.test.ts tests/stage-researchers.test.ts
```

Expected: all tests PASS, including exact equality between the evaluation prompt section and the committed prompt fixture.

- [ ] **Step 6: Commit the active documentation rename**

```bash
git add README.md THIRD_PARTY_NOTICES.md evals/stage-retrieval/README.md tests/fixtures/stage-retrieval-forward-prompts.md tests/native-loaders.test.ts
git commit -m "docs(skills): publish prefix-free skill commands"
```

---

### Task 3: Validate Installation and Deprecated-Name Boundaries

**Files:**
- Modify only if validation reveals a scoped defect in files changed by Tasks 1 or 2.
- Verify: `skills/plan/**`
- Verify: `skills/design/**`
- Verify: `skills/work/**`
- Verify: `skills/compound/**`
- Verify: `skills/compound-refresh/**`
- Verify: `.codex-plugin/plugin.json`
- Verify: `.agents/plugins/marketplace.json`

**Interfaces:**
- Consumes: the prefix-free runtime tree and current documentation from Tasks 1 and 2.
- Produces: evidence that all loaders discover exactly the five new directories and that old names remain only in approved historical/provenance locations.

- [ ] **Step 1: Run the full automated suite**

```bash
bun install
bun test
bun run validate
```

Expected: all tests PASS with no warnings or errors.

- [ ] **Step 2: Run skill-level structural validation**

For each prefix-free skill, run the skill-creator validator from its installed system location:

```bash
python3 /Users/seowon/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/plan
python3 /Users/seowon/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/design
python3 /Users/seowon/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/work
python3 /Users/seowon/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/compound
python3 /Users/seowon/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/compound-refresh
```

Expected: each command reports a valid skill. If the validator's Python environment lacks PyYAML, record that environment limitation and rely on the repository's Bun frontmatter contract only after confirming the failure is an import error rather than invalid skill content.

- [ ] **Step 3: Verify deprecated-name boundaries**

Run:

```bash
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' \
  'honey-(plan|design|work)|ce-compound(-refresh)?' .
```

Expected matches are confined to:

```text
docs/superpowers/plans/2026-08-04-honey-compound-skills-bundle.md
docs/superpowers/specs/2026-08-05-skill-prefix-removal-design.md
docs/superpowers/plans/2026-08-05-prefix-free-skill-names.md
vendor/compound-engineering.lock.json sourceDirectories
README.md Vendored Provenance section
THIRD_PARTY_NOTICES.md upstream source names
tests that define deprecated-name rejection fixtures or provenance assertions
```

No match may appear under `skills/`, in installed frontmatter, in a current slash command, or in a runtime scratch path.

- [ ] **Step 4: Smoke-test native Codex discovery in isolation**

Create an isolated Codex home in OS temporary storage, register the local marketplace, install Honey, and inspect the installed skill directory:

```bash
HONEY_CODEX_HOME=$(mktemp -d -t honey-prefix-free-codex-XXXXXX)
CODEX_HOME="$HONEY_CODEX_HOME" codex plugin marketplace add "$PWD"
CODEX_HOME="$HONEY_CODEX_HOME" codex plugin add honey@honey
find "$HONEY_CODEX_HOME" -type f -name SKILL.md -print | sort
```

Expected: the installation exposes exactly five `SKILL.md` files whose parent directories are `compound`, `compound-refresh`, `design`, `plan`, and `work`; no deprecated directory is installed. Keep the temporary directory only long enough to inspect the result.

- [ ] **Step 5: Run final diff and worktree checks**

```bash
git diff --check 1f412dc..HEAD
git status --short --ignored
```

Expected: `git diff --check` exits zero. `git status --short --ignored` shows no tracked or untracked implementation files; `node_modules/` may appear as ignored.

- [ ] **Step 6: Commit any validation-only correction**

Skip this step when validation required no file changes. If a scoped correction was necessary, stage only the corrected files and commit:

```bash
git add skills README.md THIRD_PARTY_NOTICES.md evals tests vendor/compound-engineering.lock.json
git commit -m "fix(skills): complete prefix-free installation"
```
