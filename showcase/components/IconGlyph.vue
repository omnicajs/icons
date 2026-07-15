<template>
    <svg aria-hidden="true">
        <use :href="href" />
    </svg>
</template>

<script lang="ts" setup>
import type { IconVariant } from '@omnicajs/icons'

import { computed } from 'vue'

import { iconUrl as groupIconUrl } from '@omnicajs/icons/groups'
import { iconUrl } from '@omnicajs/icons'

type DynamicIconUrl = (variant: IconVariant, group: string, name: string) => string

const props = defineProps<{
    grouped: boolean
    variant: IconVariant
    group: string
    name: string
}>()

const resolveIconUrl = iconUrl as DynamicIconUrl
const resolveGroupIconUrl = groupIconUrl as DynamicIconUrl
// Keep one key for every glyph rendered during the current page lifetime.
const spriteCacheKey = import.meta.env.DEV
    ? Math.trunc(performance.timeOrigin).toString(36)
    : ''

const addCacheKey = (url: string): string => {
    if (!spriteCacheKey) {
        return url
    }

    const [assetUrl, fragment] = url.split('#', 2)
    const separator = assetUrl.includes('?') ? '&' : '?'

    return `${assetUrl}${separator}v=${spriteCacheKey}${fragment ? `#${fragment}` : ''}`
}

const href = computed(() => addCacheKey(props.grouped
    ? resolveGroupIconUrl(props.variant, props.group, props.name)
    : resolveIconUrl(props.variant, props.group, props.name)))
</script>
