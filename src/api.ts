import type { Env } from "./db/database";
export type CryptoInfo = {
  [symbol: string]: number;
};

export async function getCoinBasePrices(): Promise<CryptoInfo> {
  const response = await fetch(
    "https://api.coinbase.com/v2/exchange-rates?currency=USD",
  );

  if (!response.ok) {
    throw new Error("CoinBase API error");
  }
  const data = await response.json();
  const prices: CryptoInfo = {};
  for (const [symbol, rate] of Object.entries(data.data.rates)) {
    const value = Number(rate);
    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }
    prices[symbol] = 1 / value;
  }
  return prices;
}

export async function getCoinMarketCapPrices(env: Env): Promise<CryptoInfo> {
  if (!env.CMC_API_KEY) {
    throw new Error("CMC_API_KEY is missing");
  }

  const response = await fetch(
    "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000",
    {
      headers: {
        "X-CMC_PRO_API_KEY": env.CMC_API_KEY,
      },
    },
  );

  if (!response.ok) {
    console.log(await response.text());
    throw new Error("CoinMarketCap API error");
  }
  const data = await response.json();
  const prices: CryptoInfo = {};
  for (const coin of data.data) {
    const price = Number(coin.quote.USD.price);
    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }
    if (!prices[coin.symbol]) {
      prices[coin.symbol] = price;
    }
  }

  return prices;
}

export async function getKucoinPrices(): Promise<CryptoInfo> {
  const response = await fetch("https://api.kucoin.com/api/v1/prices?base=USD");

  if (!response.ok) {
    throw new Error("Kucoin API error");
  }
  const data = await response.json();
  const prices: CryptoInfo = {};
  for (const [symbol, price] of Object.entries(data.data)) {
    const value = Number(price);

    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }
    prices[symbol] = value;
  }
  return prices;
}
export async function getCoinStatsPrices(env: Env): Promise<CryptoInfo> {
  if (!env.COINSTATS_API_KEY) {
    throw new Error("COINSTATS_API_KEY is missing");
  }
  const response = await fetch(
    "https://api.coinstats.app/v1/coins?limit=1000",
    {
      headers: {
        "X-API-KEY": env.COINSTATS_API_KEY,
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("CoinStats API error:", errorText);
    throw new Error(`CoinStats API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    result: Array<{ symbol: string; price: number }>;
    meta: { itemCount: number };
  };

  const prices: CryptoInfo = {};
  for (const coin of data.result) {
    const price = Number(coin.price);

    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }
    if (!prices[coin.symbol]) {
      prices[coin.symbol] = price;
    }
  }

  console.log(`CoinStats fetched: ${Object.keys(prices).length} coins`);

  return prices;
}

export async function sendMessage(
  env: Env,
  chatId: number,
  text: string,
  replyMarkup?: object,
) {
  if (!env.TELEGRAM_TOKEN) {
    throw new Error("TELEGRAM_TOKEN is missing");
  }
  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: replyMarkup,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Telegram error: ${await response.text()}`);
  }

  return response.json();
}
