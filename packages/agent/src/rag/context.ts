import type { VectorSearchResult } from '@cyper-me/shared'

export const RAG_SYSTEM_PROMPT =
  'You are a retrieval augmented assistant. Answer the user using the provided context when it is relevant, and say when the context is not enough.'

export function buildRetrievalContext(results: VectorSearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant context found.'
  }

  return results
    .map((result, index) => {
      const source = result.metadata?.source ? ` source=${result.metadata.source}` : ''
      return `[${index + 1}${source}] ${result.content}`
    })
    .join('\n\n')
}
