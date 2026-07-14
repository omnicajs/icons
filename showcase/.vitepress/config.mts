import type { DefaultTheme } from 'vitepress'
import { defineConfig } from 'vitepress'

import { localePath, showcaseLocales } from '../i18n/locales'
import { shellMessages } from '../i18n/messages'

const isPagesBuild = process.env.GITHUB_ACTIONS === 'true'
const base = isPagesBuild ? '/icons/' : '/'
const githubLink = 'https://github.com/omnicajs/icons'

const localeTheme = (locale: keyof typeof shellMessages): DefaultTheme.Config => {
    const messages = shellMessages[locale]

    return {
        nav: [
            { text: messages.nav.icons, link: localePath(locale) },
            { text: messages.nav.usage, link: localePath(locale, '/usage') },
        ],
        footer: {
            message: messages.footer,
        },
        outline: {
            label: messages.outline,
        },
        docFooter: {
            prev: messages.previousPage,
            next: messages.nextPage,
        },
        darkModeSwitchLabel: messages.appearance,
        lightModeSwitchTitle: messages.lightTheme,
        darkModeSwitchTitle: messages.darkTheme,
        sidebarMenuLabel: messages.menu,
        returnToTopLabel: messages.returnToTop,
        langMenuLabel: messages.languageMenu,
        skipToContentLabel: messages.skipToContent,
        notFound: messages.notFound,
    }
}

const [english, spanish, russian] = showcaseLocales

export default defineConfig({
    title: 'OmnicaJS Icons',
    description: shellMessages['en-GB'].description,
    base,
    cleanUrls: true,
    locales: {
        [english.index]: {
            label: english.label,
            lang: english.code,
            link: english.link,
            description: shellMessages[english.code].description,
            themeConfig: localeTheme(english.code),
        },
        [spanish.index]: {
            label: spanish.label,
            lang: spanish.code,
            link: spanish.link,
            description: shellMessages[spanish.code].description,
            themeConfig: localeTheme(spanish.code),
        },
        [russian.index]: {
            label: russian.label,
            lang: russian.code,
            link: russian.link,
            description: shellMessages[russian.code].description,
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
        server: {
            allowedHosts: [
                'icons.omnicajs.local',
                'icons.omnicajs.test',
            ],
        },
    },
})
