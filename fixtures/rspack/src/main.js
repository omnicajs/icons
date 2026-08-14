import { createApp } from 'vue'

import clearCircleUrl from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg?url'

import App from './App.vue'

createApp(App).mount('#app')
document.body.dataset.rawIconUrl = clearCircleUrl
document.body.dataset.newUrlIconUrl = new URL(
    '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg',
    import.meta.url
).href

setTimeout(() => {
    const icons = [...document.querySelectorAll('svg')]
    const rendered = icons.every(icon => {
        const bounds = icon.getBBox()

        return bounds.width > 0 && bounds.height > 0
    })

    document.body.dataset.iconsRendered = String(rendered)
    document.body.style.background = rendered ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)'
}, 250)
