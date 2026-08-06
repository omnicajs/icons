<template>
    <section :class="$style['collection']" :aria-labelledby="`${collection}-catalog-title`">
        <header :class="$style['collection__header']">
            <div>
                <h2 :id="`${collection}-catalog-title`">
                    {{ collectionTitles[collection] }}
                </h2>
                <p>
                    {{ t('catalog.collectionSummary', {
                        icons: t('catalog.iconCount', iconNames.length),
                    }) }}
                    {{ t('catalog.spriteSize', {
                        raw: formatSize(spriteSize.bytes),
                        gzip: formatSize(spriteSize.gzipBytes),
                    }) }}
                </p>
            </div>

            <div :class="$style['collection__toolbar']">
                <CatalogSearch v-model="query" />
            </div>
        </header>

        <CatalogGrid
            v-if="visibleIconNames.length > 0"
            :copied-path="copiedIcon"
            :groups="visibleGroups"
            :path-for="iconPath"
            :show-group-headers="false"
            @copy="copyCollectionIcon"
        >
            <template #glyph="{ iconName }">
                <CollectionGlyph :collection="collection" :name="iconName" />
            </template>
        </CatalogGrid>

        <p v-else :class="$style['collection__empty']">
            {{ t('catalog.noMatches', { query }) }}
        </p>
    </section>
</template>

<script lang="ts" setup>
import type { IconCollection } from '../collections'

import { computed } from 'vue'

import manifest from '@omnicajs/icons/manifest'

import CatalogGrid from './CatalogGrid.vue'
import CatalogSearch from './CatalogSearch.vue'
import CollectionGlyph from './CollectionGlyph.vue'

import { collectionCatalog } from '../collections'
import { useClipboard } from '../composables/clipboard'
import { useCollectionSearch } from '../composables/search'
import { useI18n } from '../composables/i18n'

const props = defineProps<{
    collection: IconCollection
}>()

const { t, formatSize } = useI18n()
const collectionTitles = computed<Record<IconCollection, string>>(() => ({
    flags: t('catalog.collections.flags.title'),
    logos: t('catalog.collections.logos.title'),
}))
const iconNames = collectionCatalog[props.collection]
const spriteSize = manifest.collections[props.collection].size
const collectionRef = computed(() => props.collection)
const iconPath = (_group: string, name: string): string => `${props.collection}/${name}`

const { query, visibleIconNames } = useCollectionSearch({
    collection: props.collection,
    names: iconNames,
})
const visibleGroups = computed(() => [{
    name: props.collection,
    names: visibleIconNames.value,
}])
const { copiedIcon, copyIconName } = useClipboard(collectionRef)
const copyCollectionIcon = (_group: string, name: string): Promise<void> => copyIconName(name)
</script>

<style module>
.collection {
    margin-top: 24px;
}

.collection__header {
    display: grid;
    gap: 24px;
    margin-bottom: 24px;
}

.collection__header h2 {
    margin: 0 0 6px;
    border: 0;
    padding: 0;
}

.collection__header p {
    margin: 0;
    color: var(--vp-c-text-2);
}

.collection__toolbar {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) repeat(2, minmax(160px, 220px));
    align-items: end;
    gap: 12px;
}

.collection__empty {
    border: 1px dashed var(--vp-c-divider);
    border-radius: 8px;
    padding: 32px;
    color: var(--vp-c-text-2);
    text-align: center;
}

@media (max-width: 720px) {
    .collection__toolbar {
        grid-template-columns: 1fr;
    }
}
</style>
