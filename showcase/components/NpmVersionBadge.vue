<template>
    <a
        :class="$style['npm-version']"
        :href="packageUrl"
        target="_blank"
        rel="noreferrer"
        :aria-label="linkLabel"
    >
        <img :src="badgeUrl" :alt="badgeAlt">
    </a>
</template>

<script lang="ts" setup>
const packageUrl = 'https://www.npmjs.com/package/@omnicajs/icons'
const badgeUrl = 'https://img.shields.io/npm/v/%40omnicajs%2Ficons?logo=npm'
const linkLabel = '@omnicajs/icons on npm'
const badgeAlt = 'npm version'
</script>

<style module>
.npm-version {
    display: inline-flex;
    line-height: 0;
}

.npm-version:focus-visible {
    border-radius: 4px;
    outline: 2px solid var(--vp-c-brand-soft);
}

.npm-version img {
    display: block;
}
</style>
