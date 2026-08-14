import type { LibraryFormats, Plugin, UserConfig } from 'vite'

import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'

import { defineConfig } from 'vite'

const __root = path.dirname(fileURLToPath(import.meta.url))
const __tooling = path.join(__root, 'tooling')
const __dist = path.join(__root, 'dist')

const esmEntries = {
    build: path.join(__tooling, 'build.ts'),
    cli: path.join(__tooling, 'cli.ts'),
    'extracted/core': path.join(__tooling, 'extracted/core.ts'),
    vite: path.join(__tooling, 'vite.ts'),
}

const cjsEntries = {
    'extracted/bundler/component-loader': path.join(__tooling, 'extracted/bundler/component-loader.ts'),
    'extracted/bundler/plugin': path.join(__tooling, 'extracted/bundler/plugin.ts'),
    'extracted/bundler/template-assets-loader': path.join(__tooling, 'extracted/bundler/template-assets-loader.ts'),
    rspack: path.join(__tooling, 'rspack.ts'),
    'subset/webpack-loader': path.join(__tooling, 'subset/webpack-loader.ts'),
    'subset/webpack-runtime': path.join(__tooling, 'subset/webpack-runtime.ts'),
    webpack: path.join(__tooling, 'webpack.ts'),
}

const executableCli = (): Plugin => ({
    name: 'omnicajs-icons-executable-cli',
    async closeBundle () {
        await fs.chmod(path.join(__dist, 'cli.js'), 0o755)
    },
})

const toolingConfig = (
    entries: Record<string, string>,
    format: LibraryFormats,
    extension: 'js' | 'cjs'
): UserConfig => ({
    build: {
        copyPublicDir: false,
        emptyOutDir: false,
        lib: {
            entry: entries,
            formats: [format],
        },
        minify: false,
        outDir: __dist,
        rollupOptions: {
            external: id => id.startsWith('node:'),
            output: {
                chunkFileNames: `chunks/[name].${extension}`,
                entryFileNames: `[name].${extension}`,
                exports: 'auto',
                preserveModules: true,
                preserveModulesRoot: __tooling,
            },
        },
        target: 'node20',
    },
})

export default defineConfig(({ mode }) => {
    if (mode === 'tooling-cjs') {
        return toolingConfig(cjsEntries, 'cjs', 'cjs')
    }

    return {
        ...toolingConfig(esmEntries, 'es', 'js'),
        plugins: [executableCli()],
    }
})
