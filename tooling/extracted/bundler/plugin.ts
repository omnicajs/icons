import type { Compiler } from 'webpack'
import type { ImportedSymbol } from '../core.js'
import type { RuleSetRule } from 'webpack'

import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

import {
    assertImportedSymbolsAvailable,
    createImportedSpriteManifest,
    importedSpriteManifestFilename,
    parseImportedSpriteManifest,
} from '../manifest.js'

export interface BundlerIconComponentsOptions {
    /** Supports `[contenthash]` and `[contenthash:N]`. */
    readonly filename?: string
    /** Overrides the loader used to compile the generated Vue SFC. */
    readonly vueLoader?: string
    /** Client build output read by a later SSR build. Defaults to `<context>/dist`. */
    readonly clientOutputDirectory?: string
    /** Overrides automatic Node-target SSR detection. */
    readonly ssr?: boolean
}

interface ImportedSymbolAsset extends ImportedSymbol {
    readonly schemaVersion: 1
}

const pluginName = 'OmnicaIconComponentsPlugin'
const temporaryAssetPrefix = '__omnica_icons_imported__/'
export const importedSpriteMarker = '__OMNICA_IMPORTED_SPRITE_URL__'

const targetsNode = (compiler: Compiler): boolean => {
    const target = compiler.options.target
    const targets = Array.isArray(target) ? target : [target]

    return targets.some(candidate => typeof candidate === 'string' && candidate.startsWith('node'))
        || compiler.options.externalsPresets?.node === true
}

const assertRootRelativePublicPath = (publicPath: unknown): string => {
    if (
        typeof publicPath !== 'string'
        || !publicPath.startsWith('/')
        || publicPath.startsWith('//')
        || !publicPath.endsWith('/')
    ) {
        throw new Error(
            'Import-driven icon builds require output.publicPath to be root-relative and end in "/". '
            + 'Absolute, protocol-relative, automatic, and relative public paths are not supported. '
            + `Received ${typeof publicPath === 'string' ? JSON.stringify(publicPath) : typeof publicPath}.`
        )
    }

    return publicPath
}

export const renderContentHashFilename = (template: string, source: string): string => {
    const hash = createHash('sha256').update(source).digest('hex')

    return template.replace(/\[contenthash(?::(\d+))?\]/g, (_match, length: string | undefined) => (
        length ? hash.slice(0, Number(length)) : hash
    ))
}

export const createImportedSymbolAsset = (symbol: ImportedSymbol): string => JSON.stringify({
    schemaVersion: 1,
    importedSymbol: symbol.importedSymbol,
    symbolSource: symbol.symbolSource,
} satisfies ImportedSymbolAsset)

export const importedSymbolAssetFilename = (symbol: ImportedSymbol): string => {
    const hash = createHash('sha256').update(symbol.importedSymbol).digest('hex')

    return `${temporaryAssetPrefix}${hash}.json`
}

const parseImportedSymbolAsset = (source: string, filename: string): ImportedSymbolAsset => {
    const parsed = JSON.parse(source) as Partial<ImportedSymbolAsset>

    if (
        parsed.schemaVersion !== 1
        || typeof parsed.importedSymbol !== 'string'
        || typeof parsed.symbolSource !== 'string'
    ) {
        throw new Error(`Invalid imported icon metadata in ${filename}`)
    }

    return parsed as ImportedSymbolAsset
}

const replaceSpriteMarker = (
    compiler: Compiler,
    compilation: Parameters<Parameters<Compiler['hooks']['thisCompilation']['tap']>[1]>[0],
    filename: string
): void => {
    const { ReplaceSource } = compiler.webpack.sources

    for (const asset of compilation.getAssets()) {
        const source = asset.source.source().toString()

        if (!source.includes(importedSpriteMarker)) {
            continue
        }

        const replaced = new ReplaceSource(asset.source, asset.name)
        let position = source.indexOf(importedSpriteMarker)

        while (position !== -1) {
            replaced.replace(
                position,
                position + importedSpriteMarker.length - 1,
                filename
            )
            position = source.indexOf(importedSpriteMarker, position + importedSpriteMarker.length)
        }

        compilation.updateAsset(asset.name, replaced)
    }
}

export class BundlerIconComponentsPlugin {
    readonly #options: BundlerIconComponentsOptions

    public constructor (options: BundlerIconComponentsOptions = {}) {
        this.#options = options
    }

    public apply (compiler: Compiler): void {
        const loaderPath = join(__dirname, 'component-loader.cjs')
        const templateAssetsLoaderPath = join(__dirname, 'template-assets-loader.cjs')
        const assetsPath = resolve(__dirname, '../../../assets/icons')
        const clientOutputDirectory = resolve(
            compiler.context,
            this.#options.clientOutputDirectory ?? 'dist'
        )
        const ssr = this.#options.ssr ?? targetsNode(compiler)
        const publicPath = assertRootRelativePublicPath(compiler.options.output.publicPath)
        const vueLoader: RuleSetRule = {
            loader: this.#options.vueLoader ?? 'vue-loader',
            options: {
                experimentalInlineMatchResource: true,
            },
        }

        compiler.options.module.rules.push({
            dependency: { not: ['url'] },
            include: assetsPath,
            issuer: /\.(?:[cm]?[jt]sx?|vue)$/,
            resourceQuery: /^(?:$|\?vue&type=(?:script|template)\b)/,
            test: /\.svg$/,
            type: 'javascript/auto',
            use: [
                vueLoader,
                {
                    loader: loaderPath,
                    options: { ssr },
                },
            ],
        })
        compiler.options.module.rules.push({
            enforce: 'post',
            resourceQuery: /\bvue&type=(?:script|template)\b/,
            test: /\.vue$/,
            use: [{ loader: templateAssetsLoaderPath }],
        })

        compiler.hooks.thisCompilation.tap(pluginName, compilation => {
            compilation.hooks.processAssets.tapPromise({
                name: pluginName,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
            }, async () => {
                const temporaryAssets = compilation.getAssets()
                    .filter(asset => asset.name.startsWith(temporaryAssetPrefix))

                if (temporaryAssets.length === 0) {
                    return
                }

                const symbols = temporaryAssets.map(asset => parseImportedSymbolAsset(
                    asset.source.source().toString(),
                    asset.name
                ))

                for (const asset of temporaryAssets) {
                    compilation.deleteAsset(asset.name)
                }

                let filename: string

                if (ssr) {
                    const manifestPath = join(clientOutputDirectory, importedSpriteManifestFilename)
                    let clientManifest

                    try {
                        clientManifest = parseImportedSpriteManifest(
                            await fs.readFile(manifestPath, 'utf8'),
                            manifestPath
                        )
                    } catch (error) {
                        const detail = error instanceof Error ? ` ${error.message}` : ''

                        throw new Error(
                            `Unable to load the import-driven icon client manifest at ${manifestPath}. `
                            + `Build the client before SSR or configure clientOutputDirectory.${detail}`
                        )
                    }

                    assertImportedSymbolsAvailable(clientManifest, symbols)
                    filename = clientManifest.spriteUrl
                } else {
                    const { createImportedSprite } = await import(
                        pathToFileURL(join(__dirname, '../core.js')).href
                    )
                    const spriteSource = createImportedSprite(symbols)
                    const filenameTemplate = this.#options.filename
                        ?? 'assets/omnica-icons-imported.[contenthash:8].svg'

                    filename = renderContentHashFilename(filenameTemplate, spriteSource)

                    compilation.emitAsset(
                        filename,
                        new compiler.webpack.sources.RawSource(spriteSource),
                        { immutable: /\[contenthash(?::\d+)?\]/.test(filenameTemplate) }
                    )
                    compilation.emitAsset(
                        importedSpriteManifestFilename,
                        new compiler.webpack.sources.RawSource(
                            createImportedSpriteManifest(filename, `${publicPath}${filename}`, symbols)
                        )
                    )
                }

                replaceSpriteMarker(compiler, compilation, filename)
            })
        })
    }
}
