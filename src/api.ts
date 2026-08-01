import { isSymbolAvailableOnMarket } from "./markets";
import type { MarketPlatform } from "./validation";

export interface CryptoInfo {
  symbol: string;
  market: MarketPlatform;
  price: number;
  created_time: number;
}

export async function getCoinBasePrice(symbol: string): Promise<number> {
  const response = await fetch(
    `https://api.exchange.coinbase.com/products/${symbol}-USD/ticker`,
  );
  if (!response.ok) {
    throw new Error("CoinBase API error");
  }
  const data = await response.json();
  return Number(data.price);
}

export async function getCoinMarketCapPrice(symbol: string): Promise<number> {
  const response = await fetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
    {
      headers: { "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY! },
    },
  );

  if (!response.ok) {
    throw new Error("CoinMarketCap API error");
  }
  const data = await response.json();
  return Number(data.data[symbol].quote.USD.price);
}
export async function getKucoinPrice(symbol: string): Promise<number> {
  const response = await fetch(
    `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}-USDT`,
  );

  if (!response.ok) {
    throw new Error("Kucoin API error");
  }
  const data = await response.json();
  return Number(data.data.price);
}
export async function getAllMarketsPrice(
  symbol: string,
): Promise<CryptoInfo[]> {
  const result: CryptoInfo[] = [];

  if (isSymbolAvailableOnMarket(symbol, "CoinBase")) {
    const price = await getCoinBasePrice(symbol);

    result.push({
      symbol,
      market: "CoinBase",
      price,
      created_time: Date.now(),
    });
  }

  if (isSymbolAvailableOnMarket(symbol, "CoinMarketCap")) {
    const price = await getCoinMarketCapPrice(symbol);

    result.push({
      symbol,
      market: "CoinMarketCap",
      price,
      created_time: Date.now(),
    });
  }

  if (isSymbolAvailableOnMarket(symbol, "Kucoin")) {
    const price = await getKucoinPrice(symbol);
    result.push({
      symbol,
      market: "Kucoin",
      price,
      created_time: Date.now(),
    });
  }

  return result;
}
