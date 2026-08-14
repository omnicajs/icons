import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const cases = [
    {
        bundler: require('webpack'),
        config: require('./webpack/webpack.config.cjs'),
        directory: 'webpack',
        name: 'webpack',
    },
    {
        bundler: require('@rspack/core').rspack,
        config: require('./rspack/rspack.config.cjs'),
        directory: 'rspack',
        name: 'rspack',
    },
]

const entries = [
    `import Icon from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg'
console.log(Icon)
`,
    `import Icon from '@omnicajs/icons/assets/icons/outlined/actions/add-circle.svg'
console.log(Icon)
`,
]

const compileInWatchMode = async ({ bundler, config, directory, name }) => {
    const fixtureDirectory = path.resolve('fixtures', directory)
    const entry = path.join(fixtureDirectory, `.watch-${name}.js`)
    const output = path.join(fixtureDirectory, `dist-watch-${name}`)

    await fs.writeFile(entry, entries[0])

    const compiler = bundler({
        ...config,
        entry,
        output: {
            ...config.output,
            path: output,
        },
    })

    try {
        await new Promise((resolve, reject) => {
            let build = 0
            const timeout = setTimeout(() => reject(new Error(`${name} watch rebuild timed out`)), 20_000)
            const watcher = compiler.watch({}, async (error, stats) => {
                try {
                    if (error) {
                        throw error
                    }

                    const details = stats?.toJson({ all: false, errors: true })

                    if (!stats || stats.hasErrors()) {
                        throw new Error(`${name} watch build failed: ${JSON.stringify(details?.errors)}`)
                    }

                    const spriteAsset = stats.compilation.getAssets()
                        .find(asset => /omnica-icons-imported\..+\.svg$/.test(asset.name))

                    assert.ok(spriteAsset, `${name} did not emit the imported sprite`)

                    const sprite = await fs.readFile(path.join(output, spriteAsset.name), 'utf8')

                    if (build === 0) {
                        assert.match(sprite, /id="filled\/actions\/clear-circle"/)
                        assert.doesNotMatch(sprite, /outlined\/actions\/add-circle/)
                        build += 1
                        await fs.writeFile(entry, entries[1])

                        return
                    }

                    assert.match(sprite, /id="outlined\/actions\/add-circle"/)
                    assert.doesNotMatch(sprite, /filled\/actions\/clear-circle/)
                    clearTimeout(timeout)
                    watcher.close(closeError => closeError ? reject(closeError) : resolve())
                } catch (buildError) {
                    clearTimeout(timeout)
                    watcher.close(() => reject(buildError))
                }
            })
        })
    } finally {
        await fs.rm(entry, { force: true })
        await fs.rm(output, { force: true, recursive: true })
    }
}

for (const fixture of cases) {
    await compileInWatchMode(fixture)
}

const compileViteInWatchMode = async () => {
    const [{ default: vue }, { build }, { omnicaIconComponents }] = await Promise.all([
        import('@vitejs/plugin-vue'),
        import('vite'),
        import('@omnicajs/icons/vite'),
    ])
    const fixtureDirectory = path.resolve('fixtures/vite')
    const entry = path.join(fixtureDirectory, '.watch-vite.js')
    const output = path.join(fixtureDirectory, 'dist-watch-vite')

    await fs.writeFile(entry, entries[0])

    const watcher = await build({
        configFile: false,
        plugins: [omnicaIconComponents(), vue()],
        root: fixtureDirectory,
        build: {
            emptyOutDir: true,
            outDir: output,
            rollupOptions: {
                input: entry,
                output: {
                    entryFileNames: 'main.js',
                },
            },
            watch: {},
        },
    })

    try {
        await new Promise((resolve, reject) => {
            let buildNumber = 0
            const timeout = setTimeout(() => reject(new Error('vite watch rebuild timed out')), 20_000)

            watcher.on('event', async event => {
                if (event.code === 'ERROR') {
                    clearTimeout(timeout)
                    reject(event.error)

                    return
                }

                if (event.code !== 'END') {
                    return
                }

                try {
                    const runtime = await fs.readFile(path.join(output, 'main.js'), 'utf8')
                    const spriteFilename = runtime.match(/assets\/omnica-icons-imported-[A-Za-z0-9_-]+\.svg/)?.[0]

                    assert.ok(spriteFilename, 'vite runtime does not reference the imported sprite')

                    const sprite = await fs.readFile(path.join(output, spriteFilename), 'utf8')

                    if (buildNumber === 0) {
                        assert.match(sprite, /id="filled\/actions\/clear-circle"/)
                        assert.doesNotMatch(sprite, /outlined\/actions\/add-circle/)
                        buildNumber += 1
                        await fs.writeFile(entry, entries[1])

                        return
                    }

                    assert.match(sprite, /id="outlined\/actions\/add-circle"/)
                    assert.doesNotMatch(sprite, /filled\/actions\/clear-circle/)
                    clearTimeout(timeout)
                    resolve()
                } catch (buildError) {
                    clearTimeout(timeout)
                    reject(buildError)
                }
            })
        })
    } finally {
        await watcher.close()
        await fs.rm(entry, { force: true })
        await fs.rm(output, { force: true, recursive: true })
    }
}

await compileViteInWatchMode()
