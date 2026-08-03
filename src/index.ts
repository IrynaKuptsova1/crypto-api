import { Hono } from "hono";
import * as queries from "./database";
import { SQL } from "bun";
import coinbaseSymbols from "../symbols/coinbase_symbols.json";
import cmcSymbols from "../symbols/cmc_symbols.json";
import kucoinSymbols from "../symbols/kucoin_symbols.json";
import {
  isValidMarket,
  isValidSymbol,
  type MarketPlatform,
} from "./validation";
import { updateCryptoPrices } from "./database";
import { cors } from "hono/cors";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env");
}

const db = new SQL({
  url: process.env.DATABASE_URL,
});

async function initDatabase() {
  try {
    await db`SELECT 1`;
    console.log("Database connected");
    await db`
      CREATE TABLE IF NOT EXISTS crypto_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        symbol VARCHAR(20) NOT NULL,
        market VARCHAR(50) NOT NULL,
        price DECIMAL(20,8) NOT NULL,
        created_time BIGINT NOT NULL
      )
    `;
    const indexes = await db`
      SHOW INDEX FROM crypto_details
    `;

    const indexExists = indexes.some(
      (index: any) => index.Key_name === "crypto_index",
    );
    if (!indexExists) {
      await db`
        CREATE INDEX crypto_index
        ON crypto_details(symbol, market, created_time)
      `;

      console.log("Index created");
    } else {
      console.log("Index already exists");
    }

    console.log("Database initialized");
  } catch (error) {
    console.error("Database initialization failed");
    console.error(error);
    process.exit(1);
  }
}

await initDatabase();

Bun.cron("*/5 * * * *", async () => {
  console.log("Updating cryptocurrency prices");

  try {
    await updateCryptoPrices();
    console.log("Update completed");
  } catch (error) {
    console.error("Update failed:", error);
  }
});

const app = new Hono();

app.use("*", cors());

app.get("/crypto", async (c) => {
  const symbol = c.req.query("symbol");
  const market = c.req.query("market");
  const startTime = c.req.query("startTime");

  if (!symbol || !isValidSymbol(symbol)) {
    return c.json(
      {
        error: "Unknown cryptocurrency",
      },
      400,
    );
  }

  if (market) {
    if (!isValidMarket(market)) {
      return c.json(
        {
          error: "Unknown market",
        },
        400,
      );
    }

    const marketSymbolsMap: Record<string, string[]> = {
      CoinBase: coinbaseSymbols,
      CoinMarketCap: cmcSymbols,
      Kucoin: kucoinSymbols,
    };

    if (!marketSymbolsMap[market]?.includes(symbol)) {
      return c.json(
        {
          error: "Symbol not available on this market",
        },
        400,
      );
    }
  }

  if (!startTime) {
    return c.json(
      {
        error: "startTime is required",
      },
      400,
    );
  }

  const startTimeNumber = Number(startTime);

  if (Number.isNaN(startTimeNumber)) {
    return c.json(
      {
        error: "startTime must be milliseconds",
      },
      400,
    );
  }

  const data = await queries.getCryptoInfo(
    symbol,
    startTimeNumber,
    market as MarketPlatform | undefined,
  );

  return c.json(data);
});

export default app;
