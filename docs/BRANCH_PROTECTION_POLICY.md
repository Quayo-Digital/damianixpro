# Branch Protection Policy

This policy defines the minimum branch safety controls for long-term reliability.

## Protected branches

- `main`
- `develop` (if used as integration branch)

## Required settings

- Require pull request before merging.
- Require at least 1 approving review.
- Dismiss stale approvals on new commits.
- Require conversation resolution before merge.
- Require status checks to pass before merge.
- Restrict direct pushes to protected branches.
- Include administrators in enforcement.

## Required status checks

Match your CI workflow jobs:

- `Lint & Type Check`
- `Test`
- `Build`

If added later, include:

- `Secret hygiene checks`
- E2E smoke suite job

## Merge strategy recommendations

- Prefer squash merge for cleaner history on feature branches.
- Use merge commits only when preserving branch history is required.
- Disallow force push on protected branches.

## Operational expectations

- Every PR should include a test plan.
- High-risk changes (auth, payments, secrets, CI, edge functions) need code-owner review.
- Release notes should link `docs/SECURITY_HARDENING_CHANGELOG.md` when applicable.
