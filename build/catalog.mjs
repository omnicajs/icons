import fs from 'node:fs/promises'
import path from 'node:path'

const groupPattern = /^[a-z][a-z0-9]*$/
const iconPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const collectGroup = async ({ directory, name, preserveColors = false }) => {
    if (!groupPattern.test(name)) {
        throw new Error(`Icon group names must be single lowercase words: ${name}`)
    }

    const files = (await fs.readdir(directory, { withFileTypes: true }))
        .filter(file => file.isFile() && file.name.endsWith('.svg'))
        .map(file => file.name)
        .sort((left, right) => left.localeCompare(right))

    if (files.length === 0) {
        throw new Error(`Icon group ${name} must not be empty`)
    }

    const iconNames = files.map(file => path.basename(file, '.svg'))

    for (const iconName of iconNames) {
        if (!iconPattern.test(iconName)) {
            throw new Error(`Invalid icon name ${name}/${iconName}`)
        }
    }

    return {
        name,
        directory,
        files,
        iconNames,
        preserveColors,
    }
}

const collectGroups = async (directory, preserveColors = false) => {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    const groupEntries = entries
        .filter(entry => entry.isDirectory())
        .sort((left, right) => left.name.localeCompare(right.name))

    return Promise.all(groupEntries.map(entry => collectGroup({
        name: entry.name,
        directory: path.join(directory, entry.name),
        preserveColors,
    })))
}

export const collectCatalog = async ({
    iconsDirectory,
    colorGroups,
    variants = ['filled', 'outlined'],
}) => {
    const collectedVariants = []

    for (const variant of variants) {
        const directory = path.join(iconsDirectory, variant)
        const groups = await collectGroups(directory)

        collectedVariants.push({
            name: variant,
            directory,
            groups,
        })
    }

    const collectedColorGroups = []

    for (const definition of colorGroups) {
        collectedColorGroups.push(await collectGroup({
            ...definition,
            preserveColors: true,
        }))
    }

    return {
        variants: collectedVariants,
        colorGroups: collectedColorGroups.sort((left, right) => left.name.localeCompare(right.name)),
    }
}
