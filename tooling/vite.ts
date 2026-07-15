import type { IconBuildArtifact, IconBuildConfig } from './build.js'
import type { Plugin } from 'vite'

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { buildIconSet } from './build.js'
import { createAdapterDeclarations, createAdapterRuntime } from './adapter-output.js'

export interface OmnicaIconsOptions extends IconBuildConfig {
    /** Writes exact declarations for `virtual:omnicajs-icons`. The file must be included by consumer TypeScript. */
    readonly declarationFile?: string
}

const virtualModuleId = 'virtual:omnicajs-icons'
const resolvedVirtualModuleId = `\0${virtualModuleId}`

export const omnicaIcons = (options: OmnicaIconsOptions): Plugin => {
    let artifacts: readonly IconBuildArtifact[] = []
    let command: 'build' | 'serve' = 'build'
    const references: Record<string, string> = {}

    return {
        name: 'omnicajs-icons',
        enforce: 'pre',
        configResolved (config) {
            command = config.command
        },
        async buildStart () {
            artifacts = await buildIconSet(options)

            if (options.declarationFile) {
                const declarationFile = path.resolve(options.declarationFile)

                await fs.mkdir(path.dirname(declarationFile), { recursive: true })
                await fs.writeFile(declarationFile, createAdapterDeclarations(artifacts))
            }

            if (command === 'build') {
                for (const artifact of artifacts) {
                    references[artifact.variant] = this.emitFile({
                        type: 'asset',
                        name: `omnica-icons-${artifact.variant}.svg`,
                        source: artifact.spriteSource,
                    })
                }
            }
        },
        configureServer (server) {
            server.middlewares.use('/@omnicajs/icons/', (request, response, next) => {
                const variant = request.url?.split(/[?#]/, 1)[0]?.replace(/\.svg$/, '')
                const artifact = artifacts.find(candidate => candidate.variant === variant)

                if (!artifact) {
                    next()

                    return
                }

                response.statusCode = 200
                response.setHeader('Content-Type', 'image/svg+xml')
                response.setHeader('Cache-Control', 'no-cache')
                response.end(artifact.spriteSource)
            })
        },
        resolveId (id) {
            return id === virtualModuleId ? resolvedVirtualModuleId : null
        },
        load (id) {
            if (id !== resolvedVirtualModuleId) {
                return null
            }

            const spriteExpressions = Object.fromEntries(artifacts.map(artifact => {
                if (command === 'build') {
                    return [artifact.variant, `import.meta.ROLLUP_FILE_URL_${references[artifact.variant]}`]
                }

                const hash = crypto.createHash('sha256').update(artifact.spriteSource).digest('hex').slice(0, 8)

                return [artifact.variant, JSON.stringify(`/@omnicajs/icons/${artifact.variant}.svg?v=${hash}`)]
            }))

            return createAdapterRuntime(artifacts, spriteExpressions)
        },
    }
}
