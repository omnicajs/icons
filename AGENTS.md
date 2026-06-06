# AGENTS.md

## Goals
- Avoid clarification loops by proposing a concrete interpretation when details are missing.
- Default to the language of the user's initial message unless they explicitly request a different language.
- Match the tone and formality of the user's initial message unless they explicitly ask for a change.
- Treat a language switch in the user's message as an explicit request to respond in that language.
- If a message is mixed-language, reply in the dominant language unless the user specifies otherwise.
- Prefer Makefile recipes (`make ...`) over direct `node`/`yarn` commands when a matching recipe exists.
- Makefile recipes use the Docker `node` service by default when the command should match the containerized environment.
- Use `make local <target>` when the same recipe must run on the host instead of Docker.
- Do not create compatibility aliases by default. Before adding an alias, analyze whether removing or changing the old flow actually breaks compatibility and whether preserving that flow is necessary.
- Keep changes scoped to this icon package; avoid adding app-specific behavior or unrelated tooling.
- Getter/helper functions must be side-effect free. Side effects are allowed only by prior agreement and only when there are strong, explicit reasons.

## Purpose
This file defines practical instructions for working in the `@omnicajs/icons` repository.

## Repository Structure
- This project is a standalone npm package for the OmnicaJS icon set.
- Package manager: Yarn 4.12.0 via Corepack.
- Package manager mode: `node-modules` (see `.yarnrc.yml`).
- Local Yarn release: `.yarn/releases/yarn-4.12.0.cjs` (see `yarnPath` in `.yarnrc.yml`).
- Docker configuration lives under `docker/`.
- The root `docker-compose.yml` defines a `node` service for project commands.

## Local Environment
- Install dependencies locally:
```bash
make local install
```
- Install dependencies through Docker:
```bash
make install
```
- Install dependencies with immutable lockfile for CI:
```bash
make ci.install
```
- Run package checks:
```bash
make local check
```
- Run package checks through Docker:
```bash
make check
```

## Development Rules
- Commit messages follow Conventional Commits.
- Commit message language is English.
- Keep `yarn.lock` committed when dependency metadata changes.
- Do not manually edit generated lockfile conflicts; resolve from a branch baseline and rerun `yarn install`.
- Do not add cross-project relative imports or tests that depend on another local repository.
- For icon assets, preserve consumer-visible semantics: icon names, exported paths, SVG viewBox, dimensions, and documented usage.
- Prefer deterministic transformations for SVG assets. If bulk icon processing is added, script it and keep source/generated boundaries explicit.

## Testing And Validation
- Prefer the cheapest trustworthy check for the changed contract.
- For package metadata changes, validate JSON/YAML and run the relevant Yarn script.
- For Docker changes, run:
```bash
docker compose config
docker compose build node
make check
```
- For future SVG rendering or visual checks, use browser-based validation when layout, geometry, screenshots, or actual paint output matters.

## Local Skills
Project skills are stored in `.agents/skills/`:
- `commit-workflow`: commit splitting and Conventional Commit rules.
- `test-workflow`: test selection and public-contract test rules.
- `lockfile-conflict-resolution`: package manager lockfile conflict workflow.
- `coverage-recovery`: coverage analysis workflow.
