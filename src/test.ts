// import { drizzle } from "drizzle-orm/mysql2";

// import mysql from "mysql2/promise";
// import { CRYPTO_DETAILS } from "./db/schema";
// import { and, eq } from "drizzle-orm";

// const connection = await mysql.createConnection(process.env.DATABASE_URL!);
// const db = drizzle({ client: connection });

// console.log(
//   await db
//     .select()
//     .from(CRYPTO_DETAILS)
//     .limit(5)
//     .where(
//       and(
//         eq(CRYPTO_DETAILS.market, "CoinBase"),
//         eq(CRYPTO_DETAILS.price, 0.0109),
//         eq(CRYPTO_DETAILS.createdTime, 1785873002306),
//         eq(CRYPTO_DETAILS.symbol, "BTC"),
//       ),
//     ),
// );

// // console.log(
// //   await db.insert(CRYPTO_DETAILS).values([
// //     {
// //       symbol: "BTC",
// //       market: "CoinBase",
// //       price: 0.0109,
// //       createdTime: 1785873002306,
// //     },
// //   ]),
// // );
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import { CRYPTO_DETAILS } from "./db/schema";

type Env = {
  crypto_db: D1Database;
};

export default {
  async fetch(_request: Request, env: Env) {
    const db = drizzle(env.crypto_db);

    const result = await db
      .select()
      .from(CRYPTO_DETAILS)
      .where(
        and(
          eq(CRYPTO_DETAILS.market, "CoinBase"),
          eq(CRYPTO_DETAILS.price, 0.0109),
          eq(CRYPTO_DETAILS.createdTime, 1785873002306),
          eq(CRYPTO_DETAILS.symbol, "BTC"),
        ),
      )
      .limit(5);

    console.log(result);

    return Response.json(result);
  },
};
