<template>
    <div :class="$style['catalog-search']">
        <label :for="uid + '-term'">{{ t('catalog.search.label') }}</label>
        <input
            :id="uid + '-term'"
            v-model="model"
            type="search"
            autocomplete="off"
            :placeholder="t('catalog.search.placeholder')"
        >
    </div>
</template>

<script lang="ts" setup>
import { useId } from 'vue'

import { useI18n } from '../composables/i18n'

const model = defineModel<string>({ required: true })
const uid = useId()
const { t } = useI18n()
</script>

<style module>
.catalog-search {
    display: grid;
    gap: 6px;
    color: var(--vp-c-text-2);
    font-size: 13px;
    font-weight: 600;
}

.catalog-search input {
    width: 100%;
    height: 40px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 0 12px;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg-soft);
    font: inherit;
}

.catalog-search input:focus-visible {
    border-color: var(--vp-c-brand-1);
    outline: 2px solid var(--vp-c-brand-soft);
}
</style>
