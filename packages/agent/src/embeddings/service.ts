import { createOpenAI } from '@ai-sdk/openai'
import { embed, embedMany } from 'ai'
import type { AgentEmbeddingService, AgentEmbeddingServiceOptions } from './types'

export function createAgentEmbeddingService(options: AgentEmbeddingServiceOptions): AgentEmbeddingService {
  const provider = createOpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseUrl,
  })
  const embeddingModel = provider.embedding(options.embeddingModel)

  return {
    async embedText(input) {
      const result = await embed({
        model: embeddingModel,
        value: input,
      })

      return result.embedding
    },
    async embedTexts(input) {
      const result = await embedMany({
        model: embeddingModel,
        values: input,
      })

      return result.embeddings
    },
  }
}
