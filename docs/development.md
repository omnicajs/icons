# Development

This document describes the repository workflow for maintainers of `@omnicajs/icons`. Consumer-facing installation and API documentation belongs in the root `README.md` and the published showcase.

## Repository Layout

- `assets/icons/<group>/` contains source SVG icons.
- `src/` contains the public runtime entrypoint.
- `build/` contains deterministic icon discovery, sprite, and declaration generators.
- `scripts/build-icons.mjs` orchestrates the package build.
- `showcase/` contains the complete VitePress site published to GitHub Pages.
- `docs/` contains internal development documentation that is not published to GitHub Pages.
- `generated/` contains temporary build input and is ignored by Git.
- `dist/` contains publishable package output and is ignored by Git.
- `drafts/` contains local research notes and is excluded through `.git/info/exclude`.

## Environment

The repository uses Yarn 4.12.0 through Corepack. Project commands run through the Docker `node` service by default; add `local` to run the same Make target on the host.

Install dependencies through Docker:

```bash
make install
```

Install dependencies on the host:

```bash
make local install
```

## Adding Or Updating Icons

1. Place each SVG in `assets/icons/<group>/`.
2. Use the public icon name as the filename without the `.svg` extension.
3. Preserve the intended `viewBox` and geometry.
4. Run the package checks.
5. Inspect the result in the browser showcase when paint output or geometry changed.

Icon names, group names, source asset paths, symbol IDs, and `viewBox` values are consumer-visible package contracts. Renaming or moving an existing icon may require a breaking release.

The sprite build removes fixed dimensions and converts non-`none` fill and stroke colors to `currentColor`. Source and generated boundaries must remain explicit; bulk SVG changes should be implemented as deterministic scripts.

## Checks

Run the complete package checks through Docker:

```bash
make check
```

Run them on the host:

```bash
make local check
```

The check builds ESM and CommonJS entrypoints, sprites and declarations, runs TypeScript validation, and builds the VitePress showcase.

CI installs dependencies with an immutable lockfile, runs the same checks, and inspects the package archive contents. The workflow is defined in `.github/workflows/check.yml`.

## Build Output

The build generates:

- `dist/index.js` — ESM entrypoint;
- `dist/index.cjs` — CommonJS entrypoint;
- `dist/index.d.ts` — generated public declarations;
- `dist/sprites/<group>.svg` — one sprite per source group.

Intermediate build data is written under `generated/` and is not published. Original source SVG files are published through `@omnicajs/icons/assets/*`.

## Showcase

Run the VitePress showcase through Docker:

```bash
make showcase
```

With local Traefik, open `http://icons.omnicajs.test/`.

Run the showcase directly on the host:

```bash
make local showcase
```

Build the static site without starting a server:

```bash
make local showcase.build
```

The showcase imports `@omnicajs/icons` through the package public entrypoint and therefore also serves as a realistic consumer build.

## Release

Releases are started manually from the GitHub Actions `Release` workflow. Select `stable`, `alpha`, `beta`, or `rc`. Stable releases are allowed only from `main`; prereleases use the corresponding npm dist-tag.

The workflow:

1. installs dependencies and validates the selected branch;
2. runs the complete package checks;
3. updates the version and changelog and creates the matching `v<version>` tag;
4. pushes the release commit and tag;
5. publishes the package to npm;
6. creates a GitHub Release;
7. builds and deploys the VitePress showcase to GitHub Pages.

Preview the calculated version locally without changing the worktree:

```bash
make local release as=dry
```

### First Publication

A package must exist in npm before trusted publishing can be configured. For the first publication, add a temporary `NPM_TOKEN` repository secret.

After the first successful release:

1. configure `.github/workflows/release.yml` as the npm trusted publisher for `@omnicajs/icons`;
2. allow `npm publish` for that publisher;
3. remove the `NPM_TOKEN` repository secret so later releases use short-lived OIDC credentials.

GitHub Pages must use GitHub Actions as its deployment source.
