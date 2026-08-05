# Stage Retrieval Evaluation

Run each prompt in a fresh generic subagent against a temporary copy of this
directory. Keep the copied `docs/solutions/` document uncommitted: the test is
valid only when the researcher discovers it from the live filesystem at
invocation time.

Initialize a Git baseline in the temporary copy without staging the fixture:

```bash
git init
git config user.email eval@example.invalid
git config user.name "Honey Eval"
git add README.md
git commit -m "test: create evaluation baseline"
```

## Pre-Run Git Evidence

Immediately before every stage run, capture both commands and confirm that the
fixture is untracked and absent from the index:

```bash
git status --short
git ls-files docs/solutions
```

Never add the fixture to the index.

For each run, load the current stage `SKILL.md` and its local
`references/agents/learnings-researcher.md` from the Honey checkout. Give the
test agent only the stage instructions, its prompt below, and the temporary
repository as its working directory. Do not pass the evaluator rubric to that
agent. Store generated transcripts in the eval workflow's scratch directory,
not in this repository.

## Forward-Test Prompts

### `plan`

Use the `plan` skill and run its local researcher before drafting the
plan. We need a requirements plan for a worker that keeps third-party account
access active while several scheduled jobs may act on the same account.

<work-context>
Activity: Plan reliable credential renewal for scheduled jobs that can overlap
for a single connected account.
Concepts: OAuth, rotated credentials, concurrent workers, duplicate renewal
requests, account-scoped coordination.
Decisions: Decide what coordination and persistence rules the plan should
require.
Domains: code-implementation, workflow
</work-context>

Return the researcher findings before the plan, then use them as constraints in
the plan.

### `design`

Use the `design` skill and run its local researcher before producing the
design. Design the coordination path for a service that renews an external
access grant when many background jobs notice it is nearly expired.

<work-context>
Activity: Design safe renewal coordination for expiring external access grants
observed by overlapping background jobs.
Concepts: OAuth, refresh rotation, concurrent jobs, shared persistence,
account-scoped coordination.
Decisions: Choose the ownership, waiting behavior, and persistence guarantees
for a per-account renewal operation.
Domains: agent-architecture, code-implementation
</work-context>

Return the researcher findings before the design, then make the design reflect
the relevant evidence.

### `work`

Use the `work` skill and run its local researcher before making
changes. Improve the renewal path for a background processor where multiple
queue deliveries for the same account can detect an expired access grant at
once.

<work-context>
Activity: Implement a safe account-scoped renewal path for requests initiated
by duplicate queue deliveries.
Concepts: OAuth, credential rotation, concurrent execution, overlapping
credential persistence, coordination.
Decisions: Apply the smallest safe change that preserves account access when
duplicate deliveries overlap.
Domains: code-implementation, runtime reliability
</work-context>

Return the researcher findings before implementation and use any applicable
cautions while making the change.

## Post-Run Git Evidence

Immediately after every stage run, capture both commands again. Confirm that
the fixture remains untracked and absent from the index:

```bash
git status --short
git ls-files docs/solutions
```

## Evaluator Rubric (Do Not Pass to the Test Agent)

For each stage, mark the run passing only when all of the following are true:

1. The returned findings cite
   `docs/solutions/runtime-errors/token-refresh-race.md` from the temporary
   repository.
2. The cited finding is relevant to concurrent OAuth credential renewal, not a
   filename-only match.
3. The returned finding records the exact source date: `2026-08-04`.
4. The returned finding separately includes a visible conflict/freshness assessment.
   A valid assessment may say that no conflict was observed after
   checking current evidence, but it must make the freshness judgment visible
   instead of silently treating the learning as current.
5. The agent ran the stage's local researcher before producing the stage
   artifact and used the finding in that artifact.
6. The fixture remained uncommitted for the entire run: the captured pre-run
   and post-run `git status --short` and `git ls-files docs/solutions` outputs
   demonstrate live `docs/solutions/` enumeration rather than Git-index lookup.

Record each stage's pass/fail result, the returned citation, and the exact
conflict/freshness/date wording in the eval workflow scratch output. Do not
commit those transcripts.
