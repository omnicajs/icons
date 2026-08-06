import { iconNames as flagIconNames, iconUrl as flagIconUrl } from '@omnicajs/icons/flags'
import { iconNames as logoIconNames, iconUrl as logoIconUrl } from '@omnicajs/icons/logos'

export const collectionNames = ['logos', 'flags'] as const

export type IconCollection = typeof collectionNames[number]

type CollectionIconUrl = (name: string) => string

const iconUrls: Readonly<Record<IconCollection, CollectionIconUrl>> = {
    flags: flagIconUrl as CollectionIconUrl,
    logos: logoIconUrl as CollectionIconUrl,
}

export const collectionCatalog: Readonly<Record<IconCollection, readonly string[]>> = {
    flags: flagIconNames,
    logos: logoIconNames,
}

export const collectionIconUrl = (collection: IconCollection, name: string): string =>
    iconUrls[collection](name)
