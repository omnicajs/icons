import fs from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { optimize } from 'svgo'

const escapeXml = value => value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const optimizeSvg = (source, filename, preserveColors, prefix) => {
    const plugins = [{
        name: 'removeDimensions',
    }, {
        name: 'prefixIds',
        params: {
            delim: '__',
            prefix,
        },
    }]

    if (!preserveColors) {
        plugins.push({
            name: 'useCurrentColor',
            fn: () => ({
                element: {
                    enter: node => {
                        const excluded = new Set(['none', 'currentColor'])

                        if (node.attributes.fill && !excluded.has(node.attributes.fill)) {
                            node.attributes.fill = 'currentColor'
                        }

                        if (node.attributes.stroke && !excluded.has(node.attributes.stroke)) {
                            node.attributes.stroke = 'currentColor'
                        }
                    },
                },
            }),
        })
    }

    const result = optimize(source, {
        path: filename,
        plugins,
    })

    if ('error' in result) {
        throw new Error(`Unable to optimize ${filename}: ${result.error}`)
    }

    return result.data
}

const extractSvg = (source, filename) => {
    const match = source.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i)

    if (!match) {
        throw new Error(`Unable to find root svg element in ${filename}`)
    }

    const [, attributes, content] = match
    const viewBoxMatch = attributes.match(/\bviewBox=(["'])(.*?)\1/)

    if (!viewBoxMatch) {
        throw new Error(`Unable to find viewBox in ${filename}`)
    }

    return {
        viewBox: viewBoxMatch[2],
        content: content.trim(),
    }
}

const serializeSprite = symbols => [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    symbols.join('\n'),
    '</svg>',
    '',
].join('\n')

const writeSprite = async (filename, symbols) => {
    const source = serializeSprite(symbols)

    await fs.writeFile(filename, source)

    return {
        bytes: Buffer.byteLength(source),
        gzipBytes: gzipSync(source).byteLength,
    }
}

const buildGroup = async ({ group, namespace }) => {
    const icons = []

    for (const file of group.files) {
        const filename = path.join(group.directory, file)
        const iconName = path.basename(file, '.svg')
        const symbolId = `${group.name}/${iconName}`
        const prefix = `${namespace}-${group.name}-${iconName}`
        const optimized = optimizeSvg(
            await fs.readFile(filename, 'utf8'),
            filename,
            group.preserveColors,
            prefix
        )
        const svg = extractSvg(optimized, filename)
        const symbol = [
            `  <symbol id="${escapeXml(symbolId)}" viewBox="${escapeXml(svg.viewBox)}">`,
            svg.content,
            '  </symbol>',
        ].join('\n')

        icons.push({
            name: iconName,
            source: filename,
            symbol,
            symbolId,
            viewBox: svg.viewBox,
        })
    }

    return {
        ...group,
        icons,
    }
}

export const generateSprites = async (catalog, spritesDirectory) => {
    await fs.mkdir(spritesDirectory, { recursive: true })

    const variants = []

    for (const variant of catalog.variants) {
        const directory = path.join(spritesDirectory, variant.name)
        const groups = []

        await fs.mkdir(directory, { recursive: true })

        for (const group of variant.groups) {
            const builtGroup = await buildGroup({
                group,
                namespace: variant.name,
            })

            groups.push(builtGroup)
            builtGroup.spriteSize = await writeSprite(
                path.join(directory, `${group.name}.svg`),
                builtGroup.icons.map(icon => icon.symbol)
            )
        }

        const spriteSize = await writeSprite(
            path.join(spritesDirectory, `${variant.name}.svg`),
            groups.flatMap(group => group.icons.map(icon => icon.symbol))
        )

        variants.push({
            ...variant,
            groups,
            spriteSize,
        })
    }

    const colorGroups = []

    for (const group of catalog.colorGroups) {
        const builtGroup = await buildGroup({
            group,
            namespace: 'color',
        })

        colorGroups.push(builtGroup)
        builtGroup.spriteSize = await writeSprite(
            path.join(spritesDirectory, `${group.name}.svg`),
            builtGroup.icons.map(icon => icon.symbol)
        )
    }

    return {
        variants,
        colorGroups,
    }
}
