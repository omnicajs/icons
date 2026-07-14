import { join } from 'node:path'
import type { Compiler, WebpackPluginInstance } from 'webpack'
import type { IconBuildConfig } from './build.js'

export interface OmnicaIconsPluginOptions extends IconBuildConfig {
    /** Writes exact declarations for `virtual:omnicajs-icons`. The file must be included by consumer TypeScript. */
    readonly declarationFile?: string
    /** Supports `[variant]`, `[contenthash]`, and `[contenthash:N]`. */
    readonly filename?: string
}

const virtualModuleId = 'virtual:omnicajs-icons'

export class OmnicaIconsPlugin implements WebpackPluginInstance {
    readonly #options: OmnicaIconsPluginOptions

    public constructor (options: OmnicaIconsPluginOptions) {
        this.#options = options
    }

    public apply (compiler: Compiler): void {
        const runtimePath = join(__dirname, 'webpack-runtime.cjs')
        const loaderPath = join(__dirname, 'webpack-loader.cjs')

        new compiler.webpack.NormalModuleReplacementPlugin(
            new RegExp(`^${virtualModuleId}$`),
            runtimePath
        ).apply(compiler)
        compiler.options.module.rules.unshift({
            include: runtimePath,
            use: [{
                loader: loaderPath,
                options: {
                    config: this.#options,
                    declarationFile: this.#options.declarationFile,
                    filename: this.#options.filename ?? 'icons/omnica-[variant].[contenthash:8].svg',
                },
            }],
        })
    }
}
