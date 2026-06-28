export type VectorDocumentMetadata = Record<string, string | number | boolean | null>

export type VectorDocument = {
  id: string
  content: string
  metadata?: VectorDocumentMetadata
}

export type VectorSearchResult = VectorDocument & {
  score?: number
}

export interface VectorStore {
  addDocuments(documents: VectorDocument[]): Promise<void>
  deleteDocuments(ids: string[]): Promise<void>
  similaritySearch(query: string, limit?: number): Promise<VectorSearchResult[]>
}
