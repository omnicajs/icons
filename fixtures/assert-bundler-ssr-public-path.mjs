import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const cases = [
    {
        bundler: require('webpack'),
        clientConfig: require('./webpack/webpack.config.cjs'),
        directory: 'webpack',
        name: 'webpack',
        ssrConfig: require('./webpack/webpack.ssr.config.cjs'),
    },
    {
        bundler: require('@rspack/core').rspack,
        clientConfig: require('./rspack/rspack.config.cjs'),
        directory: 'rspack',
        name: 'rspack',
        ssrConfig: require('./rspack/rspack.ssr.config.cjs'),
    },
]

const compile = (bundler, config) => new Promise((resolve, reject) => {
    const compiler = bundler(config)

    compiler.run((error, stats) => {
        compiler.close(closeError => {
            if (error) {
                reject(error)

                return
            }

            if (stats?.hasErrors()) {
                reject(new Error(stats.toString({ all: false, errors: true })))

                return
            }

            if (closeError) {
                reject(closeError)

                return
            }

            resolve()
        })
    })
})

for (const { bundler, clientConfig, directory, name, ssrConfig } of cases) {
    for (const publicPath of ['auto', '', 'assets/', '//cdn.example.test/icons/', 'https://cdn.example.test/icons/']) {
        const outputDirectory = path.resolve('fixtures', directory, `dist-invalid-public-path-${name}`)

        try {
            await assert.rejects(() => compile(bundler, {
                ...clientConfig,
                output: {
                    ...clientConfig.output,
                    path: outputDirectory,
                    publicPath,
                },
            }), /Import-driven icon builds require output\.publicPath to be root-relative and end in "\/"/)
        } finally {
            await fs.rm(outputDirectory, { force: true, recursive: true })
        }
    }

    const outputDirectory = path.resolve('fixtures', directory, `dist-ssr-client-url-${name}`)

    try {
        await compile(bundler, {
            ...ssrConfig,
            output: {
                ...ssrConfig.output,
                path: outputDirectory,
                publicPath: '/',
            },
        })

        const { render } = require(path.join(outputDirectory, 'ssr.cjs'))
        const html = await render()

        assert.match(
            html,
            /href="\/icons\/assets\/omnica-icons-imported\.[a-f0-9]{8}\.svg#filled\/actions\/clear-circle"/
        )
    } finally {
        await fs.rm(outputDirectory, { force: true, recursive: true })
    }
}
