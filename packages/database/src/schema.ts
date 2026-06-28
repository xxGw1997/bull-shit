import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const md5_file_list = sqliteTable("md5_file_list", {
  id: text("id").primaryKey(),
  filename: text("filename"),
  md5: text("md5"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});