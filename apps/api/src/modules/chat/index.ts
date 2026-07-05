import { Elysia, t } from "elysia";
import { dbPlugin } from "../../plugins/db";
import { ChatError, ChatService } from "./chat.service";

export const chatModule = new Elysia({ name: "chat", prefix: "/api/chat" })
  .use(dbPlugin)
  .derive(({ db }) => ({
    chatService: new ChatService(db),
  }))
  .onError(({ error, set }) => {
    if (error instanceof ChatError) {
      set.status = error.status;
      return { message: error.message };
    }
  })
  .get("/create", ({ chatService }) => chatService.createSession())
  .get(
    "/:conversationId",
    ({ params, chatService }) => chatService.getConversation(params.conversationId),
    {
      params: t.Object({
        conversationId: t.String(),
      }),
    },
  )
  .post(
    "/:conversationId",
    ({ params, body, chatService }) => chatService.streamMessage(params.conversationId, body.message),
    {
      params: t.Object({
        conversationId: t.String(),
      }),
      body: t.Object({
        message: t.Any(),
      }),
    },
  );
