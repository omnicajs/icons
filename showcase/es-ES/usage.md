# Uso

## Elige una capa de distribución

Usa el punto de entrada raíz cuando la aplicación necesite el catálogo completo y elija una variante en tiempo de ejecución:

```ts
import { iconUrl } from '@omnicajs/icons'

const href = iconUrl('filled', 'actions', 'add')
const outlinedHref = iconUrl('outlined', 'actions', 'add-circle')
```

Usa el punto de entrada de una variante para obtener una variante completa:

```ts
import { iconUrl } from '@omnicajs/icons/filled'

const href = iconUrl('actions', 'add')
```

Usa el punto de entrada de un grupo para obtener un sprite prediseñado más pequeño:

```ts
import { iconUrl } from '@omnicajs/icons/filled/actions'

const href = iconUrl('add')
```

Cada helper devuelve la URL de un símbolo SVG externo:

```html
<svg width="24" height="24" aria-hidden="true">
    <use :href="href" />
</svg>
```

Las formas completa y por grupo terminan en `#actions/add`. Solo cambia el archivo del sprite. La variante de contorno tiene su propio mapa de nombres, más pequeño, y nunca recurre a la variante de relleno.

## Recursos a todo color y archivos fuente

Las banderas y los logotipos conservan los colores originales:

```ts
import { iconUrl as flagUrl } from '@omnicajs/icons/flags'
import { iconUrl as logoUrl } from '@omnicajs/icons/logos'
```

Los archivos fuente siguen disponibles para los pipelines de los consumidores:

```ts
import addUrl from '@omnicajs/icons/assets/icons/filled/actions/add.svg?url'
```

## Subconjunto personalizado

Para crear un sprite más pequeño con iconos de varios grupos, configura la CLI o el adaptador del bundler:

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

El módulo TypeScript generado referencia el SVG adyacente mediante `new URL(..., import.meta.url)`. Vite o Webpack copia después el recurso y añade un hash de contenido.

Los adaptadores oficiales están disponibles como `@omnicajs/icons/vite` y `@omnicajs/icons/webpack`; ambos exponen el subconjunto seleccionado como `virtual:omnicajs-icons` y pueden generar un archivo de declaraciones exacto. Consulta el README del paquete para ver las configuraciones completas.

## Invalidación de caché

En producción, deja que el bundler genere una URL del sprite con hash de contenido:

```text
/assets/filled.616dce3a.svg#actions/add
```

El fragmento no forma parte de la petición HTTP. Si sirves directamente un sprite con una URL estable, coloca una clave de compilación determinista antes del fragmento:

```text
/icons/filled.svg?v=<build-id>#actions/add
```

El catálogo usa esta técnica de parámetros de consulta solo durante el desarrollo. Los helpers publicados no añaden marcas de tiempo ni otros efectos secundarios en producción.
