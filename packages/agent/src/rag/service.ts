import { generateText, type LanguageModel } from 'ai'
import type { VectorStore } from '@cyper-me/shared'
import { buildMessages, getInputPrompt } from '../agent/messages'
import type { AgentRunInput } from '../agent/types'
import { buildRetrievalContext, RAG_SYSTEM_PROMPT } from './context'
import type { RagResponse } from './types'

export type RunRagOptions = {
  input: AgentRunInput
  languageModel: LanguageModel
  vectorStore: VectorStore
  retrievalLimit?: number
}

export async function runRag(options: RunRagOptions): Promise<RagResponse> {
  const prompt = getInputPrompt(options.input)
  const sources = await options.vectorStore.similaritySearch(prompt, options.retrievalLimit ?? 4)
  const context = buildRetrievalContext(sources)
  const messages = buildMessages({
    ...options.input,
    input: `Context:\n${context}\n\nQuestion:\n${prompt}`,
  })

  const result = await generateText({
    model: options.languageModel,
    system: options.input.system ?? RAG_SYSTEM_PROMPT,
    messages,
  })

  return {
    ...result,
    retrievalSources: sources,
  }
}
