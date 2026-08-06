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

import { withShowcaseCacheKey } from '../sprite-url'

type DynamicIconUrl = (variant: IconVariant, group: string, name: string) => string

const props = defineProps<{
    grouped: boolean
    variant: IconVariant
    group: string
    name: string
}>()

const resolveIconUrl = iconUrl as DynamicIconUrl
const resolveGroupIconUrl = groupIconUrl as DynamicIconUrl

const href = computed(() => withShowcaseCacheKey(props.grouped
    ? resolveGroupIconUrl(props.variant, props.group, props.name)
    : resolveIconUrl(props.variant, props.group, props.name)))
</script>
