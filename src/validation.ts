import uniqueSymbols from "./unique_symbols.json";

export type MarketPlatform = "CoinMarketCap" | "CoinBase" | "Kucoin";
export type Period = "15m" | "1h" | "4h" | "24h";

export function isValidSymbol(symbol: string) {
  return uniqueSymbols.includes(symbol);
}

export const MARKETS = ["CoinMarketCap", "CoinBase", "Kucoin"] as const;

export function isValidMarket(market: string): market is MarketPlatform {
  return MARKETS.includes(market as MarketPlatform);
}

export function isValidPeriod(period: string): period is Period {
  const periods: Period[] = ["15m", "1h", "4h", "24h"];

  return periods.includes(period as Period);
}

export function getPeriodMillisec(period: Period) {
  const periods = {
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
  };
  return Date.now() - periods[period];
}
