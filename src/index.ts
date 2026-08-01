import { Hono } from "hono";
import * as queries from "./database";
import { startCron } from "./cron";
import {
  isValidMarket,
  isValidSymbol,
  type MarketPlatform,
} from "./validation";
import { isSymbolAvailableOnMarket } from "./markets";

const app = new Hono();

await queries.createTable();
await queries.updateCryptoPrices();
startCron();

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

    if (!isSymbolAvailableOnMarket(symbol, market)) {
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
