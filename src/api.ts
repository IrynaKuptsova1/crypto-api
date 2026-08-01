import type { CryptoInfo } from "./draft";

const CMC_KEY = process.env.CMC_API_KEY || "";

async function getCoinBasePrice(symbol: string): Promise<CryptoInfo> {
  const res = await fetch(
    `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`,
  );

  if (!res.ok) throw new Error("CoinBase error");

  const data = await res.json();

  return {
    symbol,
    market: "CoinBase",
    price: Number(data.data.amount),
    created_time: Date.now(),
  };
}

async function getKucoinPrice(symbol: string): Promise<CryptoInfo> {
  const res = await fetch(
    `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${symbol}-USDT`,
  );

  if (!res.ok) throw new Error("Kucoin error");

  const data = await res.json();

  return {
    symbol,
    market: "Kucoin",
    price: Number(data.data.price),
    created_time: Date.now(),
  };
}

async function getCoinMarketCapPrice(symbol: string): Promise<CryptoInfo> {
  const res = await fetch(
    `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
    {
      headers: {
        "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY!,
      },
    },
  );

  if (!res.ok) throw new Error("CoinMarketCap error");

  const data = await res.json();

  return {
    symbol,
    market: "CoinMarketCap",
    price: data.data[symbol].quote.USD.price,
    created_time: Date.now(),
  };
}

export async function getAllMarketsPrice(
  symbol: string,
): Promise<CryptoInfo[]> {
  return await Promise.all([
    getCoinBasePrice(symbol),
    getKucoinPrice(symbol),
    getCoinMarketCapPrice(symbol),
  ]);
}
