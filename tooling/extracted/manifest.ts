import type { ImportedSymbol } from './core.js'

export interface ImportedSpriteManifest {
    readonly schemaVersion: 1
    readonly spriteFilename: string
    readonly spriteUrl: string
    readonly symbols: readonly string[]
}

export const importedSpriteManifestFilename = '.omnica/omnica-icons-imported.json'

export const createImportedSpriteManifest = (
    spriteFilename: string,
    spriteUrl: string,
    icons: readonly ImportedSymbol[]
): string => `${JSON.stringify({
    schemaVersion: 1,
    spriteFilename,
    spriteUrl,
    symbols: [...new Set(icons.map(icon => icon.importedSymbol))].sort(),
} satisfies ImportedSpriteManifest, null, 2)}\n`

export const parseImportedSpriteManifest = (
    source: string,
    filename: string
): ImportedSpriteManifest => {
    const parsed = JSON.parse(source) as Partial<ImportedSpriteManifest>

    if (
        parsed.schemaVersion !== 1
        || typeof parsed.spriteFilename !== 'string'
        || parsed.spriteFilename.length === 0
        || typeof parsed.spriteUrl !== 'string'
        || !parsed.spriteUrl.startsWith('/')
        || parsed.spriteUrl.startsWith('//')
        || !Array.isArray(parsed.symbols)
        || parsed.symbols.some(symbol => typeof symbol !== 'string')
        || new Set(parsed.symbols).size !== parsed.symbols.length
    ) {
        throw new Error(`Invalid import-driven icon manifest in ${filename}`)
    }

    return parsed as ImportedSpriteManifest
}

export const assertImportedSymbolsAvailable = (
    manifest: ImportedSpriteManifest,
    icons: readonly ImportedSymbol[]
): void => {
    const clientSymbols = new Set(manifest.symbols)
    const missing = [...new Set(icons
        .map(icon => icon.importedSymbol)
        .filter(symbol => !clientSymbols.has(symbol)))]
        .sort()

    if (missing.length > 0) {
        throw new Error(
            `SSR imports icons missing from the client sprite: ${missing.join(', ')}. `
            + 'Build the client first and ensure its icon graph contains every server-rendered icon.'
        )
    }
}
