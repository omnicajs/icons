import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const iconsDirectory = path.join(rootDirectory, 'assets/icons')
const migrationFile = path.join(rootDirectory, 'metadata/migrations/groups-v1.json')
const applyMigration = process.argv.includes('--apply')
const canonicalSourceByDestination = new Map([
    [
        'assets/icons/filled/calendar/calendar-add.svg',
        'assets/icons/ui/calendar-add.svg',
    ],
])

const startsWithAny = (name, prefixes) => prefixes.some(prefix => name.startsWith(prefix))
const isOneOf = (name, names) => names.includes(name)

const classifyActions = name => {
    if (startsWithAny(name, ['appointment', 'calendar']) || isOneOf(name, ['date-range', 'event'])) {
        return 'calendar'
    }

    if (
        startsWithAny(name, ['time-', 'timer', 'watch-later'])
        || isOneOf(name, ['history', 'remaining-time', 'snooze', 'time'])
    ) {
        return 'time'
    }

    if (startsWithAny(name, ['discount', 'label', 'labels', 'shopping-']) || name === 'subscribe') {
        return 'commerce'
    }

    if (
        startsWithAny(name, [
            'browser-window',
            'carousel-',
            'collapse-all',
            'column-view',
            'exit-fullscreen',
            'expand-all',
        ])
        || isOneOf(name, [
            'layout',
            'minimize',
            'pages',
            'rounded-corners',
            'straight-corners',
            'tab',
            'tabs',
        ])
    ) {
        return 'layout'
    }

    if (startsWithAny(name, ['open-in-new', 'page-']) || name === 'move-page') {
        return 'navigation'
    }

    return 'actions'
}

const classifyUi = name => {
    if (name.startsWith('alarm')) {
        return 'time'
    }

    if (name.startsWith('calendar')) {
        return 'calendar'
    }

    if (startsWithAny(name, ['eye', 'lock', 'password']) || name === 'blocked') {
        return 'security'
    }

    if (
        startsWithAny(name, ['list-bulleted', 'list-numbered', 'list-points'])
        || isOneOf(name, ['justified', 'subscript', 'superscript'])
    ) {
        return 'text'
    }

    if (
        startsWithAny(name, ['category', 'filter', 'toggle'])
        || isOneOf(name, ['expand-text-area', 'figma-properties', 'select-all', 'text-field'])
    ) {
        return 'forms'
    }

    if (startsWithAny(name, ['flow-', 'integrations'])) {
        return 'development'
    }

    if (startsWithAny(name, ['attachment', 'new-message'])) {
        return 'communication'
    }

    if (
        startsWithAny(name, ['explore', 'home', 'launch', 'menu-', 'more-'])
        || isOneOf(name, ['lifebuoy', 'menu'])
    ) {
        return 'navigation'
    }

    if (
        startsWithAny(name, ['agenda-', 'album', 'dashboard', 'feed', 'grid', 'table-', 'widget'])
        || isOneOf(name, ['apps', 'list'])
    ) {
        return 'layout'
    }

    return 'actions'
}

const classifyMediaEditing = name => {
    if (
        startsWithAny(name, ['number', 'text-', 'vertical-align-'])
        || isOneOf(name, [
            'bold',
            'format-clear',
            'hash',
            'italic',
            'strikethrough',
            'underline',
        ])
    ) {
        return 'text'
    }

    if (
        startsWithAny(name, [
            'black-and-white',
            'brightness-',
            'camera-',
            'exposure',
            'flare',
            'flash',
            'focus',
            'image',
            'invert',
            'macro',
            'media-photo',
            'panorama',
            'photo-',
            'sharpness',
            'shutter',
            'switch-camera',
        ])
    ) {
        return 'images'
    }

    if (startsWithAny(name, ['slideshow', 'switch-video', 'video-'])) {
        return 'media'
    }

    if (
        startsWithAny(name, ['print', 'save', 'scan-document'])
        || isOneOf(name, ['copy', 'cut', 'paste', 'redo', 'undo'])
    ) {
        return 'actions'
    }

    return 'design'
}

const classifyMapPlaces = name => {
    if (
        startsWithAny(name, [
            'direction-',
            'earth-',
            'location-',
            'map',
            'navigation',
            'pushpin',
            'route',
            'zoom-',
        ])
        || isOneOf(name, ['globe', 'rotate-360'])
    ) {
        return 'maps'
    }

    if (name.startsWith('tree-')) {
        return 'nature'
    }

    if (startsWithAny(name, ['shop', 'shopping-bag'])) {
        return 'commerce'
    }

    return 'places'
}

const classifyTechnology = name => {
    if (
        startsWithAny(name, ['chart-', 'trending-'])
        || isOneOf(name, ['data-sharing', 'intersect', 'poll', 'union'])
    ) {
        return 'analytics'
    }

    if (isOneOf(name, ['android', 'apple', 'chatgpt'])) {
        return 'brands'
    }

    if (
        startsWithAny(name, ['face-id', 'fingerprint', 'scan', 'shield', 'touch-id'])
    ) {
        return 'security'
    }

    if (
        startsWithAny(name, ['airdrop', 'airplay', 'bluetooth', 'cloud', 'link', 'mobile-data', 'wifi'])
        || isOneOf(name, ['at-sign', 'barcode', 'qr-code'])
    ) {
        return 'connectivity'
    }

    if (isOneOf(name, ['memory-chip', 'usb'])) {
        return 'devices'
    }

    if (startsWithAny(name, ['augmented-reality', 'virtual-reality'])) {
        return 'media'
    }

    return 'development'
}

const classifyOther = name => {
    if (name.startsWith('hourglass')) {
        return 'time'
    }

    if (startsWithAny(name, ['briefcase', 'order', 'wishlist']) || name === 'ticket') {
        return 'commerce'
    }

    if (isOneOf(name, ['receipts', 'scales'])) {
        return 'finance'
    }

    if (startsWithAny(name, ['birthday', 'gift'])) {
        return 'rewards'
    }

    if (startsWithAny(name, ['circle', 'cube', 'rectangle', 'rhombus', 'square', 'triangle']) || name === 'block') {
        return 'shapes'
    }

    if (startsWithAny(name, ['field-'])) {
        return 'forms'
    }

    if (startsWithAny(name, ['flag'])) {
        return 'symbols'
    }

    if (startsWithAny(name, ['flask', 'test-tube'])) {
        return 'science'
    }

    if (
        startsWithAny(name, ['flowchart', 'node', 'nodes'])
        || isOneOf(name, ['puzzle', 'wrench'])
    ) {
        return 'development'
    }

    if (
        startsWithAny(name, ['flower', 'leaf', 'moon', 'paw', 'snowflake'])
    ) {
        return 'nature'
    }

    if (
        startsWithAny(name, ['footprint', 'soccer-ball', 'weight'])
    ) {
        return 'activity'
    }

    if (isOneOf(name, ['formula', 'infinity'])) {
        return 'math'
    }

    if (name.startsWith('gender-')) {
        return 'people'
    }

    if (
        startsWithAny(name, ['glasses', 'shoe-print', 'smoking'])
        || name === 't-shirt'
    ) {
        return 'lifestyle'
    }

    if (
        startsWithAny(name, ['brick-wall', 'door', 'seat', 'stairs-'])
    ) {
        return 'places'
    }

    if (name.startsWith('book')) {
        return 'files'
    }

    if (name === 'film') {
        return 'media'
    }

    if (name === 'quote') {
        return 'text'
    }

    if (name.startsWith('lightbulb')) {
        return 'ai'
    }

    if (name === 'enter') {
        return 'navigation'
    }

    throw new Error(`Unclassified other icon ${name}`)
}

const classifyPremium = name => {
    if (startsWithAny(name, ['robot'])) {
        return 'ai'
    }

    if (isOneOf(name, ['dna-helix', 'planet'])) {
        return 'science'
    }

    return 'rewards'
}

const classifyIcon = (group, name) => {
    if (isOneOf(group, [
        'ai',
        'alerts',
        'arrows',
        'communication',
        'devices',
        'files',
        'keyboard',
        'math',
        'transport',
    ])) {
        return group
    }

    if (group === 'actions') {
        return classifyActions(name)
    }

    if (group === 'audiovisual') {
        return 'media'
    }

    if (group === 'food-n-drinks') {
        return startsWithAny(name, ['beer-', 'drink', 'soda', 'water-', 'wine-']) ? 'drinks' : 'food'
    }

    if (group === 'gestures-n-emotions') {
        return name.startsWith('face-') ? 'emotions' : 'gestures'
    }

    if (group === 'map-n-places') {
        return classifyMapPlaces(name)
    }

    if (group === 'media-n-editing') {
        return classifyMediaEditing(name)
    }

    if (group === 'other') {
        return classifyOther(name)
    }

    if (group === 'payment') {
        return name === 'price' ? 'commerce' : 'finance'
    }

    if (group === 'people-n-activity') {
        return isOneOf(name, ['hiking', 'running', 'swimming', 'walking']) ? 'activity' : 'people'
    }

    if (group === 'premium') {
        return classifyPremium(name)
    }

    if (group === 'social-media-n-tools') {
        return 'brands'
    }

    if (group === 'technology-n-data') {
        return classifyTechnology(name)
    }

    if (group === 'ui') {
        return classifyUi(name)
    }

    if (group === 'user') {
        return 'people'
    }

    throw new Error(`Unknown source group ${group}`)
}

const renameIcon = (group, name) => {
    if (group === 'ai' && name === 'robot') {
        return 'robot-sparkles'
    }

    return name
}

const collectMigration = async () => {
    const entries = await fs.readdir(iconsDirectory, { withFileTypes: true })
    const sourceGroups = entries
        .filter(entry => entry.isDirectory() && !isOneOf(entry.name, ['filled', 'outlined']))
        .map(entry => entry.name)
        .sort((left, right) => left.localeCompare(right))

    if (sourceGroups.length === 0) {
        return {
            migration: JSON.parse(await fs.readFile(migrationFile, 'utf8')),
            alreadyApplied: true,
        }
    }

    const migration = []
    const destinationPaths = new Map()

    for (const group of sourceGroups) {
        const directory = path.join(iconsDirectory, group)
        const files = (await fs.readdir(directory))
            .filter(file => file.endsWith('.svg'))
            .sort((left, right) => left.localeCompare(right))

        for (const file of files) {
            const oldName = path.basename(file, '.svg')
            const variant = oldName.endsWith('-outlined') ? 'outlined' : 'filled'
            const name = variant === 'outlined' ? oldName.slice(0, -'-outlined'.length) : oldName
            const targetGroup = classifyIcon(group, name)
            const targetName = renameIcon(group, name)
            const source = path.posix.join('assets/icons', group, file)
            const destination = path.posix.join('assets/icons', variant, targetGroup, `${targetName}.svg`)

            const destinationSources = destinationPaths.get(destination) ?? []
            destinationSources.push(source)
            destinationPaths.set(destination, destinationSources)
            migration.push({
                source,
                destination,
                variant,
                group: targetGroup,
                name: targetName,
                canonical: true,
            })
        }
    }

    for (const [destination, sources] of destinationPaths) {
        if (sources.length === 1) {
            continue
        }

        const canonicalSource = canonicalSourceByDestination.get(destination)

        if (!canonicalSource || !sources.includes(canonicalSource)) {
            throw new Error(`Unexpected destination collision ${destination}: ${sources.join(', ')}`)
        }

        for (const item of migration) {
            if (item.destination === destination) {
                item.canonical = item.source === canonicalSource
            }
        }
    }

    return {
        migration,
        alreadyApplied: false,
    }
}

const printSummary = migration => {
    const counts = new Map()

    for (const item of migration.filter(item => item.canonical)) {
        const key = `${item.variant}/${item.group}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    const canonicalCount = migration.filter(item => item.canonical).length

    console.log(`Mapped ${migration.length} legacy paths to ${canonicalCount} canonical icons`)

    for (const [key, count] of [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        console.log(`${key}: ${count}`)
    }
}

const writeMigration = async migration => {
    await fs.mkdir(path.dirname(migrationFile), { recursive: true })
    await fs.writeFile(migrationFile, `${JSON.stringify(migration, null, 4)}\n`)
}

const moveIcons = async migration => {
    for (const item of migration.filter(item => item.canonical)) {
        const source = path.join(rootDirectory, item.source)
        const destination = path.join(rootDirectory, item.destination)

        await fs.mkdir(path.dirname(destination), { recursive: true })
        await fs.rename(source, destination)
    }

    for (const item of migration.filter(item => !item.canonical)) {
        await fs.unlink(path.join(rootDirectory, item.source))
    }

    const legacyEntries = await fs.readdir(iconsDirectory, { withFileTypes: true })

    for (const entry of legacyEntries) {
        if (entry.isDirectory() && !isOneOf(entry.name, ['filled', 'outlined'])) {
            await fs.rmdir(path.join(iconsDirectory, entry.name))
        }
    }
}

const verifyAppliedMigration = async migration => {
    const destinations = migration
        .filter(item => item.canonical)
        .map(item => item.destination)

    await Promise.all(destinations.map(async destination => {
        const stats = await fs.stat(path.join(rootDirectory, destination))

        if (!stats.isFile()) {
            throw new Error(`Canonical icon is not a file: ${destination}`)
        }
    }))
}

const { migration, alreadyApplied } = await collectMigration()

printSummary(migration)

if (applyMigration) {
    if (alreadyApplied) {
        await verifyAppliedMigration(migration)
        console.log('Migration is already applied and all canonical assets exist')
    } else {
        await writeMigration(migration)
        await moveIcons(migration)
        console.log(`Wrote ${path.relative(rootDirectory, migrationFile)} and applied migration`)
    }
} else {
    console.log(alreadyApplied
        ? 'Migration is already applied; pass --apply to verify canonical assets'
        : 'Dry run only; pass --apply to write the map and move files')
}
