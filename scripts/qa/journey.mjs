// Core journey in real Chrome with WebGPU. Usage: node scripts/qa/journey.mjs <fixture> <name> [baseUrl]
import { chromium } from 'playwright-core';
import * as F from './fixtures.mjs';

const fixture = F[process.argv[2] ?? 'SIGNATURE'];
const name = process.argv[3] ?? 'Kamal';
const base = process.argv[4] ?? 'http://localhost:4173/';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const shot = (n) => `docs/screenshots/${process.argv[2] ?? 'SIGNATURE'}-${n}.png`;

const ctx = await chromium.launchPersistentContext('/tmp/qa/profile', {
  executablePath: CHROME,
  headless: true,
  viewport: { width: 1440, height: 900 },
  args: ['--enable-unsafe-webgpu', '--enable-features=WebGPU', '--use-angle=metal', '--ignore-gpu-blocklist'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const hosts = new Set();
const bodies = [];
ctx.on('request', (r) => {
  const u = new URL(r.url());
  hosts.add(u.host);
  if (r.method() !== 'GET' && u.host !== new URL(base).host) bodies.push(`${r.method()} ${r.url()}`);
  const pd = r.postData();
  if (pd && /Kamal|Priya|Arjun|projector/i.test(pd)) bodies.push(`POST-BODY-MATCH ${r.url()}`);
});
page.on('pageerror', (e) => log('PAGEERROR', e.message));
page.on('console', (m) => m.type() === 'error' && log('CONSOLE', m.text().slice(0, 200)));

await page.goto(base);
log('webgpu', await page.evaluate(async () => !!navigator.gpu && !!(await navigator.gpu.requestAdapter())));
await page.fill('textarea', fixture);
await page.getByRole('button', { name: 'Review messages' }).click();
await page.waitForSelector('text=Check the messages');
await page.screenshot({ path: shot('s2'), fullPage: true });
const radios = page.getByRole('radio', { name: /Day\/Month\/Year/ });
if (await radios.count()) await radios.check();
await page.getByText("My name or someone else's isn't in the list").click();
await page.getByLabel('My name').fill(name);
await page.getByLabel(/Other people mentioned/).fill('Arjun, Kamal');
await page.getByRole('button', { name: 'Catch me up' }).click();
log('catch me up clicked');
const dl = page.getByRole('button', { name: 'Download model' });
if (await dl.count()) { log('download needed'); await dl.click(); }
const t0 = Date.now();
await page.waitForSelector('text=/Getting the model ready|Reading your messages/', { timeout: 60000 });
await page.screenshot({ path: shot('s3') });
await page.waitForSelector('h1:has-text("catch-up for")', { timeout: 900000, state: 'attached' }).catch(async () => {
  log('timeout waiting for brief; body:', (await page.innerText('body')).slice(0, 600));
});
log('brief ready after', Math.round((Date.now() - t0) / 1000), 's');
await page.screenshot({ path: shot('s4'), fullPage: true });
log('BRIEF TEXT\n' + (await page.innerText('main')).slice(0, 2500));
log('hosts', [...hosts].join(', '));
log('non-origin non-GET / body matches', JSON.stringify(bodies));
await ctx.close();
