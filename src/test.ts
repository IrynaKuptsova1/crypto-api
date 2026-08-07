import { drizzle } from "drizzle-orm/mysql2";

import mysql from "mysql2/promise";
import { CRYPTO_DETAILS } from "./db/schema";
import { and, eq } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle({ client: connection });

console.log(
  await db
    .select()
    .from(CRYPTO_DETAILS)
    .limit(5)
    .where(
      and(
        eq(CRYPTO_DETAILS.market, "CoinBase"),
        eq(CRYPTO_DETAILS.price, 0.0109),
        eq(CRYPTO_DETAILS.createdTime, 1785873002306),
        eq(CRYPTO_DETAILS.symbol, "BTC"),
      ),
    ),
);

// console.log(
//   await db.insert(CRYPTO_DETAILS).values([
//     {
//       symbol: "BTC",
//       market: "CoinBase",
//       price: 0.0109,
//       createdTime: 1785873002306,
//     },
//   ]),
// );
