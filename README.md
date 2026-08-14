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

## Import-driven Vue icons

The opt-in Vue adapter complements the existing full, group, and configured subset APIs. It supports Vue 3 and transforms only unqualified `filled` and `outlined` package assets.

### Vite

Add the adapter before the regular Vue plugin:

```ts
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { omnicaIconComponents } from '@omnicajs/icons/vite'

export default defineConfig({
    plugins: [
        omnicaIconComponents(),
        vue(),
    ],
})
```

### Webpack

Add the icon plugin before `VueLoaderPlugin`. The adapter injects its package-scoped SVG rule and reuses the application's `vue-loader`:

```js
const { VueLoaderPlugin } = require('vue-loader')
const { OmnicaIconComponentsPlugin } = require('@omnicajs/icons/webpack')

module.exports = {
    output: {
        publicPath: '/',
    },
    module: {
        rules: [
            { test: /\.vue$/, loader: 'vue-loader' },
            { test: /\.svg$/, type: 'asset/resource' },
        ],
    },
    plugins: [
        new OmnicaIconComponentsPlugin(),
        new VueLoaderPlugin(),
    ],
}
```

### Rspack

Rspack uses the same contract and its own typed entrypoint:

```js
const { VueLoaderPlugin } = require('vue-loader')
const { OmnicaIconComponentsPlugin } = require('@omnicajs/icons/rspack')

module.exports = {
    output: {
        publicPath: '/',
    },
    module: {
        rules: [
            { test: /\.vue$/, loader: 'vue-loader' },
            { test: /\.svg$/, type: 'asset/resource' },
        ],
    },
    plugins: [
        new OmnicaIconComponentsPlugin(),
        new VueLoaderPlugin(),
    ],
}
```

Both configurations require the normal Vue 3 SFC toolchain (`vue`, `vue-loader`, and `@vue/compiler-sfc`) in the application. The package does not declare a root Vue peer because the adapter is opt-in and the sprite/URL APIs remain compatible with non-Vue and Vue 2 consumers. If an application already has another SVG loader, constrain that rule with a query or exclude `@omnicajs/icons/assets/icons` so one unqualified import is not processed by two component loaders.

An unqualified monochrome SVG import then resolves to a Vue component:

```vue
<script setup lang="ts">
import IconClearCircle from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg'
</script>

<template>
    <IconClearCircle width="24" height="24" aria-hidden="true" />
</template>
```

Load the opt-in declarations from a project declaration file included by the consumer `tsconfig`, for example `src/omnica-icons.d.ts`:

```ts
import '@omnicajs/icons/vue'
```

The `/vue` entrypoint exports `OmnicaIconProps` as Vue's `SVGAttributes` plus typed `data-*` attributes, and `OmnicaIconComponent` as `DefineComponent<OmnicaIconProps>`. Every transformed asset uses that component type, so TypeScript checks standard SVG presentation, sizing, accessibility, data, and event attributes instead of exposing an unqualified generic Vue component.

Production builds emit one content-hashed sprite containing the imported `filled` and `outlined` symbols. Generated components preserve the source `viewBox`, forward attributes to their root `svg`, and inherit `currentColor`. The symbol fragment includes the variant, for example `#filled/actions/clear-circle`, so filled and outlined names cannot collide. Vite honours its configured root-relative `base`; Webpack and Rspack use their root-relative `output.publicPath`.

For SSR, run the client build first. It emits `.omnica/omnica-icons-imported.json`; the Vite, Webpack, and Rspack SSR adapters read that manifest and reference the exact client sprite instead of hashing the server graph independently. Server-rendered icons must be a subset of the client graph, otherwise the SSR build fails with the missing symbol names instead of producing a URL that would return 404.

The default client output is `<root>/dist` for Vite and `<context>/dist` for Webpack/Rspack. When the client uses another output directory, pass it to both configurations:

```ts
omnicaIconComponents({ clientOutputDirectory: 'dist/client' })
```

```js
new OmnicaIconComponentsPlugin({ clientOutputDirectory: 'dist/client' })
```

All production builds require a root-relative public path such as `/app/`: configure it through Vite `base` or Webpack/Rspack `output.publicPath`. Absolute HTTP(S), protocol-relative, automatic, empty, and relative paths are rejected. The generated components use external SVG `<use>` references, which browsers restrict to the page origin, so CDN sprite URLs are not supported. SSR builds reuse the public sprite URL recorded by the client manifest even when the server bundler has another root-relative public path.

Vite development serves content-addressed one-symbol sprites so HMR can add or remove imports without stale combined-sprite state. Vite watch builds and Webpack/Rspack watch compilations recalculate the production sprite from the current module graph.

Imports with `?url` keep the bundler's standard string URL behavior. Static asset URLs in Vue templates, CSS `url()` references, and JavaScript `new URL(..., import.meta.url)` dependencies also remain in the normal asset pipeline; only module imports become components. Flags and logos are not transformed by this adapter and remain available through their existing URL and sprite APIs.

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
