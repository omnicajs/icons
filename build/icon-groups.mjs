import fs from 'node:fs/promises'
import path from 'node:path'

const toPascalCase = value => value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const collectGroup = async ({ directory, name, preserveColors = false }) => {
    const files = (await fs.readdir(directory, { withFileTypes: true }))
        .filter(file => file.isFile() && file.name.endsWith('.svg'))
        .map(file => file.name)
        .sort((a, b) => a.localeCompare(b))

    if (files.length === 0) {
        return null
    }

    return {
        name,
        typeName: `${toPascalCase(name)}IconName`,
        directory,
        files,
        iconNames: files.map(file => path.basename(file, '.svg')),
        preserveColors,
    }
}

export const collectIconGroups = async (iconsDirectory, standaloneGroups = []) => {
    const entries = await fs.readdir(iconsDirectory, { withFileTypes: true })
    const groupDefinitions = entries
        .filter(entry => entry.isDirectory())
        .map(entry => ({
            name: entry.name,
            directory: path.join(iconsDirectory, entry.name),
        }))

    groupDefinitions.push(...standaloneGroups)

    const groups = (await Promise.all(groupDefinitions.map(collectGroup))).filter(Boolean)
    const groupNames = groups.map(group => group.name)

    if (new Set(groupNames).size !== groupNames.length) {
        throw new Error('Icon group names must be unique')
    }

    return groups.sort((a, b) => a.name.localeCompare(b.name))
}
