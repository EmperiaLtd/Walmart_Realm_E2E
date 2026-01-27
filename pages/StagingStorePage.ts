import { Page, Locator, expect } from "@playwright/test";

export class StorePage {
  readonly page: Page;
  readonly products: Locator;
  readonly iframe: Locator;
  readonly addProductButton: Locator;
  readonly productCloseButton: Locator;
  readonly projectionCard: Locator;
  readonly videoButton: Locator;
  readonly sparksButton: Locator;
  readonly hiddenRoom: Locator
  readonly viewCart: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addProductButton = page
      .locator('iframe[title="Experience"]')
      .contentFrame()
      .getByRole('button', { name: 'Add to cart', exact: true });

      this.viewCart = page
      .locator('iframe[title="Experience"]')
      .contentFrame()
      .getByRole('button', { name: 'View Cart', exact: true });

    this.productCloseButton = page
      .frameLocator('iframe[title="Experience"]')
      .locator('svg.chakra-icon');

    this.projectionCard = page
      .frameLocator('iframe[title="Experience"]')
      .locator('div[draggable="false"]')

    this.videoButton = page
      .frameLocator('iframe[title="Experience"]')
      .locator('div[style*="play_video_imagesheet.png"]')

    this.sparksButton = page
      .frameLocator('iframe[title="Experience"]')
      .getByText('Find Sparks')

    this.hiddenRoom = page
      .frameLocator('iframe[title="Experience"]')
      .getByText('See the shop')
  };


  // Helper function to scroll element into view (handles both vertical and horizontal)
  private async scrollElementIntoView(elementHandle: any) {
    if (!elementHandle) return false;

    await elementHandle.evaluate((el: Element) => {
      // Scroll the element itself into view (handles both vertical and horizontal)
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',    // vertical centering
        inline: 'center'    // horizontal centering (left/right)
      });

      // Also try to find and scroll any parent scrollable containers
      let parent = el.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowX = style.overflowX;
        const overflowY = style.overflowY;

        // If parent is scrollable horizontally or vertically, ensure it's scrolled
        if (overflowX === 'auto' || overflowX === 'scroll' ||
          overflowY === 'auto' || overflowY === 'scroll') {
          const rect = el.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();

          // Calculate scroll needed
          const scrollLeft = rect.left - parentRect.left - (parentRect.width / 2) + (rect.width / 2);
          const scrollTop = rect.top - parentRect.top - (parentRect.height / 2) + (rect.height / 2);

          parent.scrollBy({
            left: scrollLeft,
            top: scrollTop,
            behavior: 'smooth'
          });
        }
        parent = parent.parentElement;
      }
    });

    await this.page.waitForTimeout(500); // Wait for scroll animation
    return true;
  }

  async clickProjectionCard() {
    await this.projectionCard.waitFor({ state: 'visible', timeout: 5000 });
    await this.projectionCard.click({ force: true });
    await this.page.waitForTimeout(2000);
    await this.productCloseButton.nth(2).click({ force: true });
    await this.page.waitForTimeout(2000);
  }

  async openFirstProduct() {
    // Wait for the iframe to appear
    const experienceFrameLocator = this.page.locator('iframe[title="Experience"]');
    await experienceFrameLocator.first().waitFor({ state: 'attached', timeout: 20000 });

    // Get the iframe's frame
    const frameElementHandle = await experienceFrameLocator.first().elementHandle();
    if (!frameElementHandle) throw new Error('Experience iframe element not found');

    const experienceFrame = await frameElementHandle.contentFrame();
    if (!experienceFrame) throw new Error('Experience iframe not found');

    // Get the inner container frame if needed
    const containerFrameLocator = experienceFrame.locator('#experience-container');
    await containerFrameLocator.first().waitFor({ state: 'attached', timeout: 10000 });

    const containerElementHandle = await containerFrameLocator.first().elementHandle();
    if (!containerElementHandle) throw new Error('Container frame element not found');

    const containerFrame = await containerElementHandle.contentFrame();
    if (!containerFrame) throw new Error('Container frame not found');

    // Locate all plus buttons inside the nested frame
    const productButton = containerFrame.locator('[id^="plus-button-"]').getByRole('img');
    console.log(await productButton.count());

    // Click the first one
    await productButton.first().click({ force: true });
    await this.page.waitForTimeout(300);
  }

  async openFirstProductOniPhone() {
    // Wait for the iframe to appear
    const experienceFrameLocator = this.page.locator('iframe[title="Experience"]');
    await experienceFrameLocator.first().waitFor({ state: 'attached', timeout: 20000 });

    // Get the iframe's frame
    const frameElementHandle = await experienceFrameLocator.first().elementHandle();
    if (!frameElementHandle) throw new Error('Experience iframe element not found');

    const experienceFrame = await frameElementHandle.contentFrame();
    if (!experienceFrame) throw new Error('Experience iframe not found');

    // Get the inner container frame if needed
    const containerFrameLocator = experienceFrame.locator('#experience-container');
    await containerFrameLocator.first().waitFor({ state: 'attached', timeout: 10000 });

    const containerElementHandle = await containerFrameLocator.first().elementHandle();
    if (!containerElementHandle) throw new Error('Container frame element not found');

    const containerFrame = await containerElementHandle.contentFrame();
    if (!containerFrame) throw new Error('Container frame not found');

    // Locate all plus buttons inside the nested frame
    const productButton = containerFrame.locator('[id^="plus-button-"]').getByRole('img');
    const productCount = await productButton.count();
    console.log(`Found ${productCount} product buttons`);

    // Find and click the first product button, scrolling it into view first
    let clicked = false;
    for (let i = 2; i < productCount; i++) {
      const button = productButton.nth(i);
      try {
        // Get element handle and scroll it into view (handles left/right/up/down)
        const elementHandle = await button.elementHandle();
        if (elementHandle) {
          await this.scrollElementIntoView(elementHandle);

          // Check if it's now visible and in viewport
          const isVisible = await button.isVisible();
          if (isVisible) {
            // Double-check it's actually in viewport by checking bounding box
            const box = await button.boundingBox();
            if (box && box.width > 0 && box.height > 0) {
              console.log(`Clicking product button at index ${i}`);
              await button.click({ force: true });
              clicked = true;
              break;
            }
          }
        }
      } catch (error) {
        console.log(`Button at index ${i} not clickable, trying next...`);
        continue;
      }
    }

    if (!clicked) {
      // Fallback: scroll first button into view and click
      console.log('No clickable button found in loop, trying first button with scroll');
      const firstButton = productButton.first();
      const elementHandle = await firstButton.elementHandle();
      if (elementHandle) {
        await this.scrollElementIntoView(elementHandle);
      }
      await firstButton.click({ force: true });
    }

    await this.page.waitForTimeout(300);
  }

  async addProduct() {
    await this.page.waitForTimeout(2000);
    await this.addProductButton.scrollIntoViewIfNeeded();
    if (await this.addProductButton.isVisible()) {
      await this.addProductButton.click({ force: true });
    } else{
      await this.viewCart.click({ force: true });
    }

    await this.page.waitForTimeout(2000);
  }

  async expectMoreThanOneWalmartImage() {
    const frame = this.page.frameLocator('iframe[title="Experience"]');
    const modal = frame.locator('.chakra-modal__body');

    await modal.waitFor({ state: 'visible' });

    const images = modal.locator('img[src*="walmartimages"]');
    const count = await images.count();

    console.log(`Found ${count} Walmart images in the modal`);
    expect(count).toBeGreaterThan(1);

    return images;
  }

  async openVideo() {
    // Wait for the iframe to appear
    const experienceFrameLocator = this.page.locator('iframe[title="Experience"]');
    await experienceFrameLocator.first().waitFor({ state: 'attached', timeout: 20000 });

    // Get the iframe's frame
    const frameElementHandle = await experienceFrameLocator.first().elementHandle();
    if (!frameElementHandle) throw new Error('Experience iframe element not found');

    const experienceFrame = await frameElementHandle.contentFrame();
    if (!experienceFrame) throw new Error('Experience iframe not found');

    // Get the inner container frame if needed
    const containerFrameLocator = experienceFrame.locator('#experience-container');
    await containerFrameLocator.first().waitFor({ state: 'attached', timeout: 10000 });

    const containerElementHandle = await containerFrameLocator.first().elementHandle();
    if (!containerElementHandle) throw new Error('Container frame element not found');

    const containerFrame = await containerElementHandle.contentFrame();
    if (!containerFrame) throw new Error('Container frame not found');

    // Locate video button within the nested container frame
    const videoButton = containerFrame.locator('div[style*="play_video_imagesheet.png"]');

    // Wait for the animated video button to be visible and stable
    await videoButton.first().waitFor({ state: 'visible', timeout: 10000 });
    // Wait a bit for any animations to settle
    await this.page.waitForTimeout(500);

    // Get element handle for video button and scroll it into view
    const videoButtonHandle = await videoButton.first().elementHandle();
    if (videoButtonHandle) {
      await this.scrollElementIntoView(videoButtonHandle);
      // Wait again after scrolling for animation to settle
      await this.page.waitForTimeout(1000);
    }

    // Click the video button
    await videoButton.first().click({ force: true });
    await this.page.waitForTimeout(300);
    await videoButton.first().click({ force: true });
  }

  async waitForVideoToAppear() {
    // Wait for the iframe to appear
    const experienceFrameLocator = this.page.locator('iframe[title="Experience"]');
    await experienceFrameLocator.first().waitFor({ state: 'attached', timeout: 20000 });

    // Get the iframe's frame
    const frameElementHandle = await experienceFrameLocator.first().elementHandle();
    if (!frameElementHandle) throw new Error('Experience iframe element not found');

    const experienceFrame = await frameElementHandle.contentFrame();
    if (!experienceFrame) throw new Error('Experience iframe not found');

    // Try to find video in the main experience frame first
    let video = experienceFrame.locator('video[src*="firebase-ugc.emperia.app"]');
    const videoCountInMain = await video.count();

    if (videoCountInMain > 0) {
      await video.first().waitFor({ state: 'visible', timeout: 10000 });
      await expect(video.first()).toBeVisible();
      return;
    }

    // If not found, check the nested container frame (same structure as openVideo)
    const containerFrameLocator = experienceFrame.locator('#experience-container');
    const containerCount = await containerFrameLocator.count();

    if (containerCount > 0) {
      await containerFrameLocator.first().waitFor({ state: 'attached', timeout: 10000 });

      const containerElementHandle = await containerFrameLocator.first().elementHandle();
      if (containerElementHandle) {
        const containerFrame = await containerElementHandle.contentFrame();
        if (containerFrame) {
          video = containerFrame.locator('video[src*="firebase-ugc.emperia.app"]');
          await video.first().waitFor({ state: 'visible', timeout: 10000 });
          await expect(video.first()).toBeVisible();
          return;
        }
      }
    }

    // Fallback: search recursively in all child frames
    const searchForVideo = async (frame: any): Promise<boolean> => {
      if (frame.isDetached()) return false;

      try {
        const videoLocator = frame.locator('video[src*="firebase-ugc.emperia.app"]');
        const count = await videoLocator.count();
        if (count > 0) {
          await videoLocator.first().waitFor({ state: 'visible', timeout: 10000 });
          await expect(videoLocator.first()).toBeVisible();
          return true;
        }
      } catch (error) {
        // Frame might not be accessible, continue
      }

      // Recursively check child frames
      for (const child of frame.childFrames()) {
        const found = await searchForVideo(child);
        if (found) return true;
      }

      return false;
    };

    const found = await searchForVideo(experienceFrame);
    if (!found) {
      throw new Error('Video element not found in any frame');
    }
  }

  async findSparkText(): Promise<Locator | null> {
    // Wait for the iframe to appear
    const experienceFrameLocator = this.page.locator('iframe[title="Experience"]');
    await experienceFrameLocator.first().waitFor({ state: 'attached', timeout: 20000 });

    // Get the iframe's frame
    const frameElementHandle = await experienceFrameLocator.first().elementHandle();
    if (!frameElementHandle) throw new Error('Experience iframe element not found');

    const experienceFrame = await frameElementHandle.contentFrame();
    if (!experienceFrame) throw new Error('Experience iframe not found');

    // Search for the text in the main experienceFrame
    const textInMainFrame = experienceFrame.getByText(/Find a Spark in Walmart Realm to unlock the Hidden Room & exclusive swag\./i);
    const countInMain = await textInMainFrame.count();
    if (countInMain > 0) {
      return textInMainFrame.first();
    }

    // Get the inner container frame if needed
    const containerFrameLocator = experienceFrame.locator('#experience-container');
    const containerCount = await containerFrameLocator.count();
    if (containerCount > 0) {
      await containerFrameLocator.first().waitFor({ state: 'attached', timeout: 10000 });

      const containerElementHandle = await containerFrameLocator.first().elementHandle();
      if (containerElementHandle) {
        const containerFrame = await containerElementHandle.contentFrame();
        if (containerFrame) {
          // Search for the text in the container frame
          const textInContainer = containerFrame.getByText(/Find a Spark in Walmart Realm to unlock the Hidden Room & exclusive swag\./i);
          const countInContainer = await textInContainer.count();
          if (countInContainer > 0) {
            return textInContainer.first();
          }
        }
      }
    }

    // Also search recursively in all child frames
    const searchInFrames = async (frame: any): Promise<Locator | null> => {
      if (frame.isDetached()) return null;

      try {
        const textLocator = frame.getByText(/Find a Spark in Walmart Realm to unlock the Hidden Room & exclusive swag\./i);
        const count = await textLocator.count();
        if (count > 0) {
          return textLocator.first();
        }
      } catch (error) {
        // Frame might not be accessible, continue
      }

      // Recursively check child frames
      for (const child of frame.childFrames()) {
        const result = await searchInFrames(child);
        if (result) return result;
      }

      return null;
    };

    return await searchInFrames(experienceFrame);
  }

  async expectSparkTextVisible() {
    const sparkText = await this.findSparkText();
    if (sparkText) {
      await expect(sparkText).toBeVisible();
    } else {
      throw new Error('Spark text not found in experienceFrame');
    }
  }

  async clickFindSpark() {
    await this.sparksButton.click();
  }

  async clickHiddenRoom() {
    await this.hiddenRoom.click();
  }
}
