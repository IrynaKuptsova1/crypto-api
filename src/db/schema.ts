import {
  mysqlTable,
  int,
  varchar,
  decimal,
  bigint,
} from "drizzle-orm/mysql-core";

export const CRYPTO_DETAILS = mysqlTable("crypto_details", {
  id: int("id").autoincrement().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  market: varchar("market", { length: 50 }).notNull(),
  price: decimal("price", {
    precision: 20,
    scale: 8,
    mode: "number",
  }).notNull(),
  createdTime: bigint("created_time", { mode: "number" }).notNull(),
});
export const FAVORITES = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  chatId: bigint("chat_id", { mode: "number" }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
});
