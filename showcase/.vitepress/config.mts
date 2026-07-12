import { defineConfig } from 'vitepress'

const isPagesBuild = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
    title: 'OmnicaJS Icons',
    description: 'Typed SVG icon sprites for OmnicaJS projects.',
    base: isPagesBuild ? '/icons/' : '/',
    cleanUrls: true,
    head: [
        ['meta', { name: 'theme-color', content: '#2563eb' }],
    ],
    themeConfig: {
        nav: [
            { text: 'Icons', link: '/' },
            { text: 'Usage', link: '/usage' },
        ],
        search: {
            provider: 'local',
        },
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
