import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, or } from "drizzle-orm";
import { db, md5_file_list } from "@cyper-me/database";
import type { VectorStore } from "@cyper-me/shared";

const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FILE_DIR = path.join(API_ROOT, "static", "md5_file_list");
const OPERATOR = "xxgw";

export class Md5FileService {
  constructor(private readonly vectorStore: VectorStore) {}

  async upload(file: File) {
    const fileType = file.type.trim().toLowerCase();

    if (!file.name.endsWith(".txt") || (fileType && !fileType.startsWith("text/plain"))) {
      throw new Md5FileError("Only .txt files are allowed", 400);
    }

    const content = Buffer.from(await file.arrayBuffer());
    const md5 = new Bun.CryptoHasher("md5").update(content).digest("hex");
    const fileName = path.basename(file.name);
    const [existing] = await db
      .select()
      .from(md5_file_list)
      .where(or(eq(md5_file_list.md5, md5), eq(md5_file_list.filename, fileName)))
      .limit(1);

    if (existing) {
      throw new Md5FileError(
        existing.md5 === md5 ? "已存在相同文件" : "已存在相同文件名",
        409,
      );
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const savedFileName = `${md5}.txt`;

    await this.vectorStore.addDocuments([
      {
        id: md5,
        content: content.toString(),
        metadata: {
          source: fileName,
          createdAt: now,
          operator: OPERATOR,
        },
      },
    ]);

    await mkdir(FILE_DIR, { recursive: true });
    await writeFile(path.join(FILE_DIR, savedFileName), content);

    const record = {
      id,
      filename: fileName,
      md5,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(md5_file_list).values(record);

    return record;
  }

  list() {
    return db.select().from(md5_file_list).orderBy(md5_file_list.createdAt);
  }

  async deleteById(id: string) {
    const [record] = await db.select().from(md5_file_list).where(eq(md5_file_list.id, id)).limit(1);

    if (!record) {
      throw new Md5FileError("文件不存在", 404);
    }

    await this.vectorStore.deleteDocuments([record.md5 ?? ""]);
    await db.delete(md5_file_list).where(eq(md5_file_list.id, id));
    await unlink(path.join(FILE_DIR, `${record.md5}.txt`)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });

    return record;
  }
}

export class Md5FileError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const md5FileStorageDir = FILE_DIR;
