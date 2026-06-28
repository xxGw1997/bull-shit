import { ChromaClient, type Metadata } from 'chromadb'
import {
  getRuntimeEnv,
  readRequiredEnv,
  type EmbeddingModel,
  type RuntimeEnv,
  type VectorDocument,
  type VectorSearchResult,
  type VectorStore,
} from '@cyper-me/shared'

export type ChromaVectorStoreOptions = {
  collectionName: string
  embeddingModel: EmbeddingModel
  host: string
  apiKey: string
  tenant: string
  database: string
  port?: number
  ssl?: boolean
}

export function createChromaVectorStore(options: ChromaVectorStoreOptions): VectorStore {
  const client = new ChromaClient({
    host: options.host,
    port: options.port,
    ssl: options.ssl ?? true,
    tenant: options.tenant,
    database: options.database,
    headers: {
      'x-chroma-token': options.apiKey,
    },
  })

  async function getCollection() {
    return client.getOrCreateCollection({
      name: options.collectionName,
      embeddingFunction: {
        generate: (texts) => options.embeddingModel.embedTexts(texts),
      },
    })
  }

  return {
    async addDocuments(documents) {
      if (documents.length === 0) {
        return
      }

      const collection = await getCollection()
      const contents = documents.map((document) => document.content)

      await collection.upsert({
        ids: documents.map((document) => document.id),
        documents: contents,
        embeddings: await options.embeddingModel.embedTexts(contents),
        metadatas: documents.map((document) => toChromaMetadata(document.metadata)),
      })
    },

    async deleteDocuments(ids) {
      if (ids.length === 0) {
        return
      }

      const collection = await getCollection()

      await collection.delete({ ids })
    },

    async similaritySearch(query, limit = 4) {
      const collection = await getCollection()
      const result = await collection.query({
        queryEmbeddings: [await options.embeddingModel.embedText(query)],
        nResults: limit,
        include: ['documents', 'metadatas', 'distances'],
      })

      const [rows = []] = result.rows()

      return rows.map((row): VectorSearchResult => ({
        id: row.id,
        content: row.document ?? '',
        metadata: row.metadata ? fromChromaMetadata(row.metadata) : undefined,
        score: row.distance ?? undefined,
      }))
    },
  }
}

export function createChromaVectorStoreFromEnv(
  embeddingModel: EmbeddingModel,
  env: RuntimeEnv = getRuntimeEnv(),
): VectorStore {
  return createChromaVectorStore({
    collectionName: env.CHROMA_COLLECTION ?? 'default_collection',
    embeddingModel,
    host: readRequiredEnv(env, 'CHROMA_HOST'),
    apiKey: readRequiredEnv(env, 'CHROMA_API_KEY'),
    tenant: readRequiredEnv(env, 'CHROMA_TENANT'),
    database: readRequiredEnv(env, 'CHROMA_DATABASE'),
    port: env.CHROMA_PORT ? Number(env.CHROMA_PORT) : undefined,
    ssl: env.CHROMA_SSL ? env.CHROMA_SSL !== 'false' : true,
  })
}

function toChromaMetadata(metadata: VectorDocument['metadata']): Metadata {
  return metadata ?? {}
}

function fromChromaMetadata(metadata: Metadata): VectorDocument['metadata'] {
  return Object.fromEntries(
    Object.entries(metadata).filter((entry): entry is [string, string | number | boolean | null] => {
      const value = entry[1]
      return value === null || ['string', 'number', 'boolean'].includes(typeof value)
    }),
  )
}
