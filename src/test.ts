// import { CRYPTO_DETAILS } from "./db/schema";
import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle("mysql://root:1234@localhost:3306/crypto_db");
// console.log(db);
// console.log(db.select().from(CRYPTO_DETAILS).limit(5));

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
