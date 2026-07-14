import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.test.browser.ts',
    outputDir: './artifacts/playwright',
    fullyParallel: false,
    workers: 1,
    reporter: 'line',
    use: {
        headless: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
})
