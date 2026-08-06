<template>
    <div :class="$style['showcase']">
        <div
            :class="$style['showcase__tabs']"
            role="tablist"
            :aria-label="t('catalog.sections.label')"
        >
            <button
                v-for="(section, index) in sections"
                :id="`catalog-tab-${section}`"
                :key="section"
                type="button"
                role="tab"
                :aria-controls="`catalog-panel-${section}`"
                :aria-selected="activeSection === section"
                :tabindex="activeSection === section ? 0 : -1"
                :class="{
                    [$style['showcase__tab']]: true,
                    [$style['showcase__tab_active']]: activeSection === section,
                }"
                @click="activeSection = section"
                @keydown="handleTabKeydown($event, index)"
            >
                {{ sectionLabels[section] }}
            </button>
        </div>

        <div
            :id="`catalog-panel-${activeSection}`"
            role="tabpanel"
            :aria-labelledby="`catalog-tab-${activeSection}`"
        >
            <IconShowcase v-if="activeSection === 'icons'" />
            <CollectionShowcase v-else-if="activeSection === 'logos'" collection="logos" />
            <CollectionShowcase v-else collection="flags" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import type { IconCollection } from '../collections'

import { computed, nextTick, ref } from 'vue'

import CollectionShowcase from './CollectionShowcase.vue'
import IconShowcase from './IconShowcase.vue'

import { collectionNames } from '../collections'
import { useI18n } from '../composables/i18n'

type CatalogSection = 'icons' | IconCollection

const sections: readonly CatalogSection[] = ['icons', ...collectionNames]
const activeSection = ref<CatalogSection>('icons')
const { t } = useI18n()
const sectionLabels = computed<Record<CatalogSection, string>>(() => ({
    flags: t('catalog.sections.flags'),
    icons: t('catalog.sections.icons'),
    logos: t('catalog.sections.logos'),
}))

const focusSection = async (index: number): Promise<void> => {
    const section = sections[(index + sections.length) % sections.length]

    activeSection.value = section
    await nextTick()
    document.getElementById(`catalog-tab-${section}`)?.focus()
}

const handleTabKeydown = (event: KeyboardEvent, index: number): void => {
    const targetIndex = event.key === 'ArrowLeft'
        ? index - 1
        : event.key === 'ArrowRight'
            ? index + 1
            : event.key === 'Home'
                ? 0
                : event.key === 'End'
                    ? sections.length - 1
                    : null

    if (targetIndex === null) {
        return
    }

    event.preventDefault()
    void focusSection(targetIndex)
}
</script>

<style module>
.showcase {
    margin-top: 32px;
}

.showcase__tabs {
    display: inline-flex;
    gap: 4px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 10px;
    padding: 4px;
    background: var(--vp-c-bg-soft);
}

.showcase__tab {
    min-height: 36px;
    border: 0;
    border-radius: 7px;
    padding: 0 14px;
    color: var(--vp-c-text-2);
    background: transparent;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
}

.showcase__tab:hover,
.showcase__tab:focus-visible {
    color: var(--vp-c-brand-1);
}

.showcase__tab:focus-visible {
    outline: 2px solid var(--vp-c-brand-soft);
}

.showcase__tab_active {
    color: var(--vp-button-brand-text);
    background: var(--vp-button-brand-bg);
}

.showcase__tab_active:hover,
.showcase__tab_active:focus-visible {
    color: var(--vp-button-brand-text);
}
</style>
