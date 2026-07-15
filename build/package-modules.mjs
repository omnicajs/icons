import fs from 'node:fs/promises'
import path from 'node:path'

const quote = value => JSON.stringify(value)
const stringifyList = values => values.map(quote).join(', ')
const esmSpriteUrl = relativePath => `new URL(${quote(relativePath)}, import.meta.url).href`
const cjsSpriteUrl = relativePath => `new URL(${quote(relativePath)}, pathToFileURL(__filename)).href`

const runtimePrelude = 'const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)\n'
const cjsPrelude = `const { pathToFileURL } = require('node:url')\n\n${runtimePrelude}`

const groupRuntime = ({ format, groupName, iconNames, spritePath }) => {
    const declaration = format === 'esm' ? 'export ' : ''
    const spriteExpression = format === 'esm' ? esmSpriteUrl(spritePath) : cjsSpriteUrl(spritePath)
    const exports = format === 'esm'
        ? ''
        : '\nmodule.exports = { iconNames, iconUrl, spriteUrl }\n'

    return `${format === 'esm' ? runtimePrelude : cjsPrelude}
${declaration}const iconNames = Object.freeze([${stringifyList(iconNames)}])
${declaration}const spriteUrl = ${spriteExpression}

${declaration}function iconUrl (name) {
    if (!iconNames.includes(name)) {
        throw new Error(\`Unknown ${groupName} icon \${String(name)}\`)
    }

    return \`\${spriteUrl}#${groupName}/\${name}\`
}
${exports}`
}

const groupDeclarations = iconNames => `${[
    `export declare const iconNames: readonly [${stringifyList(iconNames)}]`,
    'export type IconName = typeof iconNames[number]',
    'export declare const spriteUrl: string',
    'export declare function iconUrl (name: IconName): string',
    '',
].join('\n')}`

const variantRuntime = ({ format, variant, spritePath }) => {
    const declaration = format === 'esm' ? 'export ' : ''
    const spriteExpression = format === 'esm' ? esmSpriteUrl(spritePath) : cjsSpriteUrl(spritePath)
    const iconNames = variant.groups
        .map(group => `    ${quote(group.name)}: Object.freeze([${stringifyList(group.iconNames)}]),`)
        .join('\n')
    const exports = format === 'esm'
        ? ''
        : '\nmodule.exports = { iconNames, iconUrl, spriteUrl }\n'

    return `${format === 'esm' ? runtimePrelude : cjsPrelude}
${declaration}const iconNames = Object.freeze({
${iconNames}
})
${declaration}const spriteUrl = ${spriteExpression}

${declaration}function iconUrl (group, name) {
    if (!hasOwn(iconNames, group)) {
        throw new Error(\`Unknown ${variant.name} icon group \${String(group)}\`)
    }

    if (!iconNames[group].includes(name)) {
        throw new Error(\`Unknown ${variant.name} \${String(group)} icon \${String(name)}\`)
    }

    return \`\${spriteUrl}#\${group}/\${name}\`
}
${exports}`
}

const variantDeclarations = variant => {
    const iconNames = variant.groups
        .map(group => `    readonly ${quote(group.name)}: readonly [${stringifyList(group.iconNames)}]`)
        .join('\n')
    const map = variant.groups
        .map(group => `    ${quote(group.name)}: typeof iconNames[${quote(group.name)}][number]`)
        .join('\n')

    return `${[
        'export declare const iconNames: {',
        iconNames,
        '}',
        'export interface IconNameMap {',
        map,
        '}',
        'export type IconGroup = keyof IconNameMap',
        'export type IconName<Group extends IconGroup = IconGroup> = IconNameMap[Group]',
        'export declare const spriteUrl: string',
        'export declare function iconUrl<Group extends IconGroup> (group: Group, name: IconName<Group>): string',
        '',
    ].join('\n')}`
}

const facadeDeclarations = variants => {
    const imports = variants.map(variant => [
        `import type { IconGroup as ${variant.name[0].toUpperCase()}${variant.name.slice(1)}IconGroup, IconName as ${variant.name[0].toUpperCase()}${variant.name.slice(1)}IconName } from './${variant.name}/index.js'`,
    ]).join('\n')
    const variantNames = variants.map(variant => quote(variant.name)).join(' | ')
    const iconNames = variants
        .map(variant => `    readonly ${variant.name}: typeof import('./${variant.name}/index.js').iconNames`)
        .join('\n')
    const spriteUrls = variants
        .map(variant => `    readonly ${variant.name}: string`)
        .join('\n')
    const overloads = variants.map(variant => {
        const typePrefix = `${variant.name[0].toUpperCase()}${variant.name.slice(1)}`

        return `export declare function iconUrl<Group extends ${typePrefix}IconGroup> (variant: ${quote(variant.name)}, group: Group, name: ${typePrefix}IconName<Group>): string`
    }).join('\n')

    return `${[
        imports,
        `export type IconVariant = ${variantNames}`,
        'export declare const iconNames: {',
        iconNames,
        '}',
        'export declare const spriteUrls: {',
        spriteUrls,
        '}',
        'export declare function spriteUrl (variant: IconVariant): string',
        overloads,
        '',
    ].join('\n')}`
}

const facadeRuntime = ({ format, variants, grouped }) => {
    const extension = format === 'esm' ? 'js' : 'cjs'
    const declaration = format === 'esm' ? 'export ' : ''
    const imports = []
    const collections = []

    for (const variant of variants) {
        if (grouped) {
            for (const group of variant.groups) {
                const variable = `${variant.name}_${group.name}`
                imports.push(format === 'esm'
                    ? `import * as ${variable} from './${variant.name}/${group.name}.${extension}'`
                    : `const ${variable} = require('./${variant.name}/${group.name}.${extension}')`)
            }

            collections.push(`    ${variant.name}: Object.freeze({\n${variant.groups
                .map(group => `        ${quote(group.name)}: ${variant.name}_${group.name},`)
                .join('\n')}\n    }),`)
        } else {
            imports.push(format === 'esm'
                ? `import * as ${variant.name} from './${variant.name}/index.${extension}'`
                : `const ${variant.name} = require('./${variant.name}/index.${extension}')`)
            collections.push(`    ${variant.name},`)
        }
    }

    const iconNamesValue = grouped
        ? variants.map(variant => `    ${variant.name}: Object.freeze(Object.fromEntries(Object.entries(collections.${variant.name}).map(([group, collection]) => [group, collection.iconNames]))),`).join('\n')
        : variants.map(variant => `    ${variant.name}: ${variant.name}.iconNames,`).join('\n')
    const spriteUrlsValue = grouped
        ? variants.map(variant => `    ${variant.name}: Object.freeze(Object.fromEntries(Object.entries(collections.${variant.name}).map(([group, collection]) => [group, collection.spriteUrl]))),`).join('\n')
        : variants.map(variant => `    ${variant.name}: ${variant.name}.spriteUrl,`).join('\n')
    const spriteParameters = grouped ? 'variant, group' : 'variant'
    const spriteReturn = grouped
        ? 'const collection = getCollection(variant, group)\n\n    return collection.spriteUrl'
        : 'return getCollection(variant).spriteUrl'
    const iconCollection = grouped
        ? 'getCollection(variant, group)'
        : 'getCollection(variant)'
    const iconCall = grouped ? 'collection.iconUrl(name)' : 'collection.iconUrl(group, name)'
    const getCollectionBody = grouped
        ? `
    if (!hasOwn(collections[variant], group)) {
        throw new Error(\`Unknown \${variant} icon group \${String(group)}\`)
    }

    return collections[variant][group]`
        : '\n    return collections[variant]'
    const exports = format === 'esm'
        ? ''
        : '\nmodule.exports = { iconNames, iconUrl, spriteUrl, spriteUrls }\n'

    return `${imports.join('\n')}

${runtimePrelude}
const collections = Object.freeze({
${collections.join('\n')}
})

const getCollection = (variant, group) => {
    if (!hasOwn(collections, variant)) {
        throw new Error(\`Unknown icon variant \${String(variant)}\`)
    }
${getCollectionBody}
}

${declaration}const iconNames = Object.freeze({
${iconNamesValue}
})
${declaration}const spriteUrls = Object.freeze({
${spriteUrlsValue}
})

${declaration}function spriteUrl (${spriteParameters}) {
    ${spriteReturn}
}

${declaration}function iconUrl (variant, group, name) {
    const collection = ${iconCollection}

    return ${iconCall}
}
${exports}`
}

const groupedFacadeDeclarations = variants => {
    const base = facadeDeclarations(variants)
        .replace('export declare function spriteUrl (variant: IconVariant): string', variants
            .map(variant => {
                const typePrefix = `${variant.name[0].toUpperCase()}${variant.name.slice(1)}`

                return `export declare function spriteUrl<Group extends ${typePrefix}IconGroup> (variant: ${quote(variant.name)}, group: Group): string`
            })
            .join('\n'))
        .replace(/ {4}readonly (filled|outlined): string/g, (match, variant) => `    readonly ${variant}: { readonly [Group in ${variant[0].toUpperCase()}${variant.slice(1)}IconGroup]: string }`)

    return base
}

const collectionModule = ({ format, group }) => groupRuntime({
    format,
    groupName: group.name,
    iconNames: group.iconNames,
    spritePath: `./sprites/${group.name}.svg`,
})

const writeModule = async (directory, basename, esm, cjs, declarations) => {
    await Promise.all([
        fs.writeFile(path.join(directory, `${basename}.js`), esm),
        fs.writeFile(path.join(directory, `${basename}.cjs`), cjs),
        fs.writeFile(path.join(directory, `${basename}.d.ts`), declarations),
    ])
}

export const generatePackageModules = async ({ sprites, distDirectory }) => {
    for (const variant of sprites.variants) {
        const directory = path.join(distDirectory, variant.name)

        await fs.mkdir(directory, { recursive: true })
        await writeModule(
            directory,
            'index',
            variantRuntime({ format: 'esm', variant, spritePath: `../sprites/${variant.name}.svg` }),
            variantRuntime({ format: 'cjs', variant, spritePath: `../sprites/${variant.name}.svg` }),
            variantDeclarations(variant)
        )

        for (const group of variant.groups) {
            await writeModule(
                directory,
                group.name,
                groupRuntime({
                    format: 'esm',
                    groupName: group.name,
                    iconNames: group.iconNames,
                    spritePath: `../sprites/${variant.name}/${group.name}.svg`,
                }),
                groupRuntime({
                    format: 'cjs',
                    groupName: group.name,
                    iconNames: group.iconNames,
                    spritePath: `../sprites/${variant.name}/${group.name}.svg`,
                }),
                groupDeclarations(group.iconNames)
            )
        }
    }

    for (const group of sprites.colorGroups) {
        await writeModule(
            distDirectory,
            group.name,
            collectionModule({ format: 'esm', group }),
            collectionModule({ format: 'cjs', group }),
            groupDeclarations(group.iconNames)
        )
    }

    const facadeDts = facadeDeclarations(sprites.variants)
    const allEsm = facadeRuntime({ format: 'esm', variants: sprites.variants, grouped: false })
    const allCjs = facadeRuntime({ format: 'cjs', variants: sprites.variants, grouped: false })

    await writeModule(distDirectory, 'all', allEsm, allCjs, facadeDts)
    await writeModule(
        distDirectory,
        'groups',
        facadeRuntime({ format: 'esm', variants: sprites.variants, grouped: true }),
        facadeRuntime({ format: 'cjs', variants: sprites.variants, grouped: true }),
        groupedFacadeDeclarations(sprites.variants)
    )
    await Promise.all([
        fs.writeFile(path.join(distDirectory, 'index.js'), 'export * from \'./all.js\'\n'),
        fs.writeFile(path.join(distDirectory, 'index.cjs'), 'module.exports = require(\'./all.cjs\')\n'),
        fs.writeFile(path.join(distDirectory, 'index.d.ts'), 'export * from \'./all.js\'\n'),
    ])
}

export const generatePublicTypecheck = variants => {
    const filled = variants.find(variant => variant.name === 'filled')
    const outlined = variants.find(variant => variant.name === 'outlined')
    const outlinedGroups = new Map(outlined.groups.map(group => [group.name, new Set(group.iconNames)]))
    const exampleGroup = filled.groups.find(group => {
        const outlinedNames = outlinedGroups.get(group.name)

        return outlinedNames?.size > 0 && group.iconNames.some(name => !outlinedNames.has(name))
    })
    const outlinedNames = outlined.groups.find(group => group.name === exampleGroup.name).iconNames
    const filledOnlyName = exampleGroup.iconNames.find(name => !outlinedGroups.get(exampleGroup.name).has(name))

    return `${[
        'import { iconUrl, spriteUrl } from \'../dist/all.js\'',
        'import { defineConfig } from \'../dist/build.js\'',
        `import { iconUrl as filledGroupIconUrl } from '../dist/filled/${exampleGroup.name}.js'`,
        '',
        `iconUrl('filled', ${quote(exampleGroup.name)}, ${quote(filledOnlyName)})`,
        `iconUrl('outlined', ${quote(exampleGroup.name)}, ${quote(outlinedNames[0])})`,
        'spriteUrl(\'filled\')',
        `filledGroupIconUrl(${quote(filledOnlyName)})`,
        `defineConfig({ include: { filled: { ${exampleGroup.name}: [${quote(filledOnlyName)}] }, outlined: { ${exampleGroup.name}: [${quote(outlinedNames[0])}] } } })`,
        '',
        '// @ts-expect-error Outlined names are an exact subset, without a filled fallback.',
        `iconUrl('outlined', ${quote(exampleGroup.name)}, ${quote(filledOnlyName)})`,
        '// @ts-expect-error Build config uses the exact outlined catalog too.',
        `defineConfig({ include: { outlined: { ${exampleGroup.name}: [${quote(filledOnlyName)}] } } })`,
        '// @ts-expect-error Group entrypoints only accept names from their own group.',
        'filledGroupIconUrl(\'__missing__\')',
        '',
    ].join('\n')}`
}
