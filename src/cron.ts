import { updateCryptoPrices } from "./database";

export function startCron() {
  Bun.cron("*/5 * * * *", async () => {
    console.log("Updating cryptocurrency prices");

    try {
      await updateCryptoPrices();
      console.log("Update completed");
    } catch (error) {
      console.error("Update failed:", error);
    }
  });
}
