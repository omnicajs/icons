<script setup lang="ts">
import IconClearCircle from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg'

const iconName = 'filled/actions/clear-circle'
</script>

<template>
    <span class="import-driven-example">
        <IconClearCircle
            data-showcase-imported-icon="clear-circle"
            width="32"
            height="32"
            aria-hidden="true"
        />
        <code>{{ iconName }}</code>
    </span>
</template>

<style scoped>
.import-driven-example {
    display: inline-flex;
    gap: 12px;
    align-items: center;
    color: var(--vp-c-brand-1);
}
</style>
