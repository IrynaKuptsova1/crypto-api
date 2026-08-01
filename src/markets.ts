import coinbaseSymbols from "../symbols/coinbase_symbols.json";
import cmcSymbols from "../symbols/cmc_symbols.json";
import kucoinSymbols from "../symbols/kucoin_symbols.json";

import type { MarketPlatform } from "./validation";

export function isSymbolAvailableOnMarket(
  symbol: string,
  market: MarketPlatform,
) {
  switch (market) {
    case "CoinBase":
      return coinbaseSymbols.includes(symbol);

    case "CoinMarketCap":
      return cmcSymbols.includes(symbol);

    case "Kucoin":
      return kucoinSymbols.includes(symbol);

    default:
      return false;
  }
}
