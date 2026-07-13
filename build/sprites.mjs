import fs from 'node:fs/promises'
import path from 'node:path'
import { optimize } from 'svgo'

const escapeXml = value => value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const optimizeSvg = (source, filename, preserveColors) => {
    const plugins = [{
        name: 'removeDimensions',
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

export const generateSprites = async (groups, spritesDirectory) => {
    await fs.mkdir(spritesDirectory, { recursive: true })

    for (const group of groups) {
        const symbols = []

        for (const file of group.files) {
            const filename = path.join(group.directory, file)
            const optimized = optimizeSvg(
                await fs.readFile(filename, 'utf8'),
                filename,
                group.preserveColors
            )
            const svg = extractSvg(optimized, filename)
            const iconName = path.basename(file, '.svg')

            symbols.push([
                `  <symbol id="${escapeXml(iconName)}" viewBox="${escapeXml(svg.viewBox)}">`,
                svg.content,
                '  </symbol>',
            ].join('\n'))
        }

        await fs.writeFile(
            path.join(spritesDirectory, `${group.name}.svg`),
            `<svg xmlns="http://www.w3.org/2000/svg">\n${symbols.join('\n')}\n</svg>\n`
        )
    }
}
