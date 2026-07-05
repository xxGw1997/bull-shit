import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { ModelMessage } from "ai";

type JsonRecord = Record<string, unknown>;

export type AiMessageContent = ModelMessage["content"];

export type AiMessageRole = ModelMessage["role"];

export const md5_file_list = sqliteTable("md5_file_list", {
  id: text("id").primaryKey(),
  filename: text("filename"),
  md5: text("md5"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const conversation = sqliteTable(
  "conversation",
  {
    id: text("id").primaryKey(),
    title: text("title"),
    status: text("status", {
      enum: ["active", "archived", "deleted"],
    })
      .notNull()
      .default("active"),
    userId: text("user_id"),
    model: text("model"),
    system: text("system"),
    metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("conversation_user_id_idx").on(table.userId),
    index("conversation_status_idx").on(table.status),
    check(
      "conversation_metadata_json_valid",
      sql`${table.metadata} is null or json_valid(${table.metadata})`,
    ),
  ],
);

export const message = sqliteTable(
  "message",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["system", "user", "assistant", "tool"],
    })
      .$type<AiMessageRole>()
      .notNull(),
    sequence: integer("sequence").notNull(),
    content: text("content_json", { mode: "json" }).$type<AiMessageContent>().notNull(),
    text: text("text"),
    providerMetadata: text("provider_metadata", { mode: "json" }).$type<JsonRecord>(),
    metadata: text("metadata", { mode: "json" }).$type<JsonRecord>(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("message_conversation_sequence_unique").on(
      table.conversationId,
      table.sequence,
    ),
    index("message_conversation_id_idx").on(table.conversationId),
    index("message_role_idx").on(table.role),
    check("message_content_json_valid", sql`json_valid(${table.content})`),
    check(
      "message_provider_metadata_json_valid",
      sql`${table.providerMetadata} is null or json_valid(${table.providerMetadata})`,
    ),
    check(
      "message_metadata_json_valid",
      sql`${table.metadata} is null or json_valid(${table.metadata})`,
    ),
  ],
);
