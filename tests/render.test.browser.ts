import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const fixtures = ['vite', 'webpack'] as const
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

        test.afterAll(async () => new Promise<void>((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve())
        }))

        test('renders custom, full, and group hashed sprites', async ({ page }) => {
            await page.goto(url)
            await expect(page.locator('body')).toHaveAttribute('data-icons-rendered', 'true')

            const uses = page.locator('use')

            await expect(uses).toHaveCount(3)

            for (const href of await uses.evaluateAll(elements => elements.map(element => element.getAttribute('href')))) {
                expect(href).not.toBeNull()

                const filename = path.basename(new URL(href as string).pathname)

                expect(filename).toMatch(/[-.][A-Za-z0-9_-]{8}\.svg$/)
                expect(href).toMatch(/#actions\/(add|remove)$/)
            }

            const painted = await page.locator('svg').evaluateAll(elements => elements.every(element => {
                const bounds = (element as SVGGraphicsElement).getBBox()

                return bounds.width > 0 && bounds.height > 0
            }))

            expect(painted).toBe(true)
        })
    })
}

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

    test.afterAll(async () => new Promise<void>((resolve, reject) => {
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

    test('detects exact and base browser locales and falls back to en-GB', async ({ browser }) => {
        const cases = [{
            browserLocale: 'es-ES',
            expectedLocale: 'es-ES',
            path: 'es-ES/',
            heading: 'Iconos de OmnicaJS',
            usage: 'Uso',
        }, {
            browserLocale: 'ru',
            expectedLocale: 'ru-RU',
            path: 'ru-RU/',
            heading: 'Иконки OmnicaJS',
            usage: 'Использование',
        }, {
            browserLocale: 'fr-FR',
            expectedLocale: 'en-GB',
            path: '',
            heading: 'OmnicaJS Icons',
            usage: 'Usage',
        }] as const

        for (const localeCase of cases) {
            const context = await browser.newContext({ locale: localeCase.browserLocale })
            const page = await context.newPage()

            await page.goto(url)

            await expect(page).toHaveURL(new URL(localeCase.path, url).toString())
            await expect(page.locator('html')).toHaveAttribute('lang', localeCase.expectedLocale)
            await expect(page.getByRole('heading', { level: 1, name: localeCase.heading })).toBeVisible()
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
