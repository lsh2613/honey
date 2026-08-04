# Honey Agent Instructions

- `skills/` is the canonical runtime source.
- Every skill is self-contained: never reference a sibling skill file by relative traversal.
- Keep identifiers and file names ASCII.
- Preserve vendored Compound behavior unless a patch is listed in `vendor/compound-engineering.lock.json`.
- Run `bun test` after any skill, manifest, loader, or test change.
- Do not add an LLM runtime, deterministic compound detector, ADR store, centralized researcher, or strict solution-schema validator without an explicit product decision.
- Use `SKILL_DIR` populated from the loaded `SKILL.md` path for executed bundled scripts; do not introduce host-specific skill-directory variables.
