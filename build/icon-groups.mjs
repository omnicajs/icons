import fs from 'node:fs/promises'
import path from 'node:path'

const toPascalCase = value => value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

export const getIconGroups = async assetsDirectory => {
    const entries = await fs.readdir(assetsDirectory, { withFileTypes: true })
    const groups = []

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue
        }

        const directory = path.join(assetsDirectory, entry.name)
        const files = (await fs.readdir(directory, { withFileTypes: true }))
            .filter(file => file.isFile() && file.name.endsWith('.svg'))
            .map(file => file.name)
            .sort((a, b) => a.localeCompare(b))

        if (files.length === 0) {
            continue
        }

        groups.push({
            name: entry.name,
            typeName: `${toPascalCase(entry.name)}IconName`,
            directory,
            files,
            iconNames: files.map(file => path.basename(file, '.svg')),
        })
    }

    return groups.sort((a, b) => a.name.localeCompare(b.name))
}
