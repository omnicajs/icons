import { defineConfig, type Plugin } from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const buildDirectory = path.join(root, 'generated/icon-build')
const manifestFile = path.join(buildDirectory, 'manifest.json')
const virtualModuleId = 'virtual:omnicajs-icons'
const resolvedVirtualModuleId = `\0${virtualModuleId}`
const buildFormat = process.env.OMNICAJS_ICON_FORMAT === 'cjs' ? 'cjs' : 'es'

const iconSpritePlugin = (): Plugin => ({
    name: 'omnicajs-icon-sprites',
    resolveId (id: string) {
        return id === virtualModuleId ? resolvedVirtualModuleId : null
    },
    async load (this, id: string): Promise<string | null> {
        if (id !== resolvedVirtualModuleId) {
            return null
        }

        const groups: Array<{ name: string; iconNames: string[] }> = JSON.parse(
            await fs.readFile(manifestFile, 'utf8')
        )
        const spriteUrls = []

        for (const group of groups) {
            const source = await fs.readFile(path.join(buildDirectory, 'sprites', `${group.name}.svg`))
            const fileName = `sprites/${group.name}.svg`
            const referenceId = this.emitFile({
                type: 'asset',
                fileName,
                source,
            })
            const spriteUrl = buildFormat === 'cjs'
                ? `new URL(${JSON.stringify(fileName)}, 'file://' + __filename).href`
                : `import.meta.ROLLUP_FILE_URL_${referenceId}`

            spriteUrls.push(`    ${JSON.stringify(group.name)}: ${spriteUrl},`)
        }

        return [
            'export const iconNames = {',
            groups
                .map(group => `    ${JSON.stringify(group.name)}: [${group.iconNames.map(iconName => JSON.stringify(iconName)).join(', ')}],`)
                .join('\n'),
            '}',
            '',
            'export const spriteUrls = {',
            spriteUrls.join('\n'),
            '}',
            '',
        ].join('\n')
    },
})

export default defineConfig({
    plugins: [
        iconSpritePlugin(),
    ],
    build: {
        assetsInlineLimit: 0,
        emptyOutDir: false,
        lib: {
            entry: 'src/index.ts',
            formats: [buildFormat],
            fileName: format => format === 'es' ? 'index.js' : 'index.cjs',
        },
        rollupOptions: {
            output: {
                assetFileNames: 'sprites/[name][extname]',
            },
        },
    },
})
