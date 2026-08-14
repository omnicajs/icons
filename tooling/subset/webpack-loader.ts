import type { IconBuildConfig } from '../build.js'
import type { LoaderDefinitionFunction } from 'webpack'

import { dirname, join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'

import { renderContentHashFilename } from '../extracted/bundler/plugin.js'

interface OmnicaIconsLoaderOptions {
    readonly config: IconBuildConfig
    readonly declarationFile?: string
    readonly filename: string
}

const omnicaIconsLoader: LoaderDefinitionFunction<OmnicaIconsLoaderOptions> = function () {
    const callback = this.async()
    const options = this.getOptions()

    this.cacheable(true)

    Promise.all([
        import(pathToFileURL(join(__dirname, '../build.js')).href),
        import(pathToFileURL(join(__dirname, 'adapter-output.js')).href),
    ]).then(async ([{ buildIconSet }, { createAdapterDeclarations, createAdapterRuntime }]) => {
        const artifacts = await buildIconSet(options.config)
        const spriteExpressions: Record<string, string> = {}

        for (const artifact of artifacts) {
            const filename = renderContentHashFilename(
                options.filename.replaceAll('[variant]', artifact.variant),
                artifact.spriteSource
            )

            this.emitFile(filename, artifact.spriteSource)
            spriteExpressions[artifact.variant] = `(__webpack_public_path__ + ${JSON.stringify(filename)})`
        }

        if (options.declarationFile) {
            const declarationFile = resolve(options.declarationFile)

            await mkdir(dirname(declarationFile), { recursive: true })
            await writeFile(declarationFile, createAdapterDeclarations(artifacts))
        }

        callback(null, createAdapterRuntime(artifacts, spriteExpressions, 'cjs'))
    }).catch((error: unknown) => {
        callback(error instanceof Error ? error : new Error(String(error)))
    })
}

export default omnicaIconsLoader
