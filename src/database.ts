import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { CRYPTO_DETAILS } from "./db/schema";
import type { MarketPlatform } from "./validation";
import {
  getCoinBasePrices,
  getCoinMarketCapPrices,
  getKucoinPrices,
} from "./api";

const db = drizzle(process.env.DATABASE_URL!);
export async function getCryptoInfo(
  symbol: string,
  startTime: number,
  market?: MarketPlatform,
) {
  if (market) {
    // (sql`
    //   SELECT *
    //   FROM crypto_details
    //   WHERE symbol = ${symbol}
    //   AND market = ${market}
    //   AND created_time >= ${startTime}
    //   ORDER BY created_time DESC
    // `);
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
      createdTime: sql<number>`MAX(${CRYPTO_DETAILS.createdTime})`,
      averagePrice: sql<number>`AVG(${CRYPTO_DETAILS.price})`,
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

  return result.map((item: any) => ({
    ...item,
    average_price: Number(item.average_price),
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
  if (rows.length > 0) {
    //     await irasNewDialectForgoodDatabases`
    //   INSERT INTO crypto_details
    //   ${irasNewDialectForgoodDatabases(rows, "symbol", "market", "price", "created_time")}
    // `;

  

    await db.insert(CRYPTO_DETAILS).values(rows);
  }
}
