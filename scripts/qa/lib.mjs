import { chromium } from 'playwright-core';

export const BASE = process.argv[2] ?? 'http://localhost:4173/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function launch(extraArgs = []) {
  return chromium.launch({ executablePath: CHROME, headless: true, args: extraArgs });
}

export async function openAt(browser, width, height, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, ...opts });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.waitForSelector('textarea');
  return { ctx, page };
}

export const out = (name) => `docs/screenshots/${name}`;
