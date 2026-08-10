import { Hono } from "hono";
import { sendMessage } from "./api";

import {
  addFavourite,
  deleteFavourite,
  getFavourite,
  isFavourite,
  getRecentCrypto,
  getCryptoHistory,
} from "./db/database";

import type { Env } from "./db/database";

const bot = new Hono<{ Bindings: Env }>();

bot.post("/webhook", async (c) => {
  console.log("WEBHOOK RECEIVED");
  const update = await c.req.json();
  console.log("UPDATE:", update);
  if (update.callback_query) {
    const callback = update.callback_query;
    const chatId = callback.message.chat.id;
    const data = callback.data;
    if (data.startsWith("add_")) {
      const symbol = data.replace("add_", "");
      await addFavourite(c.env, chatId, symbol);
      await sendMessage(chatId, `${symbol} added to favourites`);
    }
    if (data.startsWith("delete_")) {
      const symbol = data.replace("delete_", "");
      await deleteFavourite(c.env, chatId, symbol);
      await sendMessage(chatId, `${symbol} removed from favourites`);
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
  }

  else if (text === "/help") {
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
  }

  else if (text.startsWith("/addToFavourite")) {
    const symbol = text.split(" ")[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(chatId, "Symbol required");
      return c.text("OK");
    }
    await addFavourite(c.env, chatId, symbol);
    await sendMessage(chatId, `${symbol} added to favourites`);
  }
  else if (text.startsWith("/deleteFavourite")) {
    const symbol = text.split(" ")[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(chatId, "Symbol required");
      return c.text("OK");
    }
    await deleteFavourite(c.env, chatId, symbol);
    await sendMessage(chatId, `${symbol} removed from favourites`);
  }
  else if (text === "/listFavourite") {
    const coins = await getFavourite(c.env, chatId);
    if (coins.length === 0) {
      await sendMessage(chatId, "Your favourites list is empty.");
      return c.text("OK");
    }
    const result = coins.map((coin) => `/${coin.symbol}`).join("\n");
    await sendMessage(chatId, result);
  }
  else if (text === "/listRecent") {
    const coins = await getRecentCrypto(c.env);
    const result = coins
      .map((coin) => `/${coin.symbol} $${coin.price.toFixed(2)}`)
      .join("\n");
    await sendMessage(chatId, result);
  }
  else if (/^\/[a-zA-Z0-9]+$/.test(text)) {
    const symbol = text.substring(1).toUpperCase();
    const startTime = Date.now() - 24 * 60 * 60 * 1000;
    const data = await getCryptoHistory(c.env, symbol, startTime);
    const favourite = await isFavourite(c.env, chatId, symbol);
    const history = data
      .map(
        (item) =>
          `${new Date(item.createdTime).toISOString()} — $${item.averagePrice.toFixed(2)}`,
      )
      .join("\n");

    await sendMessage(
      chatId,
      `${symbol}
Average price history for the last 24 hours:
${history}`,
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
  }

  return c.text("OK");
});

export default bot;
