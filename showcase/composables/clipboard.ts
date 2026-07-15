import type { IconVariant } from '@omnicajs/icons'
import type { Ref } from 'vue'

import { onScopeDispose, ref, watch } from 'vue'

const copiedFeedbackDuration = 1500

const writeToClipboard = async (value: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(value)
    } catch {
        const textarea = document.createElement('textarea')

        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.append(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
    }
}

export const useClipboard = (variant: Ref<IconVariant>) => {
    const copiedIcon = ref('')
    let feedbackTimeout: number | undefined

    const clearCopiedIcon = (): void => {
        if (feedbackTimeout !== undefined) {
            window.clearTimeout(feedbackTimeout)
            feedbackTimeout = undefined
        }

        copiedIcon.value = ''
    }

    const copyIconName = async (group: string, name: string): Promise<void> => {
        const value = `${variant.value}/${group}/${name}`

        clearCopiedIcon()
        await writeToClipboard(value)
        copiedIcon.value = value

        feedbackTimeout = window.setTimeout(clearCopiedIcon, copiedFeedbackDuration)
    }

    watch(variant, clearCopiedIcon)
    onScopeDispose(clearCopiedIcon)

    return {
        copiedIcon,
        copyIconName,
    }
}
