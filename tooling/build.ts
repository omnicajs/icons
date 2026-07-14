import fs from 'node:fs/promises'
import path from 'node:path'
import type { IconNameMap as FilledIconNameMap } from '@omnicajs/icons/filled'
import type { IconNameMap as OutlinedIconNameMap } from '@omnicajs/icons/outlined'

export type GroupSelection<Names extends string> = '*' | readonly Names[]
export type VariantSelection<Map> = {
    readonly [Group in keyof Map]?: GroupSelection<Extract<Map[Group], string>>
}

export interface IconBuildConfig {
    readonly outputDirectory?: string
    readonly include: {
        readonly filled?: VariantSelection<FilledIconNameMap>
        readonly outlined?: VariantSelection<OutlinedIconNameMap>
    }
}

export interface ManifestIcon {
    readonly source: string
    readonly symbol: string
    readonly viewBox: string
    readonly keywords: readonly string[]
}

export interface ManifestGroup {
    readonly sprite: string
    readonly size: {
        readonly bytes: number
        readonly gzipBytes: number
    }
    readonly icons: Readonly<Record<string, ManifestIcon>>
}

interface ManifestVariant {
    readonly sprite: string
    readonly size: {
        readonly bytes: number
        readonly gzipBytes: number
    }
    readonly groups: Readonly<Record<string, ManifestGroup>>
}

export interface IconManifest {
    readonly schemaVersion: 1
    readonly version: string
    readonly variants: Readonly<Record<string, ManifestVariant>>
    readonly collections: Readonly<Record<string, ManifestGroup>>
}

export interface ResolvedIcon extends ManifestIcon {
    readonly name: string
    readonly symbolSource?: string
}

export interface ResolvedGroup {
    readonly name: string
    readonly sprite: string
    readonly icons: readonly ResolvedIcon[]
}

export interface ResolvedVariant {
    readonly variant: string
    readonly groups: readonly ResolvedGroup[]
}

export interface IconBuildArtifact {
    readonly variant: string
    readonly iconNames: Readonly<Record<string, readonly string[]>>
    readonly moduleSource: string
    readonly spriteSource: string
}

type RuntimeSelection = Readonly<Record<string, Readonly<Record<string, '*' | readonly string[]>>>>

const manifestUrl = new URL(/* @vite-ignore */ './manifest.json', import.meta.url)

const hasOwn = <ObjectType extends object>(object: ObjectType, key: PropertyKey): key is keyof ObjectType => (
    Object.prototype.hasOwnProperty.call(object, key)
)

const assertObject: (
    value: unknown,
    label: string
) => asserts value is Record<string, unknown> = (value, label) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`${label} must be an object`)
    }
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const serializeSprite = (symbols: readonly string[]): string => [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    symbols.join('\n'),
    '</svg>',
    '',
].join('\n')

const selectionNames = (
    selection: '*' | readonly string[],
    group: ManifestGroup
): readonly string[] => selection === '*' ? Object.keys(group.icons) : selection

const runtimeModule = ({ variant, groups }: ResolvedVariant, spriteImport: string): string => {
    const iconNames = groups
        .map(group => `    ${JSON.stringify(group.name)}: [${group.icons.map(icon => JSON.stringify(icon.name)).join(', ')}],`)
        .join('\n')

    return `const hasOwn = (object: object, key: PropertyKey): key is keyof typeof object => Object.prototype.hasOwnProperty.call(object, key)

export const iconNames = {
${iconNames}
} as const

export type IconNameMap = {
    [Group in keyof typeof iconNames]: typeof iconNames[Group][number]
}
export type IconGroup = keyof IconNameMap
export type IconName<Group extends IconGroup = IconGroup> = IconNameMap[Group]

export const spriteUrl = new URL(${JSON.stringify(spriteImport)}, import.meta.url).href

export function iconUrl<Group extends IconGroup> (group: Group, name: IconName<Group>): string {
    if (!hasOwn(iconNames, group)) {
        throw new Error(\`Unknown ${variant} icon group \${String(group)}\`)
    }

    if (!(iconNames[group] as readonly string[]).includes(name)) {
        throw new Error(\`Unknown ${variant} \${String(group)} icon \${String(name)}\`)
    }

    return \`\${spriteUrl}#\${group}/\${name}\`
}
`
}

export const defineConfig = <const Config extends IconBuildConfig>(config: Config): Config => config

export const loadManifest = async (): Promise<IconManifest> => (
    JSON.parse(await fs.readFile(manifestUrl, 'utf8')) as IconManifest
)

export const validateSelection = <Config extends IconBuildConfig>(
    config: Config,
    manifest: IconManifest
): Config => {
    assertObject(config, 'Icon build config')
    assertObject(config.include, 'Icon build config include')

    const include = config.include as unknown as Record<string, unknown>
    const variants = Object.keys(include)

    if (variants.length === 0) {
        throw new Error('Icon build config must include at least one variant')
    }

    for (const variant of variants) {
        if (!hasOwn(manifest.variants, variant)) {
            throw new Error(`Unknown icon variant ${variant}`)
        }

        const variantSelection = include[variant]
        assertObject(variantSelection, `${variant} selection`)

        for (const [groupName, selectionValue] of Object.entries(variantSelection)) {
            if (!hasOwn(manifest.variants[variant].groups, groupName)) {
                throw new Error(`Unknown ${variant} icon group ${groupName}`)
            }

            if (selectionValue !== '*' && !Array.isArray(selectionValue)) {
                throw new TypeError(`${variant}/${groupName} selection must be an array or "*"`)
            }

            const selection = selectionValue as '*' | readonly unknown[]
            const group = manifest.variants[variant].groups[groupName]
            const names = selection === '*' ? Object.keys(group.icons) : selection
            const seen = new Set<string>()

            for (const name of names) {
                if (typeof name !== 'string' || !hasOwn(group.icons, name)) {
                    throw new Error(`Unknown ${variant} ${groupName} icon ${String(name)}`)
                }

                if (seen.has(name)) {
                    throw new Error(`Duplicate ${variant} ${groupName} icon ${name}`)
                }

                seen.add(name)
            }
        }
    }

    return config
}

export const resolveSelection = (
    config: IconBuildConfig,
    manifest: IconManifest
): ResolvedVariant[] => {
    validateSelection(config, manifest)

    const include = config.include as unknown as RuntimeSelection

    return Object.entries(manifest.variants)
        .filter(([variant]) => hasOwn(include, variant))
        .map(([variant, variantManifest]) => ({
            variant,
            groups: Object.entries(variantManifest.groups)
                .filter(([group]) => hasOwn(include[variant], group))
                .map(([group, groupManifest]) => {
                    const selected = new Set(selectionNames(include[variant][group], groupManifest))

                    return {
                        name: group,
                        sprite: groupManifest.sprite,
                        icons: Object.entries(groupManifest.icons)
                            .filter(([name]) => selected.has(name))
                            .map(([name, icon]) => ({ name, ...icon })),
                    }
                }),
        }))
}

const extractSymbol = (sprite: string, symbolId: string, filename: string): string => {
    const expression = new RegExp(`<symbol\\b[^>]*\\bid=(["'])${escapeRegExp(symbolId)}\\1[\\s\\S]*?<\\/symbol>`)
    const match = sprite.match(expression)

    if (!match) {
        throw new Error(`Unable to find symbol ${symbolId} in ${filename}`)
    }

    return match[0]
}

export const loadIconSymbols = async (
    resolvedVariants: readonly ResolvedVariant[]
): Promise<ResolvedVariant[]> => Promise.all(resolvedVariants.map(async variant => ({
    ...variant,
    groups: await Promise.all(variant.groups.map(async group => {
        const filename = new URL(group.sprite, manifestUrl)
        const sprite = await fs.readFile(filename, 'utf8')

        return {
            ...group,
            icons: group.icons.map(icon => ({
                ...icon,
                symbolSource: extractSymbol(sprite, icon.symbol, filename.href),
            })),
        }
    })),
})))

export const createSprite = (resolvedVariant: ResolvedVariant): string => serializeSprite(
    resolvedVariant.groups.flatMap(group => group.icons.map(icon => {
        if (icon.symbolSource === undefined) {
            throw new Error(`Missing symbol source for ${resolvedVariant.variant}/${icon.name}`)
        }

        return icon.symbolSource
    }))
)

export const createRuntimeModule = (
    resolvedVariant: ResolvedVariant,
    spriteImport = `./${resolvedVariant.variant}.svg`
): string => runtimeModule(resolvedVariant, spriteImport)

export const buildIconSet = async (config: IconBuildConfig): Promise<IconBuildArtifact[]> => {
    const manifest = await loadManifest()
    const resolved = resolveSelection(config, manifest)
    const loaded = await loadIconSymbols(resolved)

    return loaded.map(variant => ({
        variant: variant.variant,
        iconNames: Object.fromEntries(variant.groups.map(group => [
            group.name,
            group.icons.map(icon => icon.name),
        ])),
        moduleSource: createRuntimeModule(variant),
        spriteSource: createSprite(variant),
    }))
}

export const writeGeneratedFiles = async (
    artifacts: readonly IconBuildArtifact[],
    outputDirectory: string
): Promise<void> => {
    await fs.mkdir(outputDirectory, { recursive: true })

    await Promise.all(artifacts.flatMap(artifact => [
        fs.writeFile(path.join(outputDirectory, `${artifact.variant}.svg`), artifact.spriteSource),
        fs.writeFile(path.join(outputDirectory, `${artifact.variant}.ts`), artifact.moduleSource),
    ]))
}
