export type EmbeddingInput = string | string[]

export interface EmbeddingModel {
  embedText(input: string): Promise<number[]>
  embedTexts(input: string[]): Promise<number[][]>
}
