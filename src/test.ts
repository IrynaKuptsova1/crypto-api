import { SQL } from "bun";
import { getCryptoInfo, updateCryptoPrices } from "./database";
import * as queries from "./database";

const db = new SQL({
  url: process.env.DATABASE_URL,
});

export async function printDatabase() {
  const data = await db`
    SELECT *
    FROM crypto_details
    ORDER BY created_time DESC
    LIMIT 50
  `;

  console.table(data);
}

export async function printCount() {
  const data = await db`
    SELECT COUNT(*) as count
    FROM crypto_details
  `;

  console.log(data);
}

export async function testBTC() {
  const data = await getCryptoInfo("BTC", Date.now() - 60 * 60 * 1000);
  console.table(data);
}

export async function testUpdate() {
  await updateCryptoPrices();
  console.log("updated");
}

await queries.createTable();
await queries.updateCryptoPrices();
const result = await db`SELECT 1`;
console.log(result);
await printDatabase();
await printCount();
await testBTC();
