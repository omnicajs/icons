import fs from 'node:fs/promises'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

import { createServer } from 'vite'
import { expect, test } from '@playwright/test'
import vue from '@vitejs/plugin-vue'

import { omnicaIconComponents } from '../dist/vite.js'

const fixtures = ['vite', 'webpack', 'rspack'] as const
const legacyFixtures = new Set<typeof fixtures[number]>(['vite', 'webpack'])
const contentTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
}

const serve = async (directory: string): Promise<http.Server> => {
    const root = path.resolve(directory)
    const server = http.createServer(async (request, response) => {
        try {
            const requestPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
            const relativePath = requestPath === '/icons' || requestPath.startsWith('/icons/')
                ? requestPath.slice('/icons'.length) || '/'
                : requestPath
            const assetPath = relativePath === '/'
                ? '/index.html'
                : relativePath.endsWith('/')
                    ? `${relativePath}index.html`
                    : relativePath
            let filename = path.resolve(root, `.${assetPath}`)

            if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
                response.writeHead(403).end()

                return
            }

            let source: Buffer

            try {
                source = await fs.readFile(filename)
            } catch (error) {
                if (path.extname(filename)) {
                    throw error
                }

                filename = `${filename}.html`
                source = await fs.readFile(filename)
            }

            response.writeHead(200, {
                'Content-Type': contentTypes[path.extname(filename)] ?? 'application/octet-stream',
            })
            response.end(source)
        } catch {
            response.writeHead(404).end()
        }
    })

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', resolve)
    })

    return server
}

for (const fixture of fixtures) {
    test.describe(fixture, () => {
        let server: http.Server
        let url: string

        test.beforeAll(async () => {
            server = await serve(`fixtures/${fixture}/dist`)
            const address = server.address()

            if (!address || typeof address === 'string') {
                throw new Error(`Unable to resolve ${fixture} server address`)
            }

            url = `http://127.0.0.1:${address.port}/`
        })

        test.afterAll(() => new Promise<void>((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve())
        }))

        test('renders custom, full, and group hashed sprites', async ({ page }) => {
            test.skip(!legacyFixtures.has(fixture), 'Rspack fixture covers import-driven icons only.')

            await page.goto(url)
            await expect(page.locator('body')).toHaveAttribute('data-icons-rendered', 'true')

            const legacyRoot = '#legacy-icons '
            const uses = page.locator(`${legacyRoot}use`)

            await expect(uses).toHaveCount(3)

            for (const href of await uses.evaluateAll(elements => elements.map(element => element.getAttribute('href')))) {
                expect(href).not.toBeNull()

                const filename = path.basename(new URL(href as string, url).pathname)

                expect(filename).toMatch(/[-.][A-Za-z0-9_-]{8}\.svg$/)
                expect(href).toMatch(/#actions\/(add|remove)$/)
            }

            const painted = await page.locator(`${legacyRoot}svg`).evaluateAll(elements => elements.every(element => {
                const bounds = (element as SVGGraphicsElement).getBBox()

                return bounds.width > 0 && bounds.height > 0
            }))

            expect(painted).toBe(true)
        })

        test('renders imported Vue icons from one combined sprite', async ({ page }) => {
            await page.goto(url)
            await expect(page.locator('body')).toHaveAttribute('data-icons-rendered', 'true')

            const icons = page.locator('[data-imported-icon]')
            const uses = icons.locator('use')

            await expect(icons).toHaveCount(2)
            await expect(uses).toHaveCount(2)
            await expect(icons.first()).toHaveAttribute('viewBox', '0 0 24 24')
            await expect(icons.first()).toHaveAttribute('width', '48')
            await expect(icons.first()).toHaveClass(/\bimported-icon--filled\b/)
            await expect(icons.first()).toHaveAttribute('aria-hidden', 'true')
            await expect(icons.last()).toHaveAttribute('aria-label', 'Outlined clear circle')
            await expect(icons.last()).toHaveAttribute('role', 'img')

            const hrefs = await uses.evaluateAll(elements => elements.map(element => element.getAttribute('href')))
            const spriteUrls = hrefs.map(href => {
                expect(href).not.toBeNull()

                return new URL(href as string, url)
            })

            expect(spriteUrls.map(sprite => sprite.hash)).toEqual([
                '#filled/actions/clear-circle',
                '#outlined/actions/clear-circle',
            ])
            expect(new Set(spriteUrls.map(sprite => sprite.pathname)).size).toBe(1)
            expect(path.basename(spriteUrls[0].pathname)).toMatch(/^omnica-icons-imported[-.][A-Za-z0-9_-]{8}\.svg$/)

            const symbolIds = await page.evaluate(async spriteUrl => {
                const source = await fetch(spriteUrl).then(response => response.text())

                return [...source.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(match => match[1])
            }, spriteUrls[0].href)

            expect(symbolIds).toEqual([
                'filled/actions/clear-circle',
                'outlined/actions/clear-circle',
            ])

            const templateAsset = page.locator('[data-template-asset="clear-circle-small"]')

            await expect(templateAsset).toHaveJSProperty('complete', true)
            await expect.poll(() => templateAsset.evaluate(element => (
                (element as HTMLImageElement).naturalWidth > 0
            ))).toBe(true)
            expect(await templateAsset.getAttribute('src')).not.toContain('#')

            const rendered = await icons.evaluateAll(elements => elements.every(element => {
                const bounds = (element as SVGGraphicsElement).getBBox()

                return bounds.width > 0
                    && bounds.height > 0
                    && getComputedStyle(element).color === 'rgb(0, 122, 204)'
            }))

            expect(rendered).toBe(true)

            const rawIconUrl = await page.locator('body').getAttribute('data-raw-icon-url')

            if (!rawIconUrl) {
                throw new Error(`${fixture} raw icon URL is missing`)
            }

            expect(new URL(rawIconUrl, url).pathname).not.toBe(spriteUrls[0].pathname)
            await expect.poll(() => page.evaluate(rawUrl => (
                fetch(rawUrl).then(response => response.text())
            ), rawIconUrl)).toMatch(/^<svg\b/)

            if (fixture !== 'vite') {
                const newUrlIconUrl = await page.locator('body').getAttribute('data-new-url-icon-url')

                if (!newUrlIconUrl) {
                    throw new Error(`${fixture} new URL icon asset is missing`)
                }

                expect(new URL(newUrlIconUrl, url).pathname).not.toBe(spriteUrls[0].pathname)
                await expect.poll(() => page.evaluate(assetUrl => (
                    fetch(assetUrl).then(response => response.text())
                ), newUrlIconUrl)).toMatch(/^<svg\b/)
            }
        })
    })
}

test.describe('vite development server', () => {
    let appFilename: string
    let directory: string
    let server: Awaited<ReturnType<typeof createServer>>
    let url: string

    const appSource = (variant: 'filled' | 'outlined'): string => `<script setup>
import Icon from '@omnicajs/icons/assets/icons/${variant}/actions/${variant === 'filled' ? 'clear-circle' : 'add-circle'}.svg'
</script>

<template>
    <Icon data-imported-icon="${variant}" width="48" height="48" />
</template>
`

    test.beforeAll(async () => {
        directory = await fs.mkdtemp(path.join(os.tmpdir(), 'omnica-icons-vite-dev-'))
        appFilename = path.join(directory, 'App.vue')

        await Promise.all([
            fs.writeFile(path.join(directory, 'index.html'), '<div id="app"></div><script type="module" src="/main.js"></script>'),
            fs.writeFile(path.join(directory, 'main.js'), 'import { createApp } from \'vue\'; import App from \'./App.vue\'; createApp(App).mount(\'#app\')'),
            fs.writeFile(appFilename, appSource('filled')),
        ])

        server = await createServer({
            base: '/dev/',
            configFile: false,
            root: directory,
            plugins: [omnicaIconComponents(), vue()],
            resolve: {
                alias: {
                    vue: path.resolve('node_modules/vue/dist/vue.esm-bundler.js'),
                },
            },
            server: {
                host: '127.0.0.1',
                port: 0,
            },
        })
        await server.listen()

        const address = server.httpServer?.address()

        if (!address || typeof address === 'string') {
            throw new Error('Unable to resolve Vite development server address')
        }

        url = `http://127.0.0.1:${address.port}/dev/`
    })

    test.afterAll(async () => {
        await server.close()
        await fs.rm(directory, { force: true, recursive: true })
    })

    test('updates an imported icon without retaining the removed symbol', async ({ browserName, page }) => {
        test.skip(browserName !== 'chromium', 'One engine is sufficient for the Vite HMR contract.')

        await page.goto(url)

        const initialIcon = page.locator('[data-imported-icon="filled"]')

        await expect(initialIcon).toBeVisible()

        const initialHref = await initialIcon.locator('use').getAttribute('href')

        expect(initialHref).toMatch(/^\/dev\/@omnicajs\/icons\/imported\/[a-f0-9]{16}\.svg#filled\/actions\/clear-circle$/)

        await fs.writeFile(appFilename, appSource('outlined'))

        const updatedIcon = page.locator('[data-imported-icon="outlined"]')

        await expect(updatedIcon).toBeVisible()

        const updatedHref = await updatedIcon.locator('use').getAttribute('href')

        if (!updatedHref) {
            throw new Error('Updated Vite icon href is missing')
        }

        expect(updatedHref).toMatch(/^\/dev\/@omnicajs\/icons\/imported\/[a-f0-9]{16}\.svg#outlined\/actions\/add-circle$/)
        expect(updatedHref).not.toBe(initialHref)

        const symbols = await page.evaluate(async href => {
            const sprite = await fetch(href).then(response => response.text())

            return [...sprite.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(match => match[1])
        }, updatedHref)

        expect(symbols).toEqual(['outlined/actions/add-circle'])
    })
})

test.describe('showcase catalog', () => {
    let server: http.Server
    let url: string

    test.beforeAll(async () => {
        server = await serve('showcase/.vitepress/dist')
        const address = server.address()

        if (!address || typeof address === 'string') {
            throw new Error('Unable to resolve showcase server address')
        }

        const index = await fs.readFile('showcase/.vitepress/dist/index.html', 'utf8')
        const base = index.match(/<script type="module" src="(\/.*?)assets\//)?.[1] ?? '/'

        url = `http://127.0.0.1:${address.port}${base}`
    })

    test.afterAll(() => new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve())
    }))

    test('orders controls and toggles between one and all grouped sections', async ({ page }) => {
        await page.goto(url)

        const search = page.getByRole('searchbox', { name: 'Search icons' })
        const style = page.getByRole('combobox', { name: 'Style' })
        const spriteDelivery = page.getByRole('combobox', { name: 'Sprite delivery' })

        await expect(search).toBeVisible()
        await expect(style).toHaveValue('filled')
        await expect(spriteDelivery).toHaveValue('full')

        const [searchBox, styleBox, spriteDeliveryBox] = await Promise.all([
            search.boundingBox(),
            style.boundingBox(),
            spriteDelivery.boundingBox(),
        ])

        if (!searchBox || !styleBox || !spriteDeliveryBox) {
            throw new Error('Unable to resolve catalog toolbar layout')
        }

        expect(searchBox.x).toBeLessThan(styleBox.x)
        expect(styleBox.x).toBeLessThan(spriteDeliveryBox.x)

        const actions = page.getByRole('button', { name: /^actions \d+$/ })

        await expect(actions).toHaveAttribute('aria-pressed', 'true')
        await expect(page.getByRole('region', { name: 'actions' })).toBeVisible()
        await expect(page.getByRole('region', { name: 'alerts' })).toHaveCount(0)

        const firstIcon = page.getByRole('region', { name: 'actions' }).getByRole('button').first()

        await firstIcon.click()
        await expect(firstIcon).toContainText('Copied')

        await actions.click()

        await expect(actions).toHaveAttribute('aria-pressed', 'false')
        await expect(page.getByRole('region', { name: 'actions' })).toBeVisible()
        await expect(page.getByRole('region', { name: 'alerts' })).toBeVisible()

        const firstGlyph = page.getByRole('region', { name: 'actions' }).locator('use').first()
        const fullHref = await firstGlyph.getAttribute('href')

        if (!fullHref) {
            throw new Error('Full sprite glyph URL is missing')
        }

        await spriteDelivery.selectOption('grouped')

        await expect(firstGlyph).not.toHaveAttribute('href', fullHref)

        const groupedHref = await firstGlyph.getAttribute('href')

        if (!groupedHref) {
            throw new Error('Grouped sprite glyph URL is missing')
        }

        expect(fullHref).toMatch(/#actions\//)
        expect(groupedHref).toMatch(/#actions\//)

        await search.fill('folder labeled')

        await expect(page.getByRole('region', { name: 'files' })).toBeVisible()
        await expect(page.getByRole('button', { name: /folder-text/ })).toBeVisible()

        await search.fill('')

        await style.selectOption('outlined')

        await expect(style).toHaveValue('outlined')
        await expect(spriteDelivery).toHaveValue('grouped')
        await expect(page.getByText(/Current delivery: \d+ grouped sprites\./)).toBeVisible()

        await search.fill('__missing_icon__')

        await expect(page.getByText('No icons match “__missing_icon__”.')).toBeVisible()
        await expect(page.getByRole('region', { name: 'actions' })).toHaveCount(0)
    })

    test('shows logos and flags as separate full-color collections', async ({ page }) => {
        await page.goto(url)

        const iconsTab = page.getByRole('tab', { name: 'Icons' })
        const logosTab = page.getByRole('tab', { name: 'Logos' })
        const flagsTab = page.getByRole('tab', { name: 'Flags' })
        const iconSearchBox = await page.getByRole('searchbox', { name: 'Search icons' }).boundingBox()

        if (!iconSearchBox) {
            throw new Error('Unable to resolve icon search layout')
        }

        await expect(iconsTab).toHaveAttribute('aria-selected', 'true')
        await iconsTab.focus()
        await page.keyboard.press('ArrowRight')

        await expect(logosTab).toHaveAttribute('aria-selected', 'true')
        await expect(logosTab).toBeFocused()
        await expect(page.getByRole('heading', { level: 2, name: 'Logo catalog' })).toBeVisible()
        await expect(page.getByRole('combobox', { name: 'Style' })).toHaveCount(0)
        await expect(page.getByRole('combobox', { name: 'Sprite delivery' })).toHaveCount(0)

        let search = page.getByRole('searchbox', { name: 'Search icons' })
        const logoSearchBox = await search.boundingBox()

        if (!logoSearchBox) {
            throw new Error('Unable to resolve logo search layout')
        }

        expect(Math.abs(logoSearchBox.x - iconSearchBox.x)).toBeLessThan(1)
        expect(Math.abs(logoSearchBox.width - iconSearchBox.width)).toBeLessThan(1)

        await search.fill('Fb+Insta')

        const facebookInstagram = page.getByRole('button', { name: /facebook-instagram/ })
        const logoGlyph = facebookInstagram.locator('use')

        await expect(facebookInstagram).toBeVisible()
        await expect(logoGlyph).toHaveAttribute('href', /logos[^/]*\.svg#logos\/facebook-instagram$/)
        expect(await logoGlyph.evaluate(element => {
            const svg = (element as SVGUseElement).ownerSVGElement

            if (!svg) {
                return false
            }

            const bounds = svg.getBBox()

            return bounds.width > 0 && bounds.height > 0
        })).toBe(true)

        await facebookInstagram.click()
        await expect(facebookInstagram).toContainText('Copied')

        await flagsTab.click()

        await expect(flagsTab).toHaveAttribute('aria-selected', 'true')
        await expect(page.getByRole('heading', { level: 2, name: 'Flag catalog' })).toBeVisible()

        search = page.getByRole('searchbox', { name: 'Search icons' })
        await expect(search).toHaveValue('')
        await search.fill('United States of America')

        const unitedStates = page.getByRole('button', { name: /united-states/ })

        await expect(unitedStates).toBeVisible()
        await expect(unitedStates.locator('use'))
            .toHaveAttribute('href', /flags[^/]*\.svg#flags\/united-states$/)

        await iconsTab.click()

        await expect(iconsTab).toHaveAttribute('aria-selected', 'true')
        await expect(page.getByRole('button', { name: /^actions \d+$/ })).toBeVisible()
    })

    test('renders newly imported icon shapes from the full sprite', async ({ page }) => {
        const importedIcons: readonly {
            group: string
            name: string
            expectedSize?: number
        }[] = [{
            group: 'actions',
            name: 'badge-recommendation',
        }, {
            group: 'actions',
            name: 'clear-circle',
            expectedSize: 20,
        }, {
            group: 'actions',
            name: 'clear-circle-small',
            expectedSize: 16,
        }, {
            group: 'commerce',
            name: 'shopping-cart-sale',
        }, {
            group: 'layout',
            name: 'browser-window-close',
        }, {
            group: 'layout',
            name: 'browser-window-in',
        }, {
            group: 'navigation',
            name: 'exit',
        }, {
            group: 'navigation',
            name: 'menu-squares',
        }]

        await page.goto(url)
        await page.getByRole('button', { name: /^actions \d+$/ }).click()

        const search = page.getByRole('searchbox', { name: 'Search icons' })

        for (const icon of importedIcons) {
            await test.step(`${icon.group}/${icon.name}`, async () => {
                await search.fill(icon.name)

                const iconButton = page
                    .getByRole('region', { name: icon.group })
                    .getByRole('button', { name: `${icon.name} Copy`, exact: true })
                const glyph = iconButton.locator('use')
                const readBounds = () => glyph.evaluate(element => {
                    const svg = (element as SVGUseElement).ownerSVGElement

                    if (!svg) {
                        return null
                    }

                    const bounds = svg.getBBox()

                    return {
                        height: bounds.height,
                        width: bounds.width,
                    }
                })

                await expect(iconButton).toBeVisible()
                await expect(glyph).toHaveAttribute('href', new RegExp(`#${icon.group}/${icon.name}$`))

                if (icon.expectedSize === undefined) {
                    await expect.poll(async () => {
                        const bounds = await readBounds()

                        return bounds !== null && bounds.width > 0 && bounds.height > 0
                    }, {
                        message: `Expected ${icon.group}/${icon.name} to render non-empty bounds`,
                    }).toBe(true)
                } else {
                    await expect.poll(readBounds, {
                        message: `Expected ${icon.group}/${icon.name} to render ${icon.expectedSize}x${icon.expectedSize} bounds`,
                    }).toEqual({
                        height: icon.expectedSize,
                        width: icon.expectedSize,
                    })
                }
            })
        }
    })

    test('shows npm in the navigation and package installation on the usage page', async ({ page }) => {
        await page.goto(url)

        const githubLink = page.getByRole('link', { name: 'GitHub', exact: true })
        const npmLink = page.getByRole('link', { name: 'npm', exact: true })
        const [githubBox, npmBox] = await Promise.all([
            githubLink.boundingBox(),
            npmLink.boundingBox(),
        ])

        if (!githubBox || !npmBox) {
            throw new Error('Unable to resolve social link layout')
        }

        await expect(npmLink.locator('svg')).toBeVisible()
        await expect(npmLink).toHaveAttribute('href', 'https://www.npmjs.com/package/@omnicajs/icons')
        expect(npmBox.width).toBe(githubBox.width)
        expect(npmBox.height).toBe(githubBox.height)

        await page.goto(new URL('usage', url).toString())

        const badge = page.getByRole('link', {
            name: '@omnicajs/icons on npm',
        })
        const installationHeading = page.getByRole('heading', { level: 2, name: 'Installation' })
        const [badgeBox, installationHeadingBox] = await Promise.all([
            badge.boundingBox(),
            installationHeading.boundingBox(),
        ])

        if (!badgeBox || !installationHeadingBox) {
            throw new Error('Unable to resolve installation section layout')
        }

        await expect(badge).toBeVisible()
        expect(badgeBox.y).toBeGreaterThan(installationHeadingBox.y)
        await expect(badge).toHaveAttribute('href', 'https://www.npmjs.com/package/@omnicajs/icons')
        await expect(badge.locator('img')).toHaveAttribute(
            'src',
            'https://img.shields.io/npm/v/%40omnicajs%2Ficons?logo=npm'
        )
        await expect(installationHeading).toBeVisible()
        await expect(page.getByText('yarn add @omnicajs/icons', { exact: true })).toBeVisible()
        await expect(page.getByText('npm install @omnicajs/icons', { exact: true })).toBeAttached()
        await expect(page.getByText('pnpm add @omnicajs/icons', { exact: true })).toBeAttached()

        const importedIcon = page.locator('[data-showcase-imported-icon="clear-circle"]')
        const importedUse = importedIcon.locator('use')

        await expect(importedIcon).toBeVisible()
        await expect(importedUse).toHaveAttribute('href', /#filled\/actions\/clear-circle$/)
        await expect.poll(() => importedIcon.evaluate(element => {
            const bounds = (element as SVGGraphicsElement).getBBox()

            return bounds.width > 0 && bounds.height > 0
        })).toBe(true)
    })

    test('applies the Omnica palette in light and dark themes', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' })
        await page.goto(url)

        const primaryColor = () => page.locator('html').evaluate(element =>
            getComputedStyle(element).getPropertyValue('--vp-c-indigo-1').trim())

        await expect.poll(primaryColor).toBe('#005EEB')

        await page.getByRole('switch', { name: 'Switch to dark theme' }).click()

        await expect.poll(primaryColor).toBe('#6CADFF')
    })

    test('detects exact and base browser locales and falls back to en-GB', async ({ browser }) => {
        const cases = [{
            browserLocale: 'es-ES',
            expectedLocale: 'es-ES',
            path: 'es-ES/',
            heading: 'Iconos de OmnicaJS',
            usage: 'Uso',
            catalog: 'Catálogo de iconos',
            search: 'Buscar iconos',
        }, {
            browserLocale: 'ru',
            expectedLocale: 'ru-RU',
            path: 'ru-RU/',
            heading: 'Иконки OmnicaJS',
            usage: 'Использование',
            catalog: 'Каталог иконок',
            search: 'Поиск иконок',
        }, {
            browserLocale: 'fr-FR',
            expectedLocale: 'en-GB',
            path: '',
            heading: 'OmnicaJS Icons',
            usage: 'Usage',
            catalog: 'Icon catalog',
            search: 'Search icons',
        }] as const

        for (const localeCase of cases) {
            const context = await browser.newContext({ locale: localeCase.browserLocale })
            const page = await context.newPage()

            await page.goto(url)

            await expect(page).toHaveURL(new URL(localeCase.path, url).toString())
            await expect(page.locator('html')).toHaveAttribute('lang', localeCase.expectedLocale)
            await expect(page.getByRole('heading', { level: 1, name: localeCase.heading })).toBeVisible()
            await expect(page.getByRole('heading', { level: 2, name: localeCase.catalog })).toBeVisible()
            await expect(page.getByRole('searchbox', { name: localeCase.search })).toBeVisible()
            await expect(page.getByRole('link', { name: localeCase.usage, exact: true })).toBeVisible()

            if (localeCase.expectedLocale === 'es-ES') {
                await page.goto(url)

                await expect(page).toHaveURL(url)
                await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
            }

            await context.close()
        }
    })
})
