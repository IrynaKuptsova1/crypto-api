import { Hono } from "hono";
import { sendMessage } from "./api";

import {
  addFavourite,
  deleteFavourite,
  getFavourite,
  getCryptoHistory,
  getRecentCrypto,
  isFavourite,
} from "./db/database";
import type { Env } from "./db/database";
import { isValidPeriod, CryptoPeriod } from "./validation";
const bot = new Hono<{ Bindings: Env }>();

bot.post("/webhook", async (c) => {
  console.log("WEBHOOK RECEIVED");
  const update = await c.req.json();
  console.log("UPDATE:", update);
  if (update.callback_query) {
    const callback = update.callback_query;
    const chatId = callback.message.chat.id;
    const data: string = callback.data || "";
    if (data.startsWith("add_")) {
      const symbol = data.replace("add_", "");
      await addFavourite(c.env, chatId, symbol);
      await sendMessage(chatId, `${symbol} added to favourites`);
      return c.text("OK");
    }
    if (data.startsWith("delete_")) {
      const symbol = data.replace("delete_", "");
      await deleteFavourite(c.env, chatId, symbol);
      await sendMessage(chatId, `${symbol} removed from favourites`);
      return c.text("OK");
    }
    if (data.startsWith("period_")) {
      const parts = data.split("_");
      const symbol = parts[1];
      const period = parts[2];
      if (!symbol || !period) {
        return c.text("OK");
      }
      if (!isValidPeriod(period)) {
        await sendMessage(chatId, "Invalid period.");
        return c.text("OK");
      }
      const history = await getCryptoHistory(c.env, symbol, period);
      if (history.length === 0) {
        await sendMessage(
          chatId,
          `No data found for ${symbol} for the last ${period}.`,
        );
        return c.text("OK");
      }
      const historyText = history
        .map(
          (item) =>
            `${new Date(item.createdTime).toISOString()} — $${item.averagePrice.toFixed(2)}`,
        )
        .join("\n");
      const favourite = await isFavourite(c.env, chatId, symbol);
      await sendMessage(
        chatId,
        `${symbol}
Average price history for the last ${period}:
${historyText}`,
        {
          inline_keyboard: [
            [
              {
                text: favourite ? "Remove from following" : "Add to following",
                callback_data: favourite ? `delete_${symbol}` : `add_${symbol}`,
              },
            ],
          ],
        },
      );
      return c.text("OK");
    }
    return c.text("OK");
  }
  const message = update.message;
  if (!message) {
    return c.text("OK");
  }
  const chatId = message.chat.id;
  const text: string = message.text || "";
  if (text === "/start") {
    await sendMessage(
      chatId,
      `Welcome to Crypto Bot.
Use /help to see available commands.`,
    );
  } else if (text === "/help") {
    await sendMessage(
      chatId,
      `Commands:

/listRecent
/listFavourite
/addToFavourite BTC
/deleteFavourite BTC

You can also request a cryptocurrency:
/BTC
/ETH
/SOL`,
    );
  } else if (text.startsWith("/addToFavourite")) {
    const symbol = text.split(" ")[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(chatId, "Symbol required");
      return c.text("OK");
    }
    await addFavourite(c.env, chatId, symbol);
    await sendMessage(chatId, `${symbol} added to favourites`);
  } else if (text.startsWith("/deleteFavourite")) {
    const symbol = text.split(" ")[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(chatId, "Symbol required");
      return c.text("OK");
    }
    await deleteFavourite(c.env, chatId, symbol);
    await sendMessage(chatId, `${symbol} removed from favourites`);
  } else if (text === "/listFavourite") {
    const coins = await getFavourite(c.env, chatId);
    if (coins.length === 0) {
      await sendMessage(chatId, "Your favourites list is empty.");
      return c.text("OK");
    }
    const result = coins.map((coin) => `/${coin.symbol}`).join("\n");
    await sendMessage(chatId, result);
  } else if (text === "/listRecent") {
    const coins = await getRecentCrypto(c.env);
    if (coins.length === 0) {
      await sendMessage(chatId, "No cryptocurrency data available.");
      return c.text("OK");
    }
    const result = coins
      .map((coin) => `/${coin.symbol} $${coin.price.toFixed(2)}`)
      .join("\n");
    await sendMessage(chatId, result);
  } else if (/^\/[a-zA-Z0-9]+$/.test(text)) {
    const symbol = text.substring(1).toUpperCase();
    await sendMessage(
      chatId,
      `${symbol}
Choose period:`,
      {
        inline_keyboard: [
          [
            {
              text: "30m",
              callback_data: `period_${symbol}_30m`,
            },
            {
              text: "1h",
              callback_data: `period_${symbol}_1h`,
            },
          ],
          [
            {
              text: "3h",
              callback_data: `period_${symbol}_3h`,
            },
            {
              text: "6h",
              callback_data: `period_${symbol}_6h`,
            },
          ],
          [
            {
              text: "12h",
              callback_data: `period_${symbol}_12h`,
            },
            {
              text: "24h",
              callback_data: `period_${symbol}_24h`,
            },
          ],
        ],
      },
    );
  }

  return c.text("OK");
});

export default bot;
