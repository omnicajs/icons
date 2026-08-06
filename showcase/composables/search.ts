import type { ComputedRef } from 'vue'
import type { IconVariant } from '@omnicajs/icons'
import type { Ref } from 'vue'

import type { IconCollection } from '../collections'

import { computed, ref } from 'vue'

import manifest from '@omnicajs/icons/manifest'

export type IconCatalog = Readonly<Record<IconVariant, Readonly<Record<string, readonly string[]>>>>

export type VisibleIconGroup = Readonly<{ name: string, names: readonly string[] }>
type RankedIcon = Readonly<{ name: string, order: number, score: number }>
type RankedIconGroup = Readonly<VisibleIconGroup & { order: number, score: number }>
type IconSearchOptions = Readonly<{
    activeGroup: Ref<string | null>
    catalog: IconCatalog
    groups: ComputedRef<readonly string[]>
    variant: Ref<IconVariant>
}>
type CollectionSearchOptions = Readonly<{
    collection: IconCollection
    names: readonly string[]
}>

const normalizeSearchValue = (value: string): string => value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const includesSearchTerms = (value: string, terms: readonly string[]): boolean =>
    terms.every(term => value.includes(term))

const searchScore = (
    canonicalValues: readonly string[],
    keywordValues: readonly string[],
    normalizedQuery: string
): number | null => {
    if (!normalizedQuery) {
        return 0
    }

    const normalizedCanonicalValues = canonicalValues.map(normalizeSearchValue)

    if (normalizedCanonicalValues.includes(normalizedQuery)) {
        return 0
    }

    const terms = normalizedQuery.split(' ')

    if (includesSearchTerms(normalizedCanonicalValues.join(' '), terms)) {
        return 1
    }

    const normalizedKeywordValues = keywordValues.map(normalizeSearchValue)

    if (normalizedKeywordValues.includes(normalizedQuery)) {
        return 2
    }

    return includesSearchTerms(normalizedKeywordValues.join(' '), terms) ? 3 : null
}

const iconSearchScore = (
    variant: IconVariant,
    group: string,
    name: string,
    normalizedQuery: string
): number | null => searchScore([
    name,
    `${group}/${name}`,
    `${variant}/${group}/${name}`,
], manifest.variants[variant].groups[group].icons[name].keywords, normalizedQuery)

export const useSearch = ({
    activeGroup,
    catalog,
    groups,
    variant,
}: IconSearchOptions) => {
    const query = ref('')
    const visibleIconGroups = computed<VisibleIconGroup[]>(() => {
        const normalizedQuery = normalizeSearchValue(query.value)
        const visibleGroups = activeGroup.value ? [activeGroup.value] : groups.value

        return visibleGroups
            .map<RankedIconGroup>((name, groupOrder) => {
                const icons = catalog[variant.value][name]
                    .map<RankedIcon>((iconName, iconOrder) => ({
                        name: iconName,
                        order: iconOrder,
                        score: iconSearchScore(variant.value, name, iconName, normalizedQuery)
                            ?? Number.POSITIVE_INFINITY,
                    }))
                    .filter(icon => Number.isFinite(icon.score))
                    .sort((left, right) => left.score - right.score || left.order - right.order)

                return {
                    name,
                    names: icons.map(icon => icon.name),
                    order: groupOrder,
                    score: icons[0]?.score ?? Number.POSITIVE_INFINITY,
                }
            })
            .filter(group => group.names.length > 0)
            .sort((left, right) => left.score - right.score || left.order - right.order)
    })

    return {
        query,
        visibleIconCount: computed(() => visibleIconGroups.value.reduce((
            count,
            group
        ) => count + group.names.length, 0)),
        visibleIconGroups,
    }
}

export const useCollectionSearch = ({ collection, names }: CollectionSearchOptions) => {
    const query = ref('')
    const visibleIconNames = computed(() => {
        const normalizedQuery = normalizeSearchValue(query.value)

        return names
            .map<RankedIcon>((name, order) => ({
                name,
                order,
                score: searchScore([
                    name,
                    `${collection}/${name}`,
                ], manifest.collections[collection].icons[name].keywords, normalizedQuery)
                    ?? Number.POSITIVE_INFINITY,
            }))
            .filter(icon => Number.isFinite(icon.score))
            .sort((left, right) => left.score - right.score || left.order - right.order)
            .map(icon => icon.name)
    })

    return {
        query,
        visibleIconNames,
    }
}
