---
name: lockfile-conflict-resolution
description: Use this skill when resolving merge or rebase conflicts in package manager lockfiles such as yarn.lock, package-lock.json, pnpm-lock.yaml, or bun.lockb. It standardizes taking the lockfile from the branch baseline, rerunning the project package manager, and avoiding manual lockfile edits.
---

# Lockfile Conflict Resolution

## When To Use
Use this skill when:
- any package manager lockfile has merge or rebase conflicts;
- dependency metadata must be reconciled after branch integration;
- the same lockfile conflict repeats during one rebase chain;
- lockfile format is generated and should not be edited by hand.

## Supported Lockfiles
- Yarn: `yarn.lock`
- npm: `package-lock.json`
- pnpm: `pnpm-lock.yaml`
- Bun: `bun.lockb`

## Source Of Truth Policy
- During rebase, take the conflicted lockfile from the branch being rebased onto.
- During merge, take the conflicted lockfile from `HEAD`.
- After taking that baseline, rerun the package manager for the project.
- Prefer the package manager declared by the repository (`packageManager` in `package.json`, lockfile type, or existing scripts).

## Required Rules
- Do not manually edit conflict markers in generated lockfiles.
- Resolve by replacing the whole conflicted lockfile from the selected baseline.
- For repeated conflict rounds, reuse the previous successful lockfile resolution as the new base.
- If the current change intentionally updates dependencies, replay that dependency operation after conflict resolution.

## Install Command Selection
- Yarn project: `corepack yarn install`
- npm project: `npm install`
- pnpm project: `corepack pnpm install`
- Bun project: `bun install`
- If the project runs package commands through Docker, use the equivalent service command, for example:
```bash
docker compose run --rm node yarn install
```

## Workflow
1. Confirm the conflict:
```bash
git status --short
```
2. Set the conflicted lockfile path:
```bash
LOCKFILE=yarn.lock
```
Replace `yarn.lock` with the actual lockfile path when needed.

3. Set the install command for the current project:
```bash
INSTALL_CMD="corepack yarn install"
```
Replace the command with `npm install`, `corepack pnpm install`, `bun install`, or the project's Docker equivalent when needed.

4. Resolve first conflict round during rebase:
```bash
ONTO=$(cat .git/rebase-merge/onto 2>/dev/null || cat .git/rebase-apply/onto)
git show "$ONTO:$LOCKFILE" > "$LOCKFILE"
$INSTALL_CMD
git add "$LOCKFILE"
cp "$LOCKFILE" .git/lockfile-resolution-base
```
5. Resolve first conflict round during merge:
```bash
git show "HEAD:$LOCKFILE" > "$LOCKFILE"
$INSTALL_CMD
git add "$LOCKFILE"
cp "$LOCKFILE" .git/lockfile-resolution-base
```
6. Resolve repeated conflict rounds:
```bash
cp .git/lockfile-resolution-base "$LOCKFILE"
$INSTALL_CMD
git add "$LOCKFILE"
cp "$LOCKFILE" .git/lockfile-resolution-base
```
7. Continue the operation:
```bash
git rebase --continue
# or
git merge --continue
```
8. Cleanup after the operation finishes:
```bash
rm -f .git/lockfile-resolution-base
```

## Validation
- `git status --short` must not show conflict markers for the lockfile.
- The lockfile must be staged before continuing the merge or rebase.
- The final lockfile must be produced by the package manager, not by manual editing.

## Project Note
This repository currently uses Yarn 4, so use `corepack yarn install` or:
```bash
docker compose run --rm node yarn install
```
