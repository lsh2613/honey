# Honey

Honey is a skills-only bundle for an existing agent host. It supplies five
Agent Skills; the host supplies the model, conversation, tools, permissions,
and any subagent capability.

## Skills

- `honey-plan` creates requirements plans.
- `honey-design` creates technical designs.
- `honey-work` implements approved work.
- `ce-compound` captures one verified, reusable learning.
- `ce-compound-refresh` maintains existing learnings.

The three Honey stages each own an independent researcher. Before producing
their artifact, that researcher searches the live `docs/solutions/` tree in
the target repository, rather than relying on a cached Git index or a central
research service.

## Claude Code

Honey includes the native `.claude-plugin/plugin.json` manifest. For local
checkout development, launch Claude Code from the checkout:

```bash
claude --plugin-dir "$PWD"
```

Start a new session after changing skill prose so the host reloads it.

## Codex

Honey includes `.codex-plugin/plugin.json` and the native marketplace catalog
at `.agents/plugins/marketplace.json`, both of which point at the canonical
root `skills/` directory. Test a local checkout without changing a normal
Codex profile:

```bash
HONEY_CODEX_HOME="$(mktemp -d -t honey-codex-XXXXXX)"
CODEX_HOME="$HONEY_CODEX_HOME" codex plugin marketplace add "$PWD"
CODEX_HOME="$HONEY_CODEX_HOME" codex plugin add honey@honey
CODEX_HOME="$HONEY_CODEX_HOME" codex plugin list --available --json
```

The final command confirms that the isolated marketplace and Honey install are
available; Codex loads the five root skills from Honey's `skills/` declaration.
Remove the temporary `HONEY_CODEX_HOME` directory when the local test is
complete.

## Cursor

Honey includes `.cursor-plugin/plugin.json` for native metadata. This bundle
does not ship a Cursor marketplace catalog or a documented local-checkout
installation command. Record local Cursor smoke testing as skipped rather
than copying skills into a Cursor directory or claiming a command succeeded.

## Kimi Code CLI

Honey includes `.kimi-plugin/plugin.json`. From Kimi Code CLI, install a local
checkout with:

```text
/plugins install /path/to/honey
```

Restart or reload Kimi after installation.

## Antigravity

Honey includes `.agy/plugin.json` and a symlink from `.agy/skills` to the
canonical root skills directory. With `agy` installed, use that bundle entry:

```bash
agy plugin install "$PWD/.agy"
agy plugin validate "$PWD/.agy"
```

The validation command is safe to use for a local smoke check; installation is
an explicit user action and is not performed by Honey's automated tests.

## OpenCode

Honey's OpenCode plugin registers the canonical root `skills/` directory
without replacing existing OpenCode configuration. Add the local checkout to
the `plugin` array in a project or global `opencode.json`:

```json
{
  "plugin": ["/path/to/honey"]
}
```

Restart OpenCode after changing the package source.

## Pi

Honey's Pi extension discovers the same root `skills/` directory. Load the
local checkout with:

```bash
pi -e "$PWD"
```

## Knowledge Workflow

`ce-compound` remains manual or prompt-auto-invoked after a verified reusable
success. Auto-invoke is an LLM instruction, not a deterministic hook: it can
be suggested by the skill's prompt but Honey does not install a string matcher,
hook, or background detector.

`ce-compound-refresh` is targeted by default. Ask for a broad corpus refresh
explicitly; routine capture work should refresh only the directly related
learnings.

## Graceful Degradation

Optional host capabilities vary. When session history, GitHub access, a
blocking question primitive, parallel subagents, or a host-specific plugin
command is unavailable, the affected workflow reports the limitation visibly
and continues with the available evidence. Missing optional capabilities do
not block the core work of creating or maintaining a learning document.

## Vendored Provenance

`ce-compound` and `ce-compound-refresh` are modified upstream copies. Their
source commit, copied directories, allowed patches, and manual-review update
policy are recorded in
[`vendor/compound-engineering.lock.json`](vendor/compound-engineering.lock.json).
The upstream MIT notice is retained in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Local Development

Use Bun only to develop or validate this repository; an agent host is still
required to use the skills:

```bash
bun install
bun test
bun run validate
```

The canonical source is `skills/`. Do not create compatibility copies or copy
these skills into global host directories for automated tests.

## Validation

Run the full contract suite with `bun test`, then run `bun run validate`. The
tracked retrieval fixture in `evals/stage-retrieval/` is for fresh-subagent
evaluation: copy it to a temporary repository and leave its learning
uncommitted so the result proves live filesystem discovery.

Host smoke checks are capability-dependent. Run only an installed host's
documented local validation command and record an unavailable host as skipped;
do not claim a skipped probe passed.
