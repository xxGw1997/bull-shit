import type { InferUITools, ToolSet, UIMessage } from "ai";

export type ChatMessageMetadata = {
  createdAt?: string;
  sequence?: number;
};

export type ChatUIMessage<TOOLS extends ToolSet = ToolSet> = UIMessage<
  ChatMessageMetadata,
  never,
  InferUITools<TOOLS>
>;
