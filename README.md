# @omnicajs/icons

Typed SVG sprites and source icons for OmnicaJS projects. The package exposes the same catalog as full sprites, group sprites, raw SVG files, and consumer-built subsets.

[Browse the icon catalog](https://omnicajs.github.io/icons/)

## Installation

```bash
yarn add @omnicajs/icons
```

## Icon identity

Monochrome icons are identified by `variant/group/name`:

```text
filled/actions/add
outlined/actions/add-circle
```

`outlined` is a smaller independent catalog. There is no automatic fallback to `filled`: TypeScript rejects a missing outlined name, and JavaScript receives an explicit runtime error.

The move from legacy groups and `-outlined` filenames is intentionally breaking; no runtime aliases are installed. The complete old-path to `variant/group/name` map is published as `@omnicajs/icons/migrations/groups-v1.json` for migrations and search tooling.

Both full and group sprites use the same symbol fragment, `group/name`. Only the sprite file changes:

```text
<filled sprite URL>#actions/add
<filled actions sprite URL>#actions/add
```

## Full sprites

The root and `/all` entrypoints include the complete filled and outlined registries:

```ts
import { iconUrl, spriteUrl } from '@omnicajs/icons'

const add = iconUrl('filled', 'actions', 'add')
const outlinedAdd = iconUrl('outlined', 'actions', 'add-circle')
const filledSprite = spriteUrl('filled')
```

If an application only needs one variant, use its narrower full-sprite entrypoint:

```ts
import { iconNames, iconUrl, spriteUrl } from '@omnicajs/icons/filled'

const add = iconUrl('actions', 'add')
```

## Group sprites

An entrypoint for one group keeps both runtime code and declarations local to that group:

```ts
import { iconNames, iconUrl, spriteUrl } from '@omnicajs/icons/filled/actions'

const add = iconUrl('add')
```

Use `/groups` when the delivery mode must be selected dynamically while retaining exact variant types:

```ts
import { iconUrl, spriteUrl } from '@omnicajs/icons/groups'

const add = iconUrl('filled', 'actions', 'add')
const actionsSprite = spriteUrl('filled', 'actions')
```

Render any returned URL through an external SVG `use`:

```html
<svg width="24" height="24" aria-hidden="true" style="color: #005eeb">
    <use href="<resolved icon URL>"></use>
</svg>
```

Monochrome sprites inherit `currentColor`; their source `viewBox` is preserved.

## Flags and logos

Full-color collections have independent entrypoints and preserve their source colors:

```ts
import { iconUrl as flagUrl } from '@omnicajs/icons/flags'
import { iconUrl as logoUrl } from '@omnicajs/icons/logos'

const armenia = flagUrl('armenia')
const telegram = logoUrl('telegram')
```

## Raw SVG files

Use raw assets for one or two icons or for a consumer-owned SVG pipeline:

```ts
import addUrl from '@omnicajs/icons/assets/icons/filled/actions/add.svg?url'
import armeniaUrl from '@omnicajs/icons/assets/flags/armenia.svg?url'
```

Ready-made files are also exported under `@omnicajs/icons/sprites/*`, and the typed machine-readable catalog is available as `@omnicajs/icons/manifest`. The raw JSON remains available as `@omnicajs/icons/manifest.json`.

The manifest records raw and gzip byte sizes for every full and group sprite. This keeps size reporting aligned with the installed package instead of a README snapshot:

```ts
import manifest from '@omnicajs/icons/manifest'

const filledSize = manifest.variants.filled.size
const actionsSize = manifest.variants.filled.groups.actions.size
// { bytes: number, gzipBytes: number }
```

Every manifest icon also has a `keywords` array with designer-provided search associations. Keywords are search metadata only: the canonical name, symbol ID, and runtime URL remain unchanged.

```ts
const brainKeywords = manifest.variants.filled.groups.ai.icons['brain-circuit'].keywords
// ['ai/brain-ai']
```

## Custom subsets with the CLI

The package can generate one sprite per selected variant. Create `omnica-icons.config.mjs`:

```js
import { defineConfig } from '@omnicajs/icons/build'

export default defineConfig({
    outputDirectory: 'src/generated/omnica-icons',
    include: {
        filled: {
            actions: ['add', 'remove'],
            alerts: ['warning'],
        },
        outlined: {
            actions: ['add-circle'],
        },
    },
})
```

Generate files before the application build:

```bash
omnica-icons build --config omnica-icons.config.mjs
```

Use `omnica-icons watch` during development. The output contains adjacent `filled.svg`/`filled.ts` and `outlined.svg`/`outlined.ts` files. Generated TypeScript uses a static `new URL('./filled.svg', import.meta.url)`, so Vite and Webpack process it as a normal asset and add their production content hash.

Generated files may be committed or produced by a `predev`/`prebuild` script. The package never writes to a consumer workspace from `postinstall`.

The Node-only `/build` entrypoint also exports pure `validateSelection`, `resolveSelection`, `createSprite`, and `createRuntimeModule` primitives. I/O is explicit in `loadManifest`, `loadIconSymbols`, `buildIconSet`, and `writeGeneratedFiles`.

## Vite plugin

The Vite adapter emits hashed subset sprites and provides `virtual:omnicajs-icons`:

```ts
import { defineConfig } from 'vite'
import { omnicaIcons } from '@omnicajs/icons/vite'

export default defineConfig({
    plugins: [
        omnicaIcons({
            declarationFile: 'src/omnica-icons.d.ts',
            include: {
                filled: { actions: ['add', 'remove'] },
                outlined: { actions: ['add-circle'] },
            },
        }),
    ],
})
```

```ts
import { iconUrl } from 'virtual:omnicajs-icons'

iconUrl('filled', 'actions', 'add')
```

Include `declarationFile` in the consumer `tsconfig`. It describes the exact selected subset, including the incomplete outlined catalog. In development the plugin serves sprites with a content-derived query key and `Cache-Control: no-cache`; in production Vite owns the hashed asset filename.

## Webpack plugin

The Webpack adapter uses the same selection and virtual module:

```js
const { OmnicaIconsPlugin } = require('@omnicajs/icons/webpack')

module.exports = {
    plugins: [
        new OmnicaIconsPlugin({
            declarationFile: 'src/omnica-icons.d.ts',
            filename: 'assets/omnica-[variant].[contenthash:8].svg',
            include: {
                filled: { actions: ['add', 'remove'] },
                outlined: { actions: ['add-circle'] },
            },
        }),
    ],
}
```

Application code imports `virtual:omnicajs-icons` exactly as in the Vite example. The plugin emits separate filled and outlined assets through Webpack and builds their runtime URLs from `__webpack_public_path__`.

## Browser caching

Files published by this package intentionally have stable names. A consumer build should own cache invalidation:

```text
node_modules/@omnicajs/icons/dist/sprites/filled.svg
→ /assets/filled.616dce3a.svg#actions/add
```

Vite, Webpack, and the first-party adapters all treat sprites as assets and produce content-hashed production filenames. When the SVG changes, its URL changes, so browser and CDN caches cannot retain an old icon set.

The fragment is not part of the HTTP request. If an environment copies a stable sprite directly, put a version or content key before `#`:

```text
/icons/filled.svg?v=<build-id>#actions/add
```

Do not add a random timestamp in production. Prefer content hashes, immutable caching for hashed files, and a short or revalidated cache policy for stable filenames.

## Validation fixtures

The repository contains CLI, Vite, and Webpack consumer fixtures. Run `make test`; compile/type checks use the Node environment and external `<use>` rendering runs in a pinned Playwright container across Chromium, Firefox, and WebKit. The bundler fixtures verify hashed subset output, the full sprite, a group sprite, and exact TypeScript declarations.

## License

MIT
