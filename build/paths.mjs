import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const iconsDirectory = path.join(root, 'assets/icons')
export const flagsDirectory = path.join(root, 'assets/flags')
export const logosDirectory = path.join(root, 'assets/logos')
export const iconKeywordsFile = path.join(root, 'metadata/icon-keywords.json')
export const distDirectory = path.join(root, 'dist')
export const distSpritesDirectory = path.join(distDirectory, 'sprites')
export const distManifestFile = path.join(distDirectory, 'manifest.json')
export const generatedDirectory = path.join(root, 'generated')
export const generatedTypecheckFile = path.join(generatedDirectory, 'public-api.typecheck.ts')
