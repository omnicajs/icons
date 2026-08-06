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

export const useClipboard = (prefix: Readonly<Ref<string>>) => {
    const copiedIcon = ref('')
    let feedbackTimeout: number | undefined

    const clearCopiedIcon = (): void => {
        if (feedbackTimeout !== undefined) {
            window.clearTimeout(feedbackTimeout)
            feedbackTimeout = undefined
        }

        copiedIcon.value = ''
    }

    const copyIconName = async (...segments: readonly string[]): Promise<void> => {
        const value = [prefix.value, ...segments].join('/')

        clearCopiedIcon()
        await writeToClipboard(value)
        copiedIcon.value = value

        feedbackTimeout = window.setTimeout(clearCopiedIcon, copiedFeedbackDuration)
    }

    watch(prefix, clearCopiedIcon)
    onScopeDispose(clearCopiedIcon)

    return {
        copiedIcon,
        copyIconName,
    }
}
