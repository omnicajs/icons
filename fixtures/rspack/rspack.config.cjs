const path = require('node:path')

const { VueLoaderPlugin } = require('vue-loader')

const { OmnicaIconComponentsPlugin } = require('@omnicajs/icons/rspack')

class FixtureHtmlPlugin {
    apply (compiler) {
        compiler.hooks.thisCompilation.tap('FixtureHtmlPlugin', compilation => {
            compilation.hooks.processAssets.tap({
                name: 'FixtureHtmlPlugin',
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, () => {
                compilation.emitAsset('index.html', new compiler.webpack.sources.RawSource(`<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><title>Omnica icons Rspack fixture</title></head>
<body><div id="app"></div><script src="/icons/main.js"></script></body>
</html>
`))
            })
        })
    }
}

module.exports = {
    mode: 'production',
    context: __dirname,
    entry: './src/main.js',
    output: {
        assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
        clean: true,
        filename: 'main.js',
        path: path.join(__dirname, 'dist'),
        publicPath: '/icons/',
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.svg$/,
                type: 'asset/resource',
            },
        ],
    },
    performance: false,
    plugins: [
        new OmnicaIconComponentsPlugin(),
        new VueLoaderPlugin(),
        new FixtureHtmlPlugin(),
    ],
}
