import { Hono } from "hono";
import * as queries from "./database";
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
import telegram from "./bot";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env");
}

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

    if (!marketSymbolsMap[market]?.includes(symbol.toUpperCase())) {
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
    market as MarketPlatform,
  );

  return c.json(data);
});
app.route("/telegram", telegram);
export default app;
