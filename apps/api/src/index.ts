import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { chatModule } from "./modules/chat";
import { md5FileModule } from "./modules/md5-file";

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  .use(openapi())
  .use(cors())
  .use(chatModule)
  .use(md5FileModule)
  .listen(port);

console.log(
  `API server running at http://${app.server?.hostname}:${app.server?.port}`,
);
