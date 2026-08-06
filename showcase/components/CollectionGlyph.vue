<template>
    <svg aria-hidden="true">
        <use :href="href" />
    </svg>
</template>

<script lang="ts" setup>
import type { IconCollection } from '../collections'

import { computed } from 'vue'

import { collectionIconUrl } from '../collections'
import { withShowcaseCacheKey } from '../sprite-url'

const props = defineProps<{
    collection: IconCollection
    name: string
}>()

const href = computed(() => withShowcaseCacheKey(collectionIconUrl(props.collection, props.name)))
</script>
