import type { LoaderDefinitionFunction } from 'webpack'

const vueTemplateAssetImport = /(\bimport\s+_imports_\d+\s+from\s+)(["'])(@omnicajs\/icons\/assets\/icons\/(?:filled|outlined)\/[^"'?#]+\.svg)\2/g

const bundlerTemplateAssetsLoader: LoaderDefinitionFunction = function (source, sourceMap) {
    const transformed = source.replace(
        vueTemplateAssetImport,
        (_match, prefix: string, quote: string, request: string) => (
            `${prefix}${quote}${request}?url${quote}`
        )
    )

    this.callback(null, transformed, sourceMap)
}

export default bundlerTemplateAssetsLoader
