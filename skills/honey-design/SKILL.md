---
name: honey-design
description: Create a technical design with repository-grounded prior learnings.
---

# Honey Design

Before creating the technical design:

1. Construct a stage-owned input from the current design context:

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
4. Consume the returned findings before writing the design. Carry applicable
   architecture constraints, patterns, tooling decisions, conventions, and rejected
   technical approaches into the design artifact.

Keep the solution corpus in the researcher context. Do not load or return the full
`docs/solutions/` corpus in the parent context.

Produce the technical design from the current stage context and the distilled
findings.
