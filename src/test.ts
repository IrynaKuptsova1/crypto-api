import { SQL } from "bun";
import { saveCrypto, getCryptoInfo, updateCryptoPrices } from "./database";

import type { CryptoInfo } from "./api";

const db = new SQL({
  url: process.env.DATABASE_URL,
});

async function testDatabaseConnection() {
  console.log("\n--- DATABASE CONNECTION ---");
  const result = await db`SELECT 1`;
  console.log(result);
  console.log("Database OK");
}

async function testTableExists() {
  console.log("\n--- TABLE CHECK ---")
  const result = await db`
    SHOW TABLES LIKE 'crypto_details'
  `;
  console.log(result);
  if (result.length === 0) {
    throw new Error("crypto_details table not found");
  }
  console.log("Table exists");
}

async function testInsert() {
  console.log("\n--- INSERT TEST ---");

  const testCrypto: CryptoInfo = {
    symbol: "BTC",
    market: "Kucoin",
    price: 50000,
    created_time: Date.now(),
  };
  await saveCrypto(testCrypto);
  console.log("Insert OK");
}

async function testSelect() {
  console.log("\n--- SELECT TEST ---");
  const data = await getCryptoInfo("BTC", Date.now() - 60 * 60 * 1000);
  console.table(data);
}

async function testUpdateFromMarkets() {
  console.log("\n--- MARKET API UPDATE ---");
  await updateCryptoPrices();
  console.log("Update OK");
}

async function testHttpEndpoint() {
  console.log("\n--- HTTP FETCH TEST ---");
  const startTime = Date.now() - 60 * 60 * 1000;
  const response = await fetch(
    `http://localhost:3000/crypto?symbol=BTC&startTime=${startTime}`,
  );
  console.log("Status:", response.status);
  const data = await response.json();
  console.log(data);
}

async function runTests() {
  try {
    await testDatabaseConnection();
    await testTableExists();
    await testInsert();
    await testUpdateFromMarkets();
    await testSelect();
    await testHttpEndpoint();

    console.log("\nALL TESTS PASSED");
  } catch (error) {
    console.error("\nTEST FAILED");
    console.error(error);
  }
}

await runTests();
