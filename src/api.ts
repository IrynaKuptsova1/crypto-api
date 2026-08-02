import type { MarketPlatform } from "./validation";
export interface CryptoInfo {
  symbol: string;
  market: MarketPlatform;
  price: number;
  created_time: number;
}

export async function getCoinBasePrices(): Promise<CryptoInfo[]> {
  const response = await fetch("https://api.coinbase.com/v2/exchange-rates");

  if (!response.ok) {
    throw new Error("CoinBase API error");
  }
  const data = await response.json();
  const created_time = Date.now();
  const prices: CryptoInfo[] = [];
  for (const [symbol, rate] of Object.entries(data.data.rates)) {
    const value = Number(rate);

    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }

    prices.push({
      symbol,
      market: "CoinBase",
      price: 1 / value,
      created_time,
    });
  }

  return prices;
}

export async function getCoinMarketCapPrices(): Promise<CryptoInfo[]> {
  const response = await fetch("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000",
    {
      headers: {
        "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY!,
      },
    },
  );

  if (!response.ok) {
    console.log(await response.text());
    throw new Error("CoinMarketCap API error");
  }

  const data = await response.json();
  const created_time = Date.now()
  const prices: CryptoInfo[] = [];
  for (const coin of data.data) {
    prices.push({
      symbol: coin.symbol,
      market: "CoinMarketCap",
      price: Number(coin.quote.USD.price),
      created_time,
    });
  }

  return prices;
}

export async function getKucoinPrices(): Promise<CryptoInfo[]> {
  const response = await fetch("https://api.kucoin.com/api/v1/prices?base=USD");

  if (!response.ok) {
    throw new Error("Kucoin API error");
  }
  const data = await response.json();
  const created_time = Date.now();
  const prices: CryptoInfo[] = [];
  for (const coin of data.data) {
    prices.push({
      symbol: coin.symbol,
      market: "CoinMarketCap",
      price: Number(coin.quote.USD.price),
      created_time,
    });
  }
  return prices;
}
