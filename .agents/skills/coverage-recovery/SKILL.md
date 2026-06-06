---
name: coverage-recovery
description: Use this skill when coverage is below target or uncovered package code must be analyzed and resolved with minimal artificial tests.
---

# Coverage Recovery

## When To Use
Use this skill when the user asks to:
- increase test coverage;
- analyze uncovered lines or branches;
- explain why specific uncovered paths remain.

## Principles
- Coverage is a quality signal, not a vanity metric.
- Start from real package contract behavior.
- Synthetic tests are a red flag: they often indicate dead branches, redundant code, or hidden design problems.
- Prefer removing redundancy or improving design over adding tests for unreachable code.
- Defensive branches should be tested with controlled failure scenarios when they represent real behavior.
- Do not loop endlessly on non-natural cases; report concrete options.

## Workflow
1. Run the project's coverage command if one exists.
```bash
corepack yarn coverage
```
or:
```bash
docker compose run --rm node yarn coverage
```
2. Read uncovered details, not only percentages.
3. Classify uncovered paths:
- `real usage gap`: missed consumer scenario;
- `defensive path`: degraded input or runtime failure;
- `dead/redundant path`: likely removable;
- `architecture smell`: behavior is hard to test because structure is wrong.
4. Resolve in this order:
- add or adjust tests for real package contract scenarios;
- add controlled failure tests for defensive branches;
- simplify or remove dead branches;
- propose a refactor for architecture smells.
5. Re-run coverage and relevant package checks.

## Stop Condition
If progress stalls after reasonable attempts:
1. Stop adding artificial tests.
2. Report exact uncovered locations and why they are hard or unnatural to cover.
3. Offer concrete options:
- keep the defensive branch and accept the uncovered path;
- refactor to make behavior testable;
- remove redundant code if behavior is impossible by construction.
