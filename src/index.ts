import { iconNames, spriteUrls } from 'virtual:omnicajs-icons'
import type { IconNameMap } from 'virtual:omnicajs-icons'

export { iconNames, spriteUrls }
export type * from 'virtual:omnicajs-icons'

export type IconGroup = keyof typeof iconNames
export type IconName<Group extends IconGroup = IconGroup> = IconNameMap[Group]

const hasOwn = <ObjectType extends object>(
    object: ObjectType,
    key: PropertyKey
): key is keyof ObjectType => Object.prototype.hasOwnProperty.call(object, key)

export function spriteUrl<Group extends IconGroup> (group: Group): string {
    if (!hasOwn(spriteUrls, group)) {
        throw new Error(`Unknown icon group ${String(group)}`)
    }

    return spriteUrls[group]
}

export function iconUrl<Group extends IconGroup> (
    group: Group,
    name: IconName<Group>
): string {
    if (!hasOwn(iconNames, group)) {
        throw new Error(`Unknown icon group ${String(group)}`)
    }

    const names = iconNames[group] as readonly string[]

    if (!names.includes(name)) {
        throw new Error(`Unknown ${String(group)} icon ${name}`)
    }

    return `${spriteUrl(group)}#${name}`
}
