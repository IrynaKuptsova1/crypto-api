import { SQL } from "bun";
import type { MarketPlatform } from "./validation";
import uniqueSymbols from "./unique_symbols.json";
import { getAllMarketsPrice } from "./api";

const db = new SQL({
  url: "sqlite://./database/crypto.db",
});

export interface CryptoInfo {
  symbol: string;
  market: MarketPlatform;
  price: number;
  created_time: number;
}

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
    INSERT INTO crypto_details
    (symbol, market, price, created_time)

    VALUES
    (${data.symbol}, ${data.market}, ${data.price}, ${data.created_time})
  `;
}

export async function getCryptoInfo(
  symbol: string,
  startTime: number,
  market?: MarketPlatform,
) {
  const query = market
    ? db`
        SELECT *
        FROM crypto_details

        WHERE symbol = ${symbol}
        AND market = ${market}
        AND created_time >= ${startTime}

        ORDER BY created_time DESC
      `
    : db`
        SELECT
          symbol,
          AVG(price) AS average_price

        FROM crypto_details

        WHERE symbol = ${symbol}
        AND created_time >= ${startTime}

        GROUP BY symbol
      `;

  return await query
}

export async function updateCryptoPrices() {

  for (const symbol of uniqueSymbols) {
    try {
      const prices = await getAllMarketsPrice(symbol);
      for (const crypto of prices) {
        await saveCrypto(crypto);
      }
      console.log(`${symbol} updated`);

    } catch (error) {

      console.log(
        `${symbol} update failed`,
        error
      );

    }
  }}
export async function checkData() {
  const rows = await db`
    SELECT *
    FROM crypto_details
  `;

  console.log(rows);
}