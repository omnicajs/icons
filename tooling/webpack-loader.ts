import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { LoaderDefinitionFunction } from 'webpack'
import type { IconBuildConfig } from './build.js'

interface OmnicaIconsLoaderOptions {
    readonly config: IconBuildConfig
    readonly declarationFile?: string
    readonly filename: string
}

const renderFilename = (template: string, variant: string, source: string): string => {
    const hash = createHash('sha256').update(source).digest('hex')

    return template
        .replaceAll('[variant]', variant)
        .replace(/\[contenthash(?::(\d+))?\]/g, (_match, length: string | undefined) => (
            length ? hash.slice(0, Number(length)) : hash
        ))
}

const omnicaIconsLoader: LoaderDefinitionFunction<OmnicaIconsLoaderOptions> = function () {
    const callback = this.async()
    const options = this.getOptions()

    this.cacheable(true)

    Promise.all([
        import(pathToFileURL(join(__dirname, 'build.js')).href),
        import(pathToFileURL(join(__dirname, 'adapter-output.js')).href),
    ]).then(async ([{ buildIconSet }, { createAdapterDeclarations, createAdapterRuntime }]) => {
        const artifacts = await buildIconSet(options.config)
        const spriteExpressions: Record<string, string> = {}

        for (const artifact of artifacts) {
            const filename = renderFilename(options.filename, artifact.variant, artifact.spriteSource)

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
