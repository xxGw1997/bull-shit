import { randomUUID } from "node:crypto";
import { createAgentServiceFromEnv, type AgentService } from "@cyper-me/agent";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
  type UIMessagePart,
} from "ai";
import {
  conversation,
  message,
  type AiMessageContent,
  type db as database,
} from "@cyper-me/database";
import { and, eq, isNull } from "drizzle-orm";

type ChatUIMessage = UIMessage<{
  createdAt?: string;
  sequence?: number;
}>;

export class ChatService {
  constructor(
    private readonly db: typeof database,
    private readonly agent: AgentService = createAgentServiceFromEnv(),
  ) {}

  async createSession() {
    const now = new Date().toISOString();
    const conversationId = randomUUID();

    await this.db.insert(conversation).values({
      id: conversationId,
      createdAt: now,
      updatedAt: now,
    });

    return { conversationId };
  }

  async getConversation(conversationId: string) {
    const [session] = await this.db
      .select({
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      })
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversation.status, "active"),
          isNull(conversation.deletedAt),
        ),
      )
      .limit(1);

    if (!session) {
      throw new ChatError("会话不存在", 404);
    }

    const messages = await this.getUIMessages(conversationId);

    return {
      ...session,
      messages,
    };
  }

  async streamMessage(conversationId: string, incomingMessage: ChatUIMessage) {
    await this.assertConversation(conversationId);

    if (incomingMessage.role !== "user") {
      throw new ChatError("只能发送用户消息", 400);
    }

    const history = await this.getUIMessages(conversationId);
    const input = extractTextFromParts(incomingMessage.parts);

    if (!input.trim()) {
      throw new ChatError("消息不能为空", 400);
    }

    const originalMessages = [...history, incomingMessage];
    const result = this.agent.stream({
      input,
      messages: await convertToModelMessages(history),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages,
        generateMessageId: createIdGenerator({
          prefix: "msg",
          size: 16,
        }),
        onEnd: async ({ messages }) => {
          await this.replaceMessages(conversationId, messages as ChatUIMessage[]);
        },
      }),
    });
  }

  async sendMessage(conversationId: string, input: string) {
    await this.assertConversation(conversationId);

    const history = await this.getUIMessages(conversationId);
    const result = await this.agent.runText({
      input,
      messages: await convertToModelMessages(history),
    });
    const now = new Date().toISOString();
    const nextMessages: ChatUIMessage[] = [
      ...history,
      {
        id: randomUUID(),
        role: "user",
        metadata: { createdAt: now, sequence: history.length },
        parts: [{ type: "text", text: input }],
      },
      {
        id: randomUUID(),
        role: "assistant",
        metadata: { createdAt: now, sequence: history.length + 1 },
        parts: [{ type: "text", text: result.text }],
      },
    ];

    await this.replaceMessages(conversationId, nextMessages);

    return {
      conversationId,
      text: result.text,
      finishReason: result.finishReason,
      usage: result.usage,
      updatedAt: now,
    };
  }

  private async assertConversation(conversationId: string) {
    const [session] = await this.db
      .select({ id: conversation.id })
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversation.status, "active"),
          isNull(conversation.deletedAt),
        ),
      )
      .limit(1);

    if (!session) {
      throw new ChatError("会话不存在", 404);
    }
  }

  private async getUIMessages(conversationId: string): Promise<ChatUIMessage[]> {
    const rows = await this.db
      .select({
        id: message.id,
        role: message.role,
        content: message.content,
        text: message.text,
        sequence: message.sequence,
        createdAt: message.createdAt,
      })
      .from(message)
      .where(eq(message.conversationId, conversationId))
      .orderBy(message.sequence);

    return rows.flatMap((item) => {
      if (item.role !== "system" && item.role !== "user" && item.role !== "assistant") {
        return [];
      }

      return [
        {
          id: item.id,
          role: item.role,
          metadata: {
            createdAt: item.createdAt,
            sequence: item.sequence,
          },
          parts: normalizeParts(item.content, item.text),
        },
      ];
    });
  }

  private async replaceMessages(conversationId: string, messages: ChatUIMessage[]) {
    const now = new Date().toISOString();

    await this.db.transaction(async (tx) => {
      await tx.delete(message).where(eq(message.conversationId, conversationId));

      if (messages.length) {
        await tx.insert(message).values(
          messages.map((item, index) => ({
            id: item.id,
            conversationId,
            role: item.role,
            sequence: index,
            content: item.parts,
            text: extractTextFromParts(item.parts),
            metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : undefined,
            createdAt: getMessageCreatedAt(item, now),
          })),
        );
      }

      await tx
        .update(conversation)
        .set({ updatedAt: now })
        .where(eq(conversation.id, conversationId));
    });
  }
}

function normalizeParts(content: AiMessageContent | unknown, text: string | null): UIMessagePart<never, never>[] {
  if (Array.isArray(content) && content.every((part) => part && typeof part === "object" && "type" in part)) {
    return content as UIMessagePart<never, never>[];
  }

  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }

  return [{ type: "text", text: text ?? "" }];
}

function extractTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function getMessageCreatedAt(message: ChatUIMessage, fallback: string) {
  const createdAt = message.metadata?.createdAt;
  return typeof createdAt === "string" ? createdAt : fallback;
}

export class ChatError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
