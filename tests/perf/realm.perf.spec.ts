import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PerfMetrics } from './types';

const isCI = !!process.env.CI;

function parseTargetUrls(): string[] {
  const raw = process.env.PERF_TARGET_URL || 'https://walmartrealm.com/';
  return raw
    .split(',')
    .map(u => u.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

async function waitForRealmReady(page) {
  const iframeLocator = page.locator('iframe[title="Experience"]');

  // 1️⃣ iframe exists and is visible
  await iframeLocator.first().waitFor({
    state: 'visible',
    timeout: 30_000,
  });

  const iframeHandle = await iframeLocator.elementHandle();
  if (!iframeHandle) throw new Error('Experience iframe not found');

  const frame = await iframeHandle.contentFrame();
  if (!frame) throw new Error('Unable to resolve Experience iframe');

  // 2️⃣ Unreal is actually rendering (canvas + RAF)
  await frame.waitForFunction(() => {
    return new Promise<boolean>(resolve => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return resolve(false);

      let frames = 0;
      function tick() {
        frames++;
        if (frames >= 2) resolve(true);
        else requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }, { timeout: 30_000 });

  return frame;
}


const urls = parseTargetUrls();
const outputDir = path.resolve('perf-results');
fs.mkdirSync(outputDir, { recursive: true });

for (const targetUrl of urls) {
  test(`Realm performance – ${targetUrl}`, async ({ page }) => {
    test.setTimeout(3 * 60 * 1000); // ⏱️ per-realm timeout

    const apiCalls: PerfMetrics['apiCalls'] = [];
    const failedRequests: PerfMetrics['failedRequests'] = [];

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const timing = response.request().timing();
        apiCalls.push({
          url: response.url(),
          responseTime: timing.responseEnd - timing.requestStart,
        });
      }

      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          method: response.request().method(),
          status: response.status(),
          resourceType: response.request().resourceType(),
        });
      }
    });

    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
        resourceType: request.resourceType(),
      });
    });

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Navigation timing
    const nav = await page.evaluate(() => {
      const [n] =
        performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return {
        domContentLoaded: n?.domContentLoadedEventEnd ?? 0,
        loadEvent: n?.loadEventEnd ?? 0,
      };
    });

    // Realm readiness
    const frame = await waitForRealmReady(page);

    // FPS sampling
    const fps = await frame.evaluate((duration) => {
      return new Promise(resolve => {
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

            resolve({
              avgFps: Math.round(
                fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length || 0
              ),
              minFps: Math.round(Math.min(...fpsValues)),
              fpsSampleDurationMs: duration,
            });
          }
        }

        requestAnimationFrame(tick);
      });
    }, isCI ? 1500 : 3000);

    const perf: PerfMetrics = {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      domContentLoaded: nav.domContentLoaded,
      loadEvent: nav.loadEvent,
      avgFps: (fps as any).avgFps ?? 0,
      minFps: (fps as any).minFps ?? 0,
      fpsSampleDurationMs: (fps as any).fpsSampleDurationMs ?? 0,
      apiCalls,
      failedRequests,
    };

    const fileName = `realm-perf-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(outputDir, fileName),
      JSON.stringify(perf, null, 2)
    );
  });
}
