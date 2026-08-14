import type { Compiler, RspackPluginInstance } from '@rspack/core'
import type { Compiler as WebpackCompiler } from 'webpack'

import { BundlerIconComponentsPlugin } from './extracted/bundler/plugin.js'

export interface OmnicaIconComponentsPluginOptions {
    /** Supports `[contenthash]` and `[contenthash:N]`. */
    readonly filename?: string
    /** Overrides the loader used to compile the generated Vue SFC. */
    readonly vueLoader?: string
    /** Client build output read by a later SSR build. Defaults to `<context>/dist`. */
    readonly clientOutputDirectory?: string
    /** Overrides automatic Node-target SSR detection. */
    readonly ssr?: boolean
}

export class OmnicaIconComponentsPlugin implements RspackPluginInstance {
    readonly #plugin: BundlerIconComponentsPlugin

    public constructor (options: OmnicaIconComponentsPluginOptions = {}) {
        this.#plugin = new BundlerIconComponentsPlugin(options)
    }

    public apply (compiler: Compiler): void {
        this.#plugin.apply(compiler as unknown as WebpackCompiler)
    }
}
