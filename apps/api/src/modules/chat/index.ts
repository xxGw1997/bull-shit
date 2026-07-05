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
  .post(
    "/:sessionId",
    ({ params, body, chatService }) => chatService.sendMessage(params.sessionId, body.input),
    {
      params: t.Object({
        sessionId: t.String(),
      }),
      body: t.Object({
        input: t.String({ minLength: 1 }),
      }),
    },
  );
