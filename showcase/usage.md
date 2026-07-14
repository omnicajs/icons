# Usage

## Choose a delivery layer

Use the root entrypoint when the application needs the complete catalog and chooses a variant at runtime:

```ts
import { iconUrl } from '@omnicajs/icons'

const href = iconUrl('filled', 'actions', 'add')
const outlinedHref = iconUrl('outlined', 'actions', 'add-circle')
```

Use a variant entrypoint for one complete variant:

```ts
import { iconUrl } from '@omnicajs/icons/filled'

const href = iconUrl('actions', 'add')
```

Use a group entrypoint for a smaller ready-made sprite:

```ts
import { iconUrl } from '@omnicajs/icons/filled/actions'

const href = iconUrl('add')
```

Every helper returns a URL for an external SVG symbol:

```html
<svg width="24" height="24" aria-hidden="true">
    <use :href="href" />
</svg>
```

The full and group forms both end in `#actions/add`. Only their sprite file differs. Outlined has its own smaller name map and never falls back to filled.

## Full-color and raw assets

Flags and logos preserve source colors:

```ts
import { iconUrl as flagUrl } from '@omnicajs/icons/flags'
import { iconUrl as logoUrl } from '@omnicajs/icons/logos'
```

Raw files remain available to consumer pipelines:

```ts
import addUrl from '@omnicajs/icons/assets/icons/filled/actions/add.svg?url'
```

## Custom subset

For a smaller cross-group sprite, configure the CLI or bundler adapter:

```js
import { defineConfig } from '@omnicajs/icons/build'

export default defineConfig({
    include: {
        filled: {
            actions: ['add', 'remove'],
            alerts: ['warning'],
        },
    },
})
```

```bash
omnica-icons build --config omnica-icons.config.mjs
```

The generated TypeScript module points to the adjacent SVG through `new URL(..., import.meta.url)`. Vite or Webpack then copies that asset and adds a content hash.

First-party adapters are available as `@omnicajs/icons/vite` and `@omnicajs/icons/webpack`; both expose the selected subset as `virtual:omnicajs-icons` and can generate an exact declaration file. See the package README for complete configurations.

## Cache invalidation

Production applications should let their bundler produce a content-hashed sprite URL:

```text
/assets/filled.616dce3a.svg#actions/add
```

The fragment does not participate in the HTTP request. When a stable sprite is served directly, place a deterministic build key before the fragment:

```text
/icons/filled.svg?v=<build-id>#actions/add
```

The catalog uses this query technique only in development. Published runtime helpers do not add timestamps or other production side effects.
