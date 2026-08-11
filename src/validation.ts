import uniqueSymbols from "../symbols/unique_symbols.json";

export function isValidSymbol(symbol: string): boolean {
  return uniqueSymbols.includes(symbol);
}

export type MarketPlatform =
  | "CoinMarketCap"
  | "CoinBase"
  | "Kucoin"
  | "CoinStats";
export const MARKETS = [
  "CoinMarketCap",
  "CoinBase",
  "Kucoin",
  "CoinStats",
] as const;
export function isValidMarket(market: string): market is MarketPlatform {
  return MARKETS.includes(market as MarketPlatform);
}

export type CryptoPeriod = "30m" | "1h" | "3h" | "6h" | "12h" | "24h";
export const PERIODS: CryptoPeriod[] = ["30m", "1h", "3h", "6h", "12h", "24h"];

export function isValidPeriod(value: string): value is CryptoPeriod {
  return PERIODS.includes(value as CryptoPeriod);
}
export function getPeriodMilliseconds(period: CryptoPeriod): number {
  const periods: Record<CryptoPeriod, number> = {
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "3h": 3 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
  };

  return periods[period];
}
