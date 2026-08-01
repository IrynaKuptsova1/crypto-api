import { SQL } from "bun";

import type { MarketPlatform } from "./validation";
import type { CryptoInfo } from "./api";

import {
  getCoinBasePrices,
  getCoinMarketCapPrices,
  getKucoinPrices,
} from "./api";

const db = new SQL({
  url: process.env.DATABASE_URL,
});

export async function createTable() {
  await db`
    CREATE TABLE IF NOT EXISTS crypto_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      market TEXT NOT NULL,
      price REAL NOT NULL,
      created_time INTEGER NOT NULL
    )
  `;

  await db`
    CREATE INDEX IF NOT EXISTS crypto_index
    ON crypto_details(symbol, market, created_time)
  `;
}

export async function saveCrypto(data: CryptoInfo) {
  await db`
    INSERT INTO crypto_details (
      symbol,
      market,
      price,
      created_time
    )
    VALUES (
      ${data.symbol},
      ${data.market},
      ${data.price},
      ${data.created_time}
    )
  `;
}

export async function getCryptoInfo(
  symbol: string,
  startTime: number,
  market?: MarketPlatform,
) {
  if (market) {
    return db`
      SELECT *
      FROM crypto_details
      WHERE symbol = ${symbol}
      AND market = ${market}
      AND created_time >= ${startTime}
      ORDER BY created_time DESC
    `;
  }

  return db`
    SELECT
      created_time,
      AVG(price) AS average_price
    FROM crypto_details
    WHERE symbol = ${symbol}
    AND created_time >= ${startTime}
    GROUP BY FLOOR(created_time / 300000)
    ORDER BY created_time DESC
  `;
}

export async function updateCryptoPrices() {
  const [coinBasePrices, coinMarketCapPrices, kucoinPrices] = await Promise.all(
    [getCoinBasePrices(), getCoinMarketCapPrices(), getKucoinPrices()],
  );

  const prices = [...coinBasePrices, ...coinMarketCapPrices, ...kucoinPrices];

  for (const crypto of prices) {
    await saveCrypto(crypto);
  }

  console.log(`Saved ${prices.length} prices`);
}
