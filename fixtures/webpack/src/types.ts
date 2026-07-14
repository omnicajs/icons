import { iconUrl } from 'virtual:omnicajs-icons'

iconUrl('filled', 'actions', 'add')
iconUrl('outlined', 'actions', 'add-circle')

// @ts-expect-error The generated declaration contains the selected subset only.
iconUrl('outlined', 'actions', 'add')
