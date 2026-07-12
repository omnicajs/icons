const stringifyList = values => values.map(value => JSON.stringify(value)).join(', ')

export const generateVirtualDeclarations = groups => {
    const iconNames = groups
        .map(group => `        readonly ${JSON.stringify(group.name)}: readonly [${stringifyList(group.iconNames)}];`)
        .join('\n')
    const spriteUrls = groups
        .map(group => `        readonly ${JSON.stringify(group.name)}: string;`)
        .join('\n')
    const types = groups
        .map(group => `    export type ${group.typeName} = typeof iconNames[${JSON.stringify(group.name)}][number]`)
        .join('\n')
    const mapFields = groups
        .map(group => `        ${JSON.stringify(group.name)}: ${group.typeName}`)
        .join('\n')

    return `${[
        "declare module 'virtual:omnicajs-icons' {",
        '    export const iconNames: {',
        iconNames,
        '    }',
        '',
        '    export const spriteUrls: {',
        spriteUrls,
        '    }',
        '',
        types,
        '',
        '    export interface IconNameMap {',
        mapFields,
        '    }',
        '}',
        '',
    ].join('\n')}`
}

export const generatePackageDeclarations = groups => {
    const iconNameConst = groups
        .map(group => `    readonly ${JSON.stringify(group.name)}: readonly [${stringifyList(group.iconNames)}];`)
        .join('\n')
    const spriteUrlConst = groups
        .map(group => `    readonly ${JSON.stringify(group.name)}: string;`)
        .join('\n')
    const types = groups
        .map(group => `export type ${group.typeName} = typeof iconNames[${JSON.stringify(group.name)}][number]`)
        .join('\n')
    const mapFields = groups
        .map(group => `    ${JSON.stringify(group.name)}: ${group.typeName}`)
        .join('\n')

    return `${[
        'export declare const iconNames: {',
        iconNameConst,
        '}',
        '',
        'export declare const spriteUrls: {',
        spriteUrlConst,
        '}',
        '',
        types,
        '',
        'export interface IconNameMap {',
        mapFields,
        '}',
        '',
        'export type IconGroup = keyof IconNameMap',
        'export type IconName<Group extends IconGroup = IconGroup> = IconNameMap[Group]',
        '',
        'export declare function spriteUrl<Group extends IconGroup> (group: Group): string',
        'export declare function iconUrl<Group extends IconGroup> (group: Group, name: IconName<Group>): string',
        '',
    ].join('\n')}`
}
