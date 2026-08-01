import uniqueSymbols from "../symbols/unique_symbols.json";

export type MarketPlatform = "CoinMarketCap" | "CoinBase" | "Kucoin";

export const MARKETS = ["CoinMarketCap", "CoinBase", "Kucoin"] as const;

export function isValidSymbol(symbol: string): boolean {
  return uniqueSymbols.includes(symbol);
}

export function isValidMarket(market: string): market is MarketPlatform {
  return MARKETS.includes(market as MarketPlatform);
}

