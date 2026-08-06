<template>
    <div :class="$style['catalog-grid']" aria-live="polite">
        <section
            v-for="group in groups"
            :key="group.name"
            :class="$style['catalog-grid__set']"
            :aria-label="showGroupHeaders ? undefined : group.name"
            :aria-labelledby="showGroupHeaders ? `catalog-group-${group.name}` : undefined"
        >
            <header v-if="showGroupHeaders" :class="$style['catalog-grid__set-header']">
                <h3 :id="`catalog-group-${group.name}`">
                    {{ group.name }}
                </h3>
                <span>{{ group.names.length }}</span>
            </header>

            <div :class="$style['catalog-grid__icons']">
                <button
                    v-for="name in group.names"
                    :key="name"
                    type="button"
                    :class="$style['catalog-grid__icon']"
                    :title="t('catalog.copy.title', { path: pathFor(group.name, name) })"
                    @click="emit('copy', group.name, name)"
                >
                    <slot name="glyph" :group="group.name" :icon-name="name" />
                    <span :class="$style['catalog-grid__name']">{{ name }}</span>
                    <span :class="$style['catalog-grid__copy']">
                        {{ copiedPath === pathFor(group.name, name)
                            ? t('catalog.copy.done')
                            : t('catalog.copy.action') }}
                    </span>
                </button>
            </div>
        </section>
    </div>
</template>

<script lang="ts" setup>
import type { VisibleIconGroup } from '../composables/search'

import { useI18n } from '../composables/i18n'

withDefaults(defineProps<{
    copiedPath: string
    groups: readonly VisibleIconGroup[]
    pathFor: (group: string, name: string) => string
    showGroupHeaders?: boolean
}>(), {
    showGroupHeaders: true,
})

const emit = defineEmits<{
    copy: [group: string, name: string]
}>()

const { t } = useI18n()
</script>

<style module>
.catalog-grid {
    display: grid;
    gap: 24px;
}

.catalog-grid__set {
    display: grid;
    gap: 10px;
}

.catalog-grid__set-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
}

.catalog-grid__set-header h3 {
    margin: 0;
    border: 0;
    padding: 0;
    color: var(--vp-c-text-1);
    font-size: 16px;
    font-weight: 700;
}

.catalog-grid__set-header span {
    color: var(--vp-c-text-3);
    font-size: 12px;
}

.catalog-grid__icons {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 8px;
}

.catalog-grid__icon {
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

.catalog-grid__icon:hover,
.catalog-grid__icon:focus-visible {
    border-color: var(--vp-c-brand-1);
}

.catalog-grid__icon :global(svg) {
    width: 24px;
    height: 24px;
    color: currentColor;
}

.catalog-grid__name {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.catalog-grid__copy {
    color: var(--vp-c-text-3);
    font-size: 11px;
}
</style>
