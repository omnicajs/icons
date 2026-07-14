export const showcaseLocales = [
    {
        code: 'en-GB',
        index: 'root',
        label: 'English',
        link: '/',
    },
    {
        code: 'es-ES',
        index: 'es-ES',
        label: 'Español',
        link: '/es-ES/',
    },
    {
        code: 'ru-RU',
        index: 'ru-RU',
        label: 'Русский',
        link: '/ru-RU/',
    },
] as const

export type ShowcaseLocale = typeof showcaseLocales[number]['code']

export const fallbackLocale = 'en-GB' satisfies ShowcaseLocale

const normalizeLocale = (locale: string): string => locale.replace('_', '-').toLowerCase()

export const matchShowcaseLocale = (languages: readonly string[]): ShowcaseLocale => {
    for (const language of languages) {
        const normalizedLanguage = normalizeLocale(language)
        const exactMatch = showcaseLocales.find(locale => normalizeLocale(locale.code) === normalizedLanguage)

        if (exactMatch) {
            return exactMatch.code
        }

        const languageCode = normalizedLanguage.split('-')[0]
        const languageMatch = showcaseLocales.find(locale => normalizeLocale(locale.code).split('-')[0] === languageCode)

        if (languageMatch) {
            return languageMatch.code
        }
    }

    return fallbackLocale
}

export const localePath = (locale: ShowcaseLocale, path = '/'): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    return locale === fallbackLocale
        ? normalizedPath
        : `/${locale}${normalizedPath}`
}
