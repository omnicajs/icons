import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildIconSet, loadManifest } from '../dist/build.js'
import { iconUrl as allIconUrl } from '../dist/all.js'
import { iconUrl as groupIconUrl } from '../dist/filled/actions.js'

interface MigrationEntry {
    readonly destination: string
    readonly canonical: boolean
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (filename: string): Promise<string> => fs.readFile(path.join(root, filename), 'utf8')
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const extractSymbol = (sprite: string, symbolId: string): string => {
    const match = sprite.match(new RegExp(`<symbol\\b[^>]*\\bid=(["'])${escapeRegExp(symbolId)}\\1[\\s\\S]*?<\\/symbol>`))

    assert.ok(match, `Expected symbol ${symbolId}`)

    return match[0]
}

test('migration maps every legacy path to an existing canonical asset', async () => {
    const migration = JSON.parse(await read('metadata/migrations/groups-v1.json')) as MigrationEntry[]
    const canonicalDestinations = new Set(migration
        .filter(entry => entry.canonical)
        .map(entry => entry.destination))

    assert.equal(migration.length, 1235)
    assert.equal(canonicalDestinations.size, 1234)

    await Promise.all([...canonicalDestinations].map(async destination => {
        const stats = await fs.stat(path.join(root, destination))

        assert.ok(stats.isFile(), destination)
    }))
})

test('manifest, aggregate sprites, and group sprites describe the same symbols', async () => {
    const manifest = await loadManifest()

    assert.equal(manifest.schemaVersion, 1)

    for (const [variant, variantManifest] of Object.entries(manifest.variants)) {
        const aggregate = await read(`dist/${variantManifest.sprite}`)
        const ids = [...aggregate.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])

        assert.equal(new Set(ids).size, ids.length, `${variant} contains duplicate SVG IDs`)
        assert.doesNotMatch(
            aggregate,
            /\b(?:fill|stroke)="(?!none"|currentColor")[^"]+"/,
            `${variant} contains a fixed paint value`
        )

        for (const group of Object.values(variantManifest.groups)) {
            const groupSprite = await read(`dist/${group.sprite}`)

            for (const icon of Object.values(group.icons)) {
                assert.equal(
                    extractSymbol(aggregate, icon.symbol),
                    extractSymbol(groupSprite, icon.symbol),
                    `${variant}/${icon.symbol}`
                )
                assert.equal(extractSymbol(aggregate, icon.symbol).includes(`viewBox="${icon.viewBox}"`), true)
            }
        }
    }
})

test('manifest exposes generated search keywords for every icon', async () => {
    const manifest = await loadManifest()
    const keywordSets = [
        ...Object.values(manifest.variants)
            .flatMap(variant => Object.values(variant.groups))
            .flatMap(group => Object.values(group.icons).map(icon => icon.keywords)),
        ...Object.values(manifest.collections)
            .flatMap(group => Object.values(group.icons).map(icon => icon.keywords)),
    ]

    for (const keywords of keywordSets) {
        assert.ok(Array.isArray(keywords))
        assert.deepEqual(keywords, [...new Set(keywords)].sort((left, right) => left.localeCompare(right)))
    }

    assert.equal(keywordSets.length, 1535)
    assert.ok(manifest.variants.filled.groups.ai.icons['brain-circuit'].keywords.includes('ai/brain-ai'))
    assert.ok(manifest.variants.filled.groups.files.icons['folder-text'].keywords.includes('files/folder_labeled'))
    assert.ok(manifest.variants.outlined.groups.files.icons['folder-text'].keywords.includes('files/folder_labeled_outlined'))
    assert.ok(manifest.collections.logos.icons['facebook-messenger'].keywords.includes('logos/Property 1=Messenger'))
    assert.ok(manifest.collections.flags.icons.sicily.keywords.includes('flags/Property 1=bhutan'))
})

test('full and group helpers preserve symbol identity while changing delivery', () => {
    assert.match(allIconUrl('filled', 'actions', 'add'), /sprites\/filled\.svg#actions\/add$/)
    assert.match(groupIconUrl('add'), /sprites\/filled\/actions\.svg#actions\/add$/)
    assert.throws(
        // @ts-expect-error Runtime validation still covers untyped external input.
        () => allIconUrl('outlined', 'actions', 'add'),
        /Unknown outlined actions icon add/
    )
})

test('custom build core emits exact independent variant subsets', async () => {
    const artifacts = await buildIconSet({
        include: {
            filled: {
                actions: ['add'],
                alerts: ['warning'],
            },
            outlined: {
                actions: ['add-circle'],
            },
        },
    })

    assert.deepEqual(artifacts.map(artifact => artifact.variant), ['filled', 'outlined'])
    assert.equal((artifacts[0].spriteSource.match(/<symbol /g) ?? []).length, 2)
    assert.equal((artifacts[1].spriteSource.match(/<symbol /g) ?? []).length, 1)
    assert.match(artifacts[0].moduleSource, /#\$\{group\}\/\$\{name\}/)

    const invalidConfig = {
        include: {
            outlined: {
                actions: ['add'],
            },
        },
    } as unknown as Parameters<typeof buildIconSet>[0]

    await assert.rejects(
        () => buildIconSet(invalidConfig),
        /Unknown outlined actions icon add/
    )
})
