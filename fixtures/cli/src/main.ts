import { iconUrl as filledIconUrl } from './generated/omnica-icons/filled.js'
import { iconUrl as outlinedIconUrl } from './generated/omnica-icons/outlined.js'

filledIconUrl('actions', 'add')
filledIconUrl('alerts', 'warning')
outlinedIconUrl('actions', 'add-circle')

// @ts-expect-error The generated module only contains the selected outlined icon.
outlinedIconUrl('actions', 'add')
