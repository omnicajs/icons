import { fallbackLocale, matchShowcaseLocale, showcaseLocales } from './locales'

const detectionStorageKey = 'omnicajs-icons:locale-detected'

const normalizeBase = (base: string): string => {
    const path = base.replace(/^\/+|\/+$/g, '')

    return path ? `/${path}/` : '/'
}

const getRelativePath = (pathname: string, base: string): string | null => {
    const normalizedBase = normalizeBase(base)
    const baseWithoutTrailingSlash = normalizedBase.slice(0, -1)

    if (pathname === baseWithoutTrailingSlash) {
        return ''
    }

    return pathname.startsWith(normalizedBase)
        ? pathname.slice(normalizedBase.length)
        : null
}

const isLocalizedPath = (path: string): boolean => {
    const firstSegment = path.split('/')[0]

    return showcaseLocales.some(locale => locale.code !== fallbackLocale && locale.code === firstSegment)
}

export const redirectToBrowserLocale = (base: string): void => {
    const relativePath = getRelativePath(window.location.pathname, base)

    if (relativePath === null) {
        return
    }

    try {
        if (window.sessionStorage.getItem(detectionStorageKey)) {
            return
        }

        window.sessionStorage.setItem(detectionStorageKey, 'true')
    } catch {
        // Detection remains useful when storage is unavailable, but cannot be made session-sticky.
    }

    if (isLocalizedPath(relativePath)) {
        return
    }

    const browserLanguages = navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language]
    const locale = matchShowcaseLocale(browserLanguages)

    if (locale === fallbackLocale) {
        return
    }

    const normalizedBase = normalizeBase(base)
    const target = `${normalizedBase}${locale}/${relativePath}${window.location.search}${window.location.hash}`

    window.location.replace(target)
}
