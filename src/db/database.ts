import { drizzle } from "drizzle-orm/d1";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";

import { CRYPTO_DETAILS, FAVORITES } from "./schema";
import {
  MarketPlatform,
  CryptoPeriod,
  getPeriodMilliseconds,
} from "../validation";

import {
  getCoinBasePrices,
  getCoinMarketCapPrices,
  getKucoinPrices,
} from "../api";

export type Env = {
  crypto_db: D1Database;
  TELEGRAM_TOKEN: string;
  CMC_API_KEY: string;
};

export type CryptoAverage = {
  createdTime: number;
  averagePrice: number;
};

export type CryptoMarket = {
  id: number;
  symbol: string;
  market: string;
  price: number;
  createdTime: number;
};

export function getDb(env: Env) {
  return drizzle(env.crypto_db);
}

export async function getCryptoInfo(
  env: Env,
  symbol: string,
  startTime: number,
  market?: MarketPlatform,
): Promise<CryptoAverage[] | CryptoMarket[]> {
  const db = getDb(env);

  if (market) {
    // SELECT *
    // FROM crypto_details
    // WHERE symbol = ${symbol}
    // AND market = ${market}
    // AND created_time >= ${startTime}
    // ORDER BY created_time DESC;

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

  // SELECT MAX(created_time) AS created_time,
  //        AVG(price) AS average_price
  // FROM crypto_details
  // WHERE symbol = ${symbol}
  // AND created_time >= ${startTime}
  // GROUP BY FLOOR(created_time / 300000)
  // ORDER BY created_time DESC;

  const result = await db
    .select({
      createdTime: sql`
        MAX(${CRYPTO_DETAILS.createdTime})
      `,
      averagePrice: sql`
        AVG(${CRYPTO_DETAILS.price})
      `,
    })
    .from(CRYPTO_DETAILS)
    .where(
      and(
        eq(CRYPTO_DETAILS.symbol, symbol),
        gte(CRYPTO_DETAILS.createdTime, startTime),
      ),
    )
    .groupBy(
      sql`
        CAST(${CRYPTO_DETAILS.createdTime} / 300000 AS INTEGER)
      `,
    )
    .orderBy(
      desc(
        sql`
          MAX(${CRYPTO_DETAILS.createdTime})
        `,
      ),
    );

  return result.map((item) => ({
    createdTime: Number(item.createdTime),
    averagePrice: Number(item.averagePrice),
  }));
}

export async function getCryptoHistory(
  env: Env,
  symbol: string,
  period: CryptoPeriod,
): Promise<CryptoAverage[]> {
  const db = getDb(env);
  const startTime = Date.now() - getPeriodMilliseconds(period);

  // SELECT MAX(created_time) AS created_time,
  //        AVG(price) AS average_price
  // FROM crypto_details
  // WHERE symbol = ${symbol}
  // AND created_time >= ${startTime}
  // GROUP BY FLOOR(created_time / 300000)
  // ORDER BY created_time DESC;

  const result = await db
    .select({
      createdTime: sql`
        MAX(${CRYPTO_DETAILS.createdTime})
      `,
      averagePrice: sql`
        AVG(${CRYPTO_DETAILS.price})
      `,
    })
    .from(CRYPTO_DETAILS)
    .where(
      and(
        eq(CRYPTO_DETAILS.symbol, symbol),
        gte(CRYPTO_DETAILS.createdTime, startTime),
      ),
    )
    .groupBy(
      sql`
        CAST(${CRYPTO_DETAILS.createdTime} / 300000 AS INTEGER)
      `,
    )
    .orderBy(
      desc(
        sql`
          MAX(${CRYPTO_DETAILS.createdTime})
        `,
      ),
    );

  return result.map((item) => ({
    createdTime: Number(item.createdTime),
    averagePrice: Number(item.averagePrice),
  }));
}
export async function updateCryptoPrices(env: Env) {
  const db = getDb(env);

  const markets: MarketPlatform[] = [
    "CoinBase",
    "CoinMarketCap",
    "Kucoin",
  ];

  const results = await Promise.allSettled([
    getCoinBasePrices(),
    getCoinMarketCapPrices(env),
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
    const market = markets[index];

    if (result.status === "rejected") {
      console.error(`${market} update failed:`, result.reason);
      return;
    }

    for (const [symbol, price] of Object.entries(result.value)) {
      rows.push({
        symbol,
        market,
        price,
        createdTime,
      });
    }
  });

  if (rows.length === 0) {
    console.log("No cryptocurrency prices to save");
    return;
  }

  console.log(`Saving ${rows.length} cryptocurrency prices`);

  const BATCH_SIZE = 20;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await db.insert(CRYPTO_DETAILS).values(batch);

    console.log(
      `Saved batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} rows`,
    );
  }

  console.log(`Successfully saved ${rows.length} cryptocurrency prices`);
}

export async function addFavourite(env: Env, chatId: number, symbol: string) {
  const db = getDb(env);

  // SELECT *
  // FROM favorites
  // WHERE chat_id = ${chatId}
  // AND symbol = ${symbol};

  const exists = await db
    .select()
    .from(FAVORITES)
    .where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));

  if (exists.length > 0) {
    return;
  }

  // INSERT INTO favorites (chat_id, symbol)
  // VALUES (${chatId}, ${symbol});

  await db.insert(FAVORITES).values({
    chatId,
    symbol,
  });
}

export async function deleteFavourite(
  env: Env,
  chatId: number,
  symbol: string,
) {
  const db = getDb(env);

  // DELETE FROM favorites
  // WHERE chat_id = ${chatId}
  // AND symbol = ${symbol};

  await db
    .delete(FAVORITES)
    .where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));
}

export async function isFavourite(env: Env, chatId: number, symbol: string) {
  const db = getDb(env);

  // SELECT *
  // FROM favorites
  // WHERE chat_id = ${chatId}
  // AND symbol = ${symbol};

  const result = await db
    .select()
    .from(FAVORITES)
    .where(and(eq(FAVORITES.chatId, chatId), eq(FAVORITES.symbol, symbol)));

  return result.length > 0;
}

export async function getFavourite(env: Env, chatId: number) {
  const db = getDb(env);

  // SELECT *
  // FROM favorites
  // WHERE chat_id = ${chatId};

  return db.select().from(FAVORITES).where(eq(FAVORITES.chatId, chatId));
}

export async function getRecentCrypto(env: Env) {
  const db = getDb(env);

  const startTime = Date.now() - 24 * 60 * 60 * 1000;

  // SELECT symbol,
  //        AVG(price) AS average_price
  // FROM crypto_details
  // WHERE created_time >= ${startTime}
  // GROUP BY symbol
  // ORDER BY MAX(created_time) DESC
  // LIMIT 20;

  const result = await db
    .select({
      symbol: CRYPTO_DETAILS.symbol,
      averagePrice: sql`
        AVG(${CRYPTO_DETAILS.price})
      `,
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
