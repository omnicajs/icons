import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const iconsDirectory = path.join(root, 'assets/icons')
export const flagsDirectory = path.join(root, 'assets/flags')
export const distDirectory = path.join(root, 'dist')
export const generatedDirectory = path.join(root, 'generated')
export const generatedBuildDirectory = path.join(generatedDirectory, 'icon-build')
export const generatedSpritesDirectory = path.join(generatedBuildDirectory, 'sprites')
export const generatedManifestFile = path.join(generatedBuildDirectory, 'manifest.json')
export const generatedVirtualTypesFile = path.join(generatedDirectory, 'virtual-icons.d.ts')
