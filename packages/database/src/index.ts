import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as schema from "./schema";

const PKG_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(PKG_DIR, "..");

const defaultDbPath = path.join(ROOT_DIR, "db.db");
const migrationsFolder = path.join(ROOT_DIR, "drizzle");

const sqlite = new Database(Bun.env.DATABASE_URL ?? defaultDbPath);
sqlite.exec("PRAGMA foreign_keys = ON");
sqlite.exec("PRAGMA journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// migrate(db, { migrationsFolder });

export * from "./schema";
