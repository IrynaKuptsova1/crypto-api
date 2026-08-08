import { Hono } from "hono";
import { sendMessage } from "./api";
import {
  addFavourite,
  deleteFavourite,
  getFavourite,
  isFavourite,
  getCryptoInfo,
  getRecentCrypto,
} from "./database";

const bot = new Hono();

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
      await addFavourite(chatId, symbol);
      await sendMessage(chatId, `${symbol} added to favourites`);
    }
    if (data.startsWith("delete_")) {
      const symbol = data.replace("delete_", "");
      await deleteFavourite(chatId, symbol);
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
      `Welcome to Crypto Bot
Use /help to see commands.`,
    );
  } else if (text === "/help") {
    await sendMessage(
      chatId,
      `
Commands:

/listRecent
/listFavourite

/addToFavourite BTC
/deleteFavourite BTC

/BTC
/ETH
/SOL
`,
    );
  } else if (text.startsWith("/addToFavourite")) {
    const symbol = text.split(" ")[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(chatId, "Symbol required");
      return c.text("OK");
    }
    await addFavourite(chatId, symbol);
    await sendMessage(chatId, `${symbol} added`);
  } else if (text.startsWith("/deleteFavourite")) {
    const symbol = text.split(" ")[1]?.toUpperCase();
    if (!symbol) {
      await sendMessage(chatId, "Symbol required");
      return c.text("OK");
    }
    await deleteFavourite(chatId, symbol);
    await sendMessage(chatId, `${symbol} removed`);
  } else if (text === "/listFavourite") {
    const coins = await getFavourite(chatId);
    const result = coins.map((c) => `/${c.symbol}`).join("\n");
    await sendMessage(chatId, result);
  } else if (text === "/listRecent") {
    const coins = await getRecentCrypto();
    const result = coins
      .map((coin) => `${coin.symbol}: ${coin.price}`)
      .join("\n");
    await sendMessage(chatId, result);
  } else if (/^\/[a-zA-Z0-9]+$/.test(text)) {
    const symbol = text.substring(1).toUpperCase();
    const data = await getCryptoInfo(symbol, Date.now() - 24 * 60 * 60 * 1000);
    const favourite = await isFavourite(chatId, symbol);
    await sendMessage(
      chatId,
      `${symbol}
Last 24 hours:
${JSON.stringify(data, null, 2)}
`,
      {
        inline_keyboard: [
          [
            {
              text: favourite ? "Remove favourite" : "Add favourite",
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
