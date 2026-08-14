import type { LoaderDefinitionFunction } from 'webpack'

import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { relative, resolve, sep } from 'node:path'

import {
    createImportedSymbolAsset,
    importedSpriteMarker,
    importedSymbolAssetFilename,
} from './plugin.js'

const omnicaIconComponentsLoader: LoaderDefinitionFunction = function () {
    const callback = this.async()
    const { ssr = false } = this.getOptions() as { readonly ssr?: boolean }
    const assetsPath = resolve(__dirname, '../../../assets/icons')
    const assetPath = relative(assetsPath, this.resourcePath).split(sep).join('/')

    this.cacheable(true)

    if (assetPath.startsWith('../') || assetPath === '..') {
        callback(new Error(`Imported icon is outside ${assetsPath}: ${this.resourcePath}`))

        return
    }

    const source = `@omnicajs/icons/assets/icons/${assetPath}`

    import(pathToFileURL(join(__dirname, '../core.js')).href)
        .then(async ({ createVueIconSfc, loadImportedIcon, loadManifest }) => {
            const icon = await loadImportedIcon(source, await loadManifest())

            if (!icon) {
                throw new Error(`Unable to resolve imported icon ${source}`)
            }

            this.emitFile(
                importedSymbolAssetFilename(icon),
                createImportedSymbolAsset(icon)
            )

            callback(null, createVueIconSfc(
                icon,
                ssr
                    ? JSON.stringify(importedSpriteMarker)
                    : `__webpack_public_path__ + ${JSON.stringify(importedSpriteMarker)}`
            ))
        })
        .catch((error: unknown) => {
            callback(error instanceof Error ? error : new Error(String(error)))
        })
}

export default omnicaIconComponentsLoader
