import { createAgentEmbeddingServiceFromEnv } from "@cyper-me/agent/embeddings";
import { createChromaVectorStoreFromEnv } from "@cyper-me/vector-store-chroma";
import { Elysia } from "elysia";

const vectorStore = createChromaVectorStoreFromEnv(createAgentEmbeddingServiceFromEnv());

export const vectorStorePlugin = new Elysia({ name: "vector-store" }).decorate(
  "vectorStore",
  vectorStore,
);
