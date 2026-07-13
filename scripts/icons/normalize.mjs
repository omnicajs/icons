import fs from 'node:fs/promises'
import path from 'node:path'
import { optimize } from 'svgo'

const attributePattern = /([\w:-]+)\s*=\s*"([^"]*)"/g
const pathPattern = /<path\b([\s\S]*?)\/>/g
const clippedGroupPattern = /^\s*<g\b([^>]*)>([\s\S]*?)<\/g>\s*<defs>\s*<clipPath\b([^>]*)>([\s\S]*?)<\/clipPath>\s*<\/defs>\s*$/
const rectPattern = /^\s*<rect\b([\s\S]*?)\/>\s*$/
const attributeOrder = ['d', 'fill', 'fill-rule', 'clip-rule']

const parseAttributes = (source, filename, element) => {
    const attributes = []

    for (const match of source.matchAll(attributePattern)) {
        attributes.push({
            name: match[1],
            value: match[2],
        })
    }

    if (source.replace(attributePattern, '').trim() !== '') {
        throw new Error(`Unable to parse ${element} attributes in ${filename}`)
    }

    return attributes
}

const normalizePaint = ({ name, value }, preserveColors) => ({
    name,
    value: !preserveColors
        && ['fill', 'stroke'].includes(name)
        && !['none', 'currentColor'].includes(value)
        ? 'currentColor'
        : value,
})

const normalizePath = (source, filename, preserveColors) => {
    const attributes = parseAttributes(source, filename, 'path')
        .map(attribute => normalizePaint(attribute, preserveColors))
    const byName = new Map(attributes.map(attribute => [attribute.name, attribute]))

    if (!byName.has('d')) {
        throw new Error(`Path has no d attribute in ${filename}`)
    }

    const ordered = [
        ...attributeOrder.map(name => byName.get(name)).filter(Boolean),
        ...attributes.filter(attribute => !attributeOrder.includes(attribute.name)),
    ]

    return `    <path ${ordered.map(({ name, value }) => `${name}="${value}"`).join(' ')} />`
}

const normalizeStructuredSvg = (source, filename, preserveColors) => {
    const plugins = [
        {
            name: 'removeDimensions',
        },
        {
            name: 'removeXlink',
        },
        {
            name: 'normalizeRoot',
            fn: () => ({
                element: {
                    enter: (node, parent) => {
                        if (
                            node.name === 'svg'
                            && parent.type === 'root'
                            && node.attributes.fill === 'none'
                        ) {
                            delete node.attributes.fill
                        }
                    },
                },
            }),
        },
    ]

    if (!preserveColors) {
        plugins.push({
            name: 'useCurrentColor',
            fn: () => ({
                element: {
                    enter: node => {
                        for (const attribute of ['fill', 'stroke']) {
                            const value = node.attributes[attribute]

                            if (value && !['none', 'currentColor'].includes(value)) {
                                node.attributes[attribute] = 'currentColor'
                            }
                        }
                    },
                },
            }),
        })
    }

    plugins.push({
        name: 'sortAttrs',
    })

    const result = optimize(source, {
        path: filename,
        plugins,
        js2svg: {
            pretty: true,
            indent: 4,
        },
    })

    if ('error' in result) {
        throw new Error(`Unable to normalize ${filename}: ${result.error}`)
    }

    return `${result.data.trimEnd()}\n`
}

const parseViewBox = (viewBox, filename) => {
    const values = viewBox.trim().split(/[\s,]+/).map(Number)

    if (values.length !== 4 || values.some(value => !Number.isFinite(value))) {
        throw new Error(`Unable to parse viewBox in ${filename}`)
    }

    return values
}

const unwrapViewportClip = (body, viewBox, filename) => {
    const match = body.match(clippedGroupPattern)

    if (!match) {
        return body
    }

    const [, groupSource, groupBody, clipPathSource, clipPathBody] = match
    const groupAttributes = new Map(parseAttributes(groupSource, filename, 'g').map(attribute => [
        attribute.name,
        attribute.value,
    ]))
    const clipPathAttributes = new Map(parseAttributes(clipPathSource, filename, 'clipPath').map(attribute => [
        attribute.name,
        attribute.value,
    ]))
    const clipReference = groupAttributes.get('clip-path')?.match(/^url\(#([^)]+)\)$/)?.[1]
    const clipId = clipPathAttributes.get('id')
    const rectMatch = clipPathBody.match(rectPattern)

    if (
        groupAttributes.size !== 1
        || clipPathAttributes.size !== 1
        || !clipReference
        || clipReference !== clipId
        || !rectMatch
    ) {
        return body
    }

    const rectAttributes = new Map(parseAttributes(rectMatch[1], filename, 'rect').map(attribute => [
        attribute.name,
        attribute.value,
    ]))
    const supportedRectAttributes = new Set(['x', 'y', 'width', 'height', 'fill'])

    if ([...rectAttributes.keys()].some(name => !supportedRectAttributes.has(name))) {
        return body
    }

    const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = parseViewBox(viewBox, filename)
    const rectX = Number(rectAttributes.get('x') ?? 0)
    const rectY = Number(rectAttributes.get('y') ?? 0)
    const rectWidth = Number(rectAttributes.get('width'))
    const rectHeight = Number(rectAttributes.get('height'))

    if (
        ![rectX, rectY, rectWidth, rectHeight].every(value => Number.isFinite(value))
        || rectX !== viewBoxX
        || rectY !== viewBoxY
        || rectWidth !== viewBoxWidth
        || rectHeight !== viewBoxHeight
    ) {
        return body
    }

    return groupBody
}

const normalizeSvg = (source, filename, preserveColors) => {
    const match = source.trim().match(/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/)

    if (!match) {
        throw new Error(`Unable to parse root svg element in ${filename}`)
    }

    const [, rootSource, body] = match
    const rootAttributes = new Map(parseAttributes(rootSource, filename, 'svg').map(attribute => [
        attribute.name,
        attribute.value,
    ]))
    const viewBox = rootAttributes.get('viewBox')

    if (!viewBox) {
        throw new Error(`Root svg has no viewBox in ${filename}`)
    }

    const unwrappedBody = unwrapViewportClip(body, viewBox, filename)
    const paths = [...unwrappedBody.matchAll(pathPattern)]

    if (paths.length === 0 || unwrappedBody.replace(pathPattern, '').trim() !== '') {
        return normalizeStructuredSvg(source, filename, preserveColors)
    }

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`,
        ...paths.map(pathMatch => normalizePath(pathMatch[1], filename, preserveColors)),
        '</svg>',
        '',
    ].join('\n')
}

const collectSvgFiles = async input => {
    const stats = await fs.stat(input)

    if (stats.isFile()) {
        return input.endsWith('.svg') ? [input] : []
    }

    if (!stats.isDirectory()) {
        return []
    }

    const entries = await fs.readdir(input, { withFileTypes: true })
    const files = await Promise.all(entries
        .sort((left, right) => left.name.localeCompare(right.name))
        .map(entry => collectSvgFiles(path.join(input, entry.name))))

    return files.flat()
}

const argumentsList = process.argv.slice(2)
const supportedOptions = new Set(['--preserve-colors'])
const options = argumentsList.filter(argument => argument.startsWith('--'))
const unknownOptions = options.filter(option => !supportedOptions.has(option))

if (unknownOptions.length > 0) {
    throw new Error(`Unknown options: ${unknownOptions.join(', ')}`)
}

const preserveColors = options.includes('--preserve-colors')
const inputs = argumentsList.filter(argument => !argument.startsWith('--'))

if (inputs.length === 0) {
    throw new Error('Pass one or more SVG files or directories to normalize')
}

const files = [...new Set((await Promise.all(inputs.map(collectSvgFiles))).flat())].sort()

if (files.length === 0) {
    throw new Error('No SVG files found in the provided paths')
}

let normalizedCount = 0

for (const filename of files) {
    const source = await fs.readFile(filename, 'utf8')
    const normalized = normalizeSvg(source, filename, preserveColors)

    if (normalized !== source) {
        await fs.writeFile(filename, normalized)
        normalizedCount += 1
    }
}

console.log(`Normalized ${normalizedCount} of ${files.length} SVG files`)
