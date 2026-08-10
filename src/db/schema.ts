import {
  sqliteTable,
  integer,
  text,
  real,
  index,
} from "drizzle-orm/sqlite-core";

export const CRYPTO_DETAILS = sqliteTable(
  "crypto_details",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    symbol: text("symbol").notNull(),
    market: text("market").notNull(),
    price: real("price").notNull(),
    createdTime: integer("created_time").notNull(),
  },
  (table) => [
    index("crypto_index").on(table.symbol, table.market, table.createdTime),
  ],
);

export const FAVORITES = sqliteTable(
  "favorites",
  {
    id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
    chatId: integer("chat_id").notNull(),
    symbol: text("symbol").notNull(),
  },
  (table) => [index("favorites_index").on(table.chatId, table.symbol)],
);
