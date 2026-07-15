import type { Theme } from 'vitepress'

import DefaultTheme from 'vitepress/theme'

import { createShowcaseI18n } from '../../i18n'
import { matchShowcaseLocale } from '../../i18n/locales'
import { redirectToBrowserLocale } from '../../i18n/detectBrowserLocale'

// eslint-disable-next-line dependencies/sort-imports -- Overrides must follow VitePress base CSS.
import './custom.less'

export default {
    extends: DefaultTheme,
    enhanceApp ({ app, siteData }) {
        app.use(createShowcaseI18n(matchShowcaseLocale([siteData.value.lang])))

        if (typeof window !== 'undefined') {
            redirectToBrowserLocale(siteData.value.base)
        }
    },
} satisfies Theme
