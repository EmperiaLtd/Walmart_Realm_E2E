import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/ProdHomePage";
import { StorePage } from "../pages/ProdStorePage";

test.describe("UI navigation", () => {
  test("loads the experience iframe after selecting a realm", async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await home.clickRealm("Cyberpunk City");

    const experienceFrame = page.locator('iframe[title="Experience"]');
    await expect(experienceFrame).toBeVisible();
  });

  test("opens a product modal from the experience view", async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await page.waitForTimeout(3000);

    await home.clickRealm("Gingerbread Boutique");
    await page.waitForTimeout(4000);

    await home.clickClose();

    const store = new StorePage(page);
    await store.openFirstProduct();
    await store.expectMoreThanOneWalmartImage();
  });

  test("can play a video from the experience view", async ({ page }) => {
    const home = new HomePage(page);
    await home.open();
    await page.waitForTimeout(3000);
    await home.clickRealm("Paramount");
    await page.waitForTimeout(4000);
    await home.clickClose();

    const store = new StorePage(page);
    await page.waitForTimeout(3000);
    await store.openVideo();
    await page.waitForTimeout(1000);
    await store.waitForVideoToAppear();
  });

  test("can unlock the hidden room", async ({ page, isMobile }) => {
    test.skip(isMobile, "This test only runs on full-size browsers");
    
    const home = new HomePage(page);
    await home.open();
    await page.waitForTimeout(3000);
    await home.clickRealm("Hidden Room");
    await page.waitForTimeout(4000);
  
    const store = new StorePage(page);
    await page.waitForTimeout(1000);
  
    
    // Look for the Spark text in the experienceFrame
    const sparkText = await store.findSparkText();
    if (sparkText) {
      await expect(sparkText).toBeVisible();
      console.log("Found Spark text in experienceFrame");
    } else {
      console.log("Spark text not found in experienceFrame");
    }

    await store.clickFindSpark();
    await page.waitForTimeout(2000);
    await page.goto('https://walmartrealm.com/#/viewer/homewithbao/idolvanityedit');
    await home.clickClose();
    await page.waitForTimeout(1000);

       // Get the experience iframe and click at coordinates (845, 350)
       const experienceFrameLocator = page.locator('iframe[title="Experience"]');
       await experienceFrameLocator.first().waitFor({ state: 'attached', timeout: 20000 });
       const frameElementHandle = await experienceFrameLocator.first().elementHandle();
       if (!frameElementHandle) throw new Error('Experience iframe element not found');
       const experienceFrame = await frameElementHandle.contentFrame();
       if (!experienceFrame) throw new Error('Experience iframe not found');
       await experienceFrame.locator('body').click({ position: { x: 845, y:300 } });

    await store.clickHiddenRoom();
    
    await expect(page).toHaveURL(/hiddenroom/i);
});
});
