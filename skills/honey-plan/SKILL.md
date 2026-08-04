---
name: honey-plan
description: Create a requirements plan with repository-grounded prior learnings.
---

# Honey Plan

Before creating the requirements plan:

1. Construct a stage-owned input from the current planning context:

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
4. Consume the returned findings before writing the plan. Carry applicable
   requirements constraints, prior decisions, failed approaches, and product or
   workflow risks into the requirements artifact.

Keep the solution corpus in the researcher context. Do not load or return the full
`docs/solutions/` corpus in the parent context.

Produce the requirements plan from the current stage context and the distilled
findings.
