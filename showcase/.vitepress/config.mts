import type { DefaultTheme } from 'vitepress'
import { defineConfig } from 'vitepress'

import { createShowcaseI18n } from '../i18n'
import { localePath, type ShowcaseLocale, showcaseLocales } from '../i18n/locales'

const isPagesBuild = process.env.GITHUB_ACTIONS === 'true'
const base = isPagesBuild ? '/icons/' : '/'
const githubLink = 'https://github.com/omnicajs/icons'

const localeTheme = (locale: ShowcaseLocale): DefaultTheme.Config => {
    const { t } = createShowcaseI18n(locale).global

    return {
        nav: [
            { text: t('shell.nav.icons'), link: localePath(locale) },
            { text: t('shell.nav.usage'), link: localePath(locale, '/usage') },
        ],
        footer: {
            message: t('shell.footer'),
        },
        outline: {
            label: t('shell.outline'),
        },
        docFooter: {
            prev: t('shell.previousPage'),
            next: t('shell.nextPage'),
        },
        darkModeSwitchLabel: t('shell.appearance'),
        lightModeSwitchTitle: t('shell.lightTheme'),
        darkModeSwitchTitle: t('shell.darkTheme'),
        sidebarMenuLabel: t('shell.menu'),
        returnToTopLabel: t('shell.returnToTop'),
        langMenuLabel: t('shell.languageMenu'),
        skipToContentLabel: t('shell.skipToContent'),
        notFound: {
            title: t('shell.notFound.title'),
            quote: t('shell.notFound.quote'),
            linkLabel: t('shell.notFound.linkLabel'),
            linkText: t('shell.notFound.linkText'),
        },
    }
}

const localeDescription = (locale: ShowcaseLocale): string =>
    createShowcaseI18n(locale).global.t('shell.description')

const [english, spanish, russian] = showcaseLocales

export default defineConfig({
    title: 'OmnicaJS Icons',
    description: localeDescription(english.code),
    base,
    cleanUrls: true,
    locales: {
        [english.index]: {
            label: english.label,
            lang: english.code,
            link: english.link,
            description: localeDescription(english.code),
            themeConfig: localeTheme(english.code),
        },
        [spanish.index]: {
            label: spanish.label,
            lang: spanish.code,
            link: spanish.link,
            description: localeDescription(spanish.code),
            themeConfig: localeTheme(spanish.code),
        },
        [russian.index]: {
            label: russian.label,
            lang: russian.code,
            link: russian.link,
            description: localeDescription(russian.code),
            themeConfig: localeTheme(russian.code),
        },
    },
    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}omnica.svg` }],
        ['meta', { name: 'theme-color', content: '#005eeb' }],
    ],
    themeConfig: {
        logo: '/omnica.svg',
        i18nRouting: true,
        socialLinks: [
            { icon: 'github', link: githubLink },
        ],
    },
    vite: {
        define: {
            __INTLIFY_PROD_DEVTOOLS__: false,
            __VUE_I18N_FULL_INSTALL__: false,
            __VUE_I18N_LEGACY_API__: false,
            __VUE_PROD_DEVTOOLS__: false,
        },
        server: {
            allowedHosts: [
                'icons.omnicajs.local',
                'icons.omnicajs.test',
            ],
        },
        ssr: {
            noExternal: [
                'vue-i18n',
                /^@intlify\//,
            ],
        },
    },
})
