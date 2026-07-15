import type { ComputedRef } from 'vue'
import type { IconVariant } from '@omnicajs/icons'
import type { Ref } from 'vue'

import { computed, ref } from 'vue'

import manifest from '@omnicajs/icons/manifest'

export type IconCatalog = Readonly<Record<IconVariant, Readonly<Record<string, readonly string[]>>>>

type VisibleIconGroup = Readonly<{ name: string, names: readonly string[] }>
type RankedIcon = Readonly<{ name: string, order: number, score: number }>
type RankedIconGroup = Readonly<VisibleIconGroup & { order: number, score: number }>
type IconSearchOptions = Readonly<{
    activeGroup: Ref<string | null>
    catalog: IconCatalog
    groups: ComputedRef<readonly string[]>
    variant: Ref<IconVariant>
}>

const normalizeSearchValue = (value: string): string => value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

const includesSearchTerms = (value: string, terms: readonly string[]): boolean =>
    terms.every(term => value.includes(term))

const iconSearchScore = (
    variant: IconVariant,
    group: string,
    name: string,
    normalizedQuery: string
): number | null => {
    if (!normalizedQuery) {
        return 0
    }

    const canonicalValues = [
        name,
        `${group}/${name}`,
        `${variant}/${group}/${name}`,
    ].map(normalizeSearchValue)

    if (canonicalValues.includes(normalizedQuery)) {
        return 0
    }

    const terms = normalizedQuery.split(' ')

    if (includesSearchTerms(canonicalValues.join(' '), terms)) {
        return 1
    }

    const keywordValues = manifest.variants[variant].groups[group].icons[name].keywords
        .map(normalizeSearchValue)

    if (keywordValues.includes(normalizedQuery)) {
        return 2
    }

    return includesSearchTerms(keywordValues.join(' '), terms) ? 3 : null
}

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
