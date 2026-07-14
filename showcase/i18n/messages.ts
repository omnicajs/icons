import type { ShowcaseLocale } from './locales'

export type CatalogVariant = 'filled' | 'outlined'

type CatalogMessages = Readonly<{
    title: string
    summary: (groups: number, icons: number, variant: CatalogVariant) => string
    spriteSize: (raw: string, gzip: string) => string
    currentDelivery: (delivery: string) => string
    searchLabel: string
    searchPlaceholder: string
    variantLabel: string
    variantOptions: Readonly<Record<CatalogVariant, string>>
    deliveryLabel: string
    fullSprite: string
    groupedSprites: string
    groupsLabel: string
    showAllGroups: string
    showOnlyGroup: (group: string) => string
    copyTitle: (path: string) => string
    copy: string
    copied: string
    noMatches: (query: string) => string
    fullDeliverySummary: string
    groupedDeliverySummary: (count: number) => string
}>

export type ShellMessages = Readonly<{
    description: string
    nav: Readonly<{
        icons: string
        usage: string
    }>
    footer: string
    outline: string
    previousPage: string
    nextPage: string
    appearance: string
    lightTheme: string
    darkTheme: string
    menu: string
    returnToTop: string
    languageMenu: string
    skipToContent: string
    notFound: Readonly<{
        title: string
        quote: string
        linkLabel: string
        linkText: string
    }>
}>

const englishCount = (count: number, singular: string, plural = `${singular}s`): string =>
    `${count} ${count === 1 ? singular : plural}`

const spanishCount = (count: number, singular: string, plural = `${singular}s`): string =>
    `${count} ${count === 1 ? singular : plural}`

const russianCount = (
    count: number,
    [one, few, many]: readonly [string, string, string]
): string => {
    const modulo100 = Math.abs(count) % 100
    const modulo10 = modulo100 % 10
    const form = modulo100 >= 11 && modulo100 <= 14
        ? many
        : modulo10 === 1
            ? one
            : modulo10 >= 2 && modulo10 <= 4
                ? few
                : many

    return `${count} ${form}`
}

export const catalogMessages = {
    'en-GB': {
        title: 'Icon catalog',
        summary: (groups, icons, variant) =>
            `${englishCount(groups, 'group')}, ${englishCount(icons, 'icon')} in ${variant}.`,
        spriteSize: (raw, gzip) => `Sprite size: ${raw} raw, ${gzip} gzip.`,
        currentDelivery: delivery => `Current delivery: ${delivery}`,
        searchLabel: 'Search icons',
        searchPlaceholder: 'Name or keyword',
        variantLabel: 'Style',
        variantOptions: {
            filled: 'Filled',
            outlined: 'Outlined',
        },
        deliveryLabel: 'Sprite delivery',
        fullSprite: 'Full sprite',
        groupedSprites: 'Grouped sprites',
        groupsLabel: 'Icon groups',
        showAllGroups: 'Show all groups',
        showOnlyGroup: group => `Show only ${group}`,
        copyTitle: path => `Copy ${path}`,
        copy: 'Copy',
        copied: 'Copied',
        noMatches: query => `No icons match “${query}”.`,
        fullDeliverySummary: 'Full sprite.',
        groupedDeliverySummary: count => `${englishCount(count, 'grouped sprite')}.`,
    },
    'es-ES': {
        title: 'Catálogo de iconos',
        summary: (groups, icons, variant) =>
            `${spanishCount(groups, 'grupo')}, ${spanishCount(icons, 'icono')} en ${variant === 'filled' ? 'relleno' : 'contorno'}.`,
        spriteSize: (raw, gzip) => `Tamaño del sprite: ${raw} sin comprimir, ${gzip} gzip.`,
        currentDelivery: delivery => `Distribución actual: ${delivery}`,
        searchLabel: 'Buscar iconos',
        searchPlaceholder: 'Nombre o palabra clave',
        variantLabel: 'Estilo',
        variantOptions: {
            filled: 'Relleno',
            outlined: 'Contorno',
        },
        deliveryLabel: 'Distribución del sprite',
        fullSprite: 'Sprite completo',
        groupedSprites: 'Sprites por grupo',
        groupsLabel: 'Grupos de iconos',
        showAllGroups: 'Mostrar todos los grupos',
        showOnlyGroup: group => `Mostrar solo ${group}`,
        copyTitle: path => `Copiar ${path}`,
        copy: 'Copiar',
        copied: 'Copiado',
        noMatches: query => `Ningún icono coincide con «${query}».`,
        fullDeliverySummary: 'Sprite completo.',
        groupedDeliverySummary: count => `${spanishCount(count, 'sprite por grupo', 'sprites por grupo')}.`,
    },
    'ru-RU': {
        title: 'Каталог иконок',
        summary: (groups, icons, variant) =>
            `${russianCount(groups, ['группа', 'группы', 'групп'])}, ${russianCount(icons, ['иконка', 'иконки', 'иконок'])}; начертание — ${variant === 'filled' ? 'с заливкой' : 'контурное'}.`,
        spriteSize: (raw, gzip) => `Размер спрайта: ${raw} без сжатия, ${gzip} gzip.`,
        currentDelivery: delivery => `Текущий способ поставки: ${delivery}`,
        searchLabel: 'Поиск иконок',
        searchPlaceholder: 'Название или ключевое слово',
        variantLabel: 'Начертание',
        variantOptions: {
            filled: 'С заливкой',
            outlined: 'Контурное',
        },
        deliveryLabel: 'Способ поставки',
        fullSprite: 'Общий спрайт',
        groupedSprites: 'Спрайты по группам',
        groupsLabel: 'Группы иконок',
        showAllGroups: 'Показать все группы',
        showOnlyGroup: group => `Показать только ${group}`,
        copyTitle: path => `Скопировать ${path}`,
        copy: 'Копировать',
        copied: 'Скопировано',
        noMatches: query => `По запросу «${query}» иконки не найдены.`,
        fullDeliverySummary: 'Общий спрайт.',
        groupedDeliverySummary: count =>
            `${russianCount(count, ['спрайт по группе', 'спрайта по группам', 'спрайтов по группам'])}.`,
    },
} satisfies Record<ShowcaseLocale, CatalogMessages>

export const shellMessages = {
    'en-GB': {
        description: 'Typed SVG icon sprites for OmnicaJS projects.',
        nav: {
            icons: 'Icons',
            usage: 'Usage',
        },
        footer: 'Released under the MIT License.',
        outline: 'On this page',
        previousPage: 'Previous page',
        nextPage: 'Next page',
        appearance: 'Appearance',
        lightTheme: 'Switch to light theme',
        darkTheme: 'Switch to dark theme',
        menu: 'Menu',
        returnToTop: 'Return to top',
        languageMenu: 'Change language',
        skipToContent: 'Skip to content',
        notFound: {
            title: 'PAGE NOT FOUND',
            quote: 'The requested page does not exist.',
            linkLabel: 'go to home',
            linkText: 'Take me home',
        },
    },
    'es-ES': {
        description: 'Sprites SVG tipados para proyectos de OmnicaJS.',
        nav: {
            icons: 'Iconos',
            usage: 'Uso',
        },
        footer: 'Publicado bajo la licencia MIT.',
        outline: 'En esta página',
        previousPage: 'Página anterior',
        nextPage: 'Página siguiente',
        appearance: 'Apariencia',
        lightTheme: 'Cambiar al tema claro',
        darkTheme: 'Cambiar al tema oscuro',
        menu: 'Menú',
        returnToTop: 'Volver arriba',
        languageMenu: 'Cambiar idioma',
        skipToContent: 'Ir al contenido',
        notFound: {
            title: 'PÁGINA NO ENCONTRADA',
            quote: 'La página solicitada no existe.',
            linkLabel: 'ir al inicio',
            linkText: 'Volver al inicio',
        },
    },
    'ru-RU': {
        description: 'Типизированные SVG-спрайты иконок для проектов OmnicaJS.',
        nav: {
            icons: 'Иконки',
            usage: 'Использование',
        },
        footer: 'Распространяется по лицензии MIT.',
        outline: 'На этой странице',
        previousPage: 'Предыдущая страница',
        nextPage: 'Следующая страница',
        appearance: 'Оформление',
        lightTheme: 'Включить светлую тему',
        darkTheme: 'Включить тёмную тему',
        menu: 'Меню',
        returnToTop: 'Вернуться наверх',
        languageMenu: 'Сменить язык',
        skipToContent: 'Перейти к содержимому',
        notFound: {
            title: 'СТРАНИЦА НЕ НАЙДЕНА',
            quote: 'Запрошенной страницы не существует.',
            linkLabel: 'перейти на главную',
            linkText: 'На главную',
        },
    },
} satisfies Record<ShowcaseLocale, ShellMessages>
