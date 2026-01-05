import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/StagingHomePage";
import { StorePage } from "../pages/StagingStorePage";

test("add product to cart and verify cart count", async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.clickRealm("Gingerbread Boutique");

    const store = new StorePage(page);
    await page.waitForTimeout(4000);

    await home.clickClose();
    await store.openFirstProductOniPhone();

    await store.addProduct();
    await expect(page.locator('iframe[title="Experience"]').contentFrame().locator('.css-4mn7u8')).toHaveText("1");
});

