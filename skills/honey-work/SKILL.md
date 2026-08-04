---
name: honey-work
description: Implement approved work with repository-grounded prior learnings.
---

# Honey Work

Before implementing the approved work:

1. Construct a stage-owned input from the current implementation context:

   ```xml
   <work-context>
   Activity: <the current stage objective>
   Concepts: <domain and technical terms>
   Decisions: <choices being considered or already settled>
   Domains: <modules, components, and repository areas>
   </work-context>
   ```

2. Read `references/agents/learnings-researcher.md` from this skill's directory.
3. Dispatch a generic subagent with the complete local researcher prompt and the
   `<work-context>` block. Ask it to return only up to five distilled findings,
   each with path, exact source date, relevance, applicable insight, and conflict/freshness warning.
4. Consume the returned findings before implementation. Carry applicable cautions,
   affected modules and components, known failure modes, prevention checks, and
   regression risks into the implementation work.

Keep the solution corpus in the researcher context. Do not load or return the full
`docs/solutions/` corpus in the parent context.

Implement and verify the approved work using the current stage context and the
distilled findings.
