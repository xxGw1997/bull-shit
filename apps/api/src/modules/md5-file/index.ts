import { Elysia, t } from "elysia";
import { vectorStorePlugin } from "../../plugins/vector_store";
import { Md5FileError, Md5FileService } from "./md5-file.service";

export const md5FileModule = new Elysia({ name: "md5-file", prefix: "/md5-files" })
  .use(vectorStorePlugin)
  .derive(({ vectorStore }) => ({
    md5FileService: new Md5FileService(vectorStore),
  }))
  .onError(({ error, set }) => {
    if (error instanceof Md5FileError) {
      set.status = error.status;
      return { message: error.message };
    }
  })
  .post(
    "/",
    async ({ body, md5FileService, set }) => {
      const record = await md5FileService.upload(body.file);

      set.status = 201;

      return record;
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    },
  )
  .get("/", ({ md5FileService }) => md5FileService.list())
  .delete(
    "/:id",
    async ({ params, md5FileService }) => {
      const record = await md5FileService.deleteById(params.id);

      return { deleted: true, record };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
