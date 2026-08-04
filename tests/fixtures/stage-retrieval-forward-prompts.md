## Forward-Test Prompts

### Honey Plan

Use the Honey planning skill and run its local researcher before drafting the
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

### Honey Design

Use the Honey design skill and run its local researcher before producing the
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

### Honey Work

Use the Honey implementation skill and run its local researcher before making
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
