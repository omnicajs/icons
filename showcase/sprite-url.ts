const spriteCacheKey = import.meta.env.DEV
    ? Math.trunc(performance.timeOrigin).toString(36)
    : ''

export const withShowcaseCacheKey = (url: string): string => {
    if (!spriteCacheKey) {
        return url
    }

    const [assetUrl, fragment] = url.split('#', 2)
    const separator = assetUrl.includes('?') ? '&' : '?'

    return `${assetUrl}${separator}v=${spriteCacheKey}${fragment ? `#${fragment}` : ''}`
}
