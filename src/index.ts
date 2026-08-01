import { Hono } from "hono";

import { createTable, getCryptoInfo, checkData} from "./draft";

import * as validation from "./validation";

const app = new Hono();
await createTable();
await checkData();

app.get("/crypto", async (c) => {
  const symbol = c.req.query("symbol");
  const market = c.req.query("market");
  const period = c.req.query("period");

  if (!symbol || !validation.isValidSymbol(symbol)) {
    return c.json({ error: "Invalid symbol" }, 400);
  }

  if (!period || !validation.isValidPeriod(period)) {
    return c.json({ error: "Invalid period" }, 400);
  }

  let validMarket: validation.MarketPlatform | undefined;

  if (market) {
    if (!validation.isValidMarket(market)) {
      return c.json({ error: "Invalid market" }, 400);
    }

    validMarket = market;
  }

  const startTime = validation.getPeriodMillisec(period);

  const data = await getCryptoInfo(symbol, startTime, validMarket);

  return c.json(data);
});

export default app;
