import { treaty } from '@elysiajs/eden'
import type { App } from '../../api/src/index'

export const api = treaty<App>(window.location.origin)
