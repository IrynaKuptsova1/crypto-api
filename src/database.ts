import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { CRYPTO_DETAILS, FAVORITES } from "./db/schema";
import type { MarketPlatform } from "./validation";
import {
  getCoinBasePrices,
  getCoinMarketCapPrices,
  getKucoinPrices,
} from "./api";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle({ client: connection });

export async function getCryptoInfo(
  symbol: string,
  startTime: number,
  market?: MarketPlatform,
) {
  if (market) {
    // return db`
    //   SELECT *
    //   FROM crypto_details
    //   WHERE symbol = ${symbol}
    //   AND market = ${market}
    //   AND created_time >= ${startTime}
    //   ORDER BY created_time DESC
    // `;

    const result = await db
      .select()
      .from(CRYPTO_DETAILS)
      .where(
        and(
          eq(CRYPTO_DETAILS.symbol, symbol),
          eq(CRYPTO_DETAILS.market, market),
          gte(CRYPTO_DETAILS.createdTime, startTime),
        ),
      )
      .orderBy(desc(CRYPTO_DETAILS.createdTime));

    return result;
  }

  // const result = await irasNewDialectForgoodDatabases`
  //   SELECT MAX(created_time) AS created_time, AVG(price) AS average_price
  //   FROM crypto_details
  //   WHERE symbol = ${symbol}
  //   AND created_time >= ${startTime}
  //   GROUP BY FLOOR(created_time / 300000)
  //   ORDER BY created_time DESC`;

  const result = await db
    .select({
      createdTime: sql`MAX(${CRYPTO_DETAILS.createdTime})`,
      averagePrice: sql`AVG(${CRYPTO_DETAILS.price})`,
    })
    .from(CRYPTO_DETAILS)
    .where(
      and(
        eq(CRYPTO_DETAILS.symbol, symbol),
        gte(CRYPTO_DETAILS.createdTime, startTime),
      ),
    )
    .groupBy(sql`FLOOR(${CRYPTO_DETAILS.createdTime} / 300000)`)
    .orderBy(desc(sql`MAX(${CRYPTO_DETAILS.createdTime})`));

  return result.map((item) => ({
    createdTime: Number(item.createdTime),
    averagePrice: Number(item.averagePrice),
  }));
}

export async function updateCryptoPrices() {
  const markets: MarketPlatform[] = ["CoinBase", "CoinMarketCap", "Kucoin"];

  const results = await Promise.allSettled([
    getCoinBasePrices(),
    getCoinMarketCapPrices(),
    getKucoinPrices(),
  ]);

  const rows: Array<{
    symbol: string;
    market: MarketPlatform;
    price: number;
    createdTime: number;
  }> = [];

  const createdTime = Date.now();

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const market = markets[index];

      for (const [symbol, price] of Object.entries(result.value)) {
        rows.push({
          symbol,
          market,
          price,
          createdTime,
        });
      }
    }
  });

  if (rows.length === 0) {
    return;
  }

  // await db`
  //   INSERT INTO crypto_details
  //   ${db(rows, "symbol", "market", "price", "created_time")}
  // `;

  await db.insert(CRYPTO_DETAILS).values(rows);
}

export async function addFavourite(chatId: number, symbol: string) {
  // await db`
  //   SELECT *
  //   FROM favorites
  //   WHERE chat_id = ${chatId}
  //   AND symbol = ${symbol}
  // `;

  const exists = await db
    .select()
    .from(FAVORITES)
    .where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));

  if (exists.length > 0) {
    return;
  }

  // await db`
  //   INSERT INTO favorites (chat_id, symbol)
  //   VALUES (${chatId}, ${symbol})
  // `;

  await db.insert(FAVORITES).values({
    chatId,
    symbol,
  });
}

export async function deleteFavourite(chatId: number, symbol: string) {
  // await db`
  //   DELETE FROM favorites
  //   WHERE chat_id = ${chatId}
  //   AND symbol = ${symbol}
  // `;

  await db
    .delete(FAVORITES)
    .where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));
}
export async function isFavourite(chatId: number, symbol: string) {
  // await db`
  //   SELECT *
  //   FROM favorites
  //   WHERE chat_id = ${chatId}
  //   AND symbol = ${symbol}
  // `;

  const result = await db
    .select()
    .from(FAVORITES)
    .where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));

  return result.length > 0;
}

export async function getFavourite(chatId: number) {
  // await db`
  //   SELECT *
  //   FROM favorites
  //   WHERE chat_id = ${chatId}
  // `;

  return db.select().from(FAVORITES).where(eq(FAVORITES.chatId, chatId));
}

export async function getRecentCrypto() {
  const startTime = Date.now() - 24 * 60 * 60 * 1000;

  // SELECT symbol, AVG(price) AS average_price
  // FROM crypto_details
  // WHERE created_time >= ${startTime}
  // GROUP BY symbol
  // ORDER BY MAX(created_time) DESC
  // LIMIT 20;

  const result = await db
    .select({
      symbol: CRYPTO_DETAILS.symbol,
      averagePrice: sql`AVG(${CRYPTO_DETAILS.price})`,
    })
    .from(CRYPTO_DETAILS)
    .where(gte(CRYPTO_DETAILS.createdTime, startTime))
    .groupBy(CRYPTO_DETAILS.symbol)
    .orderBy(
      desc(
        sql`
          MAX(${CRYPTO_DETAILS.createdTime})
        `,
      ),
    )
    .limit(20);
  return result.map((coin) => ({
    symbol: coin.symbol,
    price: Number(coin.averagePrice),
  }));
}
