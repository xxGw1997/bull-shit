import { getRuntimeEnv, readRequiredEnv, type RuntimeEnv } from '@cyper-me/shared'
import { createAgentEmbeddingService } from './service'
import type { AgentEmbeddingService } from './types'

export function createAgentEmbeddingServiceFromEnv(env: RuntimeEnv = getRuntimeEnv()): AgentEmbeddingService {
  return createAgentEmbeddingService({
    apiKey: readRequiredEnv(env, 'API_KEY'),
    baseUrl: readRequiredEnv(env, 'BASE_URL'),
    embeddingModel: readRequiredEnv(env, 'EMBEDDING_MODEL'),
  })
}
