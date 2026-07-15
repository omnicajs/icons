const path = require('node:path')

const { OmnicaIconsPlugin } = require('@omnicajs/icons/webpack')

class FixtureHtmlPlugin {
    apply (compiler) {
        compiler.hooks.thisCompilation.tap('FixtureHtmlPlugin', compilation => {
            compilation.hooks.processAssets.tap({
                name: 'FixtureHtmlPlugin',
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, () => {
                compilation.emitAsset('index.html', new compiler.webpack.sources.RawSource(`<!doctype html>
<html lang="en">
<head><meta charset="UTF-8"><title>Omnica icons Webpack fixture</title></head>
<body><div id="app"></div><script src="main.js"></script></body>
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
    },
    performance: false,
    plugins: [
        new OmnicaIconsPlugin({
            declarationFile: path.join(__dirname, 'src/omnica-icons.d.ts'),
            filename: 'assets/custom-[variant].[contenthash:8].svg',
            include: {
                filled: {
                    actions: ['add', 'remove'],
                },
                outlined: {
                    actions: ['add-circle'],
                },
            },
        }),
        new FixtureHtmlPlugin(),
    ],
}
