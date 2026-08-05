# Skill Prefix Removal Design

## Goal

Replace Honey's five prefixed public skill names with concise names, without retaining deprecated aliases.

| Current name | New name |
| --- | --- |
| `honey-plan` | `plan` |
| `honey-design` | `design` |
| `honey-work` | `work` |
| `ce-compound` | `compound` |
| `ce-compound-refresh` | `compound-refresh` |

## Rename Contract

The rename is atomic and breaking. The old skill directories, frontmatter names, slash commands, runtime cross-references, and compatibility aliases must not remain in the installed bundle.

The canonical installed skill set becomes exactly:

```text
plan
design
work
compound
compound-refresh
```

Each skill directory must match its `name` frontmatter. `compound` must invoke or recommend `compound-refresh`, and every user-facing command example must use `/compound` or `/compound-refresh`.

## Runtime Surfaces

Rename all active runtime surfaces together:

- skill directories and `SKILL.md` frontmatter;
- stage-owned researcher paths and stage identifiers;
- cross-skill prose and command examples;
- runtime scratch namespaces that contain a skill name;
- bundled script descriptions and schema comments that identify the writing skill;
- native loader and marketplace expectations;
- current README installation and usage documentation;
- tests and forward-evaluation fixtures that identify installed skills.

No compatibility shim or duplicate skill directory will be added. An installation updated from an older flat copy must remove the five old directories rather than loading both generations.

## Provenance and Historical Records

Do not rewrite factual upstream provenance. `vendor/compound-engineering.lock.json.sourceDirectories` continues to record the source paths `skills/ce-compound` and `skills/ce-compound-refresh`, because those are the paths at the pinned upstream commit. The notice may identify the upstream skills by their original names while identifying Honey's installed copies by their new paths.

Do not rewrite the completed 2026-08-04 implementation plan. It records the repository shape that existed when that plan was executed. New active documentation and tests must use the new names.

The vendor lock's installed `skills` list changes to `compound` and `compound-refresh`. Its patch description records the Honey-side rename so future upstream refreshes map the original source directories to the current destination directories deliberately.

## Validation Strategy

Use test-driven development for the rename:

1. Change contract tests first to require the exact new five-skill inventory and watch them fail against the old directories.
2. Add an assertion that old names are absent from active runtime surfaces. Exclude only the completed historical plan and explicit upstream-provenance fields or prose.
3. Rename the directories and update the minimum active references needed to satisfy the tests.
4. Run the complete Bun test suite and validation script.
5. Run `git diff --check` and a targeted repository search to confirm that any remaining old name is confined to the documented provenance and historical exceptions.
6. Forward-test representative stage retrieval and compound invocation only if the rename changes prompt behavior beyond identifiers; otherwise the contract and loader tests are sufficient.

## Expected Behavior

After installation, users invoke `plan`, `design`, `work`, `compound`, and `compound-refresh`. Existing learning files under `docs/solutions/` are unaffected because the rename changes the skills that create and maintain them, not the knowledge schema or document paths.

The planning, design, implementation, capture, refresh, search, validation, Korean trigger, and graceful-fallback behavior remains unchanged apart from the new identifiers.
