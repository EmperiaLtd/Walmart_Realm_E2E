import { Page, Locator, Frame, FrameLocator } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly storeCard: Locator;
  readonly tutorialButton: Locator

  constructor(page: Page) {
    this.page = page;
    this.storeCard = page.locator(".chakra-text");
    this.tutorialButton = page.getByRole('button', { name: 'Close tutorial' });
  }

  async open() {
    await this.page.goto("https://walmartrealm.emperia.app/#/feed");
  }

  async clickRealm(name: string) {
    const store = this.storeCard.filter({ hasText: name });

    await store.first().click();
  }

  async clickClose(maxRetries = 5): Promise<void> {
    const clickButton = async (locator: Locator): Promise<boolean> => {
        try {
            await locator.scrollIntoViewIfNeeded();
            await locator.click({ force: true }); // force click in case hidden or blocked
            return true;
        } catch {
            return false;
        }
    };

    const searchButtonInFrame = async (frame: Frame, retriesLeft: number): Promise<boolean> => {
        if (frame.isDetached()) return false;

        // Try multiple strategies to locate the button
        const strategies: (() => Promise<boolean>)[] = [
            () => clickButton(frame.getByRole('button', { name: /close\s*tutorial/i })),
            () => clickButton(frame.getByText(/close\s*tutorial/i)),
            () => clickButton(frame.locator('button.chakra-button').filter({ hasText: /close\s*tutorial/i }))
        ];

        for (const strategy of strategies) {
            if (await strategy()) return true;
        }

        // Recursively check child frames
        for (const child of frame.childFrames()) {
            if (await searchButtonInFrame(child, retriesLeft)) return true;
        }

        // Retry if still not found
        if (retriesLeft > 0) {
            await this.page.waitForTimeout(500);
            return searchButtonInFrame(frame, retriesLeft - 1);
        }

        return false;
    };

    // Get top-level iframe as a real Frame
    const experienceIframe = this.page.locator('iframe[title="Experience"]');
    await experienceIframe.first().waitFor({ state: 'attached', timeout: 20000 });
    const frameElementHandle = await experienceIframe.first().elementHandle();
    if (frameElementHandle) {
      const frame = await frameElementHandle.contentFrame();
      if (frame) {
        const found = await searchButtonInFrame(frame, maxRetries);
        if (found) return;
      }
    }
        // Try clicking Close Tutorial on the main page using various strategies
        const mainStrategies: (() => Promise<boolean>)[] = [
          () => clickButton(this.page.getByRole('button', { name: /close\s*tutorial/i })),
          () => clickButton(this.page.getByText(/close\s*tutorial/i)),
          () => clickButton(this.page.locator('button.chakra-button').filter({ hasText: /close\s*tutorial/i }))
        ];

        for (const strategy of mainStrategies) {
          if (await strategy()) return;
        }

    // Final fallback: force-click any matching button
    const forceLocator = this.page.locator('button:has-text("Close Tutorial")');
    if ((await forceLocator.count()) > 0) {
        await forceLocator.first().click({ force: true });
        return;
    }

    throw new Error('Failed to click Close Tutorial button');
}
}
