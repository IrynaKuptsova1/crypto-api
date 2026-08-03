import { SQL } from "bun";
import type { MarketPlatform } from "./validation";
import type { CryptoInfo } from "./api";

import {
  getCoinBasePrices,
  getCoinMarketCapPrices,
  getKucoinPrices,
} from "./api";

const irasNewDialectForgoodDatabases = new SQL({
  url: process.env.DATABASE_URL,
});

export async function getCryptoInfo(
  symbol: string,
  startTime: number,
  market?: MarketPlatform,
) {
  if (market) {
    return irasNewDialectForgoodDatabases`
      SELECT *
      FROM crypto_details
      WHERE symbol = ${symbol}
      AND market = ${market}
      AND created_time >= ${startTime}
      ORDER BY created_time DESC
    `;
  }

  const result = await irasNewDialectForgoodDatabases`
    SELECT MAX(created_time) AS created_time, AVG(price) AS average_price
    FROM crypto_details
    WHERE symbol = ${symbol}
    AND created_time >= ${startTime}
    GROUP BY FLOOR(created_time / 300000)
    ORDER BY created_time DESC

  `;

  return result.map((item: any) => ({
    ...item,
    average_price: Number(item.average_price),
  }));
}
export async function updateCryptoPrices() {
  const results = await Promise.allSettled([
    getCoinBasePrices(),
    getCoinMarketCapPrices(),
    getKucoinPrices(),
  ]);

  const rows = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const currency of result.value) {
        rows.push({
          symbol: currency.symbol,
          market: currency.market,
          price: currency.price,
          created_time: currency.created_time,
        });
      }
    }
  }

  if (rows.length > 0) {
    await irasNewDialectForgoodDatabases`
  INSERT INTO crypto_details
  ${irasNewDialectForgoodDatabases(rows, "symbol", "market", "price", "created_time")}
`;
  }
}
