import { Page, Locator, expect } from "@playwright/test";

export class StorePage {
  readonly page: Page;
  readonly products: Locator;
  readonly iframe: Locator;
  readonly addProductButton: Locator;
  readonly productCloseButton: Locator;
  readonly projectionCard: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addProductButton = page
      .locator('iframe[title="Experience"]')
      .contentFrame()
      .getByRole('button', { name: 'Add to cart', exact: true });

    this.productCloseButton = page
      .frameLocator('iframe[title="Experience"]')
      .locator('svg.chakra-icon');

    this.projectionCard = page
    .frameLocator('iframe[title="Experience"]')
    .locator('div[draggable="false"]')
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

    // Helper function to scroll element into view (handles both vertical and horizontal)
    const scrollElementIntoView = async (elementHandle: any) => {
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
    };

    // Find and click the first product button, scrolling it into view first
    let clicked = false;
    for (let i = 2; i < productCount; i++) {
      const button = productButton.nth(i);
      try {
        // Get element handle and scroll it into view (handles left/right/up/down)
        const elementHandle = await button.elementHandle();
        if (elementHandle) {
          await scrollElementIntoView(elementHandle);
          
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
        await scrollElementIntoView(elementHandle);
      }
      await firstButton.click({ force: true });
    }

    await this.page.waitForTimeout(300);
  }

  async addProduct() {
    await this.page.waitForTimeout(2000);

    if (await this.addProductButton.isVisible()) {
      await this.addProductButton.click({ force: true });
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
}
