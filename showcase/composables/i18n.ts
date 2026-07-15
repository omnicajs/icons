import type { MessageSchema } from '../i18n'
import type { ShowcaseLocale } from '../i18n/locales'

import { computed } from 'vue'
import { useData } from 'vitepress'
import { useI18n as useVueI18n } from 'vue-i18n'
import { watch } from 'vue'

import { matchShowcaseLocale } from '../i18n/locales'

export const useI18n = () => {
    const { lang } = useData()
    const { locale, t } = useVueI18n<{ message: MessageSchema }, ShowcaseLocale>({
        useScope: 'global',
    })
    const sizeFormatter = computed(() => new Intl.NumberFormat(locale.value, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
    }))

    watch(lang, value => {
        locale.value = matchShowcaseLocale([value])
    }, { immediate: true })

    return {
        formatSize: (bytes: number): string => `${sizeFormatter.value.format(bytes / 1024)} KiB`,
        locale,
        t,
    }
}
