import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

import SsrApp from './SsrApp.vue'

export const render = (): Promise<string> => renderToString(createSSRApp(SsrApp))
