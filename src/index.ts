import { Hono } from "hono";
import { cors } from "hono/cors";

import coinbaseSymbols from "../symbols/coinbase_symbols.json";
import cmcSymbols from "../symbols/cmc_symbols.json";
import kucoinSymbols from "../symbols/kucoin_symbols.json";
import { updateCryptoPrices, getCryptoInfo } from "./db/database";
import {
  isValidMarket,
  isValidSymbol,
  type MarketPlatform,
} from "./validation";

import telegram from "./bot";
import type { D1Database, ScheduledController,
  ExecutionContext, } from "@cloudflare/workers-types";


type Bindings = {
  crypto_db: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

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

  const data = await getCryptoInfo(
    c.env,
    symbol,
    startTimeNumber,
    market as MarketPlatform | undefined,
  );

  return c.json(data);
});

app.route("/telegram", telegram);

export default {
  fetch: app.fetch,

  async scheduled(
    _controller: ScheduledController,
    env: Bindings,
    _ctx: ExecutionContext,
  ) {
    console.log("Updating cryptocurrency prices");

    try {
      await updateCryptoPrices(env);
      console.log("Update completed");
    } catch (error) {
      console.error("Update failed:", error);
    }
  },
};
