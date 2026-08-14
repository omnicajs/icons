import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

import { render } from './dist-ssr/ssr.js'

const html = await render()
const hrefs = [...html.matchAll(/<use href="([^"]+)"/g)].map(match => match[1])

assert.equal(hrefs.length, 1)
assert.equal(new Set(hrefs.map(href => href.split('#', 1)[0])).size, 1)
assert.deepEqual(hrefs.map(href => href.split('#', 2)[1]), [
    'filled/actions/clear-circle',
])

const spriteUrl = hrefs[0].split('#', 1)[0]
const spriteFilename = spriteUrl.replace('/icons/', '')
const clientRuntimeFilename = (await fs.readdir(new URL('./dist/assets/', import.meta.url)))
    .find(filename => /^index-.+\.js$/.test(filename))

assert.match(spriteUrl, /^\/icons\/assets\/omnica-icons-imported-[A-Za-z0-9_-]{8}\.svg$/)
assert.ok(await fs.stat(new URL(`./dist/${spriteFilename}`, import.meta.url)))
assert.ok(clientRuntimeFilename, 'Vite client runtime is missing')

const sprite = await fs.readFile(new URL(`./dist/${spriteFilename}`, import.meta.url), 'utf8')
const clientRuntime = await fs.readFile(new URL(`./dist/assets/${clientRuntimeFilename}`, import.meta.url), 'utf8')

assert.match(sprite, /id="filled\/actions\/clear-circle"/)
assert.match(sprite, /id="outlined\/actions\/clear-circle"/)
assert.ok(clientRuntime.includes(spriteUrl), 'Vite client and SSR builds must use the same public sprite URL')
