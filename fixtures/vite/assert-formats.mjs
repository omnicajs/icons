import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'

import { build } from 'vite'
import vue from '@vitejs/plugin-vue'

import { omnicaIconComponents } from '../../dist/vite.js'

const root = fileURLToPath(new URL('.', import.meta.url))
const outputDirectory = path.join(root, 'dist-cjs')

for (const base of ['', './', '//cdn.example.test/icons/', 'https://cdn.example.test/icons/']) {
    const invalidOutputDirectory = path.join(root, 'dist-invalid-base')

    try {
        await assert.rejects(() => build({
            base,
            build: {
                emptyOutDir: true,
                lib: {
                    entry: path.join(root, 'src/library.ts'),
                    formats: ['es'],
                },
                outDir: invalidOutputDirectory,
                rollupOptions: {
                    external: ['vue'],
                },
            },
            configFile: false,
            plugins: [
                omnicaIconComponents(),
                vue(),
            ],
            root,
        }), /Import-driven icon builds require a root-relative Vite base/)
    } finally {
        await fs.rm(invalidOutputDirectory, { force: true, recursive: true })
    }
}

await build({
    base: '/icons/',
    build: {
        emptyOutDir: true,
        lib: {
            entry: path.join(root, 'src/library.ts'),
            fileName: 'library',
            formats: ['cjs'],
        },
        minify: false,
        outDir: outputDirectory,
        rollupOptions: {
            external: ['vue'],
        },
    },
    configFile: false,
    plugins: [
        omnicaIconComponents(),
        vue(),
    ],
    root,
})

const runtimeFilename = (await fs.readdir(outputDirectory))
    .find(filename => /^library.*\.cjs$/.test(filename))

assert.ok(runtimeFilename, 'Vite CJS library runtime is missing')

const runtime = await fs.readFile(path.join(outputDirectory, runtimeFilename), 'utf8')
const manifest = JSON.parse(await fs.readFile(
    path.join(outputDirectory, '.omnica/omnica-icons-imported.json'),
    'utf8'
))

assert.doesNotMatch(runtime, /__OMNICA_IMPORTED_SPRITE_URL__|undefined#/)
assert.ok(runtime.includes(`/icons/${manifest.spriteFilename}`))
assert.equal(manifest.spriteUrl, `/icons/${manifest.spriteFilename}`)
assert.deepEqual(manifest.symbols, ['filled/actions/clear-circle'])
assert.ok(await fs.stat(path.join(outputDirectory, manifest.spriteFilename)))
