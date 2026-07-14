import type { IconBuildArtifact } from './build.js'

type ModuleFormat = 'esm' | 'cjs'

export const createAdapterRuntime = (
    artifacts: readonly IconBuildArtifact[],
    spriteExpressions: Readonly<Record<string, string>>,
    format: ModuleFormat = 'esm'
): string => {
    const declaration = format === 'esm' ? 'export ' : ''
    const iconNames = artifacts
        .map(artifact => `    ${JSON.stringify(artifact.variant)}: ${JSON.stringify(artifact.iconNames)},`)
        .join('\n')
    const spriteUrls = artifacts
        .map(artifact => `    ${JSON.stringify(artifact.variant)}: ${spriteExpressions[artifact.variant]},`)
        .join('\n')
    const exports = format === 'esm'
        ? ''
        : '\nmodule.exports = { iconNames, iconUrl, spriteUrl, spriteUrls }\n'

    return `const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

${declaration}const iconNames = Object.freeze({
${iconNames}
})
${declaration}const spriteUrls = Object.freeze({
${spriteUrls}
})

${declaration}function spriteUrl (variant) {
    if (!hasOwn(spriteUrls, variant)) {
        throw new Error(\`Unknown icon variant \${String(variant)}\`)
    }

    return spriteUrls[variant]
}

${declaration}function iconUrl (variant, group, name) {
    if (!hasOwn(iconNames, variant)) {
        throw new Error(\`Unknown icon variant \${String(variant)}\`)
    }

    if (!hasOwn(iconNames[variant], group)) {
        throw new Error(\`Unknown \${variant} icon group \${String(group)}\`)
    }

    if (!iconNames[variant][group].includes(name)) {
        throw new Error(\`Unknown \${variant} \${String(group)} icon \${String(name)}\`)
    }

    return \`\${spriteUrl(variant)}#\${group}/\${name}\`
}
${exports}`
}

export const createAdapterDeclarations = (
    artifacts: readonly IconBuildArtifact[],
    moduleId = 'virtual:omnicajs-icons'
): string => {
    const variantNames = artifacts.map(artifact => JSON.stringify(artifact.variant)).join(' | ')
    const iconNames = artifacts.map(artifact => {
        const groups = Object.entries(artifact.iconNames)
            .map(([group, names]) => `            readonly ${JSON.stringify(group)}: readonly [${names.map(name => JSON.stringify(name)).join(', ')}]`)
            .join('\n')

        return `        readonly ${JSON.stringify(artifact.variant)}: {\n${groups}\n        }`
    }).join('\n')

    return `declare module '${moduleId}' {
    export const iconNames: {
${iconNames}
    }
    export type IconVariant = ${variantNames}
    export type IconGroup<Variant extends IconVariant> = keyof typeof iconNames[Variant]
    export type IconName<Variant extends IconVariant, Group extends IconGroup<Variant>> = typeof iconNames[Variant][Group] extends readonly (infer Name)[] ? Name : never
    export const spriteUrls: { readonly [Variant in IconVariant]: string }
    export function spriteUrl (variant: IconVariant): string
    export function iconUrl<Variant extends IconVariant, Group extends IconGroup<Variant>> (variant: Variant, group: Group, name: IconName<Variant, Group>): string
}
`
}
