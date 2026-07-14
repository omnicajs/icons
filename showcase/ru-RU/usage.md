# Использование

## Выберите уровень поставки

Используйте корневую точку входа, когда приложению нужен полный каталог с выбором начертания во время выполнения:

```ts
import { iconUrl } from '@omnicajs/icons'

const href = iconUrl('filled', 'actions', 'add')
const outlinedHref = iconUrl('outlined', 'actions', 'add-circle')
```

Используйте точку входа начертания, чтобы получить один полный набор:

```ts
import { iconUrl } from '@omnicajs/icons/filled'

const href = iconUrl('actions', 'add')
```

Используйте точку входа группы, чтобы получить готовый спрайт меньшего размера:

```ts
import { iconUrl } from '@omnicajs/icons/filled/actions'

const href = iconUrl('add')
```

Каждый helper возвращает URL внешнего SVG-символа:

```html
<svg width="24" height="24" aria-hidden="true">
    <use :href="href" />
</svg>
```

URL общего и группового спрайтов заканчиваются одинаково — `#actions/add`. Различается только файл спрайта. У контурного начертания собственная сокращённая карта имён, и оно никогда не откатывается к варианту с заливкой.

## Полноцветные и исходные ресурсы

Флаги и логотипы сохраняют исходные цвета:

```ts
import { iconUrl as flagUrl } from '@omnicajs/icons/flags'
import { iconUrl as logoUrl } from '@omnicajs/icons/logos'
```

Исходные файлы остаются доступны для собственных пайплайнов потребителя:

```ts
import addUrl from '@omnicajs/icons/assets/icons/filled/actions/add.svg?url'
```

## Собственный поднабор

Чтобы собрать компактный спрайт из нескольких групп, настройте CLI или адаптер сборщика:

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

Сгенерированный TypeScript-модуль ссылается на расположенный рядом SVG через `new URL(..., import.meta.url)`. Затем Vite или Webpack копирует ресурс и добавляет хеш содержимого.

Готовые адаптеры доступны как `@omnicajs/icons/vite` и `@omnicajs/icons/webpack`: оба предоставляют выбранный поднабор через `virtual:omnicajs-icons` и могут сгенерировать точный файл деклараций. Полные примеры конфигурации приведены в README пакета.

## Инвалидация кеша

В production-сборке поручите сборщику сформировать URL спрайта с хешем содержимого:

```text
/assets/filled.616dce3a.svg#actions/add
```

Фрагмент не участвует в HTTP-запросе. Если стабильный URL спрайта используется напрямую, добавьте детерминированный идентификатор сборки перед фрагментом:

```text
/icons/filled.svg?v=<build-id>#actions/add
```

Каталог использует такой query-параметр только во время разработки. Опубликованные runtime-helper'ы не добавляют временные метки и другие побочные эффекты для production.
