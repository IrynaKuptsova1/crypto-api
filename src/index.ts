import { Hono } from "hono";
import { cors } from "hono/cors";
import coinbaseSymbols from "../symbols/coinbase_symbols.json";
import cmcSymbols from "../symbols/cmc_symbols.json";
import kucoinSymbols from "../symbols/kucoin_symbols.json";
import coinstatsSymbols from "../symbols/coinstats_symbols.json"
import telegram from "./bot";
import { getCryptoInfo, updateCryptoPrices } from "./db/database";
import type { Env } from "./db/database";
import {
  isValidMarket,
  isValidSymbol,
  type MarketPlatform,
} from "./validation";

import type {
  ScheduledController,
  ExecutionContext,
} from "@cloudflare/workers-types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/crypto", async (c) => {
  try {
    const symbol = c.req.query("symbol");
    const market = c.req.query("market");
    const startTime = c.req.query("startTime");
    const endTime = c.req.query("endTime");

    if (!startTime) {
      return c.json(
        {
          error: "startTime is required",
        },
        400,
      );
    }

    const startTimeNumber = Number(startTime);

    if (!Number.isFinite(startTimeNumber)) {
      return c.json(
        {
          error: "startTime must be milliseconds",
        },
        400,
      );
    }

    let endTimeNumber: number | undefined;

    if (endTime !== undefined) {
      endTimeNumber = Number(endTime);

      if (!Number.isFinite(endTimeNumber)) {
        return c.json(
          {
            error: "endTime must be milliseconds",
          },
          400,
        );
      }

      if (endTimeNumber < startTimeNumber) {
        return c.json(
          {
            error: "endTime must be greater than or equal to startTime",
          },
          400,
        );
      }
    }

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
        CoinStats: coinstatsSymbols,
      };

      const symbols = marketSymbolsMap[market];

      if (!symbols?.includes(symbol.toUpperCase())) {
        return c.json(
          {
            error: "Symbol not available on this market",
          },
          400,
        );
      }
    }

    const data = await getCryptoInfo(
      c.env,
      symbol,
      startTimeNumber,
      endTimeNumber,
      market as MarketPlatform | undefined,
    );

    return c.json(data);
  } catch (error) {
    console.error("GET /crypto failed:", error);

    return c.json(
      {
        error: "Failed to fetch cryptocurrency data",
      },
      500,
    );
  }
});

app.route("/telegram", telegram);

export default {
  fetch: app.fetch,

  async scheduled(
    _controller: ScheduledController,
    env: Env,
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
