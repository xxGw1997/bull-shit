import { randomUUID } from "node:crypto";
import { createAgentServiceFromEnv, type AgentService } from "@cyper-me/agent";
import {
  conversation,
  message,
  type AiMessageContent,
  type AiMessageRole,
  type db as database,
} from "@cyper-me/database";
import { and, eq, isNull } from "drizzle-orm";
import type { ModelMessage } from "ai";

type StoredMessage = {
  role: AiMessageRole;
  content: AiMessageContent;
};

export class ChatService {
  constructor(
    private readonly db: typeof database,
    private readonly agent: AgentService = createAgentServiceFromEnv(),
  ) {}

  async createSession() {
    const now = new Date().toISOString();
    const sessionId = randomUUID();

    await this.db.insert(conversation).values({
      id: sessionId,
      createdAt: now,
      updatedAt: now,
    });

    return { sessionId };
  }

  async sendMessage(sessionId: string, input: string) {
    const [session] = await this.db
      .select({ id: conversation.id })
      .from(conversation)
      .where(
        and(
          eq(conversation.id, sessionId),
          eq(conversation.status, "active"),
          isNull(conversation.deletedAt),
        ),
      )
      .limit(1);

    if (!session) {
      throw new ChatError("会话不存在", 404);
    }

    const history = await this.db
      .select({
        role: message.role,
        content: message.content,
        sequence: message.sequence,
      })
      .from(message)
      .where(eq(message.conversationId, sessionId))
      .orderBy(message.sequence);
    const messages = history.map(toModelMessage);
    const result = await this.agent.runText({
      input,
      messages,
    });
    const now = new Date().toISOString();
    const nextSequence = history.length;
    const responseMessages = result.responseMessages.length
      ? result.responseMessages
      : [{ role: "assistant" as const, content: result.text }];

    await this.db.transaction(async (tx) => {
      await tx.insert(message).values([
        {
          id: randomUUID(),
          conversationId: sessionId,
          role: "user",
          sequence: nextSequence,
          content: input,
          text: input,
          createdAt: now,
        },
        ...responseMessages.map((responseMessage, index) => ({
          id: randomUUID(),
          conversationId: sessionId,
          role: responseMessage.role,
          sequence: nextSequence + index + 1,
          content: responseMessage.content,
          text: extractText(responseMessage.content),
          providerMetadata: responseMessage.providerOptions,
          createdAt: now,
        })),
      ]);

      await tx
        .update(conversation)
        .set({ updatedAt: now })
        .where(eq(conversation.id, sessionId));
    });

    return {
      sessionId,
      text: result.text,
      finishReason: result.finishReason,
      usage: result.usage,
      updatedAt: now,
    };
  }
}

function toModelMessage(storedMessage: StoredMessage): ModelMessage {
  return {
    role: storedMessage.role,
    content: storedMessage.content,
  } as ModelMessage;
}

function extractText(content: AiMessageContent): string | null {
  if (typeof content === "string") {
    return content;
  }

  const text = content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  return text || null;
}

export class ChatError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
