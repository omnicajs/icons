const path = require('node:path')

const config = require('./rspack.config.cjs')

module.exports = {
    ...config,
    entry: './src/ssr.js',
    target: 'node',
    output: {
        ...config.output,
        clean: true,
        filename: 'ssr.cjs',
        library: {
            type: 'commonjs2',
        },
        path: path.join(__dirname, 'dist-ssr'),
    },
}
