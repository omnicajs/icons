import fs from 'node:fs/promises'
import path from 'node:path'
import { build as viteBuild } from 'vite'
import { generateVirtualDeclarations, generatePackageDeclarations } from '../../build/declarations.mjs'
import { collectIconGroups } from '../../build/icon-groups.mjs'
import {
    distDirectory,
    flagsDirectory,
    generatedBuildDirectory,
    generatedDirectory,
    generatedManifestFile,
    generatedSpritesDirectory,
    generatedVirtualTypesFile,
    iconsDirectory,
    logosDirectory,
} from '../../build/paths.mjs'
import { generateSprites } from '../../build/sprites.mjs'

const run = async () => {
    const groups = await collectIconGroups(iconsDirectory, [{
        name: 'flags',
        directory: flagsDirectory,
        preserveColors: true,
    }, {
        name: 'logos',
        directory: logosDirectory,
        preserveColors: true,
    }])

    if (groups.length === 0) {
        throw new Error(
            `No icon groups found in ${iconsDirectory}, ${flagsDirectory}, or ${logosDirectory}`
        )
    }

    await fs.rm(distDirectory, { recursive: true, force: true })
    await fs.rm(generatedDirectory, { recursive: true, force: true })
    await fs.mkdir(distDirectory, { recursive: true })
    await fs.mkdir(generatedBuildDirectory, { recursive: true })

    await generateSprites(groups, generatedSpritesDirectory)
    await fs.writeFile(generatedManifestFile, JSON.stringify(
        groups.map(group => ({
            name: group.name,
            iconNames: group.iconNames,
        })),
        null,
        4
    ))
    await fs.writeFile(generatedVirtualTypesFile, generateVirtualDeclarations(groups))

    process.env.OMNICAJS_ICON_FORMAT = 'es'
    await viteBuild()

    process.env.OMNICAJS_ICON_FORMAT = 'cjs'
    await viteBuild()

    delete process.env.OMNICAJS_ICON_FORMAT

    await fs.writeFile(path.join(distDirectory, 'index.d.ts'), generatePackageDeclarations(groups))
    await fs.rm(generatedBuildDirectory, { recursive: true, force: true })
}

run().catch(error => {
    console.error(error)
    process.exit(1)
})
