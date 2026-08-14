const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const serializeSprite = (symbols: readonly string[]): string => [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    symbols.join('\n'),
    '</svg>',
    '',
].join('\n')

export const extractSymbol = (sprite: string, symbolId: string, filename: string): string => {
    const expression = new RegExp(`<symbol\\b[^>]*\\bid=(["'])${escapeRegExp(symbolId)}\\1[\\s\\S]*?<\\/symbol>`)
    const match = sprite.match(expression)

    if (!match) {
        throw new Error(`Unable to find symbol ${symbolId} in ${filename}`)
    }

    return match[0]
}
