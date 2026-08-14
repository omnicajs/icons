import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)

for (const fixture of ['webpack', 'rspack']) {
    const { render } = require(`./${fixture}/dist-ssr/ssr.cjs`)
    const html = await render()
    const hrefs = [...html.matchAll(/<use href="([^"]+)"/g)].map(match => match[1])

    assert.equal(hrefs.length, 1, `${fixture} SSR icon count`)
    assert.equal(new Set(hrefs.map(href => href.split('#', 1)[0])).size, 1)
    assert.deepEqual(hrefs.map(href => href.split('#', 2)[1]), [
        'filled/actions/clear-circle',
    ])

    const spriteUrl = hrefs[0].split('#', 1)[0]
    const spriteFilename = spriteUrl.replace('/icons/', '')

    assert.match(spriteUrl, /^\/icons\/assets\/omnica-icons-imported\.[a-f0-9]{8}\.svg$/)
    const spritePath = path.resolve('fixtures', fixture, 'dist', spriteFilename)
    const sprite = await fs.readFile(spritePath, 'utf8')

    assert.match(sprite, /id="filled\/actions\/clear-circle"/)
    assert.match(sprite, /id="outlined\/actions\/clear-circle"/)
}
