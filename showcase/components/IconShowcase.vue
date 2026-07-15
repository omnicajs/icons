<template>
    <section :class="$style['catalog']" aria-labelledby="catalog-title">
        <header :class="$style['catalog__header']">
            <div>
                <h2 id="catalog-title">
                    {{ messages.title }}
                </h2>
                <p>
                    {{ messages.summary(iconGroups.length, iconCount, activeVariant) }}
                    {{ messages.spriteSize(
                        formatSize(activeSpriteSize.bytes),
                        formatSize(activeSpriteSize.gzipBytes)
                    ) }}
                </p>
                <p>
                    {{ messages.currentDelivery(deliverySummary) }}
                </p>
            </div>

            <div :class="$style['catalog__toolbar']">
                <div :class="$style['catalog__search']">
                    <label :for="uid + '-term'">{{ messages.searchLabel }}</label>
                    <input
                        :id="uid + '-term'"
                        v-model="query"
                        type="search"
                        autocomplete="off"
                        :placeholder="messages.searchPlaceholder"
                    >
                </div>

                <div :class="$style['catalog__select']">
                    <label :for="uid + '-style'">{{ messages.variantLabel }}</label>
                    <select
                        :id="uid + '-style'"
                        v-model="activeVariant"
                    >
                        <option v-for="variant in variants" :key="variant" :value="variant">
                            {{ messages.variantOptions[variant] }}
                        </option>
                    </select>
                </div>

                <div :class="$style['catalog__select']">
                    <label :for="uid + '-delivery'">{{ messages.deliveryLabel }}</label>
                    <select
                        :id="uid + '-delivery'"
                        v-model="delivery"
                    >
                        <option v-for="option in deliveryOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                        </option>
                    </select>
                </div>
            </div>
        </header>

        <nav
            :class="$style['catalog__groups']"
            :aria-label="messages.groupsLabel"
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
                :title="group === activeGroup ? messages.showAllGroups : messages.showOnlyGroup(group)"
                @click="toggleGroup(group)"
            >
                {{ group }} <span>{{ catalog[activeVariant][group].length }}</span>
            </button>
        </nav>

        <div :class="$style['catalog__sets']" aria-live="polite">
            <section
                v-for="group in visibleIconGroups"
                :key="group.name"
                :class="$style['catalog__set']"
                :aria-labelledby="`catalog-group-${group.name}`"
            >
                <header :class="$style['catalog__set-header']">
                    <h3 :id="`catalog-group-${group.name}`">
                        {{ group.name }}
                    </h3>
                    <span>{{ group.names.length }}</span>
                </header>

                <div :class="$style['catalog__icons']">
                    <button
                        v-for="name in group.names"
                        :key="name"
                        type="button"
                        :class="$style['catalog__icon']"
                        :title="messages.copyTitle(`${activeVariant}/${group.name}/${name}`)"
                        @click="copyIconName(group.name, name)"
                    >
                        <IconGlyph
                            :class="$style['catalog__glyph']"
                            :group="group.name"
                            :grouped="delivery === 'grouped'"
                            :name="name"
                            :variant="activeVariant"
                        />
                        <span :class="$style['catalog__name']">{{ name }}</span>
                        <span :class="$style['catalog__copy']">
                            {{ copiedIcon === `${activeVariant}/${group.name}/${name}` ? messages.copied : messages.copy }}
                        </span>
                    </button>
                </div>
            </section>
        </div>

        <p v-if="visibleIconCount === 0" :class="$style.catalog__empty">
            {{ messages.noMatches(query) }}
        </p>
    </section>
</template>

<script lang="ts" setup>
import type { IconCatalog } from '../composables/search'
import type { IconVariant } from '@omnicajs/icons'

import { computed, ref, useId, watch } from 'vue'

import { iconNames } from '@omnicajs/icons'

import manifest from '@omnicajs/icons/manifest'

import IconGlyph from './IconGlyph.vue'

import { useClipboard } from '../composables/clipboard'
import { useSearch } from '../composables/search'
import { useShowcaseI18n } from '../i18n/useShowcaseI18n'

type Delivery = 'full' | 'grouped'
type SpriteSize = Readonly<{ bytes: number, gzipBytes: number }>

const uid = useId()
const { formatSize, messages } = useShowcaseI18n()

// Catalog selection and filtering.
const catalog = iconNames as IconCatalog
const variants = Object.keys(catalog) as IconVariant[]
const activeVariant = ref<IconVariant>('filled')
const iconGroups = computed(() => Object.keys(catalog[activeVariant.value]))
const activeGroup = ref<string | null>(iconGroups.value[0] ?? null)
const iconCount = computed(() => Object.values(catalog[activeVariant.value])
    .reduce((count, names) => count + names.length, 0))
const { query, visibleIconCount, visibleIconGroups } = useSearch({
    activeGroup,
    catalog,
    groups: iconGroups,
    variant: activeVariant,
})
const toggleGroup = (group: string): void => {
    activeGroup.value = activeGroup.value === group ? null : group
}

// Sprite delivery and cache-safe URLs.
const deliveryOptions = computed(() => [{
    label: messages.value.fullSprite,
    value: 'full' as const,
}, {
    label: messages.value.groupedSprites,
    value: 'grouped' as const,
}])
const delivery = ref<Delivery>('full')
const groupedSpriteCount = computed(() => activeGroup.value ? 1 : iconGroups.value.length)
const deliverySummary = computed(() => delivery.value === 'full'
    ? messages.value.fullDeliverySummary
    : messages.value.groupedDeliverySummary(groupedSpriteCount.value))
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

// Clipboard interaction and feedback.
const { copiedIcon, copyIconName } = useClipboard(activeVariant)

// Keep dependent UI state consistent when the catalog variant changes.
watch(activeVariant, variant => {
    if (activeGroup.value && !Object.hasOwn(catalog[variant], activeGroup.value)) {
        activeGroup.value = Object.keys(catalog[variant])[0] ?? null
    }
})
</script>

<style module>
.catalog {
    margin-top: 32px;
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

.catalog__search,
.catalog__select {
    display: grid;
    gap: 6px;
    color: var(--vp-c-text-2);
    font-size: 13px;
    font-weight: 600;
}

.catalog__search input,
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

.catalog__search input:focus-visible,
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

.catalog__sets {
    display: grid;
    gap: 24px;
}

.catalog__set {
    display: grid;
    gap: 10px;
}

.catalog__set-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.catalog__set-header h3 {
    margin: 0;
    border: 0;
    padding: 0;
    color: var(--vp-c-text-1);
    font-size: 16px;
    font-weight: 700;
}

.catalog__set-header span {
    color: var(--vp-c-text-3);
    font-size: 12px;
}

.catalog__icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
}

.catalog__icon {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    min-height: 52px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 8px;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg-soft);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.catalog__icon:hover,
.catalog__icon:focus-visible {
    border-color: var(--vp-c-brand-1);
}

.catalog__glyph {
    width: 24px;
    height: 24px;
    color: currentColor;
}

.catalog__name {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.catalog__copy {
    color: var(--vp-c-text-3);
    font-size: 11px;
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

    .catalog__search {
        width: 100%;
    }
}
</style>
