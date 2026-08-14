import type { ImportedIcon } from './core.js'
import type { ImportedSpriteManifest } from './manifest.js'
import type { Plugin } from 'vite'

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { assertImportedSymbolsAvailable } from './manifest.js'
import { createImportedSprite } from './core.js'
import { createImportedSpriteManifest } from './manifest.js'
import { createVueIconSfc } from './core.js'
import { importedSpriteManifestFilename } from './manifest.js'
import { loadImportedIcon } from './core.js'
import { loadManifest } from './core.js'
import { parseImportedSpriteManifest } from './manifest.js'
import { resolveImportedIcon } from './core.js'

export interface OmnicaIconComponentsOptions {
    /** Asset name before Vite adds its content hash. */
    readonly spriteName?: string
    /** Client build output read by a later SSR build. Defaults to `<root>/dist`. */
    readonly clientOutputDirectory?: string
}

const importedComponentPrefix = 'omnicajs-icon-component:'
const importedSpritePath = '/@omnicajs/icons/imported/'
const importedSpriteMarker = '__OMNICA_IMPORTED_SPRITE_URL__'
const vueTemplateAssetImport = /(\bimport\s+_imports_\d+\s+from\s+)(["'])(@omnicajs\/icons\/assets\/icons\/(?:filled|outlined)\/[^"'?#]+\.svg)\2/g

const isRootRelativePath = (value: string): boolean => value.startsWith('/') && !value.startsWith('//')

interface ViteIconComponentsState {
    clientManifest?: ImportedSpriteManifest
    clientManifestPromise?: Promise<ImportedSpriteManifest>
    readonly componentSources: Map<string, string>
    emittedIcons: readonly ImportedIcon[]
    readonly icons: Map<string, ImportedIcon>
    spriteReference?: string
}

const resolveDevSpritePath = (base: string): string => {
    if (base === '' || base.startsWith('.')) {
        return importedSpritePath
    }

    const basePath = URL.canParse(base) ? new URL(base).pathname : base
    const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`

    return `${normalizedBase}${importedSpritePath.slice(1)}`
}

export const omnicaIconComponents = (options: OmnicaIconComponentsOptions = {}): Plugin => {
    let base = '/'
    let command: 'build' | 'serve' = 'build'
    let clientOutputDirectory = ''
    let devSpritePath = importedSpritePath
    let legacySsr = false
    let publishedClientManifest: ImportedSpriteManifest | undefined
    const devSprites = new Map<string, string>()
    const environmentStates = new WeakMap<object, ViteIconComponentsState>()
    const legacyState: ViteIconComponentsState = {
        componentSources: new Map(),
        emittedIcons: [],
        icons: new Map(),
    }
    const manifest = loadManifest()
    const stateFor = (context: { readonly environment?: object }): ViteIconComponentsState => {
        if (!context.environment) {
            return legacyState
        }

        const existing = environmentStates.get(context.environment)

        if (existing) {
            return existing
        }

        const created: ViteIconComponentsState = {
            componentSources: new Map(),
            emittedIcons: [],
            icons: new Map(),
        }

        environmentStates.set(context.environment, created)

        return created
    }
    const isSsr = (context: {
        readonly environment?: { readonly config?: { readonly build?: { readonly ssr?: unknown } } }
    }): boolean => context.environment ? Boolean(context.environment.config?.build?.ssr) : legacySsr
    const loadClientManifest = (state: ViteIconComponentsState): Promise<ImportedSpriteManifest> => {
        if (publishedClientManifest) {
            state.clientManifest = publishedClientManifest

            return Promise.resolve(publishedClientManifest)
        }

        state.clientManifestPromise ??= (async () => {
            const filename = path.join(clientOutputDirectory, importedSpriteManifestFilename)

            try {
                const loaded = parseImportedSpriteManifest(await fs.readFile(filename, 'utf8'), filename)

                state.clientManifest = loaded

                return loaded
            } catch (error) {
                const detail = error instanceof Error ? ` ${error.message}` : ''

                throw new Error(
                    `Unable to load the import-driven icon client manifest at ${filename}. `
                    + `Build the client before SSR or configure clientOutputDirectory.${detail}`
                )
            }
        })()

        return state.clientManifestPromise
    }

    return {
        name: 'omnicajs-icon-components',
        enforce: 'pre',
        configResolved (config) {
            base = config.base
            command = config.command

            if (command === 'build' && !isRootRelativePath(base)) {
                throw new Error(
                    'Import-driven icon builds require a root-relative Vite base. '
                    + `Absolute, protocol-relative, and relative bases are not supported. Received ${JSON.stringify(base)}.`
                )
            }

            clientOutputDirectory = path.resolve(config.root, options.clientOutputDirectory ?? 'dist')
            devSpritePath = resolveDevSpritePath(base)
            legacySsr = Boolean(config.build.ssr)
        },
        buildStart () {
            const state = stateFor(this)

            state.clientManifest = undefined
            state.clientManifestPromise = undefined
            state.emittedIcons = []
            state.spriteReference = undefined

            if (!isSsr(this)) {
                publishedClientManifest = undefined
            }
        },
        configureServer (server) {
            server.middlewares.use(devSpritePath, (request, response, next) => {
                const filename = request.url?.split(/[?#]/, 1)[0]?.replace(/^\//, '')
                const sprite = filename ? devSprites.get(filename) : undefined

                if (!sprite) {
                    next()

                    return
                }

                response.statusCode = 200
                response.setHeader('Content-Type', 'image/svg+xml')
                response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
                response.end(sprite)
            })
        },
        async resolveId (id, importer, resolveOptions) {
            const state = stateFor(this)

            if (
                resolveOptions.kind === 'url-token'
                || resolveOptions.kind === 'new-url'
                || (importer !== undefined && /\.(?:css|less|sass|scss|styl|stylus)(?:$|\?)/.test(importer))
            ) {
                return null
            }

            const icon = resolveImportedIcon(id, await manifest)

            if (!icon) {
                return null
            }

            const virtualId = `${importedComponentPrefix}${icon.importedSymbol}.vue`

            state.componentSources.set(virtualId, id)

            return virtualId
        },
        transform (code, id) {
            if (!id.includes('.vue')) {
                return null
            }

            const transformed = code.replace(
                vueTemplateAssetImport,
                (_match, prefix: string, quote: string, source: string) => (
                    `${prefix}${quote}${source}?url${quote}`
                )
            )

            return transformed === code ? null : { code: transformed, map: null }
        },
        async load (id) {
            const state = stateFor(this)
            const source = state.componentSources.get(id)

            if (!source) {
                return null
            }

            const icon = await loadImportedIcon(source, await manifest)

            if (!icon) {
                return null
            }

            state.icons.set(id, icon)

            if (command === 'build') {
                if (isSsr(this)) {
                    await loadClientManifest(state)
                }

                return createVueIconSfc(icon, JSON.stringify(importedSpriteMarker))
            }

            const sprite = createImportedSprite([icon])
            const hash = crypto.createHash('sha256').update(sprite).digest('hex').slice(0, 16)
            const filename = `${hash}.svg`

            devSprites.set(filename, sprite)

            return createVueIconSfc(icon, JSON.stringify(`${devSpritePath}${filename}`))
        },
        buildEnd (error) {
            const state = stateFor(this)
            const activeIcons = [...this.getModuleIds()]
                .map(id => state.icons.get(id))
                .filter(icon => icon !== undefined)

            state.emittedIcons = activeIcons

            if (error || command !== 'build' || activeIcons.length === 0) {
                return
            }

            if (isSsr(this)) {
                if (!state.clientManifest) {
                    this.error('Import-driven icon client manifest was not loaded for the SSR build.')
                }

                assertImportedSymbolsAvailable(state.clientManifest, activeIcons)
            } else {
                state.spriteReference = this.emitFile({
                    type: 'asset',
                    name: options.spriteName ?? 'omnica-icons-imported.svg',
                    source: createImportedSprite(activeIcons),
                })
            }
        },
        generateBundle () {
            const state = stateFor(this)

            if (isSsr(this) || !state.spriteReference) {
                return
            }

            const spriteFilename = this.getFileName(state.spriteReference)
            const spriteUrl = base.endsWith('/') ? `${base}${spriteFilename}` : `${base}/${spriteFilename}`

            const clientManifest = parseImportedSpriteManifest(
                createImportedSpriteManifest(
                    spriteFilename,
                    spriteUrl,
                    state.emittedIcons
                ),
                importedSpriteManifestFilename
            )

            publishedClientManifest = clientManifest
            this.emitFile({
                type: 'asset',
                fileName: importedSpriteManifestFilename,
                source: createImportedSpriteManifest(
                    clientManifest.spriteFilename,
                    clientManifest.spriteUrl,
                    state.emittedIcons
                ),
            })
        },
        renderChunk (code) {
            if (!code.includes(importedSpriteMarker)) {
                return null
            }

            const state = stateFor(this)
            const ssr = isSsr(this)
            const spriteUrl = ssr ? state.clientManifest?.spriteUrl : (() => {
                if (!state.spriteReference) {
                    return undefined
                }

                const filename = this.getFileName(state.spriteReference)

                return base.endsWith('/') ? `${base}${filename}` : `${base}/${filename}`
            })()

            if (!spriteUrl) {
                this.error('Unable to resolve the import-driven icon sprite URL.')
            }

            const spriteExpression = JSON.stringify(spriteUrl)

            const markerLiteral = new RegExp(`(["'])${importedSpriteMarker}([^"']*)\\1`, 'g')
            const replaced = code.replace(
                markerLiteral,
                (_match, _quote: string, suffix: string) => (
                    suffix.length === 0
                        ? spriteExpression
                        : `${spriteExpression} + ${JSON.stringify(suffix)}`
                )
            )

            if (replaced === code) {
                this.error('Unable to replace the import-driven icon sprite marker.')
            }

            return replaced
        },
    }
}
