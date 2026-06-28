export type AgentEmbeddingServiceOptions = {
  apiKey: string
  baseUrl: string
  embeddingModel: string
}

export type AgentEmbeddingService = {
  embedText(input: string): Promise<number[]>
  embedTexts(input: string[]): Promise<number[][]>
}
