import { computed } from 'vue'
import { useData } from 'vitepress'

import { matchShowcaseLocale } from './locales'
import { catalogMessages } from './messages'

export const useShowcaseI18n = () => {
    const { lang } = useData()
    const locale = computed(() => matchShowcaseLocale([lang.value]))
    const messages = computed(() => catalogMessages[locale.value])
    const sizeFormatter = computed(() => new Intl.NumberFormat(locale.value, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    }))
    const formatSize = (bytes: number): string => `${sizeFormatter.value.format(bytes / 1024)} KiB`

    return {
        formatSize,
        locale,
        messages,
    }
}
