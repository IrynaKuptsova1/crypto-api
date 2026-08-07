import { Hono } from "hono";
import { sendMessage } from "./api";

const telegram = new Hono();

telegram.post("/webhook", async (c) => {
  const update = await c.req.json();

  const chatId = update.message?.chat?.id;
  const text = update.message?.text;

  if (!chatId || !text) {
    return c.text("OK");
  }

  if (text === "/start") {
    await sendMessage(chatId, "Welcome to Crypto Bot");
  }

  return c.text("OK");
});

export default telegram;
