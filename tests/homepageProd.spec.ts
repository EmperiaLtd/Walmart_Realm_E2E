import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/ProdHomePage";

test("homepage loads", async ({ page }) => {
  const home = new HomePage(page);
  await home.open();
  await expect(page).toHaveTitle(/Realm/);
});

test("navigate to homepage and tutorial appears", async ({ page }) => {
  const home = new HomePage(page);
  await home.open();
  await home.clickRealm("Cyberpunk City");
  await expect(page).toHaveURL(/cyberpunkcity/i); // adjust if needed
});