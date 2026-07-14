import { defineConfig } from '@omnicajs/icons/build'

export default defineConfig({
    outputDirectory: 'fixtures/cli/src/generated/omnica-icons',
    include: {
        filled: {
            actions: ['add', 'remove'],
            alerts: ['warning'],
        },
        outlined: {
            actions: ['add-circle'],
        },
    },
})
