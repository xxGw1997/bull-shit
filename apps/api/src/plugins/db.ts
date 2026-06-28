import { Elysia } from "elysia";
import { db } from "@cyper-me/database";

export const dbPlugin = new Elysia({ name: "db" }).decorate("db", db);
