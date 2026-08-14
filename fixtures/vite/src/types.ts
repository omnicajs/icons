import type { OmnicaIconComponent, OmnicaIconProps } from '@omnicajs/icons/vue'

import clearCircleUrl from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg?url'
import IconFilledClearCircle from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg'

const component: OmnicaIconComponent = IconFilledClearCircle
const url: string = clearCircleUrl
type IconProps = InstanceType<typeof IconFilledClearCircle>['$props']

const svgProps = {
    'aria-hidden': true,
    class: 'button__icon',
    'data-icon': 'clear-circle',
    fill: 'currentColor',
    height: '24',
    onClick: event => void event.clientX,
    role: 'img',
    style: { color: '#005eeb' },
    width: 24,
} satisfies IconProps
const publicSvgProps: OmnicaIconProps = svgProps

const invalidSvgProps: IconProps = {
    // @ts-expect-error SVG width does not accept arbitrary objects.
    width: {},
}
const invalidDataProps: IconProps = {
    // @ts-expect-error Data attributes accept scalar DOM attribute values only.
    'data-icon': {},
}

void component
void invalidDataProps
void invalidSvgProps
void publicSvgProps
void svgProps
void url
