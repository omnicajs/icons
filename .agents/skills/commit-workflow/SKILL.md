---
name: commit-workflow
description: Use this skill when creating git commits in this repository. It standardizes commit splitting, Conventional Commit type selection, English commit message text, and yarn.lock handling.
---

# Commit Workflow

## When To Use
Use this skill when the user asks to:
- create one or more commits;
- split changes into separate commits;
- choose commit messages, scopes, or types;
- validate commit formatting before committing.

## Required Rules
- Commit format: Conventional Commits.
- Message language: English.
- Subject style: describe the completed change as a historical fact suitable for a changelog, not an intention.
- Prefer passive-voice or past-tense phrasing, for example `Added icon` instead of `Add icon`.
- Start commit subject description with a capital letter unless there is a strong reason to use another form.
- Keep commit subject concise.
- Put long details into the commit body; lists in the body are allowed.
- Allowed types: `feat`, `fix`, `build`, `ci`, `perf`, `docs`, `refactor`, `style`, `test`, `chore`.
- Use scope only when it adds useful context. For this package, `icons`, `docker`, `deps`, or `docs` are acceptable scopes when appropriate.
- Breaking changes: use `!` in the header or a `BREAKING CHANGE` footer.
- Do not mix unrelated changes in one commit.
- Commit `yarn.lock` with the manifest or dependency change that caused it. If the lockfile was refreshed without manifest changes, use a dedicated chore commit.
- For a `yarn.lock`-only refresh, use: `chore(deps): Refreshed yarn lockfile`.
- Do not amend or rewrite history unless explicitly requested.
- Never revert user changes unless the user explicitly asks.

## Workflow
1. Inspect pending changes:
```bash
git status --short
git diff
```
2. Group files by logical intent.
3. Choose commit type and optional scope.
4. Compose an English commit header:
```text
<type>(<scope>): <short completed change>
```
5. Stage only target files:
```bash
git add <files>
```
6. Create commit non-interactively:
```bash
git commit -m "<type>(<scope>): <subject>"
```
7. Verify result:
```bash
git show --name-status --oneline -n 1
```

## Practical Patterns
- `chore: Initialized npm package`
- `docs: Added MIT license`
- `build(docker): Added node service`
- `chore(deps): Refreshed yarn lockfile`
- `feat(icons): Added payment icons`
