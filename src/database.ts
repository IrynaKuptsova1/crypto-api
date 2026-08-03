import { SQL } from "bun";
import type { MarketPlatform } from "./validation";
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
    created_time: number;
  }> = [];
  const created_time = Date.now();

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const market = markets[index]; 
      for (const [symbol, price] of Object.entries(result.value)) {
        rows.push({
          symbol,
          market,
          price,
          created_time,
        });
      }
    }
  });
  if (rows.length > 0) {
    await irasNewDialectForgoodDatabases`
  INSERT INTO crypto_details
  ${irasNewDialectForgoodDatabases(rows, "symbol", "market", "price", "created_time")}
`;
  }
}
