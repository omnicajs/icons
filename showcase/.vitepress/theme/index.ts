import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import { redirectToBrowserLocale } from '../../i18n/detectBrowserLocale'

import './custom.less'

export default {
    extends: DefaultTheme,
    enhanceApp ({ siteData }) {
        if (typeof window !== 'undefined') {
            redirectToBrowserLocale(siteData.value.base)
        }
    },
} satisfies Theme
