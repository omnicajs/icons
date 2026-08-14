import type { OmnicaIconComponent, OmnicaIconProps } from '@omnicajs/icons/vue'

import clearCircleUrl from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg?url'
import IconClearCircle from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg'

const component: OmnicaIconComponent = IconClearCircle
const props = {
    'aria-hidden': true,
    class: 'button__icon',
    'data-icon': 'clear-circle',
    width: 24,
} satisfies OmnicaIconProps
const url: string = clearCircleUrl

void component
void props
void url
