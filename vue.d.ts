declare module '@omnicajs/icons/vue' {
    import type { DefineComponent, SVGAttributes } from 'vue'

    export type OmnicaIconProps = SVGAttributes & {
        readonly [attribute: `data-${string}`]: string | number | boolean | null | undefined
    }
    export type OmnicaIconComponent = DefineComponent<OmnicaIconProps>
}

declare module '@omnicajs/icons/assets/icons/filled/*.svg?url' {
    const url: string

    export default url
}

declare module '@omnicajs/icons/assets/icons/outlined/*.svg?url' {
    const url: string

    export default url
}

declare module '@omnicajs/icons/assets/icons/filled/*.svg' {
    import type { OmnicaIconComponent } from '@omnicajs/icons/vue'

    const icon: OmnicaIconComponent

    export default icon
}

declare module '@omnicajs/icons/assets/icons/outlined/*.svg' {
    import type { OmnicaIconComponent } from '@omnicajs/icons/vue'

    const icon: OmnicaIconComponent

    export default icon
}
