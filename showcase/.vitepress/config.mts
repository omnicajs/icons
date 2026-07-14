import { defineConfig } from 'vitepress'

const isPagesBuild = process.env.GITHUB_ACTIONS === 'true'
const base = isPagesBuild ? '/icons/' : '/'

export default defineConfig({
    title: 'OmnicaJS Icons',
    description: 'Typed SVG icon sprites for OmnicaJS projects.',
    base,
    cleanUrls: true,
    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}omnica.svg` }],
        ['meta', { name: 'theme-color', content: '#005eeb' }],
    ],
    themeConfig: {
        logo: '/omnica.svg',
        nav: [
            { text: 'Icons', link: '/' },
            { text: 'Usage', link: '/usage' },
        ],
        socialLinks: [
            { icon: 'github', link: 'https://github.com/omnicajs/icons' },
        ],
        footer: {
            message: 'Released under the MIT License.',
        },
    },
    vite: {
        server: {
            allowedHosts: [
                'icons.omnicajs.local',
                'icons.omnicajs.test',
            ],
        },
    },
})
