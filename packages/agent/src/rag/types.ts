import type { AgentResponse, VectorSearchResult } from '@cyper-me/shared'

export type RagResponse = AgentResponse & {
  sources: VectorSearchResult[]
}
