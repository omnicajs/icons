import { iconUrl as customIconUrl } from 'virtual:omnicajs-icons'

import { iconUrl as fullIconUrl } from '@omnicajs/icons/filled'
import { iconUrl as groupIconUrl } from '@omnicajs/icons/filled/actions'

const examples = [
    ['Custom subset', customIconUrl('filled', 'actions', 'add')],
    ['Full sprite', fullIconUrl('actions', 'remove')],
    ['Group sprite', groupIconUrl('add')],
] as const

for (const [label, href] of examples) {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')

    icon.setAttribute('aria-label', label)
    icon.setAttribute('viewBox', '0 0 24 24')
    icon.setAttribute('width', '48')
    icon.setAttribute('height', '48')
    icon.style.color = 'rgb(0, 122, 204)'
    use.setAttribute('href', href)
    icon.append(use)
    document.querySelector('#app')?.append(icon)
}

setTimeout(() => {
    const icons = [...document.querySelectorAll('svg')]

    const rendered = icons.every(icon => {
        const bounds = icon.getBBox()

        return bounds.width > 0 && bounds.height > 0
    })

    document.body.dataset.iconsRendered = String(rendered)
    document.body.style.background = rendered ? 'rgb(0, 255, 0)' : 'rgb(255, 0, 0)'
}, 250)

// @ts-expect-error The fixture proves that outlined does not accept a filled-only name.
customIconUrl('outlined', 'actions', 'add')
