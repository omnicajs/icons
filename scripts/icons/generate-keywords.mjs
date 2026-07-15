import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const iconsDirectory = path.join(root, 'assets/icons')
const keywordFile = path.join(root, 'metadata/icon-keywords.json')
const keywordAliasFile = path.join(root, 'metadata/icon-keyword-aliases.json')
const groupMigrationFile = path.join(root, 'metadata/migrations/groups-v1.json')
const collectionDirectories = {
    flags: path.join(root, 'assets/flags'),
    logos: path.join(root, 'assets/logos'),
}

const listDirectories = async directory => (await fs.readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right))

const listIcons = async directory => (await fs.readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.svg'))
    .map(entry => path.basename(entry.name, '.svg'))
    .sort((left, right) => left.localeCompare(right))

const collectEmptyKeywords = async () => {
    const variants = {}

    for (const variant of await listDirectories(iconsDirectory)) {
        variants[variant] = {}

        for (const group of await listDirectories(path.join(iconsDirectory, variant))) {
            variants[variant][group] = Object.fromEntries((await listIcons(path.join(iconsDirectory, variant, group)))
                .map(name => [name, []]))
        }
    }

    const collections = {}

    for (const [collection, directory] of Object.entries(collectionDirectories)) {
        collections[collection] = Object.fromEntries((await listIcons(directory)).map(name => [name, []]))
    }

    return {
        schemaVersion: 1,
        variants,
        collections,
    }
}

const migrationTarget = entry => ({
    kind: 'variant',
    variant: entry.variant,
    group: entry.group,
    name: entry.name,
})

const collectionTarget = canonicalPath => {
    const [collection, ...nameParts] = canonicalPath.split('/')

    if (!(collection in collectionDirectories) || nameParts.length !== 1) {
        return null
    }

    return {
        kind: 'collection',
        collection,
        name: nameParts[0],
    }
}

const keywordList = (metadata, target) => {
    const keywords = target.kind === 'variant'
        ? metadata.variants[target.variant]?.[target.group]?.[target.name]
        : metadata.collections[target.collection]?.[target.name]

    if (!keywords) {
        const path = target.kind === 'variant'
            ? `${target.variant}/${target.group}/${target.name}`
            : `${target.collection}/${target.name}`

        throw new Error(`Keyword target does not exist: ${path}`)
    }

    return keywords
}

const canonicalPath = target => target.kind === 'variant'
    ? `${target.group}/${target.name}`
    : `${target.collection}/${target.name}`

const addKeyword = (metadata, target, keyword) => {
    const keywords = keywordList(metadata, target)

    if (keyword === canonicalPath(target)) {
        return
    }

    if (!keywords.includes(keyword)) {
        keywords.push(keyword)
        keywords.sort((left, right) => left.localeCompare(right))
    }
}

const generateKeywords = async () => {
    const metadata = await collectEmptyKeywords()
    const groupMigration = JSON.parse(await fs.readFile(groupMigrationFile, 'utf8'))
    const keywordAliasMetadata = JSON.parse(await fs.readFile(keywordAliasFile, 'utf8'))
    const targetByLegacyPath = new Map()

    if (
        keywordAliasMetadata.schemaVersion !== 1
        || !keywordAliasMetadata.aliases
        || typeof keywordAliasMetadata.aliases !== 'object'
        || Array.isArray(keywordAliasMetadata.aliases)
    ) {
        throw new Error('Invalid metadata/icon-keyword-aliases.json schema')
    }

    for (const entry of groupMigration) {
        const legacyPath = entry.source
            .replace(/^assets\/icons\//, '')
            .replace(/\.svg$/, '')
        const target = migrationTarget(entry)

        if (targetByLegacyPath.has(legacyPath)) {
            throw new Error(`Duplicate group migration source: ${legacyPath}`)
        }

        targetByLegacyPath.set(legacyPath, target)
        addKeyword(metadata, target, legacyPath)
    }

    for (const [keyword, icon] of Object.entries(keywordAliasMetadata.aliases)) {
        if (typeof icon !== 'string') {
            throw new Error(`Invalid icon keyword target: ${keyword}`)
        }

        const target = collectionTarget(icon) ?? targetByLegacyPath.get(icon)

        if (!target) {
            throw new Error(`Icon keyword target is not canonical: ${icon}`)
        }

        addKeyword(metadata, target, keyword)
    }

    return `${JSON.stringify(metadata, null, 4)}\n`
}

const source = await generateKeywords()

if (process.argv.includes('--check')) {
    const currentSource = await fs.readFile(keywordFile, 'utf8').catch(() => '')

    if (currentSource !== source) {
        throw new Error('metadata/icon-keywords.json is stale; run make local icons.keywords')
    }
} else {
    await fs.writeFile(keywordFile, source)
    console.log('Wrote metadata/icon-keywords.json')
}
