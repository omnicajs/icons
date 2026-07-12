<script setup>
import { computed, ref } from 'vue'
import { iconNames, iconUrl, spriteUrl } from '@omnicajs/icons'

const iconGroups = Object.keys(iconNames)
const activeGroup = ref(iconGroups[0])
const query = ref('')
const copiedIcon = ref('')

const iconCount = Object.values(iconNames).reduce((count, names) => count + names.length, 0)
const activeIconNames = computed(() => {
    const normalizedQuery = query.value.trim().toLowerCase()

    return iconNames[activeGroup.value].filter(name => name.includes(normalizedQuery))
})

const writeToClipboard = async value => {
    try {
        await navigator.clipboard.writeText(value)
    } catch {
        const textarea = document.createElement('textarea')

        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.append(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
    }
}

const copyIconName = async name => {
    const value = `${activeGroup.value}/${name}`

    await writeToClipboard(value)
    copiedIcon.value = value

    window.setTimeout(() => {
        if (copiedIcon.value === value) {
            copiedIcon.value = ''
        }
    }, 1500)
}
</script>

<template>
    <section class="catalog" aria-labelledby="catalog-title">
        <header class="catalog__header">
            <div>
                <h2 id="catalog-title">
                    Icon catalog
                </h2>
                <p>
                    {{ iconGroups.length }} groups, {{ iconCount }} icons.
                    Current sprite: <code>{{ spriteUrl(activeGroup) }}</code>
                </p>
            </div>

            <label class="catalog__search">
                <span>Search icons</span>
                <input v-model="query" type="search" autocomplete="off" placeholder="Type an icon name">
            </label>
        </header>

        <nav class="catalog__groups" aria-label="Icon groups">
            <button
                v-for="group in iconGroups"
                :key="group"
                type="button"
                class="catalog__group"
                :class="{ 'catalog__group_active': group === activeGroup }"
                :aria-pressed="group === activeGroup"
                @click="activeGroup = group"
            >
                {{ group }}
                <span>{{ iconNames[group].length }}</span>
            </button>
        </nav>

        <div class="catalog__icons" aria-live="polite">
            <button
                v-for="name in activeIconNames"
                :key="name"
                type="button"
                class="catalog__icon"
                :title="`Copy ${activeGroup}/${name}`"
                @click="copyIconName(name)"
            >
                <svg class="catalog__glyph" aria-hidden="true">
                    <use :href="iconUrl(activeGroup, name)" />
                </svg>
                <span class="catalog__name">{{ name }}</span>
                <span class="catalog__copy">
                    {{ copiedIcon === `${activeGroup}/${name}` ? 'Copied' : 'Copy' }}
                </span>
            </button>
        </div>

        <p v-if="activeIconNames.length === 0" class="catalog__empty">
            No icons match “{{ query }}”.
        </p>
    </section>
</template>

<style scoped>
.catalog {
    margin-top: 32px;
}

.catalog__header {
    display: flex;
    align-items: end;
    justify-content: space-between;
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

.catalog__header code {
    overflow-wrap: anywhere;
}

.catalog__search {
    display: grid;
    flex: 0 1 360px;
    gap: 6px;
    color: var(--vp-c-text-2);
    font-size: 13px;
    font-weight: 600;
}

.catalog__search input {
    width: 100%;
    height: 40px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 8px;
    padding: 0 12px;
    color: var(--vp-c-text-1);
    background: var(--vp-c-bg-soft);
    font: inherit;
}

.catalog__search input:focus-visible {
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
    border-color: var(--vp-c-brand-1);
    color: var(--vp-c-white);
    background: var(--vp-c-brand-1);
}

.catalog__group_active span {
    color: inherit;
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
    .catalog__header {
        display: grid;
        align-items: start;
    }

    .catalog__search {
        width: 100%;
    }
}
</style>
