import type { VectorSearchResult } from '@cyper-me/shared'
import type { AgentRunResult } from '../agent/types'

export type RagResponse = AgentRunResult & {
  retrievalSources: VectorSearchResult[]
}
