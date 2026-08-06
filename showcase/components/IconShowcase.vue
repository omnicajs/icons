<template>
    <section :class="$style['catalog']" aria-labelledby="catalog-title">
        <header :class="$style['catalog__header']">
            <div>
                <h2 id="catalog-title">
                    {{ t('catalog.title') }}
                </h2>
                <p>
                    {{ t('catalog.summary', {
                        groups: t('catalog.groupCount', iconGroups.length),
                        icons: t('catalog.iconCount', iconCount),
                        variant: variantLabels[activeVariant],
                    }) }}
                    {{ t('catalog.spriteSize', {
                        raw: formatSize(activeSpriteSize.bytes),
                        gzip: formatSize(activeSpriteSize.gzipBytes)
                    }) }}
                </p>
                <p>
                    {{ t('catalog.currentDelivery', { delivery: delivery === 'full'
                        ? t('catalog.delivery.fullSummary')
                        : t('catalog.delivery.groupedSummary', activeGroup ? 1 : iconGroups.length),
                    }) }}
                </p>
            </div>

            <div :class="$style['catalog__toolbar']">
                <CatalogSearch v-model="query" />

                <div :class="$style['catalog__select']">
                    <label :for="uid + '-style'">{{ t('catalog.variant.label') }}</label>
                    <select
                        :id="uid + '-style'"
                        v-model="activeVariant"
                    >
                        <option v-for="variant in variants" :key="variant" :value="variant">
                            {{ variantLabels[variant] }}
                        </option>
                    </select>
                </div>

                <div :class="$style['catalog__select']">
                    <label :for="uid + '-delivery'">{{ t('catalog.delivery.label') }}</label>
                    <select
                        :id="uid + '-delivery'"
                        v-model="delivery"
                    >
                        <option value="full" v-text="t('catalog.delivery.full')" />
                        <option value="grouped" v-text="t('catalog.delivery.grouped')" />
                    </select>
                </div>
            </div>
        </header>

        <nav
            :class="$style['catalog__groups']"
            :aria-label="t('catalog.groups.label')"
        >
            <button
                v-for="group in iconGroups"
                :key="group"
                type="button"
                :aria-pressed="group === activeGroup"
                :class="{
                    [$style['catalog__group']]: true,
                    [$style['catalog__group_active']]: group === activeGroup
                }"
                :title="group === activeGroup
                    ? t('catalog.groups.showAll')
                    : t('catalog.groups.showOnly', { group })"
                @click="activeGroup = activeGroup === group ? null : group"
            >
                {{ group }} <span>{{ catalog[activeVariant][group].length }}</span>
            </button>
        </nav>

        <CatalogGrid
            :copied-path="copiedIcon"
            :groups="visibleIconGroups"
            :path-for="iconPath"
            @copy="copyIconName"
        >
            <template #glyph="{ group, iconName }">
                <IconGlyph
                    :group="group"
                    :grouped="delivery === 'grouped'"
                    :name="iconName"
                    :variant="activeVariant"
                />
            </template>
        </CatalogGrid>

        <p v-if="visibleIconCount === 0" :class="$style.catalog__empty">
            {{ t('catalog.noMatches', { query }) }}
        </p>
    </section>
</template>

<script lang="ts" setup>
import type { IconCatalog } from '../composables/search'
import type { IconVariant } from '@omnicajs/icons'

import {
    computed,
    ref,
    useId,
    watch,
} from 'vue'

import { iconNames } from '@omnicajs/icons'

import manifest from '@omnicajs/icons/manifest'

import CatalogGrid from './CatalogGrid.vue'
import CatalogSearch from './CatalogSearch.vue'
import IconGlyph from './IconGlyph.vue'

import { useClipboard } from '../composables/clipboard'
import { useI18n } from '../composables/i18n'
import { useSearch } from '../composables/search'

type Delivery = 'full' | 'grouped'
type SpriteSize = Readonly<{ bytes: number, gzipBytes: number }>

const uid = useId()

const { t, formatSize } = useI18n()

const catalog = iconNames as IconCatalog

const variants = Object.keys(catalog) as IconVariant[]
const activeVariant = ref<IconVariant>('filled')
const variantLabels = computed<Record<IconVariant, string>>(() => ({
    filled: t('catalog.variant.filled'),
    outlined: t('catalog.variant.outlined'),
}))
const iconGroups = computed(() => Object.keys(catalog[activeVariant.value]))
const iconCount = computed(() => Object.values(catalog[activeVariant.value])
    .reduce((count, names) => count + names.length, 0))

const activeGroup = ref<string | null>(iconGroups.value[0] ?? null)

const {
    query,
    visibleIconCount,
    visibleIconGroups,
} = useSearch({
    activeGroup,
    catalog,
    groups: iconGroups,
    variant: activeVariant,
})

const delivery = ref<Delivery>('full')
const iconPath = (group: string, name: string): string => `${activeVariant.value}/${group}/${name}`

const activeSpriteSize = computed<SpriteSize>(() => {
    if (delivery.value === 'full') {
        return manifest.variants[activeVariant.value].size
    }

    const groups = activeGroup.value ? [activeGroup.value] : iconGroups.value

    return groups.reduce<SpriteSize>((size, group) => {
        const groupSize = manifest.variants[activeVariant.value].groups[group].size

        return {
            bytes: size.bytes + groupSize.bytes,
            gzipBytes: size.gzipBytes + groupSize.gzipBytes,
        }
    }, { bytes: 0, gzipBytes: 0 })
})

const { copiedIcon, copyIconName } = useClipboard(activeVariant)

watch(activeVariant, variant => {
    if (activeGroup.value && !Object.hasOwn(catalog[variant], activeGroup.value)) {
        activeGroup.value = Object.keys(catalog[variant])[0] ?? null
    }
})
</script>

<style module>
.catalog {
    margin-top: 24px;
}

.catalog__header {
    display: grid;
    gap: 24px;
    margin-bottom: 24px;
}

.catalog__header h2 {
    margin: 0 0 6px;
    border: 0;
    padding: 0;
}

.catalog__header p {
    margin: 0;
    color: var(--vp-c-text-2);
}

.catalog__toolbar {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) repeat(2, minmax(160px, 220px));
    align-items: end;
    gap: 12px;
}

.catalog__select {
    display: grid;
    gap: 6px;
    color: var(--vp-c-text-2);
    font-size: 13px;
    font-weight: 600;
}

.catalog__select select {
    width: 100%;
    height: 40px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 0 12px;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg-soft);
    font: inherit;
}

.catalog__select select {
    cursor: pointer;
}

.catalog__select select:focus-visible {
    border-color: var(--vp-c-brand-1);
    outline: 2px solid var(--vp-c-brand-soft);
}

.catalog__groups {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}

.catalog__group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 0 12px;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg-soft);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}

.catalog__group span {
    color: var(--vp-c-text-2);
    font-size: 12px;
}

.catalog__group_active {
    border-color: var(--vp-button-brand-bg);
    color: var(--vp-c-white);
    background: var(--vp-button-brand-bg);
}

.catalog__group_active span {
    color: inherit;
}

.catalog__empty {
    border: 1px dashed var(--vp-c-divider);
    border-radius: 8px;
    padding: 32px;
    color: var(--vp-c-text-2);
    text-align: center;
}

@media (max-width: 720px) {
    .catalog__toolbar {
        grid-template-columns: 1fr;
    }
}
</style>
