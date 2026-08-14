import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { omnicaIconComponents, omnicaIcons } from '@omnicajs/icons/vite'

export default defineConfig({
    base: '/icons/',
    root: fileURLToPath(new URL('.', import.meta.url)),
    plugins: [
        omnicaIconComponents(),
        vue(),
        omnicaIcons({
            declarationFile: fileURLToPath(new URL('./src/omnica-icons.d.ts', import.meta.url)),
            include: {
                filled: {
                    actions: ['add', 'remove'],
                },
                outlined: {
                    actions: ['add-circle'],
                },
            },
        }),
    ],
})
