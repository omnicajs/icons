# @omnicajs/icons

Typed SVG icon sprites for OmnicaJS projects. The package provides one sprite per icon group, runtime URL helpers, generated icon-name types, and access to the original SVG files.

[Browse the icon catalog](https://omnicajs.github.io/icons/)

## Installation

```bash
yarn add @omnicajs/icons
```

```bash
npm install @omnicajs/icons
```

```bash
pnpm add @omnicajs/icons
```

## Usage

Call `iconUrl(group, name)` and pass the returned URL to an SVG `use` element. For example, in Vue:

```vue
<script setup lang="ts">
import { iconUrl } from '@omnicajs/icons'

const addIconUrl = iconUrl('actions', 'add')
</script>

<template>
    <svg width="24" height="24" aria-hidden="true">
        <use :href="addIconUrl" />
    </svg>
</template>
```

The returned value points to a symbol inside the corresponding group sprite:

```text
<resolved actions sprite URL>#add
```

The helper is not tied to Vue. The same URL can be assigned to the `href` of an SVG `use` element by any renderer.

## Color And Size

Interface icons inherit `currentColor`, so their color and dimensions are controlled by the outer SVG:

```html
<svg width="20" height="20" style="color: #2563eb" aria-hidden="true">
    <use href="<resolved icon URL>"></use>
</svg>
```

Source `viewBox` values are preserved in the generated symbols. Set the consumer SVG width and height to the size required by the interface.

The `flags` group keeps its original multicolor palette. Its symbols use the same URL API and sizing behavior, but do not inherit the outer SVG color:

```ts
const armenia = iconUrl('flags', 'armenia')
```

## API

### `iconUrl(group, name)`

Returns the URL of an icon symbol. The icon name is restricted to names from the selected group.

```ts
import { iconUrl } from '@omnicajs/icons'

const warning = iconUrl('alerts', 'warning')
```

### `spriteUrl(group)`

Returns the URL of the complete sprite for a group.

```ts
import { spriteUrl } from '@omnicajs/icons'

const actionsSprite = spriteUrl('actions')
```

### `iconNames` and `spriteUrls`

Expose the generated icon registry and group sprite URLs:

```ts
import { iconNames, spriteUrls } from '@omnicajs/icons'

const actionNames = iconNames.actions
const alertsSprite = spriteUrls.alerts
```

Unknown groups and icon names throw at runtime when the API is called from untyped JavaScript or with externally supplied values.

## TypeScript

The package generates group-specific name types and a common typed registry:

```ts
import type {
    ActionsIconName,
    AlertsIconName,
    IconGroup,
    IconName,
    IconNameMap,
} from '@omnicajs/icons'

const action: ActionsIconName = 'add'
const alert: IconName<'alerts'> = 'warning'
```

Available group and icon-name types are generated from the published SVG assets, so editor completion stays aligned with the installed package version.

## Raw SVG Assets

Original source files are exported for consumers with their own SVG pipeline. For example, with Vite:

```ts
import addUrl from '@omnicajs/icons/assets/icons/actions/add.svg?url'
import armeniaUrl from '@omnicajs/icons/assets/flags/armenia.svg?url'
```

Ready-made group sprites are also exported through `@omnicajs/icons/sprites/*`.

## Package Formats

The package provides ESM, CommonJS, and TypeScript declarations. Sprite files and raw assets are included in the published package.

## License

MIT
