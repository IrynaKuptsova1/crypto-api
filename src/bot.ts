import { Hono } from "hono";

import {
  addFavourite,
  deleteFavourite,
  getFavourite,
  getCryptoHistory,
  getRecentCrypto,
  isFavourite,
} from "./db/database";

import type { Env } from "./db/database";
import { isValidSymbol, type CryptoPeriod } from "./validation";

import { sendMessage } from "./api";

const bot = new Hono<{ Bindings: Env }>();

type TelegramUser = {
  id: number;
  first_name?: string;
  username?: string;
};

type TelegramChat = {
  id: number;
};

type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

const PERIODS: Array<{
  label: string;
  value: CryptoPeriod;
}> = [
  { label: "30 min", value: "30m" },
  { label: "1 hour", value: "1h" },
  { label: "3 hours", value: "3h" },
  { label: "6 hours", value: "6h" },
  { label: "12 hours", value: "12h" },
  { label: "24 hours", value: "24h" },
];

function periodKeyboard(symbol: string) {
  return {
    inline_keyboard: [
      PERIODS.slice(0, 3).map((period) => ({
        text: period.label,
        callback_data: `period_${symbol}_${period.value}`,
      })),
      PERIODS.slice(3).map((period) => ({
        text: period.label,
        callback_data: `period_${symbol}_${period.value}`,
      })),
    ],
  };
}

function favouriteKeyboard(symbol: string, favourite: boolean) {
  if (favourite) {
    return {
      inline_keyboard: [
        [
          {
            text: "Delete from favourites",
            callback_data: `delete_${symbol}`,
          },
        ],
        [
          {
            text: "Price history",
            callback_data: `history_${symbol}`,
          },
        ],
      ],
    };
  }

  return {
    inline_keyboard: [
      [
        {
          text: "Add to favourites",
          callback_data: `add_${symbol}`,
        },
      ],
      [
        {
          text: "Price history",
          callback_data: `history_${symbol}`,
        },
      ],
    ],
  };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 8,
  }).format(price);
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US");
}

async function answerCallbackQuery(
  env: Env,
  callbackQueryId: string,
  text?: string,
) {
  const url = `https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/answerCallbackQuery`;

  const body: {
    callback_query_id: string;
    text?: string;
  } = {
    callback_query_id: callbackQueryId,
  };

  if (text) {
    body.text = text;
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function handleStart(env: Env, chatId: number) {
  await sendMessage(
    env,
    chatId,
    `Welcome to Crypto Bot!

Available commands:

/start - start the bot
/help - show available commands
/listRecent - show recently updated cryptocurrencies
/addToFavourite BTC - add BTC to favourites
/listFavourite - show your favourites
/deleteFavourite BTC - remove BTC from favourites

You can also send a cryptocurrency symbol directly, for example:

BTC
ETH
SOL`,
  );
}

async function handleHelp(env: Env, chatId: number) {
  await sendMessage(
    env,
    chatId,
    `Crypto Bot commands:

/start
Start the bot.

/help
Show this help message.

/listRecent
Show recently updated cryptocurrencies.

/addToFavourite BTC
Add BTC to your favourites.

/listFavourite
Show your favourite cryptocurrencies.

/deleteFavourite BTC
Remove BTC from your favourites.

You can also send a symbol directly:

BTC
ETH
SOL

After selecting a cryptocurrency, you can view its price history for:
30m, 1h, 3h, 6h, 12h or 24h.`,
  );
}

async function handleListRecent(env: Env, chatId: number) {
  const cryptocurrencies = await getRecentCrypto(env);

  if (cryptocurrencies.length === 0) {
    await sendMessage(env, chatId, "No cryptocurrency data is available yet.");
    return;
  }

  const text = cryptocurrencies
    .map(
      (crypto, index) =>
        `${index + 1}. ${crypto.symbol} — ${formatPrice(crypto.price)}`,
    )
    .join("\n");

  await sendMessage(
    env,
    chatId,
    `Recently updated cryptocurrencies:

${text}`,
  );
}

async function handleAddFavourite(env: Env, chatId: number, symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!isValidSymbol(normalizedSymbol)) {
    await sendMessage(
      env,
      chatId,
      `Unknown cryptocurrency: ${normalizedSymbol}`,
    );
    return;
  }

  const alreadyFavourite = await isFavourite(env, chatId, normalizedSymbol);

  if (alreadyFavourite) {
    await sendMessage(
      env,
      chatId,
      `${normalizedSymbol} is already in your favourites.`,
    );
    return;
  }

  await addFavourite(env, chatId, normalizedSymbol);

  await sendMessage(
    env,
    chatId,
    `${normalizedSymbol} has been added to your favourites.`,
  );
}

async function handleDeleteFavourite(env: Env, chatId: number, symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  const alreadyFavourite = await isFavourite(env, chatId, normalizedSymbol);

  if (!alreadyFavourite) {
    await sendMessage(
      env,
      chatId,
      `${normalizedSymbol} is not in your favourites.`,
    );
    return;
  }

  await deleteFavourite(env, chatId, normalizedSymbol);

  await sendMessage(
    env,
    chatId,
    `${normalizedSymbol} has been removed from your favourites.`,
  );
}

async function handleListFavourite(env: Env, chatId: number) {
  const favourites = await getFavourite(env, chatId);

  if (favourites.length === 0) {
    await sendMessage(env, chatId, "Your favourites list is empty.");
    return;
  }

  const text = favourites
    .map((favourite, index) => `${index + 1}. ${favourite.symbol}`)
    .join("\n");

  await sendMessage(
    env,
    chatId,
    `Your favourite cryptocurrencies:

${text}`,
  );
}

async function handleCryptoSymbol(env: Env, chatId: number, symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!isValidSymbol(normalizedSymbol)) {
    await sendMessage(
      env,
      chatId,
      `Unknown cryptocurrency: ${normalizedSymbol}`,
    );
    return;
  }

  const favourite = await isFavourite(env, chatId, normalizedSymbol);

  await sendMessage(
    env,
    chatId,
    `${normalizedSymbol}

Select an action:`,
    favouriteKeyboard(normalizedSymbol, favourite),
  );
}

async function handleHistory(env: Env, chatId: number, symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (!isValidSymbol(normalizedSymbol)) {
    await sendMessage(
      env,
      chatId,
      `Unknown cryptocurrency: ${normalizedSymbol}`,
    );
    return;
  }

  await sendMessage(
    env,
    chatId,
    `${normalizedSymbol}

Select a period:`,
    periodKeyboard(normalizedSymbol),
  );
}

async function handlePeriod(
  env: Env,
  chatId: number,
  symbol: string,
  period: CryptoPeriod,
) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  const history = await getCryptoHistory(env, normalizedSymbol, period);

  if (history.length === 0) {
    await sendMessage(
      env,
      chatId,
      `No price history found for ${normalizedSymbol} for the selected period.`,
    );
    return;
  }

  const periodLabel =
    PERIODS.find((item) => item.value === period)?.label ?? period;

  const lines = history
    .slice(0, 20)
    .map(
      (item) =>
        `${formatDate(item.createdTime)} — ${formatPrice(item.average_price)}`,
    )
    .join("\n");

  await sendMessage(
    env,
    chatId,
    `${normalizedSymbol} price history
Period: ${periodLabel}

${lines}`,
    periodKeyboard(normalizedSymbol),
  );
}

async function handleCommand(env: Env, chatId: number, text: string) {
  const parts = text.trim().split(/\s+/);
  const command = parts[0]?.toLowerCase();
  const argument = parts[1];

  switch (command) {
    case "/start":
      await handleStart(env, chatId);
      return;

    case "/help":
      await handleHelp(env, chatId);
      return;

    case "/listrecent":
      await handleListRecent(env, chatId);
      return;

    case "/listfavourite":
    case "/listfavorites":
    case "/listfavourites":
      await handleListFavourite(env, chatId);
      return;

    case "/addtofavourite":
    case "/addtofavorite":
      if (!argument) {
        await sendMessage(env, chatId, "Usage: /addToFavourite BTC");
        return;
      }

      await handleAddFavourite(env, chatId, argument);
      return;

    case "/deletefavourite":
    case "/deletefavorite":
      if (!argument) {
        await sendMessage(env, chatId, "Usage: /deleteFavourite BTC");
        return;
      }

      await handleDeleteFavourite(env, chatId, argument);
      return;

    default:
      if (command?.startsWith("/")) {
        await sendMessage(
          env,
          chatId,
          "Unknown command. Use /help to see available commands.",
        );
        return;
      }

      await handleCryptoSymbol(env, chatId, text);
  }
}

async function handleCallbackQuery(
  env: Env,
  callbackQuery: TelegramCallbackQuery,
) {
  const data = callbackQuery.data;

  if (!data || !callbackQuery.message) {
    return;
  }

  const chatId = callbackQuery.message.chat.id;

  try {
    const parts = data.split("_");
    const action = parts[0];

    if (action === "add") {
      const symbol = parts[1];

      if (!symbol) {
        return;
      }

      await handleAddFavourite(env, chatId, symbol);

      await answerCallbackQuery(
        env,
        callbackQuery.id,
        `${symbol} added to favourites`,
      );

      return;
    }

    if (action === "delete") {
      const symbol = parts[1];

      if (!symbol) {
        return;
      }

      await handleDeleteFavourite(env, chatId, symbol);

      await answerCallbackQuery(
        env,
        callbackQuery.id,
        `${symbol} removed from favourites`,
      );

      return;
    }

    if (action === "history") {
      const symbol = parts[1];

      if (!symbol) {
        return;
      }

      await handleHistory(env, chatId, symbol);

      await answerCallbackQuery(env, callbackQuery.id);

      return;
    }

    if (action === "period") {
      const symbol = parts[1];
      const period = parts[2] as CryptoPeriod;

      if (!symbol || !period) {
        return;
      }

      const validPeriod = PERIODS.some((item) => item.value === period);

      if (!validPeriod) {
        await answerCallbackQuery(env, callbackQuery.id, "Invalid period");
        return;
      }

      await handlePeriod(env, chatId, symbol, period);

      await answerCallbackQuery(env, callbackQuery.id);
    }
  } catch (error) {
    console.error("Telegram callback error:", error);

    await answerCallbackQuery(env, callbackQuery.id, "Something went wrong");

    await sendMessage(
      env,
      chatId,
      "An error occurred while processing the request.",
    );
  }
}

bot.post("/", async (c) => {
  try {
    const update = await c.req.json<TelegramUpdate>();

    if (update.callback_query) {
      await handleCallbackQuery(c.env, update.callback_query);

      return c.json({
        ok: true,
      });
    }

    const message = update.message;

    if (!message?.text) {
      return c.json({
        ok: true,
      });
    }

    await handleCommand(c.env, message.chat.id, message.text);

    return c.json({
      ok: true,
    });
  } catch (error) {
    console.error("Telegram update error:", error);

    return c.json(
      {
        ok: false,
        error: "Failed to process Telegram update",
      },
      500,
    );
  }
});

export default bot;
