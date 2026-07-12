import fs from 'node:fs/promises'
import path from 'node:path'

const attributePattern = /([\w:-]+)\s*=\s*"([^"]*)"/g
const pathPattern = /<path\b([\s\S]*?)\/>/g
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

const normalizePaint = ({ name, value }) => ({
    name,
    value: ['fill', 'stroke'].includes(name) && !['none', 'currentColor'].includes(value)
        ? 'currentColor'
        : value,
})

const normalizePath = (source, filename) => {
    const attributes = parseAttributes(source, filename, 'path').map(normalizePaint)
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

const normalizeSvg = (source, filename) => {
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

    const paths = [...body.matchAll(pathPattern)]

    if (paths.length === 0 || body.replace(pathPattern, '').trim() !== '') {
        throw new Error(`Only direct self-closing path elements are supported in ${filename}`)
    }

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">`,
        ...paths.map(pathMatch => normalizePath(pathMatch[1], filename)),
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

const inputs = process.argv.slice(2)

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
    const normalized = normalizeSvg(source, filename)

    if (normalized !== source) {
        await fs.writeFile(filename, normalized)
        normalizedCount += 1
    }
}

console.log(`Normalized ${normalizedCount} of ${files.length} SVG files`)
