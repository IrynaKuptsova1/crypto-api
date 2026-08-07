import { Hono } from "hono";
import { sendMessage } from "./api";
import {
  addFavourite,
  deleteFavourite,
  getFavourite,
  isFavourite,
  getCryptoInfo,
} from "./database";

const telegram = new Hono();
telegram.post("/webhook", async (c) => {
  const update = await c.req.json();
  const message = update.message;
  if (!message) {
    return c.text("OK");
  }
  const chatId = message.chat.id;
  const text: string = message.text;
  if (text === "/start") {
    await sendMessage(
      chatId,
      `Welcome to Crypto Bot 
      Use /help to see commands.`,
    );
  }else if (text === "/help") {
    await sendMessage(
      chatId,
      `Commands:
      /listRecent
      /listFavourite
      /addToFavourite BTС
      /deleteFavourite BTC
      /BTC`,
    );
  } else if (text.startsWith("/addToFavourite")) {
    const symbol = text.split(" ")[1];
    await addFavourite(chatId, symbol);
    await sendMessage(chatId, `${symbol} added`);
  } else if (text.startsWith("/deleteFavourite")) {
    const symbol = text.split(" ")[1];
    await deleteFavourite(chatId, symbol);
    await sendMessage(chatId, `${symbol} removed`);
  } else if (text === "/listFavourite") {
    const coins = await getFavourite(chatId);
    const result = coins.map((c) => `/${c.symbol}`).join("\n");
    await sendMessage(chatId, result || "Empty");
  } else if (text.startsWith("/")) {
    const symbol = text.substring(1).toUpperCase();
    const data = await getCryptoInfo(symbol, Date.now() - 86400000);
    await sendMessage(
      chatId,
      `${symbol}
Last 24 hours:
${JSON.stringify(data)} `,
    );
  }

  return c.text("OK");
});

export default telegram;
