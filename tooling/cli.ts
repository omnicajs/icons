#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { buildIconSet, writeGeneratedFiles } from './build.js'
import type { IconBuildConfig } from './build.js'

type CliCommand = 'build' | 'watch'

interface CliOptions {
    readonly command: CliCommand
    readonly config: string
    readonly outputDirectory?: string
}

const usage = `Usage:
  omnica-icons build --config <file> [--out-dir <directory>]
  omnica-icons watch --config <file> [--out-dir <directory>]
`

const parseArguments = (arguments_: readonly string[]): CliOptions => {
    const [command, ...options] = arguments_
    let config: string | undefined
    let outputDirectory: string | undefined

    for (let index = 0; index < options.length; index += 1) {
        const option = options[index]

        if (option === '--config' || option === '--out-dir') {
            const value = options[index + 1]

            if (!value || value.startsWith('--')) {
                throw new Error(`${option} requires a value`)
            }

            if (option === '--config') {
                config = value
            } else {
                outputDirectory = value
            }

            index += 1
            continue
        }

        throw new Error(`Unknown option ${option}`)
    }

    if (command !== 'build' && command !== 'watch') {
        throw new Error(`Unknown command ${String(command)}`)
    }

    if (!config) {
        throw new Error('--config is required')
    }

    return {
        command,
        config,
        outputDirectory,
    }
}

const loadConfig = async (filename: string): Promise<IconBuildConfig> => {
    const url = pathToFileURL(filename)

    url.searchParams.set('updated', String(Date.now()))

    const configModule = await import(url.href) as { readonly default?: IconBuildConfig }
    const config = configModule.default

    if (!config) {
        throw new Error(`${filename} must have a default export`)
    }

    return config
}

const build = async (options: CliOptions): Promise<void> => {
    const configFilename = path.resolve(options.config)
    const config = await loadConfig(configFilename)
    const outputDirectory = path.resolve(
        options.outputDirectory ?? config.outputDirectory ?? 'src/generated/omnica-icons'
    )
    const artifacts = await buildIconSet(config)

    await writeGeneratedFiles(artifacts, outputDirectory)
    process.stdout.write(`Generated ${artifacts.length} icon variant(s) in ${outputDirectory}\n`)
}

const run = async (): Promise<void> => {
    const options = parseArguments(process.argv.slice(2))

    await build(options)

    if (options.command === 'watch') {
        let queued = false
        let running = false
        const rebuild = async (): Promise<void> => {
            if (running) {
                queued = true
                return
            }

            running = true

            try {
                await build(options)
            } catch (error) {
                console.error(error)
            } finally {
                running = false

                if (queued) {
                    queued = false
                    await rebuild()
                }
            }
        }

        fs.watch(path.resolve(options.config), rebuild)
        process.stdout.write(`Watching ${path.resolve(options.config)}\n`)
    }
}

run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.stderr.write(usage)
    process.exit(1)
})
