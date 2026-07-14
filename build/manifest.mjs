import path from 'node:path'

const toPackagePath = (root, filename) => path.relative(root, filename).split(path.sep).join('/')

const iconManifest = (icon, root, keywords) => {
    if (!Array.isArray(keywords)) {
        throw new Error(`Missing keywords for ${icon.symbolId}`)
    }

    return {
        source: toPackagePath(root, icon.source),
        symbol: icon.symbolId,
        viewBox: icon.viewBox,
        keywords,
    }
}

const groupManifest = ({ group, root, sprite, keywords }) => ({
    sprite,
    size: group.spriteSize,
    icons: Object.fromEntries(group.icons.map(icon => [
        icon.name,
        iconManifest(icon, root, keywords?.[icon.name]),
    ])),
})

export const generateManifest = ({ sprites, keywords, root, version }) => ({
    schemaVersion: 1,
    version,
    variants: Object.fromEntries(sprites.variants.map(variant => [
        variant.name,
        {
            sprite: `sprites/${variant.name}.svg`,
            size: variant.spriteSize,
            groups: Object.fromEntries(variant.groups.map(group => [
                group.name,
                groupManifest({
                    group,
                    keywords: keywords.variants[variant.name]?.[group.name],
                    root,
                    sprite: `sprites/${variant.name}/${group.name}.svg`,
                }),
            ])),
        },
    ])),
    collections: Object.fromEntries(sprites.colorGroups.map(group => [
        group.name,
        groupManifest({
            group,
            keywords: keywords.collections[group.name],
            root,
            sprite: `sprites/${group.name}.svg`,
        }),
    ])),
})
