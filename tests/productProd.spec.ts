import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/ProdHomePage";
import { StorePage } from "../pages/ProdStorePage";

test("open product modal", async ({ page }) => {
  const home = new HomePage(page);
  await home.open();
  await home.clickRealm("Cyberpunk City");

  const store = new StorePage(page);
  await page.waitForTimeout(3000);

  await home.clickClose();
  await store.openFirstProduct();
});