import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PerfMetrics } from './types';

/**
 * Allow comma-separated URLs via PERF_TARGET_URL
 * Defaults to Walmart Realm
 */
function parseTargetUrls(): string[] {
  const raw = process.env.PERF_TARGET_URL || 'https://walmartrealm.com/';
  return raw.split(',').map(u => u.trim()).filter(Boolean);
}

/**
 * Wait until the Realm iframe and its canvas are actually rendering
 */
async function waitForRealmCanvas(page) {
  // Wait for the Experience iframe to be visible (more specific selector to avoid ambiguity)
  const experienceIframe = page.locator('iframe[title="Experience"]');
  await experienceIframe.first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });

  // Small warm-up to avoid shader-compile spikes
  await page.waitForTimeout(500);
}

test('Walmart Realm performance snapshot', async ({ page }) => {
  test.setTimeout(120_000); // increase timeout for perf tests

  const urls = parseTargetUrls();

  const apiCalls: PerfMetrics['apiCalls'] = [];
  const failedRequests: PerfMetrics['failedRequests'] = [];

  // Capture successful responses (timings)
  page.on('response', response => {
    const status = response.status();

    if (response.url().includes('/api/')) {
      const timing = response.request().timing();
      apiCalls.push({
        url: response.url(),
        responseTime: timing.responseEnd,
      });
    }

    // HTTP errors
    if (status >= 400) {
      failedRequests.push({
        url: response.url(),
        method: response.request().method(),
        status,
        resourceType: response.request().resourceType(),
      });
    }
  });

  // Aborted / network-level failures
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText,
      resourceType: request.resourceType(),
    });
  });

  const runId = Date.now();
  const outputDir = path.resolve('perf-results');
  fs.mkdirSync(outputDir, { recursive: true });

  for (let i = 0; i < urls.length; i++) {
    const targetUrl = urls[i];

    apiCalls.length = 0;
    failedRequests.length = 0;

    // Force a full navigation so nav timing & LCP reset
    await page.goto('about:blank');

    await page.goto(targetUrl);

    // Navigation timing (type-safe)
    const nav = await page.evaluate(() => {
      const [n] =
        performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return {
        domContentLoaded: n?.domContentLoadedEventEnd ?? 0,
        loadEvent: n?.loadEventEnd ?? 0,
      };
    });

    // Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        new PerformanceObserver(list => {
          resolve(list.getEntries().pop()!.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
    });

    // Realm-specific FPS (inside the Experience iframe)
    await waitForRealmCanvas(page);

    // Wait for the iframe to exist
    const iframeHandle = await page
    .locator('iframe[title="Experience"]')
    .elementHandle();

    if (!iframeHandle) {
    throw new Error('Experience iframe not found');
    }

    // Get the real Frame object
    const frame = await iframeHandle.contentFrame();

    if (!frame) {
    throw new Error('Unable to resolve Experience iframe frame');
    }

    // Now you can evaluate INSIDE the iframe
    const fps = await frame.evaluate((duration) => {
    return new Promise<{
      avgFps: number;
      minFps: number;
      fpsSampleDurationMs: number;
    }>(resolve => {
      const frameTimes: number[] = [];
      let last = performance.now();
      const start = last;

      function tick(now: number) {
        frameTimes.push(now - last);
        last = now;

        if (now - start < duration) {
          requestAnimationFrame(tick);
        } else {
          const fpsValues = frameTimes
            .filter(t => t > 0)
            .map(t => 1000 / t);

          const avgFps =
            fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length || 0;

          resolve({
            avgFps: Math.round(avgFps),
            minFps: Math.round(Math.min(...fpsValues, avgFps || 0)),
            fpsSampleDurationMs: duration,
          });
        }
      }

      requestAnimationFrame(tick);
    });
    }, 3000);


    const perf: PerfMetrics = {
      url: page.url(),
      timestamp: new Date().toISOString(),

      domContentLoaded: nav.domContentLoaded,
      loadEvent: nav.loadEvent,
      lcp,

      avgFps: fps.avgFps,
      minFps: fps.minFps,
      fpsSampleDurationMs: fps.fpsSampleDurationMs,

      apiCalls: [...apiCalls],
      failedRequests: [...failedRequests],
    };

    const filePath = path.join(
      outputDir,
      `realm-perf-${runId}-${i}.json`
    );

    fs.writeFileSync(filePath, JSON.stringify(perf, null, 2));
  }
});
