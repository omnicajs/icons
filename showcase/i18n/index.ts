import type { ShowcaseLocale } from './locales'

import { createI18n } from 'vue-i18n'

import enGB from './locales/en-GB.json'
import esES from './locales/es-ES.json'
import ruRU from './locales/ru-RU.json'

import { fallbackLocale } from './locales'

export type MessageSchema = typeof enGB

const messages = {
    'en-GB': enGB,
    'es-ES': esES,
    'ru-RU': ruRU,
} satisfies Record<ShowcaseLocale, MessageSchema>

const pluralRules = {
    'en-GB': (choice: number): number => choice === 1 ? 0 : 1,
    'es-ES': (choice: number): number => choice === 1 ? 0 : 1,
    'ru-RU': (choice: number): number => {
        const modulo100 = Math.abs(choice) % 100
        const modulo10 = modulo100 % 10

        if (modulo100 >= 11 && modulo100 <= 14) {
            return 2
        }

        if (modulo10 === 1) {
            return 0
        }

        return modulo10 >= 2 && modulo10 <= 4 ? 1 : 2
    },
} satisfies Record<ShowcaseLocale, (choice: number) => number>

export const createShowcaseI18n = (locale: ShowcaseLocale = fallbackLocale) => createI18n<
    [MessageSchema],
    ShowcaseLocale
>({
    fallbackLocale,
    fallbackWarn: false,
    globalInjection: false,
    legacy: false,
    locale,
    messages,
    missingWarn: false,
    pluralRules,
})
