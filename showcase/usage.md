# Usage

Install the package with your project package manager:

```bash
yarn add @omnicajs/icons
```

Import the typed URL helper and render the returned sprite reference through an SVG `use` element:

```ts
import { iconUrl } from '@omnicajs/icons'

const href = iconUrl('actions', 'add')
```

```html
<svg aria-hidden="true">
    <use :href="href" />
</svg>
```

Each group also exports its icon names and sprite URL:

```ts
import { iconNames, spriteUrl } from '@omnicajs/icons'
import type { ActionsIconName, IconGroup, IconName } from '@omnicajs/icons'

const actions = iconNames.actions
const actionsSprite = spriteUrl('actions')
```

Raw source SVG files remain available for consumer-specific pipelines:

```ts
import addUrl from '@omnicajs/icons/assets/icons/actions/add.svg?url'
import armeniaUrl from '@omnicajs/icons/assets/flags/armenia.svg?url'
```

Interface icons inherit `currentColor`. Symbols from the `flags` group preserve their original multicolor palette.
