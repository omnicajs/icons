import type { IconManifest, ManifestIcon } from '../build.js'

import { loadIconSymbols } from '../build.js'
import { serializeSprite } from '../shared/sprite.js'

export { loadManifest } from '../build.js'

export interface ImportedIcon extends ManifestIcon {
    readonly variant: 'filled' | 'outlined'
    readonly group: string
    readonly name: string
    readonly importedSymbol: string
    readonly symbolSource: string
}

export type ImportedSymbol = Pick<ImportedIcon, 'importedSymbol' | 'symbolSource'>

const importedAssetExpression = /^@omnicajs\/icons\/(assets\/icons\/(filled|outlined)\/([^/]+)\/([^/]+)\.svg)$/

const importedSymbolId = (variant: string, group: string, name: string): string => (
    `${variant}/${group}/${name}`
)

export const resolveImportedIcon = (
    source: string,
    manifest: IconManifest
): Omit<ImportedIcon, 'symbolSource'> | null => {
    if (source.includes('?') || source.includes('#')) {
        return null
    }

    const match = source.match(importedAssetExpression)

    if (!match) {
        return null
    }

    const [, assetPath, variant, group, name] = match
    const variantManifest = manifest.variants[variant]
    const icon = variantManifest?.groups[group]?.icons[name]

    if (!icon || icon.source !== assetPath) {
        throw new Error(`Unknown imported icon ${variant}/${group}/${name}`)
    }

    return {
        ...icon,
        variant: variant as ImportedIcon['variant'],
        group,
        name,
        importedSymbol: importedSymbolId(variant, group, name),
    }
}

export const loadImportedIcon = async (
    source: string,
    manifest: IconManifest
): Promise<ImportedIcon | null> => {
    const icon = resolveImportedIcon(source, manifest)

    if (!icon) {
        return null
    }

    const loaded = await loadIconSymbols([{
        variant: icon.variant,
        groups: [{
            name: icon.group,
            sprite: manifest.variants[icon.variant].groups[icon.group].sprite,
            icons: [{
                name: icon.name,
                source: icon.source,
                symbol: icon.symbol,
                viewBox: icon.viewBox,
                keywords: icon.keywords,
            }],
        }],
    }])
    const symbolSource = loaded[0]?.groups[0]?.icons[0]?.symbolSource

    if (!symbolSource) {
        throw new Error(`Missing symbol source for ${icon.importedSymbol}`)
    }

    return {
        ...icon,
        symbolSource,
    }
}

export const createImportedSprite = (icons: readonly ImportedSymbol[]): string => {
    const uniqueIcons = new Map(icons.map(icon => [icon.importedSymbol, icon]))
    const symbols = [...uniqueIcons.values()]
        .sort((left, right) => left.importedSymbol.localeCompare(right.importedSymbol))
        .map(icon => icon.symbolSource.replace(
            /(<symbol\b[^>]*\bid=)(["'])([^"']+)\2/,
            (_match, prefix: string, quote: string) => `${prefix}${quote}${icon.importedSymbol}${quote}`
        ))

    return serializeSprite(symbols)
}

const componentName = (icon: Pick<ImportedIcon, 'variant' | 'group' | 'name'>): string => (
    `Omnica-${icon.variant}-${icon.group}-${icon.name}-icon`
        .split(/[^A-Za-z0-9]+/)
        .filter(Boolean)
        .map(part => `${part[0].toUpperCase()}${part.slice(1)}`)
        .join('')
)

export const createVueIconSfc = (icon: ImportedIcon, spriteExpression: string): string => `<template>
    <svg viewBox="${icon.viewBox}">
        <use :href="href" />
    </svg>
</template>

<script>
const href = ${spriteExpression} + ${JSON.stringify(`#${icon.importedSymbol}`)}

export default {
    name: ${JSON.stringify(componentName(icon))},
    data: () => ({ href }),
}
</script>
`
