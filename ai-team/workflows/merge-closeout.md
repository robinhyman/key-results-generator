# Merge Closeout Workflow

Tier: guidance. Hard gates are in `ai-team/README.md`.

Use this before merging a PR, closing an issue, or marking an increment `Done`.

## Autonomous Merge Default

The AI team should merge routine low- and medium-risk increments itself when all closeout checks pass.
Robin approval is not required for normal product, test, documentation, and operating-model maintenance work covered by the standing autonomous-maintenance authority.
The PR still exists as the audit surface; the change is that passing gates and clean process review are enough for routine merge.

Ask Robin before merging when the change involves:

- production deployment;
- credentials, secrets, auth, permissions, or billing;
- destructive or irreversible data operations;
- legal/commercial commitments;
- high-risk architecture or migration work;
- major operating-model direction changes;
- a failed, skipped, or ambiguous check the Lead cannot confidently classify;
- any change Robin explicitly asked to review before merge.

## Closeout Checks

Before merge:

1. CI required checks pass.
2. The PR body satisfies `increment-check`.
3. Independent process-review evidence is present and reviewed.
4. Verification evidence matches the increment risk.
5. User-facing work has durable demo evidence, not only a local URL.
6. `npm run check:project -- --issue=NUMBER --agent-status="Review"` passes, or the exact Project-status blocker is recorded.
7. `project-state/` tells a fresh agent what is active, blocked, done, and next.
8. Any non-blocking follow-up work is captured as issues or named in handoff.

After merge:

1. Move `Agent Status` and `Status`, if present, to `Done`.
2. Confirm the issue closed or close it with a concise comment.
3. Pull `main` locally.
4. Update state only if the merge changed the next-session truth.
5. Do not ask Robin for approval unless one of the approval triggers above applies.
