import fs from 'node:fs/promises'
import { collectCatalog } from '../../build/catalog.mjs'
import { generateManifest } from '../../build/manifest.mjs'
import { generatePackageModules, generatePublicTypecheck } from '../../build/package-modules.mjs'
import {
    distDirectory,
    distManifestFile,
    distSpritesDirectory,
    flagsDirectory,
    generatedDirectory,
    generatedTypecheckFile,
    iconKeywordsFile,
    iconsDirectory,
    logosDirectory,
    root,
} from '../../build/paths.mjs'
import { generateSprites } from '../../build/sprites.mjs'

const writeManifestModules = async manifest => {
    const source = JSON.stringify(manifest)

    await Promise.all([
        fs.writeFile(new URL('../../dist/manifest.js', import.meta.url), `export default ${source}\n`),
        fs.writeFile(new URL('../../dist/manifest.cjs', import.meta.url), `module.exports = ${source}\n`),
        fs.writeFile(new URL('../../dist/manifest.d.ts', import.meta.url), "declare const manifest: import('./build.js').IconManifest\nexport default manifest\n"),
    ])
}

const run = async () => {
    const packageJson = JSON.parse(await fs.readFile(new URL('../../package.json', import.meta.url), 'utf8'))
    const keywords = JSON.parse(await fs.readFile(iconKeywordsFile, 'utf8'))
    const catalog = await collectCatalog({
        iconsDirectory,
        colorGroups: [{
            name: 'flags',
            directory: flagsDirectory,
        }, {
            name: 'logos',
            directory: logosDirectory,
        }],
    })

    await fs.rm(distDirectory, { recursive: true, force: true })
    await fs.rm(generatedDirectory, { recursive: true, force: true })
    await fs.mkdir(distDirectory, { recursive: true })
    await fs.mkdir(generatedDirectory, { recursive: true })

    const sprites = await generateSprites(catalog, distSpritesDirectory)
    const manifest = generateManifest({
        root,
        sprites,
        keywords,
        version: packageJson.version,
    })

    await Promise.all([
        fs.writeFile(distManifestFile, `${JSON.stringify(manifest, null, 4)}\n`),
        writeManifestModules(manifest),
        generatePackageModules({ sprites, distDirectory }),
        fs.writeFile(generatedTypecheckFile, generatePublicTypecheck(sprites.variants)),
    ])
}

run().catch(error => {
    console.error(error)
    process.exit(1)
})
