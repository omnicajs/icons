import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { omnicaIcons } from '@omnicajs/icons/vite'

export default defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    plugins: [
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
