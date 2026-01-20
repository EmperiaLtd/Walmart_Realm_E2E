import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PerfMetrics } from './types';

function parseTargetUrls(): string[] {
  const raw = process.env.PERF_TARGET_URL || 'https://walmartrealm.com/';
  return raw.split(',').map(u => u.trim()).filter(Boolean);
}

test('Walmart Realm performance snapshot', async ({ page }) => {
  const urls = parseTargetUrls();
  const apiCalls: PerfMetrics['apiCalls'] = [];
  const failedRequests: PerfMetrics['failedRequests'] = [];

  // Successful responses (for timing)
  page.on('response', response => {
    const status = response.status();

    if (response.url().includes('/api/')) {
      const timing = response.request().timing();
      apiCalls.push({
        url: response.url(),
        responseTime: timing.responseEnd,
      });
    }

    // Capture HTTP failures
    if (status >= 400) {
      failedRequests.push({
        url: response.url(),
        method: response.request().method(),
        status,
        resourceType: response.request().resourceType(),
      });
    }
  });

  // Capture aborted / failed requests
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

    // Force a full document load: hash-only changes on the same origin are
    // same-document navigations, so performance.getEntriesByType('navigation') and
    // LCP would keep returning the first load. Going to about:blank first
    // ensures the next goto does a real load and we get fresh metrics per URL.
    await page.goto('about:blank');
    apiCalls.length = 0;
    failedRequests.length = 0;

    await page.goto(targetUrl);

    // Navigation timing
    const nav = await page.evaluate(() => {
      const [n] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      return {
        domContentLoaded: n.domContentLoadedEventEnd,
        loadEvent: n.loadEventEnd,
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

    const perf: PerfMetrics = {
      url: page.url(),
      timestamp: new Date().toISOString(),
      domContentLoaded: nav.domContentLoaded,
      loadEvent: nav.loadEvent,
      lcp,
      apiCalls: [...apiCalls],
      failedRequests: [...failedRequests],
    };

    const filePath = path.join(outputDir, `realm-perf-${runId}-${i}.json`);
    fs.writeFileSync(filePath, JSON.stringify(perf, null, 2));
  }
});
